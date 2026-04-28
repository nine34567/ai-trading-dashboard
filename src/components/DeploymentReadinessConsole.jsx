import { useState } from "react"
import SystemArchitectureSummary from "./SystemArchitectureSummary"

function DeploymentReadinessConsole({
    backendHealth = {},
    selectedStrategy = "-",
    strategyPermission = "STRATEGY BLOCKED",
    compatibilityScore = 0,
    tradeOpsPermission = false,
    liveReadinessGate = false,
    finalOrderPermission = false,
    finalPortfolioPermission = false,
    portfolioScore = 0,
    portfolioHealthScore = 0,
    riskModel = "BALANCED",
    portfolioStatus = "PORTFOLIO GATE CLOSED",
    exposureLevel = "FLAT",
    reliabilityScore = 0,
    orderReadinessScore = 0,
    sessionMode = "MONITORING"
}) {
    const [releaseChannel, setReleaseChannel] = useState("LOCAL")
    const [frontendBuildPassed, setFrontendBuildPassed] = useState(false)
    const [backendCompilePassed, setBackendCompilePassed] = useState(false)
    const [smokeTestPassed, setSmokeTestPassed] = useState(false)
    const [rollbackPlanConfirmed, setRollbackPlanConfirmed] = useState(false)
    const [operatorReleaseApproved, setOperatorReleaseApproved] = useState(false)

    const backendOk = backendHealth.status === "ok"
    const riskOk = backendHealth.riskStatus === "OK"
    const dailyLossOk = backendHealth.dailyLossStatus === "OK"
    const botRunning = backendHealth.botStatus === "RUNNING"

    const releaseChannels = [
        {
            name: "LOCAL",
            description: "ทดสอบในเครื่องเท่านั้น ยังไม่ deploy จริง",
            minScore: 60,
            color: "#38bdf8"
        },
        {
            name: "PREVIEW",
            description: "เหมาะกับ Vercel Preview / branch preview สำหรับตรวจ UI และ flow",
            minScore: 75,
            color: "#facc15"
        },
        {
            name: "STAGING",
            description: "เหมาะกับ staging environment ก่อน production",
            minScore: 85,
            color: "#86efac"
        },
        {
            name: "PRODUCTION",
            description: "deploy จริง ต้องผ่าน gate เข้มที่สุด",
            minScore: 95,
            color: "#f87171"
        }
    ]

    const activeReleaseChannel =
        releaseChannels.find((channel) => channel.name === releaseChannel) ||
        releaseChannels[0]

    const releaseChecks = [
        {
            label: "Frontend Build",
            passed: frontendBuildPassed,
            value: frontendBuildPassed ? "PASSED" : "PENDING",
            detail: "Run npm run build and confirm Vite build passes."
        },
        {
            label: "Backend Compile",
            passed: backendCompilePassed,
            value: backendCompilePassed ? "PASSED" : "PENDING",
            detail: "Run python -m py_compile backend/main.py."
        },
        {
            label: "Backend Health",
            passed: backendOk,
            value: backendHealth.status || "-",
            detail: "Backend health endpoint should return ok."
        },
        {
            label: "Bot Runtime",
            passed: botRunning,
            value: backendHealth.botStatus || "-",
            detail: "Bot runtime should be visible and consistent."
        },
        {
            label: "Risk Gate",
            passed: riskOk,
            value: backendHealth.riskStatus || "-",
            detail: "Risk gate should be OK before release validation."
        },
        {
            label: "Daily Loss Guard",
            passed: dailyLossOk,
            value: backendHealth.dailyLossStatus || "-",
            detail: "Daily loss guard should not be breached."
        },
        {
            label: "Operations Layer",
            passed: tradeOpsPermission,
            value: tradeOpsPermission ? "OPS CLEAR" : "OPS BLOCKED",
            detail: "Trading operations layer should be clear."
        },
        {
            label: "Live Readiness Gate",
            passed: liveReadinessGate,
            value: liveReadinessGate ? "OPEN" : "CLOSED",
            detail: "Live readiness gate should be open for full production confidence."
        },
        {
            label: "Strategy Permission",
            passed: strategyPermission === "STRATEGY ALLOWED" || selectedStrategy === "LOCKDOWN MODE",
            value: strategyPermission,
            detail: "Strategy gate should be explainable before release."
        },
        {
            label: "Execution Simulation",
            passed: finalOrderPermission,
            value: finalOrderPermission ? "APPROVED" : "BLOCKED",
            detail: "Simulated order gate should be approved for end-to-end release readiness."
        },
        {
            label: "Portfolio Gate",
            passed: finalPortfolioPermission,
            value: portfolioStatus,
            detail: "Portfolio risk gate should be open or intentionally blocked in defensive mode."
        },
        {
            label: "Reliability Score",
            passed: reliabilityScore >= activeReleaseChannel.minScore,
            value: `${reliabilityScore}/100`,
            detail: `Release channel requires reliability at least ${activeReleaseChannel.minScore}/100.`
        },
        {
            label: "Smoke Test",
            passed: smokeTestPassed,
            value: smokeTestPassed ? "PASSED" : "PENDING",
            detail: "Open dashboard, System Diagnostics, Settings, History and verify no blank screen."
        },
        {
            label: "Rollback Plan",
            passed: rollbackPlanConfirmed,
            value: rollbackPlanConfirmed ? "CONFIRMED" : "PENDING",
            detail: "Rollback plan should be known before deployment."
        },
        {
            label: "Operator Approval",
            passed: operatorReleaseApproved,
            value: operatorReleaseApproved ? "APPROVED" : "PENDING",
            detail: "Human operator must approve release."
        }
    ]

    const passedReleaseChecks = releaseChecks.filter((check) => check.passed).length
    const totalReleaseChecks = releaseChecks.length

    const releaseGateScore =
        totalReleaseChecks > 0
            ? Math.round((passedReleaseChecks / totalReleaseChecks) * 100)
            : 0

    const deploymentCompositeScore = Math.round(
        releaseGateScore * 0.3 +
        reliabilityScore * 0.2 +
        compatibilityScore * 0.12 +
        orderReadinessScore * 0.12 +
        portfolioScore * 0.13 +
        portfolioHealthScore * 0.13
    )

    const finalReleasePermission =
        deploymentCompositeScore >= activeReleaseChannel.minScore &&
        frontendBuildPassed &&
        backendCompilePassed &&
        smokeTestPassed &&
        rollbackPlanConfirmed &&
        operatorReleaseApproved &&
        backendOk

    const releaseStatus = finalReleasePermission
        ? "RELEASE GATE OPEN"
        : "RELEASE GATE CLOSED"

    const releaseColor = finalReleasePermission ? "#86efac" : "#f87171"

    const releaseSummary = finalReleasePermission
        ? "Deployment gate is open. Build, backend compile, smoke test, rollback plan and operator approval are aligned."
        : "Deployment gate is closed. Complete build checks, smoke test, rollback plan and operator approval before release."

    const smokeTestMatrix = [
        {
            area: "Dashboard",
            expected: "Main dashboard renders with live cards and no blank screen.",
            passed: frontendBuildPassed && backendOk
        },
        {
            area: "System Diagnostics",
            expected: "Diagnostics, operations, strategy, execution, portfolio and observability panels render.",
            passed: frontendBuildPassed
        },
        {
            area: "Settings",
            expected: "Settings page opens and backend health monitor is visible.",
            passed: frontendBuildPassed && backendOk
        },
        {
            area: "History",
            expected: "History table renders and export/clear controls are visible.",
            passed: frontendBuildPassed
        },
        {
            area: "Backend API",
            expected: "/api/health and /api/dashboard return valid JSON.",
            passed: backendOk
        },
        {
            area: "Emergency Stop Path",
            expected: "Emergency stop control path remains reachable from frontend to backend.",
            passed: backendOk
        }
    ]

    const rollbackSteps = [
        "Do not commit/push until local build passes.",
        "If deployment breaks UI, revert the last commit or redeploy previous Vercel deployment.",
        "If backend fails, keep frontend in mock mode or restore previous backend/main.py.",
        "If diagnostics page crashes, remove the last imported component and rebuild.",
        "After rollback, re-run npm run build and python -m py_compile backend/main.py."
    ]

    const releaseRiskLevel =
        releaseChannel === "PRODUCTION" && deploymentCompositeScore < 95
            ? "HIGH"
            : releaseChannel === "STAGING" && deploymentCompositeScore < 85
                ? "MEDIUM"
                : finalReleasePermission
                    ? "LOW"
                    : "WATCH"

    const releaseRiskColor =
        releaseRiskLevel === "LOW"
            ? "#86efac"
            : releaseRiskLevel === "WATCH"
                ? "#facc15"
                : releaseRiskLevel === "MEDIUM"
                    ? "#fb923c"
                    : "#f87171"

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

    const MetricBox = ({ label, value, color = "#d1d5db" }) => (
        <div style={cardStyle}>
            <p style={{ color: "#9ca3af", marginBottom: "8px", fontSize: "13px" }}>
                {label}
            </p>

            <p style={{ color, fontWeight: "bold" }}>{value}</p>
        </div>
    )

    const ToggleButton = ({ active, onClick, activeText, inactiveText }) => (
        <button
            onClick={onClick}
            style={{
                width: "100%",
                background: active
                    ? "linear-gradient(135deg, #84cc16, #22c55e)"
                    : "linear-gradient(135deg, #374151, #111827)",
                color: active ? "#020617" : "#d1d5db",
                border: active ? "1px solid #86efac" : "1px solid #4b5563",
                borderRadius: "16px",
                padding: "14px",
                cursor: "pointer",
                fontWeight: "bold",
                boxShadow: active ? "0 0 24px rgba(134, 239, 172, 0.22)" : "none"
            }}
        >
            {active ? activeText : inactiveText}
        </button>
    )

    return (
        <div style={panelStyle}>
            <p style={sectionEyebrowStyle}>Deployment Readiness</p>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(340px, 0.8fr) minmax(540px, 1.2fr)",
                    gap: "22px",
                    alignItems: "stretch",
                    marginBottom: "24px"
                }}
            >
                <div
                    style={{
                        background: finalReleasePermission
                            ? "linear-gradient(135deg, rgba(20, 83, 45, 0.34), rgba(17, 24, 39, 0.96))"
                            : "linear-gradient(135deg, rgba(127, 29, 29, 0.34), rgba(17, 24, 39, 0.96))",
                        border: `1px solid ${releaseColor}`,
                        borderRadius: "22px",
                        padding: "22px",
                        boxShadow: `0 0 32px ${releaseColor}22`
                    }}
                >
                    <p style={{ color: "#9ca3af", marginBottom: "8px" }}>
                        Final Release Permission
                    </p>

                    <h2
                        style={{
                            color: releaseColor,
                            fontSize: "38px",
                            letterSpacing: "-0.04em",
                            marginBottom: "12px"
                        }}
                    >
                        {releaseStatus}
                    </h2>

                    <p
                        style={{
                            color: "#d1d5db",
                            lineHeight: "1.75",
                            fontWeight: "bold",
                            marginBottom: "18px"
                        }}
                    >
                        {releaseSummary}
                    </p>

                    <div style={progressTrackStyle}>
                        <div
                            style={{
                                width: `${deploymentCompositeScore}%`,
                                height: "100%",
                                background: `linear-gradient(90deg, ${releaseColor}, rgba(255,255,255,0.68))`,
                                borderRadius: "999px",
                                boxShadow: `0 0 20px ${releaseColor}55`
                            }}
                        />
                    </div>

                    <p style={{ color: "#9ca3af", marginTop: "10px", fontSize: "13px" }}>
                        Deployment Composite Score: {deploymentCompositeScore}/100
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
                                Release Channel Selector
                            </h3>

                            <p style={{ color: "#9ca3af", lineHeight: "1.7" }}>
                                เลือก release channel เพื่อกำหนดความเข้มของ release gate.
                            </p>
                        </div>

                        <span
                            style={statusPillStyle(
                                activeReleaseChannel.color,
                                `${activeReleaseChannel.color}22`
                            )}
                        >
                            {releaseChannel}
                        </span>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                            gap: "12px"
                        }}
                    >
                        {releaseChannels.map((channel) => {
                            const active = releaseChannel === channel.name

                            return (
                                <button
                                    key={channel.name}
                                    onClick={() => {
                                        setReleaseChannel(channel.name)
                                        setOperatorReleaseApproved(false)
                                    }}
                                    style={{
                                        background: active
                                            ? `linear-gradient(135deg, ${channel.color}33, rgba(17, 24, 39, 0.96))`
                                            : "linear-gradient(135deg, rgba(31, 41, 55, 0.5), rgba(17, 24, 39, 0.96))",
                                        border: active
                                            ? `1px solid ${channel.color}`
                                            : "1px solid #374151",
                                        borderRadius: "16px",
                                        padding: "14px",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        color: active ? channel.color : "#d1d5db",
                                        fontWeight: "bold",
                                        boxShadow: active ? `0 0 22px ${channel.color}22` : "none"
                                    }}
                                >
                                    <p style={{ marginBottom: "7px" }}>{channel.name}</p>

                                    <p
                                        style={{
                                            color: "#9ca3af",
                                            fontSize: "12px",
                                            lineHeight: "1.5",
                                            fontWeight: "normal"
                                        }}
                                    >
                                        {channel.description}
                                    </p>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "14px",
                    marginBottom: "24px"
                }}
            >
                <MetricBox
                    label="Release Gate"
                    value={`${releaseGateScore}/100`}
                    color={releaseGateScore >= activeReleaseChannel.minScore ? "#86efac" : "#f87171"}
                />

                <MetricBox
                    label="Required Score"
                    value={`${activeReleaseChannel.minScore}/100`}
                    color={activeReleaseChannel.color}
                />

                <MetricBox
                    label="Release Risk"
                    value={releaseRiskLevel}
                    color={releaseRiskColor}
                />

                <MetricBox
                    label="Reliability"
                    value={`${reliabilityScore}/100`}
                    color={reliabilityScore >= activeReleaseChannel.minScore ? "#86efac" : "#f87171"}
                />

                <MetricBox
                    label="Compatibility"
                    value={`${compatibilityScore}/100`}
                    color={compatibilityScore >= 80 ? "#86efac" : "#facc15"}
                />

                <MetricBox
                    label="Order Readiness"
                    value={`${orderReadinessScore}/100`}
                    color={orderReadinessScore >= 90 ? "#86efac" : "#f87171"}
                />

                <MetricBox
                    label="Portfolio Score"
                    value={`${portfolioScore}/100`}
                    color={portfolioScore >= 80 ? "#86efac" : "#facc15"}
                />

                <MetricBox
                    label="Portfolio Health"
                    value={`${portfolioHealthScore}/100`}
                    color={portfolioHealthScore >= 80 ? "#86efac" : "#facc15"}
                />

                <MetricBox label="Strategy" value={selectedStrategy} color="#38bdf8" />
                <MetricBox label="Risk Model" value={riskModel} color="#facc15" />
                <MetricBox label="Session" value={sessionMode} color={sessionMode === "LIVE READY" ? "#86efac" : "#facc15"} />
                <MetricBox label="Exposure" value={exposureLevel} color={exposureLevel === "FULL" ? "#f87171" : "#86efac"} />
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(360px, 0.8fr) minmax(540px, 1.2fr)",
                    gap: "22px",
                    alignItems: "start",
                    marginBottom: "24px"
                }}
            >
                <div style={cardStyle}>
                    <p style={sectionEyebrowStyle}>Manual Release Checks</p>

                    <h3 style={{ color: "#f9fafb", marginBottom: "16px" }}>
                        CI/CD Operator Toggles
                    </h3>

                    <div style={{ display: "grid", gap: "12px" }}>
                        <ToggleButton
                            active={frontendBuildPassed}
                            onClick={() => setFrontendBuildPassed((prev) => !prev)}
                            activeText="Frontend Build Passed"
                            inactiveText="Mark Frontend Build Passed"
                        />

                        <ToggleButton
                            active={backendCompilePassed}
                            onClick={() => setBackendCompilePassed((prev) => !prev)}
                            activeText="Backend Compile Passed"
                            inactiveText="Mark Backend Compile Passed"
                        />

                        <ToggleButton
                            active={smokeTestPassed}
                            onClick={() => setSmokeTestPassed((prev) => !prev)}
                            activeText="Smoke Test Passed"
                            inactiveText="Mark Smoke Test Passed"
                        />

                        <ToggleButton
                            active={rollbackPlanConfirmed}
                            onClick={() => setRollbackPlanConfirmed((prev) => !prev)}
                            activeText="Rollback Plan Confirmed"
                            inactiveText="Confirm Rollback Plan"
                        />

                        <ToggleButton
                            active={operatorReleaseApproved}
                            onClick={() => setOperatorReleaseApproved((prev) => !prev)}
                            activeText="Operator Release Approved"
                            inactiveText="Approve Release"
                        />
                    </div>
                </div>

                <div style={cardStyle}>
                    <p style={sectionEyebrowStyle}>Smoke Test Matrix</p>

                    <h3 style={{ color: "#f9fafb", marginBottom: "16px" }}>
                        Post-build Smoke Coverage
                    </h3>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: "14px"
                        }}
                    >
                        {smokeTestMatrix.map((item) => (
                            <div
                                key={item.area}
                                style={{
                                    backgroundColor: "#020617",
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
                                        {item.area}
                                    </p>

                                    <span
                                        style={statusPillStyle(
                                            item.passed ? "#86efac" : "#f87171",
                                            item.passed
                                                ? "rgba(20, 83, 45, 0.42)"
                                                : "rgba(127, 29, 29, 0.42)"
                                        )}
                                    >
                                        {item.passed ? "PASS" : "CHECK"}
                                    </span>
                                </div>

                                <p style={{ color: "#9ca3af", fontSize: "13px", lineHeight: "1.6" }}>
                                    {item.expected}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(420px, 1fr) minmax(420px, 1fr)",
                    gap: "22px",
                    alignItems: "start",
                    marginBottom: "24px"
                }}
            >
                <div style={cardStyle}>
                    <p style={sectionEyebrowStyle}>Release Checklist</p>

                    <h3 style={{ color: "#f9fafb", marginBottom: "16px" }}>
                        Deployment Readiness Checklist
                    </h3>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                            gap: "14px"
                        }}
                    >
                        {releaseChecks.map((check) => (
                            <div
                                key={check.label}
                                style={{
                                    backgroundColor: "#020617",
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

                <div style={cardStyle}>
                    <p style={sectionEyebrowStyle}>Rollback Plan</p>

                    <h3 style={{ color: "#f9fafb", marginBottom: "16px" }}>
                        Emergency Rollback Steps
                    </h3>

                    <div style={{ display: "grid", gap: "12px" }}>
                        {rollbackSteps.map((step, index) => (
                            <div
                                key={step}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "34px 1fr",
                                    gap: "12px",
                                    alignItems: "start",
                                    backgroundColor: "#020617",
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
                                        backgroundColor: "rgba(248, 113, 113, 0.16)",
                                        border: "1px solid #f87171",
                                        color: "#f87171",
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
                                    {step}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <SystemArchitectureSummary
                backendHealth={backendHealth}
                releaseChannel={releaseChannel}
                releaseStatus={releaseStatus}
                deploymentCompositeScore={deploymentCompositeScore}
                releaseGateScore={releaseGateScore}
                releaseRiskLevel={releaseRiskLevel}
                selectedStrategy={selectedStrategy}
                strategyPermission={strategyPermission}
                riskModel={riskModel}
                sessionMode={sessionMode}
                exposureLevel={exposureLevel}
                reliabilityScore={reliabilityScore}
                compatibilityScore={compatibilityScore}
                orderReadinessScore={orderReadinessScore}
                portfolioScore={portfolioScore}
                portfolioHealthScore={portfolioHealthScore}
                finalReleasePermission={finalReleasePermission}
                finalPortfolioPermission={finalPortfolioPermission}
                liveReadinessGate={liveReadinessGate}
                tradeOpsPermission={tradeOpsPermission}
            />
        </div>
    )
}

export default DeploymentReadinessConsole