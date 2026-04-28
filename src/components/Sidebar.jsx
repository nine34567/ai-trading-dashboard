import { useState } from "react"

function Sidebar({ selectedMenu, setSelectedMenu }) {
    const [hoveredMenu, setHoveredMenu] = useState("")

    const menuGroups = [
        {
            label: "COMMAND",
            items: [
                {
                    name: "Dashboard",
                    icon: "⌁",
                    description: "Live trading command center",
                    accent: "#84cc16"
                },
                {
                    name: "Backtest",
                    icon: "↺",
                    description: "Strategy result snapshot",
                    accent: "#38bdf8"
                },
                {
                    name: "History",
                    icon: "≡",
                    description: "Trade and activity log",
                    accent: "#facc15"
                }
            ]
        },
        {
            label: "INTELLIGENCE",
            items: [
                {
                    name: "AI Insights",
                    icon: "◆",
                    description: "AI signal and reasoning",
                    accent: "#a78bfa"
                },
                {
                    name: "AI Usage",
                    icon: "◎",
                    description: "API usage and cost",
                    accent: "#22c55e"
                },
                {
                    name: "Quant",
                    icon: "∑",
                    description: "Risk and quant metrics",
                    accent: "#fb923c"
                }
            ]
        },
        {
            label: "SYSTEM",
            items: [
                {
                    name: "Settings",
                    icon: "⚙",
                    description: "Bot, account, risk controls",
                    accent: "#e5e7eb"
                },
                {
                    name: "System Diagnostics",
                    icon: "▣",
                    description: "Production console and health checks",
                    accent: "#f87171"
                }
            ]
        }
    ]

    const flatMenus = menuGroups.flatMap((group) => group.items)

    const normalizedSelectedMenu = String(selectedMenu || "").trim()

    const activeMenu =
        flatMenus.find((item) => item.name === normalizedSelectedMenu) || flatMenus[0]

    const handleSelectMenu = (menuName) => {
        const normalizedMenuName = String(menuName || "").trim()

        if (typeof setSelectedMenu === "function") {
            setSelectedMenu(normalizedMenuName)
        }
    }

    const getMenuItemStyle = (item) => {
        const isActive = normalizedSelectedMenu === item.name
        const isHovered = hoveredMenu === item.name

        return {
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            width: "100%",
            background: isActive
                ? `linear-gradient(135deg, ${item.accent}, rgba(132, 204, 22, 0.82))`
                : isHovered
                    ? "linear-gradient(135deg, rgba(31, 41, 55, 0.9), rgba(17, 24, 39, 0.95))"
                    : "transparent",
            color: isActive ? "#020617" : "#d1d5db",
            border: isActive
                ? `1px solid ${item.accent}`
                : isHovered
                    ? "1px solid rgba(75, 85, 99, 0.75)"
                    : "1px solid transparent",
            padding: "13px 14px",
            borderRadius: "16px",
            marginBottom: "10px",
            fontWeight: isActive ? "bold" : "normal",
            cursor: "pointer",
            boxShadow: isActive
                ? `0 18px 34px rgba(0, 0, 0, 0.28), 0 0 26px ${item.accent}33`
                : "none",
            transform: isHovered && !isActive ? "translateX(3px)" : "translateX(0)",
            transition: "all 0.18s ease",
            overflow: "hidden"
        }
    }

    return (
        <aside
            style={{
                width: "286px",
                minWidth: "286px",
                minHeight: "100vh",
                maxHeight: "100vh",
                background:
                    "linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(3, 7, 18, 0.98))",
                borderRight: "1px solid rgba(55, 65, 81, 0.85)",
                padding: "24px 18px 80px",
                position: "sticky",
                top: 0,
                alignSelf: "flex-start",
                boxSizing: "border-box",
                overflowY: "auto",
                overflowX: "hidden"
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: "-80px",
                    left: "-80px",
                    width: "180px",
                    height: "180px",
                    borderRadius: "999px",
                    backgroundColor: "rgba(132, 204, 22, 0.1)",
                    filter: "blur(18px)",
                    pointerEvents: "none"
                }}
            />

            <div
                style={{
                    position: "absolute",
                    bottom: "-90px",
                    right: "-80px",
                    width: "200px",
                    height: "200px",
                    borderRadius: "999px",
                    backgroundColor: "rgba(56, 189, 248, 0.08)",
                    filter: "blur(22px)",
                    pointerEvents: "none"
                }}
            />

            <div
                style={{
                    position: "relative",
                    zIndex: 1
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "24px"
                    }}
                >
                    <div
                        style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "16px",
                            background:
                                "linear-gradient(135deg, #84cc16, #38bdf8)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#020617",
                            fontWeight: "bold",
                            fontSize: "18px",
                            boxShadow:
                                "0 18px 38px rgba(0, 0, 0, 0.3), 0 0 28px rgba(132, 204, 22, 0.24)"
                        }}
                    >
                        AI
                    </div>

                    <div>
                        <h2
                            style={{
                                color: "#f9fafb",
                                fontSize: "20px",
                                lineHeight: "1.1",
                                marginBottom: "5px",
                                letterSpacing: "-0.03em"
                            }}
                        >
                            TRADE BOT
                        </h2>

                        <p
                            style={{
                                color: "#9ca3af",
                                fontSize: "12px",
                                letterSpacing: "0.08em",
                                textTransform: "uppercase"
                            }}
                        >
                            Quant Workspace
                        </p>
                    </div>
                </div>

                <div
                    style={{
                        background:
                            "linear-gradient(135deg, rgba(17, 24, 39, 0.92), rgba(11, 18, 32, 0.96))",
                        border: "1px solid rgba(55, 65, 81, 0.82)",
                        borderRadius: "20px",
                        padding: "16px",
                        marginBottom: "22px",
                        boxShadow: "0 18px 36px rgba(0, 0, 0, 0.22)"
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "12px",
                            marginBottom: "12px"
                        }}
                    >
                        <p
                            style={{
                                color: "#9ca3af",
                                fontSize: "12px",
                                fontWeight: "bold",
                                textTransform: "uppercase",
                                letterSpacing: "0.1em"
                            }}
                        >
                            Active Panel
                        </p>

                        <span
                            style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "999px",
                                backgroundColor: activeMenu.accent,
                                boxShadow: `0 0 14px ${activeMenu.accent}`
                            }}
                        />
                    </div>

                    <p
                        style={{
                            color: activeMenu.accent,
                            fontSize: "18px",
                            fontWeight: "bold",
                            marginBottom: "8px"
                        }}
                    >
                        {activeMenu.name}
                    </p>

                    <p
                        style={{
                            color: "#9ca3af",
                            fontSize: "13px",
                            lineHeight: "1.6"
                        }}
                    >
                        {activeMenu.description}
                    </p>
                </div>

                <nav>
                    {menuGroups.map((group) => (
                        <div key={group.label} style={{ marginBottom: "18px" }}>
                            <p
                                style={{
                                    color: "#6b7280",
                                    fontSize: "11px",
                                    fontWeight: "bold",
                                    letterSpacing: "0.14em",
                                    textTransform: "uppercase",
                                    marginBottom: "10px",
                                    paddingLeft: "4px"
                                }}
                            >
                                {group.label}
                            </p>

                            {group.items.map((item) => {
                                const isActive = normalizedSelectedMenu === item.name

                                return (
                                    <button
                                        key={item.name}
                                        type="button"
                                        onMouseDown={(event) => {
                                            event.preventDefault()
                                            handleSelectMenu(item.name)
                                        }}
                                        onClick={() => handleSelectMenu(item.name)}
                                        onMouseEnter={() => setHoveredMenu(item.name)}
                                        onMouseLeave={() => setHoveredMenu("")}
                                        style={getMenuItemStyle(item)}
                                    >
                                        {isActive && (
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    background:
                                                        "linear-gradient(90deg, rgba(255,255,255,0.22), transparent 42%)",
                                                    pointerEvents: "none"
                                                }}
                                            />
                                        )}

                                        <span
                                            style={{
                                                position: "relative",
                                                zIndex: 1,
                                                width: "30px",
                                                height: "30px",
                                                minWidth: "30px",
                                                borderRadius: "12px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                backgroundColor: isActive
                                                    ? "rgba(2, 6, 23, 0.18)"
                                                    : "rgba(31, 41, 55, 0.72)",
                                                color: isActive ? "#020617" : item.accent,
                                                fontWeight: "bold",
                                                fontSize: "15px"
                                            }}
                                        >
                                            {item.icon}
                                        </span>

                                        <span
                                            style={{
                                                position: "relative",
                                                zIndex: 1,
                                                textAlign: "left",
                                                flex: 1
                                            }}
                                        >
                                            <span
                                                style={{
                                                    display: "block",
                                                    fontSize: "14px",
                                                    marginBottom: "4px"
                                                }}
                                            >
                                                {item.name}
                                            </span>

                                            <span
                                                style={{
                                                    display: "block",
                                                    fontSize: "11px",
                                                    color: isActive
                                                        ? "rgba(2, 6, 23, 0.72)"
                                                        : "#6b7280",
                                                    lineHeight: "1.35"
                                                }}
                                            >
                                                {item.description}
                                            </span>
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    ))}
                </nav>

                <div
                    style={{
                        height: "1px",
                        background:
                            "linear-gradient(90deg, transparent, rgba(75, 85, 99, 0.9), transparent)",
                        margin: "20px 0"
                    }}
                />

                <div
                    style={{
                        backgroundColor: "rgba(11, 18, 32, 0.86)",
                        border: "1px solid rgba(55, 65, 81, 0.76)",
                        borderRadius: "18px",
                        padding: "15px",
                        marginBottom: "14px"
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "10px",
                            marginBottom: "10px"
                        }}
                    >
                        <p
                            style={{
                                color: "#9ca3af",
                                fontSize: "12px",
                                fontWeight: "bold"
                            }}
                        >
                            Workspace Status
                        </p>

                        <p
                            style={{
                                color: "#86efac",
                                fontSize: "12px",
                                fontWeight: "bold"
                            }}
                        >
                            ONLINE
                        </p>
                    </div>

                    <div
                        style={{
                            width: "100%",
                            height: "8px",
                            backgroundColor: "#1f2937",
                            borderRadius: "999px",
                            overflow: "hidden",
                            marginBottom: "10px"
                        }}
                    >
                        <div
                            style={{
                                width: "78%",
                                height: "100%",
                                borderRadius: "999px",
                                background:
                                    "linear-gradient(90deg, #84cc16, #38bdf8)"
                            }}
                        />
                    </div>

                    <p
                        style={{
                            color: "#6b7280",
                            fontSize: "12px",
                            lineHeight: "1.55"
                        }}
                    >
                        UI system ready. Backend state is controlled from dashboard data.
                    </p>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px"
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "rgba(17, 24, 39, 0.86)",
                            border: "1px solid rgba(55, 65, 81, 0.72)",
                            borderRadius: "14px",
                            padding: "12px"
                        }}
                    >
                        <p
                            style={{
                                color: "#6b7280",
                                fontSize: "11px",
                                marginBottom: "6px"
                            }}
                        >
                            Mode
                        </p>

                        <p
                            style={{
                                color: "#d1d5db",
                                fontSize: "12px",
                                fontWeight: "bold"
                            }}
                        >
                            DEV
                        </p>
                    </div>

                    <div
                        style={{
                            backgroundColor: "rgba(17, 24, 39, 0.86)",
                            border: "1px solid rgba(55, 65, 81, 0.72)",
                            borderRadius: "14px",
                            padding: "12px"
                        }}
                    >
                        <p
                            style={{
                                color: "#6b7280",
                                fontSize: "11px",
                                marginBottom: "6px"
                            }}
                        >
                            Build
                        </p>

                        <p
                            style={{
                                color: "#84cc16",
                                fontSize: "12px",
                                fontWeight: "bold"
                            }}
                        >
                            ACTIVE
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    )
}

export default Sidebar