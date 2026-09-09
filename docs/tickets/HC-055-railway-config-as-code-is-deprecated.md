# HC-055 — railway.json is deprecated and stops working on 1 December 2026

**Status:** Todo · **Phase:** 0 · **Depends on:** HC-007 · **Repo:** holy-corner, plus fountainbridge
and grassmarket · **Branch:** `hc-055-railway-config-as-code-is-deprecated` ·
One ticket = one branch = one PR per repo.

## Why this matters (for John)

Every Bruntsfield service on Railway is configured by a `railway.json` file. Railway has replaced
that mechanism and has given it an end date. After **1 December 2026** those files stop being read.
A deployment configuration that is silently ignored is worse than one that is missing: the service
keeps deploying, on defaults nobody chose, and the first sign of trouble is a health check that no
longer points anywhere or a start command that is not the one in the file.

Three repositories are affected, not one, and the date is the same for all three.

## Context

The Railway CLI (5.49.3) prints this on every command, unprompted:

```
warning: Config as Code (railway.json / railway.toml) is deprecated. Prefer Infrastructure as Code
(.railway/railway.ts). Run `railway config migrate`
Existing files keep working until 2026-12-01.
```

Found while running HC-001, which creates `railway.json` because that is what HC-001 says to create
and what both sibling studios use. That was the right call for HC-001: the file works today, the
sibling repos are consistent with it, and swapping the mechanism was not that ticket's job. It is
this ticket's job.

Affected: `holy-corner/railway.json` (created by HC-001), `fountainbridge/railway.json` (FB-009),
and grassmarket's two services. Railway ships `railway config migrate` to do the conversion.

## Scope

- Run `railway config migrate` in each of the three repositories and read what it produces. Do not
  assume the conversion is faithful; compare the generated `.railway/railway.ts` field by field
  against the `railway.json` it replaces, and record the comparison in each pull request.
- Confirm the settings that matter survive: the builder, the start command, the health check path,
  the restart policy and its retry count, and grassmarket's raised health check timeout, which
  exists because its migrations run at boot and a shorter timeout kills the deploy mid-migration.
- Delete `railway.json` only once a deploy has succeeded from the new file in that repository.
- Companion pull requests in fountainbridge and grassmarket, each its own ticket in its own repo.

## Out of scope

- Any change to what the services actually do, or to the deploy pipeline beyond the file format.
- Adopting anything else in Railway's Infrastructure as Code beyond replacing what exists today.

## Acceptance criteria

- [ ] Each of the three repositories deploys from `.railway/railway.ts` with no `railway.json`
      present, and the deploy is verified as healthy before the old file is removed.
- [ ] A field-by-field comparison of old against new is in each pull request.
- [ ] Done before 1 December 2026.

## Verification

`/review` on each pull request. `/qa` against each deployment after it lands.
