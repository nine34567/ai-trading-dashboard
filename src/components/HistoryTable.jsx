function HistoryTable({ historyItems }) {
    return (
        <div
            style={{
                backgroundColor: "#111827",
                padding: "24px",
                borderRadius: "16px"
            }}
        >
            <h3 style={{ marginBottom: "20px" }}>Trade History</h3>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr style={{ color: "#9ca3af", textAlign: "left" }}>
                        <th style={{ paddingBottom: "12px" }}>Date</th>
                        <th style={{ paddingBottom: "12px" }}>Symbol</th>
                        <th style={{ paddingBottom: "12px" }}>Type</th>
                        <th style={{ paddingBottom: "12px" }}>P&L</th>
                    </tr>
                </thead>

                <tbody>
                    {historyItems.map((item, index) => (
                        <tr key={index} style={{ borderTop: "1px solid #1f2937" }}>
                            <td style={{ padding: "14px 0" }}>{item.date}</td>
                            <td>{item.symbol}</td>
                            <td
                                style={{
                                    color:
                                        item.type === "SELL" || item.type === "STOP" || item.type === "EMERGENCY"
                                            ? "#f87171"
                                            : "#86efac"
                                }}
                            >
                                {item.type}
                            </td>
                            <td
                                style={{
                                    color: item.pnl.startsWith("+") ? "#86efac" : "#d1d5db"
                                }}
                            >
                                {item.pnl}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default HistoryTable