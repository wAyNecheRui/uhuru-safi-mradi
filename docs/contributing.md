# Contributing

## Workflow

1. Use the [Lovable editor](https://lovable.dev/projects/650cf0a2-871e-4448-bdc4-a29898cc14e9) for AI-assisted changes — they auto-commit to `main`.
2. For local development, clone the repo and push directly; changes round-trip to Lovable.
3. All schema changes go through Supabase migrations (managed via the migration tool — never edit `supabase/migrations/` by hand).

## Code style

- **TypeScript strict** — no `any` without justification.
- **Semantic design tokens only** — never hardcode colors. Use HSL tokens from `index.css` and `tailwind.config.ts`.
- **No business logic in components** — extract into hooks/services.
- **RLS-first** — every new table requires policies in the same migration.

## Testing

- Co-locate tests under `src/test/` mirroring source structure.
- Run `npx vitest run` before submitting changes.
- Aim for coverage on services, hooks, and utility functions; UI snapshot tests are discouraged.

## Commits

Conventional commit prefixes encouraged:
- `feat:` new capability
- `fix:` bug fix
- `chore:` tooling / housekeeping
- `docs:` documentation
- `refactor:` no behavioral change

## Security disclosures

Report vulnerabilities privately via the project owner — do not open public issues for security findings.
