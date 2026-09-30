# HC-059 — The migrate script needs a runtime the deploy does not have

**Branch:** `hc-059-the-migrate-script-needs-a-runtime-the-deploy-does-not-have`
**Status:** Todo
**Blocks:** HC-007 (deploy). Found incidentally during HC-006.

## What is wrong

`railway.json` starts the app with:

```
npm run db:migrate && npm run start
```

and `package.json` defines:

```
"db:migrate": "bun scripts/migrate.mjs"
```

**Bun is not part of this stack.** CLAUDE.md names npm and Node 22, the Railway builder installs
Node, and nothing else in the repository uses bun. On a Railway deploy the start command fails at
the first word — `bun: not found` — the `&&` short-circuits, and the server never starts. The
deploy does not come up with a stale schema; it does not come up at all.

`bun` is there for a real reason, and that reason is the actual bug:

```js
import { migrate } from '../lib/db/migrate.ts';
```

`scripts/migrate.mjs` is JavaScript importing a **TypeScript** file. Node cannot load that. Bun
can, so bun is what got it working locally. The shebang on line 1 still says
`#!/usr/bin/env node`, which is the giveaway: the file was written for Node and quietly changed
runtimes to get past an import error.

Nothing caught it because nothing runs it. There is no deploy yet (HC-007 builds it), the UI gate
runs with `DATABASE_URL` unset on purpose, and the unit tests call `migrate()` directly through
PGLite rather than through this script.

## The fix

Pick one, and prefer the first:

1. **Node 22 can run TypeScript directly** with `node --experimental-strip-types`, which is
   stable enough for a script that runs once at boot. Change the script to
   `node --experimental-strip-types scripts/migrate.mjs` and keep the import.
2. **Compile it** — have the build emit the migration runner and point the script at the output.
   More moving parts, and the start command then depends on build output being present.
3. **Move the migration list into the `.mjs`** so it imports nothing TypeScript. Duplicates the
   list that `lib/db/migrate.ts` already owns, so only worth it if the other two fail.

Whichever is chosen, the start command has to be **proved on Railway**, not reasoned about. That
is the point of the acceptance criteria below.

## Scope

- Remove `bun` from `package.json`.
- Make `npm run db:migrate` work under plain Node 22, against a real `DATABASE_URL`.
- Make the shebang and the script's own documentation agree with what actually runs it.
- Add the check that would have caught this: the deploy smoke test in HC-007 must run the real
  `startCommand`, not just `npm run start`.

## Acceptance criteria

- [ ] `npm run db:migrate` applies pending migrations on a machine with Node 22 and no bun
      installed, and says what it applied.
- [ ] The exact string in `railway.json`'s `startCommand` runs end to end on that machine and
      leaves a serving app.
- [ ] Running it a second time reports "already up to date, nothing to apply" and exits 0, so a
      restart is not a failure.
- [ ] `grep -r bun package.json railway.json` returns nothing.
