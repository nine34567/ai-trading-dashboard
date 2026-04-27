import { useState } from "react"

function StatCard({ title, value, color = "#d1d5db" }) {
    const [isHovered, setIsHovered] = useState(false)

    const safeTitle = title || "Metric"
    const safeValue = value ?? "-"

    const titleText = String(safeTitle).toLowerCase()
    const valueText = String(safeValue).toLowerCase()

    const getTone = () => {
        if (
            titleText.includes("p&l") ||
            titleText.includes("profit") ||
            titleText.includes("loss")
        ) {
            if (valueText.includes("-")) return "danger"
            if (valueText.includes("+")) return "success"
        }

        if (titleText.includes("bot") || titleText.includes("system")) {
            if (valueText.includes("running") || valueText.includes("active")) return "success"
            if (valueText.includes("stopped") || valueText.includes("inactive")) return "danger"
        }

        if (titleText.includes("position")) {
            const numericValue = Number(valueText)

            if (!Number.isNaN(numericValue) && numericValue > 0) return "info"
            return "warning"
        }

        if (titleText.includes("risk") || titleText.includes("var")) {
            return "warning"
        }

        if (titleText.includes("account") || titleText.includes("balance")) {
            return "neutral"
        }

        return "neutral"
    }

    const tone = getTone()

    const toneConfig = {
        success: {
            accent: color || "#86efac",
            glow: "rgba(134, 239, 172, 0.18)",
            border: "rgba(134, 239, 172, 0.34)",
            background:
                "linear-gradient(135deg, rgba(20, 83, 45, 0.36), rgba(17, 24, 39, 0.98))",
            badgeText: "GOOD",
            badgeBackground: "rgba(20, 83, 45, 0.45)"
        },
        danger: {
            accent: color || "#f87171",
            glow: "rgba(248, 113, 113, 0.2)",
            border: "rgba(248, 113, 113, 0.36)",
            background:
                "linear-gradient(135deg, rgba(127, 29, 29, 0.38), rgba(17, 24, 39, 0.98))",
            badgeText: "ALERT",
            badgeBackground: "rgba(127, 29, 29, 0.45)"
        },
        warning: {
            accent: color || "#facc15",
            glow: "rgba(250, 204, 21, 0.18)",
            border: "rgba(250, 204, 21, 0.34)",
            background:
                "linear-gradient(135deg, rgba(113, 63, 18, 0.34), rgba(17, 24, 39, 0.98))",
            badgeText: "WATCH",
            badgeBackground: "rgba(113, 63, 18, 0.45)"
        },
        info: {
            accent: color || "#38bdf8",
            glow: "rgba(56, 189, 248, 0.18)",
            border: "rgba(56, 189, 248, 0.34)",
            background:
                "linear-gradient(135deg, rgba(7, 89, 133, 0.34), rgba(17, 24, 39, 0.98))",
            badgeText: "LIVE",
            badgeBackground: "rgba(7, 89, 133, 0.45)"
        },
        neutral: {
            accent: color || "#d1d5db",
            glow: "rgba(148, 163, 184, 0.14)",
            border: "rgba(75, 85, 99, 0.72)",
            background:
                "linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(11, 18, 32, 0.98))",
            badgeText: "DATA",
            badgeBackground: "rgba(31, 41, 55, 0.7)"
        }
    }

    const currentTone = toneConfig[tone]

    const getHelperText = () => {
        if (titleText.includes("balance")) {
            return "Account capital snapshot"
        }

        if (titleText.includes("daily") && titleText.includes("p&l")) {
            return valueText.includes("-")
                ? "Daily performance under pressure"
                : "Daily performance positive"
        }

        if (titleText.includes("bot")) {
            return valueText.includes("running")
                ? "Execution engine is online"
                : "Execution engine is stopped"
        }

        if (titleText.includes("system")) {
            return valueText.includes("active")
                ? "System permission is active"
                : "System permission is inactive"
        }

        if (titleText.includes("open position")) {
            return Number(valueText) > 0
                ? "Live market exposure detected"
                : "No active exposure"
        }

        if (titleText.includes("start")) {
            return "Number of start actions"
        }

        if (titleText.includes("stop")) {
            return "Number of stop actions"
        }

        if (titleText.includes("record")) {
            return "Total activity records"
        }

        if (titleText.includes("area")) {
            return "Activity grouped by system area"
        }

        return "Live dashboard metric"
    }

    const helperText = getHelperText()

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                position: "relative",
                overflow: "hidden",
                background: currentTone.background,
                border: `1px solid ${currentTone.border}`,
                borderRadius: "22px",
                padding: "20px",
                minHeight: "138px",
                boxShadow: isHovered
                    ? `0 24px 60px rgba(0, 0, 0, 0.34), 0 0 36px ${currentTone.glow}`
                    : `0 16px 38px rgba(0, 0, 0, 0.24), 0 0 24px ${currentTone.glow}`,
                transform: isHovered ? "translateY(-3px)" : "translateY(0)",
                transition: "all 0.22s ease",
                cursor: "default"
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: "-42px",
                    right: "-42px",
                    width: "120px",
                    height: "120px",
                    borderRadius: "999px",
                    backgroundColor: currentTone.glow,
                    filter: "blur(10px)"
                }}
            />

            <div
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: "4px",
                    backgroundColor: currentTone.accent,
                    opacity: 0.9
                }}
            />

            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    flexDirection: "column",
                    height: "100%"
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "12px",
                        marginBottom: "16px"
                    }}
                >
                    <div>
                        <p
                            style={{
                                color: "#9ca3af",
                                fontSize: "13px",
                                fontWeight: "bold",
                                letterSpacing: "0.02em",
                                marginBottom: "6px"
                            }}
                        >
                            {safeTitle}
                        </p>

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}
                        >
                            <span
                                style={{
                                    width: "7px",
                                    height: "7px",
                                    borderRadius: "999px",
                                    backgroundColor: currentTone.accent,
                                    boxShadow: `0 0 14px ${currentTone.accent}`
                                }}
                            />

                            <p
                                style={{
                                    color: "#6b7280",
                                    fontSize: "12px"
                                }}
                            >
                                Live metric
                            </p>
                        </div>
                    </div>

                    <div
                        style={{
                            backgroundColor: currentTone.badgeBackground,
                            border: `1px solid ${currentTone.border}`,
                            color: currentTone.accent,
                            borderRadius: "999px",
                            padding: "6px 10px",
                            fontSize: "11px",
                            fontWeight: "bold",
                            letterSpacing: "0.06em",
                            whiteSpace: "nowrap"
                        }}
                    >
                        {currentTone.badgeText}
                    </div>
                </div>

                <div style={{ marginTop: "auto" }}>
                    <h2
                        style={{
                            color: currentTone.accent,
                            fontSize: "30px",
                            lineHeight: "1.05",
                            letterSpacing: "-0.04em",
                            marginBottom: "10px",
                            wordBreak: "break-word"
                        }}
                    >
                        {safeValue}
                    </h2>

                    <p
                        style={{
                            color: "#9ca3af",
                            fontSize: "13px",
                            lineHeight: "1.55",
                            marginBottom: "14px"
                        }}
                    >
                        {helperText}
                    </p>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1.4fr 0.8fr 0.5fr",
                            gap: "6px"
                        }}
                    >
                        <div
                            style={{
                                height: "4px",
                                borderRadius: "999px",
                                backgroundColor: currentTone.accent,
                                opacity: 0.9
                            }}
                        />

                        <div
                            style={{
                                height: "4px",
                                borderRadius: "999px",
                                backgroundColor: currentTone.accent,
                                opacity: 0.45
                            }}
                        />

                        <div
                            style={{
                                height: "4px",
                                borderRadius: "999px",
                                backgroundColor: currentTone.accent,
                                opacity: 0.22
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StatCard