from datetime import datetime
from pydantic import BaseModel
from app.schemas.stock import StockBrief

class WatchlistItemOut(BaseModel):
    id: int
    stock: StockBrief
    created_at: datetime
