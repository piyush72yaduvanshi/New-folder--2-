# API MASTER INVENTORY
## Pravzo Backend — Canonical API Reference

**Generated:** 2026-08-13
**Method:** Independent source code scan (Method 1: grep + Method 2: app.js structure analysis)
**Source API Count:** 446 (443 in route files + 3 inline in app.js)
**Postman Count:** 508 (collection header states 502 — actual parsed count is 508)

---

## HOW TO READ THIS DOCUMENT

- **API ID** — Stable identifier. Never renumbered.
- **Auth** — `PUBLIC` = no token required. `ADMIN` = adminAuth middleware. `USER` = userAuth middleware.
- **Permission** — Role or permission string checked inside the handler.
- **Criticality** — CRITICAL / HIGH / MEDIUM / LOW
- **Status** — MATCHED / CODE_ONLY / POSTMAN_ONLY / METHOD_MISMATCH / DUPLICATE / DEPRECATED

Full request/response contracts are in: `docs/api/contracts/<module>.md`

---

## MODULE INDEX

| Module | Prefix | API IDs | Count |
|---|---|---|---|
| Health | `/health` | API-0001–API-0003 | 3 |
| File Upload | `/api/upload` | API-0004 | 1 |
| Root Info | `/` `/api` | API-0005–API-0006 | 2 |
| Admin Auth | `/api/admin` | API-0007–API-0010 | 4 |
| Admin Dashboard | `/api/admin/dashboard` | API-0011–API-0020 | 10 |
| Admin Users | `/api/admin/users` `/api/super-admin/users` | API-0021–API-0050 | 30 |
| Admin KYC | `/api/admin/kyc` | API-0051–API-0063 | 13 |
| Admin Riders | `/api/admin/riders` | API-0064–API-0094 | 31 |
| Admin Bookings | `/api/admin/bookings` | API-0095–API-0123 | 29 |
| Admin Vehicles | `/api/admin/vehicles` `/api/super-admin/vehicles` | API-0124–API-0151 | 28 |
| Admin Fleet | `/api/admin/fleet` `/api/super-admin/fleet` | API-0152–API-0157 | 6 |
| Admin Payments | `/api/admin/payments` | API-0158–API-0183 | 26 |
| Admin Reports | `/api/admin/reports` | API-0184–API-0200 | 17 |
| Admin Management | `/api/admin/admin-management` | API-0201–API-0220 | 20 |
| Admin Notifications | `/api/admin/notifications` | API-0221–API-0234 | 14 |
| Landing CMS (Admin) | `/api/admin/landing` | API-0235–API-0253 | 19 |
| Landing CMS (Public) | `/api/public/landing` | API-0254–API-0259 | 6 |
| Branch Management | `/api/super-admin/branches` | API-0260–API-0269 | 10 |
| Rental Management | `/api/admin/rentals` `/api/super-admin/rentals` | API-0270–API-0284 | 15 |
| Finance — Wallets | `/api/super-admin/wallets` | API-0285–API-0290 | 6 |
| Finance — Payments | `/api/super-admin/finance/payments` | API-0291–API-0296 | 6 |
| Finance — Settlements | `/api/super-admin/settlements` | API-0297–API-0301 | 5 |
| Finance — Ledger | `/api/super-admin/ledger` | API-0302–API-0305 | 4 |
| Finance — Reports | `/api/super-admin/finance` | API-0306–API-0311 | 6 |
| Communication — Notifications | `/api/super-admin/notifications` | API-0312–API-0317 | 6 |
| Communication — Templates | `/api/super-admin/templates` | API-0318–API-0321 | 4 |
| Communication — Campaigns | `/api/super-admin/campaigns` | API-0322–API-0325 | 4 |
| Communication — Preferences | `/api/preferences` | API-0326–API-0327 | 2 |
| Communication — Webhooks | `/api/comm-webhooks` | API-0328–API-0329 | 2 |
| BI — Dashboard | `/api/super-admin/dashboard` | API-0330–API-0334 | 5 |
| BI — Analytics | `/api/super-admin/analytics` | API-0335–API-0343 | 9 |
| BI — Reports | `/api/super-admin/reports` | API-0344–API-0349 | 6 |
| BI — Export | `/api/super-admin/export` | API-0350–API-0352 | 3 |
| Super Admin Extensions | `/api/super-admin` | API-0353–API-0374 | 22 |
| User Auth | `/api/auth` | API-0375–API-0383 | 9 |
| User Profile | `/api/users` | API-0384–API-0392 | 9 |
| Role Management | `/api/users` | API-0393 | 1 |
| Rider Application | `/api/riders` | API-0394–API-0397 | 4 |
| Vehicles (Public) | `/api/vehicles` | API-0398–API-0399 | 2 |
| User Bookings | `/api/bookings` | API-0400–API-0405 | 6 |
| Invoice | `/api/bookings` | API-0406 | 1 |
| Jobs | `/api/jobs` | API-0407–API-0410 | 4 |
| Notifications (User) | `/api/notifications` | API-0411–API-0414 | 4 |
| Location | `/api/location` | API-0415–API-0416 | 2 |
| Payments (User) | `/api/payments` | API-0417–API-0420 | 4 |
| Wallet | `/api/wallet` | API-0421–API-0426 | 6 |
| History | `/api/history` | API-0427 | 1 |
| Payouts | `/api/payouts` | API-0428 | 1 |
| Coupons | `/api/coupons` | API-0429–API-0433 | 5 |
| Support | `/api` | API-0434–API-0438 | 5 |
| Resources | `/api` | API-0439–API-0445 | 7 |
| Performance | `/api/performance` | API-0446 | 1 |
| Webhooks (RazorpayX) | `/api/webhooks` | API-0447 | 1 |

**TOTAL SOURCE APIs: 447**
*(Note: grep count 443 + 3 inline app.js routes + 1 duplicate found in paymentRoutes = corrected total 446 unique routes. API-0447 = webhookRoutes mounted at /api/webhooks in app.js. See reconciliation for detail.)*


---

## SECTION 1 — INFRASTRUCTURE & HEALTH

| API ID | Method | Endpoint | Module | Actor | Auth | Permission | Controller | Service | Criticality | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| API-0001 | GET | /health | Health | DevOps | PUBLIC | None | healthRoutes inline | — | LOW | MATCHED |
| API-0002 | GET | /health/ready | Health | DevOps | PUBLIC | None | healthRoutes inline | db+redis | MEDIUM | MATCHED |
| API-0003 | GET | /health/metrics | Health | SuperAdmin | ADMIN | SUPER_ADMIN | healthRoutes inline | — | LOW | CODE_ONLY |
| API-0004 | POST | /api/upload | FileUpload | Any | FLEX | USER or ADMIN | app.js inline | minio.uploadFile | MEDIUM | MATCHED |
| API-0005 | GET | / | Info | Public | PUBLIC | None | app.js inline | — | LOW | MATCHED |
| API-0006 | GET | /api | Info | Public | PUBLIC | None | app.js inline | — | LOW | MATCHED |

---

## SECTION 2 — ADMIN AUTHENTICATION

| API ID | Method | Endpoint | Module | Actor | Auth | Permission | Controller | Criticality | Status |
|---|---|---|---|---|---|---|---|---|---|
| API-0007 | POST | /api/admin/login | AdminAuth | Admin | PUBLIC (rate-limited) | None | AuthController.login | CRITICAL | MATCHED |
| API-0008 | POST | /api/admin/refresh-token | AdminAuth | Admin | PUBLIC | None | AuthController.refreshToken | HIGH | MATCHED |
| API-0009 | POST | /api/admin/logout | AdminAuth | Admin | ADMIN | Any admin | AuthController.logout | MEDIUM | MATCHED |
| API-0010 | GET | /api/admin/profile | AdminAuth | Admin | ADMIN | Any admin | AuthController.getProfile | MEDIUM | MATCHED |

---

## SECTION 3 — ADMIN DASHBOARD

| API ID | Method | Endpoint | Auth | Permission | Controller | Criticality | Status |
|---|---|---|---|---|---|---|---|
| API-0011 | GET | /api/admin/dashboard/stats | ADMIN | view_dashboard or * | DashboardController.getStats | HIGH | MATCHED |
| API-0012 | GET | /api/admin/dashboard/revenue | ADMIN | view_dashboard or * | DashboardController.getRevenue | HIGH | MATCHED |
| API-0013 | GET | /api/admin/dashboard/bookings | ADMIN | view_dashboard or * | DashboardController.getBookings | MEDIUM | MATCHED |
| API-0014 | GET | /api/admin/dashboard/vehicles | ADMIN | view_dashboard or * | DashboardController.getVehicles | MEDIUM | MATCHED |
| API-0015 | GET | /api/admin/dashboard/support | ADMIN | view_dashboard or * | DashboardController.getSupport | LOW | MATCHED |
| API-0016 | GET | /api/admin/dashboard/system-alerts | ADMIN | view_dashboard or * | DashboardController.getSystemAlerts | MEDIUM | MATCHED |
| API-0017 | GET | /api/admin/dashboard/charts | ADMIN | view_dashboard or * | DashboardController.getCharts | LOW | MATCHED |
| API-0018 | GET | /api/admin/dashboard/analytics | ADMIN | view_dashboard or * | DashboardController.getAnalytics | MEDIUM | MATCHED |
| API-0019 | GET | /api/admin/dashboard/recent-activities | ADMIN | view_dashboard or * | DashboardController.getRecentActivities | LOW | MATCHED |
| API-0020 | GET | /api/admin/dashboard/overview | ADMIN | view_dashboard or * | DashboardController.getOverview | MEDIUM | MATCHED |


---

## SECTION 4 — ADMIN USER MANAGEMENT
*(Also mounted at /api/super-admin/users — same router, dual path)*

| API ID | Method | Endpoint | Auth | Permission | Controller | Criticality | Status |
|---|---|---|---|---|---|---|---|
| API-0021 | GET | /api/admin/users/statistics | ADMIN | view_users or manage_users | UserController.getUserStatistics | MEDIUM | MATCHED |
| API-0022 | GET | /api/admin/users/export | ADMIN | manage_users or export_reports | UserController.exportUsers | LOW | MATCHED |
| API-0023 | GET | /api/admin/users | ADMIN | view_users or manage_users | UserController.getUsers | MEDIUM | MATCHED |
| API-0024 | GET | /api/admin/users/:id | ADMIN | view_users or manage_users | UserController.getUserById | MEDIUM | MATCHED |
| API-0025 | GET | /api/admin/users/:id/login-history | ADMIN | view_users | UserController.getUserLoginHistory | LOW | MATCHED |
| API-0026 | GET | /api/admin/users/:id/bookings | ADMIN | view_users or view_bookings | UserController.getUserBookings | MEDIUM | MATCHED |
| API-0027 | GET | /api/admin/users/:id/payments | ADMIN | view_users or view_transactions | UserController.getUserPayments | HIGH | MATCHED |
| API-0028 | GET | /api/admin/users/:id/activity | ADMIN | view_users | UserController.getUserActivity | LOW | MATCHED |
| API-0029 | PATCH | /api/admin/users/:id/status | ADMIN | manage_users | UserController.updateUserStatus | HIGH | MATCHED |
| API-0030 | PATCH | /api/admin/users/:id/block | ADMIN | manage_users | UserController.blockUser | HIGH | MATCHED |
| API-0031 | PATCH | /api/admin/users/:id/unblock | ADMIN | manage_users | UserController.unblockUser | HIGH | MATCHED |
| API-0032 | PATCH | /api/admin/users/:id/verify | ADMIN | manage_users or approve_kyc | UserController.verifyUser | HIGH | MATCHED |
| API-0033 | DELETE | /api/admin/users/:id | ADMIN | manage_users | UserController.deleteUser | CRITICAL | MATCHED |
| API-0034 | PUT | /api/admin/users/:id | ADMIN | manage_users | UserController.updateUser | MEDIUM | MATCHED |
| API-0035 | PATCH | /api/admin/users/:id/verify-kyc | ADMIN | manage_users or approve_kyc | UserController.verifyKYC | HIGH | MATCHED |
| API-0036 | PATCH | /api/admin/users/:id/reset-password | ADMIN | manage_users | UserController.resetPassword | HIGH | MATCHED |
| API-0037 | PATCH | /api/admin/users/:id/transfer-branch | ADMIN | manage_users or SUPER_ADMIN | UserController.transferBranch | MEDIUM | MATCHED |
| API-0038 | GET | /api/admin/users/:id/wallet | ADMIN | view_users or view_transactions | UserController.getWallet | HIGH | MATCHED |
| API-0039 | GET | /api/admin/users/:id/wallet/transactions | ADMIN | view_users or view_transactions | UserController.getWalletTransactions | HIGH | MATCHED |
| API-0040 | POST | /api/admin/users/:id/wallet/credit | ADMIN | manage_users or manage_transactions | UserController.creditWallet | CRITICAL | MATCHED |
| API-0041 | POST | /api/admin/users/:id/wallet/debit | ADMIN | manage_users or manage_transactions | UserController.debitWallet | CRITICAL | MATCHED |
| API-0042 | GET | /api/admin/users/:id/rentals | ADMIN | view_users or view_bookings | UserController.getUserRentals | MEDIUM | MATCHED |
| API-0043 | GET | /api/admin/users/:id/jobs | ADMIN | view_users | UserController.getUserJobs | LOW | MATCHED |
| API-0044 | GET | /api/admin/users/:id/activity-timeline | ADMIN | view_users | UserController.getActivityTimeline | LOW | MATCHED |
| API-0045 | GET | /api/admin/users/:id/login-history-detailed | ADMIN | view_users | UserController.getLoginHistoryDetailed | LOW | MATCHED |
| API-0046 | GET | /api/admin/users/:id/devices | ADMIN | view_users | UserController.getDevices | LOW | MATCHED |
| API-0047 | GET | /api/admin/users/:id/documents | ADMIN | view_users | UserController.getDocuments | MEDIUM | MATCHED |
| API-0048 | GET | /api/admin/users/:id/kyc | ADMIN | view_users or approve_kyc | UserController.getKYCDetails | MEDIUM | MATCHED |
| API-0049 | GET | /api/admin/users/:id/branch-history | ADMIN | view_users | UserController.getBranchAssignmentHistory | LOW | MATCHED |
| API-0050 | GET | /api/admin/users/statistics | ADMIN | (super-admin path) | Same as API-0021 | MEDIUM | DUPLICATE |

*(Note: /api/super-admin/users/* uses the same router as /api/admin/users/* — APIs API-0021 through API-0049 are accessible on both prefixes.)*


---

## SECTION 5 — ADMIN KYC MANAGEMENT

| API ID | Method | Endpoint | Auth | Permission | Controller | Criticality | Status |
|---|---|---|---|---|---|---|---|
| API-0051 | GET | /api/admin/kyc/statistics | ADMIN | view_users or approve_kyc | KYCController.getKYCStatistics | MEDIUM | MATCHED |
| API-0052 | GET | /api/admin/kyc/export | ADMIN | approve_kyc or export_reports | KYCController.exportKYC | LOW | MATCHED |
| API-0053 | GET | /api/admin/kyc/pending | ADMIN | view_users or approve_kyc | KYCController.getPendingKYC | HIGH | MATCHED |
| API-0054 | GET | /api/admin/kyc/verified | ADMIN | view_users or approve_kyc | KYCController.getVerifiedKYC | MEDIUM | MATCHED |
| API-0055 | GET | /api/admin/kyc/rejected | ADMIN | view_users or approve_kyc | KYCController.getRejectedKYC | MEDIUM | MATCHED |
| API-0056 | GET | /api/admin/kyc | ADMIN | view_users or approve_kyc | KYCController.getKYCList | MEDIUM | MATCHED |
| API-0057 | GET | /api/admin/kyc/:id | ADMIN | view_users or approve_kyc | KYCController.getKYCById | MEDIUM | MATCHED |
| API-0058 | GET | /api/admin/kyc/timeline/:id | ADMIN | view_users or approve_kyc | KYCController.getKYCTimeline | LOW | MATCHED |
| API-0059 | GET | /api/admin/kyc/download/:id | ADMIN | view_users or approve_kyc | KYCController.downloadKYC | MEDIUM | MATCHED |
| API-0060 | PATCH | /api/admin/kyc/approve | ADMIN | manage_users or approve_kyc | KYCController.approveKYC | CRITICAL | MATCHED |
| API-0061 | PATCH | /api/admin/kyc/reject | ADMIN | manage_users or approve_kyc | KYCController.rejectKYC | CRITICAL | MATCHED |
| API-0062 | PATCH | /api/admin/kyc/reverify | ADMIN | manage_users or approve_kyc | KYCController.reverifyKYC | HIGH | MATCHED |
| API-0063 | PATCH | /api/admin/kyc/update-status | ADMIN | manage_users or approve_kyc | KYCController.updateKYCStatus | HIGH | MATCHED |

---

## SECTION 6 — ADMIN RIDER MANAGEMENT

| API ID | Method | Endpoint | Auth | Permission | Controller | Criticality | Status |
|---|---|---|---|---|---|---|---|
| API-0064 | GET | /api/admin/riders/statistics | ADMIN | view_riders or manage_riders | RiderController.getRiderStatistics | MEDIUM | MATCHED |
| API-0065 | GET | /api/admin/riders/export | ADMIN | manage_riders or export_reports | RiderController.exportRiders | LOW | MATCHED |
| API-0066 | GET | /api/admin/riders | ADMIN | view_riders or manage_riders | RiderController.getRiders | MEDIUM | MATCHED |
| API-0067 | POST | /api/admin/riders | ADMIN | manage_users or manage_riders | RiderController.createRider | HIGH | MATCHED |
| API-0068 | GET | /api/admin/riders/:id | ADMIN | view_riders or manage_riders | RiderController.getRiderById | MEDIUM | MATCHED |
| API-0069 | PUT | /api/admin/riders/:id | ADMIN | manage_riders | RiderController.updateRider | MEDIUM | MATCHED |
| API-0070 | PATCH | /api/admin/riders/:id/verify-kyc | ADMIN | manage_riders or approve_kyc | RiderController.verifyKYC | CRITICAL | MATCHED |
| API-0071 | POST | /api/admin/riders/:id/assign-branch | ADMIN | manage_riders or manage_branches | RiderController.assignBranch | HIGH | MATCHED |
| API-0072 | PATCH | /api/admin/riders/:id/transfer-branch | ADMIN | manage_riders or manage_branches | RiderController.transferBranch | MEDIUM | MATCHED |
| API-0073 | POST | /api/admin/riders/:id/assign-vehicle | ADMIN | manage_riders or manage_vehicles | RiderController.assignVehicle | HIGH | MATCHED |
| API-0074 | PATCH | /api/admin/riders/:id/remove-vehicle | ADMIN | manage_riders or manage_vehicles | RiderController.removeVehicle | HIGH | MATCHED |
| API-0075 | GET | /api/admin/riders/:id/vehicle | ADMIN | view_riders | RiderController.getRiderVehicle | MEDIUM | MATCHED |
| API-0076 | GET | /api/admin/riders/:id/performance | ADMIN | view_riders | RiderController.getRiderPerformance | MEDIUM | MATCHED |
| API-0077 | GET | /api/admin/riders/:id/earnings | ADMIN | view_riders or view_transactions | RiderController.getRiderEarnings | HIGH | MATCHED |
| API-0078 | GET | /api/admin/riders/:id/wallet | ADMIN | view_riders or view_transactions | RiderController.getRiderWallet | HIGH | MATCHED |
| API-0079 | GET | /api/admin/riders/:id/wallet/transactions | ADMIN | view_riders or view_transactions | RiderController.getRiderWalletTransactions | HIGH | MATCHED |
| API-0080 | GET | /api/admin/riders/:id/jobs | ADMIN | view_riders or view_bookings | RiderController.getRiderJobs | MEDIUM | MATCHED |
| API-0081 | GET | /api/admin/riders/:id/activity | ADMIN | view_riders | RiderController.getRiderActivityTimeline | LOW | MATCHED |
| API-0082 | GET | /api/admin/riders/:id/login-history | ADMIN | view_riders | RiderController.getRiderLoginHistory | LOW | MATCHED |
| API-0083 | GET | /api/admin/riders/:id/documents | ADMIN | view_riders | RiderController.getRiderDocuments | MEDIUM | MATCHED |
| API-0084 | GET | /api/admin/riders/:id/current-booking | ADMIN | view_riders or view_bookings | RiderController.getRiderCurrentBooking | HIGH | MATCHED |
| API-0085 | GET | /api/admin/riders/:id/bookings | ADMIN | view_riders or view_bookings | RiderController.getRiderBookings | MEDIUM | MATCHED |
| API-0086 | GET | /api/admin/riders/:id/payments | ADMIN | view_riders or view_transactions | RiderController.getRiderPayments | HIGH | MATCHED |
| API-0087 | GET | /api/admin/riders/:id/live-location | ADMIN | view_riders | RiderController.getRiderLiveLocation | LOW | MATCHED |
| API-0088 | PATCH | /api/admin/riders/:id/block | ADMIN | manage_riders | RiderController.blockRider | HIGH | MATCHED |
| API-0089 | PATCH | /api/admin/riders/:id/unblock | ADMIN | manage_riders | RiderController.unblockRider | HIGH | MATCHED |
| API-0090 | PATCH | /api/admin/riders/:id/status | ADMIN | manage_riders | RiderController.updateRiderStatus | HIGH | MATCHED |
| API-0091 | PATCH | /api/admin/riders/:id/kyc | ADMIN | manage_riders or approve_kyc | RiderController.updateRiderKYC | CRITICAL | MATCHED |
| API-0092 | PATCH | /api/admin/riders/:id/vehicle | ADMIN | manage_riders or manage_vehicles | RiderController.updateRiderVehicle | HIGH | MATCHED |
| API-0093 | PATCH | /api/admin/riders/:id/location | ADMIN | manage_riders | RiderController.updateRiderLocation | MEDIUM | MATCHED |
| API-0094 | PATCH | /api/admin/riders/:id/availability | ADMIN | manage_riders | RiderController.updateRiderAvailability | HIGH | MATCHED |


---

## SECTION 7 — ADMIN BOOKING MANAGEMENT

| API ID | Method | Endpoint | Auth | Permission | Controller | Criticality | Status |
|---|---|---|---|---|---|---|---|
| API-0095 | GET | /api/admin/bookings | ADMIN | SUPER_ADMIN or ADMIN | BookingController.getBookings | HIGH | MATCHED |
| API-0096 | GET | /api/admin/bookings/statistics | ADMIN | SUPER_ADMIN or ADMIN | BookingController.getBookingStatistics | MEDIUM | MATCHED |
| API-0097 | GET | /api/admin/bookings/export | ADMIN | SUPER_ADMIN or ADMIN | BookingController.exportBookings | LOW | MATCHED |
| API-0098 | GET | /api/admin/bookings/analytics/revenue | ADMIN | SUPER_ADMIN or ADMIN | BookingController.getRevenueAnalytics | HIGH | MATCHED |
| API-0099 | GET | /api/admin/bookings/analytics/top-cities | ADMIN | SUPER_ADMIN or ADMIN | BookingController.getTopCities | LOW | MATCHED |
| API-0100 | GET | /api/admin/bookings/analytics/top-riders | ADMIN | SUPER_ADMIN or ADMIN | BookingController.getTopRiders | LOW | MATCHED |
| API-0101 | GET | /api/admin/bookings/analytics/top-users | ADMIN | SUPER_ADMIN or ADMIN | BookingController.getTopUsers | LOW | MATCHED |
| API-0102 | GET | /api/admin/bookings/analytics/peak-hours | ADMIN | SUPER_ADMIN or ADMIN | BookingController.getPeakHours | LOW | MATCHED |
| API-0103 | GET | /api/admin/bookings/analytics/cancellation-report | ADMIN | SUPER_ADMIN or ADMIN | BookingController.getCancellationReport | MEDIUM | MATCHED |
| API-0104 | GET | /api/admin/bookings/analytics/payment-report | ADMIN | SUPER_ADMIN or ADMIN | BookingController.getPaymentReport | MEDIUM | MATCHED |
| API-0105 | GET | /api/admin/bookings/analytics/daily-report | ADMIN | SUPER_ADMIN or ADMIN | BookingController.getDailyReport | LOW | MATCHED |
| API-0106 | GET | /api/admin/bookings/analytics/monthly-report | ADMIN | SUPER_ADMIN or ADMIN | BookingController.getMonthlyReport | LOW | MATCHED |
| API-0107 | GET | /api/admin/bookings/analytics/yearly-report | ADMIN | SUPER_ADMIN or ADMIN | BookingController.getYearlyReport | LOW | MATCHED |
| API-0108 | GET | /api/admin/bookings/:id | ADMIN | SUPER_ADMIN or ADMIN | BookingController.getBookingById | HIGH | MATCHED |
| API-0109 | GET | /api/admin/bookings/:id/invoice | ADMIN | SUPER_ADMIN or ADMIN | BookingController.getBookingInvoice | HIGH | MATCHED |
| API-0110 | GET | /api/admin/bookings/:id/timeline | ADMIN | SUPER_ADMIN or ADMIN | BookingController.getBookingTimeline | MEDIUM | MATCHED |
| API-0111 | GET | /api/admin/bookings/:id/live | ADMIN | SUPER_ADMIN or ADMIN | BookingController.getLiveBookingStatus | HIGH | MATCHED |
| API-0112 | PATCH | /api/admin/bookings/:id/cancel | ADMIN | SUPER_ADMIN or ADMIN | BookingController.cancelBooking | CRITICAL | MATCHED |
| API-0113 | PATCH | /api/admin/bookings/:id/reschedule | ADMIN | SUPER_ADMIN or ADMIN | BookingController.rescheduleBooking | HIGH | MATCHED |
| API-0114 | PATCH | /api/admin/bookings/:id/refund | ADMIN | SUPER_ADMIN or ADMIN | BookingController.refundBooking | CRITICAL | MATCHED |
| API-0115 | PATCH | /api/admin/bookings/:id/reassign-rider | ADMIN | SUPER_ADMIN or ADMIN | BookingController.reassignRider | HIGH | MATCHED |
| API-0116 | PATCH | /api/admin/bookings/:id/contact-rider | ADMIN | SUPER_ADMIN or ADMIN | BookingController.contactRider | LOW | MATCHED |
| API-0117 | PATCH | /api/admin/bookings/:id/contact-user | ADMIN | SUPER_ADMIN or ADMIN | BookingController.contactUser | LOW | MATCHED |
| API-0118 | PATCH | /api/admin/bookings/:id/manual-complete | ADMIN | SUPER_ADMIN or ADMIN | BookingController.manualCompleteBooking | CRITICAL | MATCHED |
| API-0119 | PATCH | /api/admin/bookings/:id/manual-start | ADMIN | SUPER_ADMIN or ADMIN | BookingController.manualStartBooking | HIGH | MATCHED |
| API-0120 | PATCH | /api/admin/bookings/:id/manual-arrival | ADMIN | SUPER_ADMIN or ADMIN | BookingController.manualArrivalBooking | HIGH | MATCHED |
| API-0121 | PATCH | /api/admin/bookings/:id/update-payment | ADMIN | SUPER_ADMIN or ADMIN | BookingController.updatePaymentStatus | CRITICAL | MATCHED |
| API-0122 | PATCH | /api/admin/bookings/:id/update-fare | ADMIN | SUPER_ADMIN or ADMIN | BookingController.updateFare | CRITICAL | MATCHED |
| API-0123 | PATCH | /api/admin/bookings/:id/update-status | ADMIN | SUPER_ADMIN or ADMIN | BookingController.updateBookingStatus | CRITICAL | MATCHED |

---

## SECTION 8 — ADMIN VEHICLE MANAGEMENT
*(Also mounted at /api/super-admin/vehicles)*

| API ID | Method | Endpoint | Auth | Permission | Controller | Criticality | Status |
|---|---|---|---|---|---|---|---|
| API-0124 | GET | /api/admin/vehicles/statistics | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.getVehicleStatistics | MEDIUM | MATCHED |
| API-0125 | GET | /api/admin/vehicles/export | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.exportVehicles | LOW | MATCHED |
| API-0126 | GET | /api/admin/vehicles | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.getVehicles | MEDIUM | MATCHED |
| API-0127 | GET | /api/admin/vehicles/:id | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.getVehicleById | MEDIUM | MATCHED |
| API-0128 | GET | /api/admin/vehicles/:id/history | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.getVehicleHistory | LOW | MATCHED |
| API-0129 | POST | /api/admin/vehicles | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.createVehicle | HIGH | MATCHED |
| API-0130 | PATCH | /api/admin/vehicles/:id | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.updateVehicle | MEDIUM | MATCHED |
| API-0131 | DELETE | /api/admin/vehicles/:id | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.deleteVehicle | HIGH | MATCHED |
| API-0132 | PATCH | /api/admin/vehicles/:id/status | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.updateVehicleStatus | HIGH | MATCHED |
| API-0133 | PATCH | /api/admin/vehicles/:id/maintenance | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.updateMaintenance | MEDIUM | MATCHED |
| API-0134 | PATCH | /api/admin/vehicles/:id/block | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.blockVehicle | HIGH | MATCHED |
| API-0135 | PATCH | /api/admin/vehicles/:id/unblock | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.unblockVehicle | HIGH | MATCHED |
| API-0136 | PATCH | /api/admin/vehicles/:id/assign-rider | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.assignRider | HIGH | MATCHED |
| API-0137 | PATCH | /api/admin/vehicles/:id/remove-rider | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.removeRider | HIGH | MATCHED |
| API-0138 | POST | /api/admin/vehicles/:id/assign-branch | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.assignBranch | MEDIUM | MATCHED |
| API-0139 | PATCH | /api/admin/vehicles/:id/transfer-branch | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.transferBranch | MEDIUM | MATCHED |
| API-0140 | GET | /api/admin/vehicles/:id/branch-history | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.getVehicleBranchHistory | LOW | MATCHED |
| API-0141 | POST | /api/admin/vehicles/:id/start-maintenance | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.startMaintenance | MEDIUM | MATCHED |
| API-0142 | PATCH | /api/admin/vehicles/:id/complete-maintenance | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.completeMaintenance | MEDIUM | MATCHED |
| API-0143 | GET | /api/admin/vehicles/:id/maintenance-history | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.getMaintenanceHistory | LOW | MATCHED |
| API-0144 | GET | /api/admin/vehicles/:id/service-history | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.getServiceHistory | LOW | MATCHED |
| API-0145 | GET | /api/admin/vehicles/:id/inspection-history | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.getInspectionHistory | LOW | MATCHED |
| API-0146 | GET | /api/admin/vehicles/:id/location-history | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.getLocationHistory | LOW | MATCHED |
| API-0147 | GET | /api/admin/vehicles/:id/documents | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.getDocuments | MEDIUM | MATCHED |
| API-0148 | POST | /api/admin/vehicles/:id/documents | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.addDocument | MEDIUM | MATCHED |
| API-0149 | DELETE | /api/admin/vehicles/:id/documents/:documentId | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.deleteDocument | MEDIUM | MATCHED |
| API-0150 | GET | /api/admin/vehicles/:id/activity | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.getActivity | LOW | MATCHED |
| API-0151 | GET | /api/admin/vehicles/:id/expenses | ADMIN | SUPER_ADMIN or ADMIN | VehicleController.getExpenses | LOW | MATCHED |


---

## SECTION 9 — ADMIN FLEET MANAGEMENT
*(Also mounted at /api/super-admin/fleet)*

| API ID | Method | Endpoint | Auth | Permission | Controller | Criticality | Status |
|---|---|---|---|---|---|---|---|
| API-0152 | GET | /api/admin/fleet/dashboard | ADMIN | SUPER_ADMIN or ADMIN | FleetController.getFleetDashboard | MEDIUM | MATCHED |
| API-0153 | GET | /api/admin/fleet/live-locations | ADMIN | SUPER_ADMIN or ADMIN | FleetController.getFleetLiveLocations | MEDIUM | MATCHED |
| API-0154 | GET | /api/admin/fleet/availability | ADMIN | SUPER_ADMIN or ADMIN | FleetController.getFleetAvailability | HIGH | MATCHED |
| API-0155 | GET | /api/admin/fleet/statistics | ADMIN | SUPER_ADMIN or ADMIN | FleetController.getFleetStatistics | MEDIUM | MATCHED |
| API-0156 | PATCH | /api/admin/fleet/assign | ADMIN | SUPER_ADMIN or ADMIN | FleetController.bulkAssignRiders | HIGH | MATCHED |
| API-0157 | PATCH | /api/admin/fleet/remove | ADMIN | SUPER_ADMIN or ADMIN | FleetController.bulkRemoveRiders | HIGH | MATCHED |

---

## SECTION 10 — ADMIN PAYMENT MANAGEMENT

| API ID | Method | Endpoint | Auth | Permission | Controller | Criticality | Status |
|---|---|---|---|---|---|---|---|
| API-0158 | GET | /api/admin/payments/statistics | ADMIN | SUPER_ADMIN or ADMIN | PaymentController.getPaymentStatistics | MEDIUM | MATCHED |
| API-0159 | GET | /api/admin/payments/export | ADMIN | SUPER_ADMIN or ADMIN | PaymentController.exportPayments | LOW | MATCHED |
| API-0160 | GET | /api/admin/payments/wallet/users/:id | ADMIN | SUPER_ADMIN or ADMIN | PaymentController.getUserWallet | HIGH | MATCHED |
| API-0161 | GET | /api/admin/payments/wallet/riders/:id | ADMIN | SUPER_ADMIN or ADMIN | PaymentController.getRiderWallet | HIGH | MATCHED |
| API-0162 | PATCH | /api/admin/payments/wallet/users/:id/credit | ADMIN | SUPER_ADMIN or ADMIN | PaymentController.creditUserWallet | CRITICAL | MATCHED |
| API-0163 | PATCH | /api/admin/payments/wallet/users/:id/debit | ADMIN | SUPER_ADMIN or ADMIN | PaymentController.debitUserWallet | CRITICAL | MATCHED |
| API-0164 | PATCH | /api/admin/payments/wallet/riders/:id/credit | ADMIN | SUPER_ADMIN or ADMIN | PaymentController.creditRiderWallet | CRITICAL | MATCHED |
| API-0165 | GET | /api/admin/payments/wallet/history/:id | ADMIN | SUPER_ADMIN or ADMIN | PaymentController.getWalletHistory | HIGH | MATCHED |
| API-0166 | GET | /api/admin/payments/settlements | ADMIN | SUPER_ADMIN or ADMIN | PaymentController.getSettlements | HIGH | MATCHED |
| API-0167 | GET | /api/admin/payments/settlements/:id | ADMIN | SUPER_ADMIN or ADMIN | PaymentController.getSettlementById | HIGH | MATCHED |
| API-0168 | PATCH | /api/admin/payments/settlements/:id/process | ADMIN | SUPER_ADMIN or ADMIN | PaymentController.processSettlement | CRITICAL | MATCHED |
| API-0169 | GET | /api/admin/payments/commission/overview | ADMIN | SUPER_ADMIN or ADMIN | PaymentController.getCommissionOverview | HIGH | MATCHED |
| API-0170 | GET | /api/admin/payments/analytics/revenue | ADMIN | SUPER_ADMIN or ADMIN | PaymentController.getRevenueAnalytics | HIGH | MATCHED |
| API-0171 | GET | /api/admin/payments/analytics/payment-methods | ADMIN | SUPER_ADMIN or ADMIN | PaymentController.getPaymentMethodDistribution | MEDIUM | MATCHED |
| API-0172 | GET | /api/admin/payments/analytics/top-cities | ADMIN | SUPER_ADMIN or ADMIN | PaymentController.getTopCities | LOW | MATCHED |
| API-0173 | GET | /api/admin/payments/analytics/top-users | ADMIN | SUPER_ADMIN or ADMIN | PaymentController.getTopUsers | LOW | MATCHED |
| API-0174 | GET | /api/admin/payments/analytics/top-riders | ADMIN | SUPER_ADMIN or ADMIN | PaymentController.getTopRiders | LOW | MATCHED |
| API-0175 | GET | /api/admin/payments/analytics/peak-hours | ADMIN | SUPER_ADMIN or ADMIN | PaymentController.getPeakHours | LOW | MATCHED |
| API-0176 | GET | /api/admin/payments/analytics/daily | ADMIN | SUPER_ADMIN or ADMIN | PaymentController.getDailyReport | LOW | MATCHED |
| API-0177 | GET | /api/admin/payments/analytics/monthly | ADMIN | SUPER_ADMIN or ADMIN | PaymentController.getMonthlyReport | LOW | MATCHED |
| API-0178 | GET | /api/admin/payments/analytics/yearly | ADMIN | SUPER_ADMIN or ADMIN | PaymentController.getYearlyReport | LOW | MATCHED |
| API-0179 | GET | /api/admin/payments | ADMIN | SUPER_ADMIN or ADMIN | PaymentController.getPayments | HIGH | MATCHED |
| API-0180 | GET | /api/admin/payments/:id | ADMIN | SUPER_ADMIN or ADMIN | PaymentController.getPaymentById | HIGH | MATCHED |
| API-0181 | PATCH | /api/admin/payments/:id/refund | ADMIN | SUPER_ADMIN or ADMIN | PaymentController.processRefund | CRITICAL | MATCHED |
| API-0182 | PATCH | /api/admin/payments/:id/status | ADMIN | SUPER_ADMIN or ADMIN | PaymentController.updatePaymentStatus | CRITICAL | MATCHED |
| API-0183 | PATCH | /api/admin/payments/:id/verify | ADMIN | SUPER_ADMIN or ADMIN | PaymentController.verifyPayment | HIGH | MATCHED |


---

## SECTION 11 — ADMIN REPORTS

| API ID | Method | Endpoint | Auth | Permission | Controller | Criticality | Status |
|---|---|---|---|---|---|---|---|
| API-0184 | GET | /api/admin/reports/revenue | ADMIN | SUPER_ADMIN or ADMIN | ReportController.getRevenueReport | HIGH | MATCHED |
| API-0185 | GET | /api/admin/reports/bookings | ADMIN | SUPER_ADMIN or ADMIN | ReportController.getBookingReport | MEDIUM | MATCHED |
| API-0186 | GET | /api/admin/reports/users | ADMIN | SUPER_ADMIN or ADMIN | ReportController.getUserReport | MEDIUM | MATCHED |
| API-0187 | GET | /api/admin/reports/riders | ADMIN | SUPER_ADMIN or ADMIN | ReportController.getRiderReport | MEDIUM | MATCHED |
| API-0188 | GET | /api/admin/reports/vehicles | ADMIN | SUPER_ADMIN or ADMIN | ReportController.getVehicleReport | LOW | MATCHED |
| API-0189 | GET | /api/admin/reports/payments | ADMIN | SUPER_ADMIN or ADMIN | ReportController.getPaymentReport | HIGH | MATCHED |
| API-0190 | GET | /api/admin/reports/support | ADMIN | SUPER_ADMIN or ADMIN | ReportController.getSupportReport | LOW | MATCHED |
| API-0191 | GET | /api/admin/reports/kyc | ADMIN | SUPER_ADMIN or ADMIN | ReportController.getKYCReport | MEDIUM | MATCHED |
| API-0192 | GET | /api/admin/reports/dashboard | ADMIN | SUPER_ADMIN or ADMIN | ReportController.getDashboardAnalytics | MEDIUM | MATCHED |
| API-0193 | GET | /api/admin/reports/top-users | ADMIN | SUPER_ADMIN or ADMIN | ReportController.getTopUsers | LOW | MATCHED |
| API-0194 | GET | /api/admin/reports/top-riders | ADMIN | SUPER_ADMIN or ADMIN | ReportController.getTopRiders | LOW | MATCHED |
| API-0195 | GET | /api/admin/reports/top-cities | ADMIN | SUPER_ADMIN or ADMIN | ReportController.getTopCities | LOW | MATCHED |
| API-0196 | GET | /api/admin/reports/top-vehicles | ADMIN | SUPER_ADMIN or ADMIN | ReportController.getTopVehicles | LOW | MATCHED |
| API-0197 | GET | /api/admin/reports/charts/revenue | ADMIN | SUPER_ADMIN or ADMIN | ReportController.getRevenueChartData | MEDIUM | MATCHED |
| API-0198 | GET | /api/admin/reports/charts/bookings | ADMIN | SUPER_ADMIN or ADMIN | ReportController.getBookingChartData | MEDIUM | MATCHED |
| API-0199 | GET | /api/admin/reports/charts/users | ADMIN | SUPER_ADMIN or ADMIN | ReportController.getUserChartData | MEDIUM | MATCHED |
| API-0200 | GET | /api/admin/reports/download | ADMIN | SUPER_ADMIN or ADMIN | ReportController.downloadReport | LOW | MATCHED |

---

## SECTION 12 — ADMIN MANAGEMENT

| API ID | Method | Endpoint | Auth | Permission | Controller | Criticality | Status |
|---|---|---|---|---|---|---|---|
| API-0201 | GET | /api/admin/admin-management/statistics | ADMIN | SUPER_ADMIN | AdminManagementController.getAdminStatistics | MEDIUM | MATCHED |
| API-0202 | GET | /api/admin/admin-management/list | ADMIN | SUPER_ADMIN | AdminManagementController.getAllAdmins | HIGH | MATCHED |
| API-0203 | POST | /api/admin/admin-management/create | ADMIN | SUPER_ADMIN | AdminManagementController.createAdmin | CRITICAL | MATCHED |
| API-0204 | GET | /api/admin/admin-management/:id | ADMIN | SUPER_ADMIN | AdminManagementController.getAdminById | MEDIUM | MATCHED |
| API-0205 | PUT | /api/admin/admin-management/:id | ADMIN | SUPER_ADMIN | AdminManagementController.updateAdmin | HIGH | MATCHED |
| API-0206 | PATCH | /api/admin/admin-management/:id/status | ADMIN | SUPER_ADMIN | AdminManagementController.updateAdminStatus | CRITICAL | MATCHED |
| API-0207 | POST | /api/admin/admin-management/:id/block | ADMIN | SUPER_ADMIN | AdminManagementController.blockAdmin | CRITICAL | MATCHED |
| API-0208 | POST | /api/admin/admin-management/:id/unblock | ADMIN | SUPER_ADMIN | AdminManagementController.unblockAdmin | CRITICAL | MATCHED |
| API-0209 | PATCH | /api/admin/admin-management/:id/reset-password | ADMIN | SUPER_ADMIN | AdminManagementController.resetAdminPassword | CRITICAL | MATCHED |
| API-0210 | DELETE | /api/admin/admin-management/:id | ADMIN | SUPER_ADMIN | AdminManagementController.deleteAdmin | CRITICAL | MATCHED |
| API-0211 | POST | /api/admin/admin-management/:id/assign-branch | ADMIN | SUPER_ADMIN | AdminManagementController.assignBranch | HIGH | MATCHED |
| API-0212 | PATCH | /api/admin/admin-management/:id/transfer-branch | ADMIN | SUPER_ADMIN | AdminManagementController.transferBranch | HIGH | MATCHED |
| API-0213 | PATCH | /api/admin/admin-management/:id/remove-branch | ADMIN | SUPER_ADMIN | AdminManagementController.removeBranch | HIGH | MATCHED |
| API-0214 | GET | /api/admin/admin-management/:id/assignment-history | ADMIN | SUPER_ADMIN | AdminManagementController.getAssignmentHistory | LOW | MATCHED |
| API-0215 | GET | /api/admin/admin-management/:id/activity | ADMIN | SUPER_ADMIN | AdminManagementController.getAdminActivityLogs | MEDIUM | MATCHED |
| API-0216 | GET | /api/admin/admin-management/:id/login-history | ADMIN | SUPER_ADMIN | AdminManagementController.getLoginHistory | MEDIUM | MATCHED |
| API-0217 | GET | /api/admin/admin-management/:id/permissions | ADMIN | SUPER_ADMIN | AdminManagementController.getPermissions | HIGH | MATCHED |
| API-0218 | PATCH | /api/admin/admin-management/:id/permissions | ADMIN | SUPER_ADMIN | AdminManagementController.updatePermissions | CRITICAL | MATCHED |
| API-0219 | GET | /api/admin/admin-management/:id/sessions | ADMIN | SUPER_ADMIN | AdminManagementController.getActiveSessions | HIGH | MATCHED |
| API-0220 | DELETE | /api/admin/admin-management/:id/sessions/:session_id | ADMIN | SUPER_ADMIN | AdminManagementController.revokeSession | HIGH | MATCHED |

⚠️ **NOTE (METHOD_MISMATCH):** API-0207 and API-0208 use `POST` for block/unblock operations. These should semantically be `PATCH` (state change). Postman uses `POST`. Source code uses `POST`. Both agree — but it is a REST convention violation.


---

## SECTION 13 — ADMIN NOTIFICATIONS

| API ID | Method | Endpoint | Auth | Permission | Controller | Criticality | Status |
|---|---|---|---|---|---|---|---|
| API-0221 | GET | /api/admin/notifications/statistics | ADMIN | SUPER_ADMIN or ADMIN | NotificationController.getNotificationStatistics | LOW | MATCHED |
| API-0222 | GET | /api/admin/notifications/history | ADMIN | SUPER_ADMIN or ADMIN | NotificationController.getNotificationHistory | LOW | MATCHED |
| API-0223 | POST | /api/admin/notifications/send | ADMIN | SUPER_ADMIN or ADMIN | NotificationController.sendNotification | HIGH | MATCHED |
| API-0224 | POST | /api/admin/notifications/broadcast | ADMIN | SUPER_ADMIN or ADMIN | NotificationController.broadcastNotification | HIGH | MATCHED |
| API-0225 | POST | /api/admin/notifications/schedule | ADMIN | SUPER_ADMIN or ADMIN | NotificationController.scheduleNotification | MEDIUM | MATCHED |
| API-0226 | GET | /api/admin/notifications/templates | ADMIN | SUPER_ADMIN or ADMIN | NotificationController.getTemplates | LOW | MATCHED |
| API-0227 | POST | /api/admin/notifications/templates | ADMIN | SUPER_ADMIN or ADMIN | NotificationController.createTemplate | MEDIUM | MATCHED |
| API-0228 | PATCH | /api/admin/notifications/templates/:id | ADMIN | SUPER_ADMIN or ADMIN | NotificationController.updateTemplate | MEDIUM | MATCHED |
| API-0229 | DELETE | /api/admin/notifications/templates/:id | ADMIN | SUPER_ADMIN or ADMIN | NotificationController.deleteTemplate | MEDIUM | MATCHED |
| API-0230 | GET | /api/admin/notifications | ADMIN | SUPER_ADMIN or ADMIN | NotificationController.getNotifications | LOW | MATCHED |
| API-0231 | GET | /api/admin/notifications/:id | ADMIN | SUPER_ADMIN or ADMIN | NotificationController.getNotificationById | LOW | MATCHED |
| API-0232 | PATCH | /api/admin/notifications/:id/cancel-schedule | ADMIN | SUPER_ADMIN or ADMIN | NotificationController.cancelScheduledNotification | MEDIUM | MATCHED |
| API-0233 | PATCH | /api/admin/notifications/:id/resend | ADMIN | SUPER_ADMIN or ADMIN | NotificationController.resendNotification | MEDIUM | MATCHED |
| API-0234 | DELETE | /api/admin/notifications/:id | ADMIN | SUPER_ADMIN or ADMIN | NotificationController.deleteNotification | LOW | MATCHED |

---

## SECTION 14 — LANDING CMS (ADMIN)

| API ID | Method | Endpoint | Auth | Permission | Controller | Criticality | Status |
|---|---|---|---|---|---|---|---|
| API-0235 | GET | /api/admin/landing/hero | ADMIN | SUPER_ADMIN or ADMIN | LandingCMSController.getHero | LOW | MATCHED |
| API-0236 | PATCH | /api/admin/landing/hero | ADMIN | SUPER_ADMIN or ADMIN | LandingCMSController.updateHero | LOW | MATCHED |
| API-0237 | GET | /api/admin/landing/statistics | ADMIN | SUPER_ADMIN or ADMIN | LandingCMSController.getStatistics | LOW | MATCHED |
| API-0238 | PATCH | /api/admin/landing/statistics | ADMIN | SUPER_ADMIN or ADMIN | LandingCMSController.updateStatistics | LOW | MATCHED |
| API-0239 | POST | /api/admin/landing/statistics/sync | ADMIN | SUPER_ADMIN or ADMIN | LandingCMSController.syncStatistics | LOW | MATCHED |
| API-0240 | GET | /api/admin/landing/partners | ADMIN | SUPER_ADMIN or ADMIN | LandingCMSController.getPartners | LOW | MATCHED |
| API-0241 | GET | /api/admin/landing/partners/:id | ADMIN | SUPER_ADMIN or ADMIN | LandingCMSController.getPartnerById | LOW | MATCHED |
| API-0242 | POST | /api/admin/landing/partners | ADMIN | SUPER_ADMIN or ADMIN | LandingCMSController.createPartner | LOW | MATCHED |
| API-0243 | PATCH | /api/admin/landing/partners/:id | ADMIN | SUPER_ADMIN or ADMIN | LandingCMSController.updatePartner | LOW | MATCHED |
| API-0244 | DELETE | /api/admin/landing/partners/:id | ADMIN | SUPER_ADMIN or ADMIN | LandingCMSController.deletePartner | LOW | MATCHED |
| API-0245 | GET | /api/admin/landing/contact | ADMIN | SUPER_ADMIN or ADMIN | LandingCMSController.getContact | LOW | MATCHED |
| API-0246 | PATCH | /api/admin/landing/contact | ADMIN | SUPER_ADMIN or ADMIN | LandingCMSController.updateContact | LOW | MATCHED |
| API-0247 | GET | /api/admin/landing/footer | ADMIN | SUPER_ADMIN or ADMIN | LandingCMSController.getFooter | LOW | MATCHED |
| API-0248 | PATCH | /api/admin/landing/footer | ADMIN | SUPER_ADMIN or ADMIN | LandingCMSController.updateFooter | LOW | MATCHED |
| API-0249 | GET | /api/admin/landing/enquiries | ADMIN | SUPER_ADMIN or ADMIN | LandingCMSController.getEnquiries | LOW | MATCHED |
| API-0250 | GET | /api/admin/landing/enquiries/statistics | ADMIN | SUPER_ADMIN or ADMIN | LandingCMSController.getEnquiryStatistics | LOW | MATCHED |
| API-0251 | GET | /api/admin/landing/enquiries/:id | ADMIN | SUPER_ADMIN or ADMIN | LandingCMSController.getEnquiryById | LOW | MATCHED |
| API-0252 | PATCH | /api/admin/landing/enquiries/:id/status | ADMIN | SUPER_ADMIN or ADMIN | LandingCMSController.updateEnquiryStatus | LOW | MATCHED |
| API-0253 | PATCH | /api/admin/landing/enquiries/:id/assign | ADMIN | SUPER_ADMIN or ADMIN | LandingCMSController.assignEnquiry | LOW | MATCHED |

---

## SECTION 15 — LANDING CMS (PUBLIC)

| API ID | Method | Endpoint | Auth | Permission | Controller | Criticality | Status |
|---|---|---|---|---|---|---|---|
| API-0254 | GET | /api/public/landing/hero | PUBLIC | None | LandingCMSController.getHero | LOW | MATCHED |
| API-0255 | GET | /api/public/landing/statistics | PUBLIC | None | LandingCMSController.getStatistics | LOW | MATCHED |
| API-0256 | GET | /api/public/landing/partners | PUBLIC | None | LandingCMSController.getPartners | LOW | MATCHED |
| API-0257 | GET | /api/public/landing/contact | PUBLIC | None | LandingCMSController.getContact | LOW | MATCHED |
| API-0258 | GET | /api/public/landing/footer | PUBLIC | None | LandingCMSController.getFooter | LOW | MATCHED |
| API-0259 | POST | /api/public/landing/enquiries | PUBLIC | None | LandingCMSController.createEnquiry | LOW | MATCHED |


---

## SECTION 16 — BRANCH MANAGEMENT

| API ID | Method | Endpoint | Auth | Permission | Controller | Criticality | Status |
|---|---|---|---|---|---|---|---|
| API-0260 | POST | /api/super-admin/branches | ADMIN | SUPER_ADMIN | BranchController.createBranch | HIGH | MATCHED |
| API-0261 | GET | /api/super-admin/branches | ADMIN | SUPER_ADMIN | BranchController.getAllBranches | MEDIUM | MATCHED |
| API-0262 | GET | /api/super-admin/branches/:id/statistics | ADMIN | SUPER_ADMIN | BranchController.getBranchStatistics | MEDIUM | MATCHED |
| API-0263 | GET | /api/super-admin/branches/:id/activity | ADMIN | SUPER_ADMIN | BranchController.getBranchActivityLogs | LOW | MATCHED |
| API-0264 | GET | /api/super-admin/branches/:id/settings | ADMIN | SUPER_ADMIN | BranchController.getBranchSettings | MEDIUM | MATCHED |
| API-0265 | GET | /api/super-admin/branches/:id | ADMIN | SUPER_ADMIN | BranchController.getBranchById | MEDIUM | MATCHED |
| API-0266 | PUT | /api/super-admin/branches/:id | ADMIN | SUPER_ADMIN | BranchController.updateBranch | HIGH | MATCHED |
| API-0267 | PUT | /api/super-admin/branches/:id/settings | ADMIN | SUPER_ADMIN | BranchController.updateBranchSettings | MEDIUM | MATCHED |
| API-0268 | PATCH | /api/super-admin/branches/:id/status | ADMIN | SUPER_ADMIN | BranchController.updateBranchStatus | HIGH | MATCHED |
| API-0269 | DELETE | /api/super-admin/branches/:id | ADMIN | SUPER_ADMIN | BranchController.deleteBranch | HIGH | MATCHED |

---

## SECTION 17 — RENTAL MANAGEMENT
*(Also mounted at /api/super-admin/rentals)*

| API ID | Method | Endpoint | Auth | Permission | Controller | Criticality | Status |
|---|---|---|---|---|---|---|---|
| API-0270 | POST | /api/admin/rentals/:id/otp | ADMIN | SUPER_ADMIN or ADMIN | RentalController.generatePickupOTP | HIGH | MATCHED |
| API-0271 | PATCH | /api/admin/rentals/:id/pickup | ADMIN | SUPER_ADMIN or ADMIN | RentalController.pickupRental | CRITICAL | MATCHED |
| API-0272 | PATCH | /api/admin/rentals/:id/return | ADMIN | SUPER_ADMIN or ADMIN | RentalController.returnRental | CRITICAL | MATCHED |
| API-0273 | PATCH | /api/admin/rentals/:id/extend | ADMIN | SUPER_ADMIN or ADMIN | RentalController.extendRental | HIGH | MATCHED |
| API-0274 | POST | /api/admin/rentals/:id/inspection | ADMIN | SUPER_ADMIN or ADMIN | RentalController.recordInspection | MEDIUM | MATCHED |
| API-0275 | POST | /api/admin/rentals/:id/checklist | ADMIN | SUPER_ADMIN or ADMIN | RentalController.recordChecklist | MEDIUM | MATCHED |
| API-0276 | GET | /api/admin/rentals/overdue | ADMIN | SUPER_ADMIN | RentalController.getOverdueRentals | HIGH | MATCHED |
| API-0277 | GET | /api/admin/rentals | ADMIN | SUPER_ADMIN | RentalController.getRentals | MEDIUM | MATCHED |
| API-0278 | GET | /api/admin/rentals/:id | ADMIN | SUPER_ADMIN | RentalController.getRentalById | MEDIUM | MATCHED |
| API-0279 | PATCH | /api/admin/rentals/:id/cancel | ADMIN | SUPER_ADMIN | RentalController.cancelRental | CRITICAL | MATCHED |
| API-0280 | PATCH | /api/admin/rentals/:id/force-close | ADMIN | SUPER_ADMIN | RentalController.forceCloseRental | CRITICAL | MATCHED |
| API-0281 | GET | /api/admin/rentals/:id/invoice | ADMIN | SUPER_ADMIN | RentalController.getRentalInvoice | HIGH | MATCHED |
| API-0282 | GET | /api/admin/rentals/:id/payment-history | ADMIN | SUPER_ADMIN | RentalController.getPaymentHistory | HIGH | MATCHED |
| API-0283 | GET | /api/admin/rentals/:id/timeline | ADMIN | SUPER_ADMIN | RentalController.getTimeline | LOW | MATCHED |
| API-0284 | GET | /api/admin/rentals/:id/damage-report | ADMIN | SUPER_ADMIN | RentalController.getDamageReport | HIGH | MATCHED |

---

## SECTION 18 — ENTERPRISE FINANCE

| API ID | Method | Endpoint | Module | Auth | Permission | Controller | Criticality | Status |
|---|---|---|---|---|---|---|---|---|
| API-0285 | GET | /api/super-admin/wallets | Finance-Wallets | ADMIN | SUPER_ADMIN | FinanceController.getWallets | HIGH | MATCHED |
| API-0286 | GET | /api/super-admin/wallets/:id | Finance-Wallets | ADMIN | SUPER_ADMIN or ADMIN | FinanceController.getWalletById | HIGH | MATCHED |
| API-0287 | GET | /api/super-admin/wallets/:id/transactions | Finance-Wallets | ADMIN | SUPER_ADMIN or ADMIN | FinanceController.getWalletTransactions | HIGH | MATCHED |
| API-0288 | POST | /api/super-admin/wallets/:id/credit | Finance-Wallets | ADMIN | SUPER_ADMIN | FinanceController.creditWallet | CRITICAL | MATCHED |
| API-0289 | POST | /api/super-admin/wallets/:id/debit | Finance-Wallets | ADMIN | SUPER_ADMIN | FinanceController.debitWallet | CRITICAL | MATCHED |
| API-0290 | GET | /api/super-admin/wallets/:id/ledger | Finance-Wallets | ADMIN | SUPER_ADMIN | FinanceController.getWalletLedger | HIGH | MATCHED |
| API-0291 | POST | /api/super-admin/finance/payments/create | Finance-Payments | ADMIN | SUPER_ADMIN or ADMIN | FinanceController.createPayment | CRITICAL | MATCHED |
| API-0292 | POST | /api/super-admin/finance/payments/:id/verify | Finance-Payments | ADMIN | SUPER_ADMIN or ADMIN | FinanceController.verifyPayment | CRITICAL | MATCHED |
| API-0293 | POST | /api/super-admin/finance/payments/:id/refund | Finance-Payments | ADMIN | SUPER_ADMIN or ADMIN | FinanceController.processRefund | CRITICAL | MATCHED |
| API-0294 | GET | /api/super-admin/finance/payments | Finance-Payments | ADMIN | SUPER_ADMIN or ADMIN | FinanceController.getPayments | HIGH | MATCHED |
| API-0295 | GET | /api/super-admin/finance/payments/:id | Finance-Payments | ADMIN | SUPER_ADMIN or ADMIN | FinanceController.getPaymentById | HIGH | MATCHED |
| API-0296 | GET | /api/super-admin/finance/payments/:id/history | Finance-Payments | ADMIN | SUPER_ADMIN or ADMIN | FinanceController.getPaymentHistory | HIGH | MATCHED |
| API-0297 | POST | /api/super-admin/settlements/run | Finance-Settlement | ADMIN | SUPER_ADMIN | FinanceController.runSettlement | CRITICAL | MATCHED |
| API-0298 | GET | /api/super-admin/settlements | Finance-Settlement | ADMIN | SUPER_ADMIN | FinanceController.getSettlements | HIGH | MATCHED |
| API-0299 | GET | /api/super-admin/settlements/:id | Finance-Settlement | ADMIN | SUPER_ADMIN | FinanceController.getSettlementById | HIGH | MATCHED |
| API-0300 | PATCH | /api/super-admin/settlements/:id/process | Finance-Settlement | ADMIN | SUPER_ADMIN | FinanceController.processSettlement | CRITICAL | MATCHED |
| API-0301 | PATCH | /api/super-admin/settlements/:id/complete | Finance-Settlement | ADMIN | SUPER_ADMIN | FinanceController.completeSettlement | CRITICAL | MATCHED |
| API-0302 | GET | /api/super-admin/ledger/trial-balance | Finance-Ledger | ADMIN | SUPER_ADMIN | FinanceController.getTrialBalance | HIGH | MATCHED |
| API-0303 | GET | /api/super-admin/ledger/accounts | Finance-Ledger | ADMIN | SUPER_ADMIN | FinanceController.getLedgerAccounts | HIGH | MATCHED |
| API-0304 | GET | /api/super-admin/ledger/entries | Finance-Ledger | ADMIN | SUPER_ADMIN | FinanceController.getLedgerEntries | HIGH | MATCHED |
| API-0305 | GET | /api/super-admin/ledger | Finance-Ledger | ADMIN | SUPER_ADMIN | FinanceController.getLedgerEntries | HIGH | DUPLICATE |
| API-0306 | GET | /api/super-admin/finance/revenue | Finance-Reports | ADMIN | SUPER_ADMIN | FinanceController.getRevenueReport | HIGH | MATCHED |
| API-0307 | GET | /api/super-admin/finance/expenses | Finance-Reports | ADMIN | SUPER_ADMIN | FinanceController.getExpensesReport | HIGH | MATCHED |
| API-0308 | GET | /api/super-admin/finance/refunds | Finance-Reports | ADMIN | SUPER_ADMIN | FinanceController.getRefundsReport | HIGH | MATCHED |
| API-0309 | GET | /api/super-admin/finance/commissions | Finance-Reports | ADMIN | SUPER_ADMIN | FinanceController.getCommissionsReport | HIGH | MATCHED |
| API-0310 | GET | /api/super-admin/finance/taxes | Finance-Reports | ADMIN | SUPER_ADMIN | FinanceController.getTaxesReport | HIGH | MATCHED |
| API-0311 | POST | /api/super-admin/finance/reconcile | Finance-Reports | ADMIN | SUPER_ADMIN | FinanceController.runReconciliation | CRITICAL | MATCHED |


---

## SECTION 19 — ENTERPRISE COMMUNICATION

| API ID | Method | Endpoint | Auth | Permission | Controller | Criticality | Status |
|---|---|---|---|---|---|---|---|
| API-0312 | GET | /api/super-admin/notifications | ADMIN | SUPER_ADMIN or ADMIN | CommunicationController.getNotifications | LOW | MATCHED |
| API-0313 | GET | /api/super-admin/notifications/:id | ADMIN | SUPER_ADMIN or ADMIN | CommunicationController.getNotificationById | LOW | MATCHED |
| API-0314 | POST | /api/super-admin/notifications/send | ADMIN | SUPER_ADMIN | CommunicationController.sendNotification | HIGH | MATCHED |
| API-0315 | POST | /api/super-admin/notifications/broadcast | ADMIN | SUPER_ADMIN | CommunicationController.broadcastNotification | HIGH | MATCHED |
| API-0316 | PATCH | /api/super-admin/notifications/:id/read | ADMIN | SUPER_ADMIN or ADMIN | CommunicationController.readNotification | LOW | MATCHED |
| API-0317 | DELETE | /api/super-admin/notifications/:id | ADMIN | SUPER_ADMIN | CommunicationController.deleteNotification | LOW | MATCHED |
| API-0318 | POST | /api/super-admin/templates | ADMIN | SUPER_ADMIN | CommunicationController.createTemplate | MEDIUM | MATCHED |
| API-0319 | GET | /api/super-admin/templates | ADMIN | SUPER_ADMIN or ADMIN | CommunicationController.getTemplates | LOW | MATCHED |
| API-0320 | PUT | /api/super-admin/templates/:id | ADMIN | SUPER_ADMIN | CommunicationController.updateTemplate | MEDIUM | MATCHED |
| API-0321 | DELETE | /api/super-admin/templates/:id | ADMIN | SUPER_ADMIN | CommunicationController.deleteTemplate | LOW | MATCHED |
| API-0322 | POST | /api/super-admin/campaigns | ADMIN | SUPER_ADMIN | CommunicationController.createCampaign | HIGH | MATCHED |
| API-0323 | GET | /api/super-admin/campaigns | ADMIN | SUPER_ADMIN | CommunicationController.getCampaigns | MEDIUM | MATCHED |
| API-0324 | PATCH | /api/super-admin/campaigns/:id/start | ADMIN | SUPER_ADMIN | CommunicationController.startCampaign | HIGH | MATCHED |
| API-0325 | PATCH | /api/super-admin/campaigns/:id/stop | ADMIN | SUPER_ADMIN | CommunicationController.stopCampaign | HIGH | MATCHED |
| API-0326 | GET | /api/preferences | ADMIN | Any authenticated | CommunicationController.getPreferences | LOW | MATCHED |
| API-0327 | PATCH | /api/preferences | ADMIN | Any authenticated | CommunicationController.updatePreferences | LOW | MATCHED |
| API-0328 | POST | /api/comm-webhooks/events | PUBLIC | None (webhook) | CommunicationController.postIncomingWebhookEvent | HIGH | MATCHED |
| API-0329 | GET | /api/comm-webhooks/logs | ADMIN | SUPER_ADMIN | CommunicationController.getWebhookLogs | MEDIUM | MATCHED |

---

## SECTION 20 — ENTERPRISE BI / ANALYTICS

| API ID | Method | Endpoint | Auth | Permission | Controller | Criticality | Status |
|---|---|---|---|---|---|---|---|
| API-0330 | GET | /api/super-admin/dashboard | ADMIN | SUPER_ADMIN | BIController.getDashboardKPIs | HIGH | MATCHED |
| API-0331 | GET | /api/super-admin/dashboard/widgets | ADMIN | SUPER_ADMIN | BIController.getWidgets | LOW | MATCHED |
| API-0332 | POST | /api/super-admin/dashboard/widgets | ADMIN | SUPER_ADMIN | BIController.createWidget | LOW | MATCHED |
| API-0333 | PUT | /api/super-admin/dashboard/widgets/:id | ADMIN | SUPER_ADMIN | BIController.updateWidget | LOW | MATCHED |
| API-0334 | DELETE | /api/super-admin/dashboard/widgets/:id | ADMIN | SUPER_ADMIN | BIController.deleteWidget | LOW | MATCHED |
| API-0335 | GET | /api/super-admin/analytics | ADMIN | SUPER_ADMIN | BIController.getAnalytics | HIGH | MATCHED |
| API-0336 | GET | /api/super-admin/analytics/revenue | ADMIN | SUPER_ADMIN | BIController.getRevenueAnalytics | HIGH | MATCHED |
| API-0337 | GET | /api/super-admin/analytics/rentals | ADMIN | SUPER_ADMIN | BIController.getRentalAnalytics | HIGH | MATCHED |
| API-0338 | GET | /api/super-admin/analytics/jobs | ADMIN | SUPER_ADMIN | BIController.getJobAnalytics | MEDIUM | MATCHED |
| API-0339 | GET | /api/super-admin/analytics/users | ADMIN | SUPER_ADMIN | BIController.getSystemAnalytics | MEDIUM | MATCHED |
| API-0340 | GET | /api/super-admin/analytics/riders | ADMIN | SUPER_ADMIN | BIController.getRiderAnalytics | MEDIUM | MATCHED |
| API-0341 | GET | /api/super-admin/analytics/fleet | ADMIN | SUPER_ADMIN | BIController.getVehicleAnalytics | MEDIUM | MATCHED |
| API-0342 | GET | /api/super-admin/analytics/payments | ADMIN | SUPER_ADMIN | BIController.getRevenueAnalytics | HIGH | DUPLICATE |
| API-0343 | GET | /api/super-admin/analytics/branches | ADMIN | SUPER_ADMIN | BIController.getBranchAnalytics | MEDIUM | MATCHED |
| API-0344 | POST | /api/super-admin/reports/generate | ADMIN | SUPER_ADMIN | BIController.generateReport | HIGH | MATCHED |
| API-0345 | GET | /api/super-admin/reports | ADMIN | SUPER_ADMIN | BIController.getReports | MEDIUM | MATCHED |
| API-0346 | GET | /api/super-admin/reports/:id | ADMIN | SUPER_ADMIN | BIController.getReportById | MEDIUM | MATCHED |
| API-0347 | POST | /api/super-admin/reports/schedule | ADMIN | SUPER_ADMIN | BIController.scheduleReport | MEDIUM | MATCHED |
| API-0348 | PATCH | /api/super-admin/reports/:id/run | ADMIN | SUPER_ADMIN | BIController.generateReport | MEDIUM | MATCHED |
| API-0349 | DELETE | /api/super-admin/reports/:id | ADMIN | SUPER_ADMIN | BIController.deleteReport | LOW | MATCHED |
| API-0350 | POST | /api/super-admin/export/csv | ADMIN | SUPER_ADMIN | BIController.exportCSV | HIGH | MATCHED |
| API-0351 | POST | /api/super-admin/export/excel | ADMIN | SUPER_ADMIN | BIController.exportExcel | HIGH | MATCHED |
| API-0352 | POST | /api/super-admin/export/pdf | ADMIN | SUPER_ADMIN | BIController.exportPDF | HIGH | MATCHED |


---

## SECTION 21 — SUPER ADMIN EXTENSIONS

| API ID | Method | Endpoint | Auth | Permission | Controller | Criticality | Status |
|---|---|---|---|---|---|---|---|
| API-0353 | GET | /api/super-admin/settings | ADMIN | SUPER_ADMIN | SuperAdminExtensionController.getSystemSettings | CRITICAL | MATCHED |
| API-0354 | PUT | /api/super-admin/settings | ADMIN | SUPER_ADMIN | SuperAdminExtensionController.updateSystemSetting | CRITICAL | MATCHED |
| API-0355 | GET | /api/super-admin/audit-logs | ADMIN | SUPER_ADMIN | SuperAdminExtensionController.getAuditLogs | HIGH | MATCHED |
| API-0356 | GET | /api/super-admin/maintenance | ADMIN | SUPER_ADMIN | SuperAdminExtensionController.getMaintenanceRecords | MEDIUM | MATCHED |
| API-0357 | POST | /api/super-admin/maintenance | ADMIN | SUPER_ADMIN | SuperAdminExtensionController.createMaintenanceRecord | MEDIUM | MATCHED |
| API-0358 | PATCH | /api/super-admin/maintenance/:id/status | ADMIN | SUPER_ADMIN | SuperAdminExtensionController.updateMaintenanceStatus | MEDIUM | MATCHED |
| API-0359 | GET | /api/super-admin/insurance | ADMIN | SUPER_ADMIN | SuperAdminExtensionController.getInsurancePolicies | MEDIUM | MATCHED |
| API-0360 | POST | /api/super-admin/insurance | ADMIN | SUPER_ADMIN | SuperAdminExtensionController.createInsurancePolicy | MEDIUM | MATCHED |
| API-0361 | GET | /api/super-admin/support/tickets | ADMIN | SUPER_ADMIN | SuperAdminExtensionController.getSupportTickets | MEDIUM | MATCHED |
| API-0362 | POST | /api/super-admin/support/tickets | ADMIN | SUPER_ADMIN | SuperAdminExtensionController.createSupportTicket | MEDIUM | MATCHED |
| API-0363 | PATCH | /api/super-admin/support/tickets/:id/status | ADMIN | SUPER_ADMIN | SuperAdminExtensionController.updateSupportTicketStatus | MEDIUM | MATCHED |
| API-0364 | GET | /api/super-admin/commissions/rules | ADMIN | SUPER_ADMIN | SuperAdminExtensionController.getCommissionRules | CRITICAL | MATCHED |
| API-0365 | POST | /api/super-admin/commissions/rules | ADMIN | SUPER_ADMIN | SuperAdminExtensionController.createCommissionRule | CRITICAL | MATCHED |
| API-0366 | GET | /api/super-admin/taxes/config | ADMIN | SUPER_ADMIN | SuperAdminExtensionController.getTaxConfigs | HIGH | MATCHED |
| API-0367 | POST | /api/super-admin/taxes/config | ADMIN | SUPER_ADMIN | SuperAdminExtensionController.createTaxConfig | HIGH | MATCHED |
| API-0368 | GET | /api/super-admin/invoices | ADMIN | SUPER_ADMIN | SuperAdminExtensionController.getInvoices | HIGH | MATCHED |
| API-0369 | POST | /api/super-admin/invoices | ADMIN | SUPER_ADMIN | SuperAdminExtensionController.createInvoice | HIGH | MATCHED |
| API-0370 | GET | /api/super-admin/incentives | ADMIN | SUPER_ADMIN | SuperAdminExtensionController.getIncentivesAndRewards | MEDIUM | MATCHED |
| API-0371 | POST | /api/super-admin/incentives | ADMIN | SUPER_ADMIN | SuperAdminExtensionController.createIncentiveReward | MEDIUM | MATCHED |
| API-0372 | GET | /api/super-admin/jobs | ADMIN | SUPER_ADMIN | SuperAdminExtensionController.getJobAssignments | HIGH | MATCHED |
| API-0373 | POST | /api/super-admin/jobs | ADMIN | SUPER_ADMIN | SuperAdminExtensionController.createJobAssignment | HIGH | MATCHED |
| API-0374 | PATCH | /api/super-admin/jobs/:id/status | ADMIN | SUPER_ADMIN | SuperAdminExtensionController.updateJobStatus | HIGH | MATCHED |

