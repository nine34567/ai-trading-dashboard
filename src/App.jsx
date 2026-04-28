import { Component, useEffect, useState } from "react"
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
import Sidebar from "./components/Sidebar"
import OpenPositionsTable from "./components/OpenPositionsTable"
import HistoryTable from "./components/HistoryTable"
import PriceChart from "./components/PriceChart"
import RiskPanel from "./components/RiskPanel"
import OperationsPanel from "./components/OperationsPanel"
import AiInsightsPanel from "./components/AiInsightsPanel"
import AiUsagePanel from "./components/AiUsagePanel"
import QuantAnalyticsPanel from "./components/QuantAnalyticsPanel"


class OperationsPanelErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, errorMessage: "" }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || "Unknown OperationsPanel error"
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: "" })
    }
  }

  componentDidCatch(error, errorInfo) {
    console.error("OperationsPanel crashed:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            backgroundColor: "#450a0a",
            border: "1px solid #991b1b",
            borderRadius: "20px",
            padding: "22px"
          }}
        >
          <p
            style={{
              color: "#fecaca",
              fontWeight: "bold",
              marginBottom: "10px",
              fontSize: "18px"
            }}
          >
            Full OperationsPanel crashed, but Diagnostics page is protected.
          </p>

          <p style={{ color: "#fecaca", lineHeight: "1.7", marginBottom: "14px" }}>
            Error: {this.state.errorMessage}
          </p>

          <p style={{ color: "#fca5a5", lineHeight: "1.7" }}>
            ตอนนี้แปลว่าปัญหาอยู่ใน OperationsPanel หรือ component ลูกตัวใดตัวหนึ่ง
            ไม่ใช่ Sidebar และไม่ใช่หน้า Diagnostics หลัก ให้เปิด DevTools Console
            เพื่อดู stack trace เพิ่มเติม หรือแยก debug ทีละ component ใน chain.
          </p>
        </div>
      )
    }

    return this.props.children
  }
}

function PageHeader({ title, subtitle, children }) {
  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(15, 23, 42, 0.94))",
        border: "1px solid rgba(55, 65, 81, 0.7)",
        borderRadius: "24px",
        padding: "28px",
        marginBottom: "24px",
        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.28)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at top right, rgba(56, 189, 248, 0.12), transparent 30%), radial-gradient(circle at bottom left, rgba(132, 204, 22, 0.12), transparent 35%)",
          pointerEvents: "none"
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "20px",
          flexWrap: "wrap"
        }}
      >
        <div>
          <p
            style={{
              color: "#84cc16",
              fontSize: "12px",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              marginBottom: "10px"
            }}
          >
            Institutional Trading Workspace
          </p>

          <h1
            style={{
              fontSize: "40px",
              marginBottom: "12px",
              color: "#f9fafb",
              letterSpacing: "-0.03em"
            }}
          >
            {title}
          </h1>

          <p
            style={{
              color: "#9ca3af",
              lineHeight: "1.7",
              maxWidth: "850px",
              fontSize: "15px"
            }}
          >
            {subtitle}
          </p>
        </div>

        {children ? <div>{children}</div> : null}
      </div>
    </div>
  )
}

function SectionCard({ eyebrow, title, subtitle, rightSlot, children }) {
  return (
    <section
      style={{
        background:
          "linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(15, 23, 42, 0.96))",
        border: "1px solid rgba(55, 65, 81, 0.72)",
        borderRadius: "24px",
        padding: "24px",
        marginBottom: "24px",
        boxShadow: "0 20px 45px rgba(0, 0, 0, 0.22)",
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
            "linear-gradient(90deg, rgba(132, 204, 22, 1), rgba(56, 189, 248, 1), rgba(132, 204, 22, 0.2))"
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
          background: "rgba(132, 204, 22, 0.06)",
          filter: "blur(10px)",
          pointerEvents: "none"
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "18px",
          flexWrap: "wrap",
          marginBottom: "20px"
        }}
      >
        <div>
          {eyebrow ? (
            <p
              style={{
                color: "#84cc16",
                fontSize: "11px",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                marginBottom: "10px"
              }}
            >
              {eyebrow}
            </p>
          ) : null}

          <h2
            style={{
              fontSize: "24px",
              color: "#f9fafb",
              marginBottom: "8px",
              letterSpacing: "-0.02em"
            }}
          >
            {title}
          </h2>

          {subtitle ? (
            <p
              style={{
                color: "#9ca3af",
                lineHeight: "1.7",
                maxWidth: "820px",
                fontSize: "14px"
              }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>

        {rightSlot ? <div>{rightSlot}</div> : null}
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </section>
  )
}

function MetricCard({ label, value, helper, accent = "#d1d5db", tone = "neutral" }) {
  const toneBackground =
    tone === "success"
      ? "linear-gradient(135deg, rgba(6, 78, 59, 0.45), rgba(17, 24, 39, 0.95))"
      : tone === "danger"
        ? "linear-gradient(135deg, rgba(127, 29, 29, 0.42), rgba(17, 24, 39, 0.95))"
        : tone === "warning"
          ? "linear-gradient(135deg, rgba(120, 53, 15, 0.42), rgba(17, 24, 39, 0.95))"
          : tone === "info"
            ? "linear-gradient(135deg, rgba(7, 89, 133, 0.42), rgba(17, 24, 39, 0.95))"
            : "linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(11, 18, 32, 0.98))"

  return (
    <div
      style={{
        background: toneBackground,
        border: "1px solid rgba(55, 65, 81, 0.75)",
        borderRadius: "20px",
        padding: "18px",
        minHeight: "126px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.18)"
      }}
    >
      <p style={{ color: "#9ca3af", fontSize: "13px", marginBottom: "14px" }}>{label}</p>

      <div>
        <p
          style={{
            color: accent,
            fontSize: "28px",
            fontWeight: "bold",
            letterSpacing: "-0.02em",
            marginBottom: helper ? "8px" : 0
          }}
        >
          {value}
        </p>

        {helper ? (
          <p style={{ color: "#9ca3af", fontSize: "13px", lineHeight: "1.6" }}>{helper}</p>
        ) : null}
      </div>
    </div>
  )
}

function InfoCard({ label, value, accent = "#d1d5db", helper }) {
  return (
    <div
      style={{
        backgroundColor: "#0b1220",
        border: "1px solid #1f2937",
        borderRadius: "16px",
        padding: "16px"
      }}
    >
      <p style={{ color: "#9ca3af", marginBottom: "8px", fontSize: "13px" }}>{label}</p>
      <p style={{ color: accent, fontWeight: "bold", fontSize: "16px", marginBottom: helper ? "6px" : 0 }}>
        {value}
      </p>
      {helper ? <p style={{ color: "#6b7280", fontSize: "12px", lineHeight: "1.5" }}>{helper}</p> : null}
    </div>
  )
}

function StatusPill({ label, color, backgroundColor }) {
  return (
    <div
      style={{
        backgroundColor: backgroundColor,
        border: `1px solid ${color}`,
        color,
        padding: "8px 12px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: "bold",
        whiteSpace: "nowrap"
      }}
    >
      {label}
    </div>
  )
}

function EmptyBox({ text }) {
  return (
    <div
      style={{
        backgroundColor: "#111827",
        border: "1px dashed #374151",
        borderRadius: "16px",
        padding: "20px",
        color: "#9ca3af"
      }}
    >
      {text}
    </div>
  )
}

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
  const [backendHealth, setBackendHealth] = useState({
    appName: "-",
    version: "-",
    environment: "-",
    status: "-",
    message: "-",
    serverTime: "-",
    startedAt: "-",
    uptimeSeconds: 0,
    uptime: "-",
    botStatus: "-",
    systemMode: "-",
    activeSymbol: "-",
    timeframe: "-",
    mode: "-",
    openPositions: 0,
    historyRecords: 0,
    riskStatus: "-",
    dailyLossStatus: "-"
  })
  const [showOperationsConsole, setShowOperationsConsole] = useState(false)
  const [showFullOperationsChain, setShowFullOperationsChain] = useState(false)

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
        preset.maxDailyLoss === String(riskSettings.maxDailyLoss || "") &&
        preset.riskPerTrade === String(riskSettings.riskPerTrade || "") &&
        preset.maxOpenPositions === String(riskSettings.maxOpenPositions || "")
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

      setSelectedAccountScenario(getAccountScenarioNameFromValues(nextAccountSettings))

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

      const nextBackendHealth =
        dashboardData.backendHealth ||
        healthData || {
          appName: "-",
          version: "-",
          environment: "-",
          status: "-",
          message: "-",
          serverTime: "-",
          startedAt: "-",
          uptimeSeconds: 0,
          uptime: "-",
          botStatus: dashboardData.botStatus || "-",
          systemMode: dashboardData.systemMode || "-",
          activeSymbol: nextSettings.symbol || "-",
          timeframe: nextSettings.timeframe || "-",
          mode: nextSettings.mode || "-",
          openPositions: dashboardData.positions?.length || 0,
          historyRecords: dashboardData.historyItems?.length || 0,
          riskStatus: nextRiskControls.riskStatus || "-",
          dailyLossStatus: nextRiskControls.dailyLossStatus || "-"
        }

      setBackendHealth(nextBackendHealth)
      setBackendStatus(nextBackendHealth.status === "ok" ? "Connected" : "Disconnected")
    } catch (error) {
      setLoadError(error.message || "Unknown error")
      setBackendStatus("Disconnected")
      setBackendHealth((prev) => ({
        ...prev,
        status: "error",
        message: error.message || "Unknown error",
        serverTime: new Date().toLocaleString()
      }))
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
  const openPositionsCount = String(visiblePositions.length)
  const recentActivities = historyItems.slice(0, 4)

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

    const combinedText = `${item.date} ${item.area || ""} ${item.symbol || ""} ${item.type} ${item.pnl} ${item.detail}`.toLowerCase()
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
        const itemArea = item.area || item.symbol
        return itemArea === historyAreaFilter
      })

  const totalHistoryRecords = historyItems.length
  const startActionsCount = historyItems.filter((item) => item.type === "START").length
  const stopActionsCount = historyItems.filter((item) => item.type === "STOP").length

  const diagnosticsChecks = [
    { label: "Backend Connected", passed: backendStatus === "Connected" },
    { label: "Backend Health OK", passed: backendHealth.status === "ok" },
    { label: "Bot State Known", passed: botStatus === "RUNNING" || botStatus === "STOPPED" },
    { label: "Risk Data Loaded", passed: riskData.riskStatus !== "-" },
    { label: "Daily Loss Guard Known", passed: riskData.dailyLossStatus !== "-" },
    { label: "Settings Loaded", passed: settingsData.symbol !== "-" },
    { label: "Chart Data Loaded", passed: chartData.length > 0 },
    { label: "History Loaded", passed: Array.isArray(historyItems) },
    { label: "Positions Loaded", passed: Array.isArray(basePositions) },
    { label: "No Load Error", passed: !loadError }
  ]

  const diagnosticsPassedCount = diagnosticsChecks.filter((check) => check.passed).length
  const diagnosticsScore =
    diagnosticsChecks.length > 0
      ? Math.round((diagnosticsPassedCount / diagnosticsChecks.length) * 100)
      : 0

  const reliabilityScore = Math.round(
    diagnosticsScore * 0.55 +
    (backendHealth.status === "ok" ? 15 : 0) +
    ((backendHealth.riskStatus || riskData.riskStatus) === "OK" ? 15 : 0) +
    ((backendHealth.dailyLossStatus || riskData.dailyLossStatus) === "OK" ? 15 : 0)
  )

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
    borderRadius: "14px",
    padding: "12px 14px",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box"
  }

  const labelStyle = {
    color: "#9ca3af",
    marginBottom: "8px",
    display: "block",
    fontSize: "14px",
    fontWeight: "bold"
  }

  const historyFilterButtonStyle = (type) => ({
    backgroundColor: historyFilter === type ? "#84cc16" : "#1f2937",
    color: historyFilter === type ? "black" : "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: historyFilter === type ? "0 10px 24px rgba(132, 204, 22, 0.2)" : "none"
  })

  const historyAreaFilterButtonStyle = (area) => ({
    backgroundColor: historyAreaFilter === area ? "#38bdf8" : "#1f2937",
    color: historyAreaFilter === area ? "black" : "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: historyAreaFilter === area ? "0 10px 24px rgba(56, 189, 248, 0.2)" : "none"
  })

  const baseButtonStyle = {
    border: "none",
    padding: "12px 18px",
    borderRadius: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 12px 24px rgba(0, 0, 0, 0.18)"
  }

  const startButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: botStatus === "RUNNING" ? "#84cc16" : "#1f2937",
    color: botStatus === "RUNNING" ? "black" : "white",
    cursor: botStatus === "RUNNING" || actionLoading ? "not-allowed" : "pointer",
    opacity: botStatus === "RUNNING" || actionLoading ? 0.7 : 1
  }

  const stopButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: botStatus === "STOPPED" ? "#f87171" : "#1f2937",
    color: "white",
    cursor: botStatus === "STOPPED" || actionLoading ? "not-allowed" : "pointer",
    opacity: botStatus === "STOPPED" || actionLoading ? 0.7 : 1
  }

  const emergencyButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: "#dc2626",
    color: "white",
    cursor: actionLoading ? "not-allowed" : "pointer",
    opacity: actionLoading ? 0.7 : 1
  }

  const refreshButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: "#2563eb",
    color: "white",
    cursor: isBusy ? "not-allowed" : "pointer",
    opacity: isBusy ? 0.7 : 1
  }

  const retryButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: "#f59e0b",
    color: "black",
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.7 : 1
  }

  const saveButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: "#84cc16",
    color: "black",
    cursor: settingsSaving ? "not-allowed" : "pointer",
    opacity: settingsSaving ? 0.7 : 1
  }

  const accountSaveButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: "#84cc16",
    color: "black",
    cursor: accountSettingsSaving ? "not-allowed" : "pointer",
    opacity: accountSettingsSaving ? 0.7 : 1
  }

  const riskSaveButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: "#84cc16",
    color: "black",
    cursor: riskSettingsSaving ? "not-allowed" : "pointer",
    opacity: riskSettingsSaving ? 0.7 : 1
  }

  const resetButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: "#374151",
    color: "white"
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
    const confirmed = window.confirm("Are you sure you want to reset Account Settings?")
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

  const renderMessageBox = (type, title, message) => {
    const config =
      type === "error"
        ? {
          bg: "#450a0a",
          border: "#991b1b",
          title: "#fecaca",
          text: "#fecaca"
        }
        : {
          bg: "#052e16",
          border: "#166534",
          title: "#bbf7d0",
          text: "#bbf7d0"
        }

    return (
      <div
        style={{
          backgroundColor: config.bg,
          border: `1px solid ${config.border}`,
          borderRadius: "16px",
          padding: "16px",
          marginTop: "16px"
        }}
      >
        <p style={{ color: config.title, fontWeight: "bold", marginBottom: "6px" }}>{title}</p>
        <p style={{ color: config.text }}>{message}</p>
      </div>
    )
  }

  const renderRecentActivityList = () => {
    if (recentActivities.length === 0) {
      return <EmptyBox text="No recent activity." />
    }

    return (
      <div
        style={{
          backgroundColor: "#111827",
          border: "1px solid #1f2937",
          borderRadius: "18px",
          overflow: "hidden"
        }}
      >
        {recentActivities.map((item, index) => (
          <div
            key={`${item.date}-${item.type}-${index}`}
            style={{
              padding: "16px 18px",
              borderBottom: index !== recentActivities.length - 1 ? "1px solid #1f2937" : "none",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "16px",
              flexWrap: "wrap"
            }}
          >
            <div>
              <p style={{ color: "#f9fafb", fontWeight: "bold", marginBottom: "6px" }}>
                {item.type}
              </p>
              <p style={{ color: "#9ca3af", fontSize: "13px", marginBottom: "6px" }}>
                {item.symbol} • {item.date}
              </p>
              <p style={{ color: "#9ca3af", fontSize: "13px", lineHeight: "1.6" }}>
                {item.detail || "-"}
              </p>
            </div>

            <p
              style={{
                color:
                  item.type === "SELL" || item.type === "STOP" || item.type === "EMERGENCY"
                    ? "#f87171"
                    : "#86efac",
                fontWeight: "bold"
              }}
            >
              {item.pnl || "-"}
            </p>
          </div>
        ))}
      </div>
    )
  }

  const renderDashboardPage = () => {
    return (
      <>
        <PageHeader
          title="AI Trading Dashboard"
          subtitle="แดชบอร์ดสไตล์ institutional สำหรับดูภาพรวมบัญชี สถานะบอท ความเสี่ยง AI signal กราฟราคา และการควบคุมระบบทั้งหมดในหน้าเดียว"
        >
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <StatusPill
              label={`BOT ${botStatus}`}
              color={botStatus === "RUNNING" ? "#86efac" : "#f87171"}
              backgroundColor={botStatus === "RUNNING" ? "rgba(20, 83, 45, 0.35)" : "rgba(127, 29, 29, 0.35)"}
            />
            <StatusPill
              label={`SYSTEM ${systemMode}`}
              color={systemModeColor}
              backgroundColor={botStatus === "RUNNING" ? "rgba(20, 83, 45, 0.35)" : "rgba(127, 29, 29, 0.35)"}
            />
            <StatusPill
              label={`BACKEND ${backendStatus}`}
              color={backendStatus === "Connected" ? "#38bdf8" : "#f87171"}
              backgroundColor={
                backendStatus === "Connected" ? "rgba(8, 47, 73, 0.4)" : "rgba(127, 29, 29, 0.35)"
              }
            />
          </div>
        </PageHeader>

        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(3, 7, 18, 0.98))",
            border: "1px solid rgba(55, 65, 81, 0.8)",
            borderRadius: "26px",
            padding: "28px",
            marginBottom: "24px",
            boxShadow: "0 26px 60px rgba(0, 0, 0, 0.25)",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <div
            style={{
              position: "absolute",
              right: "-80px",
              top: "-60px",
              width: "240px",
              height: "240px",
              borderRadius: "999px",
              background: "rgba(56, 189, 248, 0.08)",
              filter: "blur(18px)"
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns: "minmax(320px, 1.5fr) minmax(280px, 1fr)",
              gap: "24px"
            }}
          >
            <div>
              <p
                style={{
                  color: "#84cc16",
                  fontSize: "12px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  marginBottom: "12px"
                }}
              >
                Command Center
              </p>

              <h2
                style={{
                  color: "#f9fafb",
                  fontSize: "32px",
                  lineHeight: "1.2",
                  letterSpacing: "-0.03em",
                  marginBottom: "14px"
                }}
              >
                ควบคุมการเทรด ดูความเสี่ยง และตัดสินใจได้จากหน้าเดียว
              </h2>

              <p
                style={{
                  color: "#9ca3af",
                  lineHeight: "1.8",
                  maxWidth: "760px",
                  marginBottom: "22px"
                }}
              >
                หน้า Dashboard นี้รวมทั้ง account overview, live execution control, AI decision snapshot,
                price chart, risk engine, open positions และ recent activity เพื่อให้พี่เห็นทั้งระบบแบบครบภาพ
              </p>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
                <button onClick={handleStart} disabled={botStatus === "RUNNING" || actionLoading} style={startButtonStyle}>
                  Start Bot
                </button>

                <button onClick={handleStop} disabled={botStatus === "STOPPED" || actionLoading} style={stopButtonStyle}>
                  Stop Bot
                </button>

                <button onClick={handleEmergencyStop} disabled={actionLoading} style={emergencyButtonStyle}>
                  Emergency Stop
                </button>

                <button onClick={loadDashboardData} disabled={isBusy} style={refreshButtonStyle}>
                  {isBusy ? "Refreshing..." : "Refresh Data"}
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                  gap: "14px"
                }}
              >
                <InfoCard label="Last Action" value={lastAction} accent="#d1d5db" />
                <InfoCard label="Last Updated" value={lastUpdated} accent="#38bdf8" />
                <InfoCard label="Active Symbol" value={settingsData.symbol} accent="#f9fafb" />
                <InfoCard label="Execution Mode" value={settingsData.mode} accent="#facc15" />
              </div>
            </div>

            <div
              style={{
                backgroundColor: "rgba(11, 18, 32, 0.9)",
                border: "1px solid rgba(55, 65, 81, 0.8)",
                borderRadius: "22px",
                padding: "22px",
                boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.02)"
              }}
            >
              <p style={{ color: "#9ca3af", marginBottom: "16px", fontSize: "13px" }}>System Snapshot</p>

              <div style={{ display: "grid", gap: "14px" }}>
                <InfoCard
                  label="Quick Status"
                  value={`${botStatus} / ${systemMode}`}
                  accent={botStatus === "RUNNING" ? "#86efac" : "#f87171"}
                />
                <InfoCard label="Backend" value={backendStatus} accent={backendStatus === "Connected" ? "#38bdf8" : "#f87171"} />
                <InfoCard label="Timeframe" value={settingsData.timeframe} accent="#d1d5db" />
                <InfoCard label="Open Positions" value={openPositionsCount} accent={visiblePositions.length > 0 ? "#86efac" : "#f87171"} />
                <InfoCard
                  label="Data Status"
                  value={loadError ? "Error" : isBusy ? "Loading..." : "Ready"}
                  accent={loadError ? "#f87171" : isBusy ? "#facc15" : "#86efac"}
                />
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "18px",
            marginBottom: "24px"
          }}
        >
          <MetricCard
            label="Balance"
            value={balance}
            helper="Current account balance"
            accent="#f9fafb"
          />
          <MetricCard
            label="Daily P&L"
            value={dailyPnl}
            helper="Realized / simulated daily result"
            accent={dailyPnl.includes("-") ? "#f87171" : "#86efac"}
            tone={dailyPnl.includes("-") ? "danger" : "success"}
          />
          <MetricCard
            label="Bot Status"
            value={botStatus}
            helper="Live bot execution state"
            accent={botStatus === "RUNNING" ? "#86efac" : "#f87171"}
            tone={botStatus === "RUNNING" ? "success" : "danger"}
          />
          <MetricCard
            label="System Mode"
            value={systemMode}
            helper="Execution permission state"
            accent={systemModeColor}
            tone={botStatus === "RUNNING" ? "success" : "danger"}
          />
          <MetricCard
            label="Open Positions"
            value={openPositionsCount}
            helper="Currently visible live positions"
            accent={visiblePositions.length > 0 ? "#86efac" : "#facc15"}
            tone={visiblePositions.length > 0 ? "info" : "warning"}
          />
          <MetricCard
            label="AI Signal"
            value={aiInsights.signal}
            helper={`Confidence ${aiInsights.confidence}`}
            accent={
              aiInsights.signal === "BUY"
                ? "#86efac"
                : aiInsights.signal === "SELL"
                  ? "#f87171"
                  : "#facc15"
            }
            tone="info"
          />
        </div>

        <SectionCard
          eyebrow="Trading Intelligence"
          title="AI Decision & Quant Snapshot"
          subtitle="สรุปมุมมองของ AI และค่าสถิติหลักของระบบในรูปแบบที่อ่านง่ายขึ้น"
          rightSlot={
            <StatusPill
              label={`CONFIDENCE ${aiInsights.confidence}`}
              color="#38bdf8"
              backgroundColor="rgba(8, 47, 73, 0.4)"
            />
          }
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(320px, 1fr) minmax(320px, 1fr)",
              gap: "18px"
            }}
          >
            <div
              style={{
                backgroundColor: "#0b1220",
                border: "1px solid #1f2937",
                borderRadius: "20px",
                padding: "20px"
              }}
            >
              <p style={{ color: "#9ca3af", marginBottom: "16px" }}>AI Decision Snapshot</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px", marginBottom: "14px" }}>
                <InfoCard
                  label="Signal"
                  value={aiInsights.signal}
                  accent={
                    aiInsights.signal === "BUY"
                      ? "#86efac"
                      : aiInsights.signal === "SELL"
                        ? "#f87171"
                        : "#facc15"
                  }
                />
                <InfoCard label="Confidence" value={aiInsights.confidence} accent="#38bdf8" />
              </div>

              <div
                style={{
                  backgroundColor: "#111827",
                  border: "1px solid #1f2937",
                  borderRadius: "16px",
                  padding: "16px"
                }}
              >
                <p style={{ color: "#9ca3af", marginBottom: "8px" }}>Reason</p>
                <p style={{ color: "#d1d5db", lineHeight: "1.7" }}>{aiInsights.reason}</p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#0b1220",
                border: "1px solid #1f2937",
                borderRadius: "20px",
                padding: "20px"
              }}
            >
              <p style={{ color: "#9ca3af", marginBottom: "16px" }}>System Performance Snapshot</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px" }}>
                <InfoCard label="VaR" value={quantStats.var} accent="#f87171" />
                <InfoCard label="Volatility" value={quantStats.volatility} accent="#d1d5db" />
                <InfoCard label="Sharpe Ratio" value={quantStats.sharpeRatio} accent="#86efac" />
                <InfoCard label="API Calls" value={aiUsage.apiCalls} accent="#38bdf8" />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Execution Profile"
          title="Trading Configuration & Account Scenario"
          subtitle="ดูค่าการเทรดปัจจุบันและสถานะบัญชีจำลองได้อย่างชัดเจนขึ้น"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(320px, 1.1fr) minmax(320px, 1fr)",
              gap: "18px"
            }}
          >
            <div
              style={{
                backgroundColor: "#0b1220",
                border: "1px solid #1f2937",
                borderRadius: "20px",
                padding: "20px"
              }}
            >
              <p style={{ color: "#9ca3af", marginBottom: "16px" }}>Current Trading Configuration</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px" }}>
                <InfoCard label="Symbol" value={settingsData.symbol} accent="#f9fafb" />
                <InfoCard label="Timeframe" value={settingsData.timeframe} accent="#d1d5db" />
                <InfoCard label="Mode" value={settingsData.mode} accent="#facc15" />
                <InfoCard
                  label="Bot Status"
                  value={botStatus}
                  accent={botStatus === "RUNNING" ? "#86efac" : "#f87171"}
                />
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#0b1220",
                border: "1px solid #1f2937",
                borderRadius: "20px",
                padding: "20px"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "14px",
                  flexWrap: "wrap",
                  alignItems: "center",
                  marginBottom: "16px"
                }}
              >
                <p style={{ color: "#9ca3af" }}>Account Scenario Badge</p>

                <StatusPill
                  label={currentAccountScenario}
                  color={currentAccountScenarioColor}
                  backgroundColor="rgba(17, 24, 39, 0.9)"
                />
              </div>

              <div
                style={{
                  backgroundColor: "#111827",
                  border: `1px solid ${currentAccountScenarioColor}`,
                  borderRadius: "16px",
                  padding: "16px",
                  marginBottom: "14px"
                }}
              >
                <p style={{ color: "#d1d5db", fontWeight: "bold", marginBottom: "8px" }}>
                  {currentAccountScenario}
                </p>
                <p style={{ color: "#9ca3af", lineHeight: "1.7" }}>
                  {currentAccountScenarioDescription}
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
                <InfoCard label="Balance" value={balance} accent="#f9fafb" />
                <InfoCard label="Daily P&L" value={dailyPnl} accent={dailyPnl.includes("-") ? "#f87171" : "#86efac"} />
                <InfoCard label="Current Daily Loss" value={riskData.currentDailyLoss} accent="#f87171" />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Risk & Market"
          title="Price Chart & Risk Engine"
          subtitle="กราฟราคาและแผง risk control วางคู่กัน ทำให้มอง market context และ risk state ได้ใน section เดียว"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(420px, 1.5fr) minmax(300px, 1fr)",
              gap: "18px",
              alignItems: "start"
            }}
          >
            <div
              style={{
                backgroundColor: "#0b1220",
                border: "1px solid #1f2937",
                borderRadius: "20px",
                padding: "18px"
              }}
            >
              <PriceChart
                data={chartData}
                symbol={settingsData.symbol}
                timeframe={settingsData.timeframe}
              />
            </div>

            <div
              style={{
                backgroundColor: "#0b1220",
                border: "1px solid #1f2937",
                borderRadius: "20px",
                padding: "18px"
              }}
            >
              <RiskPanel riskData={riskData} />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Activity Feed"
          title="Recent Activity & Open Positions"
          subtitle="ดู action ล่าสุดของระบบคู่กับรายการออเดอร์ที่เปิดอยู่ เพื่อเชื่อมโยงเหตุการณ์ล่าสุดกับสถานะ position"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(320px, 0.9fr) minmax(420px, 1.4fr)",
              gap: "18px",
              alignItems: "start"
            }}
          >
            <div>
              <p style={{ color: "#9ca3af", marginBottom: "12px" }}>Recent Activity</p>
              {renderRecentActivityList()}
            </div>

            <div
              style={{
                backgroundColor: "#0b1220",
                border: "1px solid #1f2937",
                borderRadius: "20px",
                padding: "18px"
              }}
            >
              <OpenPositionsTable positions={visiblePositions} />
            </div>
          </div>
        </SectionCard>
      </>
    )
  }

  const renderBacktestPage = () => {
    return (
      <>
        <PageHeader
          title="Backtest"
          subtitle="หน้าสรุปผล backtest แบบกระชับ ดูผลลัพธ์หลักของระบบเพื่อประเมินคุณภาพเบื้องต้น"
        >
          <StatusPill label={`MENU ${selectedMenu}`} color="#84cc16" backgroundColor="rgba(20, 83, 45, 0.35)" />
        </PageHeader>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "18px",
            marginBottom: "24px"
          }}
        >
          <MetricCard label="Total Trades" value={backtestData.totalTrades} accent="#f9fafb" />
          <MetricCard label="Win Rate" value={backtestData.winRate} accent="#86efac" tone="success" />
          <MetricCard label="Net Profit" value={backtestData.netProfit} accent="#38bdf8" tone="info" />
        </div>

        <SectionCard
          eyebrow="Backtest Summary"
          title="Strategy Backtest Overview"
          subtitle="สรุปผลสำคัญของระบบย้อนหลังในรูปแบบการ์ดและแผงสรุป"
        >
          <div
            style={{
              backgroundColor: "#0b1220",
              border: "1px solid #1f2937",
              borderRadius: "20px",
              padding: "20px"
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
              <InfoCard label="Total Trades" value={backtestData.totalTrades} accent="#f9fafb" />
              <InfoCard label="Win Rate" value={backtestData.winRate} accent="#86efac" />
              <InfoCard label="Net Profit" value={backtestData.netProfit} accent="#38bdf8" />
            </div>
          </div>
        </SectionCard>
      </>
    )
  }

  const renderHistoryPage = () => {
    return (
      <>
        <PageHeader
          title="History"
          subtitle="ค้นหา กรอง และส่งออกประวัติการทำงานของบอทและกิจกรรมต่าง ๆ ได้จากหน้าเดียว"
        >
          <StatusPill label={`MENU ${selectedMenu}`} color="#84cc16" backgroundColor="rgba(20, 83, 45, 0.35)" />
        </PageHeader>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "18px",
            marginBottom: "24px"
          }}
        >
          <MetricCard label="Total Records" value={String(totalHistoryRecords)} accent="#f9fafb" />
          <MetricCard label="Start Actions" value={String(startActionsCount)} accent="#86efac" tone="success" />
          <MetricCard label="Stop Actions" value={String(stopActionsCount)} accent="#f87171" tone="danger" />
        </div>

        <SectionCard
          eyebrow="History Filters"
          title="Filter & Search"
          subtitle="ค้นหาจาก keyword แล้วกรองต่อด้วย type และ area เพื่อดูประวัติได้เร็วขึ้น"
        >
          <div
            style={{
              backgroundColor: "#0b1220",
              border: "1px solid #1f2937",
              borderRadius: "20px",
              padding: "20px"
            }}
          >
            <div style={{ marginBottom: "18px" }}>
              <label style={labelStyle}>Search</label>
              <input
                type="text"
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
                placeholder="ค้นหาจาก type, symbol, detail, date, pnl..."
                style={cardInputStyle}
              />
            </div>

            <div style={{ marginBottom: "18px" }}>
              <p style={{ color: "#9ca3af", marginBottom: "10px", fontWeight: "bold" }}>Filter by Type</p>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button onClick={() => setHistoryFilter("ALL")} style={historyFilterButtonStyle("ALL")}>ALL</button>
                <button onClick={() => setHistoryFilter("START")} style={historyFilterButtonStyle("START")}>START</button>
                <button onClick={() => setHistoryFilter("STOP")} style={historyFilterButtonStyle("STOP")}>STOP</button>
                <button onClick={() => setHistoryFilter("EMERGENCY")} style={historyFilterButtonStyle("EMERGENCY")}>EMERGENCY</button>
                <button onClick={() => setHistoryFilter("SETTINGS")} style={historyFilterButtonStyle("SETTINGS")}>SETTINGS</button>
              </div>
            </div>

            <div>
              <p style={{ color: "#9ca3af", marginBottom: "10px", fontWeight: "bold" }}>Filter by Area</p>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button onClick={() => setHistoryAreaFilter("ALL")} style={historyAreaFilterButtonStyle("ALL")}>ALL AREAS</button>
                <button onClick={() => setHistoryAreaFilter("BOT")} style={historyAreaFilterButtonStyle("BOT")}>BOT</button>
                <button onClick={() => setHistoryAreaFilter("ACCOUNT")} style={historyAreaFilterButtonStyle("ACCOUNT")}>ACCOUNT</button>
                <button onClick={() => setHistoryAreaFilter("RISK")} style={historyAreaFilterButtonStyle("RISK")}>RISK</button>
                <button onClick={() => setHistoryAreaFilter("SYSTEM")} style={historyAreaFilterButtonStyle("SYSTEM")}>SYSTEM</button>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Activity Log"
          title="Trade & Activity History"
          subtitle="แสดงประวัติทั้งหมดตาม filter ที่เลือก พร้อมปุ่ม export CSV และ clear history ภายใน component เดิม"
        >
          <HistoryTable historyItems={filteredHistoryItems} />
        </SectionCard>
      </>
    )
  }

  const renderAiInsightsPage = () => {
    return (
      <>
        <PageHeader
          title="AI Insights"
          subtitle="สรุปการตัดสินใจล่าสุดของ AI พร้อมเหตุผล, confidence, risk bias และ action ที่ควรทำต่อ"
        >
          <StatusPill label={`MENU ${selectedMenu}`} color="#84cc16" backgroundColor="rgba(20, 83, 45, 0.35)" />
        </PageHeader>

        <AiInsightsPanel
          aiInsights={aiInsights}
          backendHealth={backendHealth}
          riskData={riskData}
          botStatus={botStatus}
          selectedMenu={selectedMenu}
        />
      </>
    )
  }

  const renderAiUsagePage = () => {
    return (
      <>
        <PageHeader
          title="AI Usage"
          subtitle="ภาพรวมการใช้งาน AI, จำนวน API calls, token usage, estimated cost, budget และ efficiency"
        >
          <StatusPill label={`MENU ${selectedMenu}`} color="#84cc16" backgroundColor="rgba(20, 83, 45, 0.35)" />
        </PageHeader>

        <AiUsagePanel
          aiUsage={aiUsage}
          selectedMenu={selectedMenu}
        />
      </>
    )
  }

  const renderQuantPage = () => {
    return (
      <>
        <PageHeader
          title="Quant"
          subtitle="วิเคราะห์สุขภาพระบบเชิง Quant ผ่าน VaR, volatility, Sharpe, drawdown, position usage และ risk regime"
        >
          <StatusPill label={`MENU ${selectedMenu}`} color="#84cc16" backgroundColor="rgba(20, 83, 45, 0.35)" />
        </PageHeader>

        <QuantAnalyticsPanel
          quantStats={quantStats}
          backtest={backtestData}
          riskData={riskData}
          positions={visiblePositions}
          selectedMenu={selectedMenu}
        />
      </>
    )
  }

  const renderSettingsPage = () => {
    return (
      <>
        <PageHeader
          title="Settings"
          subtitle="ปรับแต่ง bot settings, account summary และ risk controls ได้ในหน้าเดียว พร้อม preset และ reset"
        >
          <StatusPill label={`MENU ${selectedMenu}`} color="#84cc16" backgroundColor="rgba(20, 83, 45, 0.35)" />
        </PageHeader>

        <SectionCard
          eyebrow="Bot Configuration"
          title="Bot Settings"
          subtitle="กำหนด symbol, timeframe และ execution mode ของระบบ"
        >
          <div
            style={{
              backgroundColor: "#0b1220",
              border: "1px solid #1f2937",
              borderRadius: "20px",
              padding: "20px"
            }}
          >
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

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button onClick={handleSaveSettings} disabled={settingsSaving} style={saveButtonStyle}>
                {settingsSaving ? "Saving..." : "Save Settings"}
              </button>

              <button onClick={handleResetBotSettings} disabled={settingsSaving} style={resetButtonStyle}>
                Reset Bot Settings
              </button>
            </div>

            {settingsError ? renderMessageBox("error", "Bot Settings Error", settingsError) : null}
            {settingsSuccess ? renderMessageBox("success", "Success", settingsSuccess) : null}

            <div
              style={{
                marginTop: "18px",
                backgroundColor: "#111827",
                border: "1px solid #1f2937",
                borderRadius: "16px",
                padding: "16px"
              }}
            >
              <p style={{ color: "#9ca3af", marginBottom: "10px" }}>Saved Values</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
                <InfoCard label="Symbol" value={settingsData.symbol} accent="#f9fafb" />
                <InfoCard label="Timeframe" value={settingsData.timeframe} accent="#d1d5db" />
                <InfoCard label="Mode" value={settingsData.mode} accent="#facc15" />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Account Summary"
          title="Account Settings"
          subtitle="ตั้งค่า balance, daily P&L และ current daily loss พร้อมเลือก scenario สำเร็จรูป"
        >
          <div
            style={{
              backgroundColor: "#0b1220",
              border: "1px solid #1f2937",
              borderRadius: "20px",
              padding: "20px"
            }}
          >
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
                backgroundColor: "#111827",
                border: "1px solid #1f2937",
                borderRadius: "16px",
                padding: "16px",
                marginBottom: "18px"
              }}
            >
              <p style={{ color: "#9ca3af", marginBottom: "12px" }}>Account Scenario Guide</p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "14px"
                }}
              >
                {accountScenarioOptions.map((scenario) => (
                  <div
                    key={scenario.name}
                    style={{
                      backgroundColor: selectedAccountScenario === scenario.name ? "#1a2e05" : "#0b1220",
                      border: selectedAccountScenario === scenario.name ? "1px solid #84cc16" : "1px solid #1f2937",
                      borderRadius: "14px",
                      padding: "14px"
                    }}
                  >
                    <p style={{ color: "#f9fafb", fontWeight: "bold", marginBottom: "8px" }}>
                      {scenario.name}
                    </p>
                    <p style={{ color: "#9ca3af", fontSize: "13px", marginBottom: "6px" }}>
                      Balance: {scenario.balance}
                    </p>
                    <p style={{ color: "#9ca3af", fontSize: "13px", marginBottom: "6px" }}>
                      Daily P&L: {scenario.dailyPnl}
                    </p>
                    <p style={{ color: "#9ca3af", fontSize: "13px", marginBottom: "8px" }}>
                      Daily Loss: {scenario.currentDailyLoss}
                    </p>
                    <p style={{ color: "#d1d5db", fontSize: "12px", lineHeight: "1.6" }}>
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
                onChange={(event) => handleAccountSettingsInputChange("balance", event.target.value)}
                placeholder="$33.85"
                style={cardInputStyle}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Daily P&L</label>
              <input
                type="text"
                value={accountSettingsForm.dailyPnl}
                onChange={(event) => handleAccountSettingsInputChange("dailyPnl", event.target.value)}
                placeholder="+2.95 or -5.00"
                style={cardInputStyle}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Current Daily Loss</label>
              <input
                type="text"
                value={accountSettingsForm.currentDailyLoss}
                onChange={(event) => handleAccountSettingsInputChange("currentDailyLoss", event.target.value)}
                placeholder="0 or 2.50"
                style={cardInputStyle}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
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

            {accountSettingsError ? renderMessageBox("error", "Account Settings Error", accountSettingsError) : null}
            {accountSettingsSuccess ? renderMessageBox("success", "Success", accountSettingsSuccess) : null}

            <div
              style={{
                marginTop: "18px",
                backgroundColor: "#111827",
                border: "1px solid #1f2937",
                borderRadius: "16px",
                padding: "16px"
              }}
            >
              <p style={{ color: "#9ca3af", marginBottom: "10px" }}>Current Account Summary</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
                <InfoCard label="Balance" value={balance} accent="#f9fafb" />
                <InfoCard label="Daily P&L" value={dailyPnl} accent={dailyPnl.includes("-") ? "#f87171" : "#86efac"} />
                <InfoCard label="Current Daily Loss" value={riskData.currentDailyLoss} accent="#f87171" />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Risk Management"
          title="Risk Controls"
          subtitle="กำหนด max daily loss, risk per trade และจำนวน position สูงสุด พร้อม preset สำเร็จรูป"
        >
          <div
            style={{
              backgroundColor: "#0b1220",
              border: "1px solid #1f2937",
              borderRadius: "20px",
              padding: "20px"
            }}
          >
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
                backgroundColor: "#111827",
                border: "1px solid #1f2937",
                borderRadius: "16px",
                padding: "16px",
                marginBottom: "18px"
              }}
            >
              <p style={{ color: "#9ca3af", marginBottom: "12px" }}>Risk Preset Guide</p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "14px"
                }}
              >
                {riskPresetOptions.map((preset) => (
                  <div
                    key={preset.name}
                    style={{
                      backgroundColor: selectedRiskPreset === preset.name ? "#1a2e05" : "#0b1220",
                      border: selectedRiskPreset === preset.name ? "1px solid #84cc16" : "1px solid #1f2937",
                      borderRadius: "14px",
                      padding: "14px"
                    }}
                  >
                    <p style={{ color: "#f9fafb", fontWeight: "bold", marginBottom: "8px" }}>
                      {preset.name}
                    </p>
                    <p style={{ color: "#9ca3af", fontSize: "13px", marginBottom: "6px" }}>
                      Max Loss: {preset.maxDailyLoss}
                    </p>
                    <p style={{ color: "#9ca3af", fontSize: "13px", marginBottom: "6px" }}>
                      Risk/Trade: {preset.riskPerTrade}
                    </p>
                    <p style={{ color: "#9ca3af", fontSize: "13px", marginBottom: "8px" }}>
                      Max Positions: {preset.maxOpenPositions}
                    </p>
                    <p style={{ color: "#d1d5db", fontSize: "12px", lineHeight: "1.6" }}>
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
                onChange={(event) => handleRiskSettingsInputChange("maxDailyLoss", event.target.value)}
                placeholder="$10.00"
                style={cardInputStyle}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Risk Per Trade</label>
              <input
                type="text"
                value={riskSettingsForm.riskPerTrade}
                onChange={(event) => handleRiskSettingsInputChange("riskPerTrade", event.target.value)}
                placeholder="1%"
                style={cardInputStyle}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Max Open Positions</label>
              <input
                type="text"
                value={riskSettingsForm.maxOpenPositions}
                onChange={(event) => handleRiskSettingsInputChange("maxOpenPositions", event.target.value)}
                placeholder="3"
                style={cardInputStyle}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button onClick={handleSaveRiskSettings} disabled={riskSettingsSaving} style={riskSaveButtonStyle}>
                {riskSettingsSaving ? "Saving..." : "Save Risk Controls"}
              </button>

              <button onClick={handleResetRiskSettings} disabled={riskSettingsSaving} style={resetButtonStyle}>
                Reset Risk Controls
              </button>
            </div>

            {riskSettingsError ? renderMessageBox("error", "Risk Settings Error", riskSettingsError) : null}
            {riskSettingsSuccess ? renderMessageBox("success", "Success", riskSettingsSuccess) : null}

            <div
              style={{
                marginTop: "18px",
                backgroundColor: "#111827",
                border: "1px solid #1f2937",
                borderRadius: "16px",
                padding: "16px"
              }}
            >
              <p style={{ color: "#9ca3af", marginBottom: "10px" }}>Current Risk Controls</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
                <InfoCard label="Max Daily Loss" value={riskData.maxDailyLoss} accent="#f9fafb" />
                <InfoCard label="Risk Per Trade" value={riskData.riskPerTrade} accent="#facc15" />
                <InfoCard label="Max Open Positions" value={riskData.maxOpenPositions} accent="#38bdf8" />
              </div>
            </div>
          </div>
        </SectionCard>
      </>
    )
  }

  const renderSystemDiagnosticsPage = () => {
    return (
      <>
        <PageHeader
          title="System Diagnostics"
          subtitle="Safe diagnostics console สำหรับตรวจสุขภาพ backend, risk gate และ system readiness โดยไม่โหลด operations chain หนักทันที"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(140px, 1fr))",
              gap: "12px",
              minWidth: "320px"
            }}
          >
            <InfoCard
              label="Backend"
              value={backendStatus}
              accent={backendStatus === "Connected" ? "#86efac" : "#f87171"}
            />
            <InfoCard
              label="Reliability"
              value={`${reliabilityScore}/100`}
              accent={reliabilityScore >= 75 ? "#86efac" : "#facc15"}
            />
          </div>
        </PageHeader>

        <SectionCard
          eyebrow="Backend Health"
          title="Backend Health Monitor"
          subtitle="สถานะ backend, API version, uptime, bot state, risk status และ daily loss guard จาก FastAPI หรือ mock API"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px"
            }}
          >
            <MetricCard
              label="Status"
              value={backendHealth.status || "-"}
              accent={backendHealth.status === "ok" ? "#86efac" : "#f87171"}
              tone={backendHealth.status === "ok" ? "success" : "danger"}
            />
            <MetricCard
              label="Version"
              value={backendHealth.version || "-"}
              accent="#38bdf8"
              tone="info"
            />
            <MetricCard
              label="Environment"
              value={backendHealth.environment || "-"}
              accent="#facc15"
              tone="warning"
            />
            <MetricCard
              label="Uptime"
              value={backendHealth.uptime || "-"}
              accent="#d1d5db"
            />
            <MetricCard
              label="Bot Status"
              value={backendHealth.botStatus || botStatus}
              accent={(backendHealth.botStatus || botStatus) === "RUNNING" ? "#86efac" : "#f87171"}
            />
            <MetricCard
              label="Risk Status"
              value={backendHealth.riskStatus || riskData.riskStatus}
              accent={(backendHealth.riskStatus || riskData.riskStatus) === "OK" ? "#86efac" : "#f87171"}
            />
            <MetricCard
              label="Daily Loss"
              value={backendHealth.dailyLossStatus || riskData.dailyLossStatus}
              accent={(backendHealth.dailyLossStatus || riskData.dailyLossStatus) === "OK" ? "#86efac" : "#f87171"}
            />
            <MetricCard
              label="Server Time"
              value={backendHealth.serverTime || "-"}
              accent="#9ca3af"
            />
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Diagnostics Checks"
          title="System Readiness Checklist"
          subtitle="เช็กว่าข้อมูลหลักของระบบโหลดครบหรือไม่ ก่อนเปิด operations console ตัวเต็ม"
          rightSlot={
            <StatusPill
              label={`${diagnosticsScore}/100`}
              color={diagnosticsScore >= 80 ? "#86efac" : "#facc15"}
              backgroundColor={diagnosticsScore >= 80 ? "rgba(20, 83, 45, 0.35)" : "rgba(120, 53, 15, 0.35)"}
            />
          }
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "14px"
            }}
          >
            {diagnosticsChecks.map((check) => (
              <div
                key={check.label}
                style={{
                  backgroundColor: "#0b1220",
                  border: check.passed
                    ? "1px solid rgba(134, 239, 172, 0.35)"
                    : "1px solid rgba(248, 113, 113, 0.35)",
                  borderRadius: "16px",
                  padding: "16px"
                }}
              >
                <p
                  style={{
                    color: check.passed ? "#86efac" : "#f87171",
                    fontWeight: "bold",
                    marginBottom: "8px"
                  }}
                >
                  {check.passed ? "PASS" : "WATCH"}
                </p>

                <p style={{ color: "#d1d5db", fontWeight: "bold" }}>
                  {check.label}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Operations Console"
          title="12-Layer Trading Operations Console"
          subtitle="ส่วนนี้เป็น console ตัวเต็มที่มี component chain หลายชั้น ถ้าเปิดแล้วจอขาว แปลว่า error อยู่ใน OperationsPanel หรือ component ลูก"
          rightSlot={
            <button
              type="button"
              onClick={() => {
                setShowOperationsConsole((prev) => {
                  const nextValue = !prev
                  if (!nextValue) setShowFullOperationsChain(false)
                  return nextValue
                })
              }}
              style={{
                border: "none",
                padding: "12px 18px",
                borderRadius: "14px",
                fontWeight: "bold",
                cursor: "pointer",
                backgroundColor: showOperationsConsole ? "#f87171" : "#84cc16",
                color: showOperationsConsole ? "white" : "black",
                boxShadow: "0 12px 24px rgba(0, 0, 0, 0.18)"
              }}
            >
              {showOperationsConsole ? "Hide Operations Console" : "Show Operations Console"}
            </button>
          }
        >
          {!showOperationsConsole ? (
            <div
              style={{
                backgroundColor: "#0b1220",
                border: "1px solid rgba(55, 65, 81, 0.8)",
                borderRadius: "20px",
                padding: "22px"
              }}
            >
              <p
                style={{
                  color: "#facc15",
                  fontWeight: "bold",
                  marginBottom: "10px"
                }}
              >
                Operations Console is in safe mode.
              </p>

              <p style={{ color: "#9ca3af", lineHeight: "1.7" }}>
                หน้า Diagnostics เปิดได้แล้วโดยไม่โหลด component chain หนักทันที
                กดปุ่ม Show Operations Console เพื่อเปิด overview แบบปลอดภัยก่อน
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "18px" }}>
              <div
                style={{
                  backgroundColor: "#0b1220",
                  border: "1px solid rgba(134, 239, 172, 0.35)",
                  borderRadius: "20px",
                  padding: "22px"
                }}
              >
                <p
                  style={{
                    color: "#86efac",
                    fontWeight: "bold",
                    marginBottom: "10px",
                    fontSize: "18px"
                  }}
                >
                  Safe Operations Overview Loaded
                </p>

                <p style={{ color: "#9ca3af", lineHeight: "1.7", marginBottom: "18px" }}>
                  ตอนนี้ปุ่ม Show Operations Console จะไม่โหลด OperationsPanel ตัวเต็มทันที
                  เพื่อกันจอขาว ถ้าต้องการ debug chain ตัวเต็ม ให้กด Load Full 12-Layer Chain ด้านล่าง
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                    gap: "14px",
                    marginBottom: "18px"
                  }}
                >
                  <InfoCard
                    label="Backend"
                    value={backendStatus}
                    accent={backendStatus === "Connected" ? "#86efac" : "#f87171"}
                  />
                  <InfoCard
                    label="Bot Status"
                    value={botStatus}
                    accent={botStatus === "RUNNING" ? "#86efac" : "#f87171"}
                  />
                  <InfoCard
                    label="Risk Status"
                    value={riskData.riskStatus || "-"}
                    accent={riskData.riskStatus === "OK" ? "#86efac" : "#facc15"}
                  />
                  <InfoCard
                    label="Daily Loss"
                    value={riskData.dailyLossStatus || "-"}
                    accent={riskData.dailyLossStatus === "OK" ? "#86efac" : "#f87171"}
                  />
                  <InfoCard
                    label="Open Positions"
                    value={openPositionsCount}
                    accent={Number(openPositionsCount) > 0 ? "#38bdf8" : "#facc15"}
                  />
                  <InfoCard
                    label="Reliability"
                    value={`${reliabilityScore}/100`}
                    accent={reliabilityScore >= 75 ? "#86efac" : "#facc15"}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowFullOperationsChain((prev) => !prev)}
                  style={{
                    border: "none",
                    padding: "12px 18px",
                    borderRadius: "14px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    backgroundColor: showFullOperationsChain ? "#f87171" : "#38bdf8",
                    color: showFullOperationsChain ? "white" : "black",
                    boxShadow: "0 12px 24px rgba(0, 0, 0, 0.18)"
                  }}
                >
                  {showFullOperationsChain ? "Hide Full 12-Layer Chain" : "Load Full 12-Layer Chain Debug"}
                </button>
              </div>

              {showFullOperationsChain ? (
                <OperationsPanelErrorBoundary resetKey={String(showFullOperationsChain)}>
                  <OperationsPanel
                    backendHealth={backendHealth}
                    backendStatus={backendStatus}
                    botStatus={botStatus}
                    riskData={riskData}
                    lastUpdated={lastUpdated}
                    loadError={loadError}
                    openPositionsCount={openPositionsCount}
                    totalHistoryRecords={totalHistoryRecords}
                    diagnosticsScore={diagnosticsScore}
                    reliabilityScore={reliabilityScore}
                  />
                </OperationsPanelErrorBoundary>
              ) : null}
            </div>
          )}
        </SectionCard>
      </>
    )
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(15, 23, 42, 0.96))",
            border: "1px solid rgba(55, 65, 81, 0.72)",
            borderRadius: "24px",
            padding: "40px",
            color: "#d1d5db",
            fontSize: "20px",
            fontWeight: "bold",
            boxShadow: "0 20px 45px rgba(0, 0, 0, 0.22)"
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
            background:
              "linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(15, 23, 42, 0.96))",
            border: "1px solid rgba(55, 65, 81, 0.72)",
            borderRadius: "24px",
            padding: "40px",
            boxShadow: "0 20px 45px rgba(0, 0, 0, 0.22)"
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

    if (selectedMenu === "Dashboard") return renderDashboardPage()
    if (selectedMenu === "Backtest") return renderBacktestPage()
    if (selectedMenu === "History") return renderHistoryPage()
    if (selectedMenu === "AI Insights") return renderAiInsightsPage()
    if (selectedMenu === "AI Usage") return renderAiUsagePage()
    if (selectedMenu === "Quant") return renderQuantPage()
    if (selectedMenu === "Settings") return renderSettingsPage()
    if (selectedMenu === "System Diagnostics") return renderSystemDiagnosticsPage()

    return renderDashboardPage()
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        color: "white",
        fontFamily: "Arial, sans-serif",
        background:
          "radial-gradient(circle at top left, rgba(56, 189, 248, 0.08), transparent 22%), radial-gradient(circle at bottom right, rgba(132, 204, 22, 0.08), transparent 22%), #0b0f14"
      }}
    >
      <Sidebar selectedMenu={selectedMenu} setSelectedMenu={setSelectedMenu} />

      <div style={{ flex: 1, padding: "32px" }}>
        {renderContent()}
      </div>
    </div>
  )
}

export default App