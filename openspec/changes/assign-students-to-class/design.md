## Context

班級詳情頁 (`[classId]/index.vue`) 已完整實作班級管理功能。「指派學生」按鈕未綁定行為。

現有程式碼中兩條報名路徑：
1. **學生自行報名**（已實作）：`/api/explore/enroll` → `enrollToClass(userId, classId)` → Firestore transaction，建立 enrollment (`ASSIGNED`) + 更新 class `studentIds/enrollmentCount`。有 `PUBLIC_ENROLL` policy、容量檢查、重複報名檢查、先修條件檢查。
2. **管理員從 Waitlist 指派**（已實作但無 UI）：`/api/courses/classes/assign` → `assignStudentsToClass(classId, enrollmentIds)` → 將既有的 `PENDING_WAITLIST` enrollment 更新為 `ASSIGNED`。

本次新增第三條路徑：
3. **管理員從 members 表直接指派**：對選取的 member userIds，直接建立 enrollment (`ASSIGNED`)，不經過 Waitlist 中間狀態。

## Goals / Non-Goals

**Goals:**
- 新增 API 查詢「可指派的會員」——Active 且尚未報名該課程模板的會員。
- 新增管理員指派 service 方法，跳過前台限制（`isPublished`、`PUBLIC_ENROLL`），但保留容量檢查與老師不可自指派檢查。
- 建立 PrimeVue Dialog，支援姓名搜尋 + checkbox 多選 + 批量指派。
- 指派完成後自動刷新學生名單。

**Non-Goals:**
- 不刪除 Waitlist 相關程式碼（`joinWaitlist`、`assignStudentsToClass`、`PENDING_WAITLIST`），為未來啟用保留。
- 不改動前台學生自行報名流程 (`enrollToClass`)。
- 不實作先修條件檢查——管理員指派時信任管理員的判斷。
- 不實作從 Dialog 中移除已指派學生。

## Decisions

- **新 API: `GET /api/courses/classes/[id]/assignable-members`**
  從 classId 反查 templateId → 查 `courseEnrollments` 中已有該 templateId 的 userIds → 查 members 排除這些 userIds → 回傳 Active 會員。
  - *替代方案*：前端先拉全部 members 再前端 filter。但 members 可能上千筆，且無法安全地讓前端知道 enrollment 狀態。
  - *決策*：後端統一處理 filter 邏輯，前端只負責搜尋與顯示。

- **新 Service: `adminAssignStudents(classId, userIds, ability)`**
  與 `enrollToClassTransaction` 類似但：
  1. 使用 `ADMIN_MANAGE` policy 而非 `PUBLIC_ENROLL`
  2. 不檢查 `isPublished`
  3. 不檢查先修條件（管理員可信）
  4. 接受 `userIds[]` 而非 `enrollmentIds[]`（因為 enrollment 不存在，需在 transaction 中建立）
  5. 保留容量檢查、老師不可自指派、重複報名檢查
  - *替代方案*：複用 `enrollToClass` 逐筆呼叫。但這樣每個 userId 都是獨立 transaction，效能差且無法原子性檢查容量。

- **前端搜尋用 client-side filter**
  Dialog 開啟時一次載入所有可指派會員（已由後端 filter 過 enrollment），前端用 DataTable 的 `globalFilter` 搜尋姓名。
  - *理由*：已排除已報名的會員後，筆數通常不多（< 500），前端 filter 足夠。

- **Dialog 使用 emit 通知刷新**
  `AssignStudentsDialog` emit `assigned` → parent re-fetch students。保持單向資料流。

## Risks / Trade-offs

- **[Risk]** 會員數量多時 `assignable-members` API 可能慢（需 pull 全部 members + filter）。
  - **Mitigation**: 教會場景通常 < 2000 會員。後續可加 Firestore composite index 或分頁。

- **[Risk]** 管理員可能誤指派不符先修條件的學生。
  - **Mitigation**: MVP 允許，管理員在教會場景有完整判斷權。未來可在 Dialog 中顯示先修條件 warning（不阻擋）。

- **[Risk]** 並發指派超過 maxCapacity。
  - **Mitigation**: Firestore transaction 內檢查，與現有 `enrollToClassTransaction` 一致。
