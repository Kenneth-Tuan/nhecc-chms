# E2E Testing — nhecc-chms

使用 [Playwright](https://playwright.dev/) 搭配 Firebase Emulator 進行端對端測試。

---

## 架構

```
tests/e2e/
├── playwright.config.ts   # Playwright 設定（baseURL、webServer、timeout 等）
├── helpers/
│   └── auth.ts            # 共用登入 helpers 與 CSS selector 常數
└── specs/
    ├── login.spec.ts      # 登入流程測試
    ├── register.spec.ts   # 自主 / 受邀註冊流程測試
    └── members.spec.ts    # 會友管理功能測試
```

---

## 環境需求

- Firebase Emulator（Auth + Firestore + Storage）需在本機運行
- Seed 資料已透過 `yarn seed:emulator` 寫入
- Nuxt dev server 需在 `http://localhost:3777` 運行（`playwright.config.ts` 的 `webServer` 設定會自動起動）

測試密碼（所有 seed 帳號共用）：`Test@12345`

---

## 執行方式

### 完整流程（從零起動）

自動清 Port → 起動 Emulator → Seed 資料 → 跑 Playwright：

```bash
# 跑所有 e2e（headless）
yarn test:e2e

# 跑所有 e2e（Playwright UI 模式，可單選測試）
yarn test:e2e:ui
```

### Emulator 已在跑的情況下

當你已經透過 `yarn dev:emulator:all` 或 `yarn emulator:start` 起動 emulator，
可用以下指令直接跑 Playwright（省略重新起動 emulator 的時間）：

```bash
# 跑所有 e2e
yarn playwright:test

# 跑特定 spec 檔
yarn playwright:test tests/e2e/specs/login.spec.ts

# 用 --grep 過濾特定 test name
yarn playwright:test --grep "admin 登入"
yarn playwright:test --grep "搜尋姓名"

# UI 模式（點選個別測試執行）
yarn playwright:test:ui
```

> **注意**：不要直接跑 `yarn playwright test`（不加 `--config`），
> 否則 Playwright 會掃到 `tests/unit/` 的 Vitest 檔案而報錯。

---

## 測試帳號（Seed 資料）

| 姓名 | Email | 角色 | Scope |
|------|-------|------|-------|
| 王管理員 | `admin@nhecc.org` | super_admin | Global |
| 張恩典 | `zhang.grace@nhecc.org` | zone_leader | zone-youth |
| 李喜樂 | `li.joy@nhecc.org` | group_leader | zone-youth |
| 陳詩恩 | `chen.teacher@nhecc.org` | teacher | zone-family |
| 林會友 | `lin.member@nhecc.org` | general | zone-youth |

密碼：`Test@12345`

---

## Spec 一覽

### `login.spec.ts` — 登入流程

| 測試名稱 | 說明 |
|---------|------|
| admin 登入成功應重導向至 /dashboard | 正常登入，驗證 redirect |
| 空白帳密送出不應離開 /login | 前端防呆，不送 API |
| 只填帳號不填密碼不應離開 /login | 前端防呆 |
| 錯誤密碼應顯示 Toast 錯誤訊息 | 錯誤回饋驗證 |
| 不存在帳號應顯示 Toast 錯誤訊息 | Firebase `invalid-credential` 處理 |

### `register.spec.ts` — 註冊流程

| 測試名稱 | 說明 |
|---------|------|
| 傳統 Email/Password 自主註冊成功流程 (Step 1 + Step 2) | 完整兩步驟填寫 |
| 自主註冊可跳過第二步驟個人檔案設定 | Step 2 跳過按鈕 |
| 有效邀請 Token 應能正常載入表單並成功註冊 | 使用 seed token `test-valid-invite-token` |
| 過期邀請 Token 應阻擋註冊並顯示錯誤提示 | 使用 seed token `test-expired-invite-token` |
| 已使用邀請 Token 應阻擋註冊並顯示錯誤提示 | 使用 seed token `test-used-invite-token` |

### `members.spec.ts` — 會友管理

使用 `admin@nhecc.org` 登入，驗證完整管理流程。

| 測試名稱 | 說明 |
|---------|------|
| 會友管理清單應正確渲染資料並分頁 | 清單渲染、分頁器 |
| 搜尋姓名應能正確過濾會友清單 | 搜尋 + 清除 |
| 點擊會友 Row 應打開 Quick View 預覽彈窗並能成功關閉 | Dialog 開關 |
| 點擊新增會友應導向新增頁面 | 路由導向 |
| 點擊編輯會友應導向編輯頁面 | 路由導向 |
| 點擊刪除會友應彈出確認對話框並可取消 | 刪除確認 Dialog |

---

## Helpers

### `helpers/auth.ts`

| 匯出 | 說明 |
|------|------|
| `TEST_PASSWORD` | 所有 seed 帳號共用密碼 |
| `SEL` | 登入頁 CSS selector 常數（email、password、submit、toast） |
| `gotoLogin(page)` | 導向 `/login` 並等待 Nuxt hydration 完成 |
| `fillAndSubmit(page, email, password)` | 填入帳密並送出 |
| `login(page, email, password)` | 完整登入並等待跳轉 |
| `saveAuthState(page, email, statePath)` | 登入後儲存 Cookie/Session 至檔案（供 storageState 重用） |

---

## 已知限制 / 待補項目

- [ ] 目前缺乏 **RBAC 權限邊界** 測試（例如：zone_leader 無法看到其他 zone 的會友）
- [ ] **課程管理**、**小組管理**、**出席紀錄** 尚未有 e2e spec
- [ ] `register.spec.ts` 的牧區 / 小組 Select 使用 `.p-select-option:first-child`，與 seed 資料的實際選項可能不一致，需確認
- [ ] 目前 `login` helper 的 `waitForURL` 只等 `/` 或 `/dashboard`，若未來有新的登入後導向路徑需一併更新
