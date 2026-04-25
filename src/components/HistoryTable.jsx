import { useState } from "react"
import { clearHistory } from "../api"

function HistoryTable({ historyItems = [] }) {
    const [clearing, setClearing] = useState(false)
    const [clearError, setClearError] = useState("")
    const [exportSuccess, setExportSuccess] = useState("")

    const getTypeColor = (type) => {
        if (type === "START") return "#86efac"
        if (type === "STOP") return "#f87171"
        if (type === "EMERGENCY") return "#f87171"
        if (type === "SETTINGS") return "#facc15"
        if (type === "BUY") return "#86efac"
        if (type === "SELL") return "#f87171"

        return "#d1d5db"
    }

    const getSymbolColor = (symbol) => {
        if (symbol === "BOT") return "#38bdf8"
        if (symbol === "ACCOUNT") return "#86efac"
        if (symbol === "RISK") return "#facc15"
        if (symbol === "SYSTEM") return "#d1d5db"

        return "#d1d5db"
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

        if (historyItems.length === 0) {
            setClearError("No history records to export.")
            return
        }

        const headers = ["Date", "Area", "Type", "Detail", "P&L"]

        const rows = historyItems.map((item) => [
            item.date || "",
            item.symbol || "",
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

    return (
        <div
            style={{
                backgroundColor: "#111827",
                padding: "24px",
                borderRadius: "16px",
                overflowX: "auto"
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    flexWrap: "wrap",
                    marginBottom: "20px"
                }}
            >
                <h3>Trade & Activity History</h3>

                <div
                    style={{
                        display: "flex",
                        gap: "12px",
                        flexWrap: "wrap"
                    }}
                >
                    <button
                        onClick={handleExportCsv}
                        style={{
                            backgroundColor: "#2563eb",
                            color: "white",
                            border: "none",
                            padding: "10px 16px",
                            borderRadius: "12px",
                            fontWeight: "bold",
                            cursor: "pointer"
                        }}
                    >
                        Export History CSV
                    </button>

                    <button
                        onClick={handleClearHistory}
                        disabled={clearing}
                        style={{
                            backgroundColor: "#dc2626",
                            color: "white",
                            border: "none",
                            padding: "10px 16px",
                            borderRadius: "12px",
                            fontWeight: "bold",
                            cursor: clearing ? "not-allowed" : "pointer",
                            opacity: clearing ? 0.7 : 1
                        }}
                    >
                        {clearing ? "Clearing..." : "Clear History"}
                    </button>
                </div>
            </div>

            {clearError && (
                <div
                    style={{
                        backgroundColor: "#450a0a",
                        border: "1px solid #991b1b",
                        borderRadius: "14px",
                        padding: "14px",
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
                        borderRadius: "14px",
                        padding: "14px",
                        marginBottom: "16px"
                    }}
                >
                    <p style={{ color: "#bbf7d0", fontWeight: "bold" }}>
                        {exportSuccess}
                    </p>
                </div>
            )}

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr style={{ color: "#9ca3af", textAlign: "left" }}>
                        <th style={{ paddingBottom: "12px", minWidth: "160px" }}>
                            Date
                        </th>

                        <th style={{ paddingBottom: "12px", minWidth: "120px" }}>
                            Area
                        </th>

                        <th style={{ paddingBottom: "12px", minWidth: "120px" }}>
                            Type
                        </th>

                        <th style={{ paddingBottom: "12px", minWidth: "320px" }}>
                            Detail
                        </th>

                        <th style={{ paddingBottom: "12px", minWidth: "100px" }}>
                            P&L
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {historyItems.length === 0 ? (
                        <tr style={{ borderTop: "1px solid #1f2937" }}>
                            <td
                                colSpan="5"
                                style={{
                                    padding: "16px 0",
                                    color: "#9ca3af"
                                }}
                            >
                                No history records found.
                            </td>
                        </tr>
                    ) : (
                        historyItems.map((item, index) => (
                            <tr
                                key={`${item.date}-${item.symbol}-${item.type}-${index}`}
                                style={{ borderTop: "1px solid #1f2937" }}
                            >
                                <td style={{ padding: "14px 0", color: "#d1d5db" }}>
                                    {item.date}
                                </td>

                                <td
                                    style={{
                                        padding: "14px 0",
                                        color: getSymbolColor(item.symbol),
                                        fontWeight: "bold"
                                    }}
                                >
                                    {item.symbol}
                                </td>

                                <td
                                    style={{
                                        padding: "14px 0",
                                        color: getTypeColor(item.type),
                                        fontWeight: "bold"
                                    }}
                                >
                                    {item.type}
                                </td>

                                <td
                                    style={{
                                        padding: "14px 20px 14px 0",
                                        color: "#d1d5db",
                                        lineHeight: "1.5"
                                    }}
                                >
                                    {item.detail || "-"}
                                </td>

                                <td
                                    style={{
                                        padding: "14px 0",
                                        color:
                                            String(item.pnl || "").includes("+")
                                                ? "#86efac"
                                                : String(item.pnl || "").includes("-") &&
                                                    item.pnl !== "-"
                                                    ? "#f87171"
                                                    : "#9ca3af",
                                        fontWeight: "bold"
                                    }}
                                >
                                    {item.pnl || "-"}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}

export default HistoryTable