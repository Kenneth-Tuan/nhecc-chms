/**
 * 伺服器端通用工具函數
 */
import dayjs from "dayjs";

/**
 * 從出生日期字串計算年齡。
 */
export function calculateAge(dob: string): number {
  return dayjs().diff(dayjs(dob), "year");
}

/**
 * 產生簡易 ID (開發模式使用)。
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * 對陣列進行分頁處理。
 */
export function paginateArray<T>(
  items: T[],
  page: number,
  pageSize: number,
): {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
} {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = (page - 1) * pageSize;
  const data = items.slice(start, start + pageSize);

  return {
    data,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
    },
  };
}
