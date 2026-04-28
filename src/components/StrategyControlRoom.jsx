import { useState } from "react"
import ExecutionControlPanel from "./ExecutionControlPanel"

function StrategyControlRoom({
    backendHealth = {},
    botStatus = "-",
    riskData = {},
    sessionMode = "MONITORING",
    operatorAcknowledged = false,
    tradeOpsPermission = false,
    liveReadinessGate = false,
    exposureLevel = "FLAT",
    positionUsagePercent = 0,
    dailyLossUsagePercent = 0,
    remainingSlots = 0,
    diagnosticsScore = 0,
    reliabilityScore = 0
}) {
    const [selectedStrategy, setSelectedStrategy] = useState("TREND BREAKOUT")
    const [aiApprovalMode, setAiApprovalMode] = useState("REVIEW")
    const [humanApproved, setHumanApproved] = useState(false)

    const strategies = [
        {
            name: "TREND BREAKOUT",
            style: "Trend-following",
            description: "เหมาะกับตลาดมี momentum ชัด ใช้ breakout + ATR + risk control",
            minReliability: 75,
            maxExposureUsage: 80,
            maxDailyLossUsage: 80,
            preferredSession: "LIVE READY",
            color: "#86efac"
        },
        {
            name: "MEAN REVERSION",
            style: "Counter-trend",
            description: "เหมาะกับตลาด sideway ต้องคุม position size และ stop loss เข้มกว่า",
            minReliability: 80,
            maxExposureUsage: 60,
            maxDailyLossUsage: 65,
            preferredSession: "PRE-TRADE",
            color: "#38bdf8"
        },
        {
            name: "SCALP CONTROL",
            style: "Short-term execution",
            description: "เหมาะกับจังหวะสั้น แต่ต้องการ backend, kill switch และ latency ที่พร้อมมาก",
            minReliability: 90,
            maxExposureUsage: 50,
            maxDailyLossUsage: 50,
            preferredSession: "LIVE READY",
            color: "#facc15"
        },
        {
            name: "LOCKDOWN MODE",
            style: "Capital protection",
            description: "ใช้เมื่อระบบเสี่ยงสูง หยุดเพิ่ม exposure และเน้นรักษาทุน",
            minReliability: 0,
            maxExposureUsage: 100,
            maxDailyLossUsage: 100,
            preferredSession: "LOCKDOWN",
            color: "#f87171"
        }
    ]

    const selectedStrategyData =
        strategies.find((strategy) => strategy.name === selectedStrategy) ||
        strategies[0]

    const backendIsHealthy = backendHealth.status === "ok"
    const botIsRunning = (backendHealth.botStatus || botStatus) === "RUNNING"
    const riskGateIsClear = (backendHealth.riskStatus || riskData.riskStatus) === "OK"
    const dailyLossIsClear =
        (backendHealth.dailyLossStatus || riskData.dailyLossStatus) === "OK"

    const reliabilityPass =
        reliabilityScore >= selectedStrategyData.minReliability

    const exposurePass =
        Number(positionUsagePercent || 0) <= selectedStrategyData.maxExposureUsage

    const dailyLossPass =
        Number(dailyLossUsagePercent || 0) <= selectedStrategyData.maxDailyLossUsage

    const slotPass = Number(remainingSlots || 0) > 0

    const sessionPass =
        selectedStrategy === "LOCKDOWN MODE"
            ? sessionMode === "LOCKDOWN"
            : sessionMode === selectedStrategyData.preferredSession

    const aiApprovalPass = aiApprovalMode === "APPROVED"
    const humanApprovalPass = humanApproved

    const strategyChecks = [
        {
            label: "Backend Health",
            passed: backendIsHealthy,
            value: backendIsHealthy ? "OK" : "ERROR",
            detail: "Backend must be healthy before strategy execution."
        },
        {
            label: "Bot Runtime",
            passed: botIsRunning,
            value: backendHealth.botStatus || botStatus,
            detail: "Bot runtime should be active for executable strategies."
        },
        {
            label: "Risk Gate",
            passed: riskGateIsClear,
            value: backendHealth.riskStatus || riskData.riskStatus || "-",
            detail: "Risk engine must allow new exposure."
        },
        {
            label: "Daily Loss Guard",
            passed: dailyLossIsClear,
            value: backendHealth.dailyLossStatus || riskData.dailyLossStatus || "-",
            detail: "Daily loss guard must not be breached."
        },
        {
            label: "Reliability Requirement",
            passed: reliabilityPass,
            value: `${reliabilityScore}/100`,
            detail: `Strategy requires reliability at least ${selectedStrategyData.minReliability}/100.`
        },
        {
            label: "Exposure Limit",
            passed: exposurePass,
            value: `${Number(positionUsagePercent || 0).toFixed(0)}%`,
            detail: `Strategy allows max exposure usage ${selectedStrategyData.maxExposureUsage}%.`
        },
        {
            label: "Daily Loss Usage",
            passed: dailyLossPass,
            value: `${Number(dailyLossUsagePercent || 0).toFixed(0)}%`,
            detail: `Strategy allows max daily loss usage ${selectedStrategyData.maxDailyLossUsage}%.`
        },
        {
            label: "Remaining Slot",
            passed: slotPass || selectedStrategy === "LOCKDOWN MODE",
            value: `${remainingSlots} slot(s)`,
            detail: "A new strategy needs at least one remaining position slot."
        },
        {
            label: "Session Mode",
            passed: sessionPass,
            value: sessionMode,
            detail: `Preferred session for this strategy is ${selectedStrategyData.preferredSession}.`
        },
        {
            label: "AI Approval",
            passed: aiApprovalPass || selectedStrategy === "LOCKDOWN MODE",
            value: aiApprovalMode,
            detail: "AI approval gate must be approved before strategy execution."
        },
        {
            label: "Human Approval",
            passed: humanApprovalPass || selectedStrategy === "LOCKDOWN MODE",
            value: humanApproved ? "APPROVED" : "PENDING",
            detail: "Human operator must approve before enabling the strategy."
        },
        {
            label: "Live Gate",
            passed: liveReadinessGate || selectedStrategy === "LOCKDOWN MODE",
            value: liveReadinessGate ? "OPEN" : "CLOSED",
            detail: "Live readiness gate must be open for executable strategies."
        }
    ]

    const passedChecks = strategyChecks.filter((check) => check.passed).length
    const totalChecks = strategyChecks.length
    const compatibilityScore =
        totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0

    const strategyPermission =
        selectedStrategy === "LOCKDOWN MODE"
            ? "DEFENSIVE MODE"
            : compatibilityScore >= 90 &&
                tradeOpsPermission &&
                liveReadinessGate &&
                operatorAcknowledged &&
                aiApprovalPass &&
                humanApprovalPass
                ? "STRATEGY ALLOWED"
                : "STRATEGY BLOCKED"

    const strategyPermissionColor =
        strategyPermission === "STRATEGY ALLOWED"
            ? "#86efac"
            : strategyPermission === "DEFENSIVE MODE"
                ? "#facc15"
                : "#f87171"

    const strategySummary =
        strategyPermission === "STRATEGY ALLOWED"
            ? "Strategy is compatible with current system state and can be considered for controlled execution."
            : strategyPermission === "DEFENSIVE MODE"
                ? "System is in defensive strategy mode. Focus on capital protection and blocking new exposure."
                : "Strategy is not cleared. Review failed checks, session mode, AI approval, human approval and live gate."

    const aiApprovalOptions = [
        {
            name: "REVIEW",
            description: "AI ยังอยู่ในโหมดตรวจสอบ ไม่อนุมัติ execution",
            color: "#facc15"
        },
        {
            name: "APPROVED",
            description: "AI decision gate อนุมัติ strategy นี้",
            color: "#86efac"
        },
        {
            name: "REJECTED",
            description: "AI decision gate ปฏิเสธ strategy นี้",
            color: "#f87171"
        }
    ]

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

    const progressTrackStyle = {
        width: "100%",
        height: "14px",
        backgroundColor: "#1f2937",
        borderRadius: "999px",
        overflow: "hidden",
        boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.35)"
    }

    return (
        <>
            <div style={panelStyle}>
                <p style={sectionEyebrowStyle}>Strategy Control Room</p>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(340px, 0.8fr) minmax(520px, 1.2fr)",
                        gap: "22px",
                        alignItems: "stretch",
                        marginBottom: "24px"
                    }}
                >
                    <div
                        style={{
                            background:
                                `linear-gradient(135deg, ${selectedStrategyData.color}24, rgba(17, 24, 39, 0.96))`,
                            border: `1px solid ${selectedStrategyData.color}`,
                            borderRadius: "22px",
                            padding: "22px",
                            boxShadow: `0 0 32px ${selectedStrategyData.color}22`
                        }}
                    >
                        <p style={{ color: "#9ca3af", marginBottom: "8px" }}>
                            Selected Strategy
                        </p>

                        <h2
                            style={{
                                color: selectedStrategyData.color,
                                fontSize: "36px",
                                letterSpacing: "-0.04em",
                                marginBottom: "10px"
                            }}
                        >
                            {selectedStrategy}
                        </h2>

                        <p
                            style={{
                                color: "#d1d5db",
                                fontWeight: "bold",
                                marginBottom: "10px"
                            }}
                        >
                            {selectedStrategyData.style}
                        </p>

                        <p style={{ color: "#9ca3af", lineHeight: "1.7", marginBottom: "18px" }}>
                            {selectedStrategyData.description}
                        </p>

                        <div
                            style={{
                                backgroundColor: "#0b1220",
                                border: `1px solid ${strategyPermissionColor}`,
                                borderRadius: "18px",
                                padding: "16px"
                            }}
                        >
                            <p style={{ color: "#9ca3af", marginBottom: "8px" }}>
                                Final Strategy Permission
                            </p>

                            <p
                                style={{
                                    color: strategyPermissionColor,
                                    fontWeight: "bold",
                                    fontSize: "20px",
                                    marginBottom: "8px"
                                }}
                            >
                                {strategyPermission}
                            </p>

                            <p style={{ color: "#d1d5db", lineHeight: "1.65", fontWeight: "bold" }}>
                                {strategySummary}
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
                                    Strategy Selector
                                </h3>

                                <p style={{ color: "#9ca3af", lineHeight: "1.7" }}>
                                    เลือก strategy mode แล้วระบบจะ map เข้ากับ risk, exposure,
                                    reliability, session mode, AI approval และ human approval.
                                </p>
                            </div>

                            <span
                                style={statusPillStyle(
                                    strategyPermissionColor,
                                    `${strategyPermissionColor}22`
                                )}
                            >
                                {strategyPermission}
                            </span>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                                gap: "12px",
                                marginBottom: "18px"
                            }}
                        >
                            {strategies.map((strategy) => {
                                const active = selectedStrategy === strategy.name

                                return (
                                    <button
                                        key={strategy.name}
                                        onClick={() => {
                                            setSelectedStrategy(strategy.name)
                                            setHumanApproved(false)
                                            setAiApprovalMode("REVIEW")
                                        }}
                                        style={{
                                            background: active
                                                ? `linear-gradient(135deg, ${strategy.color}33, rgba(17, 24, 39, 0.96))`
                                                : "linear-gradient(135deg, rgba(31, 41, 55, 0.5), rgba(17, 24, 39, 0.96))",
                                            border: active
                                                ? `1px solid ${strategy.color}`
                                                : "1px solid #374151",
                                            borderRadius: "16px",
                                            padding: "14px",
                                            cursor: "pointer",
                                            textAlign: "left",
                                            color: active ? strategy.color : "#d1d5db",
                                            fontWeight: "bold",
                                            boxShadow: active ? `0 0 22px ${strategy.color}22` : "none"
                                        }}
                                    >
                                        <p style={{ marginBottom: "7px" }}>{strategy.name}</p>

                                        <p
                                            style={{
                                                color: "#9ca3af",
                                                fontSize: "12px",
                                                lineHeight: "1.5",
                                                fontWeight: "normal"
                                            }}
                                        >
                                            {strategy.style}
                                        </p>
                                    </button>
                                )
                            })}
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
                                <span>Compatibility Score</span>
                                <span>{compatibilityScore}/100</span>
                            </div>

                            <div style={progressTrackStyle}>
                                <div
                                    style={{
                                        width: `${compatibilityScore}%`,
                                        height: "100%",
                                        background:
                                            `linear-gradient(90deg, ${strategyPermissionColor}, rgba(255,255,255,0.68))`,
                                        borderRadius: "999px",
                                        boxShadow: `0 0 20px ${strategyPermissionColor}55`
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(320px, 0.8fr) minmax(520px, 1.2fr)",
                        gap: "22px",
                        alignItems: "start",
                        marginBottom: "24px"
                    }}
                >
                    <div style={cardStyle}>
                        <p style={sectionEyebrowStyle}>AI Decision Approval Gate</p>

                        <h3 style={{ color: "#f9fafb", marginBottom: "16px" }}>
                            AI Approval Mode
                        </h3>

                        <div
                            style={{
                                display: "grid",
                                gap: "12px",
                                marginBottom: "18px"
                            }}
                        >
                            {aiApprovalOptions.map((option) => {
                                const active = aiApprovalMode === option.name

                                return (
                                    <button
                                        key={option.name}
                                        onClick={() => setAiApprovalMode(option.name)}
                                        style={{
                                            background: active
                                                ? `linear-gradient(135deg, ${option.color}33, rgba(17, 24, 39, 0.96))`
                                                : "rgba(15, 23, 42, 0.9)",
                                            border: active
                                                ? `1px solid ${option.color}`
                                                : "1px solid #374151",
                                            borderRadius: "16px",
                                            padding: "14px",
                                            cursor: "pointer",
                                            textAlign: "left"
                                        }}
                                    >
                                        <p
                                            style={{
                                                color: active ? option.color : "#d1d5db",
                                                fontWeight: "bold",
                                                marginBottom: "6px"
                                            }}
                                        >
                                            {option.name}
                                        </p>

                                        <p style={{ color: "#9ca3af", fontSize: "13px", lineHeight: "1.5" }}>
                                            {option.description}
                                        </p>
                                    </button>
                                )
                            })}
                        </div>

                        <button
                            onClick={() => setHumanApproved((prev) => !prev)}
                            style={{
                                width: "100%",
                                background: humanApproved
                                    ? "linear-gradient(135deg, #84cc16, #22c55e)"
                                    : "linear-gradient(135deg, #374151, #111827)",
                                color: humanApproved ? "#020617" : "#d1d5db",
                                border: humanApproved
                                    ? "1px solid #86efac"
                                    : "1px solid #4b5563",
                                borderRadius: "16px",
                                padding: "14px",
                                cursor: "pointer",
                                fontWeight: "bold",
                                boxShadow: humanApproved
                                    ? "0 0 24px rgba(134, 239, 172, 0.22)"
                                    : "none"
                            }}
                        >
                            {humanApproved
                                ? "Human Strategy Approval Confirmed"
                                : "Confirm Human Strategy Approval"}
                        </button>
                    </div>

                    <div style={cardStyle}>
                        <p style={sectionEyebrowStyle}>Risk-to-Strategy Mapping</p>

                        <h3 style={{ color: "#f9fafb", marginBottom: "16px" }}>
                            Strategy Requirements
                        </h3>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                                gap: "14px"
                            }}
                        >
                            <MetricBox label="Required Reliability" value={`${selectedStrategyData.minReliability}/100`} color="#86efac" />
                            <MetricBox label="Max Exposure Usage" value={`${selectedStrategyData.maxExposureUsage}%`} color="#facc15" />
                            <MetricBox label="Max Daily Loss Usage" value={`${selectedStrategyData.maxDailyLossUsage}%`} color="#f87171" />
                            <MetricBox label="Preferred Session" value={selectedStrategyData.preferredSession} color="#38bdf8" />
                            <MetricBox label="Current Session" value={sessionMode} color={sessionPass ? "#86efac" : "#f87171"} />
                            <MetricBox label="Exposure Level" value={exposureLevel} color={exposurePass ? "#86efac" : "#f87171"} />
                        </div>
                    </div>
                </div>

                <div style={cardStyle}>
                    <p style={sectionEyebrowStyle}>Strategy Compatibility Checklist</p>

                    <h3 style={{ color: "#f9fafb", marginBottom: "16px" }}>
                        Approval Checklist
                    </h3>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                            gap: "14px"
                        }}
                    >
                        {strategyChecks.map((check) => (
                            <div
                                key={check.label}
                                style={{
                                    backgroundColor: "#0b1220",
                                    border: check.passed
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
                                        {check.label}
                                    </p>

                                    <span
                                        style={statusPillStyle(
                                            check.passed ? "#86efac" : "#f87171",
                                            check.passed
                                                ? "rgba(20, 83, 45, 0.42)"
                                                : "rgba(127, 29, 29, 0.42)"
                                        )}
                                    >
                                        {check.passed ? "PASS" : "FAIL"}
                                    </span>
                                </div>

                                <p
                                    style={{
                                        color: check.passed ? "#86efac" : "#f87171",
                                        fontWeight: "bold",
                                        marginBottom: "8px"
                                    }}
                                >
                                    {check.value}
                                </p>

                                <p style={{ color: "#9ca3af", fontSize: "13px", lineHeight: "1.6" }}>
                                    {check.detail}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <ExecutionControlPanel
                backendHealth={backendHealth}
                riskData={riskData}
                selectedStrategy={selectedStrategy}
                strategyPermission={strategyPermission}
                compatibilityScore={compatibilityScore}
                tradeOpsPermission={tradeOpsPermission}
                liveReadinessGate={liveReadinessGate}
                exposureLevel={exposureLevel}
                remainingSlots={remainingSlots}
                reliabilityScore={reliabilityScore}
                sessionMode={sessionMode}
            />
        </>
    )
}

function MetricBox({ label, value, color = "#d1d5db" }) {
    return (
        <div
            style={{
                backgroundColor: "#0b1220",
                border: "1px solid #1f2937",
                borderRadius: "14px",
                padding: "16px"
            }}
        >
            <p style={{ color: "#9ca3af", marginBottom: "8px", fontSize: "13px" }}>
                {label}
            </p>

            <p style={{ color, fontWeight: "bold" }}>{value}</p>
        </div>
    )
}

export default StrategyControlRoom