const { execSync } = require("child_process");
const path = require("path");

const backendDir = path.join(__dirname, "..");

try {
  console.log("Starting Pravazo database setup...");
  execSync("node scripts/migrate.js", { stdio: "inherit", cwd: backendDir });
  execSync("node scripts/seed.js", { stdio: "inherit", cwd: backendDir });
  console.log("\n✅ Database setup completed successfully.");
} catch (error) {
  console.error("\n❌ Database setup failed:", error.message);
  process.exit(1);
}
