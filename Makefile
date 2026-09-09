# holy-corner - lane tasks.
#
# parse-tickets:    check that docs/tickets/*.md parse into the Ticket contract. The parser lives
#                   in tools/ticket-parser/, isolated from the app (which arrives in HC-002), so it
#                   needs no root package.json.
#
# ticket-drift:     fail when a ticket file says work is still in progress that git says already
#                   shipped (fountainbridge FB-070). Eight fountainbridge tickets were lying on
#                   2026-07-31 and the only reason anyone noticed was that someone happened to
#                   check; the first run of this check there found eighteen.
#
# design-lint:      tokens only, one status vocabulary, no dead controls. A no-op until HC-002
#                   brings the app and app/globals.css.
#
# copy-lint:        the plain-English rules a machine can check (docs/STYLE-VOICE.md). A no-op
#                   until HC-009 writes them.
#
# contracts-parity: regenerate TypeScript from the vendored bcap-contracts schemas and fail if it
#                   differs from what is committed. A no-op until HC-005 vendors the schemas.
#                   It regenerates and diffs, which is exactly what HC-005 specifies, rather than
#                   inventing a --check flag that HC-005 never mentions and whoever writes the
#                   script would have to discover by reading this file.
#
# The three no-op targets exist now, and are wired to their CI jobs now, so that the job names in
# .github/workflows/ci.yml never have to change. A renamed required check is a check that silently
# stops being required.

.PHONY: parse-tickets ticket-drift design-lint copy-lint contracts-parity

parse-tickets:
	cd tools/ticket-parser && npm ci && npm run typecheck && npm test

ticket-drift:
	bun scripts/ticket-drift.mjs

design-lint:
	@if [ -f scripts/design-lint.mjs ]; then \
		node scripts/design-lint.mjs; \
	else \
		echo "design-lint: no app yet - this becomes real in HC-002."; \
	fi

copy-lint:
	@if [ -f scripts/copy-lint.mjs ]; then \
		node scripts/copy-lint.mjs; \
	else \
		echo "copy-lint: no rules yet - this becomes real in HC-009."; \
	fi

contracts-parity:
	@if [ -f scripts/generate-types.mjs ]; then \
		node scripts/generate-types.mjs && git diff --exit-code -- lib/contracts/; \
	else \
		echo "contracts-parity: no vendored schemas yet - this becomes real in HC-005."; \
	fi
