# LedgerDesk Money — Chart & UI/UX Specification

> **Status:** Core implementation completed and verified; optional saved widget layouts remain a future enhancement.  
> **Reference date:** 27 October 2026  
> **Scope:** Money dashboard, accounts, transactions, planning and reports. This document records design intent; it does not authorize copying another product's branding or exact interface.

## 1. Product goal

LedgerDesk Money must feel easier and more useful than a standalone expense tracker while remaining part of the wider LedgerDesk business application.

The experience must be:

- clear enough for daily manual entry;
- visually attractive without hiding exact figures;
- flexible for personal, freelance and future business books;
- fast on mobile and productive on desktop;
- consistent with runtime logo, colour and light/dark theme settings;
- free of paid UI, chart or banking dependencies.

## 2. What the reference screenshots teach us

The supplied 15 Wallet screenshots establish these useful patterns:

1. Coloured outline icons make long navigation and category lists scannable.
2. One dashboard card answers one plain-language financial question.
3. Summary gauges and rings lead into deeper statistics.
4. Tabs divide Balance, Outlook, Cash flow, Spending, Credit, Reports and Assets.
5. A persistent period selector lets every report use the same date context.
6. Donut, gauge, progress, bar and line charts are paired with exact numbers.
7. Category rows reuse the category icon and colour, which improves recognition.
8. Cards expose a small number of actions and hide secondary detail until requested.
9. Income is green, expense is red, forecast/current comparison has separate colours.
10. Empty charts still explain what the metric represents.

LedgerDesk will retain these principles, but use an original, more professional business design: cleaner typography, less visual noise, clearer tables, stronger accessibility and better desktop layouts.

## 3. Information architecture

### Desktop

- Persistent left sidebar: Overview, Accounts, Transactions, Planning, Reports and Settings.
- Top bar: active money book, branch/workspace context, global date range, search and quick-add.
- Main content: responsive card grid with summary first and detail below.
- Right-side drawer for quick transaction details where space permits.

### Mobile

- Compact header with money-book switcher and notifications.
- Bottom navigation: Overview, Transactions, Add, Planning, Reports.
- Full navigation and less-used modules in a drawer.
- Sticky, thumb-friendly date/filter control on report screens.
- Quick-add opens a focused bottom sheet instead of a long page.

## 4. Visual system

### Icons

- Use the existing `lucide-react` library only; do not mix unrelated icon families.
- Give accounts and categories a saved semantic colour.
- Place category icons inside subtle tinted circles; navigation icons remain outline icons.
- Selected navigation uses a tinted background, accent icon and clear text—not colour alone.
- Minimum interactive target: 44×44 CSS pixels.
- Every icon-only control requires an accessible label and tooltip on desktop.

### Colour roles

- `positive`: income, healthy cash flow, on-track state.
- `negative`: expense, overdue, exceeded limit.
- `warning`: near-limit, upcoming payment, review needed.
- `forecast`: projected values.
- `comparison`: previous-period values.
- `neutral`: transfer and uncategorised data.

User/admin theme colours may change brand surfaces, but financial status colours must preserve meaning and contrast in both light and dark modes.

### Cards and typography

- Use consistent radius, spacing, border and elevation tokens.
- Each analytical card contains: title, short question/description, period, primary value, visual, legend/detail and optional action.
- Use a professional readable font; do not imitate the handwritten font in the screenshots.
- Numbers use tabular numerals and consistent BDT formatting.

## 5. Dashboard composition

### First viewport

1. Total balance, income, expenses and net cash-flow summary cards.
2. Cash-flow health gauge or compact balance trend.
3. Quick Add: Income, Expense and Transfer.
4. Account balance list with icons and colours.

### Below the fold

1. Income vs expense chart.
2. Spending by category donut.
3. Budget progress and goals.
4. Upcoming recurring payments.
5. Recent transactions.
6. Insight card: largest change, unusual spend or budget risk.

Users may later reorder or hide dashboard widgets. The default layout must remain useful without configuration.

## 6. Chart catalogue

| Component | Purpose | Default interaction |
|---|---|---|
| Category donut | Expense/income distribution | Select a segment to filter the category list and transactions |
| Radial progress | Budget, goal, credit or debt ratio | Centre shows percentage; click opens detail |
| Cash-flow bars | Income and expenses by period | Hover/tap shows exact values; legend toggles a series |
| Balance area/line | Running balance or net-worth trend | Scrub across time; account filters update the series |
| Period comparison line | Current, previous and prior-year period | Switch among cash flow, income and expense |
| Forecast waterfall/bar | Starting balance to expected ending balance | Explain each planned/expected component |
| Horizontal ranked bars | Top categories/accounts/debts | Click a row to drill down |
| Mini sparkline | Compact trend inside summary cards | Decorative summary with accessible text equivalent |
| Exact-value table | Audit-friendly report | Sort, filter, export and open source transactions |

Charts must never be the only source of information. Every chart has a legend or labelled list, exact values and a no-data explanation.

## 7. Report navigation and filtering

Report tabs:

- Overview
- Cash flow
- Spending
- Budgets
- Accounts & assets
- Debt & credit (shown only when enabled)
- Forecast
- Tables

Shared controls:

- 7 days, 30 days, 12 weeks, 6 months, 1 year and custom range;
- account, category, label, transaction type and member filters;
- compare with previous period or same period last year;
- reset filters and display the active filter count;
- export the currently filtered result to CSV/XLSX.

The date range and filters are encoded in the URL so a report can be refreshed, bookmarked and shared internally without losing context.

## 8. Drill-down behaviour

```text
Dashboard summary
  -> report card
    -> selected chart segment / category / account
      -> filtered transaction list
        -> transaction detail or edit
```

- Selecting a chart element highlights it and dims unrelated elements.
- The filtered list must visibly state why it is filtered.
- Back navigation restores prior filters and scroll position where practical.
- Transfer transactions are excluded from income/expense totals but remain visible in account movement reports.
- Clicking an empty state offers the relevant action: add transaction, create category or create budget.

## 9. Planning UX

- Budget cards show spent, remaining, projected total and risk state.
- Goal cards show saved, target, percentage and expected completion where data permits.
- Recurring plans show next due date, expected amount and posting status.
- Forecast explains its calculation; projected values must not look like confirmed transactions.
- Users can switch between visual overview and exact transaction table.

## 10. Flexibility and permissions

- Personal, freelance and future business money books use the same components with module-based visibility.
- Basic mode shows accounts, transactions, simple budgets and essential reports.
- Full mode adds debt/credit, assets, forecasting and deeper accounting reports.
- Widget, tab and quick-action visibility follows enabled modules and user permissions.
- Super Admin controls global branding; workspace roles control only their authorised financial data.

## 11. Accessibility and usability gates

- Meet WCAG AA colour contrast for normal text and controls.
- Never communicate income/expense/status with colour alone; include icon, sign, label or pattern.
- Keyboard navigation and visible focus are required on desktop.
- Tooltips must also work by keyboard and tap.
- Charts provide an accessible summary and table alternative.
- Respect reduced-motion settings.
- Loading uses stable skeletons; no layout jump.
- Destructive actions require clear confirmation and state the affected account/record.

## 12. Technical direction

- Keep Next.js App Router, React, TypeScript and Tailwind/CSS-variable architecture.
- Use semantic design tokens so the Admin theme editor can update the full application safely.
- Prefer reusable chart shells and data adapters rather than page-specific chart code.
- Use a free, open-source React/SVG chart library after compatibility and bundle-size verification; no hosted or paid chart service.
- Load heavy report visualisation code only on pages that need it.
- Compute canonical balances and report aggregates in trusted repository/database logic; the browser only formats and visualises the result.
- Add deterministic tests for transfer exclusion, date boundaries, category totals and period comparison.

Suggested component boundaries:

```text
components/money/
├── dashboard/
├── charts/
│   ├── chart-card
│   ├── chart-legend
│   ├── category-donut
│   ├── radial-progress
│   ├── cash-flow-chart
│   ├── balance-trend
│   └── report-table
├── filters/
├── accounts/
├── transactions/
└── planning/
```

## 13. Delivery phases

Implementation status on 27 October 2026: Phases 1–3 and the Phase 4 responsive/accessibility/export polish are complete. Persisted drag-and-drop widget ordering and named saved-report views remain optional future enhancements; they do not block the core Money experience.

### Phase 1 — Foundation

- Semantic colour/spacing/type tokens.
- Unified icon mapping for modules, accounts and categories.
- Responsive money navigation, chart card and filter primitives.
- Light/dark visual and accessibility baseline.

### Phase 2 — Daily-use experience

- Overview redesign, quick add, account cards and recent transactions.
- Improved transaction list/filter and mobile bottom-sheet entry.
- Budget/goal/recurring summary cards.

### Phase 3 — Reports and charts

- Donut, radial, cash-flow, balance trend and ranked category charts.
- Period comparison, forecast and exact-value tables.
- Chart-to-transaction drill-down and URL-persisted filters.

### Phase 4 — Personalisation and polish

- Reorder/hide optional widgets.
- Saved report views where useful.
- Export from filtered reports.
- Performance, accessibility, responsive and empty-state QA.

## 14. Acceptance criteria

- A user can understand current balance, income, expense and cash flow within the first viewport.
- Income, expense and transfer can be entered from mobile in a short, focused flow.
- Every chart can reveal the transactions behind its number.
- All report totals agree with account and transaction totals for the same filters.
- The UI remains readable at mobile, tablet and desktop widths in light and dark themes.
- Icons, colours and terminology are consistent across navigation, forms, lists and reports.
- Optional advanced modules do not clutter Basic mode.
- No paid subscription or live banking integration is required.

## 15. Approval boundary

Before implementation, confirm the following direction:

- professional LedgerDesk visual identity rather than an exact Wallet clone;
- both light and dark themes;
- mobile-first daily entry plus desktop reporting;
- dashboard widgets configurable after the essential experience is complete;
- all chart/report features remain usable with manually entered data.
