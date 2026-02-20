// src/types/error.types.ts

/**
 * Standard error codes used throughout the application
 */
export type ErrorCode = 
  | 'TENANT_VIOLATION'
  | 'INVALID_CREDENTIALS'
  | 'RESOURCE_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'TOKEN_EXPIRED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'DUPLICATE_ENTRY'
  | 'CONFLICT'
  | 'BAD_REQUEST'
  | 'INTERNAL_SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'DATABASE_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'CLINIC_LIMIT_EXCEEDED'
  | 'SUBSCRIPTION_EXPIRED'
  | 'TRIAL_EXPIRED'
  | 'PAYMENT_REQUIRED'
  | 'INSUFFICIENT_PERMISSIONS';

/**
 * HTTP status code mapping
 */
export type HttpStatusCode = 
  | 400 // Bad Request
  | 401 // Unauthorized
  | 403 // Forbidden
  | 404 // Not Found
  | 409 // Conflict
  | 422 // Unprocessable Entity
  | 429 // Too Many Requests
  | 500 // Internal Server Error
  | 502 // Bad Gateway
  | 503 // Service Unavailable
  | 504 // Gateway Timeout;

/**
 * Base error response from API
 */
export interface BaseErrorResponse {
  code: ErrorCode;
  status_code: HttpStatusCode;
  timestamp: string;
  path?: string;
  method?: string;
  request_id?: string;
}

/**
 * Validation error details
 */
export interface ValidationErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
  ctx?: Record<string, unknown>;
}

/**
 * Validation error response (422)
 */
export interface ValidationErrorResponse extends BaseErrorResponse {
  code: 'VALIDATION_ERROR';
  detail: ValidationErrorDetail[];
  message: string; // User-friendly summary
}

/**
 * Tenant violation error (403)
 */
export interface TenantViolationError extends BaseErrorResponse {
  code: 'TENANT_VIOLATION';
  detail: {
    message: string;
    attempted_clinic_id?: number;
    user_clinic_id?: number;
    resource_type?: string;
    resource_id?: string | number;
  };
  message: string;
}

/**
 * Authentication error (401)
 */
export interface AuthError extends BaseErrorResponse {
  code: 'INVALID_CREDENTIALS' | 'UNAUTHORIZED' | 'TOKEN_EXPIRED';
  detail: {
    message: string;
    reason?: 'invalid_password' | 'user_not_found' | 'account_locked' | 'email_not_verified';
    remaining_attempts?: number;
    lockout_duration?: number;
  };
  message: string;
}

/**
 * Permission error (403)
 */
export interface PermissionError extends BaseErrorResponse {
  code: 'PERMISSION_DENIED' | 'INSUFFICIENT_PERMISSIONS';
  detail: {
    message: string;
    required_role?: string[];
    user_role?: string;
    required_permissions?: string[];
    missing_permissions?: string[];
    resource?: string;
  };
  message: string;
}

/**
 * Resource not found error (404)
 */
export interface NotFoundError extends BaseErrorResponse {
  code: 'RESOURCE_NOT_FOUND';
  detail: {
    message: string;
    resource_type?: string;
    resource_id?: string | number;
    search_params?: Record<string, unknown>;
  };
  message: string;
}

/**
 * Rate limit error (429)
 */
export interface RateLimitError extends BaseErrorResponse {
  code: 'RATE_LIMIT_EXCEEDED';
  detail: {
    message: string;
    retry_after: number; // seconds
    limit: number;
    remaining: number;
    reset_time: string; // ISO timestamp
    endpoint?: string;
  };
  message: string;
}

/**
 * Conflict error (409)
 */
export interface ConflictError extends BaseErrorResponse {
  code: 'CONFLICT' | 'DUPLICATE_ENTRY';
  detail: {
    message: string;
    conflicting_field?: string;
    conflicting_value?: string;
    existing_resource_id?: string | number;
    resolution_hint?: string;
  };
  message: string;
}

/**
 * Clinic limit error (403)
 */
export interface ClinicLimitError extends BaseErrorResponse {
  code: 'CLINIC_LIMIT_EXCEEDED';
  detail: {
    message: string;
    limit_type: 'doctors' | 'patients' | 'lab_staff' | 'pharmacists' | 'storage' | 'appointments';
    current_usage: number;
    max_allowed: number;
    subscription_tier: string;
    upgrade_required: boolean;
    upgrade_url?: string;
  };
  message: string;
}

/**
 * Subscription error (402/403)
 */
export interface SubscriptionError extends BaseErrorResponse {
  code: 'SUBSCRIPTION_EXPIRED' | 'PAYMENT_REQUIRED' | 'TRIAL_EXPIRED';
  detail: {
    message: string;
    expiry_date?: string;
    days_overdue?: number;
    required_tier?: string;
    payment_method_required?: boolean;
    auto_renew_enabled?: boolean;
    invoice_id?: string;
    amount_due?: number;
    currency?: string;
  };
  message: string;
}

/**
 * Database error (500)
 */
export interface DatabaseError extends BaseErrorResponse {
  code: 'DATABASE_ERROR';
  detail: {
    message: string;
    constraint?: string;
    table?: string;
    operation?: 'create' | 'update' | 'delete' | 'read';
    error_code?: string;
    retryable?: boolean;
  };
  message: string;
}

/**
 * Bad request error (400)
 */
export interface BadRequestError extends BaseErrorResponse {
  code: 'BAD_REQUEST';
  detail: {
    message: string;
    field?: string;
    reason?: string;
    invalid_value?: unknown;
    expected_format?: string;
  };
  message: string;
}

/**
 * Internal server error (500)
 */
export interface InternalServerError extends BaseErrorResponse {
  code: 'INTERNAL_SERVER_ERROR';
  detail: {
    message: string;
    error_id?: string;
    retryable?: boolean;
    estimated_recovery_time?: number; // seconds
  };
  message: string;
}

/**
 * Service unavailable error (503)
 */
export interface ServiceUnavailableError extends BaseErrorResponse {
  code: 'SERVICE_UNAVAILABLE';
  detail: {
    message: string;
    service_name?: string;
    maintenance_mode?: boolean;
    estimated_downtime?: number; // seconds
    alternative_endpoints?: string[];
  };
  message: string;
}

/**
 * Network error (client-side)
 */
export interface NetworkError {
  code: 'NETWORK_ERROR' | 'TIMEOUT_ERROR';
  message: string;
  detail: {
    isOnline: boolean;
    timeout?: number;
    attempted_url?: string;
    retry_count?: number;
    error_type?: 'dns' | 'connection' | 'timeout' | 'canceled';
  };
}

/**
 * Union type of all possible errors
 */
export type ApiError  = 
  | BaseErrorResponse
  | ValidationErrorResponse
  | TenantViolationError 
  | AuthError
  | PermissionError
  | NotFoundError
  | RateLimitError
  | ConflictError
  | ClinicLimitError
  | SubscriptionError
  | DatabaseError;

/**
 * Type guard functions
 */
export function isValidationError(error: ApiError): error is ValidationErrorResponse {
  return error.code === 'VALIDATION_ERROR';
}

export function isTenantViolation(error: ApiError): error is TenantViolationError {
  return error.code === 'TENANT_VIOLATION';
}

export function isAuthError(error: ApiError): error is AuthError {
  return ['INVALID_CREDENTIALS', 'UNAUTHORIZED', 'TOKEN_EXPIRED'].includes(error.code);
}

export function isPermissionError(error: ApiError): error is PermissionError {
  return ['PERMISSION_DENIED', 'INSUFFICIENT_PERMISSIONS'].includes(error.code);
}

export function isNotFoundError(error: ApiError): error is NotFoundError {
  return error.code === 'RESOURCE_NOT_FOUND';
}

export function isRateLimitError(error: ApiError): error is RateLimitError {
  return error.code === 'RATE_LIMIT_EXCEEDED';
}

export function isConflictError(error: ApiError): error is ConflictError {
  return ['CONFLICT', 'DUPLICATE_ENTRY'].includes(error.code);
}

export function isClinicLimitError(error: ApiError): error is ClinicLimitError {
  return error.code === 'CLINIC_LIMIT_EXCEEDED';
}

export function isSubscriptionError(error: ApiError): error is SubscriptionError {
  return error.code === 'SUBSCRIPTION_EXPIRED';
}

export function isDatabaseError(error: ApiError): error is DatabaseError {
  return error.code === 'DATABASE_ERROR';
}

export function isNetworkError(error: unknown): error is NetworkError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    ['NETWORK_ERROR', 'TIMEOUT_ERROR'].includes((error as NetworkError).code)
  );
}