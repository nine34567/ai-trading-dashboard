const API_BASE_URL = "http://localhost:8000"
const MOCK_STORAGE_KEY = "ai-trading-dashboard-mock-state"

const isBrowser = typeof window !== "undefined"

const USE_MOCK_API =
  isBrowser &&
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1"

const defaultMockState = {
  botStatus: "RUNNING",
  lastAction: "Bot started",
  settingsData: {
    symbol: "OILCash",
    timeframe: "M15",
    mode: "Paper Trading"
  },
  riskSettingsData: {
    maxDailyLoss: "$10.00",
    riskPerTrade: "1%",
    maxOpenPositions: "3"
  },
  accountSettingsData: {
    balance: "$33.85",
    dailyPnl: "+$2.95",
    currentDailyLoss: "$0.00"
  },
  historyItems: [
    {
      date: "2026-04-23 09:00",
      symbol: "SYSTEM",
      type: "START",
      pnl: "-",
      detail: "Bot started."
    },
    {
      date: "2026-04-22 14:30",
      symbol: "OILCash",
      type: "SELL",
      pnl: "+1.24",
      detail: "Example trade record."
    },
    {
      date: "2026-04-22 10:15",
      symbol: "USDJPYmicro",
      type: "SELL",
      pnl: "+0.15",
      detail: "Example trade record."
    }
  ]
}

function cloneData(data) {
  return JSON.parse(JSON.stringify(data))
}

function mockResolve(data) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(cloneData(data)), 150)
  })
}

function readMockState() {
  if (!isBrowser) return cloneData(defaultMockState)

  try {
    const savedState = window.localStorage.getItem(MOCK_STORAGE_KEY)

    if (!savedState) {
      const freshState = cloneData(defaultMockState)
      window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(freshState))
      return freshState
    }

    const parsedState = JSON.parse(savedState)

    return {
      ...defaultMockState,
      ...parsedState,
      settingsData: {
        ...defaultMockState.settingsData,
        ...(parsedState.settingsData || {})
      },
      riskSettingsData: {
        ...defaultMockState.riskSettingsData,
        ...(parsedState.riskSettingsData || {})
      },
      accountSettingsData: {
        ...defaultMockState.accountSettingsData,
        ...(parsedState.accountSettingsData || {})
      },
      historyItems: Array.isArray(parsedState.historyItems)
        ? parsedState.historyItems
        : defaultMockState.historyItems
    }
  } catch {
    return cloneData(defaultMockState)
  }
}

function saveMockState(state) {
  if (!isBrowser) return
  window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(state))
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || `Request failed: ${response.status}`)
  }

  return data
}

function tryParseMoney(value) {
  const cleanedValue = String(value)
    .replace("$", "")
    .replace(",", "")
    .trim()

  const parsedValue = Number(cleanedValue)

  if (Number.isNaN(parsedValue)) return null

  return parsedValue
}

function parseMoney(value) {
  const parsedValue = tryParseMoney(value)
  return parsedValue === null ? 0 : parsedValue
}

function parsePercent(value) {
  const cleanedValue = String(value).replace("%", "").trim()
  const parsedValue = Number(cleanedValue)

  if (Number.isNaN(parsedValue)) return 0

  return parsedValue
}

function formatMoney(value) {
  return `$${value.toFixed(2)}`
}

function formatSignedMoney(value) {
  if (value >= 0) return `+$${value.toFixed(2)}`
  return `-$${Math.abs(value).toFixed(2)}`
}

function formatChangeDetail(oldData, newData, labels) {
  const changes = []

  Object.entries(labels).forEach(([key, label]) => {
    const oldValue = String(oldData[key] ?? "-")
    const newValue = String(newData[key] ?? "-")

    if (oldValue !== newValue) {
      changes.push(`${label}: ${oldValue} → ${newValue}`)
    }
  })

  if (changes.length === 0) return "No value changed."

  return changes.join("; ")
}

function getCurrentDateTime() {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const hour = String(now.getHours()).padStart(2, "0")
  const minute = String(now.getMinutes()).padStart(2, "0")

  return `${year}-${month}-${day} ${hour}:${minute}`
}

function addMockHistoryItem(state, actionType, symbol = "SYSTEM", pnl = "-", detail = "-") {
  state.historyItems.unshift({
    date: getCurrentDateTime(),
    symbol,
    type: actionType,
    pnl,
    detail
  })
}

function validateMockRiskSettings(payload) {
  const maxDailyLossAmount = parseMoney(payload.maxDailyLoss)
  const riskPerTradePercent = parsePercent(payload.riskPerTrade)
  const maxOpenPositions = Number.parseInt(String(payload.maxOpenPositions).trim(), 10)

  if (maxDailyLossAmount <= 0) {
    throw new Error("Max Daily Loss must be greater than 0, such as $10.00 or 20.")
  }

  if (riskPerTradePercent <= 0) {
    throw new Error("Risk Per Trade must be greater than 0, such as 0.5% or 1%.")
  }

  if (riskPerTradePercent > 100) {
    throw new Error("Risk Per Trade should not be greater than 100%.")
  }

  if (Number.isNaN(maxOpenPositions) || maxOpenPositions < 1) {
    throw new Error("Max Open Positions must be at least 1.")
  }

  return {
    maxDailyLoss: formatMoney(maxDailyLossAmount),
    riskPerTrade: `${riskPerTradePercent:g}%`.replace(":g", ""),
    maxOpenPositions: String(maxOpenPositions)
  }
}

function validateMockAccountSettings(payload) {
  const balanceAmount = tryParseMoney(payload.balance)
  const dailyPnlAmount = tryParseMoney(payload.dailyPnl)
  const currentDailyLossAmount = tryParseMoney(payload.currentDailyLoss)

  if (balanceAmount === null) {
    throw new Error("Balance must be a number, such as $33.85 or 1000.")
  }

  if (dailyPnlAmount === null) {
    throw new Error("Daily P&L must be a number, such as +2.95, -5.00, or 0.")
  }

  if (currentDailyLossAmount === null) {
    throw new Error("Current Daily Loss must be a number, such as 0, 2.50, or 10.")
  }

  if (balanceAmount < 0) {
    throw new Error("Balance must not be negative.")
  }

  if (currentDailyLossAmount < 0) {
    throw new Error("Current Daily Loss must not be negative. Enter loss as a positive number.")
  }

  return {
    balance: formatMoney(balanceAmount),
    dailyPnl: formatSignedMoney(dailyPnlAmount),
    currentDailyLoss: formatMoney(currentDailyLossAmount)
  }
}

function getMockSystemMode(state) {
  return state.botStatus === "RUNNING" ? "ACTIVE" : "INACTIVE"
}

function getMockPositions(state) {
  if (state.botStatus !== "RUNNING") return []

  return [
    {
      symbol: state.settingsData.symbol,
      type: "SELL",
      lot: "0.01",
      entry: "84.51",
      sl: "86.00",
      tp: "82.00",
      pnl: "+1.24"
    },
    {
      symbol: "USDJPYmicro",
      type: "SELL",
      lot: "0.1",
      entry: "158.08",
      sl: "158.46",
      tp: "157.75",
      pnl: "+0.15"
    }
  ]
}

function getMockChartData(state) {
  const symbol = state.settingsData.symbol.toUpperCase()

  let prices = []

  if (symbol.includes("XAU")) {
    prices = [2328.5, 2330.2, 2329.4, 2332.1, 2335.6, 2334.8, 2338.2, 2340.1]
  } else if (symbol.includes("JPY")) {
    prices = [158.08, 158.12, 158.05, 157.98, 158.2, 158.14, 158.3, 158.25]
  } else {
    prices = [84.1, 84.35, 84.2, 84.7, 84.55, 85.05, 84.9, 85.3]
  }

  const times = ["09:00", "09:15", "09:30", "09:45", "10:00", "10:15", "10:30", "10:45"]

  return prices.map((price, index) => ({
    time: times[index],
    price
  }))
}

function getMockRiskControls(state) {
  const positions = getMockPositions(state)

  const maxDailyLossAmount = parseMoney(state.riskSettingsData.maxDailyLoss)
  const currentDailyLossAmount = parseMoney(state.accountSettingsData.currentDailyLoss)

  const dailyLossUsagePercent =
    maxDailyLossAmount > 0
      ? (currentDailyLossAmount / maxDailyLossAmount) * 100
      : 0

  const dailyLossStatus =
    maxDailyLossAmount > 0 && currentDailyLossAmount >= maxDailyLossAmount
      ? "BREACHED"
      : "OK"

  return {
    maxDailyLoss: state.riskSettingsData.maxDailyLoss,
    currentDailyLoss: state.accountSettingsData.currentDailyLoss,
    dailyLossUsagePercent: Number(dailyLossUsagePercent.toFixed(2)),
    dailyLossStatus,
    riskPerTrade: state.riskSettingsData.riskPerTrade,
    maxOpenPositions: state.riskSettingsData.maxOpenPositions,
    currentOpenPositions: positions.length,
    riskStatus: state.botStatus === "RUNNING" ? "OK" : "PAUSED"
  }
}

export function getBackendHealth() {
  if (USE_MOCK_API) {
    return mockResolve({
      status: "ok",
      message: "mock backend connected"
    })
  }

  return requestJson("/api/health")
}

export function getDashboardData() {
  if (USE_MOCK_API) {
    const state = readMockState()

    return mockResolve({
      botStatus: state.botStatus,
      systemMode: getMockSystemMode(state),
      lastAction: state.lastAction,
      balance: state.accountSettingsData.balance,
      dailyPnl: state.accountSettingsData.dailyPnl,
      accountSettings: state.accountSettingsData,
      aiInsights: {
        signal: "HOLD",
        reason: "Market is extended, waiting for better entry",
        confidence: "74%"
      },
      quantStats: {
        var: "-2.4%",
        volatility: "18.2%",
        sharpeRatio: "1.42"
      },
      aiUsage: {
        apiCalls: "128",
        tokensUsed: "54,320",
        estimatedCost: "$3.42"
      },
      settings: state.settingsData,
      riskSettings: state.riskSettingsData,
      backtest: {
        totalTrades: "128",
        winRate: "61%",
        netProfit: "+$1,248"
      },
      riskControls: getMockRiskControls(state),
      positions: getMockPositions(state),
      chartData: getMockChartData(state),
      historyItems: state.historyItems,
      fetchedAt: new Date().toLocaleTimeString()
    })
  }

  return requestJson("/api/dashboard")
}

export function startBot() {
  if (USE_MOCK_API) {
    const state = readMockState()

    state.botStatus = "RUNNING"
    state.lastAction = "Bot started"

    addMockHistoryItem(
      state,
      "START",
      "SYSTEM",
      "-",
      "Bot status changed to RUNNING."
    )

    saveMockState(state)

    return mockResolve({
      botStatus: state.botStatus,
      systemMode: getMockSystemMode(state),
      lastAction: state.lastAction,
      positions: getMockPositions(state),
      historyItems: state.historyItems
    })
  }

  return requestJson("/api/bot/start", {
    method: "POST"
  })
}

export function stopBot() {
  if (USE_MOCK_API) {
    const state = readMockState()

    state.botStatus = "STOPPED"
    state.lastAction = "Bot stopped"

    addMockHistoryItem(
      state,
      "STOP",
      "SYSTEM",
      "-",
      "Bot status changed to STOPPED."
    )

    saveMockState(state)

    return mockResolve({
      botStatus: state.botStatus,
      systemMode: getMockSystemMode(state),
      lastAction: state.lastAction,
      positions: getMockPositions(state),
      historyItems: state.historyItems
    })
  }

  return requestJson("/api/bot/stop", {
    method: "POST"
  })
}

export function emergencyStopBot() {
  if (USE_MOCK_API) {
    const state = readMockState()

    state.botStatus = "STOPPED"
    state.lastAction = "Emergency stop activated"

    addMockHistoryItem(
      state,
      "EMERGENCY",
      "SYSTEM",
      "-",
      "Emergency stop activated. Bot status changed to STOPPED."
    )

    saveMockState(state)

    return mockResolve({
      botStatus: state.botStatus,
      systemMode: getMockSystemMode(state),
      lastAction: state.lastAction,
      positions: getMockPositions(state),
      historyItems: state.historyItems
    })
  }

  return requestJson("/api/bot/emergency-stop", {
    method: "POST"
  })
}

export function saveSettings(payload) {
  if (USE_MOCK_API) {
    const state = readMockState()
    const oldSettingsData = { ...state.settingsData }

    const newSettingsData = {
      symbol: payload.symbol,
      timeframe: payload.timeframe,
      mode: payload.mode
    }

    const detail = formatChangeDetail(
      oldSettingsData,
      newSettingsData,
      {
        symbol: "Symbol",
        timeframe: "Timeframe",
        mode: "Mode"
      }
    )

    state.settingsData = newSettingsData
    state.lastAction = "Settings saved"

    addMockHistoryItem(state, "SETTINGS", "BOT", "-", detail)

    saveMockState(state)

    return mockResolve({
      message: "Settings saved successfully",
      settings: state.settingsData,
      lastAction: state.lastAction,
      historyItems: state.historyItems
    })
  }

  return requestJson("/api/settings", {
    method: "POST",
    body: JSON.stringify(payload)
  })
}

export function saveRiskSettings(payload) {
  if (USE_MOCK_API) {
    const state = readMockState()
    const oldRiskSettingsData = { ...state.riskSettingsData }
    const validatedRiskSettings = validateMockRiskSettings(payload)

    const detail = formatChangeDetail(
      oldRiskSettingsData,
      validatedRiskSettings,
      {
        maxDailyLoss: "Max Daily Loss",
        riskPerTrade: "Risk Per Trade",
        maxOpenPositions: "Max Open Positions"
      }
    )

    state.riskSettingsData = validatedRiskSettings
    state.lastAction = "Risk settings saved"

    addMockHistoryItem(state, "SETTINGS", "RISK", "-", detail)

    saveMockState(state)

    return mockResolve({
      message: "Risk settings saved successfully",
      riskSettings: state.riskSettingsData,
      riskControls: getMockRiskControls(state),
      lastAction: state.lastAction,
      historyItems: state.historyItems
    })
  }

  return requestJson("/api/risk-settings", {
    method: "POST",
    body: JSON.stringify(payload)
  })
}

export function saveAccountSettings(payload) {
  if (USE_MOCK_API) {
    const state = readMockState()
    const oldAccountSettingsData = { ...state.accountSettingsData }
    const validatedAccountSettings = validateMockAccountSettings(payload)

    const detail = formatChangeDetail(
      oldAccountSettingsData,
      validatedAccountSettings,
      {
        balance: "Balance",
        dailyPnl: "Daily P&L",
        currentDailyLoss: "Current Daily Loss"
      }
    )

    state.accountSettingsData = validatedAccountSettings
    state.lastAction = "Account settings saved"

    addMockHistoryItem(state, "SETTINGS", "ACCOUNT", "-", detail)

    saveMockState(state)

    return mockResolve({
      message: "Account settings saved successfully",
      accountSettings: state.accountSettingsData,
      riskControls: getMockRiskControls(state),
      lastAction: state.lastAction,
      historyItems: state.historyItems
    })
  }

  return requestJson("/api/account-settings", {
    method: "POST",
    body: JSON.stringify(payload)
  })
}

export function clearHistory() {
  if (USE_MOCK_API) {
    const state = readMockState()

    state.historyItems = []
    state.lastAction = "History cleared"

    saveMockState(state)

    return mockResolve({
      message: "History cleared successfully",
      historyItems: state.historyItems,
      lastAction: state.lastAction
    })
  }

  return requestJson("/api/history/clear", {
    method: "POST"
  })
}
