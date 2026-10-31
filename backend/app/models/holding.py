from datetime import datetime, timezone
from sqlalchemy import Column, Integer, BigInteger, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db import Base

class Holding(Base):
    __tablename__ = 'holdings'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), index=True, nullable=False)
    stock_id = Column(Integer, ForeignKey('stocks.id', ondelete='CASCADE'), index=True, nullable=False)
    quantity = Column(Integer, nullable=False)
    avg_buy_price = Column(BigInteger, nullable=False)  # paise
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint('user_id', 'stock_id', name='uix_holding_user_stock'),
    )

    user = relationship('User', back_populates='holdings')
    stock = relationship('Stock', back_populates='holdings')
