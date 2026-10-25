# Developer Guide

## Product architecture

Authentication uses the Supabase browser client at `/login`. The setup wizard remains available in preview mode without credentials; once configured, it verifies the signed-in user, calls `create_workspace_with_owner`, and persists workspace preferences under RLS.

The root `proxy.ts` is intentionally dormant when Supabase variables are absent. Once configured, it refreshes Supabase session cookies and performs an optimistic redirect for private routes. RLS and trusted database functions remain the authoritative authorization layer.

Inventory follows a configuration-aware repository pattern: without environment values it uses typed preview data; with Supabase configured it loads the signed-in user's first active workspace, reads the RLS-scoped catalog, and sends all stock mutations through audited database functions. `create_catalog_item` keeps category, unit, item and opening balance in one transaction.

Invoicing uses the same preview/live boundary. `create_invoice_draft` and `update_invoice_draft` keep headers, line items, totals and sequence allocation transactional. Invoice issue, payment, public-link creation and email queuing stay behind trusted database functions. The public route calls the anon-safe hashed-token RPC and never receives creator IDs or payment-proof paths.

LedgerDesk is a sector-aware business management application built with Next.js App Router, React, TypeScript, Tailwind CSS and Supabase/PostgreSQL. Inventory, CRM, proposals, projects, invoicing, accounting, reporting and workspace administration use configuration-aware repositories: typed preview data without secrets and RLS-scoped live data after setup. Database migrations define the production data model, authorization boundaries and transactional functions.

## Module boundaries

- `app/`: route-level server components, dynamic routes and the email worker route.
- `components/`: interactive client workspaces and reusable document/report views.
- `lib/inventory/`: stock types, calculations and demo repository.
- `lib/crm/`: leads, clients, proposals and project delivery rules.
- `lib/invoicing/`: invoice totals, payments, public links and stock requirements.
- `lib/accounting/`: basic/full accounting types and reporting calculations.
- `lib/reporting/`: cross-module live dashboard/report snapshots.
- `lib/workspace/`: settings, team, activity and portable backup adapters.
- `lib/email/`: server-only SMTP adapter and outbox processor.
- `lib/supabase/`: browser/client configuration boundary.
- `supabase/migrations/`: ordered production schema, RLS and transaction functions.
- `tests/`: deterministic domain rule tests.

## Route map

- `/` dashboard
- `/setup` first-run onboarding
- `/inventory`, `/inventory/[id]`, `/inventory/labels`
- `/clients`, `/proposals`, `/projects`, `/projects/[id]`
- `/invoices`, `/invoices/new`, `/invoices/[id]`
- `/public/invoice/[token]` secure client invoice view
- `/accounting`, `/reports`, `/settings`, `/team`, `/activity`, `/invite/[token]`
- `POST /api/email/process` protected outbox worker

## Database migration order

1. `202610240001_foundation.sql`
2. `202610240002_inventory.sql`
3. `202610240003_crm_projects.sql`
4. `202610240004_invoicing.sql`
5. `202610240005_accounting_email.sql`
6. `202610240006_defaults_storage.sql`
7. `202610240007_email_worker_hardening.sql`
8. `202610240008_inventory_atomic_create.sql`
9. `202610240009_invoice_atomic_draft.sql`
10. `202610240010_invoice_draft_update.sql`
11. `202610250011_crm_operations.sql`
12. `202610250012_team_notifications_future_modules.sql`

Never expose `SUPABASE_SERVICE_ROLE_KEY` to client components. Every operational row contains `workspace_id`; RLS and composite workspace foreign keys are both required. Stock, invoice issue, payments, proposal conversion and journal posting must go through trusted database functions.

## Accounting design

Basic and Full modes are two views of the same data:

- Basic mode records income/expense against a cash or bank account.
- `record_financial_transaction` creates a balanced journal automatically.
- Full mode exposes chart of accounts, journals, trial balance and statements.
- Posted entries are not edited. Corrections use reversal entries.
- Locked periods reject new posting and reversal dates inside the lock.

## Invoice lifecycle

1. Create draft with product/service lines.
2. Recalculate totals.
3. Issue via `issue_invoice`; product stock is checked and deducted atomically.
4. Generate a random public token; only its SHA-256 hash is stored.
5. Queue branded email.
6. Record cash/bank payment and proof path.
7. Payment status and accounting records reconcile from the same transaction.

## Local commands

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

Vitest uses one worker to remain stable on constrained Windows/free-tier runners.

## Adding future sectors

Use workspace `module_flags` to expose features. New business data must include `workspace_id`, scoped relationships, RLS policies and audit logs. Migration 012 provides extension points for branches, suppliers, purchase orders, stock transfers, BOMs, production orders and recurring invoices. Production completion must append stock movements through trusted functions; it must never rewrite stock balances directly.

## Extension checklist

1. Add the schema in a new timestamped migration; never edit an applied migration.
2. Add RLS before exposing the table to client code.
3. Put multi-row or financial mutations in a `security definer` function with explicit authorization.
4. Add a typed repository under `lib/<module>/repository.ts` and keep preview fallback in the component.
5. Add deterministic domain tests, then run typecheck, tests, lint and production build.
6. Update the Bangla user guide, migration list and implementation status.
