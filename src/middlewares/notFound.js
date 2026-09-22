import { NotFoundError } from '../errors/AppError.js';
import { ERROR_CODES } from '../config/constants.js';

export function notFoundHandler(req, res, next) {
  next(
    new NotFoundError(
      `Cannot ${req.method} ${req.originalUrl}. Route does not exist on this server.`,
      ERROR_CODES.ROUTE_NOT_FOUND
    )
  );
}
