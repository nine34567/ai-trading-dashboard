const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ""

const mockDashboardData = {
    currentMode: "Dashboard",
    botStatus: "RUNNING",
    botMode: "ACTIVE",
    symbol: "OIL.cash",
    timeframe: "H1",
    strategyMode: "Paper Trading",

    account: {
        balance: 33.85,
        equity: 33.85,
        margin: 0,
        freeMargin: 33.85,
    },

    performance: {
        totalPnL: 0,
        dailyPnL: 2.95,
        winRate: 0,
        totalTrades: 0,
        sharpeRatio: 1.42,
    },

    aiDecision: {
        signal: "HOLD",
        confidence: "74%",
        reason: "Market is extended, waiting for better entry",
    },

    systemPerformance: {
        var: "-2.74%",
        volatility: "11.2%",
        sharpeRatio: "1.42",
        apiCalls: 121,
    },

    risk: {
        maxDailyLoss: "$10.00",
        currentDailyLoss: "$0.00",
        dailyLossUsagePercent: 0,
        dailyLossStatus: "OK",
        riskPerTrade: "1%",
        maxOpenPositions: 3,
        currentOpenPositions: 2,
        remainingSlots: 1,
        positionUsage: "67%",
        riskStatus: "OK",
        riskLevel: "NORMAL",
        tradePermission: "ALLOWED",
        suggestedAction: "New trade is allowed under current risk rules.",
    },

    riskScore: {
        score: 77,
        status: "ACCEPTABLE",
        botPenalty: -0.5,
        dailyLossPenalty: 0,
        positionPenalty: -25.3,
        finalScore: "77/100",
    },

    positions: [],
    history: [],
}

const mockHealthData = {
    status: "ok",
    mode: "mock",
    message: "Frontend is running with mock data because no production API is configured.",
}

function getMockResponse(path) {
    if (path === "/api/health") {
        return mockHealthData
    }

    if (path === "/api/dashboard") {
        return mockDashboardData
    }

    if (path.includes("/api/bot/start")) {
        return {
            success: true,
            botStatus: "RUNNING",
            message: "Bot started in mock mode.",
        }
    }

    if (path.includes("/api/bot/stop")) {
        return {
            success: true,
            botStatus: "STOPPED",
            message: "Bot stopped in mock mode.",
        }
    }

    if (path.includes("/api/bot/emergency-stop")) {
        return {
            success: true,
            botStatus: "EMERGENCY_STOPPED",
            message: "Emergency stop triggered in mock mode.",
        }
    }

    if (path.includes("/api/settings")) {
        return {
            success: true,
            message: "Settings saved in mock mode.",
        }
    }

    if (path.includes("/api/risk-settings")) {
        return {
            success: true,
            message: "Risk settings saved in mock mode.",
        }
    }

    return {
        success: true,
        message: "Mock response",
    }
}

async function requestJson(path, options = {}) {
    try {
        if (!API_BASE_URL) {
            return getMockResponse(path)
        }

        const response = await fetch(`${API_BASE_URL}${path}`, {
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
            },
            ...options,
        })

        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`)
        }

        return response.json()
    } catch (error) {
        console.warn("API request failed. Using mock data instead:", error)
        return getMockResponse(path)
    }
}

export function getBackendHealth() {
    return requestJson("/api/health")
}

export function getDashboardData() {
    return requestJson("/api/dashboard")
}

export function startBot() {
    return requestJson("/api/bot/start", {
        method: "POST",
    })
}

export function stopBot() {
    return requestJson("/api/bot/stop", {
        method: "POST",
    })
}

export function emergencyStopBot() {
    return requestJson("/api/bot/emergency-stop", {
        method: "POST",
    })
}

export function saveSettings(payload) {
    return requestJson("/api/settings", {
        method: "POST",
        body: JSON.stringify(payload),
    })
}

export function saveRiskSettings(payload) {
    return requestJson("/api/risk-settings", {
        method: "POST",
        body: JSON.stringify(payload),
    })
}