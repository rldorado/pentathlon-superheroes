import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { request } from './client'
import { ApiError } from './errors'
import { _resetHttpConfigForTests } from './config'

const BASE_URL = 'https://api.test'
const API_KEY = 'test-key-123'

function mockFetchOnce(init: {
  status: number
  body?: string
  statusText?: string
}): ReturnType<typeof vi.fn> {
  const fetchSpy = vi.fn().mockResolvedValueOnce({
    ok: init.status >= 200 && init.status < 300,
    status: init.status,
    statusText: init.statusText ?? '',
    text: () => Promise.resolve(init.body ?? ''),
  } as unknown as Response)
  vi.stubGlobal('fetch', fetchSpy)
  return fetchSpy
}

describe('request', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_PENTATHLON_API_BASE_URL', BASE_URL)
    vi.stubEnv('VITE_PENTATHLON_API_KEY', API_KEY)
    _resetHttpConfigForTests()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    _resetHttpConfigForTests()
  })

  it('GET 200 returns the parsed JSON body', async () => {
    const fetchSpy = mockFetchOnce({ status: 200, body: JSON.stringify([{ id: '1' }]) })

    const result = await request<Array<{ id: string }>>('GET', '/pentathlon/heroes/')

    expect(result).toEqual([{ id: '1' }])
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('preserves trailing slashes in the path verbatim', async () => {
    const fetchSpy = mockFetchOnce({ status: 200, body: '[]' })

    await request('GET', '/pentathlon/heroes/')

    const [calledUrl] = fetchSpy.mock.calls[0]!
    expect(calledUrl).toBe(`${BASE_URL}/pentathlon/heroes/`)
  })

  it('injects Authorization header without a Bearer prefix', async () => {
    const fetchSpy = mockFetchOnce({ status: 200, body: '[]' })

    await request('GET', '/pentathlon/heroes/')

    const init = fetchSpy.mock.calls[0]![1] as RequestInit
    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toBe(API_KEY)
    expect(headers.Authorization).not.toMatch(/^Bearer/i)
  })

  it('sends Content-Type and serialized body on POST', async () => {
    const fetchSpy = mockFetchOnce({ status: 200, body: '{"id":"x"}' })

    await request('POST', '/pentathlon/heroes/', { body: { name: 'Capi' } })

    const init = fetchSpy.mock.calls[0]![1] as RequestInit
    const headers = init.headers as Record<string, string>
    expect(headers['Content-Type']).toBe('application/json')
    expect(init.body).toBe('{"name":"Capi"}')
    expect(init.method).toBe('POST')
  })

  it('does NOT set Content-Type on GET', async () => {
    const fetchSpy = mockFetchOnce({ status: 200, body: '[]' })

    await request('GET', '/pentathlon/heroes/')

    const init = fetchSpy.mock.calls[0]![1] as RequestInit
    const headers = init.headers as Record<string, string>
    expect(headers['Content-Type']).toBeUndefined()
    expect(init.body).toBeUndefined()
  })

  it('returns undefined for an empty 200 body', async () => {
    mockFetchOnce({ status: 200, body: '' })
    const result = await request('DELETE', '/pentathlon/heroes/1')
    expect(result).toBeUndefined()
  })

  it('throws ApiError(401) on 401 with the rawBody preserved', async () => {
    mockFetchOnce({ status: 401, body: '{"message":"nope"}', statusText: 'Unauthorized' })

    await expect(request('GET', '/pentathlon/heroes/')).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      rawBody: { message: 'nope' },
    })
  })

  it('throws ApiError(500) on 500', async () => {
    mockFetchOnce({ status: 500, body: '', statusText: 'Server Error' })

    await expect(request('GET', '/pentathlon/heroes/')).rejects.toBeInstanceOf(ApiError)
  })

  it('throws ApiError(0) on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch')))

    await expect(request('GET', '/pentathlon/heroes/')).rejects.toMatchObject({
      name: 'ApiError',
      status: 0,
    })
  })

  it('throws ApiError on malformed JSON', async () => {
    mockFetchOnce({ status: 200, body: '{not json' })

    await expect(request('GET', '/pentathlon/heroes/')).rejects.toMatchObject({
      name: 'ApiError',
      message: expect.stringMatching(/malformed/i),
    })
  })
})
