import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.order import Order
from app.models.stock import LatestQuote
from app.services.execution_service import execute_order

logger = logging.getLogger(__name__)

def run_order_engine(db: Session):
    pending_orders = db.query(Order).filter(Order.status == 'PENDING').all()
    if not pending_orders:
        return

    for order in pending_orders:
        try:
            quote = db.query(LatestQuote).filter(LatestQuote.stock_id == order.stock_id).first()
            if not quote:
                continue

            cur_price = quote.price
            day_high = quote.day_high
            day_low = quote.day_low

            matched = False
            fill_price = cur_price
            reason = 'LIMIT_HIT'

            if order.order_type == 'LIMIT':
                if order.side == 'BUY' and (cur_price <= order.limit_price or day_low <= order.limit_price):
                    matched = True
                    fill_price = min(order.limit_price, cur_price)
                elif order.side == 'SELL' and (cur_price >= order.limit_price or day_high >= order.limit_price):
                    matched = True
                    fill_price = max(order.limit_price, cur_price)

            elif order.order_type == 'SL_M':
                if order.side == 'SELL' and (cur_price <= order.trigger_price or day_low <= order.trigger_price):
                    matched = True
                    reason = 'SL_HIT'
                    if quote.open < order.trigger_price:
                        fill_price = quote.open
                        reason = 'GAP_FILL'
                    else:
                        fill_price = order.trigger_price

                elif order.side == 'BUY' and (cur_price >= order.trigger_price or day_high >= order.trigger_price):
                    matched = True
                    reason = 'SL_HIT'
                    if quote.open > order.trigger_price:
                        fill_price = quote.open
                        reason = 'GAP_FILL'
                    else:
                        fill_price = order.trigger_price

            if matched:
                logger.info(f'Filling order #{order.id} for {order.stock.symbol} @ Rs {fill_price/100:.2f} ({reason})')
                execute_order(db, order, fill_price=fill_price, reason=reason)
                db.commit()

        except Exception as e:
            db.rollback()
            logger.error(f'Error evaluating order #{order.id}: {e}')
