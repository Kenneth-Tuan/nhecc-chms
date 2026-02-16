# ST006 - 牧區與小組管理 (Zone & Group Management)

**ID**: ST-006  
**Priority**: Must Have (Core Feature)  
**Phase**: 3 - 組織架構管理

## User Story

> **As a** 行政同工 / 牧區長,  
> **I want to** 建立、編輯、刪除牧區與小組，並指派負責的牧區長與小組長,  
> **So that** 系統能夠維護完整的組織架構，並支援後續的成員管理與權限控制。

---

## Acceptance Criteria (AC)

### AC1: 牧區管理 (Zone Management)

1. **牧區 CRUD 功能**:
   - 能夠**新增牧區**，必填欄位：
     - `name` (牧區名稱, String, 必填, 唯一值)
     - `status` (狀態, Enum: Active/Inactive, 預設 Active)
   - 選填欄位：
     - `leaderId` (牧區長 UUID, FK 指向 members)
     - `description` (牧區描述, String)

2. **牧區編輯**:
   - 能夠更新牧區的名稱、狀態、負責人、描述
   - 更新牧區長時，系統自動更新 `leaderName` 快取欄位
   - 若該牧區有小組，更改 `leaderId` 時需顯示警告（牧區長變更會影響小組權限）

3. **牧區刪除**:
   - **軟刪除**: 將 `status` 改為 `Inactive`
   - **刪除前檢查**:
     - 若牧區下有啟用的小組 (`groups.status = 'Active'`)，禁止刪除，顯示錯誤訊息：「此牧區下仍有啟用的小組，請先停用或移除小組」
     - 若牧區下有會友 (`members.zoneId = zoneId`)，顯示警告訊息：「此牧區下仍有 X 位會友，刪除後會友將變為未分區狀態」，需二次確認

4. **牧區長指派**:
   - 下拉選單顯示所有會友（姓名 + 受洗狀態 Tag）
   - 支援搜尋功能
   - 指派牧區長後，系統自動：
     - 更新該會友的 `zoneId` 為此牧區（若原本未歸屬）
     - 若該會友的 `roleIds` 不包含 `zone_leader`，顯示提示：「此會友尚未擁有牧區長角色，是否自動指派？」

5. **牧區列表顯示**:
   - 顯示欄位：牧區名稱、牧區長姓名、小組數量、成員數量、狀態、操作按鈕
   - 支援篩選：僅顯示啟用 / 停用牧區
   - 支援排序：按名稱、成員數量排序

---

### AC2: 小組管理 (Group Management)

1. **小組 CRUD 功能**:
   - 能夠**新增小組**，必填欄位：
     - `name` (小組名稱, String, 必填)
     - `type` (群組類型, Enum: 'Pastoral' | 'Functional', 預設 'Pastoral')
     - `parentZoneId` (所屬牧區 ID, FK, 僅 Pastoral 類型需要)
     - `status` (狀態, Enum: Active/Inactive, 預設 Active)
   - 選填欄位：
     - `leaderId` (小組長 UUID, FK 指向 members)
     - `description` (小組描述, String)

2. **小組編輯**:
   - 能夠更新小組的名稱、狀態、負責人、所屬牧區、描述
   - 更新小組長時，系統自動更新 `leaderName` 快取欄位
   - 若更改 `parentZoneId`（轉移到其他牧區），顯示警告：「此操作會將該小組的所有成員轉移至新牧區」

3. **小組刪除**:
   - **軟刪除**: 將 `status` 改為 `Inactive`
   - **刪除前檢查**:
     - 若小組下有會友 (`members.groupId = groupId`)，顯示警告訊息：「此小組下仍有 X 位會友，刪除後會友將變為未分組狀態」，需二次確認

4. **小組長指派**:
   - 下拉選單**僅顯示該牧區的會友**（`members.zoneId = parentZoneId`）
   - 支援搜尋功能
   - 指派小組長後，系統自動：
     - 更新該會友的 `groupId` 為此小組（若原本未歸屬）
     - 若該會友的 `roleIds` 不包含 `group_leader`，顯示提示：「此會友尚未擁有小組長角色，是否自動指派？」

5. **小組列表顯示**:
   - 顯示欄位：小組名稱、所屬牧區、小組長姓名、成員數量、狀態、操作按鈕
   - 支援篩選：按牧區篩選、僅顯示啟用 / 停用小組
   - 支援排序：按名稱、成員數量排序

---

### AC3: 牧區與小組連動邏輯

1. **新增小組時，必須先選擇牧區**（僅限 `type = 'Pastoral'` 的小組）
2. **牧區下拉選單僅顯示啟用的牧區**（`zones.status = 'Active'`）
3. **小組長候選人僅顯示該牧區的會友**（`members.zoneId = parentZoneId`）
4. **刪除牧區時，檢查是否有啟用的小組**，若有則禁止刪除
5. **轉移小組至其他牧區**:
   - 系統自動將該小組所有成員的 `zoneId` 更新為新牧區的 ID
   - 記錄轉移歷史（Audit Log, 預留給 ST027）

---

### AC4: 權限控制 (RBAC)

1. **查看牧區/小組列表** (org:view):
   - 根據使用者的 `DataScope` 篩選可見的牧區/小組：
     - `Global`: 可看到所有牧區/小組
     - `Zone`: 僅看到自己的牧區及其下小組
     - `Group`: 僅看到自己的小組
     - `Self`: 無權限查看

2. **管理牧區/小組** (org:manage):
   - `Global` Scope: 可新增、編輯、刪除所有牧區/小組
   - `Zone` Scope: 可編輯、刪除自己牧區下的小組，但不能編輯牧區本身
   - `Group` Scope: 僅能查看，不能編輯
   - `Self` Scope: 無權限

3. **指派牧區長/小組長**:
   - 需要 `org:manage` 權限
   - 指派時自動檢查該會友是否有對應角色，若無則提示是否自動指派

---

## Business Rules

### BR1: 命名規則
- **牧區名稱必須唯一**（不區分大小寫）
- **小組名稱在同一牧區內必須唯一**（跨牧區可重複）

### BR2: 狀態管理
- **啟用狀態**:
  - 牧區必須啟用才能被選擇作為小組的 `parentZoneId`
  - 小組必須啟用才能被選擇作為會友的 `groupId`
- **停用狀態**:
  - 停用牧區不會影響現有會友的歸屬，但會隱藏在下拉選單中
  - 停用小組不會影響現有會友的歸屬，但會隱藏在下拉選單中

### BR3: 階層關係
- **小組必須屬於某個牧區**（`type = 'Pastoral'` 時）
- **功能性小組**（`type = 'Functional'`）不需要 `parentZoneId`，用於課程班級、事工團隊等跨牧區群組

### BR4: Leader 指派
- **牧區長必須是已受洗的會友**（`baptismStatus = true`, 建議但非強制）
- **小組長必須是該牧區的會友**（`members.zoneId = parentZoneId`）
- **同一會友可以同時擔任多個小組長**（支援多重角色）

### BR5: 快取欄位維護
- **leaderName 快取**: 當指派 Leader 時，系統自動從 `members.fullName` 複製到 `zones.leaderName` 或 `groups.leaderName`
- **成員數量統計**: 
  - 牧區成員數量 = `count(members where zoneId = zoneId)`
  - 小組成員數量 = `count(members where groupId = groupId)`
  - 統計結果快取在前端，不寫入資料庫

---

## UI/UX Requirements

### UX1: 牧區管理頁面
- **Layout**: 表格顯示所有牧區
- **操作按鈕**: 
  - 頂部：「+ 新增牧區」按鈕（需 org:manage 權限）
  - 表格右側：編輯 (pi-pencil)、刪除 (pi-trash) 按鈕
- **篩選**: 
  - 搜尋框（姓名）
  - 狀態下拉選單（全部 / 啟用 / 停用）

### UX2: 小組管理頁面
- **Layout**: 表格顯示所有小組
- **操作按鈕**: 
  - 頂部：「+ 新增小組」按鈕（需 org:manage 權限）
  - 表格右側：編輯 (pi-pencil)、刪除 (pi-trash) 按鈕
- **篩選**: 
  - 搜尋框（姓名）
  - 牧區下拉選單（全部 / 特定牧區）
  - 狀態下拉選單（全部 / 啟用 / 停用）

### UX3: 新增/編輯表單
- **牧區表單欄位**:
  - 牧區名稱 (InputText, 必填)
  - 牧區長 (Select, 選填, 可搜尋)
  - 牧區描述 (Textarea, 選填)
  - 狀態 (ToggleSwitch, 啟用/停用)
- **小組表單欄位**:
  - 小組名稱 (InputText, 必填)
  - 所屬牧區 (Select, 必填, 僅限 Pastoral 類型)
  - 小組長 (Select, 選填, 可搜尋, 僅顯示該牧區會友)
  - 小組描述 (Textarea, 選填)
  - 狀態 (ToggleSwitch, 啟用/停用)

### UX4: 刪除確認對話框
- **標題**: 確認刪除
- **內容**: 
  - 若有下屬小組/成員，顯示警告訊息
  - 「確定要刪除 [牧區/小組名稱] 嗎？此操作無法復原。」
- **按鈕**: 取消 (outlined) / 確定刪除 (severity="danger")

### UX5: 角色指派提示對話框
- **觸發時機**: 指派牧區長/小組長時，若該會友無對應角色
- **標題**: 自動指派角色
- **內容**: 「[會友姓名] 尚未擁有 [牧區長/小組長] 角色，是否自動指派？」
- **按鈕**: 
  - 僅指派 Leader（不更改角色）
  - 同時指派角色（推薦, severity="primary"）
  - 取消

---

## Technical Considerations

### TC1: 資料一致性
- **更新 Leader 時同步 leaderName**: 使用 Firebase Transaction 確保一致性
- **統計數量**: 前端計算，不寫入資料庫，避免不同步問題

### TC2: 效能優化
- **牧區/小組列表分頁**: 預設每頁 20 筆
- **Leader 下拉選單**: 前 50 筆 + 搜尋功能，避免一次載入所有會友

### TC3: 錯誤處理
- **唯一性違反**: 若牧區名稱重複，顯示錯誤訊息「此牧區名稱已存在」
- **外鍵約束**: 若 `leaderId` 不存在，顯示錯誤訊息「找不到該會友」
- **階層關係違反**: 若刪除牧區時有啟用的小組，禁止刪除並顯示錯誤訊息

### TC4: Audit Log (預留給 ST027)
- **記錄操作**: 新增、編輯、刪除牧區/小組
- **記錄轉移**: 小組轉移至其他牧區時，記錄轉移前後的牧區 ID
- **記錄 Leader 變更**: 指派牧區長/小組長時，記錄變更前後的 Leader ID

---

## Out of Scope

以下功能不在此 Story 範圍內：

- ❌ 組織架構視覺化 Tree View（由 ST007 負責）
- ❌ 成員拖拉分配功能（由 ST008 負責）
- ❌ 待處理池管理（由 ST008 負責）
- ❌ 批次匯入牧區/小組（預留給 ST026）
- ❌ 牧區/小組的歷史紀錄查詢（預留給 ST027）

---

## Dependencies

- ✅ **ST001**: 資料核心與 Schema 定義 (members, zones, groups collections)
- ✅ **ST002**: RBAC Configuration (org:view, org:manage 權限)

---

## Success Metrics

- ✅ 能夠新增、編輯、刪除牧區與小組
- ✅ 能夠指派牧區長與小組長
- ✅ 刪除前檢查機制正常運作，防止資料不一致
- ✅ 權限控制正確套用，不同角色看到不同的操作選項
- ✅ Leader 指派時自動檢查角色並提示

---

## Related Stories

- **ST007**: 組織架構三 Tab 介面（使用此 Story 的 API）
- **ST008**: 成員調度與待處理池（使用此 Story 的資料）
- **ST021**: 小組增員（小組長使用小組資料）
- **ST022**: 我的小組名單（小組長查看小組成員）
