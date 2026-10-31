from datetime import datetime, time, timezone, timedelta
from zoneinfo import ZoneInfo
from sqlalchemy.orm import Session
from app.config import settings
from app.models.holiday import MarketHoliday
from app.models.app_state import AppState

IST = ZoneInfo('Asia/Kolkata')
MARKET_OPEN_TIME = time(9, 15)
MARKET_CLOSE_TIME = time(15, 30)
MIS_CUTOFF_TIME = time(15, 15)

def get_ist_now() -> datetime:
    return datetime.now(timezone.utc).astimezone(IST)

def is_within_market_hours(t: time) -> bool:
    return MARKET_OPEN_TIME <= t <= MARKET_CLOSE_TIME

def is_weekend_or_holiday(now_ist: datetime, db: Session = None) -> bool:
    # 5 = Saturday, 6 = Sunday
    if now_ist.weekday() >= 5:
        return True
    if db:
        today_str = now_ist.strftime('%Y-%m-%d')
        holiday = db.query(MarketHoliday).filter(MarketHoliday.date == today_str).first()
        if holiday:
            return True
    return False

def check_replay_state_db(db: Session = None) -> bool | None:
    if db:
        state = db.query(AppState).filter(AppState.key == 'replay_mode').first()
        if state:
            return state.value.lower() == 'true'
    return None

def is_replay_mode(db: Session = None) -> bool:
    """
    Replay Mode is active if:
    1. Explicitly enabled via Simulator Control / Settings (AppState 'replay_mode' == 'true' or settings.REPLAY_MODE == True)
       -> Enables 24/7 simulator trading on weekends and evenings for testing.
    2. Automatically active on weekends (Saturday/Sunday) & market holidays
       during regular market hours (09:15 - 15:30 IST) replaying Friday's market session.
    """
    db_state = check_replay_state_db(db)
    if db_state is True:
        return True
    if db_state is False:
        # If user explicitly disabled replay mode in settings
        return False

    if settings.REPLAY_MODE:
        return True

    now_ist = get_ist_now()
    t = now_ist.time()

    # During market hours on weekend or holiday -> replay Friday
    if is_weekend_or_holiday(now_ist, db):
        return is_within_market_hours(t)

    return False

def is_market_open(db: Session = None) -> bool:
    """
    Market is open for trading if:
    1. Replay mode is active (manual 24/7 simulator toggle OR weekend daytime replay).
    2. Live weekday session during 09:15 - 15:30 IST (non-holiday).
    Outside market hours when replay mode is OFF, market is closed and trading is blocked.
    """
    if is_replay_mode(db):
        return True

    now_ist = get_ist_now()
    t = now_ist.time()

    if not is_weekend_or_holiday(now_ist, db) and is_within_market_hours(t):
        return True

    return False

def is_mis_allowed(db: Session = None) -> bool:
    if not is_market_open(db):
        return False
    # If in simulator replay mode, allow MIS testing anytime
    if is_replay_mode(db):
        return True
    return get_ist_now().time() < MIS_CUTOFF_TIME

def get_market_status_details(db: Session = None) -> dict:
    now_ist = get_ist_now()
    t = now_ist.time()
    time_str = now_ist.strftime('%I:%M %p')
    in_hours = is_within_market_hours(t)
    is_wknd = is_weekend_or_holiday(now_ist, db)
    replay_active = is_replay_mode(db)

    if replay_active:
        # Replay mode is active (either automatic weekend hours or manual simulator toggle)
        status_text = (
            f"Replaying Friday's Market ({time_str} IST)"
            if is_wknd and in_hours
            else f"Replay Mode Active ({time_str} IST)"
        )
        return {
            "is_open": True,
            "replay_mode": True,
            "status_text": status_text,
            "next_open": None,
            "next_close": "15:30 IST" if in_hours else None,
            "current_time_ist": now_ist.strftime('%I:%M:%S %p IST'),
            "data_delayed_badge": True
        }
    elif in_hours and not is_wknd:
        # Live weekday market
        return {
            "is_open": True,
            "replay_mode": False,
            "status_text": "Market Live (15m Delayed)",
            "next_open": None,
            "next_close": "15:30 IST",
            "current_time_ist": now_ist.strftime('%I:%M:%S %p IST'),
            "data_delayed_badge": True
        }
    else:
        # Closed outside 09:15 - 15:30 with replay mode OFF
        if is_wknd:
            next_op = "Replay starts 09:15 IST" if t < MARKET_OPEN_TIME else "Opens Mon 09:15 IST"
        else:
            next_op = "Opens 09:15 IST" if t < MARKET_OPEN_TIME else "Opens tomorrow 09:15 IST"

        return {
            "is_open": False,
            "replay_mode": False,
            "status_text": f"Market Closed ({next_op})",
            "next_open": "09:15 IST",
            "next_close": None,
            "current_time_ist": now_ist.strftime('%I:%M:%S %p IST'),
            "data_delayed_badge": True
        }
