function QuantAnalyticsPanel({
    quantStats = {},
    backtest = {},
    riskData = {},
    positions = [],
    selectedMenu = "Quant"
}) {
    const parseNumber = (value) => {
        const parsedValue = Number(String(value || "0").replace("$", "").replace("+", "").replace("%", "").replace(",", "").trim())
        return Number.isNaN(parsedValue) ? 0 : parsedValue
    }

    const varValue = parseNumber(quantStats.var)
    const volatility = parseNumber(quantStats.volatility)
    const sharpeRatio = parseNumber(quantStats.sharpeRatio)

    const totalTrades = parseNumber(backtest.totalTrades)
    const winRate = parseNumber(backtest.winRate)
    const netProfit = parseNumber(backtest.netProfit)

    const dailyLossUsage = Number(riskData.dailyLossUsagePercent || 0)
    const currentOpenPositions = Number(riskData.currentOpenPositions || positions.length || 0)
    const maxOpenPositions = Number(riskData.maxOpenPositions || 0)

    const positionUsage =
        maxOpenPositions > 0
            ? Math.min((currentOpenPositions / maxOpenPositions) * 100, 100)
            : 0

    const riskRegime =
        dailyLossUsage >= 100 || positionUsage >= 100
            ? "DANGER"
            : volatility >= 25 || dailyLossUsage >= 70
                ? "ELEVATED"
                : volatility >= 15
                    ? "NORMAL"
                    : "LOW RISK"

    const riskColor =
        riskRegime === "DANGER"
            ? "#f87171"
            : riskRegime === "ELEVATED"
                ? "#facc15"
                : riskRegime === "NORMAL"
                    ? "#38bdf8"
                    : "#86efac"

    const quantHealthScore = Math.round(
        Math.max(
            0,
            Math.min(
                100,
                55 +
                sharpeRatio * 18 +
                Math.max(winRate - 50, 0) * 0.55 -
                Math.max(volatility - 15, 0) * 0.8 -
                dailyLossUsage * 0.25 -
                positionUsage * 0.15
            )
        )
    )

    const quantHealthColor =
        quantHealthScore >= 85
            ? "#86efac"
            : quantHealthScore >= 70
                ? "#38bdf8"
                : quantHealthScore >= 55
                    ? "#facc15"
                    : "#f87171"

    const sizingSuggestion =
        riskRegime === "DANGER"
            ? "NO TRADE"
            : riskRegime === "ELEVATED"
                ? "HALF SIZE"
                : riskRegime === "NORMAL"
                    ? "NORMAL SIZE"
                    : "SMALL TEST SIZE"

    const sizingColor =
        sizingSuggestion === "NO TRADE"
            ? "#f87171"
            : sizingSuggestion === "HALF SIZE"
                ? "#facc15"
                : "#86efac"

    const riskOverview = [
        {
            label: "VaR",
            value: quantStats.var || "-",
            color: varValue < -3 ? "#f87171" : "#facc15",
            detail: "ประมาณการ downside risk"
        },
        {
            label: "Volatility",
            value: quantStats.volatility || "-",
            color: volatility > 25 ? "#f87171" : volatility > 15 ? "#facc15" : "#86efac",
            detail: "ความผันผวนโดยรวมของระบบ"
        },
        {
            label: "Sharpe Ratio",
            value: quantStats.sharpeRatio || "-",
            color: sharpeRatio >= 1.3 ? "#86efac" : sharpeRatio >= 1 ? "#facc15" : "#f87171",
            detail: "ผลตอบแทนเทียบกับความเสี่ยง"
        },
        {
            label: "Total Trades",
            value: totalTrades.toLocaleString(),
            color: totalTrades >= 100 ? "#86efac" : "#facc15",
            detail: "จำนวน sample จาก backtest"
        },
        {
            label: "Win Rate",
            value: `${winRate.toFixed(0)}%`,
            color: winRate >= 55 ? "#86efac" : "#facc15",
            detail: "อัตราชนะของระบบ"
        },
        {
            label: "Net Profit",
            value: `$${netProfit.toLocaleString()}`,
            color: netProfit >= 0 ? "#86efac" : "#f87171",
            detail: "ผลลัพธ์รวมจาก backtest snapshot"
        }
    ]

    const quantChecklist = [
        {
            label: "Sharpe acceptable",
            passed: sharpeRatio >= 1.2,
            value: sharpeRatio.toFixed(2),
            detail: "Sharpe ควรเกิน 1.2 เพื่อให้ดูน่าสนใจขึ้น"
        },
        {
            label: "Volatility controlled",
            passed: volatility <= 25,
            value: `${volatility.toFixed(1)}%`,
            detail: "Volatility สูงเกินไปควรลด size"
        },
        {
            label: "Daily loss safe",
            passed: dailyLossUsage < 70,
            value: `${dailyLossUsage.toFixed(0)}%`,
            detail: "Daily loss usage ไม่ควรเข้าใกล้ limit"
        },
        {
            label: "Position usage safe",
            passed: positionUsage < 80,
            value: `${positionUsage.toFixed(0)}%`,
            detail: "Position usage ไม่ควรเต็มก่อนเปิด order ใหม่"
        },
        {
            label: "Sample size acceptable",
            passed: totalTrades >= 100,
            value: `${totalTrades} trades`,
            detail: "Backtest sample ควรมีจำนวนมากพอ"
        },
        {
            label: "Win rate stable",
            passed: winRate >= 50,
            value: `${winRate.toFixed(0)}%`,
            detail: "Win rate ไม่จำเป็นต้องสูงมาก ถ้า payoff ดี แต่ไม่ควรต่ำเกินโดยไม่มีเหตุผล"
        }
    ]

    const drawdownMonitor = [
        {
            label: "Daily Loss Usage",
            value: `${dailyLossUsage.toFixed(0)}%`,
            color: dailyLossUsage >= 70 ? "#f87171" : "#86efac"
        },
        {
            label: "Position Usage",
            value: `${positionUsage.toFixed(0)}%`,
            color: positionUsage >= 80 ? "#f87171" : "#86efac"
        },
        {
            label: "Open Positions",
            value: `${currentOpenPositions}/${maxOpenPositions || "-"}`,
            color: currentOpenPositions < maxOpenPositions ? "#86efac" : "#f87171"
        }
    ]

    const strategyQuality = [
        {
            label: "Expected Quality",
            value: sharpeRatio >= 1.3 && winRate >= 55 ? "GOOD" : "WATCH",
            color: sharpeRatio >= 1.3 && winRate >= 55 ? "#86efac" : "#facc15"
        },
        {
            label: "Risk Regime",
            value: riskRegime,
            color: riskColor
        },
        {
            label: "Sizing",
            value: sizingSuggestion,
            color: sizingColor
        },
        {
            label: "Trade Frequency",
            value: totalTrades >= 100 ? "ENOUGH DATA" : "LOW SAMPLE",
            color: totalTrades >= 100 ? "#86efac" : "#facc15"
        }
    ]

    const panelStyle = {
        background:
            "linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(11, 18, 32, 0.98))",
        border: "1px solid rgba(55, 65, 81, 0.78)",
        padding: "24px",
        borderRadius: "24px",
        marginBottom: "24px",
        boxShadow: "0 20px 45px rgba(0, 0, 0, 0.22)"
    }

    const cardStyle = {
        backgroundColor: "#0b1220",
        border: "1px solid #1f2937",
        borderRadius: "18px",
        padding: "18px"
    }

    const eyebrowStyle = {
        color: "#84cc16",
        fontSize: "12px",
        fontWeight: "bold",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        marginBottom: "10px"
    }

    const progressTrackStyle = {
        width: "100%",
        height: "14px",
        backgroundColor: "#1f2937",
        borderRadius: "999px",
        overflow: "hidden"
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

    return (
        <>
            <div style={panelStyle}>
                <p style={eyebrowStyle}>Quant Risk Analytics</p>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(320px, 0.75fr) minmax(560px, 1.25fr)",
                        gap: "22px",
                        alignItems: "stretch"
                    }}
                >
                    <div
                        style={{
                            background: `linear-gradient(135deg, ${quantHealthColor}24, rgba(17, 24, 39, 0.96))`,
                            border: `1px solid ${quantHealthColor}`,
                            borderRadius: "22px",
                            padding: "22px",
                            boxShadow: `0 0 32px ${quantHealthColor}22`
                        }}
                    >
                        <p style={{ color: "#9ca3af", marginBottom: "8px" }}>
                            Quant Health Score
                        </p>

                        <h2
                            style={{
                                color: quantHealthColor,
                                fontSize: "44px",
                                letterSpacing: "-0.04em",
                                marginBottom: "12px"
                            }}
                        >
                            {quantHealthScore}/100
                        </h2>

                        <p
                            style={{
                                color: "#d1d5db",
                                lineHeight: "1.75",
                                fontWeight: "bold",
                                marginBottom: "18px"
                            }}
                        >
                            ประเมินสุขภาพเชิง Quant จาก Sharpe, volatility, win rate,
                            daily loss usage และ position usage
                        </p>

                        <div style={progressTrackStyle}>
                            <div
                                style={{
                                    width: `${quantHealthScore}%`,
                                    height: "100%",
                                    background: `linear-gradient(90deg, ${quantHealthColor}, rgba(255,255,255,0.68))`,
                                    borderRadius: "999px",
                                    boxShadow: `0 0 20px ${quantHealthColor}55`
                                }}
                            />
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
                                    Risk Regime
                                </h3>

                                <p style={{ color: "#9ca3af", lineHeight: "1.7" }}>
                                    หน้านี้ช่วยตอบว่าเชิง Quant ระบบสุขภาพดีไหม เสี่ยงเกินไปไหม
                                    และควรลด/เพิ่ม risk หรือไม่
                                </p>
                            </div>

                            <span style={statusPillStyle(riskColor, `${riskColor}22`)}>
                                {riskRegime}
                            </span>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                                gap: "14px"
                            }}
                        >
                            {strategyQuality.map((item) => (
                                <div key={item.label} style={cardStyle}>
                                    <p style={{ color: "#9ca3af", marginBottom: "8px", fontSize: "13px" }}>
                                        {item.label}
                                    </p>

                                    <p style={{ color: item.color, fontWeight: "bold", fontSize: "18px" }}>
                                        {item.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div style={panelStyle}>
                <p style={eyebrowStyle}>Risk Overview</p>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "14px"
                    }}
                >
                    {riskOverview.map((item) => (
                        <div key={item.label} style={cardStyle}>
                            <p style={{ color: "#9ca3af", marginBottom: "8px", fontSize: "13px" }}>
                                {item.label}
                            </p>

                            <p style={{ color: item.color, fontWeight: "bold", fontSize: "24px", marginBottom: "8px" }}>
                                {item.value}
                            </p>

                            <p style={{ color: "#6b7280", fontSize: "12px", lineHeight: "1.55" }}>
                                {item.detail}
                            </p>
                        </div>
                    ))}
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
                <div style={panelStyle}>
                    <p style={eyebrowStyle}>Drawdown Monitor</p>

                    <div style={{ display: "grid", gap: "16px" }}>
                        {drawdownMonitor.map((item) => {
                            const percent = parseNumber(item.value)

                            return (
                                <div key={item.label}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            color: item.color,
                                            fontWeight: "bold",
                                            marginBottom: "8px"
                                        }}
                                    >
                                        <span>{item.label}</span>
                                        <span>{item.value}</span>
                                    </div>

                                    <div style={progressTrackStyle}>
                                        <div
                                            style={{
                                                width: `${Math.min(percent, 100)}%`,
                                                height: "100%",
                                                background: `linear-gradient(90deg, ${item.color}, rgba(255,255,255,0.68))`,
                                                borderRadius: "999px"
                                            }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div style={panelStyle}>
                    <p style={eyebrowStyle}>Position Sizing Suggestion</p>

                    <div
                        style={{
                            background: `linear-gradient(135deg, ${sizingColor}24, rgba(17, 24, 39, 0.96))`,
                            border: `1px solid ${sizingColor}`,
                            borderRadius: "22px",
                            padding: "22px"
                        }}
                    >
                        <p style={{ color: "#9ca3af", marginBottom: "8px" }}>
                            Suggested Action
                        </p>

                        <h2
                            style={{
                                color: sizingColor,
                                fontSize: "38px",
                                letterSpacing: "-0.04em",
                                marginBottom: "12px"
                            }}
                        >
                            {sizingSuggestion}
                        </h2>

                        <p style={{ color: "#d1d5db", lineHeight: "1.75", fontWeight: "bold" }}>
                            คำแนะนำนี้อิงจาก risk regime, volatility, daily loss usage และ position usage
                            ไม่ใช่สัญญาณซื้อขายโดยตรง
                        </p>
                    </div>
                </div>
            </div>

            <div style={panelStyle}>
                <p style={eyebrowStyle}>Quant Checklist</p>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                        gap: "14px"
                    }}
                >
                    {quantChecklist.map((item) => (
                        <div
                            key={item.label}
                            style={{
                                backgroundColor: "#0b1220",
                                border: item.passed
                                    ? "1px solid rgba(134, 239, 172, 0.32)"
                                    : "1px solid rgba(248, 113, 113, 0.32)",
                                borderRadius: "16px",
                                padding: "16px"
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
                                        item.passed ? "rgba(20, 83, 45, 0.34)" : "rgba(127, 29, 29, 0.38)"
                                    )}
                                >
                                    {item.passed ? "PASS" : "WATCH"}
                                </span>
                            </div>

                            <p style={{ color: item.passed ? "#86efac" : "#f87171", fontWeight: "bold", marginBottom: "8px" }}>
                                {item.value}
                            </p>

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

export default QuantAnalyticsPanel