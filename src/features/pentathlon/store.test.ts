import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePentathlonStore } from './store'
import type { PentathlonRun } from './scoring/types'
import type { Hero } from '@/features/heroes/types'

const mockRun: PentathlonRun = {
  participantIds: ['h1', 'h2', 'h3'],
  events: [
    { eventId: 1, name: 'E1', formula: 'f1', participants: [{ heroId: 'h1', value: 10, points: 5, reasons: [] }, { heroId: 'h2', value: 8, points: 3, reasons: [] }, { heroId: 'h3', value: 3, points: 1, reasons: [] }] },
    { eventId: 2, name: 'E2', formula: 'f2', participants: [{ heroId: 'h2', value: 10, points: 5, reasons: [] }, { heroId: 'h1', value: 5, points: 3, reasons: [] }, { heroId: 'h3', value: 2, points: 1, reasons: [] }] },
    { eventId: 3, name: 'E3', formula: 'f3', participants: [{ heroId: 'h1', value: 7, points: 5, reasons: [] }, { heroId: 'h2', value: 5, points: 3, reasons: [] }, { heroId: 'h3', value: 3, points: 1, reasons: [] }] },
    { eventId: 4, name: 'E4', formula: 'f4', participants: [{ heroId: 'h1', value: 6, points: 5, reasons: [] }, { heroId: 'h2', value: 4, points: 3, reasons: [] }, { heroId: 'h3', value: 2, points: 1, reasons: [] }] },
    { eventId: 5, name: 'E5', formula: 'f5', participants: [{ heroId: 'h1', value: 5, points: 5, reasons: [] }, { heroId: 'h2', value: 3, points: 3, reasons: [] }, { heroId: 'h3', value: 1, points: 1, reasons: [] }] },
  ],
  classification: [
    { heroId: 'h1', totalPoints: 23, wins: 3, lastEventValue: 5, rank: 1 },
    { heroId: 'h2', totalPoints: 17, wins: 1, lastEventValue: 3, rank: 2 },
    { heroId: 'h3', totalPoints: 5, wins: 0, lastEventValue: 1, rank: 3 },
  ],
}

vi.mock('./scoring/simulate', () => ({
  simulate: vi.fn(() => mockRun),
}))

const makeHero = (id: string): Hero => ({
  id,
  name: `Hero ${id}`,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  attributes: { agility: 5, strength: 5, weight: 5, endurance: 5, charisma: 5 },
})

describe('usePentathlonStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('toggleSelect', () => {
    it('adds id to selection', () => {
      const store = usePentathlonStore()
      store.toggleSelect('h1')
      expect(store.selectedIds).toEqual(['h1'])
    })

    it('removes id on second toggle', () => {
      const store = usePentathlonStore()
      store.toggleSelect('h1')
      store.toggleSelect('h1')
      expect(store.selectedIds).toEqual([])
    })

    it('allows up to 3 distinct ids', () => {
      const store = usePentathlonStore()
      store.toggleSelect('h1')
      store.toggleSelect('h2')
      store.toggleSelect('h3')
      expect(store.selectedIds).toHaveLength(3)
    })

    it('does not add a 4th id', () => {
      const store = usePentathlonStore()
      store.toggleSelect('h1')
      store.toggleSelect('h2')
      store.toggleSelect('h3')
      store.toggleSelect('h4')
      expect(store.selectedIds).toHaveLength(3)
      expect(store.selectedIds).not.toContain('h4')
    })
  })

  describe('canStart getter', () => {
    it('is false when fewer than 3 selected', () => {
      const store = usePentathlonStore()
      store.toggleSelect('h1')
      store.toggleSelect('h2')
      expect(store.canStart).toBe(false)
    })

    it('is true when exactly 3 selected', () => {
      const store = usePentathlonStore()
      store.toggleSelect('h1')
      store.toggleSelect('h2')
      store.toggleSelect('h3')
      expect(store.canStart).toBe(true)
    })
  })

  describe('start', () => {
    it('calls simulate and stores run', () => {
      const store = usePentathlonStore()
      store.start([makeHero('h1'), makeHero('h2'), makeHero('h3')])
      expect(store.run).toStrictEqual(mockRun)
    })

    it('sets cursor to 0', () => {
      const store = usePentathlonStore()
      store.start([makeHero('h1'), makeHero('h2'), makeHero('h3')])
      expect(store.cursor).toBe(0)
    })
  })

  describe('advance', () => {
    it('increments cursor', () => {
      const store = usePentathlonStore()
      store.start([makeHero('h1'), makeHero('h2'), makeHero('h3')])
      store.advance()
      expect(store.cursor).toBe(1)
    })

    it('does not exceed 5', () => {
      const store = usePentathlonStore()
      store.start([makeHero('h1'), makeHero('h2'), makeHero('h3')])
      for (let i = 0; i < 10; i++) store.advance()
      expect(store.cursor).toBe(5)
    })
  })

  describe('reset', () => {
    it('clears run, cursor, and selectedIds', () => {
      const store = usePentathlonStore()
      store.toggleSelect('h1')
      store.start([makeHero('h1'), makeHero('h2'), makeHero('h3')])
      store.advance()
      store.reset()
      expect(store.run).toBeNull()
      expect(store.cursor).toBe(0)
      expect(store.selectedIds).toEqual([])
    })
  })

  describe('currentEvent getter', () => {
    it('returns null when no run', () => {
      const store = usePentathlonStore()
      expect(store.currentEvent).toBeNull()
    })

    it('returns events[cursor] during run phase', () => {
      const store = usePentathlonStore()
      store.start([makeHero('h1'), makeHero('h2'), makeHero('h3')])
      expect(store.currentEvent).toStrictEqual(mockRun.events[0])
      store.advance()
      expect(store.currentEvent).toStrictEqual(mockRun.events[1])
    })

    it('returns null at cursor === 5 (podium)', () => {
      const store = usePentathlonStore()
      store.start([makeHero('h1'), makeHero('h2'), makeHero('h3')])
      for (let i = 0; i < 5; i++) store.advance()
      expect(store.currentEvent).toBeNull()
    })
  })

  describe('classification getter', () => {
    it('returns null before cursor reaches 5', () => {
      const store = usePentathlonStore()
      store.start([makeHero('h1'), makeHero('h2'), makeHero('h3')])
      store.advance()
      expect(store.classification).toBeNull()
    })

    it('returns classification when cursor === 5', () => {
      const store = usePentathlonStore()
      store.start([makeHero('h1'), makeHero('h2'), makeHero('h3')])
      for (let i = 0; i < 5; i++) store.advance()
      expect(store.classification).toStrictEqual(mockRun.classification)
    })
  })
})
