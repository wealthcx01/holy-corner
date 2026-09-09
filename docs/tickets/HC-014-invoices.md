# HC-014 — Invoices: the model, a real numbering sequence, the lifecycle, the two Wise invoices

**Status:** Todo · **Phase:** 1 · **Depends on:** HC-012 · **Repo:** holy-corner ·
**Branch:** `hc-014-invoices` · One ticket = one branch = one PR.

## Why this matters (for John)

INV-001 and INV-002 went out on 3 August, were due on 2 September, and as of 9 September the only
place that knows whether they were paid is Wise. Holy Corner should know what has been invoiced,
against which contract term, what is due, what is overdue, and what number the next invoice gets.
Elite Vault's `invoices` table was never written to; this is the first system in the group that
actually holds an invoice.

## Context

- `Invoice`, `Payment` from HC-005. `docs/commercial-record.md` has both invoices in full.
- Wise is the issuer today: it numbers, renders and hosts the PDF, and shows payment status. Holy
  Corner registers what Wise issued (number, external reference, PDF) and later (HC-019) can render
  its own. The numbering sequence must match Wise's so the next one is INV-003 wherever it is made.
- Elite Vault's quote number was `Math.random()`-based (collision-prone). Use a Postgres sequence
  per series (`INV`), allocated in the same transaction as the insert.
- Lifecycle: draft → issued → sent → part_paid → paid; overdue is derived from `due_on` and status,
  not stored; written_off and void are terminal, admin-only, audited.
- grassmarket `PaymentStatus` is forward-only (`_PAYMENT_ORDER`, no skips, no reversals). Same rule.

## Scope

- Migrations: `invoices`, `invoice_lines` (description, quantity, unit Money, tax Money, term_id?),
  `invoice_series` (prefix, next_number), `invoice_documents`, `invoice_events`.
- Repository: `createInvoice` (allocates the number in-transaction), `issueInvoice`, `markSent`,
  `recordPayment` (HC-015 calls this; here the manual path), `voidInvoice`, `writeOff`,
  `listInvoices({status, organisation, overdue})`, `agedReceivables()` (0–30, 31–60, 61–90, 90+
  by currency, never summed across currencies).
- Screens under **Money → Invoices**: the list with status and days overdue, the invoice page
  (lines, contract term it draws on, documents, events, payments), "Register an invoice issued in
  Wise" (number, dates, lines, upload the PDF), "Record a payment by hand" (date, amount, reference)
  behind an approval prompt naming who recorded it.
- The two real invoices registered by John through the screen, PDFs uploaded, and their status set
  from Wise by hand for now.
- An "Owed to us" panel on the Money home: open invoices by currency, overdue count, oldest.

## Out of scope

- Reading Wise (HC-015). Rendering an invoice PDF (HC-019). Sending anything (HC-042's gate, then
  HC-019). Credit notes (a follow-up when one is needed).

## Acceptance criteria

- [ ] INV-001 and INV-002 render with billed-to organisation, issue and due dates, one line each,
      USD 5,000, linked to their schedule's CommitmentPayment term; the next number allocated is
      INV-003 and a concurrent test allocating twice never duplicates.
- [ ] On 9 September both show "overdue by 7 days" derived, not stored; marking one paid clears it.
- [ ] A status cannot go backwards; a `staff` principal cannot record a payment (404 on the route).
- [ ] The aged-receivables query never adds USD to GBP (a test with one of each).
- [ ] Invoice list, page and register form at both sizes.

## Verification

`/review` + `/qa`. Production screenshots after John registers the two invoices.
