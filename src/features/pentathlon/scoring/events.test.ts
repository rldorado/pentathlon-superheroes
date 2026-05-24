import { describe, it, expect } from 'vitest'
import {
  event1,
  event2,
  event3,
  event4,
  event5,
  EVENT_META,
} from './events'
import type { EventContext, EventResult, HeroAttributes, ScoringHero } from './types'

/**
 * T-20 — Event formulas (plan.md §6.2).
 *
 * Tie semantics:
 *   - Event 3 "last in general so far" tolerates ties → all tied-lasts get +5
 *     (clarification.md D-8).
 *   - Event 4 "won previous event" tolerates ties → all tied-for-max in
 *     event 3 get +10 (D-7); others get −1.
 *   - Event 5 "won ≥ 2 events" counts tied-for-max as a win (D-9).
 *
 * Spanish `reasons` only fire when a conditional bonus or explicit penalty
 * happens; the no-op path is silent.
 */

function hero(id: string, name: string, attrs: HeroAttributes): ScoringHero {
  return { id, name, attributes: attrs }
}

const a0 = { agility: 0, strength: 0, weight: 0, endurance: 0, charisma: 0 } as const
function attrs(overrides: Partial<HeroAttributes>): HeroAttributes {
  return { ...a0, ...overrides }
}

const EMPTY_CTX: EventContext = {
  pointsSoFar: { a: 0, b: 0, c: 0 },
  eventsSoFar: [],
}

describe('event1 — Escalar el rascacielos: (strength × 4) − (weight × 2)', () => {
  it('strength=10, weight=0 → 40', () => {
    const self = hero('a', 'A', attrs({ strength: 10, weight: 0 }))
    expect(event1(self, [], EMPTY_CTX)).toEqual({ value: 40, reasons: [] })
  })

  it('strength=0, weight=10 → −20 (D-12 allows negatives)', () => {
    const self = hero('a', 'A', attrs({ strength: 0, weight: 10 }))
    expect(event1(self, [], EMPTY_CTX)).toEqual({ value: -20, reasons: [] })
  })

  it('strength=5, weight=5 → 10', () => {
    const self = hero('a', 'A', attrs({ strength: 5, weight: 5 }))
    expect(event1(self, [], EMPTY_CTX)).toEqual({ value: 10, reasons: [] })
  })
})

describe('event2 — Contar un chiste: charisma² − Σ(opponent.charisma)', () => {
  it('charisma=5, opponents [5,5] → 25 − 10 = 15', () => {
    const self = hero('a', 'A', attrs({ charisma: 5 }))
    const opp = [hero('b', 'B', attrs({ charisma: 5 })), hero('c', 'C', attrs({ charisma: 5 }))]
    expect(event2(self, opp, EMPTY_CTX)).toEqual({ value: 15, reasons: [] })
  })

  it('charisma=10, opponents [10,10] → 100 − 20 = 80', () => {
    const self = hero('a', 'A', attrs({ charisma: 10 }))
    const opp = [hero('b', 'B', attrs({ charisma: 10 })), hero('c', 'C', attrs({ charisma: 10 }))]
    expect(event2(self, opp, EMPTY_CTX)).toEqual({ value: 80, reasons: [] })
  })

  it('charisma=0, opponents [10,10] → 0 − 20 = −20', () => {
    const self = hero('a', 'A', attrs({ charisma: 0 }))
    const opp = [hero('b', 'B', attrs({ charisma: 10 })), hero('c', 'C', attrs({ charisma: 10 }))]
    expect(event2(self, opp, EMPTY_CTX)).toEqual({ value: -20, reasons: [] })
  })
})

describe('event3 — Disparar al villano: (agility + strength) + (last? +5 : 0)', () => {
  it('self is the unique last in events 1+2 → +5 (Spanish reason fired)', () => {
    const self = hero('a', 'A', attrs({ agility: 3, strength: 4 }))
    const ctx: EventContext = {
      pointsSoFar: { a: 1, b: 5, c: 3 }, // a is last alone
      eventsSoFar: [],
    }
    const out = event3(self, [], ctx)
    expect(out.value).toBe(3 + 4 + 5)
    expect(out.reasons).toEqual(['+5 por ir último en la general acumulada'])
  })

  it('self is NOT last → +0 (no reason fired)', () => {
    const self = hero('a', 'A', attrs({ agility: 2, strength: 1 }))
    const ctx: EventContext = {
      pointsSoFar: { a: 8, b: 5, c: 3 },
      eventsSoFar: [],
    }
    const out = event3(self, [], ctx)
    expect(out.value).toBe(3)
    expect(out.reasons).toEqual([])
  })

  it('D-8: tied for last (a and c at 0) → both get +5', () => {
    const self = hero('a', 'A', attrs({ agility: 1, strength: 1 }))
    const ctx: EventContext = {
      pointsSoFar: { a: 0, b: 5, c: 0 },
      eventsSoFar: [],
    }
    const out = event3(self, [], ctx)
    expect(out.value).toBe(2 + 5)
    expect(out.reasons).toEqual(['+5 por ir último en la general acumulada'])
  })

  it('D-8 degenerate: all 3 tied → all get +5', () => {
    const self = hero('a', 'A', attrs({ agility: 5, strength: 5 }))
    const ctx: EventContext = {
      pointsSoFar: { a: 0, b: 0, c: 0 },
      eventsSoFar: [],
    }
    const out = event3(self, [], ctx)
    expect(out.value).toBe(15)
    expect(out.reasons).toEqual(['+5 por ir último en la general acumulada'])
  })
})

describe('event4 — Sprint de 200 km: (agility × 4) + (endurance × 2) + (wonEv3 ? +10 : −1)', () => {
  function buildEv3(top: string, others: Array<{ id: string; value: number }>): EventResult {
    const all = [{ heroId: top, value: 10 }, ...others.map((o) => ({ heroId: o.id, value: o.value }))]
    return {
      eventId: 3,
      name: 'Disparar al villano',
      formula: '(agilidad + fuerza) + (último? +5 : 0)',
      participants: all.map((p) => ({ ...p, points: 0, reasons: [] })),
    }
  }

  it('self won event 3 (unique top) → +10', () => {
    const self = hero('a', 'A', attrs({ agility: 5, endurance: 3 }))
    const ev3 = buildEv3('a', [
      { id: 'b', value: 5 },
      { id: 'c', value: 2 },
    ])
    const out = event4(self, [], { pointsSoFar: {}, eventsSoFar: [ev3] })
    expect(out.value).toBe(5 * 4 + 3 * 2 + 10)
    expect(out.reasons).toEqual(['+10 por ganar la Prueba 3'])
  })

  it('D-7: self tied for top of event 3 → +10 (all tied winners get +10)', () => {
    const self = hero('a', 'A', attrs({ agility: 5, endurance: 3 }))
    const ev3: EventResult = {
      eventId: 3,
      name: 'x',
      formula: 'x',
      participants: [
        { heroId: 'a', value: 10, points: 0, reasons: [] },
        { heroId: 'b', value: 10, points: 0, reasons: [] },
        { heroId: 'c', value: 5, points: 0, reasons: [] },
      ],
    }
    const out = event4(self, [], { pointsSoFar: {}, eventsSoFar: [ev3] })
    expect(out.value).toBe(20 + 6 + 10)
    expect(out.reasons).toEqual(['+10 por ganar la Prueba 3'])
  })

  it('self did NOT win event 3 → −1 (penalty reason fired)', () => {
    const self = hero('c', 'C', attrs({ agility: 2, endurance: 4 }))
    const ev3 = buildEv3('a', [
      { id: 'b', value: 5 },
      { id: 'c', value: 2 },
    ])
    const out = event4(self, [], { pointsSoFar: {}, eventsSoFar: [ev3] })
    expect(out.value).toBe(2 * 4 + 4 * 2 - 1)
    expect(out.reasons).toEqual(['−1 por no ganar la Prueba 3'])
  })
})

describe('event5 — Rescatar 100 gatitos: (agility × 2) + (winCount ≥ 2 ? +5 : 0)', () => {
  function ev(eventId: 1 | 2 | 3 | 4, top: string, second: { id: string; value: number }, third: { id: string; value: number }): EventResult {
    return {
      eventId,
      name: `e${eventId}`,
      formula: '',
      participants: [
        { heroId: top, value: 10, points: 0, reasons: [] },
        { heroId: second.id, value: second.value, points: 0, reasons: [] },
        { heroId: third.id, value: third.value, points: 0, reasons: [] },
      ],
    }
  }

  it('self won 0 events → +0 (no reason)', () => {
    const self = hero('a', 'A', attrs({ agility: 4 }))
    const events = [
      ev(1, 'b', { id: 'a', value: 5 }, { id: 'c', value: 2 }),
      ev(2, 'c', { id: 'a', value: 5 }, { id: 'b', value: 2 }),
      ev(3, 'b', { id: 'a', value: 5 }, { id: 'c', value: 2 }),
      ev(4, 'c', { id: 'a', value: 5 }, { id: 'b', value: 2 }),
    ]
    const out = event5(self, [], { pointsSoFar: {}, eventsSoFar: events })
    expect(out.value).toBe(8)
    expect(out.reasons).toEqual([])
  })

  it('self won exactly 1 event → +0 (threshold is ≥ 2)', () => {
    const self = hero('a', 'A', attrs({ agility: 4 }))
    const events = [
      ev(1, 'a', { id: 'b', value: 5 }, { id: 'c', value: 2 }),
      ev(2, 'c', { id: 'a', value: 5 }, { id: 'b', value: 2 }),
      ev(3, 'b', { id: 'a', value: 5 }, { id: 'c', value: 2 }),
      ev(4, 'c', { id: 'a', value: 5 }, { id: 'b', value: 2 }),
    ]
    const out = event5(self, [], { pointsSoFar: {}, eventsSoFar: events })
    expect(out.value).toBe(8)
    expect(out.reasons).toEqual([])
  })

  it('self won exactly 2 events → +5 (bonus + Spanish reason)', () => {
    const self = hero('a', 'A', attrs({ agility: 4 }))
    const events = [
      ev(1, 'a', { id: 'b', value: 5 }, { id: 'c', value: 2 }),
      ev(2, 'a', { id: 'b', value: 5 }, { id: 'c', value: 2 }),
      ev(3, 'b', { id: 'a', value: 5 }, { id: 'c', value: 2 }),
      ev(4, 'c', { id: 'a', value: 5 }, { id: 'b', value: 2 }),
    ]
    const out = event5(self, [], { pointsSoFar: {}, eventsSoFar: events })
    expect(out.value).toBe(13)
    expect(out.reasons).toEqual(['+5 por haber ganado al menos 2 pruebas'])
  })

  it('D-9: ties for max count as wins — 2 shared wins → +5', () => {
    const self = hero('a', 'A', attrs({ agility: 3 }))
    const tied: EventResult = {
      eventId: 1,
      name: 'e1',
      formula: '',
      participants: [
        { heroId: 'a', value: 10, points: 0, reasons: [] },
        { heroId: 'b', value: 10, points: 0, reasons: [] },
        { heroId: 'c', value: 5, points: 0, reasons: [] },
      ],
    }
    const events = [tied, { ...tied, eventId: 2 as const }]
    const out = event5(self, [], { pointsSoFar: {}, eventsSoFar: events })
    expect(out.value).toBe(11)
    expect(out.reasons).toEqual(['+5 por haber ganado al menos 2 pruebas'])
  })
})

describe('EVENT_META — Spanish naming and formula descriptions', () => {
  it('exposes the 5 events in id order with Spanish names', () => {
    expect(EVENT_META.map((m) => m.eventId)).toEqual([1, 2, 3, 4, 5])
    expect(EVENT_META[0]!.name).toBe('Escalar el rascacielos')
    expect(EVENT_META[1]!.name).toBe('Contar un chiste')
    expect(EVENT_META[2]!.name).toBe('Disparar al villano')
    expect(EVENT_META[3]!.name).toBe('Sprint de 200 km')
    expect(EVENT_META[4]!.name).toBe('Rescatar 100 gatitos')
  })
})
