# Architecture

## High-level

```
┌──────────────────────────────────────────────────────────────────┐
│  Browsers / Capacitor mobile shells                              │
│  React 18 + Vite + TypeScript + Tailwind + shadcn/ui             │
└────────────────────────┬─────────────────────────────────────────┘
                         │
              TanStack Query  +  Supabase Realtime (WebSocket)
                         │
┌────────────────────────▼─────────────────────────────────────────┐
│  Lovable Cloud (Supabase)                                        │
│  • Postgres + RLS + SECURITY DEFINER functions                   │
│  • Edge Functions (M-Pesa, notifications, LPO generation)        │
│  • Storage (photos, videos, credentials, LPO PDFs)               │
│  • Auth (email/password + role-based via user_roles)             │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                M-Pesa Daraja API (C2B / B2C)
```

## Application shell

- `src/App.tsx` — top-level router, providers (`QueryClient`, `Auth`, `Realtime`, `Theme`, `ErrorBoundary`)
- `DashboardLayout` — unified shell with collapsible desktop sidebar + mobile bottom nav
- `ProtectedRoute` — wraps every authenticated route to enforce role-based access

## Data flow

1. User action → React component
2. Component invokes a hook (e.g. `useProblemReporting`) or service (e.g. `WorkflowGuardService`)
3. Service calls Supabase client (typed via auto-generated `src/integrations/supabase/types.ts`)
4. Postgres enforces RLS + triggers
5. Realtime broadcasts changes via `RealtimeContext` → subscribed components re-render

## Key services

| Service                       | Purpose                                                 |
| ----------------------------- | ------------------------------------------------------- |
| `WorkflowGuardService`        | Enforces sequential 9-stage report lifecycle            |
| `PaymentReleaseManager`       | Idempotent milestone payments with multi-sig            |
| `EscrowFundingValidator`      | DB-trigger-protected funding limits                     |
| `DuplicateReportDetector`     | Real-time keyword + location + category matching        |
| `ContractorRatingDerivation`  | Composite rating from milestones + quality checkpoints  |
| `LPOGenerator`                | Auto-generates PDF LPOs on bid acceptance               |

See `mem://architecture/*` for detailed notes.
