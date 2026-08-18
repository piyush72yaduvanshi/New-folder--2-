# Pravzo Unified Backend

Single Express server that runs **both** the Admin Panel API and the User/Rider App API
on one port (`5000` by default).

## Architecture

```
pravzo-backend/
├── server.js              ← entry point — starts everything
├── app.js                 ← single Express app with all routes
├── .env                   ← environment config (copy from .env.example)
│
├── src/
│   ├── config/            ← SHARED: db, redis, jwt, minio, razorpay, constants
│   ├── utils/             ← SHARED: logger, responseWrapper, password, helpers
│   ├── middleware/        ← SHARED: adminAuth, userAuth, errorHandler, requestLogger
│   │
│   ├── admin/             ← Admin Panel routes, controllers, services, repos
│   │   ├── controllers/   (19 controllers)
│   │   ├── routes/        (21 route files)
│   │   ├── services/      (21 services)
│   │   ├── repositories/  (21 repositories)
│   │   ├── models/        (Admin.js, RefreshToken.js)
│   │   ├── middleware/    (adminAuth shim, permissionMiddleware, securityMiddleware)
│   │   └── validations/   (19 validation schemas)
│   │
│   └── user/              ← User/Rider App routes, controllers, services, repos
│       ├── controllers/   (17 controllers)
│       ├── routes/        (20 route files)
│       ├── repositories/  (10 repositories)
│       ├── models/        (10 models)
│       ├── services/      (5 services — OTP, cache, razorpayX)
│       ├── middleware/    (userAuth shim, authorizeRoles, ownerMiddleware, etc.)
│       └── validators/    (2 validators)
│
├── scripts/               ← DB migration scripts
│   ├── runAllTables.js    ← creates all user-backend tables
│   ├── runUnifiedMigration.js ← runs UNIFIED_SCHEMA_MIGRATION.sql
│   └── seed.js
│
└── database/
    ├── UNIFIED_SCHEMA_MIGRATION.sql  ← run ONCE after all migrations
    └── README.md
```

## Route Prefix Map

| Prefix | Who handles it | Auth |
|--------|---------------|------|
| `GET /health` | health check | none |
| `POST /api/upload` | file upload (MinIO) | none |
| `/api/webhooks/*` | Razorpay/RazorpayX webhooks | none (HMAC verified) |
| `/api/admin/*` | Admin backend | Admin JWT (cookie) |
| `/api/super-admin/*` | Admin backend | Admin JWT (cookie) |
| `/api/public/landing` | Admin backend | none |
| `/api/auth/*` | User backend | none |
| `/api/users/*` | User backend | User JWT (Bearer) |
| `/api/riders/*` | User backend | User JWT (Bearer) |
| `/api/vehicles/*` | User backend | none (GET) |
| `/api/bookings/*` | User backend | User JWT (Bearer) |
| `/api/payments/*` | User backend | User JWT (Bearer) |
| `/api/wallet/*` | User backend | User JWT (Bearer) |
| `/api/jobs/*` | User backend | User JWT (Bearer) |
| `/api/notifications/*` | User backend | User JWT (Bearer) |
| `/api/coupons/*` | User backend | User JWT (Bearer) |
| `/api/performance/*` | User backend | User JWT (Bearer) |

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env — set DB_PASSWORD, JWT secrets, Razorpay keys
```

### 3. Run database migrations (in order)
```bash
# Step 1: Admin migrations (run numbered SQL files 00→20)
mysql -u root -p pravzo_db < "../backend admin/database/00_base_tables.sql"
# ... through 20_phase3_gap_resolution.sql

# Step 2: User tables
node scripts/runAllTables.js

# Step 3: Unified bridge migration (VIEWs + TRIGGERs)
node scripts/runUnifiedMigration.js
```

### 4. Start the server
```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

Server starts at: `http://localhost:5000`

## Auth Systems

Two completely separate JWT systems coexist on the same server:

| | Admin | User/Rider |
|-|-------|-----------|
| Token source | `req.cookies.accessToken` | `Authorization: Bearer <token>` |
| Token payload | `{ admin_id, email, role }` | `{ id, role }` |
| Secret env var | `JWT_ACCESS_SECRET` | `JWT_SECRET` |
| DB table | `admins` | `users` |
| Expiry | 55 min (+ 7d refresh) | 7 days |

Admin tokens **cannot** access user routes. User tokens **cannot** access admin routes.

## Password Compatibility

The merged `src/utils/password.js` handles both hash formats:
- **New passwords**: bcrypt (`$2b$...`) — used going forward
- **Legacy user passwords**: scrypt (`scrypt:salt:hash`) — verified transparently
- **Legacy admin passwords**: bcrypt — unchanged

No forced password reset needed on migration.

## Key Files Changed from Original Backends

| Original | Merged location | Change |
|----------|----------------|--------|
| `backend admin/app.js` | `app.js` (root) | Merged with user routes |
| `backend admin/server.js` | `server.js` (root) | Single startup |
| `backend-user/middleware/authMiddleware.js` | `src/middleware/userAuth.js` | Shared |
| `backend admin/src/middleware/authMiddleware.js` | `src/middleware/adminAuth.js` | Shared |
| `backend-user/scripts/createNotificationsTable.js` | uses `user_notifications` table | Renamed to avoid collision |
| `backend-user/routes/webhookRoutes.js` | mounted at `/api/webhooks` | Was `/api/payments` — conflict fixed |
