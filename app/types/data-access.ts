/**
 * data_access 集合型別定義
 * Firestore 文件路徑: data_access/{userId}
 */

/** 行政範圍授權 */
export interface AdminScope {
  isGlobal: boolean;
  zone: string[];
  group: string[];
}

/** 功能/業務範圍授權 */
export interface FunctionsScope {
  isGlobal: boolean;
  targets: Record<string, string[]>;
}

/** 完整的 data_access 文件結構 */
export interface DataAccess {
  updatedAt: string;
  updatedBy: string;
  admin: AdminScope;
  functions: FunctionsScope;
}

/** 建立或覆寫 data_access 文件的 payload */
export interface SetDataAccessPayload {
  admin: AdminScope;
  functions: FunctionsScope;
}

/** PATCH 操作類型 */
export type DataAccessAction = "grant" | "revoke" | "setGlobal";

/** PATCH 請求 body */
export type DataAccessPatchPayload =
  | { action: "grant"; scope: "admin"; field: "zone" | "group"; id: string }
  | { action: "revoke"; scope: "admin"; field: "zone" | "group"; id: string }
  | { action: "grant"; scope: "functions"; targetType: string; id: string }
  | { action: "revoke"; scope: "functions"; targetType: string; id: string }
  | { action: "setGlobal"; scope: "admin" | "functions"; isGlobal: boolean };

/** 空白 data_access 結構 */
export function createEmptyDataAccess(): Omit<DataAccess, "updatedAt" | "updatedBy"> {
  return {
    admin: { isGlobal: false, zone: [], group: [] },
    functions: { isGlobal: false, targets: {} },
  };
}
