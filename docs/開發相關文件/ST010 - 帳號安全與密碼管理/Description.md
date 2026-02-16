# ST010 - 帳號安全與密碼管理 (Account Security & Password Management)

**ID**: ST-010  
**Priority**: Should Have  
**Phase**: 4 - 角色與權限管理

## User Story

> **As a** 系統管理員,  
> **I want to** 管理會友的帳號安全（重設密碼、強制登出、查看登入歷史）,  
> **So that** 我能在必要時處理帳號安全問題，確保系統安全與會友帳號受保護。

---

## Acceptance Criteria (AC)

### AC1: 會友編輯頁的帳號安全區塊

1. **區塊顯示**:
   - 在會友編輯頁（`/members/:id/edit`）顯示「帳號安全」區塊
   - 僅當該會友擁有帳號（`member.account` 存在）時顯示
   - 顯示以下資訊：
     - 帳號狀態（Active / Locked）
     - 上次登入時間
     - 上次登入 IP
     - 帳號建立日期

2. **操作按鈕**:
   - **重設密碼**（Button, severity="warn"）
   - **強制登出**（Button, severity="danger"）
   - **查看登入歷史**（Button, severity="secondary"）

3. **權限控制**:
   - 僅具備 `system:config` 權限的角色可執行以上操作

---

### AC2: 重設密碼功能

#### 選項 A: 發送密碼重設連結（Email）

1. **觸發方式**:
   - 點擊「重設密碼」按鈕
   - 顯示對話框：「選擇重設密碼方式」
   - 選項 1: 發送密碼重設連結（Email）
   - 選項 2: 管理員手動設定密碼

2. **發送密碼重設連結流程**:
   - 系統生成重設 Token（有效期 1 小時）
   - 發送 Email 至會友的註冊信箱
   - Email 內容：
     - 標題：「【新河教會】重設密碼通知」
     - 內容：「您的帳號密碼已由管理員重設，請點擊以下連結設定新密碼：[重設連結]。此連結將在 1 小時後失效。」
   - 顯示 Toast 確認訊息：「已發送密碼重設連結至 [Email]」

3. **重設密碼頁面**:
   - 會友點擊連結後，導向密碼重設頁面（`/auth/reset-password?token=xxx`）
   - 輸入新密碼（需符合密碼強度要求）
   - 確認新密碼（需與新密碼一致）
   - 點擊「設定新密碼」按鈕
   - 顯示成功訊息：「密碼已更新，請重新登入」
   - 自動導向登入頁

#### 選項 B: 管理員手動設定密碼

1. **觸發方式**:
   - 在「選擇重設密碼方式」對話框選擇「管理員手動設定密碼」
   - 顯示「設定新密碼」對話框

2. **設定新密碼對話框**:
   - **標題**: 為 [會友姓名] 設定新密碼
   - **內容**:
     - 新密碼輸入框（Password, type="password"）
     - 密碼強度指示器（Weak / Medium / Strong）
     - 密碼要求說明：
       - 至少 8 個字元
       - 至少包含 1 個英文字母
       - 至少包含 1 個數字
     - Checkbox: 「設定後立即通知會友（發送 Email）」
     - Checkbox: 「設定後強制會友重新登入」
   - **按鈕**:
     - 取消 (outlined)
     - 確定設定 (severity="primary")

3. **設定後動作**:
   - 更新會友的密碼
   - 若勾選「立即通知會友」，發送 Email 通知（不含密碼，僅通知已重設）
   - 若勾選「強制重新登入」，清除該會友的所有 Token（執行強制登出）
   - 顯示 Toast 確認訊息：「已為 [會友姓名] 設定新密碼」

---

### AC3: 強制登出功能

1. **觸發方式**:
   - 點擊「強制登出」按鈕
   - 顯示確認對話框：「確定要強制 [會友姓名] 登出嗎？此操作將清除所有裝置的登入狀態。」

2. **執行動作**:
   - 清除該會友的所有 Token（Firebase Auth `revokeRefreshTokens`）
   - 清除 UserContext 快取
   - 顯示 Toast 確認訊息：「已強制 [會友姓名] 登出」

3. **後續效果**:
   - 該會友下次請求時，Token 驗證失敗
   - 前端自動導向登入頁

---

### AC4: 密碼強度檢查

1. **密碼要求**:
   - 至少 8 個字元
   - 至少包含 1 個英文字母（大小寫不拘）
   - 至少包含 1 個數字

2. **密碼強度等級**:
   - **Weak（弱）**: 僅符合最低要求（8 碼 + 英數）
   - **Medium（中）**: 符合最低要求 + 包含大小寫字母
   - **Strong（強）**: 符合最低要求 + 包含大小寫字母 + 包含特殊符號

3. **前端即時驗證**:
   - 使用 PrimeVue `Password` 元件
   - 顯示密碼強度指示器（Progress Bar）
   - 若密碼不符合要求，顯示錯誤訊息

4. **後端驗證**:
   - 在 API 層驗證密碼強度（防止繞過前端驗證）
   - 若密碼不符合要求，回傳 400 錯誤

---

### AC5: 登入歷史記錄

1. **觸發方式**:
   - 點擊「查看登入歷史」按鈕
   - 顯示登入歷史對話框

2. **登入歷史對話框**:
   - **標題**: [會友姓名] 的登入歷史
   - **內容**: DataTable 顯示最近 30 天的登入記錄
   - **欄位**:
     - 登入時間（DateTime）
     - IP 位址
     - 裝置資訊（User Agent）
     - 登入狀態（成功 / 失敗）
   - **排序**: 預設按登入時間降序排列（最新在前）
   - **分頁**: 每頁顯示 10 筆

3. **登入記錄資料來源**:
   - **選項 A**: 儲存於 Firestore Collection `loginLogs`
   - **選項 B**: 儲存於 Firestore Subcollection `members/{memberId}/loginLogs`
   - **選項 C**: 使用 Firebase Auth Admin SDK 的登入事件（需額外設定）
   - **目前採用方案**: B（Subcollection）

4. **登入記錄寫入時機**:
   - 會友登入成功時，寫入登入記錄（Server Middleware）
   - 記錄資訊：
     - `timestamp`: 登入時間
     - `ipAddress`: IP 位址（從 Request Header 取得）
     - `userAgent`: 裝置資訊
     - `status`: 'success' | 'failed'
     - `failReason`: 失敗原因（若失敗）

---

### AC6: 帳號鎖定功能（選填，可後續迭代）

1. **鎖定觸發條件**:
   - 連續 5 次登入失敗
   - 管理員手動鎖定

2. **鎖定後效果**:
   - 會友無法登入（顯示錯誤訊息：「帳號已被鎖定，請聯絡管理員」）
   - 管理員在會友編輯頁看到「帳號已鎖定」標示

3. **解鎖方式**:
   - 管理員點擊「解鎖帳號」按鈕
   - 顯示確認對話框：「確定要解鎖 [會友姓名] 的帳號嗎？」
   - 解鎖後，會友可正常登入

---

### AC7: 密碼過期提醒（選填，可後續迭代）

1. **密碼有效期**:
   - 預設 180 天（6 個月）
   - 可在系統設定中調整

2. **過期前提醒**:
   - 密碼到期前 7 天，會友登入時顯示提醒訊息：「您的密碼將在 X 天後到期，請儘速更新密碼」
   - 提供「立即更新」按鈕（導向更新密碼頁）

3. **密碼過期後**:
   - 會友登入時強制導向更新密碼頁
   - 更新密碼後方可進入系統

---

### AC8: 權限控制 (RBAC)

1. **查看登入歷史** (member:view):
   - 所有具備 `member:view` 權限的角色皆可查看會友的登入歷史

2. **重設密碼 / 強制登出 / 鎖定帳號** (system:config):
   - 僅具備 `system:config` 權限的角色可執行以上操作
   - 在會友編輯頁，若無權限則隱藏「帳號安全」區塊

---

## Business Rules

### BR1: 密碼儲存安全
- **Hash 演算法**: 使用 Firebase Auth 預設的密碼 Hash 機制（bcrypt）
- **禁止明文儲存**: 系統任何位置皆不可儲存明文密碼
- **密碼不可查詢**: 系統無法查詢會友的密碼（僅能重設）

### BR2: 密碼重設 Token 安全
- **有效期**: 1 小時
- **一次性使用**: 使用後立即失效
- **Token 格式**: UUID v4（隨機產生，無法預測）
- **儲存位置**: Firestore Collection `passwordResetTokens`

### BR3: 強制登出機制
- **Token 撤銷**: 使用 Firebase Auth `revokeRefreshTokens` API
- **快取清除**: 同時清除 UserContext 快取
- **生效時機**: 立即生效（下次請求時驗證失敗）

### BR4: 登入歷史保留期限
- **保留期限**: 30 天
- **自動清理**: 使用 Firebase Cloud Functions 定期清理（每日凌晨 2 點）
- **例外**: 重大安全事件（如連續登入失敗）可保留更久

### BR5: 帳號鎖定規則
- **自動鎖定**: 連續 5 次登入失敗（同一 IP）
- **鎖定時效**: 鎖定後 30 分鐘自動解鎖（選項 A）或 需管理員手動解鎖（選項 B）
- **目前採用方案**: A（30 分鐘自動解鎖）

### BR6: 密碼重設通知
- **通知內容**: 不包含密碼明文，僅通知「已重設密碼」
- **通知時機**: 
  - 選項 A：僅在勾選「立即通知會友」時發送
  - 選項 B：重設密碼時一律發送通知
- **目前採用方案**: A（管理員選擇是否通知）

---

## UI/UX Requirements

### UX1: 會友編輯頁的帳號安全區塊

**Layout:**
- 位於會友編輯頁的「系統資訊」Section
- 顯示標題：「帳號安全」
- 下方顯示帳號資訊卡片 + 操作按鈕

**帳號資訊卡片樣式:**
```
[Card: bg-slate-50]
  帳號狀態: Active [Badge: severity="success"]
  上次登入: 2026-02-15 14:30
  上次登入 IP: 192.168.1.100
  帳號建立日期: 2024-01-01
```

**操作按鈕 Layout:**
```
[Flex: gap-2]
  [Button: 重設密碼, severity="warn", icon="pi pi-key"]
  [Button: 強制登出, severity="danger", icon="pi pi-sign-out"]
  [Button: 查看登入歷史, severity="secondary", icon="pi pi-history"]
```

### UX2: 重設密碼對話框

**選擇重設方式對話框:**
- 使用 PrimeVue `Dialog` 元件
- 標題：「重設密碼」
- 內容：兩個大按鈕（Card 樣式）
  - 發送密碼重設連結（推薦）
    - Icon: pi-envelope
    - 說明：會友將收到 Email 連結，自行設定新密碼
  - 管理員手動設定密碼
    - Icon: pi-lock
    - 說明：由管理員直接設定新密碼

**管理員手動設定密碼對話框:**
- 標題：「為 [會友姓名] 設定新密碼」
- 內容：
  - PrimeVue `Password` 元件（含密碼強度指示器）
  - 密碼要求說明（小字）
  - 兩個 Checkboxes

### UX3: 強制登出確認對話框

**樣式:**
- 使用 PrimeVue `ConfirmDialog` 元件
- Icon: pi-exclamation-triangle, severity="danger"
- 標題：「確認強制登出」
- 內容：「確定要強制 [會友姓名] 登出嗎？此操作將清除所有裝置的登入狀態。」
- 按鈕：
  - 取消 (severity="secondary")
  - 確定登出 (severity="danger")

### UX4: 登入歷史對話框

**樣式:**
- 使用 PrimeVue `Dialog` 元件
- 標題：「[會友姓名] 的登入歷史」
- 內容：PrimeVue `DataTable`
- 表格欄位：
  - 登入時間（寬度 200px）
  - IP 位址（寬度 150px）
  - 裝置資訊（寬度 auto）
  - 登入狀態（寬度 100px，Tag 元件）

### UX5: Toast 確認訊息

**成功訊息（發送重設連結）:**
```
severity: 'success'
summary: '已發送密碼重設連結'
detail: '已發送至 example@email.com'
life: 3000
```

**成功訊息（手動設定密碼）:**
```
severity: 'success'
summary: '密碼已設定'
detail: '已為 [會友姓名] 設定新密碼'
life: 3000
```

**成功訊息（強制登出）:**
```
severity: 'success'
summary: '已強制登出'
detail: '[會友姓名] 已被強制登出'
life: 3000
```

---

## Technical Considerations

### TC1: 密碼重設 Token 管理
- **儲存位置**: Firestore Collection `passwordResetTokens`
- **Schema**:
  ```typescript
  {
    token: string;        // UUID v4
    memberId: string;     // 會友 ID
    email: string;        // 會友 Email
    expiresAt: Timestamp; // 到期時間（1 小時後）
    used: boolean;        // 是否已使用
    createdAt: Timestamp;
  }
  ```
- **清理機制**: Firebase Cloud Functions 定期清理過期 Token

### TC2: 強制登出實作
- **方法 1**: 使用 Firebase Auth `revokeRefreshTokens` API
  - 優點：官方推薦方式，安全可靠
  - 缺點：僅撤銷 Refresh Token，現有 Access Token 仍有效（最多 1 小時）
- **方法 2**: 在 `members` Collection 新增 `tokensRevokedAfter` 欄位
  - 優點：立即生效（Middleware 檢查）
  - 缺點：需修改 Middleware 邏輯
- **目前採用方案**: 方法 1（Firebase Auth `revokeRefreshTokens`）

### TC3: 登入歷史記錄效能
- **寫入策略**: 非同步寫入（不阻擋登入流程）
- **查詢策略**: 
  - 使用 Firestore Composite Index（`memberId` + `timestamp desc`）
  - 限制查詢最近 30 天（減少掃描量）
  - 分頁查詢（每頁 10 筆）

### TC4: Email 發送
- **發送方式**: 使用 Firebase Extensions（Trigger Email）或第三方服務（SendGrid, Mailgun）
- **Email 模板**: 使用 HTML 模板（支援品牌視覺）
- **發送失敗處理**: 寫入錯誤日誌，顯示 Toast 錯誤訊息

### TC5: 密碼強度驗證
- **前端**: 使用 Zod Schema 驗證
- **後端**: 使用相同的 Zod Schema 驗證（共用 Type）
- **Zod Schema**:
  ```typescript
  const passwordSchema = z.string()
    .min(8, '密碼至少需要 8 個字元')
    .regex(/[A-Za-z]/, '密碼需包含至少 1 個英文字母')
    .regex(/[0-9]/, '密碼需包含至少 1 個數字');
  ```

---

## Out of Scope

以下功能不在此 Story 範圍內：

- ❌ 雙因素驗證（2FA）（後續迭代）
- ❌ 登入裝置管理（查看所有登入裝置、遠端登出特定裝置）（後續迭代）
- ❌ 密碼過期自動提醒（後續迭代）
- ❌ 帳號鎖定功能（選填，可後續迭代）
- ❌ 會友自行更改密碼（由 ST003 會友個人頁面負責）

---

## Dependencies

- ✅ **ST001**: 資料核心與 Schema 定義 (members.account)
- ✅ **ST002**: RBAC Configuration（提供 `system:config` 權限檢查）
- ✅ **ST004**: 會友資料 CRUD（提供會友編輯頁）
- ⚠️ **Email 發送服務**: 需配置 Firebase Extensions 或第三方 Email 服務

---

## Success Metrics

- ✅ 能夠發送密碼重設連結，會友收到 Email 並成功重設密碼
- ✅ 能夠由管理員手動設定會友密碼
- ✅ 能夠強制會友登出，會友下次請求時需重新登入
- ✅ 能夠查看會友的登入歷史（最近 30 天）
- ✅ 密碼強度檢查正常運作（前後端驗證）
- ✅ 權限控制正確套用（僅 `system:config` 可執行操作）

---

## Related Stories

- **ST002**: RBAC Configuration（提供 `system:config` 權限檢查）
- **ST004**: 會友資料 CRUD（提供會友編輯頁）
- **ST009**: 角色指派介面（可選擇「強制重新登入」）
- **ST027**: 審計日誌（記錄密碼重設、強制登出等操作）
