import os
import csv
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.models.stock import Stock, LatestQuote, PriceHistory
from app.models.holiday import MarketHoliday
from app.models.app_state import AppState
from app.providers import price_provider

logger = logging.getLogger(__name__)

# Fallback default prices (in paise) if yfinance is offline or ratelimited
DEFAULT_STOCK_PRICES = {
    "ADANIENT": 258475,
    "ADANIGREEN": 130058,
    "ADANIPORTS": 185290,
    "ADANIPOWER": 18944,
    "AMBUJACEM": 58000,
    "APOLLOHOSP": 685000,
    "ASIANPAINT": 230084,
    "AXISBANK": 121607,
    "BAJAJ-AUTO": 995000,
    "BAJAJFINSV": 166293,
    "BAJFINANCE": 93408,
    "BANKBARODA": 23930,
    "BEL": 36940,
    "BERGEPAINT": 48000,
    "BHARTIARTL": 197281,
    "BHEL": 39038,
    "BOSCHLTD": 3320000,
    "BPCL": 28531,
    "BRITANNIA": 463376,
    "CANBK": 11824,
    "CGPOWER": 80700,
    "CHOLAFIN": 158963,
    "CIPLA": 136779,
    "COALINDIA": 39124,
    "COLPAL": 160534,
    "DABUR": 36673,
    "DIVISLAB": 970452,
    "DLF": 69180,
    "DRREDDY": 134592,
    "EICHERMOT": 720941,
    "GAIL": 16644,
    "GODREJCP": 81243,
    "GODREJPROP": 285000,
    "GRASIM": 294601,
    "HAL": 484961,
    "HAVELLS": 101420,
    "HCLTECH": 141495,
    "HDFCBANK": 68657,
    "HDFCLIFE": 52013,
    "HEROMOTOCO": 511481,
    "HINDALCO": 88136,
    "HINDUNILVR": 185766,
    "ICICIBANK": 139117,
    "ICICIGI": 157294,
    "ICICIPRULI": 41184,
    "INDUSINDBK": 84907,
    "INFY": 116440,
    "IOC": 12978,
    "IRCTC": 43887,
    "IRFC": 7414,
    "ITC": 26463,
    "JINDALSTEL": 105994,
    "JIOFIN": 20523,
    "JSWSTEEL": 124549,
    "KOTAKBANK": 45956,
    "LT": 384658,
    "LTIM": 592000,
    "LUPIN": 199806,
    "M&M": 289000,
    "MARICO": 62500,
    "MARUTI": 1138979,
    "MAXHEALTH": 85226,
    "MOTHERSON": 15748,
    "MUTHOOTFIN": 242927,
    "NAUKRI": 117643,
    "NESTLEIND": 117055,
    "NHPC": 7723,
    "NTPC": 31250,
    "ONGC": 22540,
    "PERSISTENT": 595368,
    "PFC": 31639,
    "PIDILITIND": 143661,
    "PNB": 12299,
    "POLYCAB": 655000,
    "POWERGRID": 26181,
    "RECLTD": 28811,
    "RELIANCE": 116441,
    "SBICARD": 69000,
    "SBILIFE": 165039,
    "SBIN": 96442,
    "SHRIRAMFIN": 82842,
    "SIEMENS": 331424,
    "SRF": 233728,
    "SUNPHARMA": 176620,
    "TATACOMM": 182000,
    "TATACONSUM": 102383,
    "TATAELXSI": 378896,
    "TATAMOTORS": 94000,
    "TATAPOWER": 34391,
    "TATASTEEL": 16772,
    "TCS": 249420,
    "TECHM": 177807,
    "TITAN": 442458,
    "TORNTPHARM": 330000,
    "TRENT": 300797,
    "TVSMOTOR": 421976,
    "ULTRACEMCO": 1117500,
    "VBL": 39982,
    "VEDL": 23557,
    "WIPRO": 19407,
    "ZOMATO": 25500,
    "ZYDUSLIFE": 121344,
}

def seed_database(db: Session):
    # 1. Seed stocks
    csv_path = os.path.join(os.path.dirname(__file__), "nifty50.csv")
    if os.path.exists(csv_path):
        with open(csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                existing = db.query(Stock).filter(Stock.symbol == row["symbol"]).first()
                if not existing:
                    stock = Stock(
                        symbol=row["symbol"],
                        yf_symbol=row["yf_symbol"],
                        exchange=row["exchange"],
                        company_name=row["company_name"],
                        sector=row.get("sector"),
                        industry=row.get("industry"),
                        description=row.get("description"),
                        is_active=True
                    )
                    db.add(stock)
        db.commit()

    # 2. Seed initial quotes for stocks that don't have them
    stocks = db.query(Stock).all()
    for s in stocks:
        if not s.quote:
            base_p = DEFAULT_STOCK_PRICES.get(s.symbol, 250000)
            change_p = int(base_p * 0.015)
            q = LatestQuote(
                stock_id=s.id,
                price=base_p,
                prev_close=base_p - change_p,
                open=base_p - int(change_p * 0.5),
                day_high=base_p + int(change_p * 0.8),
                day_low=base_p - change_p,
                volume=1845200,
                day_change=change_p,
                day_change_pct=1.52,
                week52_high=int(base_p * 1.25),
                week52_low=int(base_p * 0.78),
                return_1m_pct=4.8,
                return_6m_pct=14.2,
                return_1y_pct=26.5,
                avg_volume_20d=1540000,
                updated_at=datetime.now(timezone.utc)
            )
            db.add(q)
            
            # Add sample 1d candles for chart if none exist
            count_h = db.query(PriceHistory).filter(PriceHistory.stock_id == s.id).count()
            if count_h == 0:
                now = datetime.now(timezone.utc)
                for day_i in range(30, -1, -1):
                    c_date = now - timedelta(days=day_i)
                    drift = (30 - day_i) * 0.002
                    sim_c = int(base_p * (0.95 + drift))
                    sim_o = int(sim_c * 0.995)
                    sim_h = int(sim_c * 1.01)
                    sim_l = int(sim_c * 0.99)
                    ph = PriceHistory(
                        stock_id=s.id,
                        interval="1d",
                        ts=c_date,
                        open=sim_o,
                        high=sim_h,
                        low=sim_l,
                        close=sim_c,
                        volume=1200000 + (day_i * 25000)
                    )
                    db.add(ph)

    # 3. Seed market holidays
    holidays = [
        ("2026-01-26", "Republic Day"),
        ("2026-03-03", "Holi"),
        ("2026-03-27", "Id-ul-Fitr"),
        ("2026-04-03", "Good Friday"),
        ("2026-04-14", "Dr. Ambedkar Jayanti"),
        ("2026-05-01", "Maharashtra Day"),
        ("2026-08-15", "Independence Day"),
        ("2026-10-02", "Mahatma Gandhi Jayanti"),
        ("2026-10-20", "Dussehra"),
        ("2026-11-08", "Diwali Laxmi Pujan"),
        ("2026-12-25", "Christmas")
    ]
    for h_date, h_name in holidays:
        if not db.query(MarketHoliday).filter(MarketHoliday.date == h_date).first():
            db.add(MarketHoliday(date=h_date, description=h_name))

    # 4. App state default
    if not db.query(AppState).filter(AppState.key == "replay_mode").first():
        db.add(AppState(key="replay_mode", value="false"))

    db.commit()
    logger.info("Database seeding completed.")
