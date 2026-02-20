# ST010 - Questions & Clarifications

本文件記錄開發過程中需要澄清的問題與決策點。

---

## 🔴 Critical Questions (阻擋開發)

### Q1: Email 發送服務的選擇

**問題描述**:  
密碼重設連結需要透過 Email 發送，應採用哪種 Email 發送服務？

**選項**:
- A. Firebase Extensions (Trigger Email from Firestore)
- B. SendGrid（第三方服務，需付費）
- C. AWS SES（第三方服務，需付費）
- D. Mailgun（第三方服務，需付費）
- E. 自架 SMTP Server（需自行維護）

**採用方案**: A

**考量因素**:
- **Firebase Extensions**:
  - 優點：整合方便，與 Firebase 生態系統緊密結合
  - 缺點：功能較陽春，客製化選項較少
- **SendGrid / AWS SES / Mailgun**:
  - 優點：功能完整，支援模板引擎、追蹤開信率、客製化 Header
  - 缺點：需額外付費，需管理 API Key

**影響範圍**: 
- `server/services/email.service.ts` 的實作
- Email 模板的管理方式
- 系統環境變數設定

---

### Q2: 強制登出的實作方式

**問題描述**:  
強制登出應採用哪種實作方式？

**選項**:
- A. 使用 Firebase Auth `revokeRefreshTokens` API
  - 優點：官方推薦方式，安全可靠
  - 缺點：僅撤銷 Refresh Token，現有 Access Token 仍有效（最多 1 小時）
- B. 在 `members` Collection 新增 `tokensRevokedAfter` 欄位，Middleware 檢查
  - 優點：立即生效（Middleware 檢查）
  - 缺點：需修改 Middleware 邏輯，增加查詢開銷
- C. 同時使用 A + B（雙重保障）

**採用方案**: B

**原因**:
- 官方推薦方式，穩定可靠
- Access Token 有效期預設為 1 小時，可接受
- 若需立即生效，可再實作選項 B

**影響範圍**: 
- `auth.service.ts` 的 `forceLogout` 方法
- `server/middleware/01.auth.ts` 的 Token 驗證邏輯

---

### Q3: 登入歷史的儲存位置

**問題描述**:  
登入歷史應儲存於哪個 Firestore Collection？

**選項**:
- A. 儲存於 Firestore Collection `loginLogs`（所有會友的登入記錄在同一個 Collection）
  - 優點：查詢方便（可跨會友查詢）
  - 缺點：資料量大時查詢慢，需建立 Composite Index
- B. 儲存於 Firestore Subcollection `members/{memberId}/loginLogs`（每位會友有自己的登入記錄）
  - 優點：資料隔離，查詢快（僅查詢該會友的記錄）
  - 缺點：無法跨會友查詢（如：查詢所有登入失敗記錄）

**採用方案**: B（Subcollection）

**原因**:
- 符合「登入歷史」的查詢場景（通常只查詢單一會友）
- 資料隔離，避免單一 Collection 資料量過大
- 若需跨會友查詢（如：安全審計），可再實作 Collection Group Query

**影響範圍**: 
- `login-log.repository.ts` 的實作
- `auth.service.ts` 的 `getLoginLogs` 方法

---

## 🟡 High Priority Questions (影響 UX)

### Q4: 密碼重設 Token 的有效期

**問題描述**:  
密碼重設 Token 應設定多久的有效期？

**選項**:
- A. 30 分鐘
- B. 1 小時（推薦）
- C. 2 小時
- D. 24 小時

**採用方案**: B（1 小時）

**原因**:
- 符合一般網站的做法（如 Gmail、Facebook）
- 給予會友足夠時間重設密碼，但不至於太長導致安全風險

**影響範圍**: 
- `auth.service.ts` 的 `sendPasswordResetLink` 方法

---

### Q5: 密碼重設後是否強制登出

**問題描述**:  
當管理員手動設定會友密碼時，是否預設勾選「強制重新登入」？

**選項**:
- A. 預設勾選（推薦）
- B. 預設不勾選（管理員自行決定）

**目前採用方案**: B（預設不勾選）

**原因**:
- 給予管理員彈性
- 一般情況下不需強制登出（如：會友忘記密碼，管理員協助重設）
- 重大安全事件（如：帳號被盜）時可勾選強制登出

**影響範圍**: 
- `SetPasswordDialog.vue` 的 `forceLogout` Checkbox 預設值

---

### Q6: 密碼變更通知的時機

**問題描述**:  
當管理員手動設定會友密碼時，是否一律發送 Email 通知會友？

**選項**:
- A. 一律發送通知（推薦）
- B. 提供 Checkbox 讓管理員選擇是否通知（預設勾選）
- C. 提供 Checkbox 讓管理員選擇是否通知（預設不勾選）

**採用方案**: B（Checkbox，預設勾選）

**原因**:
- 符合資安最佳實踐（密碼變更應通知使用者）
- 給予管理員彈性（如：當面協助會友重設時，不需發送 Email）

**影響範圍**: 
- `SetPasswordDialog.vue` 的 `notifyMember` Checkbox 預設值
- `auth.service.ts` 的 `setPassword` 方法

---

### Q7: 登入歷史的保留期限

**問題描述**:  
登入歷史應保留多久？

**選項**:
- A. 30 天（推薦）
- B. 90 天
- C. 180 天
- D. 永久保留

**採用方案**: A（30 天）

**原因**:
- 符合一般網站的做法
- 平衡資料儲存成本與安全審計需求
- 若需查詢更早的記錄，可再調整保留期限

**影響範圍**: 
- Firebase Cloud Functions 的定期清理邏輯
- 登入歷史查詢的時間範圍限制

---

### Q8: 登入失敗記錄的處理

**問題描述**:  
是否需要記錄登入失敗的歷史？

**選項**:
- A. 記錄登入失敗（推薦）
- B. 僅記錄登入成功
- C. 記錄登入失敗，但僅保留最近 5 次

**採用方案**: A（記錄登入失敗）

**原因**:
- 有助於安全審計（檢測暴力破解攻擊）
- 幫助管理員診斷會友登入問題

**影響範圍**: 
- `server/middleware/01.auth.ts` 的登入失敗處理邏輯
- `LoginHistoryDialog.vue` 的顯示邏輯

---

## 🟢 Medium Priority Questions (功能細節)

### Q9: 帳號鎖定功能的實作時機

**問題描述**:  
帳號鎖定功能（連續登入失敗 5 次）是否在此 Story 實作？

**選項**:
- A. 在此 Story 實作（推薦，若時間允許）
- B. 後續迭代實作（標記為選填功能）

**採用方案**: B（後續迭代）

**原因**:
- 帳號鎖定功能較複雜，需考慮自動解鎖、手動解鎖、解鎖通知等細節
- 先實作核心功能（密碼重設、強制登出），後續再補充帳號鎖定

**影響範圍**: 
- `member.account.status` 欄位的處理邏輯
- `server/middleware/01.auth.ts` 的登入失敗次數計數

---

### Q10: 密碼過期提醒的實作時機

**問題描述**:  
密碼過期提醒功能（密碼 180 天後到期）是否在此 Story 實作？

**選項**:
- A. 在此 Story 實作
- B. 後續迭代實作（標記為選填功能）（推薦）

**採用方案**: B（後續迭代）

**原因**:
- 密碼過期功能較複雜，需修改會友登入流程、更新密碼頁面等
- 一般教會資訊系統不一定需要密碼過期功能（非公開網站）

**影響範圍**: 
- `member.account.passwordChangedAt` 欄位的新增
- `server/middleware/01.auth.ts` 的密碼過期檢查邏輯

---

### Q11: 密碼強度要求的彈性

**問題描述**:  
密碼強度要求（8 碼 + 英數）是否應可在系統設定中調整？

**選項**:
- A. 固定要求，不可調整（推薦）
- B. 可在系統設定中調整（如：最小長度、是否需特殊符號）

**採用方案**: A（固定要求）

**原因**:
- 簡化實作邏輯
- 密碼要求已符合一般網站的標準
- 若需調整，可透過程式碼修改 `passwordSchema`

**影響範圍**: 
- `usePasswordValidation.ts` 的 `passwordSchema` 定義

---

### Q12: 重設密碼頁面的設計

**問題描述**:  
會友點擊重設密碼連結後，應導向哪個頁面？

**選項**:
- A. 公開頁面（不需登入，如：`/auth/reset-password?token=xxx`）（推薦）
- B. 登入後頁面（需先登入，再重設密碼）

**採用方案**: A（公開頁面）

**原因**:
- 會友忘記密碼時無法登入，應使用公開頁面
- 符合一般網站的做法

**影響範圍**: 
- `app/pages/auth/reset-password.vue` 的權限設定
- `auth.service.ts` 的 `sendPasswordResetLink` 方法（Email 連結）

---

### Q13: 登入歷史的查詢效能優化

**問題描述**:  
登入歷史查詢是否需要建立 Composite Index？

**選項**:
- A. 需要（`memberId` + `timestamp desc`）（推薦）
- B. 不需要（資料量不大，單一會友的登入記錄通常 < 100 筆）

**採用方案**: A（需要建立 Index）

**原因**:
- 雖然使用 Subcollection，但仍建議建立 Index 以確保查詢效能
- Firestore 會在首次查詢時提示建立 Index

**影響範圍**: 
- `login-log.repository.ts` 的查詢邏輯
- Firestore Index 設定（`firestore.indexes.json`）

---

## 🔵 Low Priority Questions (錦上添花)

### Q14: 登入裝置管理功能

**問題描述**:  
是否需要「登入裝置管理」功能（查看所有登入裝置、遠端登出特定裝置）？

**選項**:
- A. 在此 Story 實作
- B. 後續迭代實作（推薦）

**採用方案**: B（後續迭代），請將所有後續迭代的功能記錄在另外一個檔案中。

**原因**:
- 登入裝置管理較複雜，需記錄裝置 Token、裝置名稱、上次活動時間等
- 先實作核心功能，後續再補充

**影響範圍**: 
- 需新增 `devices` Subcollection
- 需修改登入流程，記錄裝置 Token

---

### Q15: 雙因素驗證 (2FA)

**問題描述**:  
是否需要雙因素驗證功能（如：TOTP、SMS 驗證碼）？

**選項**:
- A. 在此 Story 實作
- B. 後續迭代實作（推薦）

**目前採用方案**: B（後續迭代）

**原因**:
- 雙因素驗證較複雜，需整合 TOTP 生成、QR Code 顯示、驗證碼輸入等
- 一般教會資訊系統不一定需要 2FA（非公開網站）

**影響範圍**: 
- 需新增 2FA 設定頁面
- 需修改登入流程，增加驗證碼輸入步驟

---

## 📝 Design Decisions (已決策)

### D1: 密碼儲存方式

**決策**: 使用 Firebase Auth 預設的密碼 Hash 機制（bcrypt）

**原因**:
- 安全可靠，符合業界標準
- 無需自行實作 Hash 邏輯
- Firebase Auth 自動處理密碼加鹽、多次 Hash 等安全措施

---

### D2: 密碼重設 Token 格式

**決策**: 使用 UUID v4（隨機產生，無法預測）

**原因**:
- UUID v4 足夠隨機，無法預測
- 長度適中（36 字元），適合作為 URL 參數

---

### D3: 登入歷史寫入策略

**決策**: 非同步寫入，不阻擋登入流程

**原因**:
- 登入歷史記錄為次要功能，不應影響登入效能
- 若寫入失敗（如：Firestore 暫時無法連線），不應導致登入失敗

---

### D4: 強制登出後的 UserContext 快取清除

**決策**: 強制登出時同時清除 UserContext 快取

**原因**:
- 確保權限即時生效
- 與 ST009 的角色變更邏輯一致

---

## 📌 Notes & Assumptions

1. **Email 發送服務待確認**: 此 Story 需要 Email 發送服務，實作前需先確認使用哪種服務

2. **會友帳號結構**: 假設 `member.account` 欄位已存在（由 ST001 定義）

3. **Firebase Auth 整合**: 假設專案已整合 Firebase Auth（由 ST001 完成）

4. **RBAC 權限檢查**: 假設 `system:config` 權限已定義（由 ST002 完成）

5. **會友編輯頁整合**: 需修改現有的會友編輯頁（ST004），新增「帳號安全」區塊

6. **公開頁面路由**: 需確認 `/auth/reset-password` 頁面為公開頁面（不需登入）

---

**Last Updated**: 2026-02-16  
**Maintained By**: Development Team
