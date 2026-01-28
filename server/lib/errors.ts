/**
 * Custom Error Classes for Chkmate API
 * Provides consistent, user-friendly error responses
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Distinguishes operational errors from programming errors

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'You do not have permission to perform this action') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND', { resource });
  }
}

export class PaymentRequiredError extends AppError {
  constructor(
    message: string = 'Plan limit reached. Upgrade to continue.',
    details?: { usage?: number; limit?: number; plan?: string }
  ) {
    super(message, 402, 'PAYMENT_REQUIRED', details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number = 60) {
    super('Too many requests. Please try again later.', 429, 'RATE_LIMIT', { retryAfter });
  }
}

export class GenerationError extends AppError {
  constructor(message: string = 'Failed to generate infrastructure. Please try rephrasing your request.') {
    super(message, 500, 'GENERATION_FAILED');
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: Error) {
    super(
      `Service temporarily unavailable. Please try again.`,
      503,
      'EXTERNAL_SERVICE_ERROR',
      { service, originalMessage: originalError?.message }
    );
  }
}

/**
 * Error codes mapped to user-friendly messages
 * Used by frontend for displaying errors
 */
export const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: 'Please check your input and try again.',
  AUTHENTICATION_ERROR: 'Please sign in to continue.',
  AUTHORIZATION_ERROR: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  PAYMENT_REQUIRED: "You've reached your plan limit. Upgrade to continue building.",
  CONFLICT: 'This action conflicts with existing data.',
  RATE_LIMIT: 'Too many requests. Please wait a moment and try again.',
  GENERATION_FAILED: 'Generation failed. Try rephrasing your architecture description.',
  EXTERNAL_SERVICE_ERROR: 'Service temporarily unavailable. Please try again.',
  INTERNAL_ERROR: 'Something went wrong. Our team has been notified.',
};

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
