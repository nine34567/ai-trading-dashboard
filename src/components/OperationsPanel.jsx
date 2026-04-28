import { Component, useState } from "react"
import StrategyControlRoom from "./StrategyControlRoom"

class OperationsChildErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = {
            hasError: false,
            errorMessage: "",
            errorStack: ""
        }
    }

    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            errorMessage: error?.message || "Unknown render error",
            errorStack: error?.stack || ""
        }
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            errorMessage: error?.message || "Unknown render error",
            errorStack: errorInfo?.componentStack || error?.stack || ""
        })
    }

    reset = () => {
        this.setState({
            hasError: false,
            errorMessage: "",
            errorStack: ""
        })
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        background:
                            "linear-gradient(135deg, rgba(127, 29, 29, 0.42), rgba(17, 24, 39, 0.98))",
                        border: "1px solid rgba(248, 113, 113, 0.65)",
                        borderRadius: "22px",
                        padding: "22px",
                        marginBottom: "24px"
                    }}
                >
                    <p
                        style={{
                            color: "#fecaca",
                            fontSize: "12px",
                            fontWeight: "bold",
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            marginBottom: "10px"
                        }}
                    >
                        Strategy Layer Error Captured
                    </p>

                    <h3
                        style={{
                            color: "#f9fafb",
                            fontSize: "22px",
                            marginBottom: "10px"
                        }}
                    >
                        StrategyControlRoom หรือ component ลูก crash
                    </h3>

                    <p
                        style={{
                            color: "#fecaca",
                            lineHeight: "1.7",
                            fontWeight: "bold",
                            marginBottom: "14px"
                        }}
                    >
                        {this.state.errorMessage}
                    </p>

                    <pre
                        style={{
                            backgroundColor: "#020617",
                            border: "1px solid rgba(248, 113, 113, 0.35)",
                            borderRadius: "16px",
                            color: "#fca5a5",
                            padding: "14px",
                            whiteSpace: "pre-wrap",
                            overflowX: "auto",
                            maxHeight: "260px",
                            fontSize: "12px",
                            lineHeight: "1.55",
                            marginBottom: "16px"
                        }}
                    >
                        {this.state.errorStack || "No component stack available."}
                    </pre>

                    <button
                        type="button"
                        onClick={this.reset}
                        style={{
                            border: "none",
                            borderRadius: "12px",
                            padding: "11px 16px",
                            backgroundColor: "#f87171",
                            color: "white",
                            fontWeight: "bold",
                            cursor: "pointer"
                        }}
                    >
                        Reset Strategy Layer
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

function OperationsPanel({
    backendHealth = {},
    backendStatus = "-",
    botStatus = "-",
    riskData = {},
    lastUpdated = "-",
    loadError = "",
    openPositionsCount = "0",
    totalHistoryRecords = 0,
    diagnosticsScore = 0,
    reliabilityScore = 0
}) {
    const [sessionMode, setSessionMode] = useState("MONITORING")
    const [operatorAcknowledged, setOperatorAcknowledged] = useState(false)
    const [preTradeChecklistOpen, setPreTradeChecklistOpen] = useState(true)
    const [showStrategyControlRoom, setShowStrategyControlRoom] = useState(false)

    const parseMoney = (value) => {
        const cleanedValue = String(value || "0")
            .replace("$", "")
            .replace("+", "")
            .replace(",", "")
            .trim()

        const parsedValue = Number(cleanedValue)

        return Number.isNaN(parsedValue) ? 0 : parsedValue
    }

    const parseNumber = (value) => {
        const parsedValue = Number(value)

        return Number.isNaN(parsedValue) ? 0 : parsedValue
    }

    const clampPercent = (value) => {
        return Math.min(Math.max(Number(value) || 0, 0), 100)
    }

    const activeBotStatus = backendHealth.botStatus || botStatus || "-"
    const activeRiskStatus = backendHealth.riskStatus || riskData.riskStatus || "-"
    const activeDailyLossStatus =
        backendHealth.dailyLossStatus || riskData.dailyLossStatus || "-"
    const activeOpenPositions =
        backendHealth.openPositions ?? Number(openPositionsCount || 0)
    const activeHistoryRecords =
        backendHealth.historyRecords ?? totalHistoryRecords

    const maxOpenPositions = parseNumber(riskData.maxOpenPositions)
    const currentOpenPositions = parseNumber(activeOpenPositions)
    const maxDailyLossAmount = parseMoney(riskData.maxDailyLoss)
    const currentDailyLossAmount = parseMoney(riskData.currentDailyLoss)

    const positionUsagePercent =
        maxOpenPositions > 0
            ? clampPercent((currentOpenPositions / maxOpenPositions) * 100)
            : 0

    const dailyLossUsagePercent =
        maxDailyLossAmount > 0
            ? clampPercent((currentDailyLossAmount / maxDailyLossAmount) * 100)
            : Number(riskData.dailyLossUsagePercent || 0)

    const remainingSlots = Math.max(maxOpenPositions - currentOpenPositions, 0)
    const dailyLossRemaining = Math.max(maxDailyLossAmount - currentDailyLossAmount, 0)

    const backendIsHealthy =
        backendHealth.status === "ok" && backendStatus === "Connected"

    const botIsRunning = activeBotStatus === "RUNNING"
    const riskGateIsClear = activeRiskStatus === "OK"
    const dailyLossIsClear = activeDailyLossStatus === "OK"
    const frontendHasNoLoadError = !loadError

    const exposureLevel =
        currentOpenPositions <= 0
            ? "FLAT"
            : positionUsagePercent >= 100
                ? "FULL"
                : positionUsagePercent >= 75
                    ? "HIGH"
                    : positionUsagePercent >= 40
                        ? "MEDIUM"
                        : "LOW"

    const exposureColor =
        exposureLevel === "FLAT"
            ? "#9ca3af"
            : exposureLevel === "LOW"
                ? "#86efac"
                : exposureLevel === "MEDIUM"
                    ? "#facc15"
                    : "#f87171"

    const exposureState =
        exposureLevel === "FULL"
            ? "POSITION LIMIT FULL"
            : exposureLevel === "HIGH"
                ? "EXPOSURE HIGH"
                : exposureLevel === "MEDIUM"
                    ? "EXPOSURE MODERATE"
                    : exposureLevel === "LOW"
                        ? "EXPOSURE LOW"
                        : "NO ACTIVE EXPOSURE"

    const tradeOpsPermission =
        backendIsHealthy &&
        botIsRunning &&
        riskGateIsClear &&
        dailyLossIsClear &&
        remainingSlots > 0 &&
        frontendHasNoLoadError

    const tradeOpsStatus = tradeOpsPermission ? "OPS CLEAR" : "OPS BLOCKED"
    const tradeOpsColor = tradeOpsPermission ? "#86efac" : "#f87171"

    const tradeOpsSummary =
        tradeOpsPermission
            ? "Trading operations are clear under current backend, bot, risk, daily loss and exposure checks."
            : "Trading operations should be blocked or reviewed because one or more operational checks failed."

    const killSwitchReady =
        backendIsHealthy && frontendHasNoLoadError

    const killSwitchStatus = killSwitchReady ? "READY" : "NOT READY"
    const killSwitchColor = killSwitchReady ? "#86efac" : "#f87171"

    const killSwitchSummary =
        killSwitchReady
            ? "Emergency stop path is reachable because frontend can connect to backend."
            : "Emergency stop path may not be reachable. Check backend connection before relying on kill switch."

    const executionMode = backendHealth.mode || "-"
    const systemMode = backendHealth.systemMode || "-"

    const sessionModeOptions = [
        {
            name: "MONITORING",
            description: "ดูระบบอย่างเดียว ยังไม่อนุญาตให้เพิ่ม exposure ใหม่",
            color: "#38bdf8"
        },
        {
            name: "PRE-TRADE",
            description: "เตรียมเช็ก checklist ก่อนเปิดให้ระบบเทรด",
            color: "#facc15"
        },
        {
            name: "LIVE READY",
            description: "ระบบพร้อมสำหรับ trading operation ตาม risk gate",
            color: "#86efac"
        },
        {
            name: "LOCKDOWN",
            description: "โหมดป้องกัน ไม่ควรเปิด trade ใหม่",
            color: "#f87171"
        }
    ]

    const activeSessionOption =
        sessionModeOptions.find((item) => item.name === sessionMode) ||
        sessionModeOptions[0]

    const sessionModeColor = activeSessionOption.color

    const preTradeChecklist = [
        {
            label: "Backend connected",
            passed: backendIsHealthy,
            value: backendIsHealthy ? "CONNECTED" : "DISCONNECTED",
            detail: "Frontend must be able to call backend and backend health must be ok."
        },
        {
            label: "Bot runtime active",
            passed: botIsRunning,
            value: activeBotStatus,
            detail: "Bot runtime should be active before live trading operation."
        },
        {
            label: "Risk gate clear",
            passed: riskGateIsClear,
            value: activeRiskStatus,
            detail: "Risk status must be OK before allowing new exposure."
        },
        {
            label: "Daily loss guard clear",
            passed: dailyLossIsClear,
            value: activeDailyLossStatus,
            detail: "Daily loss limit must not be breached."
        },
        {
            label: "Position slot available",
            passed: remainingSlots > 0,
            value: `${remainingSlots} slot(s)`,
            detail: "There must be at least one position slot available."
        },
        {
            label: "Exposure not full",
            passed: exposureLevel !== "FULL",
            value: exposureState,
            detail: "Position usage must not be at maximum capacity."
        },
        {
            label: "Kill switch reachable",
            passed: killSwitchReady,
            value: killSwitchStatus,
            detail: "Emergency stop path should be reachable before live trading."
        },
        {
            label: "Frontend has no load error",
            passed: frontendHasNoLoadError,
            value: frontendHasNoLoadError ? "CLEAR" : "ERROR",
            detail: "No active frontend API or loading error should be present."
        },
        {
            label: "Reliability acceptable",
            passed: reliabilityScore >= 75,
            value: `${reliabilityScore}/100`,
            detail: "Reliability score should be at least stable before live operation."
        },
        {
            label: "Operator acknowledged",
            passed: operatorAcknowledged,
            value: operatorAcknowledged ? "ACKNOWLEDGED" : "PENDING",
            detail: "Operator should manually acknowledge the pre-trade checklist."
        }
    ]

    const preTradePassedCount = preTradeChecklist.filter((item) => item.passed).length
    const preTradeTotalCount = preTradeChecklist.length
    const preTradeScore =
        preTradeTotalCount > 0
            ? Math.round((preTradePassedCount / preTradeTotalCount) * 100)
            : 0

    const liveReadinessGate =
        tradeOpsPermission &&
        killSwitchReady &&
        reliabilityScore >= 75 &&
        preTradeScore >= 90 &&
        operatorAcknowledged &&
        sessionMode === "LIVE READY"

    const liveReadinessStatus =
        liveReadinessGate ? "LIVE GATE OPEN" : "LIVE GATE CLOSED"

    const liveReadinessColor =
        liveReadinessGate ? "#86efac" : "#f87171"

    const liveReadinessSummary =
        liveReadinessGate
            ? "All major operational checks passed. System is ready for controlled live trading operations."
            : "Live trading gate is closed. Complete checklist, confirm session mode, and acknowledge operator responsibility before going live."

    const sessionPermission =
        sessionMode === "LOCKDOWN"
            ? "BLOCK ALL TRADING"
            : sessionMode === "MONITORING"
                ? "MONITOR ONLY"
                : sessionMode === "PRE-TRADE"
                    ? "CHECKLIST REQUIRED"
                    : liveReadinessGate
                        ? "LIVE TRADING ALLOWED"
                        : "LIVE MODE NOT CLEARED"

    const sessionPermissionColor =
        sessionPermission === "LIVE TRADING ALLOWED"
            ? "#86efac"
            : sessionPermission === "CHECKLIST REQUIRED"
                ? "#facc15"
                : sessionPermission === "MONITOR ONLY"
                    ? "#38bdf8"
                    : "#f87171"

    const sessionActionPlan =
        liveReadinessGate
            ? [
                "Keep position size small and follow risk engine limits.",
                "Monitor exposure guard after every new trade.",
                "Keep emergency stop visible and ready.",
                "Do not override daily loss guard."
            ]
            : [
                "Review all failed pre-trade checklist items.",
                "Set session mode to LIVE READY only after operational checks pass.",
                "Acknowledge checklist manually before live operation.",
                "Keep system in MONITORING or LOCKDOWN if uncertainty remains."
            ]

    const alerts = [
        {
            title: "Backend Connectivity",
            severity: backendIsHealthy ? "INFO" : "CRITICAL",
            active: !backendIsHealthy,
            detail:
                backendIsHealthy
                    ? "Backend connection is healthy."
                    : "Backend is not healthy or dashboard cannot connect.",
            operatorAction:
                "Check FastAPI server, API base URL, CORS, and /api/health response."
        },
        {
            title: "Bot Runtime",
            severity: botIsRunning ? "INFO" : "WARNING",
            active: !botIsRunning,
            detail:
                botIsRunning
                    ? "Bot runtime is active."
                    : "Bot is stopped or paused.",
            operatorAction:
                "Confirm whether bot should be running. Start only after risk checks are clear."
        },
        {
            title: "Risk Gate",
            severity: riskGateIsClear ? "INFO" : "HIGH",
            active: !riskGateIsClear,
            detail:
                riskGateIsClear
                    ? "Risk gate is clear."
                    : "Risk gate is not OK.",
            operatorAction:
                "Review max daily loss, open positions, and bot status before allowing trades."
        },
        {
            title: "Daily Loss Guard",
            severity: dailyLossIsClear ? "INFO" : "CRITICAL",
            active: !dailyLossIsClear,
            detail:
                dailyLossIsClear
                    ? "Daily loss limit has not been breached."
                    : "Daily loss limit has been breached.",
            operatorAction:
                "Stop trading for the day and review account loss exposure."
        },
        {
            title: "Frontend Load Error",
            severity: loadError ? "HIGH" : "INFO",
            active: Boolean(loadError),
            detail: loadError || "No frontend load error.",
            operatorAction:
                "If error exists, check API timeout, backend logs, and network tab."
        },
        {
            title: "Reliability Score",
            severity:
                reliabilityScore >= 90
                    ? "INFO"
                    : reliabilityScore >= 75
                        ? "WARNING"
                        : "HIGH",
            active: reliabilityScore < 90,
            detail: `Current reliability score is ${reliabilityScore}/100.`,
            operatorAction:
                "Improve failed diagnostics checks before production deployment."
        },
        {
            title: "Exposure Guard",
            severity:
                exposureLevel === "FULL"
                    ? "CRITICAL"
                    : exposureLevel === "HIGH"
                        ? "HIGH"
                        : exposureLevel === "MEDIUM"
                            ? "WARNING"
                            : "INFO",
            active: exposureLevel === "FULL" || exposureLevel === "HIGH",
            detail: `${exposureState}. Current usage is ${positionUsagePercent.toFixed(0)}%.`,
            operatorAction:
                "Reduce exposure or wait for open positions to close before allowing new trades."
        },
        {
            title: "Kill Switch Readiness",
            severity: killSwitchReady ? "INFO" : "CRITICAL",
            active: !killSwitchReady,
            detail: killSwitchSummary,
            operatorAction:
                "Confirm emergency stop endpoint is reachable before live trading."
        },
        {
            title: "Live Readiness Gate",
            severity: liveReadinessGate ? "INFO" : "HIGH",
            active: !liveReadinessGate,
            detail: liveReadinessSummary,
            operatorAction:
                "Complete pre-trade checklist, acknowledge responsibility, and use LIVE READY mode only when all checks pass."
        }
    ]

    const activeAlerts = alerts.filter((alert) => alert.active)
    const criticalAlerts = activeAlerts.filter((alert) => alert.severity === "CRITICAL")
    const highAlerts = activeAlerts.filter((alert) => alert.severity === "HIGH")
    const warningAlerts = activeAlerts.filter((alert) => alert.severity === "WARNING")

    const incidentSeverity =
        criticalAlerts.length > 0
            ? "SEV-1"
            : highAlerts.length > 0
                ? "SEV-2"
                : warningAlerts.length > 0
                    ? "SEV-3"
                    : "NORMAL"

    const incidentColor =
        incidentSeverity === "SEV-1"
            ? "#f87171"
            : incidentSeverity === "SEV-2"
                ? "#fb923c"
                : incidentSeverity === "SEV-3"
                    ? "#facc15"
                    : "#86efac"

    const incidentStatus =
        incidentSeverity === "NORMAL"
            ? "NO ACTIVE INCIDENT"
            : "ACTIVE INCIDENT"

    const incidentSummary =
        incidentSeverity === "SEV-1"
            ? "Critical issue detected. Trading operations should be blocked until resolved."
            : incidentSeverity === "SEV-2"
                ? "High severity issue detected. Review before allowing execution."
                : incidentSeverity === "SEV-3"
                    ? "Warning condition detected. Monitor closely before scaling."
                    : "System is operating normally under current checks."

    const runbookChecklist = [
        {
            label: "Confirm backend health",
            passed: backendHealth.status === "ok",
            detail: "Open /api/health and confirm status is ok."
        },
        {
            label: "Confirm dashboard endpoint",
            passed: backendStatus === "Connected",
            detail: "Dashboard should load without API connection error."
        },
        {
            label: "Review bot state",
            passed: botIsRunning,
            detail: "Bot should be running only when risk rules are clear."
        },
        {
            label: "Review risk gate",
            passed: riskGateIsClear,
            detail: "Risk status must be OK before any new trade."
        },
        {
            label: "Review daily loss guard",
            passed: dailyLossIsClear,
            detail: "Daily loss status must not be breached."
        },
        {
            label: "Review open exposure",
            passed: exposureLevel !== "FULL",
            detail: "Open positions should not exceed max position capacity."
        },
        {
            label: "Review audit trail",
            passed: Number(activeHistoryRecords) >= 0,
            detail: "History records should be readable for investigation."
        },
        {
            label: "Run build before deploy",
            passed: diagnosticsScore >= 70,
            detail: "Run npm run build and backend py_compile before commit."
        },
        {
            label: "Confirm kill switch readiness",
            passed: killSwitchReady,
            detail: "Emergency stop path should be reachable before live trading."
        },
        {
            label: "Confirm remaining slot",
            passed: remainingSlots > 0,
            detail: "At least one position slot should remain before new trade."
        },
        {
            label: "Confirm live readiness gate",
            passed: liveReadinessGate,
            detail: "Live gate should be open only after checklist and acknowledgement pass."
        },
        {
            label: "Confirm operator acknowledgement",
            passed: operatorAcknowledged,
            detail: "Operator must manually acknowledge pre-trade responsibility."
        }
    ]

    const runbookPassedCount = runbookChecklist.filter((item) => item.passed).length
    const runbookTotalCount = runbookChecklist.length
    const runbookScore =
        runbookTotalCount > 0
            ? Math.round((runbookPassedCount / runbookTotalCount) * 100)
            : 0

    const tradeOpsChecks = [
        {
            label: "Backend",
            passed: backendIsHealthy,
            value: backendIsHealthy ? "CONNECTED" : "DISCONNECTED"
        },
        {
            label: "Bot",
            passed: botIsRunning,
            value: activeBotStatus
        },
        {
            label: "Risk",
            passed: riskGateIsClear,
            value: activeRiskStatus
        },
        {
            label: "Daily Loss",
            passed: dailyLossIsClear,
            value: activeDailyLossStatus
        },
        {
            label: "Exposure",
            passed: exposureLevel !== "FULL",
            value: exposureState
        },
        {
            label: "Kill Switch",
            passed: killSwitchReady,
            value: killSwitchStatus
        },
        {
            label: "Pre-Trade",
            passed: preTradeScore >= 90,
            value: `${preTradeScore}/100`
        },
        {
            label: "Live Gate",
            passed: liveReadinessGate,
            value: liveReadinessStatus
        }
    ]

    const operatorActions =
        activeAlerts.length === 0
            ? [
                "Continue monitoring dashboard health.",
                "Review risk settings before changing execution mode.",
                "Run build checks before GitHub update."
            ]
            : activeAlerts.map((alert) => alert.operatorAction)

    const exposureGuardChecklist = [
        {
            label: "Position capacity",
            value: `${currentOpenPositions} / ${maxOpenPositions || "-"}`,
            passed: exposureLevel !== "FULL"
        },
        {
            label: "Remaining slots",
            value: String(remainingSlots),
            passed: remainingSlots > 0
        },
        {
            label: "Position usage",
            value: `${positionUsagePercent.toFixed(0)}%`,
            passed: positionUsagePercent < 100
        },
        {
            label: "Daily loss usage",
            value: `${dailyLossUsagePercent.toFixed(0)}%`,
            passed: dailyLossUsagePercent < 100
        },
        {
            label: "Daily loss remaining",
            value: `$${dailyLossRemaining.toFixed(2)}`,
            passed: dailyLossRemaining > 0
        },
        {
            label: "Risk gate",
            value: activeRiskStatus,
            passed: riskGateIsClear
        }
    ]

    const killSwitchChecklist = [
        {
            label: "Frontend can reach backend",
            passed: backendStatus === "Connected",
            detail: "Dashboard must be able to call backend API."
        },
        {
            label: "Backend health is OK",
            passed: backendHealth.status === "ok",
            detail: "Backend must return healthy status."
        },
        {
            label: "No frontend load error",
            passed: frontendHasNoLoadError,
            detail: "Frontend should not have active load errors."
        },
        {
            label: "Emergency endpoint expected",
            passed: backendIsHealthy,
            detail: "Emergency stop endpoint should be available when backend is healthy."
        }
    ]

    const getSeverityColor = (severity) => {
        if (severity === "CRITICAL") return "#f87171"
        if (severity === "HIGH") return "#fb923c"
        if (severity === "WARNING") return "#facc15"

        return "#86efac"
    }

    const getSeverityBackground = (severity) => {
        if (severity === "CRITICAL") return "rgba(127, 29, 29, 0.42)"
        if (severity === "HIGH") return "rgba(154, 52, 18, 0.38)"
        if (severity === "WARNING") return "rgba(113, 63, 18, 0.38)"

        return "rgba(20, 83, 45, 0.34)"
    }

    const statusPillStyle = (color, backgroundColor) => ({
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px 12px",
        borderRadius: "999px",
        backgroundColor,
        border: `1px solid ${color}`,
        color,
        fontWeight: "bold",
        fontSize: "12px",
        letterSpacing: "0.06em",
        whiteSpace: "nowrap"
    })

    const panelStyle = {
        background:
            "linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(11, 18, 32, 0.98))",
        border: "1px solid rgba(55, 65, 81, 0.78)",
        padding: "24px",
        borderRadius: "20px",
        marginBottom: "24px",
        boxShadow: "0 18px 44px rgba(0, 0, 0, 0.2)"
    }

    const sectionEyebrowStyle = {
        color: "#84cc16",
        fontSize: "12px",
        fontWeight: "bold",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        marginBottom: "10px"
    }

    const cardStyle = {
        backgroundColor: "#0b1220",
        border: "1px solid #1f2937",
        borderRadius: "16px",
        padding: "16px"
    }

    const infoBoxStyle = {
        backgroundColor: "#0b1220",
        border: "1px solid #1f2937",
        borderRadius: "14px",
        padding: "16px"
    }

    const progressTrackStyle = {
        width: "100%",
        height: "14px",
        backgroundColor: "#1f2937",
        borderRadius: "999px",
        overflow: "hidden",
        boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.35)"
    }

    const InfoBox = ({ label, value, color = "#d1d5db" }) => (
        <div style={infoBoxStyle}>
            <p style={{ color: "#9ca3af", marginBottom: "8px" }}>{label}</p>
            <p style={{ color, fontWeight: "bold" }}>{value}</p>
        </div>
    )

    const MiniCheckCard = ({ label, value, passed }) => (
        <div
            style={{
                backgroundColor: "#0b1220",
                border: passed
                    ? "1px solid rgba(134, 239, 172, 0.32)"
                    : "1px solid rgba(248, 113, 113, 0.32)",
                borderRadius: "16px",
                padding: "15px"
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    alignItems: "center",
                    marginBottom: "10px"
                }}
            >
                <p style={{ color: "#d1d5db", fontWeight: "bold" }}>
                    {label}
                </p>

                <span
                    style={statusPillStyle(
                        passed ? "#86efac" : "#f87171",
                        passed
                            ? "rgba(20, 83, 45, 0.42)"
                            : "rgba(127, 29, 29, 0.42)"
                    )}
                >
                    {passed ? "PASS" : "FAIL"}
                </span>
            </div>

            <p
                style={{
                    color: passed ? "#86efac" : "#f87171",
                    fontWeight: "bold"
                }}
            >
                {value}
            </p>
        </div>
    )

    return (
        <>
            <div style={panelStyle}>
                <p style={sectionEyebrowStyle}>Trading Session Control</p>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(320px, 0.8fr) minmax(520px, 1.2fr)",
                        gap: "22px",
                        alignItems: "stretch"
                    }}
                >
                    <div
                        style={{
                            background:
                                "linear-gradient(135deg, rgba(11, 18, 32, 0.98), rgba(17, 24, 39, 0.96))",
                            border: `1px solid ${sessionModeColor}`,
                            borderRadius: "22px",
                            padding: "22px",
                            boxShadow: `0 0 32px ${sessionModeColor}22`
                        }}
                    >
                        <p style={{ color: "#9ca3af", marginBottom: "8px" }}>
                            Current Session Mode
                        </p>

                        <h2
                            style={{
                                color: sessionModeColor,
                                fontSize: "42px",
                                letterSpacing: "-0.04em",
                                marginBottom: "12px"
                            }}
                        >
                            {sessionMode}
                        </h2>

                        <p style={{ color: "#d1d5db", lineHeight: "1.75", fontWeight: "bold" }}>
                            {activeSessionOption.description}
                        </p>

                        <div style={{ height: "18px" }} />

                        <div
                            style={{
                                backgroundColor: "#0b1220",
                                border: `1px solid ${sessionPermissionColor}`,
                                borderRadius: "18px",
                                padding: "16px"
                            }}
                        >
                            <p style={{ color: "#9ca3af", marginBottom: "8px" }}>
                                Session Permission
                            </p>

                            <p
                                style={{
                                    color: sessionPermissionColor,
                                    fontWeight: "bold",
                                    fontSize: "20px"
                                }}
                            >
                                {sessionPermission}
                            </p>
                        </div>
                    </div>

                    <div style={cardStyle}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: "16px",
                                flexWrap: "wrap",
                                alignItems: "flex-start",
                                marginBottom: "18px"
                            }}
                        >
                            <div>
                                <h3 style={{ color: "#f9fafb", marginBottom: "8px" }}>
                                    Session Control Board
                                </h3>

                                <p style={{ color: "#9ca3af", lineHeight: "1.7" }}>
                                    Choose the operational session mode before allowing any live trading workflow.
                                </p>
                            </div>

                            <span style={statusPillStyle(sessionModeColor, `${sessionModeColor}22`)}>
                                {sessionMode}
                            </span>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                                gap: "12px",
                                marginBottom: "18px"
                            }}
                        >
                            {sessionModeOptions.map((option) => {
                                const active = sessionMode === option.name

                                return (
                                    <button
                                        key={option.name}
                                        onClick={() => {
                                            setSessionMode(option.name)
                                            if (option.name !== "LIVE READY") {
                                                setOperatorAcknowledged(false)
                                            }
                                        }}
                                        style={{
                                            background: active
                                                ? `linear-gradient(135deg, ${option.color}33, rgba(17, 24, 39, 0.96))`
                                                : "linear-gradient(135deg, rgba(31, 41, 55, 0.5), rgba(17, 24, 39, 0.96))",
                                            border: active
                                                ? `1px solid ${option.color}`
                                                : "1px solid #374151",
                                            borderRadius: "16px",
                                            padding: "14px",
                                            cursor: "pointer",
                                            textAlign: "left",
                                            color: active ? option.color : "#d1d5db",
                                            fontWeight: "bold",
                                            boxShadow: active ? `0 0 22px ${option.color}22` : "none"
                                        }}
                                    >
                                        <p style={{ marginBottom: "8px" }}>{option.name}</p>
                                        <p
                                            style={{
                                                color: "#9ca3af",
                                                fontSize: "12px",
                                                lineHeight: "1.5",
                                                fontWeight: "normal"
                                            }}
                                        >
                                            {option.description}
                                        </p>
                                    </button>
                                )
                            })}
                        </div>

                        <button
                            onClick={() => setOperatorAcknowledged((prev) => !prev)}
                            style={{
                                width: "100%",
                                background: operatorAcknowledged
                                    ? "linear-gradient(135deg, #84cc16, #22c55e)"
                                    : "linear-gradient(135deg, #374151, #111827)",
                                color: operatorAcknowledged ? "#020617" : "#d1d5db",
                                border: operatorAcknowledged
                                    ? "1px solid #86efac"
                                    : "1px solid #4b5563",
                                borderRadius: "16px",
                                padding: "14px",
                                cursor: "pointer",
                                fontWeight: "bold",
                                boxShadow: operatorAcknowledged
                                    ? "0 0 24px rgba(134, 239, 172, 0.22)"
                                    : "none"
                            }}
                        >
                            {operatorAcknowledged
                                ? "Operator Acknowledged"
                                : "Acknowledge Pre-Trade Responsibility"}
                        </button>
                    </div>
                </div>
            </div>

            <div style={panelStyle}>
                <p style={sectionEyebrowStyle}>Live Readiness Gate</p>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(320px, 0.75fr) minmax(520px, 1.25fr)",
                        gap: "22px",
                        alignItems: "stretch"
                    }}
                >
                    <div
                        style={{
                            background:
                                liveReadinessGate
                                    ? "linear-gradient(135deg, rgba(20, 83, 45, 0.34), rgba(17, 24, 39, 0.96))"
                                    : "linear-gradient(135deg, rgba(127, 29, 29, 0.34), rgba(17, 24, 39, 0.96))",
                            border: `1px solid ${liveReadinessColor}`,
                            borderRadius: "22px",
                            padding: "22px",
                            boxShadow: `0 0 32px ${liveReadinessColor}22`
                        }}
                    >
                        <p style={{ color: "#9ca3af", marginBottom: "8px" }}>
                            Live Gate State
                        </p>

                        <h2
                            style={{
                                color: liveReadinessColor,
                                fontSize: "40px",
                                letterSpacing: "-0.04em",
                                marginBottom: "12px"
                            }}
                        >
                            {liveReadinessStatus}
                        </h2>

                        <p style={{ color: "#d1d5db", lineHeight: "1.75", fontWeight: "bold" }}>
                            {liveReadinessSummary}
                        </p>

                        <div style={{ height: "18px" }} />

                        <div style={progressTrackStyle}>
                            <div
                                style={{
                                    width: `${preTradeScore}%`,
                                    height: "100%",
                                    background: `linear-gradient(90deg, ${liveReadinessColor}, rgba(255,255,255,0.68))`,
                                    borderRadius: "999px",
                                    boxShadow: `0 0 20px ${liveReadinessColor}55`
                                }}
                            />
                        </div>

                        <p
                            style={{
                                color: "#9ca3af",
                                marginTop: "10px",
                                fontSize: "13px"
                            }}
                        >
                            Pre-Trade Score: {preTradeScore}/100
                        </p>
                    </div>

                    <div style={cardStyle}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: "16px",
                                flexWrap: "wrap",
                                alignItems: "flex-start",
                                marginBottom: "18px"
                            }}
                        >
                            <div>
                                <h3 style={{ color: "#f9fafb", marginBottom: "8px" }}>
                                    Go / No-Go Decision Gate
                                </h3>

                                <p style={{ color: "#9ca3af", lineHeight: "1.7" }}>
                                    This gate blocks live operation until backend, risk, exposure, kill switch,
                                    reliability and operator acknowledgement are clear.
                                </p>
                            </div>

                            <span
                                style={statusPillStyle(
                                    liveReadinessColor,
                                    liveReadinessGate
                                        ? "rgba(20, 83, 45, 0.42)"
                                        : "rgba(127, 29, 29, 0.42)"
                                )}
                            >
                                {liveReadinessGate ? "GO" : "NO-GO"}
                            </span>
                        </div>

                        <div style={{ display: "grid", gap: "12px" }}>
                            {sessionActionPlan.map((action, index) => (
                                <div
                                    key={`${action}-${index}`}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "34px 1fr",
                                        gap: "12px",
                                        alignItems: "start",
                                        backgroundColor: "#0b1220",
                                        border: "1px solid #1f2937",
                                        borderRadius: "16px",
                                        padding: "14px"
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "28px",
                                            height: "28px",
                                            borderRadius: "999px",
                                            backgroundColor: `${liveReadinessColor}22`,
                                            border: `1px solid ${liveReadinessColor}`,
                                            color: liveReadinessColor,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontWeight: "bold",
                                            fontSize: "12px"
                                        }}
                                    >
                                        {index + 1}
                                    </div>

                                    <p style={{ color: "#d1d5db", lineHeight: "1.6", fontWeight: "bold" }}>
                                        {action}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div style={panelStyle}>
                <p style={sectionEyebrowStyle}>Strategy Control Room</p>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "16px",
                        flexWrap: "wrap",
                        alignItems: "flex-start",
                        marginBottom: "18px"
                    }}
                >
                    <div>
                        <h3 style={{ color: "#f9fafb", marginBottom: "8px" }}>
                            Strategy Layer Loader
                        </h3>

                        <p style={{ color: "#9ca3af", lineHeight: "1.7" }}>
                            StrategyControlRoom เป็นจุดเริ่มต้นของ chain ลูกหลายชั้น
                            จึงโหลดผ่านปุ่มเพื่อกันไม่ให้ Operations Console ทั้งหน้าขาว
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowStrategyControlRoom((prev) => !prev)}
                        style={{
                            border: "none",
                            borderRadius: "14px",
                            padding: "12px 18px",
                            backgroundColor: showStrategyControlRoom ? "#f87171" : "#84cc16",
                            color: showStrategyControlRoom ? "white" : "black",
                            fontWeight: "bold",
                            cursor: "pointer",
                            boxShadow: "0 12px 24px rgba(0, 0, 0, 0.18)"
                        }}
                    >
                        {showStrategyControlRoom
                            ? "Hide Strategy Control Room"
                            : "Load Strategy Control Room"}
                    </button>
                </div>

                {!showStrategyControlRoom ? (
                    <div
                        style={{
                            backgroundColor: "#0b1220",
                            border: "1px dashed #374151",
                            borderRadius: "18px",
                            padding: "18px"
                        }}
                    >
                        <p
                            style={{
                                color: "#facc15",
                                fontWeight: "bold",
                                marginBottom: "8px"
                            }}
                        >
                            StrategyControlRoom is not loaded yet.
                        </p>

                        <p style={{ color: "#9ca3af", lineHeight: "1.7" }}>
                            OperationsPanel หลักยังทำงานอยู่ครบ กด Load Strategy Control Room
                            เพื่อทดสอบว่า component ลูกตัวนี้หรือ chain ถัดไปเป็นต้นเหตุของจอขาวหรือไม่
                        </p>
                    </div>
                ) : (
                    <OperationsChildErrorBoundary>
                        <StrategyControlRoom
                            backendHealth={backendHealth}
                            botStatus={activeBotStatus}
                            riskData={riskData}
                            sessionMode={sessionMode}
                            operatorAcknowledged={operatorAcknowledged}
                            tradeOpsPermission={tradeOpsPermission}
                            liveReadinessGate={liveReadinessGate}
                            exposureLevel={exposureLevel}
                            positionUsagePercent={positionUsagePercent}
                            dailyLossUsagePercent={dailyLossUsagePercent}
                            remainingSlots={remainingSlots}
                            diagnosticsScore={diagnosticsScore}
                            reliabilityScore={reliabilityScore}
                        />
                    </OperationsChildErrorBoundary>
                )}
            </div>

            <div style={panelStyle}>
                <p style={sectionEyebrowStyle}>Pre-Trade Checklist</p>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "16px",
                        flexWrap: "wrap",
                        alignItems: "flex-start",
                        marginBottom: "18px"
                    }}
                >
                    <div>
                        <h3 style={{ color: "#f9fafb", marginBottom: "8px" }}>
                            Pre-Trade Checklist
                        </h3>

                        <p style={{ color: "#9ca3af", lineHeight: "1.7" }}>
                            Final checklist before live trading operation. This is intentionally stricter than general diagnostics.
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <span
                            style={statusPillStyle(
                                preTradeScore >= 90 ? "#86efac" : preTradeScore >= 70 ? "#facc15" : "#f87171",
                                preTradeScore >= 90
                                    ? "rgba(20, 83, 45, 0.42)"
                                    : preTradeScore >= 70
                                        ? "rgba(113, 63, 18, 0.42)"
                                        : "rgba(127, 29, 29, 0.42)"
                            )}
                        >
                            PRE-TRADE {preTradeScore}/100
                        </span>

                        <button
                            onClick={() => setPreTradeChecklistOpen((prev) => !prev)}
                            style={{
                                backgroundColor: "#1f2937",
                                border: "1px solid #374151",
                                color: "#d1d5db",
                                borderRadius: "999px",
                                padding: "8px 12px",
                                cursor: "pointer",
                                fontWeight: "bold",
                                fontSize: "12px"
                            }}
                        >
                            {preTradeChecklistOpen ? "Collapse" : "Expand"}
                        </button>
                    </div>
                </div>

                {preTradeChecklistOpen && (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                            gap: "16px"
                        }}
                    >
                        {preTradeChecklist.map((item) => (
                            <div
                                key={item.label}
                                style={{
                                    ...cardStyle,
                                    border: item.passed
                                        ? "1px solid rgba(134, 239, 172, 0.32)"
                                        : "1px solid rgba(248, 113, 113, 0.32)"
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        gap: "12px",
                                        alignItems: "center",
                                        marginBottom: "10px"
                                    }}
                                >
                                    <p style={{ color: "#d1d5db", fontWeight: "bold" }}>
                                        {item.label}
                                    </p>

                                    <span
                                        style={statusPillStyle(
                                            item.passed ? "#86efac" : "#f87171",
                                            item.passed
                                                ? "rgba(20, 83, 45, 0.42)"
                                                : "rgba(127, 29, 29, 0.42)"
                                        )}
                                    >
                                        {item.passed ? "PASS" : "FAIL"}
                                    </span>
                                </div>

                                <p
                                    style={{
                                        color: item.passed ? "#86efac" : "#f87171",
                                        fontWeight: "bold",
                                        marginBottom: "8px"
                                    }}
                                >
                                    {item.value}
                                </p>

                                <p style={{ color: "#9ca3af", fontSize: "13px", lineHeight: "1.6" }}>
                                    {item.detail}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={panelStyle}>
                <p style={sectionEyebrowStyle}>Trade Operations</p>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(320px, 0.8fr) minmax(520px, 1.2fr)",
                        gap: "22px",
                        alignItems: "stretch"
                    }}
                >
                    <div
                        style={{
                            background:
                                tradeOpsPermission
                                    ? "linear-gradient(135deg, rgba(20, 83, 45, 0.34), rgba(17, 24, 39, 0.96))"
                                    : "linear-gradient(135deg, rgba(127, 29, 29, 0.34), rgba(17, 24, 39, 0.96))",
                            border: `1px solid ${tradeOpsColor}`,
                            borderRadius: "22px",
                            padding: "22px",
                            boxShadow: `0 0 32px ${tradeOpsColor}22`
                        }}
                    >
                        <p style={{ color: "#9ca3af", marginBottom: "8px" }}>
                            Trading Operations State
                        </p>

                        <h2
                            style={{
                                color: tradeOpsColor,
                                fontSize: "42px",
                                letterSpacing: "-0.04em",
                                marginBottom: "12px"
                            }}
                        >
                            {tradeOpsStatus}
                        </h2>

                        <p style={{ color: "#d1d5db", lineHeight: "1.75", fontWeight: "bold" }}>
                            {tradeOpsSummary}
                        </p>

                        <div style={{ height: "18px" }} />

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(2, 1fr)",
                                gap: "12px"
                            }}
                        >
                            <InfoBox label="System Mode" value={systemMode} color={systemMode === "ACTIVE" ? "#86efac" : "#f87171"} />
                            <InfoBox label="Execution Mode" value={executionMode} color="#facc15" />
                        </div>
                    </div>

                    <div style={cardStyle}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: "16px",
                                flexWrap: "wrap",
                                alignItems: "flex-start",
                                marginBottom: "18px"
                            }}
                        >
                            <div>
                                <h3 style={{ color: "#f9fafb", marginBottom: "8px" }}>
                                    Trade Ops Dashboard
                                </h3>

                                <p style={{ color: "#9ca3af", lineHeight: "1.7" }}>
                                    Combined execution readiness from backend, bot runtime, risk gate,
                                    daily loss guard, exposure guard, kill switch and pre-trade readiness.
                                </p>
                            </div>

                            <span
                                style={statusPillStyle(
                                    tradeOpsColor,
                                    tradeOpsPermission
                                        ? "rgba(20, 83, 45, 0.42)"
                                        : "rgba(127, 29, 29, 0.42)"
                                )}
                            >
                                {tradeOpsStatus}
                            </span>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                                gap: "14px"
                            }}
                        >
                            {tradeOpsChecks.map((item) => (
                                <MiniCheckCard
                                    key={item.label}
                                    label={item.label}
                                    value={item.value}
                                    passed={item.passed}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(360px, 0.9fr) minmax(460px, 1.1fr)",
                    gap: "22px",
                    alignItems: "start",
                    marginBottom: "24px"
                }}
            >
                <div style={panelStyle}>
                    <p style={sectionEyebrowStyle}>Exposure Guard</p>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "16px",
                            flexWrap: "wrap",
                            alignItems: "flex-start",
                            marginBottom: "18px"
                        }}
                    >
                        <div>
                            <h3 style={{ color: "#f9fafb", marginBottom: "8px" }}>
                                Exposure Guard
                            </h3>

                            <p style={{ color: "#9ca3af", lineHeight: "1.7" }}>
                                Monitors open position capacity, remaining slots, position usage and daily loss buffer.
                            </p>
                        </div>

                        <span style={statusPillStyle(exposureColor, `${exposureColor}22`)}>
                            {exposureState}
                        </span>
                    </div>

                    <div style={{ marginBottom: "18px" }}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "10px",
                                color: "#d1d5db",
                                fontWeight: "bold"
                            }}
                        >
                            <span>Position Usage</span>
                            <span>{positionUsagePercent.toFixed(0)}%</span>
                        </div>

                        <div style={progressTrackStyle}>
                            <div
                                style={{
                                    width: `${positionUsagePercent}%`,
                                    height: "100%",
                                    background:
                                        `linear-gradient(90deg, ${exposureColor}, rgba(255,255,255,0.68))`,
                                    borderRadius: "999px",
                                    boxShadow: `0 0 20px ${exposureColor}55`
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: "18px" }}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "10px",
                                color: "#d1d5db",
                                fontWeight: "bold"
                            }}
                        >
                            <span>Daily Loss Usage</span>
                            <span>{dailyLossUsagePercent.toFixed(0)}%</span>
                        </div>

                        <div style={progressTrackStyle}>
                            <div
                                style={{
                                    width: `${dailyLossUsagePercent}%`,
                                    height: "100%",
                                    background:
                                        `linear-gradient(90deg, ${dailyLossUsagePercent >= 100 ? "#f87171" : "#86efac"}, rgba(255,255,255,0.68))`,
                                    borderRadius: "999px",
                                    boxShadow: "0 0 20px rgba(134, 239, 172, 0.2)"
                                }}
                            />
                        </div>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: "12px"
                        }}
                    >
                        <InfoBox label="Open" value={String(currentOpenPositions)} color="#f9fafb" />
                        <InfoBox label="Max" value={String(maxOpenPositions || "-")} color="#d1d5db" />
                        <InfoBox label="Slots" value={String(remainingSlots)} color={remainingSlots > 0 ? "#86efac" : "#f87171"} />
                    </div>
                </div>

                <div style={panelStyle}>
                    <p style={sectionEyebrowStyle}>Exposure Checklist</p>
                    <h3 style={{ color: "#f9fafb", marginBottom: "18px" }}>
                        Exposure Guard Checklist
                    </h3>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: "14px"
                        }}
                    >
                        {exposureGuardChecklist.map((item) => (
                            <MiniCheckCard
                                key={item.label}
                                label={item.label}
                                value={item.value}
                                passed={item.passed}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(340px, 0.8fr) minmax(520px, 1.2fr)",
                    gap: "22px",
                    alignItems: "start",
                    marginBottom: "24px"
                }}
            >
                <div style={panelStyle}>
                    <p style={sectionEyebrowStyle}>Kill Switch</p>

                    <div
                        style={{
                            background:
                                killSwitchReady
                                    ? "linear-gradient(135deg, rgba(20, 83, 45, 0.34), rgba(17, 24, 39, 0.96))"
                                    : "linear-gradient(135deg, rgba(127, 29, 29, 0.34), rgba(17, 24, 39, 0.96))",
                            border: `1px solid ${killSwitchColor}`,
                            borderRadius: "22px",
                            padding: "22px",
                            boxShadow: `0 0 32px ${killSwitchColor}22`
                        }}
                    >
                        <p style={{ color: "#9ca3af", marginBottom: "8px" }}>
                            Emergency Stop Readiness
                        </p>

                        <h2
                            style={{
                                color: killSwitchColor,
                                fontSize: "42px",
                                letterSpacing: "-0.04em",
                                marginBottom: "12px"
                            }}
                        >
                            {killSwitchStatus}
                        </h2>

                        <p style={{ color: "#d1d5db", lineHeight: "1.75", fontWeight: "bold" }}>
                            {killSwitchSummary}
                        </p>
                    </div>
                </div>

                <div style={panelStyle}>
                    <p style={sectionEyebrowStyle}>Kill Switch Checklist</p>
                    <h3 style={{ color: "#f9fafb", marginBottom: "18px" }}>
                        Emergency Stop Readiness Checklist
                    </h3>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: "14px"
                        }}
                    >
                        {killSwitchChecklist.map((item) => (
                            <div
                                key={item.label}
                                style={{
                                    backgroundColor: "#0b1220",
                                    border: item.passed
                                        ? "1px solid rgba(134, 239, 172, 0.32)"
                                        : "1px solid rgba(248, 113, 113, 0.32)",
                                    borderRadius: "16px",
                                    padding: "15px"
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        gap: "10px",
                                        alignItems: "center",
                                        marginBottom: "10px"
                                    }}
                                >
                                    <p style={{ color: "#d1d5db", fontWeight: "bold" }}>
                                        {item.label}
                                    </p>

                                    <span
                                        style={statusPillStyle(
                                            item.passed ? "#86efac" : "#f87171",
                                            item.passed
                                                ? "rgba(20, 83, 45, 0.42)"
                                                : "rgba(127, 29, 29, 0.42)"
                                        )}
                                    >
                                        {item.passed ? "PASS" : "FAIL"}
                                    </span>
                                </div>

                                <p style={{ color: "#9ca3af", fontSize: "13px", lineHeight: "1.6" }}>
                                    {item.detail}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={panelStyle}>
                <p style={sectionEyebrowStyle}>Alert Center</p>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "16px",
                        flexWrap: "wrap",
                        alignItems: "flex-start",
                        marginBottom: "20px"
                    }}
                >
                    <div>
                        <h3 style={{ color: "#f9fafb", marginBottom: "8px" }}>
                            Operations Alert Center
                        </h3>

                        <p style={{ color: "#9ca3af", lineHeight: "1.7" }}>
                            Centralized alert view for backend, bot runtime, risk gate,
                            daily loss guard, frontend load error, reliability score,
                            exposure guard, kill switch readiness and live readiness gate.
                        </p>
                    </div>

                    <span
                        style={statusPillStyle(
                            incidentColor,
                            incidentSeverity === "NORMAL"
                                ? "rgba(20, 83, 45, 0.42)"
                                : `${incidentColor}22`
                        )}
                    >
                        {incidentSeverity} • {incidentStatus}
                    </span>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, minmax(160px, 1fr))",
                        gap: "16px",
                        marginBottom: "20px"
                    }}
                >
                    <InfoBox
                        label="Active Alerts"
                        value={String(activeAlerts.length)}
                        color={activeAlerts.length > 0 ? "#f87171" : "#86efac"}
                    />

                    <InfoBox
                        label="Critical"
                        value={String(criticalAlerts.length)}
                        color={criticalAlerts.length > 0 ? "#f87171" : "#86efac"}
                    />

                    <InfoBox
                        label="High"
                        value={String(highAlerts.length)}
                        color={highAlerts.length > 0 ? "#fb923c" : "#86efac"}
                    />

                    <InfoBox
                        label="Warning"
                        value={String(warningAlerts.length)}
                        color={warningAlerts.length > 0 ? "#facc15" : "#86efac"}
                    />
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                        gap: "16px"
                    }}
                >
                    {alerts.map((alert) => {
                        const severityColor = getSeverityColor(alert.severity)

                        return (
                            <div
                                key={alert.title}
                                style={{
                                    background: alert.active
                                        ? `linear-gradient(135deg, ${severityColor}1f, rgba(17, 24, 39, 0.96))`
                                        : "linear-gradient(135deg, rgba(20, 83, 45, 0.2), rgba(17, 24, 39, 0.96))",
                                    border: alert.active
                                        ? `1px solid ${severityColor}66`
                                        : "1px solid rgba(134, 239, 172, 0.28)",
                                    borderRadius: "18px",
                                    padding: "16px",
                                    boxShadow: `0 14px 34px ${severityColor}12`
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        gap: "12px",
                                        alignItems: "center",
                                        marginBottom: "12px"
                                    }}
                                >
                                    <p style={{ color: "#d1d5db", fontWeight: "bold" }}>
                                        {alert.title}
                                    </p>

                                    <span
                                        style={statusPillStyle(
                                            severityColor,
                                            getSeverityBackground(alert.severity)
                                        )}
                                    >
                                        {alert.active ? alert.severity : "OK"}
                                    </span>
                                </div>

                                <p
                                    style={{
                                        color: alert.active ? severityColor : "#86efac",
                                        fontWeight: "bold",
                                        marginBottom: "8px",
                                        lineHeight: "1.55"
                                    }}
                                >
                                    {alert.detail}
                                </p>

                                <p style={{ color: "#9ca3af", fontSize: "13px", lineHeight: "1.6" }}>
                                    Action: {alert.operatorAction}
                                </p>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(320px, 0.75fr) minmax(460px, 1.25fr)",
                    gap: "22px",
                    alignItems: "start",
                    marginBottom: "24px"
                }}
            >
                <div style={panelStyle}>
                    <p style={sectionEyebrowStyle}>Incident Response</p>

                    <div
                        style={{
                            background:
                                incidentSeverity === "NORMAL"
                                    ? "linear-gradient(135deg, rgba(20, 83, 45, 0.32), rgba(17, 24, 39, 0.96))"
                                    : `linear-gradient(135deg, ${incidentColor}2b, rgba(17, 24, 39, 0.96))`,
                            border: `1px solid ${incidentColor}`,
                            borderRadius: "20px",
                            padding: "20px",
                            boxShadow: `0 0 30px ${incidentColor}1f`
                        }}
                    >
                        <p style={{ color: "#9ca3af", marginBottom: "8px" }}>
                            Current Incident Level
                        </p>

                        <h2
                            style={{
                                color: incidentColor,
                                fontSize: "42px",
                                marginBottom: "10px",
                                letterSpacing: "-0.04em"
                            }}
                        >
                            {incidentSeverity}
                        </h2>

                        <p style={{ color: "#d1d5db", lineHeight: "1.7", fontWeight: "bold" }}>
                            {incidentSummary}
                        </p>
                    </div>

                    <div style={{ height: "16px" }} />

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: "14px"
                        }}
                    >
                        <InfoBox
                            label="Diagnostics"
                            value={`${diagnosticsScore}/100`}
                            color={diagnosticsScore >= 70 ? "#86efac" : "#f87171"}
                        />

                        <InfoBox
                            label="Reliability"
                            value={`${reliabilityScore}/100`}
                            color={reliabilityScore >= 75 ? "#86efac" : "#facc15"}
                        />
                    </div>
                </div>

                <div style={panelStyle}>
                    <p style={sectionEyebrowStyle}>Operator Action Plan</p>
                    <h3 style={{ color: "#f9fafb", marginBottom: "18px" }}>
                        Next Operator Actions
                    </h3>

                    <div style={{ display: "grid", gap: "12px" }}>
                        {operatorActions.map((action, index) => (
                            <div
                                key={`${action}-${index}`}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "36px 1fr",
                                    gap: "12px",
                                    alignItems: "start",
                                    backgroundColor: "#0b1220",
                                    border: "1px solid #1f2937",
                                    borderRadius: "16px",
                                    padding: "14px"
                                }}
                            >
                                <div
                                    style={{
                                        width: "30px",
                                        height: "30px",
                                        borderRadius: "999px",
                                        backgroundColor: `${incidentColor}22`,
                                        border: `1px solid ${incidentColor}`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: incidentColor,
                                        fontWeight: "bold",
                                        fontSize: "12px"
                                    }}
                                >
                                    {index + 1}
                                </div>

                                <p style={{ color: "#d1d5db", lineHeight: "1.65", fontWeight: "bold" }}>
                                    {action}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={panelStyle}>
                <p style={sectionEyebrowStyle}>Runbook Checklist</p>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "16px",
                        flexWrap: "wrap",
                        alignItems: "flex-start",
                        marginBottom: "20px"
                    }}
                >
                    <div>
                        <h3 style={{ color: "#f9fafb", marginBottom: "8px" }}>
                            Trading Operations Runbook
                        </h3>

                        <p style={{ color: "#9ca3af", lineHeight: "1.7" }}>
                            Step-by-step checklist before allowing trading operations,
                            deployment updates, or incident recovery.
                        </p>
                    </div>

                    <span
                        style={statusPillStyle(
                            runbookScore >= 80 ? "#86efac" : runbookScore >= 60 ? "#facc15" : "#f87171",
                            runbookScore >= 80
                                ? "rgba(20, 83, 45, 0.42)"
                                : runbookScore >= 60
                                    ? "rgba(113, 63, 18, 0.42)"
                                    : "rgba(127, 29, 29, 0.42)"
                        )}
                    >
                        RUNBOOK {runbookScore}/100
                    </span>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                        gap: "16px"
                    }}
                >
                    {runbookChecklist.map((item) => (
                        <div
                            key={item.label}
                            style={{
                                ...cardStyle,
                                border: item.passed
                                    ? "1px solid rgba(134, 239, 172, 0.32)"
                                    : "1px solid rgba(248, 113, 113, 0.32)"
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: "12px",
                                    alignItems: "center",
                                    marginBottom: "10px"
                                }}
                            >
                                <p style={{ color: "#d1d5db", fontWeight: "bold" }}>
                                    {item.label}
                                </p>

                                <span
                                    style={statusPillStyle(
                                        item.passed ? "#86efac" : "#f87171",
                                        item.passed
                                            ? "rgba(20, 83, 45, 0.42)"
                                            : "rgba(127, 29, 29, 0.42)"
                                    )}
                                >
                                    {item.passed ? "PASS" : "FAIL"}
                                </span>
                            </div>

                            <p style={{ color: "#9ca3af", fontSize: "13px", lineHeight: "1.6" }}>
                                {item.detail}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}

export default OperationsPanel