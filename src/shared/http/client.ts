import { getHttpConfig } from './config'
import { ApiError } from './errors'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface RequestOptions {
  /** Optional JSON-serialisable body. Sent on POST/PUT only. */
  body?: unknown
  /** Optional abort signal for cancellation. */
  signal?: AbortSignal
}

/**
 * Thin `fetch` wrapper.
 *
 * - Preserves trailing slashes in `path` verbatim — some routes 404 without.
 * - Injects `Authorization: <apiKeyId>` header (no Bearer prefix per the
 *   live OpenAPI spec).
 * - Sets `Content-Type: application/json` on POST/PUT only.
 * - Any non-2xx response throws `ApiError(status, statusText, rawBody)`.
 * - Network or abort failures throw `ApiError(0, ...)` so callers handle
 *   one error type.
 * - Malformed JSON in a 2xx response also throws `ApiError`.
 */
export async function request<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { baseUrl, apiKey } = getHttpConfig()
  const url = `${baseUrl}${path}`

  const headers: Record<string, string> = {
    Authorization: apiKey,
    Accept: 'application/json',
  }

  let body: BodyInit | undefined
  if (method === 'POST' || method === 'PUT') {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body ?? {})
  }

  let response: Response
  try {
    const init: RequestInit = { method, headers }
    if (body !== undefined) init.body = body
    if (options.signal) init.signal = options.signal
    response = await fetch(url, init)
  } catch (cause) {
    throw new ApiError(
      0,
      cause instanceof Error ? cause.message : 'Network failure',
      cause,
    )
  }

  const text = await response.text()
  let parsed: unknown = undefined
  if (text.length > 0) {
    try {
      parsed = JSON.parse(text)
    } catch {
      throw new ApiError(response.status, 'Malformed JSON response', text)
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText || `HTTP ${response.status}`, parsed)
  }

  return parsed as T
}
