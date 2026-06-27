<!--
SYNC IMPACT REPORT
==================
Version change: N/A (template) → 1.0.0 (initial ratification)
Bump rationale: MAJOR — first population of all principles from template placeholders;
                establishes the governing baseline for the Alper Atlas frontend.

Modified principles: none (initial ratification; all principles are new)

Added sections:
  - I.   Schema-Driven Generic Rendering
  - II.  Design System Fidelity
  - III. Single Canonical Surface
  - IV.  Component Isolation & Typed Contracts
  - V.   Test Discipline
  - VI.  Accessibility & UX as First-Order
  - VII. AI-Readiness
  - Technical Constraints
  - Development Workflow & Quality Gates
  - Governance

Removed sections: none

Templates reviewed:
  ✅ .specify/templates/plan-template.md
     — "Constitution Check" gate already present; [Gates determined based on
       constitution file] placeholder is dynamically resolved at plan-time. No
       structural change required.
  ✅ .specify/templates/spec-template.md
     — Scope/requirements structure is compatible with all seven principles.
       No change required.
  ✅ .specify/templates/tasks-template.md
     — Test task phases (contract, integration, unit) align with Principle V.
       Task structure supports schema-driven behavior coverage. No change required.
  ✅ .specify/templates/commands/ — directory empty; no command files to update.

Deferred TODOs: none — all placeholders resolved.
-->

# Alper Atlas — Frontend Constitution

## Core Principles

### I. Schema-Driven Generic Rendering (NON-NEGOTIABLE)

The cockpit MUST render fields generically from the operation schema. There is no
per-client and no per-domain screen. The UI iterates the schema's field definitions
(label, data type, display order, validation signals) to build the grid and the
detail view. No field name, label, or rule may be hardcoded in components.

**Rationale**: A single generic surface is what makes the engine reusable; a
hardcoded screen would require a new build for every client or domain.

### II. Design System Fidelity (NON-NEGOTIABLE)

The UI MUST consume the documented design system (tokens, components) as the single
source of visual truth. The Alper visual identity from the prototype is binding:
primary green `#06805B`, navy `#143D6B`, teal `#2C7A93`, plus the documented type
scale, spacing, and component variants. No ad-hoc colors, spacing, or one-off
components outside the system.

**Rationale**: The prototype already validated the identity with stakeholders;
fidelity protects that validation and keeps the product coherent as it grows.

### III. Single Canonical Surface (NON-NEGOTIABLE)

The cockpit MUST display canonical labels only (from schema), never the originating
source's field names. Source-specific information (provenance) is shown on demand in
detail, never as the structure of the screen.

**Rationale**: If the screen spoke the source's language, a cockpit per source would
be required — the exact coupling the platform exists to remove.

### IV. Component Isolation & Typed Contracts (NON-NEGOTIABLE)

Components MUST be small, composable, and typed end to end with TypeScript. The
contract between frontend and backend (batch, occurrence, field, provenance,
validation, schema) is expressed as explicit TypeScript types mirroring the API
contract. No `any` for contract data; no business branching scattered across
components.

**Rationale**: Typed contracts catch integration drift at compile time and keep the
generic renderer predictable.

### V. Test Discipline (NON-NEGOTIABLE)

Rendering logic driven by schema, triage/filtering behavior, and validation-state
display MUST be covered by component and unit tests. Tests assert behavior the user
relies on (a blocking error prevents approval affordance; ambiguous provenance shows
a warning), not implementation detail.

**Rationale**: The cockpit's correctness is what analysts trust; schema-driven
rendering has enough branching to demand coverage.

### VI. Accessibility & UX as First-Order

Triage MUST reduce cognitive load (show what needs decision first; collapse what is
conforming). Interactions MUST be keyboard-navigable and meet documented a11y
standards. The analyst experience is a first-order requirement, not a polish phase.

**Rationale**: Reducing time-per-record and analyst error is a core success metric
of the platform.

### VII. AI-Readiness

The UI MUST treat decision affordances (approve, reject, confirm) and confidence
signals (provenance state, validation severity) as data-driven, so a future state
where AI pre-decides and the human validates exceptions can be introduced without
restructuring the screens.

**Rationale**: The roadmap moves toward AI-assisted conference; the surface must be
ready to present machine suggestions alongside human controls.

## Technical Constraints

- **Stack**: React + TypeScript + Tailwind CSS. The documented design system is the
  styling source of truth; Tailwind usage stays within the system's tokens.
- **State**: No browser storage (`localStorage`/`sessionStorage`) for application
  state; state is held in memory / app state management and hydrated from the API.
- **API contract**: Types are generated or maintained in lockstep with the backend
  contract; divergence is a defect.

## Development Workflow & Quality Gates

- Every plan MUST pass a Constitution Check before tasks are generated; visual or
  structural deviations from the design system must be justified or rejected.
- No component merges without tests for its schema-driven behavior (Principle V).
- Any hardcoded field, label, or per-client branch (Principles I/III) is rejected
  at review.

## Governance

This constitution supersedes other practices for the frontend repository.

Amendments require documented rationale, a migration note, and a semantic version
bump:

- **MAJOR**: Principle removal or redefinition.
- **MINOR**: New or materially expanded principle.
- **PATCH**: Clarification, wording, or non-semantic refinement.

All reviews verify compliance; deviations require explicit, documented approval.

**Version**: 1.0.0 | **Ratified**: 2026-06-27 | **Last Amended**: 2026-06-27
