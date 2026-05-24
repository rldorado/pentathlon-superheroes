import { messages } from '@/shared/i18n/messages'

/**
 * Thrown by the HTTP client for any non-2xx response, malformed JSON, or
 * network failure. `status` is `0` for network/abort errors.
 */
export class ApiError extends Error {
  readonly status: number
  readonly rawBody: unknown

  constructor(status: number, message: string, rawBody?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.rawBody = rawBody
  }
}

/**
 * Maps an `ApiError` (or any thrown value from the HTTP client) into a
 * Spanish, user-facing message suitable for inline error blocks and toasts.
 * Pure — no side effects, no logging.
 */
export function mapApiError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 0) return messages.errors.network
    if (err.status === 401) return messages.errors.unauthorized
    if (err.status === 403) return messages.errors.forbidden
    if (err.status === 404) return messages.errors.notFound
    if (err.status === 409) return messages.errors.conflict
    if (err.status === 422) return messages.errors.validation
    if (err.status >= 400 && err.status < 500) return messages.errors.validation
    if (err.status >= 500) return messages.errors.server
    return messages.errors.generic
  }

  if (err instanceof Error && err.message) {
    return err.message
  }

  return messages.errors.generic
}
