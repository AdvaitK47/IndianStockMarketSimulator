import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app

def test_full_simulation():
    with TestClient(app) as client:
        # 1. Health check
        res = client.get('/health')
        assert res.status_code == 200
        assert res.json()['status'] == 'healthy'

        # 2. Market status
        status_res = client.get('/api/market/status')
        assert status_res.status_code == 200
        assert 'is_open' in status_res.json()

        # 3. Stocks list
        stocks_res = client.get('/api/stocks')
        assert stocks_res.status_code == 200
        stocks = stocks_res.json()
        assert len(stocks) > 0
        symbols = [s['symbol'] for s in stocks]
        assert 'RELIANCE' in symbols

        # 4. User signup
        email = f'trader_test_{os.getpid()}@example.com'
        signup_res = client.post('/api/auth/signup', json={
            'name': 'Test Trader',
            'email': email,
            'password': 'password123'
        })
        assert signup_res.status_code == 200
        token = signup_res.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        # 5. Enable replay mode so orders execute anytime
        client.post('/api/admin/replay/start')

        # 6. Place CNC BUY order
        buy_res = client.post('/api/orders', json={
            'symbol': 'RELIANCE',
            'side': 'BUY',
            'product_type': 'CNC',
            'order_type': 'MARKET',
            'quantity': 10
        }, headers=headers)
        assert buy_res.status_code == 200
        assert buy_res.json()['status'] == 'EXECUTED'
        assert buy_res.json()['filled_quantity'] == 10

        # 7. Check Holdings
        hold_res = client.get('/api/portfolio/holdings', headers=headers)
        assert hold_res.status_code == 200
        holdings = hold_res.json()
        assert len(holdings) == 1
        assert holdings[0]['symbol'] == 'RELIANCE'
        assert holdings[0]['quantity'] == 10

        # 8. Check Portfolio summary
        summary_res = client.get('/api/portfolio/summary', headers=headers)
        assert summary_res.status_code == 200
        s_data = summary_res.json()
        assert s_data['holdings_invested'] > 0
        assert s_data['cash_balance'] < 1000000.0

        # 9. Place CNC SELL order
        sell_res = client.post('/api/orders', json={
            'symbol': 'RELIANCE',
            'side': 'SELL',
            'product_type': 'CNC',
            'order_type': 'MARKET',
            'quantity': 4
        }, headers=headers)
        assert sell_res.status_code == 200
        assert sell_res.json()['status'] == 'EXECUTED'

        # Remaining quantity should be 6
        hold_res2 = client.get('/api/portfolio/holdings', headers=headers)
        assert hold_res2.status_code == 200
        assert hold_res2.json()[0]['quantity'] == 6

        # 10. Test Watchlist
        w_add = client.post('/api/watchlist/TCS', headers=headers)
        assert w_add.status_code == 200
        w_list = client.get('/api/watchlist', headers=headers)
        assert w_list.status_code == 200
        assert any(item['stock']['symbol'] == 'TCS' for item in w_list.json())

        # 11. Test Insights
        ins_res = client.get('/api/insights')
        assert ins_res.status_code == 200
        assert 'gainers' in ins_res.json()

        # 12. Account Reset
        reset_res = client.post('/api/account/reset', headers=headers)
        assert reset_res.status_code == 200
        assert reset_res.json()['new_balance'] == 1000000.0

        empty_holdings = client.get('/api/portfolio/holdings', headers=headers).json()
        assert len(empty_holdings) == 0
