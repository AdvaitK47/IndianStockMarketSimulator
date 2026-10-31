from datetime import datetime, timezone
from sqlalchemy import Column, Integer, BigInteger, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db import Base

class Trade(Base):
    __tablename__ = 'trades'

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey('orders.id', ondelete='CASCADE'), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), index=True, nullable=False)
    stock_id = Column(Integer, ForeignKey('stocks.id', ondelete='CASCADE'), index=True, nullable=False)
    
    side = Column(String(10), nullable=False)  # BUY | SELL
    product_type = Column(String(10), nullable=False)  # CNC | MIS
    quantity = Column(Integer, nullable=False)
    price = Column(BigInteger, nullable=False)  # paise
    total_value = Column(BigInteger, nullable=False)  # paise
    realized_pnl = Column(BigInteger, nullable=True)  # paise
    reason = Column(String(30), default='USER', nullable=False)  # USER | LIMIT_HIT | SL_HIT | SQUARE_OFF | GAP_FILL
    executed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    order = relationship('Order', back_populates='trades')
    user = relationship('User', back_populates='trades')
    stock = relationship('Stock', back_populates='trades')
