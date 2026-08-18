# Pravzo Backend - Complete Frontend Integration Guide (API Master Reference)

> **Version:** 2.0.0 (Unified API & Production Verified)  
> **Base URL (Local/Development):** `http://localhost:5000`  
> **Base URL (Production/Staging):** `https://api.pravzo.com` (Configured in `.env`)  
> **Authentication:** Standard JWT Bearer Token in Request Header:  
> `Authorization: Bearer <your_jwt_token>`

---

## 📌 Table of Contents

- [1. Authentication & Common Headers](#1-authentication--common-headers)
- [2. Standard Response Format & Status Codes](#2-standard-response-format--status-codes)
- [3. Module-Wise API Index](#3-module-wise-api-index)
- [4. Complete API Reference & Input / Output Details](#4-complete-api-reference--input--output-details)

---

## 1. Authentication & Common Headers

### Request Headers
All protected API endpoints require the following standard HTTP headers:

| Header Name | Value / Format | Required | Description |
| :--- | :--- | :---: | :--- |
| `Content-Type` | `application/json` | Yes (for POST/PUT/PATCH) | Request body payload type |
| `Authorization` | `Bearer <jwt_token>` | Yes (for protected routes) | Admin or User JWT Session Token |
| `Accept` | `application/json` | Optional | Preferred response media type |

---

## 2. Standard Response Format & Status Codes

All backend endpoints strictly follow the uniform JSON envelope structure:

### ✅ Success Response Structure (200 OK / 201 Created)
```json
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
```

### ⚠️ Paginated Response Data Structure
```json
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
```

### ❌ Error Response Structure (4xx / 5xx)
```json
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
```

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

Total Available Endpoints: **524**

- [00 QUICK START (3 Endpoints)](#00-quick-start)
- [[ADMIN] Authentication (4 Endpoints)](#-admin-authentication)
- [[ADMIN] File Upload (1 Endpoints)](#-admin-file-upload)
- [[ADMIN] Dashboard (10 Endpoints)](#-admin-dashboard)
- [[ADMIN] KYC Management (19 Endpoints)](#-admin-kyc-management)
- [[ADMIN] Users Management (41 Endpoints)](#-admin-users-management)
- [[ADMIN] Rider Management (43 Endpoints)](#-admin-rider-management)
- [[ADMIN] Booking Management (32 Endpoints)](#-admin-booking-management)
- [[ADMIN] Health & Info (3 Endpoints)](#-admin-health-info)
- [[ADMIN] Vehicle & Fleet Management (57 Endpoints)](#-admin-vehicle-fleet-management)
- [[ADMIN] Payment Management (13 Endpoints)](#-admin-payment-management)
- [[ADMIN] Wallet Management (7 Endpoints)](#-admin-wallet-management)
- [[ADMIN] Settlement Management (4 Endpoints)](#-admin-settlement-management)
- [[ADMIN] Commission Management (1 Endpoints)](#-admin-commission-management)
- [[ADMIN] Payment Analytics (9 Endpoints)](#-admin-payment-analytics)
- [[ADMIN] Reports & Analytics (17 Endpoints)](#-admin-reports-analytics)
- [[ADMIN] Admin Management (20 Endpoints)](#-admin-admin-management)
- [[ADMIN] Notifications (18 Endpoints)](#-admin-notifications)
- [[ADMIN] Landing CMS (26 Endpoints)](#-admin-landing-cms)
- [[ADMIN] Branch Management (11 Endpoints)](#-admin-branch-management)
- [[ADMIN] Rental Management (15 Endpoints)](#-admin-rental-management)
- [[ADMIN] Financial System (26 Endpoints)](#-admin-financial-system)
- [[ADMIN] Communication & Events (18 Endpoints)](#-admin-communication-events)
- [[ADMIN] BI & Analytics Dashboard (24 Endpoints)](#-admin-bi-analytics-dashboard)
- [[ADMIN] Super Admin Extensions (v18.0.0) (31 Endpoints)](#-admin-super-admin-extensions-v18-0-0-)
- [[USER] AUTH (9 Endpoints)](#-user-auth)
- [[USER] USERS (9 Endpoints)](#-user-users)
- [[USER] RIDERS (5 Endpoints)](#-user-riders)
- [[USER] VEHICLES (2 Endpoints)](#-user-vehicles)
- [[USER] BOOKINGS (6 Endpoints)](#-user-bookings)
- [[USER] JOBS (4 Endpoints)](#-user-jobs)
- [[USER] NOTIFICATIONS (3 Endpoints)](#-user-notifications)
- [[USER] LOCATION (1 Endpoints)](#-user-location)
- [[USER] WALLET (5 Endpoints)](#-user-wallet)
- [[USER] PAYMENTS (1 Endpoints)](#-user-payments)
- [[USER] PAYOUTS (1 Endpoints)](#-user-payouts)
- [[USER] HISTORY (1 Endpoints)](#-user-history)
- [[USER] FILE UPLOAD (1 Endpoints)](#-user-file-upload)
- [[USER] Role & Rider Upgrade (2 Endpoints)](#-user-role-rider-upgrade)
- [[USER] Coupons (5 Endpoints)](#-user-coupons)
- [[USER] Booking Invoice (1 Endpoints)](#-user-booking-invoice)
- [[USER] Breakdown Reports (2 Endpoints)](#-user-breakdown-reports)
- [[USER] SOS Alerts (3 Endpoints)](#-user-sos-alerts)
- [[USER] Charging Stations (5 Endpoints)](#-user-charging-stations)
- [[USER] Guides / EV Tips (4 Endpoints)](#-user-guides-ev-tips)
- [[USER] Rider Performance (1 Endpoints)](#-user-rider-performance)

---

## 4. Complete API Reference & Input / Output Details


### <a id="00-quick-start"></a> 00 QUICK START

#### 1. `GET` /{{BASE_URL}}/health

**Name:** Health Check  
**Category:** `00 QUICK START`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.151Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `GET` /{{BASE_URL}}/

**Name:** API Root Info  
**Category:** `00 QUICK START`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `POST` /{{BASE_URL}}/api/upload

**Name:** File Upload (Image)  
**Category:** `00 QUICK START`  

**Request Body Content Type:** `formdata`

**Form Data Fields:**

| Key | Type | Description |
| :--- | :--- | :--- |
| `file` | `file` | Upload jpg/png/webp image |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-admin-authentication"></a> [ADMIN] Authentication

#### 1. `POST` /{{BASE_URL}}/api/admin/login

**Name:** Login  
**Category:** `[ADMIN] Authentication`  
**Description:** Login with admin credentials  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "email": "admin@pravzo.com",
  "password": "Admin@123"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `POST` /{{BASE_URL}}/api/admin/refresh-token

**Name:** Refresh Token  
**Category:** `[ADMIN] Authentication`  
**Description:** Get new access token using refresh token  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "refreshToken": "{{REFRESH_TOKEN}}"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `POST` /{{BASE_URL}}/api/admin/logout

**Name:** Logout  
**Category:** `[ADMIN] Authentication`  
**Description:** Logout and invalidate tokens  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "refreshToken": "{{REFRESH_TOKEN}}"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `GET` /{{BASE_URL}}/api/admin/profile

**Name:** Get Profile  
**Category:** `[ADMIN] Authentication`  
**Description:** Get current admin profile  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-admin-file-upload"></a> [ADMIN] File Upload

#### 1. `POST` /{{BASE_URL}}/api/admin/upload

**Name:** Upload File  
**Category:** `[ADMIN] File Upload`  
**Description:** Upload image or PDF file  

**Request Body Content Type:** `formdata`

**Form Data Fields:**

| Key | Type | Description |
| :--- | :--- | :--- |
| `file` | `file` | - |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-admin-dashboard"></a> [ADMIN] Dashboard

#### 1. `GET` /{{BASE_URL}}/api/admin/dashboard/stats

**Name:** Dashboard Stats  
**Category:** `[ADMIN] Dashboard`  
**Description:** Get overall dashboard statistics (Total Users, Riders, Bookings, Revenue, etc.)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `GET` /{{BASE_URL}}/api/admin/dashboard/revenue

**Name:** Revenue Analytics  
**Category:** `[ADMIN] Dashboard`  
**Description:** Get revenue analytics (Today, Weekly, Monthly, Yearly, Growth %)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `GET` /{{BASE_URL}}/api/admin/dashboard/bookings

**Name:** Booking Analytics  
**Category:** `[ADMIN] Dashboard`  
**Description:** Get booking statistics (Completed, Cancelled, Ongoing, Upcoming)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `GET` /{{BASE_URL}}/api/admin/dashboard/vehicles

**Name:** Vehicle Analytics  
**Category:** `[ADMIN] Dashboard`  
**Description:** Get vehicle fleet statistics (Available, In Ride, Maintenance, etc.)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 5. `GET` /{{BASE_URL}}/api/admin/dashboard/support

**Name:** Support Statistics  
**Category:** `[ADMIN] Dashboard`  
**Description:** Get support ticket statistics (Open, Closed, Pending, High Priority)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 6. `GET` /{{BASE_URL}}/api/admin/dashboard/system-alerts

**Name:** System Alerts  
**Category:** `[ADMIN] Dashboard`  
**Description:** Get system alerts (Pending KYC, SOS Requests, Blocked Users, etc.)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 7. `GET` /{{BASE_URL}}/api/admin/dashboard/charts?period=30

**Name:** Charts Data  
**Category:** `[ADMIN] Dashboard`  
**Description:** Get chart data for graphs (Revenue, Bookings, User Growth, Rider Growth)  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | Number of days (1-365) | `30` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 8. `GET` /{{BASE_URL}}/api/admin/dashboard/analytics

**Name:** Analytics  
**Category:** `[ADMIN] Dashboard`  
**Description:** Get top performers analytics (Top Cities, Riders, Vehicles)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 9. `GET` /{{BASE_URL}}/api/admin/dashboard/recent-activities?limit=10

**Name:** Recent Activities  
**Category:** `[ADMIN] Dashboard`  
**Description:** Get recent system activities (User Registered, Booking Created, etc.)  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `limit` | String | Optional | Number of activities (1-100) | `10` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 10. `GET` /{{BASE_URL}}/api/admin/dashboard/overview

**Name:** Dashboard Overview  
**Category:** `[ADMIN] Dashboard`  
**Description:** Get complete dashboard data in one API call (Stats, Revenue, Bookings, Vehicles, Alerts, Activities)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-admin-kyc-management"></a> [ADMIN] KYC Management

#### 1. `GET` /{{BASE_URL}}/api/admin/kyc?page=1&limit=20

**Name:** Get All KYC  
**Category:** `[ADMIN] KYC Management > KYC List & Filters`  
**Description:** Get paginated list of all KYC documents  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | Page number | `1` |
| `limit` | String | Optional | Items per page (1-100) | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `GET` /{{BASE_URL}}/api/admin/kyc?search=john&page=1&limit=20

**Name:** Search KYC  
**Category:** `[ADMIN] KYC Management > KYC List & Filters`  
**Description:** Search KYC by name, phone, email, or document number  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `search` | String | Optional | Search by name, phone, email, document number | `john` |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `GET` /{{BASE_URL}}/api/admin/kyc?status=PENDING&page=1&limit=20

**Name:** Filter by Status  
**Category:** `[ADMIN] KYC Management > KYC List & Filters`  
**Description:** Filter KYC by verification status  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `status` | String | Optional | PENDING, UNDER_REVIEW, APPROVED, REJECTED, REVERIFY_REQUIRED | `PENDING` |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `GET` /{{BASE_URL}}/api/admin/kyc?verificationType=DRIVING_LICENSE&page=1&limit=20

**Name:** Filter by Document Type  
**Category:** `[ADMIN] KYC Management > KYC List & Filters`  
**Description:** Filter KYC by document type  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `verificationType` | String | Optional | DRIVING_LICENSE, AADHAR_CARD, PAN_CARD, BANK_STATEMENT, OTHER | `DRIVING_LICENSE` |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 5. `GET` /{{BASE_URL}}/api/admin/kyc?status=PENDING&city=Mumbai&startDate=2026-01-01&endDate=2026-07-03&sortBy=created_at&sortOrder=DESC&page=1&limit=20

**Name:** Advanced Filters  
**Category:** `[ADMIN] KYC Management > KYC List & Filters`  
**Description:** Combine multiple filters for advanced KYC search  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `status` | String | Optional | - | `PENDING` |
| `city` | String | Optional | Filter by assigned hub/city | `Mumbai` |
| `startDate` | String | Optional | Submission date from | `2026-01-01` |
| `endDate` | String | Optional | Submission date to | `2026-07-03` |
| `sortBy` | String | Optional | created_at, verified_at, user_id | `created_at` |
| `sortOrder` | String | Optional | ASC or DESC | `DESC` |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 6. `GET` /{{BASE_URL}}/api/admin/kyc/pending?page=1&limit=20

**Name:** Get Pending KYC  
**Category:** `[ADMIN] KYC Management > KYC List & Filters`  
**Description:** Get all pending KYC verification requests  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 7. `GET` /{{BASE_URL}}/api/admin/kyc/verified?page=1&limit=20

**Name:** Get Verified KYC  
**Category:** `[ADMIN] KYC Management > KYC List & Filters`  
**Description:** Get all verified KYC documents  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 8. `GET` /{{BASE_URL}}/api/admin/kyc/rejected?page=1&limit=20

**Name:** Get Rejected KYC  
**Category:** `[ADMIN] KYC Management > KYC List & Filters`  
**Description:** Get all rejected KYC documents  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 9. `GET` /{{BASE_URL}}/api/admin/kyc/1

**Name:** Get KYC Details  
**Category:** `[ADMIN] KYC Management > KYC Details & Timeline`  
**Description:** Get complete KYC details including user information and all documents  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 10. `GET` /{{BASE_URL}}/api/admin/kyc/timeline/1

**Name:** Get KYC Timeline  
**Category:** `[ADMIN] KYC Management > KYC Details & Timeline`  
**Description:** Get complete KYC verification timeline for a user (userId)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 11. `GET` /{{BASE_URL}}/api/admin/kyc/download/1

**Name:** Download KYC Document  
**Category:** `[ADMIN] KYC Management > KYC Details & Timeline`  
**Description:** Download a specific KYC document file (documentId)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 12. `PATCH` /{{BASE_URL}}/api/admin/kyc/approve

**Name:** Approve KYC  
**Category:** `[ADMIN] KYC Management > KYC Actions`  
**Description:** Approve a KYC document after verification  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "documentId": 1,
  "remarks": "All documents verified successfully. Driving license is valid and matches user details."
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 13. `PATCH` /{{BASE_URL}}/api/admin/kyc/reject

**Name:** Reject KYC  
**Category:** `[ADMIN] KYC Management > KYC Actions`  
**Description:** Reject a KYC document with reason (reason is required, 10-500 characters)  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "documentId": 1,
  "reason": "Document image is blurry and unreadable. Please upload a clear image.",
  "remarks": "Also ensure that the document is not expired."
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 14. `PATCH` /{{BASE_URL}}/api/admin/kyc/reverify

**Name:** Reverify KYC  
**Category:** `[ADMIN] KYC Management > KYC Actions`  
**Description:** Move KYC back to pending status for re-verification (reason is required)  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "documentId": 1,
  "reason": "Document needs additional verification due to discrepancy in address details."
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 15. `PATCH` /{{BASE_URL}}/api/admin/kyc/update-status

**Name:** Update KYC Status  
**Category:** `[ADMIN] KYC Management > KYC Actions`  
**Description:** Update KYC document status (PENDING, UNDER_REVIEW, APPROVED, REJECTED, REVERIFY_REQUIRED)  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "documentId": 1,
  "status": "UNDER_REVIEW"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 16. `GET` /{{BASE_URL}}/api/admin/kyc/statistics

**Name:** Get KYC Statistics  
**Category:** `[ADMIN] KYC Management > KYC Statistics & Export`  
**Description:** Get overall KYC statistics and metrics (Total, Pending, Approved, Rejected, Today's Requests, etc.)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 17. `GET` /{{BASE_URL}}/api/admin/kyc/export?format=csv

**Name:** Export KYC to CSV  
**Category:** `[ADMIN] KYC Management > KYC Statistics & Export`  
**Description:** Export all KYC data to CSV format  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `format` | String | Optional | Export format (csv, excel) | `csv` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 18. `GET` /{{BASE_URL}}/api/admin/kyc/export?format=excel

**Name:** Export KYC to Excel  
**Category:** `[ADMIN] KYC Management > KYC Statistics & Export`  
**Description:** Export all KYC data to Excel format  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `format` | String | Optional | Export format (csv, excel) | `excel` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 19. `GET` /{{BASE_URL}}/api/admin/kyc/export?format=csv&status=PENDING&startDate=2026-01-01&endDate=2026-07-03

**Name:** Export Filtered KYC  
**Category:** `[ADMIN] KYC Management > KYC Statistics & Export`  
**Description:** Export filtered KYC data with custom filters  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `format` | String | Optional | Export format (csv, excel) | `csv` |
| `status` | String | Optional | Filter by status | `PENDING` |
| `startDate` | String | Optional | Filter by submission date (from) | `2026-01-01` |
| `endDate` | String | Optional | Filter by submission date (to) | `2026-07-03` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-admin-users-management"></a> [ADMIN] Users Management

#### 1. `GET` /{{BASE_URL}}/api/admin/users?page=1&limit=20

**Name:** Get All Users  
**Category:** `[ADMIN] Users Management > User List & Search`  
**Description:** Get paginated list of all users  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | Page number | `1` |
| `limit` | String | Optional | Items per page (1-100) | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `GET` /{{BASE_URL}}/api/admin/users?search=john&page=1&limit=20

**Name:** Search Users  
**Category:** `[ADMIN] Users Management > User List & Search`  
**Description:** Search users by name, phone, email, or employee ID  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `search` | String | Optional | Search by name, phone, email, employee ID | `john` |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `GET` /{{BASE_URL}}/api/admin/users?status=ACTIVE&page=1&limit=20

**Name:** Filter by Status  
**Category:** `[ADMIN] Users Management > User List & Search`  
**Description:** Filter users by status  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `status` | String | Optional | ACTIVE, INACTIVE, BLOCKED, PENDING, SUSPENDED | `ACTIVE` |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `GET` /{{BASE_URL}}/api/admin/users?role=DELIVERY&page=1&limit=20

**Name:** Filter by Role  
**Category:** `[ADMIN] Users Management > User List & Search`  
**Description:** Filter users by role  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `role` | String | Optional | USER, DELIVERY, RENT_A_VEHICLE | `DELIVERY` |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 5. `GET` /{{BASE_URL}}/api/admin/users?status=ACTIVE&role=DELIVERY&city=Mumbai&gender=MALE&verified=true&startDate=2026-01-01&endDate=2026-07-02&sortBy=created_at&sortOrder=DESC&page=1&limit=20

**Name:** Advanced Filters  
**Category:** `[ADMIN] Users Management > User List & Search`  
**Description:** Combine multiple filters for advanced search  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `status` | String | Optional | - | `ACTIVE` |
| `role` | String | Optional | - | `DELIVERY` |
| `city` | String | Optional | Filter by assigned hub/city | `Mumbai` |
| `gender` | String | Optional | MALE, FEMALE, OTHER | `MALE` |
| `verified` | String | Optional | Filter by verification status | `true` |
| `startDate` | String | Optional | Registration date from | `2026-01-01` |
| `endDate` | String | Optional | Registration date to | `2026-07-02` |
| `sortBy` | String | Optional | created_at, full_name, wallet_amount, updated_at | `created_at` |
| `sortOrder` | String | Optional | ASC or DESC | `DESC` |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 6. `GET` /{{BASE_URL}}/api/admin/users/1

**Name:** Get User Profile  
**Category:** `[ADMIN] Users Management > User Profile & Details`  
**Description:** Get complete user profile with addresses, documents, devices, wallet, and statistics  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 7. `GET` /{{BASE_URL}}/api/admin/users/statistics

**Name:** Get User Statistics  
**Category:** `[ADMIN] Users Management > User Profile & Details`  
**Description:** Get overall user statistics (Total, Active, Blocked, Growth, etc.)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 8. `GET` /{{BASE_URL}}/api/admin/users/1/login-history?page=1&limit=20

**Name:** Get Login History  
**Category:** `[ADMIN] Users Management > User Profile & Details`  
**Description:** Get user's device login history with pagination  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 9. `GET` /{{BASE_URL}}/api/admin/users/1/bookings?page=1&limit=20&status=COMPLETED

**Name:** Get User Bookings  
**Category:** `[ADMIN] Users Management > User Profile & Details`  
**Description:** Get user's booking history with pagination and optional status filter  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |
| `status` | String | Optional | Optional: PENDING, CONFIRMED, ACTIVE, COMPLETED, CANCELLED, SOS | `COMPLETED` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 10. `GET` /{{BASE_URL}}/api/admin/users/1/payments?page=1&limit=20&type=BOOKING

**Name:** Get User Payments  
**Category:** `[ADMIN] Users Management > User Profile & Details`  
**Description:** Get user's payment history and refunds with pagination  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |
| `type` | String | Optional | Optional: BOOKING, WALLET, REFUND, PENALTY, COMMISSION, OTHER | `BOOKING` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 11. `GET` /{{BASE_URL}}/api/admin/users/1/activity?limit=20

**Name:** Get User Activity  
**Category:** `[ADMIN] Users Management > User Profile & Details`  
**Description:** Get user's recent activity log (bookings, payments, wallet transactions)  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `limit` | String | Optional | Number of activities (1-50) | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 12. `PATCH` /{{BASE_URL}}/api/admin/users/1/block

**Name:** Block User  
**Category:** `[ADMIN] Users Management > User Actions`  
**Description:** Block user account and logout from all active sessions. Reason is required (10-500 characters).  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "reason": "Fraudulent activity detected during verification process. Multiple fake documents submitted."
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 13. `PATCH` /{{BASE_URL}}/api/admin/users/1/unblock

**Name:** Unblock User  
**Category:** `[ADMIN] Users Management > User Actions`  
**Description:** Unblock a previously blocked user account  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 14. `PATCH` /{{BASE_URL}}/api/admin/users/1/verify

**Name:** Verify User (KYC)  
**Category:** `[ADMIN] Users Management > User Actions`  
**Description:** Manually verify user and their documents. Updates user and all pending documents to VERIFIED status.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "remarks": "All documents verified successfully. Driving license and Aadhar card are valid."
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 15. `PATCH` /{{BASE_URL}}/api/admin/users/1/status

**Name:** Update User Status  
**Category:** `[ADMIN] Users Management > User Actions`  
**Description:** Update user account status. Allowed values: ACTIVE, INACTIVE, SUSPENDED, PENDING  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "status": "SUSPENDED"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 16. `DELETE` /{{BASE_URL}}/api/admin/users/1

**Name:** Delete User (Soft Delete)  
**Category:** `[ADMIN] Users Management > User Actions`  
**Description:** Soft delete user account (never permanently deleted). Reason is required (10-500 characters).  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "reason": "Account closure requested by user via support ticket #456. Verified with user over phone call."
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 17. `GET` /{{BASE_URL}}/api/admin/users/export?format=csv

**Name:** Export Users (CSV)  
**Category:** `[ADMIN] Users Management > Export & Reports`  
**Description:** Export all users to CSV format. Returns file download.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `format` | String | Optional | Required: csv or excel | `csv` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 18. `GET` /{{BASE_URL}}/api/admin/users/export?format=excel

**Name:** Export Users (Excel)  
**Category:** `[ADMIN] Users Management > Export & Reports`  
**Description:** Export all users to Excel format with formatting. Returns file download.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `format` | String | Optional | Required: csv or excel | `excel` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 19. `GET` /{{BASE_URL}}/api/admin/users/export?format=csv&status=ACTIVE&role=DELIVERY&startDate=2026-01-01&endDate=2026-07-02

**Name:** Export with Filters  
**Category:** `[ADMIN] Users Management > Export & Reports`  
**Description:** Export filtered users. All filters from the list endpoint are supported.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `format` | String | Optional | Required: csv or excel | `csv` |
| `status` | String | Optional | Optional: Filter by status | `ACTIVE` |
| `role` | String | Optional | Optional: Filter by role | `DELIVERY` |
| `startDate` | String | Optional | Optional: Registration date from | `2026-01-01` |
| `endDate` | String | Optional | Optional: Registration date to | `2026-07-02` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 20. `PUT` /{{BASE_URL}}/api/admin/users/1

**Name:** Update User Details  
**Category:** `[ADMIN] Users Management > Enterprise User Management`  
**Description:** Update user details (full name, email, phone, address, etc.)  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "full_name": "John Doe Updated",
  "email": "john.updated@example.com",
  "phone_number": "9876543210",
  "address": "New Address, City"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 21. `PATCH` /{{BASE_URL}}/api/admin/users/1/verify-kyc

**Name:** Verify KYC  
**Category:** `[ADMIN] Users Management > Enterprise User Management`  
**Description:** Verify user KYC documents. Status: APPROVED, REJECTED, UNDER_REVIEW, REVERIFY_REQUIRED  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "kycId": 1,
  "status": "APPROVED",
  "remarks": "All documents verified successfully",
  "rejectionReason": ""
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 22. `PATCH` /{{BASE_URL}}/api/admin/users/1/reset-password

**Name:** Reset User Password  
**Category:** `[ADMIN] Users Management > Enterprise User Management`  
**Description:** Reset user password and get temporary password  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 23. `PATCH` /{{BASE_URL}}/api/admin/users/1/transfer-branch

**Name:** Transfer User to Branch  
**Category:** `[ADMIN] Users Management > Enterprise User Management`  
**Description:** Transfer user to different branch. Validates no active rentals, bookings, or settlements.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "branchId": 2,
  "reason": "User relocated to new city",
  "notes": "Transfer requested by user. No active operations."
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 24. `GET` /{{BASE_URL}}/api/admin/users/1/wallet

**Name:** Get User Wallet  
**Category:** `[ADMIN] Users Management > Enterprise User Management`  
**Description:** Get user wallet balance (total, frozen, available)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 25. `GET` /{{BASE_URL}}/api/admin/users/1/wallet/transactions?page=1&limit=20&type=CREDIT&status=COMPLETED

**Name:** Get Wallet Transactions  
**Category:** `[ADMIN] Users Management > Enterprise User Management`  
**Description:** Get user wallet transaction history with pagination and filters  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |
| `type` | String | Optional | CREDIT or DEBIT | `CREDIT` |
| `status` | String | Optional | PENDING, COMPLETED, FAILED, REVERSED | `COMPLETED` |
| `startDate` | String | Optional | - | `2024-01-01` |
| `endDate` | String | Optional | - | `2024-12-31` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 26. `POST` /{{BASE_URL}}/api/admin/users/1/wallet/credit

**Name:** Credit User Wallet  
**Category:** `[ADMIN] Users Management > Enterprise User Management`  
**Description:** Credit amount to user wallet  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "amount": 500,
  "description": "Promotional credit for new user",
  "referenceType": "PROMOTION",
  "referenceId": "PROMO001",
  "paymentMethod": "ADMIN_CREDIT",
  "paymentReference": "REF123456"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 27. `POST` /{{BASE_URL}}/api/admin/users/1/wallet/debit

**Name:** Debit User Wallet  
**Category:** `[ADMIN] Users Management > Enterprise User Management`  
**Description:** Debit amount from user wallet (validates sufficient balance)  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "amount": 100,
  "description": "Penalty for late return",
  "referenceType": "PENALTY",
  "referenceId": "PEN001",
  "notes": "Applied penalty for 2 days late return"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 28. `GET` /{{BASE_URL}}/api/admin/users/1/rentals?page=1&limit=20&status=ACTIVE

**Name:** Get User Rentals  
**Category:** `[ADMIN] Users Management > Enterprise User Management`  
**Description:** Get user rental history with pagination  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |
| `status` | String | Optional | ACTIVE, COMPLETED, CANCELLED, PENDING | `ACTIVE` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 29. `GET` /{{BASE_URL}}/api/admin/users/1/jobs?page=1&limit=20

**Name:** Get User Jobs  
**Category:** `[ADMIN] Users Management > Enterprise User Management`  
**Description:** Get user job/trip history (for delivery riders)  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |
| `status` | String | Optional | - | `COMPLETED` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 30. `GET` /{{BASE_URL}}/api/admin/users/1/activity-timeline?page=1&limit=50

**Name:** Get Activity Timeline  
**Category:** `[ADMIN] Users Management > Enterprise User Management`  
**Description:** Get comprehensive user activity timeline (20+ activity types tracked)  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `50` |
| `activityType` | String | Optional | - | `WALLET_CREDIT` |
| `startDate` | String | Optional | - | `2024-01-01` |
| `endDate` | String | Optional | - | `2024-12-31` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 31. `GET` /{{BASE_URL}}/api/admin/users/1/login-history-detailed?page=1&limit=20

**Name:** Get Login History (Detailed)  
**Category:** `[ADMIN] Users Management > Enterprise User Management`  
**Description:** Get detailed login history with device info, geo-location, session duration  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |
| `status` | String | Optional | SUCCESS, FAILED, BLOCKED, SUSPENDED | `SUCCESS` |
| `startDate` | String | Optional | - | `2024-01-01` |
| `endDate` | String | Optional | - | `2024-12-31` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 32. `GET` /{{BASE_URL}}/api/admin/users/1/devices

**Name:** Get User Devices  
**Category:** `[ADMIN] Users Management > Enterprise User Management`  
**Description:** Get all registered user devices with platform, browser, and trust status  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 33. `GET` /{{BASE_URL}}/api/admin/users/1/documents

**Name:** Get User Documents  
**Category:** `[ADMIN] Users Management > Enterprise User Management`  
**Description:** Get all uploaded user documents  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 34. `GET` /{{BASE_URL}}/api/admin/users/1/kyc

**Name:** Get KYC Details  
**Category:** `[ADMIN] Users Management > Enterprise User Management`  
**Description:** Get complete KYC verification details and history  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 35. `GET` /{{BASE_URL}}/api/admin/users/1/branch-history

**Name:** Get Branch Assignment History  
**Category:** `[ADMIN] Users Management > Enterprise User Management`  
**Description:** Get complete branch assignment and transfer history  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 36. `GET` /{{BASE_URL}}/api/admin/users/1/rentals?page=1&limit=20

**Name:** Get User Rentals  
**Category:** `[ADMIN] Users Management > Enterprise User Management`  
**Description:** Get user rental history  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 37. `GET` /{{BASE_URL}}/api/admin/users/1/jobs?page=1&limit=20

**Name:** Get User Jobs  
**Category:** `[ADMIN] Users Management > Enterprise User Management`  
**Description:** Get user job history  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 38. `GET` /{{BASE_URL}}/api/admin/users/1/activity-timeline?limit=50

**Name:** Get Activity Timeline  
**Category:** `[ADMIN] Users Management > Enterprise User Management`  
**Description:** Get detailed user activity timeline (enterprise version)  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `limit` | String | Optional | - | `50` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 39. `GET` /{{BASE_URL}}/api/admin/users/1/login-history-detailed?limit=20

**Name:** Get Login History (Detailed)  
**Category:** `[ADMIN] Users Management > Enterprise User Management`  
**Description:** Get detailed login history with device & security info  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 40. `GET` /{{BASE_URL}}/api/admin/users/1/devices

**Name:** Get User Devices  
**Category:** `[ADMIN] Users Management > Enterprise User Management`  
**Description:** Get user registered devices  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 41. `GET` /{{BASE_URL}}/api/admin/users/1/branch-history

**Name:** Get Branch Assignment History  
**Category:** `[ADMIN] Users Management > Enterprise User Management`  
**Description:** Get user branch assignment history  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-admin-rider-management"></a> [ADMIN] Rider Management

#### 1. `GET` /{{BASE_URL}}/api/admin/riders?page=1&limit=20

**Name:** Get All Riders  
**Category:** `[ADMIN] Rider Management > Rider List & Search`  
**Description:** Get paginated list of all riders with complete details  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | Page number | `1` |
| `limit` | String | Optional | Items per page (1-100) | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `GET` /{{BASE_URL}}/api/admin/riders?search=john&page=1&limit=20

**Name:** Search Riders  
**Category:** `[ADMIN] Rider Management > Rider List & Search`  
**Description:** Search riders by name, phone, email, or rider code  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `search` | String | Optional | Search by name, phone, email, rider code | `john` |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `GET` /{{BASE_URL}}/api/admin/riders?status=ACTIVE&page=1&limit=20

**Name:** Filter by Status  
**Category:** `[ADMIN] Rider Management > Rider List & Search`  
**Description:** Filter riders by status  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `status` | String | Optional | ACTIVE, INACTIVE, OFFLINE, ONLINE, SUSPENDED, UNDER_REVIEW | `ACTIVE` |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `GET` /{{BASE_URL}}/api/admin/riders?onlineStatus=ONLINE&page=1&limit=20

**Name:** Filter by Online Status  
**Category:** `[ADMIN] Rider Management > Rider List & Search`  
**Description:** Filter riders by online status  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `onlineStatus` | String | Optional | ONLINE, OFFLINE | `ONLINE` |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 5. `GET` /{{BASE_URL}}/api/admin/riders?availability=AVAILABLE&page=1&limit=20

**Name:** Filter by Availability  
**Category:** `[ADMIN] Rider Management > Rider List & Search`  
**Description:** Filter riders by availability status  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `availability` | String | Optional | AVAILABLE, BUSY, OFFLINE | `AVAILABLE` |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 6. `GET` /{{BASE_URL}}/api/admin/riders?kycStatus=APPROVED&page=1&limit=20

**Name:** Filter by KYC Status  
**Category:** `[ADMIN] Rider Management > Rider List & Search`  
**Description:** Filter riders by KYC verification status  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `kycStatus` | String | Optional | PENDING, APPROVED, REJECTED, REVERIFY_REQUIRED | `APPROVED` |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 7. `GET` /{{BASE_URL}}/api/admin/riders?minRating=4.0&maxRating=5.0&page=1&limit=20

**Name:** Filter by Rating  
**Category:** `[ADMIN] Rider Management > Rider List & Search`  
**Description:** Filter riders by rating range  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `minRating` | String | Optional | Minimum rating (0-5) | `4.0` |
| `maxRating` | String | Optional | Maximum rating (0-5) | `5.0` |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 8. `GET` /{{BASE_URL}}/api/admin/riders?status=ACTIVE&city=Mumbai&onlineStatus=ONLINE&availability=AVAILABLE&kycStatus=APPROVED&minRating=4.0&vehicleType=Bike&startDate=2026-01-01&endDate=2026-07-04&sortBy=rating&sortOrder=DESC&page=1&limit=20

**Name:** Advanced Filters  
**Category:** `[ADMIN] Rider Management > Rider List & Search`  
**Description:** Combine multiple filters for advanced rider search  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `status` | String | Optional | - | `ACTIVE` |
| `city` | String | Optional | Filter by assigned city | `Mumbai` |
| `onlineStatus` | String | Optional | - | `ONLINE` |
| `availability` | String | Optional | - | `AVAILABLE` |
| `kycStatus` | String | Optional | - | `APPROVED` |
| `minRating` | String | Optional | Minimum rating | `4.0` |
| `vehicleType` | String | Optional | Filter by vehicle type | `Bike` |
| `startDate` | String | Optional | Registration date from | `2026-01-01` |
| `endDate` | String | Optional | Registration date to | `2026-07-04` |
| `sortBy` | String | Optional | created_at, full_name, rating, total_earnings, completed_trips | `rating` |
| `sortOrder` | String | Optional | ASC or DESC | `DESC` |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 9. `GET` /{{BASE_URL}}/api/admin/riders/1

**Name:** Get Rider Profile  
**Category:** `[ADMIN] Rider Management > Rider Profile & Details`  
**Description:** Get complete rider profile with vehicle, earnings, documents, devices, wallet, and statistics  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 10. `GET` /{{BASE_URL}}/api/admin/riders/1/current-booking

**Name:** Get Rider Current Booking  
**Category:** `[ADMIN] Rider Management > Rider Profile & Details`  
**Description:** Get rider's currently active booking (if any)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 11. `GET` /{{BASE_URL}}/api/admin/riders/1/bookings?page=1&limit=20&status=COMPLETED

**Name:** Get Rider Bookings  
**Category:** `[ADMIN] Rider Management > Rider Profile & Details`  
**Description:** Get rider's booking history with pagination and optional status filter  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |
| `status` | String | Optional | Optional: PENDING, ACCEPTED, PICKED_UP, IN_TRANSIT, COMPLETED, CANCELLED | `COMPLETED` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 12. `GET` /{{BASE_URL}}/api/admin/riders/1/payments?page=1&limit=20&type=EARNING

**Name:** Get Rider Payments  
**Category:** `[ADMIN] Rider Management > Rider Profile & Details`  
**Description:** Get rider's payment history (earnings, wallet, settlements, bonuses, etc.)  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |
| `type` | String | Optional | Optional: EARNING, WALLET, SETTLEMENT, BONUS, INCENTIVE, PENALTY, REFUND | `EARNING` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 13. `GET` /{{BASE_URL}}/api/admin/riders/1/activity?limit=20

**Name:** Get Rider Activity  
**Category:** `[ADMIN] Rider Management > Rider Profile & Details`  
**Description:** Get rider's recent activity log (trips, wallet transactions, admin actions)  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `limit` | String | Optional | Number of activities (1-50) | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 14. `GET` /{{BASE_URL}}/api/admin/riders/1/live-location

**Name:** Get Rider Live Location  
**Category:** `[ADMIN] Rider Management > Rider Profile & Details`  
**Description:** Get rider's current GPS location with speed, heading, battery, and online status  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 15. `PATCH` /{{BASE_URL}}/api/admin/riders/1/block

**Name:** Block Rider  
**Category:** `[ADMIN] Rider Management > Rider Actions`  
**Description:** Block rider account and force logout from all active sessions. Reason is required (10-500 characters).  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "reason": "Multiple customer complaints about reckless driving. Safety violation. (10-500 characters required)"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 16. `PATCH` /{{BASE_URL}}/api/admin/riders/1/unblock

**Name:** Unblock Rider  
**Category:** `[ADMIN] Rider Management > Rider Actions`  
**Description:** Unblock a previously blocked rider account  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 17. `PATCH` /{{BASE_URL}}/api/admin/riders/1/status

**Name:** Update Rider Status  
**Category:** `[ADMIN] Rider Management > Rider Actions`  
**Description:** Update rider status (ACTIVE, INACTIVE, OFFLINE, ONLINE, SUSPENDED, UNDER_REVIEW)  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "status": "SUSPENDED"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 18. `PATCH` /{{BASE_URL}}/api/admin/riders/1/kyc

**Name:** Update Rider KYC  
**Category:** `[ADMIN] Rider Management > Rider Actions`  
**Description:** Update rider KYC verification status (APPROVED, REJECTED, REVERIFY_REQUIRED)  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "kycStatus": "APPROVED",
  "remarks": "All documents verified successfully. Driving license and vehicle registration confirmed."
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 19. `PATCH` /{{BASE_URL}}/api/admin/riders/1/vehicle

**Name:** Assign Vehicle to Rider  
**Category:** `[ADMIN] Rider Management > Rider Actions`  
**Description:** Assign a vehicle to rider. Actions: ASSIGN, REMOVE, REPLACE, UPDATE  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "vehicleId": 5,
  "action": "ASSIGN"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 20. `PATCH` /{{BASE_URL}}/api/admin/riders/1/vehicle

**Name:** Replace Rider Vehicle  
**Category:** `[ADMIN] Rider Management > Rider Actions`  
**Description:** Replace rider's current vehicle with a new one  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "vehicleId": 8,
  "action": "REPLACE"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 21. `PATCH` /{{BASE_URL}}/api/admin/riders/1/vehicle

**Name:** Remove Rider Vehicle  
**Category:** `[ADMIN] Rider Management > Rider Actions`  
**Description:** Remove vehicle assignment from rider  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "action": "REMOVE"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 22. `PATCH` /{{BASE_URL}}/api/admin/riders/1/location

**Name:** Update Rider Location  
**Category:** `[ADMIN] Rider Management > Rider Actions`  
**Description:** Update rider's GPS location (latitude, longitude, speed, heading, battery)  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "latitude": 19.076,
  "longitude": 72.8777,
  "speed": 45.5,
  "heading": 180,
  "battery": 85
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 23. `PATCH` /{{BASE_URL}}/api/admin/riders/1/availability

**Name:** Update Rider Availability  
**Category:** `[ADMIN] Rider Management > Rider Actions`  
**Description:** Update rider availability status (AVAILABLE, BUSY, OFFLINE). Note: Blocked riders cannot be AVAILABLE, and KYC must be approved.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "availability": "AVAILABLE"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 24. `GET` /{{BASE_URL}}/api/admin/riders/statistics

**Name:** Get Rider Statistics  
**Category:** `[ADMIN] Rider Management > Rider Statistics & Export`  
**Description:** Get overall rider statistics (Total, Online, Offline, Blocked, Verified, Pending KYC, Today's/Weekly/Monthly Joined, Growth %, Avg Rating, Avg Earnings, Avg Acceptance Rate, Avg Completion Rate)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 25. `GET` /{{BASE_URL}}/api/admin/riders/export?format=csv

**Name:** Export Riders to CSV  
**Category:** `[ADMIN] Rider Management > Rider Statistics & Export`  
**Description:** Export all rider data to CSV format  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `format` | String | Optional | Export format (csv, excel) | `csv` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 26. `GET` /{{BASE_URL}}/api/admin/riders/export?format=excel

**Name:** Export Riders to Excel  
**Category:** `[ADMIN] Rider Management > Rider Statistics & Export`  
**Description:** Export all rider data to Excel format with formatting  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `format` | String | Optional | Export format (csv, excel) | `excel` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 27. `GET` /{{BASE_URL}}/api/admin/riders/export?format=csv&status=ACTIVE&city=Mumbai&kycStatus=APPROVED&startDate=2026-01-01&endDate=2026-07-04

**Name:** Export Filtered Riders  
**Category:** `[ADMIN] Rider Management > Rider Statistics & Export`  
**Description:** Export filtered rider data with custom filters  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `format` | String | Optional | Export format (csv, excel) | `csv` |
| `status` | String | Optional | Optional: Filter by status | `ACTIVE` |
| `city` | String | Optional | Optional: Filter by city | `Mumbai` |
| `kycStatus` | String | Optional | Optional: Filter by KYC status | `APPROVED` |
| `startDate` | String | Optional | Optional: Registration date from | `2026-01-01` |
| `endDate` | String | Optional | Optional: Registration date to | `2026-07-04` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 28. `POST` /{{BASE_URL}}/api/admin/riders

**Name:** Create Rider  
**Category:** `[ADMIN] Rider Management > Enterprise Rider Management`  
**Description:** Create new rider with complete profile information  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "fullName": "John Doe",
  "phoneNumber": "9876543210",
  "email": "john.doe@example.com",
  "dateOfBirth": "1990-01-15",
  "gender": "MALE",
  "address": "123 Main Street, City",
  "assignedCity": "Mumbai",
  "assignedZone": "Zone A",
  "branchId": 1,
  "drivingLicenseNumber": "DL1234567890",
  "aadharNumber": "123456789012",
  "bankAccountNumber": "1234567890",
  "ifscCode": "SBIN0001234",
  "branchName": "State Bank Main Branch",
  "emergencyContactName": "Jane Doe",
  "emergencyContactNumber": "9876543211"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 29. `PUT` /{{BASE_URL}}/api/admin/riders/1

**Name:** Update Rider  
**Category:** `[ADMIN] Rider Management > Enterprise Rider Management`  
**Description:** Update existing rider details  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "fullName": "John Updated",
  "email": "john.updated@example.com",
  "address": "456 New Street",
  "emergencyContactName": "Jane Updated",
  "emergencyContactNumber": "9876543299"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 30. `PATCH` /{{BASE_URL}}/api/admin/riders/1/verify-kyc

**Name:** Verify Rider KYC  
**Category:** `[ADMIN] Rider Management > Enterprise Rider Management`  
**Description:** Verify rider KYC documents (Approve/Reject)  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "kycId": 1,
  "status": "APPROVED",
  "remarks": "All documents verified successfully"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 31. `POST` /{{BASE_URL}}/api/admin/riders/1/assign-branch

**Name:** Assign Branch  
**Category:** `[ADMIN] Rider Management > Enterprise Rider Management`  
**Description:** Assign rider to a branch  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "branchId": 2,
  "assignmentType": "PRIMARY"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 32. `PATCH` /{{BASE_URL}}/api/admin/riders/1/transfer-branch

**Name:** Transfer Branch  
**Category:** `[ADMIN] Rider Management > Enterprise Rider Management`  
**Description:** Transfer rider to another branch (requires: no active bookings, no assigned vehicle)  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "toBranchId": 3,
  "transferReason": "Branch capacity rebalancing and workload distribution"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 33. `POST` /{{BASE_URL}}/api/admin/riders/1/assign-vehicle

**Name:** Assign Vehicle  
**Category:** `[ADMIN] Rider Management > Enterprise Rider Management`  
**Description:** Assign vehicle to rider (validates: same branch, KYC approved, no maintenance, no active rental)  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "vehicleId": 5,
  "assignmentReason": "Regular assignment for daily operations",
  "odometerStart": 12500.5
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 34. `PATCH` /{{BASE_URL}}/api/admin/riders/1/remove-vehicle

**Name:** Remove Vehicle  
**Category:** `[ADMIN] Rider Management > Enterprise Rider Management`  
**Description:** Remove vehicle from rider (validates: no active booking)  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "removalReason": "End of assignment period, vehicle maintenance required",
  "odometerEnd": 15600.75
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 35. `GET` /{{BASE_URL}}/api/admin/riders/1/vehicle

**Name:** Get Rider Vehicle  
**Category:** `[ADMIN] Rider Management > Enterprise Rider Management`  
**Description:** Get rider's current assigned vehicle with assignment details  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 36. `GET` /{{BASE_URL}}/api/admin/riders/1/performance?periodType=MONTHLY

**Name:** Get Rider Performance  
**Category:** `[ADMIN] Rider Management > Enterprise Rider Management`  
**Description:** Get rider performance metrics by period (trips, rates, hours, distance, earnings, rating)  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `periodType` | String | Optional | DAILY, WEEKLY, MONTHLY, YEARLY | `MONTHLY` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 37. `GET` /{{BASE_URL}}/api/admin/riders/1/earnings

**Name:** Get Rider Earnings  
**Category:** `[ADMIN] Rider Management > Enterprise Rider Management`  
**Description:** Get rider earnings summary (today, lifetime, pending settlement, last settlement)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 38. `GET` /{{BASE_URL}}/api/admin/riders/1/wallet

**Name:** Get Rider Wallet  
**Category:** `[ADMIN] Rider Management > Enterprise Rider Management`  
**Description:** Get rider wallet details (balance, pending, frozen, lifetime earnings)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 39. `GET` /{{BASE_URL}}/api/admin/riders/1/wallet/transactions?page=1&limit=20

**Name:** Get Rider Wallet Transactions  
**Category:** `[ADMIN] Rider Management > Enterprise Rider Management`  
**Description:** Get rider wallet transaction history with pagination  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 40. `GET` /{{BASE_URL}}/api/admin/riders/1/jobs?status=COMPLETED&limit=20

**Name:** Get Rider Jobs  
**Category:** `[ADMIN] Rider Management > Enterprise Rider Management`  
**Description:** Get rider job history with filtering options  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `status` | String | Optional | Optional: Filter by status | `COMPLETED` |
| `startDate` | String | Optional | Optional: Filter by date | `2026-01-01` |
| `endDate` | String | Optional | Optional: Filter by date | `2026-07-20` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 41. `GET` /{{BASE_URL}}/api/admin/riders/1/activity?limit=50

**Name:** Get Rider Activity Timeline  
**Category:** `[ADMIN] Rider Management > Enterprise Rider Management`  
**Description:** Get rider activity timeline (all actions performed on rider account)  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `activityType` | String | Optional | Optional: Filter by activity type | `VEHICLE_ASSIGNMENT` |
| `startDate` | String | Optional | Optional: Filter by date | `2026-01-01` |
| `endDate` | String | Optional | Optional: Filter by date | `2026-07-20` |
| `limit` | String | Optional | - | `50` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 42. `GET` /{{BASE_URL}}/api/admin/riders/1/login-history?limit=20

**Name:** Get Rider Login History  
**Category:** `[ADMIN] Rider Management > Enterprise Rider Management`  
**Description:** Get rider login history with device details, IP, location, and security info  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 43. `GET` /{{BASE_URL}}/api/admin/riders/1/documents

**Name:** Get Rider Documents  
**Category:** `[ADMIN] Rider Management > Enterprise Rider Management`  
**Description:** Get all rider documents with verification status and expiry details  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-admin-booking-management"></a> [ADMIN] Booking Management

#### 1. `GET` /{{BASE_URL}}/api/admin/bookings?page=1&limit=20

**Name:** Get All Bookings  
**Category:** `[ADMIN] Booking Management > Read Operations`  
**Description:** Get paginated list of all bookings with complete details  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | Page number | `1` |
| `limit` | String | Optional | Items per page (1-100) | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `GET` /{{BASE_URL}}/api/admin/bookings?search=john&status=COMPLETED&city=Mumbai&startDate=2026-07-01&endDate=2026-07-06&sortBy=created_at&sortOrder=DESC&page=1&limit=20

**Name:** Search & Filter Bookings  
**Category:** `[ADMIN] Booking Management > Read Operations`  
**Description:** Search and filter bookings with advanced filters  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `search` | String | Optional | Search by booking ID, customer name, rider name | `john` |
| `status` | String | Optional | PENDING, ACCEPTED, PICKED_UP, IN_TRANSIT, COMPLETED, CANCELLED, REJECTED | `COMPLETED` |
| `city` | String | Optional | Filter by city | `Mumbai` |
| `startDate` | String | Optional | Booking date from (ISO 8601) | `2026-07-01` |
| `endDate` | String | Optional | Booking date to (ISO 8601) | `2026-07-06` |
| `sortBy` | String | Optional | created_at, fare_amount, distance | `created_at` |
| `sortOrder` | String | Optional | ASC or DESC | `DESC` |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `GET` /{{BASE_URL}}/api/admin/bookings/1

**Name:** Get Booking Details  
**Category:** `[ADMIN] Booking Management > Read Operations`  
**Description:** Get complete booking details including customer, rider, vehicle, fare breakdown, timeline  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `GET` /{{BASE_URL}}/api/admin/bookings/statistics

**Name:** Get Booking Statistics  
**Category:** `[ADMIN] Booking Management > Read Operations`  
**Description:** Get booking statistics (Today, Weekly, Monthly, Completion Rate, Cancellation Rate, Average Fare, etc.)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 5. `GET` /{{BASE_URL}}/api/admin/bookings/export?format=csv

**Name:** Export Bookings (CSV)  
**Category:** `[ADMIN] Booking Management > Read Operations`  
**Description:** Export all bookings to CSV format. All filters supported.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `format` | String | Optional | Required: csv or excel | `csv` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 6. `GET` /{{BASE_URL}}/api/admin/bookings/export?format=excel&status=COMPLETED&startDate=2026-07-01&endDate=2026-07-06

**Name:** Export Bookings (Excel)  
**Category:** `[ADMIN] Booking Management > Read Operations`  
**Description:** Export filtered bookings to Excel format with formatting.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `format` | String | Optional | Required: csv or excel | `excel` |
| `status` | String | Optional | Optional: Filter by status | `COMPLETED` |
| `startDate` | String | Optional | Optional: Filter by date range | `2026-07-01` |
| `endDate` | String | Optional | - | `2026-07-06` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 7. `GET` /{{BASE_URL}}/api/admin/bookings/1/invoice

**Name:** Get Booking Invoice  
**Category:** `[ADMIN] Booking Management > Read Operations`  
**Description:** Generate booking invoice with complete fare breakdown  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 8. `GET` /{{BASE_URL}}/api/admin/bookings/1/timeline

**Name:** Get Booking Timeline  
**Category:** `[ADMIN] Booking Management > Read Operations`  
**Description:** Get complete booking timeline (Created, Accepted, Picked Up, Completed/Cancelled)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 9. `GET` /{{BASE_URL}}/api/admin/bookings/1/live

**Name:** Get Live Tracking  
**Category:** `[ADMIN] Booking Management > Read Operations`  
**Description:** Get real-time GPS tracking status for active booking  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 10. `PATCH` /{{BASE_URL}}/api/admin/bookings/1/cancel

**Name:** Cancel Booking  
**Category:** `[ADMIN] Booking Management > Operational APIs`  
**Description:** Cancel a booking. Reason required (10-500 chars). CancelledBy: ADMIN, CUSTOMER, RIDER, SYSTEM  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "reason": "Customer requested cancellation due to change in plans",
  "cancelledBy": "ADMIN"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 11. `PATCH` /{{BASE_URL}}/api/admin/bookings/1/assign-rider

**Name:** Assign Rider to Booking  
**Category:** `[ADMIN] Booking Management > Operational APIs`  
**Description:** BUG-0005 FIX: Assign a verified VEHICLE_WITH_JOB rider to a booking. Admin-only operation (moved from user routes to admin routes). Requires rider_id in body. Rider must have role=VEHICLE_WITH_JOB and application_status=verified.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "rider_id": 1
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 12. `PATCH` /{{BASE_URL}}/api/admin/bookings/1/reschedule

**Name:** Reschedule Booking  
**Category:** `[ADMIN] Booking Management > Operational APIs`  
**Description:** Reschedule booking to new pickup time (ISO 8601 format)  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "newPickupTime": "2026-07-07T10:00:00Z"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 13. `PATCH` /{{BASE_URL}}/api/admin/bookings/1/refund

**Name:** Process Refund  
**Category:** `[ADMIN] Booking Management > Operational APIs`  
**Description:** Process booking refund. Refund amount cannot exceed fare. Updates wallet balance.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "refundAmount": 80,
  "refundReason": "Service issue - customer dissatisfaction with rider behavior"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 14. `PATCH` /{{BASE_URL}}/api/admin/bookings/1/reassign-rider

**Name:** Reassign Rider  
**Category:** `[ADMIN] Booking Management > Operational APIs`  
**Description:** Reassign booking to different rider. New rider must be ACTIVE, ONLINE, and AVAILABLE.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "newRiderId": 15,
  "reason": "Original rider unavailable due to vehicle breakdown"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 15. `PATCH` /{{BASE_URL}}/api/admin/bookings/1/contact-rider

**Name:** Contact Rider  
**Category:** `[ADMIN] Booking Management > Operational APIs`  
**Description:** Send message to rider (SMS/Notification integration required)  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "message": "Please pick up customer from alternate entrance on the east side"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 16. `PATCH` /{{BASE_URL}}/api/admin/bookings/1/contact-user

**Name:** Contact User  
**Category:** `[ADMIN] Booking Management > Operational APIs`  
**Description:** Send message to customer (SMS/Notification integration required)  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "message": "Your rider will arrive in 5 minutes. Please be ready."
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 17. `PATCH` /{{BASE_URL}}/api/admin/bookings/1/manual-complete

**Name:** Manual Complete  
**Category:** `[ADMIN] Booking Management > Operational APIs`  
**Description:** Manually complete booking. Final fare and completion notes optional.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "finalFare": 95.5,
  "completionNotes": "Completed manually due to GPS tracking issue"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 18. `PATCH` /{{BASE_URL}}/api/admin/bookings/1/manual-start

**Name:** Manual Start Trip  
**Category:** `[ADMIN] Booking Management > Operational APIs`  
**Description:** Manually start trip. Updates status to IN_TRANSIT. Only for ACCEPTED bookings.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 19. `PATCH` /{{BASE_URL}}/api/admin/bookings/1/manual-arrival

**Name:** Manual Mark Arrival  
**Category:** `[ADMIN] Booking Management > Operational APIs`  
**Description:** Manually mark rider arrival. Updates status to PICKED_UP. Only for ACCEPTED bookings.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 20. `PATCH` /{{BASE_URL}}/api/admin/bookings/1/update-payment

**Name:** Update Payment Status  
**Category:** `[ADMIN] Booking Management > Operational APIs`  
**Description:** Update payment status. PaymentStatus: PENDING, SUCCESS, FAILED, REFUNDED. PaymentMethod: CASH, CARD, WALLET, UPI, NET_BANKING  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "paymentStatus": "SUCCESS",
  "paymentMethod": "CARD",
  "transactionId": "TXN123456789"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 21. `PATCH` /{{BASE_URL}}/api/admin/bookings/1/update-fare

**Name:** Update Fare  
**Category:** `[ADMIN] Booking Management > Operational APIs`  
**Description:** Update booking fare. Cannot update for completed bookings. Stores old fare in audit log.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "newFare": 120,
  "reason": "Added 2 extra stops as per customer request"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 22. `PATCH` /{{BASE_URL}}/api/admin/bookings/1/update-status

**Name:** Update Status  
**Category:** `[ADMIN] Booking Management > Operational APIs`  
**Description:** Update booking status with transition validation. Valid transitions enforced.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "newStatus": "PICKED_UP",
  "reason": "Customer confirmed pickup via phone call"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 23. `GET` /{{BASE_URL}}/api/admin/bookings/analytics/revenue?period=month

**Name:** Revenue Analytics  
**Category:** `[ADMIN] Booking Management > Analytics APIs`  
**Description:** Get revenue analytics with period or custom date range  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | today, week, month, year, or use startDate/endDate for custom | `month` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 24. `GET` /{{BASE_URL}}/api/admin/bookings/analytics/top-cities?period=month&limit=10

**Name:** Top Cities  
**Category:** `[ADMIN] Booking Management > Analytics APIs`  
**Description:** Get top performing cities by bookings and revenue  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | - | `month` |
| `limit` | String | Optional | Number of cities (1-50) | `10` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 25. `GET` /{{BASE_URL}}/api/admin/bookings/analytics/top-riders?period=month&limit=10

**Name:** Top Riders  
**Category:** `[ADMIN] Booking Management > Analytics APIs`  
**Description:** Get top performing riders by completed trips and earnings  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | - | `month` |
| `limit` | String | Optional | Number of riders (1-50) | `10` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 26. `GET` /{{BASE_URL}}/api/admin/bookings/analytics/top-users?period=month&limit=10

**Name:** Top Users  
**Category:** `[ADMIN] Booking Management > Analytics APIs`  
**Description:** Get top spending users by total bookings and amount spent  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | - | `month` |
| `limit` | String | Optional | Number of users (1-50) | `10` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 27. `GET` /{{BASE_URL}}/api/admin/bookings/analytics/peak-hours?period=week

**Name:** Peak Hours  
**Category:** `[ADMIN] Booking Management > Analytics APIs`  
**Description:** Get peak booking hours for resource allocation and surge pricing  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | - | `week` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 28. `GET` /{{BASE_URL}}/api/admin/bookings/analytics/cancellation-report?period=month

**Name:** Cancellation Report  
**Category:** `[ADMIN] Booking Management > Analytics APIs`  
**Description:** Get cancellation analysis with daily trends and rates  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | - | `month` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 29. `GET` /{{BASE_URL}}/api/admin/bookings/analytics/payment-report?period=month

**Name:** Payment Report  
**Category:** `[ADMIN] Booking Management > Analytics APIs`  
**Description:** Get payment analysis by method, success rate, and net revenue  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | - | `month` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 30. `GET` /{{BASE_URL}}/api/admin/bookings/analytics/daily-report?startDate=2026-07-01&endDate=2026-07-06

**Name:** Daily Report  
**Category:** `[ADMIN] Booking Management > Analytics APIs`  
**Description:** Get daily booking report with metrics for each day  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `startDate` | String | Optional | Custom date range start (ISO 8601) | `2026-07-01` |
| `endDate` | String | Optional | Custom date range end (ISO 8601) | `2026-07-06` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 31. `GET` /{{BASE_URL}}/api/admin/bookings/analytics/monthly-report?year=2026

**Name:** Monthly Report  
**Category:** `[ADMIN] Booking Management > Analytics APIs`  
**Description:** Get monthly booking report with metrics for each month  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `year` | String | Optional | Year for monthly breakdown (defaults to current year) | `2026` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 32. `GET` /{{BASE_URL}}/api/admin/bookings/analytics/yearly-report

**Name:** Yearly Report  
**Category:** `[ADMIN] Booking Management > Analytics APIs`  
**Description:** Get yearly booking report for year-over-year comparison  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-admin-health-info"></a> [ADMIN] Health & Info

#### 1. `GET` /{{BASE_URL}}/health

**Name:** Health Check  
**Category:** `[ADMIN] Health & Info`  
**Description:** Check server health  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `GET` /{{BASE_URL}}/

**Name:** Root  
**Category:** `[ADMIN] Health & Info`  
**Description:** API information  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `GET` /{{BASE_URL}}/api

**Name:** API Info  
**Category:** `[ADMIN] Health & Info`  
**Description:** API endpoints information  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-admin-vehicle-fleet-management"></a> [ADMIN] Vehicle & Fleet Management

#### 1. `GET` /{{BASE_URL}}/api/admin/vehicles?page=1&limit=20

**Name:** Get Vehicles  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Get list of all vehicles with filters and pagination  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |
| `vehicleType` | String | Optional | - | `` |
| `status` | String | Optional | - | `` |
| `city` | String | Optional | - | `` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `GET` /{{BASE_URL}}/api/admin/vehicles/1

**Name:** Get Vehicle by ID  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Get complete vehicle details including rider, location, and history  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `GET` /{{BASE_URL}}/api/admin/vehicles/statistics

**Name:** Get Vehicle Statistics  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Get vehicle statistics (Total, Available, On Trip, Maintenance, etc.)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `GET` /{{BASE_URL}}/api/admin/vehicles/1/history

**Name:** Get Vehicle History  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Get vehicle history (assignments, maintenance, bookings)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 5. `GET` /{{BASE_URL}}/api/admin/vehicles/export?format=CSV

**Name:** Export Vehicles  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Export vehicles to CSV or Excel  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `format` | String | Optional | - | `CSV` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 6. `POST` /{{BASE_URL}}/api/admin/vehicles

**Name:** Register Vehicle  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Register new vehicle with complete details  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "vehicleType": "BIKE",
  "modelName": "Honda Activa 125",
  "registrationNumber": "MH-01-XY-9999",
  "color": "Black",
  "yearOfManufacture": 2024,
  "fuelType": "PETROL",
  "chassisNumber": "CH12345678",
  "engineNumber": "EN12345678",
  "rcNumber": "RC12345678",
  "insuranceNumber": "INS12345678",
  "insuranceExpiryDate": "2025-12-31",
  "ownerName": "Pravzo Pvt Ltd",
  "ownerPhone": "+912212345678",
  "assignedCity": "Mumbai"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 7. `PATCH` /{{BASE_URL}}/api/admin/vehicles/1

**Name:** Update Vehicle  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Update vehicle details  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "color": "Red",
  "ownerPhone": "+912212345679"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 8. `DELETE` /{{BASE_URL}}/api/admin/vehicles/1

**Name:** Delete Vehicle  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Delete vehicle (soft delete)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 9. `PATCH` /{{BASE_URL}}/api/admin/vehicles/1/status

**Name:** Update Vehicle Status  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Update vehicle status (AVAILABLE, RENTED, MAINTENANCE, CHARGING, OFFLINE, BLOCKED)  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "status": "AVAILABLE"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 10. `PATCH` /{{BASE_URL}}/api/admin/vehicles/1/maintenance

**Name:** Start Maintenance  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Start maintenance for vehicle  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "maintenanceType": "STARTED",
  "estimatedCost": 1500,
  "remarks": "Regular service and oil change"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 11. `PATCH` /{{BASE_URL}}/api/admin/vehicles/1/maintenance

**Name:** Complete Maintenance  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Complete maintenance for vehicle  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "maintenanceType": "COMPLETED",
  "actualCost": 1350,
  "nextServiceDate": "2027-01-08",
  "remarks": "Service completed successfully"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 12. `PATCH` /{{BASE_URL}}/api/admin/vehicles/1/block

**Name:** Block Vehicle  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Block vehicle with reason  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "reason": "Vehicle requires major repairs and inspection"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 13. `PATCH` /{{BASE_URL}}/api/admin/vehicles/1/unblock

**Name:** Unblock Vehicle  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Unblock vehicle  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 14. `PATCH` /{{BASE_URL}}/api/admin/vehicles/1/assign-rider

**Name:** Assign Rider  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Assign rider to vehicle  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "riderId": 5,
  "reason": "New rider onboarding"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 15. `PATCH` /{{BASE_URL}}/api/admin/vehicles/1/remove-rider

**Name:** Remove Rider  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Remove rider from vehicle  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "reason": "Rider moving to different city"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 16. `POST` /{{BASE_URL}}/api/admin/vehicles/1/assign-branch

**Name:** Assign Vehicle to Branch  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Assign vehicle to a branch (validates: no active rental)  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "branchId": 1,
  "notes": "Primary branch assignment"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 17. `PATCH` /{{BASE_URL}}/api/admin/vehicles/1/transfer-branch

**Name:** Transfer Vehicle Branch  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Transfer vehicle to another branch (validates: no active rental/job)  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "toBranchId": 2,
  "transferReason": "Fleet rebalancing across branches"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 18. `GET` /{{BASE_URL}}/api/admin/vehicles/1/branch-history

**Name:** Get Branch History  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Get vehicle branch assignment history  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 19. `POST` /{{BASE_URL}}/api/admin/vehicles/1/start-maintenance

**Name:** Start Maintenance  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Start vehicle maintenance (status changes to MAINTENANCE)  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "maintenanceType": "ROUTINE_SERVICE",
  "estimatedCost": 1500,
  "serviceCenter": "City Auto Workshop",
  "priority": "MEDIUM",
  "remarks": "Regular service check"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 20. `PATCH` /{{BASE_URL}}/api/admin/vehicles/1/complete-maintenance

**Name:** Complete Maintenance  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Complete vehicle maintenance  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "maintenanceId": 1,
  "actualCost": 1350,
  "nextServiceDate": "2027-01-20",
  "partsReplaced": [
    "Engine Oil",
    "Brake Pads"
  ],
  "remarks": "Service completed"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 21. `GET` /{{BASE_URL}}/api/admin/vehicles/1/maintenance-history

**Name:** Get Maintenance History  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Get complete maintenance history  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 22. `GET` /{{BASE_URL}}/api/admin/vehicles/1/service-history

**Name:** Get Service History  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Get completed service records  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 23. `GET` /{{BASE_URL}}/api/admin/vehicles/1/inspection-history

**Name:** Get Inspection History  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Get pre/post rental inspections and damage reports  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 24. `GET` /{{BASE_URL}}/api/admin/vehicles/1/location-history?limit=100

**Name:** Get Location History  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Get GPS location history  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `limit` | String | Optional | - | `100` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 25. `GET` /{{BASE_URL}}/api/admin/vehicles/1/documents

**Name:** Get Vehicle Documents  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Get all vehicle documents (RC, Insurance, PUC, etc.)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 26. `POST` /{{BASE_URL}}/api/admin/vehicles/1/documents

**Name:** Upload Vehicle Document  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Upload a vehicle document  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "documentType": "INSURANCE",
  "documentTitle": "Vehicle Insurance 2026-27",
  "documentNumber": "INS-2026-001",
  "documentUrl": "https://storage.pravzo.com/docs/insurance.pdf",
  "expiryDate": "2027-01-01"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 27. `DELETE` /{{BASE_URL}}/api/admin/vehicles/1/documents/1

**Name:** Delete Vehicle Document  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Soft-delete a vehicle document  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 28. `GET` /{{BASE_URL}}/api/admin/vehicles/1/activity?limit=50

**Name:** Get Vehicle Activity Log  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Get vehicle activity/event log  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `limit` | String | Optional | - | `50` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 29. `GET` /{{BASE_URL}}/api/admin/vehicles/1/expenses

**Name:** Get Vehicle Expenses  
**Category:** `[ADMIN] Vehicle & Fleet Management > Vehicle Management`  
**Description:** Get vehicle expense history  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 30. `POST` /{{BASE_URL}}/api/admin/vehicles/1/assign-branch

**Name:** Assign Vehicle to Branch  
**Category:** `[ADMIN] Vehicle & Fleet Management > Enterprise Fleet Management`  
**Description:** Assign a vehicle to a branch  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "branchId": 1,
  "notes": "Primary branch assignment"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 31. `PATCH` /{{BASE_URL}}/api/admin/vehicles/1/transfer-branch

**Name:** Transfer Vehicle Branch  
**Category:** `[ADMIN] Vehicle & Fleet Management > Enterprise Fleet Management`  
**Description:** Transfer vehicle to another branch (validates no active rental/job)  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "toBranchId": 2,
  "transferReason": "Fleet rebalancing across branches"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 32. `GET` /{{BASE_URL}}/api/admin/vehicles/1/branch-history

**Name:** Get Branch History  
**Category:** `[ADMIN] Vehicle & Fleet Management > Enterprise Fleet Management`  
**Description:** Get vehicle branch assignment history  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 33. `PATCH` /{{BASE_URL}}/api/admin/vehicles/1/assign-rider

**Name:** Assign Rider to Vehicle  
**Category:** `[ADMIN] Vehicle & Fleet Management > Enterprise Fleet Management`  
**Description:** Assign a rider to vehicle  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "riderId": 5,
  "reason": "Regular daily assignment"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 34. `PATCH` /{{BASE_URL}}/api/admin/vehicles/1/remove-rider

**Name:** Remove Rider from Vehicle  
**Category:** `[ADMIN] Vehicle & Fleet Management > Enterprise Fleet Management`  
**Description:** Remove rider from vehicle  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "reason": "End of shift assignment"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 35. `POST` /{{BASE_URL}}/api/admin/vehicles/1/start-maintenance

**Name:** Start Maintenance  
**Category:** `[ADMIN] Vehicle & Fleet Management > Enterprise Fleet Management`  
**Description:** Start vehicle maintenance (status changes to MAINTENANCE)  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "maintenanceType": "ROUTINE_SERVICE",
  "estimatedCost": 1500,
  "serviceCenter": "City Auto Workshop",
  "serviceAdvisor": "Ramesh Kumar",
  "priority": "MEDIUM",
  "remarks": "Regular service, oil change, brake check"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 36. `PATCH` /{{BASE_URL}}/api/admin/vehicles/1/complete-maintenance

**Name:** Complete Maintenance  
**Category:** `[ADMIN] Vehicle & Fleet Management > Enterprise Fleet Management`  
**Description:** Complete vehicle maintenance  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "maintenanceId": 1,
  "actualCost": 1350,
  "nextServiceDate": "2027-01-20",
  "serviceCenter": "City Auto Workshop",
  "partsReplaced": [
    "Engine Oil",
    "Oil Filter",
    "Brake Pads"
  ],
  "remarks": "Service completed successfully"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 37. `GET` /{{BASE_URL}}/api/admin/vehicles/1/maintenance-history

**Name:** Get Maintenance History  
**Category:** `[ADMIN] Vehicle & Fleet Management > Enterprise Fleet Management`  
**Description:** Get complete vehicle maintenance history  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 38. `GET` /{{BASE_URL}}/api/admin/vehicles/1/service-history

**Name:** Get Service History  
**Category:** `[ADMIN] Vehicle & Fleet Management > Enterprise Fleet Management`  
**Description:** Get completed service records  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 39. `GET` /{{BASE_URL}}/api/admin/vehicles/1/inspection-history

**Name:** Get Inspection History  
**Category:** `[ADMIN] Vehicle & Fleet Management > Enterprise Fleet Management`  
**Description:** Get vehicle inspection history (pre/post rental, damage reports)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 40. `GET` /{{BASE_URL}}/api/admin/vehicles/1/location-history?limit=100

**Name:** Get Location History  
**Category:** `[ADMIN] Vehicle & Fleet Management > Enterprise Fleet Management`  
**Description:** Get GPS location history for vehicle  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `limit` | String | Optional | Max 500 | `100` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 41. `GET` /{{BASE_URL}}/api/admin/vehicles/1/documents

**Name:** Get Vehicle Documents  
**Category:** `[ADMIN] Vehicle & Fleet Management > Enterprise Fleet Management`  
**Description:** Get all vehicle documents (RC, Insurance, PUC, etc.)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 42. `POST` /{{BASE_URL}}/api/admin/vehicles/1/documents

**Name:** Upload Vehicle Document  
**Category:** `[ADMIN] Vehicle & Fleet Management > Enterprise Fleet Management`  
**Description:** Upload a new vehicle document  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "documentType": "INSURANCE",
  "documentTitle": "Vehicle Insurance 2026-27",
  "documentNumber": "INS-2026-001234",
  "documentUrl": "https://storage.pravzo.com/docs/insurance_001.pdf",
  "issueDate": "2026-01-01",
  "expiryDate": "2027-01-01",
  "remarks": "Comprehensive insurance policy"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 43. `DELETE` /{{BASE_URL}}/api/admin/vehicles/1/documents/1

**Name:** Delete Vehicle Document  
**Category:** `[ADMIN] Vehicle & Fleet Management > Enterprise Fleet Management`  
**Description:** Soft-delete a vehicle document  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 44. `GET` /{{BASE_URL}}/api/admin/vehicles/1/activity?limit=50

**Name:** Get Vehicle Activity Log  
**Category:** `[ADMIN] Vehicle & Fleet Management > Enterprise Fleet Management`  
**Description:** Get vehicle activity/event log  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `limit` | String | Optional | - | `50` |
| `activityType` | String | Optional | - | `MAINTENANCE_STARTED` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 45. `GET` /{{BASE_URL}}/api/admin/vehicles/1/expenses

**Name:** Get Vehicle Expenses  
**Category:** `[ADMIN] Vehicle & Fleet Management > Enterprise Fleet Management`  
**Description:** Get vehicle expense history  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `expenseType` | String | Optional | - | `MAINTENANCE` |
| `startDate` | String | Optional | - | `2026-01-01` |
| `endDate` | String | Optional | - | `2026-12-31` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 46. `PATCH` /{{BASE_URL}}/api/admin/vehicles/1/status

**Name:** Update Vehicle Status  
**Category:** `[ADMIN] Vehicle & Fleet Management > Enterprise Fleet Management`  
**Description:** Update vehicle operational status  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "status": "AVAILABLE"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 47. `DELETE` /{{BASE_URL}}/api/admin/vehicles/1

**Name:** Delete Vehicle  
**Category:** `[ADMIN] Vehicle & Fleet Management > Enterprise Fleet Management`  
**Description:** Soft-delete vehicle (must have no active rider)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 48. `GET` /{{BASE_URL}}/api/admin/vehicles?page=1&limit=20

**Name:** Get All Vehicles (Super Admin)  
**Category:** `[ADMIN] Vehicle & Fleet Management > Enterprise Fleet Management`  
**Description:** Get all vehicles with filters (super-admin prefix)  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |
| `status` | String | Optional | - | `AVAILABLE` |
| `vehicleType` | String | Optional | - | `BIKE` |
| `branchId` | String | Optional | - | `1` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 49. `GET` /{{BASE_URL}}/api/admin/vehicles/1

**Name:** Get Vehicle by ID (Super Admin)  
**Category:** `[ADMIN] Vehicle & Fleet Management > Enterprise Fleet Management`  
**Description:** Get complete vehicle profile  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 50. `POST` /{{BASE_URL}}/api/admin/vehicles

**Name:** Create Vehicle (Super Admin)  
**Category:** `[ADMIN] Vehicle & Fleet Management > Enterprise Fleet Management`  
**Description:** Register a new vehicle  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "vehicleType": "E_BIKE",
  "modelName": "Ather 450X",
  "registrationNumber": "MH-01-XY-1234",
  "color": "White",
  "yearOfManufacture": 2024,
  "fuelType": "ELECTRIC",
  "chassisNumber": "CH2024001234",
  "engineNumber": "EN2024001234",
  "insuranceNumber": "INS2024001234",
  "insuranceExpiryDate": "2027-06-30",
  "pucNumber": "PUC2024001234",
  "pucExpiryDate": "2027-01-31",
  "ownerName": "Pravzo Pvt Ltd",
  "assignedCity": "Mumbai"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.152Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 51. `PATCH` /{{BASE_URL}}/api/admin/vehicles/1

**Name:** Update Vehicle (Super Admin)  
**Category:** `[ADMIN] Vehicle & Fleet Management > Enterprise Fleet Management`  
**Description:** Update vehicle details  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "color": "Black",
  "ownerName": "Pravzo Fleet Pvt Ltd",
  "assignedCity": "Pune"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 52. `GET` /{{BASE_URL}}/api/admin/fleet/dashboard?city=Mumbai

**Name:** Fleet Dashboard  
**Category:** `[ADMIN] Vehicle & Fleet Management > Fleet Management`  
**Description:** Get fleet dashboard summary (Total, Available, Busy, Offline, etc.)  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `city` | String | Optional | - | `Mumbai` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 53. `GET` /{{BASE_URL}}/api/admin/fleet/live-locations?city=Mumbai

**Name:** Fleet Live Locations  
**Category:** `[ADMIN] Vehicle & Fleet Management > Fleet Management`  
**Description:** Get live GPS locations of all fleet vehicles with rider information  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `city` | String | Optional | - | `Mumbai` |
| `vehicleType` | String | Optional | - | `` |
| `status` | String | Optional | - | `` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 54. `GET` /{{BASE_URL}}/api/admin/fleet/availability

**Name:** Fleet Availability  
**Category:** `[ADMIN] Vehicle & Fleet Management > Fleet Management`  
**Description:** Get fleet availability breakdown by vehicle type  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `city` | String | Optional | - | `` |
| `vehicleType` | String | Optional | - | `` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 55. `GET` /{{BASE_URL}}/api/admin/fleet/statistics?period=month

**Name:** Fleet Statistics  
**Category:** `[ADMIN] Vehicle & Fleet Management > Fleet Management`  
**Description:** Get fleet performance statistics (Utilization, Peak Hours, Top Vehicles, etc.)  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | - | `month` |
| `city` | String | Optional | - | `` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 56. `PATCH` /{{BASE_URL}}/api/admin/fleet/assign

**Name:** Bulk Assign Riders  
**Category:** `[ADMIN] Vehicle & Fleet Management > Fleet Management`  
**Description:** Bulk assign riders to vehicles (max 50 per request)  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "assignments": [
    {
      "vehicleId": 1,
      "riderId": 5
    },
    {
      "vehicleId": 2,
      "riderId": 6
    },
    {
      "vehicleId": 3,
      "riderId": 7
    }
  ]
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 57. `PATCH` /{{BASE_URL}}/api/admin/fleet/remove

**Name:** Bulk Remove Riders  
**Category:** `[ADMIN] Vehicle & Fleet Management > Fleet Management`  
**Description:** Bulk remove riders from vehicles (max 50 per request)  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "vehicleIds": [
    1,
    2,
    3
  ],
  "reason": "Seasonal vehicle rotation"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-admin-payment-management"></a> [ADMIN] Payment Management

#### 1. `GET` /{{BASE_URL}}/api/admin/payments?page=1&limit=20

**Name:** Get All Payments  
**Category:** `[ADMIN] Payment Management > Payment Operations`  
**Description:** Get paginated list of all payments with filters  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | Page number | `1` |
| `limit` | String | Optional | Items per page (1-100) | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `GET` /{{BASE_URL}}/api/admin/payments?search=TXN123&page=1&limit=20

**Name:** Search Payments  
**Category:** `[ADMIN] Payment Management > Payment Operations`  
**Description:** Search payments by transaction ID, user name, or rider name  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `search` | String | Optional | Search transaction ID, user, rider | `TXN123` |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `GET` /{{BASE_URL}}/api/admin/payments?paymentStatus=SUCCESS&page=1&limit=20

**Name:** Filter by Payment Status  
**Category:** `[ADMIN] Payment Management > Payment Operations`  
**Description:** Filter payments by status  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `paymentStatus` | String | Optional | PENDING, SUCCESS, FAILED, REFUNDED, PROCESSING | `SUCCESS` |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `GET` /{{BASE_URL}}/api/admin/payments?paymentMethod=UPI&page=1&limit=20

**Name:** Filter by Payment Method  
**Category:** `[ADMIN] Payment Management > Payment Operations`  
**Description:** Filter payments by payment method  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `paymentMethod` | String | Optional | CASH, CARD, UPI, WALLET, NET_BANKING | `UPI` |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 5. `GET` /{{BASE_URL}}/api/admin/payments?paymentStatus=SUCCESS&paymentMethod=UPI&city=Mumbai&startDate=2026-01-01&endDate=2026-12-31&sortBy=created_at&sortOrder=DESC&page=1&limit=20

**Name:** Advanced Filters  
**Category:** `[ADMIN] Payment Management > Payment Operations`  
**Description:** Combine multiple filters for advanced payment search  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `paymentStatus` | String | Optional | - | `SUCCESS` |
| `paymentMethod` | String | Optional | - | `UPI` |
| `city` | String | Optional | - | `Mumbai` |
| `startDate` | String | Optional | - | `2026-01-01` |
| `endDate` | String | Optional | - | `2026-12-31` |
| `sortBy` | String | Optional | - | `created_at` |
| `sortOrder` | String | Optional | - | `DESC` |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 6. `GET` /{{BASE_URL}}/api/admin/payments/1

**Name:** Get Payment Details  
**Category:** `[ADMIN] Payment Management > Payment Operations`  
**Description:** Get complete payment details including gateway response, breakdown, customer, rider info  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 7. `GET` /{{BASE_URL}}/api/admin/payments/statistics

**Name:** Get Payment Statistics  
**Category:** `[ADMIN] Payment Management > Payment Operations`  
**Description:** Get payment statistics (Total Revenue, Success Rate, Average Transaction, etc.)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 8. `GET` /{{BASE_URL}}/api/admin/payments/export?format=csv&paymentStatus=SUCCESS

**Name:** Export Payments - CSV  
**Category:** `[ADMIN] Payment Management > Payment Operations`  
**Description:** Export payments to CSV file  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `format` | String | Optional | - | `csv` |
| `paymentStatus` | String | Optional | Optional filter | `SUCCESS` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 9. `GET` /{{BASE_URL}}/api/admin/payments/export?format=excel&startDate=2026-01-01&endDate=2026-12-31

**Name:** Export Payments - Excel  
**Category:** `[ADMIN] Payment Management > Payment Operations`  
**Description:** Export payments to Excel file  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `format` | String | Optional | - | `excel` |
| `startDate` | String | Optional | - | `2026-01-01` |
| `endDate` | String | Optional | - | `2026-12-31` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 10. `PATCH` /{{BASE_URL}}/api/admin/payments/1/refund

**Name:** Process Full Refund  
**Category:** `[ADMIN] Payment Management > Refund Operations`  
**Description:** Process full or partial refund (automatically credits user wallet)  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "refundAmount": 150,
  "refundReason": "Customer requested full refund due to service quality issue"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 11. `PATCH` /{{BASE_URL}}/api/admin/payments/1/refund

**Name:** Process Partial Refund  
**Category:** `[ADMIN] Payment Management > Refund Operations`  
**Description:** Process partial refund  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "refundAmount": 50,
  "refundReason": "Partial refund for delay in service"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 12. `PATCH` /{{BASE_URL}}/api/admin/payments/1/status

**Name:** Update Payment Status  
**Category:** `[ADMIN] Payment Management > Payment Status Operations`  
**Description:** Update payment status (PENDING, SUCCESS, FAILED, REFUNDED, PROCESSING)  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "status": "SUCCESS"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 13. `PATCH` /{{BASE_URL}}/api/admin/payments/1/verify

**Name:** Verify Payment  
**Category:** `[ADMIN] Payment Management > Payment Status Operations`  
**Description:** Manually verify payment  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-admin-wallet-management"></a> [ADMIN] Wallet Management

#### 1. `GET` /{{BASE_URL}}/api/admin/payments/wallet/users/1

**Name:** Get User Wallet  
**Category:** `[ADMIN] Wallet Management > User Wallet`  
**Description:** Get user wallet details with balance and recent transactions  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `PATCH` /{{BASE_URL}}/api/admin/payments/wallet/users/1/credit

**Name:** Credit User Wallet  
**Category:** `[ADMIN] Wallet Management > User Wallet`  
**Description:** Credit amount to user wallet  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "amount": 500,
  "description": "Referral bonus credit"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `PATCH` /{{BASE_URL}}/api/admin/payments/wallet/users/1/debit

**Name:** Debit User Wallet  
**Category:** `[ADMIN] Wallet Management > User Wallet`  
**Description:** Debit amount from user wallet  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "amount": 100,
  "description": "Penalty deduction for policy violation"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `GET` /{{BASE_URL}}/api/admin/payments/wallet/riders/1

**Name:** Get Rider Wallet  
**Category:** `[ADMIN] Wallet Management > Rider Wallet`  
**Description:** Get rider wallet details with earnings, settlements, and recent transactions  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 5. `PATCH` /{{BASE_URL}}/api/admin/payments/wallet/riders/1/credit

**Name:** Credit Rider Wallet (Bonus)  
**Category:** `[ADMIN] Wallet Management > Rider Wallet`  
**Description:** Credit bonus to rider wallet  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "amount": 1000,
  "description": "Monthly performance bonus for achieving targets"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 6. `GET` /{{BASE_URL}}/api/admin/payments/wallet/history/1?type=USER&limit=50

**Name:** Get User Wallet History  
**Category:** `[ADMIN] Wallet Management > Wallet History`  
**Description:** Get complete wallet transaction history  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `type` | String | Optional | USER or RIDER | `USER` |
| `limit` | String | Optional | Number of transactions (1-100) | `50` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 7. `GET` /{{BASE_URL}}/api/admin/payments/wallet/history/1?type=RIDER&limit=50

**Name:** Get Rider Wallet History  
**Category:** `[ADMIN] Wallet Management > Wallet History`  
**Description:** Get rider wallet transaction history  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `type` | String | Optional | - | `RIDER` |
| `limit` | String | Optional | - | `50` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-admin-settlement-management"></a> [ADMIN] Settlement Management

#### 1. `GET` /{{BASE_URL}}/api/admin/payments/settlements?page=1&limit=20

**Name:** Get All Settlements  
**Category:** `[ADMIN] Settlement Management`  
**Description:** Get paginated list of all settlements  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `GET` /{{BASE_URL}}/api/admin/payments/settlements?status=PENDING&page=1&limit=20

**Name:** Filter Settlements by Status  
**Category:** `[ADMIN] Settlement Management`  
**Description:** Filter settlements by status  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `status` | String | Optional | PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED | `PENDING` |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `GET` /{{BASE_URL}}/api/admin/payments/settlements/1

**Name:** Get Settlement Details  
**Category:** `[ADMIN] Settlement Management`  
**Description:** Get complete settlement details including rider info, amount breakdown, bank details  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `PATCH` /{{BASE_URL}}/api/admin/payments/settlements/1/process

**Name:** Process Settlement  
**Category:** `[ADMIN] Settlement Management`  
**Description:** Process rider settlement (marks as completed and updates rider wallet)  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "transactionReference": "TXN1234567890",
  "utrNumber": "UTR987654321"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-admin-commission-management"></a> [ADMIN] Commission Management

#### 1. `GET` /{{BASE_URL}}/api/admin/payments/commission/overview?period=month

**Name:** Get Commission Overview  
**Category:** `[ADMIN] Commission Management`  
**Description:** Get commission overview (total bookings, revenue, commission, rider earnings by city)  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | today, week, month, year | `month` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-admin-payment-analytics"></a> [ADMIN] Payment Analytics

#### 1. `GET` /{{BASE_URL}}/api/admin/payments/analytics/revenue?period=month

**Name:** Get Revenue Analytics  
**Category:** `[ADMIN] Payment Analytics`  
**Description:** Get revenue analytics (total, today, week, month, year, avg transaction)  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | today, week, month, year | `month` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `GET` /{{BASE_URL}}/api/admin/payments/analytics/payment-methods?period=week

**Name:** Get Payment Method Distribution  
**Category:** `[ADMIN] Payment Analytics`  
**Description:** Get payment method distribution (CASH, CARD, UPI, WALLET breakdown)  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | - | `week` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `GET` /{{BASE_URL}}/api/admin/payments/analytics/top-cities?limit=10&period=month

**Name:** Get Top Cities by Revenue  
**Category:** `[ADMIN] Payment Analytics`  
**Description:** Get top cities by revenue  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `limit` | String | Optional | - | `10` |
| `period` | String | Optional | - | `month` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `GET` /{{BASE_URL}}/api/admin/payments/analytics/top-users?limit=10&startDate=2026-01-01&endDate=2026-12-31

**Name:** Get Top Users by Spending  
**Category:** `[ADMIN] Payment Analytics`  
**Description:** Get top users by total spending  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `limit` | String | Optional | - | `10` |
| `startDate` | String | Optional | - | `2026-01-01` |
| `endDate` | String | Optional | - | `2026-12-31` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 5. `GET` /{{BASE_URL}}/api/admin/payments/analytics/top-riders?limit=10&period=year

**Name:** Get Top Riders by Earnings  
**Category:** `[ADMIN] Payment Analytics`  
**Description:** Get top riders by total earnings  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `limit` | String | Optional | - | `10` |
| `period` | String | Optional | - | `year` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 6. `GET` /{{BASE_URL}}/api/admin/payments/analytics/peak-hours?period=month

**Name:** Get Peak Revenue Hours  
**Category:** `[ADMIN] Payment Analytics`  
**Description:** Get peak revenue hours (hourly breakdown)  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | - | `month` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 7. `GET` /{{BASE_URL}}/api/admin/payments/analytics/daily?startDate=2026-07-01&endDate=2026-07-09

**Name:** Get Daily Report  
**Category:** `[ADMIN] Payment Analytics`  
**Description:** Get daily payment report (revenue, commission, failed transactions)  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `startDate` | String | Optional | - | `2026-07-01` |
| `endDate` | String | Optional | - | `2026-07-09` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 8. `GET` /{{BASE_URL}}/api/admin/payments/analytics/monthly?year=2026

**Name:** Get Monthly Report  
**Category:** `[ADMIN] Payment Analytics`  
**Description:** Get monthly report for a specific year  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `year` | String | Optional | - | `2026` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 9. `GET` /{{BASE_URL}}/api/admin/payments/analytics/yearly

**Name:** Get Yearly Report  
**Category:** `[ADMIN] Payment Analytics`  
**Description:** Get yearly report (all years)  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-admin-reports-analytics"></a> [ADMIN] Reports & Analytics

#### 1. `GET` /{{BASE_URL}}/api/admin/reports/revenue?period=last30days

**Name:** Get Revenue Report  
**Category:** `[ADMIN] Reports & Analytics > Revenue Reports`  
**Description:** Get comprehensive revenue report with trends, breakdown by city, and vehicle type  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | today|yesterday|last7days|last30days|last90days|currentMonth|previousMonth|currentYear|custom | `last30days` |
| `startDate` | String | Optional | YYYY-MM-DD (required if period=custom) | `` |
| `endDate` | String | Optional | YYYY-MM-DD (required if period=custom) | `` |
| `city` | String | Optional | - | `` |
| `paymentMethod` | String | Optional | CASH|CARD|UPI|WALLET|NET_BANKING | `` |
| `groupBy` | String | Optional | day|week|month|year | `` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `GET` /{{BASE_URL}}/api/admin/reports/bookings?period=last30days

**Name:** Get Booking Report  
**Category:** `[ADMIN] Reports & Analytics > Booking Reports`  
**Description:** Get booking analytics with completion rates, peak hours, and trends  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | - | `last30days` |
| `city` | String | Optional | - | `` |
| `status` | String | Optional | PENDING|ACCEPTED|COMPLETED|CANCELLED|REJECTED | `` |
| `groupBy` | String | Optional | day|week|month|hour | `` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `GET` /{{BASE_URL}}/api/admin/reports/users?period=last30days

**Name:** Get User Report  
**Category:** `[ADMIN] Reports & Analytics > User Reports`  
**Description:** Get user growth metrics and top cities  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | - | `last30days` |
| `city` | String | Optional | - | `` |
| `status` | String | Optional | ACTIVE|BLOCKED|INACTIVE | `` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `GET` /{{BASE_URL}}/api/admin/reports/riders?period=last30days

**Name:** Get Rider Report  
**Category:** `[ADMIN] Reports & Analytics > Rider Reports`  
**Description:** Get rider performance metrics and top performers  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | - | `last30days` |
| `city` | String | Optional | - | `` |
| `status` | String | Optional | - | `` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 5. `GET` /{{BASE_URL}}/api/admin/reports/vehicles?period=last30days

**Name:** Get Vehicle Report  
**Category:** `[ADMIN] Reports & Analytics > Vehicle Reports`  
**Description:** Get fleet utilization and vehicle performance metrics  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | - | `last30days` |
| `city` | String | Optional | - | `` |
| `vehicleType` | String | Optional | - | `` |
| `status` | String | Optional | - | `` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 6. `GET` /{{BASE_URL}}/api/admin/reports/payments?period=last30days

**Name:** Get Payment Report  
**Category:** `[ADMIN] Reports & Analytics > Payment Reports`  
**Description:** Get payment analytics and method distribution  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | - | `last30days` |
| `paymentMethod` | String | Optional | - | `` |
| `paymentStatus` | String | Optional | - | `` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 7. `GET` /{{BASE_URL}}/api/admin/reports/support?period=last30days

**Name:** Get Support Report  
**Category:** `[ADMIN] Reports & Analytics > Support Reports`  
**Description:** Get support ticket metrics and resolution times  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | - | `last30days` |
| `status` | String | Optional | - | `` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 8. `GET` /{{BASE_URL}}/api/admin/reports/kyc?period=last30days

**Name:** Get KYC Report  
**Category:** `[ADMIN] Reports & Analytics > KYC Reports`  
**Description:** Get KYC verification metrics and approval rates  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | - | `last30days` |
| `status` | String | Optional | - | `` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 9. `GET` /{{BASE_URL}}/api/admin/reports/dashboard?period=today

**Name:** Get Dashboard Analytics  
**Category:** `[ADMIN] Reports & Analytics > Dashboard Analytics`  
**Description:** Get unified dashboard analytics with all key metrics  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | - | `today` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 10. `GET` /{{BASE_URL}}/api/admin/reports/top-users?period=last30days&limit=10

**Name:** Get Top Users  
**Category:** `[ADMIN] Reports & Analytics > Top Lists`  
**Description:** Get top users by spending  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | - | `last30days` |
| `limit` | String | Optional | - | `10` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 11. `GET` /{{BASE_URL}}/api/admin/reports/top-riders?period=last30days&limit=10

**Name:** Get Top Riders  
**Category:** `[ADMIN] Reports & Analytics > Top Lists`  
**Description:** Get top riders by earnings  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | - | `last30days` |
| `limit` | String | Optional | - | `10` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 12. `GET` /{{BASE_URL}}/api/admin/reports/top-cities?period=last30days&limit=10

**Name:** Get Top Cities  
**Category:** `[ADMIN] Reports & Analytics > Top Lists`  
**Description:** Get top cities by revenue  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | - | `last30days` |
| `limit` | String | Optional | - | `10` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 13. `GET` /{{BASE_URL}}/api/admin/reports/top-vehicles?period=last30days&limit=10

**Name:** Get Top Vehicles  
**Category:** `[ADMIN] Reports & Analytics > Top Lists`  
**Description:** Get top vehicles by utilization  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | - | `last30days` |
| `limit` | String | Optional | - | `10` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 14. `GET` /{{BASE_URL}}/api/admin/reports/charts/revenue?period=last30days&interval=daily

**Name:** Get Revenue Chart Data  
**Category:** `[ADMIN] Reports & Analytics > Chart Data`  
**Description:** Get revenue trend data for charts  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | - | `last30days` |
| `interval` | String | Optional | hourly|daily|weekly|monthly | `daily` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 15. `GET` /{{BASE_URL}}/api/admin/reports/charts/bookings?period=last30days&interval=daily

**Name:** Get Booking Chart Data  
**Category:** `[ADMIN] Reports & Analytics > Chart Data`  
**Description:** Get booking trend data for charts  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | - | `last30days` |
| `interval` | String | Optional | - | `daily` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 16. `GET` /{{BASE_URL}}/api/admin/reports/charts/users?period=last30days&interval=daily

**Name:** Get User Chart Data  
**Category:** `[ADMIN] Reports & Analytics > Chart Data`  
**Description:** Get user growth trend data for charts  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `period` | String | Optional | - | `last30days` |
| `interval` | String | Optional | - | `daily` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 17. `GET` /{{BASE_URL}}/api/admin/reports/download?type=revenue&format=csv&period=last30days

**Name:** Download Report  
**Category:** `[ADMIN] Reports & Analytics > Export Reports`  
**Description:** Download report in specified format (CSV/Excel/PDF)  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `type` | String | Optional | revenue|bookings|users|riders|vehicles|payments|support|kyc | `revenue` |
| `format` | String | Optional | csv|excel|pdf | `csv` |
| `period` | String | Optional | - | `last30days` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-admin-admin-management"></a> [ADMIN] Admin Management

#### 1. `POST` /{{BASE_URL}}/api/admin/admin-management/create

**Name:** Create Admin  
**Category:** `[ADMIN] Admin Management`  
**Description:** Create new admin account. Auto-generates secure password (12+ chars) and sends credentials via email. Activity is logged. Only SUPER_ADMIN can access.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "full_name": "Amit Kumar",
  "email": "amit@pravzo.com",
  "phone_number": "9876543210",
  "role": "ADMIN",
  "department": "Operations"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `GET` /{{BASE_URL}}/api/admin/admin-management/list?page=1&limit=20

**Name:** Get All Admins (List)  
**Category:** `[ADMIN] Admin Management`  
**Description:** Get paginated list of all admins with search and filters. Includes creator information. Only SUPER_ADMIN can access.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | Page number (default: 1) | `1` |
| `limit` | String | Optional | Items per page (default: 20) | `20` |
| `search` | String | Optional | Search by name, email, phone | `` |
| `role` | String | Optional | Filter: SUPER_ADMIN | ADMIN | CONTENT_ADMIN | SUPPORT_ADMIN | REPORT_ADMIN | FINANCE_ADMIN | FLEET_ADMIN | `` |
| `status` | String | Optional | Filter: ACTIVE | BLOCKED | INACTIVE | SUSPENDED | PENDING | LOCKED | `` |
| `sortBy` | String | Optional | Sort field: created_at | full_name | email | `` |
| `sortOrder` | String | Optional | Sort order: ASC | DESC (default: DESC) | `` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `GET` /{{BASE_URL}}/api/admin/admin-management/statistics

**Name:** Get Admin Statistics  
**Category:** `[ADMIN] Admin Management`  
**Description:** Get admin statistics dashboard - total admins, active/blocked counts, role distribution, today/monthly registrations. Only SUPER_ADMIN can access.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `GET` /{{BASE_URL}}/api/admin/admin-management/5

**Name:** Get Admin By ID  
**Category:** `[ADMIN] Admin Management`  
**Description:** Get complete admin profile including creator details and last login. Only SUPER_ADMIN can access.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 5. `PUT` /{{BASE_URL}}/api/admin/admin-management/5

**Name:** Update Admin  
**Category:** `[ADMIN] Admin Management`  
**Description:** Update admin details (name, phone, role, department). Email cannot be changed. Activity is logged. Only SUPER_ADMIN can access.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "full_name": "Amit Kumar Singh",
  "phone_number": "9876543210",
  "role": "ADMIN",
  "department": "Customer Support"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 6. `POST` /{{BASE_URL}}/api/admin/admin-management/5/block

**Name:** Block Admin  
**Category:** `[ADMIN] Admin Management`  
**Description:** Block an admin account. Cannot block yourself. Reason is required and logged. Only SUPER_ADMIN can access.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "reason": "Policy violation - Multiple unauthorized access attempts"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 7. `POST` /{{BASE_URL}}/api/admin/admin-management/5/unblock

**Name:** Unblock Admin  
**Category:** `[ADMIN] Admin Management`  
**Description:** Unblock a blocked admin. Sets status to ACTIVE. Activity is logged. Only SUPER_ADMIN can access.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 8. `PATCH` /{{BASE_URL}}/api/admin/admin-management/5/reset-password

**Name:** Reset Admin Password  
**Category:** `[ADMIN] Admin Management`  
**Description:** Reset admin password. New secure random password is auto-generated and sent via email. Password history is tracked. Force change flag is set. Activity is logged. Only SUPER_ADMIN can access.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 9. `DELETE` /{{BASE_URL}}/api/admin/admin-management/5

**Name:** Delete Admin  
**Category:** `[ADMIN] Admin Management`  
**Description:** Soft delete an admin (sets deleted_at). Cannot delete yourself. Activity is logged. Only SUPER_ADMIN can access.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 10. `GET` /{{BASE_URL}}/api/admin/admin-management/5/activity?page=1&limit=50

**Name:** Get Admin Activity Logs  
**Category:** `[ADMIN] Admin Management`  
**Description:** Get complete activity audit trail for an admin - all actions, IP addresses, user agents, timestamps. Paginated. Only SUPER_ADMIN can access.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | Page number (default: 1) | `1` |
| `limit` | String | Optional | Items per page (default: 50) | `50` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 11. `PATCH` /{{BASE_URL}}/api/admin/admin-management/5/status

**Name:** Update Admin Status  
**Category:** `[ADMIN] Admin Management`  
**Description:** Update admin status. Valid statuses: ACTIVE, INACTIVE, BLOCKED, SUSPENDED, PENDING, LOCKED. Activity is logged. Only SUPER_ADMIN can access.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "status": "ACTIVE"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 12. `POST` /{{BASE_URL}}/api/admin/admin-management/5/assign-branch

**Name:** Assign Admin to Branch  
**Category:** `[ADMIN] Admin Management`  
**Description:** Assign admin to a branch. One admin can have only ONE active assignment. One branch can have only ONE active admin. Assignment types: PRIMARY, TEMPORARY, BACKUP. Transaction-based. Only SUPER_ADMIN can access.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "branch_id": 10,
  "assignment_type": "PRIMARY"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 13. `PATCH` /{{BASE_URL}}/api/admin/admin-management/5/transfer-branch

**Name:** Transfer Admin to Another Branch  
**Category:** `[ADMIN] Admin Management`  
**Description:** Transfer admin from current branch to another branch. Closes old assignment as TRANSFERRED, creates new assignment. Preserves complete history. Transaction-based. Only SUPER_ADMIN can access.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "new_branch_id": 15,
  "transfer_reason": "Operational requirements",
  "transfer_notes": "Moving to high-demand branch for better coverage"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 14. `PATCH` /{{BASE_URL}}/api/admin/admin-management/5/remove-branch

**Name:** Remove Admin from Branch  
**Category:** `[ADMIN] Admin Management`  
**Description:** Remove admin from their current branch assignment. Admin goes into admin pool (no branch). Transaction-based. Only SUPER_ADMIN can access.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 15. `GET` /{{BASE_URL}}/api/admin/admin-management/5/assignment-history?page=1&limit=20

**Name:** Get Assignment History  
**Category:** `[ADMIN] Admin Management`  
**Description:** Get complete branch assignment history for an admin - all assignments, transfers, dates, reasons. Includes branch details and who assigned/unassigned. Only SUPER_ADMIN can access.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | Page number (default: 1) | `1` |
| `limit` | String | Optional | Items per page (default: 20) | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 16. `GET` /{{BASE_URL}}/api/admin/admin-management/5/login-history?page=1&limit=50

**Name:** Get Login History  
**Category:** `[ADMIN] Admin Management`  
**Description:** Get complete login history for an admin - success/failed logins, IP addresses, devices, browsers, OS, session durations. Paginated. Only SUPER_ADMIN can access.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | Page number (default: 1) | `1` |
| `limit` | String | Optional | Items per page (default: 50) | `50` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 17. `GET` /{{BASE_URL}}/api/admin/admin-management/5/permissions

**Name:** Get Admin Permissions  
**Category:** `[ADMIN] Admin Management`  
**Description:** Get module-level permissions for an admin - 14 modules (dashboard, users, riders, vehicles, bookings, rentals, jobs, reports, payments, notifications, settings, landing_cms, branches, admin_management). Only SUPER_ADMIN can access.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 18. `PATCH` /{{BASE_URL}}/api/admin/admin-management/5/permissions

**Name:** Update Admin Permissions  
**Category:** `[ADMIN] Admin Management`  
**Description:** Update module-level permissions for an admin. All 14 module permissions can be updated. Activity is logged with old and new values. Only SUPER_ADMIN can access.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "dashboard": true,
  "users": true,
  "riders": true,
  "vehicles": true,
  "bookings": true,
  "rentals": true,
  "jobs": true,
  "reports": true,
  "payments": false,
  "notifications": true,
  "settings": false,
  "landing_cms": false,
  "branches": false,
  "admin_management": false
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 19. `GET` /{{BASE_URL}}/api/admin/admin-management/5/sessions

**Name:** Get Active Sessions  
**Category:** `[ADMIN] Admin Management`  
**Description:** Get all active sessions for an admin - session IDs, device info, IP addresses, last activity, expiry times. Useful for security monitoring and session management. Only SUPER_ADMIN can access.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 20. `DELETE` /{{BASE_URL}}/api/admin/admin-management/5/sessions/abc-123-def-456

**Name:** Revoke Session  
**Category:** `[ADMIN] Admin Management`  
**Description:** Revoke a specific session for an admin. Forces logout on that device. Activity is logged. Only SUPER_ADMIN can access.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-admin-notifications"></a> [ADMIN] Notifications

#### 1. `GET` /{{BASE_URL}}/api/admin/notifications?page=1&limit=20&search=&status=&notification_type=&recipient_type=

**Name:** Get Notifications List  
**Category:** `[ADMIN] Notifications > Notification Operations`  
**Description:** Get paginated list of notifications with filters. Accessible by all admin roles.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | Page number (default: 1) | `1` |
| `limit` | String | Optional | Items per page (default: 20) | `20` |
| `search` | String | Optional | Search by title or message | `` |
| `status` | String | Optional | Filter by status: DRAFT, SCHEDULED, SENDING, SENT, FAILED, CANCELLED | `` |
| `notification_type` | String | Optional | Filter by type: PUSH, EMAIL, SMS, IN_APP | `` |
| `recipient_type` | String | Optional | Filter by recipient type | `` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `GET` /{{BASE_URL}}/api/admin/notifications/1

**Name:** Get Notification Details  
**Category:** `[ADMIN] Notifications > Notification Operations`  
**Description:** Get complete details of a specific notification including delivery tracking. Accessible by all admin roles.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `GET` /{{BASE_URL}}/api/admin/notifications/statistics

**Name:** Get Notification Statistics  
**Category:** `[ADMIN] Notifications > Notification Operations`  
**Description:** Get notification dashboard statistics including total sent, delivered, read, failed, success rate, and counts. Accessible by SUPER_ADMIN, ADMIN, SUPPORT_ADMIN.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `GET` /{{BASE_URL}}/api/admin/notifications/history?page=1&limit=50&start_date=&end_date=

**Name:** Get Notification History  
**Category:** `[ADMIN] Notifications > Notification Operations`  
**Description:** Get notification history with date range filters. Accessible by all admin roles.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | Page number (default: 1) | `1` |
| `limit` | String | Optional | Items per page (default: 50) | `50` |
| `start_date` | String | Optional | Start date filter (YYYY-MM-DD) | `` |
| `end_date` | String | Optional | End date filter (YYYY-MM-DD) | `` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 5. `POST` /{{BASE_URL}}/api/admin/notifications/send

**Name:** Send Notification to Single User  
**Category:** `[ADMIN] Notifications > Notification Operations`  
**Description:** Send instant notification to a single user. Accessible by SUPER_ADMIN, ADMIN, SUPPORT_ADMIN.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "title": "Booking Confirmed",
  "message": "Your booking #12345 has been confirmed!",
  "notification_type": "PUSH",
  "recipient_type": "SINGLE_USER",
  "recipient_id": 101,
  "priority": "HIGH",
  "action_type": "OPEN_BOOKING",
  "action_data": {
    "booking_id": 12345
  }
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 6. `POST` /{{BASE_URL}}/api/admin/notifications/send

**Name:** Send Notification to Multiple Users  
**Category:** `[ADMIN] Notifications > Notification Operations`  
**Description:** Send instant notification to multiple users. Accessible by SUPER_ADMIN, ADMIN, SUPPORT_ADMIN.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "title": "Important Update",
  "message": "Please update your payment method",
  "notification_type": "PUSH",
  "recipient_type": "MULTIPLE_USERS",
  "recipient_ids": [
    101,
    102,
    103,
    104
  ],
  "priority": "MEDIUM"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 7. `POST` /{{BASE_URL}}/api/admin/notifications/broadcast

**Name:** Broadcast to All Users  
**Category:** `[ADMIN] Notifications > Notification Operations`  
**Description:** Broadcast notification to all users. Accessible by SUPER_ADMIN, ADMIN, SUPPORT_ADMIN.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "title": "Special Offer",
  "message": "Get 50% off on your next ride!",
  "notification_type": "PUSH",
  "broadcast_to": "ALL_USERS",
  "priority": "MEDIUM",
  "image_url": "https://example.com/promo.jpg",
  "action_type": "OPEN_URL",
  "action_data": {
    "url": "https://pravzo.com/offers"
  }
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 8. `POST` /{{BASE_URL}}/api/admin/notifications/broadcast

**Name:** Broadcast to All Riders  
**Category:** `[ADMIN] Notifications > Notification Operations`  
**Description:** Broadcast notification to all riders. Accessible by SUPER_ADMIN, ADMIN, SUPPORT_ADMIN.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "title": "New Zone Added",
  "message": "You can now accept rides in the new city zone",
  "notification_type": "PUSH",
  "broadcast_to": "ALL_RIDERS",
  "priority": "HIGH"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 9. `POST` /{{BASE_URL}}/api/admin/notifications/broadcast

**Name:** Broadcast to City  
**Category:** `[ADMIN] Notifications > Notification Operations`  
**Description:** Broadcast notification to all users and riders in a specific city. Accessible by SUPER_ADMIN, ADMIN, SUPPORT_ADMIN.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "title": "Service Update",
  "message": "New pickup points added in Mumbai",
  "notification_type": "PUSH",
  "broadcast_to": "CITY",
  "filter_city": "Mumbai",
  "priority": "MEDIUM"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 10. `POST` /{{BASE_URL}}/api/admin/notifications/schedule

**Name:** Schedule Notification  
**Category:** `[ADMIN] Notifications > Notification Operations`  
**Description:** Schedule a notification for future delivery. Accessible by SUPER_ADMIN, ADMIN, SUPPORT_ADMIN.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "title": "Maintenance Notice",
  "message": "System maintenance scheduled for tonight 10 PM to 12 AM",
  "notification_type": "PUSH",
  "broadcast_to": "ALL_USERS",
  "scheduled_at": "2026-07-14T22:00:00Z",
  "priority": "URGENT"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 11. `PATCH` /{{BASE_URL}}/api/admin/notifications/1/cancel-schedule

**Name:** Cancel Scheduled Notification  
**Category:** `[ADMIN] Notifications > Notification Operations`  
**Description:** Cancel a scheduled notification before it's sent. Accessible by SUPER_ADMIN, ADMIN, SUPPORT_ADMIN.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 12. `PATCH` /{{BASE_URL}}/api/admin/notifications/1/resend

**Name:** Resend Failed Notification  
**Category:** `[ADMIN] Notifications > Notification Operations`  
**Description:** Retry sending a failed notification. Max 3 retry attempts. Accessible by SUPER_ADMIN, ADMIN, SUPPORT_ADMIN.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 13. `DELETE` /{{BASE_URL}}/api/admin/notifications/1

**Name:** Delete Notification  
**Category:** `[ADMIN] Notifications > Notification Operations`  
**Description:** Soft delete a notification. Accessible by SUPER_ADMIN, ADMIN only.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 14. `GET` /{{BASE_URL}}/api/admin/notifications/templates?page=1&limit=20&template_type=&category=&is_active=

**Name:** Get Templates List  
**Category:** `[ADMIN] Notifications > Template Management`  
**Description:** Get paginated list of notification templates. Accessible by SUPER_ADMIN, ADMIN, SUPPORT_ADMIN.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | Page number (default: 1) | `1` |
| `limit` | String | Optional | Items per page (default: 20) | `20` |
| `template_type` | String | Optional | Filter by type: PUSH, EMAIL, SMS, IN_APP | `` |
| `category` | String | Optional | Filter by category: BOOKING, PAYMENT, PROMOTION, ALERT, SYSTEM | `` |
| `is_active` | String | Optional | Filter by status: true/false | `` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 15. `POST` /{{BASE_URL}}/api/admin/notifications/templates

**Name:** Create Template  
**Category:** `[ADMIN] Notifications > Template Management`  
**Description:** Create a new reusable notification template with variable support. Accessible by SUPER_ADMIN, ADMIN only.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "template_name": "payment_failed",
  "template_type": "PUSH",
  "title": "Payment Failed",
  "message": "Payment of Ã¢â€šÂ¹{{amount}} failed for booking #{{booking_id}}. Please try again.",
  "category": "PAYMENT",
  "variables": [
    "amount",
    "booking_id"
  ],
  "is_active": true
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 16. `POST` /{{BASE_URL}}/api/admin/notifications/templates

**Name:** Create Email Template  
**Category:** `[ADMIN] Notifications > Template Management`  
**Description:** Create an email template with HTML support. Accessible by SUPER_ADMIN, ADMIN only.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "template_name": "welcome_email",
  "template_type": "EMAIL",
  "category": "SYSTEM",
  "email_subject": "Welcome to Pravzo!",
  "email_body": "<h1>Welcome {{user_name}}!</h1><p>Thank you for joining Pravzo. Your account is now active.</p>",
  "variables": [
    "user_name"
  ],
  "is_active": true
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 17. `PATCH` /{{BASE_URL}}/api/admin/notifications/templates/1

**Name:** Update Template  
**Category:** `[ADMIN] Notifications > Template Management`  
**Description:** Update an existing notification template. Accessible by SUPER_ADMIN, ADMIN only.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "title": "Payment Failed - Updated",
  "message": "Payment of Ã¢â€šÂ¹{{amount}} failed for booking #{{booking_id}}. Please check your payment method and try again.",
  "is_active": true
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 18. `DELETE` /{{BASE_URL}}/api/admin/notifications/templates/1

**Name:** Delete Template  
**Category:** `[ADMIN] Notifications > Template Management`  
**Description:** Soft delete a notification template. Accessible by SUPER_ADMIN, ADMIN only.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-admin-landing-cms"></a> [ADMIN] Landing CMS

#### 1. `GET` /{{BASE_URL}}/api/admin/landing/hero

**Name:** Get Hero  
**Category:** `[ADMIN] Landing CMS > Admin - Hero Section`  
**Description:** Get hero section content. Accessible by SUPER_ADMIN, ADMIN, CONTENT_ADMIN.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `PATCH` /{{BASE_URL}}/api/admin/landing/hero

**Name:** Update Hero  
**Category:** `[ADMIN] Landing CMS > Admin - Hero Section`  
**Description:** Update hero section content (title, subtitle, description, button, image). Accessible by SUPER_ADMIN, ADMIN, CONTENT_ADMIN.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "hero_title": "Welcome to Pravzo - Your Ride Partner",
  "hero_subtitle": "Safe, Reliable & Affordable Rides",
  "hero_description": "Book rides instantly with verified drivers. Available 24/7 across multiple cities in India.",
  "button_text": "Download App Now",
  "button_url": "#download",
  "hero_image": "https://example.com/hero-image.jpg"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `GET` /{{BASE_URL}}/api/admin/landing/statistics

**Name:** Get Statistics  
**Category:** `[ADMIN] Landing CMS > Admin - Statistics`  
**Description:** Get landing page statistics. Accessible by SUPER_ADMIN, ADMIN, REPORT_ADMIN.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `GET` /{{BASE_URL}}/api/admin/landing/statistics?realtime=true

**Name:** Get Realtime Statistics  
**Category:** `[ADMIN] Landing CMS > Admin - Statistics`  
**Description:** Get real-time statistics from database (live counts). Accessible by SUPER_ADMIN, ADMIN, REPORT_ADMIN.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `realtime` | String | Optional | Fetch real-time stats from database | `true` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 5. `PATCH` /{{BASE_URL}}/api/admin/landing/statistics

**Name:** Update Statistics  
**Category:** `[ADMIN] Landing CMS > Admin - Statistics`  
**Description:** Manually update statistics. Accessible by SUPER_ADMIN, ADMIN only.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "total_users": 15000,
  "total_riders": 7500,
  "total_bookings": 75000,
  "total_cities": 20,
  "total_downloads": 35000
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 6. `POST` /{{BASE_URL}}/api/admin/landing/statistics/sync

**Name:** Sync Statistics from Database  
**Category:** `[ADMIN] Landing CMS > Admin - Statistics`  
**Description:** Sync statistics from actual database tables (users, riders, bookings, cities). Accessible by SUPER_ADMIN, ADMIN only.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 7. `GET` /{{BASE_URL}}/api/admin/landing/partners?page=1&limit=20

**Name:** List Partners  
**Category:** `[ADMIN] Landing CMS > Admin - Partners`  
**Description:** Get paginated list of partners. Accessible by SUPER_ADMIN, ADMIN, CONTENT_ADMIN, REPORT_ADMIN.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | Page number | `1` |
| `limit` | String | Optional | Items per page | `20` |
| `is_active` | String | Optional | Filter by active status | `true` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 8. `GET` /{{BASE_URL}}/api/admin/landing/partners/1

**Name:** Get Partner Details  
**Category:** `[ADMIN] Landing CMS > Admin - Partners`  
**Description:** Get single partner details by ID. Accessible by SUPER_ADMIN, ADMIN, CONTENT_ADMIN, REPORT_ADMIN.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 9. `POST` /{{BASE_URL}}/api/admin/landing/partners

**Name:** Create Partner  
**Category:** `[ADMIN] Landing CMS > Admin - Partners`  
**Description:** Create a new partner. Accessible by SUPER_ADMIN, ADMIN, CONTENT_ADMIN.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "partner_name": "Amazon",
  "partner_logo": "https://example.com/amazon-logo.png",
  "partner_website": "https://www.amazon.in",
  "display_order": 1
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 10. `PATCH` /{{BASE_URL}}/api/admin/landing/partners/1

**Name:** Update Partner  
**Category:** `[ADMIN] Landing CMS > Admin - Partners`  
**Description:** Update partner details. Accessible by SUPER_ADMIN, ADMIN, CONTENT_ADMIN.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "partner_name": "Amazon India",
  "partner_logo": "https://example.com/amazon-logo-new.png",
  "partner_website": "https://www.amazon.in",
  "display_order": 2,
  "is_active": true
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 11. `DELETE` /{{BASE_URL}}/api/admin/landing/partners/1

**Name:** Delete Partner  
**Category:** `[ADMIN] Landing CMS > Admin - Partners`  
**Description:** Soft delete partner (sets deleted_at timestamp). Accessible by SUPER_ADMIN, ADMIN only.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 12. `GET` /{{BASE_URL}}/api/admin/landing/contact

**Name:** Get Contact Information  
**Category:** `[ADMIN] Landing CMS > Admin - Contact`  
**Description:** Get contact information and social links. Accessible by SUPER_ADMIN, ADMIN, CONTENT_ADMIN, SUPPORT_ADMIN.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 13. `PATCH` /{{BASE_URL}}/api/admin/landing/contact

**Name:** Update Contact Information  
**Category:** `[ADMIN] Landing CMS > Admin - Contact`  
**Description:** Update contact information and social media links. Accessible by SUPER_ADMIN, ADMIN, CONTENT_ADMIN.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "support_email": "support@pravzo.com",
  "support_phone": "+91-9876543210",
  "office_address": "Pravzo Technologies Pvt Ltd, Koramangala, Bangalore, Karnataka 560034, India",
  "google_map_url": "https://maps.google.com/?q=Pravzo+Bangalore",
  "facebook_url": "https://www.facebook.com/pravzo",
  "instagram_url": "https://www.instagram.com/pravzo",
  "linkedin_url": "https://www.linkedin.com/company/pravzo",
  "twitter_url": "https://twitter.com/pravzo",
  "youtube_url": "https://www.youtube.com/@pravzo"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 14. `GET` /{{BASE_URL}}/api/admin/landing/footer

**Name:** Get Footer  
**Category:** `[ADMIN] Landing CMS > Admin - Footer`  
**Description:** Get footer content. Accessible by SUPER_ADMIN, ADMIN, CONTENT_ADMIN.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 15. `PATCH` /{{BASE_URL}}/api/admin/landing/footer

**Name:** Update Footer  
**Category:** `[ADMIN] Landing CMS > Admin - Footer`  
**Description:** Update footer content (copyright, about text, quick links). Accessible by SUPER_ADMIN, ADMIN, CONTENT_ADMIN.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "copyright_text": "Ã‚Â© 2026 Pravzo Technologies. All rights reserved.",
  "about_text": "Pravzo is India's leading ride-sharing platform connecting riders and drivers across 20+ cities.",
  "quick_links": [
    {
      "title": "About Us",
      "url": "/about"
    },
    {
      "title": "How it Works",
      "url": "/how-it-works"
    },
    {
      "title": "Safety",
      "url": "/safety"
    },
    {
      "title": "Privacy Policy",
      "url": "/privacy"
    },
    {
      "title": "Terms & Conditions",
      "url": "/terms"
    }
  ],
  "footer_email": "info@pravzo.com",
  "footer_phone": "+91-1800-123-4567",
  "footer_address": "Bangalore, Karnataka, India"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 16. `GET` /{{BASE_URL}}/api/admin/landing/enquiries?page=1&limit=20

**Name:** List Enquiries  
**Category:** `[ADMIN] Landing CMS > Admin - Contact Enquiries`  
**Description:** Get paginated list of contact enquiries with filters. Accessible by SUPER_ADMIN, ADMIN, SUPPORT_ADMIN.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | Page number | `1` |
| `limit` | String | Optional | Items per page | `20` |
| `status` | String | Optional | PENDING, IN_PROGRESS, RESOLVED, CLOSED | `PENDING` |
| `priority` | String | Optional | LOW, MEDIUM, HIGH, URGENT | `HIGH` |
| `assigned_to` | String | Optional | Admin ID | `1` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 17. `GET` /{{BASE_URL}}/api/admin/landing/enquiries/1

**Name:** Get Enquiry Details  
**Category:** `[ADMIN] Landing CMS > Admin - Contact Enquiries`  
**Description:** Get single enquiry details by ID. Accessible by SUPER_ADMIN, ADMIN, SUPPORT_ADMIN.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 18. `GET` /{{BASE_URL}}/api/admin/landing/enquiries/statistics

**Name:** Get Enquiry Statistics  
**Category:** `[ADMIN] Landing CMS > Admin - Contact Enquiries`  
**Description:** Get enquiry statistics (total, by status, by priority). Accessible by SUPER_ADMIN, ADMIN, SUPPORT_ADMIN, REPORT_ADMIN.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 19. `PATCH` /{{BASE_URL}}/api/admin/landing/enquiries/1/status

**Name:** Update Enquiry Status  
**Category:** `[ADMIN] Landing CMS > Admin - Contact Enquiries`  
**Description:** Update enquiry status, priority, and add admin notes. Accessible by SUPER_ADMIN, ADMIN, SUPPORT_ADMIN.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "admin_notes": "Contacted user via phone. Will follow up via email."
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 20. `PATCH` /{{BASE_URL}}/api/admin/landing/enquiries/1/assign

**Name:** Assign Enquiry to Admin  
**Category:** `[ADMIN] Landing CMS > Admin - Contact Enquiries`  
**Description:** Assign enquiry to an admin for follow-up. Accessible by SUPER_ADMIN, ADMIN, SUPPORT_ADMIN.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "assigned_to": 2
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 21. `GET` /{{BASE_URL}}/api/public/landing/hero

**Name:** Get Hero Section  
**Category:** `[ADMIN] Landing CMS > Public - Landing Page APIs`  
**Description:** Get hero section content for landing page. No authentication required.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 22. `GET` /{{BASE_URL}}/api/public/landing/statistics

**Name:** Get Statistics  
**Category:** `[ADMIN] Landing CMS > Public - Landing Page APIs`  
**Description:** Get landing page statistics (users, riders, bookings, cities, downloads). No authentication required.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 23. `GET` /{{BASE_URL}}/api/public/landing/partners?is_active=true

**Name:** Get Partners  
**Category:** `[ADMIN] Landing CMS > Public - Landing Page APIs`  
**Description:** Get list of partners for landing page. No authentication required.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `is_active` | String | Optional | Filter active partners only | `true` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 24. `GET` /{{BASE_URL}}/api/public/landing/contact

**Name:** Get Contact Information  
**Category:** `[ADMIN] Landing CMS > Public - Landing Page APIs`  
**Description:** Get contact information and social links for landing page. No authentication required.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 25. `GET` /{{BASE_URL}}/api/public/landing/footer

**Name:** Get Footer  
**Category:** `[ADMIN] Landing CMS > Public - Landing Page APIs`  
**Description:** Get footer content for landing page. No authentication required.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 26. `POST` /{{BASE_URL}}/api/public/landing/enquiries

**Name:** Submit Contact Enquiry  
**Category:** `[ADMIN] Landing CMS > Public - Landing Page APIs`  
**Description:** Submit a contact enquiry from landing page. No authentication required.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+91-9876543210",
  "subject": "Partnership Enquiry",
  "message": "I would like to discuss a potential partnership opportunity with Pravzo. Please contact me at your earliest convenience."
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-admin-branch-management"></a> [ADMIN] Branch Management

#### 1. `POST` /{{BASE_URL}}/api/super-admin/branches

**Name:** Create Branch  
**Category:** `[ADMIN] Branch Management > Branch CRUD Operations`  
**Description:** Create a new branch with complete information and settings. SUPER_ADMIN permission required.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "branch_name": "Pravzo Pune Office",
  "branch_code": "BR004",
  "branch_type": "SUB",
  "branch_status": "ACTIVE",
  "address_line1": "123 FC Road",
  "address_line2": "Near Deccan Gymkhana",
  "city": "Pune",
  "state": "Maharashtra",
  "country": "India",
  "pin_code": "411004",
  "latitude": 18.5204,
  "longitude": 73.8567,
  "email": "pune@pravzo.com",
  "phone_number": "+919876543220",
  "alternate_phone": "+919876543221",
  "gst_number": "27AABCP5678F1Z5",
  "pan_number": "AABCP5678F",
  "business_license": "MH-2026-54321",
  "opening_date": "2026-08-01",
  "manager_id": 1,
  "employee_count": 15,
  "service_radius_km": 12,
  "settings": {
    "timezone": "Asia/Kolkata",
    "max_riders": 40,
    "max_vehicles": 80,
    "max_daily_bookings": 400,
    "booking_radius_km": 12,
    "commission_percentage": 10,
    "auto_assign_riders": true,
    "accept_cash": true,
    "accept_online": true,
    "accept_wallet": true
  }
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `GET` /{{BASE_URL}}/api/super-admin/branches?page=1&limit=20

**Name:** Get All Branches  
**Category:** `[ADMIN] Branch Management > Branch CRUD Operations`  
**Description:** Get paginated list of all branches with optional filters  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | Page number | `1` |
| `limit` | String | Optional | Items per page (1-100) | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `GET` /{{BASE_URL}}/api/super-admin/branches?search=Mumbai&status=ACTIVE&city=Mumbai&state=Maharashtra&branchType=MAIN&sortBy=branch_name&sortOrder=ASC&page=1&limit=20

**Name:** Search & Filter Branches  
**Category:** `[ADMIN] Branch Management > Branch CRUD Operations`  
**Description:** Search and filter branches with multiple criteria  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `search` | String | Optional | Search by name, code, email, phone, city | `Mumbai` |
| `status` | String | Optional | ACTIVE, INACTIVE, MAINTENANCE, SUSPENDED | `ACTIVE` |
| `city` | String | Optional | - | `Mumbai` |
| `state` | String | Optional | - | `Maharashtra` |
| `branchType` | String | Optional | MAIN, SUB, FRANCHISE, WAREHOUSE | `MAIN` |
| `sortBy` | String | Optional | - | `branch_name` |
| `sortOrder` | String | Optional | - | `ASC` |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `GET` /{{BASE_URL}}/api/super-admin/branches/1

**Name:** Get Branch Details  
**Category:** `[ADMIN] Branch Management > Branch CRUD Operations`  
**Description:** Get complete details of a specific branch including settings  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 5. `PUT` /{{BASE_URL}}/api/super-admin/branches/1

**Name:** Update Branch  
**Category:** `[ADMIN] Branch Management > Branch CRUD Operations`  
**Description:** Update branch information  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "branch_name": "Pravzo Mumbai Central (Updated)",
  "branch_type": "MAIN",
  "address_line1": "123 MG Road, Andheri East",
  "address_line2": "Near Metro Station",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "pin_code": "400069",
  "latitude": 19.1136,
  "longitude": 72.8697,
  "email": "mumbai@pravzo.com",
  "phone_number": "+919876543210",
  "alternate_phone": "+919876543211",
  "gst_number": "27AABCP1234F1Z5",
  "pan_number": "AABCP1234F",
  "business_license": "MH-2025-12345",
  "manager_id": 1,
  "employee_count": 30,
  "service_radius_km": 20
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 6. `PATCH` /{{BASE_URL}}/api/super-admin/branches/1/status

**Name:** Update Branch Status  
**Category:** `[ADMIN] Branch Management > Branch CRUD Operations`  
**Description:** Update branch status. Cannot set to INACTIVE if branch has active bookings.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "status": "MAINTENANCE"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 7. `DELETE` /{{BASE_URL}}/api/super-admin/branches/1

**Name:** Delete Branch  
**Category:** `[ADMIN] Branch Management > Branch CRUD Operations`  
**Description:** Soft delete branch. Cannot delete if branch has active bookings, riders, vehicles, or assigned admin.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 8. `GET` /{{BASE_URL}}/api/super-admin/branches/1/statistics

**Name:** Get Branch Statistics  
**Category:** `[ADMIN] Branch Management > Branch Analytics`  
**Description:** Get comprehensive statistics for a branch including users, riders, vehicles, bookings, revenue, payments, and withdrawals  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 9. `GET` /{{BASE_URL}}/api/super-admin/branches/1/activity?page=1&limit=50

**Name:** Get Branch Activity Logs  
**Category:** `[ADMIN] Branch Management > Branch Analytics`  
**Description:** Get activity logs for a branch showing all create, update, delete, and status change operations  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `50` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 10. `GET` /{{BASE_URL}}/api/super-admin/branches/1/settings

**Name:** Get Branch Settings  
**Category:** `[ADMIN] Branch Management > Branch Settings`  
**Description:** Get operational settings for a branch  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 11. `PUT` /{{BASE_URL}}/api/super-admin/branches/1/settings

**Name:** Update Branch Settings  
**Category:** `[ADMIN] Branch Management > Branch Settings`  
**Description:** Update operational settings for a branch  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "timezone": "Asia/Kolkata",
  "currency": "INR",
  "language": "en",
  "max_riders": 60,
  "max_vehicles": 120,
  "max_daily_bookings": 600,
  "booking_radius_km": 20,
  "min_booking_amount": 50,
  "commission_percentage": 12,
  "auto_assign_riders": true,
  "auto_accept_bookings": false,
  "enable_email_notifications": true,
  "enable_sms_notifications": true,
  "enable_push_notifications": true,
  "accept_cash": true,
  "accept_online": true,
  "accept_wallet": true
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-admin-rental-management"></a> [ADMIN] Rental Management

#### 1. `GET` /{{BASE_URL}}/api/admin/rentals?page=1&limit=20

**Name:** Get All Rentals  
**Category:** `[ADMIN] Rental Management`  
**Description:** Retrieve list of all rentals with advanced pagination, searching, sorting, and filters.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |
| `status` | String | Optional | CREATED, PAYMENT_PENDING, CONFIRMED, RESERVED, READY_FOR_PICKUP, ACTIVE, EXTENDED, RETURN_PENDING, INSPECTION_PENDING, COMPLETED, CANCELLED, FORCE_CLOSED, OVERDUE, FAILED | `ACTIVE` |
| `search` | String | Optional | Search by registration number, customer name, email | `` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `GET` /{{BASE_URL}}/api/admin/rentals/1

**Name:** Get Rental Details  
**Category:** `[ADMIN] Rental Management`  
**Description:** Fetch detailed information of a specific rental including vehicle details, plan details, checklist, and deposit logs.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `POST` /{{BASE_URL}}/api/admin/rentals/1/otp

**Name:** Generate Pickup OTP  
**Category:** `[ADMIN] Rental Management`  
**Description:** Generate a new 6-digit OTP code for rental vehicle pickup verification.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `PATCH` /{{BASE_URL}}/api/admin/rentals/1/pickup

**Name:** Pickup Rental  
**Category:** `[ADMIN] Rental Management`  
**Description:** Confirm checklist, inspection results, digital signature, and verify OTP to start the rental. Transitions status to ACTIVE.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "otp": "123456",
  "signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  "customerConfirmation": true,
  "payOnPickup": true,
  "paymentMethod": "CASH",
  "branchId": 1,
  "inspection": {
    "batteryOk": true,
    "tyresOk": true,
    "brakeOk": true,
    "lightsOk": true,
    "bodyOk": true,
    "mirrorOk": true,
    "helmetOk": true,
    "fuelLevel": "FULL",
    "accessories": [
      "HELMET",
      "MIRROR"
    ],
    "notes": "Excellent condition"
  },
  "checklist": {
    "documentsVerified": true,
    "vehicleKeyHandover": true,
    "helmetHandover": true
  },
  "images": [
    "https://pravzo-bucket.s3.amazonaws.com/inspections/img1.jpg"
  ],
  "videos": []
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 5. `PATCH` /{{BASE_URL}}/api/admin/rentals/1/return

**Name:** Return Rental  
**Category:** `[ADMIN] Rental Management`  
**Description:** Process return details, calculate late penalties, damages, cleaning charges, generate invoice, deduct from security deposit, and set vehicle back to AVAILABLE.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "customerConfirmation": true,
  "branchId": 1,
  "signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  "damageCost": 0,
  "damageDescription": "No damage",
  "cleaningCost": 50,
  "missingAccessoriesCost": 0,
  "fuelShortageCost": 0,
  "batteryIssueCost": 0,
  "policyViolationCost": 0,
  "inspection": {
    "batteryOk": true,
    "tyresOk": true,
    "brakeOk": true,
    "lightsOk": true,
    "bodyOk": true,
    "mirrorOk": true,
    "helmetOk": true,
    "fuelLevel": "FULL",
    "notes": "Returned clean with minor dust"
  },
  "checklist": {
    "keysReturned": true,
    "helmetReturned": true,
    "documentsReturned": true
  },
  "images": [],
  "videos": []
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 6. `PATCH` /{{BASE_URL}}/api/admin/rentals/1/extend

**Name:** Extend Rental  
**Category:** `[ADMIN] Rental Management`  
**Description:** Extend active rental duration. Validates overlap with future bookings and requires prepayment.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "duration": 3,
  "durationUnit": "days",
  "paymentMethod": "WALLET",
  "paymentStatus": "PAID"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 7. `PATCH` /{{BASE_URL}}/api/admin/rentals/1/cancel

**Name:** Cancel Rental  
**Category:** `[ADMIN] Rental Management`  
**Description:** Super Admin cancel rental booking before start. Releases vehicle status.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "reason": "User cancelled plans"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 8. `PATCH` /{{BASE_URL}}/api/admin/rentals/1/force-close

**Name:** Force Close Rental  
**Category:** `[ADMIN] Rental Management`  
**Description:** Super Admin force close rental. Releases vehicle back to AVAILABLE immediately.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "reason": "Outstanding overdue non-communicative user"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 9. `GET` /{{BASE_URL}}/api/admin/rentals/overdue

**Name:** Get Overdue Rentals  
**Category:** `[ADMIN] Rental Management`  
**Description:** Get a list of all rentals that have passed their expected return end date.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 10. `GET` /{{BASE_URL}}/api/admin/rentals/1/invoice

**Name:** Get Rental Invoice  
**Category:** `[ADMIN] Rental Management`  
**Description:** Get the generated invoice breakdown of a completed rental.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 11. `GET` /{{BASE_URL}}/api/admin/rentals/1/payment-history

**Name:** Get Payment History  
**Category:** `[ADMIN] Rental Management`  
**Description:** Get transaction details of all payments/refunds made for this rental.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 12. `GET` /{{BASE_URL}}/api/admin/rentals/1/timeline

**Name:** Get Rental Timeline  
**Category:** `[ADMIN] Rental Management`  
**Description:** Fetch a chronological history of status changes and activities for the rental.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 13. `GET` /{{BASE_URL}}/api/admin/rentals/1/damage-report

**Name:** Get Damage Report  
**Category:** `[ADMIN] Rental Management`  
**Description:** Get repair details and inspection logs of vehicle damage reported during the rental.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 14. `POST` /{{BASE_URL}}/api/admin/rentals/1/inspection

**Name:** Post Inspection  
**Category:** `[ADMIN] Rental Management`  
**Description:** Record manual pre-rental or post-rental vehicle inspection log.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "inspectionType": "PRE_RENTAL",
  "batteryOk": true,
  "tyresOk": true,
  "brakeOk": true,
  "lightsOk": true,
  "bodyOk": true,
  "mirrorOk": true,
  "helmetOk": true,
  "fuelLevel": "FULL",
  "notes": "Manually logged checklist success"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 15. `POST` /{{BASE_URL}}/api/admin/rentals/1/checklist

**Name:** Post Checklist  
**Category:** `[ADMIN] Rental Management`  
**Description:** Record manual pickup or return operations checklists.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "checklistType": "PICKUP",
  "items": {
    "keyPassed": true,
    "cleanCheck": true
  },
  "customerConfirmation": true,
  "adminConfirmation": true,
  "digitalSignature": "base64SignatureHere"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-admin-financial-system"></a> [ADMIN] Financial System

#### 1. `GET` /{{BASE_URL}}/api/super-admin/wallets?page=1&limit=20&holderType=CUSTOMER

**Name:** Get Wallets List  
**Category:** `[ADMIN] Financial System > Wallet APIs`  
**Description:** Super admin retrieves all system/user wallet accounts with pagination.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |
| `holderType` | String | Optional | CUSTOMER, RIDER, BRANCH, PARTNER, ADMIN, PLATFORM | `CUSTOMER` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `GET` /{{BASE_URL}}/api/super-admin/wallets/1

**Name:** Get Wallet Details  
**Category:** `[ADMIN] Financial System > Wallet APIs`  
**Description:** Fetch details of a single wallet account including derived balance.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `GET` /{{BASE_URL}}/api/super-admin/wallets/1/transactions?limit=50

**Name:** Get Wallet Transactions  
**Category:** `[ADMIN] Financial System > Wallet APIs`  
**Description:** Retrieve transaction audit history log for a specific wallet account.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `limit` | String | Optional | - | `50` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `POST` /{{BASE_URL}}/api/super-admin/wallets/1/credit

**Name:** Manual Wallet Credit  
**Category:** `[ADMIN] Financial System > Wallet APIs`  
**Description:** Super admin posts a balanced double-entry manual credit to a wallet account.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "amount": 250,
  "description": "Manual referral bonus adjustment credit"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 5. `POST` /{{BASE_URL}}/api/super-admin/wallets/1/debit

**Name:** Manual Wallet Debit  
**Category:** `[ADMIN] Financial System > Wallet APIs`  
**Description:** Super admin posts a balanced double-entry manual debit to a wallet account.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "amount": 50,
  "description": "Manual fine adjustment debit"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 6. `GET` /{{BASE_URL}}/api/super-admin/wallets/1/ledger

**Name:** Get Wallet Ledger Trace  
**Category:** `[ADMIN] Financial System > Wallet APIs`  
**Description:** Get raw ledger entry journal logs associated with this wallet holder.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 7. `POST` /{{BASE_URL}}/api/payments/create

**Name:** Create Payment Transaction  
**Category:** `[ADMIN] Financial System > Payment APIs`  
**Description:** Initialize a payment intent for a customer transaction.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "referenceType": "RENTAL",
  "referenceId": "12",
  "userId": 5,
  "amount": 1200,
  "paymentMethod": "Razorpay",
  "gatewayProvider": "RAZORPAY"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 8. `POST` /{{BASE_URL}}/api/payments/1/verify

**Name:** Verify Payment Transaction  
**Category:** `[ADMIN] Financial System > Payment APIs`  
**Description:** Confirm payment capture status and write double-entry record to ledger.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "razorpayPaymentId": "pay_rzp_demo12345",
  "razorpayOrderId": "order_rzp_demo54321",
  "razorpaySignature": "sig_rzp_demo_value_here"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 9. `POST` /{{BASE_URL}}/api/payments/1/refund

**Name:** Refund Payment Transaction  
**Category:** `[ADMIN] Financial System > Payment APIs`  
**Description:** Initiate full/partial gateway refund, record tax/revenue reversals in ledger.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "amount": 300,
  "reason": "Rental booking cancelled by customer"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 10. `GET` /{{BASE_URL}}/api/payments?page=1&limit=20&status=SUCCESS

**Name:** Get Payments List  
**Category:** `[ADMIN] Financial System > Payment APIs`  
**Description:** List payment transactions with filters.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |
| `status` | String | Optional | - | `SUCCESS` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 11. `GET` /{{BASE_URL}}/api/payments/1

**Name:** Get Payment Details  
**Category:** `[ADMIN] Financial System > Payment APIs`  
**Description:** Retrieve details of a single payment transaction.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 12. `GET` /{{BASE_URL}}/api/payments/1/history

**Name:** Get Payment History  
**Category:** `[ADMIN] Financial System > Payment APIs`  
**Description:** Get detailed lifecycle events for a payment transaction (attempts and refunds).  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 13. `POST` /{{BASE_URL}}/api/super-admin/settlements/run

**Name:** Run Settlement Calculations  
**Category:** `[ADMIN] Financial System > Settlement APIs`  
**Description:** Calculate active rider, branch, partner balances, and compile payouts.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "period": "DAILY"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 14. `GET` /{{BASE_URL}}/api/super-admin/settlements?page=1&limit=20

**Name:** Get Settlements List  
**Category:** `[ADMIN] Financial System > Settlement APIs`  
**Description:** Get list of all settlements.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 15. `GET` /{{BASE_URL}}/api/super-admin/settlements/1

**Name:** Get Settlement Details  
**Category:** `[ADMIN] Financial System > Settlement APIs`  
**Description:** Retrieve detail description of a settlement.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 16. `PATCH` /{{BASE_URL}}/api/super-admin/settlements/1/process

**Name:** Process Settlement Payout  
**Category:** `[ADMIN] Financial System > Settlement APIs`  
**Description:** Move settlement to processing state.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 17. `PATCH` /{{BASE_URL}}/api/super-admin/settlements/1/complete

**Name:** Complete Settlement Payout  
**Category:** `[ADMIN] Financial System > Settlement APIs`  
**Description:** Complete payout, post clearing entries to ledger, and subtract balances.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "transactionId": "TXN_SETTL_998811"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 18. `GET` /{{BASE_URL}}/api/super-admin/ledger/entries?page=1&limit=50

**Name:** Get Ledger Entries Journal  
**Category:** `[ADMIN] Financial System > Ledger APIs`  
**Description:** Super admin retrieves all journal lines posted to the double-entry books.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `50` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 19. `GET` /{{BASE_URL}}/api/super-admin/ledger/accounts

**Name:** Get Ledger Accounts Structure  
**Category:** `[ADMIN] Financial System > Ledger APIs`  
**Description:** Fetch all accounts defined in the system chart of accounts.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 20. `GET` /{{BASE_URL}}/api/super-admin/ledger/trial-balance

**Name:** Get Trial Balance  
**Category:** `[ADMIN] Financial System > Ledger APIs`  
**Description:** Compile trial balance (sum of debits vs credits for all accounts).  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 21. `GET` /{{BASE_URL}}/api/super-admin/finance/revenue?startDate=2026-07-01T00:00:00Z&endDate=2026-07-31T23:59:59Z

**Name:** Get Revenue Report  
**Category:** `[ADMIN] Financial System > Financial Reports`  
**Description:** Generate dynamic revenue summary metrics from the ledger.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `startDate` | String | Optional | - | `2026-07-01T00:00:00Z` |
| `endDate` | String | Optional | - | `2026-07-31T23:59:59Z` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 22. `GET` /{{BASE_URL}}/api/super-admin/finance/expenses?startDate=2026-07-01T00:00:00Z&endDate=2026-07-31T23:59:59Z

**Name:** Get Expenses Report  
**Category:** `[ADMIN] Financial System > Financial Reports`  
**Description:** Generate dynamic expenses summary metrics from the ledger.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `startDate` | String | Optional | - | `2026-07-01T00:00:00Z` |
| `endDate` | String | Optional | - | `2026-07-31T23:59:59Z` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 23. `GET` /{{BASE_URL}}/api/super-admin/finance/refunds?startDate=2026-07-01T00:00:00Z&endDate=2026-07-31T23:59:59Z

**Name:** Get Refunds Report  
**Category:** `[ADMIN] Financial System > Financial Reports`  
**Description:** Get total processed refunds metrics.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `startDate` | String | Optional | - | `2026-07-01T00:00:00Z` |
| `endDate` | String | Optional | - | `2026-07-31T23:59:59Z` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 24. `GET` /{{BASE_URL}}/api/super-admin/finance/commissions?startDate=2026-07-01T00:00:00Z&endDate=2026-07-31T23:59:59Z

**Name:** Get Commissions Report  
**Category:** `[ADMIN] Financial System > Financial Reports`  
**Description:** Retrieve platform commission stats report.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `startDate` | String | Optional | - | `2026-07-01T00:00:00Z` |
| `endDate` | String | Optional | - | `2026-07-31T23:59:59Z` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 25. `GET` /{{BASE_URL}}/api/super-admin/finance/taxes?startDate=2026-07-01T00:00:00Z&endDate=2026-07-31T23:59:59Z

**Name:** Get Taxes Report  
**Category:** `[ADMIN] Financial System > Financial Reports`  
**Description:** Get total taxation cgst/sgst details.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `startDate` | String | Optional | - | `2026-07-01T00:00:00Z` |
| `endDate` | String | Optional | - | `2026-07-31T23:59:59Z` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 26. `POST` /{{BASE_URL}}/api/super-admin/finance/reconcile

**Name:** Execute Gateway Reconciliation  
**Category:** `[ADMIN] Financial System > Financial Reports`  
**Description:** Execute ledger-to-gateway balance consistency reconciliation report.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "date": "2026-07-21"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-admin-communication-events"></a> [ADMIN] Communication & Events

#### 1. `GET` /{{BASE_URL}}/api/super-admin/notifications?page=1&limit=20

**Name:** Get Notifications List  
**Category:** `[ADMIN] Communication & Events > Notifications`  
**Description:** Fetch all notifications sent via the communications engine.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `page` | String | Optional | - | `1` |
| `limit` | String | Optional | - | `20` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `GET` /{{BASE_URL}}/api/super-admin/notifications/1

**Name:** Get Notification Details  
**Category:** `[ADMIN] Communication & Events > Notifications`  
**Description:** Get detailed properties of a single notification.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `POST` /{{BASE_URL}}/api/super-admin/notifications/send

**Name:** Send Notification  
**Category:** `[ADMIN] Communication & Events > Notifications`  
**Description:** Enqueues a single notification for dispatch via email/SMS/WhatsApp/Push.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "recipientType": "USER",
  "recipientId": 1,
  "channelType": "EMAIL",
  "subject": "System Update Notice",
  "body": "Hi there, your billing information has been modified.",
  "priority": 1
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `POST` /{{BASE_URL}}/api/super-admin/notifications/broadcast

**Name:** Broadcast Notification  
**Category:** `[ADMIN] Communication & Events > Notifications`  
**Description:** Broadcasts a notification message to all active users/riders/admins.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "recipientType": "USER",
  "channelType": "SMS",
  "body": "System Scheduled Maintenance will take place tonight between 2AM and 4AM."
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 5. `PATCH` /{{BASE_URL}}/api/super-admin/notifications/1/read

**Name:** Mark Notification Read  
**Category:** `[ADMIN] Communication & Events > Notifications`  
**Description:** Mark notification status as READ.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 6. `DELETE` /{{BASE_URL}}/api/super-admin/notifications/1

**Name:** Delete Notification Record  
**Category:** `[ADMIN] Communication & Events > Notifications`  
**Description:** Permanently deletes a notification log.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 7. `POST` /{{BASE_URL}}/api/super-admin/templates

**Name:** Create Template  
**Category:** `[ADMIN] Communication & Events > Templates`  
**Description:** Create a reusable notification template.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "template_name": "LATE_RETURN_SMS",
  "body_template": "Hi {{name}}, your vehicle return has passed the expected time. Please return it soon to avoid late charges.",
  "channel_type": "SMS",
  "language": "en"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 8. `GET` /{{BASE_URL}}/api/super-admin/templates

**Name:** Get Templates List  
**Category:** `[ADMIN] Communication & Events > Templates`  
**Description:** Fetch all created notification templates.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 9. `PUT` /{{BASE_URL}}/api/super-admin/templates/1

**Name:** Update Template Details  
**Category:** `[ADMIN] Communication & Events > Templates`  
**Description:** Update a template content.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "template_name": "LATE_RETURN_SMS",
  "body_template": "Hi {{name}}, return update: please contact hub soon to avoid late fees.",
  "channel_type": "SMS"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 10. `DELETE` /{{BASE_URL}}/api/super-admin/templates/1

**Name:** Delete Template  
**Category:** `[ADMIN] Communication & Events > Templates`  
**Description:** Delete a notification template.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 11. `POST` /{{BASE_URL}}/api/super-admin/campaigns

**Name:** Create Marketing Campaign  
**Category:** `[ADMIN] Communication & Events > Campaigns`  
**Description:** Create a new campaign targeting a specific template.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "campaign_name": "Diwali Blast 2026",
  "template_id": 1
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 12. `GET` /{{BASE_URL}}/api/super-admin/campaigns

**Name:** Get Campaigns List  
**Category:** `[ADMIN] Communication & Events > Campaigns`  
**Description:** Retrieve campaign runs list.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 13. `PATCH` /{{BASE_URL}}/api/super-admin/campaigns/1/start

**Name:** Start Campaign Run  
**Category:** `[ADMIN] Communication & Events > Campaigns`  
**Description:** Triggers campaign audience segmentation, generates and enqueues template messages.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 14. `PATCH` /{{BASE_URL}}/api/super-admin/campaigns/1/stop

**Name:** Stop Campaign Run  
**Category:** `[ADMIN] Communication & Events > Campaigns`  
**Description:** Pauses/stops an active campaign.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 15. `GET` /{{BASE_URL}}/api/preferences

**Name:** Get User Preferences  
**Category:** `[ADMIN] Communication & Events > Preferences`  
**Description:** Get logged user opt-out notification preferences.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 16. `PATCH` /{{BASE_URL}}/api/preferences

**Name:** Update User Preferences  
**Category:** `[ADMIN] Communication & Events > Preferences`  
**Description:** Update user notification preference flags (disallowing opt-out for transactional alerts).  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "preferences": [
    {
      "channelType": "SMS",
      "category": "MARKETING",
      "enabled": false
    },
    {
      "channelType": "EMAIL",
      "category": "MARKETING",
      "enabled": true
    }
  ]
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 17. `POST` /{{BASE_URL}}/api/webhooks/events

**Name:** Receive Webhook Event  
**Category:** `[ADMIN] Communication & Events > Webhooks`  
**Description:** Receive webhook alerts from external systems, publish event details on bus.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "eventType": "USER_REGISTERED",
  "payload": {
    "userId": 24,
    "name": "Jane Doe"
  }
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 18. `GET` /{{BASE_URL}}/api/webhooks/logs?limit=50

**Name:** Get Webhook logs  
**Category:** `[ADMIN] Communication & Events > Webhooks`  
**Description:** Fetch chronological webhook processing and delivery logs.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `limit` | String | Optional | - | `50` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-admin-bi-analytics-dashboard"></a> [ADMIN] BI & Analytics Dashboard

#### 1. `GET` /{{BASE_URL}}/api/super-admin/dashboard?dashboardType=EXECUTIVE

**Name:** Get Dashboard KPIs  
**Category:** `[ADMIN] BI & Analytics Dashboard > Dashboard`  
**Description:** Fetch Executive / Finance / Fleet / Operations Dashboard KPIs with dynamic caches.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `dashboardType` | String | Optional | - | `EXECUTIVE` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `GET` /{{BASE_URL}}/api/super-admin/dashboard/widgets

**Name:** Get Widgets List  
**Category:** `[ADMIN] BI & Analytics Dashboard > Dashboard`  
**Description:** Retrieve list of all active dashboard widgets configurations.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `POST` /{{BASE_URL}}/api/super-admin/dashboard/widgets

**Name:** Create Custom Widget  
**Category:** `[ADMIN] BI & Analytics Dashboard > Dashboard`  
**Description:** Registers a new visual widget.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "widget_name": "Riders Efficiency Line Chart",
  "widget_type": "CHART",
  "data_source": "getRiderPerformance",
  "config": {
    "color": "blue",
    "labels": "monthly"
  }
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `PUT` /{{BASE_URL}}/api/super-admin/dashboard/widgets/1

**Name:** Update Widget Config  
**Category:** `[ADMIN] BI & Analytics Dashboard > Dashboard`  
**Description:** Modify parameters of an existing widget.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "widget_name": "Riders Efficiency Bar Chart",
  "widget_type": "CHART",
  "data_source": "getRiderPerformance"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 5. `DELETE` /{{BASE_URL}}/api/super-admin/dashboard/widgets/1

**Name:** Delete Widget Config  
**Category:** `[ADMIN] BI & Analytics Dashboard > Dashboard`  
**Description:** Remove widget definition from the system.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 6. `GET` /{{BASE_URL}}/api/super-admin/analytics

**Name:** Get Master Diagnostics  
**Category:** `[ADMIN] BI & Analytics Dashboard > Analytics Endpoints`  
**Description:** Retrieves high level analytics system statistics.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 7. `GET` /{{BASE_URL}}/api/super-admin/analytics/revenue?startDate=2026-07-01&endDate=2026-07-31

**Name:** Get Revenue Analytics  
**Category:** `[ADMIN] BI & Analytics Dashboard > Analytics Endpoints`  
**Description:** Compiles hourly/daily/weekly/monthly revenue and branch shares.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `startDate` | String | Optional | - | `2026-07-01` |
| `endDate` | String | Optional | - | `2026-07-31` |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 8. `GET` /{{BASE_URL}}/api/super-admin/analytics/rentals

**Name:** Get Rental Analytics  
**Category:** `[ADMIN] BI & Analytics Dashboard > Analytics Endpoints`  
**Description:** Retrieve rental metrics, growth, cancellation ratios, and heatmaps.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 9. `GET` /{{BASE_URL}}/api/super-admin/analytics/jobs

**Name:** Get Job Analytics  
**Category:** `[ADMIN] BI & Analytics Dashboard > Analytics Endpoints`  
**Description:** Retrieve rider jobs stats, delivery times, reassignment parameters.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 10. `GET` /{{BASE_URL}}/api/super-admin/analytics/users

**Name:** Get Users Analytics  
**Category:** `[ADMIN] BI & Analytics Dashboard > Analytics Endpoints`  
**Description:** Get active user sessions and diagnostics statistics.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 11. `GET` /{{BASE_URL}}/api/super-admin/analytics/riders

**Name:** Get Riders Analytics  
**Category:** `[ADMIN] BI & Analytics Dashboard > Analytics Endpoints`  
**Description:** Riders ratings, distances covered, online times, acceptance levels.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 12. `GET` /{{BASE_URL}}/api/super-admin/analytics/fleet

**Name:** Get Fleet Analytics  
**Category:** `[ADMIN] BI & Analytics Dashboard > Analytics Endpoints`  
**Description:** Vehicle fleet availability, battery health, maintenance downtime.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 13. `GET` /{{BASE_URL}}/api/super-admin/analytics/payments

**Name:** Get Payments Analytics  
**Category:** `[ADMIN] BI & Analytics Dashboard > Analytics Endpoints`  
**Description:** Commissions, incentives, settlement volumes, outstanding receivables.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 14. `GET` /{{BASE_URL}}/api/super-admin/analytics/branches

**Name:** Get Branches Analytics  
**Category:** `[ADMIN] BI & Analytics Dashboard > Analytics Endpoints`  
**Description:** Branch revenues, rentals counts, active hub growth metrics.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 15. `GET` /{{baseUrl}}/api/super-admin/analytics/bookings?startDate=2026-01-01&endDate=2026-12-31&status=ACTIVE

**Name:** Get Bookings Analytics Summary & Trends  
**Category:** `[ADMIN] BI & Analytics Dashboard > Analytics Endpoints`  
**Description:** Fetches comprehensive booking performance metrics including total volume, revenue, status breakdown, duration and daily trend analysis.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `startDate` | String | Optional | Start date filter | `2026-01-01` |
| `endDate` | String | Optional | End date filter | `2026-12-31` |
| `status` | String | Optional | Booking status filter | `ACTIVE` |

**Sample Success Response (200):**
```json
{
  "success": true,
  "message": "Booking analytics data compiled",
  "data": {
    "totalBookings": 120,
    "totalRevenue": 450000,
    "averageBookingValue": 3750,
    "averageDurationDays": 14.5,
    "statusBreakdown": [
      {
        "status": "ACTIVE",
        "count": 45
      },
      {
        "status": "COMPLETED",
        "count": 75
      }
    ],
    "paymentStatusBreakdown": [
      {
        "payment_status": "PAID",
        "count": 120
      }
    ],
    "dailyTrend": [
      {
        "date": "2026-08-10",
        "booking_count": 12,
        "daily_revenue": 45000
      }
    ],
    "byBranch": [
      {
        "branch_name": "Bangalore Central Hub",
        "branch_id": 1,
        "booking_count": 80,
        "total_revenue": 300000
      }
    ]
  }
}
```

---

#### 16. `POST` /{{BASE_URL}}/api/super-admin/reports/generate

**Name:** Trigger Report Generation  
**Category:** `[ADMIN] BI & Analytics Dashboard > Reports & Custom Builder`  
**Description:** Initializes reporting queries and generates dynamic spreadsheets.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "templateId": 1,
  "parameters": {
    "startDate": "2026-07-01",
    "endDate": "2026-07-31"
  }
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 17. `GET` /{{BASE_URL}}/api/super-admin/reports

**Name:** Get Generated Reports List  
**Category:** `[ADMIN] BI & Analytics Dashboard > Reports & Custom Builder`  
**Description:** Fetch all enqueued or completed reports history.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 18. `GET` /{{BASE_URL}}/api/super-admin/reports/1

**Name:** Get Report Details  
**Category:** `[ADMIN] BI & Analytics Dashboard > Reports & Custom Builder`  
**Description:** Retrieves details of a generated report, including its file URL download link.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 19. `POST` /{{BASE_URL}}/api/super-admin/reports/schedule

**Name:** Schedule Recurring Report  
**Category:** `[ADMIN] BI & Analytics Dashboard > Reports & Custom Builder`  
**Description:** Saves a recurring email reporting rule.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "templateId": 1,
  "frequency": "WEEKLY",
  "recipientEmail": "executives@pravzo.com"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 20. `PATCH` /{{BASE_URL}}/api/super-admin/reports/1/run

**Name:** Force Run Scheduled Report  
**Category:** `[ADMIN] BI & Analytics Dashboard > Reports & Custom Builder`  
**Description:** Immediately triggers calculation run on a schedule.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "templateId": 1
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 21. `DELETE` /{{BASE_URL}}/api/super-admin/reports/1

**Name:** Delete Report Log  
**Category:** `[ADMIN] BI & Analytics Dashboard > Reports & Custom Builder`  
**Description:** Deletes a generated report row.  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 22. `POST` /{{BASE_URL}}/api/super-admin/export/csv

**Name:** Export CSV  
**Category:** `[ADMIN] BI & Analytics Dashboard > Export Engine`  
**Description:** Launches background CSV generation job.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "reportType": "REVENUE",
  "format": "CSV",
  "filters": {
    "startDate": "2026-07-01",
    "endDate": "2026-07-31"
  }
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 23. `POST` /{{BASE_URL}}/api/super-admin/export/excel

**Name:** Export Excel  
**Category:** `[ADMIN] BI & Analytics Dashboard > Export Engine`  
**Description:** Launches background Excel spreadsheet generation job.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "reportType": "RENTALS",
  "format": "EXCEL",
  "filters": {
    "status": "COMPLETED"
  }
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 24. `POST` /{{BASE_URL}}/api/super-admin/export/pdf

**Name:** Export PDF  
**Category:** `[ADMIN] BI & Analytics Dashboard > Export Engine`  
**Description:** Launches background PDF generation job.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "reportType": "FLEET",
  "format": "PDF",
  "filters": {
    "status": "AVAILABLE"
  }
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-admin-super-admin-extensions-v18-0-0-"></a> [ADMIN] Super Admin Extensions (v18.0.0)

#### 1. `GET` /{{BASE_URL}}/api/super-admin/settings

**Name:** Get System Settings  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > System Settings`  
**Description:** Get all platform system settings  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `PUT` /{{BASE_URL}}/api/super-admin/settings

**Name:** Update System Setting  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > System Settings`  
**Description:** Update a global system setting key  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "key": "PLATFORM_FEE_PERCENTAGE",
  "value": "6.0"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `GET` /{{BASE_URL}}/api/super-admin/audit-logs

**Name:** Get Audit Logs  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Audit Logs`  
**Description:** Fetch system audit trails and administrative actions  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `GET` /{{baseUrl}}/api/super-admin/audit-logs/1

**Name:** Get Audit Log By ID  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Audit Logs`  
**Description:** Fetch single audit log record detail with admin user metadata and full payload details.  

**Sample Success Response (200):**
```json
{
  "success": true,
  "message": "Audit log detail fetched successfully",
  "data": {
    "audit_id": 1,
    "admin_id": 101,
    "action": "UPDATE_SYSTEM_SETTING",
    "module": "SYSTEM",
    "details": {
      "key": "platform.name",
      "value": "Pravzo"
    },
    "ip_address": "127.0.0.1",
    "user_agent": "Mozilla/5.0",
    "created_at": "2026-08-15T10:00:00.000Z",
    "admin_name": "Super Admin",
    "admin_email": "admin@pravzo.com",
    "admin_role": "SUPER_ADMIN"
  }
}
```

---

#### 5. `GET` /{{baseUrl}}/api/super-admin/audit-logs/export?module=AUTH&limit=500

**Name:** Export Audit Logs CSV  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Audit Logs`  
**Description:** Exports audit trail logs as downloadable CSV report.  

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `module` | String | Optional | Filter export by module | `AUTH` |
| `limit` | String | Optional | Max records to export | `500` |

**Sample Success Response (200):**
```json
{
  "success": true,
  "message": "CSV stream returned"
}
```

---

#### 6. `GET` /{{BASE_URL}}/api/super-admin/maintenance

**Name:** Get Maintenance Records  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Vehicle Maintenance`  
**Description:** Fetch vehicle maintenance logs  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 7. `POST` /{{BASE_URL}}/api/super-admin/maintenance

**Name:** Create Maintenance Record  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Vehicle Maintenance`  
**Description:** Log new vehicle service or repair record  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "vehicle_id": 1,
  "service_type": "Battery Replacement",
  "cost": 4500,
  "service_date": "2026-07-22"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 8. `GET` /{{baseUrl}}/api/super-admin/maintenance/1

**Name:** Get Maintenance Record By ID  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Vehicle Maintenance`  
**Description:** Fetch detailed maintenance job record including costs, schedule, technician, and vehicle details.  

**Sample Success Response (200):**
```json
{
  "success": true,
  "message": "Maintenance record fetched successfully",
  "data": {
    "maintenance_id": 1,
    "vehicle_id": 10,
    "maintenance_type": "BRAKE_PAD_REPLACEMENT",
    "description": "Routine front and rear brake pad replacement",
    "cost": 1500,
    "status": "IN_PROGRESS",
    "scheduled_date": "2026-08-16",
    "completed_date": null,
    "performed_by": 101,
    "registration_number": "KA-01-EV-1234",
    "model_name": "Ather 450X",
    "branch_name": "Bangalore Hub"
  }
}
```

---

#### 9. `PUT` /{{baseUrl}}/api/super-admin/maintenance/1

**Name:** Update Maintenance Record Detail  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Vehicle Maintenance`  
**Description:** Updates full maintenance job details.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "cost": 1800,
  "status": "COMPLETED",
  "description": "Brake pads replaced and tire pressure calibrated",
  "completed_date": "2026-08-16"
}
```

**Sample Success Response (200):**
```json
{
  "success": true,
  "message": "Maintenance record updated successfully",
  "data": {
    "maintenance_id": 1,
    "status": "COMPLETED",
    "cost": 1800
  }
}
```

---

#### 10. `DELETE` /{{baseUrl}}/api/super-admin/maintenance/1

**Name:** Delete Maintenance Record  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Vehicle Maintenance`  
**Description:** Deletes a maintenance record entry from the system.  

**Sample Success Response (200):**
```json
{
  "success": true,
  "message": "Maintenance record deleted successfully",
  "data": {
    "success": true
  }
}
```

---

#### 11. `GET` /{{BASE_URL}}/api/super-admin/insurance

**Name:** Get Insurance Policies  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Insurance Policies`  
**Description:** Fetch vehicle insurance policies  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 12. `POST` /{{BASE_URL}}/api/super-admin/insurance

**Name:** Create Insurance Policy  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Insurance Policies`  
**Description:** Add new vehicle insurance policy  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "vehicle_id": 1,
  "policy_number": "POL-2026-9901",
  "provider_name": "ICICI Lombard",
  "coverage_amount": 150000,
  "premium_amount": 12000,
  "start_date": "2026-01-01",
  "expiry_date": "2027-01-01"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 13. `GET` /{{baseUrl}}/api/super-admin/insurance/1

**Name:** Get Insurance Policy By ID  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Insurance Policies`  
**Description:** Fetch insurance policy details including coverage, premium, dates, and vehicle metadata.  

**Sample Success Response (200):**
```json
{
  "success": true,
  "message": "Insurance policy fetched successfully",
  "data": {
    "insurance_id": 1,
    "vehicle_id": 10,
    "policy_number": "POL-2026-987654",
    "provider": "HDFC ERGO General Insurance",
    "start_date": "2026-01-01",
    "expiry_date": "2027-01-01",
    "premium_amount": 4500,
    "coverage_details": "Comprehensive Cover up to 150000",
    "status": "ACTIVE",
    "registration_number": "KA-01-EV-1234"
  }
}
```

---

#### 14. `PUT` /{{baseUrl}}/api/super-admin/insurance/1

**Name:** Update Insurance Policy  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Insurance Policies`  
**Description:** Updates policy details, premium, status, or coverage.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "provider": "HDFC ERGO General Insurance",
  "policy_number": "POL-2026-987654-REV",
  "premium_amount": 4800,
  "status": "ACTIVE"
}
```

**Sample Success Response (200):**
```json
{
  "success": true,
  "message": "Insurance policy updated successfully",
  "data": {
    "insurance_id": 1,
    "status": "ACTIVE"
  }
}
```

---

#### 15. `DELETE` /{{baseUrl}}/api/super-admin/insurance/1

**Name:** Delete Insurance Policy  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Insurance Policies`  
**Description:** Deletes an insurance policy record from the database.  

**Sample Success Response (200):**
```json
{
  "success": true,
  "message": "Insurance policy deleted successfully",
  "data": {
    "success": true
  }
}
```

---

#### 16. `GET` /{{BASE_URL}}/api/super-admin/support/tickets

**Name:** Get Support Tickets  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Support Tickets`  
**Description:** List helpdesk support tickets  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 17. `POST` /{{BASE_URL}}/api/super-admin/support/tickets

**Name:** Create Support Ticket  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Support Tickets`  
**Description:** Create support ticket  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "user_id": 1,
  "category": "BILLING",
  "priority": "HIGH",
  "subject": "Refund Issue",
  "description": "Payment deducted but booking not confirmed"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 18. `GET` /{{baseUrl}}/api/super-admin/support/tickets/1

**Name:** Get Support Ticket By ID  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Support Tickets`  
**Description:** Fetch single support ticket with requester information, status, priority, and resolution notes.  

**Sample Success Response (200):**
```json
{
  "success": true,
  "message": "Support ticket fetched successfully",
  "data": {
    "ticket_id": 1,
    "ticket_code": "TKT-123456",
    "user_id": 42,
    "user_name": "John Doe",
    "user_email": "john@example.com",
    "category": "BILLING",
    "priority": "HIGH",
    "status": "OPEN",
    "subject": "Incorrect wallet deduction during rental start",
    "description": "Deducted 500 security deposit twice",
    "resolution_notes": null,
    "created_at": "2026-08-16T08:00:00.000Z"
  }
}
```

---

#### 19. `PUT` /{{baseUrl}}/api/super-admin/support/tickets/1

**Name:** Update Support Ticket Detail  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Support Tickets`  
**Description:** Updates support ticket properties (priority, category, assignee, description).  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "priority": "CRITICAL",
  "category": "BILLING",
  "assigned_admin_id": 101,
  "description": "Updated priority to critical after user escalated"
}
```

**Sample Success Response (200):**
```json
{
  "success": true,
  "message": "Support ticket updated successfully",
  "data": {
    "ticket_id": 1,
    "priority": "CRITICAL"
  }
}
```

---

#### 20. `POST` /{{baseUrl}}/api/super-admin/support/tickets/1/resolve

**Name:** Resolve Support Ticket  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Support Tickets`  
**Description:** Resolves a support ticket with resolution explanation and closes issue.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "resolution_notes": "Duplicate charge refunded to user wallet successfully."
}
```

**Sample Success Response (200):**
```json
{
  "success": true,
  "message": "Support ticket resolved successfully",
  "data": {
    "ticket_id": 1,
    "status": "RESOLVED",
    "resolution_notes": "Duplicate charge refunded to user wallet successfully."
  }
}
```

---

#### 21. `GET` /{{BASE_URL}}/api/super-admin/commissions/rules

**Name:** Get Commission Rules  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Commission & Taxes`  
**Description:** Get commission rules  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 22. `GET` /{{BASE_URL}}/api/super-admin/taxes/config

**Name:** Get Tax Configurations  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Commission & Taxes`  
**Description:** Get tax configurations  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 23. `GET` /{{baseUrl}}/api/super-admin/commissions/rules/1

**Name:** Get Commission Rule By ID  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Commission & Taxes`  
**Description:** Fetch specific commission rule definition by ID.  

**Sample Success Response (200):**
```json
{
  "success": true,
  "message": "Commission rule fetched successfully",
  "data": {
    "rule_id": 1,
    "rule_name": "E-Scooter Standard",
    "vehicle_type": "E_SCOOTER",
    "city": "Bangalore",
    "commission_percentage": 10,
    "min_commission": 0,
    "max_commission": 500,
    "is_active": 1,
    "priority": 1
  }
}
```

---

#### 24. `PUT` /{{baseUrl}}/api/super-admin/commissions/rules/1

**Name:** Update Commission Rule  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Commission & Taxes`  
**Description:** Updates commission calculation percentages and threshold limits.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "commission_percentage": 12.5,
  "max_commission": 600,
  "is_active": 1
}
```

**Sample Success Response (200):**
```json
{
  "success": true,
  "message": "Commission rule updated successfully",
  "data": {
    "rule_id": 1,
    "commission_percentage": 12.5
  }
}
```

---

#### 25. `DELETE` /{{baseUrl}}/api/super-admin/commissions/rules/1

**Name:** Delete Commission Rule  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Commission & Taxes`  
**Description:** Deletes a commission rule configuration.  

**Sample Success Response (200):**
```json
{
  "success": true,
  "message": "Commission rule deleted successfully",
  "data": {
    "success": true
  }
}
```

---

#### 26. `GET` /{{baseUrl}}/api/super-admin/taxes/config/1

**Name:** Get Tax Config By ID  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Commission & Taxes`  
**Description:** Fetch tax configuration by ID.  

**Sample Success Response (200):**
```json
{
  "success": true,
  "message": "Tax configuration fetched successfully",
  "data": {
    "tax_id": 1,
    "tax_name": "GST 18%",
    "rate_percentage": 18,
    "hsn_sac_code": "996601",
    "state_code": "ALL",
    "is_active": 1
  }
}
```

---

#### 27. `PUT` /{{baseUrl}}/api/super-admin/taxes/config/1

**Name:** Update Tax Config  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Commission & Taxes`  
**Description:** Updates tax configuration rate and state codes.  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "rate_percentage": 18,
  "is_active": 1
}
```

**Sample Success Response (200):**
```json
{
  "success": true,
  "message": "Tax configuration updated successfully",
  "data": {
    "tax_id": 1,
    "rate_percentage": 18
  }
}
```

---

#### 28. `DELETE` /{{baseUrl}}/api/super-admin/taxes/config/1

**Name:** Delete Tax Config  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Commission & Taxes`  
**Description:** Deletes a tax configuration entry.  

**Sample Success Response (200):**
```json
{
  "success": true,
  "message": "Tax configuration deleted successfully",
  "data": {
    "success": true
  }
}
```

---

#### 29. `GET` /{{BASE_URL}}/api/super-admin/invoices

**Name:** Get Invoices  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Invoices`  
**Description:** Get platform invoices  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 30. `GET` /{{BASE_URL}}/api/super-admin/incentives

**Name:** Get Incentives  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Incentives & Rewards`  
**Description:** Get incentives and rewards  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 31. `GET` /{{BASE_URL}}/api/super-admin/jobs

**Name:** Get Job Assignments  
**Category:** `[ADMIN] Super Admin Extensions (v18.0.0) > Job Assignments`  
**Description:** Get staff and driver job assignments  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-user-auth"></a> [USER] AUTH

#### 1. `POST` /{{baseUrl}}/auth/register

**Name:** Register  
**Category:** `[USER] AUTH`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "full_name": "Aman Singh",
  "mobile_number": "9876543210",
  "email": "aman@pravazo.com",
  "password": "pass@123",
  "role": "USER"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `POST` /{{baseUrl}}/auth/login

**Name:** Login  
**Category:** `[USER] AUTH`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "mobile_number": "9876543210",
  "password": "pass@123"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `POST` /{{baseUrl}}/auth/send-otp

**Name:** Send OTP  
**Category:** `[USER] AUTH`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "mobile": "9876543210",
  "purpose": "forgot_password"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `POST` /{{baseUrl}}/auth/verify-otp

**Name:** Verify OTP  
**Category:** `[USER] AUTH`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "mobile": "9876543210",
  "otp": "123456",
  "purpose": "login"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 5. `GET` /{{baseUrl}}/auth/check-mobile/9876543210

**Name:** Check Mobile  
**Category:** `[USER] AUTH`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 6. `POST` /{{baseUrl}}/auth/forgot-password

**Name:** Forgot Password  
**Category:** `[USER] AUTH`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "mobile": "9876543210"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 7. `POST` /{{baseUrl}}/auth/reset-password

**Name:** Reset Password  
**Category:** `[USER] AUTH`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "mobile": "9876543210",
  "otp": "123456",
  "new_password": "newpass@123"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.153Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 8. `PUT` /{{baseUrl}}/auth/change-password

**Name:** Change Password  
**Category:** `[USER] AUTH`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "currentPassword": "pass@123",
  "newPassword": "newpass@456"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 9. `POST` /{{baseUrl}}/auth/logout

**Name:** Logout  
**Category:** `[USER] AUTH`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-user-users"></a> [USER] USERS

#### 1. `GET` /{{baseUrl}}/users/{{userId}}

**Name:** Get My Profile  
**Category:** `[USER] USERS`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `PUT` /{{baseUrl}}/users/{{userId}}

**Name:** Update My Profile  
**Category:** `[USER] USERS`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "full_name": "Aman Kumar Singh",
  "gender": "Male",
  "address": "123, MG Road, Bangalore",
  "date_of_birth": "1995-06-15",
  "emergency_contact_name": "Riya Singh",
  "emergency_contact_number": "9123456780"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `DELETE` /{{baseUrl}}/users/{{userId}}

**Name:** Delete My Account  
**Category:** `[USER] USERS`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `POST` /{{baseUrl}}/users/{{userId}}/mobile

**Name:** Update Mobile â€” Step 1 (Send OTP)  
**Category:** `[USER] USERS`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "new_mobile": "9999988888"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 5. `PUT` /{{baseUrl}}/users/{{userId}}/mobile/verify

**Name:** Update Mobile â€” Step 2 (Verify OTP)  
**Category:** `[USER] USERS`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "new_mobile": "9999988888",
  "otp": "123456"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 6. `POST` /{{baseUrl}}/users/{{userId}}/email

**Name:** Update Email â€” Step 1 (Send OTP)  
**Category:** `[USER] USERS`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "new_email": "aman.new@pravazo.com"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 7. `PUT` /{{baseUrl}}/users/{{userId}}/email/verify

**Name:** Update Email â€” Step 2 (Verify OTP)  
**Category:** `[USER] USERS`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "new_email": "aman.new@pravazo.com",
  "otp": "123456"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 8. `GET` /{{baseUrl}}/users/{{userId}}/bank-details

**Name:** Get Bank Details  
**Category:** `[USER] USERS`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 9. `PUT` /{{baseUrl}}/users/{{userId}}/bank-details

**Name:** Update Bank Details  
**Category:** `[USER] USERS`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "bank_account_number": "12345678901234",
  "ifsc_code": "HDFC0001234",
  "branch_name": "MG Road Bangalore",
  "account_holder_name": "Aman Singh",
  "upi_id": "aman@hdfcbank",
  "payout_schedule": "Every Monday"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-user-riders"></a> [USER] RIDERS

#### 1. `POST` /{{baseUrl}}/riders/apply

**Name:** Apply as Rider  
**Category:** `[USER] RIDERS`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "selected_partner": "Swiggy",
  "rider_code": "SW-2025-001",
  "driving_license_number": "KA0520150012345",
  "driving_license_photo": "http://localhost:5000/uploads/dl_front.jpg",
  "driving_license_back_photo": "http://localhost:5000/uploads/dl_back.jpg",
  "aadhar_number": "234567890123",
  "aadhar_card_photo": "http://localhost:5000/uploads/aadhar_front.jpg",
  "aadhar_card_back_photo": "http://localhost:5000/uploads/aadhar_back.jpg",
  "bank_account_number": "12345678901234",
  "ifsc_code": "HDFC0001234",
  "branch_name": "MG Road Bangalore",
  "account_holder_name": "Aman Singh",
  "upi_id": "aman@hdfcbank",
  "payout_schedule": "Every Monday",
  "emergency_contact_name": "Riya Singh",
  "emergency_contact_number": "9123456780"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `GET` /{{baseUrl}}/riders/{{userId}}/application-status

**Name:** Get Application Status  
**Category:** `[USER] RIDERS`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `POST` /{{baseUrl}}/riders/verify-id

**Name:** Verify Rider ID â€” Aadhaar  
**Category:** `[USER] RIDERS`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "type": "aadhaar",
  "aadhar_number": "234567890123",
  "aadhar_card_photo": "http://localhost:5000/uploads/aadhar_front.jpg",
  "aadhar_card_back_photo": "http://localhost:5000/uploads/aadhar_back.jpg"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `POST` /{{baseUrl}}/riders/verify-id

**Name:** Verify Rider ID â€” Licence  
**Category:** `[USER] RIDERS`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "type": "licence",
  "driving_license_number": "KA0520150012345",
  "driving_license_photo": "http://localhost:5000/uploads/dl_front.jpg",
  "driving_license_back_photo": "http://localhost:5000/uploads/dl_back.jpg"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 5. `PUT` /{{baseUrl}}/admin/riders/5/verify

**Name:** Admin â€” Verify Rider  
**Category:** `[USER] RIDERS`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "application_status": "verified",
  "employee_status": "ACTIVE"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-user-vehicles"></a> [USER] VEHICLES

#### 1. `GET` /{{baseUrl}}/vehicles

**Name:** Get All Vehicles  
**Category:** `[USER] VEHICLES`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `GET` /{{baseUrl}}/vehicles/1

**Name:** Get Vehicle by ID  
**Category:** `[USER] VEHICLES`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-user-bookings"></a> [USER] BOOKINGS

#### 1. `POST` /{{baseUrl}}/bookings

**Name:** Create Booking  
**Category:** `[USER] BOOKINGS`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "reference_id": "BK-2025-001234",
  "vehicle_id": 1,
  "start_date": "2025-08-01",
  "end_date": "2025-08-07",
  "security_deposit": 500
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `GET` /{{baseUrl}}/bookings/user/{{userId}}

**Name:** Get My Bookings  
**Category:** `[USER] BOOKINGS`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `PUT` /{{baseUrl}}/bookings/1/cancel

**Name:** Cancel Booking  
**Category:** `[USER] BOOKINGS`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `GET` /{{baseUrl}}/bookings/1/agreement

**Name:** Get Booking Agreement  
**Category:** `[USER] BOOKINGS`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 5. `PUT` /{{baseUrl}}/bookings/1/complete

**Name:** Complete Booking (Rider)  
**Category:** `[USER] BOOKINGS`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 6. `PUT` /{{baseUrl}}/bookings/1/assign-rider

**Name:** Assign Rider (Admin)  
**Category:** `[USER] BOOKINGS`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "rider_id": 5
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-user-jobs"></a> [USER] JOBS

#### 1. `GET` /{{baseUrl}}/jobs/available

**Name:** Get Available Jobs  
**Category:** `[USER] JOBS`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `POST` /{{baseUrl}}/jobs/1/accept

**Name:** Accept Job  
**Category:** `[USER] JOBS`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `PUT` /{{baseUrl}}/jobs/1/complete

**Name:** Complete Job  
**Category:** `[USER] JOBS`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `GET` /{{baseUrl}}/jobs/user/{{userId}}

**Name:** Get My Jobs  
**Category:** `[USER] JOBS`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-user-notifications"></a> [USER] NOTIFICATIONS

#### 1. `GET` /{{baseUrl}}/notifications/user/{{userId}}

**Name:** Get My Notifications  
**Category:** `[USER] NOTIFICATIONS`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `PUT` /{{baseUrl}}/notifications/1/read

**Name:** Mark One as Read  
**Category:** `[USER] NOTIFICATIONS`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `PUT` /{{baseUrl}}/notifications/user/{{userId}}/read-all

**Name:** Mark All as Read  
**Category:** `[USER] NOTIFICATIONS`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-user-location"></a> [USER] LOCATION

#### 1. `POST` /{{baseUrl}}/location/update

**Name:** Update Rider Location  
**Category:** `[USER] LOCATION`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "latitude": 12.9716,
  "longitude": 77.5946
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-user-wallet"></a> [USER] WALLET

#### 1. `GET` /{{baseUrl}}/wallet/{{userId}}

**Name:** Get My Wallet  
**Category:** `[USER] WALLET`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `GET` /{{baseUrl}}/wallet/transactions/{{userId}}

**Name:** Get Wallet Transactions  
**Category:** `[USER] WALLET`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `POST` /{{baseUrl}}/wallet/topup-order

**Name:** Create Top-up Order  
**Category:** `[USER] WALLET`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "amount": 500
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `POST` /{{baseUrl}}/wallet/verify-topup

**Name:** Verify Top-up  
**Category:** `[USER] WALLET`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "razorpay_order_id": "order_XXXXXXXXXXXXXXX",
  "razorpay_payment_id": "pay_XXXXXXXXXXXXXXX",
  "razorpay_signature": "<signature>"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 5. `POST` /{{baseUrl}}/wallet/cashout

**Name:** Instant Cashout (Rider)  
**Category:** `[USER] WALLET`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "amount": 1000
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-user-payments"></a> [USER] PAYMENTS

#### 1. `GET` /{{baseUrl}}/payments/me?limit=20&offset=0

**Name:** Get My Payments  
**Category:** `[USER] PAYMENTS`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-user-payouts"></a> [USER] PAYOUTS

#### 1. `GET` /{{baseUrl}}/payouts/{{userId}}?limit=20&offset=0

**Name:** Get Payout History  
**Category:** `[USER] PAYOUTS`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-user-history"></a> [USER] HISTORY

#### 1. `GET` /{{baseUrl}}/history/me

**Name:** Get My Transaction History  
**Category:** `[USER] HISTORY`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-user-file-upload"></a> [USER] FILE UPLOAD

#### 1. `POST` /api/upload

**Name:** Upload Image  
**Category:** `[USER] FILE UPLOAD`  

**Request Body Content Type:** `formdata`

**Form Data Fields:**

| Key | Type | Description |
| :--- | :--- | :--- |
| `file` | `file` | - |

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-user-role-rider-upgrade"></a> [USER] Role & Rider Upgrade

#### 1. `POST` /{{baseUrl}}/users/{{userId}}/change-role

**Name:** Change Role  
**Category:** `[USER] Role & Rider Upgrade`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "role": "VEHICLE_WITH_JOB"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `POST` /{{baseUrl}}/riders/verify-code

**Name:** Verify Rider Code  
**Category:** `[USER] Role & Rider Upgrade`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "rider_code": "PV-2026-8941"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-user-coupons"></a> [USER] Coupons

#### 1. `POST` /{{baseUrl}}/coupons/validate

**Name:** Validate Coupon  
**Category:** `[USER] Coupons`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "code": "{{couponCode}}",
  "booking_amount": "{{bookingAmount}}"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `POST` /{{baseUrl}}/coupons/apply

**Name:** Apply Coupon  
**Category:** `[USER] Coupons`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "code": "{{couponCode}}",
  "booking_id": "{{bookingId}}",
  "booking_amount": "{{bookingAmount}}"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `GET` /{{baseUrl}}/coupons

**Name:** Admin â€” List Coupons  
**Category:** `[USER] Coupons`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `POST` /{{baseUrl}}/coupons

**Name:** Admin â€” Create Coupon  
**Category:** `[USER] Coupons`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "code": "WELCOME20",
  "description": "Welcome offer",
  "discount_type": "PERCENT",
  "discount_value": 20,
  "min_order_amount": 500,
  "max_discount_amount": 100,
  "max_uses_per_user": 1,
  "max_total_uses": 100,
  "is_active": true
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 5. `PUT` /{{baseUrl}}/coupons/WELCOME20

**Name:** Admin â€” Toggle Coupon  
**Category:** `[USER] Coupons`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "is_active": false
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-user-booking-invoice"></a> [USER] Booking Invoice

#### 1. `GET` /{{baseUrl}}/bookings/{{bookingId}}/invoice

**Name:** Download Invoice PDF  
**Category:** `[USER] Booking Invoice`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-user-breakdown-reports"></a> [USER] Breakdown Reports

#### 1. `POST` /{{baseUrl}}/breakdown-reports

**Name:** Submit Breakdown Report  
**Category:** `[USER] Breakdown Reports`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "booking_id": "{{bookingId}}",
  "vehicle_id": 1,
  "issue_type": "flat_tyre",
  "description": "Rear tyre punctured during ride",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "photo_url": "http://localhost:5000/uploads/report.jpg"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `GET` /{{baseUrl}}/breakdown-reports/me

**Name:** Get My Breakdown Reports  
**Category:** `[USER] Breakdown Reports`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-user-sos-alerts"></a> [USER] SOS Alerts

#### 1. `POST` /{{baseUrl}}/sos/alert

**Name:** Trigger SOS Alert  
**Category:** `[USER] SOS Alerts`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "booking_id": "{{bookingId}}",
  "vehicle_id": 1,
  "alert_type": "accident",
  "message": "Need immediate assistance",
  "latitude": 12.9716,
  "longitude": 77.5946
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `GET` /{{baseUrl}}/sos/me

**Name:** Get My SOS Alerts  
**Category:** `[USER] SOS Alerts`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `PUT` /{{baseUrl}}/sos/{{sosId}}/resolve

**Name:** Admin â€” Resolve SOS Alert  
**Category:** `[USER] SOS Alerts`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "resolution_note": "Handled by support team"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-user-charging-stations"></a> [USER] Charging Stations

#### 1. `GET` /{{baseUrl}}/charging-stations

**Name:** Get All Charging Stations  
**Category:** `[USER] Charging Stations`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `GET` /{{baseUrl}}/charging-stations?city=Bangalore&available=1&type=fast

**Name:** Search Charging Stations  
**Category:** `[USER] Charging Stations`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `GET` /{{baseUrl}}/charging-stations/{{stationId}}

**Name:** Get Charging Station By ID  
**Category:** `[USER] Charging Stations`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `POST` /{{baseUrl}}/charging-stations

**Name:** Admin â€” Create Charging Station  
**Category:** `[USER] Charging Stations`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "name": "Pravazo Fast Charger",
  "address": "MG Road, Bangalore",
  "city": "Bangalore",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "charger_type": "fast",
  "total_slots": 4,
  "available_slots": 2,
  "price_per_unit": 8.5,
  "phone": "9876543210",
  "image_url": "http://localhost:5000/uploads/charger.jpg"
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 5. `PUT` /{{baseUrl}}/charging-stations/{{stationId}}

**Name:** Admin â€” Update Charging Station  
**Category:** `[USER] Charging Stations`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "available_slots": 3,
  "price_per_unit": 9
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-user-guides-ev-tips"></a> [USER] Guides / EV Tips

#### 1. `GET` /{{baseUrl}}/guides

**Name:** Get All Guides  
**Category:** `[USER] Guides / EV Tips`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 2. `GET` /{{baseUrl}}/guides?category=safety

**Name:** Get Guides By Category  
**Category:** `[USER] Guides / EV Tips`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 3. `GET` /{{baseUrl}}/guides/{{guideIdOrSlug}}

**Name:** Get Guide By ID or Slug  
**Category:** `[USER] Guides / EV Tips`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

#### 4. `POST` /{{baseUrl}}/guides

**Name:** Admin â€” Create Guide  
**Category:** `[USER] Guides / EV Tips`  

**Request Body Content Type:** `application/json`

**Request Body (JSON Payload):**
```json
{
  "title": "EV Battery Safety",
  "slug": "ev-battery-safety",
  "category": "safety",
  "summary": "How to safely charge and maintain your EV battery",
  "content": "Battery safety tips for EV riders.",
  "thumbnail_url": "http://localhost:5000/uploads/guide.jpg",
  "read_time_minutes": 4,
  "is_featured": true,
  "is_published": true
}
```

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---


### <a id="-user-rider-performance"></a> [USER] Rider Performance

#### 1. `GET` /{{baseUrl}}/performance/{{userId}}?period=week

**Name:** Get Rider Performance  
**Category:** `[USER] Rider Performance`  

**Standard Response Schema:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T05:12:22.154Z",
    "requestId": "req_uuid_here"
  }
}
```

---

