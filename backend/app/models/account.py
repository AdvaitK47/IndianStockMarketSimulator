from datetime import datetime, timezone
from sqlalchemy import Column, Integer, BigInteger, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db import Base

class Account(Base):
    __tablename__ = 'accounts'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    cash_balance = Column(BigInteger, nullable=False)  # paise
    starting_balance = Column(BigInteger, nullable=False)  # paise
    realized_pnl_total = Column(BigInteger, default=0, nullable=False)  # paise
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship('User', back_populates='account')
