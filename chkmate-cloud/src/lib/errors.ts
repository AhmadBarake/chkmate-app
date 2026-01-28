/**
 * Frontend Error Handling Utilities
 * Provides consistent error parsing and user-friendly messages
 */

/**
 * API Error structure returned from backend
 */
export interface ApiError {
  error: true;
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
  status?: number;
}

/**
 * Check if an error is an API error
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    (error as ApiError).error === true &&
    'code' in error &&
    'message' in error
  );
}

/**
 * Error codes mapped to user-friendly messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Authentication & Authorization
  AUTHENTICATION_ERROR: 'Please sign in to continue.',
  AUTHORIZATION_ERROR: 'You do not have permission to perform this action.',

  // Validation
  VALIDATION_ERROR: 'Please check your input and try again.',

  // Resources
  NOT_FOUND: 'The requested item was not found.',
  CONFLICT: 'This action conflicts with existing data.',

  // Billing & Limits
  PAYMENT_REQUIRED: "You've reached your plan limit. Upgrade to continue building.",

  // Rate Limiting
  RATE_LIMIT: 'Too many requests. Please wait a moment and try again.',

  // Generation
  GENERATION_FAILED: 'Generation failed. Try rephrasing your architecture description.',

  // External Services
  EXTERNAL_SERVICE_ERROR: 'Service temporarily unavailable. Please try again in a moment.',

  // Network
  NETWORK_ERROR: 'Connection failed. Please check your internet and try again.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',

  // Generic
  INTERNAL_ERROR: 'Something went wrong. Please try again.',
  UNKNOWN: 'An unexpected error occurred. Please try again.',
};

/**
 * Get a user-friendly message for an error code
 */
export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN;
}

/**
 * Parse any error into a consistent ApiError structure
 */
export function parseError(error: unknown): ApiError {
  // Already an API error
  if (isApiError(error)) {
    return error;
  }

  // Network error (fetch failed)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      error: true,
      code: 'NETWORK_ERROR',
      message: getErrorMessage('NETWORK_ERROR'),
    };
  }

  // Abort error (timeout)
  if (error instanceof DOMException && error.name === 'AbortError') {
    return {
      error: true,
      code: 'TIMEOUT_ERROR',
      message: getErrorMessage('TIMEOUT_ERROR'),
    };
  }

  // Standard Error object
  if (error instanceof Error) {
    return {
      error: true,
      code: 'UNKNOWN',
      message: error.message || getErrorMessage('UNKNOWN'),
    };
  }

  // Object with message property
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return {
      error: true,
      code: (error as { code?: string }).code || 'UNKNOWN',
      message: String((error as { message: unknown }).message),
    };
  }

  // Fallback
  return {
    error: true,
    code: 'UNKNOWN',
    message: getErrorMessage('UNKNOWN'),
  };
}

/**
 * Check if an error requires user upgrade (payment required)
 */
export function isUpgradeRequired(error: unknown): boolean {
  if (isApiError(error)) {
    return error.code === 'PAYMENT_REQUIRED' || error.status === 402;
  }
  return false;
}

/**
 * Check if an error is a network/connectivity issue
 */
export function isNetworkError(error: unknown): boolean {
  if (isApiError(error)) {
    return error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT_ERROR';
  }
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  return false;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (isApiError(error)) {
    const retryableCodes = [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'EXTERNAL_SERVICE_ERROR',
      'RATE_LIMIT',
    ];
    return retryableCodes.includes(error.code);
  }
  return isNetworkError(error);
}

/**
 * Get retry delay for an error (if applicable)
 */
export function getRetryDelay(error: unknown): number | null {
  if (isApiError(error) && error.code === 'RATE_LIMIT') {
    const details = error.details as { retryAfter?: number } | undefined;
    return (details?.retryAfter || 60) * 1000; // Convert to milliseconds
  }
  if (isRetryableError(error)) {
    return 3000; // Default 3 second retry delay
  }
  return null;
}

/**
 * Format error for display (includes action hints)
 */
export function formatErrorForDisplay(error: unknown): {
  title: string;
  message: string;
  action?: string;
  actionLabel?: string;
} {
  const parsed = parseError(error);

  switch (parsed.code) {
    case 'PAYMENT_REQUIRED':
      return {
        title: 'Plan Limit Reached',
        message: parsed.message,
        action: '/pricing',
        actionLabel: 'Upgrade Plan',
      };

    case 'AUTHENTICATION_ERROR':
      return {
        title: 'Sign In Required',
        message: parsed.message,
        action: '/login',
        actionLabel: 'Sign In',
      };

    case 'NETWORK_ERROR':
      return {
        title: 'Connection Failed',
        message: parsed.message,
        actionLabel: 'Retry',
      };

    case 'GENERATION_FAILED':
      return {
        title: 'Generation Failed',
        message: parsed.message,
        actionLabel: 'Try Again',
      };

    default:
      return {
        title: 'Error',
        message: parsed.message,
      };
  }
}
