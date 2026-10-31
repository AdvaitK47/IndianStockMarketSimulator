from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.config import settings
from app.models.user import User
from app.models.account import Account
from app.models.order import Order
from app.models.trade import Trade
from app.models.holding import Holding
from app.models.position import Position
from app.models.wallet import WalletTransaction
from app.models.snapshot import PortfolioSnapshot
from app.models.app_state import AppState
from app.schemas.admin import AccountResetResponse

router = APIRouter(tags=['Admin'])

@router.post('/admin/replay/start')
def start_replay(db: Session = Depends(get_db)):
    state = db.query(AppState).filter(AppState.key == 'replay_mode').first()
    if not state:
        state = AppState(key='replay_mode', value='true')
        db.add(state)
    else:
        state.value = 'true'
    db.commit()
    return {'message': 'Replay mode enabled', 'replay_mode': True}

@router.post('/admin/replay/stop')
def stop_replay(db: Session = Depends(get_db)):
    state = db.query(AppState).filter(AppState.key == 'replay_mode').first()
    if state:
        state.value = 'false'
        db.commit()
    return {'message': 'Replay mode disabled', 'replay_mode': False}

@router.post('/account/reset', response_model=AccountResetResponse)
def reset_user_account(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    uid = current_user.id
    db.query(Trade).filter(Trade.user_id == uid).delete()
    db.query(Order).filter(Order.user_id == uid).delete()
    db.query(Holding).filter(Holding.user_id == uid).delete()
    db.query(Position).filter(Position.user_id == uid).delete()
    db.query(WalletTransaction).filter(WalletTransaction.user_id == uid).delete()
    db.query(PortfolioSnapshot).filter(PortfolioSnapshot.user_id == uid).delete()

    acc = db.query(Account).filter(Account.user_id == uid).first()
    if acc:
        acc.cash_balance = settings.STARTING_CASH_PAISE
        acc.realized_pnl_total = 0

    db.add(WalletTransaction(
        user_id=uid,
        type='RESET',
        amount=settings.STARTING_CASH_PAISE,
        balance_after=settings.STARTING_CASH_PAISE,
        note='Account reset to initial virtual capital'
    ))

    db.commit()
    return AccountResetResponse(
        message='Account has been successfully reset.',
        new_balance=round(settings.STARTING_CASH_PAISE / 100.0, 2)
    )
