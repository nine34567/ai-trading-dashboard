# AI Trading Dashboard

AI Trading Dashboard is a React + FastAPI trading operations dashboard designed for systematic trading workflow, risk control, diagnostics, strategy approval, simulated execution, portfolio risk budgeting, observability, backtest research, and deployment readiness.

> Status: Advanced prototype / production-style trading operations console
> Important: This project is not a live trading system yet. Real broker execution must remain disabled until proper backend risk gates, authentication, persistence, broker integration, and paper-trading validation are completed.

---

## Core Stack

- Frontend: React + Vite
- Styling: Inline React styles with dark institutional dashboard theme
- Backend: FastAPI
- Local frontend URL: `http://localhost:5173`
- Local backend URL: `http://localhost:8000`
- Main frontend entry: `src/App.jsx`
- Main backend entry: `backend/main.py`

---

## Project Vision

This dashboard is built to behave like a trading operations command center.

It is designed around the following flow:

```text
Dashboard
→ Backend Health
→ System Diagnostics
→ Alert Center
→ Exposure Guard
→ Kill Switch
→ Trading Session Control
→ Pre-Trade Checklist
→ Live Readiness Gate
→ Strategy Control Room
→ AI Decision Approval Gate
→ Execution Simulation
→ Risk Budget Control
→ Portfolio Exposure Control
→ Observability Console
→ Backtest Lab
→ Deployment Readiness
→ Final System Handoff