import { useRef } from "react"
import { useFocusTrap } from "../../hooks/useFocusTrap"

function AuditLogDrawer({ open, records = [], onClose, onClear }) {
  const drawerRef = useRef(null)

  useFocusTrap({
    enabled: open,
    containerRef: drawerRef,
    onEscape: onClose
  })

  if (!open) return null

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100
      }}
    >
      <button
        type="button"
        aria-label="Close audit log"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          border: "none",
          backgroundColor: "rgba(2, 6, 23, 0.58)",
          backdropFilter: "blur(8px)"
        }}
      />

      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Audit log"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "min(440px, 100%)",
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
                Audit Trail
              </p>
              <h3 style={{ color: "#f9fafb", fontSize: "22px", marginBottom: "6px" }}>
                Workflow Log
              </h3>
              <p style={{ color: "#9ca3af", fontSize: "13px" }}>
                Local workflow events, newest first.
              </p>
            </div>

            <button
              type="button"
              aria-label="Close audit log drawer"
              onClick={onClose}
              style={{
                alignSelf: "flex-start",
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "12px",
                color: "#f9fafb",
                cursor: "pointer",
                fontWeight: "bold",
                padding: "9px 12px"
              }}
            >
              Close
            </button>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
          {records.length === 0 ? (
            <div
              style={{
                border: "1px dashed #374151",
                borderRadius: "16px",
                color: "#9ca3af",
                lineHeight: "1.6",
                padding: "20px",
                textAlign: "center"
              }}
            >
              No workflow records yet.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {records.map((record) => (
                <div
                  key={record.id}
                  style={{
                    backgroundColor: "#0b1220",
                    border: "1px solid #1f2937",
                    borderRadius: "14px",
                    padding: "13px 14px"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      marginBottom: "7px"
                    }}
                  >
                    <p style={{ color: "#f9fafb", fontSize: "13px", fontWeight: "bold" }}>
                      {record.type}
                    </p>
                    <p style={{ color: "#6b7280", fontSize: "11px", whiteSpace: "nowrap" }}>
                      {record.date}
                    </p>
                  </div>
                  <p style={{ color: "#9ca3af", fontSize: "12px", lineHeight: "1.5" }}>
                    {record.detail}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer style={{ borderTop: "1px solid #1f2937", padding: "16px 20px" }}>
          <button
            type="button"
            aria-label="Clear audit log records"
            onClick={onClear}
            disabled={records.length === 0}
            style={{
              width: "100%",
              backgroundColor: "#111827",
              border: "1px solid #374151",
              borderRadius: "12px",
              color: records.length === 0 ? "#6b7280" : "#d1d5db",
              cursor: records.length === 0 ? "not-allowed" : "pointer",
              fontWeight: "bold",
              padding: "11px 12px"
            }}
          >
            Clear Audit Log
          </button>
        </footer>
      </aside>
    </div>
  )
}

export default AuditLogDrawer
