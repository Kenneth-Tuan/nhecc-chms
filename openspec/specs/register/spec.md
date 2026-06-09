# User Registration Specification

## Purpose

提供系統使用者帳號建立與個人資料完善功能，包含公開自主註冊（雙步驟 Stepper 流程，支援傳統 Email 與社群帳號）及受邀註冊驗證流程。
## Requirements
### Requirement: Public Self-Registration (Step 1 - Account Creation)

系統 SHALL 提供使用者填寫基本帳號資訊以建立帳號，並區分傳統註冊與社群註冊流程。

#### Scenario: 傳統 Email 註冊成功
- GIVEN 使用者位於自主註冊頁面且非社群登入狀態
- WHEN 使用者填寫姓名、手機、Email、設定密碼及確認密碼，並點擊「下一步」
- THEN 系統 SHALL 執行 `getStep1Schema(false)` Zod 驗證
- AND 驗證成功後，系統 SHALL 呼叫 Firebase Auth `registerWithEmail` 建立使用者
- AND 發送 POST `/api/auth/register` 將帳號資料存入資料庫
- AND 將 `activeStep` 切換至步驟 2

#### Scenario: 社群帳號（Google/LINE）初次註冊
- GIVEN 使用者由登入頁之社群登入跳轉至註冊頁，且 URL 包含社群 Query 參數
- WHEN 系統初始化
- THEN 系統 SHALL 自動預填姓名、Email 及頭像
- AND 將 Email 欄位設為唯讀且隱藏密碼與確認密碼欄位
- WHEN 使用者點擊「下一步」時
- THEN 系統 SHALL 執行 `getStep1Schema(true)` 驗證
- AND 驗證成功後，系統 SHALL 直接發送 POST `/api/auth/register` 將帳號資料寫入後端（略過 Firebase 建立流程，使用 Query 帶入之 `uid`）
- AND 將 `activeStep` 切換至步驟 2

#### Scenario: Email 已被註冊錯誤處理
- GIVEN 使用者進行傳統註冊
- WHEN 輸入的 Email 已被註冊且點擊下一步
- THEN 系統 SHALL 捕獲 Firebase `auth/email-already-in-use` 異常
- AND 彈出「此 Email 已被註冊」的 Toast 錯誤提示

---

### Requirement: Public Self-Registration (Step 2 - Profile Setup)

系統 SHALL 於帳號建立成功後，引導使用者完成個人會友資料，此步驟允許跳過。

#### Scenario: 完成個人檔案更新
- GIVEN 使用者進入註冊第二步驟
- WHEN 使用者設定頭像，選擇性別，輸入出生年月日，填寫是否已受洗（若受洗則輸入受洗日期），選擇歸屬牧區與歸屬小組，並點擊「完成註冊並開始使用」
- THEN 系統 SHALL 執行 `step2Schema` Zod 驗證
- AND 若有上傳新頭像，系統 SHALL 先將大頭貼上傳至 Storage
- AND 發送 PATCH `/api/members/${uid}` 更新資料庫個人資料
- AND 呼叫 `authStore.loadContext()` 同步狀態
- AND 成功後引導使用者跳轉頁面（管理員導向 `/dashboard`，一般使用者導向 `/`）

#### Scenario: 跳過個人檔案設定
- GIVEN 使用者位於註冊第二步驟
- WHEN 使用者點擊「稍後在個人檔案中完成」
- THEN 系統 SHALL 略過 PATCH 請求
- AND 直接呼叫 `authStore.loadContext()` 同步狀態並跳轉頁面

---

### Requirement: Invited Registration Workflow

系統 SHALL 支援透過邀請連結之受邀註冊流程，此流程不支援社群登入且角色由邀請設定。

#### Scenario: 載入邀請資訊成功
- GIVEN 使用者透過 `/register/invite?token=xxx` 開啟頁面
- WHEN 頁面載入時
- THEN 系統 SHALL 發送 GET `/api/invitations/${token}` 獲取邀請資訊
- AND 成功後呈現註冊表單

#### Scenario: 邀請連結無效或過期處理
- GIVEN 使用者使用無效邀請連結開啟頁面
- WHEN API 回傳失敗或過期狀態時
- THEN 系統 SHALL 顯示對應之錯誤訊息：
  - `expired` 為 true 顯示「此邀請連結已過期，請聯繫管理員重新發送。」
  - API 回傳 410 顯示「此邀請連結已失效或已被使用。」
  - API 回傳 404 顯示「邀請連結不存在，請確認連結是否正確。」
  - 其餘狀態顯示「載入邀請資料失敗，請稍後再試。」
- AND 隱藏註冊表單並提供「前往登入頁面」按鈕

#### Scenario: 受邀註冊表單驗證與提交
- GIVEN 邀請資訊載入成功且表單呈現
- WHEN 使用者填寫真實姓名、Email、手機及密碼後點擊「完成註冊」
- THEN 系統 SHALL 進行前端表單驗證（姓名必填、Email 格式、密碼長度至少 6 字元、兩次密碼一致）
- AND 驗證成功後發送 POST `/api/auth/register-by-invitation` 建立帳號
- AND 取得回傳之 `customToken` 並呼叫 Firebase Auth `signInWithCustomToken` 進行驗證
- AND 發送 POST `/api/auth/session` 以 `idToken` 寫入 Cookie Session
- AND 同步 `authStore` 後跳轉至首頁或後台

### Requirement: 管理員可將學生從實體班級移除
The system SHALL allow users with `ADMIN_MANAGE` permission on a `CourseClass` to remove an enrolled or assigned student from that class.
Upon removal, the student's enrollment record SHALL be deleted, and the class's `enrollmentCount` and `studentIds` list SHALL be updated accordingly in a single atomic transaction.

#### Scenario: 管理員成功移除學生
- **WHEN** the administrator initiates a request to remove a student (`userId`) from a class (`classId`)
- **THEN** the system SHALL delete the corresponding `courseEnrollment` document
- **THEN** the system SHALL remove the `userId` from the `CourseClass`'s `studentIds` list and decrement `enrollmentCount` by 1
- **THEN** the system SHALL return a success response

#### Scenario: 權限不足時拒絕移除
- **WHEN** a user without `ADMIN_MANAGE` permission attempts to remove a student from a class
- **THEN** the system SHALL return a 403 Forbidden error

#### Scenario: 學生不存在於班級中
- **WHEN** the administrator attempts to remove a student who is not currently enrolled in the specified class
- **THEN** the system SHALL return a 400 Bad Request error or 404 Not Found error indicating the enrollment does not exist

