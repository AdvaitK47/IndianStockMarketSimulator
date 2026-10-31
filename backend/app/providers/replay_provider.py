import math
from datetime import datetime, time
from typing import Dict, List, Any
from app.providers.base import PriceProvider
from app.providers.yfinance_provider import YFinanceProvider
from app.services.market_clock import get_ist_now

class ReplayProvider(PriceProvider):
    """
    Simulates / Replays Friday's market session at the current time of day.
    Between 09:15 AM and 03:30 PM (375 minutes), prices progress along
    Friday's actual Open -> Low/High swings -> Close curve with 1-minute updates.
    """
    def __init__(self, fallback: PriceProvider = None):
        self.fallback = fallback or YFinanceProvider()

    def get_quotes(self, symbols: List[str]) -> Dict[str, Any]:
        # Fetch base historical quotes (which hold Friday's final OHLCV)
        base_quotes = self.fallback.get_quotes(symbols)
        if not base_quotes:
            return {}

        now_ist = get_ist_now()
        t = now_ist.time()

        # Calculate progress between 09:15 and 15:30 (375 total trading minutes)
        elapsed_min = (t.hour - 9) * 60 + (t.minute - 15)
        p = max(0.01, min(1.0, elapsed_min / 375.0))

        replayed_quotes = {}
        for sym, q in base_quotes.items():
            try:
                open_p = q.get('open') or q['price']
                close_p = q['price']
                high_p = q.get('day_high') or max(open_p, close_p)
                low_p = q.get('day_low') or min(open_p, close_p)
                prev_close = q.get('prev_close') or open_p
                total_vol = q.get('volume') or 1500000

                # Wave oscillation mimicking intraday liquidity & sentiment swings
                wave = math.sin(p * math.pi * 3.5) * ((high_p - low_p) * 0.28)
                minute_jitter = math.cos(now_ist.minute * 0.4) * (open_p * 0.001)

                curr_p = int(round(open_p + (close_p - open_p) * p + wave + minute_jitter))
                curr_p = max(low_p, min(high_p, curr_p))

                # Volume builds up over the course of the day
                curr_vol = int(total_vol * (0.08 + 0.92 * p))

                day_change = curr_p - prev_close
                day_change_pct = round((day_change / prev_close) * 100.0, 2) if prev_close > 0 else 0.0

                replayed_quotes[sym] = {
                    'price': curr_p,
                    'prev_close': prev_close,
                    'open': open_p,
                    'day_high': max(high_p, curr_p),
                    'day_low': min(low_p, curr_p),
                    'volume': curr_vol,
                    'day_change': day_change,
                    'day_change_pct': day_change_pct
                }
            except Exception:
                replayed_quotes[sym] = q

        return replayed_quotes

    def get_history(self, symbol: str, interval: str = "1d", period: str = "1mo") -> List[Dict[str, Any]]:
        return self.fallback.get_history(symbol, interval, period)

    def get_company_info(self, symbol: str) -> Dict[str, Any]:
        return self.fallback.get_company_info(symbol)