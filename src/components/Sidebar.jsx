function Sidebar({ selectedMenu, setSelectedMenu }) {
    const menus = [
        "Dashboard",
        "Backtest",
        "History",
        "AI Insights",
        "AI Usage",
        "Quant",
        "Settings"
    ]

    return (
        <div
            style={{
                width: "260px",
                backgroundColor: "#10151c",
                padding: "30px 20px",
                borderRight: "1px solid #1f2937"
            }}
        >
            <h2 style={{ marginBottom: "30px" }}>TRADE BOT</h2>

            <div style={{ marginBottom: "16px", color: "#9ca3af", fontSize: "14px" }}>
                OVERVIEW
            </div>

            {menus.map((menu, index) => (
                <div
                    key={index}
                    onClick={() => setSelectedMenu(menu)}
                    style={{
                        backgroundColor: selectedMenu === menu ? "#84cc16" : "transparent",
                        color: selectedMenu === menu ? "black" : "#d1d5db",
                        padding: "14px 16px",
                        borderRadius: "12px",
                        marginBottom: "12px",
                        fontWeight: selectedMenu === menu ? "bold" : "normal",
                        cursor: "pointer"
                    }}
                >
                    {menu}
                </div>
            ))}
        </div>
    )
}

export default Sidebar