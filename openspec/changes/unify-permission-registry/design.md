## Context

當前的權限系統雖然立意良好（劃分了功能 X 軸、資料範圍 Y 軸、與敏感欄位 Z 軸），但在實作上邊界模糊且邏輯散落：
1. **API 層次**：使用 `requireAbility` 強制檢查 CASL 權限。
2. **CASL 層次 (`ability.ts`)**：把 Data Scope (`Global`, `Zone`, `Group`, `Self`) 條件寫死在 CASL 規則裡。
3. **Service 層次**：使用 `applyScopeConstraints` 進行 DB 查詢過濾，又透過 `assertScopeAccess` 進行單筆驗證。
4. **Policy 層次**：只有 `CourseClass` 發展出 `courseClass.policy.ts` 來處理業務邏輯狀態（如發布狀態）。

這種多頭馬車的情況造成前後端難以共享權限字典，且業務邏輯與授權邏輯互相干擾。

## Goals / Non-Goals

**Goals:**
- 將權限系統改組為「三維度模型 (3D Authorization Model)」。
- 建立 `PERMISSION_REGISTRY` 作為唯一的 Feature / Field 到 Permission Key 靜態對應表（前後端共用）。
- 實作 Backend-driven UI：透過 Policy 計算單筆資料的操作權限，並隨 DTO `_meta` 欄位回傳給前端。
- 將 Data Scope 的判斷純粹化，從 CASL 中移除，統一由 Policy 與 Service 處理。

**Non-Goals:**
- 不改變既有的角色定義 (Role Schema) 或既有的 `PermissionKey` 清單（僅作底層重構）。
- 不替換 CASL，而是將其降級為單純的「功能開關」判斷引擎。

## Decisions

### 1. 抽離 Data Scope 判斷
**決定**：CASL (`ability.ts`) 將不再包含任何 `{ uuid: ... }` 或 `{ teacherIds: ... }` 等資料屬性條件，也不再判斷 `userContext.scope`。
**原因**：CASL 條件判斷無法直接轉換為複雜的關聯資料庫查詢，且容易與 `scopes.ts` 的判斷衝突。CASL 只需回答「此人是否有權限編輯（任意）會友」，而「他是否有權限編輯（這位特定）會友」交由 `Policy` 去判斷。

### 2. 前後端共用的權限註冊表 (Permission Registry)
**決定**：在 `app/utils/rbac/registry.ts` 建立 `PERMISSION_REGISTRY`，明確定義每個前端的 Action / Button / Field 對應的 `PermissionKey` 或 `SensitiveField`。
**原因**：前端 UI 元件（如 `<Button>`）可以直接透過 `usePolicy().canAccessFeature('member.delete')` 來決定是否渲染，做到 Zero Drift。後端 API 亦可共用此表作為防禦依據。

### 3. 全面導入 Policy Pattern
**決定**：所有 Entity 建立各自的 Policy（如 `member.policy.ts`）。API 與 Service 統一呼叫 Policy 的 `canUpdate`, `canDelete` 方法。
**原因**：Policy 將成為權限判斷的唯一守門員。每個方法會依序執行三步驟驗證：
1. `ability.can()` (功能驗證 X 軸)
2. `assertScopeAccess()` (資料範圍驗證 Y 軸)
3. 業務狀態驗證 (如：狀態是否為 SETUP)。

### 4. Backend-driven UI
**決定**：在回傳清單或詳情 API 時，將 Policy 計算後的結果附加在回傳的 `_meta` 欄位。
**原因**：前端不需重複實作「是否同屬一個牧區」等複雜 Scope 判斷邏輯，只需檢查 `_meta.canUpdate`。

## Risks / Trade-offs

- **[Risk] 後端效能損耗** → 在回傳 List API 時，需要為每一筆資料計算 `_meta.canUpdate`。
  - **Mitigation**: Policy 內的驗證皆為記憶體計算（不需呼叫 DB）。`userContext` 和 `member` 資料都已在 Service 中備妥。
- **[Risk] 前端重構範圍大** → 所有現存使用 `can('update', member)` 的 UI 元件都需要改寫為看 `_meta.canUpdate`。
  - **Mitigation**: 這是長痛不如短痛，能根本解決前端權限誤判的雷區。
