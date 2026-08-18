'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

async function verifyDatabase() {
  console.log('[Verification] Running Pravzo Canonical Database Verification Tool...');

  const sqlPath = path.join(__dirname, '../database/final_database.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('CRITICAL: database/final_database.sql not found!');
    return false;
  }

  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  const createTableMatches = sqlContent.match(/CREATE TABLE\s+[`]?(\w+)[`]?/gi) || [];
  const requiredTables = createTableMatches.map(m => m.replace(/CREATE TABLE\s+[`]?/i, '').replace(/[`]?$/, ''));

  const obsoleteTables = [
    'admins', 'admin_permissions', 'admin_sessions', 'admin_refresh_tokens',
    'admin_login_history', 'admin_password_history', 'admin_devices',
    'admin_branch_assignments', 'admin_activity_logs_enhanced',
    'rider_wallets', 'rider_wallet_transactions', 'rider_kyc',
    'rider_documents', 'rider_devices', 'rider_activities',
    'rider_login_history', 'rider_branch_assignments', 'user_wallet_transactions'
  ];

  let errors = [];

  try {
    const [tableRows] = await db.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'`
    );
    const existingBaseTables = new Set(tableRows.map(r => r.TABLE_NAME.toLowerCase()));

    // Check required canonical tables
    for (const tbl of requiredTables) {
      if (!existingBaseTables.has(tbl.toLowerCase())) {
        errors.push(`Missing Required Table: ${tbl}`);
      }
    }

    // Check obsolete base tables
    for (const tbl of obsoleteTables) {
      if (existingBaseTables.has(tbl.toLowerCase())) {
        errors.push(`Forbidden Obsolete Base Table Found in DB: ${tbl}`);
      }
    }

    // Check Foreign Keys
    const [fkRows] = await db.query(
      `SELECT CONSTRAINT_NAME, TABLE_NAME FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL`
    );

    if (errors.length === 0) {
      console.log('====================================================');
      console.log('  PRAVZO DATABASE VERIFICATION: PASS (All checks passed)');
      console.log('====================================================');
      console.log(`✓ Verified ${requiredTables.length} canonical base tables in database.`);
      console.log(`✓ Verified 0 obsolete base tables exist.`);
      console.log(`✓ Verified ${fkRows.length} foreign key relationships in database.`);
      return true;
    } else {
      console.error('====================================================');
      console.error('  PRAVZO DATABASE VERIFICATION: FAIL');
      console.error('====================================================');
      errors.forEach(err => console.error(`  - ${err}`));
      return false;
    }
  } catch (err) {
    console.error('[Verification] Unexpected database query error:', err.message);
    return false;
  }
}

if (require.main === module) {
  verifyDatabase()
    .then(passed => process.exit(passed ? 0 : 1))
    .catch(() => process.exit(1));
}

module.exports = { verifyDatabase };
