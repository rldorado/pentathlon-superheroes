import { describe, it, expect } from 'vitest'
import { simulate } from './simulate'
import type { HeroAttributes, ScoringHero } from './types'

const a0: HeroAttributes = { agility: 0, strength: 0, weight: 0, endurance: 0, charisma: 0 }
function hero(id: string, name: string, attrs: Partial<HeroAttributes>): ScoringHero {
  return { id, name, attributes: { ...a0, ...attrs } }
}

/**
 * T-21 — Simulation orchestrator.
 *
 * AC (tasks.md):
 *   - Deterministic: identical input → identical output every call.
 *   - Sequential propagation: a roster where the +5 bonus in event 3 flips
 *     the leader, and that flip changes event 4's +10/−1 assignment.
 *   - 50× identical calls produce identical output (no Date/Math.random use).
 */

describe('simulate — golden case from the design-reference roster', () => {
  const heroes = [
    hero('a', 'Capitán Fuerza', { strength: 9, agility: 4, weight: 7, endurance: 6, charisma: 5 }),
    hero('b', 'La Sombra', { strength: 3, agility: 8, weight: 2, endurance: 7, charisma: 6 }),
    hero('c', 'Byte Runner', { strength: 5, agility: 7, weight: 4, endurance: 8, charisma: 9 }),
  ] as const

  const run = simulate(heroes)

  it('preserves the participant ids order', () => {
    expect(run.participantIds).toEqual(['a', 'b', 'c'])
  })

  it('returns exactly 5 events in id order', () => {
    expect(run.events.map((e) => e.eventId)).toEqual([1, 2, 3, 4, 5])
  })

  it('event 1 — (strength × 4) − (weight × 2): values 22 / 8 / 12, points 5 / 1 / 3', () => {
    const ev1 = run.events[0]
    // EventResult.participants are sorted by value desc.
    expect(ev1.participants.map((p) => p.heroId)).toEqual(['a', 'c', 'b'])
    expect(ev1.participants.map((p) => p.value)).toEqual([22, 12, 8])
    expect(ev1.participants.map((p) => p.points)).toEqual([5, 3, 1])
  })

  it('event 2 — charisma² − Σ(opponents.charisma): values 10 / 22 / 70, points 1 / 3 / 5', () => {
    const ev2 = run.events[1]
    expect(ev2.participants.map((p) => p.heroId)).toEqual(['c', 'b', 'a'])
    expect(ev2.participants.map((p) => p.value)).toEqual([70, 22, 10])
    expect(ev2.participants.map((p) => p.points)).toEqual([5, 3, 1])
  })

  it('event 3 — last-in-general after events 1+2 is "b" → +5 bonus and Spanish reason', () => {
    // After ev1+ev2: a=5+1=6, b=1+3=4, c=3+5=8 → b is last alone.
    const ev3 = run.events[2]
    const b = ev3.participants.find((p) => p.heroId === 'b')!
    expect(b.value).toBe(8 + 3 + 5) // agility 8 + strength 3 + bonus 5
    expect(b.reasons).toEqual(['+5 por ir último en la general acumulada'])
    const a = ev3.participants.find((p) => p.heroId === 'a')!
    expect(a.reasons).toEqual([])
  })

  it('event 4 — "b" won event 3 → +10 bonus reason; others get the −1 penalty reason', () => {
    const ev4 = run.events[3]
    const a = ev4.participants.find((p) => p.heroId === 'a')!
    const b = ev4.participants.find((p) => p.heroId === 'b')!
    const c = ev4.participants.find((p) => p.heroId === 'c')!
    expect(b.value).toBe(8 * 4 + 7 * 2 + 10) // 56
    expect(b.reasons).toEqual(['+10 por ganar la Prueba 3'])
    expect(a.value).toBe(4 * 4 + 6 * 2 - 1) // 27
    expect(a.reasons).toEqual(['−1 por no ganar la Prueba 3'])
    expect(c.value).toBe(7 * 4 + 8 * 2 - 1) // 43
  })

  it('event 5 — "b" has ≥ 2 wins (events 3 + 4) → +5 bonus, others 0', () => {
    const ev5 = run.events[4]
    const b = ev5.participants.find((p) => p.heroId === 'b')!
    expect(b.value).toBe(8 * 2 + 5) // 21
    expect(b.reasons).toEqual(['+5 por haber ganado al menos 2 pruebas'])
    const a = ev5.participants.find((p) => p.heroId === 'a')!
    expect(a.reasons).toEqual([])
  })

  it('final classification: b rank 1 (19 pts, 3 wins), c rank 2 (15 pts), a rank 3 (11 pts)', () => {
    const [first, second, third] = run.classification
    expect(first).toMatchObject({
      heroId: 'b',
      totalPoints: 19,
      wins: 3,
      lastEventValue: 21,
      rank: 1,
    })
    expect(second).toMatchObject({ heroId: 'c', totalPoints: 15, rank: 2 })
    expect(third).toMatchObject({ heroId: 'a', totalPoints: 11, rank: 3 })
  })
})

describe('simulate — sequential propagation: event-3 bonus flips leader, event-4 +10 follows', () => {
  // Designed so X is last after events 1+2, then the +5 in event 3 pushes X
  // ahead of the natural leader Z in event 3. Without the bonus, X would lose
  // event 3 and get −1 in event 4; with it, X wins event 3 and gets +10.
  const heroes = [
    hero('x', 'Xena', { agility: 5, strength: 5, weight: 5, endurance: 5, charisma: 0 }),
    hero('y', 'Yul', { agility: 2, strength: 8, weight: 0, endurance: 2, charisma: 10 }),
    hero('z', 'Zoe', { agility: 2, strength: 10, weight: 0, endurance: 2, charisma: 10 }),
  ] as const

  const run = simulate(heroes)

  it('x ends up last in the general after events 1+2 (so D-8 fires in event 3)', () => {
    // Event 1: x=10, y=32, z=40 → x=1, y=3, z=5
    // Event 2: x=−20, y=90, z=90 → x=1, y=4, z=4 (tie 1st-2nd)
    // Cumulative: x=2, y=7, z=9. x is last alone.
    const ev2 = run.events[1]
    const xPts = ev2.participants.find((p) => p.heroId === 'x')!.points
    const yPts = ev2.participants.find((p) => p.heroId === 'y')!.points
    expect(xPts).toBe(1)
    expect(yPts).toBe(4)
  })

  it('event 3: +5 bonus to x produces value 15, beating z=12 and y=10', () => {
    const ev3 = run.events[2]
    const x = ev3.participants.find((p) => p.heroId === 'x')!
    const z = ev3.participants.find((p) => p.heroId === 'z')!
    expect(x.value).toBe(5 + 5 + 5)
    expect(x.reasons).toEqual(['+5 por ir último en la general acumulada'])
    expect(z.value).toBe(2 + 10)
    expect(ev3.participants[0]!.heroId).toBe('x') // x is now event-3 winner
  })

  it('event 4: x got +10 (won event 3), y and z got −1 — the +5 propagated through', () => {
    const ev4 = run.events[3]
    const x = ev4.participants.find((p) => p.heroId === 'x')!
    const y = ev4.participants.find((p) => p.heroId === 'y')!
    const z = ev4.participants.find((p) => p.heroId === 'z')!
    expect(x.reasons).toEqual(['+10 por ganar la Prueba 3'])
    expect(y.reasons).toEqual(['−1 por no ganar la Prueba 3'])
    expect(z.reasons).toEqual(['−1 por no ganar la Prueba 3'])
  })
})

describe('simulate — determinism', () => {
  const heroes = [
    hero('a', 'Alfa', { agility: 4, strength: 7, weight: 3, endurance: 5, charisma: 6 }),
    hero('b', 'Beta', { agility: 8, strength: 2, weight: 1, endurance: 8, charisma: 4 }),
    hero('c', 'Gamma', { agility: 6, strength: 6, weight: 4, endurance: 6, charisma: 8 }),
  ] as const

  it('50× identical calls produce structurally identical results', () => {
    const golden = JSON.stringify(simulate(heroes))
    for (let i = 0; i < 50; i++) {
      expect(JSON.stringify(simulate(heroes))).toBe(golden)
    }
  })

  it('does not mutate the input heroes array or their attribute objects', () => {
    const snap = JSON.stringify(heroes)
    simulate(heroes)
    expect(JSON.stringify(heroes)).toBe(snap)
  })
})

describe('simulate — degenerate all-zero roster', () => {
  it('survives a 0/0/0 attribute roster: every value defaults, ties handled, ranks distinct', () => {
    const heroes = [hero('a', 'A', {}), hero('b', 'B', {}), hero('c', 'C', {})] as const
    const run = simulate(heroes)
    // Event 1: all 0 → all tied → all 3 pts
    expect(run.events[0].participants.every((p) => p.points === 3)).toBe(true)
    // Final classification has distinct ranks 1/2/3 regardless of full ties.
    expect(run.classification.map((c) => c.rank)).toEqual([1, 2, 3])
  })
})
