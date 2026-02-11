/**
 * API common type definitions
 */

/** Pagination parameters */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/** Sort parameters */
export interface SortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

/** Standard API success response */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/** Standard API error response */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/** Union API response */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/** Reveal sensitive data request */
export interface RevealRequest {
  fields: string[];
}

/** Reveal sensitive data response */
export interface RevealResponse {
  [field: string]: string;
}
