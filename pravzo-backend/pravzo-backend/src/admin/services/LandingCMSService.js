const LandingCMSRepository = require('../repositories/LandingCMSRepository');
const logger = require('../../../src/utils/logger');

class LandingCMSService {
  
  // ==================== HERO SECTION ====================
  
  async getHero() {
    try {
      const hero = await LandingCMSRepository.getHero();
      
      if (!hero) {
        throw new Error('Hero section not found');
      }
      
      return hero;
    } catch (error) {
      logger.error('LandingCMSService - Get Hero Error:', error);
      throw new Error('Failed to fetch hero section');
    }
  }

  async updateHero(heroData, adminId) {
    try {
      const updatedHero = await LandingCMSRepository.updateHero(heroData, adminId);
      
      logger.info(`Hero section updated by admin ${adminId}`);
      
      return updatedHero;
    } catch (error) {
      logger.error('LandingCMSService - Update Hero Error:', error);
      throw new Error('Failed to update hero section');
    }
  }

  // ==================== STATISTICS ====================
  
  async getStatistics(realtime = false) {
    try {
      let statistics;
      
      if (realtime) {
        // Get real-time data from actual database tables
        statistics = await LandingCMSRepository.getRealtimeStatistics();
      } else {
        // Get saved statistics
        statistics = await LandingCMSRepository.getStatistics();
        
        if (!statistics) {
          // If no stats exist, get realtime
          statistics = await LandingCMSRepository.getRealtimeStatistics();
        }
      }
      
      return statistics;
    } catch (error) {
      logger.error('LandingCMSService - Get Statistics Error:', error);
      throw new Error('Failed to fetch statistics');
    }
  }

  async updateStatistics(statsData, adminId) {
    try {
      const updatedStats = await LandingCMSRepository.updateStatistics(statsData, adminId);
      
      logger.info(`Statistics updated by admin ${adminId}`);
      
      return updatedStats;
    } catch (error) {
      logger.error('LandingCMSService - Update Statistics Error:', error);
      throw new Error('Failed to update statistics');
    }
  }

  async syncStatistics(adminId) {
    try {
      // Get realtime statistics
      const realtimeStats = await LandingCMSRepository.getRealtimeStatistics();
      
      // Update saved statistics
      const updatedStats = await LandingCMSRepository.updateStatistics(realtimeStats, adminId);
      
      logger.info(`Statistics synced from database by admin ${adminId}`);
      
      return updatedStats;
    } catch (error) {
      logger.error('LandingCMSService - Sync Statistics Error:', error);
      throw new Error('Failed to sync statistics');
    }
  }

  // ==================== PARTNERS ====================
  
  async getPartners(filters) {
    try {
      const result = await LandingCMSRepository.getPartners(filters);
      return result;
    } catch (error) {
      logger.error('LandingCMSService - Get Partners Error:', error);
      throw new Error('Failed to fetch partners');
    }
  }

  async getPartnerById(partnerId) {
    try {
      const partner = await LandingCMSRepository.getPartnerById(partnerId);
      
      if (!partner) {
        throw new Error('Partner not found');
      }
      
      return partner;
    } catch (error) {
      logger.error('LandingCMSService - Get Partner By ID Error:', error);
      throw error;
    }
  }

  async createPartner(partnerData, adminId) {
    try {
      const newPartner = await LandingCMSRepository.createPartner(partnerData, adminId);
      
      logger.info(`Partner created by admin ${adminId}:`, newPartner.partner_id);
      
      return newPartner;
    } catch (error) {
      logger.error('LandingCMSService - Create Partner Error:', error);
      throw new Error('Failed to create partner');
    }
  }

  async updatePartner(partnerId, partnerData, adminId) {
    try {
      // Check if partner exists
      await this.getPartnerById(partnerId);
      
      const updatedPartner = await LandingCMSRepository.updatePartner(partnerId, partnerData, adminId);
      
      logger.info(`Partner ${partnerId} updated by admin ${adminId}`);
      
      return updatedPartner;
    } catch (error) {
      logger.error('LandingCMSService - Update Partner Error:', error);
      throw error;
    }
  }

  async deletePartner(partnerId, adminId) {
    try {
      // Check if partner exists
      await this.getPartnerById(partnerId);
      
      await LandingCMSRepository.deletePartner(partnerId);
      
      logger.info(`Partner ${partnerId} deleted by admin ${adminId}`);
      
      return true;
    } catch (error) {
      logger.error('LandingCMSService - Delete Partner Error:', error);
      throw error;
    }
  }

  // ==================== CONTACT ====================
  
  async getContact() {
    try {
      const contact = await LandingCMSRepository.getContact();
      
      if (!contact) {
        throw new Error('Contact information not found');
      }
      
      return contact;
    } catch (error) {
      logger.error('LandingCMSService - Get Contact Error:', error);
      throw new Error('Failed to fetch contact information');
    }
  }

  async updateContact(contactData, adminId) {
    try {
      const updatedContact = await LandingCMSRepository.updateContact(contactData, adminId);
      
      logger.info(`Contact information updated by admin ${adminId}`);
      
      return updatedContact;
    } catch (error) {
      logger.error('LandingCMSService - Update Contact Error:', error);
      throw new Error('Failed to update contact information');
    }
  }

  // ==================== FOOTER ====================
  
  async getFooter() {
    try {
      const footer = await LandingCMSRepository.getFooter();
      
      if (!footer) {
        throw new Error('Footer not found');
      }
      
      return footer;
    } catch (error) {
      logger.error('LandingCMSService - Get Footer Error:', error);
      throw new Error('Failed to fetch footer');
    }
  }

  async updateFooter(footerData, adminId) {
    try {
      const updatedFooter = await LandingCMSRepository.updateFooter(footerData, adminId);
      
      logger.info(`Footer updated by admin ${adminId}`);
      
      return updatedFooter;
    } catch (error) {
      logger.error('LandingCMSService - Update Footer Error:', error);
      throw new Error('Failed to update footer');
    }
  }

  // ==================== CONTACT ENQUIRIES ====================
  
  async getEnquiries(filters) {
    try {
      const result = await LandingCMSRepository.getEnquiries(filters);
      return result;
    } catch (error) {
      logger.error('LandingCMSService - Get Enquiries Error:', error);
      throw new Error('Failed to fetch enquiries');
    }
  }

  async getEnquiryById(enquiryId) {
    try {
      const enquiry = await LandingCMSRepository.getEnquiryById(enquiryId);
      
      if (!enquiry) {
        throw new Error('Enquiry not found');
      }
      
      return enquiry;
    } catch (error) {
      logger.error('LandingCMSService - Get Enquiry By ID Error:', error);
      throw error;
    }
  }

  async createEnquiry(enquiryData) {
    try {
      const newEnquiry = await LandingCMSRepository.createEnquiry(enquiryData);
      
      logger.info('New contact enquiry created:', newEnquiry.enquiry_id);
      
      return newEnquiry;
    } catch (error) {
      logger.error('LandingCMSService - Create Enquiry Error:', error);
      throw new Error('Failed to submit enquiry');
    }
  }

  async updateEnquiryStatus(enquiryId, statusData, adminId) {
    try {
      // Check if enquiry exists
      await this.getEnquiryById(enquiryId);
      
      const updatedEnquiry = await LandingCMSRepository.updateEnquiryStatus(enquiryId, statusData, adminId);
      
      logger.info(`Enquiry ${enquiryId} status updated by admin ${adminId}`);
      
      return updatedEnquiry;
    } catch (error) {
      logger.error('LandingCMSService - Update Enquiry Status Error:', error);
      throw error;
    }
  }

  async assignEnquiry(enquiryId, assignedToAdminId, adminId) {
    try {
      // Check if enquiry exists
      await this.getEnquiryById(enquiryId);
      
      const updatedEnquiry = await LandingCMSRepository.assignEnquiry(enquiryId, assignedToAdminId);
      
      logger.info(`Enquiry ${enquiryId} assigned to admin ${assignedToAdminId} by admin ${adminId}`);
      
      return updatedEnquiry;
    } catch (error) {
      logger.error('LandingCMSService - Assign Enquiry Error:', error);
      throw error;
    }
  }

  async getEnquiryStatistics() {
    try {
      const stats = await LandingCMSRepository.getEnquiryStatistics();
      return stats;
    } catch (error) {
      logger.error('LandingCMSService - Get Enquiry Statistics Error:', error);
      throw new Error('Failed to fetch enquiry statistics');
    }
  }
}

module.exports = new LandingCMSService();


