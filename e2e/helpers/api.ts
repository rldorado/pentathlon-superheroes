import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * Read API credentials from .env.local so E2E specs can seed/clean state via
 * the real API. Vite is not loaded in Playwright; we parse the file ourselves.
 */
function readEnvLocal(): Record<string, string> {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return {}
  const text = fs.readFileSync(envPath, 'utf-8')
  const out: Record<string, string> = {}
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return out
}

const env = readEnvLocal()
export const API_BASE = env.VITE_PENTATHLON_API_BASE_URL ?? 'https://codetest-api.applivery.io'
export const API_KEY = env.VITE_PENTATHLON_API_KEY ?? ''

export interface HeroAttributes {
  agility: number
  strength: number
  weight: number
  endurance: number
  charisma: number
}

export interface ApiHero {
  id: string
  name: string
  picture?: string
  attributes: HeroAttributes
  createdAt: string
  updatedAt: string
}

export interface HeroInput {
  name: string
  picture?: string
  attributes: HeroAttributes
}

async function request<T>(method: string, p: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${p}`, {
    method,
    headers: {
      Authorization: API_KEY,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    throw new Error(`API ${method} ${p} failed: ${res.status} ${await res.text()}`)
  }
  return (await res.json()) as T
}

export const api = {
  createHero: (input: HeroInput) => request<ApiHero>('POST', '/pentathlon/heroes/', input),
  deleteHero: (id: string) => request<{ done: boolean }>('DELETE', `/pentathlon/heroes/${id}`),
  listHeroes: () => request<ApiHero[]>('GET', '/pentathlon/heroes/'),
}

/** A 128x128 solid PNG buffer encoded as base64 (no data: prefix). */
export function loadHeroFixtureBase64(): string {
  const p = path.resolve(process.cwd(), 'e2e/fixtures/hero-128.png')
  return fs.readFileSync(p).toString('base64')
}

export function makeAttributes(seed: number): HeroAttributes {
  const v = (n: number) => ((seed + n) % 11)
  return {
    agility: v(1),
    strength: v(3),
    weight: v(5),
    endurance: v(7),
    charisma: v(9),
  }
}

export function uniqueName(prefix: string): string {
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  return `${prefix} ${suffix}`
}
