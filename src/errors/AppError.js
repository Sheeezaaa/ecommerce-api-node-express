import { HTTP_STATUS, ERROR_CODES } from '../config/constants.js';

export class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Invalid request parameters or payload', details = null, errorCode = ERROR_CODES.INVALID_REQUEST_BODY) {
    super(message, HTTP_STATUS.BAD_REQUEST, errorCode, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', errorCode = ERROR_CODES.RESOURCE_NOT_FOUND, details = null) {
    super(message, HTTP_STATUS.NOT_FOUND, errorCode, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict or duplicate operation', errorCode = ERROR_CODES.IDEMPOTENCY_CONFLICT, details = null) {
    super(message, HTTP_STATUS.CONFLICT, errorCode, details);
  }
}
