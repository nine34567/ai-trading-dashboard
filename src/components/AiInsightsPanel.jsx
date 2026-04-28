function AiInsightsPanel({
    aiInsights = {},
    backendHealth = {},
    riskData = {},
    botStatus = "-",
    selectedMenu = "AI Insights"
}) {
    const signal = aiInsights.signal || "HOLD"
    const confidence = aiInsights.confidence || "0%"
    const reason = aiInsights.reason || "No AI reasoning available."

    const confidenceNumber = Number(String(confidence).replace("%", "")) || 0

    const signalColor =
        signal === "BUY"
            ? "#86efac"
            : signal === "SELL"
                ? "#f87171"
                : "#facc15"

    const riskStatus = backendHealth.riskStatus || riskData.riskStatus || "-"
    const dailyLossStatus =
        backendHealth.dailyLossStatus || riskData.dailyLossStatus || "-"
    const activeBotStatus = backendHealth.botStatus || botStatus || "-"
    const systemMode = backendHealth.systemMode || "-"

    const marketRegime =
        confidenceNumber >= 80
            ? "HIGH CONVICTION"
            : confidenceNumber >= 65
                ? "MODERATE CONVICTION"
                : "LOW CONVICTION"

    const executionBias =
        signal === "BUY"
            ? "LONG BIAS"
            : signal === "SELL"
                ? "SHORT BIAS"
                : "WAIT / NO TRADE"

    const riskBias =
        riskStatus === "OK" && dailyLossStatus === "OK"
            ? "RISK CLEAR"
            : "RISK BLOCKED"

    const aiDecisionScore = Math.round(
        confidenceNumber * 0.45 +
        (riskStatus === "OK" ? 20 : 0) +
        (dailyLossStatus === "OK" ? 20 : 0) +
        (activeBotStatus === "RUNNING" ? 15 : 0)
    )

    const aiDecisionColor =
        aiDecisionScore >= 85
            ? "#86efac"
            : aiDecisionScore >= 70
                ? "#38bdf8"
                : aiDecisionScore >= 50
                    ? "#facc15"
                    : "#f87171"

    const decisionBreakdown = [
        {
            label: "Signal",
            value: signal,
            color: signalColor,
            detail: "สัญญาณล่าสุดจาก AI decision layer"
        },
        {
            label: "Confidence",
            value: confidence,
            color: confidenceNumber >= 70 ? "#86efac" : "#facc15",
            detail: "ระดับความมั่นใจของ AI ต่อ decision ล่าสุด"
        },
        {
            label: "Market Regime",
            value: marketRegime,
            color: confidenceNumber >= 65 ? "#38bdf8" : "#facc15",
            detail: "แปล confidence เป็น regime เพื่อดูว่า AI มั่นใจแค่ไหน"
        },
        {
            label: "Execution Bias",
            value: executionBias,
            color: signalColor,
            detail: "มุมมองด้านการเข้า order จาก signal ปัจจุบัน"
        },
        {
            label: "Risk Bias",
            value: riskBias,
            color: riskBias === "RISK CLEAR" ? "#86efac" : "#f87171",
            detail: "เช็กว่า risk gate และ daily loss guard เปิดทางหรือไม่"
        },
        {
            label: "System Mode",
            value: systemMode,
            color: systemMode === "ACTIVE" ? "#86efac" : "#f87171",
            detail: "สถานะระบบจาก backend health"
        }
    ]

    const reasoningChain = [
        {
            step: "1",
            title: "Read latest AI signal",
            status: signal,
            color: signalColor,
            detail: `AI signal ล่าสุดคือ ${signal}`
        },
        {
            step: "2",
            title: "Check confidence quality",
            status: confidence,
            color: confidenceNumber >= 70 ? "#86efac" : "#facc15",
            detail:
                confidenceNumber >= 70
                    ? "Confidence อยู่ในระดับใช้ประกอบ decision ได้"
                    : "Confidence ยังไม่สูงพอ ควรรอ confirmation เพิ่ม"
        },
        {
            step: "3",
            title: "Check risk gate",
            status: riskStatus,
            color: riskStatus === "OK" ? "#86efac" : "#f87171",
            detail:
                riskStatus === "OK"
                    ? "Risk gate ยังอนุญาตให้ระบบทำงานต่อได้"
                    : "Risk gate ไม่ OK ควรงดเพิ่ม exposure"
        },
        {
            step: "4",
            title: "Check daily loss guard",
            status: dailyLossStatus,
            color: dailyLossStatus === "OK" ? "#86efac" : "#f87171",
            detail:
                dailyLossStatus === "OK"
                    ? "Daily loss ยังไม่ breached"
                    : "Daily loss breached ควรหยุดเทรด"
        },
        {
            step: "5",
            title: "Final operator interpretation",
            status: executionBias,
            color: signalColor,
            detail:
                signal === "HOLD"
                    ? "AI ยังไม่เห็น edge ที่ชัดพอ การไม่เทรดคือ decision ที่ถูกต้อง"
                    : "AI มี directional bias แต่ยังต้องดู risk gate ก่อน action"
        }
    ]

    const noTradeChecklist = [
        {
            label: "Market extended",
            passed: signal === "HOLD",
            detail: "ตลาดยืดไปแล้ว รอ pullback หรือ setup ใหม่"
        },
        {
            label: "Risk/reward not confirmed",
            passed: confidenceNumber < 80,
            detail: "ยังไม่มี reward/risk ที่ชัดเจนพอ"
        },
        {
            label: "Risk gate check required",
            passed: riskStatus !== "OK",
            detail: "ถ้า risk gate ไม่ OK ห้ามเพิ่ม trade ใหม่"
        },
        {
            label: "Daily loss guard active",
            passed: dailyLossStatus !== "OK",
            detail: "ถ้า daily loss breached ต้องหยุดระบบ"
        },
        {
            label: "Wait for better entry",
            passed: String(reason).toLowerCase().includes("waiting"),
            detail: "AI ระบุว่าควรรอจุดเข้าใหม่"
        }
    ]

    const operatorActions =
        signal === "HOLD"
            ? [
                "อย่ารีบเข้า trade ใหม่",
                "รอให้ setup ชัดกว่าเดิม",
                "ดูว่า price กลับมาใกล้ breakout / support / resistance หรือไม่",
                "ตรวจ risk gate ก่อนพิจารณา action ถัดไป"
            ]
            : [
                "เช็ก risk gate ก่อนทุกครั้ง",
                "ดู reward/risk และ stop loss ให้ชัด",
                "ใช้ position size ต่ำก่อน",
                "ถ้า confidence ลดลง ให้กลับไป HOLD"
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

    const progressTrackStyle = {
        width: "100%",
        height: "14px",
        backgroundColor: "#1f2937",
        borderRadius: "999px",
        overflow: "hidden"
    }

    return (
        <>
            <div style={panelStyle}>
                <p style={eyebrowStyle}>AI Decision Engine</p>

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
                            background: `linear-gradient(135deg, ${aiDecisionColor}24, rgba(17, 24, 39, 0.96))`,
                            border: `1px solid ${aiDecisionColor}`,
                            borderRadius: "22px",
                            padding: "22px",
                            boxShadow: `0 0 32px ${aiDecisionColor}22`
                        }}
                    >
                        <p style={{ color: "#9ca3af", marginBottom: "8px" }}>
                            AI Decision Score
                        </p>

                        <h2
                            style={{
                                color: aiDecisionColor,
                                fontSize: "44px",
                                letterSpacing: "-0.04em",
                                marginBottom: "12px"
                            }}
                        >
                            {aiDecisionScore}/100
                        </h2>

                        <p
                            style={{
                                color: "#d1d5db",
                                fontWeight: "bold",
                                lineHeight: "1.75",
                                marginBottom: "18px"
                            }}
                        >
                            AI กำลังประเมิน signal, confidence, risk gate, daily loss guard และ bot runtime
                            เพื่อช่วยตัดสินใจว่า “ควร action หรือควรรอ”
                        </p>

                        <div style={progressTrackStyle}>
                            <div
                                style={{
                                    width: `${aiDecisionScore}%`,
                                    height: "100%",
                                    background: `linear-gradient(90deg, ${aiDecisionColor}, rgba(255,255,255,0.68))`,
                                    borderRadius: "999px",
                                    boxShadow: `0 0 20px ${aiDecisionColor}55`
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
                                    Latest Decision Overview
                                </h3>

                                <p style={{ color: "#9ca3af", lineHeight: "1.7" }}>
                                    หน้านี้ทำให้รู้ว่า AI กำลังคิดอะไรอยู่ เหตุผลคืออะไร และ operator
                                    ควรทำอะไรต่อแบบไม่เดาสุ่ม
                                </p>
                            </div>

                            <span style={statusPillStyle(signalColor, `${signalColor}22`)}>
                                {selectedMenu}
                            </span>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                                gap: "14px"
                            }}
                        >
                            {decisionBreakdown.map((item) => (
                                <div key={item.label} style={cardStyle}>
                                    <p style={{ color: "#9ca3af", marginBottom: "8px", fontSize: "13px" }}>
                                        {item.label}
                                    </p>

                                    <p
                                        style={{
                                            color: item.color,
                                            fontWeight: "bold",
                                            fontSize: "18px",
                                            marginBottom: "8px"
                                        }}
                                    >
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
                <p style={eyebrowStyle}>AI Reasoning Chain</p>

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
                            Reasoning Steps
                        </h3>

                        <div style={{ display: "grid", gap: "12px" }}>
                            {reasoningChain.map((item) => (
                                <div
                                    key={item.title}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "34px 1fr auto",
                                        gap: "12px",
                                        alignItems: "start",
                                        backgroundColor: "#020617",
                                        border: `1px solid ${item.color}55`,
                                        borderRadius: "16px",
                                        padding: "14px"
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "28px",
                                            height: "28px",
                                            borderRadius: "999px",
                                            backgroundColor: `${item.color}22`,
                                            border: `1px solid ${item.color}`,
                                            color: item.color,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontWeight: "bold",
                                            fontSize: "12px"
                                        }}
                                    >
                                        {item.step}
                                    </div>

                                    <div>
                                        <p style={{ color: "#f9fafb", fontWeight: "bold", marginBottom: "6px" }}>
                                            {item.title}
                                        </p>

                                        <p style={{ color: "#9ca3af", fontSize: "13px", lineHeight: "1.6" }}>
                                            {item.detail}
                                        </p>
                                    </div>

                                    <span style={statusPillStyle(item.color, `${item.color}22`)}>
                                        {item.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={cardStyle}>
                        <h3 style={{ color: "#f9fafb", marginBottom: "16px" }}>
                            AI Reason
                        </h3>

                        <div
                            style={{
                                backgroundColor: "#020617",
                                border: "1px solid rgba(56, 189, 248, 0.35)",
                                borderRadius: "18px",
                                padding: "18px",
                                marginBottom: "18px"
                            }}
                        >
                            <p
                                style={{
                                    color: "#d1d5db",
                                    lineHeight: "1.85",
                                    fontSize: "16px",
                                    fontWeight: "bold"
                                }}
                            >
                                {reason}
                            </p>
                        </div>

                        <h3 style={{ color: "#f9fafb", marginBottom: "16px" }}>
                            Operator Actions
                        </h3>

                        <div style={{ display: "grid", gap: "12px" }}>
                            {operatorActions.map((action, index) => (
                                <div
                                    key={action}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "32px 1fr",
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
                                            width: "26px",
                                            height: "26px",
                                            borderRadius: "999px",
                                            backgroundColor: "rgba(132, 204, 22, 0.14)",
                                            border: "1px solid #84cc16",
                                            color: "#84cc16",
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
                <p style={eyebrowStyle}>No-Trade Checklist</p>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                        gap: "14px"
                    }}
                >
                    {noTradeChecklist.map((item) => (
                        <div
                            key={item.label}
                            style={{
                                backgroundColor: "#0b1220",
                                border: item.passed
                                    ? "1px solid rgba(250, 204, 21, 0.35)"
                                    : "1px solid rgba(55, 65, 81, 0.72)",
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
                                        item.passed ? "#facc15" : "#6b7280",
                                        item.passed ? "rgba(113, 63, 18, 0.38)" : "rgba(31, 41, 55, 0.6)"
                                    )}
                                >
                                    {item.passed ? "WATCH" : "CLEAR"}
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

export default AiInsightsPanel