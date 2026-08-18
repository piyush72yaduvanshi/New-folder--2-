'use strict';
// Legacy entrypoint — proxies to deterministic migration runner scripts/migrate.js

const { runMigrations } = require('./migrate');

runMigrations()
  .then(() => {
    console.log('[Migration] Done.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[Migration] Failed:', err.message);
    process.exit(1);
  });
