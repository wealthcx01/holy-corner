# Why these files are copies, and why they are not kept in step

Everything under `real/` is a **frozen copy** of a ticket that lives somewhere else. Frozen is the
point, and it is a decision rather than an oversight, so it is written down here.

`parse.test.ts` and `corpus.test.ts` ask one question: **is the parser correct against these header
shapes?** A test that answers that question has to be reading something that does not move. If these
files tracked the live tickets, then editing a ticket's status would change the result of a parser
test, and a red "Parse tickets" job would no longer tell you whether the parser or the ticket was at
fault.

`test/repo-tickets.test.ts` asks the other question, **are the tickets on disk well formed**, and it
reads `docs/tickets/` directly for exactly that reason.

So:

- `real/holy-corner/` are copies of tickets from `docs/tickets/` in this repository. They WILL drift
  from the originals, and that is fine. Do not "refresh" them to match. If you need a new header
  shape covered, copy the file in as it is on that day and leave it alone afterwards.
- `real/grassmarket/` and `real/fountainbridge/` come from the sibling repositories. The parser still
  claims to read grassmarket's bullet-list format and its letter-suffix ids, and a claim with no
  test behind it is a claim that quietly rots.
- `edge/` are hand-written, not copies. They exist to make the parser degrade gracefully rather than
  throw: no heading, no id, an empty file, an unrecognised status.

**The cost of this choice is real:** these are duplicate files, and a reader can mistake one for the
live ticket. The alternative cost was worse, so the trade was made deliberately. Tests that assert
against these copies must not assert on volatile fields such as `**Status:**`, which changes as work
proceeds. Assert the header SHAPE: the id, the title, the phase, the branch, the dependencies.
