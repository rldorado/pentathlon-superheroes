/**
 * Pentathlon orchestrator — pure, deterministic, zero Vue imports.
 *
 * Runs the 5 events in order, threading cumulative state (points so far,
 * already-computed event results) into each formula so events 3, 4, and 5
 * see real prior results per clarification.md D-7..D-10.
 *
 * `simulate()` always returns the same `PentathlonRun` for the same input —
 * no Date.now / Math.random / global state.
 */

import { allocatePoints } from './points'
import { EVENT_META } from './events'
import { buildClassification, type ClassificationInput } from './tiebreak'
import type {
  EventContext,
  EventResult,
  PentathlonRun,
  ScoredParticipant,
  ScoringHero,
} from './types'

type Participants = readonly [ScoringHero, ScoringHero, ScoringHero]

function maxValueOf(event: EventResult): number {
  return Math.max(...event.participants.map((p) => p.value))
}

export function simulate(participants: Participants): PentathlonRun {
  const [h1, h2, h3] = participants
  const ids: readonly [string, string, string] = [h1.id, h2.id, h3.id]

  const pointsSoFar: Record<string, number> = { [h1.id]: 0, [h2.id]: 0, [h3.id]: 0 }
  const computedEvents: EventResult[] = []

  for (const meta of EVENT_META) {
    // Event 3 is the only one that consumes pointsSoFar (D-10: only events
    // strictly before contribute). Pass a defensive shallow copy of context
    // so formulas can't mutate the running state by accident.
    const ctx: EventContext = {
      pointsSoFar: { ...pointsSoFar },
      eventsSoFar: [...computedEvents],
    }

    // Per-participant formula evaluation, preserving roster order so
    // `allocatePoints` returns aligned output.
    const computed = participants.map((self) => {
      const opponents = participants.filter((p) => p.id !== self.id)
      const out = meta.fn(self, opponents, ctx)
      return { heroId: self.id, value: out.value, reasons: out.reasons }
    })

    const pointsAlloc = allocatePoints(computed.map((c) => ({ heroId: c.heroId, value: c.value })))
    const pointsById = new Map(pointsAlloc.map((p) => [p.heroId, p.points] as const))

    // Build scored participants sorted by value desc (the EventResult
    // contract; the UI reads them in display order).
    const scored: ScoredParticipant[] = computed
      .map((c) => ({
        heroId: c.heroId,
        value: c.value,
        points: pointsById.get(c.heroId)!,
        reasons: c.reasons,
      }))
      .sort((a, b) => b.value - a.value)

    computedEvents.push({
      eventId: meta.eventId,
      name: meta.name,
      formula: meta.formula,
      participants: scored,
    })

    for (const sp of scored) pointsSoFar[sp.heroId]! += sp.points
  }

  // Wins per D-9: tied-for-max in an event counts as a win.
  const classificationInputs: ClassificationInput[] = participants.map((self) => {
    const wins = computedEvents.reduce((acc, ev) => {
      const max = maxValueOf(ev)
      const own = ev.participants.find((p) => p.heroId === self.id)!.value
      return own === max ? acc + 1 : acc
    }, 0)
    const lastEventValue = computedEvents[4]!.participants.find((p) => p.heroId === self.id)!.value
    return {
      heroId: self.id,
      totalPoints: pointsSoFar[self.id]!,
      wins,
      lastEventValue,
    }
  })

  const classification = buildClassification(classificationInputs, participants)

  return {
    participantIds: ids,
    events: [
      computedEvents[0]!,
      computedEvents[1]!,
      computedEvents[2]!,
      computedEvents[3]!,
      computedEvents[4]!,
    ] as const,
    classification,
  }
}
