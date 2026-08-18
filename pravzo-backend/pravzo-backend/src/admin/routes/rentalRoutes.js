const express = require('express');
const router = express.Router();
const RentalController = require('../controllers/RentalController');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const {
  getRentalsValidation,
  getRentalByIdValidation,
  pickupValidation,
  returnValidation,
  extendValidation,
  cancelValidation,
  forceCloseValidation,
  manualInspectionValidation,
  manualChecklistValidation
} = require('../validations/rentalValidation');

// Global authentication check
router.use(authMiddleware);

// ==================== OPERATIONAL ADMIN / SUPER_ADMIN ROUTES ====================

// Generate Pickup OTP
router.post(
  '/:id/otp',
  getRentalByIdValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  RentalController.generatePickupOTP
);

// Pickup Vehicle
router.patch(
  '/:id/pickup',
  pickupValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  RentalController.pickupRental
);

// Return Vehicle
router.patch(
  '/:id/return',
  returnValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  RentalController.returnRental
);

// Extend Rental
router.patch(
  '/:id/extend',
  extendValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  RentalController.extendRental
);

// Record Vehicle Inspection
router.post(
  '/:id/inspection',
  manualInspectionValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  RentalController.recordInspection
);

// Record Checklist
router.post(
  '/:id/checklist',
  manualChecklistValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  RentalController.recordChecklist
);

// ==================== SUPER_ADMIN ONLY ROUTES ====================

// Get Overdue Rentals (Must be BEFORE /:id parameter route to prevent routing collision)
router.get(
  '/overdue',
  permissionMiddleware(['SUPER_ADMIN']),
  RentalController.getOverdueRentals
);

// Get list of rentals (Search / pagination / filter)
router.get(
  '/',
  getRentalsValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  RentalController.getRentals
);

// Get rental details by ID
router.get(
  '/:id',
  getRentalByIdValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  RentalController.getRentalById
);

// Cancel rental booking
router.patch(
  '/:id/cancel',
  cancelValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  RentalController.cancelRental
);

// Force close active/overdue rental
router.patch(
  '/:id/force-close',
  forceCloseValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  RentalController.forceCloseRental
);

// Get invoice detail
router.get(
  '/:id/invoice',
  getRentalByIdValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  RentalController.getRentalInvoice
);

// Get payment logs
router.get(
  '/:id/payment-history',
  getRentalByIdValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  RentalController.getPaymentHistory
);

// Get timeline activity logs
router.get(
  '/:id/timeline',
  getRentalByIdValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  RentalController.getTimeline
);

// Get damage reports
router.get(
  '/:id/damage-report',
  getRentalByIdValidation,
  permissionMiddleware(['SUPER_ADMIN']),
  RentalController.getDamageReport
);

module.exports = router;

