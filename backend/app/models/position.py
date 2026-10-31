from datetime import datetime, timezone
from sqlalchemy import Column, Integer, BigInteger, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db import Base

class Position(Base):
    __tablename__ = 'positions'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), index=True, nullable=False)
    stock_id = Column(Integer, ForeignKey('stocks.id', ondelete='CASCADE'), index=True, nullable=False)
    trade_date = Column(String(10), index=True, nullable=False)  # YYYY-MM-DD IST
    
    net_quantity = Column(Integer, default=0, nullable=False)  # positive = long, negative = short
    avg_price = Column(BigInteger, default=0, nullable=False)  # paise
    margin_blocked = Column(BigInteger, default=0, nullable=False)  # paise
    realized_pnl = Column(BigInteger, default=0, nullable=False)  # paise
    is_open = Column(Boolean, default=True, index=True, nullable=False)
    closed_at = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint('user_id', 'stock_id', 'trade_date', name='uix_position_user_stock_date'),
    )

    user = relationship('User', back_populates='positions')
    stock = relationship('Stock', back_populates='positions')
