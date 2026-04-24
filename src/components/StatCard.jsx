function StatCard({ title, value, color }) {
    return (
        <div
            style={{
                backgroundColor: "#111827",
                padding: "20px",
                borderRadius: "16px"
            }}
        >
            <p style={{ color: "#9ca3af" }}>{title}</p>
            <h2 style={{ color: color }}>{value}</h2>
        </div>
    )
}

export default StatCard