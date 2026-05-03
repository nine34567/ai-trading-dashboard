import { useCallback, useState } from "react"

function makeToast(toast) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    variant: "info",
    duration: 4200,
    ...toast
  }
}

export function useToasts() {
  const [toasts, setToasts] = useState([])

  const dismissToast = useCallback((toastId) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId))
  }, [])

  const addToast = useCallback((toast) => {
    const nextToast = makeToast(toast)

    setToasts((current) => {
      const withoutDuplicate = nextToast.dedupeKey
        ? current.filter((item) => item.dedupeKey !== nextToast.dedupeKey)
        : current

      return [nextToast, ...withoutDuplicate].slice(0, 4)
    })

    return nextToast.id
  }, [])

  return {
    toasts,
    addToast,
    dismissToast
  }
}
