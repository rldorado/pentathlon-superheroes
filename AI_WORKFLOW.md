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
