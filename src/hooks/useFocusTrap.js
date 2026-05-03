import { useEffect, useRef } from "react"

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",")

function getFocusableElements(container) {
  if (!container) return []

  return Array.from(container.querySelectorAll(focusableSelector)).filter((element) => {
    if (element.getAttribute("aria-hidden") === "true") return false
    const style = window.getComputedStyle(element)
    if (style.visibility === "hidden" || style.display === "none") return false
    if (element.getClientRects().length === 0 && element !== document.activeElement) return false
    return true
  })
}

export function useFocusTrap({
  enabled,
  containerRef,
  initialFocusRef,
  onEscape,
  restoreFocus = true
}) {
  const previousFocusRef = useRef(null)

  useEffect(() => {
    if (!enabled || typeof document === "undefined") return undefined

    previousFocusRef.current = document.activeElement

    const focusInitialElement = () => {
      const container = containerRef?.current
      const initialElement = initialFocusRef?.current
      const firstFocusable = getFocusableElements(container)[0]
      const focusTarget = initialElement || firstFocusable || container

      focusTarget?.focus?.({ preventScroll: true })
    }

    const focusTimer = window.setTimeout(focusInitialElement, 0)

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        onEscape?.()
        return
      }

      if (event.key !== "Tab") return

      const container = containerRef?.current
      if (!container) return

      const focusableElements = getFocusableElements(container)

      if (focusableElements.length === 0) {
        event.preventDefault()
        container.focus?.({ preventScroll: true })
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement

      if (event.shiftKey) {
        if (!container.contains(activeElement) || activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus({ preventScroll: true })
        }
        return
      }

      if (activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus({ preventScroll: true })
      }
    }

    document.addEventListener("keydown", handleKeyDown, true)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener("keydown", handleKeyDown, true)

      if (!restoreFocus) return

      window.setTimeout(() => {
        const previousElement = previousFocusRef.current
        if (previousElement && document.contains(previousElement)) {
          previousElement.focus?.({ preventScroll: true })
        }
      }, 0)
    }
  }, [containerRef, enabled, initialFocusRef, onEscape, restoreFocus])
}
