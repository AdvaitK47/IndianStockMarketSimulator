from typing import List
from sqlalchemy.orm import Session
from app.models.stock import Stock
from app.schemas.insights import InsightStock, SectorPerfOut, InsightsResponse

def get_market_insights(db: Session) -> InsightsResponse:
    stocks = db.query(Stock).filter(Stock.is_active == True).all()

    items: List[InsightStock] = []
    sector_changes: dict = {}
    sector_counts: dict = {}

    for s in stocks:
        q = s.quote
        if not q:
            continue
        
        trend = 'Sideways'
        if q.day_change_pct > 1.0 and (q.return_1m_pct or 0) > 0:
            trend = 'Rising'
        elif q.day_change_pct < -1.0 and (q.return_1m_pct or 0) < 0:
            trend = 'Declining'

        dist_52w = None
        if q.week52_high and q.week52_high > 0:
            dist_52w = round((q.week52_high - q.price) / q.week52_high * 100.0, 2)

        item = InsightStock(
            symbol=s.symbol,
            company_name=s.company_name,
            sector=s.sector,
            price=round(q.price / 100.0, 2),
            day_change=round(q.day_change / 100.0, 2),
            day_change_pct=round(q.day_change_pct, 2),
            volume=q.volume,
            avg_volume_20d=q.avg_volume_20d,
            return_pct=q.return_1y_pct or q.return_6m_pct or q.return_1m_pct or 0.0,
            week52_high=round(q.week52_high / 100.0, 2) if q.week52_high else None,
            week52_low=round(q.week52_low / 100.0, 2) if q.week52_low else None,
            distance_to_52w_high_pct=dist_52w,
            trend=trend
        )
        items.append(item)

        sec = s.sector or 'Other'
        sector_changes[sec] = sector_changes.get(sec, 0.0) + q.day_change_pct
        sector_counts[sec] = sector_counts.get(sec, 0) + 1

    gainers = sorted(items, key=lambda x: x.day_change_pct, reverse=True)[:10]
    losers = sorted(items, key=lambda x: x.day_change_pct)[:10]
    high_returns = sorted(items, key=lambda x: x.return_pct or 0.0, reverse=True)[:10]
    near_52w = sorted([i for i in items if i.distance_to_52w_high_pct is not None and i.distance_to_52w_high_pct <= 5.0], key=lambda x: x.distance_to_52w_high_pct)[:10]
    volume_spikes = sorted([i for i in items if i.avg_volume_20d and i.volume > (1.5 * i.avg_volume_20d)], key=lambda x: x.volume, reverse=True)[:10]

    sectors_out = []
    for sec, tot_pct in sector_changes.items():
        cnt = sector_counts[sec]
        avg_pct = tot_pct / cnt if cnt > 0 else 0.0
        sectors_out.append(SectorPerfOut(sector=sec, avg_change_pct=round(avg_pct, 2), count=cnt))

    sectors_out = sorted(sectors_out, key=lambda x: x.avg_change_pct, reverse=True)

    return InsightsResponse(
        gainers=gainers,
        losers=losers,
        high_returns=high_returns,
        near_52w=near_52w,
        volume_spikes=volume_spikes,
        sectors=sectors_out
    )
