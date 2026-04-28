import { useState } from "react"
import RiskBudgetPanel from "./RiskBudgetPanel"

function ExecutionControlPanel({
    backendHealth = {},
    riskData = {},
    selectedStrategy = "-",
    strategyPermission = "STRATEGY BLOCKED",
    compatibilityScore = 0,
    tradeOpsPermission = false,
    liveReadinessGate = false,
    exposureLevel = "FLAT",
    remainingSlots = 0,
    reliabilityScore = 0,
    sessionMode = "MONITORING"
}) {
    const [orderDraft, setOrderDraft] = useState({
        orderType: "MARKET",
        side: "BUY",
        lot: "0.01",
        entry: "85.00",
        stopLoss: "84.50",
        takeProfit: "86.00",
        intent: "BREAKOUT CONTINUATION"
    })

    const [operatorConfirmed, setOperatorConfirmed] = useState(false)
    const [draftId] = useState(() => `SIM-${Date.now().toString().slice(-6)}`)

    const parseNumber = (value) => {
        const parsedValue = Number(String(value || "0").replace(",", "").trim())
        return Number.isNaN(parsedValue) ? 0 : parsedValue
    }

    const lot = parseNumber(orderDraft.lot)
    const entry = parseNumber(orderDraft.entry)
    const stopLoss = parseNumber(orderDraft.stopLoss)
    const takeProfit = parseNumber(orderDraft.takeProfit)

    const hasBasicOrderData =
        lot > 0 && entry > 0 && stopLoss > 0 && takeProfit > 0

    const riskDistance = hasBasicOrderData
        ? Math.abs(entry - stopLoss)
        : 0

    const rewardDistance = hasBasicOrderData
        ? Math.abs(takeProfit - entry)
        : 0

    const rewardRiskRatio =
        riskDistance > 0 ? rewardDistance / riskDistance : 0

    const directionIsValid =
        orderDraft.side === "BUY"
            ? stopLoss < entry && takeProfit > entry
            : stopLoss > entry && takeProfit < entry

    const lotIsValid = lot > 0 && lot <= 0.1
    const rewardRiskIsValid = rewardRiskRatio >= 1.2
    const strategyIsAllowed = strategyPermission === "STRATEGY ALLOWED"
    const backendIsHealthy = backendHealth.status === "ok"
    const riskGateIsClear = (backendHealth.riskStatus || riskData.riskStatus) === "OK"
    const dailyLossIsClear =
        (backendHealth.dailyLossStatus || riskData.dailyLossStatus) === "OK"

    const estimatedRiskUnit = riskDistance * lot
    const estimatedRewardUnit = rewardDistance * lot

    const orderValidationChecks = [
        {
            label: "Strategy Permission",
            passed: strategyIsAllowed,
            value: strategyPermission,
            detail: "Strategy must be allowed before creating executable intent."
        },
        {
            label: "Live Readiness Gate",
            passed: liveReadinessGate,
            value: liveReadinessGate ? "OPEN" : "CLOSED",
            detail: "Live gate must be open before simulated execution approval."
        },
        {
            label: "Trade Ops Permission",
            passed: tradeOpsPermission,
            value: tradeOpsPermission ? "OPS CLEAR" : "OPS BLOCKED",
            detail: "Operations layer must be clear."
        },
        {
            label: "Backend Health",
            passed: backendIsHealthy,
            value: backendHealth.status || "-",
            detail: "Backend must be healthy."
        },
        {
            label: "Risk Gate",
            passed: riskGateIsClear,
            value: backendHealth.riskStatus || riskData.riskStatus || "-",
            detail: "Risk status must be OK."
        },
        {
            label: "Daily Loss Guard",
            passed: dailyLossIsClear,
            value: backendHealth.dailyLossStatus || riskData.dailyLossStatus || "-",
            detail: "Daily loss guard must not be breached."
        },
        {
            label: "Position Slot",
            passed: Number(remainingSlots || 0) > 0,
            value: `${remainingSlots} slot(s)`,
            detail: "There must be at least one remaining position slot."
        },
        {
            label: "Order Data",
            passed: hasBasicOrderData,
            value: hasBasicOrderData ? "COMPLETE" : "INCOMPLETE",
            detail: "Lot, entry, stop loss and take profit must be valid numbers."
        },
        {
            label: "Direction Logic",
            passed: directionIsValid,
            value: directionIsValid ? "VALID" : "INVALID",
            detail: "BUY needs SL below entry and TP above entry. SELL is the opposite."
        },
        {
            label: "Lot Limit",
            passed: lotIsValid,
            value: `${lot.toFixed(2)} lot`,
            detail: "Simulation allows lot size up to 0.10 for safety."
        },
        {
            label: "Reward/Risk",
            passed: rewardRiskIsValid,
            value: riskDistance > 0 ? `${rewardRiskRatio.toFixed(2)}R` : "-",
            detail: "Reward-to-risk should be at least 1.20R."
        },
        {
            label: "Operator Confirmed",
            passed: operatorConfirmed,
            value: operatorConfirmed ? "CONFIRMED" : "PENDING",
            detail: "Operator must confirm the simulated order intent."
        }
    ]

    const passedChecks = orderValidationChecks.filter((check) => check.passed).length
    const totalChecks = orderValidationChecks.length
    const orderReadinessScore =
        totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0

    const finalOrderPermission =
        orderReadinessScore >= 95 &&
        strategyIsAllowed &&
        tradeOpsPermission &&
        liveReadinessGate &&
        operatorConfirmed

    const finalOrderStatus =
        finalOrderPermission ? "SIM ORDER APPROVED" : "SIM ORDER BLOCKED"

    const finalOrderColor =
        finalOrderPermission ? "#86efac" : "#f87171"

    const finalOrderSummary =
        finalOrderPermission
            ? "Simulated order intent is approved by strategy, operations, live gate, risk and operator confirmation."
            : "Simulated order intent is blocked. Review failed checks before considering execution."

    const handleDraftChange = (field, value) => {
        setOrderDraft((prev) => ({
            ...prev,
            [field]: value
        }))

        setOperatorConfirmed(false)
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

    const inputStyle = {
        width: "100%",
        backgroundColor: "#020617",
        color: "#f9fafb",
        border: "1px solid #374151",
        borderRadius: "12px",
        padding: "12px 14px",
        fontSize: "14px",
        outline: "none",
        boxSizing: "border-box"
    }

    const labelStyle = {
        color: "#9ca3af",
        marginBottom: "8px",
        display: "block",
        fontSize: "13px",
        fontWeight: "bold"
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
                <p style={sectionEyebrowStyle}>Execution Control</p>

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
                            background:
                                finalOrderPermission
                                    ? "linear-gradient(135deg, rgba(20, 83, 45, 0.34), rgba(17, 24, 39, 0.96))"
                                    : "linear-gradient(135deg, rgba(127, 29, 29, 0.34), rgba(17, 24, 39, 0.96))",
                            border: `1px solid ${finalOrderColor}`,
                            borderRadius: "22px",
                            padding: "22px",
                            boxShadow: `0 0 32px ${finalOrderColor}22`
                        }}
                    >
                        <p style={{ color: "#9ca3af", marginBottom: "8px" }}>
                            Position Intent Gate
                        </p>

                        <h2
                            style={{
                                color: finalOrderColor,
                                fontSize: "38px",
                                letterSpacing: "-0.04em",
                                marginBottom: "12px"
                            }}
                        >
                            {finalOrderStatus}
                        </h2>

                        <p
                            style={{
                                color: "#d1d5db",
                                lineHeight: "1.75",
                                fontWeight: "bold",
                                marginBottom: "18px"
                            }}
                        >
                            {finalOrderSummary}
                        </p>

                        <div style={progressTrackStyle}>
                            <div
                                style={{
                                    width: `${orderReadinessScore}%`,
                                    height: "100%",
                                    background: `linear-gradient(90deg, ${finalOrderColor}, rgba(255,255,255,0.68))`,
                                    borderRadius: "999px",
                                    boxShadow: `0 0 20px ${finalOrderColor}55`
                                }}
                            />
                        </div>

                        <p style={{ color: "#9ca3af", marginTop: "10px", fontSize: "13px" }}>
                            Order Readiness Score: {orderReadinessScore}/100
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
                                    Order Ticket Simulation
                                </h3>

                                <p style={{ color: "#9ca3af", lineHeight: "1.7" }}>
                                    Simulated order ticket for validating strategy, risk, direction logic,
                                    reward-to-risk and operator confirmation before real execution exists.
                                </p>
                            </div>

                            <span
                                style={statusPillStyle(
                                    finalOrderColor,
                                    finalOrderPermission
                                        ? "rgba(20, 83, 45, 0.42)"
                                        : "rgba(127, 29, 29, 0.42)"
                                )}
                            >
                                {draftId}
                            </span>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, minmax(160px, 1fr))",
                                gap: "14px",
                                marginBottom: "16px"
                            }}
                        >
                            <div>
                                <label style={labelStyle}>Order Type</label>
                                <select
                                    value={orderDraft.orderType}
                                    onChange={(event) => handleDraftChange("orderType", event.target.value)}
                                    style={inputStyle}
                                >
                                    <option value="MARKET">MARKET</option>
                                    <option value="LIMIT">LIMIT</option>
                                    <option value="STOP">STOP</option>
                                </select>
                            </div>

                            <div>
                                <label style={labelStyle}>Side</label>
                                <select
                                    value={orderDraft.side}
                                    onChange={(event) => handleDraftChange("side", event.target.value)}
                                    style={inputStyle}
                                >
                                    <option value="BUY">BUY</option>
                                    <option value="SELL">SELL</option>
                                </select>
                            </div>

                            <div>
                                <label style={labelStyle}>Intent</label>
                                <select
                                    value={orderDraft.intent}
                                    onChange={(event) => handleDraftChange("intent", event.target.value)}
                                    style={inputStyle}
                                >
                                    <option value="BREAKOUT CONTINUATION">BREAKOUT CONTINUATION</option>
                                    <option value="PULLBACK ENTRY">PULLBACK ENTRY</option>
                                    <option value="RISK REDUCTION">RISK REDUCTION</option>
                                    <option value="MANUAL TEST">MANUAL TEST</option>
                                </select>
                            </div>

                            <div>
                                <label style={labelStyle}>Lot</label>
                                <input
                                    type="text"
                                    value={orderDraft.lot}
                                    onChange={(event) => handleDraftChange("lot", event.target.value)}
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Entry</label>
                                <input
                                    type="text"
                                    value={orderDraft.entry}
                                    onChange={(event) => handleDraftChange("entry", event.target.value)}
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Stop Loss</label>
                                <input
                                    type="text"
                                    value={orderDraft.stopLoss}
                                    onChange={(event) => handleDraftChange("stopLoss", event.target.value)}
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Take Profit</label>
                                <input
                                    type="text"
                                    value={orderDraft.takeProfit}
                                    onChange={(event) => handleDraftChange("takeProfit", event.target.value)}
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Strategy</label>
                                <input
                                    type="text"
                                    value={selectedStrategy}
                                    readOnly
                                    style={{
                                        ...inputStyle,
                                        color: "#9ca3af",
                                        cursor: "not-allowed"
                                    }}
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Session</label>
                                <input
                                    type="text"
                                    value={sessionMode}
                                    readOnly
                                    style={{
                                        ...inputStyle,
                                        color: "#9ca3af",
                                        cursor: "not-allowed"
                                    }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => setOperatorConfirmed((prev) => !prev)}
                            style={{
                                width: "100%",
                                background: operatorConfirmed
                                    ? "linear-gradient(135deg, #84cc16, #22c55e)"
                                    : "linear-gradient(135deg, #374151, #111827)",
                                color: operatorConfirmed ? "#020617" : "#d1d5db",
                                border: operatorConfirmed
                                    ? "1px solid #86efac"
                                    : "1px solid #4b5563",
                                borderRadius: "16px",
                                padding: "14px",
                                cursor: "pointer",
                                fontWeight: "bold",
                                boxShadow: operatorConfirmed
                                    ? "0 0 24px rgba(134, 239, 172, 0.22)"
                                    : "none"
                            }}
                        >
                            {operatorConfirmed
                                ? "Order Intent Confirmed"
                                : "Confirm Simulated Order Intent"}
                        </button>
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
                        label="Compatibility"
                        value={`${compatibilityScore}/100`}
                        color={compatibilityScore >= 90 ? "#86efac" : "#facc15"}
                    />

                    <MetricBox
                        label="Reliability"
                        value={`${reliabilityScore}/100`}
                        color={reliabilityScore >= 75 ? "#86efac" : "#f87171"}
                    />

                    <MetricBox
                        label="Exposure"
                        value={exposureLevel}
                        color={exposureLevel === "FULL" ? "#f87171" : "#86efac"}
                    />

                    <MetricBox
                        label="Remaining Slots"
                        value={String(remainingSlots)}
                        color={remainingSlots > 0 ? "#86efac" : "#f87171"}
                    />

                    <MetricBox
                        label="Risk Distance"
                        value={riskDistance > 0 ? riskDistance.toFixed(2) : "-"}
                        color="#f87171"
                    />

                    <MetricBox
                        label="Reward Distance"
                        value={rewardDistance > 0 ? rewardDistance.toFixed(2) : "-"}
                        color="#86efac"
                    />

                    <MetricBox
                        label="Reward/Risk"
                        value={riskDistance > 0 ? `${rewardRiskRatio.toFixed(2)}R` : "-"}
                        color={rewardRiskIsValid ? "#86efac" : "#f87171"}
                    />

                    <MetricBox
                        label="Estimated Risk Unit"
                        value={estimatedRiskUnit > 0 ? estimatedRiskUnit.toFixed(4) : "-"}
                        color="#f87171"
                    />

                    <MetricBox
                        label="Estimated Reward Unit"
                        value={estimatedRewardUnit > 0 ? estimatedRewardUnit.toFixed(4) : "-"}
                        color="#86efac"
                    />
                </div>

                <div style={cardStyle}>
                    <p style={sectionEyebrowStyle}>Order Validation Checklist</p>

                    <h3 style={{ color: "#f9fafb", marginBottom: "16px" }}>
                        Execution Validation
                    </h3>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                            gap: "14px"
                        }}
                    >
                        {orderValidationChecks.map((check) => (
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

            <RiskBudgetPanel
                backendHealth={backendHealth}
                riskData={riskData}
                selectedStrategy={selectedStrategy}
                strategyPermission={strategyPermission}
                compatibilityScore={compatibilityScore}
                tradeOpsPermission={tradeOpsPermission}
                liveReadinessGate={liveReadinessGate}
                finalOrderPermission={finalOrderPermission}
                exposureLevel={exposureLevel}
                remainingSlots={remainingSlots}
                reliabilityScore={reliabilityScore}
                orderReadinessScore={orderReadinessScore}
                orderDraft={orderDraft}
                estimatedRiskUnit={estimatedRiskUnit}
                estimatedRewardUnit={estimatedRewardUnit}
                rewardRiskRatio={rewardRiskRatio}
                sessionMode={sessionMode}
            />
        </>
    )
}

export default ExecutionControlPanel