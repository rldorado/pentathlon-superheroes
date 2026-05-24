# AI Workflow

Working notes on how this challenge was built with AI assistance. Maintained live, not reconstructed.

## Tools & roles

| Tool                       | Role                                                                                                                                      |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Claude Code CLI**        | Primary implementation agent — all code written inside Claude Code sessions running in the project directory                              |
| **Claude Sonnet 4.6**      | Default model for all rounds. Fast enough for large file generation without burning the human time budget                                 |
| **oh-my-claudecode (OMC)** | Plugin layer providing caveman mode (terse comms), vue-best-practices skill (loaded on demand), and session-persist hooks                 |
| **Human (Rafael)**         | Design decisions, ambiguity resolution, constitution vs. design-reference arbitration, manual a11y/mobile/Lighthouse passes, time-keeping |

Human never wrote code. All implementation, test authoring, config, and E2E fixtures were AI-generated. Human's primary job was to verify outputs, report time spent, and escalate contradictions between spec sources.

## Context & prompting strategy

**Batch-round model.** Work was divided into 8 numbered rounds matching the task batches in `docs/tasks.md`. Each round was a single Claude Code prompt: "Implement Round N (T-XX..T-YY)." This kept context windows focused and made progress auditable — each round ended with a green test suite before the next started.

**Verification gate between rounds.** Before starting Round 6, human confirmed "33/50 tasks complete." Claude re-verified by reading `docs/tasks.md` and tracing file existence rather than trusting memory. Only after evidence matched did implementation continue. Same pattern inside rounds: `pnpm typecheck && pnpm lint && pnpm test && pnpm build` all green before declaring a round done.

**Spec-source hierarchy.** Three competing authorities existed: `docs/constitution.md` (design law), `design-reference/*.html` (pixel reference), `docs/clarification.md` (18 Q&A decisions). When sources contradicted (e.g. portrait geometry), AI surfaced the conflict explicitly rather than silently picking one. Human resolved; AI recorded the decision and the deviation reason in code comments and this file.

**Error-log discipline.** Every non-trivial AI mistake was recorded in `## Notable AI failures / corrections` with cause + fix + lesson. This kept the ledger honest and surfaced patterns (e.g. `exactOptionalPropertyTypes` errors never caught by Vitest but always caught by `vue-tsc --noEmit`).

**Time budget tracking.** Human reported cumulative time each turn. E2E specs covered only critical paths (create hero, full pentathlon run); T-43/T-44/T-45 (a11y, mobile, Lighthouse) deferred to manual human review.

## Notable AI failures / corrections

Recorded as they happen; the ledger above carries the one-line summary, this section keeps the longer narratives that may be hard to compress.

### Vue reactive auto-unwrapping in `HeroFormDialog` (Round 5)

In the first pass of `HeroFormDialog.vue` I wrapped the `useHeroForm()` return inside `ref(makeForm())` so I could swap the whole form bundle on each open. The template then accessed `form.submitError.value`. All 6 component tests crashed with `Cannot read properties of null (reading 'value')`.

Cause: a `ref(object)` produces a `Ref<Reactive<X>>`, and Vue's reactive proxy auto-unwraps any nested `Ref<T>` properties when read through that proxy. So `form.submitError` returned the unwrapped string-or-null primitive, and the trailing `.value` then crashed on `null`.

Fix: `shallowRef(makeForm())`. `shallowRef` does not proxy the wrapped value, so the inner `submitError` keeps its `Ref` identity and `form.submitError.value` works as written. The fix is intentionally one line + a comment explaining why; the trap is subtle enough that "future me" needs the note. This is the kind of bug that would have slipped past with looser typing — the failure was caught by the existing TDD pass for the component.

### Constitution vs. design-reference contradiction (Round 5)

Constitution §6.4 mandates "full-circle on 128×128 hero thumbnails" via `rounded-thumb` (9999px), but `design-reference/Heroes Inscritos.html` declares `border-radius: 0; /* hard rule: 0px on hero portraits */` and renders a full-bleed square avatar. Two canonical sources of truth disagreed on the most prominent visual element of the heroes page. I stopped before implementing `HeroCard` and surfaced the conflict to the user. Decision: constitution wins (circular). `HeroCard.vue` carries an inline comment noting the deviation; the design-reference HTML is now strictly canonical for everything except portrait geometry.

### Pinia reactive proxy breaks `.toBe()` assertions (Round 6)

In the first pass of `store.test.ts` for `usePentathlonStore`, getter assertions used `.toBe()` to compare computed values against plain JS objects. Every assertion failed even when the data was identical.

Cause: Pinia wraps state in a Vue reactive proxy. When a getter returns a derived object, the returned value is also a proxy — its reference identity is never `===` to a plain object literal, even if the shape and values are identical.

Fix: replaced all `.toBe()` calls with `.toStrictEqual()` throughout the pentathlon store tests. `toStrictEqual` compares by value, not by reference, so it sees through the proxy. This is the correct assertion for any Pinia getter that returns an object or array.

### `handleSimulate()` double-advance skipped event 1 (Round 7)

First pass of `HeroSelector.vue` called `pentathlonStore.start(heroes)` then immediately `pentathlonStore.advance()` in the same click handler. `start()` sets cursor to 0 (event 1). `advance()` moved cursor to 1 (event 2). Event 1 was never displayed.

The unit tests did not catch this because they asserted on `start()` and `advance()` in isolation; no test composed them in sequence via the component. The Playwright `pentathlon-run.spec.ts` E2E caught it: the 4th "Siguiente prueba →" click timed out because the test had already reached event 5 one step early, and the CTA had changed to "Ver clasificación →".

Fix: removed the spurious `pentathlonStore.advance()` from `handleSimulate()`. `start()` alone is sufficient — cursor lands on 0, EventStep renders events[0] (event 1). This was an integration-level bug that only a full-flow E2E could catch; it reinforced the value of the pentathlon-run spec.

## Time ledger

> Times come **only** from the figures the user reports each turn. No estimation.

| Cumulative | Δ     | Phase / task                                                              |
| ---------- | ----- | ------------------------------------------------------------------------- |
| 1h35m      | 1h35m | Briefing, design-reference review, drafted `constitution.md`              |
| 1h45m      | +10m  | Constitution review; start `specification.md`                             |
| 1h55m      | +10m  | Clarification pass (18 Q); spec finalized; OpenAPI fetch; drafted `plan.md` |
| 2h10m      | +15m  | Reorganized `docs/`; extracted `clarification.md`; drafted `tasks.md`     |
| 2h25m      | +15m  | Recalibrated `tasks.md`: 8-round batch order, human-time budget model     |
| 2h30m      | +5m   | Removed Claude-side per-task estimates from `tasks.md`                      |
| 2h40m      | +10m  | Committed scaffold; pushed to GitHub; Round 1 kickoff                     |
| 2h45m      | +5m   | Font assets; Round 1 (T-01..T-08) — bootstrap, tooling, README            |
| 3h00m      | +15m  | Round 2 (T-09..T-13): shared/http, i18n, testing helpers                  |
| 3h15m      | +15m  | Phase 0 re-verified with real fonts; all checks green                     |
| 3h20m      | +5m   | Round 3 (T-14..T-17): shared/ui + toast                                     |
| 3h30m      | +10m  | Round 4 (T-18..T-22): pure scoring engine                                   |
| 3h40m      | +10m  | Round 5 (T-23..T-33): heroes feature end-to-end                           |
| 4h10m      | +20m  | Verified 33/50; Round 6 (T-34..T-40): pentathlon UI                       |
| 4h20m      | +10m  | Round 7 partial (T-41, T-46, T-47): ErrorBlock + E2E specs                |
| 4h30m      | +10m  | Round 8 (T-48..T-50): workflow docs, README, nav CTAs                     |
| 5h00m      | +30m  | Extras: Prettier pass on docs + src; README app showcase image             |
