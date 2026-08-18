'use strict';
const fs = require('fs');
const filePath = require('path').resolve(__dirname, 'Pravzo_Unified_API.postman_collection.json');

// Re-read from the original sources (before the PS ConvertTo-Json inflated it)
const ADMIN_COL = require('path').resolve(__dirname, '../../backend admin/doc/updates/Pravzo_Admin_API.postman_collection.json');
const USER_COL  = require('path').resolve(__dirname, '../../backend-user/DOC/Pravazo_API.postman_collection.json');

let adminRaw = fs.readFileSync(ADMIN_COL, 'utf8').replace(/localhost:4000/g, 'localhost:5000');
let userRaw  = fs.readFileSync(USER_COL,  'utf8').replace(/localhost:3000/g, 'localhost:5000');

// Unify token variables
adminRaw = adminRaw.replace(/\{\{ACCESS_TOKEN\}\}/g, '{{ADMIN_TOKEN}}');
userRaw  = userRaw.replace(/\{\{token\}\}/g, '{{USER_TOKEN}}');

const admin = JSON.parse(adminRaw);
const user  = JSON.parse(userRaw);

// Auto-token-save script injector
function injectTokenScript(items, tokenVar, accessPath) {
  for (const item of items) {
    if (item.item) {
      injectTokenScript(item.item, tokenVar, accessPath);
    } else if (item.name && item.name.toLowerCase().includes('login')) {
      if (!item.event) item.event = [];
      const hasTest = item.event.some(e => e.listen === 'test');
      if (!hasTest) {
        item.event.push({
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              '// Auto-save token on successful login',
              'if (pm.response.code === 200) {',
              '    try {',
              '        const json = pm.response.json();',
              '        const token = ' + accessPath + ';',
              '        if (token) {',
              "            pm.collectionVariables.set('" + tokenVar + "', token);",
              "            console.log('" + tokenVar + " saved: ' + token.substring(0, 20) + '...');",
              '        }',
              '    } catch(e) { console.log("Could not parse login response"); }',
              '}'
            ]
          }
        });
      }
    }
  }
}

injectTokenScript(admin.item, 'ADMIN_TOKEN',
  "(json.data && json.data.accessToken) || json.accessToken || (json.data && json.data.token) || ''");
injectTokenScript(user.item, 'USER_TOKEN',
  "(json.data && json.data.token) || json.token || ''");

// Prefix folder names
const adminFolders = admin.item.map(f => ({ ...f, name: '[ADMIN] ' + f.name }));
const userFolders  = user.item.map(f => {
  let name = f.name.replace(/^\d+\s+\S+\s+/, '').trim();
  return { ...f, name: '[USER] ' + name };
});

const merged = {
  info: {
    name: "Pravzo Unified API v2.0",
    description: "Complete merged collection for Pravzo Unified Backend running on PORT 5000.\n\nAdmin API:     /api/admin/*  and  /api/super-admin/*\nUser/Rider API: /api/auth/*   and  /api/users/*, /api/bookings/*, etc.\n\nAuth Setup:\n1. Run [ADMIN] Authentication > Admin Login  → ADMIN_TOKEN auto-saved\n2. Run [USER] AUTH > Register or Login       → USER_TOKEN auto-saved\n3. Use collection variable ADMIN_TOKEN for admin requests\n4. Use collection variable USER_TOKEN for user requests",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    _postman_id: "pravzo-unified-api-v2-merged"
  },
  variable: [
    { key: "BASE_URL",    value: "http://localhost:5000", type: "string", description: "Unified server (admin + user combined)" },
    { key: "ADMIN_TOKEN", value: "",  type: "string", description: "Auto-set by Admin Login request" },
    { key: "USER_TOKEN",  value: "",  type: "string", description: "Auto-set by User Login request" },
    { key: "userId",      value: "1", type: "string" },
    { key: "riderId",     value: "1", type: "string" },
    { key: "bookingId",   value: "1", type: "string" },
    { key: "vehicleId",   value: "1", type: "string" },
    { key: "adminId",     value: "1", type: "string" },
    { key: "paymentId",   value: "1", type: "string" },
    { key: "walletId",    value: "1", type: "string" },
    { key: "rentalId",    value: "1", type: "string" },
    { key: "jobId",       value: "1", type: "string" },
    { key: "couponCode",  value: "PRAVZO10", type: "string" }
  ],
  item: [
    {
      name: "00 HEALTH CHECK",
      description: "Server health — no auth required",
      item: [
        {
          name: "GET Health Check",
          event: [{ listen: "test", script: { type: "text/javascript", exec: [
            "pm.test('Status 200', () => pm.response.to.have.status(200));",
            "pm.test('Server running', () => { const j = pm.response.json(); pm.expect(j.status || j.success).to.be.ok; });"
          ]}}],
          request: { method: "GET", header: [],
            url: { raw: "{{BASE_URL}}/health", host: ["{{BASE_URL}}"], path: ["health"] }
          }
        },
        {
          name: "GET API Info",
          request: { method: "GET", header: [],
            url: { raw: "{{BASE_URL}}/api", host: ["{{BASE_URL}}"], path: ["api"] }
          }
        }
      ]
    },
    ...adminFolders,
    ...userFolders
  ]
};

fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), 'utf8');
const kb = Math.round(fs.statSync(filePath).size / 1024);
console.log('Collection written: Pravzo_Unified_API.postman_collection.json');
console.log('Size: ' + kb + ' KB');
console.log('Sections: ' + merged.item.length + '  (1 health + ' + adminFolders.length + ' admin + ' + userFolders.length + ' user)');
