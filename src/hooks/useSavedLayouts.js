import { useCallback, useState } from "react"
import { readLocalStorage, writeLocalStorage } from "../lib/storage"
import {
  DEFAULT_WORKSTATION_VIEW,
  WORKSTATION_LAYOUTS,
  applyLayoutToView
} from "../lib/workstationLayouts"

const WORKSTATION_VIEW_KEY = "ai-trading-dashboard.workstation-view.v1"
const WORKSTATION_LAYOUT_KEY = "ai-trading-dashboard.selected-layout.v1"

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

export function useSavedLayouts() {
  const [workstationView, setWorkstationViewState] = useState(() =>
    normalizeView(readLocalStorage(WORKSTATION_VIEW_KEY, DEFAULT_WORKSTATION_VIEW))
  )
  const [selectedLayout, setSelectedLayoutState] = useState(() =>
    readLocalStorage(WORKSTATION_LAYOUT_KEY, "Clean Book")
  )

  const setWorkstationView = useCallback((nextView) => {
    setWorkstationViewState((current) => {
      const resolvedView =
        typeof nextView === "function" ? nextView(normalizeView(current)) : nextView
      const normalizedView = normalizeView(resolvedView)

      writeLocalStorage(WORKSTATION_VIEW_KEY, normalizedView)
      return normalizedView
    })
  }, [])

  const applyLayout = useCallback((layoutName) => {
    setWorkstationViewState((current) => {
      const nextView = applyLayoutToView(normalizeView(current), layoutName)

      writeLocalStorage(WORKSTATION_VIEW_KEY, nextView)
      return nextView
    })
    setSelectedLayoutState(layoutName)
    writeLocalStorage(WORKSTATION_LAYOUT_KEY, layoutName)
  }, [])

  const resetWorkstationView = useCallback(() => {
    setWorkstationViewState(DEFAULT_WORKSTATION_VIEW)
    setSelectedLayoutState("Clean Book")
    writeLocalStorage(WORKSTATION_VIEW_KEY, DEFAULT_WORKSTATION_VIEW)
    writeLocalStorage(WORKSTATION_LAYOUT_KEY, "Clean Book")
  }, [])

  const toggleDensity = useCallback(() => {
    setWorkstationView((current) => ({
      ...current,
      density: current.density === "compact" ? "comfortable" : "compact"
    }))
  }, [setWorkstationView])

  return {
    workstationView,
    setWorkstationView,
    selectedLayout,
    layouts: WORKSTATION_LAYOUTS,
    applyLayout,
    resetWorkstationView,
    toggleDensity
  }
}
