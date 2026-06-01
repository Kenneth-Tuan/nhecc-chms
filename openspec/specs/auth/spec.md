# User Authentication Specification

## Purpose

提供系統使用者登入介面，支援 Email/Password 傳統登入、Google 單一登入 (SSO) 及 LINE 社交登入，並處理登入後之 Session 寫入與頁面跳轉。

## Requirements

### Requirement: Email and Password Authentication

系統 SHALL 允許使用者輸入帳號（Email 或手機）與密碼進行驗證登入。

#### Scenario: 登入成功
- GIVEN 使用者位於登入頁面
- WHEN 使用者輸入正確的帳號與密碼，並點擊「立即登入」
- THEN 系統 SHALL 呼叫 Firebase Auth 進行 Email 驗證
- AND 登入按鈕呈現 Loading 狀態
- AND 驗證成功後，系統 SHALL 將 Session 寫入 Pinia Store，並執行登入後重導向

#### Scenario: 欄位未填防呆
- GIVEN 使用者位於登入頁面
- WHEN 帳號或密碼任一欄位為空值時點擊「立即登入」
- THEN 系統 MUST 攔截操作，不發送驗證請求

#### Scenario: 登入驗證失敗
- GIVEN 使用者位於登入頁面
- WHEN 使用者輸入錯誤憑證並提交登入
- THEN 系統 SHALL 捕獲 Firebase Auth 異常
- AND 顯示錯誤 Toast 訊息，錯誤訊息對應如下：
  - `auth/invalid-credential` 顯示「帳號或密碼錯誤」
  - `auth/user-not-found` 顯示「找不到此帳號」
  - `auth/wrong-password` 顯示「密碼錯誤」
  - 其餘異常顯示「登入失敗，請稍後再試」
- AND Toast 提示持續時間 MUST 為 4000ms

---

### Requirement: Google Single Sign-On (SSO)

系統 SHALL 支援 Google 帳號授權登入，並區分新舊使用者流程。

#### Scenario: 現有 Google 使用者登入成功
- GIVEN 使用者點擊 Google 登入按鈕
- WHEN Firebase 驗證回傳且該帳號已為註冊使用者 (isNewUser === false)
- THEN 系統 SHALL 取得登入狀態並執行重導向

#### Scenario: 全新 Google 使用者導向註冊
- GIVEN 使用者點擊 Google 登入按鈕
- WHEN Firebase 驗證回傳且該帳號為全新使用者 (isNewUser === true)
- THEN 系統 SHALL 自動導向 `/register` 註冊頁面
- AND 於 URL 攜帶 Query 參數：`uid`、`fullName` (對應 displayName)、`email`、`avatar` (對應 photoURL) 以及 `social: 'google'`

---

### Requirement: LINE Login Integration

系統 SHALL 支援 LINE 社交登入，並整合 LIFF 環境。

#### Scenario: 導向 LIFF 頁面
- GIVEN 使用者點擊 LINE 登入按鈕
- WHEN 系統處理 LINE 登入時
- THEN 系統 SHALL 跳轉至 `/liff` 頁面進行授權
- AND 若原本路由中帶有 `redirect` 參數，MUST 進行編碼後夾帶於 `/liff` 查詢參數中

---

### Requirement: Post-Login Redirection

系統 SHALL 在登入完成後引導使用者至正確的目的地頁面。

#### Scenario: 依據 redirect 參數跳轉
- GIVEN 使用者成功登入
- WHEN 路由中包含 `redirect` 參數
- THEN 系統 SHALL 將使用者導向該 `redirect` 指定之路徑

#### Scenario: 依據使用者身分之預設跳轉
- GIVEN 使用者成功登入且路由中無 `redirect` 參數
- WHEN 系統判斷使用者角色身分
- THEN 若使用者為管理員 (isAdmin)，系統 SHALL 導向 `/dashboard`
- AND 若非管理員，系統 SHALL 導向 `/`
