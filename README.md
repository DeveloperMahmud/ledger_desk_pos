# LedgerDesk Business OS

A future-ready multi-sector business application focused on inventory, professional invoicing, freelancing operations and optional full accounting.

## Current capabilities

- Multi-workspace owner onboarding with Supabase Auth and RLS
- Live-ready inventory catalog, atomic opening stock, audited stock adjustments and CSV export
- Product, service and mixed Invoice Studio with modern, classic and minimal templates
- Atomic invoice draft save/update, stock-aware issue, manual payments, secure client links and email queue
- Live CRM, proposals, project tasks, basic/full accounting, reports and persistent modular settings
- Team roles, secure invitation tokens, audit activity, password reset and portable workspace backups
- Future-ready branches, suppliers, purchasing, stock transfer, BOM/production and recurring invoice schema
- Private attachment buckets, durable SMTP outbox and concurrency-safe email worker
- Preview mode when Supabase variables are absent

## Technology

- Next.js 16 App Router, React 19 and TypeScript
- Tailwind CSS 4
- Supabase Auth, PostgreSQL, RLS and Storage
- Zod, React Hook Form, Vitest and ESLint
- Nodemailer-compatible SMTP

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Without environment variables the app runs in preview mode.

## Live configuration

Copy `.env.example` to `.env.local`, add your own values, and apply the SQL files in `supabase/migrations` in filename order. Never commit `.env.local` or any service-role/SMTP secret.

See:

- `ARCHITECTURE_AND_PRODUCT_GUIDE.md` — master architecture, diagrams and approved future plan
- `NEXT_DEVELOPMENT_PLAN.md` — execution-ready backlog for the next development cycle
- `DEPLOYMENT_AND_SECRETS.md`
- `DEVELOPER_GUIDE.md`
- `USER_GUIDE_BN.md`
- `QA_HANDOVER.md`

## Quality commands

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Run all four commands before each release; the handover document records the last verified result.
