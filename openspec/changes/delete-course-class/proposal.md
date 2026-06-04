## Why

目前系統中已經有建立與修改班級的功能，但缺少刪除功能。當管理員不小心建錯班級或需要移除廢棄班級時，無法從介面或 API 直接操作。這個異動將補齊「刪除班級」的端到端實作。

## What Changes

- **後端 API**：新增 `DELETE /api/courses/classes/[id]` 端點，用來刪除班級。
- **後端服務與權限**：在 `CourseClassService.deleteClass` 補上 RBAC 驗證邏輯，使用現有的 `"courseClass:delete"` 權限以及必要的 Scope 驗證。
- **權限引擎**：更新 `app/utils/casl/ability.ts` 與 `server/utils/courseClass.policy.ts` 以完整支援 `delete` 動作。
- **前端串接**：在 `useCourseClass` composable 中實作 `deleteCourseClass` 函式。
- **前端 UI**：在班級的 UI 中依權限條件顯示刪除按鈕，並實作刪除前的確認對話框。

## Capabilities

### New Capabilities
- `course-class-management`: 班級管理的相關功能，包括本次實作的刪除班級。

### Modified Capabilities


## Impact

- **Affected Code**:
  - `[NEW] server/api/courses/classes/[id].delete.ts`
  - `[MODIFY] server/services/courseClass.service.ts`
  - `[MODIFY] app/utils/casl/ability.ts`
  - `[MODIFY] server/utils/courseClass.policy.ts`
  - `[MODIFY] app/composables/useCourseClass.ts`
  - `[MODIFY] 前端班級列表或詳細頁面元件`
- **RBAC**: 使用已存在的 `"courseClass:delete"` 權限。後端 API 必須呼叫 `requireAbility(event, "delete", "CourseClass")` 並由 Service 執行 `"ADMIN_DELETE"` Context 的詳細驗證。
- **Error Handling**: 依照架構規範，錯誤會由 `createError({ statusCode, message })` 拋出。針對有學生的班級，須拋出 `409 Conflict`。
