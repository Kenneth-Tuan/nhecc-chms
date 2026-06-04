## Context

目前系統中 `server/services/courseClass.service.ts` 已經有 `deleteClass` 方法的實作雛形，但尚未連接對外的 API，且缺乏對應的權限控制機制。為確保系統資料安全性與功能完整性，需要補齊端到端（End-to-End）的實作。

## Goals / Non-Goals

**Goals:**
- 提供完整的後端 API `DELETE /api/courses/classes/[id]`，以處理刪除請求。
- 在 `ability.ts` 與 `policy.ts` 中補齊 `delete` 的 CASL 映射，並在 Service 層實作完善的 RBAC 權限驗證。
- 在前端 composables 提供對應的 `deleteCourseClass` 呼叫方法。
- 在前端介面依據權限條件加入刪除按鈕與防呆確認機制。
- 保護資料關聯性，禁止刪除已開始或已有報名的班級。

**Non-Goals:**
- 不涉及深入的軟刪除（Soft Delete）機制或級聯刪除（Cascade Delete），以最安全的狀態阻擋取代複雜的關聯處理。

## Decisions

- **補齊 CASL 權限映射**：先前的實作漏掉了 `ability.ts` 中的映射，必須加上 `if (userContext.permissions["courseClass:delete"]) can("delete", "CourseClass")`，並在 `policy.ts` 中新增 `"ADMIN_DELETE"` context。
- **狀態與資料孤兒保護**：由於 Firestore 缺乏 Foreign Key constraint，直接刪除班級會導致 `courseEnrollments` 與 `courseAttendances` 留下孤兒資料。因此，在 `deleteClass` 方法內**強制檢查**，若班級狀態不為 `SETUP` 或是 `enrollmentCount > 0`，一律拋出 `409` 拒絕刪除。
- **權限驗證放在 Service 層與 API 層**：API 層使用 `requireAbility(event, "delete", "CourseClass")` 做第一道攔截，Service 核心業務邏輯再用 `assertClassAccess` 做深度驗證。
- **前端條件渲染**：刪除按鈕必須使用 `$can('delete', 'CourseClass')`（或對應前端權限檢查機制）包覆，避免無權限用戶看到按鈕。

## Risks / Trade-offs

- **[Risk]** 刪除已經開始或有學生報名的班級可能導致資料孤兒（Orphan Records）。
  - **Mitigation**: 強制實作狀態防禦（409 阻擋），不允許刪除已有學生的班級。使用者若要刪除，必須先手動清空學生報名紀錄（或未來再做級聯刪除），確保資料一致性。
