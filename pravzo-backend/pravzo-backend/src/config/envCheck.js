'use strict';

require('dotenv').config();

function validateEnv() {
  const isProd = process.env.NODE_ENV === 'production';

  const requiredAlways = ['JWT_SECRET', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = requiredAlways.filter(key => !process.env[key]);

  if (missing.length > 0) {
    const errorMsg = `[Environment Check Error] Required security env vars missing: ${missing.join(', ')}`;
    if (isProd) {
      console.error(errorMsg);
      process.exit(1);
    } else {
      console.warn(errorMsg);
    }
  }

  if (isProd) {
    const weakSecrets = ['JWT_SECRET', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'].filter(key => {
      const val = process.env[key];
      return val && (val.includes('change_me') || val.includes('secret') || val.length < 16);
    });

    if (weakSecrets.length > 0) {
      console.error(`[Environment Security Error] Production environment detected with weak secrets for: ${weakSecrets.join(', ')}`);
      process.exit(1);
    }

    if (!process.env.DB_PASSWORD) {
      console.error('[Environment Security Error] DB_PASSWORD is required in production.');
      process.exit(1);
    }
  }
}

module.exports = { validateEnv };
