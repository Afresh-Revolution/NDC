# NDC Naija — Northside Developers Cooperative

Member-owned technology cooperative platform implementing the October 2026 master roadmap: public site, onboarding, member workspace, double-entry savings ledger, gated project incubator, studio contracting, and a **super admin** control plane.

Membership does **not** guarantee financing, employment, loans, or returns. Loans, investment and public equity portals are **feature-flagged off**.

Package manager: **Bun** (do not use npm).

## Stack

- TypeScript, Next.js App Router, React, SCSS Modules
- PostgreSQL 16 (Docker or any managed Postgres / Supabase)
- Double-entry ledger in kobo, with idempotent webhooks
- Paystack / Flutterwave, Resend, Cloudinary, GitHub/GitLab OAuth (optional)
- Recharts, Zod, Vitest

## Quick start

Uses **embedded PostgreSQL (PGlite)** so you do not need Docker. The same SQL schema runs on Docker/Supabase when `DATABASE_DRIVER=postgres`.

```bash
bun install
bun run db:migrate
bun run db:seed
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Super admin

Seeded from `.env` (`SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`):

- Email: `admin@ndcnaija.org`
- Panel: [http://localhost:3000/admin](http://localhost:3000/admin)

Change these before any non-local environment.

## Environment

Copy `.env.example` → `.env`. The app and seed scripts read `.env` only. Notable variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` / `ENCRYPTION_KEY` | Sessions and token encryption |
| `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` | Bootstrap operator |
| `FEATURE_LOANS_ENABLED` | Must stay `false` until licensed |
| `FEATURE_DISBURSEMENT_ENABLED` | Milestone payouts |
| `PAYSTACK_*` / `FLUTTERWAVE_*` | NGN charges and webhooks |
| `RESEND_API_KEY` | Transactional email |
| `SUPABASE_*` / `CLOUDINARY_*` | Private/public storage |
| `GITHUB_*` / `GITLAB_*` | Optional portfolio OAuth (no repo write) |

Paystack webhook URL: `/api/webhooks/paystack`.

## Fund separation

Chart of accounts is seeded in `src/db/seed.ts`. Member savings post to liability **2100**. Project grants post to the project-development pool. A database trigger rejects project spend against savings liabilities.

## Scripts

```bash
bun run dev
bun run build
bun run db:reset
bun run test
```
