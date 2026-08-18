SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- ============================================================
-- DATABASE
-- ============================================================
CREATE DATABASE IF NOT EXISTS `pravzo_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `pravzo_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- TABLE: system_settings
-- ============================================================
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `setting_id`   int NOT NULL AUTO_INCREMENT,
  `setting_key`  varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci,
  `group_name`   varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description`  text COLLATE utf8mb4_unicode_ci,
  `updated_by`   int DEFAULT NULL,
  `created_at`   timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `uq_ss_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `system_settings` VALUES
(1,'platform.commission_rate','0.10','PLATFORM','Platform commission rate (0-1)',1,NOW(),NOW()),
(2,'platform.name','Pravzo','PLATFORM','Platform display name',1,NOW(),NOW()),
(3,'otp.expiry_minutes','10','OTP','OTP expiry in minutes',1,NOW(),NOW()),
(4,'otp.max_attempts','5','OTP','Max OTP attempts',1,NOW(),NOW()),
(5,'payment.provider','razorpay','PAYMENT','Payment gateway provider',1,NOW(),NOW()),
(6,'rider.min_rating','3.5','RIDER','Minimum rider rating threshold',1,NOW(),NOW()),
(7,'booking.security_deposit','500','BOOKING','Default security deposit',1,NOW(),NOW()),
(8,'app.maintenance_mode','false','APP','Enable maintenance mode',1,NOW(),NOW()),
(9,'wallet.min_balance','1000','WALLET','Minimum wallet balance required',1,NOW(),NOW());

-- ============================================================
-- TABLE: roles
-- Cleaned: removed duplicate SUPER_VISOR alias (role_id=7)
-- ============================================================
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `role_id`     int NOT NULL AUTO_INCREMENT,
  `role_name`   varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active`   tinyint(1) DEFAULT '1',
  `created_at`  timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `uq_roles_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NOTE: SUPER_VISOR (role_id=7) removed â€” it was a legacy alias for SUPERVISOR (role_id=6).
-- Any application code referencing role_id=7 must be updated to role_id=6.
INSERT INTO `roles` (`role_id`,`role_name`,`description`,`is_active`) VALUES
(1,'SUPER_ADMIN','Super Administrator with full access',1),
(2,'ADMIN','Administrator',1),
(3,'BRANCH_ADMIN','Branch level administrator',1),
(4,'CUSTOMER','End customer / renter',1),
(5,'RIDER','Delivery / vehicle-with-job rider',1),
(6,'SUPERVISOR','Branch supervisor',1),
(8,'DISPATCHER','Dispatch operator',1),
(9,'FINANCE','Finance department',1);

-- ============================================================
-- TABLE: permissions
-- NEW â€” replaces admin_permissions flat-boolean columns.
-- Each row is one permission string, e.g. 'bookings.view'.
-- ============================================================
DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `permission_id`   int NOT NULL AUTO_INCREMENT,
  `permission_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL
    COMMENT 'e.g. dashboard.view, users.manage, settings.edit',
  `module`          varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL
    COMMENT 'e.g. DASHBOARD, USERS, RIDERS, VEHICLES',
  `description`     varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at`      timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`permission_id`),
  UNIQUE KEY `uq_perm_name` (`permission_name`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `permissions` (`permission_id`,`permission_name`,`module`,`description`) VALUES
(1,'dashboard.view','DASHBOARD','View dashboard'),
(2,'users.view','USERS','View users'),
(3,'users.manage','USERS','Create / edit / block users'),
(4,'riders.view','RIDERS','View riders'),
(5,'riders.manage','RIDERS','Create / edit / block riders'),
(6,'vehicles.view','VEHICLES','View vehicles'),
(7,'vehicles.manage','VEHICLES','Create / edit / assign vehicles'),
(8,'bookings.view','BOOKINGS','View bookings'),
(9,'bookings.manage','BOOKINGS','Create / update / cancel bookings'),
(10,'rentals.view','RENTALS','View rentals'),
(11,'rentals.manage','RENTALS','Create / update rentals'),
(12,'jobs.view','JOBS','View jobs'),
(13,'jobs.manage','JOBS','Create / assign / cancel jobs'),
(14,'reports.view','REPORTS','View reports'),
(15,'payments.view','PAYMENTS','View payments'),
(16,'payments.manage','PAYMENTS','Issue refunds, manage payouts'),
(17,'notifications.view','NOTIFICATIONS','View notifications'),
(18,'notifications.manage','NOTIFICATIONS','Create / send notifications'),
(19,'settings.view','SETTINGS','View system settings'),
(20,'settings.manage','SETTINGS','Edit system settings'),
(21,'landing_cms.manage','CMS','Edit landing page content'),
(22,'branches.view','BRANCHES','View branches'),
(23,'branches.manage','BRANCHES','Create / edit branches'),
(24,'admin_management.view','ADMIN','View admin users'),
(25,'admin_management.manage','ADMIN','Create / edit admin users');

-- ============================================================
-- TABLE: role_permissions
-- NEW â€” maps each role to its allowed permissions.
-- Replaces admin_permissions entirely.
-- ============================================================
DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE `role_permissions` (
  `id`            int NOT NULL AUTO_INCREMENT,
  `role_id`       int NOT NULL,
  `permission_id` int NOT NULL,
  `granted_by`    int DEFAULT NULL COMMENT 'user_id of the admin who granted this',
  `created_at`    timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rp_role_perm` (`role_id`,`permission_id`),
  KEY `idx_rp_role_id` (`role_id`),
  KEY `idx_rp_permission_id` (`permission_id`),
  KEY `fk_rp_granted_by` (`granted_by`),
  CONSTRAINT `fk_rp_role_id`       FOREIGN KEY (`role_id`)       REFERENCES `roles`       (`role_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rp_permission_id` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`permission_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rp_granted_by`    FOREIGN KEY (`granted_by`)    REFERENCES `users`       (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SUPER_ADMIN (role_id=1): all permissions
INSERT INTO `role_permissions` (`role_id`,`permission_id`) VALUES
(1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),(1,9),(1,10),
(1,11),(1,12),(1,13),(1,14),(1,15),(1,16),(1,17),(1,18),(1,19),(1,20),
(1,21),(1,22),(1,23),(1,24),(1,25);

-- ADMIN (role_id=2): all except settings.manage, landing_cms, admin_management
INSERT INTO `role_permissions` (`role_id`,`permission_id`) VALUES
(2,1),(2,2),(2,3),(2,4),(2,5),(2,6),(2,7),(2,8),(2,9),(2,10),
(2,11),(2,12),(2,13),(2,14),(2,15),(2,16),(2,17),(2,18),(2,19),(2,22),(2,24);

-- BRANCH_ADMIN (role_id=3): branch-scoped ops
INSERT INTO `role_permissions` (`role_id`,`permission_id`) VALUES
(3,1),(3,2),(3,4),(3,5),(3,6),(3,7),(3,8),(3,9),(3,10),
(3,11),(3,12),(3,13),(3,14),(3,15),(3,17),(3,22);

-- SUPERVISOR (role_id=6): view + limited manage
INSERT INTO `role_permissions` (`role_id`,`permission_id`) VALUES
(6,1),(6,2),(6,4),(6,6),(6,8),(6,12),(6,13),(6,14),(6,17),(6,22);

-- DISPATCHER (role_id=8): jobs + riders
INSERT INTO `role_permissions` (`role_id`,`permission_id`) VALUES
(8,1),(8,4),(8,6),(8,8),(8,12),(8,13);

-- FINANCE (role_id=9): reports + payments
INSERT INTO `role_permissions` (`role_id`,`permission_id`) VALUES
(9,1),(9,14),(9,15),(9,16);

-- CUSTOMER (role_id=4) and RIDER (role_id=5) have NO admin permissions.
-- Their access is controlled at API / application level.

-- ============================================================
-- TABLE: branches
-- (unchanged from v3 â€” already correct)
-- ============================================================
DROP TABLE IF EXISTS `branches`;
CREATE TABLE `branches` (
  `branch_id`        int NOT NULL AUTO_INCREMENT,
  `branch_name`      varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch_code`      varchar(50)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `branch_type`      enum('MAIN','SUB','FRANCHISE','PARTNER') COLLATE utf8mb4_unicode_ci DEFAULT 'MAIN',
  `branch_status`    enum('ACTIVE','INACTIVE','SUSPENDED') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE',
  `address_line1`    varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_line2`    varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city`             varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state`            varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country`          varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'India',
  `pin_code`         varchar(10)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude`         decimal(10,6) DEFAULT NULL,
  `longitude`        decimal(10,6) DEFAULT NULL,
  `email`            varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone_number`     varchar(20)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alternate_phone`  varchar(20)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gst_number`       varchar(20)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pan_number`       varchar(20)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `business_license` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `opening_date`     date DEFAULT NULL,
  `admin_id`         int DEFAULT NULL COMMENT 'FK to users â€” branch ADMIN only',
  `employee_count`   int DEFAULT '0',
  `service_radius_km` decimal(6,2) DEFAULT '10.00',
  `created_by`       int DEFAULT NULL,
  `updated_by`       int DEFAULT NULL,
  `deleted_at`       timestamp NULL DEFAULT NULL,
  `created_at`       timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`branch_id`),
  KEY `idx_branches_admin_id` (`admin_id`),
  CONSTRAINT `fk_branches_admin_id` FOREIGN KEY (`admin_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `branches` (`branch_id`,`branch_name`,`branch_code`,`branch_type`,`branch_status`,`address_line1`,`city`,`state`,`pin_code`,`latitude`,`longitude`,`email`,`phone_number`,`employee_count`,`service_radius_km`,`created_by`,`updated_by`) VALUES
(1,'Pravzo Bangalore HQ','PVZ-BLR-001','MAIN','ACTIVE','MG Road, Bangalore','Bangalore','Karnataka','560001',12.971600,77.594600,'bangalore@pravzo.com','9100001001',10,10.00,1,1),
(2,'Pravzo Lucknow','PVZ-LKO-001','SUB','ACTIVE','Hazratganj, Lucknow','Lucknow','Uttar Pradesh','226001',26.846700,80.946200,'lucknow@pravzo.com','9100001002',10,10.00,1,1),
(3,'Pravzo Delhi','PVZ-DEL-001','SUB','ACTIVE','Connaught Place, Delhi','Delhi','Delhi','110001',28.613900,77.209000,'delhi@pravzo.com','9100001003',10,10.00,1,1),
(4,'Pravzo Pune','PVZ-PNE-001','SUB','ACTIVE','Koregaon Park, Pune','Pune','Maharashtra','411001',18.520400,73.856700,'pune@pravzo.com','9100001004',10,10.00,1,1);

-- ============================================================
-- TABLE: users
-- Single authentication table for ALL roles.
-- Added: full_name as GENERATED column (VIRTUAL).
-- Security fields kept (failed_login_attempts, etc.) â€”
--   these are auth/security fields, not profile data.
-- ============================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `user_id`               int NOT NULL AUTO_INCREMENT,
  `uuid`                  varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT (UUID())
                            COMMENT 'Universally unique identifier',
  `role_id`               int NOT NULL DEFAULT '4' COMMENT 'FK to roles table',
  `branch_id`             int DEFAULT NULL,
  `first_name`            varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name`             varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `full_name`             varchar(201) COLLATE utf8mb4_unicode_ci
                            GENERATED ALWAYS AS (
                              TRIM(CONCAT_WS(' ', `first_name`, `last_name`))
                            ) VIRTUAL COMMENT 'Computed from first_name + last_name',
  `email`                 varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone`                 varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `country_code`          varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '+91',
  `hashed_password`       varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `profile_image`         text COLLATE utf8mb4_unicode_ci,
  `status`                enum('ACTIVE','INACTIVE','BLOCKED','SUSPENDED',
                               'PENDING_VERIFICATION','DELETED')
                            COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `is_email_verified`     tinyint(1) DEFAULT '0',
  `is_phone_verified`     tinyint(1) DEFAULT '0',
  `last_login_at`         datetime DEFAULT NULL,
  `login_provider`        varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'PHONE_OTP',
  `failed_login_attempts` int DEFAULT '0',
  `account_locked_until`  datetime DEFAULT NULL,
  `force_password_change` tinyint(1) DEFAULT '0',
  `password_changed_at`   datetime DEFAULT NULL,
  `referred_by`           int DEFAULT NULL,
  `referral_code`         varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at`            timestamp NULL DEFAULT NULL,
  `created_at`            timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_users_uuid`          (`uuid`),
  UNIQUE KEY `uq_users_phone`         (`phone`),
  UNIQUE KEY `uq_users_email`         (`email`),
  UNIQUE KEY `uq_users_referral_code` (`referral_code`),
  KEY `idx_users_role_id`   (`role_id`),
  KEY `idx_users_branch_id` (`branch_id`),
  KEY `idx_users_status`    (`status`),
  KEY `idx_users_deleted_at`(`deleted_at`),
  CONSTRAINT `fk_users_role_id`    FOREIGN KEY (`role_id`)    REFERENCES `roles`    (`role_id`),
  CONSTRAINT `fk_users_branch_id`  FOREIGN KEY (`branch_id`)  REFERENCES `branches` (`branch_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_users_referred_by`FOREIGN KEY (`referred_by`)REFERENCES `users`    (`user_id`)   ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`user_id`,`role_id`,`branch_id`,`first_name`,`last_name`,`email`,`phone`,`country_code`,`hashed_password`,`status`,`is_email_verified`,`is_phone_verified`,`last_login_at`,`referral_code`,`created_at`,`updated_at`) VALUES
(1,5,NULL,'Aman','Sharma','aman@pravzo.com','9800000001','+91','$2b$10$e8ymxeJLjkv.aXwnDR9iOe2LSUJV/DPmvP7k7hqBRQkwUFFme0udG','ACTIVE',1,1,'2026-08-12 14:26:32',NULL,'2026-08-12 14:26:32','2026-08-13 14:54:51'),
(2,5,NULL,'Priya','Singh','priya@pravzo.com','9800000002','+91','$2b$10$e8ymxeJLjkv.aXwnDR9iOe2LSUJV/DPmvP7k7hqBRQkwUFFme0udG','ACTIVE',1,1,'2026-08-12 14:26:32',NULL,'2026-08-12 14:26:32','2026-08-13 14:54:51'),
(3,5,NULL,'Rahul','Verma','rahul@pravzo.com','9800000003','+91','$2b$10$e8ymxeJLjkv.aXwnDR9iOe2LSUJV/DPmvP7k7hqBRQkwUFFme0udG','ACTIVE',1,1,'2026-08-12 14:26:33',NULL,'2026-08-12 14:26:33','2026-08-13 14:54:51'),
(4,5,NULL,'Sneha','Patel','sneha@pravzo.com','9800000004','+91','$2b$10$e8ymxeJLjkv.aXwnDR9iOe2LSUJV/DPmvP7k7hqBRQkwUFFme0udG','ACTIVE',1,1,'2026-08-12 14:26:33',NULL,'2026-08-12 14:26:33','2026-08-13 14:54:51'),
(5,5,NULL,'Vikram','Nair','vikram@pravzo.com','9800000005','+91','$2b$10$e8ymxeJLjkv.aXwnDR9iOe2LSUJV/DPmvP7k7hqBRQkwUFFme0udG','ACTIVE',1,1,'2026-08-12 14:26:33',NULL,'2026-08-12 14:26:33','2026-08-13 14:54:51'),
(6,4,NULL,'Deepak','Gupta','deepak@pravzo.com','9800000006','+91','$2b$10$e8ymxeJLjkv.aXwnDR9iOe2LSUJV/DPmvP7k7hqBRQkwUFFme0udG','ACTIVE',1,1,NULL,NULL,'2026-08-12 14:26:33','2026-08-12 14:26:33'),
(7,4,NULL,'Anjali','Mehta','anjali@pravzo.com','9800000007','+91','$2b$10$e8ymxeJLjkv.aXwnDR9iOe2LSUJV/DPmvP7k7hqBRQkwUFFme0udG','ACTIVE',1,1,NULL,NULL,'2026-08-12 14:26:33','2026-08-12 16:38:36'),
(8,4,NULL,'Ravi','Kumar','ravi@pravzo.com','9800000008','+91','$2b$10$e8ymxeJLjkv.aXwnDR9iOe2LSUJV/DPmvP7k7hqBRQkwUFFme0udG','ACTIVE',1,1,NULL,NULL,'2026-08-12 14:26:33','2026-08-12 14:26:33'),
(9,5,NULL,'Meena','Joshi','meena@pravzo.com','9800000009','+91','$2b$10$e8ymxeJLjkv.aXwnDR9iOe2LSUJV/DPmvP7k7hqBRQkwUFFme0udG','ACTIVE',1,1,NULL,NULL,'2026-08-12 14:26:33','2026-08-13 14:54:51'),
(10,4,NULL,'Test','Blocked','blocked@pravzo.com','9800000010','+91','$2b$10$e8ymxeJLjkv.aXwnDR9iOe2LSUJV/DPmvP7k7hqBRQkwUFFme0udG','BLOCKED',1,1,NULL,NULL,'2026-08-12 14:26:33','2026-08-12 14:26:33'),
(11,5,NULL,'Test','Pending','pending@pravzo.com','9800000011','+91','$2b$10$e8ymxeJLjkv.aXwnDR9iOe2LSUJV/DPmvP7k7hqBRQkwUFFme0udG','PENDING_VERIFICATION',1,1,NULL,NULL,'2026-08-12 14:26:33','2026-08-12 14:26:33'),
(12,5,NULL,'Arjun','Rao','arjun@pravzo.com','9800000012','+91','$2b$10$e8ymxeJLjkv.aXwnDR9iOe2LSUJV/DPmvP7k7hqBRQkwUFFme0udG','ACTIVE',1,1,NULL,NULL,'2026-08-12 14:26:33','2026-08-13 14:54:51'),
(13,5,NULL,'Aman','Singh','aman@pravazo.com','9876543210','+91','$2b$12$nPvI/AoMoU2RM7QrAPgX2ePN3uVprHy3ZMxnLrKj4bofVxnznQMdO','ACTIVE',0,0,NULL,NULL,'2026-08-12 16:03:32','2026-08-13 14:54:51'),
(14,4,NULL,'Aman','Singh','aman3@pravazo.com','9876553210','+91','$2b$12$Wla28E96dqYwi.ML68tw2.2fbtr/XuJiKj9hYFVjtOOyEKVnrReI2','ACTIVE',0,0,NULL,NULL,'2026-08-13 12:45:50','2026-08-13 12:48:55'),
(101,1,NULL,'Super','Admin','superadmin@pravzo.com','9000000001','+91','$2b$10$I.RsPGd00HPzuz9cCzIILOfZeSC50vVJaXKe8bVsV0HzjLMhbJEZO','ACTIVE',1,1,'2026-08-13 14:20:30',NULL,'2026-08-12 14:26:32','2026-08-13 14:20:30'),
(102,2,NULL,'Admin','User','admin@pravzo.com','9000000002','+91','$2b$10$I.RsPGd00HPzuz9cCzIILOfZeSC50vVJaXKe8bVsV0HzjLMhbJEZO','ACTIVE',1,1,'2026-08-12 15:55:26',NULL,'2026-08-12 14:26:32','2026-08-12 15:55:26'),
(103,9,NULL,'Finance','Manager','finance@pravzo.com','9000000003','+91','$2b$10$I.RsPGd00HPzuz9cCzIILOfZeSC50vVJaXKe8bVsV0HzjLMhbJEZO','ACTIVE',1,1,NULL,NULL,'2026-08-12 14:26:32','2026-08-12 14:26:32'),
(104,2,NULL,'Ops','Manager','operations@pravzo.com','9000000004','+91','$2b$10$I.RsPGd00HPzuz9cCzIILOfZeSC50vVJaXKe8bVsV0HzjLMhbJEZO','ACTIVE',1,1,NULL,NULL,'2026-08-12 14:26:32','2026-08-12 14:26:32'),
(105,2,NULL,'Support','Lead','support@pravzo.com','9000000005','+91','$2b$10$I.RsPGd00HPzuz9cCzIILOfZeSC50vVJaXKe8bVsV0HzjLMhbJEZO','ACTIVE',1,1,NULL,NULL,'2026-08-12 14:26:32','2026-08-12 14:26:32');

-- ============================================================
-- TABLE: user_profiles
-- Cleaned vs v3:
--   REMOVED: bank_account_number, ifsc_code, bank_branch_name,
--            account_holder_name, upi_id, payout_schedule
--            â†’ these belong ONLY in riders (rider payment info)
--   REMOVED: rider_code â†’ belongs ONLY in riders
--   REMOVED: application_status â†’ belongs ONLY in riders
--   KEPT:    all genuine profile / HR data
-- ============================================================
DROP TABLE IF EXISTS `user_profiles`;
CREATE TABLE `user_profiles` (
  `profile_id`              int NOT NULL AUTO_INCREMENT,
  `user_id`                 int NOT NULL,
  `date_of_birth`           date DEFAULT NULL,
  `gender`                  enum('MALE','FEMALE','OTHER') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address`                 text COLLATE utf8mb4_unicode_ci,
  `city`                    varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state`                   varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pincode`                 varchar(10)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employee_id`             varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `job_type`                varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `joining_date`            date DEFAULT NULL,
  `salary`                  decimal(10,2) DEFAULT NULL,
  `assigned_hub`            varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_company`        varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `selected_partner`        varchar(50)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kyc_status`              enum('NOT_SUBMITTED','PENDING','UNDER_REVIEW',
                                 'APPROVED','REJECTED','REVERIFY_REQUIRED')
                              COLLATE utf8mb4_unicode_ci DEFAULT 'NOT_SUBMITTED'
                              COMMENT 'Denormalized cache â€” authoritative source is kyc table',
  `emergency_contact_name`   varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_contact_number` varchar(20)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_bookings`           int DEFAULT '0',
  `total_spent`              decimal(12,2) DEFAULT '0.00',
  `department`               varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at`               timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`               timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`profile_id`),
  UNIQUE KEY `uq_up_user_id`    (`user_id`),
  UNIQUE KEY `uq_up_employee_id`(`employee_id`),
  CONSTRAINT `fk_up_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `user_profiles` (`user_id`,`city`,`kyc_status`,`created_at`,`updated_at`) VALUES
(1,'Bangalore','APPROVED','2026-08-12 14:26:32','2026-08-13 14:54:51'),
(2,'Lucknow','APPROVED','2026-08-12 14:26:32','2026-08-13 14:54:51'),
(3,'Delhi','PENDING','2026-08-12 14:26:33','2026-08-13 14:54:51'),
(4,'Bangalore','APPROVED','2026-08-12 14:26:33','2026-08-13 14:54:51'),
(5,'Delhi','APPROVED','2026-08-12 14:26:33','2026-08-13 14:54:51'),
(6,'Bangalore','APPROVED','2026-08-12 14:26:33','2026-08-12 14:26:33'),
(7,'Lucknow','APPROVED','2026-08-12 14:26:33','2026-08-12 16:38:36'),
(8,'Delhi','APPROVED','2026-08-12 14:26:33','2026-08-12 14:26:33'),
(9,'Pune','APPROVED','2026-08-12 14:26:33','2026-08-13 14:54:51'),
(10,'Bangalore','REJECTED','2026-08-12 14:26:33','2026-08-12 14:26:33'),
(11,'Delhi','PENDING','2026-08-12 14:26:33','2026-08-12 14:26:33'),
(12,'Pune','PENDING','2026-08-12 14:26:33','2026-08-13 14:54:51'),
(13,NULL,'PENDING','2026-08-12 16:03:32','2026-08-13 14:54:51'),
(14,NULL,'NOT_SUBMITTED','2026-08-13 12:45:50','2026-08-13 12:48:55'),
(101,NULL,NULL,'2026-08-12 14:26:32','2026-08-13 14:20:30'),
(102,NULL,NULL,'2026-08-12 14:26:32','2026-08-12 15:55:26'),
(103,NULL,NULL,'2026-08-12 14:26:32','2026-08-12 14:26:32'),
(104,NULL,NULL,'2026-08-12 14:26:32','2026-08-12 14:26:32'),
(105,NULL,NULL,'2026-08-12 14:26:32','2026-08-12 14:26:32');

-- ============================================================
-- TABLE: wallets  (unchanged from v3)
-- ============================================================
DROP TABLE IF EXISTS `wallets`;
CREATE TABLE `wallets` (
  `wallet_id`      bigint NOT NULL AUTO_INCREMENT,
  `user_id`        int NOT NULL,
  `wallet_balance` decimal(10,2) DEFAULT '0.00',
  `currency`       char(3) COLLATE utf8mb4_unicode_ci DEFAULT 'INR',
  `is_active`      tinyint(1) DEFAULT '1',
  `created_at`     timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`wallet_id`),
  UNIQUE KEY `uq_wallets_user_id` (`user_id`),
  CONSTRAINT `fk_wallets_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `wallets` (`user_id`,`wallet_balance`,`currency`,`is_active`) VALUES
(1,1500.00,'INR',1),(2,2200.00,'INR',1),(3,800.00,'INR',1),(4,3500.00,'INR',1),
(5,500.00,'INR',1),(6,1200.00,'INR',1),(7,0.00,'INR',1),(8,4500.00,'INR',1),
(9,200.00,'INR',1),(10,100.00,'INR',1),(11,750.00,'INR',1),(12,3000.00,'INR',1),
(13,0.00,'INR',1),(14,0.00,'INR',1);

-- ============================================================
-- TABLE: wallet_transactions  (unchanged from v3)
-- ============================================================
DROP TABLE IF EXISTS `wallet_transactions`;
CREATE TABLE `wallet_transactions` (
  `transaction_id`  bigint NOT NULL AUTO_INCREMENT,
  `wallet_id`       bigint NOT NULL,
  `user_id`         int NOT NULL,
  `transaction_type`enum('CREDIT','DEBIT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount`          decimal(10,2) NOT NULL,
  `balance_before`  decimal(10,2) DEFAULT '0.00',
  `balance_after`   decimal(10,2) DEFAULT '0.00',
  `source_type`     varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL
                      COMMENT 'EARNING, TOPUP, REFUND, PAYOUT, etc.',
  `reference_type`  varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id`    varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_id`      bigint DEFAULT NULL,
  `booking_id`      bigint DEFAULT NULL,
  `description`     text COLLATE utf8mb4_unicode_ci,
  `created_at`      timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`transaction_id`),
  UNIQUE KEY `uq_wallet_tx_reference_id` (`reference_id`),
  KEY `idx_wt_wallet_id` (`wallet_id`),
  KEY `idx_wt_user_id`   (`user_id`),
  KEY `idx_wt_payment`   (`payment_id`),
  KEY `idx_wt_booking`   (`booking_id`),
  CONSTRAINT `fk_wt_wallet_id`  FOREIGN KEY (`wallet_id`)  REFERENCES `wallets`  (`wallet_id`)  ON DELETE CASCADE,
  CONSTRAINT `fk_wt_user_id`    FOREIGN KEY (`user_id`)    REFERENCES `users`    (`user_id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_wt_payment_id` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`payment_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_wt_booking_id` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: kyc  (unchanged from v3)
-- ============================================================
DROP TABLE IF EXISTS `kyc`;
CREATE TABLE `kyc` (
  `kyc_id`     int NOT NULL AUTO_INCREMENT,
  `user_id`    int NOT NULL,
  `kyc_type`   varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'STANDARD'
                 COMMENT 'STANDARD, ENHANCED, BUSINESS',
  `status`     enum('PENDING','APPROVED','REJECTED','REVERIFY_REQUIRED')
                 COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `verified_by`int DEFAULT NULL COMMENT 'user_id of verifying admin',
  `verified_at`datetime DEFAULT NULL,
  `remarks`    text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`kyc_id`),
  KEY `idx_kyc_user_id`  (`user_id`),
  KEY `idx_kyc_status`   (`status`),
  KEY `fk_kyc_verified_by`(`verified_by`),
  CONSTRAINT `fk_kyc_user_id`    FOREIGN KEY (`user_id`)    REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_kyc_verified_by`FOREIGN KEY (`verified_by`)REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `kyc_documents`;
CREATE TABLE `kyc_documents` (
  `doc_id`       int NOT NULL AUTO_INCREMENT,
  `kyc_id`       int NOT NULL,
  `document_type`varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL
                   COMMENT 'AADHAR, PAN, DL, PASSPORT, etc.',
  `file_url`     text COLLATE utf8mb4_unicode_ci,
  `status`       enum('PENDING','APPROVED','REJECTED')
                   COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `created_at`   timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`doc_id`),
  KEY `idx_kycd_kyc_id` (`kyc_id`),
  CONSTRAINT `fk_kycd_kyc_id` FOREIGN KEY (`kyc_id`) REFERENCES `kyc` (`kyc_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: user_documents  (unchanged from v3)
-- ============================================================
DROP TABLE IF EXISTS `user_documents`;
CREATE TABLE `user_documents` (
  `document_id`     int NOT NULL AUTO_INCREMENT,
  `user_id`         int NOT NULL,
  `document_type`   varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL
                      COMMENT 'DL, AADHAR, PAN, RC, etc.',
  `document_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_url`        text COLLATE utf8mb4_unicode_ci COMMENT 'Front image URL',
  `file_url_back`   text COLLATE utf8mb4_unicode_ci COMMENT 'Back image URL',
  `status`          enum('PENDING','APPROVED','REJECTED')
                      COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `verified_by`     int DEFAULT NULL,
  `verified_at`     datetime DEFAULT NULL,
  `rejection_reason`text COLLATE utf8mb4_unicode_ci,
  `created_at`      timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`document_id`),
  KEY `idx_ud_user_id`   (`user_id`),
  KEY `idx_ud_status`    (`status`),
  KEY `fk_ud_verified_by`(`verified_by`),
  CONSTRAINT `fk_ud_user_id`    FOREIGN KEY (`user_id`)    REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ud_verified_by`FOREIGN KEY (`verified_by`)REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: user_devices  (unchanged from v3)
-- ============================================================
DROP TABLE IF EXISTS `user_devices`;
CREATE TABLE `user_devices` (
  `device_id`         bigint NOT NULL AUTO_INCREMENT,
  `user_id`           int NOT NULL,
  `device_token`      varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_fingerprint`varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_name`       varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_type`       enum('ANDROID','IOS','WEB') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_model`      varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `browser`           varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `operating_system`  varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_ip_address`   varchar(50)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_login_at`     datetime DEFAULT NULL,
  `login_count`       int DEFAULT '1',
  `is_trusted`        tinyint(1) DEFAULT '0',
  `is_active`         tinyint(1) DEFAULT '1',
  `created_at`        timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`device_id`),
  KEY `idx_ud_user_id`  (`user_id`),
  KEY `idx_ud_device_type`(`device_type`),
  CONSTRAINT `fk_udev_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: login_history  (unchanged from v3)
-- ============================================================
DROP TABLE IF EXISTS `login_history`;
CREATE TABLE `login_history` (
  `login_id`           bigint NOT NULL AUTO_INCREMENT,
  `user_id`            int NOT NULL,
  `login_status`       enum('SUCCESS','FAILED','LOCKED')
                         COLLATE utf8mb4_unicode_ci DEFAULT 'SUCCESS',
  `login_method`       varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'PHONE_OTP',
  `session_id`         varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `access_token_jti`   varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refresh_token_jti`  varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address`         varchar(50)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent`         text COLLATE utf8mb4_unicode_ci,
  `device_type`        varchar(50)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `browser`            varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `operating_system`   varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_fingerprint` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `failed_reason`      text COLLATE utf8mb4_unicode_ci,
  `login_at`           datetime DEFAULT NULL,
  `logout_at`          datetime DEFAULT NULL,
  `session_duration`   int DEFAULT NULL,
  `created_at`         timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`login_id`),
  KEY `idx_lh_user_id`(`user_id`),
  KEY `idx_lh_status` (`login_status`),
  CONSTRAINT `fk_lh_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: password_history  (unchanged from v3)
-- ============================================================
DROP TABLE IF EXISTS `password_history`;
CREATE TABLE `password_history` (
  `history_id`   int NOT NULL AUTO_INCREMENT,
  `user_id`      int NOT NULL,
  `password_hash`varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_at`   datetime DEFAULT CURRENT_TIMESTAMP,
  `changed_by`   int DEFAULT NULL COMMENT 'user_id of actor (self or admin)',
  `change_reason`varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_temporary` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`history_id`),
  KEY `idx_ph_user_id` (`user_id`),
  CONSTRAINT `fk_ph_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: sessions  (unchanged from v3)
-- ============================================================
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `session_id`       varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id`          int NOT NULL,
  `access_token_jti` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refresh_token_jti`varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address`       varchar(50)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent`       text COLLATE utf8mb4_unicode_ci,
  `device_fingerprint`varchar(255)COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `session_status`   enum('ACTIVE','REVOKED','EXPIRED')
                       COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE',
  `expires_at`       datetime DEFAULT NULL,
  `revoked_at`       datetime DEFAULT NULL,
  `last_activity_at` datetime DEFAULT NULL,
  `created_at`       timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`),
  KEY `idx_sess_user_id`(`user_id`),
  KEY `idx_sess_status` (`session_status`),
  CONSTRAINT `fk_sess_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: refresh_tokens  (unchanged from v3)
-- ============================================================
DROP TABLE IF EXISTS `refresh_tokens`;
CREATE TABLE `refresh_tokens` (
  `token_id`     bigint NOT NULL AUTO_INCREMENT,
  `user_id`      int NOT NULL,
  `refresh_token`varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at`   datetime NOT NULL,
  `is_revoked`   tinyint(1) DEFAULT '0',
  `created_at`   timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`token_id`),
  KEY `idx_rt_user_id` (`user_id`),
  CONSTRAINT `fk_rt_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `refresh_tokens` (`token_id`,`user_id`,`refresh_token`,`expires_at`,`is_revoked`,`created_at`) VALUES
(1,102,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbl9pZCI6MiwiZW1haWwiOiJhZG1pbkBwcmF2em8uY29tIiwiaWF0IjoxNzg2NTQ5OTkzLCJleHAiOjE3ODcxNTQ3OTN9.weyWzdiNZSQDHUQDCu8NoEM4MIQ3DGv7RT3xqkEvcX4','2026-08-19 15:53:13',0,'2026-08-12 15:53:13'),
(2,102,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbl9pZCI6MiwiZW1haWwiOiJhZG1pbkBwcmF2em8uY29tIiwiaWF0IjoxNzg2NTUwMDk5LCJleHAiOjE3ODcxNTQ4OTl9.kll7vOYL-nq8Nn26Xdzuch2Jfhvh0tb_quTvdhdrKoI','2026-08-19 15:54:59',0,'2026-08-12 15:54:59'),
(4,101,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbl9pZCI6MSwiZW1haWwiOiJzdXBlcmFkbWluQHByYXZ6by5jb20iLCJpYXQiOjE3ODY1NTAyMDgsImV4cCI6MTc4NzE1NTAwOH0.-FRq5CDhn-8GD8z85cLGBcVJuPALwHbfs2HQyHPACDc','2026-08-19 15:56:48',0,'2026-08-12 15:56:48'),
(5,101,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbl9pZCI6MSwiZW1haWwiOiJzdXBlcmFkbWluQHByYXZ6by5jb20iLCJpYXQiOjE3ODY1NTA3MzIsImV4cCI6MTc4NzE1NTUzMn0.otZsp7JWitQQqCNj3_8n33mpkW3HePqzS32p5q_6urI','2026-08-19 16:05:32',0,'2026-08-12 16:05:32'),
(12,101,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbl9pZCI6MSwiZW1haWwiOiJzdXBlcmFkbWluQHByYXZ6by5jb20iLCJpYXQiOjE3ODY2MzA4MzAsImV4cCI6MTc4NzIzNTYzMH0.ND1YS3Dht6Ul21tr9WeuSZD6vaNcFPbLlYEKrSQOKdE','2026-08-20 14:20:30',0,'2026-08-13 14:20:30');

-- ============================================================
-- TABLE: branch_users  (unchanged from v3)
-- ============================================================
DROP TABLE IF EXISTS `branch_users`;
CREATE TABLE `branch_users` (
  `id`          int NOT NULL AUTO_INCREMENT,
  `branch_id`   int NOT NULL,
  `user_id`     int NOT NULL,
  `assigned_by` int DEFAULT NULL,
  `assigned_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `status`      enum('ACTIVE','INACTIVE','TRANSFERRED')
                  COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE',
  `created_at`  timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_bu_branch_user` (`branch_id`,`user_id`),
  KEY `idx_bu_user_id`    (`user_id`),
  KEY `idx_bu_assigned_by`(`assigned_by`),
  CONSTRAINT `fk_bu_branch_id`  FOREIGN KEY (`branch_id`)  REFERENCES `branches` (`branch_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bu_user_id`    FOREIGN KEY (`user_id`)    REFERENCES `users`    (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bu_assigned_by`FOREIGN KEY (`assigned_by`)REFERENCES `users`    (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: activity_logs  (unchanged from v3)
-- ============================================================
DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE `activity_logs` (
  `log_id`         bigint NOT NULL AUTO_INCREMENT,
  `user_id`        int DEFAULT NULL,
  `module`         varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_type`    varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id`      varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action`         varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description`    text COLLATE utf8mb4_unicode_ci,
  `old_value`      text COLLATE utf8mb4_unicode_ci,
  `new_value`      text COLLATE utf8mb4_unicode_ci,
  `metadata`       json DEFAULT NULL,
  `ip_address`     varchar(50)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent`     text COLLATE utf8mb4_unicode_ci,
  `request_method` varchar(10)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `request_url`    text COLLATE utf8mb4_unicode_ci,
  `created_at`     timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_al_user_id`(`user_id`),
  KEY `idx_al_module` (`module`),
  KEY `idx_al_entity` (`entity_type`,`entity_id`),
  CONSTRAINT `fk_al_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `activity_logs` (`user_id`,`module`,`action`,`description`,`ip_address`,`created_at`) VALUES
(101,'AUTH','LOGIN','Super admin logged in','127.0.0.1','2026-08-12 14:26:32'),
(101,'ADMIN_MANAGEMENT','CREATE_ADMIN','Admin accounts created during setup','127.0.0.1','2026-08-12 14:26:32');


-- ============================================================
-- TABLE: riders
-- CLEANED vs v3:
--   REMOVED: full_name      → users.full_name (generated)
--   REMOVED: phone_number   → users.phone
--   REMOVED: email          → users.email
--   REMOVED: profile_photo  → users.profile_image
--   REMOVED: date_of_birth  → user_profiles.date_of_birth
--   REMOVED: gender         → user_profiles.gender
--   REMOVED: address        → user_profiles.address
--   REMOVED: emergency_contact_* → user_profiles
--   REPLACED: branch_name (string) → branch_id (FK to branches)
--   KEPT: rider operational / payout fields (not auth data)
-- ============================================================
DROP TABLE IF EXISTS `riders`;
CREATE TABLE `riders` (
  `rider_id`            int NOT NULL AUTO_INCREMENT,
  `user_id`             int DEFAULT NULL        COMMENT 'FK to users — auth identity',
  `rider_code`          varchar(30)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `branch_id`           int DEFAULT NULL        COMMENT 'FK to branches',
  `assigned_city`       varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_zone`       varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status`              enum('ACTIVE','INACTIVE','SUSPENDED','UNDER_REVIEW','BLOCKED')
                          COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UNDER_REVIEW',
  `online_status`       enum('ONLINE','OFFLINE','BUSY')
                          COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OFFLINE',
  `availability`        enum('AVAILABLE','BUSY','OFFLINE')
                          COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OFFLINE',
  `application_status`  enum('pending','verified','rejected')
                          COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `kyc_status`          enum('NOT_SUBMITTED','PENDING','UNDER_REVIEW','APPROVED','REJECTED')
                          COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `rating`              decimal(3,2)  DEFAULT '0.00',
  `total_trips`         int          DEFAULT '0',
  `completed_trips`     int          DEFAULT '0',
  `cancelled_trips`     int          DEFAULT '0',
  `total_earnings`      decimal(12,2) DEFAULT '0.00',
  `today_earnings`      decimal(10,2) DEFAULT '0.00',
  `acceptance_rate`     decimal(5,2)  DEFAULT '0.00',
  `completion_rate`     decimal(5,2)  DEFAULT '0.00',
  `avg_ride_duration`   decimal(8,2)  DEFAULT '0.00',
  `avg_distance`        decimal(8,2)  DEFAULT '0.00',
  `assigned_vehicle_id` int DEFAULT NULL,
  `bank_account_number` varchar(50)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ifsc_code`           varchar(20)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_holder_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `upi_id`              varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payout_schedule`     varchar(50)  COLLATE utf8mb4_unicode_ci DEFAULT 'Every Monday',
  `deleted_at`          timestamp NULL DEFAULT NULL,
  `created_at`          timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`rider_id`),
  UNIQUE KEY `uq_riders_code`    (`rider_code`),
  UNIQUE KEY `uq_riders_user_id` (`user_id`),
  KEY `idx_riders_status`    (`status`),
  KEY `idx_riders_city`      (`assigned_city`),
  KEY `idx_riders_kyc`       (`kyc_status`),
  KEY `idx_riders_deleted`   (`deleted_at`),
  KEY `idx_riders_branch_id` (`branch_id`),
  KEY `idx_riders_vehicle_id` (`assigned_vehicle_id`),
  CONSTRAINT `fk_riders_user_id`    FOREIGN KEY (`user_id`)            REFERENCES `users`    (`user_id`)    ON DELETE SET NULL,
  CONSTRAINT `fk_riders_branch_id`  FOREIGN KEY (`branch_id`)          REFERENCES `branches` (`branch_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_riders_vehicle_id` FOREIGN KEY (`assigned_vehicle_id`) REFERENCES `vehicles` (`vehicle_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data: auth/profile columns removed; operational cols kept
INSERT INTO `riders` (`rider_id`,`user_id`,`rider_code`,`branch_id`,`assigned_city`,`status`,`online_status`,`availability`,`application_status`,`kyc_status`,`rating`,`total_trips`,`completed_trips`,`cancelled_trips`,`created_at`,`updated_at`) VALUES
(1,1,'RC-BLR-001',1,'Bangalore','SUSPENDED','OFFLINE','OFFLINE','verified','APPROVED',4.80,125,118,7,'2026-08-12 14:26:33','2026-08-13 14:54:51'),
(2,2,'RC-LKO-001',2,'Lucknow','ACTIVE','OFFLINE','OFFLINE','verified','APPROVED',4.70,89,82,7,'2026-08-12 14:26:33','2026-08-13 14:54:51'),
(3,3,'RC-DEL-001',3,'Delhi','ACTIVE','OFFLINE','OFFLINE','pending','PENDING',4.20,45,40,5,'2026-08-12 14:26:33','2026-08-13 14:54:51'),
(4,4,'RC-BLR-002',1,'Bangalore','ACTIVE','OFFLINE','OFFLINE','verified','APPROVED',4.90,200,192,8,'2026-08-12 14:26:33','2026-08-13 14:54:51'),
(5,5,'RC-DEL-002',3,'Delhi','ACTIVE','OFFLINE','OFFLINE','verified','APPROVED',4.60,156,148,8,'2026-08-12 14:26:33','2026-08-13 14:54:51'),
(6,9,'RC-PNE-001',4,'Pune','ACTIVE','OFFLINE','OFFLINE','verified','APPROVED',4.50,67,60,7,'2026-08-12 14:26:33','2026-08-13 14:54:51'),
(7,12,'RC-PNE-002',4,'Pune','UNDER_REVIEW','OFFLINE','OFFLINE','pending','PENDING',0.00,0,0,0,'2026-08-12 14:26:33','2026-08-13 14:54:51'),
(8,13,'RDR672073',NULL,'Mumbai','UNDER_REVIEW','OFFLINE','OFFLINE','pending','PENDING',0.00,0,0,0,'2026-08-13 13:44:32','2026-08-13 14:54:51');

-- TRIGGER: sync rider status to users.status
DELIMITER $$
CREATE TRIGGER `trg_rider_to_user_sync` AFTER UPDATE ON `riders` FOR EACH ROW BEGIN
  IF NEW.status != OLD.status AND NEW.user_id IS NOT NULL THEN
    UPDATE users
    SET status = CASE
          WHEN NEW.status = 'SUSPENDED' THEN 'SUSPENDED'
          WHEN NEW.status = 'ACTIVE'    THEN 'ACTIVE'
          WHEN NEW.status = 'INACTIVE'  THEN 'INACTIVE'
          ELSE status
        END,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;
END$$
DELIMITER ;

-- TRIGGER: validate user insert
DELIMITER $$
CREATE TRIGGER `trg_users_validate_insert` BEFORE INSERT ON `users` FOR EACH ROW BEGIN
  IF NEW.hashed_password IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'hashed_password cannot be null';
  END IF;
END$$
DELIMITER ;

-- ============================================================
-- TABLE: rider_locations
-- ============================================================
DROP TABLE IF EXISTS `rider_locations`;
CREATE TABLE `rider_locations` (
  `location_id` int NOT NULL AUTO_INCREMENT,
  `rider_id`    int NOT NULL,
  `latitude`    decimal(10,7) NOT NULL,
  `longitude`   decimal(10,7) NOT NULL,
  `updated_at`  datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`location_id`),
  UNIQUE KEY `uq_rider_location` (`rider_id`),
  CONSTRAINT `fk_rl_rider_id` FOREIGN KEY (`rider_id`) REFERENCES `riders` (`rider_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: rider_job_statistics
-- ============================================================
DROP TABLE IF EXISTS `rider_job_statistics`;
CREATE TABLE `rider_job_statistics` (
  `stat_id`        int NOT NULL AUTO_INCREMENT,
  `rider_id`       int NOT NULL,
  `total_jobs`     int DEFAULT '0',
  `completed_jobs` int DEFAULT '0',
  `cancelled_jobs` int DEFAULT '0',
  `total_earnings` decimal(12,2) DEFAULT '0.00',
  `created_at`     timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`stat_id`),
  UNIQUE KEY `uq_rjs_rider` (`rider_id`),
  CONSTRAINT `fk_rjs_rider_id` FOREIGN KEY (`rider_id`) REFERENCES `riders` (`rider_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: rider_performance
-- ============================================================
DROP TABLE IF EXISTS `rider_performance`;
CREATE TABLE `rider_performance` (
  `perf_id`         bigint NOT NULL AUTO_INCREMENT,
  `rider_id`        int NOT NULL,
  `period_date`     date DEFAULT NULL,
  `total_trips`     int DEFAULT '0',
  `completed_trips` int DEFAULT '0',
  `cancelled_trips` int DEFAULT '0',
  `total_earnings`  decimal(10,2) DEFAULT '0.00',
  `avg_rating`      decimal(3,2)  DEFAULT '0.00',
  `created_at`      timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`perf_id`),
  KEY `idx_rp_rider_id` (`rider_id`),
  CONSTRAINT `fk_rp_rider_id` FOREIGN KEY (`rider_id`) REFERENCES `riders` (`rider_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: rider_trips
-- ============================================================
DROP TABLE IF EXISTS `rider_trips`;
CREATE TABLE `rider_trips` (
  `trip_id`           bigint NOT NULL AUTO_INCREMENT,
  `rider_id`          int NOT NULL,
  `user_id`           int DEFAULT NULL,
  `vehicle_id`        int DEFAULT NULL,
  `pickup_address`    varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pickup_latitude`   decimal(10,7) DEFAULT NULL,
  `pickup_longitude`  decimal(10,7) DEFAULT NULL,
  `dropoff_address`   varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dropoff_latitude`  decimal(10,7) DEFAULT NULL,
  `dropoff_longitude` decimal(10,7) DEFAULT NULL,
  `distance_km`       decimal(8,2)  DEFAULT NULL,
  `duration_minutes`  int DEFAULT NULL,
  `fare_amount`       decimal(10,2) DEFAULT NULL,
  `payment_method`    varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_status`    enum('PENDING','PAID','FAILED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `status`            enum('PENDING','ACCEPTED','IN_TRANSIT','COMPLETED','CANCELLED')
                        COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `accepted_at`       datetime DEFAULT NULL,
  `picked_up_at`      datetime DEFAULT NULL,
  `completed_at`      datetime DEFAULT NULL,
  `cancelled_at`      datetime DEFAULT NULL,
  `created_at`        timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`trip_id`),
  KEY `idx_rt_rider_id` (`rider_id`),
  KEY `idx_rt_user_id`  (`user_id`),
  KEY `idx_rt_status`   (`status`),
  KEY `idx_rt_created`  (`created_at`),
  CONSTRAINT `fk_rt_rider_id`   FOREIGN KEY (`rider_id`) REFERENCES `riders` (`rider_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rtrip_user_id` FOREIGN KEY (`user_id`)  REFERENCES `users`  (`user_id`)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `rider_trips` (`trip_id`,`rider_id`,`user_id`,`vehicle_id`,`pickup_address`,`pickup_latitude`,`pickup_longitude`,`dropoff_address`,`dropoff_latitude`,`dropoff_longitude`,`distance_km`,`duration_minutes`,`fare_amount`,`payment_method`,`payment_status`,`status`,`accepted_at`,`completed_at`,`created_at`,`updated_at`) VALUES
(1,1,1,NULL,'Indiranagar, Bangalore',12.9716000,77.5946000,'Koramangala, Bangalore',12.9352000,77.6245000,5.20,18,120.00,'upi','PAID','COMPLETED','2026-08-12 14:26:34','2026-08-12 19:56:34','2026-08-12 14:26:34','2026-08-12 14:26:34'),
(2,2,2,NULL,'Hazratganj, Lucknow',26.8467000,80.9462000,'Gomti Nagar, Lucknow',26.8565000,80.9462000,4.80,15,95.00,'cash','PAID','COMPLETED','2026-08-12 14:26:34','2026-08-12 19:56:34','2026-08-12 14:26:34','2026-08-12 14:26:34'),
(3,3,3,NULL,'Connaught Place, Delhi',28.6139000,77.2090000,'Lajpat Nagar, Delhi',28.5665000,77.2431000,8.10,25,180.00,'upi','PAID','COMPLETED','2026-08-12 14:26:34','2026-08-12 19:56:34','2026-08-12 14:26:34','2026-08-12 14:26:34'),
(4,1,4,NULL,'Indiranagar, Bangalore',12.9716000,77.5946000,'HSR Layout, Bangalore',12.9116000,77.6370000,6.50,22,145.00,'wallet','PAID','COMPLETED','2026-08-12 14:26:34','2026-08-12 19:56:34','2026-08-12 14:26:34','2026-08-12 14:26:34'),
(5,2,5,NULL,'Aliganj, Lucknow',26.8783000,80.9307000,'Hazratganj, Lucknow',26.8467000,80.9462000,3.20,12,75.00,'cash','PAID','COMPLETED','2026-08-12 14:26:34','2026-08-12 19:56:34','2026-08-12 14:26:34','2026-08-12 14:26:34'),
(6,4,6,NULL,'Koregaon Park, Pune',18.5362000,73.8938000,'Hinjewadi, Pune',18.5912000,73.7389000,12.00,35,250.00,'upi','PAID','COMPLETED','2026-08-12 14:26:34','2026-08-12 19:56:34','2026-08-12 14:26:34','2026-08-12 14:26:34'),
(7,5,1,NULL,'South Delhi',28.5244000,77.2167000,'North Campus, Delhi',28.6892000,77.2141000,15.30,40,320.00,'upi','PAID','COMPLETED','2026-08-12 14:26:34','2026-08-12 19:56:34','2026-08-12 14:26:34','2026-08-12 14:26:34'),
(8,3,2,NULL,'CP, Delhi',28.6139000,77.2090000,'Rohini, Delhi',28.7041000,77.1025000,18.00,50,380.00,'cash','PAID','COMPLETED','2026-08-12 14:26:34','2026-08-12 19:56:34','2026-08-12 14:26:34','2026-08-12 14:26:34'),
(9,1,3,NULL,'Bangalore',12.9716000,77.5946000,'Electronic City',12.8458000,77.6622000,18.50,55,420.00,'upi','PENDING','IN_TRANSIT','2026-08-12 14:26:34',NULL,'2026-08-12 14:26:34','2026-08-12 14:26:34'),
(10,2,4,NULL,'Lucknow',26.8467000,80.9462000,'Indira Nagar, Lucknow',26.8786000,80.9447000,3.00,10,65.00,'wallet','PENDING','PENDING','2026-08-12 14:26:34',NULL,'2026-08-12 14:26:34','2026-08-12 14:26:34');

-- ============================================================
-- TABLE: vehicles
-- ============================================================
DROP TABLE IF EXISTS `vehicles`;
CREATE TABLE `vehicles` (
  `vehicle_id`                    int NOT NULL AUTO_INCREMENT,
  `model_name`                    varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `registration_number`           varchar(50)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price_per_week`                decimal(10,2) NOT NULL DEFAULT '0.00',
  `status`                        enum('AVAILABLE','RENTED','ASSIGNED','MAINTENANCE',
                                       'CHARGING','OFFLINE','BLOCKED','DAMAGED',
                                       'OUT_OF_SERVICE','INACTIVE')
                                    COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AVAILABLE',
  `image_url`                     text COLLATE utf8mb4_unicode_ci,
  `vehicle_type`                  enum('BIKE','SCOOTER','E_BIKE','E_SCOOTER','CYCLE')
                                    COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color`                         varchar(50)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `year_of_manufacture`           int DEFAULT NULL,
  `fuel_type`                     enum('PETROL','DIESEL','ELECTRIC','CNG','HYBRID')
                                    COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chassis_number`                varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `engine_number`                 varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `battery_number`                varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `battery_percentage`            int NOT NULL DEFAULT '100',
  `battery_level`                 int DEFAULT '100',
  `range_remaining_km`            int NOT NULL DEFAULT '100',
  `estimated_range_km`            int NOT NULL DEFAULT '100',
  `top_speed_kmh`                 int NOT NULL DEFAULT '60',
  `battery_type`                  varchar(50)  COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Exchangeable',
  `rc_number`                     varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rc_image_url`                  text COLLATE utf8mb4_unicode_ci,
  `insurance_number`              varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `insurance_expiry_date`         date DEFAULT NULL,
  `insurance_image_url`           text COLLATE utf8mb4_unicode_ci,
  `fitness_certificate_number`    varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fitness_certificate_expiry_date` date DEFAULT NULL,
  `fitness_certificate_image_url` text COLLATE utf8mb4_unicode_ci,
  `puc_number`                    varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `puc_expiry_date`               date DEFAULT NULL,
  `puc_image_url`                 text COLLATE utf8mb4_unicode_ci,
  `owner_name`                    varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `owner_phone`                   varchar(20)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_hub`                  varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_city`                 varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_zone`                 varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `branch_id`                     int DEFAULT NULL,
  `assigned_rider_id`             int DEFAULT NULL,
  `last_service_date`             date DEFAULT NULL,
  `next_service_date`             date DEFAULT NULL,
  `deleted_at`                    timestamp NULL DEFAULT NULL,
  `created_at`                    timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`                    timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`vehicle_id`),
  UNIQUE KEY `uq_vehicles_registration_number` (`registration_number`),
  KEY `idx_vehicles_status`            (`status`),
  KEY `idx_vehicles_vehicle_type`      (`vehicle_type`),
  KEY `idx_vehicles_assigned_city`     (`assigned_city`),
  KEY `idx_vehicles_assigned_rider_id` (`assigned_rider_id`),
  KEY `idx_vehicles_deleted_at`        (`deleted_at`),
  CONSTRAINT `fk_vehicles_rider`  FOREIGN KEY (`assigned_rider_id`) REFERENCES `riders`   (`rider_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_vehicles_branch` FOREIGN KEY (`branch_id`)         REFERENCES `branches` (`branch_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `vehicles` (`vehicle_id`,`model_name`,`registration_number`,`price_per_week`,`status`,`image_url`,`vehicle_type`,`color`,`fuel_type`,`battery_percentage`,`battery_level`,`range_remaining_km`,`estimated_range_km`,`top_speed_kmh`,`battery_type`,`assigned_hub`,`assigned_city`,`assigned_rider_id`,`created_at`,`updated_at`) VALUES
(1,'Pravzo X1','KA-01-EV-1001',350.00,'AVAILABLE','assets/images/scooter.png','E_SCOOTER','Blue','ELECTRIC',94,94,100,120,70,'Exchangeable','Indiranagar Hub','Bangalore',1,'2026-08-12 14:26:33','2026-08-13 12:29:02'),
(2,'Pravzo NEX','KA-01-EV-1002',300.00,'AVAILABLE','assets/images/scooter.png','E_SCOOTER','White','ELECTRIC',85,88,100,100,60,'Non-Exchangeable','Indiranagar Hub','Bangalore',2,'2026-08-12 14:26:33','2026-08-13 12:29:02'),
(3,'Pravzo NEX','KA-01-EV-1003',280.00,'AVAILABLE',NULL,'E_SCOOTER','Black','ELECTRIC',76,76,100,90,60,'Non-Exchangeable','Koramangala Hub','Bangalore',3,'2026-08-12 14:26:33','2026-08-12 14:26:33'),
(4,'Pravzo NEX Plus','UP-32-EV-2001',320.00,'AVAILABLE',NULL,'E_SCOOTER','Red','ELECTRIC',91,91,100,110,68,'Exchangeable','Hazratganj Hub','Lucknow',4,'2026-08-12 14:26:33','2026-08-12 14:26:33'),
(5,'Pravzo X2','UP-32-EV-2002',400.00,'AVAILABLE',NULL,'E_BIKE','Green','ELECTRIC',85,85,100,130,75,'Exchangeable','Gomti Nagar Hub','Lucknow',1,'2026-08-12 14:26:33','2026-08-13 13:44:33'),
(6,'Pravzo City 1','DL-01-EV-3001',360.00,'RENTED',NULL,'E_SCOOTER','Blue','ELECTRIC',67,67,100,85,60,'Non-Exchangeable','CP Hub','Delhi',NULL,'2026-08-12 14:26:33','2026-08-12 14:26:33'),
(7,'Pravzo City 2','DL-01-EV-3002',340.00,'MAINTENANCE',NULL,'E_SCOOTER','White','ELECTRIC',20,20,100,25,55,'Exchangeable','CP Hub','Delhi',NULL,'2026-08-12 14:26:33','2026-08-12 14:26:33'),
(8,'Pravzo Cargo 1','KA-01-EV-1004',500.00,'AVAILABLE',NULL,'E_BIKE','Black','ELECTRIC',95,95,100,150,80,'Exchangeable','Indiranagar Hub','Bangalore',1,'2026-08-12 14:26:33','2026-08-13 13:44:30'),
(9,'Pravzo Cargo 2','DL-01-EV-3003',480.00,'OFFLINE',NULL,'E_BIKE','Grey','ELECTRIC',0,0,100,0,80,'Non-Exchangeable','South Hub','Delhi',NULL,'2026-08-12 14:26:33','2026-08-12 14:26:33'),
(10,'Pravzo Flex','UP-32-EV-2003',290.00,'AVAILABLE',NULL,'E_SCOOTER','Orange','ELECTRIC',80,80,100,95,62,'Exchangeable','Aliganj Hub','Lucknow',NULL,'2026-08-12 14:26:33','2026-08-12 14:26:33'),
(11,'Pravzo Sprint','MH-01-EV-4001',380.00,'AVAILABLE',NULL,'E_SCOOTER','Yellow','ELECTRIC',90,90,100,115,70,'Exchangeable','Koregaon Hub','Pune',NULL,'2026-08-12 14:26:33','2026-08-12 14:26:33'),
(12,'Pravzo Ultra','MH-01-EV-4002',450.00,'AVAILABLE',NULL,'E_BIKE','Black','ELECTRIC',88,88,100,140,78,'Exchangeable','Koregaon Hub','Pune',NULL,'2026-08-12 14:26:33','2026-08-12 14:26:33'),
(13,'Ola S1 Pro','UP93AB1001',2500.00,'RENTED','/images/ola-s1-pro.jpg',NULL,NULL,NULL,92,92,165,181,116,'Lithium-ion','Jhansi Hub',NULL,NULL,'2026-07-20 22:26:11','2026-07-24 09:33:38'),
(14,'Ola S1 Pro','UP93AB1002',2500.00,'AVAILABLE','/images/ola-s1-pro.jpg',NULL,NULL,NULL,100,100,200,181,116,'Lithium-ion','Jhansi Hub',NULL,NULL,'2026-07-20 22:26:11','2026-07-20 22:26:11'),
(15,'Ather 450X','KA01AB3001',350.00,'AVAILABLE','/images/ather-450x.jpg',NULL,NULL,NULL,95,95,130,140,80,'Lithium-ion','Indiranagar Hub',NULL,NULL,'2026-07-20 22:26:11','2026-07-20 22:26:11'),
(16,'Ather 450X','KA01AB3002',300.00,'AVAILABLE','/images/ather-450x.jpg',NULL,NULL,NULL,88,88,120,140,80,'Lithium-ion','Koramangala Hub',NULL,NULL,'2026-07-20 22:26:11','2026-07-20 22:26:11'),
(22,'Ola S1 Air','UP93AB2001',2800.00,'RENTED','/images/ola-s1-air.jpg',NULL,NULL,NULL,88,88,155,165,106,'Lithium-ion','Jhansi Hub',NULL,NULL,'2026-07-20 22:26:11','2026-07-25 10:20:29');

-- ============================================================
-- TABLE: vehicle_activities
-- ============================================================
DROP TABLE IF EXISTS `vehicle_activities`;
CREATE TABLE `vehicle_activities` (
  `activity_id`  bigint NOT NULL AUTO_INCREMENT,
  `vehicle_id`   int NOT NULL,
  `activity_type`varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description`  text COLLATE utf8mb4_unicode_ci,
  `performed_by` int DEFAULT NULL,
  `created_at`   timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`activity_id`),
  KEY `idx_vact_vehicle_id` (`vehicle_id`),
  CONSTRAINT `fk_vact_vehicle_id` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: vehicle_assignments
-- ============================================================
DROP TABLE IF EXISTS `vehicle_assignments`;
CREATE TABLE `vehicle_assignments` (
  `assignment_id` int NOT NULL AUTO_INCREMENT,
  `vehicle_id`    int NOT NULL,
  `rider_id`      int DEFAULT NULL,
  `assigned_by`   int DEFAULT NULL,
  `assigned_at`   datetime DEFAULT NULL,
  `unassigned_at` datetime DEFAULT NULL,
  `status`        enum('ACTIVE','COMPLETED','CANCELLED')
                    COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE',
  `created_at`    timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`assignment_id`),
  KEY `idx_va_vehicle_id` (`vehicle_id`),
  KEY `idx_va_rider_id`   (`rider_id`),
  CONSTRAINT `fk_va_vehicle_id` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_va_rider_id`   FOREIGN KEY (`rider_id`)   REFERENCES `riders`   (`rider_id`)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: vehicle_locations
-- ============================================================
DROP TABLE IF EXISTS `vehicle_locations`;
CREATE TABLE `vehicle_locations` (
  `location_id` int NOT NULL AUTO_INCREMENT,
  `vehicle_id`  int NOT NULL,
  `latitude`    decimal(10,7) DEFAULT NULL,
  `longitude`   decimal(10,7) DEFAULT NULL,
  `updated_at`  datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`location_id`),
  UNIQUE KEY `uq_vl_vehicle_id` (`vehicle_id`),
  CONSTRAINT `fk_vl_vehicle_id` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: vehicle_maintenance
-- ============================================================
DROP TABLE IF EXISTS `vehicle_maintenance`;
CREATE TABLE `vehicle_maintenance` (
  `maintenance_id`   int NOT NULL AUTO_INCREMENT,
  `vehicle_id`       int NOT NULL,
  `maintenance_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description`      text COLLATE utf8mb4_unicode_ci,
  `cost`             decimal(10,2) DEFAULT '0.00',
  `status`           enum('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED')
                       COLLATE utf8mb4_unicode_ci DEFAULT 'SCHEDULED',
  `scheduled_date`   date DEFAULT NULL,
  `completed_date`   date DEFAULT NULL,
  `performed_by`     int DEFAULT NULL,
  `created_at`       timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`maintenance_id`),
  KEY `idx_vm_vehicle_id` (`vehicle_id`),
  CONSTRAINT `fk_vm_vehicle_id` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: vehicle_insurance
-- ============================================================
DROP TABLE IF EXISTS `vehicle_insurance`;
CREATE TABLE `vehicle_insurance` (
  `insurance_id`     int NOT NULL AUTO_INCREMENT,
  `vehicle_id`       int NOT NULL,
  `policy_number`    varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider`         varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date`       date DEFAULT NULL,
  `expiry_date`      date DEFAULT NULL,
  `premium_amount`   decimal(10,2) DEFAULT '0.00',
  `coverage_details` text COLLATE utf8mb4_unicode_ci,
  `document_url`     text COLLATE utf8mb4_unicode_ci,
  `status`           enum('ACTIVE','EXPIRED','CANCELLED')
                       COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE',
  `created_at`       timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`insurance_id`),
  KEY `idx_vi_vehicle_id` (`vehicle_id`),
  CONSTRAINT `fk_vi_vehicle_id` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: rental_plans
-- ============================================================
DROP TABLE IF EXISTS `rental_plans`;
CREATE TABLE `rental_plans` (
  `plan_id`      int NOT NULL AUTO_INCREMENT,
  `plan_name`    varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration_days`int NOT NULL,
  `price`        decimal(10,2) NOT NULL,
  `is_active`    tinyint(1) DEFAULT '1',
  `created_at`   timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`plan_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `rental_plans` (`plan_id`,`plan_name`,`duration_days`,`price`,`is_active`) VALUES
(1,'Daily',1,100.00,1),(2,'Weekly',7,350.00,1),(3,'Bi-Weekly',14,650.00,1),
(4,'Monthly',30,1200.00,1),(5,'Weekly Plus',7,500.00,1),(6,'Monthly Premium',30,1800.00,1),
(7,'Quarterly',90,3200.00,1);

-- ============================================================
-- TABLE: rentals
-- ============================================================
DROP TABLE IF EXISTS `rentals`;
CREATE TABLE `rentals` (
  `rental_id`       int NOT NULL AUTO_INCREMENT,
  `user_id`         int NOT NULL,
  `vehicle_id`      int NOT NULL,
  `plan_id`         int DEFAULT NULL,
  `pickup_branch_id`int DEFAULT NULL,
  `status`          enum('PENDING','ACTIVE','COMPLETED','CANCELLED','OVERDUE')
                      COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `payment_status`  enum('PENDING','PAID','FAILED','PARTIAL','REFUNDED')
                      COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `start_date`      datetime DEFAULT NULL,
  `end_date`        datetime DEFAULT NULL,
  `base_amount`     decimal(10,2) DEFAULT '0.00',
  `security_deposit`decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `tax_amount`      decimal(10,2) DEFAULT '0.00',
  `total_amount`    decimal(10,2) DEFAULT '0.00',
  `created_at`      timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`rental_id`),
  KEY `idx_rentals_user_id`    (`user_id`),
  KEY `idx_rentals_vehicle_id` (`vehicle_id`),
  KEY `idx_rentals_status`     (`status`),
  KEY `fk_rentals_branch`      (`pickup_branch_id`),
  CONSTRAINT `fk_rentals_user`    FOREIGN KEY (`user_id`)          REFERENCES `users`        (`user_id`),
  CONSTRAINT `fk_rentals_vehicle` FOREIGN KEY (`vehicle_id`)       REFERENCES `vehicles`     (`vehicle_id`),
  CONSTRAINT `fk_rentals_plan`    FOREIGN KEY (`plan_id`)          REFERENCES `rental_plans` (`plan_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rentals_branch`  FOREIGN KEY (`pickup_branch_id`) REFERENCES `branches`     (`branch_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `rentals` (`rental_id`,`user_id`,`vehicle_id`,`plan_id`,`pickup_branch_id`,`status`,`payment_status`,`start_date`,`end_date`,`base_amount`,`security_deposit`,`discount_amount`,`tax_amount`,`total_amount`) VALUES
(1,1,1,2,1,'ACTIVE','PAID','2026-08-01 09:00:00','2026-08-08 09:00:00',350.00,500.00,0.00,0.00,850.00),
(2,2,2,5,2,'COMPLETED','PAID','2026-07-15 10:00:00','2026-07-22 10:00:00',350.00,500.00,0.00,0.00,850.00),
(3,3,3,2,1,'COMPLETED','PAID','2026-07-01 11:00:00','2026-07-08 11:00:00',500.00,700.00,0.00,0.00,1200.00),
(4,4,4,5,2,'CANCELLED','REFUNDED','2026-06-01 09:00:00','2026-06-08 09:00:00',350.00,500.00,0.00,0.00,850.00);

-- ============================================================
-- TABLE: bookings
-- ============================================================
DROP TABLE IF EXISTS `bookings`;
CREATE TABLE `bookings` (
  `booking_id`         bigint NOT NULL AUTO_INCREMENT,
  `booking_number`     varchar(50)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id`       varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id`            int NOT NULL,
  `vehicle_id`         int NOT NULL,
  `rider_id`           int DEFAULT NULL,
  `rider_user_id`      int DEFAULT NULL,
  `assigned_at`        datetime DEFAULT NULL,
  `coupon_code`        varchar(50)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date`         date NOT NULL,
  `end_date`           date NOT NULL,
  `rental_rate_per_week` decimal(10,2) NOT NULL,
  `total_amount`       decimal(10,2) NOT NULL,
  `security_deposit`   decimal(10,2) NOT NULL DEFAULT '0.00',
  `status`             enum('PENDING','ACTIVE','ASSIGNED','COMPLETED','CANCELLED')
                         COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `payment_status`     enum('PENDING','PAID','FAILED','PARTIAL','REFUNDED')
                         COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `created_at`         timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`booking_id`),
  KEY `fk_bookings_user_id`    (`user_id`),
  KEY `fk_bookings_vehicle_id` (`vehicle_id`),
  KEY `idx_bookings_status`    (`status`),
  CONSTRAINT `fk_bookings_user_id`    FOREIGN KEY (`user_id`)    REFERENCES `users`    (`user_id`),
  CONSTRAINT `fk_bookings_vehicle_id` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `bookings` (`booking_id`,`user_id`,`vehicle_id`,`rider_id`,`start_date`,`end_date`,`rental_rate_per_week`,`total_amount`,`security_deposit`,`status`,`payment_status`,`created_at`,`updated_at`) VALUES
(1,1,1,NULL,'2026-06-01','2026-06-07',350.00,950.00,500.00,'COMPLETED','PAID','2026-08-12 14:26:33','2026-08-12 14:26:33'),
(2,2,2,NULL,'2026-06-08','2026-06-14',300.00,800.00,500.00,'COMPLETED','PAID','2026-08-12 14:26:33','2026-08-12 14:26:33'),
(3,3,3,NULL,'2026-06-15','2026-06-21',280.00,780.00,500.00,'COMPLETED','PAID','2026-08-12 14:26:33','2026-08-12 14:26:33'),
(4,4,4,NULL,'2026-07-01','2026-07-07',320.00,820.00,500.00,'COMPLETED','PAID','2026-08-12 14:26:33','2026-08-12 14:26:33'),
(5,5,5,NULL,'2026-07-10','2026-07-16',400.00,900.00,500.00,'COMPLETED','PAID','2026-08-12 14:26:34','2026-08-12 14:26:34'),
(6,6,6,NULL,'2026-08-01','2026-08-07',360.00,860.00,500.00,'ACTIVE','PAID','2026-08-12 14:26:34','2026-08-12 14:26:34'),
(7,7,7,NULL,'2026-08-05','2026-08-11',340.00,840.00,500.00,'ACTIVE','PAID','2026-08-12 14:26:34','2026-08-12 14:26:34'),
(8,1,8,NULL,'2026-08-10','2026-08-16',500.00,1000.00,500.00,'PENDING','PENDING','2026-08-12 14:26:34','2026-08-12 14:26:34'),
(9,2,9,NULL,'2026-07-20','2026-07-26',290.00,790.00,500.00,'COMPLETED','PAID','2026-08-12 14:26:34','2026-08-12 14:26:34'),
(10,3,10,NULL,'2026-06-20','2026-06-26',450.00,950.00,500.00,'CANCELLED','REFUNDED','2026-08-12 14:26:34','2026-08-12 14:26:34');

DROP TABLE IF EXISTS `booking_audit_logs`;
CREATE TABLE `booking_audit_logs` (
  `log_id`      bigint NOT NULL AUTO_INCREMENT,
  `booking_id`  bigint NOT NULL,
  `action`      varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `performed_by`int DEFAULT NULL,
  `actor_id`    int DEFAULT NULL,
  `old_status`  varchar(50)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status`  varchar(50)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes`       text COLLATE utf8mb4_unicode_ci,
  `reason`      text COLLATE utf8mb4_unicode_ci,
  `created_at`  timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `fk_bal_booking_id` (`booking_id`),
  CONSTRAINT `fk_bal_booking_id` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: payments
-- ============================================================
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `payment_id`          bigint NOT NULL AUTO_INCREMENT,
  `user_id`             int NOT NULL,
  `booking_id`          bigint DEFAULT NULL,
  `gateway`             varchar(50)  COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'razorpay',
  `gateway_order_id`    varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gateway_payment_id`  varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gateway_signature`   varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount`              decimal(10,2) NOT NULL,
  `currency`            char(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INR',
  `purpose`             enum('wallet_topup','booking','refund','other')
                          COLLATE utf8mb4_unicode_ci NOT NULL,
  `status`              enum('created','paid','failed','refunded')
                          COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'created',
  `method`              varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta`                json DEFAULT NULL,
  `created_at`          timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `uq_payments_gateway_order_id` (`gateway_order_id`),
  KEY `idx_payments_user_id`    (`user_id`),
  KEY `idx_payments_booking_id` (`booking_id`),
  KEY `idx_payments_status`     (`status`),
  CONSTRAINT `fk_payments_user`    FOREIGN KEY (`user_id`)    REFERENCES `users`    (`user_id`),
  CONSTRAINT `fk_payments_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `payments` (`payment_id`,`user_id`,`booking_id`,`gateway`,`gateway_order_id`,`gateway_payment_id`,`amount`,`currency`,`purpose`,`status`,`method`) VALUES
(1,1,1,'razorpay','order_test_1_1786544794080','pay_test_1',950.00,'INR','booking','paid','upi'),
(2,2,2,'razorpay','order_test_2_1786544794089','pay_test_2',800.00,'INR','booking','paid','upi'),
(3,3,3,'razorpay','order_test_3_1786544794103','pay_test_3',780.00,'INR','booking','paid','upi'),
(4,4,4,'razorpay','order_test_4_1786544794116','pay_test_4',820.00,'INR','booking','paid','upi'),
(5,5,5,'razorpay','order_test_5_1786544794130','pay_test_5',900.00,'INR','booking','paid','upi'),
(6,6,6,'razorpay','order_test_6_1786544794143','pay_test_6',860.00,'INR','booking','paid','upi'),
(7,7,7,'razorpay','order_test_7_1786544794156','pay_test_7',840.00,'INR','booking','paid','upi'),
(8,2,9,'razorpay','order_test_9_1786544794166','pay_test_9',790.00,'INR','booking','paid','upi'),
(9,3,10,'razorpay','order_test_10_1786544794178','pay_test_10',950.00,'INR','booking','refunded','upi');

DROP TABLE IF EXISTS `payment_attempts`;
CREATE TABLE `payment_attempts` (
  `attempt_id`       bigint NOT NULL AUTO_INCREMENT,
  `payment_id`       bigint NOT NULL,
  `gateway_provider` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `request_payload`  text COLLATE utf8mb4_unicode_ci,
  `response_payload` text COLLATE utf8mb4_unicode_ci,
  `status`           varchar(50)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `error_code`       varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `error_message`    text COLLATE utf8mb4_unicode_ci,
  `created_at`       timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`attempt_id`),
  KEY `idx_pa_payment_id` (`payment_id`),
  CONSTRAINT `fk_pa_payment_id` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`payment_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `payment_refunds`;
CREATE TABLE `payment_refunds` (
  `refund_id`      bigint NOT NULL AUTO_INCREMENT,
  `payment_id`     bigint NOT NULL,
  `amount`         decimal(10,2) NOT NULL,
  `status`         enum('PENDING','SUCCESS','FAILED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `refund_reason`  text COLLATE utf8mb4_unicode_ci,
  `transaction_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at`     timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`refund_id`),
  KEY `idx_pr_payment_id` (`payment_id`),
  CONSTRAINT `fk_pr_payment_id` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`payment_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: payouts
-- ============================================================
DROP TABLE IF EXISTS `payouts`;
CREATE TABLE `payouts` (
  `payout_id`                bigint NOT NULL AUTO_INCREMENT,
  `user_id`                  int NOT NULL,
  `wallet_transaction_id`    bigint DEFAULT NULL,
  `amount`                   decimal(14,2) NOT NULL,
  `method`                   enum('bank_transfer','upi','manual')
                               COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'bank_transfer',
  `status`                   enum('pending','queued','processing','initiated',
                                   'completed','failed','reversed','cancelled')
                               COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `account_holder_name`      varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_number`      varchar(50)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ifsc_code`                varchar(20)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `branch_name`              varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `upi_id`                   varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `razorpayx_payout_id`      varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `razorpayx_fund_account_id`varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `razorpayx_contact_id`     varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id`             varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `idempotency_key`          varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `failure_reason`           text COLLATE utf8mb4_unicode_ci,
  `notes`                    json DEFAULT NULL,
  `remarks`                  text COLLATE utf8mb4_unicode_ci,
  `currency`                 varchar(10)  COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INR',
  `created_by`               int DEFAULT NULL,
  `processed_at`             timestamp NULL DEFAULT NULL,
  `created_at`               timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`               timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`payout_id`),
  UNIQUE KEY `uq_payouts_reference_id`        (`reference_id`),
  UNIQUE KEY `uq_payouts_razorpayx_payout_id` (`razorpayx_payout_id`),
  UNIQUE KEY `uq_payouts_idempotency_key`     (`idempotency_key`),
  KEY `idx_payouts_user_id` (`user_id`),
  KEY `idx_payouts_status`  (`status`),
  CONSTRAINT `fk_payouts_user`       FOREIGN KEY (`user_id`)    REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_payouts_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: otp_logs
-- ============================================================
DROP TABLE IF EXISTS `otp_logs`;
CREATE TABLE `otp_logs` (
  `otp_id`     bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `identifier` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL
                 COMMENT 'mobile number or email',
  `otp_code`   varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purpose`    enum('login','register','forgot_password','change_mobile','change_email')
                 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'login',
  `is_used`    tinyint(1) NOT NULL DEFAULT '0',
  `attempts`   tinyint NOT NULL DEFAULT '0',
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`otp_id`),
  KEY `idx_identifier_purpose` (`identifier`,`purpose`),
  KEY `idx_expires_at`         (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `otp_logs` VALUES
(1,'9876543212','329066','forgot_password',1,0,'2026-07-23 12:27:40','2026-07-23 12:17:40'),
(2,'9876543212','675031','login',1,0,'2026-07-23 12:32:42','2026-07-23 12:22:42'),
(3,'9876543212','150898','login',1,0,'2026-07-23 12:35:23','2026-07-23 12:25:23');

-- ============================================================
-- TABLE: coupons
-- ============================================================
DROP TABLE IF EXISTS `coupons`;
CREATE TABLE `coupons` (
  `coupon_id`         int NOT NULL AUTO_INCREMENT,
  `code`              varchar(50)  COLLATE utf8mb4_unicode_ci NOT NULL,
  `description`       text COLLATE utf8mb4_unicode_ci,
  `discount_type`     enum('PERCENT','FLAT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FLAT',
  `discount_value`    decimal(10,2) NOT NULL,
  `max_discount_amount` decimal(10,2) DEFAULT NULL,
  `min_order_amount`  decimal(10,2) DEFAULT '0.00',
  `max_uses_per_user` int DEFAULT NULL,
  `max_total_uses`    int DEFAULT NULL,
  `total_used`        int NOT NULL DEFAULT '0',
  `valid_from`        datetime DEFAULT NULL,
  `valid_until`       datetime DEFAULT NULL,
  `is_active`         tinyint(1) NOT NULL DEFAULT '1',
  `created_at`        timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`coupon_id`),
  UNIQUE KEY `uq_coupons_code` (`code`),
  KEY `idx_coupons_is_active`  (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `coupons` (`coupon_id`,`code`,`description`,`discount_type`,`discount_value`,`max_discount_amount`,`min_order_amount`,`max_uses_per_user`,`max_total_uses`,`total_used`,`is_active`) VALUES
(1,'PRAVZO10','10% off on all bookings','PERCENT',10.00,200.00,300.00,3,1000,0,1),
(2,'FLAT100','Flat Rs100 off above Rs500','FLAT',100.00,NULL,500.00,2,500,0,1),
(3,'NEWUSER50','Rs50 off for new users','FLAT',50.00,NULL,200.00,1,NULL,0,1),
(4,'SUMMER25','25% Summer Special','PERCENT',25.00,400.00,400.00,2,200,0,1),
(5,'RIDE500','Flat Rs500 off on Rs2000+','FLAT',500.00,NULL,2000.00,1,100,0,1),
(6,'PRAVAZO10','10% off on all bookings','PERCENT',10.00,200.00,300.00,3,1000,0,1);

DROP TABLE IF EXISTS `coupon_usages`;
CREATE TABLE `coupon_usages` (
  `usage_id`       int NOT NULL AUTO_INCREMENT,
  `coupon_id`      int NOT NULL,
  `user_id`        int NOT NULL,
  `booking_id`     bigint DEFAULT NULL,
  `discount_amount`decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at`     timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`usage_id`),
  KEY `fk_cu_user`     (`user_id`),
  KEY `idx_coupon_user`(`coupon_id`,`user_id`),
  KEY `idx_cu_booking` (`booking_id`),
  CONSTRAINT `fk_cu_coupon`  FOREIGN KEY (`coupon_id`)  REFERENCES `coupons`  (`coupon_id`)  ON DELETE CASCADE,
  CONSTRAINT `fk_cu_user`    FOREIGN KEY (`user_id`)    REFERENCES `users`    (`user_id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_cu_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: notifications + related tables
-- ============================================================
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `notification_id` bigint NOT NULL AUTO_INCREMENT,
  `title`           varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message`         text COLLATE utf8mb4_unicode_ci,
  `notification_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipient_type`  varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipient_ids`   json DEFAULT NULL,
  `recipient_count` int DEFAULT '0',
  `filter_city`     varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `filter_vehicle_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `filter_user_group`   varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status`          enum('DRAFT','SCHEDULED','SENDING','SENT','FAILED','CANCELLED')
                      COLLATE utf8mb4_unicode_ci DEFAULT 'DRAFT',
  `channel`         varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'PUSH',
  `scheduled_at`    datetime DEFAULT NULL,
  `sent_at`         datetime DEFAULT NULL,
  `completed_at`    datetime DEFAULT NULL,
  `template_id`     int DEFAULT NULL,
  `priority`        enum('LOW','NORMAL','HIGH','CRITICAL')
                      COLLATE utf8mb4_unicode_ci DEFAULT 'NORMAL',
  `action_type`     varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action_data`     json DEFAULT NULL,
  `image_url`       text COLLATE utf8mb4_unicode_ci,
  `total_sent`      int DEFAULT '0',
  `total_delivered` int DEFAULT '0',
  `total_read`      int DEFAULT '0',
  `total_failed`    int DEFAULT '0',
  `retry_count`     int DEFAULT '0',
  `max_retries`     int DEFAULT '3',
  `last_retry_at`   datetime DEFAULT NULL,
  `created_by`      int DEFAULT NULL,
  `deleted_at`      timestamp NULL DEFAULT NULL,
  `created_at`      timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `idx_notif_status`     (`status`),
  KEY `idx_notif_created_by` (`created_by`),
  CONSTRAINT `fk_notif_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `notification_templates`;
CREATE TABLE `notification_templates` (
  `template_id`   int NOT NULL AUTO_INCREMENT,
  `template_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `template_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title`         varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message`       text COLLATE utf8mb4_unicode_ci,
  `subject`       varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `html_content`  longtext COLLATE utf8mb4_unicode_ci,
  `sms_text`      text COLLATE utf8mb4_unicode_ci,
  `variables`     json DEFAULT NULL,
  `category`      varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active`     tinyint(1) DEFAULT '1',
  `created_by`    int DEFAULT NULL,
  `deleted_at`    timestamp NULL DEFAULT NULL,
  `created_at`    timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`template_id`),
  UNIQUE KEY `uq_nt_name` (`template_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `notification_deliveries`;
CREATE TABLE `notification_deliveries` (
  `delivery_id`      bigint NOT NULL AUTO_INCREMENT,
  `notification_id`  bigint NOT NULL,
  `recipient_type`   varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipient_id`     int DEFAULT NULL,
  `delivery_status`  enum('PENDING','SENT','DELIVERED','READ','FAILED')
                       COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `channel`          varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_token`     text COLLATE utf8mb4_unicode_ci,
  `device_type`      varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sent_at`          datetime DEFAULT NULL,
  `delivered_at`     datetime DEFAULT NULL,
  `read_at`          datetime DEFAULT NULL,
  `failed_at`        datetime DEFAULT NULL,
  `error_message`    text COLLATE utf8mb4_unicode_ci,
  `failure_reason`   text COLLATE utf8mb4_unicode_ci,
  `channel_response` text COLLATE utf8mb4_unicode_ci,
  `created_at`       timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`delivery_id`),
  KEY `idx_nd_notification_id` (`notification_id`),
  CONSTRAINT `fk_nd_notification_id` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`notification_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `notification_audit_logs`;
CREATE TABLE `notification_audit_logs` (
  `audit_id`        bigint NOT NULL AUTO_INCREMENT,
  `notification_id` bigint DEFAULT NULL,
  `action`          varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description`     text COLLATE utf8mb4_unicode_ci,
  `recipient_count` int DEFAULT '0',
  `performed_by`    int DEFAULT NULL,
  `ip_address`      varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent`      text COLLATE utf8mb4_unicode_ci,
  `created_at`      timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`audit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `user_notifications`;
CREATE TABLE `user_notifications` (
  `notification_id`   bigint NOT NULL AUTO_INCREMENT,
  `user_id`           int NOT NULL,
  `title`             varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message`           text COLLATE utf8mb4_unicode_ci NOT NULL,
  `notification_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'INFO',
  `route_target`      varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_read`           tinyint(1) DEFAULT '0',
  `read_at`           datetime DEFAULT NULL,
  `created_at`        timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `idx_un_user_id` (`user_id`),
  KEY `idx_un_is_read` (`is_read`),
  CONSTRAINT `fk_un_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: user_addresses
-- ============================================================
DROP TABLE IF EXISTS `user_addresses`;
CREATE TABLE `user_addresses` (
  `address_id`   int UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`      int NOT NULL,
  `address_type` enum('HOME','WORK','OTHER') COLLATE utf8mb4_unicode_ci DEFAULT 'HOME',
  `address_line1`varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address_line2`varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city`         varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state`        varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pincode`      varchar(10)  COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude`     decimal(10,8) DEFAULT NULL,
  `longitude`    decimal(11,8) DEFAULT NULL,
  `is_default`   tinyint(1) DEFAULT '0',
  `created_at`   datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`address_id`),
  KEY `idx_addresses_user_id` (`user_id`),
  CONSTRAINT `fk_ua_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: charging_stations
-- ============================================================
DROP TABLE IF EXISTS `charging_stations`;
CREATE TABLE `charging_stations` (
  `station_id`      int NOT NULL AUTO_INCREMENT,
  `name`            varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address`         text COLLATE utf8mb4_unicode_ci,
  `city`            varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude`        decimal(10,7) DEFAULT NULL,
  `longitude`       decimal(10,7) DEFAULT NULL,
  `charger_type`    enum('fast','slow','swap') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'slow',
  `total_slots`     int NOT NULL DEFAULT '1',
  `available_slots` int NOT NULL DEFAULT '1',
  `price_per_unit`  decimal(10,2) DEFAULT NULL,
  `phone`           varchar(20)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_url`       varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active`       tinyint(1) NOT NULL DEFAULT '1',
  `created_at`      timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`station_id`),
  KEY `idx_cs_city`         (`city`),
  KEY `idx_cs_charger_type` (`charger_type`),
  KEY `idx_cs_is_active`    (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `charging_stations` (`station_id`,`name`,`address`,`city`,`latitude`,`longitude`,`charger_type`,`total_slots`,`available_slots`,`price_per_unit`,`phone`,`is_active`) VALUES
(1,'Pravzo Hub MG Road','MG Road','Bangalore',12.9716000,77.5946000,'fast',4,2,8.50,'9100101001',1),
(2,'Pravzo Hub Koramangala','Koramangala','Bangalore',12.9352000,77.6245000,'slow',3,1,6.00,'9100101002',1),
(3,'Pravzo Hub Hazratganj','Hazratganj','Lucknow',26.8467000,80.9462000,'fast',2,1,7.50,'9100101003',1),
(4,'Pravzo Hub Gomti Nagar','Gomti Nagar','Lucknow',26.8565000,80.9462000,'swap',2,0,5.00,'9100101004',1),
(5,'Pravzo Hub Connaught Place','Connaught Place','Delhi',28.6139000,77.2090000,'fast',3,1,9.00,'9100101005',1),
(6,'Pravzo Hub Saket','Saket','Delhi',28.5244000,77.2167000,'slow',2,2,6.50,'9100101006',1),
(7,'Pravzo Hub Koregaon Park','Koregaon Park','Pune',18.5362000,73.8938000,'fast',3,2,8.00,'9100101007',1);

-- ============================================================
-- TABLE: guides
-- ============================================================
DROP TABLE IF EXISTS `guides`;
CREATE TABLE `guides` (
  `guide_id`          int NOT NULL AUTO_INCREMENT,
  `title`             varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug`              varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category`          enum('safety','maintenance','charging','tips','faq','city')
                        COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'tips',
  `summary`           text COLLATE utf8mb4_unicode_ci,
  `content`           longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `thumbnail_url`     varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `read_time_minutes` int NOT NULL DEFAULT '3',
  `is_featured`       tinyint(1) NOT NULL DEFAULT '0',
  `is_published`      tinyint(1) NOT NULL DEFAULT '0',
  `published_at`      datetime DEFAULT NULL,
  `created_at`        timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`guide_id`),
  UNIQUE KEY `uq_guides_slug` (`slug`),
  KEY `idx_g_category`  (`category`),
  KEY `idx_g_published` (`is_published`),
  KEY `idx_g_featured`  (`is_featured`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `guides` (`guide_id`,`title`,`slug`,`category`,`summary`,`content`,`read_time_minutes`,`is_featured`,`is_published`,`published_at`) VALUES
(1,'EV Battery Safety','ev-battery-safety','safety','Keep battery healthy by avoiding high heat and using certified chargers.','Keep battery healthy by avoiding high heat and using certified chargers.',4,1,1,'2026-08-12 14:26:34'),
(2,'Routine EV Maintenance','routine-ev-maintenance','maintenance','Inspect tyres, brake health, and software updates regularly.','Inspect tyres, brake health, and software updates regularly.',3,0,1,'2026-08-12 14:26:34'),
(3,'Charging Tips','charging-tips','charging','Charge during cooler hours and avoid overcharging.','Charge during cooler hours and avoid overcharging.',2,0,1,'2026-08-12 14:26:34'),
(4,'Rider Safety Essentials','rider-safety-essentials','tips','Wear helmets, keep emergency contacts handy, and plan your route.','Wear helmets, keep emergency contacts handy, and plan your route.',3,0,1,'2026-08-12 14:26:34'),
(5,'EV FAQ','ev-faq','faq','Frequent doubts around range, charging, and rentals answered.','Frequent doubts around range, charging, and rentals answered.',2,1,1,'2026-08-12 14:26:34'),
(6,'City Guide: Bangalore','city-guide-bangalore','city','Best routes and charging spots in Bangalore for EV riders.','Best routes and charging spots in Bangalore for EV riders.',5,1,1,'2026-08-12 14:26:34'),
(7,'How to Safely Ride an Electric Scooter','how-to-safely-ride-electric-scooter','safety','Essential safety tips for riding electric scooters in traffic.','Always wear a helmet. Check the battery before starting. Follow geo-fence boundaries.',3,1,1,'2026-07-25 13:37:22'),
(8,'Understanding Battery Swap vs Charging','battery-swap-vs-charging','charging','Learn the difference between battery swap and standard charging.','Battery swap stations let you exchange your depleted battery for a fully charged one in under 2 minutes.',4,1,1,'2026-07-25 13:37:22'),
(9,'EV Scooter Maintenance Checklist','ev-scooter-maintenance-checklist','maintenance','Monthly maintenance checklist to keep your scooter in top shape.','1. Check tyre pressure weekly. 2. Inspect brake pads monthly.',5,0,1,'2026-07-25 13:37:22'),
(10,'Earning Tips for Delivery Riders','earning-tips-delivery-riders','tips','Maximize your weekly earnings with these proven strategies.','1. Stay online during peak hours (12-2 PM, 7-10 PM).',6,1,1,'2026-07-25 13:37:22'),
(11,'Frequently Asked Questions','faq','faq','Answers to the most common questions about Pravazo.','Q: How to apply as rider? A: Go to Select Role > Vehicle with Job.',4,0,1,'2026-07-25 13:37:22');

-- ============================================================
-- TABLE: jobs + job_assignments
-- ============================================================
DROP TABLE IF EXISTS `jobs`;
CREATE TABLE `jobs` (
  `job_id`           bigint NOT NULL AUTO_INCREMENT,
  `job_title`        varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_name`      varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pickup_address`   varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dropoff_address`  varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `distance_km`      decimal(8,2) DEFAULT NULL,
  `status`           enum('PENDING','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED')
                       COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `assigned_rider_id`int DEFAULT NULL,
  `assigned_vehicle_id` int DEFAULT NULL,
  `created_at`       timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`job_id`),
  KEY `idx_jobs_status`    (`status`),
  KEY `idx_jobs_rider_id`  (`assigned_rider_id`),
  CONSTRAINT `fk_jobs_rider`   FOREIGN KEY (`assigned_rider_id`)   REFERENCES `riders`   (`rider_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_jobs_vehicle` FOREIGN KEY (`assigned_vehicle_id`) REFERENCES `vehicles` (`vehicle_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `jobs` (`job_id`,`job_title`,`client_name`,`pickup_address`,`dropoff_address`,`distance_km`,`status`,`assigned_rider_id`,`assigned_vehicle_id`) VALUES
(1,'Swiggy Delivery 1','Swiggy','Swiggy Store, Koramangala','HSR Layout, Bangalore',4.50,'AVAILABLE',NULL,NULL),
(2,'Zomato Delivery 1','Zomato','Zomato Kitchen, Indiranagar','Whitefield, Bangalore',12.30,'AVAILABLE',NULL,NULL),
(3,'Blinkit Delivery 1','Blinkit','Blinkit Hub, Gomti Nagar','Aliganj, Lucknow',5.80,'AVAILABLE',NULL,NULL),
(4,'Porter Move 1','Porter','Office Complex, Hazratganj','Railway Station, Lucknow',3.20,'AVAILABLE',NULL,NULL),
(5,'Zepto Delivery 1','Zepto','Zepto Store, Connaught Place','Lajpat Nagar Colony, Delhi',38.00,'AVAILABLE',NULL,NULL),
(6,'Zomato Delivery 2','Zomato','Burger King, CP, Delhi','Rohini Sector 9, Delhi',62.00,'AVAILABLE',NULL,NULL);

DROP TABLE IF EXISTS `job_assignments`;
CREATE TABLE `job_assignments` (
  `assignment_id` int NOT NULL AUTO_INCREMENT,
  `job_id`        bigint NOT NULL,
  `job_title`     varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `assigned_to`   int DEFAULT NULL,
  `branch_id`     int DEFAULT NULL,
  `vehicle_id`    int DEFAULT NULL,
  `status`        enum('PENDING','IN_PROGRESS','COMPLETED','CANCELLED')
                    COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `priority`      enum('LOW','NORMAL','HIGH','URGENT')
                    COLLATE utf8mb4_unicode_ci DEFAULT 'NORMAL',
  `notes`         text COLLATE utf8mb4_unicode_ci,
  `created_at`    timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`assignment_id`),
  KEY `fk_ja_job_id`     (`job_id`),
  KEY `fk_ja_assigned_to`(`assigned_to`),
  CONSTRAINT `fk_ja_job_id`     FOREIGN KEY (`job_id`)      REFERENCES `jobs`  (`job_id`)   ON DELETE CASCADE,
  CONSTRAINT `fk_ja_assigned_to`FOREIGN KEY (`assigned_to`) REFERENCES `users` (`user_id`)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: incentives_rewards
-- ============================================================
DROP TABLE IF EXISTS `incentives_rewards`;
CREATE TABLE `incentives_rewards` (
  `reward_id`     int NOT NULL AUTO_INCREMENT,
  `title`         varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type`          enum('INCENTIVE','REWARD','BONUS') COLLATE utf8mb4_unicode_ci DEFAULT 'INCENTIVE',
  `target_trips`  int DEFAULT '0',
  `bonus_amount`  decimal(10,2) DEFAULT '0.00',
  `start_date`    date DEFAULT NULL,
  `end_date`      date DEFAULT NULL,
  `status`        enum('ACTIVE','INACTIVE','EXPIRED') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE',
  `created_at`    timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`reward_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: commission_rules + commission_transactions
-- ============================================================
DROP TABLE IF EXISTS `commission_rules`;
CREATE TABLE `commission_rules` (
  `rule_id`               int NOT NULL AUTO_INCREMENT,
  `rule_name`             varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicle_type`          varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city`                  varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `commission_percentage` decimal(5,2) DEFAULT '10.00',
  `min_commission`        decimal(10,2) DEFAULT '0.00',
  `max_commission`        decimal(10,2) DEFAULT NULL,
  `is_active`             tinyint(1) DEFAULT '1',
  `priority`              int DEFAULT '0',
  `created_at`            timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`rule_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `commission_rules` (`rule_id`,`rule_name`,`vehicle_type`,`city`,`commission_percentage`,`min_commission`,`max_commission`,`is_active`,`priority`) VALUES
(1,'E-Scooter Default','E_SCOOTER',NULL,10.00,0.00,500.00,1,1),
(2,'E-Bike Default','E_BIKE',NULL,12.00,0.00,700.00,1,2),
(3,'Bangalore Special',NULL,'Bangalore',8.00,0.00,400.00,1,3),
(4,'Delhi Standard',NULL,'Delhi',11.00,0.00,600.00,1,4);

DROP TABLE IF EXISTS `commission_transactions`;
CREATE TABLE `commission_transactions` (
  `tx_id`      bigint NOT NULL AUTO_INCREMENT,
  `trip_id`    bigint DEFAULT NULL,
  `rider_id`   int DEFAULT NULL,
  `amount`     decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`tx_id`),
  KEY `fk_ct_rider_id` (`rider_id`),
  CONSTRAINT `fk_ct_rider_id` FOREIGN KEY (`rider_id`) REFERENCES `riders` (`rider_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: rider_earnings
-- ============================================================
DROP TABLE IF EXISTS `rider_earnings`;
CREATE TABLE `rider_earnings` (
  `earning_id`        int NOT NULL AUTO_INCREMENT,
  `rider_id`          int DEFAULT NULL,
  `user_id`           int DEFAULT NULL,
  `booking_id`        bigint DEFAULT NULL,
  `job_id`            bigint DEFAULT NULL,
  `gross_amount`      decimal(10,2) NOT NULL DEFAULT '0.00',
  `commission_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `net_amount`        decimal(10,2) NOT NULL DEFAULT '0.00',
  `status`            enum('pending','credited','cancelled')
                        COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `notes`             text COLLATE utf8mb4_unicode_ci,
  `created_at`        timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`earning_id`),
  KEY `idx_re_rider_id`   (`rider_id`),
  KEY `idx_re_user_id`    (`user_id`),
  KEY `idx_re_booking_id` (`booking_id`),
  KEY `idx_re_job_id`     (`job_id`),
  CONSTRAINT `fk_re_rider` FOREIGN KEY (`rider_id`) REFERENCES `riders` (`rider_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_re_user`  FOREIGN KEY (`user_id`)  REFERENCES `users`  (`user_id`)  ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `rider_earnings` VALUES (1,NULL,1,5,10,500.00,50.00,450.00,'pending','Delivery completed earning',NOW(),NOW());

-- ============================================================
-- TABLE: invoices
-- ============================================================
DROP TABLE IF EXISTS `invoices`;
CREATE TABLE `invoices` (
  `invoice_id`     int NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `booking_id`     bigint DEFAULT NULL,
  `user_id`        int DEFAULT NULL,
  `branch_id`      int DEFAULT NULL,
  `subtotal`       decimal(10,2) DEFAULT '0.00',
  `tax_amount`     decimal(10,2) DEFAULT '0.00',
  `total_amount`   decimal(10,2) DEFAULT '0.00',
  `status`         enum('PAID','UNPAID','OVERDUE','CANCELLED')
                     COLLATE utf8mb4_unicode_ci DEFAULT 'UNPAID',
  `pdf_url`        text COLLATE utf8mb4_unicode_ci,
  `created_at`     timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`invoice_id`),
  UNIQUE KEY `uq_inv_number`    (`invoice_number`),
  KEY `fk_inv_booking_id` (`booking_id`),
  KEY `fk_inv_user_id`    (`user_id`),
  CONSTRAINT `fk_inv_booking_id` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_inv_user_id`    FOREIGN KEY (`user_id`)    REFERENCES `users`    (`user_id`)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: ledger_accounts + ledger_entries
-- ============================================================
DROP TABLE IF EXISTS `ledger_accounts`;
CREATE TABLE `ledger_accounts` (
  `account_id`   int NOT NULL AUTO_INCREMENT,
  `account_code` varchar(20)  COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_type` enum('ASSET','LIABILITY','REVENUE','EXPENSE','EQUITY')
                   COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at`   timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`account_id`),
  UNIQUE KEY `uq_la_code` (`account_code`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `ledger_accounts` VALUES
(1,'1001','Cash and Bank','ASSET',NOW()),(2,'1002','Accounts Receivable','ASSET',NOW()),
(3,'2001','Accounts Payable','LIABILITY',NOW()),(4,'2002','Rider Payable','LIABILITY',NOW()),
(5,'3001','Booking Revenue','REVENUE',NOW()),(6,'3002','Rental Revenue','REVENUE',NOW()),
(7,'3003','Commission Revenue','REVENUE',NOW()),(8,'4001','Rider Payout Expense','EXPENSE',NOW()),
(9,'4002','Platform Operating','EXPENSE',NOW());

DROP TABLE IF EXISTS `ledger_entries`;
CREATE TABLE `ledger_entries` (
  `entry_id`       bigint NOT NULL AUTO_INCREMENT,
  `account_id`     int NOT NULL,
  `entry_type`     enum('DEBIT','CREDIT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount`         decimal(12,2) NOT NULL,
  `reference_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id`   varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description`    text COLLATE utf8mb4_unicode_ci,
  `created_at`     timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`entry_id`),
  KEY `idx_le_account_id` (`account_id`),
  CONSTRAINT `fk_le_account_id` FOREIGN KEY (`account_id`) REFERENCES `ledger_accounts` (`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: reconciliation_reports
-- ============================================================
DROP TABLE IF EXISTS `reconciliation_reports`;
CREATE TABLE `reconciliation_reports` (
  `report_id`              bigint NOT NULL AUTO_INCREMENT,
  `reconciliation_date`    date NOT NULL,
  `total_gateway_amount`   decimal(12,2) DEFAULT '0.00',
  `total_ledger_amount`    decimal(12,2) DEFAULT '0.00',
  `discrepancy_count`      int DEFAULT '0',
  `status`                 enum('MATCHED','DISCREPANCY','PENDING')
                             COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `details`                json DEFAULT NULL,
  `created_at`             timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`report_id`),
  UNIQUE KEY `uq_rr_date` (`reconciliation_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: settlements + settlement_batches
-- ============================================================
DROP TABLE IF EXISTS `settlements`;
CREATE TABLE `settlements` (
  `settlement_id`     bigint NOT NULL AUTO_INCREMENT,
  `batch_id`          bigint DEFAULT NULL,
  `rider_id`          int DEFAULT NULL,
  `recipient_type`    varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipient_id`      int DEFAULT NULL,
  `amount`            decimal(10,2) NOT NULL,
  `settlement_amount` decimal(10,2) DEFAULT NULL,
  `status`            enum('PENDING','PROCESSING','PAID','COMPLETED','FAILED')
                        COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `created_at`        timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`settlement_id`),
  KEY `idx_sett_rider_id` (`rider_id`),
  CONSTRAINT `fk_sett_rider_id` FOREIGN KEY (`rider_id`) REFERENCES `riders` (`rider_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `settlement_batches`;
CREATE TABLE `settlement_batches` (
  `batch_id`           bigint NOT NULL AUTO_INCREMENT,
  `settlement_period`  varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_settlements`  int DEFAULT '0',
  `total_amount`       decimal(12,2) DEFAULT '0.00',
  `status`             enum('PENDING','PROCESSING','COMPLETED','FAILED')
                         COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `created_at`         timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`batch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: tax_configurations + tax_transactions
-- ============================================================
DROP TABLE IF EXISTS `tax_configurations`;
CREATE TABLE `tax_configurations` (
  `tax_id`           int NOT NULL AUTO_INCREMENT,
  `tax_name`         varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rate_percentage`  decimal(5,2) NOT NULL,
  `hsn_sac_code`     varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '996601',
  `state_code`       varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'ALL',
  `is_active`        tinyint(1) DEFAULT '1',
  `created_at`       timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`tax_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tax_configurations` VALUES (1,'GST 18%',18.00,'996601','ALL',1,NOW(),NOW()),(2,'GST 5%',5.00,'996601','ALL',1,NOW(),NOW());

DROP TABLE IF EXISTS `tax_transactions`;
CREATE TABLE `tax_transactions` (
  `tax_id`       bigint NOT NULL AUTO_INCREMENT,
  `reference_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cgst`         decimal(10,2) DEFAULT '0.00',
  `sgst`         decimal(10,2) DEFAULT '0.00',
  `igst`         decimal(10,2) DEFAULT '0.00',
  `total_tax`    decimal(10,2) DEFAULT '0.00',
  `created_at`   timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`tax_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: pricing_rules + surge_pricing
-- ============================================================
DROP TABLE IF EXISTS `pricing_rules`;
CREATE TABLE `pricing_rules` (
  `rule_id`        int NOT NULL AUTO_INCREMENT,
  `rule_name`      varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicle_type`   varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city`           varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `base_fare`      decimal(10,2) DEFAULT '0.00',
  `per_km_rate`    decimal(10,2) DEFAULT '0.00',
  `per_minute_rate`decimal(10,2) DEFAULT '0.00',
  `min_fare`       decimal(10,2) DEFAULT '0.00',
  `is_active`      tinyint(1) DEFAULT '1',
  `created_at`     timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`rule_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `surge_pricing`;
CREATE TABLE `surge_pricing` (
  `surge_id`         int NOT NULL AUTO_INCREMENT,
  `city`             varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zone`             varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `surge_multiplier` decimal(4,2) DEFAULT '1.00',
  `start_time`       time DEFAULT NULL,
  `end_time`         time DEFAULT NULL,
  `is_active`        tinyint(1) DEFAULT '1',
  `created_at`       timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`surge_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: branch_settings
-- ============================================================
DROP TABLE IF EXISTS `branch_settings`;
CREATE TABLE `branch_settings` (
  `setting_id`                int NOT NULL AUTO_INCREMENT,
  `branch_id`                 int NOT NULL,
  `timezone`                  varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Asia/Kolkata',
  `currency`                  varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'INR',
  `language`                  varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'en',
  `max_riders`                int DEFAULT '50',
  `max_vehicles`              int DEFAULT '100',
  `max_daily_bookings`        int DEFAULT '500',
  `booking_radius_km`         decimal(6,2) DEFAULT '10.00',
  `min_booking_amount`        decimal(10,2) DEFAULT '0.00',
  `commission_percentage`     decimal(5,2) DEFAULT '10.00',
  `auto_assign_riders`        tinyint(1) DEFAULT '1',
  `auto_accept_bookings`      tinyint(1) DEFAULT '0',
  `enable_email_notifications`tinyint(1) DEFAULT '1',
  `enable_sms_notifications`  tinyint(1) DEFAULT '1',
  `enable_push_notifications` tinyint(1) DEFAULT '1',
  `accept_cash`               tinyint(1) DEFAULT '1',
  `accept_online`             tinyint(1) DEFAULT '1',
  `accept_wallet`             tinyint(1) DEFAULT '1',
  `created_by`                int DEFAULT NULL,
  `updated_by`                int DEFAULT NULL,
  `deleted_at`                timestamp NULL DEFAULT NULL,
  `created_at`                timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`                timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `uq_bs_branch` (`branch_id`),
  CONSTRAINT `fk_bset_branch_id` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `branch_settings` (`setting_id`,`branch_id`,`created_by`,`updated_by`) VALUES (1,1,101,101),(2,2,101,101),(3,3,101,101),(4,4,101,101);

-- ============================================================
-- TABLE: support_tickets
-- ============================================================
DROP TABLE IF EXISTS `support_tickets`;
CREATE TABLE `support_tickets` (
  `ticket_id`         int NOT NULL AUTO_INCREMENT,
  `ticket_code`       varchar(50)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id`           int DEFAULT NULL,
  `category`          varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'GENERAL',
  `priority`          enum('LOW','MEDIUM','HIGH','CRITICAL')
                        COLLATE utf8mb4_unicode_ci DEFAULT 'MEDIUM',
  `status`            enum('OPEN','IN_PROGRESS','RESOLVED','CLOSED')
                        COLLATE utf8mb4_unicode_ci DEFAULT 'OPEN',
  `subject`           varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description`       text COLLATE utf8mb4_unicode_ci,
  `resolution_notes`  text COLLATE utf8mb4_unicode_ci,
  `assigned_admin_id` int DEFAULT NULL COMMENT 'user_id of assigned admin',
  `created_at`        timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ticket_id`),
  UNIQUE KEY `uq_st_code`    (`ticket_code`),
  KEY `idx_st_user_id`       (`user_id`),
  KEY `fk_st_admin`          (`assigned_admin_id`),
  CONSTRAINT `fk_st_user_id`  FOREIGN KEY (`user_id`)           REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_st_admin_id` FOREIGN KEY (`assigned_admin_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `support_tickets` (`ticket_id`,`ticket_code`,`user_id`,`category`,`priority`,`status`,`subject`,`description`) VALUES
(1,'TKT-001',1,'PAYMENT','HIGH','OPEN','Payment not received','I completed a delivery but wallet was not credited.'),
(2,'TKT-002',2,'VEHICLE','CRITICAL','OPEN','Vehicle breakdown','Vehicle broke down mid-delivery. Need assistance.'),
(3,'TKT-003',3,'TECHNICAL','MEDIUM','OPEN','App login issue','Unable to login with my registered phone number.');

-- ============================================================
-- TABLE: sos_alerts
-- ============================================================
DROP TABLE IF EXISTS `sos_alerts`;
CREATE TABLE `sos_alerts` (
  `sos_id`          int NOT NULL AUTO_INCREMENT,
  `user_id`         int NOT NULL,
  `booking_id`      bigint DEFAULT NULL,
  `vehicle_id`      int DEFAULT NULL,
  `alert_type`      enum('geo_fence_breach','accident','theft','medical','other')
                      COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'other',
  `message`         text COLLATE utf8mb4_unicode_ci,
  `latitude`        decimal(10,7) DEFAULT NULL,
  `longitude`       decimal(10,7) DEFAULT NULL,
  `status`          enum('active','resolved','false_alarm')
                      COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `resolution_note` text COLLATE utf8mb4_unicode_ci,
  `resolved_at`     datetime DEFAULT NULL,
  `created_at`      datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`sos_id`),
  KEY `fk_sos_booking` (`booking_id`),
  KEY `fk_sos_vehicle` (`vehicle_id`),
  KEY `idx_sos_user`   (`user_id`),
  KEY `idx_sos_status` (`status`),
  CONSTRAINT `fk_sos_user`    FOREIGN KEY (`user_id`)    REFERENCES `users`    (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sos_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sos_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: breakdown_reports
-- ============================================================
DROP TABLE IF EXISTS `breakdown_reports`;
CREATE TABLE `breakdown_reports` (
  `report_id`       int NOT NULL AUTO_INCREMENT,
  `user_id`         int NOT NULL,
  `booking_id`      bigint DEFAULT NULL,
  `vehicle_id`      int DEFAULT NULL,
  `issue_type`      enum('flat_tyre','battery_dead','motor_fault','accident','other')
                      COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'other',
  `description`     text COLLATE utf8mb4_unicode_ci NOT NULL,
  `photo_url`       varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude`        decimal(10,7) DEFAULT NULL,
  `longitude`       decimal(10,7) DEFAULT NULL,
  `status`          enum('open','in_progress','resolved','closed')
                      COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `resolution_note` text COLLATE utf8mb4_unicode_ci,
  `resolved_at`     datetime DEFAULT NULL,
  `created_at`      datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`report_id`),
  KEY `fk_br_booking` (`booking_id`),
  KEY `fk_br_vehicle` (`vehicle_id`),
  KEY `idx_br_user`   (`user_id`),
  KEY `idx_br_status` (`status`),
  CONSTRAINT `fk_br_user`    FOREIGN KEY (`user_id`)    REFERENCES `users`    (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_br_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_br_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- LANDING CMS TABLES
-- ============================================================
DROP TABLE IF EXISTS `landing_hero`;
CREATE TABLE `landing_hero` (
  `hero_id`         int NOT NULL AUTO_INCREMENT,
  `hero_title`      varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hero_subtitle`   varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hero_description`text COLLATE utf8mb4_unicode_ci,
  `button_text`     varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `button_url`      varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hero_image`      text COLLATE utf8mb4_unicode_ci,
  `is_active`       tinyint(1) DEFAULT '1',
  `updated_by`      int DEFAULT NULL,
  `created_at`      timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`hero_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `landing_hero` VALUES (1,'Ride Smart, Earn More','India\'s Leading EV Rental & Delivery Platform','Join thousands of riders earning with Pravzo EV fleet.','Get Started','/register',NULL,1,101,NOW(),NOW());

DROP TABLE IF EXISTS `landing_partners`;
CREATE TABLE `landing_partners` (
  `partner_id`      int NOT NULL AUTO_INCREMENT,
  `partner_name`    varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `partner_logo`    text COLLATE utf8mb4_unicode_ci,
  `partner_website` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order`   int DEFAULT '0',
  `is_active`       tinyint(1) DEFAULT '1',
  `created_by`      int DEFAULT NULL,
  `deleted_at`      timestamp NULL DEFAULT NULL,
  `created_at`      timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`partner_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `landing_partners` (`partner_id`,`partner_name`,`partner_logo`,`display_order`,`is_active`,`created_by`) VALUES
(1,'Swiggy','swiggy.png',1,1,101),(2,'Zomato','zomato.png',2,1,101),(3,'Blinkit','blinkit.png',3,1,101),(4,'Zepto','zepto.png',4,1,101);

DROP TABLE IF EXISTS `landing_statistics`;
CREATE TABLE `landing_statistics` (
  `stat_id`          int NOT NULL AUTO_INCREMENT,
  `total_users`      int DEFAULT '0',
  `total_riders`     int DEFAULT '0',
  `total_bookings`   int DEFAULT '0',
  `total_cities`     int DEFAULT '0',
  `total_downloads`  int DEFAULT '0',
  `last_updated_by`  int DEFAULT NULL,
  `created_at`       timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`stat_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `landing_statistics` VALUES (1,5000,1200,25000,12,8000,101,NOW(),NOW());

DROP TABLE IF EXISTS `landing_contact`;
CREATE TABLE `landing_contact` (
  `contact_id`     int NOT NULL AUTO_INCREMENT,
  `support_email`  varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `support_phone`  varchar(20)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `office_address` text COLLATE utf8mb4_unicode_ci,
  `google_map_url` text COLLATE utf8mb4_unicode_ci,
  `facebook_url`   text COLLATE utf8mb4_unicode_ci,
  `instagram_url`  text COLLATE utf8mb4_unicode_ci,
  `linkedin_url`   text COLLATE utf8mb4_unicode_ci,
  `twitter_url`    text COLLATE utf8mb4_unicode_ci,
  `youtube_url`    text COLLATE utf8mb4_unicode_ci,
  `is_active`      tinyint(1) DEFAULT '1',
  `updated_by`     int DEFAULT NULL,
  `created_at`     timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`contact_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `landing_contact` (`contact_id`,`support_email`,`support_phone`,`office_address`,`is_active`,`updated_by`) VALUES
(1,'support@pravzo.com','+91-9999999999','MG Road, Bangalore - 560001, Karnataka',1,101);

DROP TABLE IF EXISTS `landing_footer`;
CREATE TABLE `landing_footer` (
  `footer_id`       int NOT NULL AUTO_INCREMENT,
  `copyright_text`  text COLLATE utf8mb4_unicode_ci,
  `about_text`      text COLLATE utf8mb4_unicode_ci,
  `quick_links`     json DEFAULT NULL,
  `footer_email`    varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `footer_phone`    varchar(20)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `footer_address`  text COLLATE utf8mb4_unicode_ci,
  `is_active`       tinyint(1) DEFAULT '1',
  `updated_by`      int DEFAULT NULL,
  `created_at`      timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`footer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `landing_footer` VALUES (1,'© 2026 Pravzo Technologies Pvt. Ltd.','Pravzo is India\'s leading EV rental and delivery platform.',NULL,'info@pravzo.com','+91-9999999999',NULL,1,101,NOW(),NOW());

-- ============================================================
-- TABLE: contact_enquiries
-- ============================================================
DROP TABLE IF EXISTS `contact_enquiries`;
CREATE TABLE `contact_enquiries` (
  `enquiry_id`  int NOT NULL AUTO_INCREMENT,
  `name`        varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email`       varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone`       varchar(20)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject`     varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message`     text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status`      enum('PENDING','IN_PROGRESS','RESOLVED','CLOSED')
                  COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `priority`    enum('LOW','MEDIUM','HIGH','URGENT')
                  COLLATE utf8mb4_unicode_ci DEFAULT 'MEDIUM',
  `admin_notes` text COLLATE utf8mb4_unicode_ci,
  `assigned_to` int DEFAULT NULL COMMENT 'user_id of assigned admin',
  `ip_address`  varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent`  text COLLATE utf8mb4_unicode_ci,
  `resolved_at` datetime DEFAULT NULL,
  `created_at`  timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`enquiry_id`),
  KEY `fk_ce_admin` (`assigned_to`),
  CONSTRAINT `fk_ce_admin` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `contact_enquiries` (`enquiry_id`,`name`,`email`,`phone`,`subject`,`message`,`status`,`priority`,`ip_address`) VALUES
(1,'John Doe','john.doe@example.com','+91-9876543210','Partnership Enquiry','I would like to discuss a potential partnership opportunity with Pravzo.','PENDING','MEDIUM','127.0.0.1');

-- ============================================================
-- TABLE: schema_migrations
-- ============================================================
DROP TABLE IF EXISTS `schema_migrations`;
CREATE TABLE `schema_migrations` (
  `id`             int UNSIGNED NOT NULL AUTO_INCREMENT,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum`       varchar(64)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `applied_at`     datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_migration_name` (`migration_name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `schema_migrations` (`migration_name`,`applied_at`) VALUES
('001_canonical_base_schema.sql',NOW()),
('002_generic_auth_refactor_v3.sql',NOW()),
('003_final_architecture_cleanup_v4.sql',NOW());

-- ============================================================
-- RE-ENABLE FOREIGN KEY CHECKS
-- ============================================================
SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

-- ============================================================
-- VIEWS FOR BACKWARD COMPATIBILITY
-- ============================================================

-- admins view: simulates old admins table for existing APIs
CREATE OR REPLACE VIEW `admins` AS
  SELECT
    u.user_id  AS admin_id,
    u.full_name,
    u.email,
    u.hashed_password,
    u.phone    AS phone_number,
    r.role_name AS role,
    p.department,
    u.status,
    u.profile_image AS profile_photo,
    u.last_login_at,
    u.failed_login_attempts,
    u.force_password_change,
    u.password_changed_at,
    u.account_locked_until,
    u.deleted_at,
    u.created_at,
    u.updated_at
  FROM users u
  JOIN roles r ON u.role_id = r.role_id
  LEFT JOIN user_profiles p ON p.user_id = u.user_id
  WHERE u.role_id IN (1,2,3,8,9);

-- audit_logs view: maps activity_logs to old audit_logs structure
CREATE OR REPLACE VIEW `audit_logs` AS
  SELECT
    log_id    AS audit_id,
    user_id   AS admin_id,
    NULL      AS user_id,
    action,
    module,
    metadata  AS details,
    ip_address,
    user_agent,
    created_at
  FROM activity_logs;

-- admin_permissions view: maps role_permissions to old flat-boolean API shape
-- Applications still querying old admin_permissions shape will work.
CREATE OR REPLACE VIEW `admin_permissions_view` AS
  SELECT
    u.user_id,
    MAX(CASE WHEN p.permission_name = 'dashboard.view'        THEN 1 ELSE 0 END) AS dashboard,
    MAX(CASE WHEN p.permission_name = 'users.manage'          THEN 1 ELSE 0 END) AS users,
    MAX(CASE WHEN p.permission_name = 'riders.manage'         THEN 1 ELSE 0 END) AS riders,
    MAX(CASE WHEN p.permission_name = 'vehicles.manage'       THEN 1 ELSE 0 END) AS vehicles,
    MAX(CASE WHEN p.permission_name = 'bookings.manage'       THEN 1 ELSE 0 END) AS bookings,
    MAX(CASE WHEN p.permission_name = 'rentals.manage'        THEN 1 ELSE 0 END) AS rentals,
    MAX(CASE WHEN p.permission_name = 'jobs.manage'           THEN 1 ELSE 0 END) AS jobs,
    MAX(CASE WHEN p.permission_name = 'reports.view'          THEN 1 ELSE 0 END) AS reports,
    MAX(CASE WHEN p.permission_name = 'payments.manage'       THEN 1 ELSE 0 END) AS payments,
    MAX(CASE WHEN p.permission_name = 'notifications.manage'  THEN 1 ELSE 0 END) AS notifications,
    MAX(CASE WHEN p.permission_name = 'settings.manage'       THEN 1 ELSE 0 END) AS settings,
    MAX(CASE WHEN p.permission_name = 'landing_cms.manage'    THEN 1 ELSE 0 END) AS landing_cms,
    MAX(CASE WHEN p.permission_name = 'branches.manage'       THEN 1 ELSE 0 END) AS branches,
    MAX(CASE WHEN p.permission_name = 'admin_management.manage' THEN 1 ELSE 0 END) AS admin_management
  FROM users u
  JOIN role_permissions rp ON rp.role_id = u.role_id
  JOIN permissions p ON p.permission_id = rp.permission_id
  WHERE u.role_id IN (1,2,3,6,8,9)
  GROUP BY u.user_id;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
-- ============================================================
-- END OF final_database_v4.sql
-- ============================================================
