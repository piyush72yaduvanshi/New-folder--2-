'use strict';

const db = require('../../../src/config/db');
const User = require('../models/User');

// Role name → role_id mapping (matches final_database roles seed)
const ROLE_MAP = {
  SUPER_ADMIN: 1, ADMIN: 2, BRANCH_ADMIN: 3,
  CUSTOMER: 4, RENT_A_VEHICLE: 4, USER: 4, VEHICLE: 4,
  RIDER: 5, VEHICLE_WITH_JOB: 5, VEHICLEWITHJOB: 5,
  SUPERVISOR: 6, DISPATCHER: 8, FINANCE: 9,
};

function resolveRoleId(roleName) {
  return ROLE_MAP[String(roleName || 'CUSTOMER').toUpperCase()] || 4;
}

// Build a User object from a DB row, aliasing columns for backward compat
function rowToUser(row) {
  if (!row) return null;
  // Expose old-style field names that controllers expect
  row.phone_number = row.phone_number || row.phone;
  row.password = row.password || row.hashed_password;
  row.password_hash = row.password_hash || row.hashed_password;
  row.profile_photo = row.profile_photo || row.profile_image;
  return new User(row);
}

class UserRepository {
  // ─── FIND ──────────────────────────────────────────────────

  static async findByPhone(phone) {
    const [rows] = await db.query(
      `SELECT u.*, u.phone AS phone_number,
              u.hashed_password AS password, u.hashed_password AS password_hash,
              u.profile_image AS profile_photo,
              r.role_name AS role,
              COALESCE(rd.kyc_status, up.kyc_status, 'NOT_SUBMITTED') AS kyc_status,
              up.date_of_birth, up.gender, up.address,
              COALESCE(up.city, rd.assigned_city) AS city, up.state,
              up.employee_id, up.job_type, up.joining_date, up.salary,
              up.assigned_hub, up.assigned_company, up.selected_partner,
              up.emergency_contact_name, up.emergency_contact_number,
              up.total_bookings, up.total_spent,
              rd.rider_code, rd.application_status, rd.status AS rider_status,
              rd.bank_account_number, rd.ifsc_code, rd.account_holder_name,
              rd.upi_id, rd.payout_schedule,
              dl.document_number AS driving_license_number,
              dl.file_url AS driving_license_photo,
              dl.file_url_back AS driving_license_back_photo,
              aadhar.document_number AS aadhar_number,
              aadhar.file_url AS aadhar_card_photo,
              aadhar.file_url_back AS aadhar_card_back_photo
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN user_profiles up ON u.user_id = up.user_id
       LEFT JOIN riders rd ON u.user_id = rd.user_id
       LEFT JOIN (
         SELECT user_id, document_number, file_url, file_url_back
         FROM user_documents WHERE document_type = 'DL'
       ) dl ON u.user_id = dl.user_id
       LEFT JOIN (
         SELECT user_id, document_number, file_url, file_url_back
         FROM user_documents WHERE document_type = 'AADHAR'
       ) aadhar ON u.user_id = aadhar.user_id
       WHERE u.phone = ? AND u.deleted_at IS NULL LIMIT 1`,
      [phone]
    );
    return rows.length ? rowToUser(rows[0]) : null;
  }

  static async findByEmail(email) {
    const [rows] = await db.query(
      `SELECT u.*, u.phone AS phone_number,
              u.hashed_password AS password, u.hashed_password AS password_hash,
              u.profile_image AS profile_photo,
              r.role_name AS role,
              COALESCE(rd.kyc_status, up.kyc_status, 'NOT_SUBMITTED') AS kyc_status,
              up.date_of_birth, up.gender, up.address,
              COALESCE(up.city, rd.assigned_city) AS city, up.state,
              up.employee_id, up.job_type, up.joining_date, up.salary,
              up.assigned_hub, up.assigned_company, up.selected_partner,
              up.emergency_contact_name, up.emergency_contact_number,
              up.total_bookings, up.total_spent,
              rd.rider_code, rd.application_status, rd.status AS rider_status,
              rd.bank_account_number, rd.ifsc_code, rd.account_holder_name,
              rd.upi_id, rd.payout_schedule,
              dl.document_number AS driving_license_number,
              dl.file_url AS driving_license_photo,
              dl.file_url_back AS driving_license_back_photo,
              aadhar.document_number AS aadhar_number,
              aadhar.file_url AS aadhar_card_photo,
              aadhar.file_url_back AS aadhar_card_back_photo
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN user_profiles up ON u.user_id = up.user_id
       LEFT JOIN riders rd ON u.user_id = rd.user_id
       LEFT JOIN (
         SELECT user_id, document_number, file_url, file_url_back
         FROM user_documents WHERE document_type = 'DL'
       ) dl ON u.user_id = dl.user_id
       LEFT JOIN (
         SELECT user_id, document_number, file_url, file_url_back
         FROM user_documents WHERE document_type = 'AADHAR'
       ) aadhar ON u.user_id = aadhar.user_id
       WHERE u.email = ? AND u.deleted_at IS NULL LIMIT 1`,
      [email]
    );
    return rows.length ? rowToUser(rows[0]) : null;
  }

  static async findById(userId) {
    const [rows] = await db.query(
      `SELECT u.*, u.phone AS phone_number,
              u.hashed_password AS password, u.hashed_password AS password_hash,
              u.profile_image AS profile_photo,
              r.role_name AS role,
              COALESCE(rd.kyc_status, up.kyc_status, 'NOT_SUBMITTED') AS kyc_status,
              up.date_of_birth, up.gender, up.address,
              COALESCE(up.city, rd.assigned_city) AS city, up.state, up.pincode,
              up.employee_id, up.job_type, up.joining_date, up.salary,
              up.assigned_hub, up.assigned_company, up.selected_partner,
              up.emergency_contact_name, up.emergency_contact_number,
              up.total_bookings, up.total_spent,
              rd.rider_code, rd.application_status, rd.status AS rider_status,
              rd.bank_account_number, rd.ifsc_code, rd.account_holder_name,
              rd.upi_id, rd.payout_schedule,
              dl.document_number AS driving_license_number,
              dl.file_url AS driving_license_photo,
              dl.file_url_back AS driving_license_back_photo,
              aadhar.document_number AS aadhar_number,
              aadhar.file_url AS aadhar_card_photo,
              aadhar.file_url_back AS aadhar_card_back_photo
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN user_profiles up ON u.user_id = up.user_id
       LEFT JOIN riders rd ON u.user_id = rd.user_id
       LEFT JOIN (
         SELECT user_id, document_number, file_url, file_url_back
         FROM user_documents WHERE document_type = 'DL'
       ) dl ON u.user_id = dl.user_id
       LEFT JOIN (
         SELECT user_id, document_number, file_url, file_url_back
         FROM user_documents WHERE document_type = 'AADHAR'
       ) aadhar ON u.user_id = aadhar.user_id
       WHERE u.user_id = ? LIMIT 1`,
      [userId]
    );
    return rows.length ? rowToUser(rows[0]) : null;
  }

  // ─── CREATE ────────────────────────────────────────────────
  // Creates user row + user_profiles row + wallet in one transaction

  static async create(data) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Split full_name into first/last
      const fullName = data.full_name || data.user_name || '';
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const roleId = resolveRoleId(data.role);
      const phone = data.phone_number || data.phone || data.mobile_number;
      const password = data.password || data.hashed_password || data.password_hash;

      const [result] = await connection.query(
        `INSERT INTO users (first_name, last_name, email, phone, hashed_password,
                            role_id, status, is_email_verified, is_phone_verified,
                            profile_image, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, NOW(), NOW())`,
        [firstName, lastName, data.email ?? null, phone, password,
          roleId, data.status || 'ACTIVE', data.profile_photo || data.profile_image || null]
      );
      const userId = result.insertId;

      // Create user_profiles row with profile data
      const gender = data.gender ? data.gender.toUpperCase() : null;
      const validGenders = ['MALE', 'FEMALE', 'OTHER'];
      const safeGender = validGenders.includes(gender) ? gender : null;

      await connection.query(
        `INSERT INTO user_profiles
           (user_id, date_of_birth, gender, address, city, state, pincode,
            employee_id, job_type, joining_date, salary, assigned_hub,
            assigned_company, selected_partner, kyc_status,
            emergency_contact_name, emergency_contact_number,
            created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [userId,
          data.date_of_birth || null,
          safeGender,
          data.address || null,
          data.city || null,
          data.state || null,
          data.pincode || null,
          data.employee_id || null,
          data.job_type || null,
          data.joining_date || null,
          data.salary || null,
          data.assigned_hub || null,
          data.assigned_company || null,
          data.selected_partner || null,
          data.kyc_status || 'NOT_SUBMITTED',
          data.emergency_contact_name || null,
          data.emergency_contact_number || null,
        ]
      );

      // If registered as RIDER (role_id 5), also create a row in riders table
      if (roleId === 5) {
        const riderCode = 'RDR' + Date.now().toString().slice(-6);
        await connection.query(
          `INSERT INTO riders (user_id, rider_code, assigned_city, status, kyc_status,
                               online_status, availability, application_status, created_at, updated_at)
           VALUES (?, ?, ?, 'UNDER_REVIEW', 'PENDING', 'OFFLINE', 'OFFLINE', 'pending', NOW(), NOW())
           ON DUPLICATE KEY UPDATE updated_at = NOW()`,
          [userId, riderCode, data.city || null]
        ).catch(() => { });
      }

      // Auto-create wallet
      await connection.query(
        `INSERT INTO wallets (user_id, wallet_balance, currency, is_active)
         VALUES (?, 0.00, 'INR', 1)
         ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
        [userId]
      );

      await connection.commit();
      return userId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ─── UPDATE ────────────────────────────────────────────────

  static async update(userId, fields) {
    if (!fields || !Object.keys(fields).length) return false;

    // Separate users-table fields from user_profiles fields
    const USER_COLS = {
      email: 'email', phone: 'phone', phone_number: 'phone',
      status: 'status', profile_image: 'profile_image', profile_photo: 'profile_image',
      is_email_verified: 'is_email_verified', email_verified: 'is_email_verified',
      is_phone_verified: 'is_phone_verified', phone_verified: 'is_phone_verified',
      last_login_at: 'last_login_at', deleted_at: 'deleted_at',
    };
    const PROFILE_COLS = {
      date_of_birth: 'date_of_birth', gender: 'gender', address: 'address',
      city: 'city', state: 'state', pincode: 'pincode',
      employee_id: 'employee_id', job_type: 'job_type',
      joining_date: 'joining_date', salary: 'salary',
      assigned_hub: 'assigned_hub', assigned_company: 'assigned_company',
      selected_partner: 'selected_partner',
      kyc_status: 'kyc_status',
      emergency_contact_name: 'emergency_contact_name',
      emergency_contact_number: 'emergency_contact_number',
      total_bookings: 'total_bookings', total_spent: 'total_spent',
    };

    const userSet = {};
    const profileSet = {};

    let hasKycDoc = false;

    for (const [k, v] of Object.entries(fields)) {
      if (v === undefined) continue;
      if (k === 'password' || k === 'password_hash' || k === 'hashed_password') {
        userSet['hashed_password'] = v;
      } else if (k === 'full_name') {
        const parts = String(v).trim().split(/\s+/);
        userSet['first_name'] = parts[0] || '';
        userSet['last_name'] = parts.slice(1).join(' ') || '';
      } else if (k === 'role' || k === 'user_type') {
        userSet['role_id'] = resolveRoleId(v);
      } else if (USER_COLS[k]) {
        let val = v;
        if (k === 'gender') {
          const g = String(v).toUpperCase();
          val = ['MALE', 'FEMALE', 'OTHER'].includes(g) ? g : null;
        }
        userSet[USER_COLS[k]] = val;
      } else if (PROFILE_COLS[k]) {
        profileSet[PROFILE_COLS[k]] = v;
      }

      if (k.includes('driving_license') || k.includes('aadhar') || k.includes('pan')) {
        hasKycDoc = true;
      }
    }

    if (hasKycDoc && !profileSet.kyc_status) {
      profileSet.kyc_status = 'PENDING';
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      if (Object.keys(userSet).length) {
        const setClauses = Object.keys(userSet).map(c => `${c} = ?`).join(', ');
        const vals = [...Object.values(userSet), userId];
        await connection.query(
          `UPDATE users SET ${setClauses}, updated_at = NOW() WHERE user_id = ?`, vals
        );
      }

      if (Object.keys(profileSet).length) {
        const setClauses = Object.keys(profileSet).map(c => `${c} = ?`).join(', ');
        const vals = [...Object.values(profileSet), userId];
        await connection.query(
          `INSERT INTO user_profiles (user_id, ${Object.keys(profileSet).join(',')})
           VALUES (?, ${Object.keys(profileSet).map(() => '?').join(',')})
           ON DUPLICATE KEY UPDATE ${setClauses}`,
          [userId, ...Object.values(profileSet), ...vals]
        );
      }

      // Handle DL Document update
      if (fields.driving_license_number || fields.driving_license_photo || fields.driving_license_back_photo) {
        const [existingDl] = await connection.query(
          "SELECT document_id FROM user_documents WHERE user_id = ? AND document_type = 'DL' LIMIT 1",
          [userId]
        );
        if (existingDl.length) {
          await connection.query(
            `UPDATE user_documents
             SET document_number = COALESCE(?, document_number),
                 file_url = COALESCE(?, file_url),
                 file_url_back = COALESCE(?, file_url_back),
                 status = 'PENDING', updated_at = NOW()
             WHERE document_id = ?`,
            [fields.driving_license_number || null, fields.driving_license_photo || null, fields.driving_license_back_photo || null, existingDl[0].document_id]
          );
        } else {
          await connection.query(
            `INSERT INTO user_documents (user_id, document_type, document_number, file_url, file_url_back, status, created_at, updated_at)
             VALUES (?, 'DL', ?, ?, ?, 'PENDING', NOW(), NOW())`,
            [userId, fields.driving_license_number || null, fields.driving_license_photo || null, fields.driving_license_back_photo || null]
          );
        }
      }

      // Handle AADHAR Document update
      if (fields.aadhar_number || fields.aadhar_card_photo || fields.aadhar_card_back_photo) {
        const [existingAadhar] = await connection.query(
          "SELECT document_id FROM user_documents WHERE user_id = ? AND document_type = 'AADHAR' LIMIT 1",
          [userId]
        );
        if (existingAadhar.length) {
          await connection.query(
            `UPDATE user_documents
             SET document_number = COALESCE(?, document_number),
                 file_url = COALESCE(?, file_url),
                 file_url_back = COALESCE(?, file_url_back),
                 status = 'PENDING', updated_at = NOW()
             WHERE document_id = ?`,
            [fields.aadhar_number || null, fields.aadhar_card_photo || null, fields.aadhar_card_back_photo || null, existingAadhar[0].document_id]
          );
        } else {
          await connection.query(
            `INSERT INTO user_documents (user_id, document_type, document_number, file_url, file_url_back, status, created_at, updated_at)
             VALUES (?, 'AADHAR', ?, ?, ?, 'PENDING', NOW(), NOW())`,
            [userId, fields.aadhar_number || null, fields.aadhar_card_photo || null, fields.aadhar_card_back_photo || null]
          );
        }
      }

      // Handle Rider Bank / Payout info update if present
      if (fields.bank_account_number || fields.ifsc_code || fields.account_holder_name || fields.upi_id || fields.payout_schedule) {
        await connection.query(
          `UPDATE riders
           SET bank_account_number = COALESCE(?, bank_account_number),
               ifsc_code = COALESCE(?, ifsc_code),
               account_holder_name = COALESCE(?, account_holder_name),
               upi_id = COALESCE(?, upi_id),
               payout_schedule = COALESCE(?, payout_schedule),
               updated_at = NOW()
           WHERE user_id = ?`,
          [fields.bank_account_number || null, fields.ifsc_code || null,
          fields.account_holder_name || null, fields.upi_id || null,
          fields.payout_schedule || null, userId]
        ).catch(() => { });
      }

      // Ensure KYC entry exists if any document submitted
      if (hasKycDoc) {
        await connection.query(
          `INSERT INTO kyc (user_id, kyc_type, status, created_at, updated_at)
           VALUES (?, 'STANDARD', 'PENDING', NOW(), NOW())
           ON DUPLICATE KEY UPDATE status = 'PENDING', updated_at = NOW()`,
          [userId]
        ).catch(() => { });
      }

      await connection.commit();
      return true;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  // ─── DELETE (soft) ────────────────────────────────────────

  static async delete(userId) {
    const [result] = await db.query(
      `UPDATE users SET status = 'DELETED', deleted_at = NOW(), updated_at = NOW()
       WHERE user_id = ? AND (status != 'DELETED' OR deleted_at IS NULL)`,
      [userId]
    );
    return result.affectedRows > 0;
  }

  // ─── RIDER APPLICATION ───────────────────────────────────
  // Rider profile/KYC data lives in riders table + user_documents
  // Here we update the user_profiles for profile data

  static async applyRider(userId, data) {
    // Update user_profiles with rider profile data
    await UserRepository.update(userId, {
      date_of_birth: data.date_of_birth,
      gender: data.gender,
      address: data.address,
      emergency_contact_name: data.emergency_contact_name,
      emergency_contact_number: data.emergency_contact_number,
      selected_partner: data.selected_partner,
      kyc_status: 'PENDING',
    });

    // Update/create riders row with payout + operational data
    const riderCode = data.rider_code || ('RDR' + Date.now().toString().slice(-6));
    const [existing] = await db.query(
      'SELECT rider_id FROM riders WHERE user_id = ? LIMIT 1', [userId]
    );
    if (existing.length) {
      await db.query(
        `UPDATE riders SET bank_account_number=?, ifsc_code=?, account_holder_name=?,
                upi_id=?, payout_schedule=?, application_status='pending', kyc_status='PENDING', status='UNDER_REVIEW', updated_at=NOW()
         WHERE user_id=?`,
        [data.bank_account_number || null, data.ifsc_code || null,
        data.account_holder_name || null, data.upi_id || null,
        data.payout_schedule || 'Every Monday', userId]
      );
    } else {
      await db.query(
        `INSERT INTO riders (user_id, rider_code, assigned_city, status, kyc_status,
                             bank_account_number, ifsc_code, account_holder_name,
                             upi_id, payout_schedule, application_status,
                             online_status, availability, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,'pending','OFFLINE','OFFLINE',NOW(),NOW())`,
        [userId, riderCode, data.city || null, 'UNDER_REVIEW', 'PENDING',
          data.bank_account_number || null, data.ifsc_code || null,
          data.account_holder_name || null, data.upi_id || null,
          data.payout_schedule || 'Every Monday']
      );
    }

    if (data.driving_license_number || data.driving_license_photo || data.driving_license_back_photo) {
      const [existingDl] = await db.query(
        "SELECT document_id FROM user_documents WHERE user_id = ? AND document_type = 'DL' LIMIT 1", [userId]
      );
      if (existingDl.length) {
        await db.query(
          "UPDATE user_documents SET document_number = COALESCE(?, document_number), file_url = COALESCE(?, file_url), file_url_back = COALESCE(?, file_url_back), status = 'PENDING', updated_at = NOW() WHERE document_id = ?",
          [data.driving_license_number || null, data.driving_license_photo || null, data.driving_license_back_photo || null, existingDl[0].document_id]
        );
      } else {
        await db.query(
          "INSERT INTO user_documents (user_id, document_type, document_number, file_url, file_url_back, status, created_at, updated_at) VALUES (?, 'DL', ?, ?, ?, 'PENDING', NOW(), NOW())",
          [userId, data.driving_license_number || null, data.driving_license_photo || null, data.driving_license_back_photo || null]
        );
      }
    }

    if (data.aadhar_number || data.aadhar_card_photo || data.aadhar_card_back_photo) {
      const [existingAadhar] = await db.query(
        "SELECT document_id FROM user_documents WHERE user_id = ? AND document_type = 'AADHAR' LIMIT 1", [userId]
      );
      if (existingAadhar.length) {
        await db.query(
          "UPDATE user_documents SET document_number = COALESCE(?, document_number), file_url = COALESCE(?, file_url), file_url_back = COALESCE(?, file_url_back), status = 'PENDING', updated_at = NOW() WHERE document_id = ?",
          [data.aadhar_number || null, data.aadhar_card_photo || null, data.aadhar_card_back_photo || null, existingAadhar[0].document_id]
        );
      } else {
        await db.query(
          "INSERT INTO user_documents (user_id, document_type, document_number, file_url, file_url_back, status, created_at, updated_at) VALUES (?, 'AADHAR', ?, ?, ?, 'PENDING', NOW(), NOW())",
          [userId, data.aadhar_number || null, data.aadhar_card_photo || null, data.aadhar_card_back_photo || null]
        );
      }
    }

    const [existingKyc] = await db.query('SELECT kyc_id FROM kyc WHERE user_id = ? LIMIT 1', [userId]);
    let kycId;
    if (existingKyc.length) {
      kycId = existingKyc[0].kyc_id;
      await db.query("UPDATE kyc SET status = 'PENDING', updated_at = NOW() WHERE kyc_id = ?", [kycId]);
    } else {
      const [res] = await db.query("INSERT INTO kyc (user_id, kyc_type, status, created_at, updated_at) VALUES (?, 'STANDARD', 'PENDING', NOW(), NOW())", [userId]);
      kycId = res.insertId;
    }

    if (data.driving_license_photo) {
      await db.query("INSERT INTO kyc_documents (kyc_id, document_type, file_url, status, created_at, updated_at) VALUES (?, 'DL', ?, 'PENDING', NOW(), NOW())", [kycId, data.driving_license_photo]).catch(() => { });
    }
    if (data.aadhar_card_photo) {
      await db.query("INSERT INTO kyc_documents (kyc_id, document_type, file_url, status, created_at, updated_at) VALUES (?, 'AADHAR', ?, 'PENDING', NOW(), NOW())", [kycId, data.aadhar_card_photo]).catch(() => { });
    }

    return true;
  }

  static async verifyRider(userId, data) {
    const kycStatus = data.application_status === 'verified' ? 'APPROVED' : (data.application_status === 'rejected' ? 'REJECTED' : 'PENDING');
    const riderStatus = data.application_status === 'verified' ? 'ACTIVE' : (data.application_status === 'rejected' ? 'SUSPENDED' : 'UNDER_REVIEW');

    const [result] = await db.query(
      `UPDATE riders SET application_status=?, status=?, kyc_status=?, updated_at=NOW() WHERE user_id=?`,
      [data.application_status, riderStatus, kycStatus, userId]
    );

    await db.query(
      `UPDATE user_profiles SET kyc_status=?, updated_at=NOW() WHERE user_id=?`,
      [kycStatus, userId]
    ).catch(() => { });

    await db.query(
      `UPDATE kyc SET status=?, updated_at=NOW() WHERE user_id=?`,
      [kycStatus, userId]
    ).catch(() => { });

    await db.query(
      `UPDATE user_documents SET status=?, updated_at=NOW() WHERE user_id=?`,
      [kycStatus, userId]
    ).catch(() => { });

    return result.affectedRows > 0;
  }

  // ─── WALLET HELPERS ───────────────────────────────────────

  static async getWalletByUserId(userId) {
    const [rows] = await db.query(
      `SELECT wallet_id, user_id, wallet_balance AS wallet_amount, currency, is_active, created_at, updated_at
       FROM wallets WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    return rows.length ? rows[0] : null;
  }

  static async adminSetWalletBalance(userId, walletAmount) {
    const [result] = await db.query(
      `UPDATE wallets SET wallet_balance = ?, updated_at = NOW() WHERE user_id = ?`,
      [walletAmount, userId]
    );
    return result.affectedRows > 0;
  }

  // ─── SOFT DELETE ALIAS ────────────────────────────────────

  static async softDelete(userId) {
    return UserRepository.delete(userId);
  }
}

module.exports = UserRepository;
