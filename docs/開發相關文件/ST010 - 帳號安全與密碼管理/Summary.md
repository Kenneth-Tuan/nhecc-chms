# ST010 - 帳號安全與密碼管理 (Account Security & Password Management)

**ID**: ST-010  
**Priority**: Should Have  
**Phase**: 4 - 角色與權限管理  
**Status**: 📝 Planning (Documentation Complete)

---

## 簡述

實作帳號安全功能，包含密碼重設（發送連結/手動設定）、強制登出、密碼強度檢查、以及登入歷史記錄。管理員可在會友編輯頁管理帳號安全，處理密碼問題、強制登出可疑帳號、查看登入歷史等。

---

## 核心功能

### 1. 會友編輯頁的帳號安全區塊
- 顯示帳號資訊（狀態、上次登入時間、上次登入 IP、帳號建立日期）
- 提供三個操作按鈕：
  - 重設密碼（發送連結 / 手動設定）
  - 強制登出（撤銷所有 Token）
  - 查看登入歷史

### 2. 重設密碼功能
- **選項 A: 發送密碼重設連結（Email）**
  - 系統生成重設 Token（有效期 1 小時）
  - 發送 Email 至會友的註冊信箱
  - 會友點擊連結後，導向密碼重設頁面
  - 輸入新密碼（符合密碼強度要求）
  - 顯示成功訊息，導向登入頁
  
- **選項 B: 管理員手動設定密碼**
  - 管理員直接輸入新密碼
  - 密碼強度即時檢查（Weak / Medium / Strong）
  - 可選擇是否通知會友（發送 Email）
  - 可選擇是否強制重新登入

### 3. 強制登出功能
- 撤銷該會友的所有 Refresh Tokens（Firebase Auth `revokeRefreshTokens`）
- 清除 UserContext 快取
- 會友下次請求時需重新登入

### 4. 密碼強度檢查
- 前端即時驗證（Zod Schema）
- 後端二次驗證（防止繞過前端）
- 密碼要求：
  - 至少 8 個字元
  - 至少包含 1 個英文字母
  - 至少包含 1 個數字
- 密碼強度等級：
  - Weak: 僅符合最低要求
  - Medium: 包含大小寫字母
  - Strong: 包含大小寫字母 + 特殊符號

### 5. 登入歷史記錄
- 儲存於 Firestore Subcollection `members/{memberId}/loginLogs`
- 記錄資訊：
  - 登入時間
  - IP 位址
  - 裝置資訊（User Agent）
  - 登入狀態（成功 / 失敗）
  - 失敗原因（若失敗）
- 查詢介面：
  - DataTable 顯示最近 30 天的登入記錄
  - 分頁查詢（每頁 10 筆）
  - 按登入時間降序排列（最新在前）

---

## 關鍵 Acceptance Criteria

- ✅ AC1: 會友編輯頁顯示帳號安全區塊，提供操作按鈕
- ✅ AC2: 重設密碼功能（發送連結 / 手動設定）
- ✅ AC3: 強制登出功能（撤銷 Token）
- ✅ AC4: 密碼強度檢查（前後端驗證）
- ✅ AC5: 登入歷史記錄（查詢與顯示）
- ⚪ AC6: 帳號鎖定功能（選填，可後續迭代）
- ⚪ AC7: 密碼過期提醒（選填，可後續迭代）
- ✅ AC8: 權限控制（`system:config` 權限）

---

## 技術亮點

1. **密碼 Hash**: 使用 Firebase Auth 預設的 bcrypt 機制
2. **Token 安全**: UUID v4，無法預測，有效期 1 小時，一次性使用
3. **強制登出**: 使用 Firebase Auth `revokeRefreshTokens` API
4. **登入歷史**: 非同步寫入，不阻擋登入流程
5. **密碼驗證**: 前後端共用 Zod Schema（TypeScript）
6. **Email 發送**: 支援 Firebase Extensions 或 SendGrid 等第三方服務

---

## 依賴項

- ✅ **ST001**: 資料核心與 Schema 定義 (`members.account`)
- ✅ **ST002**: RBAC Configuration（提供 `system:config` 權限檢查）
- ✅ **ST004**: 會友資料 CRUD（提供會友編輯頁）
- ⚠️ **Email 發送服務**: 需配置 Firebase Extensions 或第三方 Email 服務

---

## 相關 Stories

- **ST002**: RBAC Configuration（提供 `system:config` 權限檢查）
- **ST004**: 會友資料 CRUD（提供會友編輯頁）
- **ST009**: 角色指派介面（可選擇「強制重新登入」）
- **ST027**: 審計日誌（記錄密碼重設、強制登出等操作）

---

## 詳細文件

- 📄 [Description.md](./Description.md) - 完整需求文件（User Story, AC, Business Rules, UI/UX）
- 🏗️ [Technical Design.md](./Technical%20Design.md) - 技術設計文件（Data Models, API, Frontend/Backend Architecture）
- ❓ [Questions.md](./Questions.md) - 問題與澄清事項（15 個待確認問題）

---

**Last Updated**: 2026-02-16  
**Documentation Status**: Complete (Pending Review)
