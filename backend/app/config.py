import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'),
        env_file_encoding='utf-8',
        extra='ignore'
    )

    JWT_SECRET: str = 'stock-sim-jwt-secret-key-3289047239084723'
    JWT_ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200

    DATABASE_URL: str = 'sqlite:///./stock_sim.db'

    STARTING_CASH_PAISE: int = 100000000  # Rs 10,00,000 (10 Lakhs)
    MIS_MARGIN_PERCENT: int = 20           # 20% margin = 5x leverage
    FLAT_FEE_PAISE: int = 0                # Rs 0 default
    PRICE_REFRESH_SECONDS: int = 60
    ORDER_ENGINE_SECONDS: int = 60

    MARKET_OPEN: str = '09:15'
    MARKET_CLOSE: str = '15:30'
    MIS_SQUARE_OFF_TIME: str = '15:15'
    MIS_CUTOFF_NEW_ORDERS: str = '15:15'

    REPLAY_MODE: bool = False
    REPLAY_SPEED_SECONDS: int = 2
    ALLOWED_ORIGINS: str = 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000'

settings = Settings()
