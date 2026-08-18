const db = require('../../../src/config/db');

class LandingCMSRepository {
  
  // ==================== HERO SECTION ====================
  
  async getHero() {
    const [rows] = await db.query(
      `SELECT * FROM landing_hero WHERE is_active = 1 ORDER BY hero_id DESC LIMIT 1`
    );
    return rows[0] || null;
  }

  async updateHero(heroData, adminId) {
    const { hero_title, hero_subtitle, hero_description, button_text, button_url, hero_image } = heroData;
    
    // Check if hero exists
    const existing = await this.getHero();
    
    if (existing) {
      // Update existing
      await db.query(
        `UPDATE landing_hero 
         SET hero_title = ?, hero_subtitle = ?, hero_description = ?, 
             button_text = ?, button_url = ?, hero_image = ?, updated_by = ?
         WHERE hero_id = ?`,
        [hero_title, hero_subtitle, hero_description, button_text, button_url, hero_image, adminId, existing.hero_id]
      );
      return { ...existing, ...heroData };
    } else {
      // Insert new
      const [result] = await db.query(
        `INSERT INTO landing_hero 
         (hero_title, hero_subtitle, hero_description, button_text, button_url, hero_image, updated_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [hero_title, hero_subtitle, hero_description, button_text, button_url, hero_image, adminId]
      );
      return { hero_id: result.insertId, ...heroData };
    }
  }

  // ==================== STATISTICS ====================
  
  async getStatistics() {
    const [rows] = await db.query(
      `SELECT * FROM landing_statistics ORDER BY stat_id DESC LIMIT 1`
    );
    return rows[0] || null;
  }

  async updateStatistics(statsData, adminId) {
    const { total_users, total_riders, total_bookings, total_cities, total_downloads } = statsData;
    
    // Check if stats exist
    const existing = await this.getStatistics();
    
    if (existing) {
      // Update existing
      await db.query(
        `UPDATE landing_statistics 
         SET total_users = ?, total_riders = ?, total_bookings = ?, 
             total_cities = ?, total_downloads = ?, last_updated_by = ?
         WHERE stat_id = ?`,
        [total_users, total_riders, total_bookings, total_cities, total_downloads, adminId, existing.stat_id]
      );
      return { ...existing, ...statsData };
    } else {
      // Insert new
      const [result] = await db.query(
        `INSERT INTO landing_statistics 
         (total_users, total_riders, total_bookings, total_cities, total_downloads, last_updated_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [total_users, total_riders, total_bookings, total_cities, total_downloads, adminId]
      );
      return { stat_id: result.insertId, ...statsData };
    }
  }

  async getRealtimeStatistics() {
    const [[userCount]]   = await db.query('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL');
    const [[riderCount]]  = await db.query('SELECT COUNT(*) as count FROM riders WHERE deleted_at IS NULL');
    const [[tripCount]]   = await db.query('SELECT COUNT(*) as count FROM bookings');
    const [[cityCount]]   = await db.query('SELECT COUNT(DISTINCT assigned_city) as count FROM riders WHERE assigned_city IS NOT NULL AND deleted_at IS NULL');

    return {
      total_users:     userCount.count,
      total_riders:    riderCount.count,
      total_bookings:  tripCount.count,
      total_cities:    cityCount.count || 0,
      total_downloads: 0
    };
  }

  // ==================== PARTNERS ====================
  
  async getPartners(filters = {}) {
    const { page = 1, limit = 20, is_active = null } = filters;
    const offset = (page - 1) * limit;
    const conditions = ['p.deleted_at IS NULL'];
    const params = [];

    if (is_active !== null) {
      conditions.push('p.is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM landing_partners p ${whereClause}`;
    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0].total;

    // Get paginated data
    const dataQuery = `
      SELECT 
        p.*,
        a.full_name as created_by_name
      FROM landing_partners p
      LEFT JOIN users a ON p.created_by = a.user_id
      ${whereClause}
      ORDER BY p.display_order ASC, p.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await db.query(dataQuery, [...params, parseInt(limit), parseInt(offset)]);

    return {
      partners: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getPartnerById(partnerId) {
    const [rows] = await db.query(
      `SELECT * FROM landing_partners WHERE partner_id = ? AND deleted_at IS NULL`,
      [partnerId]
    );
    return rows[0] || null;
  }

  async createPartner(partnerData, adminId) {
    const { partner_name, partner_logo, partner_website, display_order } = partnerData;
    
    const [result] = await db.query(
      `INSERT INTO landing_partners 
       (partner_name, partner_logo, partner_website, display_order, created_by) 
       VALUES (?, ?, ?, ?, ?)`,
      [partner_name, partner_logo, partner_website || null, display_order || 0, adminId]
    );
    
    return { partner_id: result.insertId, ...partnerData };
  }

  async updatePartner(partnerId, partnerData, adminId) {
    const { partner_name, partner_logo, partner_website, display_order, is_active } = partnerData;
    
    await db.query(
      `UPDATE landing_partners 
       SET partner_name = ?, partner_logo = ?, partner_website = ?, 
           display_order = ?, is_active = ?
       WHERE partner_id = ? AND deleted_at IS NULL`,
      [partner_name, partner_logo, partner_website, display_order, is_active, partnerId]
    );
    
    return await this.getPartnerById(partnerId);
  }

  async deletePartner(partnerId) {
    await db.query(
      `UPDATE landing_partners SET deleted_at = NOW() WHERE partner_id = ?`,
      [partnerId]
    );
    return true;
  }

  // ==================== CONTACT ====================
  
  async getContact() {
    const [rows] = await db.query(
      `SELECT * FROM landing_contact WHERE is_active = 1 ORDER BY contact_id DESC LIMIT 1`
    );
    return rows[0] || null;
  }

  async updateContact(contactData, adminId) {
    const {
      support_email,
      support_phone,
      office_address,
      google_map_url,
      facebook_url,
      instagram_url,
      linkedin_url,
      twitter_url,
      youtube_url
    } = contactData;
    
    const existing = await this.getContact();
    
    if (existing) {
      await db.query(
        `UPDATE landing_contact 
         SET support_email = ?, support_phone = ?, office_address = ?, 
             google_map_url = ?, facebook_url = ?, instagram_url = ?, 
             linkedin_url = ?, twitter_url = ?, youtube_url = ?, updated_by = ?
         WHERE contact_id = ?`,
        [support_email, support_phone, office_address, google_map_url, 
         facebook_url, instagram_url, linkedin_url, twitter_url, youtube_url, 
         adminId, existing.contact_id]
      );
      return { ...existing, ...contactData };
    } else {
      const [result] = await db.query(
        `INSERT INTO landing_contact 
         (support_email, support_phone, office_address, google_map_url, 
          facebook_url, instagram_url, linkedin_url, twitter_url, youtube_url, updated_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [support_email, support_phone, office_address, google_map_url, 
         facebook_url, instagram_url, linkedin_url, twitter_url, youtube_url, adminId]
      );
      return { contact_id: result.insertId, ...contactData };
    }
  }

  // ==================== FOOTER ====================
  
  async getFooter() {
    const [rows] = await db.query(
      `SELECT * FROM landing_footer WHERE is_active = 1 ORDER BY footer_id DESC LIMIT 1`
    );
    
    if (rows[0] && rows[0].quick_links) {
      try {
        rows[0].quick_links = JSON.parse(rows[0].quick_links);
      } catch (e) {
        rows[0].quick_links = [];
      }
    }
    
    return rows[0] || null;
  }

  async updateFooter(footerData, adminId) {
    const {
      copyright_text,
      about_text,
      quick_links,
      footer_email,
      footer_phone,
      footer_address
    } = footerData;
    
    // Convert quick_links array to JSON string
    const quickLinksJson = quick_links ? JSON.stringify(quick_links) : null;
    
    const existing = await this.getFooter();
    
    if (existing) {
      await db.query(
        `UPDATE landing_footer 
         SET copyright_text = ?, about_text = ?, quick_links = ?, 
             footer_email = ?, footer_phone = ?, footer_address = ?, updated_by = ?
         WHERE footer_id = ?`,
        [copyright_text, about_text, quickLinksJson, footer_email, footer_phone, footer_address, adminId, existing.footer_id]
      );
      return { ...existing, ...footerData, quick_links };
    } else {
      const [result] = await db.query(
        `INSERT INTO landing_footer 
         (copyright_text, about_text, quick_links, footer_email, footer_phone, footer_address, updated_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [copyright_text, about_text, quickLinksJson, footer_email, footer_phone, footer_address, adminId]
      );
      return { footer_id: result.insertId, ...footerData, quick_links };
    }
  }

  // ==================== CONTACT ENQUIRIES ====================
  
  async getEnquiries(filters = {}) {
    const { page = 1, limit = 20, status = null, priority = null, assigned_to = null } = filters;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (priority) {
      conditions.push('priority = ?');
      params.push(priority);
    }

    if (assigned_to) {
      conditions.push('assigned_to = ?');
      params.push(assigned_to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM contact_enquiries ${whereClause}`;
    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0].total;

    // Get paginated data
    const dataQuery = `
      SELECT 
        e.*,
        a.full_name as assigned_to_name
      FROM contact_enquiries e
      LEFT JOIN users a ON e.assigned_to = a.user_id
      ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await db.query(dataQuery, [...params, parseInt(limit), parseInt(offset)]);

    return {
      enquiries: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getEnquiryById(enquiryId) {
    const [rows] = await db.query(
      `SELECT 
        e.*,
        a.full_name as assigned_to_name
       FROM contact_enquiries e
       LEFT JOIN users a ON e.assigned_to = a.user_id
       WHERE e.enquiry_id = ?`,
      [enquiryId]
    );
    return rows[0] || null;
  }

  async createEnquiry(enquiryData) {
    const { name, email, phone, subject, message, ip_address, user_agent } = enquiryData;
    
    const [result] = await db.query(
      `INSERT INTO contact_enquiries 
       (name, email, phone, subject, message, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email, phone || null, subject || null, message, ip_address || null, user_agent || null]
    );
    
    return { enquiry_id: result.insertId, ...enquiryData };
  }

  async updateEnquiryStatus(enquiryId, statusData, adminId) {
    const { status, priority, admin_notes } = statusData;
    
    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
      if (status === 'RESOLVED' || status === 'CLOSED') {
        updates.push('resolved_at = NOW()');
      }
    }

    if (priority) {
      updates.push('priority = ?');
      params.push(priority);
    }

    if (admin_notes) {
      updates.push('admin_notes = ?');
      params.push(admin_notes);
    }

    params.push(enquiryId);

    await db.query(
      `UPDATE contact_enquiries SET ${updates.join(', ')} WHERE enquiry_id = ?`,
      params
    );
    
    return await this.getEnquiryById(enquiryId);
  }

  async assignEnquiry(enquiryId, adminId) {
    await db.query(
      `UPDATE contact_enquiries SET assigned_to = ? WHERE enquiry_id = ?`,
      [adminId, enquiryId]
    );
    
    return await this.getEnquiryById(enquiryId);
  }

  async getEnquiryStatistics() {
    const [[stats]] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END) as closed
      FROM contact_enquiries
    `);
    
    return stats;
  }
}

module.exports = new LandingCMSRepository();


