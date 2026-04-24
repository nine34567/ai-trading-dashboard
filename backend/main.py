from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

bot_status = "RUNNING"
last_action = "Bot started"

settings_data = {
    "symbol": "OILCash",
    "timeframe": "M15",
    "mode": "Paper Trading"
}

risk_settings_data = {
    "maxDailyLoss": "$10.00",
    "riskPerTrade": "1%",
    "maxOpenPositions": "3"
}

history_items = [
    {
        "date": "2026-04-23 09:00",
        "symbol": "SYSTEM",
        "type": "START",
        "pnl": "-"
    },
    {
        "date": "2026-04-22 14:30",
        "symbol": "OILCash",
        "type": "SELL",
        "pnl": "+1.24"
    },
    {
        "date": "2026-04-22 10:15",
        "symbol": "USDJPYmicro",
        "type": "SELL",
        "pnl": "+0.15"
    }
]


class SettingsPayload(BaseModel):
    symbol: str
    timeframe: str
    mode: str


class RiskSettingsPayload(BaseModel):
    maxDailyLoss: str
    riskPerTrade: str
    maxOpenPositions: str


def parse_money(value):
    cleaned_value = str(value).replace("$", "").replace(",", "")
    try:
        return float(cleaned_value)
    except ValueError:
        return 0.0


def get_system_mode():
    return "ACTIVE" if bot_status == "RUNNING" else "INACTIVE"


def get_daily_pnl():
    return "+$2.95" if bot_status == "RUNNING" else "+$0.00"


def get_positions():
    if bot_status == "RUNNING":
        return [
            {
                "symbol": settings_data["symbol"],
                "type": "SELL",
                "lot": "0.01",
                "entry": "84.51",
                "sl": "86.00",
                "tp": "82.00",
                "pnl": "+1.24"
            },
            {
                "symbol": "USDJPYmicro",
                "type": "SELL",
                "lot": "0.1",
                "entry": "158.08",
                "sl": "158.46",
                "tp": "157.75",
                "pnl": "+0.15"
            }
        ]

    return []


def add_history_item(action_type, pnl="-"):
    now = datetime.now().strftime("%Y-%m-%d %H:%M")

    new_item = {
        "date": now,
        "symbol": "SYSTEM",
        "type": action_type,
        "pnl": pnl
    }

    history_items.insert(0, new_item)


def get_chart_data():
    symbol = settings_data["symbol"].upper()

    if "XAU" in symbol:
        prices = [2328.5, 2330.2, 2329.4, 2332.1, 2335.6, 2334.8, 2338.2, 2340.1]
    elif "JPY" in symbol:
        prices = [158.08, 158.12, 158.05, 157.98, 158.20, 158.14, 158.30, 158.25]
    else:
        prices = [84.10, 84.35, 84.20, 84.70, 84.55, 85.05, 84.90, 85.30]

    times = ["09:00", "09:15", "09:30", "09:45", "10:00", "10:15", "10:30", "10:45"]

    return [
        {
            "time": times[index],
            "price": prices[index]
        }
        for index in range(len(prices))
    ]


def get_risk_controls():
    positions = get_positions()

    max_daily_loss_amount = parse_money(risk_settings_data["maxDailyLoss"])
    current_daily_loss_amount = 0.00

    daily_loss_usage_percent = (
        (current_daily_loss_amount / max_daily_loss_amount) * 100
        if max_daily_loss_amount > 0
        else 0
    )

    daily_loss_status = (
        "BREACHED"
        if max_daily_loss_amount > 0 and current_daily_loss_amount >= max_daily_loss_amount
        else "OK"
    )

    return {
        "maxDailyLoss": risk_settings_data["maxDailyLoss"],
        "currentDailyLoss": f"${current_daily_loss_amount:.2f}",
        "dailyLossUsagePercent": round(daily_loss_usage_percent, 2),
        "dailyLossStatus": daily_loss_status,
        "riskPerTrade": risk_settings_data["riskPerTrade"],
        "maxOpenPositions": risk_settings_data["maxOpenPositions"],
        "currentOpenPositions": len(positions),
        "riskStatus": "OK" if bot_status == "RUNNING" else "PAUSED"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "backend connected"
    }


@app.get("/api/dashboard")
def get_dashboard_data():
    return {
        "botStatus": bot_status,
        "systemMode": get_system_mode(),
        "lastAction": last_action,
        "balance": "$33.85",
        "dailyPnl": get_daily_pnl(),
        "aiInsights": {
            "signal": "HOLD",
            "reason": "Market is extended, waiting for better entry",
            "confidence": "74%"
        },
        "quantStats": {
            "var": "-2.4%",
            "volatility": "18.2%",
            "sharpeRatio": "1.42"
        },
        "aiUsage": {
            "apiCalls": "128",
            "tokensUsed": "54,320",
            "estimatedCost": "$3.42"
        },
        "settings": settings_data,
        "riskSettings": risk_settings_data,
        "backtest": {
            "totalTrades": "128",
            "winRate": "61%",
            "netProfit": "+$1,248"
        },
        "riskControls": get_risk_controls(),
        "positions": get_positions(),
        "chartData": get_chart_data(),
        "historyItems": history_items,
        "fetchedAt": datetime.now().strftime("%H:%M:%S")
    }


@app.post("/api/bot/start")
def start_bot():
    global bot_status
    global last_action

    bot_status = "RUNNING"
    last_action = "Bot started"
    add_history_item("START")

    return {
        "botStatus": bot_status,
        "systemMode": get_system_mode(),
        "lastAction": last_action,
        "dailyPnl": get_daily_pnl(),
        "positions": get_positions(),
        "historyItems": history_items
    }


@app.post("/api/bot/stop")
def stop_bot():
    global bot_status
    global last_action

    bot_status = "STOPPED"
    last_action = "Bot stopped"
    add_history_item("STOP")

    return {
        "botStatus": bot_status,
        "systemMode": get_system_mode(),
        "lastAction": last_action,
        "dailyPnl": get_daily_pnl(),
        "positions": get_positions(),
        "historyItems": history_items
    }


@app.post("/api/bot/emergency-stop")
def emergency_stop_bot():
    global bot_status
    global last_action

    bot_status = "STOPPED"
    last_action = "Emergency stop activated"
    add_history_item("EMERGENCY")

    return {
        "botStatus": bot_status,
        "systemMode": get_system_mode(),
        "lastAction": last_action,
        "dailyPnl": get_daily_pnl(),
        "positions": get_positions(),
        "historyItems": history_items
    }


@app.post("/api/settings")
def save_settings(payload: SettingsPayload):
    global settings_data
    global last_action

    settings_data = {
        "symbol": payload.symbol,
        "timeframe": payload.timeframe,
        "mode": payload.mode
    }

    last_action = "Settings saved"
    add_history_item("SETTINGS")

    return {
        "message": "Settings saved successfully",
        "settings": settings_data,
        "lastAction": last_action,
        "historyItems": history_items
    }


@app.post("/api/risk-settings")
def save_risk_settings(payload: RiskSettingsPayload):
    global risk_settings_data
    global last_action

    risk_settings_data = {
        "maxDailyLoss": payload.maxDailyLoss,
        "riskPerTrade": payload.riskPerTrade,
        "maxOpenPositions": payload.maxOpenPositions
    }

    last_action = "Risk settings saved"
    add_history_item("RISK SETTINGS")

    return {
        "message": "Risk settings saved successfully",
        "riskSettings": risk_settings_data,
        "riskControls": get_risk_controls(),
        "lastAction": last_action,
        "historyItems": history_items
    }