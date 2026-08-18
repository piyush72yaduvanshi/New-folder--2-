require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

console.log('\n========================================');
console.log('  Pravzo Admin Backend - Setup Verification');
console.log('========================================\n');

let allChecksPass = true;

// Check 1: Environment File
console.log('1. Checking .env file...');
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  console.log('   ✓ .env file exists');
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const requiredVars = ['PORT', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!envContent.includes(varName)) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.log('   ✗ Missing environment variables:', missingVars.join(', '));
    allChecksPass = false;
  } else {
    console.log('   ✓ All required environment variables present');
  }
} else {
  console.log('   ✗ .env file not found');
  allChecksPass = false;
}

// Check 2: Required Folders
console.log('\n2. Checking folder structure...');
const requiredFolders = [
  'src/config',
  'src/admin/controllers',
  'src/admin/services',
  'src/admin/repositories',
  'src/admin/models',
  'src/admin/routes',
  'src/user/controllers',
  'src/user/services',
  'src/user/repositories',
  'src/user/routes',
  'src/middleware',
  'src/utils',
  'scripts',
  'docs'
];

requiredFolders.forEach(folder => {
  const folderPath = path.join(__dirname, '../', folder);
  if (fs.existsSync(folderPath)) {
    console.log(`   ✓ ${folder}/`);
  } else {
    console.log(`   ✗ ${folder}/ NOT FOUND`);
    allChecksPass = false;
  }
});

// Check 3: Required Files
console.log('\n3. Checking core files...');
const requiredFiles = [
  'app.js',
  'server.js',
  'package.json',
  '.gitignore',
  'database/final_database.sql',
  'src/config/db.js',
  'src/config/jwt.js',
  'src/admin/models/Admin.js',
  'src/middleware/adminAuth.js',
  'src/middleware/permissionMiddleware.js',
  'src/middleware/errorHandler.js',
  'src/utils/logger.js',
  'src/utils/helpers.js'
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '../', file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✓ ${file}`);
  } else {
    console.log(`   ✗ ${file} NOT FOUND`);
    allChecksPass = false;
  }
});

// Check 4: node_modules
console.log('\n4. Checking dependencies...');
const nodeModulesPath = path.join(__dirname, '../node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('   ✓ node_modules folder exists');
  
  const requiredPackages = [
    'express',
    'mysql2',
    'bcrypt',
    'jsonwebtoken',
    'cookie-parser',
    'express-validator',
    'nodemailer',
    'multer',
    'dotenv',
    'cors'
  ];
  
  requiredPackages.forEach(pkg => {
    const pkgPath = path.join(nodeModulesPath, pkg);
    if (fs.existsSync(pkgPath)) {
      console.log(`   ✓ ${pkg}`);
    } else {
      console.log(`   ✗ ${pkg} NOT INSTALLED`);
      allChecksPass = false;
    }
  });
} else {
  console.log('   ✗ node_modules not found. Run: npm install');
  allChecksPass = false;
}

// Check 5: Database Connection
console.log('\n5. Testing database connection...');
db.getConnection()
  .then((connection) => {
    console.log('   ✓ Database connection successful');
    connection.release();
    
    // Check 6: Database Tables
    console.log('\n6. Checking database tables...');
    return db.query('SHOW TABLES');
  })
  .then(([rows]) => {
    const tables = rows.map(row => Object.values(row)[0]);
    const requiredTables = ['users', 'user_profiles', 'roles', 'permissions', 'refresh_tokens', 'sessions', 'riders', 'wallets', 'kyc'];
    
    requiredTables.forEach(table => {
      if (tables.includes(table)) {
        console.log(`   ✓ Table '${table}' exists`);
      } else {
        console.log(`   ✗ Table '${table}' NOT FOUND.`);
        allChecksPass = false;
      }
    });
    
    // Check admin user count
    return db.query("SELECT COUNT(*) as count FROM users WHERE role_id IN (1, 2, 3)");
  })
  .then(([rows]) => {
    const adminCount = rows[0].count;
    console.log(`\n7. Checking admin accounts...`);
    if (adminCount > 0) {
      console.log(`   ✓ ${adminCount} admin account(s) found`);
      
      // List admins
      return db.query("SELECT u.email, r.role_name AS role FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.role_id IN (1, 2, 3)");
    } else {
      console.log('   ✗ No admin accounts found.');
      allChecksPass = false;
      throw new Error('No admins');
    }
  })
  .then(([admins]) => {
    admins.forEach(admin => {
      console.log(`   - ${admin.email} (${admin.role})`);
    });
    
    // Final Summary
    printSummary();
  })
  .catch((error) => {
    if (error.message !== 'No admins') {
      console.log('   ✗ Database connection failed:', error.message);
      console.log('\n   Possible issues:');
      console.log('   - MySQL is not running');
      console.log('   - Database credentials are incorrect');
      console.log('   - Database does not exist');
      console.log('\n   Solutions:');
      console.log('   1. Start MySQL service');
      console.log('   2. Check .env file credentials');
      console.log('   3. Create database: mysql -u root -p -e "CREATE DATABASE pravzo_db"');
      console.log('   4. Run migration: node scripts/migrate.js');
      allChecksPass = false;
    }
    
    printSummary();
  });

function printSummary() {
  console.log('\n========================================');
  if (allChecksPass) {
    console.log('  ✅ ALL CHECKS PASSED!');
    console.log('========================================');
    console.log('\nYour backend-admin is ready to use!');
    console.log('\nNext steps:');
    console.log('1. Start server: npm start');
    console.log('2. Test API: http://localhost:4000/health');
    console.log('3. Login: POST http://localhost:4000/api/admin/login');
    console.log('\nDefault credentials:');
    console.log('  Email: admin@pravzo.com');
    console.log('  Password: Admin@123');
    console.log('\n⚠️  Remember to change default passwords in production!');
  } else {
    console.log('  ❌ SOME CHECKS FAILED');
    console.log('========================================');
    console.log('\nPlease fix the issues above and run this script again.');
    console.log('\nCommon solutions:');
    console.log('1. Install dependencies: npm install');
    console.log('2. Run migration: node scripts/migrate.js');
    console.log('3. Check .env configuration');
    console.log('4. Ensure MySQL is running');
  }
  console.log('\n');
  process.exit(allChecksPass ? 0 : 1);
}
