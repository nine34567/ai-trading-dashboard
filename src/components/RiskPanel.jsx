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

        const cleanedValue = String(value || "0").replace("$", "").replace(",", "")
        const parsedValue = Number(cleanedValue)

        return Number.isNaN(parsedValue) ? 0 : parsedValue
    }

    const maxDailyLossAmount = parseMoney(safeRiskData.maxDailyLoss)
    const currentDailyLossAmount = parseMoney(safeRiskData.currentDailyLoss)

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

    const positionBufferPercent =
        Math.max(100 - positionUsagePercent, 0)

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

    const riskScore = Math.max(
        0,
        Math.round(100 - totalRiskPenalty)
    )

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

    const cardStyle = {
        backgroundColor: "#0b1220",
        border: "1px solid #1f2937",
        borderRadius: "14px",
        padding: "16px"
    }

    const labelStyle = {
        color: "#9ca3af",
        marginBottom: "8px"
    }

    const valueStyle = {
        color: "#d1d5db",
        fontWeight: "bold"
    }

    const renderChecklistItem = (label, passed, detail) => {
        return (
            <div
                style={{
                    backgroundColor: "#111827",
                    border: "1px solid #1f2937",
                    borderRadius: "14px",
                    padding: "14px"
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        marginBottom: "8px"
                    }}
                >
                    <p style={{ color: "#d1d5db", fontWeight: "bold" }}>{label}</p>

                    <p
                        style={{
                            color: passed ? "#86efac" : "#f87171",
                            fontWeight: "bold"
                        }}
                    >
                        {passed ? "PASS" : "FAIL"}
                    </p>
                </div>

                <p style={{ color: "#9ca3af", fontSize: "14px" }}>{detail}</p>
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
                <p style={{ color: penaltyColor, fontWeight: "bold", marginBottom: "8px" }}>
                    -{value.toFixed(1)}
                </p>
                <p style={{ color: "#9ca3af", fontSize: "13px" }}>
                    {detail}
                </p>
            </div>
        )
    }

    return (
        <div
            style={{
                backgroundColor: "#111827",
                padding: "24px",
                borderRadius: "16px",
                marginBottom: "24px"
            }}
        >
            <h3 style={{ marginBottom: "20px" }}>Risk Management Snapshot</h3>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: "16px",
                    marginBottom: "16px"
                }}
            >
                <div style={cardStyle}>
                    <p style={labelStyle}>Max Daily Loss</p>
                    <p style={{ color: "#f87171", fontWeight: "bold" }}>
                        {safeRiskData.maxDailyLoss}
                    </p>
                </div>

                <div style={cardStyle}>
                    <p style={labelStyle}>Current Daily Loss</p>
                    <p style={{ color: dailyLossColor, fontWeight: "bold" }}>
                        {safeRiskData.currentDailyLoss}
                    </p>
                </div>

                <div style={cardStyle}>
                    <p style={labelStyle}>Daily Loss Status</p>
                    <p style={{ color: dailyLossColor, fontWeight: "bold" }}>
                        {safeRiskData.dailyLossStatus}
                    </p>
                </div>

                <div style={cardStyle}>
                    <p style={labelStyle}>Risk Per Trade</p>
                    <p style={valueStyle}>{safeRiskData.riskPerTrade}</p>
                </div>

                <div style={cardStyle}>
                    <p style={labelStyle}>Risk Status</p>
                    <p style={{ color: statusColor, fontWeight: "bold" }}>
                        {safeRiskData.riskStatus}
                    </p>
                </div>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: "16px",
                    marginBottom: "16px"
                }}
            >
                <div style={cardStyle}>
                    <p style={labelStyle}>Max Open Positions</p>
                    <p style={valueStyle}>{safeRiskData.maxOpenPositions}</p>
                </div>

                <div style={cardStyle}>
                    <p style={labelStyle}>Current Open Positions</p>
                    <p style={valueStyle}>{safeRiskData.currentOpenPositions}</p>
                </div>

                <div style={cardStyle}>
                    <p style={labelStyle}>Remaining Slots</p>
                    <p style={{ color: "#d1d5db", fontWeight: "bold" }}>
                        {remainingSlots}
                    </p>
                </div>

                <div style={cardStyle}>
                    <p style={labelStyle}>Position Usage</p>
                    <p style={{ color: usageColor, fontWeight: "bold" }}>
                        {positionUsagePercent.toFixed(0)}%
                    </p>
                </div>

                <div style={cardStyle}>
                    <p style={labelStyle}>Risk Level</p>
                    <p style={{ color: riskLevelColor, fontWeight: "bold" }}>
                        {riskLevel}
                    </p>
                </div>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 2fr",
                    gap: "16px",
                    marginBottom: "16px"
                }}
            >
                <div style={cardStyle}>
                    <p style={labelStyle}>Trade Permission</p>
                    <p style={{ color: permissionColor, fontWeight: "bold" }}>
                        {tradePermission}
                    </p>
                </div>

                <div style={cardStyle}>
                    <p style={labelStyle}>Suggested Action</p>
                    <p style={{ color: permissionColor, fontWeight: "bold" }}>
                        {suggestedAction}
                    </p>
                </div>
            </div>

            <div
                style={{
                    backgroundColor: "#0b1220",
                    border: "1px solid #1f2937",
                    borderRadius: "14px",
                    padding: "16px",
                    marginBottom: "16px"
                }}
            >
                <h4 style={{ marginBottom: "14px" }}>Risk Score Gauge</h4>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        flexWrap: "wrap",
                        marginBottom: "10px"
                    }}
                >
                    <p style={{ color: "#9ca3af" }}>Current Safety Score</p>
                    <p style={{ color: safetyRatingColor, fontWeight: "bold" }}>
                        {riskScore}/100 — {safetyRating}
                    </p>
                </div>

                <div
                    style={{
                        width: "100%",
                        height: "18px",
                        backgroundColor: "#1f2937",
                        borderRadius: "999px",
                        overflow: "hidden",
                        marginBottom: "12px"
                    }}
                >
                    <div
                        style={{
                            width: `${riskScore}%`,
                            height: "100%",
                            backgroundColor: safetyRatingColor,
                            borderRadius: "999px"
                        }}
                    />
                </div>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        color: "#9ca3af",
                        fontSize: "13px",
                        marginBottom: "12px"
                    }}
                >
                    <span>0 Danger</span>
                    <span>40 Weak</span>
                    <span>60 Acceptable</span>
                    <span>80 Strong</span>
                    <span>100 Best</span>
                </div>

                <p style={{ color: safetyRatingColor, fontWeight: "bold" }}>
                    {riskScoreMessage}
                </p>
            </div>

            <div
                style={{
                    backgroundColor: "#0b1220",
                    border: "1px solid #1f2937",
                    borderRadius: "14px",
                    padding: "16px",
                    marginBottom: "16px"
                }}
            >
                <h4 style={{ marginBottom: "14px" }}>Risk Score Breakdown</h4>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
                        gap: "16px"
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

                    <div style={cardStyle}>
                        <p style={labelStyle}>Final Score</p>
                        <p style={{ color: safetyRatingColor, fontWeight: "bold", marginBottom: "8px" }}>
                            {riskScore}/100
                        </p>
                        <p style={{ color: "#9ca3af", fontSize: "13px" }}>
                            Final safety score after all deductions.
                        </p>
                    </div>
                </div>
            </div>

            <div
                style={{
                    backgroundColor: "#0b1220",
                    border: "1px solid #1f2937",
                    borderRadius: "14px",
                    padding: "16px",
                    marginBottom: "16px"
                }}
            >
                <h4 style={{ marginBottom: "14px" }}>Risk Score Summary</h4>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
                        gap: "16px"
                    }}
                >
                    <div style={cardStyle}>
                        <p style={labelStyle}>Risk Score</p>
                        <p style={{ color: safetyRatingColor, fontWeight: "bold" }}>
                            {riskScore}/100
                        </p>
                    </div>

                    <div style={cardStyle}>
                        <p style={labelStyle}>Safety Rating</p>
                        <p style={{ color: safetyRatingColor, fontWeight: "bold" }}>
                            {safetyRating}
                        </p>
                    </div>

                    <div style={cardStyle}>
                        <p style={labelStyle}>Daily Loss Remaining</p>
                        <p style={{ color: dailyLossUsageColor, fontWeight: "bold" }}>
                            ${dailyLossRemaining.toFixed(2)}
                        </p>
                    </div>

                    <div style={cardStyle}>
                        <p style={labelStyle}>Loss Buffer</p>
                        <p style={{ color: dailyLossUsageColor, fontWeight: "bold" }}>
                            {dailyLossBufferPercent.toFixed(0)}%
                        </p>
                    </div>

                    <div style={cardStyle}>
                        <p style={labelStyle}>Position Buffer</p>
                        <p style={{ color: usageColor, fontWeight: "bold" }}>
                            {positionBufferPercent.toFixed(0)}%
                        </p>
                    </div>
                </div>
            </div>

            <div
                style={{
                    backgroundColor: "#0b1220",
                    border: "1px solid #1f2937",
                    borderRadius: "14px",
                    padding: "16px",
                    marginBottom: "16px"
                }}
            >
                <h4 style={{ marginBottom: "14px" }}>Risk Priority Summary</h4>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 2fr",
                        gap: "16px"
                    }}
                >
                    <div style={cardStyle}>
                        <p style={labelStyle}>Primary Blocker</p>
                        <p style={{ color: priorityColor, fontWeight: "bold" }}>
                            {primaryBlocker}
                        </p>
                    </div>

                    <div style={cardStyle}>
                        <p style={labelStyle}>Risk Priority</p>
                        <p style={{ color: priorityColor, fontWeight: "bold" }}>
                            {riskPriority}
                        </p>
                    </div>

                    <div style={cardStyle}>
                        <p style={labelStyle}>What to Check Next</p>
                        <p style={{ color: "#d1d5db", fontWeight: "bold" }}>
                            {whatToCheckNext}
                        </p>
                    </div>
                </div>
            </div>

            <div
                style={{
                    backgroundColor: "#0b1220",
                    border: "1px solid #1f2937",
                    borderRadius: "14px",
                    padding: "16px",
                    marginBottom: "16px"
                }}
            >
                <h4 style={{ marginBottom: "14px" }}>Risk Rule Checklist</h4>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
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

            <div
                style={{
                    backgroundColor: "#0b1220",
                    border: "1px solid #1f2937",
                    borderRadius: "14px",
                    padding: "16px",
                    marginBottom: "16px"
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "10px",
                        gap: "12px",
                        flexWrap: "wrap"
                    }}
                >
                    <p style={{ color: "#9ca3af" }}>Position Usage Bar</p>
                    <p style={{ color: usageColor, fontWeight: "bold" }}>
                        {currentOpenPositions} / {maxOpenPositions}
                    </p>
                </div>

                <div
                    style={{
                        width: "100%",
                        height: "14px",
                        backgroundColor: "#1f2937",
                        borderRadius: "999px",
                        overflow: "hidden"
                    }}
                >
                    <div
                        style={{
                            width: `${positionUsagePercent}%`,
                            height: "100%",
                            backgroundColor: usageColor,
                            borderRadius: "999px"
                        }}
                    />
                </div>
            </div>

            <div
                style={{
                    backgroundColor: "#0b1220",
                    border: "1px solid #1f2937",
                    borderRadius: "14px",
                    padding: "16px",
                    marginBottom: "16px"
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "10px",
                        gap: "12px",
                        flexWrap: "wrap"
                    }}
                >
                    <p style={{ color: "#9ca3af" }}>Daily Loss Usage Bar</p>
                    <p style={{ color: dailyLossUsageColor, fontWeight: "bold" }}>
                        {dailyLossUsagePercent.toFixed(0)}%
                    </p>
                </div>

                <div
                    style={{
                        width: "100%",
                        height: "14px",
                        backgroundColor: "#1f2937",
                        borderRadius: "999px",
                        overflow: "hidden"
                    }}
                >
                    <div
                        style={{
                            width: `${Math.min(dailyLossUsagePercent, 100)}%`,
                            height: "100%",
                            backgroundColor: dailyLossUsageColor,
                            borderRadius: "999px"
                        }}
                    />
                </div>
            </div>

            <div
                style={{
                    backgroundColor: "#0b1220",
                    border: "1px solid #1f2937",
                    borderRadius: "14px",
                    padding: "16px",
                    marginBottom: "16px"
                }}
            >
                <p style={{ color: "#9ca3af", marginBottom: "8px" }}>
                    Risk Interpretation
                </p>

                <p style={{ color: riskLevelColor, fontWeight: "bold" }}>
                    {riskMessage}
                </p>
            </div>

            <div
                style={{
                    backgroundColor: canOpenNewTrade ? "#052e16" : "#450a0a",
                    border: canOpenNewTrade ? "1px solid #166534" : "1px solid #991b1b",
                    borderRadius: "14px",
                    padding: "16px"
                }}
            >
                <p style={{ color: "#d1d5db", marginBottom: "8px" }}>
                    Final Risk Gate
                </p>

                <p style={{ color: permissionColor, fontWeight: "bold" }}>
                    {canOpenNewTrade
                        ? "PASS: The system can allow a new trade under current limits."
                        : "BLOCK: The system should not allow a new trade right now."}
                </p>
            </div>
        </div>
    )
}

export default RiskPanel