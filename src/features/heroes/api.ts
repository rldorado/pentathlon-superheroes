/**
 * Hero CRUD over the Applivery code-test API.
 *
 * Paths per docs/plan.md §3.3 — trailing slash on `/pentathlon/heroes/` is
 * intentional and must not be stripped. Resource-by-id paths intentionally
 * carry no trailing slash.
 *
 * Auth header injection and error mapping are owned by `shared/http/client.ts`.
 */

import { request } from '@/shared/http/client'
import type { Hero, HeroInput } from './types'

const COLLECTION = '/pentathlon/heroes/'
const resource = (id: string): string => `/pentathlon/heroes/${id}`

export function listHeroes(): Promise<Hero[]> {
  return request<Hero[]>('GET', COLLECTION)
}

export function createHero(input: HeroInput): Promise<Hero> {
  return request<Hero>('POST', COLLECTION, { body: input })
}

export function updateHero(id: string, input: HeroInput): Promise<Hero> {
  return request<Hero>('PUT', resource(id), { body: input })
}

export function deleteHero(id: string): Promise<{ done: boolean }> {
  return request<{ done: boolean }>('DELETE', resource(id))
}
