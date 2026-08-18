'use strict';
// Fix schema mismatches between createTestDb.js and actual production schema
const path   = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env.test'), override: true });

const mysql = require('mysql2/promise');

async function safeAlter(conn, sql, description) {
  try {
    await conn.query(sql);
    console.log('  ✓', description);
  } catch (e) {
    if (e.message.includes("Duplicate column") || e.message.includes("already exists") ||
        e.message.includes("check that column") || e.code === 'ER_DUP_FIELDNAME') {
      console.log('  ~ skip (already done):', description);
    } else {
      console.warn('  ✗', description, '->', e.message);
    }
  }
}

(async () => {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || '127.0.0.1',
    port:     parseInt(process.env.DB_PORT) || 3307,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || 'rootpassword',
    database: 'pravzo_test'
  });

  console.log('\nFixing pravzo_test schema mismatches...\n');

  // branches: rename 'name' -> 'branch_name' (matches production schema + UserRepository query)
  await safeAlter(
    conn,
    'ALTER TABLE branches CHANGE COLUMN `name` `branch_name` VARCHAR(255) NOT NULL DEFAULT ""',
    'branches.name -> branch_name'
  );

  // branches: add branch_code alias if needed by VehicleRepository
  await safeAlter(
    conn,
    'ALTER TABLE branches ADD COLUMN `branch_code` VARCHAR(50) NULL AFTER branch_name',
    'branches: add branch_code (if missing)'
  );

  // vehicles: add model_name alias (some queries use model_name, our fixture uses model)
  await safeAlter(
    conn,
    'ALTER TABLE vehicles ADD COLUMN `model_name` VARCHAR(255) NULL AFTER `model`',
    'vehicles: add model_name'
  );

  // vehicles: add vehicle_type alias (some queries use vehicle_type, our schema has type)
  await safeAlter(
    conn,
    'ALTER TABLE vehicles ADD COLUMN `vehicle_type` ENUM("BIKE","SCOOTER","E_BIKE","E_SCOOTER","CYCLE") NULL AFTER `type`',
    'vehicles: add vehicle_type'
  );

  // users: add wallet_balance and total_bookings columns if missing (UserRepository reads them)
  await safeAlter(
    conn,
    'ALTER TABLE users ADD COLUMN `wallet_balance` DECIMAL(10,2) DEFAULT 0.00 AFTER `upi_id`',
    'users: add wallet_balance'
  );
  await safeAlter(
    conn,
    'ALTER TABLE users ADD COLUMN `total_bookings` INT DEFAULT 0 AFTER `wallet_balance`',
    'users: add total_bookings'
  );
  await safeAlter(
    conn,
    'ALTER TABLE users ADD COLUMN `total_spent` DECIMAL(12,2) DEFAULT 0.00 AFTER `total_bookings`',
    'users: add total_spent'
  );

  // Verify branches columns
  const [cols] = await conn.query('SHOW COLUMNS FROM branches');
  console.log('\nbranches columns:', cols.map(r => r.Field).join(', '));

  // Verify vehicles columns
  const [vcols] = await conn.query('SHOW COLUMNS FROM vehicles');
  console.log('vehicles columns:', vcols.map(r => r.Field).join(', '));

  await conn.end();
  console.log('\nSchema fixes applied.\n');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
