import { useState } from "react"

function OpenPositionsTable({ positions = [] }) {
  const [hoveredRow, setHoveredRow] = useState(null)

  const safePositions = Array.isArray(positions) ? positions : []

  const parsePnl = (value) => {
    const cleanedValue = String(value || "0")
      .replace("+", "")
      .replace("$", "")
      .replace(",", "")
      .trim()

    const parsedValue = Number(cleanedValue)

    return Number.isNaN(parsedValue) ? 0 : parsedValue
  }

  const parseNumber = (value) => {
    const parsedValue = Number(value)

    return Number.isNaN(parsedValue) ? 0 : parsedValue
  }

  const totalPositions = safePositions.length
  const buyPositions = safePositions.filter((position) => position.type === "BUY").length
  const sellPositions = safePositions.filter((position) => position.type === "SELL").length
  const totalFloatingPnl = safePositions.reduce(
    (total, position) => total + parsePnl(position.pnl),
    0
  )

  const winningPositions = safePositions.filter(
    (position) => parsePnl(position.pnl) > 0
  ).length

  const losingPositions = safePositions.filter(
    (position) => parsePnl(position.pnl) < 0
  ).length

  const totalLot = safePositions.reduce(
    (total, position) => total + parseNumber(position.lot),
    0
  )

  const portfolioBias =
    buyPositions > sellPositions
      ? "LONG BIAS"
      : sellPositions > buyPositions
        ? "SHORT BIAS"
        : totalPositions === 0
          ? "NO EXPOSURE"
          : "BALANCED"

  const portfolioBiasColor =
    portfolioBias === "LONG BIAS"
      ? "#86efac"
      : portfolioBias === "SHORT BIAS"
        ? "#f87171"
        : portfolioBias === "BALANCED"
          ? "#38bdf8"
          : "#9ca3af"

  const pnlColor =
    totalFloatingPnl > 0
      ? "#86efac"
      : totalFloatingPnl < 0
        ? "#f87171"
        : "#d1d5db"

  const exposureLevel =
    totalPositions === 0
      ? "NONE"
      : totalPositions <= 1
        ? "LOW"
        : totalPositions <= 3
          ? "MEDIUM"
          : "HIGH"

  const exposureColor =
    exposureLevel === "NONE"
      ? "#9ca3af"
      : exposureLevel === "LOW"
        ? "#86efac"
        : exposureLevel === "MEDIUM"
          ? "#facc15"
          : "#f87171"

  const getTypeColor = (type) => {
    if (type === "BUY") return "#86efac"
    if (type === "SELL") return "#f87171"

    return "#d1d5db"
  }

  const getPnlColor = (pnl) => {
    const value = parsePnl(pnl)

    if (value > 0) return "#86efac"
    if (value < 0) return "#f87171"

    return "#9ca3af"
  }

  const getPositionRisk = (position) => {
    const entry = parseNumber(position.entry)
    const sl = parseNumber(position.sl)
    const tp = parseNumber(position.tp)

    if (entry === 0 || sl === 0 || tp === 0) {
      return {
        label: "UNKNOWN",
        color: "#9ca3af",
        helper: "Missing entry, SL, or TP"
      }
    }

    const riskDistance = Math.abs(entry - sl)
    const rewardDistance = Math.abs(tp - entry)

    if (riskDistance === 0) {
      return {
        label: "INVALID",
        color: "#f87171",
        helper: "Stop loss distance is zero"
      }
    }

    const rewardRiskRatio = rewardDistance / riskDistance

    if (rewardRiskRatio >= 2) {
      return {
        label: "GOOD",
        color: "#86efac",
        helper: `R:R ${rewardRiskRatio.toFixed(2)}`
      }
    }

    if (rewardRiskRatio >= 1) {
      return {
        label: "FAIR",
        color: "#facc15",
        helper: `R:R ${rewardRiskRatio.toFixed(2)}`
      }
    }

    return {
      label: "WEAK",
      color: "#f87171",
      helper: `R:R ${rewardRiskRatio.toFixed(2)}`
    }
  }

  const summaryCardStyle = {
    background:
      "linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(11, 18, 32, 0.98))",
    border: "1px solid rgba(55, 65, 81, 0.78)",
    borderRadius: "18px",
    padding: "16px",
    boxShadow: "0 14px 32px rgba(0, 0, 0, 0.2)"
  }

  const summaryLabelStyle = {
    color: "#9ca3af",
    fontSize: "13px",
    marginBottom: "8px"
  }

  const summaryValueStyle = {
    color: "#d1d5db",
    fontSize: "20px",
    fontWeight: "bold",
    letterSpacing: "-0.02em"
  }

  const cellStyle = {
    padding: "16px 12px",
    color: "#d1d5db",
    verticalAlign: "middle"
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

  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(15, 23, 42, 0.96))",
        border: "1px solid rgba(55, 65, 81, 0.76)",
        borderRadius: "24px",
        padding: "24px",
        marginBottom: "24px",
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
            "linear-gradient(90deg, #38bdf8, #84cc16, rgba(56, 189, 248, 0.2))"
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "-70px",
          right: "-70px",
          width: "180px",
          height: "180px",
          borderRadius: "999px",
          backgroundColor: "rgba(56, 189, 248, 0.08)",
          filter: "blur(14px)",
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
                color: "#38bdf8",
                fontSize: "12px",
                fontWeight: "bold",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: "10px"
              }}
            >
              Position Monitor
            </p>

            <h3
              style={{
                color: "#f9fafb",
                fontSize: "24px",
                marginBottom: "8px",
                letterSpacing: "-0.02em"
              }}
            >
              Open Positions
            </h3>

            <p
              style={{
                color: "#9ca3af",
                fontSize: "14px",
                lineHeight: "1.7",
                maxWidth: "760px"
              }}
            >
              Live exposure table with side, lot size, entry, stop loss, take profit,
              floating P&L and reward-to-risk quality.
            </p>
          </div>

          <div
            style={{
              backgroundColor: "rgba(11, 18, 32, 0.9)",
              border: `1px solid ${portfolioBiasColor}`,
              borderRadius: "999px",
              padding: "9px 14px",
              color: portfolioBiasColor,
              fontSize: "12px",
              fontWeight: "bold",
              letterSpacing: "0.08em",
              boxShadow: `0 0 24px ${portfolioBiasColor}22`
            }}
          >
            {portfolioBias}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, minmax(130px, 1fr))",
            gap: "14px",
            marginBottom: "22px"
          }}
        >
          <div style={summaryCardStyle}>
            <p style={summaryLabelStyle}>Total Positions</p>
            <p style={summaryValueStyle}>{totalPositions}</p>
          </div>

          <div style={summaryCardStyle}>
            <p style={summaryLabelStyle}>Total Lot</p>
            <p style={summaryValueStyle}>{totalLot.toFixed(2)}</p>
          </div>

          <div style={summaryCardStyle}>
            <p style={summaryLabelStyle}>Floating P&L</p>
            <p style={{ ...summaryValueStyle, color: pnlColor }}>
              {totalFloatingPnl >= 0 ? "+" : ""}
              {totalFloatingPnl.toFixed(2)}
            </p>
          </div>

          <div style={summaryCardStyle}>
            <p style={summaryLabelStyle}>BUY / SELL</p>
            <p style={summaryValueStyle}>
              <span style={{ color: "#86efac" }}>{buyPositions}</span>
              <span style={{ color: "#6b7280" }}> / </span>
              <span style={{ color: "#f87171" }}>{sellPositions}</span>
            </p>
          </div>

          <div style={summaryCardStyle}>
            <p style={summaryLabelStyle}>Win / Loss</p>
            <p style={summaryValueStyle}>
              <span style={{ color: "#86efac" }}>{winningPositions}</span>
              <span style={{ color: "#6b7280" }}> / </span>
              <span style={{ color: "#f87171" }}>{losingPositions}</span>
            </p>
          </div>

          <div style={summaryCardStyle}>
            <p style={summaryLabelStyle}>Exposure Level</p>
            <p style={{ ...summaryValueStyle, color: exposureColor }}>
              {exposureLevel}
            </p>
          </div>
        </div>

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
              minWidth: "920px"
            }}
          >
            <thead>
              <tr>
                <th style={headerCellStyle}>Symbol</th>
                <th style={headerCellStyle}>Side</th>
                <th style={headerCellStyle}>Lot</th>
                <th style={headerCellStyle}>Entry</th>
                <th style={headerCellStyle}>Stop Loss</th>
                <th style={headerCellStyle}>Take Profit</th>
                <th style={headerCellStyle}>Floating P&L</th>
                <th style={headerCellStyle}>Risk Quality</th>
              </tr>
            </thead>

            <tbody>
              {safePositions.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    style={{
                      padding: "28px 12px",
                      color: "#9ca3af",
                      textAlign: "center",
                      borderTop: "1px solid #1f2937"
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
                        No open positions
                      </p>

                      <p
                        style={{
                          color: "#9ca3af",
                          fontSize: "14px"
                        }}
                      >
                        Current exposure is flat. The table will populate when the bot has active positions.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                safePositions.map((position, index) => {
                  const riskQuality = getPositionRisk(position)
                  const sideColor = getTypeColor(position.type)
                  const rowIsHovered = hoveredRow === index

                  return (
                    <tr
                      key={`${position.symbol}-${position.type}-${index}`}
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
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px"
                          }}
                        >
                          <span
                            style={{
                              width: "9px",
                              height: "9px",
                              borderRadius: "999px",
                              backgroundColor: sideColor,
                              boxShadow: `0 0 16px ${sideColor}`
                            }}
                          />

                          <div>
                            <p
                              style={{
                                color: "#f9fafb",
                                fontWeight: "bold",
                                marginBottom: "4px"
                              }}
                            >
                              {position.symbol || "-"}
                            </p>

                            <p
                              style={{
                                color: "#6b7280",
                                fontSize: "12px"
                              }}
                            >
                              Position #{index + 1}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td style={cellStyle}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: "72px",
                            padding: "7px 10px",
                            borderRadius: "999px",
                            backgroundColor:
                              position.type === "BUY"
                                ? "rgba(20, 83, 45, 0.36)"
                                : position.type === "SELL"
                                  ? "rgba(127, 29, 29, 0.36)"
                                  : "rgba(31, 41, 55, 0.72)",
                            border: `1px solid ${sideColor}`,
                            color: sideColor,
                            fontWeight: "bold",
                            fontSize: "12px"
                          }}
                        >
                          {position.type || "-"}
                        </span>
                      </td>

                      <td style={cellStyle}>
                        <p style={{ color: "#d1d5db", fontWeight: "bold" }}>
                          {position.lot || "-"}
                        </p>
                      </td>

                      <td style={cellStyle}>
                        <p style={{ color: "#d1d5db", fontWeight: "bold" }}>
                          {position.entry || "-"}
                        </p>
                      </td>

                      <td style={cellStyle}>
                        <p style={{ color: "#f87171", fontWeight: "bold" }}>
                          {position.sl || "-"}
                        </p>
                      </td>

                      <td style={cellStyle}>
                        <p style={{ color: "#86efac", fontWeight: "bold" }}>
                          {position.tp || "-"}
                        </p>
                      </td>

                      <td style={cellStyle}>
                        <p
                          style={{
                            color: getPnlColor(position.pnl),
                            fontWeight: "bold",
                            fontSize: "15px"
                          }}
                        >
                          {position.pnl || "-"}
                        </p>
                      </td>

                      <td style={cellStyle}>
                        <div
                          style={{
                            display: "inline-flex",
                            flexDirection: "column",
                            gap: "5px",
                            minWidth: "92px"
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "7px 10px",
                              borderRadius: "999px",
                              backgroundColor: "rgba(17, 24, 39, 0.9)",
                              border: `1px solid ${riskQuality.color}`,
                              color: riskQuality.color,
                              fontWeight: "bold",
                              fontSize: "12px"
                            }}
                          >
                            {riskQuality.label}
                          </span>

                          <span
                            style={{
                              color: "#6b7280",
                              fontSize: "12px"
                            }}
                          >
                            {riskQuality.helper}
                          </span>
                        </div>
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

export default OpenPositionsTable