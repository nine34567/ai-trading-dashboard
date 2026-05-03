export const DEFAULT_VISIBLE_COLUMNS = [
  "symbol",
  "side",
  "lot",
  "entry",
  "sl",
  "tp",
  "pnl",
  "risk",
  "tags",
  "note"
]

export const DEFAULT_WORKSTATION_VIEW = {
  searchQuery: "",
  quickFilter: "ALL",
  sortBy: "pnl",
  sortDirection: "desc",
  density: "comfortable",
  visibleColumns: DEFAULT_VISIBLE_COLUMNS,
  pinnedRows: [],
  advancedFilters: []
}

export const WORKSTATION_LAYOUTS = [
  {
    name: "Risk First",
    description: "Prioritize weak plans and risk review.",
    view: {
      quickFilter: "HIGH_RISK",
      sortBy: "risk",
      sortDirection: "desc",
      density: "compact",
      visibleColumns: ["symbol", "side", "entry", "sl", "tp", "pnl", "risk", "note"],
      advancedFilters: ["High Risk"]
    }
  },
  {
    name: "Profit Lock",
    description: "Focus profitable trades that may need protection.",
    view: {
      quickFilter: "PROFITABLE",
      sortBy: "pnl",
      sortDirection: "desc",
      density: "comfortable",
      visibleColumns: ["symbol", "side", "lot", "entry", "sl", "tp", "pnl", "risk", "tags"],
      advancedFilters: ["Profitable"]
    }
  },
  {
    name: "Clean Book",
    description: "Compact all-position scan with fewer columns.",
    view: {
      quickFilter: "ALL",
      sortBy: "symbol",
      sortDirection: "asc",
      density: "compact",
      visibleColumns: ["symbol", "side", "lot", "pnl", "risk"],
      advancedFilters: []
    }
  },
  {
    name: "Execution Review",
    description: "Review notes, tags, and plan quality.",
    view: {
      quickFilter: "HAS_NOTE",
      sortBy: "risk",
      sortDirection: "desc",
      density: "comfortable",
      visibleColumns: DEFAULT_VISIBLE_COLUMNS,
      advancedFilters: ["Has Note", "Has Tags"]
    }
  }
]

export function getLayoutByName(layoutName) {
  return WORKSTATION_LAYOUTS.find((layout) => layout.name === layoutName) || null
}

export function applyLayoutToView(currentView, layoutName) {
  const layout = getLayoutByName(layoutName)

  if (!layout) {
    return {
      ...DEFAULT_WORKSTATION_VIEW,
      ...currentView
    }
  }

  return {
    ...DEFAULT_WORKSTATION_VIEW,
    ...currentView,
    ...layout.view
  }
}
