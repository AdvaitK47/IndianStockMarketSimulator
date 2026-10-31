# 📈 Indian Stock Market Simulator

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SQLAlchemy](https://img.shields.io/badge/ORM-SQLAlchemy-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![yfinance](https://img.shields.io/badge/Market_Data-Yahoo_Finance-720e9e?style=for-the-badge)](https://pypi.org/project/yfinance/)

> An authentic paper trading simulator for the Indian Stock Market (NSE / NIFTY 50 and beyond). Practice trading stocks with near real-time (15-minute delayed) market prices, genuine volatility, intraday leverage, and realistic brokerage accounting with zero financial risk.



## 🚀 Key Features

### 1. 📊 Authentic Market Quotes (100+ Indian Stocks)
* **Real NSE Tickers**: Trade 100+ top Indian companies across all major sectors:
  * **Information Technology**: TCS, Infosys (INFY), Wipro, HCL Tech, Tech Mahindra, LTIMindtree.
  * **Banking & Finance**: HDFC Bank, ICICI Bank, SBI, Kotak Mahindra, Axis Bank, Bajaj Finance.
  * **Automobile**: Tata Motors, Maruti Suzuki, Mahindra & Mahindra (M&M), Bajaj Auto, TVS Motor.
  * **Energy & Power**: Reliance (RIL), NTPC, Power Grid, Coal India, ONGC, Tata Power, GAIL.
  * **Healthcare, Metals & FMCG**: Sun Pharma, Cipla, Tata Steel, JSW Steel, ITC, Hindustan Unilever (HUL), Asian Paints, Titan.
* **15-Minute Delayed Live Feeds**: Complies with educational paper-trading standards.
* **Background Price Updates**: Background engine (`APScheduler`) continuously updates live quotes every minute without locking or freezing the UI.
* **Interactive Charts**: Clean area charts with multi-timeframe toggles (1D, 7D, 1M, 6M, 1Y, ALL) and key statistical metrics (52W High/Low, Volume, Market Cap).

---

### 2. ⚡ Realistic Order Execution Engine
* **Order Types Supported**:
  * **Market Orders**: Instant execution at current market price.
  * **Limit Orders**: Automatically placed in a pending queue and executed when market LTP crosses your limit price.
  * **Stop-Loss Market (SL-M) Orders**: Trigger-based protection against severe market downturns.
* **Validation & Circuit Limits**: Validates cash balance, prevents overleveraging, and enforces a ±20% circuit filter on limit orders to prevent unrealistic trade values.
* **Execution Receipts & Modals**:
  * **Buy Confirmation**: Displays execution price, shares filled, total cash deducted, and transaction receipt.
  * **Sell Confirmation**: 2-step prompt asking how many shares to sell, previewing estimated P&L, followed by a receipt highlighting exact **Realized Profit / Loss**.

---

### 3. 💼 Dual Product Types (Delivery vs Intraday)
* **Delivery (CNC - Cash and Carry)**:
  * 100% cash required upfront.
  * Shares are added to your permanent **Holdings** portfolio and held indefinitely across trading days.
* **Intraday (MIS - Margin Intraday Square-off)**:
  * **5x Leverage (20% Margin Requirement)**: A ₹10,000 position only blocks ₹2,000 of virtual cash.
  * Monitored live (with delayed quotes) under the **Positions** tab.
  * Features auto square-off rules at 15:15 IST before market close.

---

### 4. 🧮 True Brokerage Math & Portfolio Tracking
Built to match the exact mathematical models of Indian discount brokerages (like **Zerodha Kite** and **Groww**):
* **Accurate Day's P&L Accounting**:
  * *Shares bought today*: Calculated against your actual purchase price (`(LTP - Buy Price) × Qty`).
  * *Shares held overnight*: Calculated against yesterday's official close (`Day Change × Qty`).
* **Portfolio Metrics Overview**:
  * **Total Equity (Net Worth)**: `Available Cash + Holdings Value + Intraday Unrealized P&L`.
  * **Available Cash**: Unencumbered capital ready for deployment.
  * **Realized P&L**: Lifetime profits and losses locked in from closed trades.
  * **Holdings Table**: Displays symbol, logo, shares, average buy price, current LTP, invested value, current value, and live net return.
  * **Positions Table**: Net quantity, average execution price, margin blocked, and live unrealized P&L.
  * **Sector Allocation**: Interactive donut/pie chart displaying portfolio distribution across industry sectors.

---

### 5. ⏰ Market Clock & Replay Engine
* **Market Live Mode**: Active on weekdays from **09:15 AM to 03:30 PM IST** (non-holidays).
* **Automatic Weekend Replay**: On Saturdays and Sundays during market hours (09:15–15:30 IST), the simulator automatically runs in **Replay Mode**, replaying that week's Friday session so you can test and practice over the weekend.
* **24/7 Simulator Control Toggle**: In the **Settings** tab, toggle *Market Replay Mode* ON to simulate an open market 24/7—allowing you to test trades, limit orders, and square-offs at night or outside market hours.
* **Strict Discipline Outside Hours**: When the market is closed and replay mode is off, trading is locked to build real-world market discipline.

---

### 6. 🔐 User Accounts & Virtual Capital
* **Independent Portfolios**: Secure signup & login using hashed passwords (bcrypt) and JWT authentication tokens.
* **₹10,00,000 Virtual Starting Capital**: Every new account starts with ₹10 Lakhs in virtual cash.
* **Reset Account Feature**: One-click reset button in Settings wipes trades, holdings, and positions back to zero and replenishes ₹10,00,000.

---

### 7. 🎨 Premium Modern UI & Authentic Brand Emblems
* **Corporate Brand Emblems**: All 100+ Indian stocks feature official brand styling (emblems and official brand colors) with zero broken or generic icons.
* **Trading Aesthetic**: Bold matte black layout with vibrant emerald green (`#10b981`) for buys/gains and rose red (`#f43f5e`) for sells/losses.
* **Notification Bell**: Tracks order execution receipts and fires an end-of-day summary notification once per day.

---

## 🛠️ Architecture & Tech Stack

```
IndianStockMarketSimulator/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI REST endpoints (auth, stocks, orders, portfolio, market)
│   │   ├── models/          # SQLAlchemy ORM models (User, Holding, Position, Order, Trade, Stock)
│   │   ├── schemas/         # Pydantic request/response validation schemas
│   │   ├── services/        # Business logic (order_service, market_clock, portfolio_service)
│   │   ├── seed/            # Seeder scripts for 100+ Indian stocks
│   │   ├── config.py        # Environment settings & credentials
│   │   ├── db.py            # Database connection & session factory (SQLite / PostgreSQL)
│   │   └── main.py          # FastAPI application entry point
│   └── tests/               # Backend pytest suite
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API client with bearer token interceptor
│   │   ├── components/      # Reusable UI components (CompanyLogo, OrderModal, SellConfirmationModal, Topbar)
│   │   ├── pages/           # Views (Dashboard, StocksScreener, StockDetail, Portfolio, Orders, Settings, Login)
│   │   └── store/           # Zustand state management (auth store, notification store)
│   ├── package.json
│   └── vite.config.ts
├── requirements.txt         # Python dependencies
├── update_indian_stocks.py  # Standalone seeder for 102 Indian NSE stocks
└── README.md
```

### Technologies:
* **Backend**: Python 3.10+, FastAPI, Uvicorn, SQLAlchemy ORM, SQLite (PostgreSQL/Supabase compatible), APScheduler, yfinance, PyJWT, Passlib / bcrypt.
* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts, Zustand, Axios.

---

## 💻 Local Setup & Running Guide

Follow these steps to run the simulator locally on your machine.

### Prerequisites
* **Python**: 3.10 or higher ([Download Python](https://www.python.org/downloads/))
* **Node.js**: 18.0 or higher ([Download Node.js](https://nodejs.org/))
* **Git**: ([Download Git](https://git-scm.com/))

---

### Step 1: Clone the Repository
Open your terminal (PowerShell, Command Prompt, or Bash) and clone the repository:
```bash
git clone https://github.com/AdvaitK47/IndianStockMarketSimulator.git
cd IndianStockMarketSimulator
```

---

### Step 2: Backend Setup

1. **Create and activate a Python virtual environment**:
   * **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   * **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**:
   Copy the example `.env` file:
   * **Windows (PowerShell)**:
     ```powershell
     Copy-Item .env.example .env
     ```
   * **macOS / Linux**:
     ```bash
     cp .env.example .env
     ```

4. **Seed 100+ Indian Stocks**:
   Populate the database with NIFTY 50 and leading Indian companies and initial price quotes:
   ```bash
   python update_indian_stocks.py
   ```

---

### Step 3: Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node packages**:
   ```bash
   npm install
   ```

3. **Return to the root directory**:
   ```bash
   cd ..
   ```

---

### Step 4: Run the Application

You will need **two terminal windows** (one for the backend API and one for the frontend client).

#### Terminal 1 — Start Backend Server:
From the project root directory:
```bash
python -m uvicorn app.main:app --app-dir backend --port 8000 --reload
```
* **API Server**: `http://localhost:8000`
* **Interactive API Docs (Swagger UI)**: `http://localhost:8000/docs`

#### Terminal 2 — Start Frontend Client:
From the project root directory:
```bash
npm --prefix frontend run dev
```
* **Web Application**: `http://localhost:5173`

---

## 🎯 How to Use the Simulator

1. **Register**: Open `http://localhost:5173` and click **Create free virtual account**. Enter your name, email, and password.
2. **Explore Stocks**: Browse 100+ Indian stocks, filter by sectors (IT, Energy, Financials, Auto, etc.), or search by ticker symbol.
3. **Execute Trades**: Click **Trade** on any stock to open the order modal:
   * Choose **BUY** or **SELL**.
   * Choose **Delivery (CNC)** for long-term investments or **Intraday (MIS)** for 5x leveraged margin trading.
   * Choose **Market**, **Limit**, or **Stop-Loss**.
4. **Monitor Your Portfolio**:
   * Head over to **Portfolio** to see your active Holdings, Intraday Positions, and Sector Allocation.
   * Review exact execution prices and profit/loss movements as quotes refresh.
5. **After-Hours & Weekend Testing**:
   * If you are practicing outside market hours (after 03:30 PM IST or on weekends), visit **Settings** and toggle **Market Replay Mode** to `ACTIVE` to trade 24/7!

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Built for educational, training, and paper-trading purposes. Quotes are delayed for paper trading simulation.
