from fastapi import FastAPI, HTTPException
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

account_settings_data = {
    "balance": "$33.85",
    "dailyPnl": "+$2.95",
    "currentDailyLoss": "$0.00"
}

history_items = [
    {
        "date": "2026-04-23 09:00",
        "area": "BOT",
        "symbol": "SYSTEM",
        "type": "START",
        "pnl": "-",
        "detail": "Bot started."
    },
    {
        "date": "2026-04-22 14:30",
        "area": "BOT",
        "symbol": "OILCash",
        "type": "SELL",
        "pnl": "+1.24",
        "detail": "Example trade record."
    },
    {
        "date": "2026-04-22 10:15",
        "area": "BOT",
        "symbol": "USDJPYmicro",
        "type": "SELL",
        "pnl": "+0.15",
        "detail": "Example trade record."
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


class AccountSettingsPayload(BaseModel):
    balance: str
    dailyPnl: str
    currentDailyLoss: str


def try_parse_money(value):
    cleaned_value = (
        str(value)
        .replace("$", "")
        .replace(",", "")
        .strip()
    )

    try:
        return float(cleaned_value)
    except ValueError:
        return None


def parse_money(value):
    parsed_value = try_parse_money(value)
    return parsed_value if parsed_value is not None else 0.0


def parse_percent(value):
    cleaned_value = str(value).replace("%", "").strip()

    try:
        return float(cleaned_value)
    except ValueError:
        return 0.0


def format_money(value):
    return f"${value:.2f}"


def format_signed_money(value):
    if value >= 0:
        return f"+${value:.2f}"

    return f"-${abs(value):.2f}"


def format_change_detail(old_data, new_data, labels):
    changes = []

    for key, label in labels.items():
        old_value = str(old_data.get(key, "-"))
        new_value = str(new_data.get(key, "-"))

        if old_value != new_value:
            changes.append(f"{label}: {old_value} → {new_value}")

    if len(changes) == 0:
        return "No value changed."

    return "; ".join(changes)


def validate_risk_settings(payload):
    max_daily_loss_amount = parse_money(payload.maxDailyLoss)
    risk_per_trade_percent = parse_percent(payload.riskPerTrade)

    try:
        max_open_positions = int(str(payload.maxOpenPositions).strip())
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Max Open Positions must be a whole number, such as 1, 2, 3, or 5."
        )

    if max_daily_loss_amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Max Daily Loss must be greater than 0, such as $10.00 or 20."
        )

    if risk_per_trade_percent <= 0:
        raise HTTPException(
            status_code=400,
            detail="Risk Per Trade must be greater than 0, such as 0.5% or 1%."
        )

    if risk_per_trade_percent > 100:
        raise HTTPException(
            status_code=400,
            detail="Risk Per Trade should not be greater than 100%."
        )

    if max_open_positions < 1:
        raise HTTPException(
            status_code=400,
            detail="Max Open Positions must be at least 1."
        )

    normalized_risk_settings = {
        "maxDailyLoss": f"${max_daily_loss_amount:.2f}",
        "riskPerTrade": f"{risk_per_trade_percent:g}%",
        "maxOpenPositions": str(max_open_positions)
    }

    return normalized_risk_settings


def validate_account_settings(payload):
    balance_amount = try_parse_money(payload.balance)
    daily_pnl_amount = try_parse_money(payload.dailyPnl)
    current_daily_loss_amount = try_parse_money(payload.currentDailyLoss)

    if balance_amount is None:
        raise HTTPException(
            status_code=400,
            detail="Balance must be a number, such as $33.85 or 1000."
        )

    if daily_pnl_amount is None:
        raise HTTPException(
            status_code=400,
            detail="Daily P&L must be a number, such as +2.95, -5.00, or 0."
        )

    if current_daily_loss_amount is None:
        raise HTTPException(
            status_code=400,
            detail="Current Daily Loss must be a number, such as 0, 2.50, or 10."
        )

    if balance_amount < 0:
        raise HTTPException(
            status_code=400,
            detail="Balance must not be negative."
        )

    if current_daily_loss_amount < 0:
        raise HTTPException(
            status_code=400,
            detail="Current Daily Loss must not be negative. Enter loss as a positive number."
        )

    normalized_account_settings = {
        "balance": format_money(balance_amount),
        "dailyPnl": format_signed_money(daily_pnl_amount),
        "currentDailyLoss": format_money(current_daily_loss_amount)
    }

    return normalized_account_settings


def get_system_mode():
    return "ACTIVE" if bot_status == "RUNNING" else "INACTIVE"


def get_daily_pnl():
    return account_settings_data["dailyPnl"]


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


def add_history_item(action_type, area="SYSTEM", symbol="SYSTEM", pnl="-", detail="-"):
    now = datetime.now().strftime("%Y-%m-%d %H:%M")

    new_item = {
        "date": now,
        "area": area,
        "symbol": symbol,
        "type": action_type,
        "pnl": pnl,
        "detail": detail
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
    current_daily_loss_amount = parse_money(account_settings_data["currentDailyLoss"])

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
        "currentDailyLoss": account_settings_data["currentDailyLoss"],
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
        "balance": account_settings_data["balance"],
        "dailyPnl": get_daily_pnl(),
        "accountSettings": account_settings_data,
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

    add_history_item(
        action_type="START",
        area="BOT",
        symbol="SYSTEM",
        pnl="-",
        detail="Bot status changed to RUNNING."
    )

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

    add_history_item(
        action_type="STOP",
        area="BOT",
        symbol="SYSTEM",
        pnl="-",
        detail="Bot status changed to STOPPED."
    )

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

    add_history_item(
        action_type="EMERGENCY",
        area="RISK",
        symbol="SYSTEM",
        pnl="-",
        detail="Emergency stop activated. Bot status changed to STOPPED."
    )

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

    old_settings_data = settings_data.copy()

    new_settings_data = {
        "symbol": payload.symbol,
        "timeframe": payload.timeframe,
        "mode": payload.mode
    }

    detail = format_change_detail(
        old_data=old_settings_data,
        new_data=new_settings_data,
        labels={
            "symbol": "Symbol",
            "timeframe": "Timeframe",
            "mode": "Mode"
        }
    )

    settings_data = new_settings_data
    last_action = "Settings saved"

    add_history_item(
        action_type="SETTINGS",
        area="BOT",
        symbol=settings_data["symbol"],
        pnl="-",
        detail=detail
    )

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

    old_risk_settings_data = risk_settings_data.copy()
    validated_risk_settings = validate_risk_settings(payload)

    detail = format_change_detail(
        old_data=old_risk_settings_data,
        new_data=validated_risk_settings,
        labels={
            "maxDailyLoss": "Max Daily Loss",
            "riskPerTrade": "Risk Per Trade",
            "maxOpenPositions": "Max Open Positions"
        }
    )

    risk_settings_data = validated_risk_settings
    last_action = "Risk settings saved"

    add_history_item(
        action_type="SETTINGS",
        area="RISK",
        symbol="SYSTEM",
        pnl="-",
        detail=detail
    )

    return {
        "message": "Risk settings saved successfully",
        "riskSettings": risk_settings_data,
        "riskControls": get_risk_controls(),
        "lastAction": last_action,
        "historyItems": history_items
    }


@app.post("/api/account-settings")
def save_account_settings(payload: AccountSettingsPayload):
    global account_settings_data
    global last_action

    old_account_settings_data = account_settings_data.copy()
    validated_account_settings = validate_account_settings(payload)

    detail = format_change_detail(
        old_data=old_account_settings_data,
        new_data=validated_account_settings,
        labels={
            "balance": "Balance",
            "dailyPnl": "Daily P&L",
            "currentDailyLoss": "Current Daily Loss"
        }
    )

    account_settings_data = validated_account_settings
    last_action = "Account settings saved"

    add_history_item(
        action_type="SETTINGS",
        area="ACCOUNT",
        symbol="SYSTEM",
        pnl="-",
        detail=detail
    )

    return {
        "message": "Account settings saved successfully",
        "accountSettings": account_settings_data,
        "riskControls": get_risk_controls(),
        "lastAction": last_action,
        "historyItems": history_items
    }


@app.post("/api/history/clear")
def clear_history():
    global history_items
    global last_action

    history_items = []
    last_action = "History cleared"

    return {
        "message": "History cleared successfully",
        "historyItems": history_items,
        "lastAction": last_action
    }