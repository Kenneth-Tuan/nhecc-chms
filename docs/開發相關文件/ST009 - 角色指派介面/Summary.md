# ST009 - 角色指派介面 (Role Assignment Interface)

**ID**: ST-009  
**Priority**: Must Have (Core Feature)  
**Phase**: 4 - 角色與權限管理  
**Status**: 📝 Planning (Documentation Complete)

---

## 簡述

實作為會友指派角色的介面，支援多重角色、角色移除、以及角色變更後的權限即時生效機制。管理員可在會友編輯頁新增或移除角色、預覽角色權限（XYZ 三軸），並在會友列表依角色篩選會友。

---

## 核心功能

### 1. 會友編輯頁的角色管理
- 顯示會友當前擁有的所有角色（角色卡片）
- 新增角色（MultiSelect 下拉選單，排除已擁有的角色）
- 移除角色（顯示確認對話框，防呆檢查最後一個角色）
- 預覽角色權限（顯示 XYZ 三軸設定）
- 儲存變更後自動清除 UserContext 快取

### 2. 會友詳情頁的角色顯示
- 以卡片形式顯示會友的所有角色
- 提供「查看權限」按鈕（展開顯示 XYZ 三軸）
- 提供「編輯角色」快速入口（需 `system:config` 權限）

### 3. 會友列表的角色篩選
- 新增「角色」欄位（顯示前 2 個 + 「+N」按鈕）
- 新增「角色」多選篩選器（OR 邏輯）
- 顯示角色統計資訊（可點擊快速篩選）

### 4. 批次角色指派（選填）
- 勾選多位會友（最多 50 位）
- 批次指派對話框：
  - 顯示已選擇的會友列表
  - 選擇角色（MultiSelect）
  - 選擇指派模式：「新增」或「取代」
- 批次更新後自動清除所有相關會友的 UserContext 快取

### 5. UserContext 快取清除
- 角色變更後立即清除該會友的 UserContext 快取
- 使用 Node Memory Cache（TTL: 5 分鐘）
- 可選擇強制重新登入（需整合 ST010）

---

## 關鍵 Acceptance Criteria

- ✅ AC1: 會友編輯頁顯示角色管理區塊，支援新增、移除、預覽角色
- ✅ AC2: 會友詳情頁顯示角色與權限區塊，提供快速編輯入口
- ✅ AC3: 會友列表新增角色欄位與角色篩選器
- ✅ AC4: 角色變更後自動清除 UserContext 快取
- ✅ AC5: 批次角色指派（選填，可後續迭代）
- ✅ AC6: 權限控制（`system:config` 權限）

---

## 技術亮點

1. **UserContext 快取管理**: 使用 Node Memory Cache，角色變更後自動清除快取
2. **批次更新**: 使用 Firestore Batch Write，支援批次指派（最多 50 位）
3. **前後端雙重驗證**: 至少一個角色的防呆機制
4. **角色權限預覽**: 即時查詢並顯示 XYZ 三軸設定
5. **靈活的指派模式**: 支援「新增」和「取代」兩種批次指派模式

---

## 依賴項

- ✅ **ST001**: 資料核心與 Schema 定義 (`members.roleIds`)
- ✅ **ST002**: RBAC Configuration（提供角色定義與權限矩陣）
- ✅ **ST004**: 會友資料 CRUD（提供會友編輯頁與詳情頁）

---

## 相關 Stories

- **ST002**: RBAC Configuration（提供角色定義與權限矩陣）
- **ST004**: 會友資料 CRUD（提供會友編輯頁與詳情頁）
- **ST010**: 帳號安全與密碼管理（提供強制重新登入功能）
- **ST027**: 審計日誌（記錄角色變更歷史）

---

## 詳細文件

- 📄 [Description.md](./Description.md) - 完整需求文件（User Story, AC, Business Rules, UI/UX）
- 🏗️ [Technical Design.md](./Technical%20Design.md) - 技術設計文件（Data Models, API, Frontend/Backend Architecture）
- ❓ [Questions.md](./Questions.md) - 問題與澄清事項（13 個待確認問題）

---

**Last Updated**: 2026-02-16  
**Documentation Status**: Complete (Pending Review)
