'use strict';
// Load .env.test explicitly BEFORE reading process.env
const path   = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env.test'), override: true });

const mysql = require('mysql2/promise');

console.log('Connecting to:', process.env.DB_HOST + ':' + process.env.DB_PORT, 'db:', process.env.DB_NAME);

(async () => {
  try {
    const conn = await mysql.createConnection({
      host:     process.env.DB_HOST     || '127.0.0.1',
      port:     parseInt(process.env.DB_PORT) || 3307,
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || '',
      database: null
    });

    const [rows] = await conn.query("SHOW DATABASES LIKE 'pravzo%'");
    console.log('Available pravzo databases:', rows.map(r => Object.values(r)[0]));

    const hasPravzoTest = rows.some(r => Object.values(r)[0] === 'pravzo_test');

    if (hasPravzoTest) {
      await conn.query('USE pravzo_test');
      const [tables] = await conn.query('SHOW TABLES');
      console.log('\npravzo_test EXISTS with', tables.length, 'tables');
      tables.forEach(t => console.log('  -', Object.values(t)[0]));
    } else {
      console.log('\npravzo_test does NOT exist — need to create it');
    }

    await conn.end();
  } catch (e) {
    console.error('DB check failed:', e.message);
  }
})();
