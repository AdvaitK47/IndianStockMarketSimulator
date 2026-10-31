from sqlalchemy import Column, Integer, BigInteger, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db import Base

class PortfolioSnapshot(Base):
    __tablename__ = 'portfolio_snapshots'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), index=True, nullable=False)
    date = Column(String(10), index=True, nullable=False)  # YYYY-MM-DD IST
    cash = Column(BigInteger, nullable=False)  # paise
    holdings_value = Column(BigInteger, nullable=False)  # paise
    invested = Column(BigInteger, nullable=False)  # paise
    total_value = Column(BigInteger, nullable=False)  # paise
    realized_pnl_total = Column(BigInteger, default=0, nullable=False)  # paise

    __table_args__ = (
        UniqueConstraint('user_id', 'date', name='uix_snapshot_user_date'),
    )

    user = relationship('User', back_populates='snapshots')
