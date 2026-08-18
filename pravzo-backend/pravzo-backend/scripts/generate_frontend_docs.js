'use strict';

const fs = require('fs');
const path = require('path');

const collectionPath = path.join(__dirname, '../docs/Pravzo_Admin_API.postman_collection.json');
const outputPath = path.join(__dirname, '../docs/FRONTEND_API_INTEGRATION_GUIDE.md');

const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

let md = `# Pravzo Backend - Complete Frontend Integration Guide (API Master Reference)

> **Version:** 2.0.0 (Unified API & Production Verified)  
> **Base URL (Local/Development):** \`http://localhost:5000\`  
> **Base URL (Production/Staging):** \`https://api.pravzo.com\` (Configured in \`.env\`)  
> **Authentication:** Standard JWT Bearer Token in Request Header:  
> \`Authorization: Bearer <your_jwt_token>\`

---

## 📌 Table of Contents

- [1. Authentication & Common Headers](#1-authentication--common-headers)
- [2. Standard Response Format & Status Codes](#2-standard-response-format--status-codes)
- [3. Module-Wise API Index](#3-module-wise-api-index)
- [4. Complete API Reference & Input / Output Details](#4-complete-api-reference--input--output-details)
`;

// Helper to extract requests recursively
function extractRequests(items, folderPath = '') {
  let list = [];
  for (const item of items) {
    const currentPath = folderPath ? `${folderPath} > ${item.name}` : item.name;
    if (item.request) {
      list.push({
        folder: folderPath,
        name: item.name,
        request: item.request,
        responses: item.response || []
      });
    } else if (item.item && Array.isArray(item.item)) {
      list = list.concat(extractRequests(item.item, currentPath));
    }
  }
  return list;
}

const allRequests = extractRequests(collection.item);

// Build Section 1 & 2
md += `
---

## 1. Authentication & Common Headers

### Request Headers
All protected API endpoints require the following standard HTTP headers:

| Header Name | Value / Format | Required | Description |
| :--- | :--- | :---: | :--- |
| \`Content-Type\` | \`application/json\` | Yes (for POST/PUT/PATCH) | Request body payload type |
| \`Authorization\` | \`Bearer <jwt_token>\` | Yes (for protected routes) | Admin or User JWT Session Token |
| \`Accept\` | \`application/json\` | Optional | Preferred response media type |

---

## 2. Standard Response Format & Status Codes

All backend endpoints strictly follow the uniform JSON envelope structure:

### ✅ Success Response Structure (200 OK / 201 Created)
\`\`\`json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": {
    /* Response payload (object or array) */
  },
  "meta": {
    "timestamp": "2026-08-16T05:00:00.000Z",
    "requestId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }
}
\`\`\`

### ⚠️ Paginated Response Data Structure
\`\`\`json
{
  "success": true,
  "statusCode": 200,
  "message": "Records retrieved successfully",
  "data": [ /* Array of records */ ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  },
  "meta": {
    "timestamp": "2026-08-16T05:00:00.000Z",
    "requestId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }
}
\`\`\`

### ❌ Error Response Structure (4xx / 5xx)
\`\`\`json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed / Invalid parameters",
  "errorCode": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "phone",
      "message": "Valid 10-digit mobile number is required"
    }
  ],
  "meta": {
    "timestamp": "2026-08-16T05:00:00.000Z",
    "requestId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }
}
\`\`\`

| Status Code | Meaning | When it is returned |
| :---: | :--- | :--- |
| **200 OK** | Success | Successful GET, PUT, PATCH, DELETE operations |
| **201 Created** | Created | Resource successfully created (POST requests) |
| **400 Bad Request** | Validation Error | Missing fields, bad formatting, or business logic rule violation |
| **401 Unauthorized** | Missing/Invalid Token | JWT token is missing, malformed, or expired |
| **403 Forbidden** | Access Denied | Admin does not have the required permission/role |
| **404 Not Found** | Not Found | Requested entity (user, vehicle, booking, etc.) does not exist |
| **409 Conflict** | Duplicate Entry | Unique constraint violation (e.g. email or phone already registered) |
| **500 Internal Error** | Server Error | Unhandled server exception (100% resiliently guarded) |

---

## 3. Module-Wise API Index

Total Available Endpoints: **${allRequests.length}**

`;

// Group requests by top-level section
const groups = {};
allRequests.forEach(req => {
  const topFolder = req.folder.split(' > ')[0] || 'General';
  if (!groups[topFolder]) groups[topFolder] = [];
  groups[topFolder].push(req);
});

let tableIdx = 1;
for (const [groupName, reqs] of Object.entries(groups)) {
  const anchor = groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  md += `- [${groupName} (${reqs.length} Endpoints)](#${anchor})\n`;
}

md += `\n---\n\n## 4. Complete API Reference & Input / Output Details\n\n`;

for (const [groupName, reqs] of Object.entries(groups)) {
  const anchor = groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  md += `\n### <a id="${anchor}"></a> ${groupName}\n\n`;

  reqs.forEach((r, idx) => {
    const method = r.request.method || 'GET';
    let urlStr = '';
    if (typeof r.request.url === 'string') {
      urlStr = r.request.url;
    } else if (r.request.url && r.request.url.raw) {
      urlStr = r.request.url.raw;
    } else if (r.request.url && r.request.url.path) {
      urlStr = '/' + r.request.url.path.join('/');
    }

    // Clean up url
    urlStr = urlStr.replace('{{base_url}}', '').replace('http://localhost:5000', '');
    if (!urlStr.startsWith('/')) urlStr = '/' + urlStr;

    const desc = r.request.description || 'No additional description.';

    md += `#### ${idx + 1}. \`${method}\` ${urlStr}\n\n`;
    md += `**Name:** ${r.name}  \n`;
    md += `**Category:** \`${r.folder}\`  \n`;
    if (desc && desc !== 'No additional description.') {
      md += `**Description:** ${desc}  \n\n`;
    } else {
      md += `\n`;
    }

    // Query params
    const queryParams = r.request.url?.query || [];
    if (queryParams.length > 0) {
      md += `**Query Parameters:**\n\n`;
      md += `| Parameter | Type | Required | Description | Example |\n`;
      md += `| :--- | :--- | :---: | :--- | :--- |\n`;
      queryParams.forEach(q => {
        md += `| \`${q.key}\` | String | Optional | ${q.description || '-'} | \`${q.value || ''}\` |\n`;
      });
      md += `\n`;
    }

    // Request body
    if (r.request.body && r.request.body.mode) {
      md += `**Request Body Content Type:** \`${r.request.body.mode === 'raw' ? 'application/json' : r.request.body.mode}\`\n\n`;
      if (r.request.body.raw) {
        try {
          const parsed = JSON.parse(r.request.body.raw);
          md += `**Request Body (JSON Payload):**\n\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\`\n\n`;
        } catch {
          md += `**Request Body (Raw Payload):**\n\`\`\`\n${r.request.body.raw}\n\`\`\`\n\n`;
        }
      } else if (r.request.body.formdata) {
        md += `**Form Data Fields:**\n\n`;
        md += `| Key | Type | Description |\n| :--- | :--- | :--- |\n`;
        r.request.body.formdata.forEach(f => {
          md += `| \`${f.key}\` | \`${f.type || 'text'}\` | ${f.description || f.value || '-'} |\n`;
        });
        md += `\n`;
      }
    }

    // Expected Response
    if (r.responses && r.responses.length > 0 && r.responses[0].body) {
      try {
        const respParsed = JSON.parse(r.responses[0].body);
        md += `**Sample Success Response (${r.responses[0].code || 200}):**\n\`\`\`json\n${JSON.stringify(respParsed, null, 2)}\n\`\`\`\n\n`;
      } catch {
        md += `**Sample Success Response (${r.responses[0].code || 200}):**\n\`\`\`json\n${r.responses[0].body}\n\`\`\`\n\n`;
      }
    } else {
      // Default schema illustration
      md += `**Standard Response Schema:**\n\`\`\`json\n{\n  "success": true,\n  "statusCode": ${method === 'POST' ? 201 : 200},\n  "message": "Success",\n  "data": {},\n  "meta": {\n    "timestamp": "${new Date().toISOString()}",\n    "requestId": "req_uuid_here"\n  }\n}\n\`\`\`\n\n`;
    }

    md += `---\n\n`;
  });
}

fs.writeFileSync(outputPath, md, 'utf8');
console.log(`Successfully generated frontend API guide: ${outputPath}`);
console.log(`Total documented endpoints: ${allRequests.length}`);
