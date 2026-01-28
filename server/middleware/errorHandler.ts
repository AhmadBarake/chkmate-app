import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError, isAppError, ERROR_MESSAGES } from '../lib/errors.js';

/**
 * Standard error response format
 */
interface ErrorResponse {
  error: true;
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
}

/**
 * Generate a simple request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Map Prisma errors to user-friendly AppErrors
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): AppError {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const target = (error.meta?.target as string[])?.join(', ') || 'field';
      return new AppError(`A record with this ${target} already exists`, 409, 'CONFLICT', { field: target });

    case 'P2025':
      // Record not found
      return new AppError('Record not found', 404, 'NOT_FOUND');

    case 'P2003':
      // Foreign key constraint failed
      return new AppError('Related record not found', 400, 'VALIDATION_ERROR');

    case 'P2014':
      // Required relation violation
      return new AppError('This operation would break required relations', 400, 'VALIDATION_ERROR');

    default:
      console.error('Unhandled Prisma error code:', error.code);
      return new AppError('Database operation failed', 500, 'INTERNAL_ERROR');
  }
}

/**
 * Global error handling middleware
 * Catches all errors and returns consistent JSON responses
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = generateRequestId();

  // Log error for debugging (in production, send to error tracking service)
  console.error(`[${requestId}] Error:`, {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Handle our custom AppError
  if (isAppError(err)) {
    const response: ErrorResponse = {
      error: true,
      code: err.code,
      message: err.message,
      requestId,
    };

    if (err.details) {
      response.details = err.details;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const appError = handlePrismaError(err);
    const response: ErrorResponse = {
      error: true,
      code: appError.code,
      message: appError.message,
      requestId,
    };

    if (appError.details) {
      response.details = appError.details;
    }

    res.status(appError.statusCode).json(response);
    return;
  }

  // Handle Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    const response: ErrorResponse = {
      error: true,
      code: 'VALIDATION_ERROR',
      message: 'Invalid data provided',
      requestId,
    };

    res.status(400).json(response);
    return;
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && 'body' in err) {
    const response: ErrorResponse = {
      error: true,
      code: 'VALIDATION_ERROR',
      message: 'Invalid JSON in request body',
      requestId,
    };

    res.status(400).json(response);
    return;
  }

  // Handle all other errors (programming errors, unexpected issues)
  const response: ErrorResponse = {
    error: true,
    code: 'INTERNAL_ERROR',
    message: ERROR_MESSAGES.INTERNAL_ERROR,
    requestId,
  };

  // In development, include more details
  if (process.env.NODE_ENV === 'development') {
    response.details = {
      originalMessage: err.message,
      stack: err.stack,
    };
  }

  res.status(500).json(response);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * Usage: app.get('/route', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  const response: ErrorResponse = {
    error: true,
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  };

  res.status(404).json(response);
}
