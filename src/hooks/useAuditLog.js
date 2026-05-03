import { useCallback, useState } from "react"
import { readLocalStorage, writeLocalStorage } from "../lib/storage"

const AUDIT_STORAGE_KEY = "ai-trading-dashboard.audit-log.v1"
const MAX_AUDIT_RECORDS = 120

function makeAuditRecord(type, detail, meta = {}) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    detail,
    meta,
    date: new Date().toLocaleString()
  }
}

export function useAuditLog() {
  const [records, setRecords] = useState(() => readLocalStorage(AUDIT_STORAGE_KEY, []))

  const addAuditRecord = useCallback((type, detail, meta = {}) => {
    const record = makeAuditRecord(type, detail, meta)

    setRecords((current) => {
      const nextRecords = [record, ...current].slice(0, MAX_AUDIT_RECORDS)
      writeLocalStorage(AUDIT_STORAGE_KEY, nextRecords)
      return nextRecords
    })

    return record
  }, [])

  const clearAuditLog = useCallback(() => {
    setRecords([])
    writeLocalStorage(AUDIT_STORAGE_KEY, [])
  }, [])

  return {
    auditRecords: records,
    addAuditRecord,
    clearAuditLog
  }
}
