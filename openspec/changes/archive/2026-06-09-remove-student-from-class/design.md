## Context

在先前的迭代中，我們實作了管理員可以直接將學生指派到課程班級的功能。同時，我們在 `ClassStudentList.vue` 中預留了「移除」按鈕的 UI。為了補足班級名單管理的完整生命週期，我們需要實作移除學生的功能，讓管理員可以應對學生退選或錯誤指派的情況。

## Goals / Non-Goals

**Goals:**
- 實作後端 `removeStudentFromClass` 邏輯，確保原子性（移除 enrollment 並更新 class 的 `studentIds`）。
- 實作前後端對接，在前端按下「移除」按鈕時提供防呆提示，並在成功後更新 UI 列表。
- 確保移除操作受到 RBAC (`ADMIN_MANAGE`) 權限控管。

**Non-Goals:**
- 不包含移除後的自動系統通知（如發信或推播）。
- 不處理退費邏輯（MVP 階段不涉及金流）。

## Decisions

- **Transaction-based Deletion**: 移除學生需要修改兩個主要的 Firestore Collection：`courseClasses` (移除 `studentIds` 中的 userId，減少 `enrollmentCount`) 和 `courseEnrollments` (刪除或變更狀態)。
  *決定*: 我們將在 `courseEnrollment.service.ts` 中使用 Firestore Transaction，刪除對應的 `courseEnrollment` 文件，並同步更新 `courseClass` 的資料，以確保資料一致性。
- **Endpoint Structure**:
  *決定*: 採用 RESTful 風格，建立 `DELETE /api/courses/classes/[classId]/students/[userId]`。

## Risks / Trade-offs

- **[Risk]** 同時有多位管理員在操作同一班級，可能造成併發寫入衝突。
  → **Mitigation**: 使用 Firestore Transaction 來處理資料更新。
