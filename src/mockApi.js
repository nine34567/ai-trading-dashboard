const API_BASE = "http://127.0.0.1:8000"

export async function getDashboardData() {
    const response = await fetch(`${API_BASE}/dashboard`)

    if (!response.ok) {
        throw new Error("Failed to load dashboard data from backend")
    }

    return await response.json()
}

export async function startBot() {
    const response = await fetch(`${API_BASE}/bot/start`, {
        method: "POST"
    })

    if (!response.ok) {
        throw new Error("Failed to start bot")
    }

    return await response.json()
}

export async function stopBot() {
    const response = await fetch(`${API_BASE}/bot/stop`, {
        method: "POST"
    })

    if (!response.ok) {
        throw new Error("Failed to stop bot")
    }

    return await response.json()
}

export async function emergencyStopBot() {
    const response = await fetch(`${API_BASE}/bot/emergency-stop`, {
        method: "POST"
    })

    if (!response.ok) {
        throw new Error("Failed to emergency stop bot")
    }

    return await response.json()
}