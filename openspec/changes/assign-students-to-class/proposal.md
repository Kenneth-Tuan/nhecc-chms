## Why

班級詳情頁中的「指派學生」按鈕目前只是靜態展示，點擊無任何反應。管理員無法從後台介面將會員指派到特定班級。

### 設計決策：取消 Waitlist 流程 (MVP Scope)

**決策日期**: 2026-06-08

**原始設計**（見 `docs/開發相關文件/S系統/S系統流程圖.md`）：
1. 管理員建立課程模板 → 開放 Waitlist
2. 學生瀏覽課程 → 加入 Waitlist（`PENDING_WAITLIST`, `classId: null`）
3. 管理員從 Waitlist 勾選學生 → 建班 → 指派

**簡化後流程**（本次實作）：
1. 管理員建立課程模板 → 建立實體班級
2. 學生前台自行報名班級（已實作，`enrollToClass` → `ASSIGNED`）
3. **或** 管理員在後台直接從 members 表中搜尋並指派學生到班級

**決策原因**：
- MVP 階段優先降低管理員行政成本——無需額外管理 Waitlist 積壓
- 此流程與教會現行實際作業方式一致（管理員直接安排學生上課）
- 前台學生報名已經是直接報名到班級，Waitlist 入口從未在 UI 中實作

**未來展望**：
- 日後可加回 Waitlist 流程以收集學生偏好數據（例如：「哪些課程有高需求」）
- 現有的 `joinWaitlist` 後端邏輯與 `PENDING_WAITLIST` 狀態**暫時保留不刪除**，以利未來啟用
- `assignStudentsToClass` 方法亦保留，未來可從 Waitlist 指派時複用

## What Changes

- **前端 UI — 指派學生 Dialog**：點擊「指派學生」按鈕後開啟 PrimeVue Dialog，管理員可搜尋 members 表中的會員（以姓名搜尋），勾選後批量指派到該班級。
- **後端 API — 查詢可指派會員**：新增 `GET /api/courses/classes/[id]/assignable-members` 端點，回傳所有 Active 會員中尚未報名該班級所屬課程模板的會員清單。
- **後端 Service — 管理員指派邏輯**：新增 `adminAssignStudents(classId, userIds)` 方法，管理員替會員建立 enrollment（`status: ASSIGNED`），與現有 `enrollToClass` 邏輯相似但跳過前台報名限制（如 `isPublished`、`PUBLIC_ENROLL`）。
- **前端整合**：指派後刷新學生名單。

## Capabilities

### New Capabilities
- `assign-students-to-class`: 管理員在班級詳情頁中從 members 表搜尋會員並直接指派到班級。

### Modified Capabilities

## Impact

- **Affected Code**:
  - `[NEW] server/api/courses/classes/[id]/assignable-members.get.ts`
  - `[NEW] app/pages/dashboard/courses/classes/[classId]/_components/AssignStudentsDialog.vue`
  - `[MODIFY] server/services/courseEnrollment.service.ts` — 新增 `adminAssignStudents` 方法
  - `[MODIFY] app/composables/useCourseEnrollment.ts` — 新增 `fetchAssignableMembers` 與 `adminAssignStudents` 方法
  - `[MODIFY] app/pages/dashboard/courses/classes/[classId]/_components/ClassStudentList.vue` — 按鈕 click emit
  - `[MODIFY] app/pages/dashboard/courses/classes/[classId]/index.vue` — Dialog 整合與資料刷新
- **RBAC**: 使用現有的 `requireAbility(event, "manage", "CourseClass")`，與 `assign.post.ts` 一致。
- **不刪除的程式碼**（Future-proof）：`joinWaitlist`、`assignStudentsToClass`、`PENDING_WAITLIST` 狀態定義暫時保留。
