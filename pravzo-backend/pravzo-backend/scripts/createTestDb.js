'use strict';
/**
 * scripts/createTestDb.js
 * ============================================================
 * Creates the pravzo_test database and applies the full schema.
 * Copies schema structure from pravzo_db (the production-mirror dev DB).
 * NEVER modifies pravzo_db.
 * ============================================================
 */
const path   = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env.test'), override: true });

const mysql = require('mysql2/promise');

const G = '\x1b[32m', R = '\x1b[31m', Y = '\x1b[33m', C = '\x1b[36m', X = '\x1b[0m';
const ok   = m => console.log(`${G}  ✓ ${m}${X}`);
const info = m => console.log(`${C}${m}${X}`);
const err  = m => console.log(`${R}  ✗ ${m}${X}`);

async function safeQuery(conn, sql) {
  try {
    await conn.query(sql);
  } catch (e) {
    if (e.message.includes('already exists') ||
        e.code === 'ER_TABLE_EXISTS_ERROR' ||
        e.code === 'ER_DUP_KEYNAME') return;
    throw e;
  }
}

async function main() {
  info('\n══════════════════════════════════════════════');
  info('  PRAVZO TEST DATABASE SETUP');
  info('══════════════════════════════════════════════');

  const cfg = {
    host:     process.env.DB_HOST     || '127.0.0.1',
    port:     parseInt(process.env.DB_PORT) || 3307,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || 'rootpassword',
    multipleStatements: true,
  };

  console.log(`  Connecting to ${cfg.host}:${cfg.port} as ${cfg.user}`);

  const conn = await mysql.createConnection(cfg);

  // ── 1. Create the test database ──────────────────────────
  await conn.query('CREATE DATABASE IF NOT EXISTS `pravzo_test` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  ok('Created database: pravzo_test');
  await conn.query('USE `pravzo_test`');

  // ── 2. Core tables ───────────────────────────────────────
  info('\n  Core tables...');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS admins (
    admin_id        INT NOT NULL AUTO_INCREMENT,
    full_name       VARCHAR(255) NOT NULL DEFAULT 'Admin',
    name            VARCHAR(255) NULL,
    email           VARCHAR(255) NOT NULL,
    password        VARCHAR(255) NULL,
    password_hash   VARCHAR(255) NULL,
    phone_number    VARCHAR(20) DEFAULT NULL,
    role            ENUM('SUPER_ADMIN','ADMIN','MANAGER','SUPPORT','FINANCE','OPERATIONS') NOT NULL DEFAULT 'ADMIN',
    status          ENUM('ACTIVE','INACTIVE','SUSPENDED','LOCKED') NOT NULL DEFAULT 'ACTIVE',
    account_status  ENUM('ACTIVE','INACTIVE','SUSPENDED','LOCKED') NOT NULL DEFAULT 'ACTIVE',
    profile_photo   TEXT NULL,
    last_login      DATETIME NULL,
    last_login_at   DATETIME NULL,
    failed_login_attempts INT DEFAULT 0,
    force_password_change TINYINT(1) DEFAULT 0,
    password_changed_at   DATETIME NULL,
    account_locked_until  DATETIME NULL,
    deleted_at      TIMESTAMP NULL DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (admin_id),
    UNIQUE KEY uq_admins_email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('admins');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS admin_permissions (
    permission_id       INT NOT NULL AUTO_INCREMENT,
    admin_id            INT NOT NULL,
    dashboard           TINYINT(1) DEFAULT 0,
    users               TINYINT(1) DEFAULT 0,
    riders              TINYINT(1) DEFAULT 0,
    vehicles            TINYINT(1) DEFAULT 0,
    bookings            TINYINT(1) DEFAULT 0,
    rentals             TINYINT(1) DEFAULT 0,
    jobs                TINYINT(1) DEFAULT 0,
    reports             TINYINT(1) DEFAULT 0,
    payments            TINYINT(1) DEFAULT 0,
    notifications       TINYINT(1) DEFAULT 0,
    settings            TINYINT(1) DEFAULT 0,
    landing_cms         TINYINT(1) DEFAULT 0,
    branches            TINYINT(1) DEFAULT 0,
    admin_management    TINYINT(1) DEFAULT 0,
    custom_permissions  JSON NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (permission_id),
    UNIQUE KEY uq_ap_admin_id (admin_id),
    CONSTRAINT fk_ap_admin FOREIGN KEY (admin_id) REFERENCES admins(admin_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('admin_permissions');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS admin_refresh_tokens (
    id          BIGINT NOT NULL AUTO_INCREMENT,
    admin_id    INT NOT NULL,
    token       VARCHAR(500) NULL,
    token_hash  VARCHAR(255) NOT NULL DEFAULT '',
    refresh_token VARCHAR(500) NULL,
    expires_at  DATETIME NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_admin_id (admin_id),
    CONSTRAINT fk_art_admin FOREIGN KEY (admin_id) REFERENCES admins(admin_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('admin_refresh_tokens');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS branches (
    branch_id   INT NOT NULL AUTO_INCREMENT,
    name        VARCHAR(255) NOT NULL,
    code        VARCHAR(50) DEFAULT NULL,
    city        VARCHAR(100) DEFAULT NULL,
    state       VARCHAR(100) DEFAULT NULL,
    address     TEXT DEFAULT NULL,
    phone       VARCHAR(20) DEFAULT NULL,
    email       VARCHAR(255) DEFAULT NULL,
    status      ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    deleted_at  TIMESTAMP NULL DEFAULT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (branch_id),
    UNIQUE KEY uq_branches_code (code)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('branches');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS users (
    user_id                  INT NOT NULL AUTO_INCREMENT,
    full_name                VARCHAR(255) NOT NULL,
    phone_number             VARCHAR(20) NOT NULL,
    email                    VARCHAR(255) DEFAULT NULL,
    password                 VARCHAR(255) NOT NULL,
    password_hash            VARCHAR(255) NULL,
    date_of_birth            DATE DEFAULT NULL,
    gender                   ENUM('MALE','FEMALE','OTHER') DEFAULT NULL,
    address                  TEXT DEFAULT NULL,
    city                     VARCHAR(100) DEFAULT NULL,
    state                    VARCHAR(100) DEFAULT NULL,
    pincode                  VARCHAR(10) DEFAULT NULL,
    role                     ENUM('ADMIN','CUSTOMER','RIDER','PARTNER','RENT_A_VEHICLE','VEHICLE_WITH_JOB','SUPER_ADMIN') NOT NULL DEFAULT 'RENT_A_VEHICLE',
    employee_id              VARCHAR(100) DEFAULT NULL,
    job_type                 VARCHAR(100) DEFAULT NULL,
    joining_date             DATE DEFAULT NULL,
    salary                   DECIMAL(10,2) DEFAULT NULL,
    assigned_hub             VARCHAR(255) DEFAULT NULL,
    assigned_company         VARCHAR(255) DEFAULT NULL,
    selected_partner         VARCHAR(50) DEFAULT NULL,
    rider_code               VARCHAR(30) DEFAULT NULL,
    application_status       ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
    employee_status          ENUM('ACTIVE','inactive','suspended') DEFAULT NULL,
    status                   ENUM('ACTIVE','INACTIVE','BLOCKED','SUSPENDED','PENDING_VERIFICATION','DELETED') NOT NULL DEFAULT 'ACTIVE',
    kyc_status               ENUM('NOT_SUBMITTED','PENDING','UNDER_REVIEW','APPROVED','REJECTED','REVERIFY_REQUIRED') DEFAULT 'NOT_SUBMITTED',
    email_verified           BOOLEAN DEFAULT FALSE,
    phone_verified           BOOLEAN DEFAULT FALSE,
    driving_license_number   VARCHAR(50) DEFAULT NULL,
    driving_license_photo    TEXT DEFAULT NULL,
    driving_license_back_photo VARCHAR(255) DEFAULT NULL,
    aadhar_number            VARCHAR(50) DEFAULT NULL,
    aadhar_card_photo        TEXT DEFAULT NULL,
    aadhar_card_back_photo   VARCHAR(255) DEFAULT NULL,
    profile_photo            TEXT DEFAULT NULL,
    bank_account_number      VARCHAR(50) DEFAULT NULL,
    ifsc_code                VARCHAR(20) DEFAULT NULL,
    branch_name              VARCHAR(255) DEFAULT NULL,
    account_holder_name      VARCHAR(100) DEFAULT NULL,
    upi_id                   VARCHAR(100) DEFAULT NULL,
    payout_schedule          VARCHAR(50) DEFAULT 'Every Monday',
    emergency_contact_name   VARCHAR(255) DEFAULT NULL,
    emergency_contact_number VARCHAR(20) DEFAULT NULL,
    wallet_balance           DECIMAL(10,2) DEFAULT 0.00,
    total_bookings           INT DEFAULT 0,
    total_spent              DECIMAL(12,2) DEFAULT 0.00,
    branch_id                INT NULL,
    referral_code            VARCHAR(20) NULL,
    referred_by              INT NULL,
    last_login_at            DATETIME NULL,
    deleted_at               TIMESTAMP NULL DEFAULT NULL,
    created_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_users_phone_number (phone_number),
    UNIQUE KEY uq_users_email (email),
    INDEX idx_status (status),
    INDEX idx_kyc_status (kyc_status),
    INDEX idx_deleted_at (deleted_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('users');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS user_addresses (
    address_id   BIGINT NOT NULL AUTO_INCREMENT,
    user_id      INT NOT NULL,
    address_type ENUM('HOME','WORK','OTHER') DEFAULT 'HOME',
    address_line1 VARCHAR(500) DEFAULT NULL,
    address_line2 VARCHAR(500) DEFAULT NULL,
    city          VARCHAR(100) DEFAULT NULL,
    state         VARCHAR(100) DEFAULT NULL,
    pincode       VARCHAR(10) DEFAULT NULL,
    latitude      DECIMAL(10,7) DEFAULT NULL,
    longitude     DECIMAL(10,7) DEFAULT NULL,
    is_default    TINYINT(1) DEFAULT 0,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (address_id),
    KEY idx_ua_user_id (user_id),
    CONSTRAINT fk_ua_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('user_addresses');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS user_devices (
    device_id    BIGINT NOT NULL AUTO_INCREMENT,
    user_id      INT NOT NULL,
    device_token VARCHAR(500) DEFAULT NULL,
    device_type  ENUM('ANDROID','IOS','WEB') DEFAULT NULL,
    device_name  VARCHAR(100) DEFAULT NULL,
    is_active    TINYINT(1) DEFAULT 1,
    last_active_at DATETIME DEFAULT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (device_id),
    KEY idx_ud_user_id (user_id),
    CONSTRAINT fk_ud_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('user_devices');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS riders (
    rider_id             INT NOT NULL AUTO_INCREMENT,
    user_id              INT NOT NULL,
    rider_code           VARCHAR(30) DEFAULT NULL,
    assigned_vehicle_id  INT DEFAULT NULL,
    verification_status  ENUM('PENDING','VERIFIED','REJECTED') DEFAULT 'PENDING',
    duty_status          ENUM('ON_DUTY','OFF_DUTY') DEFAULT 'OFF_DUTY',
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (rider_id),
    UNIQUE KEY uq_riders_user_id (user_id),
    UNIQUE KEY uq_riders_code (rider_code),
    CONSTRAINT fk_riders_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('riders');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id            INT NOT NULL AUTO_INCREMENT,
    model_name            VARCHAR(255) NULL,
    model                 VARCHAR(255) NULL,
    registration_number   VARCHAR(50) DEFAULT NULL,
    type                  ENUM('BIKE','SCOOTER','E_BIKE','E_SCOOTER','CYCLE') NULL,
    vehicle_type          ENUM('BIKE','SCOOTER','E_BIKE','E_SCOOTER','CYCLE') NULL,
    price_per_week        DECIMAL(10,2) NOT NULL DEFAULT 0,
    security_deposit      DECIMAL(10,2) NOT NULL DEFAULT 0,
    status                ENUM('AVAILABLE','RENTED','MAINTENANCE','CHARGING','OFFLINE','BLOCKED','DAMAGED','OUT_OF_SERVICE','INACTIVE') NOT NULL DEFAULT 'AVAILABLE',
    color                 VARCHAR(50) NULL,
    image_url             TEXT DEFAULT NULL,
    branch_id             INT NULL,
    assigned_rider_id     INT NULL,
    deleted_at            TIMESTAMP NULL DEFAULT NULL,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (vehicle_id),
    UNIQUE KEY uq_vehicles_registration_number (registration_number),
    INDEX idx_status (status),
    INDEX idx_deleted_at (deleted_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('vehicles');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS wallets (
    wallet_id     BIGINT NOT NULL AUTO_INCREMENT,
    user_id       INT NOT NULL,
    wallet_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency      CHAR(3) NOT NULL DEFAULT 'INR',
    is_active     TINYINT(1) NOT NULL DEFAULT 1,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (wallet_id),
    UNIQUE KEY uq_wallets_user_id (user_id),
    CONSTRAINT fk_wallets_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('wallets');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS bookings (
    booking_id           BIGINT NOT NULL AUTO_INCREMENT,
    booking_number       VARCHAR(50) DEFAULT NULL,
    user_id              INT NOT NULL,
    vehicle_id           INT NOT NULL,
    rider_id             INT DEFAULT NULL,
    reference_id         VARCHAR(255) DEFAULT NULL,
    start_date           DATE NOT NULL,
    end_date             DATE NOT NULL,
    rental_rate_per_week DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount         DECIMAL(10,2) NOT NULL,
    security_deposit     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status               ENUM('PENDING','ACTIVE','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
    payment_status       ENUM('PENDING','PAID','FAILED','PARTIAL','REFUNDED') NOT NULL DEFAULT 'PENDING',
    cancelled_by         VARCHAR(50) DEFAULT NULL,
    cancellation_reason  TEXT DEFAULT NULL,
    cancelled_at         DATETIME DEFAULT NULL,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (booking_id),
    UNIQUE KEY uq_bookings_number (booking_number),
    KEY idx_bookings_user_id (user_id),
    KEY idx_bookings_vehicle_id (vehicle_id),
    KEY idx_bookings_status (status),
    CONSTRAINT fk_bookings_user    FOREIGN KEY (user_id)    REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_bookings_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('bookings');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS payments (
    payment_id         BIGINT NOT NULL AUTO_INCREMENT,
    user_id            INT NOT NULL,
    booking_id         BIGINT DEFAULT NULL,
    gateway            VARCHAR(50) NOT NULL DEFAULT 'razorpay',
    gateway_order_id   VARCHAR(255) DEFAULT NULL,
    gateway_payment_id VARCHAR(255) DEFAULT NULL,
    gateway_signature  VARCHAR(255) DEFAULT NULL,
    amount             DECIMAL(10,2) NOT NULL,
    currency           CHAR(3) NOT NULL DEFAULT 'INR',
    purpose            ENUM('wallet_topup','booking','refund','other') NOT NULL DEFAULT 'wallet_topup',
    status             ENUM('created','paid','failed','refunded') NOT NULL DEFAULT 'created',
    method             VARCHAR(50) DEFAULT NULL,
    meta               JSON DEFAULT NULL,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (payment_id),
    UNIQUE KEY uq_payments_gateway_order_id (gateway_order_id),
    KEY idx_payments_user_id (user_id),
    KEY idx_payments_status (status),
    CONSTRAINT fk_payments_user    FOREIGN KEY (user_id)    REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('payments');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS wallet_transactions (
    transaction_id  BIGINT NOT NULL AUTO_INCREMENT,
    wallet_id       BIGINT NOT NULL,
    user_id         INT NOT NULL,
    type            ENUM('credit','debit') NOT NULL,
    source          ENUM('topup','admin_topup','booking','refund','cashback','penalty','payout','instant_cashout','cashout_refund','bank_transfer','razorpay_topup') NOT NULL,
    status          ENUM('pending','success','failed') NOT NULL DEFAULT 'success',
    amount          DECIMAL(10,2) NOT NULL,
    opening_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    closing_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_id      BIGINT DEFAULT NULL,
    booking_id      BIGINT DEFAULT NULL,
    payout_id       BIGINT DEFAULT NULL,
    reference_id    VARCHAR(255) DEFAULT NULL,
    note            TEXT DEFAULT NULL,
    meta            JSON DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (transaction_id),
    UNIQUE KEY uq_wallet_tx_reference_id (reference_id),
    KEY idx_wt_wallet_id (wallet_id),
    KEY idx_wt_user_id (user_id),
    CONSTRAINT fk_wt_wallet  FOREIGN KEY (wallet_id)  REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    CONSTRAINT fk_wt_user    FOREIGN KEY (user_id)    REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_wt_payment FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE SET NULL,
    CONSTRAINT fk_wt_booking FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('wallet_transactions');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS payouts (
    payout_id             BIGINT NOT NULL AUTO_INCREMENT,
    user_id               INT NOT NULL,
    wallet_transaction_id BIGINT DEFAULT NULL,
    amount                DECIMAL(10,2) NOT NULL,
    method                ENUM('bank_transfer','upi','manual') NOT NULL DEFAULT 'bank_transfer',
    status                ENUM('pending','processing','queued','initiated','processed','completed','failed','reversed','cancelled') NOT NULL DEFAULT 'pending',
    beneficiary_name      VARCHAR(100) DEFAULT NULL,
    account_number        VARCHAR(50) DEFAULT NULL,
    ifsc_code             VARCHAR(20) DEFAULT NULL,
    upi_id                VARCHAR(100) DEFAULT NULL,
    reference_id          VARCHAR(255) DEFAULT NULL,
    razorpayx_payout_id   VARCHAR(255) DEFAULT NULL,
    remarks               TEXT DEFAULT NULL,
    processed_at          TIMESTAMP NULL DEFAULT NULL,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (payout_id),
    UNIQUE KEY uq_payouts_reference_id (reference_id),
    KEY idx_payouts_user_id (user_id),
    KEY idx_payouts_status (status),
    CONSTRAINT fk_payouts_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_payouts_wt FOREIGN KEY (wallet_transaction_id) REFERENCES wallet_transactions(transaction_id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('payouts');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS otp_logs (
    otp_id      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    identifier  VARCHAR(20) NOT NULL,
    otp_code    VARCHAR(6) NOT NULL,
    purpose     ENUM('login','register','forgot_password','change_mobile','change_email') NOT NULL DEFAULT 'login',
    is_used     TINYINT(1) NOT NULL DEFAULT 0,
    attempts    TINYINT NOT NULL DEFAULT 0,
    expires_at  DATETIME NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_identifier_purpose (identifier, purpose),
    INDEX idx_expires_at (expires_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('otp_logs');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS coupons (
    coupon_id           INT NOT NULL AUTO_INCREMENT,
    code                VARCHAR(50) NOT NULL,
    description         TEXT DEFAULT NULL,
    discount_type       ENUM('PERCENT','FLAT') NOT NULL,
    discount_value      DECIMAL(10,2) NOT NULL,
    max_discount_amount DECIMAL(10,2) DEFAULT NULL,
    min_order_amount    DECIMAL(10,2) DEFAULT 0.00,
    max_uses_per_user   INT DEFAULT NULL,
    max_total_uses      INT DEFAULT NULL,
    total_used          INT NOT NULL DEFAULT 0,
    is_active           TINYINT(1) NOT NULL DEFAULT 1,
    status              ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
    valid_from          DATETIME DEFAULT NULL,
    valid_until         DATETIME DEFAULT NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (coupon_id),
    UNIQUE KEY uq_coupons_code (code)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('coupons');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS coupon_usages (
    usage_id   BIGINT NOT NULL AUTO_INCREMENT,
    coupon_id  INT NOT NULL,
    user_id    INT NOT NULL,
    booking_id BIGINT DEFAULT NULL,
    used_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usage_id),
    UNIQUE KEY uq_coupon_usage (coupon_id, user_id, booking_id),
    KEY idx_cu_user_id (user_id),
    CONSTRAINT fk_cu_coupon  FOREIGN KEY (coupon_id)  REFERENCES coupons(coupon_id) ON DELETE CASCADE,
    CONSTRAINT fk_cu_user    FOREIGN KEY (user_id)    REFERENCES users(user_id)    ON DELETE CASCADE,
    CONSTRAINT fk_cu_booking FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('coupon_usages');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS jobs (
    job_id             INT NOT NULL AUTO_INCREMENT,
    title              VARCHAR(255) NOT NULL DEFAULT 'Job',
    description        TEXT DEFAULT NULL,
    partner_name       VARCHAR(255) DEFAULT NULL,
    location           VARCHAR(255) DEFAULT NULL,
    city               VARCHAR(100) DEFAULT NULL,
    compensation_amount DECIMAL(10,2) DEFAULT 0.00,
    status             ENUM('AVAILABLE','ASSIGNED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'AVAILABLE',
    rider_id           INT DEFAULT NULL,
    assigned_at        DATETIME DEFAULT NULL,
    completed_at       DATETIME DEFAULT NULL,
    created_by         INT DEFAULT NULL,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (job_id),
    KEY idx_jobs_status (status),
    KEY idx_jobs_rider_id (rider_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('jobs');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS sos_alerts (
    alert_id        BIGINT NOT NULL AUTO_INCREMENT,
    user_id         INT NOT NULL,
    booking_id      BIGINT DEFAULT NULL,
    alert_type      VARCHAR(50) DEFAULT 'SOS',
    latitude        DECIMAL(10,7) DEFAULT NULL,
    longitude       DECIMAL(10,7) DEFAULT NULL,
    description     TEXT DEFAULT NULL,
    status          ENUM('active','resolved','dismissed') NOT NULL DEFAULT 'active',
    resolution_note TEXT DEFAULT NULL,
    resolved_by     INT DEFAULT NULL,
    resolved_at     DATETIME DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (alert_id),
    KEY idx_sos_user_id (user_id),
    KEY idx_sos_status (status),
    CONSTRAINT fk_sos_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('sos_alerts');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS breakdown_reports (
    report_id   BIGINT NOT NULL AUTO_INCREMENT,
    user_id     INT NOT NULL,
    vehicle_id  INT DEFAULT NULL,
    booking_id  BIGINT DEFAULT NULL,
    issue_type  VARCHAR(100) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    image_urls  JSON DEFAULT NULL,
    status      ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
    resolved_at DATETIME DEFAULT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (report_id),
    KEY idx_br_user_id (user_id),
    CONSTRAINT fk_br_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('breakdown_reports');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS user_notifications (
    notification_id BIGINT NOT NULL AUTO_INCREMENT,
    user_id         INT NOT NULL,
    title           VARCHAR(255) NOT NULL,
    message         TEXT DEFAULT NULL,
    type            VARCHAR(50) DEFAULT 'general',
    is_read         TINYINT(1) NOT NULL DEFAULT 0,
    read_at         DATETIME DEFAULT NULL,
    data            JSON DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (notification_id),
    KEY idx_un_user_id (user_id),
    KEY idx_un_is_read (is_read),
    CONSTRAINT fk_un_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('user_notifications');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS rider_kyc (
    kyc_id               INT NOT NULL AUTO_INCREMENT,
    rider_id             INT NOT NULL,
    document_type        VARCHAR(100) NOT NULL,
    document_number      VARCHAR(100) DEFAULT NULL,
    document_front_url   TEXT DEFAULT NULL,
    document_back_url    TEXT DEFAULT NULL,
    verification_status  ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    verified_by          INT DEFAULT NULL,
    verified_at          DATETIME DEFAULT NULL,
    rejection_reason     TEXT DEFAULT NULL,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (kyc_id),
    KEY idx_rkyc_rider_id (rider_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('rider_kyc');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS rider_earnings (
    earning_id    BIGINT NOT NULL AUTO_INCREMENT,
    rider_id      INT NOT NULL,
    booking_id    BIGINT DEFAULT NULL,
    trip_id       BIGINT DEFAULT NULL,
    user_id       INT DEFAULT NULL,
    amount        DECIMAL(10,2) NOT NULL,
    earning_type  VARCHAR(50) DEFAULT 'TRIP_COMPLETED',
    status        ENUM('pending','settled','failed') DEFAULT 'pending',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (earning_id),
    KEY idx_re_rider_id (rider_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('rider_earnings');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS locations (
    location_id   BIGINT NOT NULL AUTO_INCREMENT,
    user_id       INT NOT NULL,
    latitude      DECIMAL(10,7) NOT NULL,
    longitude     DECIMAL(10,7) NOT NULL,
    accuracy      DECIMAL(8,2) DEFAULT NULL,
    heading       DECIMAL(6,2) DEFAULT NULL,
    speed         DECIMAL(6,2) DEFAULT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (location_id),
    KEY idx_loc_user_id (user_id),
    CONSTRAINT fk_loc_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('locations');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS booking_audit_logs (
    log_id        BIGINT NOT NULL AUTO_INCREMENT,
    booking_id    BIGINT NOT NULL,
    action        VARCHAR(100) NOT NULL,
    performed_by  VARCHAR(50) DEFAULT NULL,
    actor_id      INT DEFAULT NULL,
    old_status    VARCHAR(50) DEFAULT NULL,
    new_status    VARCHAR(50) DEFAULT NULL,
    notes         TEXT DEFAULT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (log_id),
    KEY idx_bal_booking_id (booking_id),
    CONSTRAINT fk_bal_booking FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('booking_audit_logs');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS admin_activity_logs (
    log_id      BIGINT NOT NULL AUTO_INCREMENT,
    admin_id    INT DEFAULT NULL,
    action      VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) DEFAULT NULL,
    entity_id   VARCHAR(100) DEFAULT NULL,
    old_value   JSON DEFAULT NULL,
    new_value   JSON DEFAULT NULL,
    ip_address  VARCHAR(45) DEFAULT NULL,
    user_agent  TEXT DEFAULT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (log_id),
    KEY idx_aal_admin_id (admin_id),
    KEY idx_aal_entity (entity_type, entity_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('admin_activity_logs');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS webhook_events (
    event_id_pk  BIGINT NOT NULL AUTO_INCREMENT,
    event_id     VARCHAR(255) NOT NULL,
    event_type   VARCHAR(100) NOT NULL,
    payload      JSON DEFAULT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id_pk),
    UNIQUE KEY uq_webhook_event_id (event_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('webhook_events');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS admin_sessions (
    session_id  BIGINT NOT NULL AUTO_INCREMENT,
    admin_id    INT NOT NULL,
    ip_address  VARCHAR(45) DEFAULT NULL,
    user_agent  TEXT DEFAULT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (session_id),
    KEY idx_as_admin_id (admin_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('admin_sessions');

  // Landing CMS (needed by admin landing routes)
  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS landing_cms (
    cms_id      INT NOT NULL AUTO_INCREMENT,
    section     VARCHAR(100) NOT NULL,
    data        JSON DEFAULT NULL,
    updated_by  INT DEFAULT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (cms_id),
    UNIQUE KEY uq_cms_section (section)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('landing_cms');

  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS contact_enquiries (
    enquiry_id   INT NOT NULL AUTO_INCREMENT,
    name         VARCHAR(255) DEFAULT NULL,
    email        VARCHAR(255) DEFAULT NULL,
    phone        VARCHAR(20) DEFAULT NULL,
    message      TEXT DEFAULT NULL,
    status       ENUM('new','in_progress','resolved','closed') NOT NULL DEFAULT 'new',
    assigned_to  INT DEFAULT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (enquiry_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('contact_enquiries');

  // Rentals table (needed by rental routes)
  await safeQuery(conn, `CREATE TABLE IF NOT EXISTS rentals (
    rental_id     INT NOT NULL AUTO_INCREMENT,
    user_id       INT NOT NULL,
    vehicle_id    INT DEFAULT NULL,
    status        ENUM('PENDING','ACTIVE','COMPLETED','CANCELLED','OVERDUE') NOT NULL DEFAULT 'PENDING',
    start_date    DATE DEFAULT NULL,
    end_date      DATE DEFAULT NULL,
    total_amount  DECIMAL(10,2) DEFAULT 0.00,
    pickup_otp    VARCHAR(10) DEFAULT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (rental_id),
    KEY idx_rentals_user_id (user_id),
    KEY idx_rentals_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  ok('rentals');

  // Verify final table count
  const [tables] = await conn.query('SHOW TABLES');
  info(`\n  Total tables created: ${tables.length}`);
  tables.forEach(t => info(`    - ${Object.values(t)[0]}`));

  await conn.end();

  info('\n══════════════════════════════════════════════');
  ok('pravzo_test database setup COMPLETE');
  info('══════════════════════════════════════════════\n');
}

main().catch(e => {
  err('FATAL: ' + e.message);
  console.error(e);
  process.exit(1);
});
