'use strict';
/**
 * merge_collections.js
 * Properly merges admin (431 req) + user (71 req) Postman collections
 * into a single unified collection for the merged backend (PORT 5000)
 */

const fs   = require('fs');
const path = require('path');

const ADMIN_FILE = path.resolve(__dirname, '../../backend admin/doc/updates/Pravzo_Admin_API.postman_collection.json');
const USER_FILE  = path.resolve(__dirname, '../../backend-user/DOC/Pravazo_API.postman_collection.json');
const OUT_FILE   = path.resolve(__dirname, 'Pravzo_Unified_API.postman_collection.json');

// ── Load raw JSON (do NOT parse yet — do string replacements first)
let adminRaw = fs.readFileSync(ADMIN_FILE, 'utf8');
let userRaw  = fs.readFileSync(USER_FILE,  'utf8');

// ── URL fixes (old ports → unified port 5000)
adminRaw = adminRaw.replace(/http:\/\/localhost:4000/g, 'http://localhost:5000');
userRaw  = userRaw .replace(/http:\/\/localhost:3000/g, 'http://localhost:5000');

// ── Token variable unification
// Admin uses {{ACCESS_TOKEN}} and {{REFRESH_TOKEN}}
// User  uses {{token}} and {{baseUrl}}
adminRaw = adminRaw.replace(/\{\{ACCESS_TOKEN\}\}/g,  '{{ADMIN_TOKEN}}');
adminRaw = adminRaw.replace(/\{\{REFRESH_TOKEN\}\}/g, '{{ADMIN_REFRESH_TOKEN}}');
userRaw  = userRaw .replace(/\{\{token\}\}/g,   '{{USER_TOKEN}}');
userRaw  = userRaw .replace(/\{\{baseUrl\}\}/g, 'http://localhost:5000/api');

// ── Parse
const admin = JSON.parse(adminRaw);
const user  = JSON.parse(userRaw);

// ── Helper: count total requests recursively
function countReqs(items) {
  return (items || []).reduce((n, i) => n + (i.item ? countReqs(i.item) : 1), 0);
}

// ── Helper: inject auto-token-save test script into login requests
function injectAutoSave(items, tokenVar, tokenPath) {
  for (const item of (items || [])) {
    if (item.item) {
      injectAutoSave(item.item, tokenVar, tokenPath);
    } else if (item.name) {
      const lower = item.name.toLowerCase();
      if (lower.includes('login') && !lower.includes('logout')) {
        if (!item.event) item.event = [];
        const hasTest = item.event.some(e => e.listen === 'test');
        if (!hasTest) {
          item.event.push({
            listen: 'test',
            script: {
              type: 'text/javascript',
              exec: [
                '// Auto-save ' + tokenVar + ' after successful login',
                'if (pm.response.code === 200) {',
                '    try {',
                '        const r = pm.response.json();',
                '        const tok = ' + tokenPath + ';',
                "        if (tok) { pm.collectionVariables.set('" + tokenVar + "', tok);",
                "                  pm.environment.set('" + tokenVar + "', tok); }",
                '    } catch(e) {}',
                '}'
              ]
            }
          });
        }
      }
    }
  }
}

injectAutoSave(
  admin.item,
  'ADMIN_TOKEN',
  "(r.data && r.data.accessToken) || r.accessToken || (r.data && r.data.token) || ''"
);

injectAutoSave(
  user.item,
  'USER_TOKEN',
  "(r.data && r.data.token) || r.token || ''"
);

// ── Clean user folder names (remove numbering artifacts and encoding issues)
const userFolders = user.item.map(folder => {
  // Clean name: "01 — AUTH" → "AUTH", fix encoding artifacts
  let name = folder.name
    .replace(/^\d+\s+[^\w]+\s+/u, '')   // remove "01 — " prefix
    .replace(/â€"/g, '-')                 // fix broken UTF-8 em dash
    .replace(/\u00e2\u0080\u0093/g, '-') // another variant
    .trim();
  return { ...folder, name: '👤 USER — ' + name };
});

// ── Prefix admin folder names
const adminFolders = admin.item.map(folder => ({
  ...folder,
  name: '🔧 ADMIN — ' + folder.name
}));

// ── Build merged collection
const merged = {
  info: {
    name: 'Pravzo Unified API v2.0',
    description:
      'Merged collection for Pravzo Unified Backend — Single server on PORT 5000.\n\n' +
      '📌 SETUP STEPS:\n' +
      '1. Set BASE_URL = http://localhost:5000 in environment\n' +
      '2. Run [🔧 ADMIN — Authentication > Admin Login] → ADMIN_TOKEN auto-saved\n' +
      '3. Run [👤 USER — AUTH > Login (Phone + Password)] → USER_TOKEN auto-saved\n' +
      '4. Admin requests use Bearer {{ADMIN_TOKEN}}\n' +
      '5. User requests use Bearer {{USER_TOKEN}}\n\n' +
      '📊 Total: 502 requests (431 admin + 71 user)',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    _postman_id: 'pravzo-unified-v2-merged'
  },

  variable: [
    { key: 'BASE_URL',           value: 'http://localhost:5000',  type: 'string',  description: 'Unified server (admin + user on single port)' },
    { key: 'ADMIN_TOKEN',        value: '',  type: 'string',  description: 'Auto-set after Admin Login' },
    { key: 'ADMIN_REFRESH_TOKEN',value: '',  type: 'string',  description: 'Auto-set after Admin Login' },
    { key: 'USER_TOKEN',         value: '',  type: 'string',  description: 'Auto-set after User Login' },
    { key: 'userId',             value: '1', type: 'string',  description: 'User ID for testing' },
    { key: 'riderId',            value: '1', type: 'string' },
    { key: 'bookingId',          value: '1', type: 'string' },
    { key: 'vehicleId',          value: '1', type: 'string' },
    { key: 'adminId',            value: '1', type: 'string' },
    { key: 'paymentId',          value: '1', type: 'string' },
    { key: 'walletId',           value: '1', type: 'string' },
    { key: 'rentalId',           value: '1', type: 'string' },
    { key: 'jobId',              value: '1', type: 'string' },
    { key: 'settlementId',       value: '1', type: 'string' },
    { key: 'notificationId',     value: '1', type: 'string' },
    { key: 'branchId',           value: '1', type: 'string' },
    { key: 'bookingAmount',      value: '1200', type: 'string' },
    { key: 'couponCode',         value: 'PRAVZO10', type: 'string' },
    { key: 'stationId',          value: '1', type: 'string' },
    { key: 'guideIdOrSlug',      value: 'ev-battery-safety', type: 'string' },
    { key: 'sosId',              value: '1', type: 'string' }
  ],

  auth: { type: 'noauth' },

  event: [
    {
      listen: 'prerequest',
      script: {
        type: 'text/javascript',
        exec: [
          '// Pravzo Unified API — Collection Pre-request',
          '// ADMIN_TOKEN auto-set by Admin Login | USER_TOKEN auto-set by User Login'
        ]
      }
    }
  ],

  item: [
    // ── Health Check (no auth)
    {
      name: '✅ HEALTH CHECK',
      description: 'Server health — no authentication required',
      item: [
        {
          name: 'GET /health',
          event: [{
            listen: 'test',
            script: { type: 'text/javascript', exec: [
              "pm.test('Status 200', () => pm.response.to.have.status(200));",
              "pm.test('OK response', () => { const j = pm.response.json(); pm.expect(j.status === 'OK' || j.success === true || j.name).to.be.ok; });"
            ]}
          }],
          request: {
            method: 'GET', header: [],
            url: { raw: '{{BASE_URL}}/health', host: ['{{BASE_URL}}'], path: ['health'] }
          }
        },
        {
          name: 'GET / (API Root)',
          request: {
            method: 'GET', header: [],
            url: { raw: '{{BASE_URL}}/', host: ['{{BASE_URL}}'], path: [''] }
          }
        }
      ]
    },

    // ── All admin folders (24 folders, 431 requests)
    ...adminFolders,

    // ── All user folders (21 folders, 71 requests)
    ...userFolders
  ]
};

// ── Write output
fs.writeFileSync(OUT_FILE, JSON.stringify(merged, null, 2), 'utf8');

const kb      = Math.round(fs.statSync(OUT_FILE).size / 1024);
const total   = countReqs(merged.item);
const aCount  = countReqs(adminFolders);
const uCount  = countReqs(userFolders);

console.log('');
console.log('✅  Pravzo_Unified_API.postman_collection.json');
console.log('   Size       :', kb, 'KB');
console.log('   Sections   :', merged.item.length, '(1 health + 24 admin + 21 user)');
console.log('   Requests   :', total, '(admin:', aCount, '| user:', uCount, ')');
console.log('   Variables  :', merged.variable.length);
console.log('');
console.log('📦  Import into Postman:');
console.log('   File → Import → Upload Files →', OUT_FILE);
