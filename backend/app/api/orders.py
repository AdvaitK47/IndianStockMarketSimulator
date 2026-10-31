from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.order import Order
from app.schemas.order import OrderCreate, OrderOut
from app.services.order_service import place_order, cancel_order

router = APIRouter(prefix='/orders', tags=['Orders'])

def order_to_out(o: Order) -> OrderOut:
    exec_price = None
    realized_pnl = None
    if o.trades:
        latest = o.trades[-1]
        exec_price = round(latest.price / 100.0, 2)
        if latest.realized_pnl is not None:
            realized_pnl = round(latest.realized_pnl / 100.0, 2)

    return OrderOut(
        id=o.id,
        stock_symbol=o.stock.symbol,
        company_name=o.stock.company_name,
        side=o.side,
        product_type=o.product_type,
        order_type=o.order_type,
        quantity=o.quantity,
        filled_quantity=o.filled_quantity,
        limit_price=round(o.limit_price / 100.0, 2) if o.limit_price else None,
        trigger_price=round(o.trigger_price / 100.0, 2) if o.trigger_price else None,
        validity=o.validity,
        status=o.status,
        reject_reason=o.reject_reason,
        blocked_amount=round(o.blocked_amount / 100.0, 2),
        created_at=o.created_at,
        executed_at=o.executed_at,
        execution_price=exec_price,
        realized_pnl=realized_pnl
    )

@router.post('', response_model=OrderOut)
def create_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        order = place_order(db, current_user.id, order_in)
        return order_to_out(order)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get('', response_model=List[OrderOut])
def list_orders(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Order).filter(Order.user_id == current_user.id)
    if status and status != 'ALL':
        query = query.filter(Order.status == status.upper())
    orders = query.order_by(Order.id.desc()).all()
    return [order_to_out(o) for o in orders]

@router.delete('/{order_id}', response_model=OrderOut)
def cancel_existing_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        order = cancel_order(db, current_user.id, order_id)
        return order_to_out(order)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
