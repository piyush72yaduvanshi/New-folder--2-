const express = require('express');
const router = express.Router();
const LandingCMSController = require('../controllers/LandingCMSController');
const {
  createEnquiryValidation,
  enquiryIdValidation
} = require('../validations/landingCMSValidation');

// ==================== PUBLIC ROUTES (No Authentication Required) ====================

// ==================== HERO SECTION ====================
router.get('/hero', LandingCMSController.getHero);

// ==================== STATISTICS ====================
router.get('/statistics', LandingCMSController.getStatistics);

// ==================== PARTNERS ====================
router.get('/partners', LandingCMSController.getPartners);

// ==================== CONTACT ====================
router.get('/contact', LandingCMSController.getContact);

// ==================== FOOTER ====================
router.get('/footer', LandingCMSController.getFooter);

// ==================== CONTACT ENQUIRIES ====================
// Public endpoint for submitting contact enquiries
router.post(
  '/enquiries',
  createEnquiryValidation,
  LandingCMSController.createEnquiry
);

module.exports = router;

