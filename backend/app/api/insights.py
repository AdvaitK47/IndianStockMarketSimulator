from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.schemas.insights import InsightsResponse
from app.services.insights_service import get_market_insights

router = APIRouter(prefix='/insights', tags=['Insights'])

@router.get('', response_model=InsightsResponse)
@router.get('/movers', response_model=InsightsResponse)
def insights(db: Session = Depends(get_db)):
    return get_market_insights(db)
