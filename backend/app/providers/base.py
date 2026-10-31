from abc import ABC, abstractmethod
from typing import Dict, List, Any

class PriceProvider(ABC):
    @abstractmethod
    def get_quotes(self, symbols: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Returns dict keyed by yf_symbol with keys:
        price, prev_close, open, day_high, day_low, volume, day_change, day_change_pct
        """
        pass

    @abstractmethod
    def get_history(self, symbol: str, interval: str = "1d", period: str = "1mo") -> List[Dict[str, Any]]:
        """
        Returns list of candle dicts:
        [{ts: datetime, open: paise, high: paise, low: paise, close: paise, volume: int}]
        """
        pass

    @abstractmethod
    def get_company_info(self, symbol: str) -> Dict[str, Any]:
        """
        Returns market_cap, pe_ratio, dividend_yield, week52_high, week52_low, description
        """
        pass
