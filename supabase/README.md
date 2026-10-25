# Supabase database and storage

This directory contains the complete Release 1 backend definition. Apply the migrations in filename order only after a real Supabase project is connected.

## Migration order

1. `202610240001_foundation.sql` - profiles, workspaces, memberships, roles, audit foundation and first owner setup.
2. `202610240002_inventory.sql` - products, categories, stock balances, immutable stock movements and adjustment functions.
3. `202610240003_crm_projects.sql` - leads, clients, proposals, projects, tasks, milestones and deliverables.
4. `202610240004_invoicing.sql` - invoices, items, payments, templates, public links, view logs and stock-aware issue workflow.
5. `202610240005_accounting_email.sql` - accounts, journals, transactions, periods, email templates and durable outbox.
6. `202610240006_defaults_storage.sql` - default records, first-workspace initialization and private Storage policies.
7. `202610240007_email_worker_hardening.sql` - atomic outbox leases, bounded retries and stale-worker recovery.
8. `202610240008_inventory_atomic_create.sql` - transactional catalog/category/unit creation with optional opening stock.
9. `202610240009_invoice_atomic_draft.sql` - transactional invoice sequencing, header and line-item creation.
10. `202610240010_invoice_draft_update.sql` - atomic editing and recalculation of existing draft invoices.
11. `202610250011_crm_operations.sql` - audited CRM lead operations and atomic proposal drafts/status changes.
12. `202610250012_team_notifications_future_modules.sql` - secure invitations, notifications, branches, purchasing, transfers, manufacturing and recurring billing foundations.

## Security model

- Every operational row belongs to a `workspace`.
- The first authenticated user calls `create_workspace_with_owner` and becomes that workspace owner.
- Row Level Security and composite workspace foreign keys block cross-workspace access.
- Privileged mutations use audited database functions instead of direct table writes.
- Public invoices use hashed, expiring and revocable tokens; raw tokens are not stored.
- `workspace-files` and `brand-assets` are private buckets with workspace-scoped policies.
- The service-role key is server-only and must never use a `NEXT_PUBLIC_` name.

## Apply and verify

Use the Supabase dashboard SQL editor or linked Supabase CLI to apply every migration in order. Then create one test user and complete `/setup`. Verify inventory movement, invoice issue/payment, attachment upload, accounting posting and public invoice access before importing production data.

The exact environment variables and deployment order are documented in `../DEPLOYMENT_AND_SECRETS.md`.
