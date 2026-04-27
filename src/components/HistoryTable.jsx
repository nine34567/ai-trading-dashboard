import { useState } from "react"
import { clearHistory } from "../api"

function HistoryTable({ historyItems = [] }) {
    const [clearing, setClearing] = useState(false)
    const [clearError, setClearError] = useState("")
    const [exportSuccess, setExportSuccess] = useState("")
    const [hoveredRow, setHoveredRow] = useState(null)

    const safeHistoryItems = Array.isArray(historyItems) ? historyItems : []

    const getTypeColor = (type) => {
        if (type === "START") return "#86efac"
        if (type === "STOP") return "#f87171"
        if (type === "EMERGENCY") return "#f87171"
        if (type === "SETTINGS") return "#facc15"
        if (type === "BUY") return "#86efac"
        if (type === "SELL") return "#f87171"

        return "#d1d5db"
    }

    const getTypeBackground = (type) => {
        if (type === "START") return "rgba(20, 83, 45, 0.36)"
        if (type === "STOP") return "rgba(127, 29, 29, 0.36)"
        if (type === "EMERGENCY") return "rgba(127, 29, 29, 0.46)"
        if (type === "SETTINGS") return "rgba(113, 63, 18, 0.38)"
        if (type === "BUY") return "rgba(20, 83, 45, 0.36)"
        if (type === "SELL") return "rgba(127, 29, 29, 0.36)"

        return "rgba(31, 41, 55, 0.72)"
    }

    const getAreaColor = (area) => {
        if (area === "BOT") return "#38bdf8"
        if (area === "ACCOUNT") return "#86efac"
        if (area === "RISK") return "#facc15"
        if (area === "SYSTEM") return "#d1d5db"

        return "#d1d5db"
    }

    const getAreaBackground = (area) => {
        if (area === "BOT") return "rgba(7, 89, 133, 0.38)"
        if (area === "ACCOUNT") return "rgba(20, 83, 45, 0.36)"
        if (area === "RISK") return "rgba(113, 63, 18, 0.38)"
        if (area === "SYSTEM") return "rgba(31, 41, 55, 0.72)"

        return "rgba(31, 41, 55, 0.72)"
    }

    const getPnlColor = (pnl) => {
        const pnlText = String(pnl || "-")

        if (pnlText.includes("+")) return "#86efac"
        if (pnlText.includes("-") && pnlText !== "-") return "#f87171"

        return "#9ca3af"
    }

    const getEventPriority = (item) => {
        if (item.type === "EMERGENCY") {
            return {
                label: "CRITICAL",
                color: "#f87171",
                background: "rgba(127, 29, 29, 0.42)"
            }
        }

        if (item.area === "RISK") {
            return {
                label: "HIGH",
                color: "#fb923c",
                background: "rgba(154, 52, 18, 0.38)"
            }
        }

        if (item.type === "STOP") {
            return {
                label: "WATCH",
                color: "#facc15",
                background: "rgba(113, 63, 18, 0.38)"
            }
        }

        if (item.type === "START") {
            return {
                label: "NORMAL",
                color: "#86efac",
                background: "rgba(20, 83, 45, 0.34)"
            }
        }

        if (item.type === "SETTINGS") {
            return {
                label: "CONFIG",
                color: "#38bdf8",
                background: "rgba(7, 89, 133, 0.34)"
            }
        }

        return {
            label: "INFO",
            color: "#d1d5db",
            background: "rgba(31, 41, 55, 0.72)"
        }
    }

    const escapeCsvValue = (value) => {
        const textValue = String(value ?? "")

        if (
            textValue.includes(",") ||
            textValue.includes('"') ||
            textValue.includes("\n") ||
            textValue.includes("\r")
        ) {
            return `"${textValue.replace(/"/g, '""')}"`
        }

        return textValue
    }

    const handleExportCsv = () => {
        setClearError("")
        setExportSuccess("")

        if (safeHistoryItems.length === 0) {
            setClearError("No history records to export.")
            return
        }

        const headers = ["Date", "Area", "Type", "Detail", "P&L"]

        const rows = safeHistoryItems.map((item) => [
            item.date || "",
            item.area || item.symbol || "",
            item.type || "",
            item.detail || "",
            item.pnl || ""
        ])

        const csvContent = [headers, ...rows]
            .map((row) => row.map(escapeCsvValue).join(","))
            .join("\n")

        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;"
        })

        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")

        const now = new Date()
        const timestamp = now
            .toISOString()
            .replaceAll(":", "-")
            .replaceAll(".", "-")

        link.href = url
        link.download = `trade-history-${timestamp}.csv`

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        URL.revokeObjectURL(url)

        setExportSuccess("History exported successfully.")
    }

    const handleClearHistory = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to clear all history?"
        )

        if (!confirmed) return

        try {
            setClearing(true)
            setClearError("")
            setExportSuccess("")

            await clearHistory()

            window.location.reload()
        } catch (error) {
            setClearError(error.message || "Failed to clear history")
        } finally {
            setClearing(false)
        }
    }

    const totalRecords = safeHistoryItems.length
    const botRecords = safeHistoryItems.filter((item) => (item.area || item.symbol) === "BOT").length
    const accountRecords = safeHistoryItems.filter((item) => (item.area || item.symbol) === "ACCOUNT").length
    const riskRecords = safeHistoryItems.filter((item) => (item.area || item.symbol) === "RISK").length
    const systemRecords = safeHistoryItems.filter((item) => (item.area || item.symbol) === "SYSTEM").length
    const emergencyRecords = safeHistoryItems.filter((item) => item.type === "EMERGENCY").length
    const settingsRecords = safeHistoryItems.filter((item) => item.type === "SETTINGS").length

    const latestRecord = safeHistoryItems.length > 0 ? safeHistoryItems[0] : null

    const latestPriority = latestRecord
        ? getEventPriority(latestRecord)
        : {
            label: "NO DATA",
            color: "#9ca3af",
            background: "rgba(31, 41, 55, 0.72)"
        }

    const summaryCardStyle = {
        background:
            "linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(11, 18, 32, 0.98))",
        border: "1px solid rgba(55, 65, 81, 0.78)",
        borderRadius: "16px",
        padding: "15px",
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.18)"
    }

    const summaryLabelStyle = {
        color: "#9ca3af",
        fontSize: "13px",
        marginBottom: "7px"
    }

    const summaryValueStyle = {
        color: "#d1d5db",
        fontWeight: "bold",
        fontSize: "20px",
        letterSpacing: "-0.02em"
    }

    const headerCellStyle = {
        padding: "0 12px 14px",
        color: "#9ca3af",
        fontSize: "12px",
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        textAlign: "left",
        whiteSpace: "nowrap"
    }

    const cellStyle = {
        padding: "16px 12px",
        color: "#d1d5db",
        verticalAlign: "middle"
    }

    return (
        <div
            style={{
                background:
                    "linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(15, 23, 42, 0.96))",
                border: "1px solid rgba(55, 65, 81, 0.76)",
                padding: "24px",
                borderRadius: "24px",
                overflowX: "auto",
                boxShadow: "0 22px 52px rgba(0, 0, 0, 0.24)",
                position: "relative",
                overflow: "hidden"
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background:
                        "linear-gradient(90deg, #facc15, #38bdf8, rgba(250, 204, 21, 0.2))"
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
                    backgroundColor: "rgba(250, 204, 21, 0.07)",
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
                            Activity Intelligence
                        </p>

                        <h3
                            style={{
                                color: "#f9fafb",
                                fontSize: "24px",
                                marginBottom: "8px",
                                letterSpacing: "-0.02em"
                            }}
                        >
                            Trade & Activity History
                        </h3>

                        <p
                            style={{
                                color: "#9ca3af",
                                fontSize: "14px",
                                lineHeight: "1.7",
                                maxWidth: "760px"
                            }}
                        >
                            Professional activity log with area classification, event priority,
                            exportable CSV records, and operational audit trail.
                        </p>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: "12px",
                            flexWrap: "wrap",
                            justifyContent: "flex-end"
                        }}
                    >
                        <button
                            onClick={handleExportCsv}
                            style={{
                                background:
                                    "linear-gradient(135deg, #2563eb, #38bdf8)",
                                color: "white",
                                border: "none",
                                padding: "11px 16px",
                                borderRadius: "14px",
                                fontWeight: "bold",
                                cursor: "pointer",
                                boxShadow: "0 14px 30px rgba(37, 99, 235, 0.25)"
                            }}
                        >
                            Export History CSV
                        </button>

                        <button
                            onClick={handleClearHistory}
                            disabled={clearing}
                            style={{
                                background:
                                    "linear-gradient(135deg, #991b1b, #dc2626)",
                                color: "white",
                                border: "none",
                                padding: "11px 16px",
                                borderRadius: "14px",
                                fontWeight: "bold",
                                cursor: clearing ? "not-allowed" : "pointer",
                                opacity: clearing ? 0.7 : 1,
                                boxShadow: "0 14px 30px rgba(220, 38, 38, 0.22)"
                            }}
                        >
                            {clearing ? "Clearing..." : "Clear History"}
                        </button>
                    </div>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, minmax(130px, 1fr))",
                        gap: "14px",
                        marginBottom: "20px"
                    }}
                >
                    <div style={summaryCardStyle}>
                        <p style={summaryLabelStyle}>Total Records</p>
                        <p style={summaryValueStyle}>{totalRecords}</p>
                    </div>

                    <div style={summaryCardStyle}>
                        <p style={summaryLabelStyle}>BOT</p>
                        <p style={{ ...summaryValueStyle, color: "#38bdf8" }}>
                            {botRecords}
                        </p>
                    </div>

                    <div style={summaryCardStyle}>
                        <p style={summaryLabelStyle}>ACCOUNT</p>
                        <p style={{ ...summaryValueStyle, color: "#86efac" }}>
                            {accountRecords}
                        </p>
                    </div>

                    <div style={summaryCardStyle}>
                        <p style={summaryLabelStyle}>RISK</p>
                        <p style={{ ...summaryValueStyle, color: "#facc15" }}>
                            {riskRecords}
                        </p>
                    </div>

                    <div style={summaryCardStyle}>
                        <p style={summaryLabelStyle}>SYSTEM</p>
                        <p style={{ ...summaryValueStyle, color: "#d1d5db" }}>
                            {systemRecords}
                        </p>
                    </div>

                    <div style={summaryCardStyle}>
                        <p style={summaryLabelStyle}>SETTINGS</p>
                        <p style={{ ...summaryValueStyle, color: "#38bdf8" }}>
                            {settingsRecords}
                        </p>
                    </div>

                    <div style={summaryCardStyle}>
                        <p style={summaryLabelStyle}>EMERGENCY</p>
                        <p style={{ ...summaryValueStyle, color: "#f87171" }}>
                            {emergencyRecords}
                        </p>
                    </div>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(260px, 0.8fr) minmax(360px, 1.2fr)",
                        gap: "14px",
                        marginBottom: "20px"
                    }}
                >
                    <div
                        style={{
                            backgroundColor: latestPriority.background,
                            border: `1px solid ${latestPriority.color}`,
                            borderRadius: "18px",
                            padding: "16px"
                        }}
                    >
                        <p style={{ color: "#9ca3af", marginBottom: "8px", fontSize: "13px" }}>
                            Latest Event Priority
                        </p>

                        <p
                            style={{
                                color: latestPriority.color,
                                fontWeight: "bold",
                                fontSize: "20px",
                                marginBottom: "8px"
                            }}
                        >
                            {latestPriority.label}
                        </p>

                        <p style={{ color: "#9ca3af", fontSize: "13px", lineHeight: "1.6" }}>
                            {latestRecord
                                ? `${latestRecord.type || "-"} • ${latestRecord.area || latestRecord.symbol || "-"}`
                                : "No activity record available."}
                        </p>
                    </div>

                    <div
                        style={{
                            backgroundColor: "#0b1220",
                            border: "1px solid #1f2937",
                            borderRadius: "18px",
                            padding: "16px"
                        }}
                    >
                        <p style={{ color: "#9ca3af", marginBottom: "8px", fontSize: "13px" }}>
                            Latest Detail
                        </p>

                        <p
                            style={{
                                color: "#d1d5db",
                                fontWeight: "bold",
                                lineHeight: "1.7",
                                marginBottom: "8px"
                            }}
                        >
                            {latestRecord ? latestRecord.detail || "-" : "No latest activity."}
                        </p>

                        <p style={{ color: "#6b7280", fontSize: "13px" }}>
                            {latestRecord ? latestRecord.date || "-" : "-"}
                        </p>
                    </div>
                </div>

                {clearError && (
                    <div
                        style={{
                            backgroundColor: "#450a0a",
                            border: "1px solid #991b1b",
                            borderRadius: "16px",
                            padding: "15px",
                            marginBottom: "16px"
                        }}
                    >
                        <p style={{ color: "#fecaca", fontWeight: "bold" }}>
                            {clearError}
                        </p>
                    </div>
                )}

                {exportSuccess && (
                    <div
                        style={{
                            backgroundColor: "#052e16",
                            border: "1px solid #166534",
                            borderRadius: "16px",
                            padding: "15px",
                            marginBottom: "16px"
                        }}
                    >
                        <p style={{ color: "#bbf7d0", fontWeight: "bold" }}>
                            {exportSuccess}
                        </p>
                    </div>
                )}

                <div
                    style={{
                        backgroundColor: "#0b1220",
                        border: "1px solid #1f2937",
                        borderRadius: "20px",
                        padding: "18px",
                        overflowX: "auto"
                    }}
                >
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            minWidth: "980px"
                        }}
                    >
                        <thead>
                            <tr>
                                <th style={headerCellStyle}>Date</th>
                                <th style={headerCellStyle}>Area</th>
                                <th style={headerCellStyle}>Type</th>
                                <th style={headerCellStyle}>Priority</th>
                                <th style={headerCellStyle}>Detail</th>
                                <th style={headerCellStyle}>P&L</th>
                            </tr>
                        </thead>

                        <tbody>
                            {safeHistoryItems.length === 0 ? (
                                <tr style={{ borderTop: "1px solid #1f2937" }}>
                                    <td
                                        colSpan="6"
                                        style={{
                                            padding: "28px 12px",
                                            color: "#9ca3af",
                                            textAlign: "center"
                                        }}
                                    >
                                        <div
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(11, 18, 32, 0.95))",
                                                border: "1px dashed #374151",
                                                borderRadius: "18px",
                                                padding: "26px"
                                            }}
                                        >
                                            <p
                                                style={{
                                                    color: "#d1d5db",
                                                    fontWeight: "bold",
                                                    marginBottom: "8px"
                                                }}
                                            >
                                                No history records found.
                                            </p>

                                            <p style={{ color: "#9ca3af", fontSize: "14px" }}>
                                                Activity records will appear when the bot runs, settings change, or risk events occur.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                safeHistoryItems.map((item, index) => {
                                    const area = item.area || item.symbol || "-"
                                    const pnlText = item.pnl || "-"
                                    const priority = getEventPriority(item)
                                    const rowIsHovered = hoveredRow === index

                                    return (
                                        <tr
                                            key={`${item.date}-${area}-${item.type}-${index}`}
                                            onMouseEnter={() => setHoveredRow(index)}
                                            onMouseLeave={() => setHoveredRow(null)}
                                            style={{
                                                borderTop: "1px solid #1f2937",
                                                backgroundColor: rowIsHovered
                                                    ? "rgba(31, 41, 55, 0.54)"
                                                    : "transparent",
                                                transition: "background-color 0.18s ease"
                                            }}
                                        >
                                            <td style={cellStyle}>
                                                <div>
                                                    <p
                                                        style={{
                                                            color: "#d1d5db",
                                                            fontWeight: "bold",
                                                            marginBottom: "4px"
                                                        }}
                                                    >
                                                        {item.date || "-"}
                                                    </p>

                                                    <p
                                                        style={{
                                                            color: "#6b7280",
                                                            fontSize: "12px"
                                                        }}
                                                    >
                                                        Record #{index + 1}
                                                    </p>
                                                </div>
                                            </td>

                                            <td style={cellStyle}>
                                                <span
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        minWidth: "90px",
                                                        padding: "7px 10px",
                                                        borderRadius: "999px",
                                                        backgroundColor: getAreaBackground(area),
                                                        border: `1px solid ${getAreaColor(area)}`,
                                                        color: getAreaColor(area),
                                                        fontWeight: "bold",
                                                        fontSize: "12px"
                                                    }}
                                                >
                                                    {area}
                                                </span>
                                            </td>

                                            <td style={cellStyle}>
                                                <span
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        minWidth: "96px",
                                                        padding: "7px 10px",
                                                        borderRadius: "999px",
                                                        backgroundColor: getTypeBackground(item.type),
                                                        border: `1px solid ${getTypeColor(item.type)}`,
                                                        color: getTypeColor(item.type),
                                                        fontWeight: "bold",
                                                        fontSize: "12px"
                                                    }}
                                                >
                                                    {item.type || "-"}
                                                </span>
                                            </td>

                                            <td style={cellStyle}>
                                                <span
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        minWidth: "96px",
                                                        padding: "7px 10px",
                                                        borderRadius: "999px",
                                                        backgroundColor: priority.background,
                                                        border: `1px solid ${priority.color}`,
                                                        color: priority.color,
                                                        fontWeight: "bold",
                                                        fontSize: "12px"
                                                    }}
                                                >
                                                    {priority.label}
                                                </span>
                                            </td>

                                            <td
                                                style={{
                                                    ...cellStyle,
                                                    minWidth: "360px"
                                                }}
                                            >
                                                <p
                                                    style={{
                                                        color: "#d1d5db",
                                                        lineHeight: "1.6",
                                                        fontWeight: "bold"
                                                    }}
                                                >
                                                    {item.detail || "-"}
                                                </p>
                                            </td>

                                            <td style={cellStyle}>
                                                <p
                                                    style={{
                                                        color: getPnlColor(pnlText),
                                                        fontWeight: "bold",
                                                        fontSize: "15px"
                                                    }}
                                                >
                                                    {pnlText}
                                                </p>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default HistoryTable