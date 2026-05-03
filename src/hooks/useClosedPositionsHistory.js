import { useCallback, useState } from "react"
import { readLocalStorage, writeLocalStorage } from "../lib/storage"

const CLOSED_POSITIONS_STORAGE_KEY = "ai-trading-dashboard.closed-positions.v1"
const MAX_CLOSED_POSITIONS = 80

function normalizeClosedRecord(record) {
  return {
    id: record.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    closedAt: record.closedAt || new Date().toISOString(),
    rowId: record.rowId || "",
    position: record.position || {},
    mode: record.mode || "single"
  }
}

export function useClosedPositionsHistory() {
  const [closedPositions, setClosedPositions] = useState(() => {
    const storedValue = readLocalStorage(CLOSED_POSITIONS_STORAGE_KEY, [])
    return Array.isArray(storedValue) ? storedValue : []
  })

  const addClosedPositions = useCallback((records) => {
    const nextRecords = Array.isArray(records)
      ? records.map(normalizeClosedRecord)
      : []

    if (nextRecords.length === 0) return []

    setClosedPositions((current) => {
      const nextValue = [...nextRecords, ...current].slice(0, MAX_CLOSED_POSITIONS)
      writeLocalStorage(CLOSED_POSITIONS_STORAGE_KEY, nextValue)
      return nextValue
    })

    return nextRecords
  }, [])

  const removeClosedPositions = useCallback((recordIds) => {
    const ids = new Set(Array.isArray(recordIds) ? recordIds : [])

    setClosedPositions((current) => {
      const nextValue = current.filter((record) => !ids.has(record.id))
      writeLocalStorage(CLOSED_POSITIONS_STORAGE_KEY, nextValue)
      return nextValue
    })
  }, [])

  return {
    closedPositions,
    addClosedPositions,
    removeClosedPositions
  }
}
