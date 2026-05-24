/**
 * Heroes roster store (Pinia).
 *
 * Shape: `state + getters + actions`. Actions never throw to callers — they
 * catch `ApiError`, map it to a Spanish message via
 * `shared/http/errors.ts`, and set `store.error`. The UI renders
 * `state.error` inline; success paths clear it.
 *
 * Mutations are optimistic-when-safe: `create` appends the API result;
 * `update` replaces in place; `remove` filters; `load` fully replaces the
 * roster. We do not optimistically update before the server confirms
 * because the API assigns ids and timestamps.
 */

import { defineStore } from 'pinia'
import { listHeroes, createHero, updateHero, deleteHero } from './api'
import { mapApiError } from '@/shared/http/errors'
import type { Hero, HeroInput } from './types'

export type HeroesStatus = 'idle' | 'loading' | 'ready' | 'error'

interface State {
  heroes: Hero[]
  status: HeroesStatus
  error: string | null
}

export const useHeroesStore = defineStore('heroes', {
  state: (): State => ({
    heroes: [],
    status: 'idle',
    error: null,
  }),

  getters: {
    count: (state): number => state.heroes.length,

    byId:
      (state) =>
      (id: string): Hero | undefined =>
        state.heroes.find((h) => h.id === id),

    /**
     * Case-insensitive name presence check (after trim). Pass `exceptId` to
     * exclude the hero currently being edited so the form does not flag
     * the user's own name as a duplicate.
     */
    hasName:
      (state) =>
      (name: string, exceptId?: string): boolean => {
        const target = name.trim().toLocaleLowerCase('es')
        return state.heroes.some(
          (h) => h.id !== exceptId && h.name.trim().toLocaleLowerCase('es') === target,
        )
      },
  },

  actions: {
    async load(): Promise<void> {
      this.status = 'loading'
      this.error = null
      try {
        this.heroes = await listHeroes()
        this.status = 'ready'
      } catch (err) {
        this.error = mapApiError(err)
        this.status = 'error'
      }
    },

    async create(input: HeroInput): Promise<Hero | null> {
      this.error = null
      try {
        const created = await createHero(input)
        this.heroes = [...this.heroes, created]
        return created
      } catch (err) {
        this.error = mapApiError(err)
        return null
      }
    },

    async update(id: string, input: HeroInput): Promise<Hero | null> {
      this.error = null
      try {
        const updated = await updateHero(id, input)
        this.heroes = this.heroes.map((h) => (h.id === id ? updated : h))
        return updated
      } catch (err) {
        this.error = mapApiError(err)
        return null
      }
    },

    async remove(id: string): Promise<boolean> {
      this.error = null
      try {
        await deleteHero(id)
        this.heroes = this.heroes.filter((h) => h.id !== id)
        return true
      } catch (err) {
        this.error = mapApiError(err)
        return false
      }
    },
  },
})
