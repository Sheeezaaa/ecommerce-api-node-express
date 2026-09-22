import { BadRequestError } from '../errors/AppError.js';
import { ERROR_CODES } from '../config/constants.js';

/**
 * Higher-order middleware function to run validation schemas.
 * Throws standardized BadRequestError (400) if validation fails.
 */
export function validate(validatorFn) {
  return (req, res, next) => {
    const errors = validatorFn(req);
    if (errors && errors.length > 0) {
      return next(
        new BadRequestError(
          'Client request validation failed. Please check your payload fields.',
          errors,
          ERROR_CODES.VALIDATION_FAILED
        )
      );
    }
    next();
  };
}
