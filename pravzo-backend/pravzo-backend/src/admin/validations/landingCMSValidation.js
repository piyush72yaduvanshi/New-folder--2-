const { body, param, query } = require('express-validator');

// ==================== HERO VALIDATION ====================

const updateHeroValidation = [
  body('hero_title').notEmpty().withMessage('Hero title is required').trim().isLength({ max: 255 }).withMessage('Title must not exceed 255 characters'),
  body('hero_subtitle').optional().trim().isLength({ max: 255 }).withMessage('Subtitle must not exceed 255 characters'),
  body('hero_description').optional().trim(),
  body('button_text').optional().trim().isLength({ max: 100 }).withMessage('Button text must not exceed 100 characters'),
  body('button_url').optional().trim().isLength({ max: 500 }).withMessage('Button URL must not exceed 500 characters'),
  body('hero_image').optional().trim().isLength({ max: 500 }).withMessage('Hero image URL must not exceed 500 characters')
];

// ==================== STATISTICS VALIDATION ====================

const updateStatisticsValidation = [
  body('total_users').isInt({ min: 0 }).withMessage('Total users must be a positive integer'),
  body('total_riders').isInt({ min: 0 }).withMessage('Total riders must be a positive integer'),
  body('total_bookings').isInt({ min: 0 }).withMessage('Total bookings must be a positive integer'),
  body('total_cities').isInt({ min: 0 }).withMessage('Total cities must be a positive integer'),
  body('total_downloads').isInt({ min: 0 }).withMessage('Total downloads must be a positive integer')
];

// ==================== PARTNERS VALIDATION ====================

const createPartnerValidation = [
  body('partner_name').notEmpty().withMessage('Partner name is required').trim().isLength({ max: 255 }).withMessage('Partner name must not exceed 255 characters'),
  body('partner_logo').notEmpty().withMessage('Partner logo is required').trim().isLength({ max: 500 }).withMessage('Logo URL must not exceed 500 characters'),
  body('partner_website').optional().trim().isURL().withMessage('Invalid website URL').isLength({ max: 500 }).withMessage('Website URL must not exceed 500 characters'),
  body('display_order').optional().isInt({ min: 0 }).withMessage('Display order must be a positive integer')
];

const updatePartnerValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid partner ID'),
  body('partner_name').notEmpty().withMessage('Partner name is required').trim().isLength({ max: 255 }).withMessage('Partner name must not exceed 255 characters'),
  body('partner_logo').notEmpty().withMessage('Partner logo is required').trim().isLength({ max: 500 }).withMessage('Logo URL must not exceed 500 characters'),
  body('partner_website').optional().trim().isURL().withMessage('Invalid website URL').isLength({ max: 500 }).withMessage('Website URL must not exceed 500 characters'),
  body('display_order').optional().isInt({ min: 0 }).withMessage('Display order must be a positive integer'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
];

const partnerIdValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid partner ID')
];

// ==================== CONTACT VALIDATION ====================

const updateContactValidation = [
  body('support_email').notEmpty().withMessage('Support email is required').isEmail().withMessage('Invalid email format').trim().isLength({ max: 255 }).withMessage('Email must not exceed 255 characters'),
  body('support_phone').notEmpty().withMessage('Support phone is required').trim().isLength({ max: 20 }).withMessage('Phone must not exceed 20 characters'),
  body('office_address').notEmpty().withMessage('Office address is required').trim(),
  body('google_map_url').optional().trim().isLength({ max: 1000 }).withMessage('Map URL must not exceed 1000 characters'),
  body('facebook_url').optional().trim().isURL().withMessage('Invalid Facebook URL').isLength({ max: 500 }).withMessage('URL must not exceed 500 characters'),
  body('instagram_url').optional().trim().isURL().withMessage('Invalid Instagram URL').isLength({ max: 500 }).withMessage('URL must not exceed 500 characters'),
  body('linkedin_url').optional().trim().isURL().withMessage('Invalid LinkedIn URL').isLength({ max: 500 }).withMessage('URL must not exceed 500 characters'),
  body('twitter_url').optional().trim().isURL().withMessage('Invalid Twitter URL').isLength({ max: 500 }).withMessage('URL must not exceed 500 characters'),
  body('youtube_url').optional().trim().isURL().withMessage('Invalid YouTube URL').isLength({ max: 500 }).withMessage('URL must not exceed 500 characters')
];

// ==================== FOOTER VALIDATION ====================

const updateFooterValidation = [
  body('copyright_text').notEmpty().withMessage('Copyright text is required').trim().isLength({ max: 255 }).withMessage('Copyright text must not exceed 255 characters'),
  body('about_text').optional().trim(),
  body('quick_links').optional().isArray().withMessage('Quick links must be an array'),
  body('quick_links.*.title').optional().trim(),
  body('quick_links.*.url').optional().trim(),
  body('footer_email').optional().isEmail().withMessage('Invalid email format').trim(),
  body('footer_phone').optional().trim().isLength({ max: 20 }).withMessage('Phone must not exceed 20 characters'),
  body('footer_address').optional().trim()
];

// ==================== ENQUIRY VALIDATION ====================

const createEnquiryValidation = [
  body('name').notEmpty().withMessage('Name is required').trim().isLength({ max: 255 }).withMessage('Name must not exceed 255 characters'),
  body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format').trim().isLength({ max: 255 }).withMessage('Email must not exceed 255 characters'),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Phone must not exceed 20 characters'),
  body('subject').optional().trim().isLength({ max: 500 }).withMessage('Subject must not exceed 500 characters'),
  body('message').notEmpty().withMessage('Message is required').trim()
];

const updateEnquiryStatusValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid enquiry ID'),
  body('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).withMessage('Invalid status'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
  body('admin_notes').optional().trim()
];

const assignEnquiryValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid enquiry ID'),
  body('assigned_to').isInt({ min: 1 }).withMessage('Invalid admin ID')
];

const enquiryIdValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid enquiry ID')
];

module.exports = {
  // Hero
  updateHeroValidation,
  
  // Statistics
  updateStatisticsValidation,
  
  // Partners
  createPartnerValidation,
  updatePartnerValidation,
  partnerIdValidation,
  
  // Contact
  updateContactValidation,
  
  // Footer
  updateFooterValidation,
  
  // Enquiries
  createEnquiryValidation,
  updateEnquiryStatusValidation,
  assignEnquiryValidation,
  enquiryIdValidation
};


