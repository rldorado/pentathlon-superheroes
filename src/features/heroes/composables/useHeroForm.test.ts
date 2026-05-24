import { describe, it, expect, vi } from 'vitest'
import { renderComposable } from '@/shared/testing/renderComposable'
import { useHeroForm, type HeroFormStore } from './useHeroForm'
import type { Hero } from '../types'

/**
 * T-25 — useHeroForm composable tests. Per constitution §4.2, composables
 * are tested exclusively via `renderComposable`. The store is passed as a
 * plain object so we can inspect calls and steer outcomes without Pinia.
 */

function makeStore(overrides: Partial<HeroFormStore> = {}): HeroFormStore & {
  create: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  hasName: ReturnType<typeof vi.fn>
} {
  return {
    hasName: vi.fn(() => false),
    create: vi.fn(async () => null),
    update: vi.fn(async () => null),
    error: null,
    ...overrides,
  } as HeroFormStore & {
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    hasName: ReturnType<typeof vi.fn>
  }
}

function existingHero(overrides: Partial<Hero> = {}): Hero {
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

describe('useHeroForm — create mode initial state', () => {
  it('starts with empty name/picture and default attributes (all 5s)', () => {
    const { result, unmount } = renderComposable(() =>
      useHeroForm({ mode: 'create', store: makeStore() }),
    )
    expect(result.draft.name).toBe('')
    expect(result.draft.picture).toBe('')
    expect(result.draft.attributes).toEqual({
      agility: 5,
      strength: 5,
      weight: 5,
      endurance: 5,
      charisma: 5,
    })
    expect(result.errors).toEqual({})
    expect(result.submitting.value).toBe(false)
    unmount()
  })
})

describe('useHeroForm — edit mode pre-fills draft', () => {
  it('seeds name, picture, and attributes from the initial hero', () => {
    const hero = existingHero()
    const { result, unmount } = renderComposable(() =>
      useHeroForm({ mode: 'edit', initial: hero, store: makeStore() }),
    )
    expect(result.draft.name).toBe(hero.name)
    expect(result.draft.picture).toBe(hero.picture)
    expect(result.draft.attributes).toEqual(hero.attributes)
    unmount()
  })

  it('throws when edit mode is requested without an initial hero', () => {
    expect(() =>
      renderComposable(() => useHeroForm({ mode: 'edit', store: makeStore() })),
    ).toThrow(/edit mode requires/)
  })
})

describe('useHeroForm — validate', () => {
  it('surfaces field-level errors for name, picture, and attributes', () => {
    const { result, unmount } = renderComposable(() =>
      useHeroForm({ mode: 'create', store: makeStore() }),
    )
    result.draft.name = '' // empty
    result.draft.picture = '' // missing in create mode
    result.draft.attributes.strength = 11 // out of range
    expect(result.validate()).toBe(false)
    expect(result.errors.name).toMatch(/obligatorio/)
    expect(result.errors.picture).toMatch(/obligatoria/)
    expect(result.errors.attributes?.strength).toMatch(/entre 0 y 10/)
    unmount()
  })

  it('clears prior errors on the next validate pass', () => {
    const { result, unmount } = renderComposable(() =>
      useHeroForm({ mode: 'create', store: makeStore() }),
    )
    result.validate()
    expect(result.errors.name).toMatch(/obligatorio/)
    result.draft.name = 'Capitán Fuerza'
    result.draft.picture = 'iVBORfake'
    expect(result.validate()).toBe(true)
    expect(result.errors).toEqual({})
    unmount()
  })

  it('flags duplicate names via store.hasName, excluding own id in edit mode', () => {
    const store = makeStore({
      hasName: vi.fn((name: string, except?: string) =>
        name === 'Capitán Fuerza' && except !== 'h-1',
      ),
    })
    const hero = existingHero()

    // Edit mode — own name is allowed.
    const { result: editForm, unmount: unmountEdit } = renderComposable(() =>
      useHeroForm({ mode: 'edit', initial: hero, store }),
    )
    expect(editForm.validate()).toBe(true)
    expect(editForm.errors.name).toBeUndefined()
    expect(store.hasName).toHaveBeenLastCalledWith('Capitán Fuerza', 'h-1')
    unmountEdit()

    // Create mode — same name is rejected.
    const { result: createForm, unmount: unmountCreate } = renderComposable(() =>
      useHeroForm({ mode: 'create', store }),
    )
    createForm.draft.name = 'Capitán Fuerza'
    createForm.draft.picture = 'iVBORfake'
    expect(createForm.validate()).toBe(false)
    expect(createForm.errors.name).toMatch(/Ya existe/)
    unmountCreate()
  })
})

describe('useHeroForm — submit (create)', () => {
  it('success: calls store.create with trimmed input and returns ok=true', async () => {
    const createdHero = existingHero({ id: 'h-new' })
    const store = makeStore({ create: vi.fn(async () => createdHero) })
    const { result, unmount } = renderComposable(() => useHeroForm({ mode: 'create', store }))
    result.draft.name = '   Capitán Fuerza   '
    result.draft.picture = 'iVBORfake'
    result.draft.attributes = { agility: 4, strength: 9, weight: 7, endurance: 6, charisma: 5 }

    const out = await result.submit()
    expect(out).toEqual({ ok: true, hero: createdHero })
    expect(store.create).toHaveBeenCalledWith({
      name: 'Capitán Fuerza',
      picture: 'iVBORfake',
      attributes: { agility: 4, strength: 9, weight: 7, endurance: 6, charisma: 5 },
    })
    expect(result.submitting.value).toBe(false)
    unmount()
  })

  it('validation failure: never calls the store and returns ok=false', async () => {
    const store = makeStore()
    const { result, unmount } = renderComposable(() => useHeroForm({ mode: 'create', store }))
    // Empty name + missing picture in create mode.
    const out = await result.submit()
    expect(out.ok).toBe(false)
    expect(store.create).not.toHaveBeenCalled()
    expect(result.errors.name).toMatch(/obligatorio/)
    unmount()
  })

  it('store failure: surfaces submitError from store.error', async () => {
    const store = makeStore({ error: 'No autorizado…', create: vi.fn(async () => null) })
    const { result, unmount } = renderComposable(() => useHeroForm({ mode: 'create', store }))
    result.draft.name = 'Nuevo Héroe'
    result.draft.picture = 'iVBORfake'

    const out = await result.submit()
    expect(out).toEqual({ ok: false, hero: null })
    expect(result.submitError.value).toBe('No autorizado…')
    unmount()
  })
})

describe('useHeroForm — submit (edit)', () => {
  it('success: calls store.update with the initial hero id and patched fields', async () => {
    const hero = existingHero()
    const updated = { ...hero, name: 'Renombrado' }
    const store = makeStore({ update: vi.fn(async () => updated) })
    const { result, unmount } = renderComposable(() =>
      useHeroForm({ mode: 'edit', initial: hero, store }),
    )
    result.draft.name = 'Renombrado'
    const out = await result.submit()
    expect(out.ok).toBe(true)
    expect(store.update).toHaveBeenCalledWith('h-1', expect.objectContaining({ name: 'Renombrado' }))
    unmount()
  })

  it('edit + empty picture is allowed (server keeps existing) — but our wire-level form keeps the prefilled one', async () => {
    const hero = existingHero()
    const store = makeStore({ update: vi.fn(async () => hero) })
    const { result, unmount } = renderComposable(() =>
      useHeroForm({ mode: 'edit', initial: hero, store }),
    )
    // User does NOT touch the picture field → draft.picture is still hero.picture.
    await result.submit()
    expect(store.update).toHaveBeenCalledWith('h-1', expect.objectContaining({ picture: hero.picture }))
    unmount()
  })
})

describe('useHeroForm — reset', () => {
  it('reverts draft + errors back to initial state', () => {
    const hero = existingHero()
    const { result, unmount } = renderComposable(() =>
      useHeroForm({ mode: 'edit', initial: hero, store: makeStore() }),
    )
    result.draft.name = 'Cambio'
    result.draft.attributes.strength = 11
    result.validate()
    expect(result.errors.attributes?.strength).toBeDefined()

    result.reset()
    expect(result.draft.name).toBe(hero.name)
    expect(result.draft.attributes).toEqual(hero.attributes)
    expect(result.errors).toEqual({})
    unmount()
  })
})
