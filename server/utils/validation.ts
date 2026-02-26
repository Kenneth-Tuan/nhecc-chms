/**
 * 伺服器端驗證工具函式
 */
import { createError, type H3Event } from "h3";
import type { ZodSchema, ZodError } from "zod";

/**
 * 根據 Zod schema 驗證資料。
 * 如果驗證失敗，拋出包含詳細錯誤內容的 400 錯誤。
 */
export function validateWithSchema<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const formattedErrors = formatZodErrors(result.error);
    throw createError({
      statusCode: 400,
      message: "輸入資料驗證失敗",
      data: formattedErrors,
    });
  }
  return result.data;
}

/**
 * 將 Zod 驗證錯誤格式化為易讀的結構。
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_root";
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }
  return errors;
}

/**
 * 要求進行 CASL 權限檢查。
 * 若未通過身份驗證則拋出 401，若權限檢查失敗則拋出 403。
 */
export function requireAbility(
  event: H3Event,
  action: import("~/utils/casl/ability").AppAction,
  subject: any,
): void {
  const ability = event.context.ability;
  if (!ability) {
    throw createError({
      statusCode: 401,
      message: "未認證",
    });
  }

  if (!ability.can(action, subject)) {
    const subjectName =
      typeof subject === "string" ? subject : subject.__type || "資料";
    throw createError({
      statusCode: 403,
      message: `權限不足：需要 ${action} ${subjectName}`,
    });
  }
}

/**
 * 從 event 中獲取用戶上下文，若不存在則拋出 401。
 */
export function getUserContext(event: H3Event) {
  const userContext = event.context.userContext;
  if (!userContext) {
    throw createError({
      statusCode: 401,
      message: "未認證",
    });
  }
  return userContext;
}
