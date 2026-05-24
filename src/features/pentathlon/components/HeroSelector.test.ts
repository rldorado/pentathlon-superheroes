import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import HeroSelector from './HeroSelector.vue'
import { useHeroesStore } from '@/features/heroes/store'
import { usePentathlonStore } from '../store'
import type { Hero } from '@/features/heroes/types'

vi.mock('../scoring/simulate', () => ({
  simulate: vi.fn(() => ({
    participantIds: ['h1', 'h2', 'h3'],
    events: Array.from({ length: 5 }, (_, i) => ({
      eventId: (i + 1) as 1 | 2 | 3 | 4 | 5,
      name: `E${i + 1}`,
      formula: 'f',
      participants: [],
    })),
    classification: [
      { heroId: 'h1', totalPoints: 9, wins: 2, lastEventValue: 3, rank: 1 as const },
      { heroId: 'h2', totalPoints: 6, wins: 1, lastEventValue: 2, rank: 2 as const },
      { heroId: 'h3', totalPoints: 3, wins: 0, lastEventValue: 1, rank: 3 as const },
    ],
  })),
}))

const makeHero = (id: string): Hero => ({
  id,
  name: `Hero ${id}`,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  attributes: { agility: 5, strength: 5, weight: 5, endurance: 5, charisma: 5 },
})

const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div />' } }, { path: '/heroes', component: { template: '<div />' } }] })

function mountSelector() {
  return mount(HeroSelector, {
    global: { plugins: [createPinia(), router] },
  })
}

describe('HeroSelector', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows insufficient message when roster has < 3 heroes', () => {
    const wrapper = mountSelector()
    const heroesStore = useHeroesStore()
    heroesStore.heroes = [makeHero('h1'), makeHero('h2')]
    expect(wrapper.text()).toContain('Necesitas al menos 3 héroes')
  })

  it('shows hero cards when roster has >= 3 heroes', async () => {
    const wrapper = mountSelector()
    const heroesStore = useHeroesStore()
    heroesStore.heroes = [makeHero('h1'), makeHero('h2'), makeHero('h3')]
    await wrapper.vm.$nextTick()
    const buttons = wrapper.findAll('button[role="listitem"]')
    expect(buttons).toHaveLength(3)
  })

  it('CTA is disabled until 3 heroes selected', async () => {
    const wrapper = mountSelector()
    const heroesStore = useHeroesStore()
    heroesStore.heroes = [makeHero('h1'), makeHero('h2'), makeHero('h3'), makeHero('h4')]
    await wrapper.vm.$nextTick()

    const allButtons = wrapper.findAll('button')
    const simulateCta = allButtons.find((b) => b.text().includes('Simular'))
    expect(simulateCta?.attributes('disabled')).toBeDefined()
  })

  it('CTA is enabled when 3 heroes selected', async () => {
    const wrapper = mountSelector()
    const heroesStore = useHeroesStore()
    heroesStore.heroes = [makeHero('h1'), makeHero('h2'), makeHero('h3')]
    await wrapper.vm.$nextTick()

    const heroCards = wrapper.findAll('button[role="listitem"]')
    await heroCards[0]!.trigger('click')
    await heroCards[1]!.trigger('click')
    await heroCards[2]!.trigger('click')
    await wrapper.vm.$nextTick()

    const allButtons = wrapper.findAll('button')
    const simulateCta = allButtons.find((b) => b.text().includes('Simular'))
    expect(simulateCta?.attributes('disabled')).toBeUndefined()
  })

  it('4th hero click is blocked (selection stays at 3)', async () => {
    const wrapper = mountSelector()
    const heroesStore = useHeroesStore()
    heroesStore.heroes = [makeHero('h1'), makeHero('h2'), makeHero('h3'), makeHero('h4')]
    await wrapper.vm.$nextTick()

    const heroCards = wrapper.findAll('button[role="listitem"]')
    await heroCards[0]!.trigger('click')
    await heroCards[1]!.trigger('click')
    await heroCards[2]!.trigger('click')
    await wrapper.vm.$nextTick()

    // 4th button should be disabled
    expect(heroCards[3]!.attributes('disabled')).toBeDefined()

    const pentathlonStore = usePentathlonStore()
    await heroCards[3]!.trigger('click')
    expect(pentathlonStore.selectedIds).toHaveLength(3)
  })
})
