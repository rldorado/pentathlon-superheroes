/**
 * Final classification + tiebreaker (clarification.md D-11).
 *
 * Sort cascade:
 *   1. totalPoints desc
 *   2. wins desc            (D-9: ties for max count as wins)
 *   3. lastEventValue desc  (value scored in event 5)
 *   4. name asc             (Spanish locale, case-insensitive)
 *
 * Returns a 3-tuple with distinct ranks 1/2/3 — the podium UI has three
 * slots and the rule set guarantees a deterministic break.
 */

import type { ClassificationEntry, ScoringHero } from './types'

export interface ClassificationInput {
  heroId: string
  totalPoints: number
  wins: number
  lastEventValue: number
}

function compareEntries(
  a: ClassificationInput,
  b: ClassificationInput,
  nameOf: (id: string) => string,
): number {
  if (a.totalPoints !== b.totalPoints) return b.totalPoints - a.totalPoints
  if (a.wins !== b.wins) return b.wins - a.wins
  if (a.lastEventValue !== b.lastEventValue) return b.lastEventValue - a.lastEventValue
  return nameOf(a.heroId).localeCompare(nameOf(b.heroId), 'es', { sensitivity: 'base' })
}

export function buildClassification(
  inputs: readonly ClassificationInput[],
  heroes: readonly ScoringHero[],
): readonly [ClassificationEntry, ClassificationEntry, ClassificationEntry] {
  if (inputs.length !== 3) {
    throw new Error(`buildClassification requires exactly 3 entries, got ${inputs.length}`)
  }
  const byId = new Map(heroes.map((h) => [h.id, h] as const))
  const nameOf = (id: string): string => byId.get(id)?.name ?? id

  const sorted = [...inputs].sort((a, b) => compareEntries(a, b, nameOf))
  const ranked = sorted.map(
    (e, idx): ClassificationEntry => ({
      ...e,
      rank: (idx + 1) as 1 | 2 | 3,
    }),
  )
  return [ranked[0]!, ranked[1]!, ranked[2]!] as const
}
