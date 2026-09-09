# HC-056 — Take the negotiated terms out of the public repositories

**Status:** Todo · **Phase:** 0 · **Depends on:** HC-012 · **Repo:** holy-corner, plus grassmarket ·
**Branch:** `hc-056-take-the-negotiated-terms-out-of-the-public-repositories` ·
One ticket = one branch = one PR per repo.

## Why this matters (for John)

Both MSAs give Bruntsfield a Most-Favoured-Nation clause on commission terms. A clause like that
exists because what a partner pays is not meant to be common knowledge. Right now the rates are
readable by anyone with a browser, in two repositories, and a competitor or a future counterparty
can quote them back across a negotiating table.

This is not only about the repository that went public today. Some of it has been public for
longer, and that is the part worth reading twice.

## Context

**What is exposed here, verified rather than assumed.** `wealthcx01/holy-corner` became public on
9 September 2026. An anonymous fetch of the raw `docs/commercial-record.md` returns HTTP 200. That
file carries OpenBB's 30 % and 20 % rates, Brandfetch's 15 / 10 and 7.5 / 7.5 rates, both USD 5,000
commitment payments and which of them is creditable, Ross Cochrane's 50 / 40 / 10 equity split with
its 48-month vesting and 12-month cliff, the GBP 5,000 per month spin-out milestone, Bruntsfield's
Hong Kong registration number and registered address, and a named individual's email address.
Eleven files in this repository carry some of those numbers.

**Some of it was already public, in the other repository.** `wealthcx01/grassmarket` has been a
public repository throughout, and
`packages/bcap_contracts/src/bcap_contracts/registry_data/commissions.yaml` is tracked in it. An
anonymous fetch returns HTTP 200. It holds `openbb: yr1_bps 1500, yr2_bps 1000` and Brandfetch's
750 / 500 and 375 / 375. Those are the CONSULTANT's share. This repository's own HC-017 records that
the consultant's share is half of what the partner pays Bruntsfield, so 15 % consultant implies
30 % partner. **The OpenBB rate was derivable from a public repository before today.** Whatever is
decided here has to cover grassmarket, or it fixes half a problem.

**Deleting a file does not delete its history.** Removing the values from the current files stops
them being the first thing a reader sees, and nothing more. The full text stays in the git history
of a public repository and `git log -p` reads it. The only way to remove it is to rewrite history
and ask GitHub Support to purge the cached objects, and even then any copy already cloned is gone
for good. One point in our favour: `docs/commercial-record.md` has been touched by exactly one
commit here, so a rewrite would be unusually contained. It would still rewrite the root commit that
every branch descends from, and force pushes to `main` are now blocked by design.

**What is actually confidential is the numbers, not the relationships.** That OpenBB, Brandfetch and
The Reset are counterparties is ordinary commercial fact and appears across the ticket set for good
reason. The rates, the amounts, the equity split and the registration details are the part under an
MFN clause. Separating those two is the whole job.

## Scope

- **Decide the line, and write it into `CLAUDE.md`.** Non-negotiable 9 currently forbids secrets and
  names bank details. Extend it: a counterparty's negotiated commercial terms are handled like a
  credential, and a public repository holds the SHAPE of the record, never its values.
- **`docs/commercial-record.md` keeps every field and loses every value.** It exists so the data
  model can be checked against reality, and that job needs the shape: a contract has a commission
  rate per engagement type with a year-one rate, a year-two rate and a window in months. It does not
  need the numbers to be in git. Each value becomes a placeholder with a pointer to the private
  source in OneDrive, which is already named as the source of truth for documents.
- **The eight ticket files that embed numbers** (HC-008, HC-012, HC-013, HC-014, HC-016, HC-017, and
  the two parser fixtures that copy them) state the shape and cite the private record instead. Their
  acceptance criteria stay testable, because the operator script (HC-008) already takes real values
  typed by hand at run time and the tests use fixtures.
- **grassmarket companion ticket:** move the values in `commissions.yaml` behind configuration the
  way secrets already are, leaving the file's structure and its product keys in git. Its loader,
  its schema and its tests keep working on the shape.
- **Decide on the history, explicitly, and record the decision.** Either accept that the terms are
  public from 9 September 2026 onward and say so, or rewrite and purge. This is John's call and it
  should be an ADR, not a line in a pull request, because the reasoning will be asked for later.

## Out of scope

- Making either repository private again. That is a separate decision with its own cost: on this
  account's plan a private repository cannot have branch protection, which HC-001 has just put in
  place and which HC-054 was filed to get.
- Removing the counterparty names. A partnership existing is not the confidential part.
- Renegotiating or re-papering anything. This ticket changes where facts are stored, not what they
  say.

## Acceptance criteria

- [ ] An anonymous fetch of every file in both public repositories returns no commission rate, no
      commitment amount, no equity split, no vesting term and no registration number. Checked by a
      script in CI, not by eye, so it cannot come back.
- [ ] `docs/commercial-record.md` still lets a reader check the data model against reality: every
      field the system must represent is named, with its type and its shape.
- [ ] The HC-012 and HC-017 acceptance criteria still pass, using values supplied at run time.
- [ ] grassmarket's commission loader and its tests pass with the values out of the file.
- [ ] An ADR records the decision about the existing history, with its reasoning.
- [ ] `CLAUDE.md` non-negotiable 9 names commercial terms alongside credentials.

## Verification

`/review` on both pull requests, with the security specialist on. The CI check that greps for the
values is the real verification, because it is the only one that keeps working after everyone has
forgotten this ticket.
