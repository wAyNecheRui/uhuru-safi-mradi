# Uhuru Safi — Civic Transparency Platform

A production-grade, role-based civic-tech platform for Kenya. Citizens report community problems with GPS evidence, contractors bid under the Public Procurement Act (40-30-30 scoring), government officials approve and disburse funds via M-Pesa-backed escrow, and every action is auditable end-to-end.

> **Status**: Pre-publication — actively used for UAT and stakeholder presentations.

---

## Table of contents

1. [Overview](#overview)
2. [Tech stack](#tech-stack)
3. [Getting started](#getting-started)
4. [Project structure](#project-structure)
5. [Core workflows](#core-workflows)
6. [Security model](#security-model)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Documentation index](#documentation-index)

---

## Overview

Uhuru Safi connects four roles around a single accountability lifecycle:

| Role           | Primary actions                                                        |
| -------------- | ---------------------------------------------------------------------- |
| **Citizen**    | Report problems with GPS + photo, vote, verify milestones, rate work   |
| **Contractor** | Submit AGPO-aware bids, deliver milestones with photo evidence         |
| **Government** | Approve reports, evaluate bids, fund escrow, release milestone payments|
| **Admin**      | Manage users, roles, system config, security monitoring                |

The platform enforces a **9-stage report lifecycle** (Identification → Validation → Bidding → Awarded → Funded → In-Progress → Verification → Payment → Completion) governed by automated triggers and `WorkflowGuardService`.

---

## Tech stack

- **Frontend**: React 18, Vite 5, TypeScript 5, Tailwind CSS 3, shadcn/ui
- **State / data**: TanStack Query, React Context, Supabase Realtime (WebSockets)
- **Mapping**: MapLibre GL JS (vector tiles, fly-to)
- **Backend**: Lovable Cloud (Supabase) — Postgres, RLS, Edge Functions, Storage
- **Auth**: Supabase Auth with role-based access via `user_roles` + `has_role()` RPC
- **Payments**: M-Pesa Daraja API (C2B/B2C) with idempotent escrow controls
- **Mobile**: Capacitor 7 (Android/iOS native shells)
- **i18n**: i18next with browser language detection
- **Testing**: Vitest + Testing Library + jsdom

---

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (instant preview at http://localhost:5173)
npm run dev

# 3. Type check
npm run typecheck

# 4. Lint
npm run lint

# 5. Run tests
npx vitest run

# 6. Production build
npm run build
```

Environment variables are managed via Lovable Cloud — no local `.env` editing required. Connection details are auto-injected through `src/integrations/supabase/client.ts`.

---

## Project structure

```
src/
├── assets/              Static images and brand assets
├── components/          Reusable UI (shadcn-based) and feature components
├── config/              App-wide configuration (i18n, query client)
├── constants/           Enums, lookup tables, Kenyan administrative data
├── contexts/            AuthContext, RealtimeContext, ThemeContext
├── hooks/               Custom React hooks (useAuth, useRealtimeSync, ...)
├── integrations/        Supabase client + generated types (read-only)
├── lib/                 Pure utilities (logger, dateUtils, validation)
├── pages/               Route components (Landing, Citizen, Contractor, ...)
├── services/            Domain services (WorkflowGuard, PaymentRelease, ...)
├── test/                Vitest specs mirroring src/ structure
├── types/               Shared TypeScript types
└── utils/               Helpers (workflowStatusDisplay, gps, formatting)

public/
├── robots.txt           Search engine directives
└── sitemap.xml          11 indexable public routes

supabase/
├── functions/           Edge Functions (M-Pesa, escrow, notifications)
└── migrations/          Database schema (read-only via Lovable)
```

---

## Core workflows

- **Problem reporting** → `/citizen/report` with auto-GPS, duplicate detection, category templates
- **Community validation** → dual-tab voting + governance verification
- **Bidding** → 40% technical / 30% financial / 30% past performance scoring
- **Escrow funding** → DB-trigger-protected funding limits, multi-sig payment release
- **Milestone verification** → sequential stage enforcement, citizen rating capture
- **Auto-generated LPOs** → professional PDF Local Purchase Orders on bid acceptance

See the [Documentation index](#documentation-index) below for deep links into each workflow.

---

## Security model

Multi-layer defense:

1. **RLS-first**: every table has Row-Level Security enabled; roles are stored in a separate `user_roles` table to prevent privilege escalation.
2. **`SECURITY DEFINER` functions** (`has_role`, `validate_*`) bypass recursive RLS issues.
3. **PII protection**: worker national IDs, KRA PINs, bank accounts, and phone numbers are encrypted at rest with audited access via `worker_access_audit`.
4. **Idempotent payments**: `PaymentReleaseManager` enforces single-execution semantics with database-level constraints.
5. **Session hardening**: 30-min idle timeout (2-min warning), proactive `getUser()` validation in `AuthContext`.
6. **Audit logging**: all sensitive actions write to `audit_logs` and `verification_audit_log`.

---

## Testing

99 tests across:

- `src/test/lib/` — pure utilities (logger, dateUtils)
- `src/test/reporting/` — problem reporting flows + GPS capture
- `src/test/seo/` — SEO component head management
- `src/test/services/` — workflow, escrow, payment guards

```bash
npx vitest run              # CI mode
npx vitest                  # watch mode
npx vitest --coverage       # with coverage report
```

---

## Deployment

- **Web (Lovable hosting)**: open the [Lovable project](https://lovable.dev/projects/650cf0a2-871e-4448-bdc4-a29898cc14e9) → Share → Publish
- **Custom domain**: Project → Settings → Domains → Connect Domain
- **cPanel SPA**: see [`docs/deployment.md`](./docs/deployment.md) — requires `.htaccess` rewrite to `index.html`
- **Mobile (Capacitor)**:
  ```bash
  npm run build
  npx cap sync
  npx cap open android   # or ios
  ```

---

## Documentation index

Long-form architecture, workflow, and policy notes are maintained as project memory and surfaced here:

| Topic                   | Document                                                  |
| ----------------------- | --------------------------------------------------------- |
| Architecture overview   | [`docs/architecture.md`](./docs/architecture.md)          |
| Security & PII model    | [`docs/security.md`](./docs/security.md)                  |
| Workflow lifecycle      | [`docs/workflows.md`](./docs/workflows.md)                |
| Deployment guide        | [`docs/deployment.md`](./docs/deployment.md)              |
| Contributing            | [`docs/contributing.md`](./docs/contributing.md)          |
| Walkthrough script      | `Uhuru_Safi_Walkthrough_Script.md` (15-min demo)          |

---

## License

Proprietary — Uhuru Safi civic transparency initiative. All rights reserved.
