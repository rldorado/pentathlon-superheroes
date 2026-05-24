import { describe, it, expect } from 'vitest'
import { ApiError, mapApiError } from './errors'
import { messages } from '@/shared/i18n/messages'

describe('ApiError', () => {
  it('carries status, message, and rawBody', () => {
    const err = new ApiError(404, 'Not Found', { reason: 'missing' })
    expect(err.status).toBe(404)
    expect(err.message).toBe('Not Found')
    expect(err.rawBody).toEqual({ reason: 'missing' })
    expect(err.name).toBe('ApiError')
    expect(err).toBeInstanceOf(Error)
  })
})

describe('mapApiError', () => {
  const cases: Array<[number, string]> = [
    [0, messages.errors.network],
    [401, messages.errors.unauthorized],
    [403, messages.errors.forbidden],
    [404, messages.errors.notFound],
    [409, messages.errors.conflict],
    [422, messages.errors.validation],
    [400, messages.errors.validation], // generic 4xx
    [418, messages.errors.validation], // generic 4xx
    [500, messages.errors.server],
    [502, messages.errors.server],
    [503, messages.errors.server],
  ]

  it.each(cases)('maps status %i to the expected Spanish message', (status, expected) => {
    expect(mapApiError(new ApiError(status, 'whatever'))).toBe(expected)
  })

  it('maps an unknown status to the generic message', () => {
    expect(mapApiError(new ApiError(199, 'weird'))).toBe(messages.errors.generic)
    expect(mapApiError(new ApiError(301, 'redirect'))).toBe(messages.errors.generic)
  })

  it('passes through the message of a plain Error', () => {
    expect(mapApiError(new Error('custom thing'))).toBe('custom thing')
  })

  it('falls back to the generic message for non-Error values', () => {
    expect(mapApiError('string thrown')).toBe(messages.errors.generic)
    expect(mapApiError(null)).toBe(messages.errors.generic)
    expect(mapApiError(undefined)).toBe(messages.errors.generic)
    expect(mapApiError({ weird: true })).toBe(messages.errors.generic)
  })
})
