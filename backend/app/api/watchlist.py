from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.stock import Stock
from app.models.watchlist import WatchlistItem
from app.schemas.watchlist import WatchlistItemOut
from app.schemas.stock import StockBrief
from app.api.stocks import quote_to_out

router = APIRouter(prefix='/watchlist', tags=['Watchlist'])

@router.get('', response_model=List[WatchlistItemOut])
def get_watchlist(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    items = db.query(WatchlistItem).filter(WatchlistItem.user_id == current_user.id).all()
    results = []
    for it in items:
        s = it.stock
        q_out = quote_to_out(s.quote) if s.quote else None
        mcap_cr = round(s.market_cap / 10000000.0, 2) if s.market_cap else None
        brief = StockBrief(
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
            in_watchlist=True
        )
        results.append(WatchlistItemOut(id=it.id, stock=brief, created_at=it.created_at))
    return results

@router.post('/{symbol}')
def add_to_watchlist(symbol: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    s = db.query(Stock).filter(Stock.symbol == symbol.upper()).first()
    if not s:
        raise HTTPException(status_code=404, detail='Stock not found')

    existing = db.query(WatchlistItem).filter(
        WatchlistItem.user_id == current_user.id,
        WatchlistItem.stock_id == s.id
    ).first()
    if existing:
        return {'message': 'Already in watchlist', 'in_watchlist': True}

    item = WatchlistItem(user_id=current_user.id, stock_id=s.id, created_at=datetime.now(timezone.utc))
    db.add(item)
    db.commit()
    return {'message': 'Added to watchlist', 'in_watchlist': True}

@router.delete('/{symbol}')
def remove_from_watchlist(symbol: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    s = db.query(Stock).filter(Stock.symbol == symbol.upper()).first()
    if not s:
        raise HTTPException(status_code=404, detail='Stock not found')

    item = db.query(WatchlistItem).filter(
        WatchlistItem.user_id == current_user.id,
        WatchlistItem.stock_id == s.id
    ).first()
    if item:
        db.delete(item)
        db.commit()
    return {'message': 'Removed from watchlist', 'in_watchlist': False}
