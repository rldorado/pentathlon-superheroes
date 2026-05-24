import { messages } from '@/shared/i18n/messages'

/**
 * Single source of truth for HTTP runtime config. Reads `import.meta.env`
 * exactly once when first accessed. Throws a clear Spanish error if the
 * required API key is missing — fail-fast at boot.
 *
 * No other module in the app may read `import.meta.env` for HTTP/auth
 * purposes; routing all reads through here keeps secrets in one file and
 * eases testing (vi.stubEnv before import).
 */

export interface HttpConfig {
  baseUrl: string
  apiKey: string
}

let cached: HttpConfig | null = null

export function getHttpConfig(): HttpConfig {
  if (cached) return cached

  const baseUrl = (import.meta.env.VITE_PENTATHLON_API_BASE_URL ?? '').trim()
  const apiKey = (import.meta.env.VITE_PENTATHLON_API_KEY ?? '').trim()

  if (!baseUrl) {
    throw new Error(messages.errors.missingApiBaseUrl)
  }
  if (!apiKey) {
    throw new Error(messages.errors.missingApiKey)
  }

  cached = { baseUrl: baseUrl.replace(/\/+$/, ''), apiKey }
  return cached
}

/** Test-only: clears the cached config so the next call re-reads env. */
export function _resetHttpConfigForTests(): void {
  cached = null
}
