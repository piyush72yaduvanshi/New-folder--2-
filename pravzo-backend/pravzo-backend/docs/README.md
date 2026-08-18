# Pravzo Unified API — Documentation & Operational Guide

Welcome to the **Pravzo Unified Backend** API documentation. This document details system setup, environment configuration, authentication flows, route specifications, response standards, database management, and testing workflows.

---

## 1. Quick Start & Server Setup

### Prerequisites
- Node.js v18+ or v20+
- MySQL 8.0+
- Redis 7.0+ (optional / caching enabled)
- MinIO / S3 (optional / object storage)

### Installation & Execution
```bash
# Install dependencies
npm ci

# Run database migrations
npm run migrate

# Run database verification
npm run verify

# Run development server
npm run dev

# Run automated regression test suite
npm test
```

Server starts at `http://localhost:5000`.

---

## 2. Environment Configuration (.env)

| Environment Variable | Required | Description |
|----------------------|----------|-------------|
| `PORT` | No (default `5000`) | Server HTTP port |
| `NODE_ENV` | Yes | `development`, `test`, or `production` |
| `DB_HOST` | Yes | MySQL database host |
| `DB_PORT` | Yes | MySQL database port (default `3306`) |
| `DB_USER` | Yes | MySQL user |
| `DB_PASSWORD` | Yes | MySQL password |
| `DB_NAME` | Yes | MySQL database name (`pravzo_db`) |
| `JWT_SECRET` | Yes | Customer / User domain JWT secret |
| `JWT_ACCESS_SECRET` | Yes | Admin domain Access Token secret |
| `JWT_REFRESH_SECRET` | Yes | Admin domain Refresh Token secret |
| `PAYMENT_PROVIDER` | Yes | `razorpay` (or `mock` in non-prod) |
| `RAZORPAYX_WEBHOOK_SECRET` | Yes | HMAC secret for RazorpayX webhooks |

---

## 3. Architecture & Security Model

### Authority Boundaries & Authentication Domains
1. **Admin Domain (`/api/admin/*`, `/api/super-admin/*`)**:
   - Authenticated via httpOnly cookies (`accessToken`, `refreshToken`) OR `Authorization: Bearer <token>`.
   - Verified against `admins` database table using `JWT_ACCESS_SECRET`.
   - Access controlled by `admin_permissions` DB table via `permissionMiddleware.js`.
2. **User Domain (`/api/auth/*`, `/api/users/*`, `/api/bookings/*`, etc.)**:
   - Authenticated via `Authorization: Bearer <token>` header.
   - Verified against `users` database table using `JWT_SECRET`.
   - Cross-domain tokens (Admin token on User route or User token on Admin route) are strictly rejected with HTTP 401.

### Rate Limiting Controls
- Global API limit: 100 requests per minute.
- Admin Login limit: 10 requests per 15 minutes per IP.
- User Login / Register limit: 15 requests per 15 minutes per IP.
- OTP Send / Verify limits: 5-10 requests per 10 minutes per IP.
- File Upload limit: 20 requests per 15 minutes per IP.

---

## 4. Response Contract & Error Standard

All API responses follow a standardized JSON envelope:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Human readable error message",
  "code": "ERROR_CODE_IDENTIFIER",
  "requestId": "12345678-1234-4234-8234-123456789012"
}
```

---

## 5. Postman Collection

Import `docs/Pravzo_Unified_API.postman_collection.json` into Postman to explore endpoints organized into logical folders:
- `HEALTH` (`/health`, `/health/ready`)
- `ADMIN AUTH` (`/api/admin/login`, `/api/admin/profile`)
- `ADMIN USERS` (`/api/admin/users`)
- `ADMIN KYC` (`/api/admin/kyc/pending`)
- `USER AUTH` (`/api/auth/register`, `/api/auth/login`)
- `USER WALLET` (`/api/wallet`)
- `WEBHOOKS` (`/api/webhooks/razorpayx/webhook`)

Set collection variables `baseUrl`, `adminToken`, and `userToken` for automated token injection.
