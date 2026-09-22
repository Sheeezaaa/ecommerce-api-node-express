import { HTTP_STATUS, ERROR_CODES } from '../config/constants.js';
import { AppError } from '../errors/AppError.js';

/**
 * Standardized Centralized Error Handling Middleware
 * Ensures no server crashes and protects sensitive stack traces in production.
 */
export function errorHandler(err, req, res, next) {
  // If headers already sent, delegate to Express default handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle JSON parse errors from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error_code: ERROR_CODES.INVALID_REQUEST_BODY,
      message: 'Malformed JSON payload in request body',
      timestamp: new Date().toISOString(),
      details: err.message,
    });
  }

  // Handle known application operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error_code: err.errorCode,
      message: err.message,
      timestamp: new Date().toISOString(),
      details: err.details,
    });
  }

  // Unhandled / programmer / server error (500)
  // Log unexpected errors for server telemetry
  console.error('Unhandled Server Error:', err);

  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error_code: ERROR_CODES.INTERNAL_SERVER_ERROR,
    message: 'An unexpected internal server error occurred. Please try again later.',
    timestamp: new Date().toISOString(),
    details: process.env.NODE_ENV === 'development' ? err.message : null,
  });
}
