/**
 * Shared server utilities
 */
import dayjs from 'dayjs';

/**
 * Calculate age from date of birth string.
 */
export function calculateAge(dob: string): number {
  return dayjs().diff(dayjs(dob), 'year');
}

/**
 * Generate a simple UUID (for DEV mode).
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Paginate an array.
 */
export function paginateArray<T>(
  items: T[],
  page: number,
  pageSize: number,
): { data: T[]; pagination: { page: number; pageSize: number; totalItems: number; totalPages: number } } {
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
