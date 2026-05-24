/**
 * Hero feature — types and injection keys.
 *
 * `HeroAttributes` is re-exported from the pure scoring engine so this
 * feature and the engine share one canonical shape (per docs/plan.md §3.4 +
 * §6.1). Reusing the engine type prevents drift and keeps the engine the
 * single source of truth for attribute structure.
 */

import type { InjectionKey } from 'vue'
import type { HeroAttributes } from '@/features/pentathlon/scoring/types'

export type { HeroAttributes }

export interface Hero {
  id: string
  /** ISO 8601 timestamp from the API. */
  createdAt: string
  /** ISO 8601 timestamp from the API. */
  updatedAt: string
  name: string
  /**
   * Pure base64 string (no `data:image/...;base64,` prefix) as stored by the
   * API. Optional per the server schema; required at create by our UX
   * (AC-2.3). Display code reattaches a sniffed MIME prefix when rendering.
   */
  picture?: string
  attributes: HeroAttributes
}

/** Body shape for `POST /pentathlon/heroes/` and `PUT /pentathlon/heroes/{id}`. */
export interface HeroInput {
  name: string
  picture?: string
  attributes: HeroAttributes
}

/**
 * Injection key for the heroes Pinia store. Provided by `HeroesPage.vue`,
 * consumed by `HeroFormDialog`, `HeroCard`, and `ConfirmDeleteDialog` so
 * those components don't need to import the store directly.
 */
import type { useHeroesStore } from './store'
export const heroesStoreKey: InjectionKey<ReturnType<typeof useHeroesStore>> = Symbol(
  'heroesStoreKey',
)
