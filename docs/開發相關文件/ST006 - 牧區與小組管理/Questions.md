# ST006 - Questions & Clarifications

本文件記錄開發過程中需要澄清的問題與決策點。

---

## 🔴 Critical Questions (阻擋開發)

### Q1: 牧區長更換時的會友歸屬處理

**問題描述**:  
當更換牧區長時，原牧區長的 `zoneId` 應如何處理？

**選項**:

- A. 保留原牧區長的 `zoneId`（牧區長仍為該牧區成員）
- B. 清除原牧區長的 `zoneId`（牧區長變為未分區狀態）
- C. 詢問使用者是否保留（增加互動步驟）

**目前採用方案**: A（保留 `zoneId`）

**影響範圍**:

- `zone.service.ts` 的 `updateZone` 方法
- 牧區編輯表單的 Leader 更換邏輯

**決策日期**: _待確認_  
**決策人**: _待確認_

## A: 按照建議

### Q2: 小組長更換時的會友歸屬處理

**問題描述**:  
當更換小組長時，原小組長的 `groupId` 應如何處理？

**選項**:

- A. 保留原小組長的 `groupId`（小組長仍為該小組成員）
- B. 清除原小組長的 `groupId`（小組長變為未分組狀態）
- C. 詢問使用者是否保留（增加互動步驟）

**目前採用方案**: A（保留 `groupId`）

**影響範圍**:

- `group.service.ts` 的 `updateGroup` 方法
- 小組編輯表單的 Leader 更換邏輯

**決策日期**: _待確認_  
**決策人**: _待確認_

A: 按照建議

---

## 🟡 High Priority Questions (影響 UX)

### Q3: 刪除牧區時有會友的處理方式

**問題描述**:  
刪除牧區時，若該牧區下仍有會友，應如何處理？

**選項**:

- A. 顯示警告訊息但允許刪除（會友變為未分區狀態）
- B. 禁止刪除，必須先將會友轉移到其他牧區或移除
- C. 提供「批次轉移」功能，讓使用者選擇目標牧區

**目前採用方案**: A（顯示警告但允許刪除）

**影響範圍**:

- `zone.service.ts` 的 `checkBeforeDelete` 和 `deleteZone` 方法
- 刪除確認對話框的顯示邏輯

**決策日期**: _待確認_  
**決策人**: _待確認_

Answer: 採用 B 選項

---

### Q4: 刪除小組時有會友的處理方式

**問題描述**:  
刪除小組時，若該小組下仍有會友，應如何處理？

**選項**:

- A. 顯示警告訊息但允許刪除（會友變為未分組狀態）
- B. 禁止刪除，必須先將會友轉移到其他小組或移除
- C. 提供「批次轉移」功能，讓使用者選擇目標小組

**目前採用方案**: A（顯示警告但允許刪除）

**影響範圍**:

- `group.service.ts` 的 `checkBeforeDelete` 和 `deleteGroup` 方法
- 刪除確認對話框的顯示邏輯

**決策日期**: _待確認_  
**決策人**: _待確認_

Answer: 採用 B 選項

---

### Q5: Leader 指派時的角色自動分配

**問題描述**:  
指派牧區長/小組長時，若該會友尚未擁有對應角色（`zone_leader` / `group_leader`），系統應如何處理？

**選項**:

- A. 顯示提示對話框，讓使用者選擇是否自動指派角色
- B. 強制自動指派角色（不詢問）
- C. 僅指派 Leader，不自動指派角色（需使用者手動前往角色管理頁面指派）

**目前採用方案**: A（顯示提示對話框）

**影響範圍**:

- `ZoneForm.vue` 和 `GroupForm.vue` 的 Leader 選擇邏輯
- 需實作角色檢查與自動指派的 API

**決策日期**: _待確認_  
**決策人**: _待確認_

Answer: 採用 A 選項, 但是是跳出提示, 告訴使用者系統將會自動指派角色

---

## 🟢 Medium Priority Questions (資料規則)

### Q6: 牧區名稱唯一性規則

**問題描述**:  
牧區名稱的唯一性檢查是否區分大小寫？

**選項**:

- A. 不區分大小寫（「林牧區」與「林牧区」視為重複）
- B. 區分大小寫（「林牧區」與「林牧区」視為不同）

**目前採用方案**: A（不區分大小寫）

**影響範圍**:

- `zone.repository.ts` 的 `findByName` 方法

**決策日期**: _待確認_  
**決策人**: _待確認_

Answer: 採用 A 選項

---

### Q7: 小組名稱唯一性範圍

**問題描述**:  
小組名稱的唯一性檢查範圍應為何？

**選項**:

- A. 同牧區內唯一（不同牧區可有同名小組，如「林牧區 - 喜樂小組」與「張牧區 - 喜樂小組」）
- B. 全系統唯一（所有小組名稱不可重複）

**目前採用方案**: A（同牧區內唯一）

**影響範圍**:

- `group.repository.ts` 的 `findByNameInZone` 方法
- `group.service.ts` 的 `createGroup` 和 `updateGroup` 方法

**決策日期**: _待確認_  
**決策人**: _待確認_

Answer: 採用 B 選項

---

### Q8: 功能性小組（Functional）的實作範圍

**問題描述**:  
功能性小組（`type = 'Functional'`）是否需要在此 Story 實作？

**背景說明**:  
根據 System Architecture Blueprint，功能性小組用於課程班級、事工團隊等跨牧區群組。但此 Story 主要聚焦於牧養小組的管理。

**選項**:

- A. 支援 Functional 類型，但不強制使用（保留彈性給後續 Story）
- B. 僅實作 Pastoral 小組，Functional 留給 ST015-ST020（課程管理）
- C. 完整實作 Functional 小組的 UI 與功能

**目前採用方案**: A（支援但不強制使用）

**影響範圍**:

- `group.schema.ts` 的驗證邏輯
- `GroupForm.vue` 的 `type` 選擇器顯示

**決策日期**: _待確認_  
**決策人**: _待確認_

Answer: 採用 A 選項

---

### Q9: 牧區長資格限制

**問題描述**:  
牧區長是否必須是「已受洗」的會友？

**選項**:

- A. 強制限制（`baptismStatus = true`），未受洗者無法被指派為牧區長
- B. 建議但不強制（顯示警告訊息，但允許指派）
- C. 無限制

**目前採用方案**: B（建議但不強制）

**影響範圍**:

- `ZoneForm.vue` 的 Leader 候選人篩選邏輯
- `zone.service.ts` 的 `createZone` 和 `updateZone` 驗證

**決策日期**: _待確認_  
**決策人**: _待確認_

Answer: 採用 A 選項, 同時小組長也必須是 已受洗 的會友

---

### Q10: 小組長資格限制

**問題描述**:  
小組長是否必須是「該牧區的會友」？

**選項**:

- A. 強制限制（`members.zoneId = parentZoneId`），跨牧區無法指派
- B. 建議但不強制（顯示警告訊息，但允許指派）
- C. 無限制

**目前採用方案**: A（強制限制）

**影響範圍**:

- `GroupForm.vue` 的 Leader 候選人篩選邏輯
- `group.service.ts` 的 `createGroup` 和 `updateGroup` 驗證

**決策日期**: _待確認_  
**決策人**: _待確認_

Answer: 採用 A 選項, 區長同理, 區長也必須是該牧區的會友, 跨牧區無法指派

---

## 🔵 Low Priority Questions (錦上添花)

### Q11: 牧區/小組描述欄位的字數限制

**問題描述**:  
牧區/小組的 `description` 欄位應限制多少字元？

**選項**:

- A. 500 字元（約 1-2 段落）
- B. 1000 字元（約 3-4 段落）
- C. 不限制

**目前採用方案**: A（500 字元）

**影響範圍**:

- `schema.ts` 的 Zod 驗證規則

**決策日期**: _待確認_  
**決策人**: _待確認_

Answer: 採用 A 選項

---

### Q12: 牧區/小組列表的預設排序

**問題描述**:  
牧區/小組列表的預設排序應為何？

**選項**:

- A. 按建立時間（最新在前）
- B. 按名稱排序（A-Z）
- C. 按成員數量排序（多到少）

**目前採用方案**: A（按建立時間）

**影響範圍**:

- `zone.repository.ts` 和 `group.repository.ts` 的 `findAll` 方法

**決策日期**: _待確認_  
**決策人**: _待確認_

Answer: 採用 A 選項

---

### Q13: Leader 候選人列表的載入策略

**問題描述**:  
Leader 候選人（會友列表）的載入策略應為何？

**選項**:

- A. 預載前 50 筆 + 搜尋功能（降低初始載入時間）
- B. 載入全部會友（1000 筆以內）
- C. 使用虛擬滾動（Virtual Scroll）載入全部會友

**目前採用方案**: B（載入全部，限制 1000 筆）

**影響範圍**:

- `zone.service.ts` 和 `group.service.ts` 的 `getLeaderCandidates` 方法

**決策日期**: _待確認_  
**決策人**: _待確認_

Answer: 採用 A 方案, 不過由於無法跨牧區跨小組指派, 所以在指派區長的時候, 只會顯示屬於該牧區的會友; 指派小組長的時候, 只會顯示屬於該小組的會友列表.

---

## 📝 Design Decisions (已決策)

### D1: 軟刪除 vs 硬刪除

**決策**: 採用軟刪除（將 `status` 改為 `Inactive`）

**原因**:

- 保留歷史資料，避免資料遺失
- 支援後續的審計日誌功能（ST027）
- 允許「恢復」功能（可選）

**影響範圍**:

- `zone.service.ts` 和 `group.service.ts` 的 `delete` 方法

---

### D2: leaderName 快取欄位

**決策**: 在 `zones` 和 `groups` Collection 增加 `leaderName` 快取欄位

**原因**:

- 減少查詢次數（避免每次顯示牧區/小組列表時都需要 JOIN members）
- 提升列表頁面的載入速度
- 快取同步由 Service Layer 負責

**影響範圍**:

- `Zone` 和 `Group` Interface 增加 `leaderName` 欄位
- `zone.service.ts` 和 `group.service.ts` 在指派 Leader 時自動更新 `leaderName`

---

### D3: 統計資訊的計算方式

**決策**: 統計資訊（成員數量、小組數量）在 API 查詢時動態計算，不寫入資料庫

**原因**:

- 避免資料不同步問題
- Firebase 的 `count()` 查詢效能足夠
- 後續可考慮使用 Cloud Functions 定期更新快取（如需優化）

**影響範圍**:

- `zone.service.ts` 和 `group.service.ts` 的 `getZones` 和 `getGroups` 方法

---

## 📌 Notes & Assumptions

1. **會友多重角色**: 根據 ST002，會友可擁有多個角色（`roleIds: string[]`），因此同一會友可以同時是牧區長和小組長。

2. **功能性小組的範圍**: 功能性小組（`type = 'Functional'`）主要用於課程班級（ST015-ST020）和事工團隊（未來 Story），在此 Story 僅實作基礎架構，不強制使用。

3. **組織架構視覺化**: 此 Story 不包含 Tree View 的實作，Tree View 由 ST007 負責。

4. **成員拖拉功能**: 此 Story 不包含拖拉分配功能，由 ST008 負責。

5. **RBAC 整合**: 此 Story 依賴 ST002 的 RBAC 權限系統，需確保 `org:view` 和 `org:manage` 權限已實作。

---

**Last Updated**: 2026-02-16  
**Maintained By**: Development Team
