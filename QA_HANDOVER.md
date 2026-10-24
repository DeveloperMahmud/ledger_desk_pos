# QA, Pilot and Handover Checklist

## Automated baseline

- Lint has no warnings.
- TypeScript has no errors.
- Domain tests cover setup, inventory, CRM, invoicing, accounting and email retry behavior.
- Production build generates all private and public routes.

## Security checks

- User A cannot read or mutate Workspace B rows.
- Composite workspace foreign keys reject cross-workspace entity links.
- Service-role key is server-only.
- Public invoice token is random, stored hashed, expires and can be revoked.
- Public view excludes payment proof paths and creator IDs.
- Negative stock and duplicate invoice/project conversions are rejected.
- Posted journals require equal debit/credit and unlocked periods.
- Email worker rejects missing/invalid bearer secret.
- Concurrent email workers atomically claim separate jobs; stale jobs recover and retries stop after five attempts.
- Storage paths begin with the workspace UUID and private-bucket RLS applies.

## Pilot workflow

1. Sign up the first owner, sign in and create the workspace.
2. Add a stock item and opening balance.
3. Add lead, convert client, accept proposal and create project.
4. Create mixed invoice containing service and product lines.
5. Issue invoice and confirm product stock deduction.
6. Open secure invoice link and confirm view log.
7. Record partial payment with proof and confirm remaining due.
8. Send invoice email after SMTP setup and confirm delivery log.
9. Record expense in Basic mode and confirm Full-mode journal/trial balance.
10. Export reports and backup data.

## Physical print checks still required

- A4 invoice margins on the target inkjet/laser printer
- A4 label alignment with the actual label sheet
- Browser “Save as PDF” output on Chrome/Edge
- Future thermal printer and barcode/QR hardware

## Release decision

Do not use real financial data until migrations are applied to a dedicated Supabase project and the complete pilot workflow passes without manual database repair.
