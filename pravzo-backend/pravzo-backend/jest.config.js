'use strict';
// ============================================================
// Jest Configuration — Pravzo Backend Test Suite
// ============================================================

// uuid v14 is ESM-only. Jest runs in CJS mode. We point every project
// to a hand-written CJS shim so `require('uuid')` works everywhere.
const UUID_SHIM = '<rootDir>/tests/setup/uuidShim.js';

module.exports = {
  testEnvironment: 'node',

  // Top-level mapper (applies when no project overrides it)
  moduleNameMapper: { '^uuid$': UUID_SHIM },

  globalSetup:    './tests/setup/globalSetup.js',
  globalTeardown: './tests/setup/globalTeardown.js',
  setupFiles:     ['./tests/setup/loadTestEnv.js'],

  projects: [
    // ── Unit tests (fully mocked, unlimited parallelism) ────
    {
      displayName: { name: 'unit', color: 'cyan' },
      testMatch:   ['<rootDir>/tests/unit/**/*.test.js'],
      testEnvironment: 'node',
      setupFiles:  ['<rootDir>/tests/setup/loadTestEnv.js'],
      moduleNameMapper: { '^uuid$': UUID_SHIM }
    },

    // ── Parallel integration tests (live DB, isolated per-file) ─
    {
      displayName: { name: 'integration', color: 'green' },
      testMatch:   ['<rootDir>/tests/integration/**/*.test.js'],
      testEnvironment: 'node',
      setupFiles:  ['<rootDir>/tests/setup/loadTestEnv.js'],
      moduleNameMapper: { '^uuid$': UUID_SHIM },
      maxWorkers: 4
    },

    // ── Serial workflow tests (live DB, ordered, stateful) ──
    {
      displayName: { name: 'workflow', color: 'yellow' },
      testMatch:   ['<rootDir>/tests/workflows/**/*.test.js'],
      testEnvironment: 'node',
      setupFiles:  ['<rootDir>/tests/setup/loadTestEnv.js'],
      moduleNameMapper: { '^uuid$': UUID_SHIM },
      maxWorkers: 1
    },

    // ── Security tests ───────────────────────────────────────
    {
      displayName: { name: 'security', color: 'red' },
      testMatch:   ['<rootDir>/tests/security/**/*.test.js'],
      testEnvironment: 'node',
      setupFiles:  ['<rootDir>/tests/setup/loadTestEnv.js'],
      moduleNameMapper: { '^uuid$': UUID_SHIM },
      maxWorkers: 1
    },

    // ── Regression tests (mocked, forever-green) ─────────────
    {
      displayName: { name: 'regression', color: 'magenta' },
      testMatch: [
        '<rootDir>/tests/regression/**/*.test.js',
        '<rootDir>/tests/regression.test.js'
      ],
      testEnvironment: 'node',
      setupFiles:  ['<rootDir>/tests/setup/loadTestEnv.js'],
      moduleNameMapper: { '^uuid$': UUID_SHIM }
    },

    // ── Smoke tests ──────────────────────────────────────────
    {
      displayName: { name: 'smoke', color: 'blue' },
      testMatch:   ['<rootDir>/tests/smoke/**/*.test.js'],
      testEnvironment: 'node',
      setupFiles:  ['<rootDir>/tests/setup/loadTestEnv.js'],
      moduleNameMapper: { '^uuid$': UUID_SHIM },
      maxWorkers: 2
    }
  ],

  reporters: (() => {
    const base = ['default'];
    try {
      require.resolve('jest-html-reporters');
      base.push(['jest-html-reporters', {
        publicPath:        './tests/reports',
        filename:          'test-report.html',
        openReport:        false,
        includeFailureMsg: true,
        includeConsoleLog: true
      }]);
    } catch { /* not installed */ }
    return base;
  })(),

  testTimeout:        30000,
  slowTestThreshold:  10000,

  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/**',
    '!src/utils/logger.js',
    '!src/utils/structuredLogger.js'
  ],
  coverageDirectory:  'tests/reports/coverage',
  coverageReporters:  ['text', 'lcov', 'html'],

  verbose:            true,
  detectOpenHandles:  true,
  forceExit:          true
};
