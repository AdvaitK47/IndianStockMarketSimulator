from datetime import datetime, timezone
from sqlalchemy import Column, Integer, BigInteger, String, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db import Base

class Order(Base):
    __tablename__ = 'orders'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), index=True, nullable=False)
    stock_id = Column(Integer, ForeignKey('stocks.id', ondelete='CASCADE'), index=True, nullable=False)
    
    side = Column(String(10), nullable=False)  # BUY | SELL
    product_type = Column(String(10), nullable=False)  # CNC | MIS
    order_type = Column(String(10), nullable=False)  # MARKET | LIMIT | SL_M
    
    quantity = Column(Integer, nullable=False)
    filled_quantity = Column(Integer, default=0, nullable=False)
    limit_price = Column(BigInteger, nullable=True)  # paise
    trigger_price = Column(BigInteger, nullable=True)  # paise
    validity = Column(String(10), default='DAY', nullable=False)  # DAY | GTT
    
    status = Column(String(20), default='PENDING', index=True, nullable=False)  # PENDING | EXECUTED | CANCELLED | REJECTED | EXPIRED
    reject_reason = Column(String(255), nullable=True)
    blocked_amount = Column(BigInteger, default=0, nullable=False)  # paise
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    executed_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)

    user = relationship('User', back_populates='orders')
    stock = relationship('Stock', back_populates='orders')
    trades = relationship('Trade', back_populates='order')
