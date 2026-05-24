import { describe, it, expect } from 'vitest'
import { allocatePoints } from './points'

/**
 * T-19 — Points allocator (5/3/1 with average-on-tie per D-6).
 *
 * Algorithm (plan.md §6.3):
 *   1. Sort participants by `value` desc.
 *   2. Group consecutive participants with equal `value`.
 *   3. Each group at positions [i..i+k-1] (0-indexed in sorted list) gets
 *      `mean(BASE_POINTS[i..i+k-1])` where BASE_POINTS = [5, 3, 1].
 *
 * Returns participants in INPUT order (not sorted) so the caller's roster
 * stays stable across events.
 */
describe('allocatePoints', () => {
  it('no ties: [10, 8, 3] → [5, 3, 1]', () => {
    expect(
      allocatePoints([
        { heroId: 'a', value: 10 },
        { heroId: 'b', value: 8 },
        { heroId: 'c', value: 3 },
      ]),
    ).toEqual([
      { heroId: 'a', points: 5 },
      { heroId: 'b', points: 3 },
      { heroId: 'c', points: 1 },
    ])
  })

  it('1º = 2º, 3º distinto: [10, 10, 3] → [4, 4, 1]', () => {
    expect(
      allocatePoints([
        { heroId: 'a', value: 10 },
        { heroId: 'b', value: 10 },
        { heroId: 'c', value: 3 },
      ]),
    ).toEqual([
      { heroId: 'a', points: 4 },
      { heroId: 'b', points: 4 },
      { heroId: 'c', points: 1 },
    ])
  })

  it('1º distinto, 2º = 3º: [10, 3, 3] → [5, 2, 2]', () => {
    expect(
      allocatePoints([
        { heroId: 'a', value: 10 },
        { heroId: 'b', value: 3 },
        { heroId: 'c', value: 3 },
      ]),
    ).toEqual([
      { heroId: 'a', points: 5 },
      { heroId: 'b', points: 2 },
      { heroId: 'c', points: 2 },
    ])
  })

  it('los 3 empatados: [7, 7, 7] → [3, 3, 3]', () => {
    expect(
      allocatePoints([
        { heroId: 'a', value: 7 },
        { heroId: 'b', value: 7 },
        { heroId: 'c', value: 7 },
      ]),
    ).toEqual([
      { heroId: 'a', points: 3 },
      { heroId: 'b', points: 3 },
      { heroId: 'c', points: 3 },
    ])
  })

  it('zero edge: [0, 0, 0] → [3, 3, 3]', () => {
    expect(
      allocatePoints([
        { heroId: 'a', value: 0 },
        { heroId: 'b', value: 0 },
        { heroId: 'c', value: 0 },
      ]),
    ).toEqual([
      { heroId: 'a', points: 3 },
      { heroId: 'b', points: 3 },
      { heroId: 'c', points: 3 },
    ])
  })

  it('all-equal negatives: [-5, -5, -5] → [3, 3, 3] (D-12 allows negative values)', () => {
    expect(
      allocatePoints([
        { heroId: 'a', value: -5 },
        { heroId: 'b', value: -5 },
        { heroId: 'c', value: -5 },
      ]),
    ).toEqual([
      { heroId: 'a', points: 3 },
      { heroId: 'b', points: 3 },
      { heroId: 'c', points: 3 },
    ])
  })

  it('mixed-sign with negatives: [-2, -3, -10] → [5, 3, 1] (sorted by value desc)', () => {
    expect(
      allocatePoints([
        { heroId: 'a', value: -2 },
        { heroId: 'b', value: -3 },
        { heroId: 'c', value: -10 },
      ]),
    ).toEqual([
      { heroId: 'a', points: 5 },
      { heroId: 'b', points: 3 },
      { heroId: 'c', points: 1 },
    ])
  })

  it('output order matches input order (stable), points come from value only', () => {
    const a = allocatePoints([
      { heroId: 'x', value: 8 },
      { heroId: 'y', value: 10 },
      { heroId: 'z', value: 3 },
    ])
    expect(a.map((p) => p.heroId)).toEqual(['x', 'y', 'z'])
    expect(a).toEqual([
      { heroId: 'x', points: 3 },
      { heroId: 'y', points: 5 },
      { heroId: 'z', points: 1 },
    ])
  })

  it('same values + different input order yields same points by id', () => {
    const r1 = allocatePoints([
      { heroId: 'a', value: 10 },
      { heroId: 'b', value: 10 },
      { heroId: 'c', value: 3 },
    ])
    const r2 = allocatePoints([
      { heroId: 'b', value: 10 },
      { heroId: 'c', value: 3 },
      { heroId: 'a', value: 10 },
    ])
    const byId1 = Object.fromEntries(r1.map((p) => [p.heroId, p.points]))
    const byId2 = Object.fromEntries(r2.map((p) => [p.heroId, p.points]))
    expect(byId1).toEqual(byId2)
  })

  it('does not mutate the input array', () => {
    const input = [
      { heroId: 'a', value: 3 },
      { heroId: 'b', value: 10 },
      { heroId: 'c', value: 7 },
    ]
    const snapshot = JSON.stringify(input)
    allocatePoints(input)
    expect(JSON.stringify(input)).toBe(snapshot)
  })
})
