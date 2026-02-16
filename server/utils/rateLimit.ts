/**
 * Rate Limiting Utilities (ST005 - Q4.1)
 * Prevents abuse by limiting reveal operations to 60 per minute per user.
 */
import type { H3Event } from 'h3';
import { getRevealCountSince } from './audit';

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REVEALS_PER_WINDOW = 60;

/**
 * Check if user has exceeded rate limit for reveal operations.
 * Throws 429 error if limit exceeded.
 */
export async function checkRevealRateLimit(event: H3Event): Promise<void> {
  const userContext = event.context.userContext;
  if (!userContext) {
    throw createError({ statusCode: 401, message: '未認證' });
  }

  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const count = await getRevealCountSince(userContext.userId, since);

  if (count >= MAX_REVEALS_PER_WINDOW) {
    throw createError({
      statusCode: 429,
      message: '操作過於頻繁，請稍後再試',
      data: {
        retryAfter: Math.ceil((RATE_LIMIT_WINDOW_MS - (Date.now() % RATE_LIMIT_WINDOW_MS)) / 1000),
      },
    });
  }
}

/**
 * Get remaining reveals for a user in the current window.
 */
export async function getRemainingReveals(userId: string): Promise<number> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const count = await getRevealCountSince(userId, since);
  return Math.max(0, MAX_REVEALS_PER_WINDOW - count);
}
