from typing import List, Dict
from datetime import timezone
from sqlalchemy.orm import Session
from app.models.account import Account
from app.models.holding import Holding
from app.models.position import Position
from app.models.order import Order
from app.models.trade import Trade
from app.services.market_clock import get_ist_now, IST
from app.schemas.portfolio import (
    PortfolioSummaryOut, HoldingOut, PositionOut, SectorAllocationOut
)

def _get_today_cnc_buys(db: Session, user_id: int) -> Dict[int, int]:
    today_ist = get_ist_now().date()
    trades = db.query(Trade).filter(
        Trade.user_id == user_id,
        Trade.side == 'BUY',
        Trade.product_type == 'CNC'
    ).all()
    bought_by_stock: Dict[int, int] = {}
    for t in trades:
        t_dt = t.executed_at
        if t_dt.tzinfo is None:
            t_date = t_dt.replace(tzinfo=timezone.utc).astimezone(IST).date()
        else:
            t_date = t_dt.astimezone(IST).date()
        if t_date == today_ist:
            bought_by_stock[t.stock_id] = bought_by_stock.get(t.stock_id, 0) + t.quantity
    return bought_by_stock

def get_portfolio_summary(db: Session, user_id: int) -> PortfolioSummaryOut:
    account = db.query(Account).filter(Account.user_id == user_id).first()
    if not account:
        raise ValueError('Account not found')

    holdings = db.query(Holding).filter(Holding.user_id == user_id).all()
    open_positions = db.query(Position).filter(Position.user_id == user_id, Position.is_open == True).all()

    pending_orders = db.query(Order).filter(Order.user_id == user_id, Order.status == 'PENDING').all()
    blocked_in_orders = sum(o.blocked_amount for o in pending_orders)

    margin_blocked = sum(p.margin_blocked for p in open_positions)

    holdings_invested = sum(h.quantity * h.avg_buy_price for h in holdings)
    holdings_current_value = 0
    holdings_day_pnl = 0

    today_buys = _get_today_cnc_buys(db, user_id)

    for h in holdings:
        q = h.stock.quote
        cur_p = q.price if q else h.avg_buy_price
        day_chg = q.day_change if q else 0
        holdings_current_value += h.quantity * cur_p

        # For shares bought today: baseline is buy price (cur_p - avg_buy_price)
        # For shares held overnight: baseline is yesterday's close (day_chg)
        qty_today_bought = today_buys.get(h.stock_id, 0)
        qty_today = min(h.quantity, qty_today_bought)
        qty_overnight = max(0, h.quantity - qty_today)

        h_day_pnl = (qty_today * (cur_p - h.avg_buy_price)) + (qty_overnight * day_chg)
        holdings_day_pnl += h_day_pnl

    holdings_unrealized_pnl = holdings_current_value - holdings_invested
    holdings_unrealized_pnl_pct = (holdings_unrealized_pnl / holdings_invested * 100.0) if holdings_invested > 0 else 0.0

    intraday_unrealized = 0
    for p in open_positions:
        q = p.stock.quote
        cur_p = q.price if q else p.avg_price
        intraday_unrealized += (cur_p - p.avg_price) * p.net_quantity

    total_equity = account.cash_balance + blocked_in_orders + margin_blocked + holdings_current_value + intraday_unrealized
    total_pnl = account.realized_pnl_total + holdings_unrealized_pnl + intraday_unrealized
    overall_return_pct = ((total_equity - account.starting_balance) / account.starting_balance * 100.0) if account.starting_balance > 0 else 0.0

    total_day_pnl = holdings_day_pnl + intraday_unrealized

    return PortfolioSummaryOut(
        total_equity=round(total_equity / 100.0, 2),
        cash_balance=round(account.cash_balance / 100.0, 2),
        starting_balance=round(account.starting_balance / 100.0, 2),
        blocked_in_orders=round(blocked_in_orders / 100.0, 2),
        margin_blocked=round(margin_blocked / 100.0, 2),
        holdings_invested=round(holdings_invested / 100.0, 2),
        holdings_current_value=round(holdings_current_value / 100.0, 2),
        holdings_unrealized_pnl=round(holdings_unrealized_pnl / 100.0, 2),
        holdings_unrealized_pnl_pct=round(holdings_unrealized_pnl_pct, 2),
        day_pnl=round(total_day_pnl / 100.0, 2),
        intraday_unrealized_pnl=round(intraday_unrealized / 100.0, 2),
        realized_pnl_total=round(account.realized_pnl_total / 100.0, 2),
        total_pnl=round(total_pnl / 100.0, 2),
        overall_return_pct=round(overall_return_pct, 2)
    )

def get_holdings_list(db: Session, user_id: int) -> List[HoldingOut]:
    holdings = db.query(Holding).filter(Holding.user_id == user_id).all()
    today_buys = _get_today_cnc_buys(db, user_id)
    results = []
    for h in holdings:
        q = h.stock.quote
        cur_p = q.price if q else h.avg_buy_price
        day_c = q.day_change if q else 0
        inv_val = h.quantity * h.avg_buy_price
        cur_val = h.quantity * cur_p
        pnl = cur_val - inv_val
        pnl_pct = (pnl / inv_val * 100.0) if inv_val > 0 else 0.0

        qty_today_bought = today_buys.get(h.stock_id, 0)
        qty_today = min(h.quantity, qty_today_bought)
        qty_overnight = max(0, h.quantity - qty_today)
        h_day_pnl = (qty_today * (cur_p - h.avg_buy_price)) + (qty_overnight * day_c)

        results.append(HoldingOut(
            id=h.id,
            symbol=h.stock.symbol,
            company_name=h.stock.company_name,
            quantity=h.quantity,
            avg_buy_price=round(h.avg_buy_price / 100.0, 2),
            current_price=round(cur_p / 100.0, 2),
            invested_value=round(inv_val / 100.0, 2),
            current_value=round(cur_val / 100.0, 2),
            pnl=round(pnl / 100.0, 2),
            pnl_pct=round(pnl_pct, 2),
            day_change=round(day_c / 100.0, 2),
            day_pnl=round(h_day_pnl / 100.0, 2),
            sector=h.stock.sector
        ))
    return results

def get_positions_list(db: Session, user_id: int) -> List[PositionOut]:
    positions = db.query(Position).filter(Position.user_id == user_id).order_by(Position.id.desc()).all()
    results = []
    for p in positions:
        q = p.stock.quote
        cur_p = q.price if q else p.avg_price
        unrealized = (cur_p - p.avg_price) * p.net_quantity if p.is_open else 0
        total_p = unrealized + p.realized_pnl

        results.append(PositionOut(
            id=p.id,
            symbol=p.stock.symbol,
            company_name=p.stock.company_name,
            trade_date=p.trade_date,
            net_quantity=p.net_quantity,
            avg_price=round(p.avg_price / 100.0, 2),
            current_price=round(cur_p / 100.0, 2),
            margin_blocked=round(p.margin_blocked / 100.0, 2),
            unrealized_pnl=round(unrealized / 100.0, 2),
            realized_pnl=round(p.realized_pnl / 100.0, 2),
            total_pnl=round(total_p / 100.0, 2),
            is_open=p.is_open,
            closed_at=p.closed_at
        ))
    return results

def get_sector_allocation(db: Session, user_id: int) -> List[SectorAllocationOut]:
    holdings = db.query(Holding).filter(Holding.user_id == user_id).all()
    sector_totals: Dict[str, float] = {}
    total_val = 0.0

    for h in holdings:
        q = h.stock.quote
        cur_p = q.price if q else h.avg_buy_price
        val = (h.quantity * cur_p) / 100.0
        sec = h.stock.sector or 'Other'
        sector_totals[sec] = sector_totals.get(sec, 0.0) + val
        total_val += val

    results = []
    for sec, val in sector_totals.items():
        pct = (val / total_val * 100.0) if total_val > 0 else 0.0
        results.append(SectorAllocationOut(sector=sec, value=round(val, 2), percentage=round(pct, 2)))
    return sorted(results, key=lambda x: x.value, reverse=True)
