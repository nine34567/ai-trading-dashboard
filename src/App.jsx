import { useEffect, useState } from "react"
import {
  getDashboardData,
  getBackendHealth,
  startBot,
  stopBot,
  emergencyStopBot,
  saveSettings,
  saveRiskSettings
} from "./api"
import StatCard from "./components/StatCard"
import Sidebar from "./components/Sidebar"
import OpenPositionsTable from "./components/OpenPositionsTable"
import HistoryTable from "./components/HistoryTable"
import PriceChart from "./components/PriceChart"
import RiskPanel from "./components/RiskPanel"

function App() {
  const [botStatus, setBotStatus] = useState("RUNNING")
  const [selectedMenu, setSelectedMenu] = useState("Dashboard")
  const [lastAction, setLastAction] = useState("Bot started")
  const [balance, setBalance] = useState("$0.00")
  const [dailyPnl, setDailyPnl] = useState("+$0.00")

  const [aiInsights, setAiInsights] = useState({
    signal: "HOLD",
    reason: "No data yet",
    confidence: "0%"
  })

  const [quantStats, setQuantStats] = useState({
    var: "-",
    volatility: "-",
    sharpeRatio: "-"
  })

  const [aiUsage, setAiUsage] = useState({
    apiCalls: "-",
    tokensUsed: "-",
    estimatedCost: "-"
  })

  const [settingsData, setSettingsData] = useState({
    symbol: "-",
    timeframe: "-",
    mode: "-"
  })

  const [settingsForm, setSettingsForm] = useState({
    symbol: "",
    timeframe: "",
    mode: ""
  })

  const [riskSettingsForm, setRiskSettingsForm] = useState({
    maxDailyLoss: "",
    riskPerTrade: "",
    maxOpenPositions: ""
  })

  const [backtestData, setBacktestData] = useState({
    totalTrades: "-",
    winRate: "-",
    netProfit: "-"
  })

  const [historyFilter, setHistoryFilter] = useState("ALL")
  const [historySearch, setHistorySearch] = useState("")
  const [chartData, setChartData] = useState([])

  const [riskData, setRiskData] = useState({
    maxDailyLoss: "-",
    currentDailyLoss: "-",
    dailyLossUsagePercent: 0,
    dailyLossStatus: "-",
    riskPerTrade: "-",
    maxOpenPositions: "-",
    currentOpenPositions: "-",
    riskStatus: "-"
  })

  const [basePositions, setBasePositions] = useState([])
  const [historyItems, setHistoryItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [riskSettingsSaving, setRiskSettingsSaving] = useState(false)
  const [lastUpdated, setLastUpdated] = useState("-")
  const [loadError, setLoadError] = useState("")
  const [backendStatus, setBackendStatus] = useState("Checking...")

  const loadDashboardData = async () => {
    setLoading(true)
    setLoadError("")

    try {
      const [dashboardData, healthData] = await Promise.all([
        getDashboardData(),
        getBackendHealth()
      ])

      setBotStatus(dashboardData.botStatus || "STOPPED")
      setLastAction(dashboardData.lastAction || "No action")
      setBalance(dashboardData.balance || "$0.00")
      setBasePositions(dashboardData.positions || [])
      setChartData(dashboardData.chartData || [])

      const nextRiskControls =
        dashboardData.riskControls || {
          maxDailyLoss: "-",
          currentDailyLoss: "-",
          dailyLossUsagePercent: 0,
          dailyLossStatus: "-",
          riskPerTrade: "-",
          maxOpenPositions: "-",
          currentOpenPositions: "-",
          riskStatus: "-"
        }

      setRiskData(nextRiskControls)

      const nextRiskSettings =
        dashboardData.riskSettings || {
          maxDailyLoss: nextRiskControls.maxDailyLoss || "",
          riskPerTrade: nextRiskControls.riskPerTrade || "",
          maxOpenPositions: nextRiskControls.maxOpenPositions || ""
        }

      setRiskSettingsForm({
        maxDailyLoss: nextRiskSettings.maxDailyLoss || "",
        riskPerTrade: nextRiskSettings.riskPerTrade || "",
        maxOpenPositions: String(nextRiskSettings.maxOpenPositions || "")
      })

      setHistoryItems(dashboardData.historyItems || [])
      setLastUpdated(dashboardData.fetchedAt || "-")
      setDailyPnl(dashboardData.dailyPnl || "+$0.00")

      setAiInsights(
        dashboardData.aiInsights || {
          signal: "HOLD",
          reason: "No data yet",
          confidence: "0%"
        }
      )

      setQuantStats(
        dashboardData.quantStats || {
          var: "-",
          volatility: "-",
          sharpeRatio: "-"
        }
      )

      setAiUsage(
        dashboardData.aiUsage || {
          apiCalls: "-",
          tokensUsed: "-",
          estimatedCost: "-"
        }
      )

      const nextSettings =
        dashboardData.settings || {
          symbol: "-",
          timeframe: "-",
          mode: "-"
        }

      setSettingsData(nextSettings)
      setSettingsForm(nextSettings)

      setBacktestData(
        dashboardData.backtest || {
          totalTrades: "-",
          winRate: "-",
          netProfit: "-"
        }
      )

      setBackendStatus(healthData.status === "ok" ? "Connected" : "Disconnected")
    } catch (error) {
      setLoadError(error.message || "Unknown error")
      setBackendStatus("Disconnected")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const systemMode = botStatus === "RUNNING" ? "ACTIVE" : "INACTIVE"
  const systemModeColor = botStatus === "RUNNING" ? "#86efac" : "#f87171"
  const visiblePositions = botStatus === "RUNNING" ? basePositions : []
  const openPositionsCount = visiblePositions.length.toString()
  const recentActivities = historyItems.slice(0, 3)

  const searchedHistoryItems = historyItems.filter((item) => {
    const keyword = historySearch.trim().toLowerCase()

    if (!keyword) return true

    const combinedText = `${item.date} ${item.symbol} ${item.type} ${item.pnl}`.toLowerCase()
    return combinedText.includes(keyword)
  })

  const filteredHistoryItems =
    historyFilter === "ALL"
      ? searchedHistoryItems
      : searchedHistoryItems.filter((item) => item.type === historyFilter)

  const totalHistoryRecords = historyItems.length
  const startActionsCount = historyItems.filter((item) => item.type === "START").length
  const stopActionsCount = historyItems.filter((item) => item.type === "STOP").length

  const cardInputStyle = {
    width: "100%",
    backgroundColor: "#0b1220",
    color: "white",
    border: "1px solid #1f2937",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box"
  }

  const labelStyle = {
    color: "#9ca3af",
    marginBottom: "8px",
    display: "block",
    fontSize: "14px"
  }

  const historyFilterButtonStyle = (type) => ({
    backgroundColor: historyFilter === type ? "#84cc16" : "#1f2937",
    color: historyFilter === type ? "black" : "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: "pointer"
  })

  const startButtonStyle = {
    backgroundColor: botStatus === "RUNNING" ? "#84cc16" : "#1f2937",
    color: botStatus === "RUNNING" ? "black" : "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: botStatus === "RUNNING" || actionLoading ? "not-allowed" : "pointer",
    opacity: botStatus === "RUNNING" || actionLoading ? 0.7 : 1
  }

  const stopButtonStyle = {
    backgroundColor: botStatus === "STOPPED" ? "#f87171" : "#1f2937",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: botStatus === "STOPPED" || actionLoading ? "not-allowed" : "pointer",
    opacity: botStatus === "STOPPED" || actionLoading ? 0.7 : 1
  }

  const emergencyButtonStyle = {
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: actionLoading ? "not-allowed" : "pointer",
    opacity: actionLoading ? 0.7 : 1
  }

  const refreshButtonStyle = {
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor:
      loading || actionLoading || settingsSaving || riskSettingsSaving
        ? "not-allowed"
        : "pointer",
    opacity: loading || actionLoading || settingsSaving || riskSettingsSaving ? 0.7 : 1
  }

  const retryButtonStyle = {
    backgroundColor: "#f59e0b",
    color: "black",
    border: "none",
    padding: "12px 24px",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.7 : 1
  }

  const saveButtonStyle = {
    backgroundColor: "#84cc16",
    color: "black",
    border: "none",
    padding: "12px 24px",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: settingsSaving ? "not-allowed" : "pointer",
    opacity: settingsSaving ? 0.7 : 1
  }

  const riskSaveButtonStyle = {
    backgroundColor: "#84cc16",
    color: "black",
    border: "none",
    padding: "12px 24px",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: riskSettingsSaving ? "not-allowed" : "pointer",
    opacity: riskSettingsSaving ? 0.7 : 1
  }

  const handleStart = async () => {
    if (botStatus === "RUNNING" || actionLoading) return

    try {
      setActionLoading(true)
      setLoadError("")
      await startBot()
      await loadDashboardData()
    } catch (error) {
      setLoadError(error.message || "Failed to start bot")
    } finally {
      setActionLoading(false)
    }
  }

  const handleStop = async () => {
    if (botStatus === "STOPPED" || actionLoading) return

    try {
      setActionLoading(true)
      setLoadError("")
      await stopBot()
      await loadDashboardData()
    } catch (error) {
      setLoadError(error.message || "Failed to stop bot")
    } finally {
      setActionLoading(false)
    }
  }

  const handleEmergencyStop = async () => {
    if (actionLoading) return

    try {
      setActionLoading(true)
      setLoadError("")
      await emergencyStopBot()
      await loadDashboardData()
    } catch (error) {
      setLoadError(error.message || "Failed to emergency stop bot")
    } finally {
      setActionLoading(false)
    }
  }

  const handleSettingsInputChange = (field, value) => {
    setSettingsForm((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleRiskSettingsInputChange = (field, value) => {
    setRiskSettingsForm((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveSettings = async () => {
    try {
      setSettingsSaving(true)
      setLoadError("")

      const payload = {
        symbol: settingsForm.symbol,
        timeframe: settingsForm.timeframe,
        mode: settingsForm.mode
      }

      await saveSettings(payload)
      await loadDashboardData()
    } catch (error) {
      setLoadError(error.message || "Failed to save settings")
    } finally {
      setSettingsSaving(false)
    }
  }

  const handleSaveRiskSettings = async () => {
    try {
      setRiskSettingsSaving(true)
      setLoadError("")

      const payload = {
        maxDailyLoss: riskSettingsForm.maxDailyLoss,
        riskPerTrade: riskSettingsForm.riskPerTrade,
        maxOpenPositions: riskSettingsForm.maxOpenPositions
      }

      await saveRiskSettings(payload)
      await loadDashboardData()
    } catch (error) {
      setLoadError(error.message || "Failed to save risk settings")
    } finally {
      setRiskSettingsSaving(false)
    }
  }

  const renderDashboardHeader = () => {
    return (
      <div
        style={{
          backgroundColor: "#111827",
          padding: "20px 24px",
          borderRadius: "16px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap"
        }}
      >
        <div>
          <h1 style={{ fontSize: "42px", marginBottom: "10px" }}>
            AI Trading Dashboard
          </h1>

          <p style={{ color: "#9ca3af", marginBottom: "12px" }}>
            Real-time trading overview
          </p>

          <p style={{ color: "#84cc16", fontWeight: "bold", marginBottom: "8px" }}>
            Current Menu: {selectedMenu}
          </p>

          <p style={{ color: "#d1d5db", marginBottom: "6px" }}>
            Last Action: {lastAction}
          </p>

          <p style={{ color: "#d1d5db", marginBottom: "6px" }}>
            Last Updated: {lastUpdated}
          </p>

          <p style={{ color: "#d1d5db", marginBottom: "6px" }}>
            Active Symbol: {settingsData.symbol}
          </p>

          <p style={{ color: "#d1d5db", marginBottom: "6px" }}>
            Timeframe: {settingsData.timeframe}
          </p>

          <p style={{ color: "#d1d5db", marginBottom: "6px" }}>
            Mode: {settingsData.mode}
          </p>

          <p style={{ color: systemModeColor, fontWeight: "bold" }}>
            System is currently {systemMode}
          </p>
        </div>

        <div
          style={{
            backgroundColor: "#0b1220",
            border: "1px solid #1f2937",
            padding: "16px 20px",
            borderRadius: "14px",
            minWidth: "220px"
          }}
        >
          <p style={{ color: "#9ca3af", marginBottom: "10px" }}>Quick Status</p>

          <p
            style={{
              color: botStatus === "RUNNING" ? "#86efac" : "#f87171",
              fontWeight: "bold",
              marginBottom: "6px"
            }}
          >
            Bot: {botStatus}
          </p>

          <p style={{ color: systemModeColor, fontWeight: "bold", marginBottom: "6px" }}>
            Mode: {systemMode}
          </p>

          <p style={{ color: "#d1d5db", marginBottom: "6px" }}>
            Symbol: {settingsData.symbol}
          </p>

          <p style={{ color: "#d1d5db", marginBottom: "6px" }}>
            Timeframe: {settingsData.timeframe}
          </p>

          <p style={{ color: "#d1d5db", marginBottom: "6px" }}>
            Execution: {settingsData.mode}
          </p>

          <p style={{ color: "#d1d5db", marginBottom: "6px" }}>
            Balance: {balance}
          </p>

          <p style={{ color: "#d1d5db", marginBottom: "6px" }}>
            Daily P&L: {dailyPnl}
          </p>

          <p style={{ color: "#d1d5db", marginBottom: "6px" }}>
            Open Positions: {openPositionsCount}
          </p>

          <p style={{ color: "#d1d5db", marginBottom: "6px" }}>
            Updated: {lastUpdated}
          </p>

          <p
            style={{
              color: backendStatus === "Connected" ? "#86efac" : "#f87171",
              fontWeight: "bold",
              marginBottom: "6px"
            }}
          >
            Backend: {backendStatus}
          </p>

          <p
            style={{
              color:
                loadError
                  ? "#f87171"
                  : loading || actionLoading || settingsSaving || riskSettingsSaving
                    ? "#facc15"
                    : "#86efac",
              fontWeight: "bold"
            }}
          >
            Data Status:{" "}
            {loadError
              ? "Error"
              : loading || actionLoading || settingsSaving || riskSettingsSaving
                ? "Loading..."
                : "Ready"}
          </p>
        </div>
      </div>
    )
  }

  const renderRecentActivity = () => {
    return (
      <div
        style={{
          backgroundColor: "#111827",
          padding: "24px",
          borderRadius: "16px",
          marginBottom: "24px"
        }}
      >
        <h3 style={{ marginBottom: "20px" }}>Recent Activity</h3>

        {recentActivities.map((item, index) => (
          <div
            key={index}
            style={{
              borderTop: "1px solid #1f2937",
              padding: "14px 0"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "16px",
                flexWrap: "wrap"
              }}
            >
              <div>
                <p style={{ color: "#d1d5db", fontWeight: "bold", marginBottom: "4px" }}>
                  {item.type}
                </p>
                <p style={{ color: "#9ca3af", fontSize: "14px" }}>
                  {item.symbol} • {item.date}
                </p>
              </div>

              <div
                style={{
                  color:
                    item.type === "SELL" || item.type === "STOP" || item.type === "EMERGENCY"
                      ? "#f87171"
                      : "#86efac",
                  fontWeight: "bold"
                }}
              >
                {item.pnl}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderCurrentTradingConfiguration = () => {
    return (
      <div
        style={{
          backgroundColor: "#111827",
          padding: "24px",
          borderRadius: "16px",
          marginBottom: "24px"
        }}
      >
        <h3 style={{ marginBottom: "20px" }}>Current Trading Configuration</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px"
          }}
        >
          <div style={{ backgroundColor: "#0b1220", border: "1px solid #1f2937", borderRadius: "14px", padding: "16px" }}>
            <p style={{ color: "#9ca3af", marginBottom: "8px" }}>Symbol</p>
            <p style={{ color: "#d1d5db", fontWeight: "bold" }}>{settingsData.symbol}</p>
          </div>

          <div style={{ backgroundColor: "#0b1220", border: "1px solid #1f2937", borderRadius: "14px", padding: "16px" }}>
            <p style={{ color: "#9ca3af", marginBottom: "8px" }}>Timeframe</p>
            <p style={{ color: "#d1d5db", fontWeight: "bold" }}>{settingsData.timeframe}</p>
          </div>

          <div style={{ backgroundColor: "#0b1220", border: "1px solid #1f2937", borderRadius: "14px", padding: "16px" }}>
            <p style={{ color: "#9ca3af", marginBottom: "8px" }}>Mode</p>
            <p style={{ color: "#d1d5db", fontWeight: "bold" }}>{settingsData.mode}</p>
          </div>

          <div style={{ backgroundColor: "#0b1220", border: "1px solid #1f2937", borderRadius: "14px", padding: "16px" }}>
            <p style={{ color: "#9ca3af", marginBottom: "8px" }}>Bot Status</p>
            <p style={{ color: botStatus === "RUNNING" ? "#86efac" : "#f87171", fontWeight: "bold" }}>
              {botStatus}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const renderAiDecisionSnapshot = () => {
    return (
      <div
        style={{
          backgroundColor: "#111827",
          padding: "24px",
          borderRadius: "16px",
          marginBottom: "24px"
        }}
      >
        <h3 style={{ marginBottom: "20px" }}>AI Decision Snapshot</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 2fr",
            gap: "16px"
          }}
        >
          <div style={{ backgroundColor: "#0b1220", border: "1px solid #1f2937", borderRadius: "14px", padding: "16px" }}>
            <p style={{ color: "#9ca3af", marginBottom: "8px" }}>Signal</p>
            <p style={{ color: "#d1d5db", fontWeight: "bold" }}>{aiInsights.signal}</p>
          </div>

          <div style={{ backgroundColor: "#0b1220", border: "1px solid #1f2937", borderRadius: "14px", padding: "16px" }}>
            <p style={{ color: "#9ca3af", marginBottom: "8px" }}>Confidence</p>
            <p style={{ color: "#d1d5db", fontWeight: "bold" }}>{aiInsights.confidence}</p>
          </div>

          <div style={{ backgroundColor: "#0b1220", border: "1px solid #1f2937", borderRadius: "14px", padding: "16px" }}>
            <p style={{ color: "#9ca3af", marginBottom: "8px" }}>Reason</p>
            <p style={{ color: "#d1d5db", fontWeight: "bold" }}>{aiInsights.reason}</p>
          </div>
        </div>
      </div>
    )
  }

  const renderSystemPerformanceSnapshot = () => {
    return (
      <div
        style={{
          backgroundColor: "#111827",
          padding: "24px",
          borderRadius: "16px",
          marginBottom: "24px"
        }}
      >
        <h3 style={{ marginBottom: "20px" }}>System Performance Snapshot</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px"
          }}
        >
          <div style={{ backgroundColor: "#0b1220", border: "1px solid #1f2937", borderRadius: "14px", padding: "16px" }}>
            <p style={{ color: "#9ca3af", marginBottom: "8px" }}>VaR</p>
            <p style={{ color: "#f87171", fontWeight: "bold" }}>{quantStats.var}</p>
          </div>

          <div style={{ backgroundColor: "#0b1220", border: "1px solid #1f2937", borderRadius: "14px", padding: "16px" }}>
            <p style={{ color: "#9ca3af", marginBottom: "8px" }}>Volatility</p>
            <p style={{ color: "#d1d5db", fontWeight: "bold" }}>{quantStats.volatility}</p>
          </div>

          <div style={{ backgroundColor: "#0b1220", border: "1px solid #1f2937", borderRadius: "14px", padding: "16px" }}>
            <p style={{ color: "#9ca3af", marginBottom: "8px" }}>Sharpe Ratio</p>
            <p style={{ color: "#86efac", fontWeight: "bold" }}>{quantStats.sharpeRatio}</p>
          </div>

          <div style={{ backgroundColor: "#0b1220", border: "1px solid #1f2937", borderRadius: "14px", padding: "16px" }}>
            <p style={{ color: "#9ca3af", marginBottom: "8px" }}>API Calls</p>
            <p style={{ color: "#d1d5db", fontWeight: "bold" }}>{aiUsage.apiCalls}</p>
          </div>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div
          style={{
            backgroundColor: "#111827",
            padding: "40px",
            borderRadius: "16px",
            color: "#d1d5db",
            fontSize: "20px",
            fontWeight: "bold"
          }}
        >
          Loading dashboard data...
        </div>
      )
    }

    if (loadError) {
      return (
        <div
          style={{
            backgroundColor: "#111827",
            padding: "40px",
            borderRadius: "16px"
          }}
        >
          <h2 style={{ color: "#f87171", marginBottom: "12px" }}>
            Failed to load dashboard data
          </h2>

          <p style={{ color: "#d1d5db", marginBottom: "20px" }}>
            Error: {loadError}
          </p>

          <button onClick={loadDashboardData} disabled={loading} style={retryButtonStyle}>
            Retry Load
          </button>
        </div>
      )
    }

    if (selectedMenu === "Dashboard") {
      return (
        <>
          {renderDashboardHeader()}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "20px",
              marginBottom: "30px"
            }}
          >
            <StatCard title="Balance" value={balance} color="white" />
            <StatCard title="Daily P&L" value={dailyPnl} color="#86efac" />
            <StatCard title="Bot Status" value={botStatus} color={botStatus === "RUNNING" ? "#86efac" : "#f87171"} />
            <StatCard title="System Mode" value={systemMode} color={systemModeColor} />
            <StatCard title="Open Positions" value={openPositionsCount} color={visiblePositions.length > 0 ? "#86efac" : "#f87171"} />
          </div>

          {renderCurrentTradingConfiguration()}
          {renderAiDecisionSnapshot()}
          {renderSystemPerformanceSnapshot()}

          <RiskPanel riskData={riskData} />

          <PriceChart
            data={chartData}
            symbol={settingsData.symbol}
            timeframe={settingsData.timeframe}
          />

          <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
            <button onClick={handleStart} disabled={botStatus === "RUNNING" || actionLoading} style={startButtonStyle}>
              Start
            </button>

            <button onClick={handleStop} disabled={botStatus === "STOPPED" || actionLoading} style={stopButtonStyle}>
              Stop
            </button>

            <button onClick={handleEmergencyStop} disabled={actionLoading} style={emergencyButtonStyle}>
              Emergency Stop
            </button>

            <button
              onClick={loadDashboardData}
              disabled={loading || actionLoading || settingsSaving || riskSettingsSaving}
              style={refreshButtonStyle}
            >
              {loading || actionLoading || settingsSaving || riskSettingsSaving
                ? "Refreshing..."
                : "Refresh Data"}
            </button>
          </div>

          {renderRecentActivity()}

          <OpenPositionsTable positions={visiblePositions} />
        </>
      )
    }

    if (selectedMenu === "Backtest") {
      return (
        <>
          <h1 style={{ fontSize: "42px", marginBottom: "10px" }}>Backtest</h1>

          <p style={{ color: "#84cc16", marginBottom: "30px", fontWeight: "bold" }}>
            Current Menu: {selectedMenu}
          </p>

          <div style={{ backgroundColor: "#111827", padding: "24px", borderRadius: "16px" }}>
            <h3 style={{ marginBottom: "12px" }}>Backtest Summary</h3>

            <p style={{ color: "#9ca3af", marginBottom: "10px" }}>
              Total Trades: {backtestData.totalTrades}
            </p>

            <p style={{ color: "#9ca3af", marginBottom: "10px" }}>
              Win Rate: {backtestData.winRate}
            </p>

            <p style={{ color: "#9ca3af" }}>
              Net Profit: {backtestData.netProfit}
            </p>
          </div>
        </>
      )
    }

    if (selectedMenu === "History") {
      return (
        <>
          <h1 style={{ fontSize: "42px", marginBottom: "10px" }}>History</h1>

          <p style={{ color: "#84cc16", marginBottom: "30px", fontWeight: "bold" }}>
            Current Menu: {selectedMenu}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "20px",
              marginBottom: "24px"
            }}
          >
            <StatCard title="Total Records" value={String(totalHistoryRecords)} color="white" />
            <StatCard title="Start Actions" value={String(startActionsCount)} color="#86efac" />
            <StatCard title="Stop Actions" value={String(stopActionsCount)} color="#f87171" />
          </div>

          <div
            style={{
              backgroundColor: "#111827",
              padding: "20px",
              borderRadius: "16px",
              marginBottom: "24px"
            }}
          >
            <h3 style={{ marginBottom: "16px" }}>History Filter</h3>

            <div style={{ marginBottom: "16px" }}>
              <input
                type="text"
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
                placeholder="ค้นหาจาก type, symbol, date, pnl..."
                style={cardInputStyle}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button onClick={() => setHistoryFilter("ALL")} style={historyFilterButtonStyle("ALL")}>ALL</button>
              <button onClick={() => setHistoryFilter("START")} style={historyFilterButtonStyle("START")}>START</button>
              <button onClick={() => setHistoryFilter("STOP")} style={historyFilterButtonStyle("STOP")}>STOP</button>
              <button onClick={() => setHistoryFilter("EMERGENCY")} style={historyFilterButtonStyle("EMERGENCY")}>EMERGENCY</button>
              <button onClick={() => setHistoryFilter("SETTINGS")} style={historyFilterButtonStyle("SETTINGS")}>SETTINGS</button>
            </div>
          </div>

          <HistoryTable historyItems={filteredHistoryItems} />
        </>
      )
    }

    if (selectedMenu === "AI Insights") {
      return (
        <>
          <h1 style={{ fontSize: "42px", marginBottom: "10px" }}>AI Insights</h1>

          <p style={{ color: "#84cc16", marginBottom: "30px", fontWeight: "bold" }}>
            Current Menu: {selectedMenu}
          </p>

          <div style={{ backgroundColor: "#111827", padding: "24px", borderRadius: "16px" }}>
            <h3 style={{ marginBottom: "12px" }}>Latest AI Decision</h3>

            <p style={{ color: "#9ca3af", marginBottom: "10px" }}>
              Signal: {aiInsights.signal}
            </p>

            <p style={{ color: "#9ca3af", marginBottom: "10px" }}>
              Reason: {aiInsights.reason}
            </p>

            <p style={{ color: "#9ca3af" }}>
              Confidence: {aiInsights.confidence}
            </p>
          </div>
        </>
      )
    }

    if (selectedMenu === "AI Usage") {
      return (
        <>
          <h1 style={{ fontSize: "42px", marginBottom: "10px" }}>AI Usage</h1>

          <p style={{ color: "#84cc16", marginBottom: "30px", fontWeight: "bold" }}>
            Current Menu: {selectedMenu}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            <StatCard title="API Calls" value={aiUsage.apiCalls} color="white" />
            <StatCard title="Tokens Used" value={aiUsage.tokensUsed} color="#86efac" />
            <StatCard title="Estimated Cost" value={aiUsage.estimatedCost} color="#facc15" />
          </div>
        </>
      )
    }

    if (selectedMenu === "Quant") {
      return (
        <>
          <h1 style={{ fontSize: "42px", marginBottom: "10px" }}>Quant</h1>

          <p style={{ color: "#84cc16", marginBottom: "30px", fontWeight: "bold" }}>
            Current Menu: {selectedMenu}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            <StatCard title="VaR" value={quantStats.var} color="#f87171" />
            <StatCard title="Volatility" value={quantStats.volatility} color="white" />
            <StatCard title="Sharpe Ratio" value={quantStats.sharpeRatio} color="#86efac" />
          </div>
        </>
      )
    }

    if (selectedMenu === "Settings") {
      return (
        <>
          <h1 style={{ fontSize: "42px", marginBottom: "10px" }}>Settings</h1>

          <p style={{ color: "#84cc16", marginBottom: "30px", fontWeight: "bold" }}>
            Current Menu: {selectedMenu}
          </p>

          <div style={{ backgroundColor: "#111827", padding: "24px", borderRadius: "16px", marginBottom: "24px" }}>
            <h3 style={{ marginBottom: "20px" }}>Bot Settings</h3>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Symbol</label>
              <input
                type="text"
                value={settingsForm.symbol}
                onChange={(event) => handleSettingsInputChange("symbol", event.target.value)}
                style={cardInputStyle}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Timeframe</label>
              <input
                type="text"
                value={settingsForm.timeframe}
                onChange={(event) => handleSettingsInputChange("timeframe", event.target.value)}
                style={cardInputStyle}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Mode</label>
              <input
                type="text"
                value={settingsForm.mode}
                onChange={(event) => handleSettingsInputChange("mode", event.target.value)}
                style={cardInputStyle}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
              <button onClick={handleSaveSettings} disabled={settingsSaving} style={saveButtonStyle}>
                {settingsSaving ? "Saving..." : "Save Settings"}
              </button>
            </div>

            <div
              style={{
                backgroundColor: "#0b1220",
                border: "1px solid #1f2937",
                borderRadius: "14px",
                padding: "16px"
              }}
            >
              <p style={{ color: "#9ca3af", marginBottom: "10px" }}>Saved Values</p>

              <p style={{ color: "#d1d5db", marginBottom: "8px" }}>
                Symbol: {settingsData.symbol}
              </p>

              <p style={{ color: "#d1d5db", marginBottom: "8px" }}>
                Timeframe: {settingsData.timeframe}
              </p>

              <p style={{ color: "#d1d5db" }}>
                Mode: {settingsData.mode}
              </p>
            </div>
          </div>

          <div style={{ backgroundColor: "#111827", padding: "24px", borderRadius: "16px" }}>
            <h3 style={{ marginBottom: "20px" }}>Risk Controls Settings</h3>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Max Daily Loss</label>
              <input
                type="text"
                value={riskSettingsForm.maxDailyLoss}
                onChange={(event) =>
                  handleRiskSettingsInputChange("maxDailyLoss", event.target.value)
                }
                placeholder="$10.00"
                style={cardInputStyle}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Risk Per Trade</label>
              <input
                type="text"
                value={riskSettingsForm.riskPerTrade}
                onChange={(event) =>
                  handleRiskSettingsInputChange("riskPerTrade", event.target.value)
                }
                placeholder="1%"
                style={cardInputStyle}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Max Open Positions</label>
              <input
                type="text"
                value={riskSettingsForm.maxOpenPositions}
                onChange={(event) =>
                  handleRiskSettingsInputChange("maxOpenPositions", event.target.value)
                }
                placeholder="3"
                style={cardInputStyle}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
              <button
                onClick={handleSaveRiskSettings}
                disabled={riskSettingsSaving}
                style={riskSaveButtonStyle}
              >
                {riskSettingsSaving ? "Saving..." : "Save Risk Controls"}
              </button>
            </div>

            <div
              style={{
                backgroundColor: "#0b1220",
                border: "1px solid #1f2937",
                borderRadius: "14px",
                padding: "16px"
              }}
            >
              <p style={{ color: "#9ca3af", marginBottom: "10px" }}>Current Risk Controls</p>

              <p style={{ color: "#d1d5db", marginBottom: "8px" }}>
                Max Daily Loss: {riskData.maxDailyLoss}
              </p>

              <p style={{ color: "#d1d5db", marginBottom: "8px" }}>
                Risk Per Trade: {riskData.riskPerTrade}
              </p>

              <p style={{ color: "#d1d5db" }}>
                Max Open Positions: {riskData.maxOpenPositions}
              </p>
            </div>
          </div>
        </>
      )
    }

    return null
  }

  return (
    <div
      style={{
        backgroundColor: "#0b0f14",
        color: "white",
        minHeight: "100vh",
        display: "flex",
        fontFamily: "Arial, sans-serif"
      }}
    >
      <Sidebar
        selectedMenu={selectedMenu}
        setSelectedMenu={setSelectedMenu}
      />

      <div style={{ flex: 1, padding: "40px" }}>
        {renderContent()}
      </div>
    </div>
  )
}

export default App