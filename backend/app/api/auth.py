from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.config import settings
from app.models.user import User
from app.models.account import Account
from app.models.wallet import WalletTransaction
from app.schemas.auth import UserSignup, UserLogin, UserOut, TokenResponse
from app.services.auth_service import hash_password, verify_password, create_access_token

router = APIRouter(prefix='/auth', tags=['Auth'])

def user_to_out(user: User) -> UserOut:
    cash = user.account.cash_balance / 100.0 if user.account else 0.0
    start = user.account.starting_balance / 100.0 if user.account else 0.0
    realized = user.account.realized_pnl_total / 100.0 if user.account else 0.0
    return UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        created_at=user.created_at,
        cash_balance=round(cash, 2),
        starting_balance=round(start, 2),
        realized_pnl_total=round(realized, 2)
    )

@router.post('/signup', response_model=TokenResponse)
def signup(user_in: UserSignup, response: Response, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail='Email already registered')

    hashed = hash_password(user_in.password)
    user = User(name=user_in.name, email=user_in.email, password_hash=hashed)
    db.add(user)
    db.flush()

    # Create account with starting cash
    account = Account(
        user_id=user.id,
        cash_balance=settings.STARTING_CASH_PAISE,
        starting_balance=settings.STARTING_CASH_PAISE,
        realized_pnl_total=0
    )
    db.add(account)
    db.flush()

    # Initial ledger entry
    db.add(WalletTransaction(
        user_id=user.id,
        type='INITIAL',
        amount=settings.STARTING_CASH_PAISE,
        balance_after=settings.STARTING_CASH_PAISE,
        note='Initial virtual wallet deposit'
    ))

    db.commit()
    db.refresh(user)

    token = create_access_token({'sub': str(user.id), 'email': user.email})
    response.set_cookie(key='access_token', value=token, httponly=True, samesite='lax')

    return TokenResponse(
        access_token=token,
        token_type='bearer',
        user=user_to_out(user)
    )

@router.post('/login', response_model=TokenResponse)
def login(login_in: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(status_code=401, detail='Incorrect email or password')

    token = create_access_token({'sub': str(user.id), 'email': user.email})
    response.set_cookie(key='access_token', value=token, httponly=True, samesite='lax')

    return TokenResponse(
        access_token=token,
        token_type='bearer',
        user=user_to_out(user)
    )

@router.post('/logout')
def logout(response: Response):
    response.delete_cookie(key='access_token')
    return {'message': 'Logged out successfully'}

@router.get('/me', response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return user_to_out(current_user)
