from pydantic import BaseModel

class ReplayConfig(BaseModel):
    enabled: bool
    speed_seconds: int = 2

class AccountResetResponse(BaseModel):
    message: str
    new_balance: float
