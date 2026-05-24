/**
 * Per-event pure formulas (docs/plan.md §6.2).
 *
 * Each function returns `{ value, reasons }`. `reasons` collects Spanish
 * strings only when a conditional bonus or explicit penalty fires; the
 * default ("no bonus") path is silent.
 *
 * Tie semantics:
 *   - Event 3 last-in-general tolerates ties (D-8): all tied-lasts get +5.
 *   - Event 4 won-previous tolerates ties (D-7): all tied-for-max in event 3
 *     get +10; everyone else gets −1.
 *   - Event 5 win-count tolerates ties (D-9): tied-for-max in an event counts
 *     as a win for every tied participant.
 */

import type { EventContext, EventId, EventResult, ScoringHero } from './types'

export type { EventContext } from './types'

export interface EventOutput {
  value: number
  reasons: string[]
}

type Formula = (
  self: ScoringHero,
  opponents: readonly ScoringHero[],
  ctx: EventContext,
) => EventOutput

/** Helper: returns true iff `heroId` was among the tied-for-max in `event`. */
function isWinnerOf(event: EventResult, heroId: string): boolean {
  const max = Math.max(...event.participants.map((p) => p.value))
  return event.participants.some((p) => p.heroId === heroId && p.value === max)
}

/** Helper: count of events in `eventsSoFar` where the hero tied for max. */
function winCount(eventsSoFar: readonly EventResult[], heroId: string): number {
  return eventsSoFar.reduce((acc, e) => (isWinnerOf(e, heroId) ? acc + 1 : acc), 0)
}

/** Helper: returns true iff hero's pointsSoFar equals the minimum across all 3. */
function isLastInGeneral(pointsSoFar: Record<string, number>, heroId: string): boolean {
  const values = Object.values(pointsSoFar)
  if (values.length === 0) return false
  const min = Math.min(...values)
  return pointsSoFar[heroId] === min
}

// ───── Formulas ────────────────────────────────────────────────────────────

export const event1: Formula = (self) => {
  const { strength, weight } = self.attributes
  return { value: strength * 4 - weight * 2, reasons: [] }
}

export const event2: Formula = (self, opponents) => {
  const sumOpp = opponents.reduce((acc, h) => acc + h.attributes.charisma, 0)
  return { value: self.attributes.charisma ** 2 - sumOpp, reasons: [] }
}

export const event3: Formula = (self, _opp, ctx) => {
  const reasons: string[] = []
  const base = self.attributes.agility + self.attributes.strength
  let bonus = 0
  if (isLastInGeneral(ctx.pointsSoFar, self.id)) {
    bonus = 5
    reasons.push('+5 por ir último en la general acumulada')
  }
  return { value: base + bonus, reasons }
}

export const event4: Formula = (self, _opp, ctx) => {
  const reasons: string[] = []
  const base = self.attributes.agility * 4 + self.attributes.endurance * 2
  const event3Result = ctx.eventsSoFar.find((e) => e.eventId === 3)
  let delta = 0
  if (event3Result && isWinnerOf(event3Result, self.id)) {
    delta = 10
    reasons.push('+10 por ganar la Prueba 3')
  } else {
    delta = -1
    reasons.push('−1 por no ganar la Prueba 3')
  }
  return { value: base + delta, reasons }
}

export const event5: Formula = (self, _opp, ctx) => {
  const reasons: string[] = []
  const base = self.attributes.agility * 2
  let bonus = 0
  if (winCount(ctx.eventsSoFar, self.id) >= 2) {
    bonus = 5
    reasons.push('+5 por haber ganado al menos 2 pruebas')
  }
  return { value: base + bonus, reasons }
}

// ───── Metadata ─────────────────────────────────────────────────────────────

export interface EventMeta {
  eventId: EventId
  name: string
  formula: string
  fn: Formula
}

export const EVENT_META: readonly EventMeta[] = [
  {
    eventId: 1,
    name: 'Escalar el rascacielos',
    formula: '(fuerza × 4) − (peso × 2)',
    fn: event1,
  },
  {
    eventId: 2,
    name: 'Contar un chiste',
    formula: '(carisma²) − Σ(carisma de los rivales)',
    fn: event2,
  },
  {
    eventId: 3,
    name: 'Disparar al villano',
    formula: '(agilidad + fuerza) · +5 si vas último',
    fn: event3,
  },
  {
    eventId: 4,
    name: 'Sprint de 200 km',
    formula: '(agilidad × 4) + (resistencia × 2) · +10 si ganaste la Prueba 3, −1 si no',
    fn: event4,
  },
  {
    eventId: 5,
    name: 'Rescatar 100 gatitos',
    formula: '(agilidad × 2) · +5 si has ganado ≥ 2 pruebas',
    fn: event5,
  },
]
