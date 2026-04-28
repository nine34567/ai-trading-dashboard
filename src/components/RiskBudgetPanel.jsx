import { useState } from "react"
import ObservabilityConsole from "./ObservabilityConsole"

function RiskBudgetPanel({
    backendHealth = {},
    riskData = {},
    selectedStrategy = "-",
    strategyPermission = "STRATEGY BLOCKED",
    compatibilityScore = 0,
    tradeOpsPermission = false,
    liveReadinessGate = false,
    finalOrderPermission = false,
    exposureLevel = "FLAT",
    remainingSlots = 0,
    reliabilityScore = 0,
    orderReadinessScore = 0,
    orderDraft = {},
    estimatedRiskUnit = 0,
    estimatedRewardUnit = 0,
    rewardRiskRatio = 0,
    sessionMode = "MONITORING"
}) {
    const [riskModel, setRiskModel] = useState("BALANCED")

    const parseMoney = (value) => {
        const cleanedValue = String(value || "0")
            .replace("$", "")
            .replace("+", "")
            .replace(",", "")
            .trim()

        const parsedValue = Number(cleanedValue)

        return Number.isNaN(parsedValue) ? 0 : parsedValue
    }

    const parsePercent = (value) => {
        const cleanedValue = String(value || "0")
            .replace("%", "")
            .replace(",", "")
            .trim()

        const parsedValue = Number(cleanedValue)

        return Number.isNaN(parsedValue) ? 0 : parsedValue
    }

    const clampPercent = (value) => {
        return Math.min(Math.max(Number(value) || 0, 0), 100)
    }

    const riskModels = [
        {
            name: "CAPITAL PROTECTION",
            description: "เน้นรักษาทุน จำกัด allocation ต่อ strategy และไม่เร่งเพิ่ม exposure",
            maxStrategyBudgetPct: 25,
            maxPortfolioExposurePct: 35,
            minReliability: 85,
            minOrderReadiness: 95,
            color: "#38bdf8"
        },
        {
            name: "BALANCED",
            description: "สมดุลระหว่างโอกาสกับความเสี่ยง เหมาะกับ paper / demo operation",
            maxStrategyBudgetPct: 40,
            maxPortfolioExposurePct: 55,
            minReliability: 75,
            minOrderReadiness: 90,
            color: "#86efac"
        },
        {
            name: "GROWTH",
            description: "เปิด risk budget มากขึ้น แต่ต้องการ reliability และ order readiness สูง",
            maxStrategyBudgetPct: 55,
            maxPortfolioExposurePct: 70,
            minReliability: 85,
            minOrderReadiness: 95,
            color: "#facc15"
        },
        {
            name: "LOCKDOWN",
            description: "ปิดการเพิ่ม risk ใหม่ ใช้เมื่อต้องการปกป้องทุนหรือระบบยังไม่พร้อม",
            maxStrategyBudgetPct: 0,
            maxPortfolioExposurePct: 0,
            minReliability: 0,
            minOrderReadiness: 0,
            color: "#f87171"
        }
    ]

    const activeRiskModel =
        riskModels.find((model) => model.name === riskModel) || riskModels[1]

    const maxDailyLoss = parseMoney(riskData.maxDailyLoss)
    const currentDailyLoss = parseMoney(riskData.currentDailyLoss)
    const riskPerTradePct = parsePercent(riskData.riskPerTrade)
    const maxOpenPositions = Number(riskData.maxOpenPositions || 0)

    const remainingDailyRiskBudget = Math.max(maxDailyLoss - currentDailyLoss, 0)
    const dailyLossUsagePercent =
        maxDailyLoss > 0 ? clampPercent((currentDailyLoss / maxDailyLoss) * 100) : 0

    const strategyBudgetLimit =
        maxDailyLoss > 0
            ? maxDailyLoss * (activeRiskModel.maxStrategyBudgetPct / 100)
            : 0

    const draftRiskToDailyBudgetPercent =
        maxDailyLoss > 0
            ? clampPercent((estimatedRiskUnit / maxDailyLoss) * 100)
            : 0

    const draftRiskToStrategyBudgetPercent =
        strategyBudgetLimit > 0
            ? clampPercent((estimatedRiskUnit / strategyBudgetLimit) * 100)
            : 0

    const slotUsagePercent =
        maxOpenPositions > 0
            ? clampPercent(((maxOpenPositions - remainingSlots) / maxOpenPositions) * 100)
            : 0

    const budgetAfterDraft = Math.max(remainingDailyRiskBudget - estimatedRiskUnit, 0)

    const strategyAllocations = [
        {
            label: "Trend Breakout",
            allocation:
                riskModel === "CAPITAL PROTECTION"
                    ? 35
                    : riskModel === "BALANCED"
                        ? 45
                        : riskModel === "GROWTH"
                            ? 55
                            : 0,
            active: selectedStrategy === "TREND BREAKOUT",
            color: "#86efac"
        },
        {
            label: "Mean Reversion",
            allocation:
                riskModel === "CAPITAL PROTECTION"
                    ? 20
                    : riskModel === "BALANCED"
                        ? 25
                        : riskModel === "GROWTH"
                            ? 20
                            : 0,
            active: selectedStrategy === "MEAN REVERSION",
            color: "#38bdf8"
        },
        {
            label: "Scalp Control",
            allocation:
                riskModel === "CAPITAL PROTECTION"
                    ? 10
                    : riskModel === "BALANCED"
                        ? 15
                        : riskModel === "GROWTH"
                            ? 20
                            : 0,
            active: selectedStrategy === "SCALP CONTROL",
            color: "#facc15"
        },
        {
            label: "Cash / Defensive",
            allocation:
                riskModel === "CAPITAL PROTECTION"
                    ? 35
                    : riskModel === "BALANCED"
                        ? 15
                        : riskModel === "GROWTH"
                            ? 5
                            : 100,
            active: selectedStrategy === "LOCKDOWN MODE",
            color: "#f87171"
        }
    ]

    const selectedAllocation =
        strategyAllocations.find((item) => item.active) || strategyAllocations[0]

    const allocationPass =
        selectedAllocation.allocation <= activeRiskModel.maxStrategyBudgetPct ||
        selectedStrategy === "LOCKDOWN MODE"

    const dailyBudgetPass = remainingDailyRiskBudget > 0
    const draftBudgetPass =
        riskModel === "LOCKDOWN"
            ? false
            : estimatedRiskUnit <= strategyBudgetLimit && estimatedRiskUnit <= remainingDailyRiskBudget

    const portfolioExposurePass =
        riskModel === "LOCKDOWN"
            ? false
            : slotUsagePercent <= activeRiskModel.maxPortfolioExposurePct

    const reliabilityPass = reliabilityScore >= activeRiskModel.minReliability
    const orderReadinessPass = orderReadinessScore >= activeRiskModel.minOrderReadiness
    const strategyPass = strategyPermission === "STRATEGY ALLOWED"
    const orderPass = finalOrderPermission
    const liveGatePass = liveReadinessGate
    const opsPass = tradeOpsPermission

    const portfolioChecks = [
        {
            label: "Risk Model",
            passed: riskModel !== "LOCKDOWN",
            value: riskModel,
            detail: "Risk model must allow new risk before allocation."
        },
        {
            label: "Daily Risk Budget",
            passed: dailyBudgetPass,
            value: `$${remainingDailyRiskBudget.toFixed(2)} left`,
            detail: "There must be remaining daily risk budget."
        },
        {
            label: "Draft Risk Budget",
            passed: draftBudgetPass,
            value: `${draftRiskToStrategyBudgetPercent.toFixed(0)}% of strategy budget`,
            detail: "Draft order risk must fit inside strategy budget."
        },
        {
            label: "Portfolio Exposure",
            passed: portfolioExposurePass,
            value: `${slotUsagePercent.toFixed(0)}% used`,
            detail: "Current exposure must stay inside portfolio exposure limit."
        },
        {
            label: "Strategy Allocation",
            passed: allocationPass,
            value: `${selectedAllocation.allocation}%`,
            detail: "Selected strategy allocation must fit risk model."
        },
        {
            label: "Reliability Requirement",
            passed: reliabilityPass,
            value: `${reliabilityScore}/100`,
            detail: `Risk model requires reliability at least ${activeRiskModel.minReliability}/100.`
        },
        {
            label: "Order Readiness",
            passed: orderReadinessPass,
            value: `${orderReadinessScore}/100`,
            detail: `Risk model requires order readiness at least ${activeRiskModel.minOrderReadiness}/100.`
        },
        {
            label: "Strategy Permission",
            passed: strategyPass || selectedStrategy === "LOCKDOWN MODE",
            value: strategyPermission,
            detail: "Strategy layer must allow execution intent."
        },
        {
            label: "Execution Permission",
            passed: orderPass,
            value: finalOrderPermission ? "APPROVED" : "BLOCKED",
            detail: "Order simulation must be approved before portfolio allocation."
        },
        {
            label: "Live Gate",
            passed: liveGatePass,
            value: liveReadinessGate ? "OPEN" : "CLOSED",
            detail: "Live readiness gate must be open."
        },
        {
            label: "Operations Layer",
            passed: opsPass,
            value: tradeOpsPermission ? "OPS CLEAR" : "OPS BLOCKED",
            detail: "Operations layer must be clear."
        }
    ]

    const passedPortfolioChecks = portfolioChecks.filter((check) => check.passed).length
    const totalPortfolioChecks = portfolioChecks.length

    const portfolioScore =
        totalPortfolioChecks > 0
            ? Math.round((passedPortfolioChecks / totalPortfolioChecks) * 100)
            : 0

    const finalPortfolioPermission =
        portfolioScore >= 90 &&
        draftBudgetPass &&
        portfolioExposurePass &&
        strategyPass &&
        orderPass &&
        liveGatePass &&
        opsPass &&
        riskModel !== "LOCKDOWN"

    const portfolioStatus =
        finalPortfolioPermission
            ? "PORTFOLIO GATE OPEN"
            : "PORTFOLIO GATE CLOSED"

    const portfolioColor =
        finalPortfolioPermission ? "#86efac" : "#f87171"

    const portfolioSummary =
        finalPortfolioPermission
            ? "Draft order fits current risk budget, strategy allocation, exposure limit and portfolio permission gate."
            : "Portfolio gate is closed. Review budget, allocation, exposure, execution permission and live readiness before increasing risk."

    const portfolioHealthScore = Math.round(
        compatibilityScore * 0.25 +
        reliabilityScore * 0.25 +
        orderReadinessScore * 0.25 +
        portfolioScore * 0.25
    )

    const portfolioHealthColor =
        portfolioHealthScore >= 90
            ? "#86efac"
            : portfolioHealthScore >= 75
                ? "#38bdf8"
                : portfolioHealthScore >= 60
                    ? "#facc15"
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

    return (
        <>
            <div style={panelStyle}>
                <p style={sectionEyebrowStyle}>Risk Budget & Portfolio Control</p>

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
                            background: finalPortfolioPermission
                                ? "linear-gradient(135deg, rgba(20, 83, 45, 0.34), rgba(17, 24, 39, 0.96))"
                                : "linear-gradient(135deg, rgba(127, 29, 29, 0.34), rgba(17, 24, 39, 0.96))",
                            border: `1px solid ${portfolioColor}`,
                            borderRadius: "22px",
                            padding: "22px",
                            boxShadow: `0 0 32px ${portfolioColor}22`
                        }}
                    >
                        <p style={{ color: "#9ca3af", marginBottom: "8px" }}>
                            Portfolio Permission
                        </p>

                        <h2
                            style={{
                                color: portfolioColor,
                                fontSize: "38px",
                                letterSpacing: "-0.04em",
                                marginBottom: "12px"
                            }}
                        >
                            {portfolioStatus}
                        </h2>

                        <p
                            style={{
                                color: "#d1d5db",
                                lineHeight: "1.75",
                                fontWeight: "bold",
                                marginBottom: "18px"
                            }}
                        >
                            {portfolioSummary}
                        </p>

                        <div style={progressTrackStyle}>
                            <div
                                style={{
                                    width: `${portfolioScore}%`,
                                    height: "100%",
                                    background: `linear-gradient(90deg, ${portfolioColor}, rgba(255,255,255,0.68))`,
                                    borderRadius: "999px",
                                    boxShadow: `0 0 20px ${portfolioColor}55`
                                }}
                            />
                        </div>

                        <p style={{ color: "#9ca3af", marginTop: "10px", fontSize: "13px" }}>
                            Portfolio Gate Score: {portfolioScore}/100
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
                                    Risk Model Selector
                                </h3>

                                <p style={{ color: "#9ca3af", lineHeight: "1.7" }}>
                                    เลือก risk budget model เพื่อกำหนด allocation, exposure limit,
                                    reliability requirement และ portfolio permission gate.
                                </p>
                            </div>

                            <span style={statusPillStyle(activeRiskModel.color, `${activeRiskModel.color}22`)}>
                                {riskModel}
                            </span>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                                gap: "12px"
                            }}
                        >
                            {riskModels.map((model) => {
                                const active = riskModel === model.name

                                return (
                                    <button
                                        key={model.name}
                                        onClick={() => setRiskModel(model.name)}
                                        style={{
                                            background: active
                                                ? `linear-gradient(135deg, ${model.color}33, rgba(17, 24, 39, 0.96))`
                                                : "linear-gradient(135deg, rgba(31, 41, 55, 0.5), rgba(17, 24, 39, 0.96))",
                                            border: active
                                                ? `1px solid ${model.color}`
                                                : "1px solid #374151",
                                            borderRadius: "16px",
                                            padding: "14px",
                                            cursor: "pointer",
                                            textAlign: "left",
                                            color: active ? model.color : "#d1d5db",
                                            fontWeight: "bold",
                                            boxShadow: active ? `0 0 22px ${model.color}22` : "none"
                                        }}
                                    >
                                        <p style={{ marginBottom: "7px" }}>{model.name}</p>

                                        <p
                                            style={{
                                                color: "#9ca3af",
                                                fontSize: "12px",
                                                lineHeight: "1.5",
                                                fontWeight: "normal"
                                            }}
                                        >
                                            {model.description}
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
                    <MetricBox label="Portfolio Health" value={`${portfolioHealthScore}/100`} color={portfolioHealthColor} />
                    <MetricBox label="Max Daily Loss" value={`$${maxDailyLoss.toFixed(2)}`} color="#f87171" />
                    <MetricBox label="Current Daily Loss" value={`$${currentDailyLoss.toFixed(2)}`} color={currentDailyLoss > 0 ? "#facc15" : "#86efac"} />
                    <MetricBox label="Remaining Budget" value={`$${remainingDailyRiskBudget.toFixed(2)}`} color={remainingDailyRiskBudget > 0 ? "#86efac" : "#f87171"} />
                    <MetricBox label="Strategy Budget" value={`$${strategyBudgetLimit.toFixed(2)}`} color="#38bdf8" />
                    <MetricBox label="Risk / Trade" value={`${riskPerTradePct || 0}%`} color="#facc15" />
                    <MetricBox label="Draft Risk Unit" value={estimatedRiskUnit > 0 ? estimatedRiskUnit.toFixed(4) : "-"} color="#f87171" />
                    <MetricBox label="Draft Reward Unit" value={estimatedRewardUnit > 0 ? estimatedRewardUnit.toFixed(4) : "-"} color="#86efac" />
                    <MetricBox label="Reward/Risk" value={rewardRiskRatio > 0 ? `${rewardRiskRatio.toFixed(2)}R` : "-"} color={rewardRiskRatio >= 1.2 ? "#86efac" : "#f87171"} />
                    <MetricBox label="Budget After Draft" value={`$${budgetAfterDraft.toFixed(2)}`} color={budgetAfterDraft > 0 ? "#86efac" : "#f87171"} />
                    <MetricBox label="Session Mode" value={sessionMode} color={sessionMode === "LIVE READY" ? "#86efac" : "#facc15"} />
                    <MetricBox label="Exposure Level" value={exposureLevel} color={exposureLevel === "FULL" ? "#f87171" : "#86efac"} />
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(340px, 0.85fr) minmax(520px, 1.15fr)",
                        gap: "22px",
                        alignItems: "start",
                        marginBottom: "24px"
                    }}
                >
                    <div style={cardStyle}>
                        <p style={sectionEyebrowStyle}>Strategy Allocation</p>

                        <h3 style={{ color: "#f9fafb", marginBottom: "18px" }}>
                            Allocation Model
                        </h3>

                        <div style={{ display: "grid", gap: "16px" }}>
                            {strategyAllocations.map((item) => (
                                <div key={item.label}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: "12px",
                                            marginBottom: "8px",
                                            color: item.active ? item.color : "#d1d5db",
                                            fontWeight: "bold"
                                        }}
                                    >
                                        <span>{item.label}</span>
                                        <span>{item.allocation}%</span>
                                    </div>

                                    <div style={progressTrackStyle}>
                                        <div
                                            style={{
                                                width: `${item.allocation}%`,
                                                height: "100%",
                                                background: `linear-gradient(90deg, ${item.color}, rgba(255,255,255,0.68))`,
                                                borderRadius: "999px",
                                                boxShadow: item.active ? `0 0 20px ${item.color}55` : "none"
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={cardStyle}>
                        <p style={sectionEyebrowStyle}>Budget Usage</p>

                        <h3 style={{ color: "#f9fafb", marginBottom: "18px" }}>
                            Daily Risk Budget Usage
                        </h3>

                        <div style={{ display: "grid", gap: "18px" }}>
                            <div>
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
                                            background: `linear-gradient(90deg, ${dailyLossUsagePercent >= 100 ? "#f87171" : "#86efac"}, rgba(255,255,255,0.68))`,
                                            borderRadius: "999px"
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: "10px",
                                        color: "#d1d5db",
                                        fontWeight: "bold"
                                    }}
                                >
                                    <span>Draft Risk / Daily Budget</span>
                                    <span>{draftRiskToDailyBudgetPercent.toFixed(0)}%</span>
                                </div>

                                <div style={progressTrackStyle}>
                                    <div
                                        style={{
                                            width: `${draftRiskToDailyBudgetPercent}%`,
                                            height: "100%",
                                            background: `linear-gradient(90deg, ${draftRiskToDailyBudgetPercent >= 100 ? "#f87171" : "#facc15"}, rgba(255,255,255,0.68))`,
                                            borderRadius: "999px"
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: "10px",
                                        color: "#d1d5db",
                                        fontWeight: "bold"
                                    }}
                                >
                                    <span>Draft Risk / Strategy Budget</span>
                                    <span>{draftRiskToStrategyBudgetPercent.toFixed(0)}%</span>
                                </div>

                                <div style={progressTrackStyle}>
                                    <div
                                        style={{
                                            width: `${draftRiskToStrategyBudgetPercent}%`,
                                            height: "100%",
                                            background: `linear-gradient(90deg, ${draftRiskToStrategyBudgetPercent >= 100 ? "#f87171" : "#38bdf8"}, rgba(255,255,255,0.68))`,
                                            borderRadius: "999px"
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: "10px",
                                        color: "#d1d5db",
                                        fontWeight: "bold"
                                    }}
                                >
                                    <span>Portfolio Slot Usage</span>
                                    <span>{slotUsagePercent.toFixed(0)}%</span>
                                </div>

                                <div style={progressTrackStyle}>
                                    <div
                                        style={{
                                            width: `${slotUsagePercent}%`,
                                            height: "100%",
                                            background: `linear-gradient(90deg, ${slotUsagePercent >= activeRiskModel.maxPortfolioExposurePct ? "#f87171" : "#86efac"}, rgba(255,255,255,0.68))`,
                                            borderRadius: "999px"
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={cardStyle}>
                    <p style={sectionEyebrowStyle}>Portfolio Exposure Checklist</p>

                    <h3 style={{ color: "#f9fafb", marginBottom: "16px" }}>
                        Risk Budget Validation
                    </h3>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                            gap: "14px"
                        }}
                    >
                        {portfolioChecks.map((check) => (
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
            </div>

            <ObservabilityConsole
                backendHealth={backendHealth}
                riskData={riskData}
                selectedStrategy={selectedStrategy}
                strategyPermission={strategyPermission}
                compatibilityScore={compatibilityScore}
                tradeOpsPermission={tradeOpsPermission}
                liveReadinessGate={liveReadinessGate}
                finalOrderPermission={finalOrderPermission}
                finalPortfolioPermission={finalPortfolioPermission}
                portfolioScore={portfolioScore}
                portfolioHealthScore={portfolioHealthScore}
                riskModel={riskModel}
                portfolioStatus={portfolioStatus}
                exposureLevel={exposureLevel}
                remainingSlots={remainingSlots}
                reliabilityScore={reliabilityScore}
                orderReadinessScore={orderReadinessScore}
                sessionMode={sessionMode}
                dailyLossUsagePercent={dailyLossUsagePercent}
                draftRiskToStrategyBudgetPercent={draftRiskToStrategyBudgetPercent}
                slotUsagePercent={slotUsagePercent}
                remainingDailyRiskBudget={remainingDailyRiskBudget}
                strategyBudgetLimit={strategyBudgetLimit}
                budgetAfterDraft={budgetAfterDraft}
            />
        </>
    )
}

export default RiskBudgetPanel