# ST008 - 成員調度與待處理池 (Member Transfer & Pending Pool)

**ID**: ST-008  
**Priority**: Must Have (Core Feature)  
**Phase**: 3 - 組織架構管理

## User Story

> **As a** 行政同工 / 牧區長,  
> **I want to** 將會友在牧區/小組間調度轉移，並管理尚未歸屬的會友,  
> **So that** 我能靈活分配會友到合適的牧區與小組，確保所有會友都有明確的歸屬。

---

## Acceptance Criteria (AC)

### AC1: 拖拉分配功能 (Drag & Drop Assignment)

1. **拖拉來源**:
   - 待處理池的會友卡片
   - Tree View 中的會友節點（選填，視 ST007 實作決定）

2. **拖拉目標**:
   - Tree View 中的小組節點（可放置）
   - Tree View 中的牧區節點（不可放置，顯示錯誤提示）

3. **拖拉互動**:
   - **開始拖拉**: 
     - 卡片透明度降低至 50%
     - 游標變更為「移動」圖示
     - 顯示拖拉的會友姓名於游標附近
   - **Hover 目標節點**: 
     - 小組節點：背景變為綠色，顯示「放置到 [小組名稱]」提示
     - 牧區節點：背景變為紅色，顯示「請選擇小組」提示
   - **放置完成**: 
     - 呼叫 API 更新會友的 `zoneId` 和 `groupId`
     - 顯示 Toast 確認訊息：「已將 [會友姓名] 分配至 [小組名稱]」
     - 自動重新載入待處理池與 Tree View
   - **取消拖拉**: 
     - 按 ESC 鍵或拖拉至空白區域時取消
     - 卡片恢復原狀

4. **錯誤處理**:
   - 若拖拉到牧區節點，顯示錯誤 Toast：「請選擇小組，不能直接分配到牧區」
   - 若 API 失敗，顯示錯誤 Toast：「分配失敗：[錯誤訊息]」

---

### AC2: 點擊分配功能 (Click Assignment)

1. **觸發方式**:
   - 點擊待處理池的會友卡片
   - 點擊「分配」按鈕

2. **快速分配對話框**:
   - **標題**: 分配會友：[會友姓名]
   - **內容**:
     - 會友資訊（頭像、姓名、受洗狀態）
     - 牧區下拉選單（Select）
     - 小組下拉選單（Select，根據選擇的牧區動態載入）
   - **按鈕**:
     - 取消 (outlined)
     - 確定分配 (severity="primary")

3. **牧區小組連動**:
   - 選擇牧區後，小組下拉選單自動載入該牧區的所有啟用小組
   - 若牧區未選擇，小組下拉選單顯示「請先選擇牧區」並禁用

4. **分配邏輯**:
   - 點擊「確定分配」後，呼叫 API 更新會友的 `zoneId` 和 `groupId`
   - 顯示 Toast 確認訊息：「已將 [會友姓名] 分配至 [牧區名稱] - [小組名稱]」
   - 自動重新載入待處理池與 Tree View
   - 關閉對話框

---

### AC3: 批次分配功能 (Batch Assignment)

1. **觸發方式**:
   - 勾選待處理池的多位會友（使用 Checkbox）
   - 點擊頂部的「批次分配」按鈕

2. **批次分配對話框**:
   - **標題**: 批次分配 ([已選擇 X 位會友])
   - **內容**:
     - 已選擇的會友列表（顯示姓名與受洗狀態）
     - 牧區下拉選單（Select）
     - 小組下拉選單（Select，根據選擇的牧區動態載入）
   - **按鈕**:
     - 取消 (outlined)
     - 確定批次分配 (severity="primary")

3. **分配邏輯**:
   - 點擊「確定批次分配」後，呼叫 API 批次更新會友的 `zoneId` 和 `groupId`
   - 顯示 Toast 確認訊息：「已將 X 位會友分配至 [牧區名稱] - [小組名稱]」
   - 自動重新載入待處理池與 Tree View
   - 關閉對話框

4. **錯誤處理**:
   - 若批次分配失敗（如 API 錯誤），顯示錯誤 Toast：「批次分配失敗：[錯誤訊息]」
   - 若部分成功、部分失敗，顯示警告 Toast：「已成功分配 X 位會友，Y 位會友分配失敗」

---

### AC4: 成員轉移功能 (Member Transfer)

1. **觸發方式**:
   - 在 Tree View 中選取會友（選填，視 ST007 實作決定）
   - 點擊右鍵選單的「轉移到其他小組」

2. **轉移對話框**:
   - **標題**: 轉移會友：[會友姓名]
   - **內容**:
     - 當前歸屬：[牧區名稱] - [小組名稱]
     - 目標牧區下拉選單（Select）
     - 目標小組下拉選單（Select，根據選擇的牧區動態載入）
   - **按鈕**:
     - 取消 (outlined)
     - 確定轉移 (severity="primary")

3. **轉移邏輯**:
   - 點擊「確定轉移」後，呼叫 API 更新會友的 `zoneId` 和 `groupId`
   - 顯示 Toast 確認訊息：「已將 [會友姓名] 從 [原小組] 轉移至 [新小組]」
   - 自動重新載入 Tree View
   - 關閉對話框

---

### AC5: 轉移歷史記錄 (Transfer Audit Log, 預留)

1. **記錄內容**:
   - 操作時間
   - 操作者（誰執行轉移）
   - 會友姓名
   - 原歸屬（牧區與小組）
   - 新歸屬（牧區與小組）
   - 操作類型（新增 / 轉移 / 移除）

2. **查詢介面**:
   - 在會友詳情頁顯示「轉移歷史」Tab
   - 列表顯示該會友的所有轉移記錄
   - 支援篩選（按日期、操作者）

3. **實作範圍**:
   - 此功能**預留給 ST027（審計日誌）**
   - 在此 Story 僅實作 API 的 Audit Log 寫入，不實作查詢介面

---

### AC6: 權限控制 (RBAC)

1. **查看待處理池** (org:view):
   - 根據使用者的 `DataScope` 篩選可見的待處理會友：
     - `Global`: 可看到所有待處理會友
     - `Zone`: 無意義（待處理會友無 zoneId）
     - `Group`: 無意義（待處理會友無 groupId）
     - `Self`: 無權限查看待處理池

2. **分配會友** (member:edit + org:manage):
   - `Global` Scope: 可分配會友到任何牧區/小組
   - `Zone` Scope: 可分配會友到自己的牧區與其下小組
   - `Group` Scope: 無權限分配會友
   - `Self` Scope: 無權限分配會友

3. **轉移會友** (member:edit + org:manage):
   - `Global` Scope: 可轉移任何會友到任何牧區/小組
   - `Zone` Scope: 可轉移自己牧區的會友到其他小組（僅限同牧區內）
   - `Group` Scope: 無權限轉移會友
   - `Self` Scope: 無權限轉移會友

---

## Business Rules

### BR1: 分配規則
- **牧區與小組連動**: 分配會友時，必須同時指定牧區與小組
- **小組必須屬於該牧區**: 不能將會友分配到其他牧區的小組
- **僅能分配到啟用的小組**: 停用的小組不會顯示在下拉選單中

### BR2: 轉移規則
- **同牧區轉移**: 若僅更改小組，`zoneId` 不變
- **跨牧區轉移**: 若更改牧區，則 `zoneId` 和 `groupId` 同時更新
- **移出小組**: 若設定 `groupId = null`，會友變為未分組但仍屬於該牧區

### BR3: 批次分配規則
- **單次最多 50 人**: 批次分配最多選擇 50 位會友
- **失敗不回滾**: 批次分配採「部分成功」策略，若部分會友分配失敗，已成功的不回滾

### BR4: Audit Log 規則（預留）
- **記錄所有分配與轉移操作**: 包含新增、轉移、移除
- **記錄操作者**: 使用當前登入使用者的 `userId`
- **記錄時間**: 使用 Server Timestamp

---

## UI/UX Requirements

### UX1: 拖拉互動

**拖拉游標樣式:**
- 拖拉中：顯示「移動」圖示（`cursor: grabbing`）
- Hover 可放置目標：顯示「放置」圖示（`cursor: copy`）
- Hover 不可放置目標：顯示「禁止」圖示（`cursor: not-allowed`）

**拖拉反饋:**
- 拖拉的卡片：透明度 50%，顯示虛線邊框
- 目標節點（可放置）：綠色背景（`bg-green-100`）
- 目標節點（不可放置）：紅色背景（`bg-red-100`）

### UX2: 快速分配對話框

**表單欄位:**
- 會友資訊（只讀）
- 牧區（Select, 必填）
- 小組（Select, 必填, 根據牧區動態載入）

**按鈕布局:**
- 右側：取消 / 確定分配

### UX3: 批次分配對話框

**已選擇會友列表:**
- 顯示頭像、姓名、受洗狀態
- 使用 Chip 或 Tag 元件顯示
- 支援「移除」按鈕（從批次選擇中移除）

**表單欄位:**
- 牧區（Select, 必填）
- 小組（Select, 必填, 根據牧區動態載入）

**按鈕布局:**
- 右側：取消 / 確定批次分配

### UX4: Toast 確認訊息

**成功訊息:**
```
severity: 'success'
summary: '分配成功'
detail: '已將 [會友姓名] 分配至 [牧區名稱] - [小組名稱]'
life: 3000
```

**錯誤訊息:**
```
severity: 'error'
summary: '分配失敗'
detail: '[錯誤原因]'
life: 5000
```

**警告訊息（批次分配部分失敗）:**
```
severity: 'warn'
summary: '批次分配完成'
detail: '已成功分配 X 位會友，Y 位會友分配失敗'
life: 5000
```

---

## Technical Considerations

### TC1: 拖拉實作
- **使用 HTML5 Drag & Drop API**: 或使用 PrimeVue 的 Drag & Drop 功能
- **拖拉資料傳遞**: 使用 `dataTransfer` 傳遞會友 UUID
- **拖拉驗證**: 在 `drop` 事件中驗證目標節點類型（必須是小組節點）

### TC2: 批次分配效能
- **API 批次更新**: 使用 Firestore Batch Write 或 Transaction
- **前端加載狀態**: 顯示 Loading Spinner 與進度條（如：已處理 10/50 筆）
- **失敗重試**: 若批次分配失敗，提供「重試」按鈕

### TC3: Audit Log 實作（預留）
- **非同步寫入**: Audit Log 寫入不應阻擋主流程
- **使用 Cloud Functions**: 可使用 Firebase Cloud Functions 非同步寫入
- **資料結構**: 
  ```typescript
  interface TransferLog {
    id: string;
    timestamp: Timestamp;
    operatorId: string;
    operatorName: string;
    memberId: string;
    memberName: string;
    operationType: 'assign' | 'transfer' | 'remove';
    from: { zoneId?: string; groupId?: string };
    to: { zoneId?: string; groupId?: string };
  }
  ```

### TC4: 錯誤處理
- **分配失敗原因**:
  - 會友不存在
  - 小組不存在或已停用
  - 牧區與小組不匹配
  - 權限不足
- **錯誤訊息**: 顯示具體的錯誤原因，方便使用者排查

---

## Out of Scope

以下功能不在此 Story 範圍內：

- ❌ 轉移歷史記錄的查詢介面（由 ST027 負責）
- ❌ 跨牧區批次轉移（複雜度高，預留給後續 Story）
- ❌ 會友的「退出小組」功能（可透過編輯會友資料實現）
- ❌ 小組滿員檢查（預留給後續 Story）
- ❌ 轉移確認通知（Email/Line 通知，預留給後續 Story）

---

## Dependencies

- ✅ **ST001**: 資料核心與 Schema 定義 (members, zones, groups collections)
- ✅ **ST002**: RBAC Configuration (member:edit, org:manage 權限)
- ✅ **ST003**: 會友資料列表（提供會友資料與 API）
- ✅ **ST006**: 牧區與小組管理（提供牧區/小組資料與 API）
- ✅ **ST007**: 組織架構三 Tab 介面（提供拖拉目標與待處理池）

---

## Success Metrics

- ✅ 能夠透過拖拉或點擊分配會友到牧區與小組
- ✅ 能夠批次分配多位會友到同一小組
- ✅ 能夠轉移會友到其他小組
- ✅ 分配與轉移操作正確更新會友的 `zoneId` 和 `groupId`
- ✅ 權限控制正確套用，不同角色看到不同的操作選項
- ✅ Audit Log 正確記錄所有分配與轉移操作（預留查詢介面）

---

## Related Stories

- **ST003**: 會友資料列表（提供會友資料）
- **ST006**: 牧區與小組管理（提供牧區/小組資料）
- **ST007**: 組織架構三 Tab 介面（提供拖拉目標與待處理池）
- **ST027**: 審計日誌（實作轉移歷史記錄的查詢介面）
