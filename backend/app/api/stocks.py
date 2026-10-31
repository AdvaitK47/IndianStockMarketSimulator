from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.api.deps import get_db, get_optional_current_user
from app.models.user import User
from app.models.stock import Stock, LatestQuote, PriceHistory
from app.models.watchlist import WatchlistItem
from app.schemas.stock import (
    StockBrief, StockDetail, LatestQuoteOut, CandleOut, StockCompareOut,
    MarketStatusOut, TickerItem
)
from app.services.market_clock import is_market_open, is_replay_mode, get_ist_now, get_market_status_details
from app.providers import price_provider

router = APIRouter(tags=['Stocks'])

def quote_to_out(q: LatestQuote) -> LatestQuoteOut:
    return LatestQuoteOut(
        price=round(q.price / 100.0, 2),
        prev_close=round(q.prev_close / 100.0, 2),
        open=round(q.open / 100.0, 2),
        day_high=round(q.day_high / 100.0, 2),
        day_low=round(q.day_low / 100.0, 2),
        volume=q.volume,
        day_change=round(q.day_change / 100.0, 2),
        day_change_pct=round(q.day_change_pct, 2),
        week52_high=round(q.week52_high / 100.0, 2) if q.week52_high else None,
        week52_low=round(q.week52_low / 100.0, 2) if q.week52_low else None,
        return_1m_pct=round(q.return_1m_pct, 2) if q.return_1m_pct is not None else None,
        return_6m_pct=round(q.return_6m_pct, 2) if q.return_6m_pct is not None else None,
        return_1y_pct=round(q.return_1y_pct, 2) if q.return_1y_pct is not None else None,
        avg_volume_20d=q.avg_volume_20d,
        updated_at=q.updated_at
    )

@router.get('/stocks', response_model=List[StockBrief])
def get_stocks(
    search: Optional[str] = None,
    sector: Optional[str] = None,
    sort: Optional[str] = 'symbol',
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_current_user)
):
    query = db.query(Stock).filter(Stock.is_active == True)

    if search:
        search_fmt = f'%{search}%'
        query = query.filter(or_(Stock.symbol.ilike(search_fmt), Stock.company_name.ilike(search_fmt)))

    if sector and sector != 'All':
        query = query.filter(Stock.sector == sector)

    # Get user watchlist IDs
    watchlist_stock_ids = set()
    if user:
        items = db.query(WatchlistItem.stock_id).filter(WatchlistItem.user_id == user.id).all()
        watchlist_stock_ids = {i[0] for i in items}

    stocks = query.all()

    # In-memory sorting for properties like day_change_pct
    if sort == 'change':
        stocks = sorted(stocks, key=lambda s: s.quote.day_change_pct if s.quote else 0.0, reverse=True)
    elif sort == 'price':
        stocks = sorted(stocks, key=lambda s: s.quote.price if s.quote else 0, reverse=True)
    elif sort == 'volume':
        stocks = sorted(stocks, key=lambda s: s.quote.volume if s.quote else 0, reverse=True)
    elif sort == 'market_cap':
        stocks = sorted(stocks, key=lambda s: s.market_cap or 0, reverse=True)

    results = []
    for s in stocks:
        q_out = quote_to_out(s.quote) if s.quote else None
        mcap_cr = round(s.market_cap / 10000000.0, 2) if s.market_cap else None
        results.append(StockBrief(
            id=s.id,
            symbol=s.symbol,
            yf_symbol=s.yf_symbol,
            exchange=s.exchange,
            company_name=s.company_name,
            sector=s.sector,
            logo_url=s.logo_url,
            market_cap=mcap_cr,
            pe_ratio=s.pe_ratio,
            dividend_yield=s.dividend_yield,
            quote=q_out,
            in_watchlist=s.id in watchlist_stock_ids
        ))
    return results

@router.get('/stocks/compare', response_model=List[StockCompareOut])
def compare_stocks(symbols: str = Query('RELIANCE,TCS,INFY,HDFCBANK'), db: Session = Depends(get_db)):
    sym_list = [s.strip().upper() for s in symbols.split(',') if s.strip()]
    stocks = db.query(Stock).filter(Stock.symbol.in_(sym_list)).all()
    results = []
    for s in stocks:
        q = s.quote
        results.append(StockCompareOut(
            symbol=s.symbol,
            company_name=s.company_name,
            sector=s.sector,
            price=round(q.price / 100.0, 2) if q else 0.0,
            day_change_pct=round(q.day_change_pct, 2) if q else 0.0,
            pe_ratio=s.pe_ratio,
            market_cap=round(s.market_cap / 10000000.0, 2) if s.market_cap else None,
            week52_high=round(q.week52_high / 100.0, 2) if q and q.week52_high else None,
            week52_low=round(q.week52_low / 100.0, 2) if q and q.week52_low else None
        ))
    return results


@router.get('/stocks/{symbol}', response_model=StockDetail)
def get_stock_detail(
    symbol: str,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_current_user)
):
    s = db.query(Stock).filter(Stock.symbol == symbol.upper()).first()
    if not s:
        raise HTTPException(status_code=404, detail='Stock not found')

    in_watch = False
    if user:
        in_watch = db.query(WatchlistItem).filter(
            WatchlistItem.user_id == user.id,
            WatchlistItem.stock_id == s.id
        ).first() is not None

    q_out = quote_to_out(s.quote) if s.quote else None
    mcap_cr = round(s.market_cap / 10000000.0, 2) if s.market_cap else None

    return StockDetail(
        id=s.id,
        symbol=s.symbol,
        yf_symbol=s.yf_symbol,
        exchange=s.exchange,
        company_name=s.company_name,
        sector=s.sector,
        industry=s.industry,
        description=s.description,
        logo_url=s.logo_url,
        market_cap=mcap_cr,
        pe_ratio=s.pe_ratio,
        dividend_yield=s.dividend_yield,
        quote=q_out,
        in_watchlist=in_watch
    )

@router.get('/stocks/{symbol}/history', response_model=List[CandleOut])
def get_stock_history(
    symbol: str,
    interval: str = '1d',
    timeframe: str = Query('1M', alias='range'),
    db: Session = Depends(get_db)
):
    import math
    s = db.query(Stock).filter(Stock.symbol == symbol.upper()).first()
    if not s:
        raise HTTPException(status_code=404, detail='Stock not found')

    candles_db = db.query(PriceHistory).filter(
        PriceHistory.stock_id == s.id,
        PriceHistory.interval == '1d'
    ).order_by(PriceHistory.ts.asc()).all()

    now = datetime.now(timezone.utc)
    base_p = (s.quote.price / 100.0) if s.quote else 2500.0
    open_p = (s.quote.open / 100.0) if (s.quote and s.quote.open) else base_p * 0.995

    # 1. 1D Intraday view
    if timeframe.upper() == '1D':
        pts = 25
        res = []
        for i in range(pts):
            t_frac = i / float(pts - 1)
            wave = math.sin(t_frac * math.pi * 3.5) * (base_p * 0.008) + math.cos(t_frac * math.pi * 2.0) * (base_p * 0.004)
            c_price = round(open_p + (base_p - open_p) * t_frac + wave, 2)
            c_high = round(c_price + abs(wave * 0.5) + (base_p * 0.002), 2)
            c_low = round(c_price - abs(wave * 0.5) - (base_p * 0.002), 2)
            c_open = round(c_price - (wave * 0.3), 2)
            c_ts = now - timedelta(minutes=(pts - 1 - i) * 15)
            res.append(CandleOut(
                ts=c_ts,
                open=c_open,
                high=max(c_high, c_open, c_price),
                low=min(c_low, c_open, c_price),
                close=c_price,
                volume=int(45000 + abs(math.sin(i)) * 60000)
            ))
        return res

    # 2. 7D view: return last 7 daily candles
    if timeframe.upper() in ['7D', '1W'] and candles_db and len(candles_db) >= 7:
        selected = candles_db[-7:]
        return [
            CandleOut(
                ts=c.ts,
                open=round(c.open / 100.0, 2),
                high=round(c.high / 100.0, 2),
                low=round(c.low / 100.0, 2),
                close=round(c.close / 100.0, 2),
                volume=c.volume
            )
            for c in selected
        ]

    # 3. 1M view: return real DB candles
    if timeframe.upper() == '1M' and candles_db and len(candles_db) >= 10:
        return [
            CandleOut(
                ts=c.ts,
                open=round(c.open / 100.0, 2),
                high=round(c.high / 100.0, 2),
                low=round(c.low / 100.0, 2),
                close=round(c.close / 100.0, 2),
                volume=c.volume
            )
            for c in candles_db
        ]

    # 4. Multi-month / 6M / YTD / 1Y / 5Y / ALL view
    pts = 60 if timeframe.upper() == '6M' else (52 if timeframe.upper() in ['1Y', 'YTD'] else 70)
    delta = timedelta(days=3) if timeframe.upper() == '6M' else timedelta(weeks=1)
    generated = []
    for i in range(pts, -1, -1):
        c_time = now - (delta * i)
        progress = (pts - i) / float(pts)
        wave = math.sin(progress * math.pi * 4.0) * (base_p * 0.05) + math.cos(progress * math.pi * 2.5) * (base_p * 0.03)
        c_val = round(base_p * (0.86 + progress * 0.14) + wave, 2)
        generated.append(CandleOut(
            ts=c_time,
            open=round(c_val * 0.995, 2),
            high=round(c_val * 1.015, 2),
            low=round(c_val * 0.985, 2),
            close=c_val,
            volume=int(1200000 + abs(math.cos(i)) * 400000)
        ))
    return generated

@router.get('/market/status', response_model=MarketStatusOut)
def get_market_status(db: Session = Depends(get_db)):
    details = get_market_status_details(db)
    return MarketStatusOut(**details)

@router.get('/market/ticker', response_model=List[TickerItem])
def get_market_ticker(db: Session = Depends(get_db)):
    stocks = db.query(Stock).filter(Stock.is_active == True).limit(12).all()
    items = []
    for s in stocks:
        q = s.quote
        if q:
            items.append(TickerItem(
                symbol=s.symbol,
                name=s.company_name,
                price=round(q.price / 100.0, 2),
                day_change=round(q.day_change / 100.0, 2),
                day_change_pct=round(q.day_change_pct, 2)
            ))
    return items
