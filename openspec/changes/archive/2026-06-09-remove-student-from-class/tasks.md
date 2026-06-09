## 1. Backend Service

- [x] 1.1 在 `courseEnrollment.service.ts` 實作 `removeStudentFromClass(classId: string, userId: string, ability: AppAbility)` 方法。需包含權限檢查 (`ADMIN_MANAGE`)，並使用 Firestore transaction 刪除 `courseEnrollments` 紀錄，同時從 `courseClasses` 的 `studentIds` 移除該使用者並遞減 `enrollmentCount`。

## 2. Backend API Endpoint

- [x] 2.1 建立 `server/api/courses/classes/[id]/students/[userId].delete.ts` 路由端點，負責驗證參數並呼叫 `removeStudentFromClass`。

## 3. Frontend Integration

- [x] 3.1 在 `app/composables/useCourseEnrollment.ts` 新增 `removeStudentFromClass` 的請求方法。
- [x] 3.2 在 `app/pages/dashboard/courses/classes/[classId]/_components/ClassStudentList.vue` 實作按鈕的點擊事件，需先使用 PrimeVue 的 `useConfirm` 或手動實作確認視窗，避免誤刪。
- [x] 3.3 呼叫移除 API 成功後，更新畫面上的學生列表與 Toast 成功訊息。
