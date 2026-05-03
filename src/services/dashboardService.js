import {
  emergencyStopBot,
  getBackendHealth,
  getDashboardData,
  getDemoDashboardData,
  startBot,
  stopBot
} from "../api"
import { getUserFacingError } from "../lib/apiClient"
import { normalizeDashboardSnapshot } from "../lib/dashboardMappers"

const LOCAL_ACTION_DELAY_MS = 140

function delay(ms = LOCAL_ACTION_DELAY_MS) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms)
  })
}

function normalizeSnapshotResult(rawData, meta = {}) {
  return {
    snapshot: normalizeDashboardSnapshot(rawData),
    backendStatus: meta.backendStatus || "Connected",
    notice: meta.notice || "",
    source: meta.source || (rawData?.usingDemoData ? "demo" : "backend"),
    developerError: meta.developerError || null,
    actionError: meta.actionError || null,
    userMessage: meta.userMessage || ""
  }
}

export async function getDashboardSnapshot() {
  try {
    const [dashboardData, healthData] = await Promise.all([
      getDashboardData(),
      getBackendHealth()
    ])

    return normalizeSnapshotResult(
      {
        ...dashboardData,
        backendHealth: dashboardData?.backendHealth || healthData
      },
      {
        backendStatus: healthData?.status === "ok" ? "Connected" : "Disconnected",
        source: "backend"
      }
    )
  } catch (error) {
    const demoDashboardData = await getDemoDashboardData()

    return normalizeSnapshotResult(
      {
        ...demoDashboardData,
        usingDemoData: true
      },
      {
        backendStatus: "Offline - demo data",
        notice: "Using demo data because backend is offline.",
        source: "demo",
        developerError: error,
        userMessage: getUserFacingError(error, "Backend is offline. Demo data is loaded.")
      }
    )
  }
}

export async function runBotAction(actionType) {
  const normalizedAction = String(actionType || "").toUpperCase()
  const actionMap = {
    START: startBot,
    STOP: stopBot,
    EMERGENCY_STOP: emergencyStopBot
  }

  const action = actionMap[normalizedAction]

  if (!action) {
    throw new Error(`Unsupported bot action: ${actionType}`)
  }

  try {
    await action()
    return getDashboardSnapshot()
  } catch (error) {
    const demoDashboardData = await getDemoDashboardData()

    return normalizeSnapshotResult(
      {
        ...demoDashboardData,
        usingDemoData: true
      },
      {
        backendStatus: "Offline - demo data",
        notice: "Using demo data because backend is offline.",
        source: "demo",
        actionError: error,
        userMessage: getUserFacingError(error, "Bot action could not reach the backend.")
      }
    )
  }
}

export async function updatePositionPlan(positionId, plan) {
  if (!positionId) {
    throw new Error("Position id is required before saving a plan.")
  }

  await delay()

  return {
    positionId,
    plan: {
      sl: plan?.sl ?? "",
      tp: plan?.tp ?? "",
      note: plan?.note ?? "",
      tags: Array.isArray(plan?.tags) ? plan.tags : []
    },
    savedAt: new Date().toISOString()
  }
}

export async function closePosition(positionId) {
  if (!positionId) {
    throw new Error("Position id is required before closing a position.")
  }

  await delay()

  return {
    positionId,
    closedAt: new Date().toISOString()
  }
}

export async function bulkClosePositions(positionIds = []) {
  if (!Array.isArray(positionIds) || positionIds.length === 0) {
    throw new Error("Select at least one position before bulk close.")
  }

  await delay()

  return {
    positionIds,
    closedAt: new Date().toISOString()
  }
}

export async function getActivityTimeline() {
  await delay(60)
  return []
}
