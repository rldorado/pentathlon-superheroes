/**
 * 5/3/1 points allocator with **average-on-tie** per clarification.md D-6.
 *
 * Algorithm (docs/plan.md §6.3):
 *   1. Sort participants by `value` desc.
 *   2. Group consecutive participants with equal `value`.
 *   3. Each group occupying positions [i, …, i+k-1] (0-indexed in the sorted
 *      list) gets `mean(BASE_POINTS[i..i+k-1])`.
 *
 * Negative values are permitted (D-12) and do not get clamped — the sort is
 * by raw value desc. The function is pure: input is not mutated, output
 * preserves input order so the caller's per-event index stays stable.
 */

const BASE_POINTS: readonly [number, number, number] = [5, 3, 1]

export interface PointInput {
  heroId: string
  value: number
}

export interface PointOutput {
  heroId: string
  points: number
}

export function allocatePoints(participants: readonly PointInput[]): PointOutput[] {
  // Stable sort by value desc on a shallow copy with original index preserved.
  const indexed = participants.map((p, idx) => ({ ...p, idx }))
  indexed.sort((a, b) => b.value - a.value)

  // Walk sorted list, group consecutive equal values, assign the average of
  // the BASE_POINTS slice spanning that group.
  const pointsByIdx = new Array<number>(participants.length)
  let i = 0
  while (i < indexed.length) {
    let j = i
    while (j + 1 < indexed.length && indexed[j + 1]!.value === indexed[i]!.value) j++
    const slice = BASE_POINTS.slice(i, j + 1)
    const mean = slice.reduce((acc, n) => acc + n, 0) / slice.length
    for (let k = i; k <= j; k++) pointsByIdx[indexed[k]!.idx] = mean
    i = j + 1
  }

  return participants.map((p, idx) => ({ heroId: p.heroId, points: pointsByIdx[idx]! }))
}
