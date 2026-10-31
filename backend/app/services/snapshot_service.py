import logging
from sqlalchemy.orm import Session
from app.models.account import Account
from app.models.snapshot import PortfolioSnapshot
from app.services.portfolio_service import get_portfolio_summary
from app.services.market_clock import get_ist_now

logger = logging.getLogger(__name__)

def take_daily_snapshots(db: Session):
    accounts = db.query(Account).all()
    today_str = get_ist_now().strftime('%Y-%m-%d')

    for acc in accounts:
        try:
            summary = get_portfolio_summary(db, acc.user_id)
            existing = db.query(PortfolioSnapshot).filter(
                PortfolioSnapshot.user_id == acc.user_id,
                PortfolioSnapshot.date == today_str
            ).first()

            cash_p = int(round(summary.cash_balance * 100))
            holdings_p = int(round(summary.holdings_current_value * 100))
            invested_p = int(round(summary.holdings_invested * 100))
            total_p = int(round(summary.total_equity * 100))
            realized_p = int(round(summary.realized_pnl_total * 100))

            if existing:
                existing.cash = cash_p
                existing.holdings_value = holdings_p
                existing.invested = invested_p
                existing.total_value = total_p
                existing.realized_pnl_total = realized_p
            else:
                db.add(PortfolioSnapshot(
                    user_id=acc.user_id,
                    date=today_str,
                    cash=cash_p,
                    holdings_value=holdings_p,
                    invested=invested_p,
                    total_value=total_p,
                    realized_pnl_total=realized_p
                ))
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f'Failed snapshot for user #{acc.user_id}: {e}')
