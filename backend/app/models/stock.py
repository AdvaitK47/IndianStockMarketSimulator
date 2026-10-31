from datetime import datetime, timezone
from sqlalchemy import Column, Integer, BigInteger, Float, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db import Base

class Stock(Base):
    __tablename__ = 'stocks'

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(50), unique=True, index=True, nullable=False)  # RELIANCE
    yf_symbol = Column(String(50), unique=True, index=True, nullable=False)  # RELIANCE.NS
    exchange = Column(String(20), default='NSE', nullable=False)
    company_name = Column(String(150), nullable=False)
    sector = Column(String(100), index=True, nullable=True)
    industry = Column(String(100), nullable=True)
    logo_url = Column(String(500), nullable=True)
    market_cap = Column(BigInteger, nullable=True)  # in Rupees or paise
    pe_ratio = Column(Float, nullable=True)
    dividend_yield = Column(Float, nullable=True)
    description = Column(String(2000), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    quote = relationship('LatestQuote', back_populates='stock', uselist=False, cascade='all, delete-orphan')
    price_history = relationship('PriceHistory', back_populates='stock', cascade='all, delete-orphan')
    orders = relationship('Order', back_populates='stock')
    trades = relationship('Trade', back_populates='stock')
    holdings = relationship('Holding', back_populates='stock')
    positions = relationship('Position', back_populates='stock')
    watchlist_items = relationship('WatchlistItem', back_populates='stock')

class LatestQuote(Base):
    __tablename__ = 'latest_quotes'

    stock_id = Column(Integer, ForeignKey('stocks.id', ondelete='CASCADE'), primary_key=True)
    price = Column(BigInteger, nullable=False)  # LTP in paise
    prev_close = Column(BigInteger, nullable=False)  # paise
    open = Column(BigInteger, nullable=False)  # paise
    day_high = Column(BigInteger, nullable=False)  # paise
    day_low = Column(BigInteger, nullable=False)  # paise
    volume = Column(BigInteger, default=0, nullable=False)
    day_change = Column(BigInteger, default=0, nullable=False)  # paise
    day_change_pct = Column(Float, default=0.0, nullable=False)
    week52_high = Column(BigInteger, nullable=True)  # paise
    week52_low = Column(BigInteger, nullable=True)  # paise
    return_1m_pct = Column(Float, default=0.0, nullable=True)
    return_6m_pct = Column(Float, default=0.0, nullable=True)
    return_1y_pct = Column(Float, default=0.0, nullable=True)
    avg_volume_20d = Column(BigInteger, default=0, nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    stock = relationship('Stock', back_populates='quote')

class PriceHistory(Base):
    __tablename__ = 'price_history'

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey('stocks.id', ondelete='CASCADE'), index=True, nullable=False)
    interval = Column(String(10), index=True, nullable=False)  # '1d' or '1m'
    ts = Column(DateTime, index=True, nullable=False)
    open = Column(BigInteger, nullable=False)  # paise
    high = Column(BigInteger, nullable=False)
    low = Column(BigInteger, nullable=False)
    close = Column(BigInteger, nullable=False)
    volume = Column(BigInteger, default=0, nullable=False)

    __table_args__ = (
        UniqueConstraint('stock_id', 'interval', 'ts', name='uix_stock_interval_ts'),
    )

    stock = relationship('Stock', back_populates='price_history')
