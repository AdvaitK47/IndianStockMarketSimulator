from app.providers.base import PriceProvider
from app.providers.yfinance_provider import YFinanceProvider
from app.providers.replay_provider import ReplayProvider

price_provider = YFinanceProvider()
replay_provider = ReplayProvider(fallback=price_provider)

def get_active_provider(is_replay: bool = False) -> PriceProvider:
    return replay_provider if is_replay else price_provider
