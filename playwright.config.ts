import { defineConfig } from '@playwright/test';

// Sharded CI runs emit a blob report per shard; a follow-up CI job stitches them
// into the final html/json report via `playwright merge-reports`.
const useBlobReporter = !!process.env.PW_BLOB_REPORT;

const reporter: any[] = useBlobReporter
  ? [['list'], ['blob']]
  : [['list'], ['html'], ['json', { outputFile: 'playwright-report/results.json' }]];

if (process.env.CI) {
  reporter.push(['github']);
}

export default defineConfig({
  // On CI, schedule at file granularity so all tests of a spec file stay on one
  // worker. Fixtures cache the Electron app per (file, worker) — with tests of
  // the same file spread across workers, each worker pays its own app launch
  // (~6s). File-level scheduling cuts those duplicate launches; locally we keep
  // test-level parallelism for fast single-file iteration.
  fullyParallel: !process.env.CI,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.PW_WORKERS ? Number(process.env.PW_WORKERS) : undefined,
  reporter,

  use: {
    trace: process.env.CI ? 'on-first-retry' : 'on'
  },

  projects: [
    {
      name: 'default',
      testDir: './tests',
      testIgnore: [
        'ssl/**', // custom CA certificate tests require separate server setup and certificate generation
        'auth/**', // auth tests have their own project
        'benchmarks/**',
        'proxy/system-pac/**' // shares ports with proxy/pac — runs in its own project after default
      ]
    },
    {
      name: 'auth',
      testDir: './tests/auth'
    },
    {
      name: 'ssl',
      testDir: './tests/ssl'
    },
    {
      // system-pac and pac specs share the same PAC/proxy/target ports.
      name: 'system-pac',
      testDir: './tests/proxy/system-pac',
    }
  ],

  webServer: [
    {
      command: 'npm run dev:web',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 10 * 60 * 1000
    },
    {
      command: 'npm start --workspace=packages/bruno-tests',
      url: 'http://localhost:8081/ping',
      reuseExistingServer: !process.env.CI,
      timeout: 10 * 60 * 1000
    }
  ]
});
