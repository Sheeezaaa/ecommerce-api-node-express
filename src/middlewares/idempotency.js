import { store } from '../data/store.js';
import { ConflictError } from '../errors/AppError.js';
import { ERROR_CODES } from '../config/constants.js';

/**
 * Idempotency Middleware for payment and order operations.
 * Prevents duplicate orders and deductions caused by network retries.
 * Reads 'Idempotency-Key' from request headers.
 */
export function idempotencyMiddleware(req, res, next) {
  const idempotencyKey = req.header('Idempotency-Key');

  // If no idempotency key provided, proceed normally (or enforce if required)
  if (!idempotencyKey) {
    return next();
  }

  const existingRecord = store.getIdempotencyRecord(idempotencyKey);

  if (existingRecord) {
    // If request is still being processed
    if (existingRecord.status === 'PROCESSING') {
      return next(
        new ConflictError(
          'An operation with this Idempotency-Key is currently processing. Please do not retry concurrently.',
          ERROR_CODES.IDEMPOTENCY_CONFLICT
        )
      );
    }

    // Return the cached idempotent response
    res.setHeader('Idempotent-Replayed', 'true');
    res.setHeader('Idempotency-Key', idempotencyKey);
    return res.status(existingRecord.statusCode).json(existingRecord.body);
  }

  // Mark this key as PROCESSING
  store.setIdempotencyRecord(idempotencyKey, { status: 'PROCESSING' });

  // Hook into response completion to capture status code and body
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    // Cache the response
    store.setIdempotencyRecord(idempotencyKey, {
      status: 'COMPLETED',
      statusCode: res.statusCode,
      body,
    });
    res.setHeader('Idempotency-Key', idempotencyKey);
    return originalJson(body);
  };

  next();
}
