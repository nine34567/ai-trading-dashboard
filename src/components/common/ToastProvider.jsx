import Toast from "./Toast"

function ToastProvider({ toasts = [], onDismiss }) {
  if (!Array.isArray(toasts) || toasts.length === 0) return null

  return (
    <div
      aria-label="Notifications"
      style={{
        bottom: "18px",
        display: "grid",
        gap: "10px",
        justifyItems: "end",
        position: "fixed",
        right: "18px",
        zIndex: 130
      }}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

export default ToastProvider
