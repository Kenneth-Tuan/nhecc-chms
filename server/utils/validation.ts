/**
 * Server-side validation utilities
 */
import { createError, type H3Event } from 'h3';
import type { ZodSchema, ZodError } from 'zod';

/**
 * Validate data against a Zod schema.
 * Throws a 400 error with details if validation fails.
 */
export function validateWithSchema<T>(
  schema: ZodSchema<T>,
  data: unknown,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const formattedErrors = formatZodErrors(result.error);
    throw createError({
      statusCode: 400,
      message: '輸入資料驗證失敗',
      data: formattedErrors,
    });
  }
  return result.data;
}

/**
 * Format Zod validation errors into a readable structure.
 */
function formatZodErrors(
  error: ZodError,
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }
  return errors;
}

/**
 * Require a specific permission in the user context.
 * Throws 403 if user lacks the permission.
 */
export function requirePermission(
  event: H3Event,
  permission: string,
): void {
  const userContext = event.context.userContext;
  if (!userContext) {
    throw createError({
      statusCode: 401,
      message: '未認證',
    });
  }
  if (!userContext.permissions[permission]) {
    throw createError({
      statusCode: 403,
      message: `權限不足：缺少 ${permission} 權限`,
    });
  }
}

/**
 * Get user context from event, throwing 401 if not present.
 */
export function getUserContext(event: H3Event) {
  const userContext = event.context.userContext;
  if (!userContext) {
    throw createError({
      statusCode: 401,
      message: '未認證',
    });
  }
  return userContext;
}
