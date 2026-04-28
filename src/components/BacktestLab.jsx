import { useMemo, useState } from "react"

function BacktestLab({
    selectedStrategy = "-",
    strategyPermission = "STRATEGY BLOCKED",
    compatibilityScore = 0,
    reliabilityScore = 0,
    orderReadinessScore = 0,
    portfolioScore = 0,
    portfolioHealthScore = 0,
    finalPortfolioPermission = false,
    sessionMode = "MONITORING",
    riskModel = "BALANCED",
    exposureLevel = "FLAT"
}) {
    const [researchProfile, setResearchProfile] = useState("BALANCED RESEARCH")
    const [sampleSize, setSampleSize] = useState("128")
    const [winRate, setWinRate] = useState("42")
    const [avgWinR, setAvgWinR] = useState("2.10")
    const [avgLossR, setAvgLossR] = useState("1.00")
    const [maxDrawdown, setMaxDrawdown] = useState("12")
    const [profitFactor, setProfitFactor] = useState("1.55")
    const [walkForwardPass, setWalkForwardPass] = useState(false)
    const [outOfSamplePass, setOutOfSamplePass] = useState(false)
    const [operatorResearchApproved, setOperatorResearchApproved] = useState(false)

    const parseNumber = (value) => {
        const parsedValue = Number(String(value || "0").replace("%", "").replace(",", "").trim())
        return Number.isNaN(parsedValue) ? 0 : parsedValue
    }

    const tradeCount = parseNumber(sampleSize)
    const winRateValue = parseNumber(winRate)
    const avgWinValue = parseNumber(avgWinR)
    const avgLossValue = parseNumber(avgLossR)
    const maxDrawdownValue = parseNumber(maxDrawdown)
    const profitFactorValue = parseNumber(profitFactor)

    const lossRateValue = Math.max(100 - winRateValue, 0)

    const expectancyR =
        (winRateValue / 100) * avgWinValue -
        (lossRateValue / 100) * avgLossValue

    const payoffRatio =
        avgLossValue > 0 ? avgWinValue / avgLossValue : 0

    const robustnessScore = Math.round(
        Math.min(
            Math.max(
                tradeCount * 0.12 +
                Math.max(expectancyR, 0) * 28 +
                Math.min(profitFactorValue, 3) * 18 +
                Math.max(0, 25 - maxDrawdownValue) * 1.1 +
                (walkForwardPass ? 12 : 0) +
                (outOfSamplePass ? 12 : 0),
                0
            ),
            100
        )
    )

    const researchProfiles = [
        {
            name: "CONSERVATIVE RESEARCH",
            minTrades: 150,
            minExpectancy: 0.25,
            minProfitFactor: 1.4,
            maxDrawdown: 10,
            minRobustness: 80,
            color: "#38bdf8",
            description: "เน้นความแข็งแรงของข้อมูลก่อนนำไปใช้งานจริง เหมาะกับระบบที่ยังไม่มั่นใจ"
        },
        {
            name: "BALANCED RESEARCH",
            minTrades: 100,
            minExpectancy: 0.15,
            minProfitFactor: 1.25,
            maxDrawdown: 15,
            minRobustness: 70,
            color: "#86efac",
            description: "สมดุลระหว่าง sample size, expectancy, drawdown และ practical deployment"
        },
        {
            name: "AGGRESSIVE RESEARCH",
            minTrades: 60,
            minExpectancy: 0.10,
            minProfitFactor: 1.15,
            maxDrawdown: 20,
            minRobustness: 60,
            color: "#facc15",
            description: "ยอมรับข้อมูลน้อยลงเพื่อทดสอบไอเดียเร็วขึ้น แต่ยังต้องผ่าน risk gate"
        },
        {
            name: "REJECT MODE",
            minTrades: 9999,
            minExpectancy: 999,
            minProfitFactor: 999,
            maxDrawdown: 0,
            minRobustness: 100,
            color: "#f87171",
            description: "โหมดปฏิเสธ research ชั่วคราว ใช้เมื่อไม่ต้องการให้ strategy ผ่าน research gate"
        }
    ]

    const activeProfile =
        researchProfiles.find((profile) => profile.name === researchProfile) ||
        researchProfiles[1]

    const researchChecks = [
        {
            label: "Sample Size",
            passed: tradeCount >= activeProfile.minTrades,
            value: `${tradeCount} trades`,
            detail: `Profile requires at least ${activeProfile.minTrades} trades.`
        },
        {
            label: "Expectancy",
            passed: expectancyR >= activeProfile.minExpectancy,
            value: `${expectancyR.toFixed(2)}R`,
            detail: `Expectancy should be at least ${activeProfile.minExpectancy.toFixed(2)}R.`
        },
        {
            label: "Profit Factor",
            passed: profitFactorValue >= activeProfile.minProfitFactor,
            value: profitFactorValue.toFixed(2),
            detail: `Profit factor should be at least ${activeProfile.minProfitFactor.toFixed(2)}.`
        },
        {
            label: "Max Drawdown",
            passed: maxDrawdownValue <= activeProfile.maxDrawdown,
            value: `${maxDrawdownValue.toFixed(1)}%`,
            detail: `Max drawdown should not exceed ${activeProfile.maxDrawdown}%.`
        },
        {
            label: "Payoff Ratio",
            passed: payoffRatio >= 1.2,
            value: `${payoffRatio.toFixed(2)}x`,
            detail: "Average win should be meaningfully larger than average loss."
        },
        {
            label: "Walk-forward Test",
            passed: walkForwardPass,
            value: walkForwardPass ? "PASS" : "PENDING",
            detail: "Strategy should survive walk-forward validation."
        },
        {
            label: "Out-of-sample Test",
            passed: outOfSamplePass,
            value: outOfSamplePass ? "PASS" : "PENDING",
            detail: "Strategy should work outside the original training/test slice."
        },
        {
            label: "Robustness Score",
            passed: robustnessScore >= activeProfile.minRobustness,
            value: `${robustnessScore}/100`,
            detail: `Profile requires robustness at least ${activeProfile.minRobustness}/100.`
        },
        {
            label: "Strategy Layer",
            passed: strategyPermission === "STRATEGY ALLOWED" || selectedStrategy === "LOCKDOWN MODE",
            value: strategyPermission,
            detail: "Strategy gate should be compatible with research approval."
        },
        {
            label: "Portfolio Layer",
            passed: finalPortfolioPermission,
            value: finalPortfolioPermission ? "PORTFOLIO OPEN" : "PORTFOLIO CLOSED",
            detail: "Portfolio gate should be open before connecting research to live intent."
        },
        {
            label: "Operator Research Approval",
            passed: operatorResearchApproved,
            value: operatorResearchApproved ? "APPROVED" : "PENDING",
            detail: "Human operator should acknowledge research quality before deployment."
        }
    ]

    const passedChecks = researchChecks.filter((check) => check.passed).length
    const totalChecks = researchChecks.length
    const researchGateScore =
        totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0

    const researchCompositeScore = Math.round(
        compatibilityScore * 0.15 +
        reliabilityScore * 0.15 +
        orderReadinessScore * 0.15 +
        portfolioScore * 0.15 +
        portfolioHealthScore * 0.15 +
        robustnessScore * 0.25
    )

    const researchGateOpen =
        researchGateScore >= 90 &&
        researchCompositeScore >= activeProfile.minRobustness &&
        operatorResearchApproved &&
        walkForwardPass &&
        outOfSamplePass &&
        finalPortfolioPermission

    const researchStatus = researchGateOpen
        ? "RESEARCH GATE OPEN"
        : "RESEARCH GATE CLOSED"

    const researchColor = researchGateOpen ? "#86efac" : "#f87171"

    const researchSummary = researchGateOpen
        ? "Backtest, robustness, walk-forward, out-of-sample and portfolio checks are aligned for controlled research-to-live progression."
        : "Research gate is closed. Improve sample size, expectancy, drawdown, robustness, validation tests or portfolio readiness before moving forward."

    const equityCurve = useMemo(() => {
        const points = []
        let equity = 100

        const totalTrades = Math.max(Math.min(tradeCount, 160), 20)
        const winEvery = winRateValue > 0 ? Math.max(Math.round(100 / winRateValue), 2) : 3

        for (let index = 0; index < totalTrades; index += 1) {
            const isWin = index % winEvery === 0 || index % 7 === 0
            const resultR = isWin ? avgWinValue * 0.42 : -avgLossValue * 0.36
            const noise = Math.sin(index / 5) * 0.25

            equity += resultR + noise

            points.push({
                index,
                equity: Number(equity.toFixed(2))
            })
        }

        return points
    }, [tradeCount, winRateValue, avgWinValue, avgLossValue])

    const minEquity = Math.min(...equityCurve.map((point) => point.equity))
    const maxEquity = Math.max(...equityCurve.map((point) => point.equity))
    const lastEquity = equityCurve[equityCurve.length - 1]?.equity || 100
    const equityRange = Math.max(maxEquity - minEquity, 1)

    const chartPoints = equityCurve
        .map((point, index) => {
            const x = (index / Math.max(equityCurve.length - 1, 1)) * 100
            const y = 100 - ((point.equity - minEquity) / equityRange) * 100
            return `${x},${y}`
        })
        .join(" ")

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
        <div style={panelStyle}>
            <p style={sectionEyebrowStyle}>Backtest Lab</p>

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
                        background: researchGateOpen
                            ? "linear-gradient(135deg, rgba(20, 83, 45, 0.34), rgba(17, 24, 39, 0.96))"
                            : "linear-gradient(135deg, rgba(127, 29, 29, 0.34), rgba(17, 24, 39, 0.96))",
                        border: `1px solid ${researchColor}`,
                        borderRadius: "22px",
                        padding: "22px",
                        boxShadow: `0 0 32px ${researchColor}22`
                    }}
                >
                    <p style={{ color: "#9ca3af", marginBottom: "8px" }}>
                        Research-to-Live Gate
                    </p>

                    <h2
                        style={{
                            color: researchColor,
                            fontSize: "38px",
                            letterSpacing: "-0.04em",
                            marginBottom: "12px"
                        }}
                    >
                        {researchStatus}
                    </h2>

                    <p
                        style={{
                            color: "#d1d5db",
                            lineHeight: "1.75",
                            fontWeight: "bold",
                            marginBottom: "18px"
                        }}
                    >
                        {researchSummary}
                    </p>

                    <div style={progressTrackStyle}>
                        <div
                            style={{
                                width: `${researchGateScore}%`,
                                height: "100%",
                                background: `linear-gradient(90deg, ${researchColor}, rgba(255,255,255,0.68))`,
                                borderRadius: "999px",
                                boxShadow: `0 0 20px ${researchColor}55`
                            }}
                        />
                    </div>

                    <p style={{ color: "#9ca3af", marginTop: "10px", fontSize: "13px" }}>
                        Research Gate Score: {researchGateScore}/100
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
                                Strategy Research Console
                            </h3>

                            <p style={{ color: "#9ca3af", lineHeight: "1.7" }}>
                                Research layer สำหรับดู quality ของ strategy ก่อนเชื่อมไป live operation.
                            </p>
                        </div>

                        <span style={statusPillStyle(activeProfile.color, `${activeProfile.color}22`)}>
                            {researchProfile}
                        </span>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: "12px"
                        }}
                    >
                        {researchProfiles.map((profile) => {
                            const active = researchProfile === profile.name

                            return (
                                <button
                                    key={profile.name}
                                    onClick={() => {
                                        setResearchProfile(profile.name)
                                        setOperatorResearchApproved(false)
                                    }}
                                    style={{
                                        background: active
                                            ? `linear-gradient(135deg, ${profile.color}33, rgba(17, 24, 39, 0.96))`
                                            : "linear-gradient(135deg, rgba(31, 41, 55, 0.5), rgba(17, 24, 39, 0.96))",
                                        border: active
                                            ? `1px solid ${profile.color}`
                                            : "1px solid #374151",
                                        borderRadius: "16px",
                                        padding: "14px",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        color: active ? profile.color : "#d1d5db",
                                        fontWeight: "bold",
                                        boxShadow: active ? `0 0 22px ${profile.color}22` : "none"
                                    }}
                                >
                                    <p style={{ marginBottom: "7px" }}>{profile.name}</p>

                                    <p
                                        style={{
                                            color: "#9ca3af",
                                            fontSize: "12px",
                                            lineHeight: "1.5",
                                            fontWeight: "normal"
                                        }}
                                    >
                                        {profile.description}
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
                    gridTemplateColumns: "minmax(420px, 1fr) minmax(420px, 1fr)",
                    gap: "22px",
                    alignItems: "start",
                    marginBottom: "24px"
                }}
            >
                <div style={cardStyle}>
                    <p style={sectionEyebrowStyle}>Backtest Inputs</p>

                    <h3 style={{ color: "#f9fafb", marginBottom: "16px" }}>
                        Research Parameters
                    </h3>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, minmax(130px, 1fr))",
                            gap: "14px",
                            marginBottom: "18px"
                        }}
                    >
                        <div>
                            <label style={labelStyle}>Trades</label>
                            <input value={sampleSize} onChange={(event) => setSampleSize(event.target.value)} style={inputStyle} />
                        </div>

                        <div>
                            <label style={labelStyle}>Win Rate %</label>
                            <input value={winRate} onChange={(event) => setWinRate(event.target.value)} style={inputStyle} />
                        </div>

                        <div>
                            <label style={labelStyle}>Avg Win R</label>
                            <input value={avgWinR} onChange={(event) => setAvgWinR(event.target.value)} style={inputStyle} />
                        </div>

                        <div>
                            <label style={labelStyle}>Avg Loss R</label>
                            <input value={avgLossR} onChange={(event) => setAvgLossR(event.target.value)} style={inputStyle} />
                        </div>

                        <div>
                            <label style={labelStyle}>Max DD %</label>
                            <input value={maxDrawdown} onChange={(event) => setMaxDrawdown(event.target.value)} style={inputStyle} />
                        </div>

                        <div>
                            <label style={labelStyle}>Profit Factor</label>
                            <input value={profitFactor} onChange={(event) => setProfitFactor(event.target.value)} style={inputStyle} />
                        </div>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: "12px"
                        }}
                    >
                        <button
                            onClick={() => setWalkForwardPass((prev) => !prev)}
                            style={{
                                background: walkForwardPass
                                    ? "linear-gradient(135deg, #84cc16, #22c55e)"
                                    : "linear-gradient(135deg, #374151, #111827)",
                                color: walkForwardPass ? "#020617" : "#d1d5db",
                                border: walkForwardPass ? "1px solid #86efac" : "1px solid #4b5563",
                                borderRadius: "16px",
                                padding: "14px",
                                cursor: "pointer",
                                fontWeight: "bold"
                            }}
                        >
                            {walkForwardPass ? "Walk-forward Passed" : "Mark Walk-forward Pass"}
                        </button>

                        <button
                            onClick={() => setOutOfSamplePass((prev) => !prev)}
                            style={{
                                background: outOfSamplePass
                                    ? "linear-gradient(135deg, #84cc16, #22c55e)"
                                    : "linear-gradient(135deg, #374151, #111827)",
                                color: outOfSamplePass ? "#020617" : "#d1d5db",
                                border: outOfSamplePass ? "1px solid #86efac" : "1px solid #4b5563",
                                borderRadius: "16px",
                                padding: "14px",
                                cursor: "pointer",
                                fontWeight: "bold"
                            }}
                        >
                            {outOfSamplePass ? "Out-of-sample Passed" : "Mark Out-of-sample Pass"}
                        </button>

                        <button
                            onClick={() => setOperatorResearchApproved((prev) => !prev)}
                            style={{
                                background: operatorResearchApproved
                                    ? "linear-gradient(135deg, #84cc16, #22c55e)"
                                    : "linear-gradient(135deg, #374151, #111827)",
                                color: operatorResearchApproved ? "#020617" : "#d1d5db",
                                border: operatorResearchApproved ? "1px solid #86efac" : "1px solid #4b5563",
                                borderRadius: "16px",
                                padding: "14px",
                                cursor: "pointer",
                                fontWeight: "bold"
                            }}
                        >
                            {operatorResearchApproved ? "Research Approved" : "Approve Research Quality"}
                        </button>
                    </div>
                </div>

                <div style={cardStyle}>
                    <p style={sectionEyebrowStyle}>Equity Curve</p>

                    <h3 style={{ color: "#f9fafb", marginBottom: "16px" }}>
                        Simulated Equity Curve
                    </h3>

                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "260px", display: "block" }}>
                        <defs>
                            <linearGradient id="equityGradient" x1="0" x2="1" y1="0" y2="0">
                                <stop offset="0%" stopColor="#38bdf8" />
                                <stop offset="100%" stopColor="#86efac" />
                            </linearGradient>
                        </defs>

                        <polyline
                            fill="none"
                            stroke="url(#equityGradient)"
                            strokeWidth="2.4"
                            points={chartPoints}
                            vectorEffect="non-scaling-stroke"
                        />
                    </svg>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: "12px",
                            marginTop: "14px"
                        }}
                    >
                        <MetricBox label="Start Equity" value="100.00" color="#d1d5db" />
                        <MetricBox label="End Equity" value={lastEquity.toFixed(2)} color={lastEquity >= 100 ? "#86efac" : "#f87171"} />
                        <MetricBox label="Equity Range" value={equityRange.toFixed(2)} color="#38bdf8" />
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
                <MetricBox label="Research Composite" value={`${researchCompositeScore}/100`} color={researchCompositeScore >= 75 ? "#86efac" : "#f87171"} />
                <MetricBox label="Robustness" value={`${robustnessScore}/100`} color={robustnessScore >= activeProfile.minRobustness ? "#86efac" : "#f87171"} />
                <MetricBox label="Expectancy" value={`${expectancyR.toFixed(2)}R`} color={expectancyR > 0 ? "#86efac" : "#f87171"} />
                <MetricBox label="Payoff Ratio" value={`${payoffRatio.toFixed(2)}x`} color={payoffRatio >= 1.2 ? "#86efac" : "#f87171"} />
                <MetricBox label="Profit Factor" value={profitFactorValue.toFixed(2)} color={profitFactorValue >= activeProfile.minProfitFactor ? "#86efac" : "#f87171"} />
                <MetricBox label="Max Drawdown" value={`${maxDrawdownValue.toFixed(1)}%`} color={maxDrawdownValue <= activeProfile.maxDrawdown ? "#86efac" : "#f87171"} />
                <MetricBox label="Strategy" value={selectedStrategy} color="#38bdf8" />
                <MetricBox label="Risk Model" value={riskModel} color="#facc15" />
                <MetricBox label="Session" value={sessionMode} color={sessionMode === "LIVE READY" ? "#86efac" : "#facc15"} />
                <MetricBox label="Exposure" value={exposureLevel} color={exposureLevel === "FULL" ? "#f87171" : "#86efac"} />
            </div>

            <div style={cardStyle}>
                <p style={sectionEyebrowStyle}>Backtest Quality Checklist</p>

                <h3 style={{ color: "#f9fafb", marginBottom: "16px" }}>
                    Research Validation
                </h3>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                        gap: "14px"
                    }}
                >
                    {researchChecks.map((check) => (
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
    )
}

export default BacktestLab