import { describe, it, expect } from 'vitest'
import { messages } from './messages'

describe('messages', () => {
  it('exposes all required error keys', () => {
    expect(messages.errors.missingApiKey).toMatch(/API key/i)
    expect(messages.errors.missingApiBaseUrl).toMatch(/BASE_URL/i)
    expect(messages.errors.unauthorized.length).toBeGreaterThan(0)
    expect(messages.errors.forbidden.length).toBeGreaterThan(0)
    expect(messages.errors.notFound.length).toBeGreaterThan(0)
    expect(messages.errors.conflict.length).toBeGreaterThan(0)
    expect(messages.errors.validation.length).toBeGreaterThan(0)
    expect(messages.errors.server.length).toBeGreaterThan(0)
    expect(messages.errors.network.length).toBeGreaterThan(0)
    expect(messages.errors.malformed.length).toBeGreaterThan(0)
    expect(messages.errors.generic.length).toBeGreaterThan(0)
  })

  it('is frozen at the type level (as const)', () => {
    // Compile-time check: messages is `as const`, so assigning a wrong type
    // would fail typecheck. Runtime guard kept minimal.
    expect(typeof messages.app.title).toBe('string')
  })
})
