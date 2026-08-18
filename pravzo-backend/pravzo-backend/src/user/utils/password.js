'use strict';
// Re-export from shared password utility
// Maintains backward compatibility with user controllers that do:
//   const { hashPassword, verifyPassword } = require('../utils/password')
const { hashPasswordSync, verifyPasswordSync, hashPassword, verifyPassword } = require('../../../src/utils/password');

module.exports = {
  hashPassword:   hashPasswordSync,    // user backend calls this synchronously
  verifyPassword: verifyPasswordSync,  // user backend calls this synchronously
  hashPasswordAsync:   hashPassword,
  verifyPasswordAsync: verifyPassword,
};
