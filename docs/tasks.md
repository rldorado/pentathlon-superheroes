# Tasks — Pentatlón de Superhéroes

> Atomic, testable units of work, ordered by dependency, each with its own acceptance criteria and tests. Tests ship in the same commit as the implementation. No task is "done" without its tests green and its acceptance verified.
>
> Governed by `docs/constitution.md`, `docs/specification.md`, `docs/clarification.md`, `docs/plan.md`. Time logged in `AI_WORKFLOW.md`.

## Execution model & 4-hour budget

**The 4-hour budget is HUMAN time only** — prompting, reviewing, validating, correcting. Claude does the actual implementation. This changes how tasks are sized and grouped:

- **`Est` columns reflect Claude's implementation cost as a rough complexity signal** (longer = more LoC, more files, more risk). They are **not** human time and are **not** subtracted from the 4-hour budget.
- **Human time is paid in review rounds**, not per-task. One review round ≈ reading Claude's batched output + running a smoke command (`pnpm dev` / `pnpm test`) + reporting corrections.
- Average review round ≈ 5–15 min of human time depending on batch size.
- The full 50-task plan is feasible within the 4-hour budget **iff** work is batched by phase (≈ 8 rounds total). Task-by-task review would blow the budget.

**Implication:** no implementation cut is required. Everything in this file ships. The cut section that previously closed this document has been replaced by the batch order in §"Suggested batch order".

Legend: `T-NN` task id · `est` Claude-side complexity (informational) · `deps` blockers.

---

## Phase 0 — Project skeleton & tooling

### T-01 — Bootstrap Vite + Vue 3 + TS project
- **Deps:** —
- **Do:** `pnpm create vite@latest . --template vue-ts`. Strip the demo content. Pin Node ≥ 20 in `package.json` `engines`. Add `pnpm-lock.yaml` to git. Commit `.gitignore` with `node_modules`, `dist`, `.env`, `.env.local`, `coverage`, `playwright-report`, `test-results`.
- **AC:** `pnpm dev` boots; `pnpm build` succeeds with empty app; `pnpm-lock.yaml` present.
- **Tests:** none yet (no app code).

### T-02 — TypeScript strict + path aliases
- **Do:** `tsconfig.json` with `"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`. Alias `@/*` → `src/*` in `tsconfig.json` and `vite.config.ts`. `vue-tsc --noEmit` script.
- **AC:** `pnpm typecheck` green. Import `@/app/App.vue` resolves.

### T-03 — TailwindCSS + theme tokens
- **Do:** Install `tailwindcss`, `postcss`, `autoprefixer`. Create `tailwind.config.ts` verbatim from `plan.md` §6.1 (colors replace defaults; `gold/silver/bronze` data-only). Wire `src/app/styles.css` with `@tailwind base/components/utilities`. Add `@font-face` block for Clash Display / Geist / JetBrains Mono pointing at `public/fonts/`. Place placeholder font files (real assets in T-04) so `font-display: swap` doesn't 404 in dev.
- **AC:** A throwaway `<div class="bg-accent text-accent-ink">` renders `#FF4D2E` background, `#161A33` text. Tailwind `text-blue-500` is `undefined` (default ramps gone).
- **Tests:** Manual visual check on `/` against `design-reference/Heroes Inscritos.html` color sampling.

### T-04 — Self-host font assets
- **Deps:** T-03
- **Do:** Copy Clash Display (200..700), Geist (400/500/600), JetBrains Mono (400/700) into `public/fonts/`. Verify each `@font-face` URL resolves to a 200 in `pnpm dev`.
- **AC:** Browser devtools `Network` shows no 404 on font requests; computed font-family on a `<h1>` is "Clash Display".

### T-05 — ESLint + Prettier
- **Deps:** T-02
- **Do:** `eslint`, `eslint-plugin-vue`, `@typescript-eslint/*`, `prettier`, `eslint-config-prettier`. Minimal `.eslintrc.cjs`. Prettier config: single-quote, no semicolons (or chosen style — lock once and don't bikeshed).
- **AC:** `pnpm lint` and `pnpm format --check` both run clean on the bootstrap.

### T-06 — Vitest setup
- **Deps:** T-02
- **Do:** Install `vitest`, `@vue/test-utils`, `jsdom`. `vitest.config.ts` with `environment: 'jsdom'`, `globals: true`, alias matching tsconfig. `test/setup.ts` creates a fresh Pinia per test. Demo scoring test to prove the wiring.
- **AC:** `pnpm test` passes the demo test.

### T-07 — Playwright setup
- **Deps:** T-01
- **Do:** `pnpm dlx playwright install --with-deps chromium`. `playwright.config.ts` with single project (Chromium desktop + mobile viewport), `webServer` pointing at `pnpm preview` on a fixed port, retries 0 locally.
- **AC:** `pnpm test:e2e` runs against an empty smoke spec (`expect(page).toHaveTitle(/Pentatlón/)`) and passes.

### T-08 — Env, config, `.env.example`, README
- **Do:** `.env.example` with `VITE_PENTATHLON_API_BASE_URL` and `VITE_PENTATHLON_API_KEY`. `src/env.d.ts` typing `ImportMetaEnv`. `README.md` documents: prerequisites, install, env setup (curl snippet for `POST /api-keys/`), scripts (`dev/build/test/test:e2e/lint`). **Never** commit `.env.local`.
- **AC:** Fresh clone + `cp .env.example .env.local` + paste key + `pnpm dev` works without code edits. README pre-reviewed.

---

## Phase 1 — Shared foundations

### T-09 — `shared/http/config.ts`
- **Do:** Single module that reads `import.meta.env.VITE_PENTATHLON_API_BASE_URL` and `VITE_PENTATHLON_API_KEY`. Throws a clear error at boot if `VITE_PENTATHLON_API_KEY` is empty. No other module touches `import.meta.env` for auth.
- **AC:** Booting without the env var produces a Spanish error in the console and a fail-fast screen.
- **Tests:** Vitest unit test with `import.meta.env` stubbed for both present and missing cases.

### T-10 — `shared/http/errors.ts` + Spanish error mapper
- **Deps:** T-09
- **Do:** `ApiError` class (`status`, `message`, `rawBody?`). `mapApiError(err): string` returns Spanish copy per status family (`401/403`, `404`, `4xx`, `5xx`, network/abort, unknown).
- **AC:** Pure mapping function.
- **Tests:** Table-driven Vitest covering each branch.

### T-11 — `shared/http/client.ts` fetch wrapper
- **Do:** `request<T>(method, path, body?)`. Injects `Authorization: <apiKey>` header (no Bearer prefix). Sets `Content-Type: application/json` on `POST/PUT`. Preserves trailing slashes literally. Non-2xx throws `ApiError` with parsed `rawBody`. Network errors map to `ApiError({status: 0, …})`.
- **AC:** Calling `request('GET', '/pentathlon/heroes/')` against a mocked 200 returns parsed JSON; 401 throws `ApiError` with the mapped Spanish message.
- **Tests:** Vitest with `vi.stubGlobal('fetch', …)` covering: 200 happy path, trailing-slash preservation, 401, 500, network failure, malformed JSON.

### T-12 — `shared/testing/renderComposable.ts`
- **Do:** Paste the canonical helper verbatim from `constitution.md` §4.2. No deviations. JSDoc cites the constitution.
- **AC:** Importable from `@/shared/testing/renderComposable`. Composable consumers exclusively use it.
- **Tests:** A trivial composable that calls `inject` returns the provided value via the helper.

### T-13 — `shared/i18n/messages.ts`
- **Deps:** —
- **Do:** Centralized Spanish copy: page headers, button labels, validation messages, API error mapping strings, empty-state copy. Constants only, no logic. Exports a typed `Messages` object.
- **AC:** Every other file pulls user-facing strings from here, not inline literals (enforced by code review).
- **Tests:** None (data).

### T-14 — `shared/ui/PageHeader.vue`
- **Deps:** T-03, T-13
- **Do:** Props: `eyebrow`, `title`, `subtitle?`, `actionSlot`. Renders the eyebrow + Clash Display title + Geist subtitle exactly like `design-reference/Heroes Inscritos.html` and `Clasificacion Final.html`.
- **AC:** Pixel-comparable to design-reference at desktop and mobile widths.
- **Tests:** `@vue/test-utils` render test asserting slot/prop wiring.

### T-15 — `shared/ui/Button.vue`, `Card.vue`, `Chip.vue`, `ProgressBar.vue`, `SkeletonCard.vue`
- **Do:** Minimal primitives consuming Tailwind tokens. Button variants: `primary` (accent bg, ink text), `ghost`, `danger`. Card = `bg-canvas border border-hairline rounded-md`. Chip = pill with attribute color. ProgressBar = 0..10 → 0..100% width, accent fill on hairline track. SkeletonCard reserves card-sized space, animated shimmer respects `prefers-reduced-motion`.
- **AC:** Each component is keyboard-focusable where interactive; focus ring uses `--pa-focus-ring`. AA contrast on every variant per constitution §6.2.
- **Tests:** `@vue/test-utils` smoke render for each; visual diff against design-reference where applicable.

### T-16 — `shared/ui/Dialog.vue` (accessible modal)
- **Do:** Teleport to body. Focus trap. Returns focus to opener on close. `Esc` closes. Backdrop click closes (configurable). `aria-modal="true"`, `role="dialog"`, `aria-labelledby` referencing the heading. Body scroll lock while open.
- **AC:** Keyboard-only flow: open → tab cycles inside dialog → Esc closes → focus returns.
- **Tests:** Vitest + Testing Library style assertions on focus management; axe-core sanity scan on a rendered dialog.

### T-17 — `shared/ui/toast/` (Toast + ToastHost + useToast)
- **Do:** `useToast()` composable returns `{ push(message, variant?), dismiss(id) }`. `ToastHost.vue` mounts once in `App.vue`, renders the queue at bottom-corner, auto-dismiss 3s, `role="status"`, dismissible button. Provide/inject via `toastKey: InjectionKey<ToastBus>` defined in `shared/ui/toast/types.ts`.
- **AC:** Pushing a toast shows it, announces it, auto-dismisses, and is stackable.
- **Tests:** Composable test via `renderComposable` injecting a stub bus. Component test verifying queue rendering and auto-dismiss timer (fake timers).

---

## Phase 2 — Scoring engine (pure, framework-free)

### T-18 — `features/pentathlon/scoring/types.ts`
- **Do:** Define `EventId`, `ScoredParticipant`, `EventResult`, `ClassificationEntry`, `PentathlonRun` exactly as `plan.md` §6.1.
- **AC:** Types compile under strict TS; no `any`.
- **Tests:** Type-only (compile is the test).

### T-19 — `features/pentathlon/scoring/points.ts` (5/3/1 with average-on-tie)
- **Do:** `allocatePoints(participants: { heroId; value }[]): { heroId; points }[]`. Algorithm per `plan.md` §6.3 (Option B). Pure function.
- **AC:** Matches all 4 tie shapes from `clarification.md` D-6.
- **Tests:** Vitest table:
  - `[10,8,3]` → `[5,3,1]`
  - `[10,10,3]` → `[4,4,1]`
  - `[10,3,3]` → `[5,2,2]`
  - `[7,7,7]` → `[3,3,3]`
  - `[0,0,0]`, `[-5,-5,-5]` → `[3,3,3]` (negatives + zeros allowed per D-12)
  - Stable order: input order doesn't change output points (only `value` does).

### T-20 — `features/pentathlon/scoring/events.ts`
- **Do:** One pure function per event accepting `(self: Hero, opponents: Hero[], ctx: EventContext): { value, reasons }`. `ctx` provides cumulative state: `pointsSoFar`, `eventsSoFar` (for win-count and last-event-winner queries). Formulas verbatim from `clarification.md` and `plan.md` §6.2. Spanish reasons pushed when a conditional fires.
- **AC:** Boundary values (0 and 10) produce expected outputs; conditionals fire only when their predicate is true.
- **Tests:** Per-event table tests including:
  - Event 1: `(strength=10, weight=0)` → 40; `(strength=0, weight=10)` → −20 (negative allowed).
  - Event 2: `charisma=5`, opponents `[5,5]` → `25 − 10 = 15`.
  - Event 3: with prior points making `self` last (tie-permissive per D-8) → +5; otherwise +0.
  - Event 4: `self` tied for max in event 3 → +10; otherwise −1.
  - Event 5: `winCount(self) ≥ 2` (ties count per D-9) → +5; otherwise +0.

### T-21 — `features/pentathlon/scoring/simulate.ts` (orchestrator)
- **Do:** `simulate(participants: [Hero, Hero, Hero]): PentathlonRun`. Runs events 1..5 in order; after each, computes `allocatePoints` and updates a running state object (`pointsSoFar`, `eventWinners[]`, `lastEventTopValue`, `lastEventTopParticipants`). Builds `EventResult[]` and final `classification` via T-22.
- **AC:** Deterministic — same input → same output every call.
- **Tests:**
  - Golden test on a fixed 3-hero roster; snapshot the full `PentathlonRun`.
  - Sequential propagation test: a roster where the +5 bonus in event 3 flips the leader, and the flip changes event 4's +10/-1 assignment. Assert the chain end-to-end.
  - No randomness: 50× identical calls produce identical output.

### T-22 — `features/pentathlon/scoring/tiebreak.ts`
- **Do:** `buildClassification(entries, heroes): [c1,c2,c3]`. Sort by (a) totalPoints desc, (b) wins desc, (c) event-5 value desc, (d) name asc (locale `es`, case-insensitive). Assign ranks 1/2/3 distinct.
- **AC:** Per `clarification.md` D-11.
- **Tests:**
  - Points alone decides.
  - Tie on points → wins decides.
  - Tie on points + wins → event-5 value decides.
  - Tie on points + wins + event-5 value → alphabetical decides.
  - All four tied → stable alphabetical, ranks 1/2/3 still distinct.

---

## Phase 3 — Heroes feature

### T-23 — `features/heroes/types.ts` + `features/heroes/api.ts`
- **Do:** Types per `plan.md` §3.4. `api.ts` exports `listHeroes`, `createHero`, `updateHero`, `deleteHero` calling the exact paths from §3.3 (trailing slashes preserved).
- **AC:** All four functions hit the correct path and method.
- **Tests:** Vitest with fetch mock asserting URL, method, headers, body shape for each endpoint.

### T-24 — `features/heroes/store.ts` (Pinia)
- **Do:** State, getters, actions per `plan.md` §4.1. Actions catch `ApiError` and set `error`; on success update `heroes` optimistically only when safe (otherwise refetch).
- **AC:** Actions don't throw to callers; they set `error`. `hasName` is case-insensitive and trims; excludes `exceptId`.
- **Tests:** Vitest with `createPinia()` + mocked `api.ts`. Cover happy path + error path for each action.

### T-25 — `features/heroes/composables/useHeroForm.ts`
- **Do:** Reactive form state (`name`, `picture`, attributes ×5). Validation per `plan.md` §8 (name length/charset/unique, picture dims+size, attribute range). Pure validation functions colocated and exported for direct testing. `submit()` calls store create/update, returns success/failure.
- **AC:** Returns reactive `errors` map keyed by field; `isValid` getter; `submit` rejects with mapped Spanish error on API failure.
- **Tests:**
  - Pure validators: name min/max/charset/unique/exceptId; picture dims and size; attribute range.
  - Composable via `renderComposable`: submit success closes/resets; submit failure preserves draft and surfaces error.

### T-26 — `features/heroes/components/HeroImageInput.vue`
- **Do:** File input accepts PNG/JPEG. On select: validate MIME and ≤ 200 KB. Decode with `Image()` to assert `naturalWidth === 128 && naturalHeight === 128`. Convert via `FileReader.readAsDataURL` and strip the `data:image/...;base64,` prefix. Emit pure base64 string.
- **AC:** Rejected files produce Spanish error inline. Accepted files emit the base64 payload only.
- **Tests:** Component test with synthetic `File` objects of various sizes/types; mock `Image` to fake natural dimensions.

### T-27 — `features/heroes/components/AttributeSlider.vue`
- **Deps:** T-15
- **Do:** Integer slider 0..10 with `tabular-nums` numeric readout in JetBrains Mono. Labelled. Keyboard arrow keys step by 1. Touch target ≥ 44 px.
- **AC:** A11y: associated `<label>`, `aria-valuemin/max/now`. Returns integer only.
- **Tests:** Range bounds; keyboard navigation; emits integer.

### T-28 — `features/heroes/components/HeroCard.vue`
- **Do:** Card with 128×128 circular hero portrait (intrinsic dims explicit on `<img>` to prevent CLS), name (Clash Display 600), 5 attribute rows each with label · ProgressBar · numeric value in JetBrains Mono. Edit + Eliminar buttons.
- **AC:** Matches `design-reference/Heroes Inscritos.html` layout. Circular mask via `rounded-thumb`; image src is `data:image/<sniff>;base64,<picture>`.
- **Tests:** Render with fixture hero; snapshot DOM structure; assert image dims attributes present.

### T-29 — `features/heroes/components/HeroEmptySlot.vue`
- **Do:** Dashed-bordered placeholder with `+` icon, Spanish copy from clarification D-5, CTA "Inscribir héroe".
- **AC:** Visible only when roster has slots-to-fill at the row's tail (configurable via prop).

### T-30 — `features/heroes/components/HeroFormDialog.vue`
- **Do:** Wraps `Dialog` + uses `useHeroForm`. Modes: `create` and `edit`. On success → close + toast.
- **AC:** Keyboard-only end-to-end works. Field-level errors announced via `aria-describedby`.
- **Tests:** Component test for both modes; submit success/failure paths.

### T-31 — `features/heroes/components/ConfirmDeleteDialog.vue`
- **Deps:** T-16, T-24, T-17
- **Do:** Confirmation copy naming the hero; "Eliminar héroe" (danger button) + "Cancelar".
- **AC:** Calls `store.remove(id)`; on success toast + close; on failure show error inline.

### T-32 — `features/heroes/components/HeroGrid.vue`
- **Deps:** T-28, T-29
- **Do:** 12-column responsive grid; cards span 4 columns on `md+`, 12 on mobile; appends a `HeroEmptySlot` if row not full and roster non-empty.

### T-33 — `features/heroes/components/HeroesPage.vue`
- **Do:** Loads store on mount, renders `PageHeader` + grid + empty-state vs. skeletons. Provides `heroesStoreKey` to subtree.
- **AC:** Covers AC-1.1..1.6 from `specification.md`.
- **Tests:** Mounted page with mocked store: loading, empty, error, populated states.

---

## Phase 4 — Pentathlon feature (UI)

### T-34 — `features/pentathlon/store.ts` (Pinia)
- **Do:** State/getters/actions per `plan.md` §4.2. `start()` calls `simulate()` and caches the full `PentathlonRun`. `advance()` clamps to 5.
- **AC:** `canStart` only when 3 selected; `classification` only when `cursor === 5`.
- **Tests:** Vitest covering toggleSelect (max 3, distinct), start, advance (does not exceed 5), reset.

### T-35 — `features/pentathlon/composables/useHeroSelection.ts`
- **Deps:** T-34
- **Do:** Reads roster + selection state; exposes `isSelected(id)`, `canToggle(id)`, `toggle(id)`.
- **Tests:** Via `renderComposable` with provided stores.

### T-36 — `features/pentathlon/components/HeroSelector.vue`
- **Do:** Roster grid in selection mode (checkbox state on the card). Footer bar with counter "Selecciona 3 héroes ({N}/3)" + "Simular pentatlón" CTA (disabled until N===3). Empty-state copy from D-5 when roster < 3.
- **AC:** Covers AC-5.1..5.4.
- **Tests:** Component test: enables CTA only at 3; 4th click blocked.

### T-37 — `features/pentathlon/components/EventStep.vue`
- **Do:** Renders one `EventResult`: event name, formula description, table of participants (name, value in JetBrains Mono, points), and reason chips. CTA "Siguiente prueba →" (or "Ver clasificación →" on event 5). Receives data via `pentathlonRunKey` injection.
- **AC:** Covers AC-6.1..6.3. Tabular numerals align; reasons are in Spanish.

### T-38 — `features/pentathlon/components/ClassificationPodium.vue`
- **Do:** Three blocks rendered visually as 2nd · 1st · 3rd (semantic DOM order 1st · 2nd · 3rd for screen readers). Each block uses `gold/silver/bronze` tokens. Big score in JetBrains Mono with `tabular-nums`. Header eyebrow "PENTATLÓN CERRADO", title "Clasificación final", subtitle with totals. "Simular de nuevo →" returns to selection.
- **AC:** Covers AC-7.1..7.5. AA contrast on each medal bg.

### T-39 — `features/pentathlon/components/PentathlonPage.vue`
- **Do:** State machine on `cursor + run`: phase = `select` (no run) / `run` (cursor 0..4) / `podium` (cursor 5). Provides `pentathlonRunKey` to subtree.
- **AC:** Forward/backward via the CTAs only; refresh-safe (selection survives reload? No — out of scope; new run on mount).

### T-40 — Router wiring
- **Deps:** T-33, T-39
- **Do:** Vue Router history mode. Routes per `plan.md` §5. Catch-all 404.
- **AC:** `/` redirects to `/heroes`. Direct navigation to `/pentatlon` works.

---

## Phase 5 — Cross-cutting polish & quality gates

### T-41 — Centralized error UX
- **Deps:** T-13, T-17
- **Do:** Inline `ErrorBlock` component (Spanish message + Reintentar callback). Used by `HeroesPage` and `HeroSelector`.
- **Tests:** Renders message, fires callback on click.

### T-42 — Document title, lang, meta
- **Do:** `<html lang="es">` in `index.html`. `useDocumentTitle()` composable consuming `route.meta.title`. App title default "Pentatlón de Superhéroes".
- **AC:** Lighthouse a11y doesn't flag missing `lang`.

### T-43 — A11y audit pass
- **Do:** Keyboard-only walkthrough of every route; axe-core devtools scan on each page; fix any findings. Verify focus ring visible on every interactive element. Verify color contrast on `bg-accent` text and medal badges.
- **AC:** Zero critical axe findings on `/heroes` and `/pentatlon`.

### T-44 — Mobile pass at 360×640
- **Deps:** T-33, T-39
- **Do:** Manual review on Chromium mobile emulation. Confirm no horizontal scroll; touch targets ≥ 44 px; form usable.
- **AC:** All three routes pass the constraints from `specification.md` NFR-3.

### T-45 — Performance smoke
- **Deps:** T-40
- **Do:** `pnpm build && pnpm preview` + Lighthouse on `/heroes` and `/pentatlon` (mobile). Address any regressions (e.g. font preloads, image dims). Record metrics in `AI_WORKFLOW.md`.
- **AC:** LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 in the preview build on a throttled mid-tier emulation.

---

## Phase 6 — E2E critical paths

### T-46 — E2E: create hero
- **Do:** Playwright spec navigates to `/heroes`, opens form, fills name + attributes, attaches a 128×128 PNG fixture, submits, asserts the new card appears and a toast is announced.
- **AC:** Spec passes against `pnpm preview`. Uses a unique name per run to keep state reproducible; cleans up via `DELETE` in `afterEach`.

### T-47 — E2E: run a full simulation
- **Do:** Seed 3 heroes (via API in `beforeAll`), navigate `/pentatlon`, select them, click through all 5 events, assert the podium displays 3 entries with gold/silver/bronze styling and total points sum equals 9 × N participants only when no ties (spot-check shape, not values).
- **AC:** Spec passes; cleans up seeded heroes in `afterAll`.

---

## Phase 7 — Final delivery

### T-48 — `AI_WORKFLOW.md` finalization
- **Do:** Backfill the tools-and-roles section, the prompting strategy notes, and the concrete AI-failure case captured during the build. Ledger up-to-date.

### T-49 — `README.md` final pass
- **Do:** Verify install/run instructions still work on a fresh clone. Document the env-var setup and the curl snippet for the key. Include test/e2e commands.

### T-50 — Sweep
- **Deps:** all
- **Do:** `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e` all green. No `console.*` left in `src/`. No hardcoded colors or fonts outside the theme. No secrets in the diff.
- **AC:** Clean run; ready to ship.

---

## Test plan summary

| Layer | Tool | Scope | Helper |
|---|---|---|---|
| Pure scoring (`points`, `events`, `simulate`, `tiebreak`) | Vitest | Heaviest coverage; all tie shapes, sequential propagation, boundaries, negatives | Plain function calls |
| Validators (`useHeroForm` validators) | Vitest | Name/picture/attribute rules | Plain function calls |
| Composables (`useHeroForm`, `useHeroSelection`, `usePentathlonRun`, `useToast`) | Vitest | Wiring, side effects | `renderComposable` **only** |
| Stores (`useHeroesStore`, `usePentathlonStore`) | Vitest | Action contracts, getters | Pinia + mocked `api.ts` |
| Components (selected) | Vitest + `@vue/test-utils` | Form dialog, image input, podium, event step | Mount with provided stubs |
| Critical paths | Playwright | Create hero · run full simulation | Real API, isolated fixtures |

## Dependency graph (high-level)

```
T-01 → T-02 → T-03 → T-04
              ↓
              T-05  T-06 → T-12
              T-07
              T-08 → T-09 → T-10 → T-11
                                   ↓
T-13 ─────────────────────────────┐│
T-14 (PageHeader)                 ││
T-15 (primitives) → T-16, T-17    ││
                                  ↓↓
T-18 → T-19, T-20 → T-21 → T-22   │
                                  │
T-23 (api) ←──────────────────────┘
T-24 (store) ← T-23
T-25 ← T-13, T-24
T-26 ← T-25, T-15
T-27 ← T-15
T-28 ← T-15, T-27
T-30 ← T-16, T-25, T-26, T-27, T-17
T-31 ← T-16, T-24, T-17
T-32 ← T-28, T-29
T-33 ← T-14, T-24, T-30, T-31, T-32, T-17

T-34 ← T-21, T-24
T-35 ← T-34
T-36 ← T-28, T-35, T-14
T-37 ← T-14, T-15
T-38 ← T-22, T-14
T-39 ← T-34, T-36, T-37, T-38

T-40 ← T-33, T-39
T-41..T-45 cross-cutting after T-40
T-46, T-47 after T-40
T-48..T-50 final
```

---

## Suggested batch order

Implementation proceeds in **8 review rounds**, batched by phase. Each round: Claude implements the listed tasks in a single pass; human reads the output + runs the listed smoke check; human reports corrections (if any) which Claude folds in before moving to the next round.

| Round | Tasks | Phase(s) | Human smoke check | Est. human time |
|---|---|---|---|---|
| 1 | T-01..T-08 | 0 (scaffold + tooling) | `pnpm dev` boots; `pnpm typecheck` green | ~10 min |
| 2 | T-09..T-13 | 1a (shared http + i18n) | `pnpm test` green on http + errors unit tests | ~10 min |
| 3 | T-14..T-17 | 1b (shared UI primitives, dialog, toast) | Visual spot-check vs. `design-reference/*.html` | ~15 min |
| 4 | T-18..T-22 | 2 (scoring engine — pure) | `pnpm test` green; spot-check golden simulation | ~15 min |
| 5 | T-23..T-33 | 3 (heroes CRUD) | `pnpm dev` → click through create/edit/delete | ~20 min |
| 6 | T-34..T-40 | 4 (pentathlon UI + router) | Click full simulation flow end-to-end | ~20 min |
| 7 | T-41..T-47 | 5 + 6 (polish + E2E) | `pnpm test:e2e` green; Lighthouse pass | ~15 min |
| 8 | T-48..T-50 | 7 (final delivery) | Final sign-off; `pnpm lint && typecheck && test && test:e2e` | ~10 min |

**Total human time at plan:** ~115 min (≈ 1h55m) of review work, fitting inside the remaining budget once we've spent the planning hours.

**Within a round, tasks that share no dependency may be implemented in parallel** by Claude (e.g. T-09/T-13 in Round 2; T-14/T-15 in Round 3; T-18 standalone before T-19/T-20 in Round 4). The dependency graph below dictates legal parallelism.

**Correction handling:** if a round produces a defect, the fix is folded into the same round; we don't advance until the smoke check passes. Each round's defects and fixes are logged briefly in `AI_WORKFLOW.md` under "Notable AI failures / corrections" to satisfy the deliverable requirement.

**No 4h-cut scope.** The previously defined 4-hour cut assumed human-side implementation. Since Claude implements, all 50 tasks are in scope by default. The only reason to defer a task now is if a round overruns its smoke check repeatedly — in that case, document the deferral in `AI_WORKFLOW.md` (T-48) and ship the rest.
