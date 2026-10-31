from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class LatestQuoteOut(BaseModel):
    price: float           # Rs
    prev_close: float      # Rs
    open: float            # Rs
    day_high: float        # Rs
    day_low: float         # Rs
    volume: int
    day_change: float      # Rs
    day_change_pct: float  # %
    week52_high: Optional[float] = None
    week52_low: Optional[float] = None
    return_1m_pct: Optional[float] = None
    return_6m_pct: Optional[float] = None
    return_1y_pct: Optional[float] = None
    avg_volume_20d: Optional[int] = None
    updated_at: datetime

    class Config:
        from_attributes = True

class StockBrief(BaseModel):
    id: int
    symbol: str
    yf_symbol: str
    exchange: str
    company_name: str
    sector: Optional[str] = None
    logo_url: Optional[str] = None
    market_cap: Optional[float] = None  # Rs Cr
    pe_ratio: Optional[float] = None
    dividend_yield: Optional[float] = None
    quote: Optional[LatestQuoteOut] = None
    in_watchlist: Optional[bool] = False

    class Config:
        from_attributes = True

class StockDetail(StockBrief):
    description: Optional[str] = None
    industry: Optional[str] = None

class CandleOut(BaseModel):
    ts: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int

class StockCompareOut(BaseModel):
    symbol: str
    company_name: str
    sector: Optional[str]
    price: float
    day_change_pct: float
    pe_ratio: Optional[float]
    market_cap: Optional[float]
    week52_high: Optional[float]
    week52_low: Optional[float]

class MarketStatusOut(BaseModel):
    is_open: bool
    status_text: str          # 'Market Open' | 'Market Closed' | 'Replay Mode'
    next_open: Optional[str] = None
    next_close: Optional[str] = None
    current_time_ist: str
    replay_mode: bool
    data_delayed_badge: bool

class TickerItem(BaseModel):
    symbol: str
    name: str
    price: float
    day_change: float
    day_change_pct: float
