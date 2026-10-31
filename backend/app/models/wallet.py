from datetime import datetime, timezone
from sqlalchemy import Column, Integer, BigInteger, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db import Base

class WalletTransaction(Base):
    __tablename__ = 'wallet_transactions'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), index=True, nullable=False)
    type = Column(String(30), nullable=False)  # INITIAL | BUY | SELL | MARGIN_BLOCK | MARGIN_RELEASE | ORDER_BLOCK | ORDER_RELEASE | PNL_INTRADAY | FEE | RESET
    amount = Column(BigInteger, nullable=False)  # signed paise (negative = money out of cash)
    balance_after = Column(BigInteger, nullable=False)  # paise
    ref_order_id = Column(Integer, nullable=True)
    ref_trade_id = Column(Integer, nullable=True)
    note = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship('User', back_populates='wallet_transactions')
