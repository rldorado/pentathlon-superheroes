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
