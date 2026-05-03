import { useCallback, useEffect, useState } from "react"

export function useCommandPalette() {
  const [open, setOpen] = useState(false)

  const openCommandPalette = useCallback(() => setOpen(true), [])
  const closeCommandPalette = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      const isCommandK = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k"

      if (!isCommandK) return

      event.preventDefault()
      setOpen(true)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return {
    commandPaletteOpen: open,
    setCommandPaletteOpen: setOpen,
    openCommandPalette,
    closeCommandPalette
  }
}
