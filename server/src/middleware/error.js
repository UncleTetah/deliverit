import { HttpError } from '../utils/httpError.js';
import { logger } from '../utils/logger.js';

export function notFound(req, res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  if (status >= 500) logger.error(err);

  res.status(status).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(err.details && { details: err.details }),
    },
  });
}