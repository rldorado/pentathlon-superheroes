# Pentatlón de Superhéroes

Vue 3 + TypeScript + Tailwind app for the "Pentatlón de Superhéroes" code challenge. Two surfaces in Spanish: a hero CRUD against a public REST API and a 5-event sequential simulator that produces a Gold / Silver / Bronze podium.

Governance, architecture, and scope live under [`docs/`](docs/):

- [`docs/constitution.md`](docs/constitution.md) — immutable principles (stack, structure, design system, a11y, security).
- [`docs/specification.md`](docs/specification.md) — user stories, acceptance criteria, non-functional requirements.
- [`docs/clarification.md`](docs/clarification.md) — resolved Q&A from the clarification pass (tie semantics, etc.).
- [`docs/plan.md`](docs/plan.md) — technical blueprint, API contract mapping, state design, risks.
- [`docs/tasks.md`](docs/tasks.md) — 50 atomic tasks in 8 review rounds.
- [`AI_WORKFLOW.md`](AI_WORKFLOW.md) — AI tooling, prompting strategy, failure log, time ledger.

## Prerequisites

- **Node** ≥ 20 (see [`.nvmrc`](.nvmrc); run `nvm use`).
- **pnpm** ≥ 9 (no `npm` / `yarn`; the lockfile is `pnpm-lock.yaml`).

## Install

```bash
pnpm install
```

## Environment setup

The app reads two variables at boot from `.env.local` (gitignored):

```bash
cp .env.example .env.local
```

### Generate an API key (once)

The challenge API requires an opaque `id` returned by `POST /api-keys/`. Generate it once with curl:

```bash
curl -X POST https://codetest-api.applivery.io/api-keys/ \
     -H "Content-Type: application/json" \
     -d '{}'
```

Copy the `id` from the response and paste it into `.env.local`:

```
VITE_PENTATHLON_API_BASE_URL=https://codetest-api.applivery.io
VITE_PENTATHLON_API_KEY=<the id you just generated>
```

**Security:** `VITE_PENTATHLON_API_KEY` is a secret. Never commit it. `.env*` files (except `.env.example`) are gitignored.

## Fuentes (font assets)

The design system uses three self-hosted families: **Clash Display**, **Geist**, **JetBrains Mono**. The CSS `@font-face` declarations in [`src/app/styles.css`](src/app/styles.css) expect files under [`public/fonts/`](public/fonts/):

```
public/fonts/
├── ClashDisplay-Medium.otf
├── ClashDisplay-Semibold.otf
├── ClashDisplay-Bold.otf
├── Geist-Regular.ttf
├── Geist-Medium.ttf
├── Geist-SemiBold.ttf
├── JetBrainsMono-Regular.ttf
└── JetBrainsMono-Bold.ttf
```

Without these files the app still runs — it falls back to `system-ui` and `ui-monospace` per the font-family stacks. Drop the assets in `public/fonts/` to get pixel-accurate fidelity against [`design-reference/`](design-reference/).

## Scripts

| Script | Command | What it does |
|---|---|---|
| `pnpm dev` | `vite` | Dev server with HMR on `http://localhost:5173` |
| `pnpm build` | `vue-tsc --noEmit && vite build` | Type-check then production build to `dist/` |
| `pnpm preview` | `vite preview` | Serve the production build on `http://localhost:4173` |
| `pnpm test` | `vitest run` | Unit + composable tests (one shot) |
| `pnpm test:watch` | `vitest` | Watch mode |
| `pnpm test:e2e` | `playwright test` | Playwright e2e (boots `pnpm preview` automatically) |
| `pnpm typecheck` | `vue-tsc --noEmit` | TS strict check (no emit) |
| `pnpm lint` | `eslint .` | Lint TS + Vue |
| `pnpm format` | `prettier --write .` | Format codebase |
| `pnpm format:check` | `prettier --check .` | CI-style format check |

First-time Playwright run also needs:

```bash
pnpm dlx playwright install --with-deps chromium
```

## Project layout

```
docs/                       Governance documents (read first)
design-reference/           Source-of-truth design HTML + tokens CSS
public/fonts/               Self-hosted font assets (you provide)
src/
  app/                      Bootstrap, router, root layout, global styles
  features/heroes/          (Round 5) hero CRUD feature
  features/pentathlon/      (Round 6) simulator feature + pure scoring engine
  shared/                   Cross-cutting primitives (http, ui, i18n, testing)
test/                       Vitest setup + cross-cutting unit tests
e2e/                        Playwright critical-path specs
```

Full layout in [`docs/plan.md`](docs/plan.md) §2.

## Status

Round 1 (scaffold) complete. Subsequent rounds are tracked in [`docs/tasks.md`](docs/tasks.md). Real CRUD and simulator views replace the placeholder routes starting Round 5.
