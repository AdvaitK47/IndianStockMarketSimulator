from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class OrderCreate(BaseModel):
    symbol: str
    side: str = Field(..., pattern='^(BUY|SELL)$')
    product_type: str = Field(..., pattern='^(CNC|MIS)$')
    order_type: str = Field(..., pattern='^(MARKET|LIMIT|SL_M)$')
    quantity: int = Field(..., gt=0)
    limit_price: Optional[float] = Field(None, gt=0)   # in Rupees
    trigger_price: Optional[float] = Field(None, gt=0) # in Rupees
    validity: str = Field('DAY', pattern='^(DAY|GTT)$')

class OrderOut(BaseModel):
    id: int
    stock_symbol: str
    company_name: str
    side: str
    product_type: str
    order_type: str
    quantity: int
    filled_quantity: int
    limit_price: Optional[float] = None
    trigger_price: Optional[float] = None
    validity: str
    status: str
    reject_reason: Optional[str] = None
    blocked_amount: float
    created_at: datetime
    executed_at: Optional[datetime] = None
    execution_price: Optional[float] = None
    realized_pnl: Optional[float] = None

    class Config:
        from_attributes = True

class TradeOut(BaseModel):
    id: int
    order_id: int
    stock_symbol: str
    company_name: str
    side: str
    product_type: str
    quantity: int
    price: float
    total_value: float
    realized_pnl: Optional[float] = None
    reason: str
    executed_at: datetime

    class Config:
        from_attributes = True
