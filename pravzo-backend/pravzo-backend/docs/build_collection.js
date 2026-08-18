'use strict';
const fs   = require('fs');
const path = require('path');

const ADMIN_COL = path.resolve(__dirname, '../../backend admin/doc/updates/Pravzo_Admin_API.postman_collection.json');
const USER_COL  = path.resolve(__dirname, '../../backend-user/DOC/Pravazo_API.postman_collection.json');
const OUT_FILE  = path.resolve(__dirname, 'Pravzo_Unified_API.postman_collection.json');

// Load & patch URLs
let adminRaw = fs.readFileSync(ADMIN_COL, 'utf8').replace(/localhost:4000/g, 'localhost:5000');
let userRaw  = fs.readFileSync(USER_COL,  'utf8').replace(/localhost:3000/g, 'localhost:5000');

const admin = JSON.parse(adminRaw);
const user  = JSON.parse(userRaw);

// Prefix admin folders
const adminFolders = admin.item.map(f => ({ ...f, name: '[ADMIN] ' + f.name }));

// Clean user folder names (remove numbering, fix encoding)
const userFolders = user.item.map(f => {
  let name = f.name
    .replace(/^\d+\s+[^\s]+\s+/, '')   // remove "01 — " prefix
    .replace(/\u00e2\u0080\u0093/g, '-')  // fix UTF-8 em dash
    .replace(/â€"/g, '-')
    .trim();
  return { ...f, name: '[USER] ' + name };
});

const merged = {
  info: {
    name: "Pravzo Unified API v2.0",
    description: "Single merged Postman collection for Pravzo Unified Backend (PORT 5000).\n\nAdmin routes: /api/admin/* and /api/super-admin/*\nUser/Rider routes: /api/auth/*, /api/users/*, /api/bookings/*, etc.\n\nSetup:\n1. Run Admin Login to get ADMIN_TOKEN\n2. Run User Register/Login to get USER_TOKEN\n3. Use respective token for each section",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    _postman_id: "pravzo-unified-api-v2-merged"
  },
  variable: [
    { key: "BASE_URL",    value: "http://localhost:5000", type: "string", description: "Unified server base URL (single port for both admin and user)" },
    { key: "ADMIN_TOKEN", value: "",   type: "string", description: "Admin JWT access token — set automatically from Admin Login response" },
    { key: "USER_TOKEN",  value: "",   type: "string", description: "User JWT token — set automatically from User Login response" },
    { key: "userId",      value: "1",  type: "string", description: "User ID for testing" },
    { key: "riderId",     value: "1",  type: "string", description: "Rider ID for testing" },
    { key: "bookingId",   value: "1",  type: "string", description: "Booking ID for testing" },
    { key: "vehicleId",   value: "1",  type: "string", description: "Vehicle ID for testing" },
    { key: "adminId",     value: "1",  type: "string", description: "Admin ID for testing" },
    { key: "paymentId",   value: "1",  type: "string", description: "Payment ID for testing" },
    { key: "walletId",    value: "1",  type: "string", description: "Wallet ID for testing" },
    { key: "rentalId",    value: "1",  type: "string", description: "Rental ID for testing" },
    { key: "jobId",       value: "1",  type: "string", description: "Job ID for testing" },
    { key: "couponCode",  value: "PRAVZO10", type: "string", description: "Coupon code for testing" }
  ],
  event: [
    {
      listen: "prerequest",
      script: {
        type: "text/javascript",
        exec: [
          "// Pravzo Unified API — Pre-request Script",
          "// ADMIN_TOKEN and USER_TOKEN are auto-set by the login request Tests scripts"
        ]
      }
    }
  ],
  item: [
    // ─── Quick Start
    {
      name: "00 QUICK START",
      description: "Health check and server info — no auth required",
      item: [
        {
          name: "Health Check",
          event: [{ listen: "test", script: { type: "text/javascript", exec: ["pm.test('Server is running', () => pm.response.to.have.status(200));"] } }],
          request: {
            method: "GET", header: [],
            url: { raw: "{{BASE_URL}}/health", host: ["{{BASE_URL}}"], path: ["health"] }
          }
        },
        {
          name: "API Root Info",
          request: {
            method: "GET", header: [],
            url: { raw: "{{BASE_URL}}/", host: ["{{BASE_URL}}"], path: [""] }
          }
        },
        {
          name: "File Upload (Image)",
          request: {
            method: "POST", header: [],
            body: { mode: "formdata", formdata: [{ key: "file", type: "file", src: "", description: "Upload jpg/png/webp image" }] },
            url: { raw: "{{BASE_URL}}/api/upload", host: ["{{BASE_URL}}"], path: ["api","upload"] }
          }
        }
      ]
    },
    // ─── Admin folders (all 24)
    ...adminFolders,
    // ─── User folders (all 21)
    ...userFolders
  ]
};

// Write output
fs.writeFileSync(OUT_FILE, JSON.stringify(merged, null, 2), 'utf8');
const kb = Math.round(fs.statSync(OUT_FILE).size / 1024);
console.log(`Collection written: ${path.basename(OUT_FILE)}`);
console.log(`Size: ${kb} KB`);
console.log(`Total sections: ${merged.item.length} (1 quick-start + ${adminFolders.length} admin + ${userFolders.length} user)`);
