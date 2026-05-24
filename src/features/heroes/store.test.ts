import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useHeroesStore } from './store'
import { ApiError } from '@/shared/http/errors'
import type { Hero, HeroInput } from './types'

/**
 * T-24 — heroes store (Pinia).
 *
 * Contract: actions never throw to callers — they set `error` (Spanish,
 * mapped from `ApiError` via `shared/http/errors.ts`). `hasName` is
 * case-insensitive after trim and supports `exceptId` for the edit form.
 */

vi.mock('./api', () => ({
  listHeroes: vi.fn(),
  createHero: vi.fn(),
  updateHero: vi.fn(),
  deleteHero: vi.fn(),
}))

import * as api from './api'

const mockApi = api as unknown as {
  listHeroes: ReturnType<typeof vi.fn>
  createHero: ReturnType<typeof vi.fn>
  updateHero: ReturnType<typeof vi.fn>
  deleteHero: ReturnType<typeof vi.fn>
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.resetAllMocks()
})

function hero(overrides: Partial<Hero> = {}): Hero {
  return {
    id: 'h-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    name: 'Capitán Fuerza',
    picture: 'iVBORfake',
    attributes: { agility: 4, strength: 9, weight: 7, endurance: 6, charisma: 5 },
    ...overrides,
  }
}

function input(overrides: Partial<HeroInput> = {}): HeroInput {
  return {
    name: 'Capitán Fuerza',
    picture: 'iVBORfake',
    attributes: { agility: 4, strength: 9, weight: 7, endurance: 6, charisma: 5 },
    ...overrides,
  }
}

describe('useHeroesStore — initial state', () => {
  it('starts idle with empty roster and no error', () => {
    const store = useHeroesStore()
    expect(store.heroes).toEqual([])
    expect(store.status).toBe('idle')
    expect(store.error).toBeNull()
    expect(store.count).toBe(0)
  })
})

describe('useHeroesStore — load', () => {
  it('happy path: transitions idle → loading → ready and populates heroes', async () => {
    const heroes = [hero(), hero({ id: 'h-2', name: 'La Sombra' })]
    mockApi.listHeroes.mockResolvedValueOnce(heroes)

    const store = useHeroesStore()
    const promise = store.load()
    expect(store.status).toBe('loading')
    await promise
    expect(store.status).toBe('ready')
    expect(store.heroes).toEqual(heroes)
    expect(store.error).toBeNull()
    expect(store.count).toBe(2)
  })

  it('error path: ApiError → status "error" + Spanish error string, no throw', async () => {
    mockApi.listHeroes.mockRejectedValueOnce(new ApiError(500, 'boom'))
    const store = useHeroesStore()
    await store.load()
    expect(store.status).toBe('error')
    expect(store.error).toMatch(/Error del servidor/)
    expect(store.heroes).toEqual([])
  })
})

describe('useHeroesStore — create', () => {
  it('appends the created hero on success and clears error', async () => {
    mockApi.createHero.mockResolvedValueOnce(hero({ id: 'h-new', name: 'Nuevo' }))
    const store = useHeroesStore()
    store.$patch({ heroes: [hero({ id: 'h-1', name: 'Existente' })] })

    const created = await store.create(input({ name: 'Nuevo' }))
    expect(created).toMatchObject({ id: 'h-new', name: 'Nuevo' })
    expect(store.heroes.map((h) => h.id)).toEqual(['h-1', 'h-new'])
    expect(store.error).toBeNull()
  })

  it('failure: sets error and returns null; roster unchanged', async () => {
    mockApi.createHero.mockRejectedValueOnce(new ApiError(409, 'conflict'))
    const store = useHeroesStore()
    const out = await store.create(input())
    expect(out).toBeNull()
    expect(store.error).toMatch(/Conflicto/)
    expect(store.heroes).toEqual([])
  })
})

describe('useHeroesStore — update', () => {
  it('replaces the matching hero in place on success', async () => {
    const existing = hero({ id: 'h-1', name: 'Old' })
    const updated = hero({ id: 'h-1', name: 'New' })
    mockApi.updateHero.mockResolvedValueOnce(updated)
    const store = useHeroesStore()
    store.$patch({ heroes: [existing, hero({ id: 'h-2', name: 'Other' })] })

    const out = await store.update('h-1', input({ name: 'New' }))
    expect(out).toEqual(updated)
    expect(store.heroes.find((h) => h.id === 'h-1')!.name).toBe('New')
    expect(store.heroes.find((h) => h.id === 'h-2')!.name).toBe('Other')
  })

  it('failure: sets error and returns null; roster unchanged', async () => {
    mockApi.updateHero.mockRejectedValueOnce(new ApiError(404, 'not found'))
    const store = useHeroesStore()
    store.$patch({ heroes: [hero({ id: 'h-1', name: 'Old' })] })
    const out = await store.update('h-1', input({ name: 'New' }))
    expect(out).toBeNull()
    expect(store.error).toMatch(/no encontrado/i)
    expect(store.heroes[0]!.name).toBe('Old')
  })
})

describe('useHeroesStore — remove', () => {
  it('drops the hero from the roster on success', async () => {
    mockApi.deleteHero.mockResolvedValueOnce({ done: true })
    const store = useHeroesStore()
    store.$patch({ heroes: [hero({ id: 'h-1' }), hero({ id: 'h-2' })] })

    const ok = await store.remove('h-1')
    expect(ok).toBe(true)
    expect(store.heroes.map((h) => h.id)).toEqual(['h-2'])
  })

  it('failure: leaves roster intact and surfaces Spanish error', async () => {
    mockApi.deleteHero.mockRejectedValueOnce(new ApiError(0, 'network'))
    const store = useHeroesStore()
    store.$patch({ heroes: [hero({ id: 'h-1' })] })
    const ok = await store.remove('h-1')
    expect(ok).toBe(false)
    expect(store.error).toMatch(/Sin conexión/)
    expect(store.heroes).toHaveLength(1)
  })
})

describe('useHeroesStore — getters', () => {
  it('byId returns the hero or undefined', () => {
    const store = useHeroesStore()
    const a = hero({ id: 'h-1', name: 'A' })
    store.$patch({ heroes: [a] })
    expect(store.byId('h-1')).toEqual(a)
    expect(store.byId('missing')).toBeUndefined()
  })

  it('hasName is case-insensitive after trim', () => {
    const store = useHeroesStore()
    store.$patch({ heroes: [hero({ id: 'h-1', name: 'Capitán Fuerza' })] })
    expect(store.hasName('capitán fuerza')).toBe(true)
    expect(store.hasName('  CAPITÁN  FUERZA  ')).toBe(false) // internal whitespace differs — exact comparison after trim only
    expect(store.hasName('CAPITÁN FUERZA')).toBe(true)
    expect(store.hasName('  Capitán Fuerza  ')).toBe(true)
    expect(store.hasName('Otro')).toBe(false)
  })

  it('hasName respects exceptId — own name does not count as a collision when editing', () => {
    const store = useHeroesStore()
    store.$patch({
      heroes: [hero({ id: 'h-1', name: 'Capitán Fuerza' }), hero({ id: 'h-2', name: 'La Sombra' })],
    })
    expect(store.hasName('Capitán Fuerza', 'h-1')).toBe(false)
    expect(store.hasName('La Sombra', 'h-1')).toBe(true)
  })
})
