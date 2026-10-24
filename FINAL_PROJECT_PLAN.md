# Final Project Plan — Inventory, Professional Invoicing & Sector-Based Business App

## 1. Approved Product Direction

প্রথম version-এর মূল product হবে **Inventory Management + Professional Invoice System + Freelancing / Digital Service Business Management Web App**। এটি আগে freelancing কাজ এবং অন্য ছোট ব্যবসার inventory/invoice-এর জন্য ব্যবহার হবে; পরে একই app-এ full Retail/POS, Factory/Manufacturing এবং সর্বোচ্চ 5–6টি branch যোগ করা যাবে।

প্রথম version-এ payment gateway, thermal printer, barcode scanner, cash drawer এবং factory production build করা হবে না। এগুলো future-ready data/module design হিসেবে থাকবে। Manual sales/invoice, product inventory এবং service invoice অবশ্যই থাকবে।

## 2. Fixed Decisions

| বিষয় | সিদ্ধান্ত |
|---|---|
| Main focus now | Inventory Management, Invoice & Freelancing/Digital Services |
| Future sectors | Full Retail/POS, Factory/Manufacturing, General Service |
| Branch now | নেই |
| Future branches | সর্বোচ্চ 5–6টি |
| Payment gateway | এখন লাগবে না |
| Payment record | Cash, Bank, Online Bank, Mobile Wallet, Other — manual entry |
| Attachments | Image, PDF, document, external cloud link |
| Accounting | Basic by default; Full Accounting optional toggle |
| Printing now | A4 invoice/quotation/voucher and product label print for inkjet and laser printer |
| Printing later | Thermal receipt, barcode/label printer |
| Source control | GitHub |
| App hosting | Vercel |
| Database/Auth/Storage | Supabase Free |
| Paid subscription | Release 1-এ ব্যবহার করা হবে না |

## 3. Architecture: One Core, Multiple Sector Modules

```
Workspace / Business
├── Common Core
│   ├── Login, Users & Permissions
│   ├── Contacts, Files & Attachments
│   ├── Cash / Bank Accounts
│   ├── Income, Expense & Accounting
│   ├── Dashboard & Reports
│   ├── Settings, Sector Selector & Feature Toggles
│   └── Audit Log
│
├── Inventory & Invoicing          [Release 1]
│   ├── Products, Services & Stock Ledger
│   ├── Invoice, Online Invoice & Payment Record
│   ├── Invoice Templates & Email Templates
│   └── Print/PDF/Label Templates
│
├── Freelancing / Digital Service  [Release 1]
│   ├── Leads & Clients
│   ├── Services & Packages
│   ├── Proposal / Quotation
│   ├── Projects, Tasks & Milestones
│   ├── Deliverables, Revisions & Files
│   └── Invoice, Payment, Due & Profit
│
├── Retail / POS                  [Future]
│   ├── Fast Counter Sales & Receipt
│   ├── Purchase & Supplier
│   └── Inventory, Barcode & Printer
│
└── Factory / Manufacturing       [Future]
    ├── Raw Materials & Warehouse
    ├── Bill of Materials
    ├── Production Orders
    └── Finished Goods & Costing
```

Owner settings থেকে sector বা module on/off করা যাবে। Off করলে data delete হবে না; শুধু menu ও form লুকানো থাকবে। পরে on করলে পুরোনো data থাকবে।

## 4. Release 1 Features: Inventory, Invoicing & Freelancing

### Dashboard

- Monthly income, expense, net profit, total due
- Cash, bank ও online-bank balance
- Active project, overdue invoice, pending milestone, deadline
- Quick action: Lead, Proposal, Project, Invoice, Expense, Payment

### Product, Service & Inventory Management

- One catalog for both **Product** and **Service**; service has no stock, product has stock tracking
- Product name, image, category, SKU/code, unit, purchase cost, selling price and tax rule
- Opening stock, stock-in, stock-out, adjustment, damage/loss and reason
- Immutable stock ledger: every quantity change shows date, user, source document and balance
- Low-stock level, out-of-stock alert and stock-value report
- Supplier-ready fields and purchase workflow foundation for later expansion
- Product labels with product name, code, price and optional barcode area; printable on A4 label sheets
- Manual invoice sale can reduce product stock immediately; service invoice does not change stock

### Professional Invoice Studio

- Separate invoice types: Digital Service, Product Sale, Mixed Product + Service, Credit Note
- Invoice number rules, draft/issued/viewed/partially-paid/paid/overdue/cancelled states
- Templates: Minimal, Modern Agency, Classic Business, Detailed Tax and Custom
- Owner can choose a default template and select a different template per invoice
- Brand customization: logo, business details, brand color, font pair, footer, bank details, terms, signature and payment instructions
- Field controls: show/hide client address, item code, tax, discount, due date, notes, payment reference and signature
- Invoice item table customization: column order, labels, totals, language and currency format
- A4 PDF download and browser print; layouts optimized for inkjet/laser printer
- Template preview before issue; invoice template version saved so old issued invoices do not change unexpectedly

### Online Client Invoice

- Each issued invoice can generate a secure, hard-to-guess public link
- Client can open branded invoice on mobile/desktop, download PDF and see payment instructions/status
- Link can have expiry, disable switch, client-email check and view history
- Client cannot edit invoice; invoice status, view time and PDF download are logged
- Online invoice uses the agency's logo, color, custom message and professional template

### Invoice Email Templates & Delivery

- Email templates: invoice sent, payment reminder, overdue reminder, payment received and thank-you
- Owner can edit subject, greeting, body, footer, signature, invoice-link button text and brand colors
- Dynamic values: client name, invoice number, amount, due date, project/service and online invoice link
- Preview, send-test-email, send-now, resend and delivery log
- Invoice PDF may be attached for small files; online invoice link is the default delivery method
- The app will keep delivery provider configurable (SMTP/API adapter). A real client email send requires the owner to configure a custom SMTP/email provider and sender domain/credentials; Supabase's default email sender is not appropriate for client invoice delivery.

### Lead & Client Management

- Lead source: Upwork, Fiverr, Referral, Facebook, Direct Client ইত্যাদি
- Lead stages: New, Contacted, Proposal Sent, Negotiation, Won, Lost
- Client profile, country, contact, notes, tags and attachments
- Client-wise projects, invoices, payments, due and history
- Follow-up and due-date reminder-ready fields

### Services & Packages

- Service category and package: Basic, Standard, Premium
- Price, currency, delivery time, description, add-ons and discount
- Examples: Web Development, Design, SEO, Video Editing, Marketing, Consulting
- BDT, USD and configurable currency support

### Proposal / Quotation

- Services, quantity, rate, discount, tax (optional), terms and valid-until date
- Draft, Sent, Accepted, Rejected, Expired status
- Version history
- A4 PDF/print quotation
- Accepted proposal থেকে Project এবং Invoice draft তৈরি

### Projects, Tasks & Milestones

- Project client, service, budget, dates, status and team member
- Status: Planned, Active, Waiting for Client, On Hold, Completed, Cancelled
- Task, checklist, priority, deadline, comment and assignee
- Milestone amount, due date, payment status and delivery status
- Project budget vs actual income, expense and profit
- Optional time tracking for hourly projects

### Deliverables, Revisions & Files

- Brief, client asset, deliverable, revision request and external link
- Image/PDF/document upload with description, uploader and timestamp
- Internal-only or client-shareable file setting
- Revision number, note, deadline and resolution status
- Large design/video files initially stored as Google Drive/OneDrive/Dropbox link

### Invoice, Manual Payment & Due

- Invoice from proposal/project or manual entry
- Invoice items, currency, due date, notes and A4 print/PDF
- Cash, Bank, Online Bank, Mobile Wallet, Other payment types
- Manual transaction reference/ID and optional image/PDF proof
- Full/partial payment, remaining due, credit note and controlled cancellation
- No payment gateway integration in Release 1

### Income, Expense & Reports

- Income by client, service, project and payment account
- Expense category, vendor, payment account, recurring flag and attachment
- Project direct cost and general business expense separately
- Cash/bank/online-bank movement report
- Client due aging, income/expense, P&L, project profitability and service income reports
- CSV/PDF export

## 5. Accounting Design

### Basic Accounting — Default

- Income and expense entry
- Invoice, partial payment and due tracking
- Cash, bank and online-bank balances
- Profit summary and simple category-based reports

### Full Accounting — Optional Toggle

- Chart of Accounts
- Double-entry journal entries
- General Ledger
- Accounts Receivable / Payable
- Trial Balance
- Profit & Loss, Balance Sheet and Cash Flow
- Opening balance, fiscal period, adjustment entry and period lock

### Non-Negotiable Finance Rule

Accounting data will be ledger-based from the first release, even when Basic Accounting is selected. Basic mode only makes the screen simpler; it does not make the data less accurate. A posted payment, invoice or expense will be corrected through a reversal/adjustment—not silent editing or deletion.

## 6. Future Modules

### Retail/POS & Inventory

- Product, category, SKU, barcode, variant and pricing
- POS cart, sale, return, exchange, receipt and manual payment record
- Purchase, supplier, stock movement, low-stock, stock count and transfer
- Barcode label/thermal printer/hardware integration

### Factory/Manufacturing

- Raw materials, warehouse and finished goods
- Bill of Materials (BOM)
- Production order, material consumption, wastage and yield
- Labour/overhead allocation and production costing
- Batch, serial and expiry if needed

### Branches

- Branch-specific users, accounts, documents and reports
- Central owner dashboard
- Future inter-branch inventory transfer and accounting

## 7. Supabase-First Technical Setup

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend & Server | Next.js + TypeScript | Responsive interface and API routes |
| UI | Tailwind CSS | Fast, consistent responsive screens |
| Database | Supabase PostgreSQL | All business and accounting data |
| Authentication | Supabase Auth | Login, password reset and sessions |
| Authorization | Supabase Row Level Security + server checks | Workspace and role-based access |
| Attachments | Supabase Storage | Images, PDFs and small documents |
| Invoice email | Configurable SMTP/API adapter | Branded invoice and reminder delivery after owner credentials are provided |
| Validation | Zod | Safe form/API data validation |
| ORM | Prisma | Schema, migrations and typed queries |
| Source & CI | GitHub + GitHub Actions | Version history and quality checks |
| Deployment | Vercel | Preview and pilot deployment |

### Free-Tier Operating Rules

- Supabase Free is sufficient for the first demo/pilot: database, authentication, storage and API stay in one platform.
- Keep uploaded files small; use external links for large design/video files.
- Export important accounting data regularly and test restore procedures.
- Supabase Free limits or inactivity policies can change; check dashboard usage before launch.
- Vercel Hobby is suitable for development/demo but its terms describe it as personal, non-commercial use. A real commercial production launch needs a hosting plan/provider that permits commercial use.

## 8. Security & Reliability

- Roles: Owner, Manager, Accountant, Staff and Viewer
- Server-side permission check for every sensitive action
- Workspace-level data isolation
- Audit log: user, time, action, changed values and reason
- Private attachment access and safe file-type/size validation
- Password/session security and optional 2FA later
- Posted financial records use reversal/adjustment workflow
- Daily/weekly export and backup checklist
- No secret key, database password or service role key exposed in frontend code

## 9. Development Roadmap

### Phase 0 — Final Requirement & UX (3–5 working days)

1. Finalize services, currencies, invoice language and business identity
2. Confirm full-accounting requirements and default chart of accounts
3. Approve wireframes: Dashboard, Lead, Proposal, Project, Invoice, Accounting
4. Confirm user roles, attachment policy and print layout

**Done when:** screens/workflows are approved and no scope ambiguity remains.

### Phase 1 — Foundation (1 week)

1. Next.js, Supabase, GitHub and Vercel development setup
2. Auth, business workspace, roles, permissions and audit log
3. Sector selector and module-toggle framework
4. Shared navigation, settings and error-handling foundation

**Done when:** authorized user can log in and see the correct sector-based menu.

### Phase 2 — Catalog, Inventory & Print Base (1–2 weeks)

1. Product/service catalog, category, unit, price and stock settings
2. Opening stock, stock movement ledger, adjustment and low-stock rules
3. Product/service labels and A4 label print layout
4. Inventory value and stock movement reports

**Done when:** product stock is accurate, traceable and printable without a POS counter workflow.

### Phase 3 — CRM, Services, Proposals & Projects (1–2 weeks)

1. Leads, clients, notes, tags and attachments
2. Service/package catalog
3. Proposal/quotation workflow and A4 PDF/print
4. Proposal-to-project conversion
5. Project, task, milestone, deadline, deliverable and revision workflow
6. Project budget versus actual income, expense and profit

**Done when:** lead can become a client/project through an accepted proposal.

### Phase 4 — Invoice Studio, Online Invoice & Basic Accounting (2–3 weeks)

1. Product/service/mixed invoices, stock reduction and manual payment/due
2. Invoice template selector, visual brand settings, A4 PDF/print and version history
3. Secure online-client invoice link, view/download log and expiry controls
4. Invoice email templates, preview, test send and delivery log
5. Cash/bank/online-bank accounts, income, expense and linked ledger entries
6. Financial dashboard, due, profit and inventory reports

**Done when:** a professional branded invoice can be printed, downloaded, shared online and emailed after SMTP setup; payment, stock, due and profit reconcile correctly.

### Phase 5 — Full Accounting & Advanced Reports (1–2 weeks)

1. Chart of accounts, journal and opening balance
2. General ledger, trial balance, P&L, balance sheet and cash flow
3. Accounting period lock, adjustment and accountant permissions
4. CSV/PDF export and A4 vouchers

**Done when:** Basic/Full accounting toggle shows correct reports based on same data.

### Phase 6 — Test, Pilot & Handover (1–2 weeks)

1. Permission, financial-total, stock-ledger, online-link, attachment and print tests
2. A4/label printing test with inkjet/laser printer
3. Vercel/Supabase pilot deployment
4. Backup/export test, user guide and pilot feedback fixes

**Done when:** selected real freelancing workflow completes reliably in pilot.

## 10. Release 1 Timeline

| Delivery | Estimated time |
|---|---:|
| Phases 0–4: inventory, professional invoicing and freelancing system with Basic Accounting | 7–10 weeks |
| Phases 5–6: Full Accounting, pilot hardening and handover | 3–5 weeks |
| Total Release 1 | 10–15 weeks |

## 11. Required Review Decisions Before Coding

1. Invoice language: Bangla, English or both?
2. Currency: BDT only, BDT + USD, or more?
3. Core services/packages to create first?
4. One user now, or staff/task assignment needed from day one?
5. Full Accounting reports mandatory at launch?
6. Attachment maximum size and allowed types?
7. Google Drive/OneDrive external links allowed from day one?
8. Client portal needed now or later?
9. Business logo, address, phone and invoice information?
10. Which invoice templates should ship first: Modern Agency, Minimal, Classic Business and/or Detailed Tax?
11. Which invoice fields must be editable or hideable: logo, signature, tax, bank details, payment instructions, footer, notes?
12. For professional email sending, which sender email/domain and SMTP/email-provider account will be used?
13. Pilot will run as development/demo only until commercial hosting decision is made?

## 12. Codex Execution: Model & Mode Guide

Use **Codex Plan mode** before each new phase, then use normal **Build/Default mode** only after the phase is approved. Plan mode creates a reviewable task breakdown before files are changed; build mode implements, tests and repairs that approved scope.

| Work type | Recommended mode | Recommended model / reasoning |
|---|---|---|
| Requirement review, database/accounting design, security decisions | Plan mode | Astra · High, or GPT-6.1 Sol · Extra High |
| A complete approved phase: authentication, accounting logic, Supabase/RLS, integration | Build/Default mode | Astra · Medium/High |
| Normal feature screens and coordinated module work | Build/Default mode | GPT-6.1 Sol · Medium/High |
| Small UI text, form field, styling or documentation edit | Build/Default mode | Luna · Low/Medium |
| Test failure, finance mismatch, security review or complex bug | Plan mode first, then Build/Default | Astra · High/Extra High |

If a listed model is not visible in your Codex model picker, choose the strongest available coding/reasoning model for architecture and finance work, and a faster model only for small isolated edits. Model availability depends on the product plan.

### Exact Working Routine

1. Keep this document as the source of truth.
2. Select **Plan mode** and ask: “Read FINAL_PROJECT_PLAN.md. Plan only Phase N; do not code until I approve.”
3. Review the proposed steps and approve the phase.
4. Select **Build/Default mode** and ask: “Implement only approved Phase N. Run tests, lint, type-check and build. Stop after Phase N.”
5. Review the result, test it, and only then start the next phase.
6. Use Plan mode again for any scope change, data model change, accounting rule, integration or security-sensitive decision.

## 13. Start Condition

Implementation begins only after this document is approved and the decisions in Section 11 are answered. Work starts with Phase 0 and then Phase 1; Retail, Inventory, Factory, Branches and payment gateways remain out of Release 1 unless explicitly added later.
