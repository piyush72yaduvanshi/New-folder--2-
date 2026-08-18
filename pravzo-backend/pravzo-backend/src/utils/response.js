'use strict';

const { v4: uuidv4 } = require('uuid');

function buildMeta(req) {
  return {
    timestamp: new Date().toISOString(),
    requestId: (req && req.requestId) || uuidv4()
  };
}

const successResponse = (res, statusCode = 200, message = 'Success', data = null) => {
  const response = {
    success: true,
    message: message || 'Success'
  };
  if (data !== null && data !== undefined) {
    response.data = data;
  }
  response.meta = buildMeta(null);
  return res.status(statusCode).json(response);
};


const errorResponse = (res, statusCode = 500, message = 'Internal Server Error', errors = null) => {
  const response = {
    success: false,
    message: message || 'An error occurred'
  };


  if (Array.isArray(errors) && errors.length > 0) {
    response.errors = errors;
  }


  response.meta = buildMeta(null);
  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse
};
