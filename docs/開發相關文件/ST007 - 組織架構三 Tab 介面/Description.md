# ST007 - 組織架構三 Tab 介面 (Organization Structure 3-Tab Interface)

**ID**: ST-007  
**Priority**: Must Have (Core Feature)  
**Phase**: 3 - 組織架構管理

## User Story

> **As a** 行政同工 / 牧區長,  
> **I want to** 在單一頁面查看完整的組織架構（包含牧區/小組、課程、事工），  
> **So that** 我能快速了解組織架構的全貌，並方便管理成員的歸屬與分配。

---

## Acceptance Criteria (AC)

### AC1: 頁面整體布局

1. **三個 Tab 結構**:
   - Tab 1: **牧區/小組** (Pastoral Groups)
   - Tab 2: **課程** (Courses / Functional Groups - Course)
   - Tab 3: **事工** (Ministries / Functional Groups - Ministry, 預留)

2. **頂部 Tab Bar**:
   - 使用 PrimeVue `TabMenu` 或 `TabView` 元件
   - Tab 標籤顯示名稱與 Icon:
     - 牧區/小組: `pi-sitemap`
     - 課程: `pi-book`
     - 事工: `pi-users`
   - 顯示各 Tab 的統計數字（如：牧區數量、課程數量）

3. **切換行為**:
   - 預設開啟 Tab 1（牧區/小組）
   - 切換 Tab 時，保留當前 Tab 的篩選與搜尋狀態
   - 使用 URL Query Parameter 記錄當前 Tab（如 `?tab=pastoral`）

---

### AC2: Tab 1 - 牧區/小組 (Pastoral Groups)

#### 2.1 左側：Tree View (階層結構)

1. **Tree View 顯示**:
   - 使用 PrimeVue `TreeTable` 或 `Tree` 元件
   - 階層結構：牧區 → 小組 → (選填：小組成員)
   - 每個節點顯示：
     - **牧區節點**: 
       - 牧區名稱
       - 牧區長姓名（顯示於副標題）
       - 小組數量 Badge（如：`5 個小組`）
       - 成員數量 Badge（如：`45 人`）
     - **小組節點**: 
       - 小組名稱
       - 小組長姓名（顯示於副標題）
       - 成員數量 Badge（如：`12 人`）

2. **互動功能**:
   - 點擊牧區：展開/收合小組列表
   - 點擊小組：展開/收合成員列表（選填，視效能決定）
   - 右鍵選單（Context Menu）:
     - 牧區：編輯牧區、新增小組、刪除牧區
     - 小組：編輯小組、刪除小組
   - 拖拉功能（Drag & Drop）:
     - 從待處理池拖拉成員至小組（由 ST008 實作）

3. **篩選與搜尋**:
   - 搜尋框：搜尋牧區/小組名稱
   - 狀態篩選：全部 / 僅啟用 / 僅停用
   - 展開/收合所有按鈕

#### 2.2 右側：待處理池 (Pending Pool)

1. **顯示未歸屬會友**:
   - 列表顯示所有 `zoneId = null` 且 `groupId = null` 的會友
   - 顯示欄位：
     - 頭像
     - 姓名
     - 受洗狀態 Tag
     - 註冊日期
   - 支援拖拉至左側 Tree View 的小組（由 ST008 實作）

2. **篩選與搜尋**:
   - 搜尋框：搜尋姓名/手機/Email
   - 受洗狀態篩選：全部 / 已受洗 / 未受洗

3. **操作按鈕**:
   - 點擊會友：顯示快速分配對話框（選擇牧區與小組）
   - 批次選擇：勾選多位會友，批次分配至同一小組（由 ST008 實作）

---

### AC3: Tab 2 - 課程 (Courses)

#### 3.1 功能性群組列表

1. **顯示所有課程班級**:
   - 列表顯示所有 `type = 'Functional'` 且與課程相關的 Group
   - 顯示欄位：
     - 課程名稱 (如：S101 - 新生命課程)
     - 講師姓名
     - 班級代碼
     - 學員數量
     - 狀態 Tag (進行中 / 已結束)

2. **唯讀模式**:
   - 此 Tab 僅供查看，不提供新增/編輯/刪除功能
   - 顯示提示訊息：「課程管理由「課程管理模組」負責」

3. **前往課程管理按鈕**:
   - 頂部顯示「前往課程管理」按鈕
   - 需檢查權限：`course:manage`
   - 點擊後導向 `/courses` 頁面

#### 3.2 篩選與搜尋

1. **搜尋框**:
   - 搜尋課程名稱、講師姓名

2. **狀態篩選**:
   - 全部 / 進行中 / 已結束

---

### AC4: Tab 3 - 事工 (Ministries, 預留)

#### 4.1 功能性群組列表

1. **顯示所有事工團隊**:
   - 列表顯示所有 `type = 'Functional'` 且與事工相關的 Group
   - 顯示欄位：
     - 事工名稱 (如：敬拜團、招待組)
     - 負責人姓名
     - 成員數量
     - 狀態 Tag (啟用 / 停用)

2. **唯讀模式**:
   - 此 Tab 僅供查看，不提供新增/編輯/刪除功能
   - 顯示提示訊息：「事工管理由「事工管理模組」負責（預留）」

3. **前往事工管理按鈕（預留）**:
   - 頂部顯示「前往事工管理」按鈕（灰色，禁用狀態）
   - Tooltip 顯示：「此功能尚未開放」

---

### AC5: 權限控制 (RBAC)

1. **查看組織架構** (org:view):
   - 根據使用者的 `DataScope` 篩選可見的牧區/小組/課程/事工：
     - `Global`: 可看到所有組織架構
     - `Zone`: 僅看到自己的牧區及其下小組、以及自己教的課程（透過 `functionalGroupIds`）
     - `Group`: 僅看到自己的小組、以及自己教的課程
     - `Self`: 無權限查看組織架構頁面

2. **管理組織架構** (org:manage):
   - `Global` Scope: 可在 Tab 1 使用右鍵選單的所有功能（新增、編輯、刪除）
   - `Zone` Scope: 可在 Tab 1 管理自己牧區下的小組，但不能編輯牧區本身
   - `Group` Scope: 僅能查看，不能編輯
   - `Self` Scope: 無權限

3. **前往其他模組按鈕**:
   - 「前往課程管理」按鈕需 `course:manage` 權限
   - 「前往事工管理」按鈕需 `ministry:manage` 權限（預留）

---

## Business Rules

### BR1: Tab 1 - 牧區/小組
- **Tree View 展開狀態**: 使用 LocalStorage 記錄使用者的展開/收合偏好
- **待處理池排序**: 按註冊日期排序（最新在前）
- **右鍵選單權限**: 根據使用者的 `DataScope` 動態顯示可用選項

### BR2: Tab 2 - 課程
- **課程列表來源**: 從 `groups` Collection 查詢 `type = 'Functional'` 且 metadata 包含 `category = 'Course'` 的群組
- **狀態判斷**: 根據課程的 `startDate` 和 `endDate` 判斷是否進行中
- **權限檢查**: 若使用者無 `course:manage` 權限，隱藏「前往課程管理」按鈕

### BR3: Tab 3 - 事工
- **事工列表來源**: 從 `groups` Collection 查詢 `type = 'Functional'` 且 metadata 包含 `category = 'Ministry'` 的群組
- **預留狀態**: 此 Tab 在 MVP 階段僅作為預留功能，實際管理由後續 Story 實作

---

## UI/UX Requirements

### UX1: 頁面布局

**Layout:**
- 頂部：頁面標題 + Tab Menu
- 內容區：
  - Tab 1: 左側 Tree View (70%) + 右側待處理池 (30%)
  - Tab 2: 課程列表（全寬）
  - Tab 3: 事工列表（全寬）

**Component Mapping:**
- Tab Menu: `<TabView>` (PrimeVue)
- Tree View: `<TreeTable>` 或 `<Tree>` (PrimeVue)
- 待處理池: 自訂元件 `<PendingPoolList>`
- 課程列表: `<DataTable>` (PrimeVue)
- 事工列表: `<DataTable>` (PrimeVue)

### UX2: Tree View 節點設計

**牧區節點樣式:**
```
[Icon: pi-home] 林牧區
  牧區長：林大衛 | 5 個小組 | 45 人
```

**小組節點樣式:**
```
  [Icon: pi-users] 喜樂小組
    小組長：陳小明 | 12 人
```

**互動反饋:**
- Hover: 節點背景變色
- 選中: 節點背景高亮
- 拖拉: 顯示拖拉游標與目標提示

### UX3: 待處理池卡片設計

**卡片樣式:**
```
[Avatar] 王小明
  已受洗 [Tag]
  註冊日期：2026-01-15
  [拖拉 Icon]
```

**互動反饋:**
- Hover: 卡片陰影加深
- 點擊: 顯示快速分配對話框
- 拖拉: 卡片透明度降低，顯示拖拉軌跡

### UX4: 課程/事工列表表格

**表格欄位（課程）:**
- 課程名稱
- 講師姓名
- 班級代碼
- 學員數量
- 狀態 Tag
- 操作（查看詳情按鈕）

**表格欄位（事工）:**
- 事工名稱
- 負責人姓名
- 成員數量
- 狀態 Tag
- 操作（預留）

---

## Technical Considerations

### TC1: Tree View 效能優化
- **虛擬滾動**: 若牧區/小組數量超過 100 筆，使用 Virtual Scroll
- **懶加載**: 預設僅載入牧區層級，點擊展開時才載入小組
- **成員列表**: 不在 Tree View 顯示成員（避免過度嵌套），改為點擊小組後跳轉到小組詳情頁

### TC2: 待處理池效能
- **分頁載入**: 若待處理會友超過 50 筆，使用分頁或無限滾動
- **快取機制**: 使用 Pinia 快取待處理池資料，避免重複查詢

### TC3: 拖拉功能實作
- **使用 HTML5 Drag & Drop API**: 或使用 PrimeVue 的 Drag & Drop 功能
- **拖拉驗證**: 
  - 僅允許從待處理池拖拉到小組節點
  - 拖拉到牧區節點時顯示錯誤提示（必須指定小組）
- **拖拉確認**: 拖拉後顯示 Toast 確認訊息（由 ST008 實作）

### TC4: Tab 狀態管理
- **URL Query Parameter**: 使用 `?tab=pastoral` 記錄當前 Tab
- **瀏覽器返回**: 支援瀏覽器的返回按鈕，回到前一個 Tab

---

## Out of Scope

以下功能不在此 Story 範圍內：

- ❌ 拖拉分配的實際執行邏輯（由 ST008 負責）
- ❌ 批次分配功能（由 ST008 負責）
- ❌ 牧區/小組的新增/編輯/刪除表單（由 ST006 負責）
- ❌ 課程模組的實際管理功能（由 ST015-ST020 負責）
- ❌ 事工模組的實際管理功能（後續 Story）
- ❌ Tree View 的成員列表展開功能（效能考量，改為跳轉到小組詳情頁）

---

## Dependencies

- ✅ **ST001**: 資料核心與 Schema 定義 (members, zones, groups collections)
- ✅ **ST002**: RBAC Configuration (org:view, org:manage 權限)
- ✅ **ST006**: 牧區與小組管理（提供牧區/小組資料與 API）

---

## Success Metrics

- ✅ 能夠在單一頁面查看完整的組織架構
- ✅ Tree View 正確顯示牧區與小組的階層關係
- ✅ 待處理池正確顯示未歸屬會友
- ✅ Tab 切換流暢，狀態正確保留
- ✅ 權限控制正確套用，不同角色看到不同的操作選項
- ✅ Tree View 效能良好，載入時間 < 2 秒（100 筆以內）

---

## Related Stories

- **ST006**: 牧區與小組管理（提供 CRUD API）
- **ST008**: 成員調度與待處理池（實作拖拉分配邏輯）
- **ST015-ST020**: 課程管理（提供課程資料與 API）
- **Future Story**: 事工管理（預留 Tab 3）
