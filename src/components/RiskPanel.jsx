function RiskPanel({ riskData }) {
    const safeRiskData = riskData || {
        maxDailyLoss: "-",
        currentDailyLoss: "-",
        dailyLossUsagePercent: 0,
        dailyLossStatus: "-",
        riskPerTrade: "-",
        maxOpenPositions: "-",
        currentOpenPositions: "-",
        riskStatus: "-"
    }

    const parseMoney = (value) => {
        if (typeof value === "number") return value

        const cleanedValue = String(value || "0")
            .replace("$", "")
            .replace(",", "")
            .trim()

        const parsedValue = Number(cleanedValue)

        return Number.isNaN(parsedValue) ? 0 : parsedValue
    }

    const parsePercent = (value) => {
        if (typeof value === "number") return value

        const cleanedValue = String(value || "0")
            .replace("%", "")
            .trim()

        const parsedValue = Number(cleanedValue)

        return Number.isNaN(parsedValue) ? 0 : parsedValue
    }

    const clampPercent = (value) => {
        return Math.min(Math.max(Number(value) || 0, 0), 100)
    }

    const maxDailyLossAmount = parseMoney(safeRiskData.maxDailyLoss)
    const currentDailyLossAmount = parseMoney(safeRiskData.currentDailyLoss)
    const riskPerTradePercent = parsePercent(safeRiskData.riskPerTrade)

    const maxOpenPositions = Number(safeRiskData.maxOpenPositions) || 0
    const currentOpenPositions = Number(safeRiskData.currentOpenPositions) || 0
    const dailyLossUsagePercent = Number(safeRiskData.dailyLossUsagePercent) || 0

    const remainingSlots = Math.max(maxOpenPositions - currentOpenPositions, 0)

    const positionUsagePercent =
        maxOpenPositions > 0
            ? Math.min((currentOpenPositions / maxOpenPositions) * 100, 100)
            : 0

    const dailyLossRemaining = Math.max(maxDailyLossAmount - currentDailyLossAmount, 0)

    const dailyLossBufferPercent =
        maxDailyLossAmount > 0
            ? Math.max(100 - dailyLossUsagePercent, 0)
            : 0

    const positionBufferPercent = Math.max(100 - positionUsagePercent, 0)

    const riskPreset =
        maxDailyLossAmount === 5 && riskPerTradePercent === 0.5 && maxOpenPositions === 2
            ? "Conservative"
            : maxDailyLossAmount === 10 && riskPerTradePercent === 1 && maxOpenPositions === 3
                ? "Balanced"
                : maxDailyLossAmount === 20 && riskPerTradePercent === 2 && maxOpenPositions === 5
                    ? "Aggressive"
                    : "Custom"

    const riskPresetDescription =
        riskPreset === "Conservative"
            ? "Safer risk profile. Lower daily loss, lower risk per trade, and fewer open positions."
            : riskPreset === "Balanced"
                ? "Balanced risk profile. Standard daily loss, standard risk per trade, and moderate position limit."
                : riskPreset === "Aggressive"
                    ? "Higher risk profile. Larger daily loss allowance, higher risk per trade, and more open positions."
                    : "Custom risk profile. Current values do not match a preset exactly."

    const riskPresetColor =
        riskPreset === "Conservative"
            ? "#86efac"
            : riskPreset === "Balanced"
                ? "#facc15"
                : riskPreset === "Aggressive"
                    ? "#fb923c"
                    : "#d1d5db"

    const riskLevel =
        safeRiskData.riskStatus === "PAUSED"
            ? "PAUSED"
            : safeRiskData.dailyLossStatus === "BREACHED"
                ? "DAILY LOSS HIT"
                : positionUsagePercent >= 100
                    ? "FULL"
                    : positionUsagePercent >= 67
                        ? "ELEVATED"
                        : "NORMAL"

    const botIsActive = safeRiskData.riskStatus === "OK"
    const hasRemainingSlot = remainingSlots > 0
    const positionLimitNotFull = positionUsagePercent < 100
    const dailyLossNotBreached = safeRiskData.dailyLossStatus !== "BREACHED"

    const canOpenNewTrade =
        botIsActive && hasRemainingSlot && positionLimitNotFull && dailyLossNotBreached

    const tradePermission = canOpenNewTrade ? "ALLOWED" : "BLOCKED"

    const primaryBlocker =
        !botIsActive
            ? "BOT PAUSED"
            : !dailyLossNotBreached
                ? "DAILY LOSS LIMIT"
                : !positionLimitNotFull
                    ? "POSITION LIMIT FULL"
                    : !hasRemainingSlot
                        ? "NO SLOT AVAILABLE"
                        : "NONE"

    const riskPriority =
        primaryBlocker === "DAILY LOSS LIMIT"
            ? "CRITICAL"
            : primaryBlocker === "POSITION LIMIT FULL" || primaryBlocker === "NO SLOT AVAILABLE"
                ? "HIGH"
                : primaryBlocker === "BOT PAUSED"
                    ? "MEDIUM"
                    : riskLevel === "ELEVATED"
                        ? "WATCH"
                        : "NORMAL"

    const riskScorePenaltyFromBot = botIsActive ? 0 : 35

    const riskScorePenaltyFromDailyLoss = dailyLossNotBreached
        ? dailyLossUsagePercent * 0.35
        : 60

    const riskScorePenaltyFromPositions = positionUsagePercent * 0.35

    const totalRiskPenalty =
        riskScorePenaltyFromBot +
        riskScorePenaltyFromDailyLoss +
        riskScorePenaltyFromPositions

    const riskScore = Math.max(0, Math.round(100 - totalRiskPenalty))
    const safeRiskScore = clampPercent(riskScore)

    const safetyRating =
        riskScore >= 80
            ? "STRONG"
            : riskScore >= 60
                ? "ACCEPTABLE"
                : riskScore >= 40
                    ? "WEAK"
                    : "DANGER"

    const safetyRatingColor =
        safetyRating === "STRONG"
            ? "#86efac"
            : safetyRating === "ACCEPTABLE"
                ? "#facc15"
                : safetyRating === "WEAK"
                    ? "#fb923c"
                    : "#f87171"

    const riskScoreMessage =
        safetyRating === "STRONG"
            ? "Risk condition is strong. The system still has enough safety buffer."
            : safetyRating === "ACCEPTABLE"
                ? "Risk condition is acceptable, but avoid careless entries."
                : safetyRating === "WEAK"
                    ? "Risk condition is weak. New trades should be highly selective."
                    : "Risk condition is dangerous. New trades should be blocked or reviewed."

    const whatToCheckNext =
        primaryBlocker === "BOT PAUSED"
            ? "Check whether the bot should be started again before allowing trades."
            : primaryBlocker === "DAILY LOSS LIMIT"
                ? "Review daily P&L and stop trading for the day if the loss limit is reached."
                : primaryBlocker === "POSITION LIMIT FULL"
                    ? "Close or reduce existing positions before opening a new trade."
                    : primaryBlocker === "NO SLOT AVAILABLE"
                        ? "Wait for a position slot to become available."
                        : riskLevel === "ELEVATED"
                            ? "Check setup quality carefully before allowing another trade."
                            : "Risk checks are clear. Continue monitoring position size and daily loss."

    const suggestedAction =
        safeRiskData.riskStatus === "PAUSED"
            ? "Start the bot before allowing new trades."
            : safeRiskData.dailyLossStatus === "BREACHED"
                ? "Do not open new trades. Daily loss limit has been reached."
                : remainingSlots <= 0
                    ? "Do not open new trades. Maximum position limit reached."
                    : riskLevel === "ELEVATED"
                        ? "New trade is allowed, but reduce risk and be selective."
                        : "New trade is allowed under current risk rules."

    const statusColor =
        safeRiskData.riskStatus === "OK"
            ? "#86efac"
            : safeRiskData.riskStatus === "PAUSED"
                ? "#facc15"
                : "#f87171"

    const dailyLossColor =
        safeRiskData.dailyLossStatus === "OK" ? "#86efac" : "#f87171"

    const riskLevelColor =
        riskLevel === "NORMAL"
            ? "#86efac"
            : riskLevel === "ELEVATED"
                ? "#facc15"
                : riskLevel === "FULL"
                    ? "#f87171"
                    : riskLevel === "DAILY LOSS HIT"
                        ? "#f87171"
                        : "#facc15"

    const usageColor =
        positionUsagePercent >= 100
            ? "#f87171"
            : positionUsagePercent >= 67
                ? "#facc15"
                : "#86efac"

    const dailyLossUsageColor =
        dailyLossUsagePercent >= 100
            ? "#f87171"
            : dailyLossUsagePercent >= 70
                ? "#facc15"
                : "#86efac"

    const permissionColor = canOpenNewTrade ? "#86efac" : "#f87171"

    const priorityColor =
        riskPriority === "CRITICAL"
            ? "#f87171"
            : riskPriority === "HIGH"
                ? "#fb923c"
                : riskPriority === "MEDIUM"
                    ? "#facc15"
                    : riskPriority === "WATCH"
                        ? "#facc15"
                        : "#86efac"

    const riskMessage =
        riskLevel === "PAUSED"
            ? "Bot is stopped. New trades should not be opened until the system is started again."
            : riskLevel === "DAILY LOSS HIT"
                ? "Daily loss limit has been reached. Trading should be blocked for the day."
                : riskLevel === "FULL"
                    ? "Maximum open position limit reached. Avoid opening more trades."
                    : riskLevel === "ELEVATED"
                        ? "Position usage is getting high. Be careful before adding new trades."
                        : "Risk level is normal. Position capacity is still available."

    const commandState =
        canOpenNewTrade
            ? "SYSTEM CLEAR"
            : riskPriority === "CRITICAL"
                ? "HARD BLOCK"
                : "REVIEW REQUIRED"

    const commandStateColor =
        commandState === "SYSTEM CLEAR"
            ? "#86efac"
            : commandState === "HARD BLOCK"
                ? "#f87171"
                : "#facc15"

    const commandStateBackground =
        commandState === "SYSTEM CLEAR"
            ? "rgba(20, 83, 45, 0.42)"
            : commandState === "HARD BLOCK"
                ? "rgba(127, 29, 29, 0.44)"
                : "rgba(113, 63, 18, 0.42)"

    const containerStyle = {
        background:
            "linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(15, 23, 42, 0.96))",
        border: "1px solid rgba(55, 65, 81, 0.76)",
        padding: "24px",
        borderRadius: "24px",
        marginBottom: "24px",
        boxShadow: "0 22px 52px rgba(0, 0, 0, 0.24)",
        position: "relative",
        overflow: "hidden"
    }

    const cardStyle = {
        background:
            "linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(11, 18, 32, 0.98))",
        border: "1px solid rgba(55, 65, 81, 0.78)",
        borderRadius: "16px",
        padding: "16px",
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.18)"
    }

    const labelStyle = {
        color: "#9ca3af",
        marginBottom: "8px",
        fontSize: "13px"
    }

    const valueStyle = {
        color: "#d1d5db",
        fontWeight: "bold"
    }

    const sectionStyle = {
        backgroundColor: "#0b1220",
        border: "1px solid #1f2937",
        borderRadius: "20px",
        padding: "18px",
        marginBottom: "18px"
    }

    const sectionTitleStyle = {
        color: "#f9fafb",
        marginBottom: "6px",
        fontSize: "18px",
        letterSpacing: "-0.01em"
    }

    const sectionSubtitleStyle = {
        color: "#9ca3af",
        fontSize: "14px",
        lineHeight: "1.65",
        marginBottom: "16px"
    }

    const pillStyle = (color, backgroundColor) => ({
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
        height: "16px",
        backgroundColor: "#1f2937",
        borderRadius: "999px",
        overflow: "hidden",
        boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.35)"
    }

    const renderMetricCard = (label, value, color = "#d1d5db", helper = "") => {
        return (
            <div style={cardStyle}>
                <p style={labelStyle}>{label}</p>

                <p
                    style={{
                        color,
                        fontWeight: "bold",
                        fontSize: "20px",
                        marginBottom: helper ? "8px" : 0,
                        letterSpacing: "-0.02em"
                    }}
                >
                    {value}
                </p>

                {helper && (
                    <p
                        style={{
                            color: "#6b7280",
                            fontSize: "13px",
                            lineHeight: "1.5"
                        }}
                    >
                        {helper}
                    </p>
                )}
            </div>
        )
    }

    const renderChecklistItem = (label, passed, detail) => {
        return (
            <div
                style={{
                    background:
                        passed
                            ? "linear-gradient(135deg, rgba(20, 83, 45, 0.28), rgba(17, 24, 39, 0.96))"
                            : "linear-gradient(135deg, rgba(127, 29, 29, 0.3), rgba(17, 24, 39, 0.96))",
                    border: passed
                        ? "1px solid rgba(134, 239, 172, 0.35)"
                        : "1px solid rgba(248, 113, 113, 0.35)",
                    borderRadius: "16px",
                    padding: "15px",
                    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.16)"
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        marginBottom: "10px",
                        alignItems: "center"
                    }}
                >
                    <p style={{ color: "#d1d5db", fontWeight: "bold" }}>{label}</p>

                    <span
                        style={pillStyle(
                            passed ? "#86efac" : "#f87171",
                            passed ? "rgba(20, 83, 45, 0.42)" : "rgba(127, 29, 29, 0.42)"
                        )}
                    >
                        {passed ? "PASS" : "FAIL"}
                    </span>
                </div>

                <p style={{ color: "#9ca3af", fontSize: "14px", lineHeight: "1.6" }}>
                    {detail}
                </p>
            </div>
        )
    }

    const renderPenaltyCard = (label, value, detail) => {
        const penaltyColor =
            value <= 0
                ? "#86efac"
                : value < 20
                    ? "#facc15"
                    : "#f87171"

        return (
            <div style={cardStyle}>
                <p style={labelStyle}>{label}</p>

                <p
                    style={{
                        color: penaltyColor,
                        fontWeight: "bold",
                        fontSize: "20px",
                        marginBottom: "8px"
                    }}
                >
                    -{value.toFixed(1)}
                </p>

                <p style={{ color: "#9ca3af", fontSize: "13px", lineHeight: "1.5" }}>
                    {detail}
                </p>
            </div>
        )
    }

    const renderProgressBar = (label, value, maxLabel, color, percent, helper) => {
        return (
            <div style={sectionStyle}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "10px",
                        gap: "12px",
                        flexWrap: "wrap"
                    }}
                >
                    <p style={{ color: "#9ca3af", fontWeight: "bold" }}>{label}</p>

                    <p style={{ color, fontWeight: "bold" }}>
                        {value} {maxLabel}
                    </p>
                </div>

                <div style={progressTrackStyle}>
                    <div
                        style={{
                            width: `${clampPercent(percent)}%`,
                            height: "100%",
                            background:
                                `linear-gradient(90deg, ${color}, rgba(255,255,255,0.68))`,
                            borderRadius: "999px",
                            boxShadow: `0 0 20px ${color}55`
                        }}
                    />
                </div>

                {helper && (
                    <p
                        style={{
                            color: "#9ca3af",
                            fontSize: "13px",
                            lineHeight: "1.55",
                            marginTop: "10px"
                        }}
                    >
                        {helper}
                    </p>
                )}
            </div>
        )
    }

    return (
        <div style={containerStyle}>
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background:
                        "linear-gradient(90deg, #f87171, #facc15, #84cc16, #38bdf8)"
                }}
            />

            <div
                style={{
                    position: "absolute",
                    top: "-90px",
                    right: "-90px",
                    width: "220px",
                    height: "220px",
                    borderRadius: "999px",
                    backgroundColor: `${permissionColor}18`,
                    filter: "blur(18px)",
                    pointerEvents: "none"
                }}
            />

            <div
                style={{
                    position: "absolute",
                    bottom: "-110px",
                    left: "-90px",
                    width: "230px",
                    height: "230px",
                    borderRadius: "999px",
                    backgroundColor: "rgba(56, 189, 248, 0.07)",
                    filter: "blur(20px)",
                    pointerEvents: "none"
                }}
            />

            <div style={{ position: "relative", zIndex: 1 }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "18px",
                        flexWrap: "wrap",
                        marginBottom: "22px"
                    }}
                >
                    <div>
                        <p
                            style={{
                                color: "#facc15",
                                fontSize: "12px",
                                fontWeight: "bold",
                                letterSpacing: "0.14em",
                                textTransform: "uppercase",
                                marginBottom: "10px"
                            }}
                        >
                            Risk Command Center
                        </p>

                        <h3
                            style={{
                                color: "#f9fafb",
                                fontSize: "24px",
                                marginBottom: "8px",
                                letterSpacing: "-0.02em"
                            }}
                        >
                            Risk Management Snapshot
                        </h3>

                        <p
                            style={{
                                color: "#9ca3af",
                                fontSize: "14px",
                                lineHeight: "1.7",
                                maxWidth: "820px"
                            }}
                        >
                            Live risk gate with preset classification, position capacity,
                            daily loss buffer, safety score, blocker detection and final trade permission.
                        </p>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            flexWrap: "wrap",
                            justifyContent: "flex-end"
                        }}
                    >
                        <span style={pillStyle(commandStateColor, commandStateBackground)}>
                            {commandState}
                        </span>

                        <span
                            style={pillStyle(
                                permissionColor,
                                canOpenNewTrade
                                    ? "rgba(20, 83, 45, 0.42)"
                                    : "rgba(127, 29, 29, 0.42)"
                            )}
                        >
                            {tradePermission}
                        </span>

                        <span style={pillStyle(priorityColor, "rgba(17, 24, 39, 0.86)")}>
                            {riskPriority}
                        </span>
                    </div>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(280px, 0.85fr) minmax(320px, 1.15fr)",
                        gap: "16px",
                        marginBottom: "18px"
                    }}
                >
                    <div
                        style={{
                            background:
                                "linear-gradient(135deg, rgba(11, 18, 32, 0.96), rgba(17, 24, 39, 0.96))",
                            border: `1px solid ${riskPresetColor}`,
                            borderRadius: "20px",
                            padding: "18px",
                            boxShadow: `0 0 28px ${riskPresetColor}18`
                        }}
                    >
                        <p style={{ color: "#9ca3af", marginBottom: "8px", fontSize: "13px" }}>
                            Risk Preset Badge
                        </p>

                        <p
                            style={{
                                color: riskPresetColor,
                                fontWeight: "bold",
                                fontSize: "24px",
                                marginBottom: "10px",
                                letterSpacing: "-0.02em"
                            }}
                        >
                            {riskPreset}
                        </p>

                        <p style={{ color: "#d1d5db", lineHeight: "1.7", fontWeight: "bold" }}>
                            {riskPresetDescription}
                        </p>
                    </div>

                    <div
                        style={{
                            background:
                                canOpenNewTrade
                                    ? "linear-gradient(135deg, rgba(20, 83, 45, 0.34), rgba(17, 24, 39, 0.96))"
                                    : "linear-gradient(135deg, rgba(127, 29, 29, 0.34), rgba(17, 24, 39, 0.96))",
                            border: `1px solid ${permissionColor}`,
                            borderRadius: "20px",
                            padding: "18px",
                            boxShadow: `0 0 28px ${permissionColor}18`
                        }}
                    >
                        <p style={{ color: "#9ca3af", marginBottom: "8px", fontSize: "13px" }}>
                            Final Trade Permission
                        </p>

                        <p
                            style={{
                                color: permissionColor,
                                fontWeight: "bold",
                                fontSize: "28px",
                                marginBottom: "10px",
                                letterSpacing: "-0.03em"
                            }}
                        >
                            {tradePermission}
                        </p>

                        <p style={{ color: "#d1d5db", lineHeight: "1.7", fontWeight: "bold" }}>
                            {suggestedAction}
                        </p>
                    </div>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                        gap: "14px",
                        marginBottom: "18px"
                    }}
                >
                    {renderMetricCard("Max Daily Loss", safeRiskData.maxDailyLoss, "#f87171")}
                    {renderMetricCard("Current Daily Loss", safeRiskData.currentDailyLoss, dailyLossColor)}
                    {renderMetricCard("Daily Loss Status", safeRiskData.dailyLossStatus, dailyLossColor)}
                    {renderMetricCard("Risk Per Trade", safeRiskData.riskPerTrade, "#facc15")}
                    {renderMetricCard("Risk Status", safeRiskData.riskStatus, statusColor)}
                    {renderMetricCard("Risk Level", riskLevel, riskLevelColor)}
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                        gap: "14px",
                        marginBottom: "18px"
                    }}
                >
                    {renderMetricCard("Max Open Positions", safeRiskData.maxOpenPositions)}
                    {renderMetricCard("Current Open Positions", safeRiskData.currentOpenPositions)}
                    {renderMetricCard("Remaining Slots", remainingSlots, remainingSlots > 0 ? "#86efac" : "#f87171")}
                    {renderMetricCard("Position Usage", `${positionUsagePercent.toFixed(0)}%`, usageColor)}
                    {renderMetricCard("Daily Loss Buffer", `${dailyLossBufferPercent.toFixed(0)}%`, dailyLossUsageColor)}
                    {renderMetricCard("Position Buffer", `${positionBufferPercent.toFixed(0)}%`, usageColor)}
                </div>

                <div style={sectionStyle}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "14px",
                            flexWrap: "wrap",
                            marginBottom: "14px"
                        }}
                    >
                        <div>
                            <h4 style={sectionTitleStyle}>Risk Score Gauge</h4>

                            <p style={sectionSubtitleStyle}>
                                Safety score calculated from bot status, daily loss usage and position usage.
                            </p>
                        </div>

                        <span
                            style={pillStyle(
                                safetyRatingColor,
                                safetyRating === "STRONG"
                                    ? "rgba(20, 83, 45, 0.42)"
                                    : safetyRating === "ACCEPTABLE"
                                        ? "rgba(113, 63, 18, 0.42)"
                                        : safetyRating === "WEAK"
                                            ? "rgba(154, 52, 18, 0.42)"
                                            : "rgba(127, 29, 29, 0.42)"
                            )}
                        >
                            {riskScore}/100 — {safetyRating}
                        </span>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(220px, 0.45fr) minmax(320px, 1fr)",
                            gap: "18px",
                            alignItems: "center"
                        }}
                    >
                        <div
                            style={{
                                width: "170px",
                                height: "170px",
                                borderRadius: "999px",
                                background:
                                    `conic-gradient(${safetyRatingColor} ${safeRiskScore * 3.6}deg, #1f2937 0deg)`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto",
                                boxShadow: `0 0 34px ${safetyRatingColor}22`
                            }}
                        >
                            <div
                                style={{
                                    width: "126px",
                                    height: "126px",
                                    borderRadius: "999px",
                                    backgroundColor: "#0b1220",
                                    border: "1px solid #1f2937",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}
                            >
                                <p
                                    style={{
                                        color: safetyRatingColor,
                                        fontWeight: "bold",
                                        fontSize: "34px",
                                        lineHeight: "1"
                                    }}
                                >
                                    {riskScore}
                                </p>

                                <p
                                    style={{
                                        color: "#9ca3af",
                                        fontSize: "12px",
                                        marginTop: "7px"
                                    }}
                                >
                                    Safety Score
                                </p>
                            </div>
                        </div>

                        <div>
                            <div style={progressTrackStyle}>
                                <div
                                    style={{
                                        width: `${safeRiskScore}%`,
                                        height: "100%",
                                        background:
                                            `linear-gradient(90deg, ${safetyRatingColor}, rgba(255,255,255,0.68))`,
                                        borderRadius: "999px",
                                        boxShadow: `0 0 20px ${safetyRatingColor}55`
                                    }}
                                />
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    color: "#9ca3af",
                                    fontSize: "12px",
                                    marginTop: "10px",
                                    marginBottom: "14px",
                                    gap: "8px",
                                    flexWrap: "wrap"
                                }}
                            >
                                <span>0 Danger</span>
                                <span>40 Weak</span>
                                <span>60 Acceptable</span>
                                <span>80 Strong</span>
                                <span>100 Best</span>
                            </div>

                            <p style={{ color: safetyRatingColor, fontWeight: "bold", lineHeight: "1.7" }}>
                                {riskScoreMessage}
                            </p>
                        </div>
                    </div>
                </div>

                <div style={sectionStyle}>
                    <h4 style={sectionTitleStyle}>Risk Score Breakdown</h4>

                    <p style={sectionSubtitleStyle}>
                        Point deductions from each risk dimension. Lower penalty means safer condition.
                    </p>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                            gap: "14px"
                        }}
                    >
                        {renderPenaltyCard(
                            "Bot Penalty",
                            riskScorePenaltyFromBot,
                            botIsActive ? "Bot is active." : "Bot is paused."
                        )}

                        {renderPenaltyCard(
                            "Daily Loss Penalty",
                            riskScorePenaltyFromDailyLoss,
                            `${dailyLossUsagePercent.toFixed(0)}% daily loss usage.`
                        )}

                        {renderPenaltyCard(
                            "Position Penalty",
                            riskScorePenaltyFromPositions,
                            `${positionUsagePercent.toFixed(0)}% position usage.`
                        )}

                        {renderPenaltyCard(
                            "Total Penalty",
                            totalRiskPenalty,
                            "Total points deducted from 100."
                        )}

                        {renderMetricCard(
                            "Final Score",
                            `${riskScore}/100`,
                            safetyRatingColor,
                            "Final safety score after all deductions."
                        )}
                    </div>
                </div>

                <div style={sectionStyle}>
                    <h4 style={sectionTitleStyle}>Risk Score Summary</h4>

                    <p style={sectionSubtitleStyle}>
                        Quick summary of final score, loss buffer and position buffer.
                    </p>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                            gap: "14px"
                        }}
                    >
                        {renderMetricCard("Risk Score", `${riskScore}/100`, safetyRatingColor)}
                        {renderMetricCard("Safety Rating", safetyRating, safetyRatingColor)}
                        {renderMetricCard("Daily Loss Remaining", `$${dailyLossRemaining.toFixed(2)}`, dailyLossUsageColor)}
                        {renderMetricCard("Loss Buffer", `${dailyLossBufferPercent.toFixed(0)}%`, dailyLossUsageColor)}
                        {renderMetricCard("Position Buffer", `${positionBufferPercent.toFixed(0)}%`, usageColor)}
                    </div>
                </div>

                <div style={sectionStyle}>
                    <h4 style={sectionTitleStyle}>Risk Priority Summary</h4>

                    <p style={sectionSubtitleStyle}>
                        Primary blocker and next operational step before the system allows new exposure.
                    </p>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(180px, 0.7fr) minmax(180px, 0.7fr) minmax(320px, 1.6fr)",
                            gap: "14px"
                        }}
                    >
                        {renderMetricCard("Primary Blocker", primaryBlocker, priorityColor)}
                        {renderMetricCard("Risk Priority", riskPriority, priorityColor)}
                        {renderMetricCard("What to Check Next", whatToCheckNext, "#d1d5db")}
                    </div>
                </div>

                <div style={sectionStyle}>
                    <h4 style={sectionTitleStyle}>Risk Rule Checklist</h4>

                    <p style={sectionSubtitleStyle}>
                        Every rule must pass before a new trade can be allowed.
                    </p>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                            gap: "14px"
                        }}
                    >
                        {renderChecklistItem(
                            "Bot Active",
                            botIsActive,
                            botIsActive
                                ? "Bot is running and risk engine is active."
                                : "Bot is not running, so new trades should be blocked."
                        )}

                        {renderChecklistItem(
                            "Slot Available",
                            hasRemainingSlot,
                            hasRemainingSlot
                                ? `${remainingSlots} slot(s) still available.`
                                : "No remaining slot available."
                        )}

                        {renderChecklistItem(
                            "Position Limit",
                            positionLimitNotFull,
                            positionLimitNotFull
                                ? "Position limit has not been reached."
                                : "Position limit is already full."
                        )}

                        {renderChecklistItem(
                            "Daily Loss",
                            dailyLossNotBreached,
                            dailyLossNotBreached
                                ? "Daily loss limit has not been reached."
                                : "Daily loss limit has been breached."
                        )}

                        {renderChecklistItem(
                            "Final Permission",
                            canOpenNewTrade,
                            canOpenNewTrade
                                ? "All required risk checks passed."
                                : "One or more risk checks failed."
                        )}
                    </div>
                </div>

                {renderProgressBar(
                    "Position Usage Bar",
                    `${currentOpenPositions} / ${maxOpenPositions}`,
                    "",
                    usageColor,
                    positionUsagePercent,
                    `${remainingSlots} remaining slot(s). Position buffer is ${positionBufferPercent.toFixed(0)}%.`
                )}

                {renderProgressBar(
                    "Daily Loss Usage Bar",
                    `${dailyLossUsagePercent.toFixed(0)}%`,
                    "",
                    dailyLossUsageColor,
                    dailyLossUsagePercent,
                    `$${dailyLossRemaining.toFixed(2)} daily loss buffer remaining. Loss buffer is ${dailyLossBufferPercent.toFixed(0)}%.`
                )}

                <div style={sectionStyle}>
                    <h4 style={sectionTitleStyle}>Risk Interpretation</h4>

                    <p style={sectionSubtitleStyle}>
                        Human-readable explanation of the current risk state.
                    </p>

                    <div
                        style={{
                            background:
                                "linear-gradient(135deg, rgba(17, 24, 39, 0.96), rgba(11, 18, 32, 0.96))",
                            border: `1px solid ${riskLevelColor}`,
                            borderRadius: "16px",
                            padding: "16px"
                        }}
                    >
                        <p style={{ color: riskLevelColor, fontWeight: "bold", lineHeight: "1.7" }}>
                            {riskMessage}
                        </p>
                    </div>
                </div>

                <div
                    style={{
                        background:
                            canOpenNewTrade
                                ? "linear-gradient(135deg, rgba(20, 83, 45, 0.42), rgba(5, 46, 22, 0.92))"
                                : "linear-gradient(135deg, rgba(127, 29, 29, 0.42), rgba(69, 10, 10, 0.92))",
                        border: canOpenNewTrade
                            ? "1px solid rgba(134, 239, 172, 0.48)"
                            : "1px solid rgba(248, 113, 113, 0.48)",
                        borderRadius: "20px",
                        padding: "20px",
                        boxShadow: `0 0 34px ${permissionColor}22`
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "14px",
                            flexWrap: "wrap",
                            alignItems: "center",
                            marginBottom: "10px"
                        }}
                    >
                        <p style={{ color: "#d1d5db", fontWeight: "bold" }}>
                            Final Risk Gate
                        </p>

                        <span
                            style={pillStyle(
                                permissionColor,
                                canOpenNewTrade
                                    ? "rgba(20, 83, 45, 0.5)"
                                    : "rgba(127, 29, 29, 0.5)"
                            )}
                        >
                            {tradePermission}
                        </span>
                    </div>

                    <p style={{ color: permissionColor, fontWeight: "bold", lineHeight: "1.7" }}>
                        {canOpenNewTrade
                            ? "PASS: The system can allow a new trade under current limits."
                            : "BLOCK: The system should not allow a new trade right now."}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default RiskPanel