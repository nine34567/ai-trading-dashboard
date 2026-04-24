function PriceChart({ data = [], symbol = "-", timeframe = "-" }) {
    const width = 700
    const height = 240
    const padding = 36

    const prices = data.map((item) => Number(item.price))
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 1
    const priceRange = maxPrice - minPrice || 1

    const firstPrice = prices.length > 0 ? prices[0] : 0
    const lastPrice = prices.length > 0 ? prices[prices.length - 1] : 0
    const priceChange = prices.length > 0 ? lastPrice - firstPrice : 0
    const priceChangePercent =
        firstPrice !== 0 ? (priceChange / firstPrice) * 100 : 0

    const direction =
        priceChange > 0 ? "UP" : priceChange < 0 ? "DOWN" : "FLAT"

    const directionColor =
        direction === "UP"
            ? "#86efac"
            : direction === "DOWN"
                ? "#f87171"
                : "#d1d5db"

    const totalMoves = data.length > 1 ? data.length - 1 : 0

    const upMoves = data.filter((item, index) => {
        if (index === 0) return false
        return Number(item.price) > Number(data[index - 1].price)
    }).length

    const downMoves = data.filter((item, index) => {
        if (index === 0) return false
        return Number(item.price) < Number(data[index - 1].price)
    }).length

    const flatMoves = data.filter((item, index) => {
        if (index === 0) return false
        return Number(item.price) === Number(data[index - 1].price)
    }).length

    const averageMove =
        totalMoves > 0 ? priceChange / totalMoves : 0

    const chartBias =
        direction === "UP" && upMoves >= downMoves
            ? "BULLISH"
            : direction === "DOWN" && downMoves >= upMoves
                ? "BEARISH"
                : "MIXED"

    const chartBiasColor =
        chartBias === "BULLISH"
            ? "#86efac"
            : chartBias === "BEARISH"
                ? "#f87171"
                : "#facc15"

    const rangePercent =
        firstPrice !== 0 ? ((maxPrice - minPrice) / firstPrice) * 100 : 0

    const volatilityLevel =
        rangePercent >= 1
            ? "HIGH"
            : rangePercent >= 0.4
                ? "MEDIUM"
                : "LOW"

    const volatilityColor =
        volatilityLevel === "HIGH"
            ? "#f87171"
            : volatilityLevel === "MEDIUM"
                ? "#facc15"
                : "#86efac"

    const points = data
        .map((item, index) => {
            const x =
                data.length === 1
                    ? width / 2
                    : padding + (index / (data.length - 1)) * (width - padding * 2)

            const y =
                height -
                padding -
                ((Number(item.price) - minPrice) / priceRange) *
                (height - padding * 2)

            return `${x},${y}`
        })
        .join(" ")

    const getPointChange = (index) => {
        if (index === 0) return 0

        const currentPrice = Number(data[index].price)
        const previousPrice = Number(data[index - 1].price)

        return currentPrice - previousPrice
    }

    const getPointDirection = (change) => {
        if (change > 0) return "UP"
        if (change < 0) return "DOWN"
        return "FLAT"
    }

    const getPointColor = (change) => {
        if (change > 0) return "#86efac"
        if (change < 0) return "#f87171"
        return "#d1d5db"
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
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                    gap: "16px",
                    flexWrap: "wrap"
                }}
            >
                <div>
                    <h3 style={{ marginBottom: "8px" }}>Chart Area</h3>
                    <p style={{ color: "#9ca3af" }}>
                        Simulated price chart from backend
                    </p>
                </div>

                <div
                    style={{
                        backgroundColor: "#0b1220",
                        border: "1px solid #1f2937",
                        borderRadius: "14px",
                        padding: "12px 16px",
                        minWidth: "180px"
                    }}
                >
                    <p style={{ color: "#9ca3af", marginBottom: "6px" }}>
                        Current Chart
                    </p>

                    <p
                        style={{
                            color: "#d1d5db",
                            fontWeight: "bold",
                            marginBottom: "4px"
                        }}
                    >
                        {symbol} / {timeframe}
                    </p>

                    <p style={{ color: directionColor, fontWeight: "bold" }}>
                        Last Price: {lastPrice || "-"}
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
                <div style={summaryCardStyle}>
                    <p style={summaryLabelStyle}>First Price</p>
                    <p style={summaryValueStyle}>{firstPrice || "-"}</p>
                </div>

                <div style={summaryCardStyle}>
                    <p style={summaryLabelStyle}>Last Price</p>
                    <p style={summaryValueStyle}>{lastPrice || "-"}</p>
                </div>

                <div style={summaryCardStyle}>
                    <p style={summaryLabelStyle}>Change</p>
                    <p style={{ color: directionColor, fontWeight: "bold" }}>
                        {priceChange.toFixed(2)}
                    </p>
                </div>

                <div style={summaryCardStyle}>
                    <p style={summaryLabelStyle}>Change %</p>
                    <p style={{ color: directionColor, fontWeight: "bold" }}>
                        {priceChangePercent.toFixed(2)}%
                    </p>
                </div>

                <div style={summaryCardStyle}>
                    <p style={summaryLabelStyle}>Direction</p>
                    <p style={{ color: directionColor, fontWeight: "bold" }}>
                        {direction}
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
                <h4 style={{ marginBottom: "14px" }}>Chart Insight</h4>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
                        gap: "16px"
                    }}
                >
                    <div style={insightCardStyle}>
                        <p style={summaryLabelStyle}>Bias</p>
                        <p style={{ color: chartBiasColor, fontWeight: "bold" }}>
                            {chartBias}
                        </p>
                    </div>

                    <div style={insightCardStyle}>
                        <p style={summaryLabelStyle}>Up Moves</p>
                        <p style={{ color: "#86efac", fontWeight: "bold" }}>
                            {upMoves}
                        </p>
                    </div>

                    <div style={insightCardStyle}>
                        <p style={summaryLabelStyle}>Down Moves</p>
                        <p style={{ color: "#f87171", fontWeight: "bold" }}>
                            {downMoves}
                        </p>
                    </div>

                    <div style={insightCardStyle}>
                        <p style={summaryLabelStyle}>Volatility</p>
                        <p style={{ color: volatilityColor, fontWeight: "bold" }}>
                            {volatilityLevel}
                        </p>
                    </div>

                    <div style={insightCardStyle}>
                        <p style={summaryLabelStyle}>Avg Move</p>
                        <p style={{ color: "#d1d5db", fontWeight: "bold" }}>
                            {averageMove.toFixed(2)}
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
                    overflowX: "auto",
                    marginBottom: "16px"
                }}
            >
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    style={{
                        width: "100%",
                        minWidth: "600px",
                        height: "260px"
                    }}
                >
                    <line
                        x1={padding}
                        y1={padding}
                        x2={padding}
                        y2={height - padding}
                        stroke="#374151"
                    />

                    <line
                        x1={padding}
                        y1={height - padding}
                        x2={width - padding}
                        y2={height - padding}
                        stroke="#374151"
                    />

                    <text x={padding} y={24} fill="#9ca3af" fontSize="12">
                        High: {maxPrice}
                    </text>

                    <text x={padding} y={height - 8} fill="#9ca3af" fontSize="12">
                        Low: {minPrice}
                    </text>

                    <polyline
                        points={points}
                        fill="none"
                        stroke="#84cc16"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {data.map((item, index) => {
                        const x =
                            data.length === 1
                                ? width / 2
                                : padding + (index / (data.length - 1)) * (width - padding * 2)

                        const y =
                            height -
                            padding -
                            ((Number(item.price) - minPrice) / priceRange) *
                            (height - padding * 2)

                        return (
                            <g key={`${item.time}-${index}`}>
                                <circle cx={x} cy={y} r="5" fill="#84cc16" />
                                <text x={x - 18} y={height - 12} fill="#9ca3af" fontSize="11">
                                    {item.time}
                                </text>
                            </g>
                        )
                    })}
                </svg>
            </div>

            <div
                style={{
                    backgroundColor: "#0b1220",
                    border: "1px solid #1f2937",
                    borderRadius: "14px",
                    padding: "16px",
                    overflowX: "auto"
                }}
            >
                <h4 style={{ marginBottom: "14px" }}>Price Data Table</h4>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ color: "#9ca3af", textAlign: "left" }}>
                            <th style={{ paddingBottom: "12px" }}>No.</th>
                            <th style={{ paddingBottom: "12px" }}>Time</th>
                            <th style={{ paddingBottom: "12px" }}>Price</th>
                            <th style={{ paddingBottom: "12px" }}>Change</th>
                            <th style={{ paddingBottom: "12px" }}>Direction</th>
                        </tr>
                    </thead>

                    <tbody>
                        {data.length === 0 ? (
                            <tr style={{ borderTop: "1px solid #1f2937" }}>
                                <td
                                    colSpan="5"
                                    style={{
                                        padding: "14px 0",
                                        color: "#9ca3af"
                                    }}
                                >
                                    No chart data
                                </td>
                            </tr>
                        ) : (
                            data.map((item, index) => {
                                const change = getPointChange(index)
                                const pointDirection = getPointDirection(change)
                                const pointColor = getPointColor(change)

                                return (
                                    <tr
                                        key={`${item.time}-${item.price}-${index}`}
                                        style={{ borderTop: "1px solid #1f2937" }}
                                    >
                                        <td style={{ padding: "14px 0", color: "#d1d5db" }}>
                                            {index + 1}
                                        </td>

                                        <td style={{ padding: "14px 0", color: "#d1d5db" }}>
                                            {item.time}
                                        </td>

                                        <td style={{ padding: "14px 0", color: "#d1d5db" }}>
                                            {item.price}
                                        </td>

                                        <td
                                            style={{
                                                padding: "14px 0",
                                                color: pointColor,
                                                fontWeight: "bold"
                                            }}
                                        >
                                            {index === 0 ? "-" : change.toFixed(2)}
                                        </td>

                                        <td
                                            style={{
                                                padding: "14px 0",
                                                color: pointColor,
                                                fontWeight: "bold"
                                            }}
                                        >
                                            {index === 0 ? "START" : pointDirection}
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

const summaryCardStyle = {
    backgroundColor: "#0b1220",
    border: "1px solid #1f2937",
    borderRadius: "14px",
    padding: "14px"
}

const insightCardStyle = {
    backgroundColor: "#111827",
    border: "1px solid #1f2937",
    borderRadius: "14px",
    padding: "14px"
}

const summaryLabelStyle = {
    color: "#9ca3af",
    marginBottom: "6px"
}

const summaryValueStyle = {
    color: "#d1d5db",
    fontWeight: "bold"
}

export default PriceChart