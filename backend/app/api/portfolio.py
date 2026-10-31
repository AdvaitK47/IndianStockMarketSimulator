from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.trade import Trade
from app.models.wallet import WalletTransaction
from app.models.snapshot import PortfolioSnapshot
from app.schemas.order import TradeOut
from app.schemas.portfolio import (
    PortfolioSummaryOut, HoldingOut, PositionOut, SectorAllocationOut,
    WalletTransactionOut, SnapshotOut
)
from app.services.portfolio_service import (
    get_portfolio_summary, get_holdings_list, get_positions_list, get_sector_allocation
)

router = APIRouter(prefix='/portfolio', tags=['Portfolio'])

@router.get('/summary', response_model=PortfolioSummaryOut)
def summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_portfolio_summary(db, current_user.id)

@router.get('/holdings', response_model=List[HoldingOut])
def holdings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_holdings_list(db, current_user.id)

@router.get('/positions', response_model=List[PositionOut])
def positions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_positions_list(db, current_user.id)

@router.get('/trades', response_model=List[TradeOut])
def trades(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_trades = db.query(Trade).filter(Trade.user_id == current_user.id).order_by(Trade.id.desc()).all()
    return [
        TradeOut(
            id=t.id,
            order_id=t.order_id,
            stock_symbol=t.stock.symbol,
            company_name=t.stock.company_name,
            side=t.side,
            product_type=t.product_type,
            quantity=t.quantity,
            price=round(t.price / 100.0, 2),
            total_value=round(t.total_value / 100.0, 2),
            realized_pnl=round(t.realized_pnl / 100.0, 2) if t.realized_pnl is not None else None,
            reason=t.reason,
            executed_at=t.executed_at
        )
        for t in user_trades
    ]

@router.get('/allocation', response_model=List[SectorAllocationOut])
def allocation(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_sector_allocation(db, current_user.id)

@router.get('/snapshots', response_model=List[SnapshotOut])
def snapshots(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    snaps = db.query(PortfolioSnapshot).filter(PortfolioSnapshot.user_id == current_user.id).order_by(PortfolioSnapshot.date.asc()).all()
    return [
        SnapshotOut(
            date=s.date,
            cash=round(s.cash / 100.0, 2),
            holdings_value=round(s.holdings_value / 100.0, 2),
            invested=round(s.invested / 100.0, 2),
            total_value=round(s.total_value / 100.0, 2),
            realized_pnl_total=round(s.realized_pnl_total / 100.0, 2)
        )
        for s in snaps
    ]

@router.get('/wallet', response_model=List[WalletTransactionOut])
def wallet_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    txs = db.query(WalletTransaction).filter(WalletTransaction.user_id == current_user.id).order_by(WalletTransaction.id.desc()).all()
    return [
        WalletTransactionOut(
            id=t.id,
            type=t.type,
            amount=round(t.amount / 100.0, 2),
            balance_after=round(t.balance_after / 100.0, 2),
            ref_order_id=t.ref_order_id,
            ref_trade_id=t.ref_trade_id,
            note=t.note,
            created_at=t.created_at
        )
        for t in txs
    ]
