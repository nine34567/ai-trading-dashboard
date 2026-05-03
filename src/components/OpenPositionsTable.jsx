import { useEffect, useMemo, useRef, useState } from "react"
import { useFocusTrap } from "../hooks/useFocusTrap"
import { DEFAULT_WORKSTATION_VIEW } from "../lib/workstationLayouts"

const advancedFilterOptions = [
  "Has Note",
  "Has Tags",
  "High Risk",
  "Profitable",
  "Losing",
  "Pinned"
]

const columns = [
  { id: "symbol", label: "Symbol" },
  { id: "side", label: "Side" },
  { id: "lot", label: "Lot" },
  { id: "entry", label: "Entry" },
  { id: "sl", label: "Stop Loss" },
  { id: "tp", label: "Take Profit" },
  { id: "pnl", label: "Floating P&L" },
  { id: "risk", label: "Risk Quality" },
  { id: "tags", label: "Tags" },
  { id: "note", label: "Note" }
]

const TABLE_RENDER_LIMIT = 180

function getPositionId(position, index) {
  return String(
    position.id ||
      position.ticket ||
      position.orderId ||
      `${position.symbol || "POSITION"}-${position.type || position.side || "SIDE"}-${position.lot || "SIZE"}-${position.entry || "ENTRY"}-${index}`
  )
}

function parsePnl(value) {
  const cleanedValue = String(value || "0")
    .replace("+", "")
    .replace("$", "")
    .replace(",", "")
    .trim()

  const parsedValue = Number(cleanedValue)

  return Number.isNaN(parsedValue) ? 0 : parsedValue
}

function parseNumber(value) {
  const parsedValue = Number(value)

  return Number.isNaN(parsedValue) ? 0 : parsedValue
}

function getPositionSide(position) {
  const side = String(position.type || position.side || "").toUpperCase()
  if (side.includes("SELL")) return "SELL"
  return "BUY"
}

function getTypeColor(type) {
  if (type === "BUY") return "#86efac"
  if (type === "SELL") return "#f87171"

  return "#d1d5db"
}

function getPnlColor(pnl) {
  const value = parsePnl(pnl)

  if (value > 0) return "#86efac"
  if (value < 0) return "#f87171"

  return "#9ca3af"
}

function getPositionRisk(position) {
  const entry = parseNumber(position.entry)
  const sl = parseNumber(position.sl)
  const tp = parseNumber(position.tp)

  if (entry === 0 || sl === 0 || tp === 0) {
    return {
      label: "UNKNOWN",
      color: "#9ca3af",
      helper: "Missing entry, SL, or TP",
      score: 1,
      ratio: 0
    }
  }

  const riskDistance = Math.abs(entry - sl)
  const rewardDistance = Math.abs(tp - entry)

  if (riskDistance === 0) {
    return {
      label: "INVALID",
      color: "#f87171",
      helper: "Stop loss distance is zero",
      score: 4,
      ratio: 0
    }
  }

  const rewardRiskRatio = rewardDistance / riskDistance

  if (rewardRiskRatio >= 2) {
    return {
      label: "GOOD",
      color: "#86efac",
      helper: `R:R ${rewardRiskRatio.toFixed(2)}`,
      score: 1,
      ratio: rewardRiskRatio
    }
  }

  if (rewardRiskRatio >= 1) {
    return {
      label: "FAIR",
      color: "#facc15",
      helper: `R:R ${rewardRiskRatio.toFixed(2)}`,
      score: 2,
      ratio: rewardRiskRatio
    }
  }

  return {
    label: "WEAK",
    color: "#f87171",
    helper: `R:R ${rewardRiskRatio.toFixed(2)}`,
    score: 3,
    ratio: rewardRiskRatio
  }
}

function isTypingTarget(target) {
  const tagName = target?.tagName
  return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT" || target?.isContentEditable
}

function getCurrentDateTime() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const hour = String(now.getHours()).padStart(2, "0")
  const minute = String(now.getMinutes()).padStart(2, "0")

  return `${year}-${month}-${day} ${hour}:${minute}`
}

function makeHistoryRecord(type, position, detail) {
  return {
    date: getCurrentDateTime(),
    area: "POSITIONS",
    symbol: position.symbol || "POSITION",
    type,
    pnl: position.pnl || "-",
    detail
  }
}

function normalizeView(view) {
  return {
    ...DEFAULT_WORKSTATION_VIEW,
    ...(view || {}),
    visibleColumns: Array.isArray(view?.visibleColumns)
      ? view.visibleColumns
      : DEFAULT_WORKSTATION_VIEW.visibleColumns,
    pinnedRows: Array.isArray(view?.pinnedRows) ? view.pinnedRows : [],
    advancedFilters: Array.isArray(view?.advancedFilters) ? view.advancedFilters : []
  }
}

function MiniButton({ children, active = false, danger = false, disabled = false, onClick, ariaLabel }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      style={{
        backgroundColor: danger
          ? "#dc2626"
          : active
            ? "#84cc16"
            : "#111827",
        border: danger
          ? "1px solid #dc2626"
          : active
            ? "1px solid #84cc16"
            : "1px solid #374151",
        borderRadius: "12px",
        color: danger || active ? (danger ? "white" : "black") : "#d1d5db",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: "12px",
        fontWeight: "bold",
        opacity: disabled ? 0.55 : 1,
        padding: "9px 11px",
        whiteSpace: "nowrap"
      }}
    >
      {children}
    </button>
  )
}

function ReviewDrawer({ row, rows, activityItems, onClose, onNavigate }) {
  const drawerRef = useRef(null)

  useFocusTrap({
    enabled: Boolean(row),
    containerRef: drawerRef,
    onEscape: onClose
  })

  if (!row) return null

  const position = row.position
  const risk = getPositionRisk(position)
  const rowIndex = rows.findIndex((item) => item.id === row.id)
  const canGoPrevious = rowIndex > 0
  const canGoNext = rowIndex >= 0 && rowIndex < rows.length - 1
  const relatedActivity = activityItems
    .filter((item) => String(item.symbol || "") === String(position.symbol || ""))
    .slice(0, 6)

  return (
    <div role="presentation" style={{ position: "fixed", inset: 0, zIndex: 90 }}>
      <button
        type="button"
        aria-label="Close position review"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          border: "none",
          backgroundColor: "rgba(2, 6, 23, 0.62)",
          backdropFilter: "blur(8px)"
        }}
      />

      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Position review for ${position.symbol || "position"}`}
        tabIndex={-1}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "min(520px, 100%)",
          height: "100%",
          background:
            "linear-gradient(135deg, rgba(17, 24, 39, 0.99), rgba(15, 23, 42, 0.99))",
          borderLeft: "1px solid rgba(55, 65, 81, 0.9)",
          boxShadow: "-30px 0 80px rgba(0, 0, 0, 0.42)",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <header style={{ padding: "22px", borderBottom: "1px solid #1f2937" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
            <div>
              <p
                style={{
                  color: "#84cc16",
                  fontSize: "11px",
                  fontWeight: "bold",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  marginBottom: "8px"
                }}
              >
                Position Review
              </p>
              <h3 style={{ color: "#f9fafb", fontSize: "22px", marginBottom: "6px" }}>
                {position.symbol || "Position"}
              </h3>
              <p style={{ color: "#9ca3af", fontSize: "13px" }}>
                {rowIndex + 1} of {rows.length} filtered positions
              </p>
            </div>
            <MiniButton ariaLabel="Close position review drawer" onClick={onClose}>Close</MiniButton>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "10px", marginBottom: "18px" }}>
            <MiniButton ariaLabel="Go to previous filtered position" disabled={!canGoPrevious} onClick={() => onNavigate(rowIndex - 1)}>Previous</MiniButton>
            <p style={{ color: "#9ca3af", fontSize: "12px", alignSelf: "center" }}>
              {rowIndex + 1} / {rows.length}
            </p>
            <MiniButton ariaLabel="Go to next filtered position" disabled={!canGoNext} onClick={() => onNavigate(rowIndex + 1)}>Next</MiniButton>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "16px" }}>
            {[
              ["Side", position.type || position.side || "-"],
              ["Lot", position.lot || "-"],
              ["Entry", position.entry || "-"],
              ["P&L", position.pnl || "-"]
            ].map(([label, value]) => (
              <div key={label} style={{ backgroundColor: "#0b1220", border: "1px solid #1f2937", borderRadius: "14px", padding: "13px" }}>
                <p style={{ color: "#9ca3af", fontSize: "12px", marginBottom: "7px" }}>{label}</p>
                <p style={{ color: label === "P&L" ? getPnlColor(value) : "#f9fafb", fontWeight: "bold" }}>{value}</p>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: "#0b1220", border: "1px solid #1f2937", borderRadius: "16px", padding: "16px", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
              <div>
                <p style={{ color: "#f9fafb", fontWeight: "bold", marginBottom: "5px" }}>Risk / Reward</p>
                <p style={{ color: "#9ca3af", fontSize: "13px" }}>SL, entry, TP, and current plan quality.</p>
              </div>
              <span style={{ color: risk.color, border: `1px solid ${risk.color}`, borderRadius: "999px", padding: "7px 10px", fontSize: "12px", fontWeight: "bold", height: "fit-content" }}>
                {risk.label}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              <div><p style={{ color: "#9ca3af", fontSize: "12px" }}>SL</p><p style={{ color: "#f87171", fontWeight: "bold" }}>{position.sl || "-"}</p></div>
              <div><p style={{ color: "#9ca3af", fontSize: "12px" }}>Entry</p><p style={{ color: "#f9fafb", fontWeight: "bold" }}>{position.entry || "-"}</p></div>
              <div><p style={{ color: "#9ca3af", fontSize: "12px" }}>TP</p><p style={{ color: "#86efac", fontWeight: "bold" }}>{position.tp || "-"}</p></div>
            </div>
            <p style={{ color: "#9ca3af", fontSize: "12px", marginTop: "10px" }}>{risk.helper}</p>
          </div>

          <div style={{ backgroundColor: "#0b1220", border: "1px solid #1f2937", borderRadius: "16px", padding: "16px", marginBottom: "16px" }}>
            <p style={{ color: "#f9fafb", fontWeight: "bold", marginBottom: "10px" }}>Thesis Tags</p>
            {Array.isArray(position.tags) && position.tags.length > 0 ? (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {position.tags.map((tag) => (
                  <span key={tag} style={{ color: "#38bdf8", border: "1px solid #38bdf8", borderRadius: "999px", padding: "6px 9px", fontSize: "12px", fontWeight: "bold" }}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: "#6b7280", fontSize: "13px" }}>No thesis tags saved.</p>
            )}
          </div>

          <div style={{ backgroundColor: "#0b1220", border: "1px solid #1f2937", borderRadius: "16px", padding: "16px" }}>
            <p style={{ color: "#f9fafb", fontWeight: "bold", marginBottom: "10px" }}>Activity Timeline</p>
            {relatedActivity.length > 0 ? (
              <div style={{ display: "grid", gap: "10px" }}>
                {relatedActivity.map((item, index) => (
                  <div key={`${item.date}-${item.type}-${index}`} style={{ borderLeft: "1px solid #374151", paddingLeft: "12px" }}>
                    <p style={{ color: "#d1d5db", fontSize: "12px", fontWeight: "bold" }}>{item.type || "ACTIVITY"}</p>
                    <p style={{ color: "#9ca3af", fontSize: "12px", lineHeight: "1.45" }}>{item.detail || "-"}</p>
                    <p style={{ color: "#6b7280", fontSize: "11px", marginTop: "4px" }}>{item.date || "-"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#6b7280", fontSize: "13px" }}>No local activity yet for this symbol.</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}

function ConfirmModal({ open, title, description, confirmLabel, onCancel, onConfirm }) {
  const modalRef = useRef(null)

  useFocusTrap({
    enabled: open,
    containerRef: modalRef,
    onEscape: onCancel
  })

  if (!open) return null

  return (
    <div role="presentation" style={{ position: "fixed", inset: 0, zIndex: 95, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <button type="button" aria-label="Cancel" onClick={onCancel} style={{ position: "absolute", inset: 0, border: "none", backgroundColor: "rgba(2, 6, 23, 0.74)", backdropFilter: "blur(8px)" }} />
      <section ref={modalRef} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} style={{ position: "relative", width: "min(460px, 100%)", background: "linear-gradient(135deg, rgba(17, 24, 39, 0.99), rgba(15, 23, 42, 0.99))", border: "1px solid #374151", borderRadius: "20px", boxShadow: "0 30px 80px rgba(0, 0, 0, 0.45)", padding: "22px" }}>
        <h3 style={{ color: "#f9fafb", marginBottom: "8px" }}>{title}</h3>
        <p style={{ color: "#9ca3af", lineHeight: "1.6", marginBottom: "18px" }}>{description}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <MiniButton ariaLabel="Cancel close action" onClick={onCancel}>Cancel</MiniButton>
          <MiniButton ariaLabel={confirmLabel} danger onClick={onConfirm}>{confirmLabel}</MiniButton>
        </div>
      </section>
    </div>
  )
}

function OpenPositionsTable({
  positions = [],
  activityItems = [],
  workstationView,
  onWorkstationViewChange,
  layouts = [],
  selectedLayout,
  onApplyLayout,
  onResetView,
  searchInputRef,
  selectedSymbol = "",
  onSelectSymbol,
  onOpenAuditLog,
  onAuditRecord,
  onPositionsChange,
  onPositionsClosed,
  onToast,
  closeDrawerSignal = 0
}) {
  const [hoveredRow, setHoveredRow] = useState(null)
  const [selectedRows, setSelectedRows] = useState([])
  const [activeRowId, setActiveRowId] = useState("")
  const [drawerRowId, setDrawerRowId] = useState("")
  const [confirmClose, setConfirmClose] = useState(null)

  const safePositions = Array.isArray(positions) ? positions : []
  const view = normalizeView(workstationView)
  const pinnedRows = useMemo(() => new Set(view.pinnedRows), [view.pinnedRows])
  const visibleColumns = useMemo(() => new Set(view.visibleColumns), [view.visibleColumns])

  const rows = useMemo(() => {
    return safePositions.map((position, index) => ({
      id: getPositionId(position, index),
      position,
      index,
      risk: getPositionRisk(position)
    }))
  }, [safePositions])

  const updateView = (patch) => {
    const nextPatch = typeof patch === "function" ? patch(view) : patch
    onWorkstationViewChange?.({
      ...view,
      ...nextPatch
    })
  }

  const filteredRows = useMemo(() => {
    const searchText = view.searchQuery.trim().toLowerCase()

    return rows
      .filter((row) => {
        const position = row.position
        const pnl = parsePnl(position.pnl)
        const hasNote = Boolean(position.note)
        const hasTags = Array.isArray(position.tags) && position.tags.length > 0
        const highRisk = ["WEAK", "INVALID"].includes(row.risk.label)

        if (searchText) {
          const combinedText = [
            position.symbol,
            position.type,
            position.side,
            position.lot,
            position.entry,
            position.sl,
            position.tp,
            position.pnl,
            position.note,
            hasTags ? position.tags.join(" ") : ""
          ].join(" ").toLowerCase()

          if (!combinedText.includes(searchText)) return false
        }

        if (view.quickFilter === "PROFITABLE" && pnl <= 0) return false
        if (view.quickFilter === "LOSING" && pnl >= 0) return false
        if (view.quickFilter === "HIGH_RISK" && !highRisk) return false
        if (view.quickFilter === "HAS_NOTE" && !hasNote) return false

        if (view.advancedFilters.includes("Has Note") && !hasNote) return false
        if (view.advancedFilters.includes("Has Tags") && !hasTags) return false
        if (view.advancedFilters.includes("High Risk") && !highRisk) return false
        if (view.advancedFilters.includes("Profitable") && pnl <= 0) return false
        if (view.advancedFilters.includes("Losing") && pnl >= 0) return false
        if (view.advancedFilters.includes("Pinned") && !pinnedRows.has(row.id)) return false

        return true
      })
      .sort((a, b) => {
        const aPinned = pinnedRows.has(a.id) ? 1 : 0
        const bPinned = pinnedRows.has(b.id) ? 1 : 0

        if (aPinned !== bPinned) return bPinned - aPinned

        const direction = view.sortDirection === "asc" ? 1 : -1
        const sorters = {
          symbol: () => String(a.position.symbol || "").localeCompare(String(b.position.symbol || "")),
          side: () => getPositionSide(a.position).localeCompare(getPositionSide(b.position)),
          entry: () => parseNumber(a.position.entry) - parseNumber(b.position.entry),
          pnl: () => parsePnl(a.position.pnl) - parsePnl(b.position.pnl),
          risk: () => a.risk.score - b.risk.score
        }

        return (sorters[view.sortBy]?.() ?? 0) * direction
      })
  }, [pinnedRows, rows, view])

  const filteredRowIds = useMemo(() => filteredRows.map((row) => row.id), [filteredRows])
  const renderedRows = useMemo(() => filteredRows.slice(0, TABLE_RENDER_LIMIT), [filteredRows])
  const renderedRowIds = useMemo(() => renderedRows.map((row) => row.id), [renderedRows])
  const renderLimitReached = filteredRows.length > renderedRows.length
  const selectedVisibleRows = selectedRows.filter((id) => renderedRowIds.includes(id))
  const selectedVisibleCount = selectedVisibleRows.length
  const allVisibleSelected = renderedRows.length > 0 && selectedVisibleCount === renderedRows.length
  const drawerRow = filteredRows.find((row) => row.id === drawerRowId)
  const rowPadding = view.density === "compact" ? "10px 12px" : "16px 12px"

  useEffect(() => {
    setDrawerRowId("")
  }, [closeDrawerSignal])

  useEffect(() => {
    setSelectedRows((current) => current.filter((id) => filteredRowIds.includes(id)))
  }, [filteredRowIds.join("|")])

  useEffect(() => {
    if (filteredRows.length === 0) {
      setActiveRowId("")
      return
    }

    if (!activeRowId || !filteredRows.some((row) => row.id === activeRowId)) {
      setActiveRowId(filteredRows[0].id)
    }
  }, [activeRowId, filteredRows])

  const totalPositions = filteredRows.length
  const buyPositions = filteredRows.filter((row) => getPositionSide(row.position) === "BUY").length
  const sellPositions = filteredRows.filter((row) => getPositionSide(row.position) === "SELL").length
  const totalFloatingPnl = filteredRows.reduce((total, row) => total + parsePnl(row.position.pnl), 0)
  const winningPositions = filteredRows.filter((row) => parsePnl(row.position.pnl) > 0).length
  const losingPositions = filteredRows.filter((row) => parsePnl(row.position.pnl) < 0).length
  const totalLot = filteredRows.reduce((total, row) => total + parseNumber(row.position.lot), 0)
  const highRiskCount = filteredRows.filter((row) => ["WEAK", "INVALID"].includes(row.risk.label)).length

  const portfolioBias =
    buyPositions > sellPositions
      ? "LONG BIAS"
      : sellPositions > buyPositions
        ? "SHORT BIAS"
        : totalPositions === 0
          ? "NO EXPOSURE"
          : "BALANCED"

  const portfolioBiasColor =
    portfolioBias === "LONG BIAS"
      ? "#86efac"
      : portfolioBias === "SHORT BIAS"
        ? "#f87171"
        : portfolioBias === "BALANCED"
          ? "#38bdf8"
          : "#9ca3af"

  const pnlColor = totalFloatingPnl > 0 ? "#86efac" : totalFloatingPnl < 0 ? "#f87171" : "#d1d5db"
  const exposureLevel = totalPositions === 0 ? "NONE" : totalPositions <= 1 ? "LOW" : totalPositions <= 3 ? "MEDIUM" : "HIGH"
  const exposureColor = exposureLevel === "NONE" ? "#9ca3af" : exposureLevel === "LOW" ? "#86efac" : exposureLevel === "MEDIUM" ? "#facc15" : "#f87171"

  const summaryCardStyle = {
    background: "linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(11, 18, 32, 0.98))",
    border: "1px solid rgba(55, 65, 81, 0.78)",
    borderRadius: "18px",
    padding: "16px",
    boxShadow: "0 14px 32px rgba(0, 0, 0, 0.2)"
  }

  const summaryLabelStyle = { color: "#9ca3af", fontSize: "13px", marginBottom: "8px" }
  const summaryValueStyle = { color: "#d1d5db", fontSize: "20px", fontWeight: "bold", letterSpacing: "-0.02em" }
  const cellStyle = { padding: rowPadding, color: "#d1d5db", verticalAlign: "middle" }
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

  const toggleSelected = (rowId) => {
    setSelectedRows((current) =>
      current.includes(rowId)
        ? current.filter((id) => id !== rowId)
        : [...current, rowId]
    )
  }

  const togglePinned = (rowId) => {
    updateView((current) => {
      const currentPinned = current.pinnedRows || []
      const nextPinned = currentPinned.includes(rowId)
        ? currentPinned.filter((id) => id !== rowId)
        : [...currentPinned, rowId]

      return { pinnedRows: nextPinned }
    })
    onAuditRecord?.("PINNED_ROW", `Pinned rows updated for ${rowId}.`)
    onToast?.({
      variant: "info",
      title: "View/layout saved",
      message: "Pinned rows updated.",
      duration: 2600,
      dedupeKey: "view-saved"
    })
  }

  const openDrawer = (rowId) => {
    setDrawerRowId(rowId)
    setActiveRowId(rowId)
    const row = rows.find((item) => item.id === rowId)
    onAuditRecord?.("DRAWER_OPENED", `Position drawer opened for ${row?.position?.symbol || "position"}.`)
  }

  const handleNavigateDrawer = (nextIndex) => {
    const nextRow = filteredRows[nextIndex]
    if (!nextRow) return
    setDrawerRowId(nextRow.id)
    setActiveRowId(nextRow.id)
  }

  const handleSelectAllVisible = () => {
    setSelectedRows((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !renderedRowIds.includes(id))
      }

      return Array.from(new Set([...current, ...renderedRowIds]))
    })
  }

  const closeRows = (rowIds) => {
    const closingIds = new Set(rowIds)
    const closingRows = rows.filter((row) => closingIds.has(row.id))

    if (closingRows.length === 0) return

    const nextPositions = safePositions.filter((position, index) => {
      return !closingIds.has(getPositionId(position, index))
    })
    const historyRecords = closingRows.map((row) =>
      makeHistoryRecord(
        "CLOSE",
        row.position,
        `Closed ${row.position.type || row.position.side || "position"} ${row.position.symbol || ""} from workstation.`
      )
    )

    if (onPositionsClosed) {
      onPositionsClosed({
        closingRows,
        nextPositions,
        historyRecords,
        mode: closingRows.length > 1 ? "bulk" : "single"
      })
    } else {
      onPositionsChange?.(nextPositions, historyRecords)
      onAuditRecord?.(
        closingRows.length > 1 ? "BULK_CLOSE" : "POSITION_CLOSED",
        closingRows.length > 1
          ? `Bulk closed ${closingRows.length} selected positions.`
          : `Closed ${closingRows[0].position.symbol || "position"}.`
      )
      onToast?.({
        variant: "success",
        title: closingRows.length > 1 ? "Bulk close completed" : "Position closed",
        message: closingRows.length > 1
          ? `${closingRows.length} positions removed from the active book.`
          : `${closingRows[0].position.symbol || "Position"} removed from the active book.`
      })
    }

    setSelectedRows((current) =>
      current.filter((id) => !closingIds.has(id))
    )
    setDrawerRowId((current) =>
      closingIds.has(current) ? "" : current
    )
  }

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      if (drawerRowId) setDrawerRowId("")
      return
    }

    if (isTypingTarget(event.target) || renderedRows.length === 0) return

    const activeIndex = Math.max(0, renderedRows.findIndex((row) => row.id === activeRowId))

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveRowId(renderedRows[Math.min(renderedRows.length - 1, activeIndex + 1)].id)
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveRowId(renderedRows[Math.max(0, activeIndex - 1)].id)
    }

    if (event.key === "Enter" && activeRowId) {
      event.preventDefault()
      openDrawer(activeRowId)
    }
  }

  const renderCell = (row, columnId) => {
    const position = row.position
    const side = getPositionSide(position)
    const sideColor = getTypeColor(side)

    if (columnId === "symbol") {
      return (
        <button
          type="button"
          aria-label={`Focus chart on ${position.symbol || "position"}`}
          onClick={(event) => {
            event.stopPropagation()
            onSelectSymbol?.(position.symbol)
          }}
          style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "9px", height: "9px", borderRadius: "999px", backgroundColor: sideColor, boxShadow: `0 0 16px ${sideColor}` }} />
            <span>
              <span style={{ color: "#f9fafb", display: "block", fontWeight: "bold", marginBottom: "4px" }}>
                {position.symbol || "-"}
              </span>
              <span style={{ color: pinnedRows.has(row.id) ? "#facc15" : "#6b7280", fontSize: "12px" }}>
                {pinnedRows.has(row.id) ? "Pinned" : `Position #${row.index + 1}`}
              </span>
            </span>
          </span>
        </button>
      )
    }

    if (columnId === "side") {
      return (
        <span style={{ display: "inline-flex", justifyContent: "center", minWidth: "72px", padding: "7px 10px", borderRadius: "999px", backgroundColor: side === "BUY" ? "rgba(20, 83, 45, 0.36)" : "rgba(127, 29, 29, 0.36)", border: `1px solid ${sideColor}`, color: sideColor, fontWeight: "bold", fontSize: "12px" }}>
          {side}
        </span>
      )
    }

    if (columnId === "lot") return <strong>{position.lot || "-"}</strong>
    if (columnId === "entry") return <strong>{position.entry || "-"}</strong>
    if (columnId === "sl") return <strong style={{ color: "#f87171" }}>{position.sl || "-"}</strong>
    if (columnId === "tp") return <strong style={{ color: "#86efac" }}>{position.tp || "-"}</strong>
    if (columnId === "pnl") return <strong style={{ color: getPnlColor(position.pnl) }}>{position.pnl || "-"}</strong>

    if (columnId === "risk") {
      return (
        <span style={{ display: "inline-flex", flexDirection: "column", gap: "5px", minWidth: "92px" }}>
          <span style={{ display: "inline-flex", justifyContent: "center", padding: "7px 10px", borderRadius: "999px", backgroundColor: "rgba(17, 24, 39, 0.9)", border: `1px solid ${row.risk.color}`, color: row.risk.color, fontWeight: "bold", fontSize: "12px" }}>
            {row.risk.label}
          </span>
          <span style={{ color: "#6b7280", fontSize: "12px" }}>{row.risk.helper}</span>
        </span>
      )
    }

    if (columnId === "tags") {
      const tags = Array.isArray(position.tags) ? position.tags : []
      return tags.length > 0 ? <span style={{ color: "#38bdf8", fontWeight: "bold" }}>{tags.length} tags</span> : <span style={{ color: "#6b7280" }}>No tags</span>
    }

    if (columnId === "note") {
      return (
        <span style={{ color: position.note ? "#d1d5db" : "#6b7280", display: "inline-block", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {position.note || "No note"}
        </span>
      )
    }

    return "-"
  }

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Positions workstation"
      style={{
        background: "linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(15, 23, 42, 0.96))",
        border: "1px solid rgba(55, 65, 81, 0.76)",
        borderRadius: "24px",
        padding: "24px",
        marginBottom: "24px",
        boxShadow: "0 22px 52px rgba(0, 0, 0, 0.24)",
        outline: "none",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, #38bdf8, #84cc16, rgba(56, 189, 248, 0.2))" }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "18px", flexWrap: "wrap", marginBottom: "18px" }}>
          <div>
            <p style={{ color: "#38bdf8", fontSize: "12px", fontWeight: "bold", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "10px" }}>
              Positions Workstation
            </p>
            <h3 style={{ color: "#f9fafb", fontSize: "24px", marginBottom: "8px", letterSpacing: "-0.02em" }}>
              Open Positions
            </h3>
            <p style={{ color: "#9ca3af", fontSize: "14px", lineHeight: "1.7", maxWidth: "760px" }}>
              Search, filter, pin, select, review, and close trades from one focused workstation.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <span style={{ backgroundColor: "rgba(11, 18, 32, 0.9)", border: `1px solid ${portfolioBiasColor}`, borderRadius: "999px", padding: "9px 14px", color: portfolioBiasColor, fontSize: "12px", fontWeight: "bold", letterSpacing: "0.08em" }}>
              {portfolioBias}
            </span>
            <MiniButton ariaLabel="Open audit log drawer" onClick={onOpenAuditLog}>Audit Log</MiniButton>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) minmax(160px, 210px) minmax(130px, 170px)", gap: "10px", marginBottom: "12px" }}>
          <input
            ref={searchInputRef}
            aria-label="Search positions"
            value={view.searchQuery}
            onChange={(event) => updateView({ searchQuery: event.target.value })}
            placeholder="Search symbol, side, note, tag..."
            style={{ backgroundColor: "#0b1220", border: "1px solid #374151", borderRadius: "12px", color: "#f9fafb", fontSize: "14px", outline: "none", padding: "11px 12px" }}
          />

          <select
            aria-label="Apply saved workstation layout"
            value={selectedLayout || ""}
            onChange={(event) => onApplyLayout?.(event.target.value)}
            style={{ backgroundColor: "#0b1220", border: "1px solid #374151", borderRadius: "12px", color: "#f9fafb", fontSize: "14px", outline: "none", padding: "11px 12px" }}
          >
            {layouts.map((layout) => (
              <option key={layout.name} value={layout.name}>{layout.name}</option>
            ))}
          </select>

          <select
            aria-label="Filter positions"
            value={view.quickFilter}
            onChange={(event) => updateView({ quickFilter: event.target.value })}
            style={{ backgroundColor: "#0b1220", border: "1px solid #374151", borderRadius: "12px", color: "#f9fafb", fontSize: "14px", outline: "none", padding: "11px 12px" }}
          >
            <option value="ALL">All positions</option>
            <option value="PROFITABLE">Profitable</option>
            <option value="LOSING">Losing</option>
            <option value="HIGH_RISK">High risk</option>
            <option value="HAS_NOTE">Has note</option>
          </select>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {advancedFilterOptions.map((filter) => (
              <MiniButton
                key={filter}
                ariaLabel={`Toggle advanced filter ${filter}`}
                active={view.advancedFilters.includes(filter)}
                onClick={() => {
                  updateView((current) => ({
                    advancedFilters: current.advancedFilters.includes(filter)
                      ? current.advancedFilters.filter((item) => item !== filter)
                      : [...current.advancedFilters, filter]
                  }))
                }}
              >
                {filter}
              </MiniButton>
            ))}
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <select
              aria-label="Sort positions"
              value={view.sortBy}
              onChange={(event) => updateView({ sortBy: event.target.value })}
              style={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: "12px", color: "#d1d5db", fontSize: "12px", fontWeight: "bold", padding: "9px 10px" }}
            >
              <option value="pnl">Sort P&L</option>
              <option value="risk">Sort Risk</option>
              <option value="symbol">Sort Symbol</option>
              <option value="side">Sort Side</option>
              <option value="entry">Sort Entry</option>
            </select>
            <MiniButton ariaLabel="Toggle sort direction" onClick={() => updateView({ sortDirection: view.sortDirection === "asc" ? "desc" : "asc" })}>
              {view.sortDirection === "asc" ? "Ascending" : "Descending"}
            </MiniButton>
            <MiniButton
              ariaLabel="Toggle table density"
              onClick={() => {
                updateView({ density: view.density === "compact" ? "comfortable" : "compact" })
                onToast?.({
                  variant: "info",
                  title: "View/layout saved",
                  message: "Table density updated.",
                  duration: 2600,
                  dedupeKey: "view-saved"
                })
              }}
            >
              {view.density === "compact" ? "Compact" : "Comfortable"}
            </MiniButton>
            <MiniButton ariaLabel="Reset positions workstation view" onClick={onResetView}>Reset View</MiniButton>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(120px, 1fr))", gap: "14px", marginBottom: "18px" }}>
          <div style={summaryCardStyle}><p style={summaryLabelStyle}>Visible</p><p style={summaryValueStyle}>{totalPositions}</p></div>
          <div style={summaryCardStyle}><p style={summaryLabelStyle}>Selected</p><p style={summaryValueStyle}>{selectedVisibleCount}</p></div>
          <div style={summaryCardStyle}><p style={summaryLabelStyle}>Floating P&L</p><p style={{ ...summaryValueStyle, color: pnlColor }}>{totalFloatingPnl >= 0 ? "+" : ""}{totalFloatingPnl.toFixed(2)}</p></div>
          <div style={summaryCardStyle}><p style={summaryLabelStyle}>BUY / SELL</p><p style={summaryValueStyle}><span style={{ color: "#86efac" }}>{buyPositions}</span><span style={{ color: "#6b7280" }}> / </span><span style={{ color: "#f87171" }}>{sellPositions}</span></p></div>
          <div style={summaryCardStyle}><p style={summaryLabelStyle}>Win / Loss</p><p style={summaryValueStyle}><span style={{ color: "#86efac" }}>{winningPositions}</span><span style={{ color: "#6b7280" }}> / </span><span style={{ color: "#f87171" }}>{losingPositions}</span></p></div>
          <div style={summaryCardStyle}><p style={summaryLabelStyle}>Risk</p><p style={{ ...summaryValueStyle, color: highRiskCount > 0 ? "#f87171" : exposureColor }}>{highRiskCount > 0 ? `${highRiskCount} high` : exposureLevel}</p></div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
          <p style={{ color: "#6b7280", fontSize: "12px", lineHeight: "1.5" }}>
            Focus this workstation, then use Arrow Up/Down and Enter to open review. Esc closes the drawer.
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <MiniButton ariaLabel={`Bulk close ${selectedVisibleCount} selected positions`} disabled={selectedVisibleCount === 0} danger={selectedVisibleCount > 0} onClick={() => setConfirmClose({ mode: "bulk" })}>
              Bulk Close Selected
            </MiniButton>
          </div>
        </div>

        {renderLimitReached ? (
          <div
            role="note"
            style={{
              backgroundColor: "rgba(120, 53, 15, 0.22)",
              border: "1px solid rgba(245, 158, 11, 0.42)",
              borderRadius: "14px",
              color: "#fde68a",
              fontSize: "12px",
              lineHeight: "1.5",
              marginBottom: "12px",
              padding: "10px 12px"
            }}
          >
            Showing first {TABLE_RENDER_LIMIT} of {filteredRows.length} matching positions. Narrow filters for full precision.
          </div>
        ) : null}

        <div style={{ backgroundColor: "#0b1220", border: "1px solid #1f2937", borderRadius: "20px", padding: "18px", overflowX: "auto" }}>
          <table role="grid" aria-rowcount={filteredRows.length} style={{ width: "100%", borderCollapse: "collapse", minWidth: "1040px" }}>
            <thead>
              <tr>
                <th style={{ ...headerCellStyle, width: "42px" }}>
                  <input
                    type="checkbox"
                    aria-label="Select all rendered positions"
                    checked={allVisibleSelected}
                    onChange={handleSelectAllVisible}
                  />
                </th>
                {columns.filter((column) => visibleColumns.has(column.id)).map((column) => (
                  <th key={column.id} style={headerCellStyle}>{column.label}</th>
                ))}
                <th style={{ ...headerCellStyle, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.size + 2} style={{ padding: "28px 12px", color: "#9ca3af", textAlign: "center", borderTop: "1px solid #1f2937" }}>
                    No positions match this view.
                  </td>
                </tr>
              ) : (
                renderedRows.map((row) => {
                  const selected = selectedRows.includes(row.id)
                  const active = activeRowId === row.id
                  const symbolMatch = selectedSymbol && row.position.symbol === selectedSymbol
                  const rowIsHovered = hoveredRow === row.id

                  return (
                    <tr
                      key={row.id}
                      aria-selected={selected || active}
                      aria-current={active ? "true" : undefined}
                      onMouseEnter={() => setHoveredRow(row.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      onClick={() => setActiveRowId(row.id)}
                      onDoubleClick={() => openDrawer(row.id)}
                      style={{
                        borderTop: "1px solid #1f2937",
                        backgroundColor: active
                          ? "rgba(132, 204, 22, 0.12)"
                          : selected
                            ? "rgba(56, 189, 248, 0.1)"
                            : symbolMatch
                              ? "rgba(56, 189, 248, 0.16)"
                              : rowIsHovered
                                ? "rgba(31, 41, 55, 0.54)"
                                : "transparent",
                        outline: active ? "1px solid rgba(132, 204, 22, 0.45)" : "none",
                        transition: "background-color 0.18s ease"
                      }}
                    >
                      <td style={cellStyle}>
                        <input
                          type="checkbox"
                          aria-label={`Select ${row.position.symbol || "position"}`}
                          checked={selected}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => {
                            event.stopPropagation()
                            toggleSelected(row.id)
                          }}
                        />
                      </td>

                      {columns.filter((column) => visibleColumns.has(column.id)).map((column) => (
                        <td key={column.id} style={cellStyle}>{renderCell(row, column.id)}</td>
                      ))}

                      <td style={{ ...cellStyle, textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                          <MiniButton ariaLabel={`${pinnedRows.has(row.id) ? "Unpin" : "Pin"} ${row.position.symbol || "position"}`} onClick={(event) => { event.stopPropagation(); togglePinned(row.id) }}>
                            {pinnedRows.has(row.id) ? "Unpin" : "Pin"}
                          </MiniButton>
                          <MiniButton ariaLabel={`Open ${row.position.symbol || "position"} review drawer`} onClick={(event) => { event.stopPropagation(); openDrawer(row.id) }}>
                            Open
                          </MiniButton>
                          <MiniButton ariaLabel={`Close ${row.position.symbol || "position"}`} danger onClick={(event) => { event.stopPropagation(); setConfirmClose({ mode: "single", rowId: row.id }) }}>
                            Close
                          </MiniButton>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReviewDrawer
        row={drawerRow}
        rows={filteredRows}
        activityItems={activityItems}
        onClose={() => setDrawerRowId("")}
        onNavigate={handleNavigateDrawer}
      />

      <ConfirmModal
        open={Boolean(confirmClose)}
        title={confirmClose?.mode === "bulk" ? "Close selected positions?" : "Close position?"}
        description={
          confirmClose?.mode === "bulk"
            ? `This removes ${selectedVisibleCount} selected visible position(s) from the local active book.`
            : "This removes one position from the local active book."
        }
        confirmLabel={confirmClose?.mode === "bulk" ? "Close selected" : "Close position"}
        onCancel={() => setConfirmClose(null)}
        onConfirm={() => {
          if (confirmClose?.mode === "bulk") closeRows(selectedVisibleRows)
          if (confirmClose?.mode === "single") closeRows([confirmClose.rowId])
          setConfirmClose(null)
        }}
      />
    </div>
  )
}

export default OpenPositionsTable
