# AI Workflow

Working notes on how this challenge was built with AI assistance. Maintained live, not reconstructed.

## Tools & roles

_(To be filled in as the project progresses.)_

## Context & prompting strategy

_(To be filled in.)_

## Notable AI failures / corrections

Recorded as they happen; the ledger above carries the one-line summary, this section keeps the longer narratives that may be hard to compress.

### Vue reactive auto-unwrapping in `HeroFormDialog` (Round 5)

In the first pass of `HeroFormDialog.vue` I wrapped the `useHeroForm()` return inside `ref(makeForm())` so I could swap the whole form bundle on each open. The template then accessed `form.submitError.value`. All 6 component tests crashed with `Cannot read properties of null (reading 'value')`.

Cause: a `ref(object)` produces a `Ref<Reactive<X>>`, and Vue's reactive proxy auto-unwraps any nested `Ref<T>` properties when read through that proxy. So `form.submitError` returned the unwrapped string-or-null primitive, and the trailing `.value` then crashed on `null`.

Fix: `shallowRef(makeForm())`. `shallowRef` does not proxy the wrapped value, so the inner `submitError` keeps its `Ref` identity and `form.submitError.value` works as written. The fix is intentionally one line + a comment explaining why; the trap is subtle enough that "future me" needs the note. This is the kind of bug that would have slipped past with looser typing — the failure was caught by the existing TDD pass for the component.

### Constitution vs. design-reference contradiction (Round 5)

Constitution §6.4 mandates "full-circle on 128×128 hero thumbnails" via `rounded-thumb` (9999px), but `design-reference/Heroes Inscritos.html` declares `border-radius: 0; /* hard rule: 0px on hero portraits */` and renders a full-bleed square avatar. Two canonical sources of truth disagreed on the most prominent visual element of the heroes page. I stopped before implementing `HeroCard` and surfaced the conflict to the user. Decision: constitution wins (circular). `HeroCard.vue` carries an inline comment noting the deviation; the design-reference HTML is now strictly canonical for everything except portrait geometry.

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
| 4h10m | +20m | Progress verified: 33/50 tasks (Phases 0–3) confirmed complete before starting Round 6. Round 6 implemented (T-34..T-40): `usePentathlonStore` (Pinia — toggleSelect/start/advance/reset, canStart/currentEvent/visibleEvents/classification getters), `useHeroSelection` composable, `HeroSelector.vue` (selection-mode grid + sticky CTA), `EventStep.vue` (table + reason chips + advance CTA), `ClassificationPodium.vue` (2nd·1st·3rd visual order, gold/silver/bronze tokens), `PentathlonPage.vue` (select/run/podium state machine, provides pentathlonStoreKey), router wiring. 277 unit tests green (+28 new across 3 files); typecheck + build all green. Notable AI correction: first pass used `.toBe()` to assert Pinia reactive getters against plain objects — Pinia wraps state in a reactive proxy so `.toBe()` reference equality always fails even when the data is identical. Replaced with `.toStrictEqual()` throughout the pentathlon store tests. |
| 3h40m | +10m | Round 5 implemented (T-23..T-33) — `features/heroes/` end to end. API client (`types`, `api`) → Pinia store with case-insensitive `hasName(exceptId?)` + Spanish error mapping → `useHeroForm` + pure validators (Unicode-letter regex, 200 KB cap, 128×128 enforced via stubbable `Image`/`FileReader`) → 7 components (`AttributeSlider`, `HeroImageInput`, `HeroEmptySlot`, `HeroCard`, `ConfirmDeleteDialog`, `HeroFormDialog`, `HeroGrid`, `HeroesPage`) → router wired so `/heroes` now serves the real page. 249 unit tests green (+96 new across 13 files); typecheck + lint + build all green. Resolved design discrepancy: `design-reference/Heroes Inscritos.html` declares `border-radius: 0` on hero portraits while constitution §6.4 mandates "full-circle on 128×128 hero thumbnails (`rounded-thumb` → 9999px)". User confirmed constitution wins; portraits are circular and `HeroCard.vue` includes a deviation comment pointing back here. Notable AI corrections: (i) tried to wrap `useHeroForm`'s return inside a plain `ref()` in `HeroFormDialog` — Vue's reactive proxy auto-unwraps nested refs, so `form.submitError.value` crashed in the template; fixed with `shallowRef`. (ii) Initial api.test.ts mutated `import.meta.env` directly, which the cached HTTP config never reread — switched to `vi.stubEnv` + `_resetHttpConfigForTests()` per the helper's design. (iii) 5 `exactOptionalPropertyTypes` errors only surfaced during `pnpm typecheck`, never at test time — fixed by spread-based prop construction and `delete` instead of `=undefined` assignments |
