import { Context } from 'hono';

/**
 * Standardized error codes for API responses
 */
export const ErrorCode = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  WEBHOOK_VERIFICATION_FAILED: 'WEBHOOK_VERIFICATION_FAILED',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

/**
 * Standardized error response structure
 * Follows api-design.md principles
 */
export interface ErrorResponse {
  error: {
    code: ErrorCodeType;
    message: string;
    details?: Record<string, unknown> | Array<{ field: string; message: string }>;
  };
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  c: Context,
  code: ErrorCodeType,
  message: string,
  status: number = 400,
  details?: Record<string, unknown> | Array<{ field: string; message: string }>
): Response {
  return c.json({
    error: {
      code,
      message,
      ...(details && { details }),
    },
  }, status);
}

/**
 * Handle validation errors from Zod
 */
export function validationError(
  c: Context,
  issues: Array<{ path: Array<string>; message: string }>
): Response {
  const details = issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));

  return errorResponse(c, ErrorCode.VALIDATION_FAILED, 'Validation failed', 400, details);
}

/**
 * Handle unexpected errors
 * Follows security-fundamentals.md: Don't leak internal details
 */
export function serverError(c: Context, error: unknown): Response {
  const errorId = crypto.randomUUID();
  
  // Log the full error internally
  console.error(`[${errorId}] Server error:`, error);
  
  // Return generic message to client
  return errorResponse(
    c,
    ErrorCode.INTERNAL_ERROR,
    'An unexpected error occurred',
    500
  );
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  version: string;
  environment: string;
  checks: {
    database: 'ok' | 'error';
    timestamp: number;
  };
}

/**
 * Check database health
 */
export async function checkDatabaseHealth(db: D1Database): Promise<'ok' | 'error'> {
  try {
    await db.prepare('SELECT 1').first();
    return 'ok';
  } catch (error) {
    console.error('Database health check failed:', error);
    return 'error';
  }
}
