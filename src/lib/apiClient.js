const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000"
const REQUEST_TIMEOUT_MS = 10000

export class ApiClientError extends Error {
  constructor(message, details = {}) {
    super(message)
    this.name = "ApiClientError"
    this.status = details.status
    this.endpoint = details.endpoint
    this.userMessage = details.userMessage || "The backend request failed."
    this.details = details.details
  }
}

export function getApiBaseUrl() {
  return (import.meta.env?.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "")
}

function buildUrl(endpoint) {
  if (/^https?:\/\//i.test(endpoint)) return endpoint
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  return `${getApiBaseUrl()}${normalizedEndpoint}`
}

async function readJson(response, endpoint) {
  const bodyText = await response.text()

  if (!bodyText) return null

  try {
    return JSON.parse(bodyText)
  } catch (error) {
    throw new ApiClientError(`Invalid JSON returned from ${endpoint}.`, {
      endpoint,
      status: response.status,
      details: error,
      userMessage: "Backend returned invalid data."
    })
  }
}

export async function requestJson(endpoint, options = {}) {
  const controller = new AbortController()
  const timeoutId = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let response

  try {
    response = await fetch(buildUrl(endpoint), {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      signal: controller.signal,
      ...options
    })
  } catch (error) {
    const aborted = error?.name === "AbortError"

    throw new ApiClientError(
      aborted
        ? `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s.`
        : `Network request failed for ${endpoint}.`,
      {
        endpoint,
        details: error,
        userMessage: aborted ? "Backend request timed out." : "Backend is offline or unreachable."
      }
    )
  } finally {
    globalThis.clearTimeout(timeoutId)
  }

  const data = await readJson(response, endpoint)

  if (!response.ok) {
    const detail = data?.detail || data?.message || `Request failed with ${response.status}.`

    throw new ApiClientError(detail, {
      endpoint,
      status: response.status,
      details: data,
      userMessage: "Backend request failed."
    })
  }

  return data
}

export function getUserFacingError(error, fallback = "Action failed. Changes were rolled back.") {
  return error?.userMessage || error?.message || fallback
}
