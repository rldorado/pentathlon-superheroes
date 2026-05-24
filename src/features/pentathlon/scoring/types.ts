/**
 * Scoring engine types — pure data shapes consumed by `points.ts`, `events.ts`,
 * `simulate.ts`, and `tiebreak.ts`. Defined per docs/plan.md §6.1.
 *
 * The full `Hero` (with id/createdAt/picture/etc.) lives in
 * `features/heroes/types.ts` (T-23). `ScoringHero` below is the minimal shape
 * the scoring engine depends on, so this module remains framework-free and
 * does not reach into the heroes feature. The heroes' `Hero` interface is
 * structurally compatible with `ScoringHero` by design.
 */

export type EventId = 1 | 2 | 3 | 4 | 5

export interface HeroAttributes {
  /** Agilidad — 0..10 integer (UI label: "Agilidad"). */
  agility: number
  /** Fuerza — 0..10 integer (UI label: "Fuerza"). */
  strength: number
  /** Peso — 0..10 integer (UI label: "Peso"). */
  weight: number
  /** Resistencia — 0..10 integer (UI label: "Resistencia"). */
  endurance: number
  /** Carisma — 0..10 integer (UI label: "Carisma"). */
  charisma: number
}

/** Minimal hero contract consumed by the scoring engine. */
export interface ScoringHero {
  id: string
  name: string
  attributes: HeroAttributes
}

export interface ScoredParticipant {
  heroId: string
  /** Raw event value. Can be negative (D-12: no clamping). */
  value: number
  /** 5/3/1 share after average-on-tie (D-6). Can be a non-integer (e.g. 2.5). */
  points: number
  /** Spanish-language explanations for any conditional bonus/penalty fired. */
  reasons: string[]
}

export interface EventResult {
  eventId: EventId
  /** Spanish event name shown on the EventStep. */
  name: string
  /** Spanish human-readable formula description. */
  formula: string
  /** Participants ordered by `value` desc. */
  participants: ScoredParticipant[]
}

export interface ClassificationEntry {
  heroId: string
  totalPoints: number
  /** Count of events where the participant tied for max (D-9). */
  wins: number
  /** Raw value scored in event 5 (used by D-11 tiebreaker level 3). */
  lastEventValue: number
  /** Distinct rank after the D-11 cascade — always 1, 2, or 3. */
  rank: 1 | 2 | 3
}

export interface PentathlonRun {
  participantIds: readonly [string, string, string]
  events: readonly [EventResult, EventResult, EventResult, EventResult, EventResult]
  classification: readonly [ClassificationEntry, ClassificationEntry, ClassificationEntry]
}

/**
 * State threaded into each event formula. Lives in types.ts so test files
 * can import the contract without dragging in the formulas themselves.
 */
export interface EventContext {
  /**
   * heroId → cumulative points from events strictly before the current one
   * (D-10: only events 1+2 contribute when evaluating event 3, etc.).
   */
  pointsSoFar: Record<string, number>
  /** Previously computed `EventResult`s in chronological order. */
  eventsSoFar: readonly EventResult[]
}
