# Security model

## Authentication & roles

- Supabase Auth (email/password) — sessions validated proactively in `AuthContext` via `supabase.auth.getUser()`.
- Roles stored in dedicated `user_roles` table (never on profiles) to prevent privilege escalation.
- All role checks use the `has_role(user_id, role)` SECURITY DEFINER function to avoid recursive RLS lookups.
- Idle timeout: 30 minutes with a 2-minute warning modal.

## Row-Level Security

Every table has RLS enabled. Policies are defined in migrations and reviewed via `supabase--linter`.

Example:
```sql
create policy "Citizens see own reports"
on public.problem_reports for select to authenticated
using (reported_by = auth.uid() or public.has_role(auth.uid(), 'government'));
```

## PII protection

Sensitive worker data is encrypted at rest:

| Field                | Protection                               |
| -------------------- | ---------------------------------------- |
| `national_id`        | `encrypt_sensitive_data()` PG function   |
| `kra_pin`            | Encrypted + audited access               |
| `bank_account`       | Encrypted + government-only read         |
| `phone_number`       | Masked in public views                   |
| `emergency_contact`  | Encrypted                                |

All access by government users is logged in `worker_access_audit` with IP, timestamp, justification, and accessed fields.

## Payment integrity

- **Idempotency**: `PaymentReleaseManager` uses single-flight locks + DB constraints.
- **Funding limits**: `enforce_escrow_funding_limit` trigger blocks over-funding.
- **Multi-sig**: high-value disbursements require multiple government approvals stored in `blockchain_transactions.signatures`.
- **Callback nonces**: `callback_nonces` table prevents M-Pesa replay attacks.

## Audit & monitoring

- `audit_logs` — all sensitive table mutations
- `verification_audit_log` — GPS-validated verification actions
- `worker_access_audit` — PII access tracking
- `Security Monitor` panel streams live audit data for admins

## Storage policies

Storage buckets enforce folder ownership: `auth.uid()/category/filename`. All uploads go through signed URLs with explicit RLS policies.

See `mem://security/*` memory entries for the canonical policy details.
