import { useEffect, useMemo, useRef, useState } from "react"
import { useFocusTrap } from "../../hooks/useFocusTrap"

function CommandPalette({ open, commands = [], onClose }) {
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const dialogRef = useRef(null)
  const inputRef = useRef(null)

  useFocusTrap({
    enabled: open,
    containerRef: dialogRef,
    initialFocusRef: inputRef,
    onEscape: onClose
  })

  const filteredCommands = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) return commands

    return commands.filter((command) => {
      return [command.label, command.description, command.group]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    })
  }, [commands, query])

  useEffect(() => {
    if (!open) return

    setQuery("")
    setActiveIndex(0)
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }, [open])

  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose?.()
        return
      }

      if (event.key === "ArrowDown") {
        event.preventDefault()
        const lastIndex = Math.max(0, filteredCommands.length - 1)
        setActiveIndex((current) =>
          Math.min(lastIndex, current + 1)
        )
      }

      if (event.key === "ArrowUp") {
        event.preventDefault()
        setActiveIndex((current) => Math.max(0, current - 1))
      }

      if (event.key === "Enter") {
        event.preventDefault()
        const command = filteredCommands[activeIndex]

        if (!command || command.disabled) return

        command.run?.()
        onClose?.()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeIndex, filteredCommands, onClose, open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  if (!open) return null

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "9vh 20px 20px"
      }}
    >
      <button
        type="button"
        aria-label="Close command palette"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          border: "none",
          backgroundColor: "rgba(2, 6, 23, 0.72)",
          backdropFilter: "blur(10px)"
        }}
      />

      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        style={{
          position: "relative",
          width: "min(680px, 100%)",
          background:
            "linear-gradient(135deg, rgba(17, 24, 39, 0.99), rgba(15, 23, 42, 0.99))",
          border: "1px solid rgba(55, 65, 81, 0.9)",
          borderRadius: "22px",
          boxShadow: "0 32px 90px rgba(0, 0, 0, 0.52)",
          overflow: "hidden"
        }}
      >
        <div style={{ padding: "16px", borderBottom: "1px solid #1f2937" }}>
          <input
            ref={inputRef}
            aria-label="Search commands"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search commands..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              backgroundColor: "#0b1220",
              color: "#f9fafb",
              border: "1px solid #374151",
              borderRadius: "14px",
              padding: "13px 14px",
              outline: "none",
              fontSize: "15px"
            }}
          />
        </div>

        <div style={{ maxHeight: "430px", overflowY: "auto", padding: "8px" }}>
          {filteredCommands.length === 0 ? (
            <p style={{ color: "#9ca3af", padding: "18px", textAlign: "center" }}>
              No command found.
            </p>
          ) : (
            filteredCommands.map((command, index) => {
              const active = index === activeIndex

              return (
                <button
                  key={command.id}
                  type="button"
                  disabled={command.disabled}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => {
                    if (command.disabled) return
                    command.run?.()
                    onClose?.()
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "16px",
                    border: `1px solid ${active ? "#84cc16" : "transparent"}`,
                    backgroundColor: active ? "rgba(132, 204, 22, 0.1)" : "transparent",
                    color: command.disabled ? "#6b7280" : "#f9fafb",
                    borderRadius: "14px",
                    padding: "13px 14px",
                    cursor: command.disabled ? "not-allowed" : "pointer",
                    textAlign: "left"
                  }}
                >
                  <span>
                    <span style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
                      {command.label}
                    </span>
                    <span style={{ color: "#9ca3af", fontSize: "12px" }}>
                      {command.description}
                    </span>
                  </span>

                  <span
                    style={{
                      color: "#6b7280",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {command.group}
                  </span>
                </button>
              )
            })
          )}
        </div>

        <div
          style={{
            borderTop: "1px solid #1f2937",
            color: "#6b7280",
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            padding: "11px 16px",
            fontSize: "12px"
          }}
        >
          <span>Enter runs</span>
          <span>Esc closes</span>
        </div>
      </section>
    </div>
  )
}

export default CommandPalette
