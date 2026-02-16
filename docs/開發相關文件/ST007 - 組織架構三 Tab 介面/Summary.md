# ST007 - 組織架構三 Tab 介面 (Organization Structure 3-Tab Interface)

**ID**: ST-007  
**Priority**: Must Have (Core Feature)  
**Phase**: 3 - 組織架構管理  
**Status**: 🔲 規劃中

## 簡述
實作組織架構管理頁面，提供三個 Tab 介面（牧區/小組、課程、事工），以 Tree View 視覺化呈現階層關係，並整合待處理池（未歸屬會友）管理。

## 核心功能
- **Tab 1: 牧區/小組 (Pastoral Groups)**
  - Tree View 顯示牧區 → 小組階層關係
  - 顯示牧區長、小組長、成員數量等統計資訊
  - 右鍵選單：編輯、新增、刪除（根據權限動態顯示）
  - 待處理池：顯示未歸屬會友列表
  - 支援拖拉成員至小組（UI 互動，實際分配由 ST008 負責）
  - 搜尋與篩選功能
  - 展開/收合狀態持久化（LocalStorage）

- **Tab 2: 課程 (Courses)**
  - 顯示功能性群組（課程班級）列表
  - 顯示課程名稱、講師、學員數量、狀態
  - 唯讀模式（實際管理由課程模組負責）
  - 「前往課程管理」按鈕（需 course:manage 權限）

- **Tab 3: 事工 (Ministries, 預留)**
  - 顯示功能性群組（事工團隊）列表
  - Placeholder 頁面（顯示「此功能尚未開放」）
  - 「前往事工管理」按鈕（禁用狀態）

## 關鍵 AC
- Tree View 僅顯示牧區與小組（不顯示成員，效能考量）
- 待處理池顯示 `zoneId = null` 且 `groupId = null` 的會友
- Tab 切換狀態記錄於 URL Query Parameter (`?tab=0`)
- 根據 DataScope 篩選可見的牧區/小組
- 拖拉目標僅限小組節點（拖拉到牧區顯示錯誤）

## 依賴項
- ✅ **ST001**: 資料核心與 Schema 定義 (members, zones, groups collections)
- ✅ **ST002**: RBAC Configuration (org:view, org:manage 權限)
- ✅ **ST006**: 牧區與小組管理（提供牧區/小組資料與 API）

## 相關 Stories
- **ST006**: 牧區與小組管理（提供 CRUD API）
- **ST008**: 成員調度與待處理池（實作拖拉分配邏輯）
- **ST015-ST020**: 課程管理（提供課程資料）

## 文件
- [詳細需求](./Description.md)
- [技術設計](./Technical%20Design.md)
- [問題與澄清](./Questions.md)
