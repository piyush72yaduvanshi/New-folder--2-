'use strict';
/**
 * password.js — Unified password hashing for merged backend
 *
 * Admin backend used bcrypt.
 * User backend used scrypt (crypto.scryptSync).
 *
 * Strategy: NEW passwords use bcrypt ($2b$ prefix).
 * EXISTING scrypt hashes (scrypt:salt:hash) are verified with scrypt.
 * EXISTING bcrypt hashes ($2b$) are verified with bcrypt.
 * This means all existing users continue to log in without a password reset.
 */

const bcrypt = require('bcrypt');
const crypto = require('crypto');

const SALT_ROUNDS = 12;

/**
 * Hash a plain-text password using bcrypt.
 * All new passwords use bcrypt going forward.
 */
async function hashPassword(password) {
  return bcrypt.hash(String(password), SALT_ROUNDS);
}

/**
 * Synchronous hash — used in legacy user-backend code paths.
 * New code should use hashPassword (async).
 */
function hashPasswordSync(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

/**
 * Verify a password against a stored hash.
 * Handles both bcrypt ($2b$) and scrypt (scrypt:salt:hash) formats.
 */
async function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  const pwd = String(password);

  if (storedHash.startsWith('$2b$') || storedHash.startsWith('$2a$')) {
    // bcrypt hash
    return bcrypt.compare(pwd, storedHash);
  }

  if (storedHash.startsWith('scrypt:')) {
    // Legacy scrypt hash from user backend
    try {
      const [, salt, hash] = storedHash.split(':');
      if (!salt || !hash) return false;
      const computed = crypto.scryptSync(pwd, salt, 64).toString('hex');
      const a = Buffer.from(hash, 'hex');
      const b = Buffer.from(computed, 'hex');
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch { return false; }
  }

  // Plain text fallback (dev-only records)
  return pwd === storedHash;
}

/**
 * Synchronous verify — kept for legacy user-backend code that calls
 * verifyPassword() synchronously. Handles scrypt only.
 * bcrypt hashes MUST use the async verifyPassword() instead.
 */
function verifyPasswordSync(password, storedHash) {
  if (!storedHash) return false;
  const pwd = String(password);

  if (storedHash.startsWith('scrypt:')) {
    try {
      const [, salt, hash] = storedHash.split(':');
      if (!salt || !hash) return false;
      const computed = crypto.scryptSync(pwd, salt, 64).toString('hex');
      const a = Buffer.from(hash, 'hex');
      const b = Buffer.from(computed, 'hex');
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch { return false; }
  }

  if (storedHash.startsWith('$2b$') || storedHash.startsWith('$2a$')) {
    // bcrypt CANNOT be verified synchronously — always use async verifyPassword()
    throw new Error('[password.js] verifyPasswordSync: bcrypt hashes require async verifyPassword(). Never call verifyPasswordSync for bcrypt-hashed passwords.');
  }

  // Plain text fallback — dev-only records only
  return pwd === storedHash;
}

module.exports = { hashPassword, hashPasswordSync, verifyPassword, verifyPasswordSync };
