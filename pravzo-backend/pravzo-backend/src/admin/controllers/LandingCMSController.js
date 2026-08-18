const LandingCMSService = require('../services/LandingCMSService');
const { successResponse, errorResponse } = require('../../../src/utils/response');
const { validationResult } = require('express-validator');
const logger = require('../../../src/utils/logger');

// ==================== HERO SECTION ====================

const getHero = async (req, res) => {
  try {
    const hero = await LandingCMSService.getHero();
    return successResponse(res, 200, 'Hero section retrieved successfully', hero);
  } catch (error) {
    logger.error('Get Hero Controller Error:', error);
    return errorResponse(res, 500, error.message);
  }
};

const updateHero = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const adminId = req.admin.admin_id;
    const updatedHero = await LandingCMSService.updateHero(req.body, adminId);
    
    return successResponse(res, 200, 'Hero section updated successfully', updatedHero);
  } catch (error) {
    logger.error('Update Hero Controller Error:', error);
    return errorResponse(res, 500, error.message);
  }
};

// ==================== STATISTICS ====================

const getStatistics = async (req, res) => {
  try {
    const { realtime } = req.query;
    const statistics = await LandingCMSService.getStatistics(realtime === 'true');
    
    return successResponse(res, 200, 'Statistics retrieved successfully', statistics);
  } catch (error) {
    logger.error('Get Statistics Controller Error:', error);
    return errorResponse(res, 500, error.message);
  }
};

const updateStatistics = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const adminId = req.admin.admin_id;
    const updatedStats = await LandingCMSService.updateStatistics(req.body, adminId);
    
    return successResponse(res, 200, 'Statistics updated successfully', updatedStats);
  } catch (error) {
    logger.error('Update Statistics Controller Error:', error);
    return errorResponse(res, 500, error.message);
  }
};

const syncStatistics = async (req, res) => {
  try {
    const adminId = req.admin.admin_id;
    const syncedStats = await LandingCMSService.syncStatistics(adminId);
    
    return successResponse(res, 200, 'Statistics synced from database successfully', syncedStats);
  } catch (error) {
    logger.error('Sync Statistics Controller Error:', error);
    return errorResponse(res, 500, error.message);
  }
};

// ==================== PARTNERS ====================

const getPartners = async (req, res) => {
  try {
    const { page, limit, is_active } = req.query;
    
    const filters = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      is_active: is_active !== undefined ? is_active === 'true' : null
    };

    const result = await LandingCMSService.getPartners(filters);
    
    return successResponse(res, 200, 'Partners retrieved successfully', result);
  } catch (error) {
    logger.error('Get Partners Controller Error:', error);
    return errorResponse(res, 500, error.message);
  }
};

const getPartnerById = async (req, res) => {
  try {
    const { id } = req.params;
    const partner = await LandingCMSService.getPartnerById(id);
    
    return successResponse(res, 200, 'Partner retrieved successfully', partner);
  } catch (error) {
    logger.error('Get Partner By ID Controller Error:', error);
    return errorResponse(res, 404, error.message);
  }
};

const createPartner = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const adminId = req.admin.admin_id;
    const newPartner = await LandingCMSService.createPartner(req.body, adminId);
    
    return successResponse(res, 201, 'Partner created successfully', newPartner);
  } catch (error) {
    logger.error('Create Partner Controller Error:', error);
    return errorResponse(res, 500, error.message);
  }
};

const updatePartner = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const { id } = req.params;
    const adminId = req.admin.admin_id;
    const updatedPartner = await LandingCMSService.updatePartner(id, req.body, adminId);
    
    return successResponse(res, 200, 'Partner updated successfully', updatedPartner);
  } catch (error) {
    logger.error('Update Partner Controller Error:', error);
    return errorResponse(res, error.message.includes('not found') ? 404 : 500, error.message);
  }
};

const deletePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin.admin_id;
    await LandingCMSService.deletePartner(id, adminId);
    
    return successResponse(res, 200, 'Partner deleted successfully');
  } catch (error) {
    logger.error('Delete Partner Controller Error:', error);
    return errorResponse(res, error.message === 'Partner not found' ? 404 : 500, error.message);
  }
};

// ==================== CONTACT ====================

const getContact = async (req, res) => {
  try {
    const contact = await LandingCMSService.getContact();
    return successResponse(res, 200, 'Contact information retrieved successfully', contact);
  } catch (error) {
    logger.error('Get Contact Controller Error:', error);
    return errorResponse(res, 500, error.message);
  }
};

const updateContact = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const adminId = req.admin.admin_id;
    const updatedContact = await LandingCMSService.updateContact(req.body, adminId);
    
    return successResponse(res, 200, 'Contact information updated successfully', updatedContact);
  } catch (error) {
    logger.error('Update Contact Controller Error:', error);
    return errorResponse(res, 500, error.message);
  }
};

// ==================== FOOTER ====================

const getFooter = async (req, res) => {
  try {
    const footer = await LandingCMSService.getFooter();
    return successResponse(res, 200, 'Footer retrieved successfully', footer);
  } catch (error) {
    logger.error('Get Footer Controller Error:', error);
    return errorResponse(res, 500, error.message);
  }
};

const updateFooter = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const adminId = req.admin.admin_id;
    const updatedFooter = await LandingCMSService.updateFooter(req.body, adminId);
    
    return successResponse(res, 200, 'Footer updated successfully', updatedFooter);
  } catch (error) {
    logger.error('Update Footer Controller Error:', error);
    return errorResponse(res, 500, error.message);
  }
};

// ==================== CONTACT ENQUIRIES ====================

const getEnquiries = async (req, res) => {
  try {
    const { page, limit, status, priority, assigned_to } = req.query;
    
    const filters = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      status,
      priority,
      assigned_to: assigned_to ? parseInt(assigned_to) : null
    };

    const result = await LandingCMSService.getEnquiries(filters);
    
    return successResponse(res, 200, 'Enquiries retrieved successfully', result);
  } catch (error) {
    logger.error('Get Enquiries Controller Error:', error);
    return errorResponse(res, 500, error.message);
  }
};

const getEnquiryById = async (req, res) => {
  try {
    const { id } = req.params;
    const enquiry = await LandingCMSService.getEnquiryById(id);
    
    return successResponse(res, 200, 'Enquiry retrieved successfully', enquiry);
  } catch (error) {
    logger.error('Get Enquiry By ID Controller Error:', error);
    return errorResponse(res, 404, error.message);
  }
};

const createEnquiry = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    // Get IP address and user agent
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('user-agent');

    const enquiryData = {
      ...req.body,
      ip_address,
      user_agent
    };

    const newEnquiry = await LandingCMSService.createEnquiry(enquiryData);
    
    return successResponse(res, 201, 'Your enquiry has been submitted successfully. We will contact you soon.', newEnquiry);
  } catch (error) {
    logger.error('Create Enquiry Controller Error:', error);
    return errorResponse(res, 500, error.message);
  }
};

const updateEnquiryStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const { id } = req.params;
    const adminId = req.admin.admin_id;
    const updatedEnquiry = await LandingCMSService.updateEnquiryStatus(id, req.body, adminId);
    
    return successResponse(res, 200, 'Enquiry status updated successfully', updatedEnquiry);
  } catch (error) {
    logger.error('Update Enquiry Status Controller Error:', error);
    return errorResponse(res, 500, error.message);
  }
};

const assignEnquiry = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const { id } = req.params;
    const { assigned_to } = req.body;
    const adminId = req.admin.admin_id;
    
    const updatedEnquiry = await LandingCMSService.assignEnquiry(id, assigned_to, adminId);
    
    return successResponse(res, 200, 'Enquiry assigned successfully', updatedEnquiry);
  } catch (error) {
    logger.error('Assign Enquiry Controller Error:', error);
    return errorResponse(res, 500, error.message);
  }
};

const getEnquiryStatistics = async (req, res) => {
  try {
    const statistics = await LandingCMSService.getEnquiryStatistics();
    
    return successResponse(res, 200, 'Enquiry statistics retrieved successfully', statistics);
  } catch (error) {
    logger.error('Get Enquiry Statistics Controller Error:', error);
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  // Hero
  getHero,
  updateHero,
  
  // Statistics
  getStatistics,
  updateStatistics,
  syncStatistics,
  
  // Partners
  getPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  deletePartner,
  
  // Contact
  getContact,
  updateContact,
  
  // Footer
  getFooter,
  updateFooter,
  
  // Enquiries
  getEnquiries,
  getEnquiryById,
  createEnquiry,
  updateEnquiryStatus,
  assignEnquiry,
  getEnquiryStatistics
};


