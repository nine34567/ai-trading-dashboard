function OpenPositionsTable({ positions }) {
  return (
    <div
      style={{
        backgroundColor: "#111827",
        padding: "24px",
        borderRadius: "16px"
      }}
    >
      <h3 style={{ marginBottom: "20px" }}>Open Positions</h3>

      {positions.length === 0 ? (
        <p style={{ color: "#9ca3af" }}>No open positions</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ color: "#9ca3af", textAlign: "left" }}>
              <th style={{ paddingBottom: "12px" }}>Symbol</th>
              <th style={{ paddingBottom: "12px" }}>Type</th>
              <th style={{ paddingBottom: "12px" }}>Lot</th>
              <th style={{ paddingBottom: "12px" }}>Entry</th>
              <th style={{ paddingBottom: "12px" }}>SL</th>
              <th style={{ paddingBottom: "12px" }}>TP</th>
              <th style={{ paddingBottom: "12px" }}>P&L</th>
            </tr>
          </thead>

          <tbody>
            {positions.map((item, index) => (
              <tr key={index} style={{ borderTop: "1px solid #1f2937" }}>
                <td style={{ padding: "14px 0" }}>{item.symbol}</td>
                <td style={{ padding: "14px 0", color: "#f87171" }}>{item.type}</td>
                <td style={{ padding: "14px 0" }}>{item.lot}</td>
                <td style={{ padding: "14px 0" }}>{item.entry}</td>
                <td style={{ padding: "14px 0" }}>{item.sl}</td>
                <td style={{ padding: "14px 0" }}>{item.tp}</td>
                <td style={{ padding: "14px 0", color: "#86efac" }}>{item.pnl}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default OpenPositionsTable