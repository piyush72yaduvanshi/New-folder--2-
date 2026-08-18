'use strict';

const db = require('../../../src/config/db');
const logger = require('../../../src/utils/logger');
const { deleteCache } = require('../../../src/user/services/cacheService');

class KYCRepository {

  /**
   * Helper: ensure any users or riders who have submitted KYC or documents
   * have a corresponding entry in the `kyc` table so they appear in Admin.
   */
  async ensureSynced() {
    try {
      await db.query(`
        INSERT INTO kyc (user_id, kyc_type, status, created_at, updated_at)
        SELECT u.user_id, 'STANDARD',
               CASE
                 WHEN r.kyc_status IS NOT NULL AND r.kyc_status != 'NOT_SUBMITTED' THEN r.kyc_status
                 WHEN up.kyc_status IS NOT NULL AND up.kyc_status != 'NOT_SUBMITTED' THEN up.kyc_status
                 ELSE 'PENDING'
               END,
               u.created_at, NOW()
        FROM users u
        LEFT JOIN user_profiles up ON u.user_id = up.user_id
        LEFT JOIN riders r ON u.user_id = r.user_id
        LEFT JOIN kyc k ON u.user_id = k.user_id
        WHERE k.kyc_id IS NULL
          AND u.deleted_at IS NULL
          AND (
            (up.kyc_status IS NOT NULL AND up.kyc_status != 'NOT_SUBMITTED')
            OR (r.kyc_status IS NOT NULL AND r.kyc_status != 'NOT_SUBMITTED')
            OR EXISTS (SELECT 1 FROM user_documents ud WHERE ud.user_id = u.user_id)
          )
        ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at)
      `);
    } catch (err) {
      logger.debug('ensureSynced kyc notice:', { error: err.message });
    }
  }

  // ==================== KYC QUERIES ====================

  async findById(kycId) {
    await this.ensureSynced();
    const cleanId = parseInt(String(kycId).replace(/\D/g, ''), 10) || kycId;
    try {
      const [rows] = await db.query(
        `SELECT
           k.kyc_id,
           k.user_id,
           k.kyc_type,
           k.status AS verification_status,
           k.status,
           k.verified_by,
           k.verified_at,
           k.remarks,
           k.remarks AS admin_remarks,
           k.created_at,
           k.updated_at,
           u.full_name,
           u.phone AS phone_number,
           u.email,
           u.profile_image AS selfie_url,
           COALESCE(up.city, r.assigned_city, 'N/A') AS city,
           up.date_of_birth,
           up.gender,
           up.address,
           dl.document_number AS driving_license_number,
           dl.file_url AS driving_license_photo,
           dl.file_url_back AS driving_license_back_photo,
           aadhar.document_number AS aadhar_number,
           aadhar.file_url AS aadhar_card_photo,
           aadhar.file_url_back AS aadhar_card_back_photo,
           r.rider_id,
           r.bank_account_number,
           r.ifsc_code,
           r.account_holder_name,
           r.kyc_status AS rider_kyc_status,
           a.full_name AS verified_by_name,
           a.email AS verified_by_email
         FROM kyc k
         INNER JOIN users u ON k.user_id = u.user_id
         LEFT JOIN user_profiles up ON k.user_id = up.user_id
         LEFT JOIN (
           SELECT user_id, document_number, file_url, file_url_back, document_type
           FROM user_documents WHERE document_type = 'DL'
         ) dl ON k.user_id = dl.user_id
         LEFT JOIN (
           SELECT user_id, document_number, file_url, file_url_back, document_type
           FROM user_documents WHERE document_type = 'AADHAR'
         ) aadhar ON k.user_id = aadhar.user_id
         LEFT JOIN riders r ON k.user_id = r.user_id
         LEFT JOIN users a ON k.verified_by = a.user_id
         WHERE k.user_id = ? OR k.kyc_id = ?
         ORDER BY (k.user_id = ?) DESC
         LIMIT 1`,
        [cleanId, cleanId, cleanId]
      );
      if (rows.length > 0) return rows[0];
    } catch (err) {
      logger.error('KYCRepository findById error:', err);
    }

    return null;
  }

  /**
   * Get paginated KYC list
   */
  async getKYCList(filters = {}, pagination = {}) {
    await this.ensureSynced();

    const {
      search = '',
      status = null,
      verificationType = null,
      city = null,
      startDate = null,
      endDate = null,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = filters;

    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const conditions = ['u.deleted_at IS NULL'];
    const params = [];

    if (search) {
      conditions.push('(u.full_name LIKE ? OR u.phone LIKE ? OR u.email LIKE ? OR CAST(k.user_id AS CHAR) LIKE ?)');
      const sp = `%${search}%`;
      const cleanSearch = search.replace(/\D/g, '');
      params.push(sp, sp, sp, `%${cleanSearch || search}%`);
    }

    if (status) {
      conditions.push('k.status = ?');
      params.push(status);
    }

    if (city) {
      conditions.push('(up.city = ? OR r.assigned_city = ?)');
      params.push(city, city);
    }

    if (startDate) {
      conditions.push('k.created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('k.created_at <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSortColumns = {
      created_at: 'k.created_at',
      verified_at: 'k.verified_at',
      user_id: 'k.user_id',
      status: 'k.status'
    };
    const orderColumn = allowedSortColumns[sortBy] || 'k.created_at';
    const orderDirection = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    try {
      const [[{ total }]] = await db.query(
        `SELECT COUNT(*) AS total
         FROM kyc k
         INNER JOIN users u ON k.user_id = u.user_id
         LEFT JOIN user_profiles up ON k.user_id = up.user_id
         LEFT JOIN riders r ON k.user_id = r.user_id
         ${whereClause}`,
        params
      );

      const [rows] = await db.query(
        `SELECT
           k.kyc_id,
           k.user_id,
           r.rider_id,
           k.kyc_type,
           k.status AS verification_status,
           k.status,
           k.verified_by,
           k.verified_at,
           k.remarks AS admin_remarks,
           k.created_at,
           k.updated_at,
           k.updated_at AS submitted_at,
           u.full_name,
           u.phone AS phone_number,
           u.email,
           u.profile_image AS selfie_url,
           COALESCE(up.city, r.assigned_city, 'N/A') AS city,
           COALESCE(dl.document_number, aadhar.document_number, ud_any.document_number, 'N/A') AS document_number,
           COALESCE(dl.file_url, aadhar.file_url, ud_any.file_url, kd.file_url) AS front_image_url,
           COALESCE(dl.file_url_back, aadhar.file_url_back, ud_any.file_url_back) AS back_image_url,
           COALESCE(dl.document_type, aadhar.document_type, ud_any.document_type, kd.document_type, k.kyc_type, 'USER_KYC') AS document_type,
           a.full_name AS verified_by_name
         FROM kyc k
         INNER JOIN users u ON k.user_id = u.user_id
         LEFT JOIN user_profiles up ON k.user_id = up.user_id
         LEFT JOIN riders r ON k.user_id = r.user_id
         LEFT JOIN (
           SELECT user_id, document_number, file_url, file_url_back, document_type
           FROM user_documents WHERE document_type = 'DL'
         ) dl ON k.user_id = dl.user_id
         LEFT JOIN (
           SELECT user_id, document_number, file_url, file_url_back, document_type
           FROM user_documents WHERE document_type = 'AADHAR'
         ) aadhar ON k.user_id = aadhar.user_id
         LEFT JOIN (
           SELECT ud1.*
           FROM user_documents ud1
           INNER JOIN (
             SELECT user_id, MAX(document_id) AS max_doc_id
             FROM user_documents
             GROUP BY user_id
           ) ud_max ON ud1.document_id = ud_max.max_doc_id
         ) ud_any ON k.user_id = ud_any.user_id
         LEFT JOIN (
           SELECT kd1.*
           FROM kyc_documents kd1
           INNER JOIN (
             SELECT kyc_id, MAX(doc_id) AS max_doc_id
             FROM kyc_documents
             GROUP BY kyc_id
           ) kd_max ON kd1.doc_id = kd_max.max_doc_id
         ) kd ON k.kyc_id = kd.kyc_id
         LEFT JOIN users a ON k.verified_by = a.user_id
         ${whereClause}
         ORDER BY ${orderColumn} ${orderDirection}
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      return {
        documents: rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit) || 1
        }
      };
    } catch (err) {
      logger.error('KYCRepository getKYCList error:', err);
      return {
        documents: [],
        pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), totalPages: 0 }
      };
    }
  }

  async getPendingKYC(pagination = {}) {
    return this.getKYCList({ status: 'PENDING' }, pagination);
  }

  async getVerifiedKYC(pagination = {}) {
    return this.getKYCList({ status: 'APPROVED' }, pagination);
  }

  async getRejectedKYC(pagination = {}) {
    return this.getKYCList({ status: 'REJECTED' }, pagination);
  }

  /**
   * Get full KYC details by ID
   */
  async getKYCDetails(kycId) {
    await this.ensureSynced();
    const cleanId = parseInt(String(kycId).replace(/\D/g, ''), 10) || kycId;

    try {
      const [rows] = await db.query(
        `SELECT
           k.kyc_id,
           k.user_id,
           r.rider_id,
           k.kyc_type,
           k.status AS verification_status,
           k.status,
           k.verified_by,
           k.verified_at,
           k.remarks AS admin_remarks,
           k.remarks AS rejection_reason,
           k.created_at,
           k.updated_at,
           k.updated_at AS submitted_at,
           u.full_name,
           u.phone AS phone_number,
           u.email,
           u.status AS user_status,
           u.created_at AS user_created_at,
           u.profile_image AS selfie_url,
           up.date_of_birth,
           up.gender,
           up.address,
           COALESCE(up.city, r.assigned_city, 'N/A') AS city,
           dl.document_number AS driving_license_number,
           dl.file_url AS driving_license_photo,
           dl.file_url_back AS driving_license_back_photo,
           aadhar.document_number AS aadhar_number,
           aadhar.file_url AS aadhar_card_photo,
           aadhar.file_url_back AS aadhar_card_back_photo,
           COALESCE(dl.document_number, aadhar.document_number, ud_any.document_number, 'N/A') AS document_number,
           COALESCE(dl.file_url, aadhar.file_url, ud_any.file_url, kd.file_url) AS front_image_url,
           COALESCE(dl.file_url_back, aadhar.file_url_back, ud_any.file_url_back) AS back_image_url,
           COALESCE(dl.document_type, aadhar.document_type, ud_any.document_type, kd.document_type, k.kyc_type, 'USER_KYC') AS document_type,
           r.bank_account_number,
           r.ifsc_code,
           b.branch_name,
           a.full_name AS verified_by_name,
           a.email AS verified_by_email
         FROM kyc k
         INNER JOIN users u ON k.user_id = u.user_id
         LEFT JOIN user_profiles up ON k.user_id = up.user_id
         LEFT JOIN (
           SELECT user_id, document_number, file_url, file_url_back, document_type
           FROM user_documents WHERE document_type = 'DL'
         ) dl ON k.user_id = dl.user_id
         LEFT JOIN (
           SELECT user_id, document_number, file_url, file_url_back, document_type
           FROM user_documents WHERE document_type = 'AADHAR'
         ) aadhar ON k.user_id = aadhar.user_id
         LEFT JOIN (
           SELECT ud1.*
           FROM user_documents ud1
           INNER JOIN (
             SELECT user_id, MAX(document_id) AS max_doc_id
             FROM user_documents
             GROUP BY user_id
           ) ud_max ON ud1.document_id = ud_max.max_doc_id
         ) ud_any ON k.user_id = ud_any.user_id
         LEFT JOIN (
           SELECT kd1.*
           FROM kyc_documents kd1
           INNER JOIN (
             SELECT kyc_id, MAX(doc_id) AS max_doc_id
             FROM kyc_documents
             GROUP BY kyc_id
           ) kd_max ON kd1.doc_id = kd_max.max_doc_id
         ) kd ON k.kyc_id = kd.kyc_id
         LEFT JOIN riders r ON k.user_id = r.user_id
         LEFT JOIN branches b ON u.branch_id = b.branch_id
         LEFT JOIN users a ON k.verified_by = a.user_id
         WHERE k.user_id = ? OR k.kyc_id = ?
         ORDER BY (k.user_id = ?) DESC
         LIMIT 1`,
        [cleanId, cleanId, cleanId]
      );
      if (rows.length > 0) return rows[0];
    } catch (err) {
      logger.error('KYCRepository getKYCDetails error:', err);
    }

    return null;
  }

  /**
   * Get user documents by userId (or riderId)
   */
  async getUserDocuments(userIdOrRiderId) {
    const cleanId = parseInt(String(userIdOrRiderId).replace(/\D/g, ''), 10) || userIdOrRiderId;
    try {
      const [rows] = await db.query(
        `SELECT
           ud.document_id AS kyc_id,
           ud.document_id,
           ud.user_id,
           ud.document_type,
           ud.document_number,
           ud.file_url AS front_image_url,
           ud.file_url_back AS back_image_url,
           ud.status AS verification_status,
           ud.status,
           ud.verified_by,
           ud.verified_at,
           ud.rejection_reason,
           ud.created_at,
           ud.updated_at,
           a.full_name AS verified_by_name
         FROM user_documents ud
         LEFT JOIN riders r ON r.rider_id = ?
         LEFT JOIN users a ON ud.verified_by = a.user_id
         WHERE ud.user_id = ? OR ud.user_id = r.user_id
         ORDER BY ud.created_at DESC`,
        [cleanId, cleanId]
      );
      return rows;
    } catch (err) {
      logger.error('KYCRepository getUserDocuments error:', err);
      return [];
    }
  }

  /**
   * Approve KYC record and synchronize user/rider status
   */
  async approveKYC(kycId, approvedBy, approvedAt, remarks = null) {
    const cleanId = parseInt(String(kycId).replace(/\D/g, ''), 10) || kycId;
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Find target user_id
      const [kRows] = await connection.query(
        'SELECT user_id FROM kyc WHERE user_id = ? OR kyc_id = ? ORDER BY (user_id = ?) DESC LIMIT 1',
        [cleanId, cleanId, cleanId]
      );

      const targetUserId = kRows.length > 0 ? kRows[0].user_id : cleanId;

      // Update kyc row
      await connection.query(
        `UPDATE kyc
         SET status = 'APPROVED', verified_by = ?, verified_at = ?,
             remarks = ?, updated_at = ?
         WHERE user_id = ? OR kyc_id = ?`,
        [approvedBy, approvedAt, remarks, approvedAt, targetUserId, cleanId]
      );

      // Update user_profiles
      await connection.query(
        `UPDATE user_profiles SET kyc_status = 'APPROVED', updated_at = ? WHERE user_id = ?`,
        [approvedAt, targetUserId]
      ).catch(() => {});

      // Update kyc_documents
      await connection.query(
        `UPDATE kyc_documents SET status = 'APPROVED', updated_at = ?
         WHERE kyc_id = (SELECT kyc_id FROM kyc WHERE user_id = ? LIMIT 1)`,
        [approvedAt, targetUserId]
      ).catch(() => {});

      // Update user_documents
      await connection.query(
        `UPDATE user_documents
         SET status = 'APPROVED', verified_by = ?, verified_at = ?, updated_at = ?
         WHERE user_id = ?`,
        [approvedBy, approvedAt, approvedAt, targetUserId]
      ).catch(() => {});

      // Update riders kyc_status, application_status & status
      await connection.query(
        `UPDATE riders
         SET kyc_status = 'APPROVED', application_status = 'verified', status = 'ACTIVE', updated_at = ?
         WHERE user_id = ?`,
        [approvedAt, targetUserId]
      ).catch(() => {});

      // Update users status to ACTIVE
      await connection.query(
        `UPDATE users SET status = 'ACTIVE', updated_at = ? WHERE user_id = ? AND status = 'PENDING_VERIFICATION'`,
        [approvedAt, targetUserId]
      ).catch(() => {});

      await connection.commit();
      await deleteCache(`user_profile:${targetUserId}`);
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Reject KYC record
   */
  async rejectKYC(kycId, rejectedBy, rejectedAt, reason, remarks = null) {
    const cleanId = parseInt(String(kycId).replace(/\D/g, ''), 10) || kycId;
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Find target user_id
      const [kRows] = await connection.query(
        'SELECT user_id FROM kyc WHERE user_id = ? OR kyc_id = ? ORDER BY (user_id = ?) DESC LIMIT 1',
        [cleanId, cleanId, cleanId]
      );
      const targetUserId = kRows.length > 0 ? kRows[0].user_id : cleanId;

      // Update kyc row
      await connection.query(
        `UPDATE kyc
         SET status = 'REJECTED', verified_by = ?, verified_at = ?,
             remarks = ?, updated_at = ?
         WHERE user_id = ? OR kyc_id = ?`,
        [rejectedBy, rejectedAt, remarks || reason, rejectedAt, targetUserId, cleanId]
      );

      // Update user_profiles
      await connection.query(
        `UPDATE user_profiles SET kyc_status = 'REJECTED', updated_at = ? WHERE user_id = ?`,
        [rejectedAt, targetUserId]
      ).catch(() => {});

      // Update kyc_documents
      await connection.query(
        `UPDATE kyc_documents SET status = 'REJECTED', updated_at = ?
         WHERE kyc_id IN (SELECT kyc_id FROM kyc WHERE user_id = ?)`,
        [rejectedAt, targetUserId]
      ).catch(() => {});

      // Update user_documents
      await connection.query(
        `UPDATE user_documents
         SET status = 'REJECTED', verified_by = ?, verified_at = ?,
             rejection_reason = ?, updated_at = ?
         WHERE user_id = ?`,
        [rejectedBy, rejectedAt, reason, rejectedAt, targetUserId]
      ).catch(() => {});

      // Update riders kyc_status
      await connection.query(
        `UPDATE riders
         SET kyc_status = 'REJECTED', application_status = 'rejected', updated_at = ?
         WHERE user_id = ?`,
        [rejectedAt, targetUserId]
      ).catch(() => {});

      await connection.commit();
      await deleteCache(`user_profile:${targetUserId}`);
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Request reverification for KYC
   */
  async reverifyKYC(kycId, requestedBy, requestedAt, reason) {
    const cleanId = parseInt(String(kycId).replace(/\D/g, ''), 10) || kycId;
    const [kRows] = await db.query(
      'SELECT user_id FROM kyc WHERE user_id = ? OR kyc_id = ? ORDER BY (user_id = ?) DESC LIMIT 1',
      [cleanId, cleanId, cleanId]
    );
    const targetUserId = kRows.length > 0 ? kRows[0].user_id : cleanId;

    const [result] = await db.query(
      `UPDATE kyc
       SET status = 'REVERIFY_REQUIRED', verified_by = ?, verified_at = ?,
           remarks = ?, updated_at = ?
       WHERE user_id = ? OR kyc_id = ?`,
      [requestedBy, requestedAt, reason, requestedAt, targetUserId, cleanId]
    );

    await db.query(
      `UPDATE user_profiles SET kyc_status = 'REVERIFY_REQUIRED', updated_at = ? WHERE user_id = ?`,
      [requestedAt, targetUserId]
    ).catch(() => {});
    await deleteCache(`user_profile:${targetUserId}`);

    return result.affectedRows > 0;
  }

  /**
   * Update KYC status directly
   */
  async updateKYCStatus(kycId, status, updatedAt) {
    const cleanId = parseInt(String(kycId).replace(/\D/g, ''), 10) || kycId;
    const [kRows] = await db.query(
      'SELECT user_id FROM kyc WHERE user_id = ? OR kyc_id = ? ORDER BY (user_id = ?) DESC LIMIT 1',
      [cleanId, cleanId, cleanId]
    );
    const targetUserId = kRows.length > 0 ? kRows[0].user_id : cleanId;

    const [result] = await db.query(
      `UPDATE kyc
       SET status = ?, updated_at = ?
       WHERE user_id = ? OR kyc_id = ?`,
      [status, updatedAt, targetUserId, cleanId]
    );

    await db.query(
      `UPDATE user_profiles SET kyc_status = ?, updated_at = ? WHERE user_id = ?`,
      [status, updatedAt, targetUserId]
    ).catch(() => {});
    await deleteCache(`user_profile:${targetUserId}`);

    return result.affectedRows > 0;
  }

  /**
   * Get KYC timeline
   */
  async getKYCTimeline(userIdOrRiderId) {
    const cleanId = parseInt(String(userIdOrRiderId).replace(/\D/g, ''), 10) || userIdOrRiderId;
    try {
      const [rows] = await db.query(
        `SELECT
           k.kyc_id,
           k.kyc_type AS document_type,
           k.status AS verification_status,
           k.verified_by,
           k.verified_at,
           k.remarks AS admin_remarks,
           k.remarks AS rejection_reason,
           k.created_at,
           k.updated_at
         FROM kyc k
         LEFT JOIN riders r ON r.rider_id = ?
         WHERE k.user_id = ? OR k.user_id = r.user_id
         ORDER BY k.created_at ASC`,
        [cleanId, cleanId]
      );
      return rows;
    } catch (err) {
      logger.error('KYCRepository getKYCTimeline error:', err);
      return [];
    }
  }

  /**
   * Get KYC statistics
   */
  async getKYCStatistics() {
    await this.ensureSynced();
    const [rows] = await db.query(
      `SELECT
         COUNT(*) AS total_kyc,
         SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_count,
         SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_count,
         SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected_count,
         SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS today_requests,
         SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN 1 ELSE 0 END) AS monthly_requests
       FROM kyc`
    );

    const stats = rows[0] || {};

    const [avgTime] = await db.query(
      `SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, verified_at)) AS avg_approval_time
       FROM kyc
       WHERE status = 'APPROVED' AND verified_at IS NOT NULL`
    );

    const total = parseInt(stats.total_kyc) || 0;
    const pendingCount = parseInt(stats.pending_count) || 0;
    const approvedCount = parseInt(stats.approved_count) || 0;
    const rejectedCount = parseInt(stats.rejected_count) || 0;

    const rejectionRate = total > 0 ? (rejectedCount / total * 100).toFixed(2) : '0.00';
    const successRate = total > 0 ? (approvedCount / total * 100).toFixed(2) : '0.00';

    return {
      total_kyc: total,
      pending_count: pendingCount,
      approved_count: approvedCount,
      rejected_count: rejectedCount,
      today_requests: parseInt(stats.today_requests) || 0,
      monthly_requests: parseInt(stats.monthly_requests) || 0,
      avg_approval_time: parseFloat(avgTime[0]?.avg_approval_time || 0),
      rejection_rate: parseFloat(rejectionRate),
      verification_success_rate: parseFloat(successRate)
    };
  }

  /**
   * Get KYC data for export
   */
  async getKYCForExport(filters = {}) {
    await this.ensureSynced();
    const { status = null, startDate = null, endDate = null } = filters;

    const conditions = ['u.deleted_at IS NULL'];
    const params = [];

    if (status) {
      conditions.push('k.status = ?');
      params.push(status);
    }

    if (startDate) {
      conditions.push('k.created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('k.created_at <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await db.query(
      `SELECT
         k.kyc_id,
         k.user_id,
         r.rider_id,
         u.full_name,
         u.phone AS phone_number,
         u.email,
         COALESCE(up.city, r.assigned_city, 'N/A') AS city,
         COALESCE(k.kyc_type, 'USER_KYC') AS document_type,
         'N/A' AS document_number,
         k.status AS verification_status,
         a.full_name AS verified_by_name,
         k.created_at,
         k.verified_at
       FROM kyc k
       INNER JOIN users u ON k.user_id = u.user_id
       LEFT JOIN user_profiles up ON k.user_id = up.user_id
       LEFT JOIN riders r ON k.user_id = r.user_id
       LEFT JOIN users a ON k.verified_by = a.user_id
       ${whereClause}
       ORDER BY k.created_at DESC`,
      params
    );

    return rows;
  }
}

module.exports = new KYCRepository();
