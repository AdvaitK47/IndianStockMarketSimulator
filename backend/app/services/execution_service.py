import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.config import settings
from app.models.account import Account
from app.models.order import Order
from app.models.trade import Trade
from app.models.holding import Holding
from app.models.position import Position
from app.models.wallet import WalletTransaction
from app.services.market_clock import get_ist_now

logger = logging.getLogger(__name__)

def execute_order(db: Session, order: Order, fill_price: int, reason: str = 'USER') -> Trade:
    account = db.query(Account).filter(Account.user_id == order.user_id).first()
    if not account:
        raise ValueError('User account not found')

    trade_value = order.quantity * fill_price
    user_id = order.user_id
    now_utc = datetime.now(timezone.utc)
    today_ist = get_ist_now().strftime('%Y-%m-%d')
    realized_pnl = None

    if order.product_type == 'CNC':
        if order.side == 'BUY':
            if order.blocked_amount > 0:
                account.cash_balance += order.blocked_amount
                db.add(WalletTransaction(
                    user_id=user_id,
                    type='ORDER_RELEASE',
                    amount=order.blocked_amount,
                    balance_after=account.cash_balance,
                    ref_order_id=order.id,
                    note=f'Release block for order #{order.id}'
                ))
                order.blocked_amount = 0

            if account.cash_balance < trade_value:
                raise ValueError(f'Insufficient funds: required Rs {trade_value/100:.2f}, available Rs {account.cash_balance/100:.2f}')

            account.cash_balance -= trade_value
            db.add(WalletTransaction(
                user_id=user_id,
                type='BUY',
                amount=-trade_value,
                balance_after=account.cash_balance,
                ref_order_id=order.id,
                note=f'Bought {order.quantity} shares of {order.stock.symbol} @ Rs {fill_price/100:.2f}'
            ))

            holding = db.query(Holding).filter(Holding.user_id == user_id, Holding.stock_id == order.stock_id).first()
            if holding:
                new_total_qty = holding.quantity + order.quantity
                new_avg = int(round((holding.quantity * holding.avg_buy_price + trade_value) / new_total_qty))
                holding.quantity = new_total_qty
                holding.avg_buy_price = new_avg
                holding.updated_at = now_utc
            else:
                db.add(Holding(
                    user_id=user_id,
                    stock_id=order.stock_id,
                    quantity=order.quantity,
                    avg_buy_price=fill_price,
                    updated_at=now_utc
                ))

        elif order.side == 'SELL':
            holding = db.query(Holding).filter(Holding.user_id == user_id, Holding.stock_id == order.stock_id).first()
            if not holding or holding.quantity < order.quantity:
                raise ValueError('Insufficient holdings to execute CNC SELL')

            account.cash_balance += trade_value
            realized_pnl = (fill_price - holding.avg_buy_price) * order.quantity
            account.realized_pnl_total += realized_pnl

            db.add(WalletTransaction(
                user_id=user_id,
                type='SELL',
                amount=trade_value,
                balance_after=account.cash_balance,
                ref_order_id=order.id,
                note=f'Sold {order.quantity} shares of {order.stock.symbol} @ Rs {fill_price/100:.2f}'
            ))

            if holding.quantity == order.quantity:
                db.delete(holding)
            else:
                holding.quantity -= order.quantity
                holding.updated_at = now_utc

    elif order.product_type == 'MIS':
        if order.blocked_amount > 0:
            account.cash_balance += order.blocked_amount
            db.add(WalletTransaction(
                user_id=user_id,
                type='ORDER_RELEASE',
                amount=order.blocked_amount,
                balance_after=account.cash_balance,
                ref_order_id=order.id,
                note=f'Release block for MIS order #{order.id}'
            ))
            order.blocked_amount = 0

        position = db.query(Position).filter(
            Position.user_id == user_id,
            Position.stock_id == order.stock_id,
            Position.trade_date == today_ist
        ).first()

        if not position:
            position = Position(
                user_id=user_id,
                stock_id=order.stock_id,
                trade_date=today_ist,
                net_quantity=0,
                avg_price=0,
                margin_blocked=0,
                realized_pnl=0,
                is_open=True
            )
            db.add(position)
            db.flush()

        current_qty = position.net_quantity
        delta_qty = order.quantity if order.side == 'BUY' else -order.quantity

        closing_qty = 0
        opening_qty = 0

        if (current_qty > 0 and delta_qty < 0) or (current_qty < 0 and delta_qty > 0):
            closing_qty = min(abs(current_qty), abs(delta_qty))
            opening_qty = abs(delta_qty) - closing_qty
        else:
            opening_qty = abs(delta_qty)

        if closing_qty > 0:
            if current_qty > 0:
                pnl = (fill_price - position.avg_price) * closing_qty
            else:
                pnl = (position.avg_price - fill_price) * closing_qty

            realized_pnl = pnl
            position.realized_pnl += pnl
            account.realized_pnl_total += pnl

            released_margin = int(round(position.margin_blocked * (closing_qty / abs(current_qty))))
            position.margin_blocked -= released_margin
            account.cash_balance += released_margin + pnl

            db.add(WalletTransaction(
                user_id=user_id,
                type='MARGIN_RELEASE',
                amount=released_margin,
                balance_after=account.cash_balance - pnl,
                ref_order_id=order.id,
                note=f'Released margin for {closing_qty} {order.stock.symbol}'
            ))
            db.add(WalletTransaction(
                user_id=user_id,
                type='PNL_INTRADAY',
                amount=pnl,
                balance_after=account.cash_balance,
                ref_order_id=order.id,
                note=f'Intraday P&L for {order.stock.symbol}: Rs {pnl/100:.2f}'
            ))

        if opening_qty > 0:
            req_margin = int(round(opening_qty * fill_price * (settings.MIS_MARGIN_PERCENT / 100.0)))
            if account.cash_balance < req_margin:
                raise ValueError(f'Insufficient cash for margin: required Rs {req_margin/100:.2f}, available Rs {account.cash_balance/100:.2f}')

            account.cash_balance -= req_margin
            position.margin_blocked += req_margin

            db.add(WalletTransaction(
                user_id=user_id,
                type='MARGIN_BLOCK',
                amount=-req_margin,
                balance_after=account.cash_balance,
                ref_order_id=order.id,
                note=f'Blocked margin for {opening_qty} {order.stock.symbol}'
            ))

            if closing_qty > 0:
                position.avg_price = fill_price
            else:
                old_weight = abs(position.net_quantity) * position.avg_price
                new_weight = opening_qty * fill_price
                position.avg_price = int(round((old_weight + new_weight) / (abs(position.net_quantity) + opening_qty)))

        position.net_quantity += delta_qty
        if position.net_quantity == 0:
            position.is_open = False
            position.closed_at = now_utc
        else:
            position.is_open = True
            position.closed_at = None

    if settings.FLAT_FEE_PAISE > 0:
        account.cash_balance -= settings.FLAT_FEE_PAISE
        db.add(WalletTransaction(
            user_id=user_id,
            type='FEE',
            amount=-settings.FLAT_FEE_PAISE,
            balance_after=account.cash_balance,
            ref_order_id=order.id,
            note=f'Brokerage fee for order #{order.id}'
        ))

    order.status = 'EXECUTED'
    order.filled_quantity = order.quantity
    order.executed_at = now_utc

    trade = Trade(
        order_id=order.id,
        user_id=user_id,
        stock_id=order.stock_id,
        side=order.side,
        product_type=order.product_type,
        quantity=order.quantity,
        price=fill_price,
        total_value=trade_value,
        realized_pnl=realized_pnl,
        reason=reason,
        executed_at=now_utc
    )
    db.add(trade)
    db.flush()
    return trade
