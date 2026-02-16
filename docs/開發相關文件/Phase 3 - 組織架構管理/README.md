# Phase 3: 組織架構管理 (Organization Management)

**目標**: 建立牧區/小組管理功能，實現完整的組織架構管理與成員調度。

**Stories**: ST006, ST007, ST008  
**狀態**: 🔲 規劃中  
**預計時程**: Sprint 5-6 (2-3 週)

---

## 📋 Stories 總覽

### ST006 - 牧區與小組管理 ⭐
**優先級**: Must Have  
**類型**: Backend + Frontend CRUD

實作牧區（Zone）與小組（Group）的完整 CRUD 功能，包含 Leader 指派、狀態管理、階層關係維護。

**關鍵功能**:
- 牧區/小組的新增、編輯、刪除
- Leader 指派（牧區長、小組長）
- 刪除前檢查機制（防止誤刪）
- 統計資訊（成員數量、小組數量）

[📄 詳細文件](./ST006%20-%20牧區與小組管理/)

---

### ST007 - 組織架構三 Tab 介面 ⭐
**優先級**: Must Have  
**類型**: Frontend UI + Integration

實作組織架構管理頁面，提供三個 Tab 介面（牧區/小組、課程、事工），以 Tree View 視覺化呈現階層關係。

**關鍵功能**:
- Tab 1: Tree View 顯示牧區/小組階層
- Tab 2: 顯示課程群組（唯讀）
- Tab 3: 顯示事工群組（預留）
- 待處理池（未歸屬會友列表）
- 拖拉互動（UI 層）

[📄 詳細文件](./ST007%20-%20組織架構三%20Tab%20介面/)

---

### ST008 - 成員調度與待處理池 ⭐
**優先級**: Must Have  
**類型**: Frontend + Backend Integration

實作會友在牧區/小組間的調度轉移功能，支援拖拉、點擊、批次等多種分配方式。

**關鍵功能**:
- 拖拉分配（Drag & Drop）
- 點擊分配（快速分配對話框）
- 批次分配（最多 50 人）
- 成員轉移（跨小組/跨牧區）
- Audit Log 寫入（查詢介面預留給 ST027）

[📄 詳細文件](./ST008%20-%20成員調度與待處理池/)

---

## 🔗 依賴關係

```
ST001 (資料核心) ✅
  └─ ST002 (RBAC) ✅
      └─ ST006 (牧區小組管理)
          └─ ST007 (三 Tab 介面)
              └─ ST008 (成員調度)
```

### 外部依賴
- ✅ **ST001**: 提供 members, zones, groups 資料結構
- ✅ **ST002**: 提供 RBAC 權限系統（org:view, org:manage）
- ✅ **ST003**: 提供會友資料（用於待處理池）

### 內部依賴
- **ST006** 必須先完成，提供牧區/小組的 CRUD API
- **ST007** 依賴 ST006，提供視覺化介面
- **ST008** 依賴 ST006 + ST007，實作拖拉與分配邏輯

---

## 🎯 開發順序建議

### Week 1: ST006 (牧區與小組管理)
**Day 1-2**: Backend - 牧區/小組 CRUD API
- 實作 `zone.service.ts` 和 `zone.repository.ts`
- 實作 `group.service.ts` 和 `group.repository.ts`
- 實作刪除前檢查機制

**Day 3-4**: Frontend - 牧區/小組表單與列表
- 實作 `ZoneForm.vue` 和 `GroupForm.vue`
- 實作牧區/小組列表頁（`/organization/zones`, `/organization/groups`）
- 整合 Leader 選擇器與角色檢查

**Day 5**: Testing & Integration
- Unit Tests（Service Layer）
- E2E Tests（CRUD 流程）
- Bug Fix

---

### Week 2: ST007 (組織架構三 Tab 介面)
**Day 1-2**: Tree View 實作
- 實作 `OrganizationTabs.vue`（主容器）
- 實作 `PastoralTab.vue` 與 `ZoneGroupTree.vue`
- 實作 Tree View 的展開/收合與搜尋功能

**Day 3**: 待處理池實作
- 實作 `PendingPool.vue` 與 `PendingMemberCard.vue`
- 實作待處理池 API（`/api/organization/pending-pool`）
- 整合拖拉 UI 互動（Drag Start/End）

**Day 4**: Tab 2 & Tab 3
- 實作 `CourseTab.vue`（使用 Mock Data）
- 實作 `MinistryTab.vue`（Placeholder）
- 實作 Tab 切換與狀態記錄

**Day 5**: Testing & Integration
- E2E Tests（Tree View 互動、Tab 切換）
- Performance Testing（Tree View 效能）
- Bug Fix

---

### Week 3: ST008 (成員調度與待處理池)
**Day 1-2**: 拖拉分配功能
- 實作 `useDragAndDrop.ts` composable
- 實作 `DraggableTreeNode.vue`（Drop Target）
- 實作分配 API（`/api/organization/assign-member`）
- 測試拖拉互動與驗證

**Day 3**: 點擊分配與批次分配
- 實作 `QuickAssignDialog.vue`
- 實作 `BatchAssignDialog.vue`
- 實作批次分配 API（`/api/organization/batch-assign`）
- 實作牧區小組連動選擇器

**Day 4**: 成員轉移與 Audit Log
- 實作 `TransferDialog.vue`
- 實作轉移 API（`/api/organization/transfer-member`）
- 實作 Audit Log 寫入（預留查詢介面）
- 整合權限檢查（Zone Scope 限制）

**Day 5**: Testing & Integration
- Unit Tests（composables）
- E2E Tests（拖拉、點擊、批次分配流程）
- Performance Testing（批次分配效能）
- Bug Fix

---

## ✅ 完成標準 (Definition of Done)

### ST006
- [ ] 牧區/小組 CRUD API 完成並通過測試
- [ ] 牧區/小組表單與列表頁完成
- [ ] Leader 選擇器與角色檢查實作完成
- [ ] 刪除前檢查機制正常運作
- [ ] 權限控制（RBAC）正確套用
- [ ] Unit Tests 覆蓋率 > 80%
- [ ] E2E Tests 通過

### ST007
- [ ] Tree View 正確顯示牧區/小組階層
- [ ] 待處理池正確顯示未歸屬會友
- [ ] Tab 切換流暢，狀態正確保留
- [ ] 拖拉 UI 互動正常（游標變更、目標高亮）
- [ ] 權限控制（RBAC）正確套用
- [ ] E2E Tests 通過
- [ ] Tree View 效能良好（載入時間 < 2 秒）

### ST008
- [ ] 拖拉分配功能正常運作
- [ ] 點擊分配對話框正常運作
- [ ] 批次分配功能正常運作（最多 50 人）
- [ ] 成員轉移功能正常運作
- [ ] 分配與轉移操作正確更新會友的 `zoneId` 和 `groupId`
- [ ] Audit Log 正確寫入（查詢介面預留）
- [ ] 權限控制（RBAC）正確套用
- [ ] Unit Tests 覆蓋率 > 80%
- [ ] E2E Tests 通過

---

## 🔍 關鍵問題與決策

### 已確認的決策
1. **Tree View 不顯示成員列表**（效能考量，點擊跳轉到小組詳情）
2. **批次分配採用「部分成功」策略**（失敗不回滾）
3. **Audit Log 僅實作寫入**（查詢介面由 ST027 負責）
4. **牧區名稱全系統唯一**（不區分大小寫）
5. **小組名稱同牧區內唯一**（跨牧區可重複）

### 待確認的問題
以下問題記錄於各 Story 的 `Questions.md`，需產品經理或業務方澄清：

**ST006**:
- Q1: 牧區長更換時，原牧區長的 `zoneId` 是否清除？
- Q2: 小組長更換時，原小組長的 `groupId` 是否清除？
- Q3: 刪除牧區時有會友的處理方式（警告 vs 禁止）

**ST007**:
- Q1: Tree View 是否顯示成員列表？（已決策：不顯示）
- Q2: 拖拉功能的實作範圍（已決策：僅 UI 互動）
- Q3: Tab 2 (課程) 的資料來源（已決策：先用 Mock Data）

**ST008**:
- Q1: 批次分配的失敗策略（已決策：部分成功）
- Q2: Audit Log 的實作範圍（已決策：僅寫入）
- Q3: 拖拉到牧區節點的處理方式（已決策：顯示錯誤）

---

## 📊 風險評估

### 技術風險
| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|----------|
| Tree View 效能問題（牧區/小組過多） | 高 | 中 | 使用虛擬滾動、懶加載 |
| 拖拉功能瀏覽器相容性 | 中 | 低 | 使用 HTML5 標準 API，現代瀏覽器皆支援 |
| 批次分配 Firestore 限制（500 筆） | 中 | 低 | 限制單次最多 50 人 |
| Audit Log 寫入影響主流程效能 | 中 | 中 | 使用非同步寫入（Cloud Functions） |

### 業務風險
| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|----------|
| 使用者誤刪牧區/小組 | 高 | 中 | 實作刪除前檢查與確認對話框 |
| 會友分配錯誤 | 中 | 中 | 實作 Audit Log 與轉移歷史記錄 |
| 權限控制不嚴謹 | 高 | 低 | 整合 ST002 RBAC，全面測試 |

---

## 📚 參考文件

- [Stories Roadmap](../Stories%20Roadmap.md)
- [System Architecture Blueprint](../System%20Architecture%20Blue%20Print.md)
- [ST001 - 資料核心與 Schema 定義](../ST001%20-%20資料核心與%20Schema%20定義/)
- [ST002 - RBAC Configuration](../ST002%20-%20RBAC%20Configuration/)
- [ST003 - 會友資料列表](../ST003%20-%20會友資料列表/)

---

**Last Updated**: 2026-02-16  
**Maintained By**: Development Team
