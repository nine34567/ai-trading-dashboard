function AiUsagePanel({
    aiUsage = {},
    selectedMenu = "AI Usage"
}) {
    const parseNumber = (value) => {
        const parsedValue = Number(String(value || "0").replace("$", "").replace(",", "").trim())
        return Number.isNaN(parsedValue) ? 0 : parsedValue
    }

    const apiCalls = parseNumber(aiUsage.apiCalls)
    const tokensUsed = parseNumber(aiUsage.tokensUsed)
    const estimatedCost = parseNumber(aiUsage.estimatedCost)

    const avgTokensPerCall = apiCalls > 0 ? tokensUsed / apiCalls : 0
    const avgCostPerCall = apiCalls > 0 ? estimatedCost / apiCalls : 0

    const dailyBudget = 10
    const budgetUsagePercent = dailyBudget > 0 ? Math.min((estimatedCost / dailyBudget) * 100, 100) : 0
    const budgetRemaining = Math.max(dailyBudget - estimatedCost, 0)

    const usageStatus =
        budgetUsagePercent >= 90
            ? "COST LIMIT WATCH"
            : budgetUsagePercent >= 70
                ? "COST ELEVATED"
                : "COST HEALTHY"

    const usageColor =
        budgetUsagePercent >= 90
            ? "#f87171"
            : budgetUsagePercent >= 70
                ? "#facc15"
                : "#86efac"

    const efficiencyScore = Math.round(
        Math.max(
            0,
            Math.min(
                100,
                100 -
                budgetUsagePercent * 0.45 -
                Math.max(avgTokensPerCall - 500, 0) * 0.03
            )
        )
    )

    const efficiencyColor =
        efficiencyScore >= 85
            ? "#86efac"
            : efficiencyScore >= 70
                ? "#38bdf8"
                : efficiencyScore >= 55
                    ? "#facc15"
                    : "#f87171"

    const usageSummary = [
        {
            label: "API Calls",
            value: apiCalls.toLocaleString(),
            color: "#f9fafb",
            detail: "จำนวนครั้งที่เรียกใช้ AI"
        },
        {
            label: "Tokens Used",
            value: tokensUsed.toLocaleString(),
            color: "#86efac",
            detail: "จำนวน token ที่ใช้รวมโดยประมาณ"
        },
        {
            label: "Estimated Cost",
            value: `$${estimatedCost.toFixed(2)}`,
            color: "#facc15",
            detail: "ต้นทุน AI โดยประมาณ"
        },
        {
            label: "Avg Tokens / Call",
            value: avgTokensPerCall.toFixed(0),
            color: "#38bdf8",
            detail: "ค่าเฉลี่ย token ต่อ API call"
        },
        {
            label: "Avg Cost / Call",
            value: `$${avgCostPerCall.toFixed(4)}`,
            color: "#a78bfa",
            detail: "ต้นทุนเฉลี่ยต่อ call"
        },
        {
            label: "Budget Remaining",
            value: `$${budgetRemaining.toFixed(2)}`,
            color: budgetRemaining > 0 ? "#86efac" : "#f87171",
            detail: "งบ AI ที่เหลือจาก daily budget"
        }
    ]

    const moduleUsage = [
        {
            module: "Signal Analysis",
            calls: Math.round(apiCalls * 0.38),
            tokens: Math.round(tokensUsed * 0.42),
            cost: estimatedCost * 0.42,
            color: "#86efac"
        },
        {
            module: "Risk Review",
            calls: Math.round(apiCalls * 0.24),
            tokens: Math.round(tokensUsed * 0.22),
            cost: estimatedCost * 0.22,
            color: "#facc15"
        },
        {
            module: "Backtest Summary",
            calls: Math.round(apiCalls * 0.18),
            tokens: Math.round(tokensUsed * 0.2),
            cost: estimatedCost * 0.2,
            color: "#38bdf8"
        },
        {
            module: "Trade Journal Summary",
            calls: Math.round(apiCalls * 0.2),
            tokens: Math.round(tokensUsed * 0.16),
            cost: estimatedCost * 0.16,
            color: "#a78bfa"
        }
    ]

    const costAlerts = [
        {
            label: "Daily budget usage",
            value: `${budgetUsagePercent.toFixed(0)}%`,
            active: budgetUsagePercent >= 70,
            detail: "ถ้าเกิน 70% ควรเริ่มลดการเรียก AI ที่ไม่จำเป็น"
        },
        {
            label: "Average token pressure",
            value: `${avgTokensPerCall.toFixed(0)} tokens/call`,
            active: avgTokensPerCall > 600,
            detail: "ถ้า token ต่อ call สูงเกินไป ควรสรุป context ให้สั้นลง"
        },
        {
            label: "Call frequency",
            value: `${apiCalls.toLocaleString()} calls`,
            active: apiCalls > 200,
            detail: "ถ้า call เยอะเกินไป ควรใช้ AI เฉพาะ decision checkpoint"
        },
        {
            label: "Estimated cost",
            value: `$${estimatedCost.toFixed(2)}`,
            active: estimatedCost > 7,
            detail: "ถ้า cost สูง ให้เปิด cost guard ก่อนใช้งานจริง"
        }
    ]

    const optimizationSuggestions = [
        "ใช้ AI เฉพาะตอน decision checkpoint ไม่ใช้ทุก tick",
        "Cache prompt หรือ context ที่ซ้ำบ่อย",
        "แยก short prompt สำหรับ signal และ long prompt สำหรับ review",
        "สรุป trade journal เป็น batch แทนการสรุปทุก trade",
        "ตั้ง daily cost guard ก่อนต่อ production จริง"
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
                <p style={eyebrowStyle}>AI Cost & Efficiency Monitor</p>

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
                            background: `linear-gradient(135deg, ${efficiencyColor}24, rgba(17, 24, 39, 0.96))`,
                            border: `1px solid ${efficiencyColor}`,
                            borderRadius: "22px",
                            padding: "22px",
                            boxShadow: `0 0 32px ${efficiencyColor}22`
                        }}
                    >
                        <p style={{ color: "#9ca3af", marginBottom: "8px" }}>
                            Usage Efficiency Score
                        </p>

                        <h2
                            style={{
                                color: efficiencyColor,
                                fontSize: "44px",
                                letterSpacing: "-0.04em",
                                marginBottom: "12px"
                            }}
                        >
                            {efficiencyScore}/100
                        </h2>

                        <p
                            style={{
                                color: "#d1d5db",
                                lineHeight: "1.75",
                                fontWeight: "bold",
                                marginBottom: "18px"
                            }}
                        >
                            วิเคราะห์ความคุ้มค่าของ AI จาก calls, token usage, estimated cost,
                            average cost และ budget usage
                        </p>

                        <div style={progressTrackStyle}>
                            <div
                                style={{
                                    width: `${efficiencyScore}%`,
                                    height: "100%",
                                    background: `linear-gradient(90deg, ${efficiencyColor}, rgba(255,255,255,0.68))`,
                                    borderRadius: "999px",
                                    boxShadow: `0 0 20px ${efficiencyColor}55`
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
                                    AI Usage Summary
                                </h3>

                                <p style={{ color: "#9ca3af", lineHeight: "1.7" }}>
                                    หน้านี้ใช้ดูว่า AI ใช้เงินเท่าไร ใช้ token หนักแค่ไหน
                                    และควรควบคุม cost อย่างไร
                                </p>
                            </div>

                            <span style={statusPillStyle(usageColor, `${usageColor}22`)}>
                                {usageStatus}
                            </span>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                                gap: "14px"
                            }}
                        >
                            {usageSummary.map((item) => (
                                <div key={item.label} style={cardStyle}>
                                    <p style={{ color: "#9ca3af", marginBottom: "8px", fontSize: "13px" }}>
                                        {item.label}
                                    </p>

                                    <p style={{ color: item.color, fontWeight: "bold", fontSize: "20px", marginBottom: "8px" }}>
                                        {item.value}
                                    </p>

                                    <p style={{ color: "#6b7280", fontSize: "12px", lineHeight: "1.55" }}>
                                        {item.detail}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div style={panelStyle}>
                <p style={eyebrowStyle}>Cost Budget</p>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(420px, 1fr) minmax(420px, 1fr)",
                        gap: "22px",
                        alignItems: "start"
                    }}
                >
                    <div style={cardStyle}>
                        <h3 style={{ color: "#f9fafb", marginBottom: "16px" }}>
                            Daily Cost Budget
                        </h3>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                color: "#d1d5db",
                                fontWeight: "bold",
                                marginBottom: "10px"
                            }}
                        >
                            <span>Budget Usage</span>
                            <span>{budgetUsagePercent.toFixed(0)}%</span>
                        </div>

                        <div style={progressTrackStyle}>
                            <div
                                style={{
                                    width: `${budgetUsagePercent}%`,
                                    height: "100%",
                                    background: `linear-gradient(90deg, ${usageColor}, rgba(255,255,255,0.68))`,
                                    borderRadius: "999px",
                                    boxShadow: `0 0 20px ${usageColor}55`
                                }}
                            />
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, 1fr)",
                                gap: "12px",
                                marginTop: "18px"
                            }}
                        >
                            <SmallBox label="Daily Budget" value={`$${dailyBudget.toFixed(2)}`} color="#38bdf8" />
                            <SmallBox label="Used" value={`$${estimatedCost.toFixed(2)}`} color="#facc15" />
                            <SmallBox label="Remaining" value={`$${budgetRemaining.toFixed(2)}`} color={budgetRemaining > 0 ? "#86efac" : "#f87171"} />
                        </div>
                    </div>

                    <div style={cardStyle}>
                        <h3 style={{ color: "#f9fafb", marginBottom: "16px" }}>
                            Cost Alerts
                        </h3>

                        <div style={{ display: "grid", gap: "12px" }}>
                            {costAlerts.map((item) => (
                                <div
                                    key={item.label}
                                    style={{
                                        backgroundColor: "#020617",
                                        border: item.active
                                            ? "1px solid rgba(250, 204, 21, 0.38)"
                                            : "1px solid rgba(134, 239, 172, 0.28)",
                                        borderRadius: "16px",
                                        padding: "14px"
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: "12px",
                                            alignItems: "center",
                                            marginBottom: "8px"
                                        }}
                                    >
                                        <p style={{ color: "#d1d5db", fontWeight: "bold" }}>
                                            {item.label}
                                        </p>

                                        <span
                                            style={statusPillStyle(
                                                item.active ? "#facc15" : "#86efac",
                                                item.active ? "rgba(113, 63, 18, 0.38)" : "rgba(20, 83, 45, 0.34)"
                                            )}
                                        >
                                            {item.active ? "WATCH" : "OK"}
                                        </span>
                                    </div>

                                    <p style={{ color: item.active ? "#facc15" : "#86efac", fontWeight: "bold", marginBottom: "6px" }}>
                                        {item.value}
                                    </p>

                                    <p style={{ color: "#9ca3af", fontSize: "13px", lineHeight: "1.6" }}>
                                        {item.detail}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div style={panelStyle}>
                <p style={eyebrowStyle}>Usage by Module</p>

                <div style={{ display: "grid", gap: "16px" }}>
                    {moduleUsage.map((item) => {
                        const costPercent = estimatedCost > 0 ? (item.cost / estimatedCost) * 100 : 0

                        return (
                            <div key={item.module} style={cardStyle}>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        gap: "14px",
                                        flexWrap: "wrap",
                                        marginBottom: "10px"
                                    }}
                                >
                                    <div>
                                        <p style={{ color: item.color, fontWeight: "bold", marginBottom: "6px" }}>
                                            {item.module}
                                        </p>

                                        <p style={{ color: "#9ca3af", fontSize: "13px" }}>
                                            {item.calls} calls • {item.tokens.toLocaleString()} tokens • ${item.cost.toFixed(2)}
                                        </p>
                                    </div>

                                    <span style={statusPillStyle(item.color, `${item.color}22`)}>
                                        {costPercent.toFixed(0)}%
                                    </span>
                                </div>

                                <div style={progressTrackStyle}>
                                    <div
                                        style={{
                                            width: `${costPercent}%`,
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
                <p style={eyebrowStyle}>Optimization Suggestions</p>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                        gap: "14px"
                    }}
                >
                    {optimizationSuggestions.map((item, index) => (
                        <div
                            key={item}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "32px 1fr",
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
                                    width: "26px",
                                    height: "26px",
                                    borderRadius: "999px",
                                    backgroundColor: "rgba(56, 189, 248, 0.14)",
                                    border: "1px solid #38bdf8",
                                    color: "#38bdf8",
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
                                {item}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}

function SmallBox({ label, value, color }) {
    return (
        <div
            style={{
                backgroundColor: "#020617",
                border: "1px solid #1f2937",
                borderRadius: "14px",
                padding: "14px"
            }}
        >
            <p style={{ color: "#9ca3af", fontSize: "12px", marginBottom: "6px" }}>
                {label}
            </p>

            <p style={{ color, fontWeight: "bold" }}>{value}</p>
        </div>
    )
}

export default AiUsagePanel