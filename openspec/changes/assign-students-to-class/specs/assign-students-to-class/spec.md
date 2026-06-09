## ADDED Requirements

### Requirement: 查詢可指派會員列表
系統 SHALL 提供 API 端點 `GET /api/courses/classes/[id]/assignable-members`，回傳所有 Active 狀態且尚未報名該班級所屬課程模板的會員清單。

#### Scenario: 成功查詢可指派會員
- **GIVEN** 班級 A 屬於課程模板 T，已有 3 位學生報名
- **WHEN** 管理員呼叫 `GET /api/courses/classes/A/assignable-members`
- **THEN** 系統回傳所有 Active 會員中，不在課程模板 T 的 `courseEnrollments` 中的會員
- **THEN** 每筆回傳包含 `userId`、`fullName`、`mobile`

#### Scenario: 排除老師
- **GIVEN** 會員 X 是班級 A 的授課老師
- **WHEN** 管理員查詢可指派會員
- **THEN** 會員 X 不出現在可指派列表中

#### Scenario: 排除已報名的會員
- **GIVEN** 會員 Y 已報名課程模板 T 的任何班級（status 為 ASSIGNED / IN_PROGRESS / COMPLETED）
- **WHEN** 管理員查詢可指派會員
- **THEN** 會員 Y 不出現在可指派列表中

#### Scenario: 權限不足
- **WHEN** 使用者不具備 `manage CourseClass` 權限
- **THEN** 系統回傳 403 錯誤

### Requirement: 指派學生 Dialog 介面
管理員 SHALL 能從班級詳情頁點擊「指派學生」按鈕開啟 Dialog，使用 PrimeVue DataTable 搭配 checkbox 勾選會員後指派到班級。

#### Scenario: 開啟指派 Dialog
- **GIVEN** 班級狀態為 `SETUP` 且使用者具有管理權限
- **WHEN** 使用者點擊「指派學生」按鈕
- **THEN** 系統開啟 Dialog，載入可指派會員列表
- **THEN** DataTable 顯示姓名、聯絡電話欄位，每列帶有 checkbox

#### Scenario: 姓名搜尋篩選
- **GIVEN** Dialog 已開啟且載入會員列表
- **WHEN** 管理員在搜尋欄輸入姓名關鍵字
- **THEN** DataTable 即時篩選顯示匹配的會員

#### Scenario: 無可指派會員時的空狀態
- **WHEN** Dialog 開啟但所有會員都已報名該課程模板
- **THEN** 顯示空狀態訊息：「目前沒有可指派的會員」

#### Scenario: Dialog 在非 SETUP 狀態時不可用
- **GIVEN** 班級狀態不為 `SETUP`
- **THEN** 「指派學生」按鈕不顯示

### Requirement: 管理員批量指派學生
管理員 SHALL 能勾選多位會員後點擊「確認指派」，系統為每位會員建立 enrollment 並加入班級。

#### Scenario: 成功批量指派
- **GIVEN** 管理員已勾選 3 位會員
- **WHEN** 點擊「確認指派」按鈕
- **THEN** 系統為每位會員建立 enrollment（`status: ASSIGNED`，`classId` 指向該班級）
- **THEN** 班級的 `studentIds` 與 `enrollmentCount` 同步更新
- **THEN** 成功後顯示 success toast：「已成功指派 N 位學生」
- **THEN** Dialog 關閉，學生名單自動刷新

#### Scenario: 未勾選任何會員
- **WHEN** 管理員未勾選任何會員
- **THEN** 「確認指派」按鈕為 disabled 狀態

#### Scenario: 指派時班級已額滿
- **GIVEN** 指派後總人數將超過 `maxCapacity`
- **WHEN** 管理員點擊「確認指派」
- **THEN** 後端 transaction 檢測到超過容量，回傳 400 錯誤
- **THEN** 前端顯示 error toast

#### Scenario: 指派過程的 Loading 狀態
- **WHEN** 指派請求正在進行中
- **THEN** 「確認指派」按鈕顯示 loading spinner 並 disabled，防止重複提交

#### Scenario: 會員已在另一個同模板班級中
- **GIVEN** 會員 Z 已報名同 templateId 的另一個班級
- **WHEN** 管理員嘗試指派會員 Z
- **THEN** 後端 transaction 檢測到重複報名，回傳 400 錯誤
- **THEN** 前端顯示 error toast
