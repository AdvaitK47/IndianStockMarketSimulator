from typing import Optional, List
from pydantic import BaseModel

class InsightStock(BaseModel):
    symbol: str
    company_name: str
    sector: Optional[str]
    price: float
    day_change: float
    day_change_pct: float
    volume: int
    avg_volume_20d: Optional[int] = None
    return_pct: Optional[float] = None
    week52_high: Optional[float] = None
    week52_low: Optional[float] = None
    distance_to_52w_high_pct: Optional[float] = None
    trend: str # 'Rising' | 'Declining' | 'Sideways'

class SectorPerfOut(BaseModel):
    sector: str
    avg_change_pct: float
    count: int

class InsightsResponse(BaseModel):
    gainers: List[InsightStock]
    losers: List[InsightStock]
    high_returns: List[InsightStock]
    near_52w: List[InsightStock]
    volume_spikes: List[InsightStock]
    sectors: List[SectorPerfOut]
    disclaimer: str = 'Based on past performance. Not investment advice.'
