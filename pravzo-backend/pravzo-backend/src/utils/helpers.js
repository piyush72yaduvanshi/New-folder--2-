const crypto = require('crypto');

// Helper to format ISO date strings to MySQL standard TIMESTAMP/DATETIME format (YYYY-MM-DD HH:MM:SS)
function formatMySQLDate(dateInput) {
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

// Generate OTP
function generateOTP(length = 6) {
  return crypto.randomInt(100000, 999999).toString();
}

// Generate random token
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}


function sanitizePagination(page, limit, maxLimit = 200) {
  const parsedPage  = Math.max(1, parseInt(page)  || 1);
  const parsedLimit = Math.min(maxLimit, Math.max(1, parseInt(limit) || 20));
  return { page: parsedPage, limit: parsedLimit };
}

module.exports = {
  formatMySQLDate,
  generateOTP,
  generateToken,
  sanitizePagination
};
