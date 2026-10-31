import logging
from datetime import datetime, timezone
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
from app.db import SessionLocal
from app.config import settings
from app.models.stock import Stock, LatestQuote, PriceHistory
from app.providers import get_active_provider
from app.services.market_clock import is_market_open, is_replay_mode
from app.services.order_engine import run_order_engine
from app.services.square_off import square_off_mis_positions
from app.services.snapshot_service import take_daily_snapshots

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler(timezone='Asia/Kolkata')

def job_refresh_quotes():
    db = SessionLocal()
    try:
        if not is_market_open(db):
            return

        is_rep = is_replay_mode(db)
        provider = get_active_provider(is_rep)
        stocks = db.query(Stock).filter(Stock.is_active == True).all()
        yf_symbols = [s.yf_symbol for s in stocks]

        quotes = provider.get_quotes(yf_symbols)
        if not quotes:
            return

        now_utc = datetime.now(timezone.utc)
        for s in stocks:
            q_data = quotes.get(s.yf_symbol)
            if not q_data:
                continue

            quote = s.quote
            if not quote:
                quote = LatestQuote(stock_id=s.id)
                db.add(quote)

            quote.price = q_data['price']
            quote.prev_close = q_data['prev_close']
            quote.open = q_data['open']
            quote.day_high = max(quote.day_high, q_data['day_high']) if quote.day_high else q_data['day_high']
            quote.day_low = min(quote.day_low, q_data['day_low']) if quote.day_low else q_data['day_low']
            quote.volume = q_data['volume']
            quote.day_change = q_data['day_change']
            quote.day_change_pct = q_data['day_change_pct']
            quote.updated_at = now_utc

        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f'Error in job_refresh_quotes: {e}')
    finally:
        db.close()

def job_order_engine():
    db = SessionLocal()
    try:
        if is_market_open(db):
            run_order_engine(db)
    except Exception as e:
        logger.error(f'Error in job_order_engine: {e}')
    finally:
        db.close()

def job_square_off():
    db = SessionLocal()
    try:
        square_off_mis_positions(db)
    except Exception as e:
        logger.error(f'Error in job_square_off: {e}')
    finally:
        db.close()

def job_snapshots():
    db = SessionLocal()
    try:
        take_daily_snapshots(db)
    except Exception as e:
        logger.error(f'Error in job_snapshots: {e}')
    finally:
        db.close()

def start_scheduler():
    # 1. Refresh quotes every PRICE_REFRESH_SECONDS
    scheduler.add_job(
        job_refresh_quotes,
        trigger=IntervalTrigger(seconds=settings.PRICE_REFRESH_SECONDS),
        id='refresh_quotes',
        replace_existing=True
    )

    # 2. Order engine every ORDER_ENGINE_SECONDS
    scheduler.add_job(
        job_order_engine,
        trigger=IntervalTrigger(seconds=settings.ORDER_ENGINE_SECONDS),
        id='order_engine',
        replace_existing=True
    )

    # 3. MIS Auto Square-off at 15:15 IST Mon-Fri
    scheduler.add_job(
        job_square_off,
        trigger=CronTrigger(day_of_week='mon-fri', hour=15, minute=15),
        id='square_off_mis',
        replace_existing=True
    )

    # 4. Daily Snapshot at 15:35 IST Mon-Fri
    scheduler.add_job(
        job_snapshots,
        trigger=CronTrigger(day_of_week='mon-fri', hour=15, minute=35),
        id='daily_snapshot',
        replace_existing=True
    )

    scheduler.start()
    logger.info('Background scheduler started successfully.')
