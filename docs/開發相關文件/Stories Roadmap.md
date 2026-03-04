n# 開發路線圖 (Stories Roadmap)

**Last Updated**: 2026-03-04  
**Total Stories**: 27

本文件列出所有 User Stories 的開發順序與依賴關係。

---

## Phase 1: 基礎建設層 (Foundation) ✅

**目標**: 建立核心資料結構與權限系統

| Story ID | Story Name             | Priority  | Status  | 依賴項       |
| -------- | ---------------------- | --------- | ------- | ------------ |
| ST001    | 資料核心與 Schema 定義 | Must Have | ✅ 完成 | -            |
| ST002    | RBAC Configuration     | Must Have | ✅ 完成 | ST001        |
| ST003    | 會友資料列表           | Must Have | ✅ 完成 | ST001, ST002 |

---

## Phase 2: 核心 CRUD 功能 (Core CRUD) ✅

**目標**: 完成會友資料的完整管理功能

| Story ID | Story Name       | Priority  | Status  | 依賴項              |
| -------- | ---------------- | --------- | ------- | ------------------- |
| ST004    | 會友資料 CRUD    | Must Have | ✅ 完成 | ST001, ST002, ST003 |
| ST005    | 敏感資料解鎖機制 | Must Have | ✅ 完成 | ST001, ST002, ST003 |

---

## Phase 3: 組織架構管理 (Organization Management)

**目標**: 建立牧區/小組管理功能

| Story ID | Story Name          | Priority  | Status  | 依賴項              |
| -------- | ------------------- | --------- | ------- | ------------------- |
| ST006    | 牧區與小組管理      | Must Have | ✅ 完成 | ST001, ST002        |
| ST007    | 組織架構三 Tab 介面 | Must Have | ✅ 完成 | ST001, ST002, ST006 |
| ST008    | 成員調度與待處理池  | Must Have | ✅ 完成 | ST001-ST007         |

---

## Phase 4: 角色與權限管理 (Role Management)

**目標**: 完善角色指派與帳號管理

| Story ID | Story Name         | Priority    | Status    | 依賴項              |
| -------- | ------------------ | ----------- | --------- | ------------------- |
| ST009    | 角色指派介面       | Must Have   | ✅ 完成   | ST001, ST002, ST004 |
| ST010    | 帳號安全與密碼管理 | Should Have | 🚧 進行中 | ST001, ST002        |

---

## Phase 5: 儀表板模組 (Dashboard Module)

**目標**: 為不同角色建立專屬儀表板

| Story ID | Story Name   | Priority    | Status    | 依賴項                 |
| -------- | ------------ | ----------- | --------- | ---------------------- |
| ST011    | 全域戰情室   | Should Have | 🚧 進行中 | ST001-ST006            |
| ST012    | 小組長儀表板 | Should Have | 🔲 規劃中 | ST001-ST003            |
| ST013    | 牧區戰情室   | Should Have | 🔲 規劃中 | ST001-ST006            |
| ST014    | 教學概況     | Should Have | 🔲 規劃中 | ST001, ST002, (ST015+) |

---

## Phase 6: 課程管理模組 (Course Management)

**目標**: 建立完整的課程管理系統

| Story ID | Story Name     | Priority    | Status    | 依賴項                     |
| -------- | -------------- | ----------- | --------- | -------------------------- |
| ST015    | 課程模板管理   | Should Have | 🔲 規劃中 | ST001, ST002               |
| ST016    | 開課與排程     | Should Have | 🔲 規劃中 | ST001, ST002, ST015        |
| ST017    | 課程報名與分班 | Should Have | 🔲 規劃中 | ST001, ST002, ST015, ST016 |
| ST018    | 我的教學課程   | Should Have | 🔲 規劃中 | ST001, ST002, ST015-ST017  |
| ST019    | 課堂點名       | Should Have | 🔲 規劃中 | ST001, ST002, ST018        |
| ST020    | 成績與結業     | Should Have | 🔲 規劃中 | ST001, ST002, ST018, ST019 |

---

## Phase 7: 小組管理功能 (Group Management)

**目標**: 強化小組長的牧養工具

| Story ID | Story Name   | Priority    | Status    | 依賴項             |
| -------- | ------------ | ----------- | --------- | ------------------ |
| ST021    | 小組增員     | Should Have | 🔲 規劃中 | ST001-ST003, ST006 |
| ST022    | 我的小組名單 | Should Have | 🔲 規劃中 | ST001-ST003, ST005 |

---

## Phase 8: 牧養與關懷模組 (Pastoral Care) - Not MVP Scope

**目標**: 質化紀錄與牧養追蹤

| Story ID | Story Name | Priority   | Status    | 依賴項                     |
| -------- | ---------- | ---------- | --------- | -------------------------- |
| ST023    | 聚會紀錄   | Could Have | 🔲 規劃中 | ST001, ST002, ST022        |
| ST024    | 牧養筆記   | Could Have | 🔲 規劃中 | ST001, ST002, ST022        |
| ST025    | 牧區監督   | Could Have | 🔲 規劃中 | ST001, ST002, ST006, ST023 |

---

## Phase 9: 系統功能 (System Features)

**目標**: 資料管理與稽核工具

| Story ID | Story Name   | Priority   | Status    | 依賴項              |
| -------- | ------------ | ---------- | --------- | ------------------- |
| ST026    | 資料匯出匯入 | Could Have | 🔲 規劃中 | ST001-ST004         |
| ST027    | 審計日誌     | Could Have | 🔲 規劃中 | ST001, ST002, ST005 |

---

## 優先級說明

| 優先級          | 說明                           | 數量  |
| --------------- | ------------------------------ | ----- |
| **Must Have**   | MVP 必要功能，第一階段必須完成 | 11 個 |
| **Should Have** | 重要功能，第二階段完成         | 11 個 |
| **Could Have**  | 加值功能，第三階段考慮         | 5 個  |

---

## 開發建議順序

### Sprint 1-2: Foundation (2-3 週)

- ✅ ST001, ST002, ST003

### Sprint 3-4: Core CRUD (2-3 週)

- 🎯 ST004, ST005

### Sprint 5-6: Organization (2-3 週) ✅

- ✅ ST006, ST007, ST008

### Sprint 7: Role Management (1-2 週)

- 🎯 ST009(✅), ST010(🚧)

### Sprint 8-9: Dashboard (2-3 週)

- 🎯 ST011, ST012, ST013, ST014

### Sprint 10-13: Course Management (4-5 週)

- 🎯 ST015, ST016, ST017, ST018, ST019, ST020

### Sprint 14-15: Group Management (2 週)

- 🎯 ST021, ST022

### Sprint 16-18: Pastoral Care (3 週) - Optional

- 🎯 ST023, ST024, ST025

### Sprint 19-20: System Features (2 週) - Optional

- 🎯 ST026, ST027

---

## Notes

- **矩陣式組織** (functionalGroupIds) 的核心實作在 ST002，ST016-ST020 會使用
- **敏感資料遮罩** 在 ST001 定義，ST003 和 ST005 實作
- **課程模組** (ST015-ST020) 可獨立於牧養模組開發
- **牧養模組** (ST023-ST025) 標記為 Not MVP Scope，可後期開發
- **審計功能** (ST027) 建議在 ST005 實作時一併考慮

---

**MVP 範圍**: ST001-ST014 + ST021-ST022 (約 16 個 Stories)  
**完整系統**: 所有 27 個 Stories
