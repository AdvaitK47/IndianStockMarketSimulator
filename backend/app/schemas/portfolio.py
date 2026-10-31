from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class HoldingOut(BaseModel):
    id: int
    symbol: str
    company_name: str
    quantity: int
    avg_buy_price: float
    current_price: float
    invested_value: float
    current_value: float
    pnl: float
    pnl_pct: float
    day_change: float
    day_pnl: float
    sector: Optional[str] = None

class PositionOut(BaseModel):
    id: int
    symbol: str
    company_name: str
    trade_date: str
    net_quantity: int
    avg_price: float
    current_price: float
    margin_blocked: float
    unrealized_pnl: float
    realized_pnl: float
    total_pnl: float
    is_open: bool
    closed_at: Optional[datetime] = None

class PortfolioSummaryOut(BaseModel):
    total_equity: float
    cash_balance: float
    starting_balance: float
    blocked_in_orders: float
    margin_blocked: float
    holdings_invested: float
    holdings_current_value: float
    holdings_unrealized_pnl: float
    holdings_unrealized_pnl_pct: float
    day_pnl: float
    intraday_unrealized_pnl: float
    realized_pnl_total: float
    total_pnl: float
    overall_return_pct: float

class SectorAllocationOut(BaseModel):
    sector: str
    value: float
    percentage: float

class WalletTransactionOut(BaseModel):
    id: int
    type: str
    amount: float
    balance_after: float
    ref_order_id: Optional[int] = None
    ref_trade_id: Optional[int] = None
    note: Optional[str] = None
    created_at: datetime

class SnapshotOut(BaseModel):
    date: str
    cash: float
    holdings_value: float
    invested: float
    total_value: float
    realized_pnl_total: float
