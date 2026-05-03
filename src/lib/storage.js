export function readLocalStorage(key, fallback) {
  if (typeof window === "undefined") return fallback

  try {
    const rawValue = window.localStorage.getItem(key)
    if (!rawValue) return fallback
    return JSON.parse(rawValue)
  } catch {
    return fallback
  }
}

export function writeLocalStorage(key, value) {
  if (typeof window === "undefined") return false

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
