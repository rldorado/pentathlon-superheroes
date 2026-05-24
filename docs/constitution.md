# Constitution — Pentatlón de Superhéroes

> Immutable project principles. These decisions are non-negotiable and govern every artifact that follows (`specification.md`, `plan.md`, `tasks.md`, code, tests, docs). Any deviation requires an explicit amendment to this document, agreed before code changes.

---

## 1. Stack

- **Language:** TypeScript (strict mode). No plain `.js` in `src/`.
- **Framework:** Vue 3 with the **Composition API** and `<script setup>` SFCs. No Options API, no mixins.
- **Build:** Vite.
- **Styling:** TailwindCSS. Component-level styles are utility-first; design tokens live in the Tailwind theme config (see §6). No inline hex colors, no ad-hoc CSS variables outside the theme.
- **Routing:** Vue Router (history mode).
- **HTTP:** native `fetch` wrapped in a thin client. No `axios` unless a clear need emerges in `plan.md`.
- **Node:** LTS (≥ 20).
- **Package manager:** **pnpm**. Lockfile is `pnpm-lock.yaml`. Mixing `npm` / `yarn` is forbidden.

UI copy is **Spanish** (`<html lang="es">`). Identifiers, code comments, commit messages, and docs are English.

---

## 2. Architecture: feature-based, not layer-based

Code is grouped by **feature/domain**, never by technical layer. Each feature owns its components, composables, types, store slice, and tests.

```
src/
  app/                      # bootstrap, router, root layout, global styles
    main.ts
    router.ts
    App.vue
  features/
    heroes/                 # CRUD: list, create, edit, delete
      components/
      composables/
      store.ts              # Pinia slice
      types.ts
      api.ts                # endpoint mapping for this feature
      __tests__/
    pentathlon/             # simulator: selection + 5 events + classification
      components/
      composables/
      scoring/              # pure, framework-independent scoring functions
      store.ts
      types.ts
      __tests__/
  shared/                   # ONLY genuinely cross-cutting primitives
    ui/                     # design-system primitives (Button, Card, Chip…)
    http/                   # fetch client, auth header injection
    config/                 # env loading, runtime config
    testing/                # renderComposable, fixtures
```

**Rules:**
- No top-level `components/`, `views/`, or `services/` buckets that split a single feature across the tree.
- A file moves to `shared/` only when ≥ 2 features genuinely consume it. Premature sharing is a smell.
- Cross-feature imports are forbidden between sibling features. If `pentathlon` needs hero data, it consumes the public surface of `heroes` (its store/types via `features/heroes/index.ts` or via provide/inject), never reaches into `features/heroes/components/*`.

---

## 3. State management

- **Pinia** for global/shared state (hero roster, API auth state, pentathlon simulation state).
- **provide/inject** to pass **feature-scoped dependencies** down a subtree and avoid prop drilling (e.g. the current pentathlon run, selection context, scoring service). Inject keys are typed `InjectionKey<T>` and exported from the feature's `types.ts` so consumers cannot stringly-type them.
- **Local component state** (`ref`/`reactive`) for transient UI: open/closed, hover, draft form input before commit.

**Decision rule:**
- Shared across routes / survives navigation → Pinia.
- Shared across a subtree within one feature → provide/inject.
- Lives and dies with one component → local.

Pinia stores are slim: state + getters + actions that mutate state and call the API client. Business rules (scoring) live in pure modules, not in stores.

---

## 4. Testing

### 4.1 Tools
- **Vitest** for unit tests (scoring, composables, store actions, small components where it adds value).
- **Playwright** for end-to-end tests, **critical paths only** (create a hero; run a full simulation to final classification). Not exhaustive.

### 4.2 Composables — the `renderComposable` rule (NO EXCEPTIONS)

Composables MUST be tested exclusively through a single shared helper at `src/shared/testing/renderComposable.ts`. **Direct-instance testing of composables is disallowed.** Reason: the architecture uses provide/inject and lifecycle hooks that require an active component context — direct calls produce false positives, silent injection failures, and lifecycle warnings.

Canonical helper (copied verbatim from the brief; this is the only sanctioned implementation):

```ts
// src/shared/testing/renderComposable.ts
import { createApp, type App } from 'vue'

interface RenderComposableResult<T> {
  result: T
  app: App
  unmount: () => void
}

export function renderComposable<T>(
  composable: () => T,
  options: { provides?: Record<string | symbol, unknown> } = {},
): RenderComposableResult<T> {
  let result!: T
  const app = createApp({
    setup() {
      result = composable()
      return () => null
    },
  })

  if (options.provides) {
    for (const [key, value] of Object.entries(options.provides)) {
      app.provide(key, value)
    }
  }

  app.mount(document.createElement('div'))

  return { result, app, unmount: () => app.unmount() }
}
```

### 4.3 Pure logic
Pure, non-Vue functions (scoring, ranking, tie-breaking) are tested as **plain function calls**, not via `renderComposable`. They live under `features/pentathlon/scoring/` and have zero Vue imports.

### 4.4 Coverage discipline
- The scoring engine (events 1–5, sequential carry-over, tie handling, boundary attribute values 0 and 10, negative event values, conditional bonuses) is the highest-risk area and gets first-class unit coverage.
- Each implementation task in `tasks.md` ships with its tests in the same commit. Untested business logic is not "done".

---

## 5. Performance & accessibility

### 5.1 Core Web Vitals targets (production build, mid-tier mobile)
- **LCP** ≤ 2.5 s
- **INP** ≤ 200 ms
- **CLS** ≤ 0.1

### 5.2 Accessibility baseline (a11y is not optional)
- Semantic HTML first (`<button>`, `<nav>`, `<main>`, `<form>`, `<label>`); ARIA only to fill genuine gaps.
- Every form control has a programmatically associated `<label>`. Validation errors are announced (`aria-describedby` + `role="alert"` where appropriate).
- Full keyboard navigability; visible `:focus-visible` ring on every interactive element (token: `--pa-focus-ring`).
- Color contrast ≥ WCAG AA. See accent rule in §6.
- No layout shift from images: the 128×128 hero portraits carry explicit `width="128" height="128"` (visual mask is circular — see §6.4 — but intrinsic image dimensions remain 128×128). Skeletons reserve space.
- `<html lang="es">`.
- Minimum touch target 44×44 px.
- `prefers-reduced-motion` is honored — durations collapse to 0 for non-essential transitions.

---

## 6. Design system & responsiveness

The design system is **fixed and pre-validated**. `design-reference/colors_and_type.css` is the canonical token source; `design-reference/Heroes Inscritos.html` and `design-reference/Clasificacion Final.html` are the canonical layouts. **Read those files before planning any component.** Implement them as Vue components consuming Tailwind theme tokens — never hardcoded values.

### 6.1 Tailwind theme (proposed `tailwind.config.ts`)

Tokens below are transcribed directly from `design-reference/colors_and_type.css`.

```ts
// tailwind.config.ts (proposed — finalize in plan.md)
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    // Replace defaults — we do not want Tailwind's blue/gray ramps leaking in.
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#FFFFFF',
      black: '#000000',

      canvas:    { DEFAULT: '#F6F7F9', 2: '#ECEEF2', dark: '#0C1022' },
      ink:       { DEFAULT: '#161A33', 2: '#5A6072', 3: '#8B91A1', onDark: '#F6F7F9', onDark2: '#A8AEC4' },
      hairline:  { DEFAULT: '#E2E5EB', dark: '#2A3060' },
      surface:   { dark: '#161A33', dark2: '#1F2547' },

      accent: {
        DEFAULT: '#FF4D2E',
        ink:     '#161A33', // text color to use ON accent (AA-safe)
        strong:  '#D9381C', // darker accent for white-label buttons
      },

      // Functional / data only — used exclusively to signal podium rank.
      gold:   { DEFAULT: '#F2B100', ink: '#161A33' },
      silver: { DEFAULT: '#B9C0CC', ink: '#161A33' },
      bronze: { DEFAULT: '#C77B3B', ink: '#FFFFFF' },
    },

    fontFamily: {
      display: ['"Clash Display"', '"Space Grotesk"', 'system-ui', 'sans-serif'],
      body:    ['"Geist"', 'system-ui', 'sans-serif'],
      mono:    ['"JetBrains Mono"', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
    },

    fontSize: {
      'display-xl': ['clamp(48px, 8vw, 96px)', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
      'display-l':  ['clamp(36px, 6vw, 64px)', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
      h1:           ['clamp(28px, 4.2vw, 40px)', { lineHeight: '1.05', letterSpacing: '-0.01em' }],
      h2:           ['clamp(22px, 3vw, 28px)',   { lineHeight: '1.1',  letterSpacing: '-0.01em' }],
      h3:           ['20px', { lineHeight: '1.2',  letterSpacing: '-0.01em' }],
      h4:           ['16px', { lineHeight: '1.3' }],
      body:         ['15px', { lineHeight: '1.55' }],
      'body-sm':    ['13px', { lineHeight: '1.5' }],
      caption:      ['12px', { lineHeight: '1.4' }],
      eyebrow:      ['11px', { lineHeight: '1.4', letterSpacing: '0.08em' }],
      score:        ['clamp(40px, 6vw, 72px)', { lineHeight: '1', letterSpacing: '-0.01em' }],
    },

    extend: {
      spacing: {
        // 8pt scale — Tailwind's defaults already cover most of this; aliases for clarity.
        s1: '4px', s2: '8px', s3: '16px', s4: '24px',
        s5: '32px', s6: '48px', s7: '64px', s8: '96px',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        pill: '999px',
        thumb: '9999px', // 128×128 hero portraits are circular (full radius)
      },
      maxWidth: { content: '1200px' },
      transitionTimingFunction: {
        pa:      'cubic-bezier(.2,.8,.2,1)',
        'pa-out':'cubic-bezier(.16,1,.3,1)',
      },
      transitionDuration: { fast: '120ms', base: '200ms', slow: '320ms' },
    },
  },
  plugins: [],
} satisfies Config
```

### 6.2 Color usage rules

- **Roles:** canvas (60%) / ink (30%) / accent (10%). Do not flood the UI with accent.
- **Accent contrast rule (CRITICAL):**
  - White text on `bg-accent` (`#FF4D2E`) is ~3.3:1 — **fails AA for normal text**.
  - On `bg-accent`: use `text-accent-ink` (`#161A33`) for normal text. White text is permitted only on **large (≥ 24 px) or bold (≥ 18.66 px bold)** text.
  - For white-label CTAs, use `bg-accent-strong` (`#D9381C`).
- **Medal colors are functional, not decorative.** `gold`/`silver`/`bronze` appear **only** in the classification & podium UI to signal rank. They never decorate generic UI.

### 6.3 Typography rules

- Display: **Clash Display** (500/600/700) — headings and the podium rank.
- Body: **Geist** (400/500/600) — paragraphs, labels, buttons.
- Mono: **JetBrains Mono** (400/700) for **all** attribute values, scores, and tabular data, with `tabular-nums` (`font-variant-numeric: tabular-nums lining-nums`) enabled for column alignment.
- **Inter is forbidden.**

### 6.4 Geometry & spacing

- Radii: 6 px (inputs, small buttons) / 8 px (cards, primary buttons) / pill 999 px (tags, attribute chips, medal badges) / **full-circle on 128×128 hero thumbnails** (use `rounded-thumb` → `9999px`; image is intrinsically 128×128 square, the circular shape comes from `border-radius` + `overflow:hidden`, never from cropping the source).
- Spacing scale (8 pt): 4 · 8 · 16 · 24 · 32 · 48 · 64 · 96. No off-grid values.
- Layout: 12-column grid, 24 px gutter, 1200 px max content width.
- Elevation: **no soft Material shadows.** Use hairline borders (`border-hairline`) or no border. The focus ring is the only "glow".

### 6.5 Responsiveness

Mobile-first. Design the narrow viewport first, then enhance at `sm` / `md` / `lg`. The hero grid, the hero create/edit form, and the **entire simulator flow** (selection → event-by-event → final classification) MUST be usable on a phone with:
- no horizontal scroll,
- 44×44 px minimum touch targets,
- readable type without zoom.

### 6.6 Anti-AI-slop guardrails (exclusion list)

- ❌ Generic SaaS gradients (purple-to-pink, blue-to-teal).
- ❌ Soft Material drop shadows; use hairlines or none.
- ❌ shadcn default blue, Tailwind default slate/zinc ramps in UI chrome.
- ❌ Stock-photo "heroes". Hero portraits are user-supplied 128×128 base64.
- ❌ Uniform `rounded-2xl` everywhere; respect the radii scale in §6.4.
- ❌ Generic CTA copy: "Enviar", "Empezar", "Click here". **Use Spanish brand voice:** "Inscribir héroe", "Simular pentatlón", "Ver clasificación", "Eliminar héroe", "Editar héroe".

---

## 7. Security

- The API key returned by `POST /apikeys` is a **secret**.
- Supplied via environment variable (e.g. `VITE_PENTATHLON_API_KEY` or runtime config), **never hardcoded**, **never committed**, **never logged**.
- `.env*` files (except `.env.example` with placeholder values) are gitignored. `.env.example` documents required variables with empty/dummy values.
- The key is injected into the `Authorization` header by the single `shared/http/` client. No other module touches `import.meta.env` for auth.
- No third-party telemetry, analytics, or error reporters are added without an explicit amendment.
- Dependencies are vetted: no unmaintained or single-author critical packages without justification recorded in `plan.md`.

---

## 8. Workflow discipline

- Phases proceed in order: `constitution.md` → `specification.md` → clarification pass → `plan.md` → `tasks.md` → implementation. **No implementation code before `tasks.md` is approved.**
- Each phase document is reviewed and explicitly approved before the next begins.
- `AI_WORKFLOW.md` carries a running time ledger updated **only** from the figure provided by the user each turn — never estimated by the assistant. A running total is visible, and the assistant flags when the 4-hour budget is at risk.
- Commits are atomic and scoped to a single task from `tasks.md`. Each implementation commit ships its tests.
- `README.md` and `AI_WORKFLOW.md` are kept current as we go, not reconstructed at the end.

---

## 9. Amendment procedure

This document changes only by:
1. Proposing the change in a message with the rationale.
2. Explicit approval from the user.
3. Committing the edit to `constitution.md` with a message of the form `constitution: amend §N — <summary>`.

Until amended, every other artifact must conform.
