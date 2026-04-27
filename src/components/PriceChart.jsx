import { useState } from "react"

function PriceChart({ data = [], symbol = "-", timeframe = "-" }) {
    const [hoveredPoint, setHoveredPoint] = useState(null)
    const [hoveredRow, setHoveredRow] = useState(null)

    const width = 760
    const height = 280
    const padding = 42

    const safeData = Array.isArray(data) ? data : []
    const prices = safeData.map((item) => Number(item.price)).filter((price) => !Number.isNaN(price))

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

    const directionBackground =
        direction === "UP"
            ? "rgba(20, 83, 45, 0.42)"
            : direction === "DOWN"
                ? "rgba(127, 29, 29, 0.42)"
                : "rgba(31, 41, 55, 0.72)"

    const totalMoves = safeData.length > 1 ? safeData.length - 1 : 0

    const upMoves = safeData.filter((item, index) => {
        if (index === 0) return false
        return Number(item.price) > Number(safeData[index - 1].price)
    }).length

    const downMoves = safeData.filter((item, index) => {
        if (index === 0) return false
        return Number(item.price) < Number(safeData[index - 1].price)
    }).length

    const flatMoves = safeData.filter((item, index) => {
        if (index === 0) return false
        return Number(item.price) === Number(safeData[index - 1].price)
    }).length

    const averageMove = totalMoves > 0 ? priceChange / totalMoves : 0

    const chartBias =
        direction === "UP" && upMoves >= downMoves
            ? "BULLISH"
            : direction === "DOWN" && downMoves >= upMoves
                ? "BEARISH"
                : prices.length === 0
                    ? "NO DATA"
                    : "MIXED"

    const chartBiasColor =
        chartBias === "BULLISH"
            ? "#86efac"
            : chartBias === "BEARISH"
                ? "#f87171"
                : chartBias === "MIXED"
                    ? "#facc15"
                    : "#9ca3af"

    const chartBiasBackground =
        chartBias === "BULLISH"
            ? "rgba(20, 83, 45, 0.42)"
            : chartBias === "BEARISH"
                ? "rgba(127, 29, 29, 0.42)"
                : chartBias === "MIXED"
                    ? "rgba(113, 63, 18, 0.42)"
                    : "rgba(31, 41, 55, 0.72)"

    const rangePercent =
        firstPrice !== 0 ? ((maxPrice - minPrice) / firstPrice) * 100 : 0

    const volatilityLevel =
        rangePercent >= 1
            ? "HIGH"
            : rangePercent >= 0.4
                ? "MEDIUM"
                : prices.length === 0
                    ? "NONE"
                    : "LOW"

    const volatilityColor =
        volatilityLevel === "HIGH"
            ? "#f87171"
            : volatilityLevel === "MEDIUM"
                ? "#facc15"
                : volatilityLevel === "LOW"
                    ? "#86efac"
                    : "#9ca3af"

    const volatilityBackground =
        volatilityLevel === "HIGH"
            ? "rgba(127, 29, 29, 0.42)"
            : volatilityLevel === "MEDIUM"
                ? "rgba(113, 63, 18, 0.42)"
                : volatilityLevel === "LOW"
                    ? "rgba(20, 83, 45, 0.42)"
                    : "rgba(31, 41, 55, 0.72)"

    const marketState =
        chartBias === "BULLISH" && volatilityLevel !== "HIGH"
            ? "CONTROLLED UPSIDE"
            : chartBias === "BULLISH" && volatilityLevel === "HIGH"
                ? "VOLATILE UPSIDE"
                : chartBias === "BEARISH" && volatilityLevel !== "HIGH"
                    ? "CONTROLLED DOWNSIDE"
                    : chartBias === "BEARISH" && volatilityLevel === "HIGH"
                        ? "VOLATILE DOWNSIDE"
                        : chartBias === "MIXED"
                            ? "CHOPPY MARKET"
                            : "WAITING DATA"

    const marketStateColor =
        marketState.includes("UPSIDE")
            ? "#86efac"
            : marketState.includes("DOWNSIDE")
                ? "#f87171"
                : marketState === "CHOPPY MARKET"
                    ? "#facc15"
                    : "#9ca3af"

    const formatPrice = (value) => {
        const numberValue = Number(value)

        if (Number.isNaN(numberValue)) return "-"

        if (Math.abs(numberValue) >= 1000) return numberValue.toFixed(2)
        if (Math.abs(numberValue) >= 100) return numberValue.toFixed(2)

        return numberValue.toFixed(2)
    }

    const formatSigned = (value) => {
        const numberValue = Number(value)

        if (Number.isNaN(numberValue)) return "-"

        if (numberValue > 0) return `+${numberValue.toFixed(2)}`
        if (numberValue < 0) return numberValue.toFixed(2)

        return "0.00"
    }

    const getPointX = (index) => {
        if (safeData.length === 1) return width / 2

        return padding + (index / (safeData.length - 1)) * (width - padding * 2)
    }

    const getPointY = (price) => {
        return (
            height -
            padding -
            ((Number(price) - minPrice) / priceRange) * (height - padding * 2)
        )
    }

    const points = safeData
        .map((item, index) => {
            const x = getPointX(index)
            const y = getPointY(item.price)

            return `${x},${y}`
        })
        .join(" ")

    const areaPoints =
        safeData.length > 0
            ? `${padding},${height - padding} ${points} ${width - padding},${height - padding}`
            : ""

    const getPointChange = (index) => {
        if (index === 0) return 0

        const currentPrice = Number(safeData[index].price)
        const previousPrice = Number(safeData[index - 1].price)

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

    const getCandleStrength = (index) => {
        if (index === 0) return "START"

        const change = Math.abs(getPointChange(index))

        if (priceRange === 0) return "FLAT"

        const strengthPercent = (change / priceRange) * 100

        if (strengthPercent >= 45) return "STRONG"
        if (strengthPercent >= 20) return "MEDIUM"
        if (strengthPercent > 0) return "SMALL"

        return "FLAT"
    }

    const selectedPoint =
        hoveredPoint !== null && safeData[hoveredPoint]
            ? safeData[hoveredPoint]
            : safeData.length > 0
                ? safeData[safeData.length - 1]
                : null

    const selectedPointIndex =
        hoveredPoint !== null && safeData[hoveredPoint]
            ? hoveredPoint
            : safeData.length > 0
                ? safeData.length - 1
                : null

    const selectedPointChange =
        selectedPointIndex !== null ? getPointChange(selectedPointIndex) : 0

    const cardStyle = {
        background:
            "linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(11, 18, 32, 0.98))",
        border: "1px solid rgba(55, 65, 81, 0.78)",
        borderRadius: "16px",
        padding: "15px",
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.18)"
    }

    const labelStyle = {
        color: "#9ca3af",
        fontSize: "13px",
        marginBottom: "7px"
    }

    const valueStyle = {
        color: "#d1d5db",
        fontWeight: "bold",
        fontSize: "16px"
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
        padding: "14px 12px",
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
                        "linear-gradient(90deg, #84cc16, #38bdf8, rgba(132, 204, 22, 0.2))"
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
                    backgroundColor: "rgba(132, 204, 22, 0.08)",
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
                                color: "#84cc16",
                                fontSize: "12px",
                                fontWeight: "bold",
                                letterSpacing: "0.14em",
                                textTransform: "uppercase",
                                marginBottom: "10px"
                            }}
                        >
                            Market Terminal
                        </p>

                        <h3
                            style={{
                                color: "#f9fafb",
                                fontSize: "24px",
                                marginBottom: "8px",
                                letterSpacing: "-0.02em"
                            }}
                        >
                            Chart Area
                        </h3>

                        <p
                            style={{
                                color: "#9ca3af",
                                fontSize: "14px",
                                lineHeight: "1.7",
                                maxWidth: "780px"
                            }}
                        >
                            Simulated backend price stream with trend direction, chart bias,
                            volatility state, point-by-point movement and price data table.
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
                        <div
                            style={{
                                backgroundColor: directionBackground,
                                border: `1px solid ${directionColor}`,
                                color: directionColor,
                                padding: "9px 14px",
                                borderRadius: "999px",
                                fontSize: "12px",
                                fontWeight: "bold",
                                letterSpacing: "0.08em",
                                boxShadow: `0 0 24px ${directionColor}22`
                            }}
                        >
                            {direction}
                        </div>

                        <div
                            style={{
                                backgroundColor: chartBiasBackground,
                                border: `1px solid ${chartBiasColor}`,
                                color: chartBiasColor,
                                padding: "9px 14px",
                                borderRadius: "999px",
                                fontSize: "12px",
                                fontWeight: "bold",
                                letterSpacing: "0.08em",
                                boxShadow: `0 0 24px ${chartBiasColor}22`
                            }}
                        >
                            {chartBias}
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(260px, 0.8fr) minmax(320px, 1.2fr)",
                        gap: "16px",
                        marginBottom: "18px"
                    }}
                >
                    <div
                        style={{
                            background:
                                "linear-gradient(135deg, rgba(11, 18, 32, 0.96), rgba(17, 24, 39, 0.96))",
                            border: "1px solid rgba(55, 65, 81, 0.8)",
                            borderRadius: "20px",
                            padding: "18px"
                        }}
                    >
                        <p style={{ color: "#9ca3af", marginBottom: "8px", fontSize: "13px" }}>
                            Current Chart
                        </p>

                        <h4
                            style={{
                                color: "#f9fafb",
                                fontSize: "24px",
                                marginBottom: "10px",
                                letterSpacing: "-0.03em"
                            }}
                        >
                            {symbol} / {timeframe}
                        </h4>

                        <p
                            style={{
                                color: directionColor,
                                fontWeight: "bold",
                                fontSize: "18px",
                                marginBottom: "12px"
                            }}
                        >
                            Last Price: {lastPrice ? formatPrice(lastPrice) : "-"}
                        </p>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "10px"
                            }}
                        >
                            <div style={cardStyle}>
                                <p style={labelStyle}>Market State</p>
                                <p style={{ ...valueStyle, color: marketStateColor }}>
                                    {marketState}
                                </p>
                            </div>

                            <div style={cardStyle}>
                                <p style={labelStyle}>Data Points</p>
                                <p style={valueStyle}>{safeData.length}</p>
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            background:
                                "linear-gradient(135deg, rgba(11, 18, 32, 0.96), rgba(17, 24, 39, 0.96))",
                            border: "1px solid rgba(55, 65, 81, 0.8)",
                            borderRadius: "20px",
                            padding: "18px"
                        }}
                    >
                        <p style={{ color: "#9ca3af", marginBottom: "14px", fontSize: "13px" }}>
                            Selected Price Point
                        </p>

                        {selectedPoint ? (
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(4, 1fr)",
                                    gap: "12px"
                                }}
                            >
                                <div style={cardStyle}>
                                    <p style={labelStyle}>Time</p>
                                    <p style={valueStyle}>{selectedPoint.time}</p>
                                </div>

                                <div style={cardStyle}>
                                    <p style={labelStyle}>Price</p>
                                    <p style={{ ...valueStyle, color: "#f9fafb" }}>
                                        {formatPrice(selectedPoint.price)}
                                    </p>
                                </div>

                                <div style={cardStyle}>
                                    <p style={labelStyle}>Change</p>
                                    <p
                                        style={{
                                            ...valueStyle,
                                            color: getPointColor(selectedPointChange)
                                        }}
                                    >
                                        {selectedPointIndex === 0
                                            ? "-"
                                            : formatSigned(selectedPointChange)}
                                    </p>
                                </div>

                                <div style={cardStyle}>
                                    <p style={labelStyle}>Move</p>
                                    <p
                                        style={{
                                            ...valueStyle,
                                            color: getPointColor(selectedPointChange)
                                        }}
                                    >
                                        {selectedPointIndex === 0
                                            ? "START"
                                            : getPointDirection(selectedPointChange)}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div
                                style={{
                                    backgroundColor: "#111827",
                                    border: "1px dashed #374151",
                                    borderRadius: "16px",
                                    padding: "20px",
                                    color: "#9ca3af"
                                }}
                            >
                                No selected price point.
                            </div>
                        )}
                    </div>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, minmax(140px, 1fr))",
                        gap: "14px",
                        marginBottom: "18px"
                    }}
                >
                    <div style={cardStyle}>
                        <p style={labelStyle}>First Price</p>
                        <p style={valueStyle}>{firstPrice ? formatPrice(firstPrice) : "-"}</p>
                    </div>

                    <div style={cardStyle}>
                        <p style={labelStyle}>Last Price</p>
                        <p style={valueStyle}>{lastPrice ? formatPrice(lastPrice) : "-"}</p>
                    </div>

                    <div style={cardStyle}>
                        <p style={labelStyle}>Change</p>
                        <p style={{ ...valueStyle, color: directionColor }}>
                            {formatSigned(priceChange)}
                        </p>
                    </div>

                    <div style={cardStyle}>
                        <p style={labelStyle}>Change %</p>
                        <p style={{ ...valueStyle, color: directionColor }}>
                            {priceChangePercent.toFixed(2)}%
                        </p>
                    </div>

                    <div style={cardStyle}>
                        <p style={labelStyle}>Direction</p>
                        <p style={{ ...valueStyle, color: directionColor }}>
                            {direction}
                        </p>
                    </div>
                </div>

                <div
                    style={{
                        backgroundColor: "#0b1220",
                        border: "1px solid #1f2937",
                        borderRadius: "20px",
                        padding: "18px",
                        marginBottom: "18px"
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "14px",
                            flexWrap: "wrap",
                            marginBottom: "16px"
                        }}
                    >
                        <div>
                            <h4
                                style={{
                                    color: "#f9fafb",
                                    marginBottom: "6px",
                                    fontSize: "18px"
                                }}
                            >
                                Chart Insight
                            </h4>

                            <p style={{ color: "#9ca3af", fontSize: "14px" }}>
                                Bias, movement count, volatility and average move.
                            </p>
                        </div>

                        <div
                            style={{
                                backgroundColor: volatilityBackground,
                                border: `1px solid ${volatilityColor}`,
                                color: volatilityColor,
                                borderRadius: "999px",
                                padding: "8px 12px",
                                fontSize: "12px",
                                fontWeight: "bold"
                            }}
                        >
                            VOLATILITY {volatilityLevel}
                        </div>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(6, minmax(120px, 1fr))",
                            gap: "14px"
                        }}
                    >
                        <div style={cardStyle}>
                            <p style={labelStyle}>Bias</p>
                            <p style={{ ...valueStyle, color: chartBiasColor }}>
                                {chartBias}
                            </p>
                        </div>

                        <div style={cardStyle}>
                            <p style={labelStyle}>Up Moves</p>
                            <p style={{ ...valueStyle, color: "#86efac" }}>
                                {upMoves}
                            </p>
                        </div>

                        <div style={cardStyle}>
                            <p style={labelStyle}>Down Moves</p>
                            <p style={{ ...valueStyle, color: "#f87171" }}>
                                {downMoves}
                            </p>
                        </div>

                        <div style={cardStyle}>
                            <p style={labelStyle}>Flat Moves</p>
                            <p style={{ ...valueStyle, color: "#d1d5db" }}>
                                {flatMoves}
                            </p>
                        </div>

                        <div style={cardStyle}>
                            <p style={labelStyle}>Volatility</p>
                            <p style={{ ...valueStyle, color: volatilityColor }}>
                                {volatilityLevel}
                            </p>
                        </div>

                        <div style={cardStyle}>
                            <p style={labelStyle}>Avg Move</p>
                            <p style={valueStyle}>
                                {averageMove.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        background:
                            "linear-gradient(135deg, rgba(11, 18, 32, 0.98), rgba(3, 7, 18, 0.98))",
                        border: "1px solid #1f2937",
                        borderRadius: "22px",
                        padding: "18px",
                        overflowX: "auto",
                        marginBottom: "18px",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)"
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "14px",
                            flexWrap: "wrap",
                            marginBottom: "12px"
                        }}
                    >
                        <p style={{ color: "#9ca3af", fontSize: "13px" }}>
                            Price Line Visualization
                        </p>

                        <p style={{ color: directionColor, fontWeight: "bold", fontSize: "13px" }}>
                            {symbol} • {timeframe} • {direction}
                        </p>
                    </div>

                    <svg
                        viewBox={`0 0 ${width} ${height}`}
                        style={{
                            width: "100%",
                            minWidth: "680px",
                            height: "300px",
                            display: "block"
                        }}
                    >
                        <defs>
                            <linearGradient id="priceLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#84cc16" />
                                <stop offset="55%" stopColor="#38bdf8" />
                                <stop offset="100%" stopColor={directionColor} />
                            </linearGradient>

                            <linearGradient id="priceAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={directionColor} stopOpacity="0.28" />
                                <stop offset="70%" stopColor={directionColor} stopOpacity="0.04" />
                                <stop offset="100%" stopColor={directionColor} stopOpacity="0" />
                            </linearGradient>

                            <filter id="lineGlow">
                                <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {[0, 1, 2, 3].map((line) => {
                            const y =
                                padding + (line / 3) * (height - padding * 2)

                            return (
                                <line
                                    key={`grid-y-${line}`}
                                    x1={padding}
                                    y1={y}
                                    x2={width - padding}
                                    y2={y}
                                    stroke="#1f2937"
                                    strokeDasharray="5 8"
                                />
                            )
                        })}

                        {[0, 1, 2, 3, 4].map((line) => {
                            const x =
                                padding + (line / 4) * (width - padding * 2)

                            return (
                                <line
                                    key={`grid-x-${line}`}
                                    x1={x}
                                    y1={padding}
                                    x2={x}
                                    y2={height - padding}
                                    stroke="#111827"
                                    strokeDasharray="5 8"
                                />
                            )
                        })}

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

                        <text x={padding} y={26} fill="#9ca3af" fontSize="12">
                            High: {formatPrice(maxPrice)}
                        </text>

                        <text x={padding} y={height - 10} fill="#9ca3af" fontSize="12">
                            Low: {formatPrice(minPrice)}
                        </text>

                        {areaPoints && (
                            <polygon
                                points={areaPoints}
                                fill="url(#priceAreaGradient)"
                            />
                        )}

                        {points && (
                            <polyline
                                points={points}
                                fill="none"
                                stroke="url(#priceLineGradient)"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                filter="url(#lineGlow)"
                            />
                        )}

                        {safeData.map((item, index) => {
                            const x = getPointX(index)
                            const y = getPointY(item.price)
                            const change = getPointChange(index)
                            const pointColor = getPointColor(change)
                            const isHovered = hoveredPoint === index
                            const radius = isHovered ? 8 : 5

                            return (
                                <g
                                    key={`${item.time}-${item.price}-${index}`}
                                    onMouseEnter={() => setHoveredPoint(index)}
                                    onMouseLeave={() => setHoveredPoint(null)}
                                    style={{ cursor: "pointer" }}
                                >
                                    {isHovered && (
                                        <line
                                            x1={x}
                                            y1={padding}
                                            x2={x}
                                            y2={height - padding}
                                            stroke={pointColor}
                                            strokeDasharray="4 6"
                                            opacity="0.6"
                                        />
                                    )}

                                    <circle
                                        cx={x}
                                        cy={y}
                                        r={radius + 5}
                                        fill={pointColor}
                                        opacity="0.12"
                                    />

                                    <circle
                                        cx={x}
                                        cy={y}
                                        r={radius}
                                        fill={pointColor}
                                        stroke="#020617"
                                        strokeWidth="2"
                                    />

                                    <text
                                        x={x - 18}
                                        y={height - 14}
                                        fill={isHovered ? "#f9fafb" : "#9ca3af"}
                                        fontSize="11"
                                    >
                                        {item.time}
                                    </text>

                                    {isHovered && (
                                        <g>
                                            <rect
                                                x={x - 54}
                                                y={Math.max(y - 54, 10)}
                                                width="108"
                                                height="40"
                                                rx="10"
                                                fill="#020617"
                                                stroke={pointColor}
                                            />

                                            <text
                                                x={x - 42}
                                                y={Math.max(y - 30, 34)}
                                                fill="#9ca3af"
                                                fontSize="11"
                                            >
                                                {item.time}
                                            </text>

                                            <text
                                                x={x - 42}
                                                y={Math.max(y - 16, 48)}
                                                fill={pointColor}
                                                fontSize="12"
                                                fontWeight="bold"
                                            >
                                                {formatPrice(item.price)}
                                            </text>
                                        </g>
                                    )}
                                </g>
                            )
                        })}
                    </svg>
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
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "14px",
                            flexWrap: "wrap",
                            marginBottom: "16px"
                        }}
                    >
                        <div>
                            <h4 style={{ color: "#f9fafb", marginBottom: "6px" }}>
                                Price Data Table
                            </h4>

                            <p style={{ color: "#9ca3af", fontSize: "14px" }}>
                                Point-by-point backend price stream with change, direction and movement strength.
                            </p>
                        </div>

                        <div
                            style={{
                                backgroundColor: "rgba(31, 41, 55, 0.72)",
                                border: "1px solid #374151",
                                borderRadius: "999px",
                                padding: "8px 12px",
                                color: "#d1d5db",
                                fontSize: "12px",
                                fontWeight: "bold"
                            }}
                        >
                            {safeData.length} ROWS
                        </div>
                    </div>

                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            minWidth: "760px"
                        }}
                    >
                        <thead>
                            <tr>
                                <th style={headerCellStyle}>No.</th>
                                <th style={headerCellStyle}>Time</th>
                                <th style={headerCellStyle}>Price</th>
                                <th style={headerCellStyle}>Change</th>
                                <th style={headerCellStyle}>Direction</th>
                                <th style={headerCellStyle}>Strength</th>
                            </tr>
                        </thead>

                        <tbody>
                            {safeData.length === 0 ? (
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
                                                No chart data
                                            </p>

                                            <p style={{ color: "#9ca3af", fontSize: "14px" }}>
                                                Price data will appear when backend sends chartData.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                safeData.map((item, index) => {
                                    const change = getPointChange(index)
                                    const pointDirection = getPointDirection(change)
                                    const pointColor = getPointColor(change)
                                    const strength = getCandleStrength(index)
                                    const rowIsHovered = hoveredRow === index

                                    return (
                                        <tr
                                            key={`${item.time}-${item.price}-${index}`}
                                            onMouseEnter={() => {
                                                setHoveredRow(index)
                                                setHoveredPoint(index)
                                            }}
                                            onMouseLeave={() => {
                                                setHoveredRow(null)
                                                setHoveredPoint(null)
                                            }}
                                            style={{
                                                borderTop: "1px solid #1f2937",
                                                backgroundColor: rowIsHovered
                                                    ? "rgba(31, 41, 55, 0.54)"
                                                    : "transparent",
                                                transition: "background-color 0.18s ease"
                                            }}
                                        >
                                            <td style={cellStyle}>{index + 1}</td>

                                            <td style={cellStyle}>
                                                <p style={{ color: "#d1d5db", fontWeight: "bold" }}>
                                                    {item.time}
                                                </p>
                                            </td>

                                            <td style={cellStyle}>
                                                <p style={{ color: "#f9fafb", fontWeight: "bold" }}>
                                                    {formatPrice(item.price)}
                                                </p>
                                            </td>

                                            <td style={cellStyle}>
                                                <p style={{ color: pointColor, fontWeight: "bold" }}>
                                                    {index === 0 ? "-" : formatSigned(change)}
                                                </p>
                                            </td>

                                            <td style={cellStyle}>
                                                <span
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        minWidth: "76px",
                                                        padding: "7px 10px",
                                                        borderRadius: "999px",
                                                        backgroundColor:
                                                            pointDirection === "UP"
                                                                ? "rgba(20, 83, 45, 0.36)"
                                                                : pointDirection === "DOWN"
                                                                    ? "rgba(127, 29, 29, 0.36)"
                                                                    : "rgba(31, 41, 55, 0.72)",
                                                        border: `1px solid ${pointColor}`,
                                                        color: pointColor,
                                                        fontWeight: "bold",
                                                        fontSize: "12px"
                                                    }}
                                                >
                                                    {index === 0 ? "START" : pointDirection}
                                                </span>
                                            </td>

                                            <td style={cellStyle}>
                                                <p
                                                    style={{
                                                        color:
                                                            strength === "STRONG"
                                                                ? "#86efac"
                                                                : strength === "MEDIUM"
                                                                    ? "#facc15"
                                                                    : strength === "SMALL"
                                                                        ? "#38bdf8"
                                                                        : "#9ca3af",
                                                        fontWeight: "bold"
                                                    }}
                                                >
                                                    {strength}
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

export default PriceChart