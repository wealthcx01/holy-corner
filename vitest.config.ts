import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Unit tests for the server-side lib and for anything under app/. Node environment: no DOM needed.
// Browser coverage is Playwright, which arrives with the UI gate in HC-006 and is kept out of this
// run deliberately.
export default defineConfig({
  resolve: {
    alias: {
      // `server-only` throws on import outside a server bundle. That is the whole point of it, and
      // it is what makes "this key never reaches the browser" a build error rather than a comment
      // (CLAUDE.md, the AI section: the Anthropic key is server-side only). Under vitest there is
      // no server/client split, so resolve it to the package's own empty entry instead of its
      // throwing default.
      'server-only': fileURLToPath(new URL('./node_modules/server-only/empty.js', import.meta.url)),
      // The `@/` alias tsconfig gives the app. Without it nothing under app/ could be imported
      // here at all, which is half of why fountainbridge's most consequential control went untested.
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    // `app/**` is in this glob FROM DAY ONE, deliberately. Fountainbridge left it out, so a test
    // placed beside its approve server action silently never ran and the denial path had no
    // coverage at all (FB-058). A test that does not run is worse than no test: it reads as
    // reassurance. The ticket tooling under tools/ has its own runner and stays out of this.
    include: ['lib/**/*.test.ts', 'app/**/*.test.ts', 'components/**/*.test.ts'],
    exclude: ['node_modules/**', 'tools/**', 'e2e/**', '.next/**'],
  },
});
