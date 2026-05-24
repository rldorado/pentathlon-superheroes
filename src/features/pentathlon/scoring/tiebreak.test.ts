import { describe, it, expect } from 'vitest'
import { buildClassification, type ClassificationInput } from './tiebreak'
import type { HeroAttributes, ScoringHero } from './types'

/**
 * T-22 — Final classification + tiebreaker (clarification.md D-11).
 *
 * Sort cascade:
 *   1. totalPoints desc
 *   2. wins desc        (D-9: ties for max count as wins)
 *   3. lastEventValue desc (value in event 5)
 *   4. name asc (Spanish locale, case-insensitive)
 *
 * Output: exactly 3 entries with distinct ranks 1/2/3.
 */

const a0: HeroAttributes = { agility: 0, strength: 0, weight: 0, endurance: 0, charisma: 0 }
function hero(id: string, name: string): ScoringHero {
  return { id, name, attributes: a0 }
}
function entry(id: string, points: number, wins: number, lastEventValue: number): ClassificationInput {
  return { heroId: id, totalPoints: points, wins, lastEventValue }
}

describe('buildClassification', () => {
  const heroes = [hero('a', 'Capitán Fuerza'), hero('b', 'La Sombra'), hero('c', 'Byte Runner')]

  it('points alone decide when there are no ties', () => {
    const out = buildClassification(
      [entry('a', 22, 3, 10), entry('b', 16, 1, 5), entry('c', 9, 0, 2)],
      heroes,
    )
    expect(out.map((e) => e.heroId)).toEqual(['a', 'b', 'c'])
    expect(out.map((e) => e.rank)).toEqual([1, 2, 3])
  })

  it('tie on points → wins decide', () => {
    const out = buildClassification(
      [entry('a', 15, 1, 5), entry('b', 15, 3, 2), entry('c', 8, 0, 1)],
      heroes,
    )
    expect(out.map((e) => e.heroId)).toEqual(['b', 'a', 'c'])
    expect(out.map((e) => e.rank)).toEqual([1, 2, 3])
  })

  it('tie on points + wins → event 5 value decides', () => {
    const out = buildClassification(
      [entry('a', 15, 2, 5), entry('b', 15, 2, 9), entry('c', 5, 0, 0)],
      heroes,
    )
    expect(out.map((e) => e.heroId)).toEqual(['b', 'a', 'c'])
    expect(out.map((e) => e.rank)).toEqual([1, 2, 3])
  })

  it('tie on points + wins + event-5 value → es alphabetical (case-insensitive)', () => {
    const out = buildClassification(
      [entry('a', 15, 2, 5), entry('b', 15, 2, 5), entry('c', 5, 0, 0)],
      [hero('a', 'capitán Fuerza'), hero('b', 'La Sombra'), hero('c', 'Byte Runner')],
    )
    // "capitán Fuerza" < "La Sombra" (es locale, case-insensitive)
    // 'b' (Byte Runner) is third on points alone in this case but we want
    // to show the alphabetical break works on positions 1+2, where a and b
    // are tied. Adjusting: pin c to last, alphabet between a and b.
    expect(out.map((e) => e.heroId)).toEqual(['a', 'b', 'c'])
    expect(out.map((e) => e.rank)).toEqual([1, 2, 3])
  })

  it('alphabetical sort uses Spanish locale (ñ ordered after n, before o)', () => {
    const tied = [entry('a', 10, 2, 5), entry('b', 10, 2, 5), entry('c', 10, 2, 5)]
    const out = buildClassification(tied, [
      hero('a', 'Ñandú'),
      hero('b', 'Nora'),
      hero('c', 'Otto'),
    ])
    // es-locale ordering: Nora < Ñandú < Otto.
    expect(out.map((e) => e.heroId)).toEqual(['b', 'a', 'c'])
  })

  it('all-4-tied → stable alphabetical, distinct ranks 1/2/3', () => {
    const out = buildClassification(
      [entry('a', 9, 1, 3), entry('b', 9, 1, 3), entry('c', 9, 1, 3)],
      [hero('a', 'Alfa'), hero('b', 'Beta'), hero('c', 'Gamma')],
    )
    expect(out.map((e) => e.heroId)).toEqual(['a', 'b', 'c'])
    expect(out.map((e) => e.rank)).toEqual([1, 2, 3])
  })

  it('produces a 3-element tuple regardless of input order', () => {
    const out = buildClassification(
      [entry('c', 9, 0, 2), entry('a', 22, 3, 10), entry('b', 16, 1, 5)],
      heroes,
    )
    expect(out).toHaveLength(3)
    expect(out.map((e) => e.heroId)).toEqual(['a', 'b', 'c'])
  })

  it('does not mutate the input arrays', () => {
    const inputs = [entry('a', 9, 1, 3), entry('b', 9, 1, 3), entry('c', 9, 1, 3)]
    const snap = JSON.stringify(inputs)
    buildClassification(inputs, heroes)
    expect(JSON.stringify(inputs)).toBe(snap)
  })

  it('throws when entries.length !== 3 (defensive invariant)', () => {
    expect(() => buildClassification([entry('a', 10, 1, 0), entry('b', 5, 0, 0)], heroes)).toThrow()
    expect(() =>
      buildClassification(
        [entry('a', 10, 1, 0), entry('b', 5, 0, 0), entry('c', 1, 0, 0), entry('d', 0, 0, 0)],
        [...heroes, hero('d', 'D')],
      ),
    ).toThrow()
  })
})
