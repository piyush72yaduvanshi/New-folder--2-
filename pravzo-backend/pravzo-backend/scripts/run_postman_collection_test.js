'use strict';

process.env.NODE_ENV = 'test';
require('dotenv').config();
const fs = require('fs');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const db = require('../src/config/db');

const adminSecret = process.env.JWT_ACCESS_SECRET;
const userSecret = process.env.JWT_SECRET;

// Generate valid tokens
const superAdminToken = jwt.sign(
  { admin_id: 101, user_id: 101, role: 'SUPER_ADMIN', email: 'superadmin@pravzo.com' },
  adminSecret,
  { expiresIn: '1h' }
);
const adminToken = jwt.sign(
  { admin_id: 102, user_id: 102, role: 'ADMIN', email: 'admin@pravzo.com' },
  adminSecret,
  { expiresIn: '1h' }
);
const userToken = jwt.sign(
  { userId: 1, user_id: 1, role: 'CUSTOMER', email: 'aman@pravzo.com' },
  userSecret,
  { expiresIn: '1h' }
);

function extractRequests(items, folderPath = '') {
  let list = [];
  for (const item of items) {
    const currentPath = folderPath ? `${folderPath} > ${item.name}` : item.name;
    if (item.request) {
      list.push({
        folder: folderPath,
        name: item.name,
        request: item.request
      });
    }
    if (item.item) {
      list = list.concat(extractRequests(item.item, currentPath));
    }
  }
  return list;
}

async function runCollection(collectionFile) {
  console.log(`\n======================================================`);
  console.log(`TESTING POSTMAN COLLECTION: ${collectionFile}`);
  console.log(`======================================================\n`);

  const raw = fs.readFileSync(collectionFile, 'utf8').replace(/^\uFEFF/, '');
  const collection = JSON.parse(raw);

  const allRequests = extractRequests(collection.item);
  console.log(`Total Requests in Collection: ${allRequests.length}\n`);

  let successCount = 0;       // 200, 201, 204
  let handledClientCount = 0; // 400, 404, 422 (expected for dummy IDs or validations)
  let authDeniedCount = 0;    // 401, 403
  let serverErrorCount = 0;   // 500
  const folderStats = {};
  const failureDetails = [];

  for (let i = 0; i < allRequests.length; i++) {
    const item = allRequests[i];
    const topFolder = item.folder.split(' > ')[0] || 'Root';
    if (!folderStats[topFolder]) {
      folderStats[topFolder] = { total: 0, success: 0, handledClient: 0, authDenied: 0, serverError: 0 };
    }
    folderStats[topFolder].total++;

    let urlRaw = item.request.url?.raw || '';
    if (typeof item.request.url === 'string') {
      urlRaw = item.request.url;
    }
    urlRaw = urlRaw.replace(/\{\{baseUrl\}\}/gi, '')
                   .replace(/\{\{BASE_URL\}\}/gi, '')
                   .replace(/http:\/\/localhost:\d+/gi, '')
                   .replace(/http:\/\/127\.0\.0\.1:\d+/gi, '');

    if (!urlRaw.startsWith('/')) {
      urlRaw = '/' + urlRaw;
    }

    const isUserRoute = topFolder.startsWith('[USER]');
    const activeToken = isUserRoute ? userToken : superAdminToken;

    const method = (item.request.method || 'GET').toUpperCase();
    let reqRunner = request(app)[method.toLowerCase()](urlRaw);

    // Attach headers
    reqRunner.set('Authorization', `Bearer ${activeToken}`);
    reqRunner.set('Cookie', `accessToken=${activeToken}`);
    reqRunner.set('Accept', 'application/json');

    // Attach body if present
    if (item.request.body && item.request.body.raw && ['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const parsedBody = JSON.parse(item.request.body.raw);
        reqRunner.send(parsedBody);
      } catch (e) {
        reqRunner.send(item.request.body.raw);
      }
    }

    const res = await reqRunner;

    if (res.statusCode >= 200 && res.statusCode < 300) {
      successCount++;
      folderStats[topFolder].success++;
    } else if ([400, 404, 409, 422].includes(res.statusCode)) {
      handledClientCount++;
      folderStats[topFolder].handledClient++;
    } else if ([401, 403].includes(res.statusCode)) {
      authDeniedCount++;
      folderStats[topFolder].authDenied++;
    } else if (res.statusCode >= 500) {
      serverErrorCount++;
      folderStats[topFolder].serverError++;
      failureDetails.push({
        method,
        url: urlRaw,
        name: item.name,
        folder: item.folder,
        statusCode: res.statusCode,
        response: res.body || res.text?.slice(0, 150)
      });
    }

    if ((i + 1) % 50 === 0 || i === allRequests.length - 1) {
      process.stdout.write(`Processed ${i + 1}/${allRequests.length} requests...\r`);
    }
  }

  console.log(`\n\n======================================================`);
  console.log(`POSTMAN COLLECTION VERIFICATION SUMMARY`);
  console.log(`======================================================`);
  console.log(`Total Requests Tested:        ${allRequests.length}`);
  console.log(`Direct Success (2xx):         ${successCount} (${((successCount / allRequests.length) * 100).toFixed(1)}%)`);
  console.log(`Validations Handled (4xx):    ${handledClientCount} (${((handledClientCount / allRequests.length) * 100).toFixed(1)}%)`);
  console.log(`Auth/Permission Guarded:      ${authDeniedCount}`);
  console.log(`Server Errors (500 Crashes):  ${serverErrorCount}`);
  console.log(`Overall Backend Stability:   ${(((allRequests.length - serverErrorCount) / allRequests.length) * 100).toFixed(1)}%`);

  console.log(`\n======================================================`);
  console.log(`FOLDER-WISE RESULTS TABLE`);
  console.log(`======================================================`);
  console.table(Object.keys(folderStats).map(f => ({
    Folder: f,
    Total: folderStats[f].total,
    '2xx_Success': folderStats[f].success,
    '4xx_Handled': folderStats[f].handledClient,
    'Auth_Guarded': folderStats[f].authDenied,
    '500_ServerErrors': folderStats[f].serverError
  })));

  if (failureDetails.length > 0) {
    console.log(`\n======================================================`);
    console.log(`SERVER ERROR DETAILS (${failureDetails.length}):`);
    console.log(`======================================================`);
    console.log(JSON.stringify(failureDetails, null, 2));
  } else {
    console.log(`\n>>> EXCELLENT: ZERO 500 SERVER ERRORS ACROSS ALL POSTMAN REQUESTS! <<<`);
  }
}

async function main() {
  await runCollection('docs/Pravzo_Admin_API.postman_collection.json');
  await db.end();
  process.exit(0);
}

main();
