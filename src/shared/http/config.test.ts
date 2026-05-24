import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getHttpConfig, _resetHttpConfigForTests } from './config'

describe('getHttpConfig', () => {
  beforeEach(() => {
    _resetHttpConfigForTests()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    _resetHttpConfigForTests()
  })

  it('returns baseUrl and apiKey when both env vars are present', () => {
    vi.stubEnv('VITE_PENTATHLON_API_BASE_URL', 'https://example.test')
    vi.stubEnv('VITE_PENTATHLON_API_KEY', 'abc123')

    const cfg = getHttpConfig()

    expect(cfg.baseUrl).toBe('https://example.test')
    expect(cfg.apiKey).toBe('abc123')
  })

  it('strips a trailing slash from baseUrl', () => {
    vi.stubEnv('VITE_PENTATHLON_API_BASE_URL', 'https://example.test/')
    vi.stubEnv('VITE_PENTATHLON_API_KEY', 'abc')

    expect(getHttpConfig().baseUrl).toBe('https://example.test')
  })

  it('throws when apiKey is missing', () => {
    vi.stubEnv('VITE_PENTATHLON_API_BASE_URL', 'https://example.test')
    vi.stubEnv('VITE_PENTATHLON_API_KEY', '')

    expect(() => getHttpConfig()).toThrow(/API key/i)
  })

  it('throws when baseUrl is missing', () => {
    vi.stubEnv('VITE_PENTATHLON_API_BASE_URL', '')
    vi.stubEnv('VITE_PENTATHLON_API_KEY', 'abc')

    expect(() => getHttpConfig()).toThrow(/BASE_URL/i)
  })

  it('caches the result so repeated calls reuse the same config', () => {
    vi.stubEnv('VITE_PENTATHLON_API_BASE_URL', 'https://example.test')
    vi.stubEnv('VITE_PENTATHLON_API_KEY', 'abc')

    const first = getHttpConfig()
    const second = getHttpConfig()

    expect(second).toBe(first)
  })
})
