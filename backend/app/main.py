import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db import engine, Base, SessionLocal
from app.api import api_router
from app.seed.seeder import seed_database
from app.jobs.scheduler import start_scheduler, scheduler

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger('stock-sim')

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info('Initializing Indian Stock Market Simulator Backend...')
    # Create DB tables
    Base.metadata.create_all(bind=engine)
    
    # Seed database
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    # Start background scheduler
    try:
        start_scheduler()
    except Exception as e:
        logger.warning(f'Scheduler could not be started: {e}')

    yield

    # Shutdown
    if scheduler.running:
        scheduler.shutdown(wait=False)
    logger.info('Backend shutdown completed.')

app = FastAPI(
    title='Indian Stock Market Simulator API',
    description='Paper trading engine for NSE with real market data, orders, portfolio & insights',
    version='1.0.0',
    lifespan=lifespan
)

# Setup CORS
allowed_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(',') if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins or ['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Include all API routes under /api
app.include_router(api_router, prefix='/api')

@app.get('/')
def root():
    return {
        'name': 'Indian Stock Market Simulator API',
        'status': 'online',
        'docs': '/docs',
        'version': '1.0.0'
    }

@app.get('/health')
def health():
    return {'status': 'healthy'}
