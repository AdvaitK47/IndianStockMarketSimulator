from sqlalchemy import Column, Integer, String
from app.db import Base

class MarketHoliday(Base):
    __tablename__ = 'market_holidays'

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(10), unique=True, index=True, nullable=False)  # YYYY-MM-DD
    description = Column(String(200), nullable=False)
