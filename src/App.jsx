import { useEffect, useState } from "react"
import {
  getDashboardData,
  getBackendHealth,
  startBot,
  stopBot,
  emergencyStopBot,
  saveSettings,
  saveRiskSettings,
  saveAccountSettings
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

  const [accountSettingsForm, setAccountSettingsForm] = useState({
    balance: "",
    dailyPnl: "",
    currentDailyLoss: ""
  })

  const [selectedAccountScenario, setSelectedAccountScenario] = useState("Custom")

  const [riskSettingsForm, setRiskSettingsForm] = useState({
    maxDailyLoss: "",
    riskPerTrade: "",
    maxOpenPositions: ""
  })

  const [selectedRiskPreset, setSelectedRiskPreset] = useState("Custom")

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
  const [settingsError, setSettingsError] = useState("")
  const [settingsSuccess, setSettingsSuccess] = useState("")

  const [accountSettingsSaving, setAccountSettingsSaving] = useState(false)
  const [accountSettingsError, setAccountSettingsError] = useState("")
  const [accountSettingsSuccess, setAccountSettingsSuccess] = useState("")

  const [riskSettingsSaving, setRiskSettingsSaving] = useState(false)
  const [riskSettingsError, setRiskSettingsError] = useState("")
  const [riskSettingsSuccess, setRiskSettingsSuccess] = useState("")

  const [lastUpdated, setLastUpdated] = useState("-")
  const [loadError, setLoadError] = useState("")
  const [backendStatus, setBackendStatus] = useState("Checking...")

  const symbolOptions = ["OILCash", "XAUUSD", "USDJPYmicro"]
  const timeframeOptions = ["M5", "M15", "H1", "H4"]
  const modeOptions = ["Paper Trading", "Live Trading"]

  const defaultBotSettings = {
    symbol: "OILCash",
    timeframe: "M15",
    mode: "Paper Trading"
  }

  const defaultAccountSettings = {
    balance: "$33.85",
    dailyPnl: "+$2.95",
    currentDailyLoss: "$0.00"
  }

  const defaultRiskSettings = {
    maxDailyLoss: "$10.00",
    riskPerTrade: "1%",
    maxOpenPositions: "3"
  }

  const accountScenarioOptions = [
    {
      name: "Normal Day",
      balance: "$1000.00",
      dailyPnl: "+$2.95",
      currentDailyLoss: "$0.00",
      description: "วันปกติ ยังไม่มีขาดทุนรายวัน"
    },
    {
      name: "Small Loss",
      balance: "$1000.00",
      dailyPnl: "-$3.00",
      currentDailyLoss: "$3.00",
      description: "ขาดทุนเล็กน้อย แต่ยังไม่ชน daily loss limit"
    },
    {
      name: "Daily Loss Hit",
      balance: "$1000.00",
      dailyPnl: "-$10.00",
      currentDailyLoss: "$10.00",
      description: "จำลองกรณีขาดทุนรายวันชน limit"
    },
    {
      name: "Recovery Day",
      balance: "$1000.00",
      dailyPnl: "+$6.00",
      currentDailyLoss: "$2.00",
      description: "วันฟื้นตัว มีกำไร แต่ยังมี loss ที่เคยเกิดระหว่างวัน"
    }
  ]

  const riskPresetOptions = [
    {
      name: "Conservative",
      maxDailyLoss: "$5.00",
      riskPerTrade: "0.5%",
      maxOpenPositions: "2",
      description: "ปลอดภัยสุด เหมาะกับช่วงเริ่มต้นหรือยังไม่มั่นใจ"
    },
    {
      name: "Balanced",
      maxDailyLoss: "$10.00",
      riskPerTrade: "1%",
      maxOpenPositions: "3",
      description: "สมดุล เหมาะกับการเทรดทั่วไปแบบคุมความเสี่ยง"
    },
    {
      name: "Aggressive",
      maxDailyLoss: "$20.00",
      riskPerTrade: "2%",
      maxOpenPositions: "5",
      description: "เสี่ยงสูงขึ้น เหมาะกับช่วงทดสอบระบบที่มั่นใจแล้ว"
    }
  ]

  const getAccountScenarioNameFromValues = (accountSettings) => {
    const matchedScenario = accountScenarioOptions.find((scenario) => {
      return (
        scenario.balance === String(accountSettings.balance || "") &&
        scenario.dailyPnl === String(accountSettings.dailyPnl || "") &&
        scenario.currentDailyLoss === String(accountSettings.currentDailyLoss || "")
      )
    })

    return matchedScenario ? matchedScenario.name : "Custom"
  }

  const getRiskPresetNameFromValues = (riskSettings) => {
    const matchedPreset = riskPresetOptions.find((preset) => {
      return (
        preset.maxDailyLoss === riskSettings.maxDailyLoss &&
        preset.riskPerTrade === riskSettings.riskPerTrade &&
        preset.maxOpenPositions === String(riskSettings.maxOpenPositions)
      )
    })

    return matchedPreset ? matchedPreset.name : "Custom"
  }

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

      const nextAccountSettings =
        dashboardData.accountSettings || {
          balance: dashboardData.balance || "",
          dailyPnl: dashboardData.dailyPnl || "",
          currentDailyLoss: nextRiskControls.currentDailyLoss || ""
        }

      setAccountSettingsForm({
        balance: nextAccountSettings.balance || "",
        dailyPnl: nextAccountSettings.dailyPnl || "",
        currentDailyLoss: nextAccountSettings.currentDailyLoss || ""
      })

      setSelectedAccountScenario(
        getAccountScenarioNameFromValues(nextAccountSettings)
      )

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

      setSelectedRiskPreset(getRiskPresetNameFromValues(nextRiskSettings))

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

  const currentAccountScenario = getAccountScenarioNameFromValues({
    balance,
    dailyPnl,
    currentDailyLoss: riskData.currentDailyLoss
  })

  const currentAccountScenarioDetails = accountScenarioOptions.find(
    (scenario) => scenario.name === currentAccountScenario
  )

  const currentAccountScenarioDescription =
    currentAccountScenarioDetails?.description ||
    "ค่าปัจจุบันไม่ตรงกับ scenario สำเร็จรูปแบบ 100%"

  const currentAccountScenarioColor =
    currentAccountScenario === "Normal Day"
      ? "#86efac"
      : currentAccountScenario === "Small Loss"
        ? "#facc15"
        : currentAccountScenario === "Daily Loss Hit"
          ? "#f87171"
          : currentAccountScenario === "Recovery Day"
            ? "#38bdf8"
            : "#d1d5db"

  const searchedHistoryItems = historyItems.filter((item) => {
    const keyword = historySearch.trim().toLowerCase()

    if (!keyword) return true

    const combinedText = `${item.date} ${item.symbol} ${item.type} ${item.pnl} ${item.detail}`.toLowerCase()
    return combinedText.includes(keyword)
  })

  const filteredHistoryItems =
    historyFilter === "ALL"
      ? searchedHistoryItems
      : searchedHistoryItems.filter((item) => item.type === historyFilter)

  const totalHistoryRecords = historyItems.length
  const startActionsCount = historyItems.filter((item) => item.type === "START").length
  const stopActionsCount = historyItems.filter((item) => item.type === "STOP").length

  const isBusy =
    loading ||
    actionLoading ||
    settingsSaving ||
    accountSettingsSaving ||
    riskSettingsSaving

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
    cursor: isBusy ? "not-allowed" : "pointer",
    opacity: isBusy ? 0.7 : 1
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

  const accountSaveButtonStyle = {
    backgroundColor: "#84cc16",
    color: "black",
    border: "none",
    padding: "12px 24px",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: accountSettingsSaving ? "not-allowed" : "pointer",
    opacity: accountSettingsSaving ? 0.7 : 1
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

  const resetButtonStyle = {
    backgroundColor: "#374151",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: "pointer"
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
    setSettingsError("")
    setSettingsSuccess("")

    setSettingsForm((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAccountSettingsInputChange = (field, value) => {
    setSelectedAccountScenario("Custom")
    setAccountSettingsError("")
    setAccountSettingsSuccess("")

    setAccountSettingsForm((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAccountScenarioChange = (scenarioName) => {
    setSelectedAccountScenario(scenarioName)
    setAccountSettingsError("")
    setAccountSettingsSuccess("")

    if (scenarioName === "Custom") return

    const selectedScenario = accountScenarioOptions.find(
      (scenario) => scenario.name === scenarioName
    )

    if (!selectedScenario) return

    setAccountSettingsForm({
      balance: selectedScenario.balance,
      dailyPnl: selectedScenario.dailyPnl,
      currentDailyLoss: selectedScenario.currentDailyLoss
    })
  }

  const handleRiskSettingsInputChange = (field, value) => {
    setSelectedRiskPreset("Custom")
    setRiskSettingsError("")
    setRiskSettingsSuccess("")

    setRiskSettingsForm((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleRiskPresetChange = (presetName) => {
    setSelectedRiskPreset(presetName)
    setRiskSettingsError("")
    setRiskSettingsSuccess("")

    if (presetName === "Custom") return

    const selectedPreset = riskPresetOptions.find((preset) => preset.name === presetName)

    if (!selectedPreset) return

    setRiskSettingsForm({
      maxDailyLoss: selectedPreset.maxDailyLoss,
      riskPerTrade: selectedPreset.riskPerTrade,
      maxOpenPositions: selectedPreset.maxOpenPositions
    })
  }

  const handleSaveSettings = async () => {
    const symbol = settingsForm.symbol.trim()
    const timeframe = settingsForm.timeframe.trim()
    const mode = settingsForm.mode.trim()

    setSettingsError("")
    setSettingsSuccess("")

    if (!symbol) {
      setSettingsError("Symbol is required. Please select a trading symbol.")
      return
    }

    if (!timeframe) {
      setSettingsError("Timeframe is required. Please select a timeframe.")
      return
    }

    if (!mode) {
      setSettingsError("Mode is required. Please select a trading mode.")
      return
    }

    try {
      setSettingsSaving(true)
      setLoadError("")

      await saveSettings({
        symbol,
        timeframe,
        mode
      })

      await loadDashboardData()

      setSettingsSuccess("Bot settings saved successfully.")
    } catch (error) {
      setSettingsError(error.message || "Failed to save settings")
    } finally {
      setSettingsSaving(false)
    }
  }

  const handleResetBotSettings = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to reset Bot Settings?"
    )

    if (!confirmed) return

    try {
      setSettingsSaving(true)
      setSettingsError("")
      setSettingsSuccess("")
      setLoadError("")

      await saveSettings(defaultBotSettings)
      await loadDashboardData()

      setSettingsSuccess("Bot settings reset successfully.")
    } catch (error) {
      setSettingsError(error.message || "Failed to reset bot settings")
    } finally {
      setSettingsSaving(false)
    }
  }

  const handleSaveAccountSettings = async () => {
    try {
      setAccountSettingsSaving(true)
      setAccountSettingsError("")
      setAccountSettingsSuccess("")

      await saveAccountSettings({
        balance: accountSettingsForm.balance,
        dailyPnl: accountSettingsForm.dailyPnl,
        currentDailyLoss: accountSettingsForm.currentDailyLoss
      })

      await loadDashboardData()

      setAccountSettingsSuccess("Account settings saved successfully.")
    } catch (error) {
      setAccountSettingsError(error.message || "Failed to save account settings")
    } finally {
      setAccountSettingsSaving(false)
    }
  }

  const handleResetAccountSettings = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to reset Account Settings?"
    )

    if (!confirmed) return

    try {
      setAccountSettingsSaving(true)
      setAccountSettingsError("")
      setAccountSettingsSuccess("")
      setLoadError("")

      await saveAccountSettings(defaultAccountSettings)
      await loadDashboardData()

      setAccountSettingsSuccess("Account settings reset successfully.")
    } catch (error) {
      setAccountSettingsError(error.message || "Failed to reset account settings")
    } finally {
      setAccountSettingsSaving(false)
    }
  }

  const handleSaveRiskSettings = async () => {
    try {
      setRiskSettingsSaving(true)
      setRiskSettingsError("")
      setRiskSettingsSuccess("")

      await saveRiskSettings({
        maxDailyLoss: riskSettingsForm.maxDailyLoss,
        riskPerTrade: riskSettingsForm.riskPerTrade,
        maxOpenPositions: riskSettingsForm.maxOpenPositions
      })

      await loadDashboardData()

      setRiskSettingsSuccess("Risk controls saved successfully.")
    } catch (error) {
      setRiskSettingsError(error.message || "Failed to save risk settings")
    } finally {
      setRiskSettingsSaving(false)
    }
  }

  const handleResetRiskSettings = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to reset Risk Controls?"
    )

    if (!confirmed) return

    try {
      setRiskSettingsSaving(true)
      setRiskSettingsError("")
      setRiskSettingsSuccess("")
      setLoadError("")

      await saveRiskSettings(defaultRiskSettings)
      await loadDashboardData()

      setRiskSettingsSuccess("Risk controls reset successfully.")
    } catch (error) {
      setRiskSettingsError(error.message || "Failed to reset risk controls")
    } finally {
      setRiskSettingsSaving(false)
    }
  }

  const renderDashboardSectionCard = (title, subtitle, children) => {
    return (
      <section
        style={{
          backgroundColor: "#0f172a",
          border: "1px solid #1f2937",
          borderRadius: "20px",
          padding: "22px",
          marginBottom: "24px",
          boxShadow: "0 18px 40px rgba(0, 0, 0, 0.22)"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "18px"
          }}
        >
          <div>
            <p
              style={{
                color: "#84cc16",
                fontSize: "12px",
                fontWeight: "bold",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "8px"
              }}
            >
              Dashboard Section
            </p>

            <h2
              style={{
                fontSize: "24px",
                marginBottom: "6px",
                color: "#f9fafb"
              }}
            >
              {title}
            </h2>

            <p
              style={{
                color: "#9ca3af",
                fontSize: "14px",
                lineHeight: "1.6"
              }}
            >
              {subtitle}
            </p>
          </div>

          <div
            style={{
              backgroundColor: "#111827",
              border: "1px solid #1f2937",
              color: "#d1d5db",
              padding: "8px 12px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: "bold"
            }}
          >
            SYSTEM PANEL
          </div>
        </div>

        <div>{children}</div>
      </section>
    )
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
              color: loadError ? "#f87171" : isBusy ? "#facc15" : "#86efac",
              fontWeight: "bold"
            }}
          >
            Data Status: {loadError ? "Error" : isBusy ? "Loading..." : "Ready"}
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

        {recentActivities.length === 0 ? (
          <p style={{ color: "#9ca3af" }}>No recent activity.</p>
        ) : (
          recentActivities.map((item, index) => (
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

                  <p style={{ color: "#9ca3af", fontSize: "13px", marginTop: "4px" }}>
                    {item.detail || "-"}
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
          ))
        )}
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

  const renderAccountScenarioBadge = () => {
    return (
      <div
        style={{
          backgroundColor: "#111827",
          padding: "24px",
          borderRadius: "16px",
          marginBottom: "24px"
        }}
      >
        <h3 style={{ marginBottom: "20px" }}>Account Scenario Badge</h3>

        <div
          style={{
            backgroundColor: "#0b1220",
            border: `1px solid ${currentAccountScenarioColor}`,
            borderRadius: "14px",
            padding: "16px",
            marginBottom: "16px"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
              alignItems: "center",
              marginBottom: "8px"
            }}
          >
            <p style={{ color: "#9ca3af" }}>Current Account Scenario</p>

            <p
              style={{
                color: currentAccountScenarioColor,
                fontWeight: "bold",
                fontSize: "18px"
              }}
            >
              {currentAccountScenario}
            </p>
          </div>

          <p style={{ color: "#d1d5db", fontWeight: "bold" }}>
            {currentAccountScenarioDescription}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px"
          }}
        >
          <div style={{ backgroundColor: "#0b1220", border: "1px solid #1f2937", borderRadius: "14px", padding: "16px" }}>
            <p style={{ color: "#9ca3af", marginBottom: "8px" }}>Balance</p>
            <p style={{ color: "#d1d5db", fontWeight: "bold" }}>{balance}</p>
          </div>

          <div style={{ backgroundColor: "#0b1220", border: "1px solid #1f2937", borderRadius: "14px", padding: "16px" }}>
            <p style={{ color: "#9ca3af", marginBottom: "8px" }}>Daily P&L</p>
            <p
              style={{
                color: dailyPnl.includes("-") ? "#f87171" : "#86efac",
                fontWeight: "bold"
              }}
            >
              {dailyPnl}
            </p>
          </div>

          <div style={{ backgroundColor: "#0b1220", border: "1px solid #1f2937", borderRadius: "14px", padding: "16px" }}>
            <p style={{ color: "#9ca3af", marginBottom: "8px" }}>
              Current Daily Loss
            </p>

            <p style={{ color: "#f87171", fontWeight: "bold" }}>
              {riskData.currentDailyLoss}
            </p>
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

          {renderDashboardSectionCard(
            "1. Account & Bot Overview",
            "ภาพรวมบัญชี สถานะบอท และจำนวนออเดอร์ที่เปิดอยู่",
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "20px"
              }}
            >
              <StatCard title="Balance" value={balance} color="white" />
              <StatCard title="Daily P&L" value={dailyPnl} color={dailyPnl.includes("-") ? "#f87171" : "#86efac"} />
              <StatCard title="Bot Status" value={botStatus} color={botStatus === "RUNNING" ? "#86efac" : "#f87171"} />
              <StatCard title="System Mode" value={systemMode} color={systemModeColor} />
              <StatCard title="Open Positions" value={openPositionsCount} color={visiblePositions.length > 0 ? "#86efac" : "#f87171"} />
            </div>
          )}

          {renderDashboardSectionCard(
            "2. Trading Configuration",
            "ค่าการเทรดปัจจุบัน เช่น Symbol, Timeframe, Mode และสถานะบอท",
            renderCurrentTradingConfiguration()
          )}

          {renderDashboardSectionCard(
            "3. AI & System Intelligence",
            "สัญญาณ AI และค่าสถิติหลักของระบบ",
            <>
              {renderAiDecisionSnapshot()}
              {renderSystemPerformanceSnapshot()}
            </>
          )}

          {renderDashboardSectionCard(
            "4. Account Scenario",
            "สถานการณ์จำลองของบัญชี เช่น Normal Day, Small Loss หรือ Daily Loss Hit",
            renderAccountScenarioBadge()
          )}

          {renderDashboardSectionCard(
            "5. Risk Engine",
            "ระบบประเมินความเสี่ยงก่อนอนุญาตให้เปิดออเดอร์ใหม่",
            <RiskPanel riskData={riskData} />
          )}

          {renderDashboardSectionCard(
            "6. Chart & Market Data",
            "กราฟราคาและข้อมูลราคาจำลองจาก backend",
            <PriceChart
              data={chartData}
              symbol={settingsData.symbol}
              timeframe={settingsData.timeframe}
            />
          )}

          {renderDashboardSectionCard(
            "7. Trade Control",
            "ปุ่มควบคุมบอท เริ่ม หยุด ฉุกเฉิน และรีเฟรชข้อมูล",
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
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
                disabled={isBusy}
                style={refreshButtonStyle}
              >
                {isBusy ? "Refreshing..." : "Refresh Data"}
              </button>
            </div>
          )}

          {renderDashboardSectionCard(
            "8. Activity & Positions",
            "ประวัติล่าสุดและรายการออเดอร์ที่เปิดอยู่",
            <>
              {renderRecentActivity()}
              <OpenPositionsTable positions={visiblePositions} />
            </>
          )}
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
                placeholder="ค้นหาจาก type, symbol, detail, date, pnl..."
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

              <select
                value={settingsForm.symbol}
                onChange={(event) => handleSettingsInputChange("symbol", event.target.value)}
                style={cardInputStyle}
              >
                <option value="">Select Symbol</option>
                {symbolOptions.map((symbol) => (
                  <option key={symbol} value={symbol}>
                    {symbol}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Timeframe</label>

              <select
                value={settingsForm.timeframe}
                onChange={(event) => handleSettingsInputChange("timeframe", event.target.value)}
                style={cardInputStyle}
              >
                <option value="">Select Timeframe</option>
                {timeframeOptions.map((timeframe) => (
                  <option key={timeframe} value={timeframe}>
                    {timeframe}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Mode</label>

              <select
                value={settingsForm.mode}
                onChange={(event) => handleSettingsInputChange("mode", event.target.value)}
                style={cardInputStyle}
              >
                <option value="">Select Mode</option>
                {modeOptions.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
              <button onClick={handleSaveSettings} disabled={settingsSaving} style={saveButtonStyle}>
                {settingsSaving ? "Saving..." : "Save Settings"}
              </button>

              <button
                onClick={handleResetBotSettings}
                disabled={settingsSaving}
                style={resetButtonStyle}
              >
                Reset Bot Settings
              </button>
            </div>

            {settingsError && (
              <div
                style={{
                  backgroundColor: "#450a0a",
                  border: "1px solid #991b1b",
                  borderRadius: "14px",
                  padding: "16px",
                  marginBottom: "16px"
                }}
              >
                <p style={{ color: "#fecaca", fontWeight: "bold", marginBottom: "8px" }}>
                  Bot Settings Error:
                </p>

                <p style={{ color: "#fecaca" }}>
                  {settingsError}
                </p>
              </div>
            )}

            {settingsSuccess && (
              <div
                style={{
                  backgroundColor: "#052e16",
                  border: "1px solid #166534",
                  borderRadius: "14px",
                  padding: "16px",
                  marginBottom: "16px"
                }}
              >
                <p style={{ color: "#bbf7d0", fontWeight: "bold" }}>
                  {settingsSuccess}
                </p>
              </div>
            )}

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

          <div style={{ backgroundColor: "#111827", padding: "24px", borderRadius: "16px", marginBottom: "24px" }}>
            <h3 style={{ marginBottom: "20px" }}>Account Summary Settings</h3>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Account Scenario</label>

              <select
                value={selectedAccountScenario}
                onChange={(event) => handleAccountScenarioChange(event.target.value)}
                style={cardInputStyle}
              >
                <option value="Custom">Custom</option>

                {accountScenarioOptions.map((scenario) => (
                  <option key={scenario.name} value={scenario.name}>
                    {scenario.name}
                  </option>
                ))}
              </select>
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
              <p style={{ color: "#9ca3af", marginBottom: "12px" }}>
                Account Scenario Guide
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "14px"
                }}
              >
                {accountScenarioOptions.map((scenario) => (
                  <div
                    key={scenario.name}
                    style={{
                      backgroundColor:
                        selectedAccountScenario === scenario.name ? "#1a2e05" : "#111827",
                      border:
                        selectedAccountScenario === scenario.name
                          ? "1px solid #84cc16"
                          : "1px solid #1f2937",
                      borderRadius: "14px",
                      padding: "14px"
                    }}
                  >
                    <p style={{ color: "#d1d5db", fontWeight: "bold", marginBottom: "8px" }}>
                      {scenario.name}
                    </p>

                    <p style={{ color: "#9ca3af", marginBottom: "6px", fontSize: "14px" }}>
                      Balance: {scenario.balance}
                    </p>

                    <p style={{ color: "#9ca3af", marginBottom: "6px", fontSize: "14px" }}>
                      Daily P&L: {scenario.dailyPnl}
                    </p>

                    <p style={{ color: "#9ca3af", marginBottom: "8px", fontSize: "14px" }}>
                      Daily Loss: {scenario.currentDailyLoss}
                    </p>

                    <p style={{ color: "#d1d5db", fontSize: "13px" }}>
                      {scenario.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Balance</label>

              <input
                type="text"
                value={accountSettingsForm.balance}
                onChange={(event) =>
                  handleAccountSettingsInputChange("balance", event.target.value)
                }
                placeholder="$33.85"
                style={cardInputStyle}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Daily P&L</label>

              <input
                type="text"
                value={accountSettingsForm.dailyPnl}
                onChange={(event) =>
                  handleAccountSettingsInputChange("dailyPnl", event.target.value)
                }
                placeholder="+2.95 or -5.00"
                style={cardInputStyle}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Current Daily Loss</label>

              <input
                type="text"
                value={accountSettingsForm.currentDailyLoss}
                onChange={(event) =>
                  handleAccountSettingsInputChange("currentDailyLoss", event.target.value)
                }
                placeholder="0 or 2.50"
                style={cardInputStyle}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
              <button
                onClick={handleSaveAccountSettings}
                disabled={accountSettingsSaving}
                style={accountSaveButtonStyle}
              >
                {accountSettingsSaving ? "Saving..." : "Save Account Settings"}
              </button>

              <button
                onClick={handleResetAccountSettings}
                disabled={accountSettingsSaving}
                style={resetButtonStyle}
              >
                Reset Account Settings
              </button>
            </div>

            {accountSettingsError && (
              <div
                style={{
                  backgroundColor: "#450a0a",
                  border: "1px solid #991b1b",
                  borderRadius: "14px",
                  padding: "16px",
                  marginBottom: "16px"
                }}
              >
                <p style={{ color: "#fecaca", fontWeight: "bold", marginBottom: "8px" }}>
                  Account Settings Error:
                </p>

                <p style={{ color: "#fecaca" }}>
                  {accountSettingsError}
                </p>
              </div>
            )}

            {accountSettingsSuccess && (
              <div
                style={{
                  backgroundColor: "#052e16",
                  border: "1px solid #166534",
                  borderRadius: "14px",
                  padding: "16px",
                  marginBottom: "16px"
                }}
              >
                <p style={{ color: "#bbf7d0", fontWeight: "bold" }}>
                  {accountSettingsSuccess}
                </p>
              </div>
            )}

            <div
              style={{
                backgroundColor: "#0b1220",
                border: "1px solid #1f2937",
                borderRadius: "14px",
                padding: "16px"
              }}
            >
              <p style={{ color: "#9ca3af", marginBottom: "10px" }}>Current Account Summary</p>

              <p style={{ color: "#d1d5db", marginBottom: "8px" }}>
                Balance: {balance}
              </p>

              <p style={{ color: "#d1d5db", marginBottom: "8px" }}>
                Daily P&L: {dailyPnl}
              </p>

              <p style={{ color: "#d1d5db" }}>
                Current Daily Loss: {riskData.currentDailyLoss}
              </p>
            </div>
          </div>

          <div style={{ backgroundColor: "#111827", padding: "24px", borderRadius: "16px" }}>
            <h3 style={{ marginBottom: "20px" }}>Risk Controls Settings</h3>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Risk Preset</label>

              <select
                value={selectedRiskPreset}
                onChange={(event) => handleRiskPresetChange(event.target.value)}
                style={cardInputStyle}
              >
                <option value="Custom">Custom</option>

                {riskPresetOptions.map((preset) => (
                  <option key={preset.name} value={preset.name}>
                    {preset.name}
                  </option>
                ))}
              </select>
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
              <p style={{ color: "#9ca3af", marginBottom: "12px" }}>
                Risk Preset Guide
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "14px"
                }}
              >
                {riskPresetOptions.map((preset) => (
                  <div
                    key={preset.name}
                    style={{
                      backgroundColor:
                        selectedRiskPreset === preset.name ? "#1a2e05" : "#111827",
                      border:
                        selectedRiskPreset === preset.name
                          ? "1px solid #84cc16"
                          : "1px solid #1f2937",
                      borderRadius: "14px",
                      padding: "14px"
                    }}
                  >
                    <p style={{ color: "#d1d5db", fontWeight: "bold", marginBottom: "8px" }}>
                      {preset.name}
                    </p>

                    <p style={{ color: "#9ca3af", marginBottom: "6px", fontSize: "14px" }}>
                      Max Loss: {preset.maxDailyLoss}
                    </p>

                    <p style={{ color: "#9ca3af", marginBottom: "6px", fontSize: "14px" }}>
                      Risk/Trade: {preset.riskPerTrade}
                    </p>

                    <p style={{ color: "#9ca3af", marginBottom: "8px", fontSize: "14px" }}>
                      Max Positions: {preset.maxOpenPositions}
                    </p>

                    <p style={{ color: "#d1d5db", fontSize: "13px" }}>
                      {preset.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

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

              <button
                onClick={handleResetRiskSettings}
                disabled={riskSettingsSaving}
                style={resetButtonStyle}
              >
                Reset Risk Controls
              </button>
            </div>

            {riskSettingsError && (
              <div
                style={{
                  backgroundColor: "#450a0a",
                  border: "1px solid #991b1b",
                  borderRadius: "14px",
                  padding: "16px",
                  marginBottom: "16px"
                }}
              >
                <p style={{ color: "#fecaca", fontWeight: "bold", marginBottom: "8px" }}>
                  Risk Settings Error:
                </p>

                <p style={{ color: "#fecaca" }}>
                  {riskSettingsError}
                </p>
              </div>
            )}

            {riskSettingsSuccess && (
              <div
                style={{
                  backgroundColor: "#052e16",
                  border: "1px solid #166534",
                  borderRadius: "14px",
                  padding: "16px",
                  marginBottom: "16px"
                }}
              >
                <p style={{ color: "#bbf7d0", fontWeight: "bold" }}>
                  {riskSettingsSuccess}
                </p>
              </div>
            )}

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