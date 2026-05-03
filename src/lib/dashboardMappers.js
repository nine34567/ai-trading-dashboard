function firstValue(source, keys, fallback = undefined) {
  if (!source || typeof source !== "object") return fallback

  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key]
  }

  return fallback
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function asText(value, fallback = "-") {
  if (value === undefined || value === null || value === "") return fallback
  return String(value)
}

function normalizeTags(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String)
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((tag) => tag.trim()).filter(Boolean)
  }

  return []
}

function normalizeSide(value, fallback = "BUY") {
  const side = String(value || fallback).toUpperCase()
  if (side.includes("SELL")) return "SELL"
  return "BUY"
}

function makePositionId(position, index) {
  return String(
    firstValue(position, ["id", "positionId", "ticket", "orderId", "tradeId"]) ||
      `${asText(firstValue(position, ["symbol"], "POSITION"))}-${asText(firstValue(position, ["type", "side"], "SIDE"))}-${asText(firstValue(position, ["lot", "size", "volume"], "SIZE"))}-${asText(firstValue(position, ["entry", "entryPrice", "openPrice"], "ENTRY"))}-${index}`
  )
}

export function normalizeAlert(alert = {}, index = 0) {
  return {
    ...alert,
    id: asText(firstValue(alert, ["id", "alertId"], `alert-${index}`)),
    symbol: asText(firstValue(alert, ["symbol", "instrument", "pair"], "")),
    title: asText(firstValue(alert, ["title", "type"], "Alert")),
    detail: asText(firstValue(alert, ["detail", "message", "description"], "-")),
    severity: asText(firstValue(alert, ["severity", "tone", "level"], "warning")),
    createdAt: asText(firstValue(alert, ["createdAt", "date", "time"], "-"))
  }
}

export function normalizePosition(position = {}, index = 0) {
  const side = normalizeSide(firstValue(position, ["side", "type", "direction"], "BUY"))

  return {
    ...position,
    id: makePositionId(position, index),
    symbol: asText(firstValue(position, ["symbol", "instrument", "pair"], "POSITION")),
    type: asText(firstValue(position, ["type", "side", "direction"], side)),
    side,
    lot: asText(firstValue(position, ["lot", "size", "volume"], "-")),
    entry: asText(firstValue(position, ["entry", "entryPrice", "openPrice"], "-")),
    current: firstValue(position, ["current", "currentPrice", "price", "marketPrice"], position.current),
    sl: asText(firstValue(position, ["sl", "stopLoss", "stop_loss"], "")),
    tp: asText(firstValue(position, ["tp", "takeProfit", "take_profit"], "")),
    pnl: asText(firstValue(position, ["pnl", "profit", "profitLoss"], "-")),
    note: asText(firstValue(position, ["note", "notes", "comment"], ""), ""),
    tags: normalizeTags(firstValue(position, ["tags", "thesisTags"], [])),
    alerts: asArray(firstValue(position, ["alerts"], [])).map(normalizeAlert)
  }
}

export function normalizeHistoryItem(item = {}, index = 0) {
  return {
    ...item,
    id: asText(firstValue(item, ["id", "eventId"], `history-${index}`)),
    date: asText(firstValue(item, ["date", "createdAt", "timestamp", "time"], "-")),
    area: asText(firstValue(item, ["area", "source", "category"], "SYSTEM")),
    symbol: asText(firstValue(item, ["symbol", "instrument", "pair"], "SYSTEM")),
    type: asText(firstValue(item, ["type", "event", "action"], "ACTIVITY")).toUpperCase(),
    pnl: asText(firstValue(item, ["pnl", "profit"], "-")),
    detail: asText(firstValue(item, ["detail", "message", "description"], "-"))
  }
}

export function normalizeWatchlistItem(item = {}, index = 0) {
  return {
    ...item,
    id: asText(firstValue(item, ["id", "symbol"], `watchlist-${index}`)),
    symbol: asText(firstValue(item, ["symbol", "instrument", "pair"], "-")),
    label: asText(firstValue(item, ["label", "name", "symbol"], "-")),
    price: asText(firstValue(item, ["price", "last", "current"], "-")),
    change: asText(firstValue(item, ["change", "changePercent"], "-"))
  }
}

export function normalizeBotStatus(raw = {}) {
  const botStatus = asText(firstValue(raw, ["botStatus", "status"], "STOPPED")).toUpperCase()

  return {
    botStatus,
    systemMode: asText(firstValue(raw, ["systemMode", "mode"], botStatus === "RUNNING" ? "ACTIVE" : "INACTIVE")),
    lastAction: asText(firstValue(raw, ["lastAction", "last_action"], "No action"))
  }
}

export function normalizeDashboardSummary(raw = {}) {
  return {
    balance: asText(firstValue(raw, ["balance", "accountBalance"], "$0.00")),
    dailyPnl: asText(firstValue(raw, ["dailyPnl", "dailyPnL", "dailyProfit"], "+$0.00")),
    fetchedAt: asText(firstValue(raw, ["fetchedAt", "updatedAt"], new Date().toLocaleTimeString()))
  }
}

export function normalizeRiskControls(raw = {}) {
  return {
    maxDailyLoss: asText(firstValue(raw, ["maxDailyLoss"], "-")),
    currentDailyLoss: asText(firstValue(raw, ["currentDailyLoss"], "-")),
    dailyLossUsagePercent: Number(firstValue(raw, ["dailyLossUsagePercent"], 0)) || 0,
    dailyLossStatus: asText(firstValue(raw, ["dailyLossStatus"], "-")),
    riskPerTrade: asText(firstValue(raw, ["riskPerTrade"], "-")),
    maxOpenPositions: asText(firstValue(raw, ["maxOpenPositions"], "-")),
    currentOpenPositions: firstValue(raw, ["currentOpenPositions"], "-"),
    riskStatus: asText(firstValue(raw, ["riskStatus"], "-"))
  }
}

export function normalizeBackendHealth(raw = {}, snapshot = {}) {
  const status = asText(firstValue(raw, ["status"], snapshot.usingDemoData ? "demo" : "-"))

  return {
    appName: asText(firstValue(raw, ["appName", "service"], "AI Trading Dashboard Backend")),
    version: asText(firstValue(raw, ["version"], "-")),
    environment: asText(firstValue(raw, ["environment"], snapshot.usingDemoData ? "demo" : "-")),
    status,
    message: asText(firstValue(raw, ["message"], "-")),
    serverTime: asText(firstValue(raw, ["serverTime", "time"], new Date().toLocaleString())),
    startedAt: asText(firstValue(raw, ["startedAt"], "-")),
    uptimeSeconds: Number(firstValue(raw, ["uptimeSeconds"], 0)) || 0,
    uptime: asText(firstValue(raw, ["uptime"], "-")),
    botStatus: asText(firstValue(raw, ["botStatus"], snapshot.botStatus || "-")),
    systemMode: asText(firstValue(raw, ["systemMode"], snapshot.systemMode || "-")),
    activeSymbol: asText(firstValue(raw, ["activeSymbol"], snapshot.settings?.symbol || "-")),
    timeframe: asText(firstValue(raw, ["timeframe"], snapshot.settings?.timeframe || "-")),
    mode: asText(firstValue(raw, ["mode"], snapshot.settings?.mode || "-")),
    openPositions: firstValue(raw, ["openPositions"], snapshot.positions?.length || 0),
    historyRecords: firstValue(raw, ["historyRecords"], snapshot.historyItems?.length || 0),
    riskStatus: asText(firstValue(raw, ["riskStatus"], snapshot.riskControls?.riskStatus || "-")),
    dailyLossStatus: asText(firstValue(raw, ["dailyLossStatus"], snapshot.riskControls?.dailyLossStatus || "-"))
  }
}

export function normalizeDashboardSnapshot(raw = {}) {
  const bot = normalizeBotStatus(raw)
  const summary = normalizeDashboardSummary(raw)
  const riskControls = normalizeRiskControls(firstValue(raw, ["riskControls"], {}))
  const positions = asArray(firstValue(raw, ["positions", "openPositions", "activePositions"], [])).map(normalizePosition)
  const historyItems = asArray(firstValue(raw, ["historyItems", "activityItems", "history", "activity"], [])).map(normalizeHistoryItem)
  const alerts = asArray(firstValue(raw, ["alerts", "riskAlerts"], [])).map(normalizeAlert)
  const watchlist = asArray(firstValue(raw, ["watchlist", "symbols"], [])).map(normalizeWatchlistItem)

  const snapshot = {
    ...raw,
    ...bot,
    ...summary,
    accountSettings: {
      balance: summary.balance,
      dailyPnl: summary.dailyPnl,
      currentDailyLoss: riskControls.currentDailyLoss,
      ...(raw.accountSettings || {})
    },
    aiInsights: {
      signal: "HOLD",
      reason: "No data yet",
      confidence: "0%",
      ...(raw.aiInsights || {})
    },
    quantStats: {
      var: "-",
      volatility: "-",
      sharpeRatio: "-",
      ...(raw.quantStats || {})
    },
    aiUsage: {
      apiCalls: "-",
      tokensUsed: "-",
      estimatedCost: "-",
      ...(raw.aiUsage || {})
    },
    settings: {
      symbol: "-",
      timeframe: "-",
      mode: "-",
      ...(raw.settings || {})
    },
    riskSettings: {
      maxDailyLoss: riskControls.maxDailyLoss,
      riskPerTrade: riskControls.riskPerTrade,
      maxOpenPositions: riskControls.maxOpenPositions,
      ...(raw.riskSettings || {})
    },
    backtest: {
      totalTrades: "-",
      winRate: "-",
      netProfit: "-",
      ...(raw.backtest || {})
    },
    riskControls,
    positions,
    historyItems,
    alerts,
    watchlist,
    chartData: asArray(raw.chartData),
    usingDemoData: Boolean(raw.usingDemoData),
    source: raw.usingDemoData ? "demo" : "backend"
  }

  return {
    ...snapshot,
    backendHealth: normalizeBackendHealth(raw.backendHealth || {}, snapshot)
  }
}
