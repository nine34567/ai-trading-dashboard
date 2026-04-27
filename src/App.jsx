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
  const [historyAreaFilter, setHistoryAreaFilter] = useState("ALL")
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

    const combinedText = [
      item.date,
      item.area,
      item.symbol,
      item.type,
      item.pnl,
      item.detail
    ]
      .join(" ")
      .toLowerCase()

    return combinedText.includes(keyword)
  })

  const typeFilteredHistoryItems =
    historyFilter === "ALL"
      ? searchedHistoryItems
      : searchedHistoryItems.filter((item) => item.type === historyFilter)

  const filteredHistoryItems =
    historyAreaFilter === "ALL"
      ? typeFilteredHistoryItems
      : typeFilteredHistoryItems.filter((item) => {
        const itemArea = item.area || item.symbol || "-"
        return itemArea === historyAreaFilter
      })

  const totalHistoryRecords = historyItems.length
  const startActionsCount = historyItems.filter((item) => item.type === "START").length
  const stopActionsCount = historyItems.filter((item) => item.type === "STOP").length

  const areaSummary = {
    BOT: historyItems.filter((item) => (item.area || item.symbol) === "BOT").length,
    ACCOUNT: historyItems.filter((item) => (item.area || item.symbol) === "ACCOUNT").length,
    RISK: historyItems.filter((item) => (item.area || item.symbol) === "RISK").length,
    SYSTEM: historyItems.filter((item) => (item.area || item.symbol) === "SYSTEM").length
  }

  const isBusy =
    loading ||
    actionLoading ||
    settingsSaving ||
    accountSettingsSaving ||
    riskSettingsSaving

  const dashboardHealth =
    backendStatus === "Connected" && !loadError && botStatus === "RUNNING"
      ? "OPTIMAL"
      : backendStatus !== "Connected" || loadError
        ? "DISCONNECTED"
        : "PAUSED"

  const dashboardHealthColor =
    dashboardHealth === "OPTIMAL"
      ? "#86efac"
      : dashboardHealth === "PAUSED"
        ? "#facc15"
        : "#f87171"

  const dashboardHealthBackground =
    dashboardHealth === "OPTIMAL"
      ? "rgba(20, 83, 45, 0.42)"
      : dashboardHealth === "PAUSED"
        ? "rgba(113, 63, 18, 0.42)"
        : "rgba(127, 29, 29, 0.42)"

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

  const historyAreaFilterButtonStyle = (area) => ({
    backgroundColor: historyAreaFilter === area ? "#38bdf8" : "#1f2937",
    color: historyAreaFilter === area ? "black" : "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: "pointer"
  })

  const actionButtonStyle = (backgroundColor, color = "white", disabled = false) => ({
    backgroundColor,
    color,
    border: "none",
    padding: "12px 24px",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.7 : 1
  })

  const premiumButtonStyle = (background, color = "white", disabled = false) => ({
    background,
    color,
    border: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "13px 18px",
    borderRadius: "14px",
    fontWeight: "bold",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.7 : 1,
    boxShadow: "0 16px 34px rgba(0, 0, 0, 0.24)"
  })

  const statusPillStyle = (color, backgroundColor) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    borderRadius: "999px",
    backgroundColor,
    border: `1px solid ${color}`,
    color,
    fontWeight: "bold",
    fontSize: "12px",
    letterSpacing: "0.06em",
    whiteSpace: "nowrap"
  })

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

    const selectedPreset = riskPresetOptions.find(
      (preset) => preset.name === presetName
    )

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
    const confirmed = window.confirm("Are you sure you want to reset Bot Settings?")

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
    const confirmed = window.confirm("Are you sure you want to reset Risk Controls?")

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
          background:
            "linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(17, 24, 39, 0.96))",
          border: "1px solid rgba(55, 65, 81, 0.75)",
          borderRadius: "24px",
          padding: "24px",
          marginBottom: "28px",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.28)",
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
            top: "-60px",
            right: "-60px",
            width: "180px",
            height: "180px",
            borderRadius: "999px",
            background: "rgba(132, 204, 22, 0.07)",
            filter: "blur(4px)"
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "18px",
            flexWrap: "wrap",
            marginBottom: "20px",
            position: "relative",
            zIndex: 1
          }}
        >
          <div>
            <p
              style={{
                color: "#84cc16",
                fontSize: "12px",
                fontWeight: "bold",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: "10px"
              }}
            >
              Trading Command Center
            </p>

            <h2
              style={{
                fontSize: "26px",
                marginBottom: "8px",
                color: "#f9fafb",
                letterSpacing: "-0.02em"
              }}
            >
              {title}
            </h2>

            <p
              style={{
                color: "#9ca3af",
                fontSize: "14px",
                lineHeight: "1.7",
                maxWidth: "760px"
              }}
            >
              {subtitle}
            </p>
          </div>

          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.92)",
              border: "1px solid rgba(132, 204, 22, 0.35)",
              color: "#bbf7d0",
              padding: "9px 14px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: "bold",
              boxShadow: "0 10px 24px rgba(0, 0, 0, 0.2)"
            }}
          >
            LIVE SYSTEM PANEL
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      </section>
    )
  }

  const renderDashboardHeader = () => {
    return (
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(2, 6, 23, 0.98), rgba(15, 23, 42, 0.96))",
          border: "1px solid rgba(55, 65, 81, 0.78)",
          borderRadius: "30px",
          padding: "30px",
          marginBottom: "28px",
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.34)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-120px",
            width: "300px",
            height: "300px",
            borderRadius: "999px",
            backgroundColor: "rgba(132, 204, 22, 0.12)",
            filter: "blur(24px)"
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: "-140px",
            left: "-120px",
            width: "320px",
            height: "320px",
            borderRadius: "999px",
            backgroundColor: "rgba(56, 189, 248, 0.1)",
            filter: "blur(28px)"
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(420px, 1.35fr) minmax(320px, 0.75fr)",
              gap: "24px",
              alignItems: "stretch"
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginBottom: "16px"
                }}
              >
                <span style={statusPillStyle("#84cc16", "rgba(20, 83, 45, 0.42)")}>
                  INSTITUTIONAL DASHBOARD
                </span>

                <span style={statusPillStyle(dashboardHealthColor, dashboardHealthBackground)}>
                  SYSTEM {dashboardHealth}
                </span>

                <span
                  style={statusPillStyle(
                    backendStatus === "Connected" ? "#38bdf8" : "#f87171",
                    backendStatus === "Connected"
                      ? "rgba(7, 89, 133, 0.42)"
                      : "rgba(127, 29, 29, 0.42)"
                  )}
                >
                  BACKEND {backendStatus.toUpperCase()}
                </span>
              </div>

              <h1
                style={{
                  fontSize: "50px",
                  marginBottom: "14px",
                  color: "#f9fafb",
                  letterSpacing: "-0.055em",
                  lineHeight: "1.02"
                }}
              >
                AI Trading Command Center
              </h1>

              <p
                style={{
                  color: "#9ca3af",
                  lineHeight: "1.8",
                  fontSize: "15px",
                  maxWidth: "860px",
                  marginBottom: "22px"
                }}
              >
                Real-time workspace for bot execution, risk permission, account state,
                AI decision, quant metrics, market chart, activity log and open positions.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(150px, 1fr))",
                  gap: "14px",
                  marginBottom: "22px"
                }}
              >
                <InfoBox label="Current Menu" value={selectedMenu} color="#84cc16" />
                <InfoBox label="Last Updated" value={lastUpdated} color="#38bdf8" />
                <InfoBox label="Active Symbol" value={settingsData.symbol} color="#f9fafb" />
                <InfoBox label="Timeframe" value={settingsData.timeframe} color="#d1d5db" />
              </div>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  onClick={handleStart}
                  disabled={botStatus === "RUNNING" || actionLoading}
                  style={premiumButtonStyle(
                    botStatus === "RUNNING"
                      ? "linear-gradient(135deg, #84cc16, #22c55e)"
                      : "linear-gradient(135deg, #1f2937, #111827)",
                    botStatus === "RUNNING" ? "black" : "white",
                    botStatus === "RUNNING" || actionLoading
                  )}
                >
                  Start Bot
                </button>

                <button
                  onClick={handleStop}
                  disabled={botStatus === "STOPPED" || actionLoading}
                  style={premiumButtonStyle(
                    botStatus === "STOPPED"
                      ? "linear-gradient(135deg, #f87171, #dc2626)"
                      : "linear-gradient(135deg, #1f2937, #111827)",
                    "white",
                    botStatus === "STOPPED" || actionLoading
                  )}
                >
                  Stop Bot
                </button>

                <button
                  onClick={handleEmergencyStop}
                  disabled={actionLoading}
                  style={premiumButtonStyle(
                    "linear-gradient(135deg, #991b1b, #dc2626)",
                    "white",
                    actionLoading
                  )}
                >
                  Emergency Stop
                </button>

                <button
                  onClick={loadDashboardData}
                  disabled={isBusy}
                  style={premiumButtonStyle(
                    "linear-gradient(135deg, #2563eb, #38bdf8)",
                    "white",
                    isBusy
                  )}
                >
                  {isBusy ? "Refreshing..." : "Refresh Data"}
                </button>
              </div>
            </div>

            <div
              style={{
                background:
                  "linear-gradient(135deg, rgba(11, 18, 32, 0.96), rgba(17, 24, 39, 0.96))",
                border: "1px solid rgba(55, 65, 81, 0.82)",
                borderRadius: "24px",
                padding: "20px",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)"
              }}
            >
              <p
                style={{
                  color: "#9ca3af",
                  fontSize: "12px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: "14px"
                }}
              >
                Live System Snapshot
              </p>

              <div style={{ display: "grid", gap: "12px" }}>
                <InfoBox
                  label="Bot Status"
                  value={botStatus}
                  color={botStatus === "RUNNING" ? "#86efac" : "#f87171"}
                />

                <InfoBox
                  label="System Mode"
                  value={systemMode}
                  color={systemModeColor}
                />

                <InfoBox
                  label="Execution Mode"
                  value={settingsData.mode}
                  color="#facc15"
                />

                <InfoBox
                  label="Balance"
                  value={balance}
                  color="#f9fafb"
                />

                <InfoBox
                  label="Daily P&L"
                  value={dailyPnl}
                  color={dailyPnl.includes("-") ? "#f87171" : "#86efac"}
                />

                <InfoBox
                  label="Open Positions"
                  value={openPositionsCount}
                  color={visiblePositions.length > 0 ? "#86efac" : "#facc15"}
                />

                <InfoBox
                  label="Last Action"
                  value={lastAction}
                  color="#d1d5db"
                />

                <InfoBox
                  label="Data Status"
                  value={loadError ? "Error" : isBusy ? "Loading..." : "Ready"}
                  color={loadError ? "#f87171" : isBusy ? "#facc15" : "#86efac"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderRecentActivity = () => {
    return (
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(11, 18, 32, 0.98))",
          border: "1px solid rgba(55, 65, 81, 0.78)",
          padding: "24px",
          borderRadius: "22px",
          marginBottom: "24px",
          boxShadow: "0 18px 44px rgba(0, 0, 0, 0.22)"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "20px"
          }}
        >
          <div>
            <p
              style={{
                color: "#facc15",
                fontSize: "12px",
                fontWeight: "bold",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: "8px"
              }}
            >
              Activity Feed
            </p>

            <h3 style={{ color: "#f9fafb" }}>Recent Activity</h3>
          </div>

          <span style={statusPillStyle("#facc15", "rgba(113, 63, 18, 0.38)")}>
            LATEST {recentActivities.length}
          </span>
        </div>

        {recentActivities.length === 0 ? (
          <p style={{ color: "#9ca3af" }}>No recent activity.</p>
        ) : (
          recentActivities.map((item, index) => (
            <div
              key={`${item.date}-${item.type}-${index}`}
              style={{
                borderTop: "1px solid #1f2937",
                padding: "15px 0"
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
                  <p
                    style={{
                      color: "#d1d5db",
                      fontWeight: "bold",
                      marginBottom: "4px"
                    }}
                  >
                    {item.type || "-"}
                  </p>

                  <p style={{ color: "#9ca3af", fontSize: "14px" }}>
                    {item.area || item.symbol || "-"} • {item.date || "-"}
                  </p>

                  <p style={{ color: "#9ca3af", fontSize: "13px", marginTop: "4px" }}>
                    {item.detail || "-"}
                  </p>
                </div>

                <div
                  style={{
                    color:
                      item.type === "SELL" ||
                        item.type === "STOP" ||
                        item.type === "EMERGENCY"
                        ? "#f87171"
                        : "#86efac",
                    fontWeight: "bold"
                  }}
                >
                  {item.pnl || "-"}
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
      <div style={panelStyle}>
        <h3 style={{ marginBottom: "20px" }}>Current Trading Configuration</h3>

        <div style={grid4Style}>
          <InfoBox label="Symbol" value={settingsData.symbol} />
          <InfoBox label="Timeframe" value={settingsData.timeframe} />
          <InfoBox label="Mode" value={settingsData.mode} />
          <InfoBox
            label="Bot Status"
            value={botStatus}
            color={botStatus === "RUNNING" ? "#86efac" : "#f87171"}
          />
        </div>
      </div>
    )
  }

  const renderAiDecisionSnapshot = () => {
    return (
      <div style={panelStyle}>
        <h3 style={{ marginBottom: "20px" }}>AI Decision Snapshot</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 2fr",
            gap: "16px"
          }}
        >
          <InfoBox label="Signal" value={aiInsights.signal} />
          <InfoBox label="Confidence" value={aiInsights.confidence} />
          <InfoBox label="Reason" value={aiInsights.reason} />
        </div>
      </div>
    )
  }

  const renderAccountScenarioBadge = () => {
    return (
      <div style={panelStyle}>
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

        <div style={grid3Style}>
          <InfoBox label="Balance" value={balance} />
          <InfoBox
            label="Daily P&L"
            value={dailyPnl}
            color={dailyPnl.includes("-") ? "#f87171" : "#86efac"}
          />
          <InfoBox
            label="Current Daily Loss"
            value={riskData.currentDailyLoss}
            color="#f87171"
          />
        </div>
      </div>
    )
  }

  const renderSystemPerformanceSnapshot = () => {
    return (
      <div style={panelStyle}>
        <h3 style={{ marginBottom: "20px" }}>System Performance Snapshot</h3>

        <div style={grid4Style}>
          <InfoBox label="VaR" value={quantStats.var} color="#f87171" />
          <InfoBox label="Volatility" value={quantStats.volatility} />
          <InfoBox label="Sharpe Ratio" value={quantStats.sharpeRatio} color="#86efac" />
          <InfoBox label="API Calls" value={aiUsage.apiCalls} />
        </div>
      </div>
    )
  }

  const renderDashboard = () => {
    return (
      <>
        {renderDashboardHeader()}

        {renderDashboardSectionCard(
          "1. Account & Bot Overview",
          "ภาพรวมบัญชี สถานะบอท จำนวนออเดอร์ และสถานะระบบหลัก",
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(180px, 1fr))",
              gap: "20px"
            }}
          >
            <StatCard title="Balance" value={balance} color="white" />
            <StatCard
              title="Daily P&L"
              value={dailyPnl}
              color={dailyPnl.includes("-") ? "#f87171" : "#86efac"}
            />
            <StatCard
              title="Bot Status"
              value={botStatus}
              color={botStatus === "RUNNING" ? "#86efac" : "#f87171"}
            />
            <StatCard title="System Mode" value={systemMode} color={systemModeColor} />
            <StatCard
              title="Open Positions"
              value={openPositionsCount}
              color={visiblePositions.length > 0 ? "#86efac" : "#f87171"}
            />
          </div>
        )}

        {renderDashboardSectionCard(
          "2. Executive Overview",
          "รวม configuration, account scenario, AI decision และ system performance ไว้ใน grid เดียวแบบ command desk",
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(340px, 1fr) minmax(340px, 1fr)",
              gap: "20px",
              alignItems: "start"
            }}
          >
            <div>
              {renderCurrentTradingConfiguration()}
              {renderAccountScenarioBadge()}
            </div>

            <div>
              {renderAiDecisionSnapshot()}
              {renderSystemPerformanceSnapshot()}
            </div>
          </div>
        )}

        {renderDashboardSectionCard(
          "3. Risk Engine",
          "ระบบประเมินความเสี่ยงก่อนอนุญาตให้เปิดออเดอร์ใหม่",
          <RiskPanel riskData={riskData} />
        )}

        {renderDashboardSectionCard(
          "4. Chart & Market Data",
          "กราฟราคาและข้อมูลราคาจำลองจาก backend",
          <PriceChart
            data={chartData}
            symbol={settingsData.symbol}
            timeframe={settingsData.timeframe}
          />
        )}

        {renderDashboardSectionCard(
          "5. Activity & Positions",
          "ประวัติล่าสุดและรายการออเดอร์ที่เปิดอยู่",
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(340px, 0.8fr) minmax(520px, 1.35fr)",
              gap: "20px",
              alignItems: "start"
            }}
          >
            <div>{renderRecentActivity()}</div>

            <div>
              <OpenPositionsTable positions={visiblePositions} />
            </div>
          </div>
        )}

        {renderDashboardSectionCard(
          "6. Trade Control",
          "ปุ่มควบคุมบอท เริ่ม หยุด ฉุกเฉิน และรีเฟรชข้อมูล",
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(11, 18, 32, 0.96), rgba(17, 24, 39, 0.96))",
              border: "1px solid rgba(55, 65, 81, 0.78)",
              borderRadius: "22px",
              padding: "22px"
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(160px, 1fr))",
                gap: "14px",
                marginBottom: "18px"
              }}
            >
              <button
                onClick={handleStart}
                disabled={botStatus === "RUNNING" || actionLoading}
                style={premiumButtonStyle(
                  botStatus === "RUNNING"
                    ? "linear-gradient(135deg, #84cc16, #22c55e)"
                    : "linear-gradient(135deg, #1f2937, #111827)",
                  botStatus === "RUNNING" ? "black" : "white",
                  botStatus === "RUNNING" || actionLoading
                )}
              >
                Start
              </button>

              <button
                onClick={handleStop}
                disabled={botStatus === "STOPPED" || actionLoading}
                style={premiumButtonStyle(
                  botStatus === "STOPPED"
                    ? "linear-gradient(135deg, #f87171, #dc2626)"
                    : "linear-gradient(135deg, #1f2937, #111827)",
                  "white",
                  botStatus === "STOPPED" || actionLoading
                )}
              >
                Stop
              </button>

              <button
                onClick={handleEmergencyStop}
                disabled={actionLoading}
                style={premiumButtonStyle(
                  "linear-gradient(135deg, #991b1b, #dc2626)",
                  "white",
                  actionLoading
                )}
              >
                Emergency Stop
              </button>

              <button
                onClick={loadDashboardData}
                disabled={isBusy}
                style={premiumButtonStyle(
                  "linear-gradient(135deg, #2563eb, #38bdf8)",
                  "white",
                  isBusy
                )}
              >
                {isBusy ? "Refreshing..." : "Refresh Data"}
              </button>
            </div>

            <div style={grid4Style}>
              <InfoBox label="Bot" value={botStatus} color={botStatus === "RUNNING" ? "#86efac" : "#f87171"} />
              <InfoBox label="System" value={systemMode} color={systemModeColor} />
              <InfoBox label="Backend" value={backendStatus} color={backendStatus === "Connected" ? "#38bdf8" : "#f87171"} />
              <InfoBox label="Last Action" value={lastAction} color="#d1d5db" />
            </div>
          </div>
        )}
      </>
    )
  }

  const renderHistory = () => {
    return (
      <>
        <h1 style={{ fontSize: "42px", marginBottom: "10px" }}>History</h1>

        <p style={{ color: "#84cc16", marginBottom: "30px", fontWeight: "bold" }}>
          Current Menu: {selectedMenu}
        </p>

        <div style={grid4Style}>
          <StatCard title="Total Records" value={String(totalHistoryRecords)} color="white" />
          <StatCard title="BOT Area" value={String(areaSummary.BOT)} color="#38bdf8" />
          <StatCard title="ACCOUNT Area" value={String(areaSummary.ACCOUNT)} color="#86efac" />
          <StatCard title="RISK Area" value={String(areaSummary.RISK)} color="#facc15" />
        </div>

        <div style={{ height: "20px" }} />

        <div style={grid3Style}>
          <StatCard title="Start Actions" value={String(startActionsCount)} color="#86efac" />
          <StatCard title="Stop Actions" value={String(stopActionsCount)} color="#f87171" />
          <StatCard title="SYSTEM Area" value={String(areaSummary.SYSTEM)} color="#d1d5db" />
        </div>

        <div
          style={{
            backgroundColor: "#111827",
            padding: "20px",
            borderRadius: "16px",
            marginTop: "24px",
            marginBottom: "24px"
          }}
        >
          <h3 style={{ marginBottom: "16px" }}>History Filter</h3>

          <div style={{ marginBottom: "16px" }}>
            <input
              type="text"
              value={historySearch}
              onChange={(event) => setHistorySearch(event.target.value)}
              placeholder="ค้นหาจาก area, type, symbol, detail, date, pnl..."
              style={cardInputStyle}
            />
          </div>

          <div style={{ marginBottom: "18px" }}>
            <p style={{ color: "#9ca3af", marginBottom: "10px", fontWeight: "bold" }}>
              Filter by Type
            </p>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button onClick={() => setHistoryFilter("ALL")} style={historyFilterButtonStyle("ALL")}>
                ALL
              </button>
              <button onClick={() => setHistoryFilter("START")} style={historyFilterButtonStyle("START")}>
                START
              </button>
              <button onClick={() => setHistoryFilter("STOP")} style={historyFilterButtonStyle("STOP")}>
                STOP
              </button>
              <button
                onClick={() => setHistoryFilter("EMERGENCY")}
                style={historyFilterButtonStyle("EMERGENCY")}
              >
                EMERGENCY
              </button>
              <button
                onClick={() => setHistoryFilter("SETTINGS")}
                style={historyFilterButtonStyle("SETTINGS")}
              >
                SETTINGS
              </button>
              <button onClick={() => setHistoryFilter("SELL")} style={historyFilterButtonStyle("SELL")}>
                SELL
              </button>
            </div>
          </div>

          <div>
            <p style={{ color: "#9ca3af", marginBottom: "10px", fontWeight: "bold" }}>
              Filter by Area
            </p>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button onClick={() => setHistoryAreaFilter("ALL")} style={historyAreaFilterButtonStyle("ALL")}>
                ALL AREAS
              </button>
              <button onClick={() => setHistoryAreaFilter("BOT")} style={historyAreaFilterButtonStyle("BOT")}>
                BOT
              </button>
              <button
                onClick={() => setHistoryAreaFilter("ACCOUNT")}
                style={historyAreaFilterButtonStyle("ACCOUNT")}
              >
                ACCOUNT
              </button>
              <button onClick={() => setHistoryAreaFilter("RISK")} style={historyAreaFilterButtonStyle("RISK")}>
                RISK
              </button>
              <button
                onClick={() => setHistoryAreaFilter("SYSTEM")}
                style={historyAreaFilterButtonStyle("SYSTEM")}
              >
                SYSTEM
              </button>
            </div>
          </div>
        </div>

        <HistoryTable historyItems={filteredHistoryItems} />
      </>
    )
  }

  const renderBacktest = () => {
    return (
      <>
        <h1 style={{ fontSize: "42px", marginBottom: "10px" }}>Backtest</h1>

        <p style={{ color: "#84cc16", marginBottom: "30px", fontWeight: "bold" }}>
          Current Menu: {selectedMenu}
        </p>

        <div style={panelStyle}>
          <h3 style={{ marginBottom: "12px" }}>Backtest Summary</h3>
          <p style={{ color: "#9ca3af", marginBottom: "10px" }}>
            Total Trades: {backtestData.totalTrades}
          </p>
          <p style={{ color: "#9ca3af", marginBottom: "10px" }}>
            Win Rate: {backtestData.winRate}
          </p>
          <p style={{ color: "#9ca3af" }}>Net Profit: {backtestData.netProfit}</p>
        </div>
      </>
    )
  }

  const renderAiInsights = () => {
    return (
      <>
        <h1 style={{ fontSize: "42px", marginBottom: "10px" }}>AI Insights</h1>

        <p style={{ color: "#84cc16", marginBottom: "30px", fontWeight: "bold" }}>
          Current Menu: {selectedMenu}
        </p>

        <div style={panelStyle}>
          <h3 style={{ marginBottom: "12px" }}>Latest AI Decision</h3>
          <p style={{ color: "#9ca3af", marginBottom: "10px" }}>
            Signal: {aiInsights.signal}
          </p>
          <p style={{ color: "#9ca3af", marginBottom: "10px" }}>
            Reason: {aiInsights.reason}
          </p>
          <p style={{ color: "#9ca3af" }}>Confidence: {aiInsights.confidence}</p>
        </div>
      </>
    )
  }

  const renderAiUsage = () => {
    return (
      <>
        <h1 style={{ fontSize: "42px", marginBottom: "10px" }}>AI Usage</h1>

        <p style={{ color: "#84cc16", marginBottom: "30px", fontWeight: "bold" }}>
          Current Menu: {selectedMenu}
        </p>

        <div style={grid3Style}>
          <StatCard title="API Calls" value={aiUsage.apiCalls} color="white" />
          <StatCard title="Tokens Used" value={aiUsage.tokensUsed} color="#86efac" />
          <StatCard title="Estimated Cost" value={aiUsage.estimatedCost} color="#facc15" />
        </div>
      </>
    )
  }

  const renderQuant = () => {
    return (
      <>
        <h1 style={{ fontSize: "42px", marginBottom: "10px" }}>Quant</h1>

        <p style={{ color: "#84cc16", marginBottom: "30px", fontWeight: "bold" }}>
          Current Menu: {selectedMenu}
        </p>

        <div style={grid3Style}>
          <StatCard title="VaR" value={quantStats.var} color="#f87171" />
          <StatCard title="Volatility" value={quantStats.volatility} color="white" />
          <StatCard title="Sharpe Ratio" value={quantStats.sharpeRatio} color="#86efac" />
        </div>
      </>
    )
  }

  const renderSettings = () => {
    return (
      <>
        <h1 style={{ fontSize: "42px", marginBottom: "10px" }}>Settings</h1>

        <p style={{ color: "#84cc16", marginBottom: "30px", fontWeight: "bold" }}>
          Current Menu: {selectedMenu}
        </p>

        <div style={panelStyle}>
          <h3 style={{ marginBottom: "20px" }}>Bot Settings</h3>

          <FormSelect
            label="Symbol"
            value={settingsForm.symbol}
            onChange={(value) => handleSettingsInputChange("symbol", value)}
            options={symbolOptions}
            placeholder="Select Symbol"
            inputStyle={cardInputStyle}
            labelStyle={labelStyle}
          />

          <FormSelect
            label="Timeframe"
            value={settingsForm.timeframe}
            onChange={(value) => handleSettingsInputChange("timeframe", value)}
            options={timeframeOptions}
            placeholder="Select Timeframe"
            inputStyle={cardInputStyle}
            labelStyle={labelStyle}
          />

          <FormSelect
            label="Mode"
            value={settingsForm.mode}
            onChange={(value) => handleSettingsInputChange("mode", value)}
            options={modeOptions}
            placeholder="Select Mode"
            inputStyle={cardInputStyle}
            labelStyle={labelStyle}
          />

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
            <button
              onClick={handleSaveSettings}
              disabled={settingsSaving}
              style={actionButtonStyle("#84cc16", "black", settingsSaving)}
            >
              {settingsSaving ? "Saving..." : "Save Settings"}
            </button>

            <button
              onClick={handleResetBotSettings}
              disabled={settingsSaving}
              style={actionButtonStyle("#374151", "white", settingsSaving)}
            >
              Reset Bot Settings
            </button>
          </div>

          <StatusMessage error={settingsError} success={settingsSuccess} />

          <div style={smallBoxStyle}>
            <p style={{ color: "#9ca3af", marginBottom: "10px" }}>Saved Values</p>
            <p style={{ color: "#d1d5db", marginBottom: "8px" }}>
              Symbol: {settingsData.symbol}
            </p>
            <p style={{ color: "#d1d5db", marginBottom: "8px" }}>
              Timeframe: {settingsData.timeframe}
            </p>
            <p style={{ color: "#d1d5db" }}>Mode: {settingsData.mode}</p>
          </div>
        </div>

        <div style={panelStyle}>
          <h3 style={{ marginBottom: "20px" }}>Account Summary Settings</h3>

          <FormSelect
            label="Account Scenario"
            value={selectedAccountScenario}
            onChange={handleAccountScenarioChange}
            options={accountScenarioOptions.map((scenario) => scenario.name)}
            placeholder="Custom"
            inputStyle={cardInputStyle}
            labelStyle={labelStyle}
            includeCustom
          />

          <div style={guideGrid4Style}>
            {accountScenarioOptions.map((scenario) => (
              <GuideBox
                key={scenario.name}
                active={selectedAccountScenario === scenario.name}
                title={scenario.name}
                lines={[
                  `Balance: ${scenario.balance}`,
                  `Daily P&L: ${scenario.dailyPnl}`,
                  `Daily Loss: ${scenario.currentDailyLoss}`
                ]}
                description={scenario.description}
              />
            ))}
          </div>

          <FormInput
            label="Balance"
            value={accountSettingsForm.balance}
            onChange={(value) => handleAccountSettingsInputChange("balance", value)}
            placeholder="$33.85"
            inputStyle={cardInputStyle}
            labelStyle={labelStyle}
          />

          <FormInput
            label="Daily P&L"
            value={accountSettingsForm.dailyPnl}
            onChange={(value) => handleAccountSettingsInputChange("dailyPnl", value)}
            placeholder="+2.95 or -5.00"
            inputStyle={cardInputStyle}
            labelStyle={labelStyle}
          />

          <FormInput
            label="Current Daily Loss"
            value={accountSettingsForm.currentDailyLoss}
            onChange={(value) =>
              handleAccountSettingsInputChange("currentDailyLoss", value)
            }
            placeholder="0 or 2.50"
            inputStyle={cardInputStyle}
            labelStyle={labelStyle}
          />

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
            <button
              onClick={handleSaveAccountSettings}
              disabled={accountSettingsSaving}
              style={actionButtonStyle("#84cc16", "black", accountSettingsSaving)}
            >
              {accountSettingsSaving ? "Saving..." : "Save Account Settings"}
            </button>

            <button
              onClick={handleResetAccountSettings}
              disabled={accountSettingsSaving}
              style={actionButtonStyle("#374151", "white", accountSettingsSaving)}
            >
              Reset Account Settings
            </button>
          </div>

          <StatusMessage error={accountSettingsError} success={accountSettingsSuccess} />

          <div style={smallBoxStyle}>
            <p style={{ color: "#9ca3af", marginBottom: "10px" }}>
              Current Account Summary
            </p>
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

        <div style={panelStyle}>
          <h3 style={{ marginBottom: "20px" }}>Risk Controls Settings</h3>

          <FormSelect
            label="Risk Preset"
            value={selectedRiskPreset}
            onChange={handleRiskPresetChange}
            options={riskPresetOptions.map((preset) => preset.name)}
            placeholder="Custom"
            inputStyle={cardInputStyle}
            labelStyle={labelStyle}
            includeCustom
          />

          <div style={guideGrid3Style}>
            {riskPresetOptions.map((preset) => (
              <GuideBox
                key={preset.name}
                active={selectedRiskPreset === preset.name}
                title={preset.name}
                lines={[
                  `Max Loss: ${preset.maxDailyLoss}`,
                  `Risk/Trade: ${preset.riskPerTrade}`,
                  `Max Positions: ${preset.maxOpenPositions}`
                ]}
                description={preset.description}
              />
            ))}
          </div>

          <FormInput
            label="Max Daily Loss"
            value={riskSettingsForm.maxDailyLoss}
            onChange={(value) => handleRiskSettingsInputChange("maxDailyLoss", value)}
            placeholder="$10.00"
            inputStyle={cardInputStyle}
            labelStyle={labelStyle}
          />

          <FormInput
            label="Risk Per Trade"
            value={riskSettingsForm.riskPerTrade}
            onChange={(value) => handleRiskSettingsInputChange("riskPerTrade", value)}
            placeholder="1%"
            inputStyle={cardInputStyle}
            labelStyle={labelStyle}
          />

          <FormInput
            label="Max Open Positions"
            value={riskSettingsForm.maxOpenPositions}
            onChange={(value) =>
              handleRiskSettingsInputChange("maxOpenPositions", value)
            }
            placeholder="3"
            inputStyle={cardInputStyle}
            labelStyle={labelStyle}
          />

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
            <button
              onClick={handleSaveRiskSettings}
              disabled={riskSettingsSaving}
              style={actionButtonStyle("#84cc16", "black", riskSettingsSaving)}
            >
              {riskSettingsSaving ? "Saving..." : "Save Risk Controls"}
            </button>

            <button
              onClick={handleResetRiskSettings}
              disabled={riskSettingsSaving}
              style={actionButtonStyle("#374151", "white", riskSettingsSaving)}
            >
              Reset Risk Controls
            </button>
          </div>

          <StatusMessage error={riskSettingsError} success={riskSettingsSuccess} />

          <div style={smallBoxStyle}>
            <p style={{ color: "#9ca3af", marginBottom: "10px" }}>
              Current Risk Controls
            </p>
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

          <button
            onClick={loadDashboardData}
            disabled={loading}
            style={actionButtonStyle("#f59e0b", "black", loading)}
          >
            Retry Load
          </button>
        </div>
      )
    }

    if (selectedMenu === "Dashboard") return renderDashboard()
    if (selectedMenu === "Backtest") return renderBacktest()
    if (selectedMenu === "History") return renderHistory()
    if (selectedMenu === "AI Insights") return renderAiInsights()
    if (selectedMenu === "AI Usage") return renderAiUsage()
    if (selectedMenu === "Quant") return renderQuant()
    if (selectedMenu === "Settings") return renderSettings()

    return null
  }

  return (
    <div
      style={{
        background:
          "radial-gradient(circle at top left, rgba(56, 189, 248, 0.08), transparent 24%), radial-gradient(circle at bottom right, rgba(132, 204, 22, 0.08), transparent 24%), #0b0f14",
        color: "white",
        minHeight: "100vh",
        display: "flex",
        fontFamily: "Arial, sans-serif"
      }}
    >
      <Sidebar selectedMenu={selectedMenu} setSelectedMenu={setSelectedMenu} />

      <div style={{ flex: 1, padding: "40px" }}>{renderContent()}</div>
    </div>
  )
}

function InfoBox({ label, value, color = "#d1d5db" }) {
  return (
    <div style={smallBoxStyle}>
      <p style={{ color: "#9ca3af", marginBottom: "8px" }}>{label}</p>
      <p style={{ color, fontWeight: "bold" }}>{value}</p>
    </div>
  )
}

function FormInput({ label, value, onChange, placeholder, inputStyle, labelStyle }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={labelStyle}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  )
}

function FormSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  inputStyle,
  labelStyle,
  includeCustom = false
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={labelStyle}>{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyle}
      >
        {includeCustom ? (
          <option value="Custom">Custom</option>
        ) : (
          <option value="">{placeholder}</option>
        )}

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

function GuideBox({ active, title, lines, description }) {
  return (
    <div
      style={{
        backgroundColor: active ? "#1a2e05" : "#111827",
        border: active ? "1px solid #84cc16" : "1px solid #1f2937",
        borderRadius: "14px",
        padding: "14px"
      }}
    >
      <p style={{ color: "#d1d5db", fontWeight: "bold", marginBottom: "8px" }}>
        {title}
      </p>

      {lines.map((line) => (
        <p
          key={line}
          style={{
            color: "#9ca3af",
            marginBottom: "6px",
            fontSize: "14px"
          }}
        >
          {line}
        </p>
      ))}

      <p style={{ color: "#d1d5db", fontSize: "13px" }}>{description}</p>
    </div>
  )
}

function StatusMessage({ error, success }) {
  return (
    <>
      {error && (
        <div
          style={{
            backgroundColor: "#450a0a",
            border: "1px solid #991b1b",
            borderRadius: "14px",
            padding: "16px",
            marginBottom: "16px"
          }}
        >
          <p style={{ color: "#fecaca", fontWeight: "bold" }}>{error}</p>
        </div>
      )}

      {success && (
        <div
          style={{
            backgroundColor: "#052e16",
            border: "1px solid #166534",
            borderRadius: "14px",
            padding: "16px",
            marginBottom: "16px"
          }}
        >
          <p style={{ color: "#bbf7d0", fontWeight: "bold" }}>{success}</p>
        </div>
      )}
    </>
  )
}

const panelStyle = {
  background:
    "linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(11, 18, 32, 0.98))",
  border: "1px solid rgba(55, 65, 81, 0.78)",
  padding: "24px",
  borderRadius: "20px",
  marginBottom: "24px",
  boxShadow: "0 18px 44px rgba(0, 0, 0, 0.2)"
}

const smallBoxStyle = {
  backgroundColor: "#0b1220",
  border: "1px solid #1f2937",
  borderRadius: "14px",
  padding: "16px"
}

const grid3Style = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "20px"
}

const grid4Style = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "16px"
}

const guideGrid3Style = {
  backgroundColor: "#0b1220",
  border: "1px solid #1f2937",
  borderRadius: "14px",
  padding: "16px",
  marginBottom: "16px",
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "14px"
}

const guideGrid4Style = {
  backgroundColor: "#0b1220",
  border: "1px solid #1f2937",
  borderRadius: "14px",
  padding: "16px",
  marginBottom: "16px",
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "14px"
}

export default App