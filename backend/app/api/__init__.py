from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.stocks import router as stocks_router
from app.api.orders import router as orders_router
from app.api.portfolio import router as portfolio_router
from app.api.watchlist import router as watchlist_router
from app.api.insights import router as insights_router
from app.api.admin import router as admin_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(stocks_router)
api_router.include_router(orders_router)
api_router.include_router(portfolio_router)
api_router.include_router(watchlist_router)
api_router.include_router(insights_router)
api_router.include_router(admin_router)
