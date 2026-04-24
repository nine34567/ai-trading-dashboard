const API_BASE_URL = "http://localhost:8000"

async function requestJson(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options
    })

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`)
    }

    return response.json()
}

export function getBackendHealth() {
    return requestJson("/api/health")
}

export function getDashboardData() {
    return requestJson("/api/dashboard")
}

export function startBot() {
    return requestJson("/api/bot/start", {
        method: "POST"
    })
}

export function stopBot() {
    return requestJson("/api/bot/stop", {
        method: "POST"
    })
}

export function emergencyStopBot() {
    return requestJson("/api/bot/emergency-stop", {
        method: "POST"
    })
}

export function saveSettings(payload) {
    return requestJson("/api/settings", {
        method: "POST",
        body: JSON.stringify(payload)
    })
}

export function saveRiskSettings(payload) {
    return requestJson("/api/risk-settings", {
        method: "POST",
        body: JSON.stringify(payload)
    })
}