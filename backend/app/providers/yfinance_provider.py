import math
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any
import yfinance as yf
from app.providers.base import PriceProvider

logger = logging.getLogger(__name__)

class YFinanceProvider(PriceProvider):
    def get_quotes(self, symbols: List[str]) -> Dict[str, Dict[str, Any]]:
        if not symbols:
            return {}
        
        results = {}
        try:
            tickers_str = " ".join(symbols)
            data = yf.download(tickers=tickers_str, period="5d", interval="1d", group_by="ticker", threads=True, progress=False)

            for sym in symbols:
                try:
                    df = data[sym] if len(symbols) > 1 else data
                    df = df.dropna(how="all")
                    if df.empty:
                        continue
                    
                    last_row = df.iloc[-1]
                    prev_row = df.iloc[-2] if len(df) > 1 else last_row

                    close_p = float(last_row["Close"]) if not math.isnan(last_row["Close"]) else 0.0
                    prev_close = float(prev_row["Close"]) if not math.isnan(prev_row["Close"]) else close_p
                    open_p = float(last_row["Open"]) if not math.isnan(last_row["Open"]) else close_p
                    high_p = float(last_row["High"]) if not math.isnan(last_row["High"]) else close_p
                    low_p = float(last_row["Low"]) if not math.isnan(last_row["Low"]) else close_p
                    volume = int(last_row["Volume"]) if not math.isnan(last_row["Volume"]) else 0

                    if close_p <= 0:
                        continue

                    price_paise = int(round(close_p * 100))
                    prev_close_paise = int(round(prev_close * 100))
                    open_paise = int(round(open_p * 100))
                    high_paise = int(round(high_p * 100))
                    low_paise = int(round(low_p * 100))

                    day_change_paise = price_paise - prev_close_paise
                    day_change_pct = (day_change_paise / prev_close_paise * 100.0) if prev_close_paise > 0 else 0.0

                    results[sym] = {
                        "price": price_paise,
                        "prev_close": prev_close_paise,
                        "open": open_paise,
                        "day_high": high_paise,
                        "day_low": low_paise,
                        "volume": volume,
                        "day_change": day_change_paise,
                        "day_change_pct": round(day_change_pct, 2)
                    }
                except Exception as ex:
                    logger.warning(f"Failed parsing quote for {sym}: {ex}")
        except Exception as e:
            logger.error(f"Error in batch yfinance download: {e}")

        return results

    def get_history(self, symbol: str, interval: str = "1d", period: str = "1mo") -> List[Dict[str, Any]]:
        candles = []
        try:
            ticker = yf.Ticker(symbol)
            df = ticker.history(period=period, interval=interval)
            if df.empty:
                return candles
            
            for index, row in df.iterrows():
                try:
                    c_ts = index.to_pydatetime()
                    if c_ts.tzinfo is None:
                        c_ts = c_ts.replace(tzinfo=timezone.utc)
                    else:
                        c_ts = c_ts.astimezone(timezone.utc)
                    
                    o = int(round(float(row["Open"]) * 100))
                    h = int(round(float(row["High"]) * 100))
                    l = int(round(float(row["Low"]) * 100))
                    c = int(round(float(row["Close"]) * 100))
                    v = int(row["Volume"]) if not math.isnan(row["Volume"]) else 0

                    candles.append({
                        "ts": c_ts,
                        "open": o,
                        "high": h,
                        "low": l,
                        "close": c,
                        "volume": v
                    })
                except Exception:
                    continue
        except Exception as e:
            logger.error(f"Error fetching history for {symbol}: {e}")
        return candles

    def get_company_info(self, symbol: str) -> Dict[str, Any]:
        info_data = {}
        try:
            t = yf.Ticker(symbol)
            fast_info = getattr(t, "fast_info", None)
            info = getattr(t, "info", {}) or {}
            
            mcap = getattr(fast_info, "market_cap", None) or info.get("marketCap")
            pe = info.get("trailingPE") or info.get("forwardPE")
            div = info.get("dividendYield")
            h52 = getattr(fast_info, "year_high", None) or info.get("fiftyTwoWeekHigh")
            l52 = getattr(fast_info, "year_low", None) or info.get("fiftyTwoWeekLow")

            info_data = {
                "market_cap": int(mcap) if mcap and not math.isnan(mcap) else None,
                "pe_ratio": round(float(pe), 2) if pe and not math.isnan(pe) else None,
                "dividend_yield": round(float(div) * 100, 2) if div and not math.isnan(div) else None,
                "week52_high": int(round(float(h52) * 100)) if h52 and not math.isnan(h52) else None,
                "week52_low": int(round(float(l52) * 100)) if l52 and not math.isnan(l52) else None,
                "description": info.get("longBusinessSummary")
            }
        except Exception as e:
            logger.warning(f"Could not fetch company info for {symbol}: {e}")
        return info_data
