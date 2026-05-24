# Technical Plan — Pentatlón de Superhéroes

> Blueprint for implementation. Governed by `constitution.md`; satisfies every story in `specification.md`. Open risks flagged at the end.

---

## 1. Tech stack (locked)

| Concern          | Choice                                                       | Rationale                                       |
| ---------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| Language         | TypeScript (strict)                                          | constitution §1                                 |
| Framework        | Vue 3 + `<script setup>` + Composition API                   | constitution §1                                 |
| Build            | Vite 5                                                       | fast HMR, first-class TS, plays well with Vue 3 |
| Styling          | TailwindCSS 3                                                | constitution §1, theme tokens §6.1              |
| State (global)   | Pinia 2                                                      | constitution §3                                 |
| State (subtree)  | provide/inject with typed `InjectionKey<T>`                  | constitution §3                                 |
| Routing          | Vue Router 4                                                 | history mode                                    |
| HTTP             | native `fetch` wrapped in `shared/http/client.ts`            | constitution §1, no axios                       |
| Unit tests       | Vitest + `@vue/test-utils` (only when needed for components) | constitution §4                                 |
| Composable tests | `renderComposable` helper, exclusively                       | constitution §4.2                               |
| E2E              | Playwright, critical paths only                              | constitution §4                                 |
| Type-check       | `vue-tsc --noEmit` in CI                                     | catch SFC type errors                           |
| Lint             | ESLint (vue, ts) + Prettier                                  | minimal config, no opinionated plugins          |
| Package mgr      | pnpm                                                         | constitution §1                                 |
| Node             | ≥ 20 LTS                                                     | engines field in package.json                   |

---

## 2. Folder layout

```
pentathlon-superheroes/
├── README.md
├── AI_WORKFLOW.md
├── docs/                              (all governance docs live here)
│   ├── constitution.md
│   ├── specification.md
│   ├── clarification.md
│   ├── plan.md
│   └── tasks.md
├── design-reference/                  (read-only, source of truth for design)
├── index.html
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── vitest.config.ts
├── playwright.config.ts
├── .env.example                       (VITE_PENTATHLON_API_KEY=, VITE_PENTATHLON_API_BASE_URL=)
├── .gitignore                         (includes .env, .env.local)
├── public/
│   └── fonts/                         (Clash Display, Geist, JetBrains Mono — self-hosted)
├── src/
│   ├── app/
│   │   ├── main.ts
│   │   ├── App.vue
│   │   ├── router.ts
│   │   └── styles.css                 (Tailwind directives + @font-face)
│   ├── features/
│   │   ├── heroes/
│   │   │   ├── api.ts                 (listHeroes, createHero, updateHero, deleteHero)
│   │   │   ├── types.ts               (Hero, HeroDraft, HeroAttributes, injection keys)
│   │   │   ├── store.ts               (Pinia: useHeroesStore — roster, loading, error)
│   │   │   ├── composables/
│   │   │   │   ├── useHeroForm.ts     (form state, validation, submit orchestration)
│   │   │   │   └── useHeroRoster.ts   (read-side facade over store)
│   │   │   ├── components/
│   │   │   │   ├── HeroesPage.vue
│   │   │   │   ├── HeroGrid.vue
│   │   │   │   ├── HeroCard.vue
│   │   │   │   ├── HeroEmptySlot.vue
│   │   │   │   ├── HeroFormDialog.vue
│   │   │   │   ├── HeroImageInput.vue (handles dimension + size validation, base64 encode)
│   │   │   │   ├── AttributeSlider.vue
│   │   │   │   └── ConfirmDeleteDialog.vue
│   │   │   ├── index.ts               (public surface: store hook, types, injection keys)
│   │   │   └── __tests__/
│   │   ├── pentathlon/
│   │   │   ├── scoring/               (PURE — zero Vue imports)
│   │   │   │   ├── events.ts          (event value formulas)
│   │   │   │   ├── points.ts          (5/3/1 allocator with average-on-tie)
│   │   │   │   ├── simulate.ts        (orchestrator: runs 5 events, carries state)
│   │   │   │   ├── tiebreak.ts        (final classification tiebreaker)
│   │   │   │   ├── types.ts           (EventResult, PentathlonRun, ClassificationEntry, …)
│   │   │   │   └── __tests__/         (Vitest, plain function tests)
│   │   │   ├── composables/
│   │   │   │   ├── useHeroSelection.ts
│   │   │   │   └── usePentathlonRun.ts (step-by-step navigation: current event, advance)
│   │   │   ├── components/
│   │   │   │   ├── PentathlonPage.vue        (route entry, drives the three phases)
│   │   │   │   ├── HeroSelector.vue
│   │   │   │   ├── EventStep.vue             (one event + reveal of values/points/reasons)
│   │   │   │   ├── ClassificationPodium.vue
│   │   │   │   └── EventReason.vue           (renders bonus/penalty explanations)
│   │   │   ├── store.ts               (Pinia: usePentathlonStore — selection + active run)
│   │   │   ├── types.ts               (injection keys for run context)
│   │   │   ├── index.ts
│   │   │   └── __tests__/
│   │   └── shared/                    (only genuinely cross-cutting)
│   ├── shared/
│   │   ├── http/
│   │   │   ├── client.ts              (fetch wrapper, injects Authorization)
│   │   │   ├── config.ts              (reads VITE_PENTATHLON_API_KEY / BASE_URL once)
│   │   │   └── errors.ts              (ApiError class, message mapper to Spanish)
│   │   ├── ui/
│   │   │   ├── Button.vue
│   │   │   ├── Card.vue
│   │   │   ├── Chip.vue
│   │   │   ├── Dialog.vue             (accessible modal, focus trap)
│   │   │   ├── toast/
│   │   │   │   ├── Toast.vue
│   │   │   │   ├── ToastHost.vue       (mounted once in App.vue, renders the queue)
│   │   │   │   ├── useToast.ts         (provide/inject bus, push/dismiss)
│   │   │   │   └── types.ts            (Toast, ToastVariant, toastKey)
│   │   │   ├── ProgressBar.vue        (used for attribute bars)
│   │   │   ├── PageHeader.vue         (eyebrow + display title + subtitle)
│   │   │   └── SkeletonCard.vue
│   │   ├── i18n/
│   │   │   └── messages.ts            (centralized Spanish copy + API-error translations)
│   │   └── testing/
│   │       └── renderComposable.ts    (canonical helper — verbatim from constitution §4.2)
│   └── env.d.ts                       (typed import.meta.env)
├── test/
│   └── setup.ts                       (Vitest global setup: pinia, fetch mock harness)
└── e2e/
    ├── heroes-crud.spec.ts            (critical path: create hero)
    └── pentathlon-run.spec.ts         (critical path: select 3 → run → see podium)
```

---

## 3. API contract mapping

Source: OpenAPI 3.0 served inline from `https://codetest-api.applivery.io/reference`. **Do not invent fields.**

### 3.1 Base

- **Base URL:** `https://codetest-api.applivery.io`
- **Auth header:** `Authorization: <apiKeyId>` (raw key id; **no `Bearer` prefix**; the OpenAPI declares `securitySchemes.apiKey` as `in: header, name: Authorization`).
- **Content-Type:** `application/json` on all `POST`/`PUT`.

### 3.2 ApiKey provisioning (developer-only, NOT called from the client)

| Method | Path                   | Body | Response                                               |
| ------ | ---------------------- | ---- | ------------------------------------------------------ |
| `POST` | `/api-keys/`           | `{}` | `{ id: string; createdAt: string; updatedAt: string }` |
| `GET`  | `/api-keys/{apiKeyId}` | —    | same                                                   |

The developer runs `POST /api-keys/` once via curl/Postman, copies `id` into `.env.local` as `VITE_PENTATHLON_API_KEY`. The Vue app never calls `/api-keys/*`.

### 3.3 Heroes — `Penthathlon - Heroes` tag

All endpoints require `Authorization` header.

| Method   | Path                          | Body                                                                         | Response            |
| -------- | ----------------------------- | ---------------------------------------------------------------------------- | ------------------- |
| `GET`    | `/pentathlon/heroes/`         | —                                                                            | `Hero[]`            |
| `POST`   | `/pentathlon/heroes/`         | `HeroInput` (required: `name`, `attributes`; optional per schema: `picture`) | `Hero`              |
| `GET`    | `/pentathlon/heroes/{heroId}` | —                                                                            | `Hero`              |
| `PUT`    | `/pentathlon/heroes/{heroId}` | `HeroInput` (full replace)                                                   | `Hero`              |
| `DELETE` | `/pentathlon/heroes/{heroId}` | —                                                                            | `{ done: boolean }` |

**Note the trailing slashes** on collection paths (`/pentathlon/heroes/`, `/api-keys/`). Reproduce them exactly — some routers 404 without.

### 3.4 Schemas

```ts
// src/features/heroes/types.ts
export interface HeroAttributes {
  agility: number // 0..10 integer
  strength: number // 0..10 integer
  weight: number // 0..10 integer
  endurance: number // 0..10 integer  (UI label: "Resistencia")
  charisma: number // 0..10 integer
}

export interface Hero {
  id: string
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
  name: string
  picture?: string // base64 (data-URL stripped); server schema marks it optional
  attributes: HeroAttributes
}

export interface HeroInput {
  name: string
  picture?: string // optional per server schema; required by our UX (AC-2.3)
  attributes: HeroAttributes
}
```

**Important translation map** (API English ↔ UI Spanish):

| API         | UI          |
| ----------- | ----------- |
| `agility`   | Agilidad    |
| `strength`  | Fuerza      |
| `weight`    | Peso        |
| `endurance` | Resistencia |
| `charisma`  | Carisma     |

Translation lives in `shared/i18n/messages.ts`. The API field names are never displayed.

### 3.5 Error handling

The OpenAPI spec documents only `200` responses; no error schema. We assume conventional HTTP semantics and defend at the client boundary:

- `ApiError { status: number; message: string; rawBody?: unknown }` in `shared/http/errors.ts`.
- Any non-2xx response throws `ApiError`. The message is mapped to Spanish via `shared/i18n/messages.ts` (`401 → "No autorizado…"`, `404 → "No encontrado…"`, `5xx → "Error del servidor…"`, network → "Sin conexión…"). Unknown statuses fall back to a generic Spanish message.
- Stores set `error: string | null` after each call; components render an inline error block with a "Reintentar" button. No native `alert`.

### 3.6 Picture handling

- The form accepts PNG/JPEG.
- Client validates: MIME type, original file size ≤ 200 KB, intrinsic dimensions **exactly 128×128** (via `Image` + `naturalWidth/Height`).
- File is base64-encoded via `FileReader.readAsDataURL`, then the `data:image/...;base64,` prefix is **stripped** before sending (`picture` field carries pure base64). On render, the prefix is reattached based on a sniff of the first base64 byte (`/9j` → jpeg, `iVBOR` → png) for maximum compatibility, since the API stores no MIME hint.

---

## 4. State design

### 4.1 Pinia — `useHeroesStore` (`features/heroes/store.ts`)

```ts
state: {
  heroes: Hero[]
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
}
getters: {
  byId(id): Hero | undefined
  count(): number
  hasName(name, exceptId?): boolean   // case-insensitive after trim
}
actions: {
  async load()
  async create(input: HeroInput): Hero
  async update(id, input: HeroInput): Hero
  async remove(id): void
}
```

### 4.2 Pinia — `usePentathlonStore` (`features/pentathlon/store.ts`)

```ts
state: {
  selectedIds: string[]                 // length 0..3
  run: PentathlonRun | null             // null until "Simular pentatlón" pressed
  cursor: 0..5                          // 0 = before first event, 5 = ready for podium
}
getters: {
  canStart(): boolean                   // selectedIds.length === 3
  participants(rosterById): Hero[]
  currentEvent(): EventResult | null
  visibleEvents(): EventResult[]        // run.events.slice(0, cursor)
  classification(): ClassificationEntry[] | null  // only when cursor === 5
}
actions: {
  toggleSelect(id)
  clearSelection()
  start(participants: Hero[])           // calls simulate() once, stores full PentathlonRun
  advance()                             // cursor++
  reset()                               // back to selection
}
```

The simulation is **computed eagerly** on `start()` — all 5 events + classification are precomputed (the result is deterministic). `cursor` only controls UI reveal. This keeps the reveal logic trivial and the scoring layer pure & framework-free.

### 4.3 provide/inject

Used to expose feature-scoped dependencies without prop-drilling:

| Key (in `features/<x>/types.ts`) | Provided by          | Consumed by                                         | Type                                                    |
| -------------------------------- | -------------------- | --------------------------------------------------- | ------------------------------------------------------- |
| `heroesStoreKey`                 | `HeroesPage.vue`     | `HeroFormDialog`, `HeroCard`, `ConfirmDeleteDialog` | `ReturnType<typeof useHeroesStore>`                     |
| `pentathlonRunKey`               | `PentathlonPage.vue` | `EventStep`, `ClassificationPodium`                 | `PentathlonRunContext` (current event, advance fn, run) |
| `toastKey`                       | `App.vue`            | any component needing `useToast()`                  | `ToastBus`                                              |

All injection keys are typed `InjectionKey<T>` and exported from the owning feature's `types.ts`. No string keys.

---

## 5. Routing (`src/app/router.ts`)

| Path             | Component            | Notes                                                                                     |
| ---------------- | -------------------- | ----------------------------------------------------------------------------------------- |
| `/`              | redirect → `/heroes` | per decision §6.17                                                                        |
| `/heroes`        | `HeroesPage`         | roster + form dialog                                                                      |
| `/pentatlon`     | `PentathlonPage`     | three internal phases: selection → events → podium (single route, internal state machine) |
| `/:catchAll(.*)` | `NotFoundPage`       | Spanish 404 with link back to `/heroes`                                                   |

Route titles set via `meta.title` and a small `useDocumentTitle` composable.

---

## 6. Scoring engine — `features/pentathlon/scoring/`

The most critical and most testable area. Implemented as pure functions, zero Vue imports, fully unit-tested.

### 6.1 Public types

```ts
// types.ts
export type EventId = 1 | 2 | 3 | 4 | 5

export interface ScoredParticipant {
  heroId: string
  value: number // raw event value (can be negative)
  points: number // 5/3/1 share after average-on-tie
  reasons: string[] // human-readable Spanish explanations (e.g. "+5 por ir último")
}

export interface EventResult {
  eventId: EventId
  name: string // Spanish
  formula: string // human-readable formula
  participants: ScoredParticipant[] // ordered by value desc
}

export interface ClassificationEntry {
  heroId: string
  totalPoints: number
  wins: number // # events where participant was in the tied-top group
  lastEventValue: number
  rank: 1 | 2 | 3 // after tiebreaker — always distinct
}

export interface PentathlonRun {
  participantIds: [string, string, string]
  events: [EventResult, EventResult, EventResult, EventResult, EventResult]
  classification: [ClassificationEntry, ClassificationEntry, ClassificationEntry]
}
```

### 6.2 Event formulas (`events.ts`)

Pure functions of `(self, opponents, context)` returning `{ value, reasons }`:

1. **Escalar el rascacielos:** `(strength × 4) − (weight × 2)`
2. **Contar un chiste:** `(charisma²) − Σ(opponent.charisma)`
3. **Disparar al villano:** `(agility + strength) + (isLastInGeneralSoFar(self, prevPoints) ? 5 : 0)`
4. **Sprint de 200 km:** `(agility × 4) + (endurance × 2) + (wonPreviousEvent(self, eventsSoFar) ? 10 : −1)`
5. **Rescatar 100 gatitos:** `(agility × 2) + (winCount(self, eventsSoFar) >= 2 ? 5 : 0)`

Each conditional pushes a Spanish `reason` string for transparent UI.

### 6.3 Points allocator (`points.ts`) — decision §6.6 (Option B: average-on-tie)

Algorithm:

1. Sort participants by `value` desc.
2. Group consecutive participants with equal `value`.
3. For each group occupying positions `[i, …, i+k-1]` (0-indexed in the sorted list), award each member `mean(BASE_POINTS[i..i+k-1])` where `BASE_POINTS = [5, 3, 1]`.

Examples (matching decision §6.6 exactly):

- No ties: 5 / 3 / 1.
- 1st = 2nd, 3rd lower: `mean(5,3)=4` / `4` / `1`.
- 1st alone, 2nd = 3rd: `5` / `mean(3,1)=2` / `2`.
- All three tied: `mean(5,3,1)=3` / `3` / `3`.

### 6.4 "Won an event" / "won previous" / "last in general" — tie semantics

Per decisions §6.7–6.9:

- **Won an event:** participant's `value` equals the max `value` in that event. Multiple winners possible (decision §6.7, §6.9).
- **Last in general so far (event 3):** participant's accumulated points (from events 1+2) equal the min. Multiple "lasts" possible; all get +5 (decision §6.8).
- **Won previous event (event 4):** participant tied for max in event 3 ⇒ +10; otherwise −1.

### 6.5 Orchestrator (`simulate.ts`)

```ts
export function simulate(participants: [Hero, Hero, Hero]): PentathlonRun
```

Runs events 1..5 in order, threading the evolving state (per-event values, per-event points, cumulative points, win counts, last-event-winners) so events 3/4/5 see real prior results.

### 6.6 Final tiebreaker (`tiebreak.ts`) — decision §6.11

Sort all 3 entries by:

1. `totalPoints` desc
2. `wins` desc
3. `lastEventValue` desc (value in event 5)
4. `name` asc (Spanish locale, case-insensitive) — applied at the orchestrator level where names are available

Assign distinct ranks 1/2/3. Returned in the run's `classification`.

### 6.7 Test plan for scoring (Vitest, plain functions — no `renderComposable`)

- Each event formula has a table-driven test (boundary inputs 0 and 10, negative-value cases for event 1, conditional bonus on/off paths).
- `points.ts`: all 4 tie shapes from §6.3 plus the all-equal-zero edge case.
- `simulate.ts`: deterministic golden test on a fixed roster of 3 heroes; snapshot the full `PentathlonRun`.
- `tiebreak.ts`: cases where each tiebreaker level decides (points only, wins decides, last-event-value decides, alphabetical decides, all four tied → stable alphabetical).
- Sequential-dependency tests: a scenario where the bonus in event 3 changes the leader and consequently flips event 4's +10/-1 — verify the value propagates.

---

## 7. Component architecture & dataflow

### 7.1 Hero flow

```
HeroesPage
├── PageHeader (eyebrow "PLANTILLA" / title / subtitle)
├── HeroGrid
│   ├── HeroCard × N
│   │   └── ProgressBar × 5
│   └── HeroEmptySlot
├── HeroFormDialog (mounted lazily, opens via "+ Inscribir héroe")
└── ConfirmDeleteDialog
```

- `HeroesPage` calls `store.load()` on mount.
- `HeroFormDialog` uses `useHeroForm()` composable: holds draft, runs validation, calls `store.create` / `store.update`. On success → close, toast, refresh.
- `HeroImageInput` is a controlled child that validates dimensions/size and emits base64.

### 7.2 Pentathlon flow

```
PentathlonPage
├── (phase = 'select')  HeroSelector
├── (phase = 'run')     PageHeader + EventStep (current) + "Siguiente prueba →"
└── (phase = 'podium')  ClassificationPodium + "Simular de nuevo →"
```

- `PentathlonPage` derives phase from `pentathlonStore.cursor` and `pentathlonStore.run`.
- `EventStep` reads from `pentathlonRunKey` (provide/inject) and renders the current event's formula, participants' values, points, and reasons.
- `ClassificationPodium` renders the 3 entries in podium order (visual order: 2nd · 1st · 3rd; semantic order in markup: 1st · 2nd · 3rd) using `gold`/`silver`/`bronze` tokens.

---

## 8. Validation rules (consolidated)

| Field      | Rule                                                                                                   | Decision ref         |
| ---------- | ------------------------------------------------------------------------------------------------------ | -------------------- |
| `name`     | required, trimmed, length 2..40, charset = letters Unicode + digits + space + `.'-`, no emojis/control | §6.1, §6.3           |
| `name`     | unique across roster (case-insensitive after `trim`), excludes self when editing                       | AC-2.2, AC-3.2       |
| `picture`  | required at create; optional at edit (keep existing if absent); PNG/JPEG; ≤ 200 KB; exactly 128×128    | AC-2.3, AC-3.3, §6.2 |
| attributes | integer in `[0, 10]` each                                                                              | AC-2.5               |

Validation lives in `useHeroForm` (pure functions, easy to unit-test via plain calls).

---

## 9. Build, env, scripts

`package.json` scripts:

| Script       | Command                          |
| ------------ | -------------------------------- |
| `dev`        | `vite`                           |
| `build`      | `vue-tsc --noEmit && vite build` |
| `preview`    | `vite preview`                   |
| `test`       | `vitest run`                     |
| `test:watch` | `vitest`                         |
| `test:e2e`   | `playwright test`                |
| `lint`       | `eslint . --ext .ts,.vue`        |
| `format`     | `prettier --write .`             |
| `typecheck`  | `vue-tsc --noEmit`               |

`.env.example`:

```
VITE_PENTATHLON_API_BASE_URL=https://codetest-api.applivery.io
VITE_PENTATHLON_API_KEY=
```

`README.md` documents: generate the key via `curl -X POST https://codetest-api.applivery.io/api-keys/ -H "Content-Type: application/json" -d '{}'`, paste the `id` into `.env.local`.

---

## 10. Accessibility & performance plan

- All dialogs (`Dialog.vue`) implement: focus trap, focus return, `Esc` to close, `aria-modal`, labelled by heading id.
- Form inputs use `<label for>` association; inline error nodes referenced via `aria-describedby`; `aria-invalid` on invalid fields.
- The hero image element carries fixed `width="128" height="128"` to prevent CLS.
- Fonts are self-hosted in `public/fonts/` with `font-display: swap` (already in `colors_and_type.css`).
- The mobile layout is verified manually at 360 × 640 in the dev server before merging features.
- `prefers-reduced-motion` collapses non-essential transitions (the "Siguiente prueba →" reveal is content swap, not animation).

---

## 11. Risks & mitigations

| Risk                                                              | Mitigation                                                                                                                                                                                   |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sequential coupling of events 3/4/5 produces subtle bugs.**     | Implement as pure functions with golden tests; orchestrator is a single loop with a clear state object; one targeted test asserts that a bonus in event 3 propagates correctly into event 4. |
| **Tie semantics are easy to get wrong silently.**                 | Each tie shape from decisions §6.6–§6.11 is its own named test. The Spanish "reasons" array is rendered in UI — visual confirmation matches numeric.                                         |
| **OpenAPI spec marks `picture` as optional, our UX requires it.** | Validation in `useHeroForm` enforces it at create; types use `HeroInput.picture?: string` to match the wire format.                                                                          |
| **Trailing slashes on collection endpoints.**                     | `client.ts` preserves the path verbatim; tests hit the exact paths in §3.3.                                                                                                                  |
| **API key leakage.**                                              | Single read in `shared/http/config.ts`. Never logged. `.env.local` gitignored. `README` warns.                                                                                               |
| **Base64 image size in localStorage / memory.**                   | We do not localStorage-cache hero images. The 200 KB cap keeps payloads manageable.                                                                                                          |
| **Font assets missing locally.**                                  | `public/fonts/` populated as a setup task; build fails loudly if `@font-face` URLs 404 in CI smoke.                                                                                          |
| **API errors return unknown shapes.**                             | `ApiError` carries `rawBody`; UI shows mapped Spanish message; details visible in console.                                                                                                   |

---

## 12. Dependencies (initial)

Runtime:

- `vue@^3.4`
- `vue-router@^4`
- `pinia@^2`

Dev:

- `vite@^5`, `@vitejs/plugin-vue`
- `typescript@^5`, `vue-tsc`
- `tailwindcss@^3`, `postcss`, `autoprefixer`
- `vitest`, `@vue/test-utils`, `jsdom` (for the few component-level tests)
- `@playwright/test`
- `eslint`, `eslint-plugin-vue`, `@typescript-eslint/*`, `prettier`

No additional UI libraries, no axios, no date library, no validation library — kept lean per constitution §1.
