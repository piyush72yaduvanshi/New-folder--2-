'use strict';
// User auth middleware — re-exports the shared userAuth middleware
// This keeps compatibility with all user route files that do:
//   const authMiddleware = require('../middleware/authMiddleware')
module.exports = require('../../../src/middleware/userAuth');
