# ST007 - Questions & Clarifications

本文件記錄開發過程中需要澄清的問題與決策點。

---

## 🔴 Critical Questions (阻擋開發)

### Q1: Tree View 是否顯示成員列表？

**問題描述**:  
在 Tree View 中，小組節點下是否需要展開顯示成員列表？

**選項**:
- A. 顯示成員列表（增加 Tree 層級：牧區 → 小組 → 成員）
- B. 不顯示成員列表，點擊小組後跳轉到小組詳情頁（推薦）
- C. 提供切換按鈕，使用者可選擇是否顯示成員

**目前採用方案**: B（不顯示成員列表，點擊跳轉）

**原因**:
- 效能考量：若牧區有 10 個小組，每個小組 20 人，Tree View 需渲染 200+ 節點
- UX 考量：成員列表過長會導致 Tree View 難以瀏覽
- 替代方案：點擊小組後跳轉到「我的小組名單」頁面（ST022）

**影響範圍**: 
- `ZoneGroupTree.vue` 的節點結構
- `useOrganizationTree.ts` 的 `buildTreeNodes` 方法

**決策日期**: _待確認_  
**決策人**: _待確認_

---

### Q2: 拖拉功能的實作範圍

**問題描述**:  
拖拉功能（從待處理池拖拉到小組）應在此 Story 實作多少？

**選項**:
- A. 僅實作 UI 互動（顯示拖拉游標、目標提示），實際分配邏輯由 ST008 負責
- B. 完整實作拖拉功能（包含 API 呼叫與資料更新）
- C. 不實作拖拉功能，僅提供「點擊分配」按鈕

**目前採用方案**: A（僅實作 UI 互動）

**原因**:
- ST008 專門負責成員調度與分配邏輯
- 此 Story 聚焦於視覺化呈現與 Tab 介面
- 避免重複開發

**影響範圍**: 
- `PendingPool.vue` 的拖拉事件處理
- `ZoneGroupTree.vue` 的 Drop 目標處理

**決策日期**: _待確認_  
**決策人**: _待確認_

---

## 🟡 High Priority Questions (影響 UX)

### Q3: Tab 2 (課程) 的資料來源

**問題描述**:  
課程列表的資料應從哪裡取得？

**選項**:
- A. 從 `groups` Collection 查詢 `type = 'Functional'` 且 `metadata.category = 'Course'` 的群組
- B. 等待 ST015-ST020（課程管理）實作後，從課程 API 取得資料
- C. 在此 Story 先使用 Mock Data，待課程模組實作後再整合

**目前採用方案**: C（先使用 Mock Data）

**原因**:
- 課程模組（ST015-ST020）尚未實作
- 課程資料結構可能與 `groups` Collection 不同
- 使用 Mock Data 可先完成 UI 開發，後續整合時僅需更換 API

**影響範圍**: 
- `useFunctionalGroups.ts` 的 `loadCourseGroups` 方法
- `/api/organization/functional-groups` API

**決策日期**: _待確認_  
**決策人**: _待確認_

---

### Q4: Tab 3 (事工) 是否實作？

**問題描述**:  
Tab 3（事工）是否需要在 MVP 階段實作？

**選項**:
- A. 完整實作事工列表（使用 Mock Data）
- B. 僅顯示「此功能尚未開放」的 placeholder 頁面
- C. 移除 Tab 3，待後續 Story 再新增

**目前採用方案**: B（顯示 placeholder）

**原因**:
- 事工管理模組尚未規劃（不在 MVP 範圍內）
- 保留 Tab 3 可展示系統的擴充性
- 避免過度開發

**影響範圍**: 
- `MinistryTab.vue` 的實作程度
- `/api/organization/functional-groups` 的事工查詢功能

**決策日期**: _待確認_  
**決策人**: _待確認_

---

### Q5: 待處理池的顯示順序

**問題描述**:  
待處理池的會友應按什麼順序排列？

**選項**:
- A. 按註冊日期排序（最新在前）- 推薦
- B. 按姓名排序（A-Z）
- C. 按受洗狀態排序（已受洗在前）

**目前採用方案**: A（按註冊日期，最新在前）

**原因**:
- 最新註冊的會友較需要優先分配
- 符合業務流程（新人入會後盡快分組）

**影響範圍**: 
- `member.repository.ts` 的 `findPendingMembers` 方法

**決策日期**: _待確認_  
**決策人**: _待確認_

---

## 🟢 Medium Priority Questions (功能細節)

### Q6: Tree View 右鍵選單的權限控制

**問題描述**:  
Tree View 的右鍵選單（編輯、刪除）應如何根據權限控制？

**選項**:
- A. 根據 `org:manage` 權限顯示/隱藏選單項目
- B. 顯示所有選單項目，但點擊時檢查權限並顯示錯誤訊息
- C. 根據 `DataScope` 動態顯示可用選項（如 Zone Scope 僅能編輯小組，不能編輯牧區）

**目前採用方案**: C（根據 DataScope 動態顯示）

**影響範圍**: 
- `ZoneGroupTree.vue` 的 `menuItems` computed
- 前端權限檢查邏輯

**決策日期**: _待確認_  
**決策人**: _待確認_

---

### Q7: Tree View 的展開狀態持久化

**問題描述**:  
Tree View 的展開/收合狀態應如何持久化？

**選項**:
- A. 使用 LocalStorage 儲存（前端快取）
- B. 使用 Cookie 儲存（跨裝置同步）
- C. 儲存到使用者設定 (User Preferences) Collection
- D. 不持久化，每次載入頁面都重設

**目前採用方案**: A（使用 LocalStorage）

**原因**:
- 實作簡單，效能好
- 不需要後端支援
- 跨裝置同步需求不高（使用者通常在同一裝置操作）

**影響範圍**: 
- `useOrganizationTree.ts` 的 `saveExpandedState` 方法

**決策日期**: _待確認_  
**決策人**: _待確認_

---

### Q8: 待處理池的載入策略

**問題描述**:  
待處理池的會友列表應如何載入？

**選項**:
- A. 一次載入全部（限制 100 筆）
- B. 使用分頁載入（每頁 20 筆）
- C. 使用無限滾動（Infinite Scroll）

**目前採用方案**: A（一次載入全部，限制 100 筆）

**原因**:
- 待處理池的會友數量通常不多（< 100 人）
- 避免分頁切換的複雜度
- 支援前端搜尋與篩選

**影響範圍**: 
- `usePendingPool.ts` 的 `loadPendingMembers` 方法
- `member.repository.ts` 的 `findPendingMembers` 方法

**決策日期**: _待確認_  
**決策人**: _待確認_

---

### Q9: Tab 切換時是否重新載入資料？

**問題描述**:  
切換 Tab 時，是否需要重新載入該 Tab 的資料？

**選項**:
- A. 每次切換都重新載入（確保資料最新）
- B. 僅首次載入，切換時不重新載入（提升效能）
- C. 提供「重新整理」按鈕，由使用者手動觸發

**目前採用方案**: B + C（首次載入 + 手動重新整理）

**原因**:
- 提升切換效能，減少 API 呼叫
- 使用者可透過重新整理按鈕更新資料
- 組織架構變更頻率不高

**影響範圍**: 
- `PastoralTab.vue`, `CourseTab.vue`, `MinistryTab.vue` 的載入邏輯

**決策日期**: _待確認_  
**決策人**: _待確認_

---

### Q10: 課程列表的狀態判斷

**問題描述**:  
課程的狀態（進行中/已結束）應如何判斷？

**選項**:
- A. 根據 `startDate` 和 `endDate` 判斷（推薦）
- B. 使用 `status` 欄位（需課程模組支援）
- C. 不顯示狀態，僅顯示課程名稱與學員數量

**目前採用方案**: A（根據日期判斷）

**原因**:
- 自動化判斷，無需手動更新狀態
- 符合業務邏輯（課程有明確的起訖日期）

**影響範圍**: 
- `useFunctionalGroups.ts` 的 `loadCourseGroups` 方法
- `CourseTab.vue` 的狀態顯示邏輯

**決策日期**: _待確認_  
**決策人**: _待確認_

---

## 🔵 Low Priority Questions (錦上添花)

### Q11: Tree View 的搜尋高亮顯示

**問題描述**:  
搜尋時，是否需要高亮顯示匹配的節點？

**選項**:
- A. 高亮顯示匹配節點（使用黃色背景）
- B. 僅過濾顯示匹配節點，不高亮
- C. 不實作搜尋功能

**目前採用方案**: B（僅過濾顯示）

**影響範圍**: 
- `ZoneGroupTree.vue` 的樣式

**決策日期**: _待確認_  
**決策人**: _待確認_

---

### Q12: 待處理池的統計資訊

**問題描述**:  
待處理池的標題是否需要顯示統計資訊（如：「待處理池 (15 人)」）？

**選項**:
- A. 顯示統計資訊（推薦）
- B. 不顯示統計資訊

**目前採用方案**: A（顯示統計資訊）

**影響範圍**: 
- `PendingPool.vue` 的標題顯示

**決策日期**: _待確認_  
**決策人**: _待確認_

---

## 📝 Design Decisions (已決策)

### D1: 使用 PrimeVue Tree 元件

**決策**: 使用 PrimeVue `Tree` 元件實作 Tree View

**原因**:
- PrimeVue 提供完整的 Tree 功能（展開/收合、選取、拖拉）
- 符合設計風格，減少自訂樣式
- 支援虛擬滾動，效能良好

---

### D2: Tab 狀態使用 URL Query Parameter

**決策**: 使用 URL Query Parameter（`?tab=0`）記錄當前 Tab

**原因**:
- 支援瀏覽器的前進/後退按鈕
- 可分享特定 Tab 的 URL
- 符合 Web 標準

---

### D3: 拖拉功能的分工

**決策**: 此 Story 僅實作拖拉的 UI 互動，實際分配邏輯由 ST008 負責

**原因**:
- 清楚的職責劃分
- 避免重複開發
- ST008 專注於成員調度的業務邏輯與驗證

---

## 📌 Notes & Assumptions

1. **Tree View 的階層**: 僅顯示牧區 → 小組，不顯示成員（效能與 UX 考量）

2. **課程與事工的資料來源**: Tab 2 和 Tab 3 的資料來源依賴後續 Story（ST015-ST020）的實作，目前先使用 Mock Data 或 placeholder

3. **權限控制**: 所有功能需整合 ST002 的 RBAC 權限系統

4. **拖拉功能**: 此 Story 僅實作 UI 互動，實際分配邏輯由 ST008 負責

5. **待處理池的定義**: `zoneId = null` 且 `groupId = null` 的會友

---

**Last Updated**: 2026-02-16  
**Maintained By**: Development Team
