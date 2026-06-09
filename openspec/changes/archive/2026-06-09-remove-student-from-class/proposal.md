## Why

目前課程班級的學生列表中有提供「移除」按鈕的 UI，但尚未實作移除學生的實際功能。為了讓管理員能修正誤指派的學生或處理學生退選需求，我們需要實作將特定學生從某個實體班級移除的功能。

## What Changes

- 在後端 `courseEnrollment.service.ts` 實作 `removeStudentFromClass` 的業務邏輯（使用 Firestore Transaction 確保原子性操作）。
- 建立新的後端 API 端點 (`DELETE /api/courses/classes/[classId]/students/[userId]`) 以處理移除請求。
- 更新 `useCourseEnrollment.ts` 的 Composable，新增 `removeStudentFromClass` 的請求方法。
- 修改 `ClassStudentList.vue` 中的「移除」按鈕，實作點擊後詢問確認並呼叫 API 移除學生的功能，完成後更新前端學生列表。

## Capabilities

### Modified Capabilities
- `register`: 新增管理員可以將已在實體班級中的學生移除的能力。

## Impact

- **Affected code**: 
  - `server/services/courseEnrollment.service.ts` (新增方法)
  - `server/api/courses/classes/[classId]/students/[userId].delete.ts` (新增端點)
  - `app/composables/useCourseEnrollment.ts` (新增請求方法)
  - `app/pages/dashboard/courses/classes/[classId]/_components/ClassStudentList.vue` (按鈕行為修改)
- **API**: 新增 `DELETE /api/courses/classes/[classId]/students/[userId]`
- **RBAC**: 移除學生需要符合 `CourseClass` 資源的 `ADMIN_MANAGE` 權限（映射至 CASL 的 `manage` action）。
