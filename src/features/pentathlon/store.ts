/**
 * Pentathlon simulation store (Pinia).
 *
 * `start()` runs `simulate()` eagerly — all 5 events + classification are
 * precomputed and stored. `cursor` (0..5) drives the UI reveal:
 *   0..4  →  viewing event at index `cursor` (run phase)
 *   5     →  classification ready (podium phase)
 *   null run → selection phase
 */
import { defineStore } from 'pinia'
import { simulate } from './scoring/simulate'
import type { ClassificationEntry, EventResult, PentathlonRun } from './scoring/types'
import type { Hero } from '@/features/heroes/types'

interface State {
  selectedIds: string[]
  run: PentathlonRun | null
  cursor: number // 0..5
}

export const usePentathlonStore = defineStore('pentathlon', {
  state: (): State => ({
    selectedIds: [],
    run: null,
    cursor: 0,
  }),

  getters: {
    canStart: (state): boolean => state.selectedIds.length === 3,

    currentEvent: (state): EventResult | null => {
      if (!state.run || state.cursor >= 5) return null
      return state.run.events[state.cursor] ?? null
    },

    visibleEvents: (state): readonly EventResult[] => {
      if (!state.run) return []
      return [...state.run.events].slice(0, state.cursor)
    },

    classification: (state): readonly ClassificationEntry[] | null => {
      if (!state.run || state.cursor < 5) return null
      return state.run.classification
    },
  },

  actions: {
    toggleSelect(id: string): void {
      const idx = this.selectedIds.indexOf(id)
      if (idx !== -1) {
        this.selectedIds = this.selectedIds.filter((s) => s !== id)
      } else if (this.selectedIds.length < 3) {
        this.selectedIds = [...this.selectedIds, id]
      }
    },

    clearSelection(): void {
      this.selectedIds = []
    },

    start(participants: [Hero, Hero, Hero]): void {
      this.run = simulate(participants)
      this.cursor = 0
    },

    advance(): void {
      if (this.cursor < 5) this.cursor++
    },

    reset(): void {
      this.run = null
      this.cursor = 0
      this.selectedIds = []
    },
  },
})
