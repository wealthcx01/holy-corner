import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { SHOTS } from './helpers';

/**
 * Start each run with an empty manifest.
 *
 * `e2e/helpers.ts` APPENDS a reading per screenshot, which is right during a run and wrong between
 * them. Without this, a reading survives the run that produced it.
 *
 * It was found by comparing a CI artefact against a local one. Proving the ceiling worked meant
 * deliberately making `/` tall, and that run left `04-group-admin.png 1440 5215` in the file. The
 * gallery reads the manifest into a map keyed by filename, so the later honest reading overwrote
 * the tall one and the page looked correct — which is the part that matters. A stale reading that
 * DOES show is a wrong number somebody might write into `docs/design-conformance.md`; a stale
 * reading that does not show is a wrong number waiting for the day a screenshot is renamed or
 * removed and nothing overwrites it any more.
 *
 * The screenshots themselves are left alone. Playwright overwrites each by name, and keeping the
 * previous run's pictures is useful while a screen is being worked on.
 */
export default function globalSetup(): void {
  rmSync(join(SHOTS, 'readings.jsonl'), { force: true });
}
