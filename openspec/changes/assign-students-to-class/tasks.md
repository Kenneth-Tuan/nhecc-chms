## 1. Service 層 — 管理員指派邏輯

- [ ] 1.1 在 `server/services/courseEnrollment.service.ts` 新增 `adminAssignStudents(classId: string, userIds: string[], ability: AppAbility): Promise<void>` 方法。
- [ ] 1.2 實作 Firestore transaction：讀取 class → 檢查 `ADMIN_MANAGE` policy → 逐一驗證 userId（老師不可自指派、重複報名檢查） → 檢查容量 → 批量建立 enrollment (`ASSIGNED`) → 更新 class `studentIds/enrollmentCount`。
- [ ] 1.3 每個 enrollment 的 doc ID 使用 `buildEnrollmentId(userId, templateId)` 保持與現有邏輯一致。

## 2. Service 層 — 查詢可指派會員

- [ ] 2.1 在 `server/services/courseEnrollment.service.ts` 新增 `getAssignableMembers(classId: string, ability: AppAbility): Promise<AssignableMember[]>` 方法。
- [ ] 2.2 實作流程：查出 class → 取 templateId → 查 courseEnrollments 中所有 templateId 匹配的 userIds → 查 members (status=Active) → 排除已報名的 userIds 和班級 teacherIds → 回傳 `{ userId, fullName, mobile }[]`。
- [ ] 2.3 定義回傳型別 `AssignableMember { userId: string; fullName: string; mobile: string }`。

## 3. API 端點

- [ ] 3.1 新增 `server/api/courses/classes/[id]/assignable-members.get.ts`：`requireAbility(event, "manage", "CourseClass")` → 呼叫 `getAssignableMembers(classId, ability)` → 回傳 `{ data }`.
- [ ] 3.2 新增 `server/api/courses/classes/[id]/assign-members.post.ts`：`requireAbility(event, "manage", "CourseClass")` → 讀取 `{ userIds }` → 呼叫 `adminAssignStudents(classId, userIds, ability)` → 回傳 `{ success: true }`。

## 4. 前端 Composable

- [ ] 4.1 在 `app/composables/useCourseEnrollment.ts` 新增 `fetchAssignableMembers(classId: string)` 方法。
- [ ] 4.2 在 `app/composables/useCourseEnrollment.ts` 新增 `adminAssignStudents(classId: string, userIds: string[])` 方法。

## 5. 前端 UI — AssignStudentsDialog 元件

- [ ] 5.1 新增 `app/pages/dashboard/courses/classes/[classId]/_components/AssignStudentsDialog.vue`。
- [ ] 5.2 Props：`visible: boolean`、`classId: string`。Emits：`update:visible`、`assigned`。
- [ ] 5.3 Dialog 開啟時呼叫 `fetchAssignableMembers(classId)` 載入可指派會員列表。
- [ ] 5.4 DataTable + `v-model:selection` 實作 checkbox 多選。欄位：姓名、聯絡電話。搜尋欄使用 DataTable 的 global filter 搜尋姓名。
- [ ] 5.5 空狀態提示：「目前沒有可指派的會員」。
- [ ] 5.6 「確認指派」按鈕：disabled 條件為未勾選 + loading。點擊呼叫 `adminAssignStudents(classId, userIds)`。
- [ ] 5.7 成功 → emit `assigned` + success toast + 關閉 Dialog。失敗 → error toast。

## 6. 前端整合

- [ ] 6.1 `ClassStudentList.vue`：「指派學生」按鈕加 `@click` emit `assign-click`。
- [ ] 6.2 `index.vue`：引入 `AssignStudentsDialog`，綁定 visible/classId，監聽 `assigned` 後 re-fetch students。
