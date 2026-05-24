import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import HeroesPage from './HeroesPage.vue'
import { createToastBus } from '@/shared/ui/toast/createToastBus'
import { toastKey } from '@/shared/ui/toast/types'
import type { Hero } from '../types'

/**
 * Page-level tests for HeroesPage. We mock the heroes API module (so no
 * network calls fire), wire a real Pinia store on each test, and pass a
 * fresh toast bus via `global.provide`. The four primary states are
 * exercised: loading, empty, errored, populated.
 */

vi.mock('../api', () => ({
  listHeroes: vi.fn(),
  createHero: vi.fn(),
  updateHero: vi.fn(),
  deleteHero: vi.fn(),
}))

import * as api from '../api'

const mockApi = api as unknown as {
  listHeroes: ReturnType<typeof vi.fn>
  createHero: ReturnType<typeof vi.fn>
  updateHero: ReturnType<typeof vi.fn>
  deleteHero: ReturnType<typeof vi.fn>
}

function makeHero(overrides: Partial<Hero> = {}): Hero {
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

function mountPage() {
  const bus = createToastBus({ autoDismissMs: 0 })
  const wrapper = mount(HeroesPage, {
    attachTo: document.body,
    global: {
      provide: { [toastKey as symbol]: bus },
    },
  })
  return { wrapper, bus }
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.resetAllMocks()
})

afterEach(() => {
  // Clean up document.body between tests since we attach modals there.
  document.body.innerHTML = ''
})

describe('HeroesPage — loading', () => {
  it('shows skeletons while the store is loading and aria-busy is true', async () => {
    // Hang the promise so we stay in `loading`.
    mockApi.listHeroes.mockImplementation(() => new Promise(() => {}))
    const { wrapper } = mountPage()
    await flushPromises()
    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
    wrapper.unmount()
  })
})

describe('HeroesPage — empty roster', () => {
  it('renders the page-level empty state with the inscribe CTA', async () => {
    mockApi.listHeroes.mockResolvedValueOnce([])
    const { wrapper } = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('Aún no hay héroes inscritos')
    expect(wrapper.find('main').exists()).toBe(true)
    wrapper.unmount()
  })
})

describe('HeroesPage — errored', () => {
  it('renders the mapped Spanish error + a Reintentar CTA', async () => {
    mockApi.listHeroes.mockRejectedValueOnce(Object.assign(new Error('boom'), { name: 'ApiError' }))
    // We bypass ApiError specifics; mapApiError falls back to generic for
    // non-ApiError instances, which is still a Spanish string.
    const { wrapper } = mountPage()
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    const retry = wrapper.findAll('button').find((b) => b.text() === 'Reintentar')
    expect(retry).toBeTruthy()
    wrapper.unmount()
  })
})

describe('HeroesPage — populated', () => {
  it('renders the HeroGrid with the roster + the count line in the header', async () => {
    mockApi.listHeroes.mockResolvedValueOnce([makeHero(), makeHero({ id: 'h-2', name: 'La Sombra' })])
    const { wrapper } = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('Capitán Fuerza')
    expect(wrapper.text()).toContain('La Sombra')
    expect(wrapper.text()).toContain('2 héroes en cuadro')
    wrapper.unmount()
  })

  it('opens the form dialog when the header CTA is clicked', async () => {
    mockApi.listHeroes.mockResolvedValueOnce([makeHero()])
    const { wrapper } = mountPage()
    await flushPromises()

    const inscribeBtn = wrapper.findAll('button').find((b) => b.text().includes('Inscribir héroe'))!
    await inscribeBtn.trigger('click')
    expect(document.body.textContent).toContain('Inscribir héroe')
    expect(document.body.querySelector('[role="dialog"]')).toBeTruthy()
    wrapper.unmount()
  })

  it('opens the confirm-delete dialog with the hero name when remove fires', async () => {
    const hero = makeHero({ name: 'Capitán Fuerza' })
    mockApi.listHeroes.mockResolvedValueOnce([hero])
    const { wrapper } = mountPage()
    await flushPromises()

    // Click the Eliminar button on the first HeroCard.
    const removeBtn = wrapper.findAll('button').find((b) => b.text() === 'Eliminar')!
    await removeBtn.trigger('click')
    expect(document.body.textContent).toContain('¿Seguro que quieres eliminar a')
    expect(document.body.textContent).toContain('Capitán Fuerza')
    wrapper.unmount()
  })

  it('pushes a Spanish success toast when a delete confirmation succeeds', async () => {
    const hero = makeHero({ name: 'Capitán Fuerza' })
    mockApi.listHeroes.mockResolvedValueOnce([hero])
    mockApi.deleteHero.mockResolvedValueOnce({ done: true })

    const { wrapper, bus } = mountPage()
    await flushPromises()

    // Open delete dialog.
    const removeBtn = wrapper.findAll('button').find((b) => b.text() === 'Eliminar')!
    await removeBtn.trigger('click')

    // Click confirm in the teleported dialog.
    const confirmBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Eliminar héroe',
    )!
    confirmBtn.click()
    await flushPromises()

    expect(mockApi.deleteHero).toHaveBeenCalledWith('h-1')
    expect(bus.toasts.value.length).toBeGreaterThan(0)
    expect(bus.toasts.value[0]!.message).toBe('Héroe eliminado.')
    wrapper.unmount()
  })
})
