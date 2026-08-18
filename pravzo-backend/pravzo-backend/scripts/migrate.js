"use strict";

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const mysql = require("mysql2/promise");

async function runMigrations() {
  console.log("====================================================");
  console.log("🚀 [Migration] Starting Pravzo Database Migration...");
  console.log("====================================================");

  const sqlFilePath = path.join(__dirname, "../database/final_database.sql");

  if (!fs.existsSync(sqlFilePath)) {
    console.error(
      "❌ [Migration] Error: final_database.sql not found at:",
      sqlFilePath,
    );
    process.exit(1);
  }

  const dbConfig = {
    host: process.env.DB_HOST || "127.0.0.1",
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
    timezone: "+00:00",
    charset: "utf8mb4",
    ssl:
      process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined,
  };

  let connection;
  try {
    // Connect initially without database name in case DB doesn't exist yet
    connection = await mysql.createConnection(dbConfig);
    console.log(
      `🔌 [Migration] Connected to MySQL host ${dbConfig.host}:${dbConfig.port} as ${dbConfig.user}`,
    );

    const dbName = process.env.DB_NAME || "pravzo_db";
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    );
    await connection.query(`USE \`${dbName}\`;`);
    console.log(`📦 [Migration] Using database: ${dbName}`);

    // Read final_database.sql
    console.log("📖 [Migration] Reading database/final_database.sql...");
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8");
    const normalizedSql = sqlContent
      .replace(/DELIMITER\s+\$\$/gi, "")
      .replace(/DELIMITER\s+;/gi, "")
      .replace(/\$\$/g, ";");
    const checksum = crypto
      .createHash("sha256")
      .update(sqlContent)
      .digest("hex");

    console.log(
      "⚙️  [Migration] Executing final_database.sql schema & seed data...",
    );
    await connection.query("SET FOREIGN_KEY_CHECKS = 0;");
    await connection.query(normalizedSql);
    await connection.query("SET FOREIGN_KEY_CHECKS = 1;");

    // Record migration tracking
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        checksum VARCHAR(64) DEFAULT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(
      `
      INSERT INTO schema_migrations (migration_name, checksum, applied_at)
      VALUES ('final_database.sql', ?, NOW())
      ON DUPLICATE KEY UPDATE checksum = VALUES(checksum), applied_at = NOW();
    `,
      [checksum],
    );

    console.log("----------------------------------------------------");
    console.log("✅ [Migration] final_database.sql successfully migrated!");
    console.log(`📑 [Migration] Checksum (SHA-256): ${checksum}`);
    console.log("====================================================");
    return true;
  } catch (err) {
    console.error("❌ [Migration] Migration failed with error:");
    console.error(err);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigrations };
