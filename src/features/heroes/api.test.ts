import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { listHeroes, createHero, updateHero, deleteHero } from './api'
import { _resetHttpConfigForTests } from '@/shared/http/config'
import type { Hero, HeroInput } from './types'

/**
 * T-23 — Heroes API client (plan.md §3.3).
 *
 * Asserts URL, method, headers, and body shape per endpoint. We stub env
 * via `vi.stubEnv` and reset the cached HTTP config so each test re-reads.
 */

beforeEach(() => {
  vi.stubEnv('VITE_PENTATHLON_API_BASE_URL', 'https://api.test')
  vi.stubEnv('VITE_PENTATHLON_API_KEY', 'test-key-xyz')
  _resetHttpConfigForTests()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  _resetHttpConfigForTests()
})

function mockFetchOnceJson<T>(body: T, init: ResponseInit = { status: 200 }): ReturnType<typeof vi.fn> {
  const mock = vi.fn(async () => new Response(JSON.stringify(body), init))
  vi.stubGlobal('fetch', mock)
  return mock
}

const sampleHero: Hero = {
  id: 'h-1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  name: 'Capitán Fuerza',
  picture: 'iVBORfake',
  attributes: { agility: 4, strength: 9, weight: 7, endurance: 6, charisma: 5 },
}

const sampleInput: HeroInput = {
  name: 'Capitán Fuerza',
  picture: 'iVBORfake',
  attributes: { agility: 4, strength: 9, weight: 7, endurance: 6, charisma: 5 },
}

describe('listHeroes', () => {
  it('GETs /pentathlon/heroes/ (trailing slash preserved) with Authorization', async () => {
    const fetchMock = mockFetchOnceJson<Hero[]>([sampleHero])
    const heroes = await listHeroes()
    expect(heroes).toEqual([sampleHero])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://api.test/pentathlon/heroes/')
    expect((init as RequestInit).method).toBe('GET')
    const headers = (init as RequestInit).headers as Record<string, string>
    expect(headers.Authorization).toBe('test-key-xyz')
    expect((init as RequestInit).body).toBeUndefined()
  })
})

describe('createHero', () => {
  it('POSTs /pentathlon/heroes/ (trailing slash) with JSON body and returns the created Hero', async () => {
    const fetchMock = mockFetchOnceJson<Hero>(sampleHero, { status: 200 })
    const created = await createHero(sampleInput)
    expect(created).toEqual(sampleHero)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://api.test/pentathlon/heroes/')
    expect((init as RequestInit).method).toBe('POST')
    const headers = (init as RequestInit).headers as Record<string, string>
    expect(headers.Authorization).toBe('test-key-xyz')
    expect(headers['Content-Type']).toBe('application/json')
    expect(JSON.parse((init as RequestInit).body as string)).toEqual(sampleInput)
  })
})

describe('updateHero', () => {
  it('PUTs /pentathlon/heroes/{id} (no trailing slash on resource path) with JSON body', async () => {
    const fetchMock = mockFetchOnceJson<Hero>({ ...sampleHero, name: 'Renombrado' })
    const updated = await updateHero('h-1', { ...sampleInput, name: 'Renombrado' })
    expect(updated.name).toBe('Renombrado')
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://api.test/pentathlon/heroes/h-1')
    expect((init as RequestInit).method).toBe('PUT')
    expect(JSON.parse((init as RequestInit).body as string).name).toBe('Renombrado')
  })
})

describe('deleteHero', () => {
  it('DELETEs /pentathlon/heroes/{id} and returns the {done} payload', async () => {
    const fetchMock = mockFetchOnceJson<{ done: boolean }>({ done: true })
    const out = await deleteHero('h-1')
    expect(out).toEqual({ done: true })
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://api.test/pentathlon/heroes/h-1')
    expect((init as RequestInit).method).toBe('DELETE')
    expect((init as RequestInit).body).toBeUndefined()
  })
})
