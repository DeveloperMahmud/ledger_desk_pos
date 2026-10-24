# Sector-Based Business Management App — Revised Project Plan

## 1. Final Direction

প্রথম release-এর মূল কাজ হবে **Freelancing / Digital Service Business Management**। এটি সাধারণ POS দিয়ে শুরু হবে না। একই application-এর ভিতরে future-এ Retail, Factory/Manufacturing এবং অন্য service sector চালু করা যাবে।

বর্তমান scope:

- প্রধান sector: Freelancing / Digital Services
- এখন branch নেই; ভবিষ্যতে সর্বোচ্চ 5–6টি branch যোগ করা যাবে
- এখন payment gateway লাগবে না
- Cash, bank, online bank বা অন্য payment method manual entry হিসেবে record হবে
- Image, PDF এবং document attachment রাখা যাবে
- Full Accounting অথবা Basic Accounting—business/sector অনুযায়ী on/off করা যাবে
- Label, inkjet ও laser printer-এর জন্য export/print layout থাকবে
- Thermal printer, barcode scanner, cash drawer এবং retail POS future module
- GitHub + Vercel দিয়ে শুরু করা হবে; free hosting-এর সীমাবদ্ধতা আলাদা section-এ আছে

## 2. Product Idea: One Core, Multiple Sectors

App-এর common core সবার জন্য একই থাকবে; কিন্তু business type select করলে menu, form এবং dashboard আলাদা হবে।

```
Business Workspace
├── Common Core
│   ├── Users & Permissions
│   ├── Contacts
│   ├── Files & Attachments
│   ├── Income / Expense
│   ├── Basic or Full Accounting
│   ├── Reports
│   └── Settings & Audit Log
│
├── Freelancing / Digital Service (Release 1 — active)
│   ├── Clients, Leads & Proposals
│   ├── Services & Packages
│   ├── Projects, Tasks & Milestones
│   ├── Deliverables, Revisions & Files
│   └── Invoice, Payments & Profit
│
├── Retail POS (future — disabled until selected)
│   ├── Products, Sales & Receipt
│   ├── Inventory & Purchase
│   └── Barcode / Printer / Cash Drawer
│
└── Factory / Manufacturing (future — disabled until selected)
    ├── Raw Materials & Warehouse
    ├── Bill of Materials (BOM)
    ├── Production Orders
    └── Finished Goods & Costing
```

## 3. How Sector Selection Will Work

### 3.1 Business Profile

Business create করার সময় owner select করবেন:

- Freelancing / Digital Service
- Retail / Shop
- Manufacturing / Factory
- General Service Business

একটি workspace-এ এক বা একাধিক sector চালু করা যাবে। তবে প্রথম setup-এ Freelancing module default থাকবে।

### 3.2 Module Controls

Settings থেকে owner feature on/off করতে পারবেন:

- Full Accounting: On / Off
- Basic Accounting: always available
- Retail POS: future enable
- Inventory: future enable
- Manufacturing: future enable
- Multi-branch: future enable
- Client portal: future enable

Off থাকা module-এর data delete হবে না; শুধু menu ও workflow লুকানো থাকবে। পুনরায় on করলে আগের data আবার দেখা যাবে।

### 3.3 Important Design Rule

Accounting engine শুরু থেকেই ledger-based হবে। Basic Accounting চালু থাকলে user শুধু income, expense, due, cash ও bank-এর সহজ screen দেখবেন। Full Accounting চালু করলে একই data থেকে chart of accounts, journal, trial balance, balance sheet এবং profit & loss দেখা যাবে।

এতে পরে full accounting on করলে পুরোনো হিসাব নতুন করে হাতে বসাতে হবে না।

## 4. Release 1: Freelancing / Digital Service Module

### 4.1 Dashboard

- এই মাসের income, expense, profit, due এবং bank/cash balance
- Active project, pending milestone ও overdue payment
- Upcoming deadline ও pending client feedback
- Service-wise income ও top client
- Quick action: new lead, proposal, project, invoice, expense, payment

### 4.2 Client & Lead CRM

- Lead name, source, contact, company, country ও notes
- Lead status: New, Contacted, Proposal Sent, Negotiation, Won, Lost
- Client profile, address, tax ID if needed, communication notes
- Client-wise project, invoice, payment, due এবং attachments
- Tag: Upwork, Fiverr, Referral, Facebook, Direct Client ইত্যাদি
- Reminder for follow-up and due date

### 4.3 Service Catalog & Packages

- Service category: web design, development, SEO, graphics, video, marketing, consulting ইত্যাদি
- Service/package name, description, standard price, delivery time
- Package tiers: Basic, Standard, Premium
- Optional add-ons and discount
- Currency support: BDT, USD এবং configurable currency
- Service cost estimate for profitability

### 4.4 Proposal / Quotation

- Lead বা client থেকে proposal তৈরি
- Multiple services, quantity, rate, discount, tax (optional), terms, validity date
- PDF print/download and email-ready share link later
- Proposal status: Draft, Sent, Accepted, Rejected, Expired
- Accepted proposal থেকে এক-click project ও invoice draft
- Proposal version history

### 4.5 Project, Task & Milestone Management

- Project title, client, service, budget, start/end date, status
- Status: Planned, Active, Waiting for Client, On Hold, Completed, Cancelled
- Milestone with amount, deadline, status and payment status
- Task, assignee, priority, due date, checklist and comments
- Time tracking optional; hourly project-এর জন্য hourly rate
- Project board/list/calendar view
- Project-level income, expense, profit and outstanding due

### 4.6 Deliverable, Revision & Files

- Client-provided brief, image, PDF, zip/link attachment
- Deliverable link/file, submission date and revision count
- Revision request note, due date and resolution status
- Attachment type: image, PDF, document, external cloud link
- File permission: internal-only or client-shareable
- Initial version: upload small files and store large files as external links

### 4.7 Invoice, Manual Payment & Due

- Invoice from proposal, project or manual entry
- Invoice number, client, items/services, currency, due date and notes
- Payment method manual list: Cash, Bank, Online Bank, Mobile Wallet, Other
- Manual payment reference, transaction ID, payment date and attachment
- Full/partial payment and automatic remaining due
- Credit note, invoice cancellation and payment reversal with audit log
- Printable A4 invoice; future 80mm thermal receipt mode
- Payment gateway integration is explicitly out of scope for Release 1

### 4.8 Income, Expense & Profit

- Income by client, service, project and payment method
- Expense with category, date, vendor, amount, payment account and attachment
- Recurring expense: internet, salary, software, office rent etc.
- Project direct cost and general business expense separate
- Gross profit and net profit summary
- Cash/bank/online-bank balance view

### 4.9 Reports

- Income and expense report
- Profit & loss summary
- Client-wise due and aging report
- Invoice/payment report
- Project budget vs actual income/expense/profit
- Service-wise income and profitability
- Lead-to-client conversion report
- Cash, bank and online-bank movement report
- Tax/VAT summary only if enabled
- PDF/CSV export

## 5. Accounting Modes

### 5.1 Basic Accounting (default)

Suitable for freelancing and small service business.

- Income entry
- Expense entry
- Invoice and due tracking
- Cash/bank/online-bank balances
- Profit summary
- Simple category-based reports

### 5.2 Full Accounting (optional toggle)

Suitable when professional accounting is needed.

- Chart of Accounts
- Double-entry journal entries
- General ledger
- Accounts receivable and accounts payable
- Trial balance
- Profit & Loss statement
- Balance Sheet
- Cash Flow statement
- Fiscal year, opening balance, period close and adjustment entries
- Accountant-only approval and locked period controls

### 5.3 Accounting Safety Rules

- Each invoice, payment, expense and reversal will create linked ledger entries.
- Posted records cannot be silently edited; correction uses adjustment/reversal.
- Basic mode hides complex accounting screens but does not compromise ledger accuracy.
- Full accounting can be enabled later without migration of old operational data.

## 6. Future Modules

### 6.1 Retail / POS (future)

- Product, category, SKU, barcode and variants
- Sales cart, manual cash/bank/online-bank payment record
- Return, exchange, discount and receipt
- Purchase, supplier, inventory, low-stock and stock count
- Label printing and barcode labels
- Thermal printer, scanner, cash drawer, mobile POS later

### 6.2 Factory / Manufacturing (future)

- Raw material and finished goods inventory
- Warehouse and future branch location
- Bill of Materials (BOM)
- Production order and production stage/status
- Material consumption, wastage and yield
- Labour/overhead cost allocation
- Batch/serial/expiry if required
- Production cost and finished-goods valuation

### 6.3 Branches (future, maximum 5–6)

- Branch-specific users, cash/bank accounts, documents and reports
- Central owner dashboard
- Stock transfer and inter-branch accounting only when retail/factory is enabled
- Branch-level permissions and audit log

## 7. Documents, Attachments & Printing

### Attachments

- Image: JPG, PNG, WebP
- Documents: PDF and common office files where safe
- File size/type validation and virus-scan-ready design
- Attach to lead, client, proposal, project, milestone, invoice, payment or expense
- Description, uploader and timestamp on every file
- Large design/video files should initially be external links (Google Drive, OneDrive, Dropbox etc.)

### Print Layouts

- A4 invoice/quotation for inkjet or laser printer
- A4 payment receipt and expense voucher
- Product/asset label template, printable on normal label sheets
- Browser print preview, PDF export and configurable logo/header/footer
- Future: 80mm thermal receipt, barcode label printer, customer display

## 8. Technology & Free-First Deployment Plan

### Application Stack

- Next.js + TypeScript: web interface and server APIs in one project
- PostgreSQL: durable financial and operational data
- Prisma ORM: database schema and safe migrations
- Tailwind CSS: responsive interface
- Zod: input validation
- Auth.js or equivalent secure credentials authentication
- Object storage adapter: attachments can move providers without application rewrite

### Development & Source Control

- GitHub repository for source code and version history
- GitHub Actions for lint, type-check, tests and build check
- Vercel preview deployment for every GitHub push

### Free-First Setup for Development / Pilot

- Vercel: frontend/server deployment
- Supabase Free: PostgreSQL database and small attachment storage
- GitHub: code repository and CI
- External drive links for large client documents

### Critical Hosting Note

This setup is appropriate for development, demo and a small pilot, but must not be treated as guaranteed business-production hosting.

- Vercel Hobby is described by Vercel as for personal/non-commercial use; a real commercial business deployment needs a plan/provider that permits it.
- Vercel Hobby can pause a project after free-tier usage is exhausted.
- Supabase Free currently has a 500 MB database, 1 GB storage, two active projects, and pauses a project after one week of inactivity.
- Therefore automated backups, local export and a later production-hosting decision are mandatory before relying on the system for important financial records.

No paid subscription is included in Release 1. If usage grows or the system becomes commercially critical, the owner must select a paid commercial host or a properly maintained self-hosted server before launch at scale.

## 9. Security & Data Rules

- User roles: Owner, Manager, Accountant, Staff, Viewer
- Every important action is recorded in audit log: user, time, old/new values and reason
- Permission checked by server, not only hidden in interface
- Secure password storage, session expiry and optional 2FA later
- Workspace/business data isolation for future multi-business support
- Finance records use reversal/adjustment; no uncontrolled hard delete
- File upload size/type validation and private signed access
- Daily export/backup procedure from first pilot
- Owner-only controls for accounting mode, opening balance and closing periods

## 10. Development Steps

### Phase A — Final Requirement & UX Design (3–5 days)

1. Confirm freelancing workflow, services, currencies and invoice format
2. Confirm basic/full accounting default and chart of accounts template
3. Approve dashboard, menu and form wireframes
4. Confirm attachment types and maximum file size
5. Finalize user roles and approval rules

Deliverable: accepted scope, wireframes and database blueprint.

### Phase B — Foundation (1 week)

1. Create Next.js project, database schema and GitHub workflow
2. Login, business workspace, users, roles and settings
3. Sector selection and module toggle framework
4. Audit log, validation and error handling foundation

Deliverable: secure shell application with sector-aware menu.

### Phase C — CRM, Services & Proposals (1–2 weeks)

1. Leads, clients, tags and notes
2. Service catalog and packages
3. Proposal/quotation creation, PDF print and status flow
4. Proposal-to-project conversion

Deliverable: lead to accepted proposal workflow.

### Phase D — Projects, Milestones & Files (1–2 weeks)

1. Project, task, milestone and deadline management
2. Deliverables, revisions, comments and attachments
3. Project budget/profit view
4. Reminder-ready notification architecture

Deliverable: full digital-service project workflow.

### Phase E — Invoice, Payments & Basic Accounting (1–2 weeks)

1. Invoice, manual payment, partial payment and due
2. Cash/bank/online-bank accounts
3. Income, expense, recurring expense and attachments
4. Profit, due and cash/bank reports
5. Ledger entries behind basic screens

Deliverable: financially usable freelancing management system.

### Phase F — Full Accounting Toggle & Reports (1–2 weeks)

1. Chart of accounts, journals and opening balances
2. Trial balance, general ledger, P&L, balance sheet and cash flow
3. Period lock and accounting permissions
4. PDF/CSV export and print templates

Deliverable: optional professional accounting mode.

### Phase G — Quality, Vercel Pilot & Handover (1–2 weeks)

1. Test business rules, permissions, attachment access and financial totals
2. Test A4 print/PDF layout with inkjet/laser printer
3. GitHub + Vercel + database pilot setup
4. Backup/export test and basic user guide
5. Pilot feedback fixes

Deliverable: pilot-ready web app for freelancing work.

### Phase H — Future Sector Modules

Retail/POS, inventory, factory/production, branches, thermal printer, barcode, payment gateway and AI recommendations will be added after Release 1 is stable and actual workflow is validated.

## 11. Estimated Timeline

| Release | Scope | Estimated time |
|---|---|---:|
| Release 1A | Freelancing CRM, proposal, project, invoice, manual payment, basic accounting | 6–9 weeks |
| Release 1B | Full accounting, reports, attachments, export/print, pilot hardening | 3–5 weeks |
| Total Release 1 | Complete freelancing/digital-service system | 9–14 weeks |
| Future | Retail/POS, inventory, factory and branch modules | scoped after Release 1 |

Timeline assumes regular requirement feedback and no payment-gateway integration in Release 1.

## 12. Release 1 Acceptance Checklist

- Lead → proposal → project → milestone → invoice → manual payment flow works
- Partial payment and due are always correct
- Income, expense, project profit, cash and bank balance reconcile
- Basic mode hides full-accounting complexity but preserves correct ledger entries
- Full Accounting toggle reveals correct reports from existing data
- Image/PDF attachment is permission-protected and linked to the correct record
- A4 quotation, invoice and voucher print properly on inkjet/laser printer
- Owner can turn sector modules on/off without deleting data
- Unauthorized staff cannot alter posted payment/accounting data
- Backup/export can be created and restored in a test environment

## 13. Decisions Needed Before Build Starts

1. Main freelancer services: which categories/packages are needed first?
2. Invoice language: Bangla, English or both?
3. Main currencies: BDT only, BDT + USD, or more?
4. Will one person use it first, or are staff/assignees needed in Release 1?
5. Which full-accounting reports are mandatory from day one?
6. Maximum attachment size and which file types are necessary?
7. Should external Google Drive/OneDrive links be allowed from the first release?
8. Is a client portal needed now, or later?
9. What business name/logo/address/phone must appear on invoices?
10. Is a custom domain available, or will Vercel preview domain be used during pilot?

## 14. Start Condition

No application implementation begins until this revised plan is approved and the decisions in Section 13 are answered. After approval, work begins with Phase A and the Release 1 freelancing module only.
