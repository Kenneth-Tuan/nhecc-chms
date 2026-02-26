/**
 * API 通用型別定義
 */

/** 分頁參數 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/** 排序參數 */
export interface SortParams {
  sortBy: string;
  sortOrder: "asc" | "desc";
}

/** 分頁回應包裝介面 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

/** 標準 API 成功回應介面 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/** 標準 API 錯誤回應介面 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/** API 聯合回應型別 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/** 解鎖敏感資造請求介面 */
export interface RevealRequest {
  fields: string[];
}

/** 解鎖敏感資料回應結果 */
export interface RevealResponse {
  [field: string]: string;
}
