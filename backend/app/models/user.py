from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.db import Base

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    account = relationship('Account', back_populates='user', uselist=False, cascade='all, delete-orphan')
    orders = relationship('Order', back_populates='user', cascade='all, delete-orphan')
    trades = relationship('Trade', back_populates='user', cascade='all, delete-orphan')
    holdings = relationship('Holding', back_populates='user', cascade='all, delete-orphan')
    positions = relationship('Position', back_populates='user', cascade='all, delete-orphan')
    wallet_transactions = relationship('WalletTransaction', back_populates='user', cascade='all, delete-orphan')
    watchlist_items = relationship('WatchlistItem', back_populates='user', cascade='all, delete-orphan')
    snapshots = relationship('PortfolioSnapshot', back_populates='user', cascade='all, delete-orphan')
