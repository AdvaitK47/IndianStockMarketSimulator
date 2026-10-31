from datetime import datetime, timezone
from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db import Base

class WatchlistItem(Base):
    __tablename__ = 'watchlist_items'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), index=True, nullable=False)
    stock_id = Column(Integer, ForeignKey('stocks.id', ondelete='CASCADE'), index=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint('user_id', 'stock_id', name='uix_watchlist_user_stock'),
    )

    user = relationship('User', back_populates='watchlist_items')
    stock = relationship('Stock', back_populates='watchlist_items')
