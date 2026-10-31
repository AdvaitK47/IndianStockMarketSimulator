from sqlalchemy import Column, String
from app.db import Base

class AppState(Base):
    __tablename__ = 'app_state'

    key = Column(String(50), primary_key=True)
    value = Column(String(255), nullable=False)
