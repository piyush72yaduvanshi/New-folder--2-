'use strict';
// ============================================================
// Pravzo Unified Express App — Single Server, Single Port
// Admin routes: /api/admin/*, /api/super-admin/*
// User routes:  /api/auth/*, /api/users/*, /api/bookings/*, etc.
// ============================================================

require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const path         = require('path');
const fs           = require('fs');
const multer       = require('multer');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const hpp          = require('hpp');

// ── Shared utils & middleware ─────────────────────────────────────────────────
// ── Shared utils & middleware ─────────────────────────────────────────────────
const { requestIdMiddleware, sendError } = require('./src/utils/responseWrapper');
const requestLogger    = require('./src/middleware/requestLogger');
const errorHandler     = require('./src/middleware/errorHandler');
const { uploadFile }   = require('./src/config/minio');
const { globalApiLimiter, uploadLimiter } = require('./src/middleware/rateLimiters');
const userAuth = require('./src/middleware/userAuth');
const adminAuth = require('./src/middleware/adminAuth');

// ── Admin routes ──────────────────────────────────────────────────────────────
const adminAuthRoutes       = require('./src/admin/routes/authRoutes');
const dashboardRoutes       = require('./src/admin/routes/dashboardRoutes');
const adminUserRoutes       = require('./src/admin/routes/userRoutes');
const kycRoutes             = require('./src/admin/routes/kycRoutes');
const adminRiderRoutes      = require('./src/admin/routes/riderRoutes');
const adminBookingRoutes    = require('./src/admin/routes/bookingRoutes');
const adminVehicleRoutes    = require('./src/admin/routes/vehicleRoutes');
const fleetRoutes           = require('./src/admin/routes/fleetRoutes');
const adminPaymentRoutes    = require('./src/admin/routes/paymentRoutes');
const reportRoutes          = require('./src/admin/routes/reportRoutes');
const adminMgmtRoutes       = require('./src/admin/routes/adminManagementRoutes');
const adminNotifRoutes      = require('./src/admin/routes/notificationRoutes');
const landingCMSRoutes      = require('./src/admin/routes/landingCMSRoutes');
const landingPublicRoutes   = require('./src/admin/routes/landingPublicRoutes');
const branchRoutes          = require('./src/admin/routes/branchRoutes');
const rentalRoutes          = require('./src/admin/routes/rentalRoutes');
const superAdminRoutes      = require('./src/admin/routes/superAdminExtensionRoutes');
const healthRoutes          = require('./src/admin/routes/healthRoutes');
const {
  walletRouter, paymentRouter: adminFinancePaymentRouter,
  settlementRouter, ledgerRouter, reportRouter: financeReportRouter
} = require('./src/admin/routes/financeRoutes');
const {
  notificationRouter: commNotifRouter, templateRouter,
  campaignRouter, preferencesRouter, webhookRouter: commWebhookRouter
} = require('./src/admin/routes/communicationRoutes');
const {
  dashboardRouter: biDashboardRouter, analyticsRouter,
  reportsRouter: biReportsRouter, exportRouter
} = require('./src/admin/routes/biRoutes');

// ── User routes ───────────────────────────────────────────────────────────────
const userAuthRoutes         = require('./src/user/routes/authRoutes');
const userProfileRoutes      = require('./src/user/routes/userRoutes');
const roleRoutes             = require('./src/user/routes/roleRoutes');
const riderRoutes            = require('./src/user/routes/riderRoutes');
const vehicleRoutes          = require('./src/user/routes/vehicleRoutes');
const bookingRoutes          = require('./src/user/routes/bookingRoutes');
const invoiceRoutes          = require('./src/user/routes/invoiceRoutes');
const jobRoutes              = require('./src/user/routes/jobRoutes');
const userNotifRoutes        = require('./src/user/routes/notificationRoutes');
const locationRoutes         = require('./src/user/routes/locationRoutes');
const userPaymentRoutes      = require('./src/user/routes/paymentRoutes');
const walletRoutes           = require('./src/user/routes/walletRoutes');
const historyRoutes          = require('./src/user/routes/historyRoutes');
const payoutRoutes           = require('./src/user/routes/payoutRoutes');
const couponRoutes           = require('./src/user/routes/couponRoutes');
const supportRoutes          = require('./src/user/routes/supportRoutes');
const resourceRoutes         = require('./src/user/routes/resourceRoutes');
const performanceRoutes      = require('./src/user/routes/performanceRoutes');
const webhookRoutes          = require('./src/user/routes/webhookRoutes');

const app = express();

// ── Security middleware (applied globally, before everything) ─────────────────
app.use(helmet({ crossOriginEmbedderPolicy: false }));

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
  credentials: true
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Global API rate limiter
app.use('/api', globalApiLimiter);

app.use(hpp({ whitelist: ['ids', 'vehicleIds', 'riderIds', 'status', 'role'] }));
app.use(requestIdMiddleware);    // Attach X-Request-Id to every request
app.use(requestLogger);          // Log all requests via Winston

// ── Razorpay/RazorpayX webhooks — MUST be before express.json() ──────────────
// Raw body needed for HMAC signature verification
app.use('/api/webhooks', webhookRoutes);

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── File upload endpoint (MinIO / S3 Cloud Storage) ───────────────────────────
const { upload, processCloudUploads } = require('./src/middleware/uploadMiddleware');

const flexAuth = (req, res, next) => {
  if (req.cookies?.accessToken || (req.headers.authorization?.startsWith('Bearer ') && req.path.includes('/admin'))) {
    return adminAuth(req, res, next);
  }
  return userAuth(req, res, next);
};

app.post('/api/upload', uploadLimiter, flexAuth, upload.any(), processCloudUploads(), async (req, res) => {
  const fileList = req.files || (req.file ? [req.file] : []);
  if (!fileList.length) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const uploaded = fileList.map(f => ({
    fieldname: f.fieldname,
    filename: f.cloudFilename || f.originalname,
    fileUrl: f.cloudUrl,
    url: f.cloudUrl,
    mimetype: f.mimetype,
    size: f.size
  }));

  return res.status(200).json({
    success: true,
    message: 'File(s) uploaded to cloud storage successfully',
    fileUrl: uploaded[0].fileUrl,
    url: uploaded[0].fileUrl,
    filename: uploaded[0].filename,
    files: uploaded
  });
});

// ── Upload Management Routes ──────────────────────────────────────────────────
const { deleteFile: minioDelete, minioClient, BUCKET_NAME, getFileUrl } = require('./src/config/minio');

// DELETE /api/upload/:fileId — delete file from cloud storage
app.delete('/api/upload/:fileId', flexAuth, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    if (!fileId) {
      return res.status(400).json({ success: false, message: 'fileId is required' });
    }
    const deleted = await minioDelete(fileId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'File not found or already deleted' });
    }
    return res.status(200).json({ success: true, message: 'File deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to delete file' });
  }
});

// GET /api/upload/:fileId/signed-url — generate presigned URL for private access
app.get('/api/upload/:fileId/signed-url', flexAuth, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const expiresIn = Math.min(Math.max(Number(req.query.expires_in) || 3600, 60), 86400);

    if (!fileId) {
      return res.status(400).json({ success: false, message: 'fileId is required' });
    }

    const signedUrl = await new Promise((resolve, reject) => {
      minioClient.presignedGetObject(BUCKET_NAME, fileId, expiresIn, (err, url) => {
        if (err) reject(err);
        else resolve(url);
      });
    });

    return res.status(200).json({
      success: true,
      data: {
        file_id: fileId,
        signed_url: signedUrl,
        expires_in: expiresIn,
        expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to generate signed URL' });
  }
});

// GET /api/upload/:fileId/metadata — get file metadata from MinIO
app.get('/api/upload/:fileId/metadata', flexAuth, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    if (!fileId) {
      return res.status(400).json({ success: false, message: 'fileId is required' });
    }

    const stat = await new Promise((resolve, reject) => {
      minioClient.statObject(BUCKET_NAME, fileId, (err, stat) => {
        if (err) reject(err);
        else resolve(stat);
      });
    });

    return res.status(200).json({
      success: true,
      data: {
        file_id: fileId,
        size: stat.size,
        last_modified: stat.lastModified,
        content_type: stat.metaData?.['content-type'] || 'application/octet-stream',
        etag: stat.etag,
        public_url: getFileUrl(fileId),
      },
    });
  } catch (err) {
    if (err.code === 'NotFound' || err.message?.includes('Not Found')) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    return res.status(500).json({ success: false, message: err.message || 'Failed to get file metadata' });
  }
});

// ── Health check (no auth) ────────────────────────────────────────────────────
app.use('/health', healthRoutes);

// ════════════════════════════════════════════════════════════════════
// ADMIN ROUTES  →  /api/admin/*  and  /api/super-admin/*
// All protected by adminAuth middleware (applied inside route files)
// ════════════════════════════════════════════════════════════════════
app.use('/api/admin',                                  adminAuthRoutes);
app.use('/api/admin/dashboard',                        dashboardRoutes);
app.use('/api/admin/users',                            adminUserRoutes);
app.use('/api/super-admin/users',                      adminUserRoutes);
app.use('/api/admin/kyc',                              kycRoutes);
app.use('/api/admin/riders',                           adminRiderRoutes);
app.use('/api/admin/bookings',                         adminBookingRoutes);
app.use('/api/admin/vehicles',                         adminVehicleRoutes);
app.use('/api/super-admin/vehicles',                   adminVehicleRoutes);
app.use('/api/admin/fleet',                            fleetRoutes);
app.use('/api/super-admin/fleet',                      fleetRoutes);
app.use('/api/admin/payments',                         adminPaymentRoutes);
app.use('/api/admin/reports',                          reportRoutes);
app.use('/api/admin/admin-management',                 adminMgmtRoutes);
app.use('/api/admin/notifications',                    adminNotifRoutes);
app.use('/api/admin/landing',                          landingCMSRoutes);
app.use('/api/public/landing',                         landingPublicRoutes);
app.use('/api/super-admin/branches',                   branchRoutes);
app.use('/api/admin/rentals',                          rentalRoutes);
app.use('/api/super-admin/rentals',                    rentalRoutes);
// Enterprise Finance
app.use('/api/super-admin/wallets',                    walletRouter);
app.use('/api/super-admin/finance/payments',           adminFinancePaymentRouter);
app.use('/api/super-admin/settlements',                settlementRouter);
app.use('/api/super-admin/ledger',                     ledgerRouter);
app.use('/api/super-admin/finance',                    financeReportRouter);
// Enterprise Communication
app.use('/api/super-admin/notifications',              commNotifRouter);
app.use('/api/super-admin/templates',                  templateRouter);
app.use('/api/super-admin/campaigns',                  campaignRouter);
app.use('/api/preferences',                            preferencesRouter);
app.use('/api/comm-webhooks',                          commWebhookRouter);
// Enterprise BI
app.use('/api/super-admin/dashboard',                  biDashboardRouter);
app.use('/api/super-admin/analytics',                  analyticsRouter);
app.use('/api/super-admin/reports',                    biReportsRouter);
app.use('/api/super-admin/export',                     exportRouter);
app.use('/api/super-admin',                            superAdminRoutes);

// ════════════════════════════════════════════════════════════════════
// USER / RIDER ROUTES  →  /api/auth/*, /api/users/*, etc.
// Auth protected by userAuth middleware (applied inside route files)
// ════════════════════════════════════════════════════════════════════
app.use('/api/auth',                           userAuthRoutes);
app.use('/api/users',                        userProfileRoutes);
app.use('/api/users',                        roleRoutes);
app.use('/api/riders',                       riderRoutes);
app.use('/api/vehicles',                     vehicleRoutes);
app.use('/api/bookings',                     bookingRoutes);
app.use('/api/bookings',                     invoiceRoutes);
app.use('/api/jobs',                         jobRoutes);
app.use('/api/notifications',                userNotifRoutes);
app.use('/api/location',                     locationRoutes);
app.use('/api/payments',                     userPaymentRoutes);
app.use('/api/wallet',                       walletRoutes);
app.use('/api/history',                      historyRoutes);
app.use('/api/payouts',                      payoutRoutes);
app.use('/api/coupons',                      couponRoutes);
app.use('/api',                              supportRoutes);
app.use('/api',                              resourceRoutes);
app.use('/api/performance',                  performanceRoutes);

// ── Root & API info endpoints ─────────────────────────────────────────────────
app.get('/', (req, res) => res.json({
  name: 'Pravzo Unified API', status: 'Running', version: '2.0.0',
  admin_api: '/api/admin', user_api: '/api'
}));

app.get('/api', (req, res) => res.json({
  name: 'Pravzo Unified API', admin: '/api/admin/*', user: '/api/auth, /api/users, /api/bookings, ...'
}));

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => sendError(res, 404, 'Route not found', 'NOT_FOUND', null, req));

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
