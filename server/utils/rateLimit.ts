/**
 * 速率限制工具 (ST005 - Q4.1)
 * 限制每位使用者每分鐘最多執行 60 次解鎖操作，以防止濫用。
 */
import type { H3Event } from "h3";
import { getRevealCountSince } from "./audit";

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 分鐘
const MAX_REVEALS_PER_WINDOW = 60;

/**
 * 檢查使用者是否超過解鎖操作的速率限制。
 * 若超過限制則拋出 429 錯誤。
 */
export async function checkRevealRateLimit(event: H3Event): Promise<void> {
  const userContext = event.context.userContext;
  if (!userContext) {
    throw createError({ statusCode: 401, message: "未認證" });
  }

  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const count = await getRevealCountSince(userContext.userId, since);

  if (count >= MAX_REVEALS_PER_WINDOW) {
    throw createError({
      statusCode: 429,
      message: "操作過於頻繁，請稍後再試",
      data: {
        retryAfter: Math.ceil(
          (RATE_LIMIT_WINDOW_MS - (Date.now() % RATE_LIMIT_WINDOW_MS)) / 1000,
        ),
      },
    });
  }
}

/**
 * 獲取使用者在當前時間範圍內剩餘的解鎖次數。
 */
export async function getRemainingReveals(userId: string): Promise<number> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const count = await getRevealCountSince(userId, since);
  return Math.max(0, MAX_REVEALS_PER_WINDOW - count);
}
