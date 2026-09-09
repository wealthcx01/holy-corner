# HC-044 — Alerts: overdue, expiring, closing windows, milestones

**Status:** Todo · **Phase:** 3 · **Depends on:** HC-016, HC-017, HC-042 · **Repo:** holy-corner ·
**Branch:** `hc-044-alerts` · One ticket = one branch = one PR.

## Why this matters (for John)

INV-001 and INV-002 went overdue on 3 September and nothing said so. A commission window closes,
a renewal notice period starts, a long-stop approaches, a milestone review is due — each is a date
the record already knows. This ticket turns dated facts into items in Needs you and, where a person
approves, into a reminder sent to the counterparty.

## Context

- PRD §2.4: overdue alerts and ageing reports. Elite Vault's "What's next" list had a notification
  system as its first unbuilt item.
- Dated facts: invoice `due_on` (HC-014), commission `window_end` and renewal notice dates
  (HC-017), contract `expires_on` and run-off (HC-012), the Reset quarterly go/no-go and monthly
  budget review (HC-012's rhythm terms), Notified Prospect attribution windows, unallocated expenses
  older than a month (HC-020), a proposal waiting more than seven days (HC-042).
- A reminder to a counterparty is an external action: proposed, approved, sent through HC-019's
  path, recorded.

## Scope

- `lib/alerts/rules.ts`: pure rules `(record, now) → Alert | null` with lead times per kind (invoice:
  on due date, +7, +30; window: −90, −30; renewal notice: −120; long-stop: −180; milestone review:
  −7), tested at each boundary.
- A daily job that evaluates the rules, writes `alerts` rows (deduplicated by subject and kind), and
  surfaces open alerts in Needs you (HC-033) with the plain-language card.
- Reminder templates per kind (`content/reminders/*.md`) rendered with the record's facts; "send a
  reminder" from the alert card creates the proposal.
- An **Ageing** view under Money: 0–30, 31–60, 61–90, 90+ per currency, from HC-014's query.

## Out of scope

- Chasing consultants (grassmarket's job). Anything sent without approval.

## Acceptance criteria

- [ ] With `E2E_NOW` set to 9 September 2026 both real invoices raise "overdue 7 days" alerts on the
      first run and not again on the second.
- [ ] A fixture deal with `window_end` 30 November raises the −90 alert on 2 September and the −30
      on 1 November.
- [ ] Sending a reminder from the card creates a proposal; approving it sends and records; the
      alert shows "reminder sent on <date>".
- [ ] The Ageing view never sums across currencies; at both sizes.

## Verification

`/review` + `/qa`. Rule tests at every boundary listed.
