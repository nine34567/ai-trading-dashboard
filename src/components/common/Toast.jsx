import { useEffect } from "react"

const variantStyles = {
  success: {
    border: "#22c55e",
    accent: "#86efac",
    background: "linear-gradient(135deg, rgba(20, 83, 45, 0.42), rgba(15, 23, 42, 0.98))"
  },
  warning: {
    border: "#f59e0b",
    accent: "#fde68a",
    background: "linear-gradient(135deg, rgba(120, 53, 15, 0.42), rgba(15, 23, 42, 0.98))"
  },
  error: {
    border: "#ef4444",
    accent: "#fecaca",
    background: "linear-gradient(135deg, rgba(127, 29, 29, 0.42), rgba(15, 23, 42, 0.98))"
  },
  info: {
    border: "#38bdf8",
    accent: "#bae6fd",
    background: "linear-gradient(135deg, rgba(7, 89, 133, 0.42), rgba(15, 23, 42, 0.98))"
  }
}

function Toast({ toast, onDismiss }) {
  const style = variantStyles[toast.variant] || variantStyles.info

  useEffect(() => {
    if (!toast.duration) return undefined

    const timer = window.setTimeout(() => {
      onDismiss?.(toast.id)
    }, toast.duration)

    return () => window.clearTimeout(timer)
  }, [onDismiss, toast.duration, toast.id])

  return (
    <div
      role="status"
      aria-live={toast.variant === "error" ? "assertive" : "polite"}
      style={{
        background: style.background,
        border: `1px solid ${style.border}`,
        borderRadius: "16px",
        boxShadow: "0 20px 55px rgba(0, 0, 0, 0.42)",
        color: "#f9fafb",
        overflow: "hidden",
        padding: "14px 14px 13px",
        width: "min(360px, calc(100vw - 32px))"
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div
          aria-hidden="true"
          style={{
            backgroundColor: style.accent,
            borderRadius: "999px",
            height: "9px",
            marginTop: "6px",
            width: "9px"
          }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: "#f9fafb", fontSize: "13px", fontWeight: "bold", marginBottom: toast.message ? "4px" : 0 }}>
            {toast.title}
          </p>
          {toast.message ? (
            <p style={{ color: "#9ca3af", fontSize: "12px", lineHeight: "1.5" }}>
              {toast.message}
            </p>
          ) : null}

          {toast.actionLabel && toast.onAction ? (
            <button
              type="button"
              onClick={() => {
                toast.onAction?.()
                onDismiss?.(toast.id)
              }}
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                border: `1px solid ${style.border}`,
                borderRadius: "10px",
                color: style.accent,
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "bold",
                marginTop: "10px",
                padding: "7px 10px"
              }}
            >
              {toast.actionLabel}
            </button>
          ) : null}
        </div>

        <button
          type="button"
          aria-label={`Dismiss ${toast.title}`}
          onClick={() => onDismiss?.(toast.id)}
          style={{
            backgroundColor: "transparent",
            border: "none",
            color: "#9ca3af",
            cursor: "pointer",
            fontSize: "18px",
            lineHeight: 1,
            padding: "0 2px"
          }}
        >
          x
        </button>
      </div>
    </div>
  )
}

export default Toast
