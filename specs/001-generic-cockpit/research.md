# Research: Alper Atlas Frontend — Generic Cockpit

**Branch**: `001-generic-cockpit` | **Date**: 2026-06-27

---

## 1. Design System Token Format

**Decision**: Use the existing dual-layer token system already present in the repo.

**Layer 1 — CSS custom properties** (`src/styles/app.css`):
All design tokens are declared as CSS variables on `:root` (e.g., `--green`, `--navy`,
`--teal`, `--rose`, `--amber`, `--ink`, `--slate`, `--mute`, `--line`, `--bg`). These
are the canonical runtime tokens consumed by utility classes and component CSS.

**Layer 2 — Tailwind `alper.*` palette** (`tailwind.config.js`):
The same color set is registered under the `alper` namespace for use in Tailwind
utility classes (e.g., `bg-alper-green`, `text-alper-navy`).

**Token value discrepancy — ACTION REQUIRED**:
The constitution specifies `#06805B` (green), `#143D6B` (navy), `#2C7A93` (teal).
The current `tailwind.config.js` and `app.css` use different hex values:

| Token | Constitution | Current impl |
|-------|-------------|--------------|
| green | `#06805B` | `#16a34a` |
| navy | `#143D6B` | `#1e3a8a` |
| teal | `#2C7A93` | `#2563eb` |

**Rationale for divergence**: The existing prototype was built with Tailwind's default
green-600/blue-800 palette for development speed. The constitution values are from the
design system validated with stakeholders.

**Resolution**: Align token values in `tailwind.config.js` and `app.css` to the
constitution's canonical palette as part of the design system fidelity task. This is a
non-breaking change since all styling references the token name, not the hex value.

**How to consume**: All new components MUST use `bg-alper-green` / `var(--green)`
token references — never raw hex. Update `:root` custom properties and Tailwind palette
simultaneously to stay in sync.

---

## 2. Test Runner and Library

**Decision**: Vitest + @testing-library/react + @testing-library/user-event

**Rationale**:
- Vitest integrates natively with the existing Vite build (zero additional config for
  the bundler; shares `vite.config.ts`).
- @testing-library/react enforces behavior-first testing (as required by Principle V):
  tests query by role/label, not component internals.
- @testing-library/user-event provides realistic keyboard/pointer simulation needed for
  a11y and triage behavior tests.
- No test framework currently exists in `package.json` — clean slate, no migration cost.

**Alternatives considered**:
- Jest + jsdom: Would work but requires a separate Babel/TS transform config; Vitest is
  the idiomatic Vite choice.
- Cypress component testing: Suited for integration/E2E rather than the unit-level
  schema-driven rendering tests required by Principle V.

**Setup steps** (captured in `quickstart.md`):
```
npm install --save-dev vitest @testing-library/react @testing-library/user-event
npm install --save-dev @vitest/coverage-v8 jsdom
```

Add to `vite.config.ts`:
```ts
test: {
  environment: 'jsdom',
  setupFiles: ['./tests/setup.ts'],
}
```

---

## 3. API Contract Types — Sharing Strategy

**Decision**: Maintain TypeScript types manually in `src/types/` in lockstep with the
backend contract. Add a schema version comment header to each contract file.

**Current state**: `src/types.ts` already defines a partial domain model
(`Movimentacao`, `Batch`, `FieldValue`, `Validacao`, etc.) in Portuguese (matching the
backend's internal naming). These are a solid starting point.

**Gap — OperationSchema not yet typed**: The current prototype hardcodes the field
catalog as `CATALOG` and `LABEL` dictionaries in `src/data/seed.ts`. The backend must
supply an `OperationSchema` response that replaces these. The frontend type for
`OperationSchema` and `FieldDefinition` must be added.

**Rationale for manual maintenance** (short term):
- No backend OpenAPI spec is publicly available yet.
- Manual types with a version comment header make divergence visible at compile time
  (TypeScript will fail to compile if the shape changes without updating the type).

**Long-term**: When the backend exposes a stable OpenAPI spec, generate types with
`openapi-typescript`. Migration is non-breaking — generated types can replace the
manual ones file by file.

**Convention**:
```ts
// CONTRACT VERSION: 1.0 — aligned with backend API v1
// DO NOT change without updating the backend contract simultaneously.
```

---

## 4. Prototype Component Inventory (Existing Reusable Assets)

The following components exist in the current prototype and can be reused or adapted:

| Component | File | Status |
|-----------|------|--------|
| `AppShell` | `src/components/layout/AppShell.tsx` | Reuse (navigation/layout) |
| `Modal` | `src/components/shared/UI.tsx` | Reuse (detail overlay) |
| `Toast` | `src/components/shared/UI.tsx` | Reuse (feedback) |
| `Tog` (toggle) | `src/components/shared/UI.tsx` | Adapt (triage filters) |
| `Sel` (select) | `src/components/shared/UI.tsx` | Adapt (filters) |
| `Progress` | `src/components/shared/UI.tsx` | Reuse (batch progress bar) |
| `TLItem` | `src/components/shared/UI.tsx` | Reuse (timeline) |
| `Field` | `src/components/shared/UI.tsx` | **Refactor** — currently hardcodes `LABEL[k]`; must accept canonical label from schema |
| `Dimension` | `src/components/shared/UI.tsx` | Reuse (validation groups) |
| `Icons` | `src/components/shared/Icons.tsx` | Reuse |

**Hardcoded label violations** (Principle I/III — must migrate):
- `LABEL` dictionary in `src/data/seed.ts` → replace with label from `FieldDefinition`
- `CATALOG` array in `src/data/seed.ts` → replace with `OperationSchema.fields` from API
- `MONO` Set in `src/data/seed.ts` → replace with `FieldDefinition.displayType` flag

---

## 5. State Management

**Decision**: React built-in state (`useState`, `useReducer`, `useContext`) + custom
hooks. No external state library.

**Rationale**: The cockpit has two main state concerns — (a) the current batch +
occurrence list and (b) the active detail record. Both are hydrated from the API on
mount and updated via API calls. No cross-cutting client cache (no `localStorage`, per
Principle Technical Constraints). React context for session and schema; local state for
triage filters and UI state.

**Alternatives considered**:
- Zustand: Useful if many unrelated components share the same slice; overkill for a
  single-surface cockpit with straightforward data flow.
- TanStack Query: Would simplify refetch / cache invalidation patterns; can be adopted
  later without restructuring the schema-driven rendering layer.
