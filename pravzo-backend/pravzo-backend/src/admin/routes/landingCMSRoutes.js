const express = require('express');
const router = express.Router();
const LandingCMSController = require('../controllers/LandingCMSController');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const {
  updateHeroValidation,
  updateStatisticsValidation,
  createPartnerValidation,
  updatePartnerValidation,
  partnerIdValidation,
  updateContactValidation,
  updateFooterValidation,
  updateEnquiryStatusValidation,
  assignEnquiryValidation,
  enquiryIdValidation
} = require('../validations/landingCMSValidation');

// All routes require authentication
router.use(authMiddleware);

// ==================== HERO SECTION ====================

router.get(
  '/hero',
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  LandingCMSController.getHero
);

router.patch(
  '/hero',
  updateHeroValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  LandingCMSController.updateHero
);

// ==================== STATISTICS ====================

router.get(
  '/statistics',
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  LandingCMSController.getStatistics
);

router.patch(
  '/statistics',
  updateStatisticsValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  LandingCMSController.updateStatistics
);

router.post(
  '/statistics/sync',
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  LandingCMSController.syncStatistics
);

// ==================== PARTNERS ====================

router.get(
  '/partners',
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  LandingCMSController.getPartners
);

router.get(
  '/partners/:id',
  partnerIdValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  LandingCMSController.getPartnerById
);

router.post(
  '/partners',
  createPartnerValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  LandingCMSController.createPartner
);

router.patch(
  '/partners/:id',
  updatePartnerValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  LandingCMSController.updatePartner
);

router.delete(
  '/partners/:id',
  partnerIdValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  LandingCMSController.deletePartner
);

// ==================== CONTACT ====================

router.get(
  '/contact',
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  LandingCMSController.getContact
);

router.patch(
  '/contact',
  updateContactValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  LandingCMSController.updateContact
);

// ==================== FOOTER ====================

router.get(
  '/footer',
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  LandingCMSController.getFooter
);

router.patch(
  '/footer',
  updateFooterValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  LandingCMSController.updateFooter
);

// ==================== CONTACT ENQUIRIES ====================

router.get(
  '/enquiries',
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  LandingCMSController.getEnquiries
);

router.get(
  '/enquiries/statistics',
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  LandingCMSController.getEnquiryStatistics
);

router.get(
  '/enquiries/:id',
  enquiryIdValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  LandingCMSController.getEnquiryById
);

router.patch(
  '/enquiries/:id/status',
  updateEnquiryStatusValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  LandingCMSController.updateEnquiryStatus
);

router.patch(
  '/enquiries/:id/assign',
  assignEnquiryValidation,
  permissionMiddleware(['SUPER_ADMIN', 'ADMIN']),
  LandingCMSController.assignEnquiry
);

module.exports = router;


