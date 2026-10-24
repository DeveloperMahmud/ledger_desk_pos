# Deployment and Secrets Setup

Complete this only after feature review. Do not commit real values.

## Required accounts

- GitHub repository
- Vercel free project connected to the repository
- Supabase free project
- Any SMTP account you control (Gmail app password, business mail SMTP or another compatible provider)

## Environment variables

Copy `.env.example` to `.env.local` for local development. Configure the same values in Vercel Project Settings → Environment Variables.

| Variable | Visibility | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Browser-safe anonymous key; RLS still applies |
| `SUPABASE_SERVICE_ROLE_KEY` | Server secret | Email worker/admin server operations only |
| `APP_URL` | Server | Production app origin |
| `EMAIL_FROM` | Server | Branded sender name/address |
| `SMTP_HOST` | Server secret | SMTP hostname |
| `SMTP_PORT` | Server | Usually 587 or 465 |
| `SMTP_USER` | Server secret | SMTP username |
| `SMTP_PASS` | Server secret | SMTP password/app password |
| `EMAIL_WORKER_SECRET` | Server secret | Long random bearer secret for the outbox worker |

## Final setup order

1. Create the Supabase project and copy URL, anon key and service-role key.
2. Apply all ten migrations in filename order using Supabase SQL Editor or CLI.
3. In Supabase Auth, set Site URL to the Vercel production URL and add the local redirect URL.
4. Confirm private buckets `workspace-files` and `brand-assets` exist.
5. Set all environment variables locally and in Vercel.
6. Deploy to Vercel, create the first user through `/login`, confirm the email if enabled, then complete `/setup`.
7. Send a test SMTP email to an address you control.
8. Invoke `POST /api/email/process` with `Authorization: Bearer <EMAIL_WORKER_SECRET>`.
9. Schedule that protected endpoint using an available scheduler, or invoke it manually while volume is low.
10. Run the pilot checklist in `QA_HANDOVER.md` before real business use.

## GitHub/Vercel safety

- Keep `.env.local` ignored.
- Enable branch protection when collaborators are added.
- Do not place secrets in `NEXT_PUBLIC_*` variables.
- Rotate any secret accidentally shown in logs or committed.
- Preview deployments should use a separate Supabase project or carefully scoped test data.

## What cannot be completed without you

- Creating/logging into GitHub, Vercel, Supabase and email accounts
- Supplying project keys and SMTP credentials
- Choosing the final production domain
- Testing the physical inkjet/laser printer and paper/label stock

Everything else is implemented without requiring those secrets.
