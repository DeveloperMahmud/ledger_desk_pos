# Developer Guide

## Product architecture

Authentication uses the Supabase browser client at `/login`. The setup wizard remains available in preview mode without credentials; once configured, it verifies the signed-in user, calls `create_workspace_with_owner`, and persists workspace preferences under RLS.

The root `proxy.ts` is intentionally dormant when Supabase variables are absent. Once configured, it refreshes Supabase session cookies and performs an optimistic redirect for private routes. RLS and trusted database functions remain the authoritative authorization layer.

Inventory follows a configuration-aware repository pattern: without environment values it uses typed preview data; with Supabase configured it loads the signed-in user's first active workspace, reads the RLS-scoped catalog, and sends all stock mutations through audited database functions. `create_catalog_item` keeps category, unit, item and opening balance in one transaction.

Invoicing uses the same preview/live boundary. `create_invoice_draft` and `update_invoice_draft` keep headers, line items, totals and sequence allocation transactional. Invoice issue, payment, public-link creation and email queuing stay behind trusted database functions. The public route calls the anon-safe hashed-token RPC and never receives creator IDs or payment-proof paths.

LedgerDesk is a sector-aware business management application built with Next.js App Router, React, TypeScript, Tailwind CSS and Supabase/PostgreSQL. Inventory and invoicing automatically switch between typed preview data and live workspace repositories; the remaining modules stay preview-first until their repository adapters are connected. Database migrations define the production data model, RLS boundaries and transactional functions.

## Module boundaries

- `app/`: route-level server components, dynamic routes and the email worker route.
- `components/`: interactive client workspaces and reusable document/report views.
- `lib/inventory/`: stock types, calculations and demo repository.
- `lib/crm/`: leads, clients, proposals and project delivery rules.
- `lib/invoicing/`: invoice totals, payments, public links and stock requirements.
- `lib/accounting/`: basic/full accounting types and reporting calculations.
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
- `/accounting`, `/reports`, `/settings`
- `POST /api/email/process` protected outbox worker

## Database migration order

1. `202610240001_foundation.sql`
2. `202610240002_inventory.sql`
3. `202610240003_crm_projects.sql`
4. `202610240004_invoicing.sql`
5. `202610240005_accounting_email.sql`
6. `202610240006_defaults_storage.sql`

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

Use workspace `module_flags` to expose features. New business data must include `workspace_id`, composite workspace relationships, RLS policies and audit logs. Manufacturing should add BOM, work orders and material consumption without replacing the stock ledger. Branches should add `branch_id` under the existing workspace boundary.
