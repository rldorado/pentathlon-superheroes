# AI Workflow

Working notes on how this challenge was built with AI assistance. Maintained live, not reconstructed.

## Tools & roles

_(To be filled in as the project progresses.)_

## Context & prompting strategy

_(To be filled in.)_

## Notable AI failures / corrections

_(To be filled in. At least one concrete case where AI output was wrong, hallucinated, or suboptimal — and how it was caught.)_

## Time ledger

> Times come **only** from the figures the user reports each turn. No estimation.
> 4-hour budget. Flag at ≥ 3h30m.

| Cumulative | Δ | Phase / task |
|---|---|---|
| 1h35m | 1h35m | Briefing, design-reference review, drafted `constitution.md` |
| 1h45m | +10m | Constitution review (pnpm, dark theme deferred, circular hero portraits); start `specification.md` |
| 1h55m | +10m | Clarification pass closed (18 questions); specification.md finalized; fetched live OpenAPI spec; drafted `plan.md` |
| 2h10m | +15m | Reorganized governance docs under `docs/`; extracted standalone `clarification.md`; updated `plan.md` folder layout (Toast → `shared/ui/toast/`); drafted `tasks.md` (50 atomic tasks, dependency graph, 4h-budget priority cut) |
| 2h25m | +15m | Recalibrated `tasks.md`: 4h-budget is HUMAN-side only (Claude implements); replaced cut-scope with 8-round batch order, removed task-by-task review model |
| 2h30m | +5m | Stripped Claude-side `Est:` estimates from individual tasks; human-time estimates stay in batch-order table only |
| 2h40m | +10m | Committed `.gitignore` and pushed governance scaffold to public GitHub (`rldorado/pentathlon-superheroes`); kicked off Round 1 |
| 2h45m | +5m | Self-hosted font assets dropped into `public/fonts/` (Clash Display 500/600/700, Geist 400/500/600, JetBrains Mono 400/700); Round 1 (T-01..T-08) implemented — Vite + Vue 3 + TS bootstrap, strict TS, Tailwind tokens replacing defaults, `@font-face` wiring, ESLint + Prettier, Vitest, Playwright, env + README |
| 3h00m | +15m | Round 2 implemented (T-09..T-13): `shared/http` config + Spanish error mapper + fetch client, `shared/i18n/messages.ts`, `shared/testing/renderComposable.ts`; 39 unit tests green |
| 3h15m | +15m | Re-verified Phase 0 end-to-end with real fonts in place: `pnpm typecheck`, `pnpm lint`, `pnpm test` (39 passing), `pnpm build` all green; T-03 smoke chip (`bg-accent text-accent-ink`) visible on placeholder route; ready for Round 3 |
| 3h20m | +5m | Round 3 implemented (T-14..T-17): `shared/ui/{PageHeader,Button,Card,Chip,ProgressBar,SkeletonCard,Dialog}.vue` + `shared/ui/toast/{types,createToastBus,useToast,Toast.vue,ToastHost.vue}`; toast bus provided in `App.vue`. 102 unit tests green (63 new across 11 files); typecheck + lint + build all green. Notable AI correction: my first `useToast` test naïvely used `provide()` + `inject()` in the same setup (Vue does not allow self-inject); fixed by passing the bus explicitly in unit tests and exercising the real inject path through a `Consumer` child component inside the `ToastHost` integration test |
| 3h30m ⚠️ | +10m | **Budget flag (≥ 3h30m).** Round 4 implemented (T-18..T-22) — the pure scoring engine, scope-zero on Vue: `features/pentathlon/scoring/{types,points,events,tiebreak,simulate}.ts`. Encodes every clarification.md decision: D-6 average-on-tie 5/3/1, D-7/D-8/D-9 tie-tolerant winner/last-in-general/win-count, D-10 "so far" = events 1+2, D-11 final cascade (points → wins → event-5 value → es-locale alphabetical), D-12 no clamping of negative values. 153 unit tests green (51 new: points 10, events 18, tiebreak 9, simulate 14 incl. golden roster + sequential-propagation chain + 50× determinism + zero-attribute degenerate case); typecheck + lint + build all green. Notable AI correction: first pass declared `EventContext` inside `events.ts` and the test file imported it from `./types`; runtime passed because esbuild doesn't resolve type-only imports strictly, but `vue-tsc --noEmit` caught it. Moved `EventContext` to `types.ts` (which is where engine data contracts belong) and re-exported it from `events.ts` for backwards-compatible API surface |
