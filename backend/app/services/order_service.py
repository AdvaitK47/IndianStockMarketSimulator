from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.config import settings
from app.models.account import Account
from app.models.stock import Stock
from app.models.order import Order
from app.models.holding import Holding
from app.models.position import Position
from app.models.wallet import WalletTransaction
from app.schemas.order import OrderCreate
from app.services.market_clock import is_market_open, is_mis_allowed, is_replay_mode
from app.services.execution_service import execute_order

def place_order(db: Session, user_id: int, order_in: OrderCreate) -> Order:
    stock = db.query(Stock).filter(Stock.symbol == order_in.symbol, Stock.is_active == True).first()
    if not stock:
        raise ValueError(f'Stock {order_in.symbol} not found or inactive')

    if not is_market_open(db):
        raise ValueError('Market is closed. Orders can only be placed during market hours (09:15 - 15:30 IST) or in Replay Mode.')

    if order_in.product_type == 'MIS' and not is_mis_allowed(db):
        raise ValueError('Intraday (MIS) orders are not allowed after 15:15 IST')

    account = db.query(Account).filter(Account.user_id == user_id).first()
    if not account:
        raise ValueError('Account not found')

    quote = stock.quote
    current_price = quote.price if quote else 250000

    limit_paise = int(round(order_in.limit_price * 100)) if order_in.limit_price else None
    trigger_paise = int(round(order_in.trigger_price * 100)) if order_in.trigger_price else None

    if order_in.order_type == 'LIMIT':
        if not limit_paise:
            raise ValueError('Limit price is required for LIMIT orders')
        if abs(limit_paise - current_price) / current_price > 0.20:
            raise ValueError('Limit price cannot exceed 20% of current market price')

    if order_in.order_type == 'SL_M':
        if not trigger_paise:
            raise ValueError('Trigger price is required for Stop-Loss (SL_M) orders')
        if order_in.side == 'SELL' and trigger_paise >= current_price:
            raise ValueError('Trigger price for SELL SL_M must be below current market price')
        if order_in.side == 'BUY' and trigger_paise <= current_price:
            raise ValueError('Trigger price for BUY SL_M must be above current market price')

    if order_in.product_type == 'CNC' and order_in.side == 'SELL':
        holding = db.query(Holding).filter(Holding.user_id == user_id, Holding.stock_id == stock.id).first()
        available_qty = holding.quantity if holding else 0

        pending_sell_qty = db.query(Order).filter(
            Order.user_id == user_id,
            Order.stock_id == stock.id,
            Order.product_type == 'CNC',
            Order.side == 'SELL',
            Order.status == 'PENDING'
        ).count()
        if available_qty - pending_sell_qty < order_in.quantity:
            raise ValueError(f'Insufficient holdings: you have {available_qty} shares, cannot sell {order_in.quantity}')

    est_price = limit_paise if order_in.order_type == 'LIMIT' else current_price
    total_val = order_in.quantity * est_price
    blocked_amount = 0

    if order_in.product_type == 'CNC' and order_in.side == 'BUY':
        if account.cash_balance < total_val:
            raise ValueError(f'Insufficient cash: required Rs {total_val/100:.2f}, available Rs {account.cash_balance/100:.2f}')
        if order_in.order_type in ['LIMIT', 'SL_M']:
            blocked_amount = total_val
            account.cash_balance -= blocked_amount

    elif order_in.product_type == 'MIS':
        req_margin = int(round(total_val * (settings.MIS_MARGIN_PERCENT / 100.0)))
        if account.cash_balance < req_margin:
            raise ValueError(f'Insufficient cash for margin: required Rs {req_margin/100:.2f}, available Rs {account.cash_balance/100:.2f}')
        if order_in.order_type in ['LIMIT', 'SL_M']:
            blocked_amount = req_margin
            account.cash_balance -= blocked_amount

    order = Order(
        user_id=user_id,
        stock_id=stock.id,
        side=order_in.side,
        product_type=order_in.product_type,
        order_type=order_in.order_type,
        quantity=order_in.quantity,
        limit_price=limit_paise,
        trigger_price=trigger_paise,
        validity=order_in.validity,
        status='PENDING',
        blocked_amount=blocked_amount,
        created_at=datetime.now(timezone.utc)
    )
    db.add(order)
    db.flush()

    if blocked_amount > 0:
        db.add(WalletTransaction(
            user_id=user_id,
            type='ORDER_BLOCK',
            amount=-blocked_amount,
            balance_after=account.cash_balance,
            ref_order_id=order.id,
            note=f'Blocked funds for {order_in.order_type} order #{order.id}'
        ))

    should_execute_now = False
    fill_price = current_price

    if order_in.order_type == 'MARKET':
        should_execute_now = True
    elif order_in.order_type == 'LIMIT':
        if order_in.side == 'BUY' and current_price <= limit_paise:
            should_execute_now = True
            fill_price = current_price
        elif order_in.side == 'SELL' and current_price >= limit_paise:
            should_execute_now = True
            fill_price = current_price

    if should_execute_now:
        execute_order(db, order, fill_price=fill_price, reason='USER')

    db.commit()
    db.refresh(order)
    return order

def cancel_order(db: Session, user_id: int, order_id: int) -> Order:
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user_id).first()
    if not order:
        raise ValueError('Order not found')
    if order.status != 'PENDING':
        raise ValueError(f'Cannot cancel order with status {order.status}')

    if order.blocked_amount > 0:
        account = db.query(Account).filter(Account.user_id == user_id).first()
        if account:
            account.cash_balance += order.blocked_amount
            db.add(WalletTransaction(
                user_id=user_id,
                type='ORDER_RELEASE',
                amount=order.blocked_amount,
                balance_after=account.cash_balance,
                ref_order_id=order.id,
                note=f'Released blocked funds on order #{order.id} cancellation'
            ))
        order.blocked_amount = 0

    order.status = 'CANCELLED'
    db.commit()
    db.refresh(order)
    return order
