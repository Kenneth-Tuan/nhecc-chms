## Why

當前系統的權限管理機制散落在 API Handler (`validation.ts` 的 `requireAbility`)、Service 層 (`scopes.ts` 的 `applyScopeConstraints`) 以及單獨的 Policy (`courseClass.policy.ts`)。此外，CASL (X軸) 與 Data Scope (Y軸) 以及業務邏輯經常互相混雜，且命名規範（如 `member:edit`, `ADMIN_UPDATE`, `update` 等）未完全統一。這導致開發維護不易，前端亦難以動態推斷 UI 狀態。為了達成單一真實來源 (Single Source of Truth)，我們需要一個統一的權限註冊表 (Permission Registry) 以及標準化的 Policy Pattern，分兩階段徹底解決這個架構性問題。

## What Changes

本重構計畫分為兩大階段進行：
- **階段一：建立統一權限註冊表 (Phase 1)**
  - 新增 `app/utils/rbac/registry.ts` 作為前後端共用的靜態權限註冊表。
  - 在註冊表中明確映射所有系統功能 (Features) 與前端敏感欄位 (Fields) 所對應的 `PermissionKey` 及 `SensitiveField`。
  - 前端新增 `usePolicy` composable 供 UI 元件進行靜態查表。
- **階段二：全面導入 Policy Pattern 與邏輯收斂 (Phase 2)**
  - 將 Data Scope (Y軸) 的檢查邏輯完全從 CASL (`ability.ts`) 抽離，CASL 只負責判斷功能是否開啟。
  - 為各實體 (如 Member, Organization 等) 建立對應的 Policy，統一封裝「CASL (X軸) + Scope (Y軸) + 業務狀態」的權限檢查邏輯。
  - **BREAKING**: API 路由與 Service 中現存的 `requireAbility` 與零散的 Scope 檢查，將被統一替換為對 Policy 介面的呼叫。
  - **BREAKING**: 後端在回傳 List 或 Detail API 時，透過 Policy 動態計算出 `_meta.canUpdate` 等屬性供前端使用（Backend-driven UI）。

## Capabilities

### New Capabilities
- `permission-registry`: A unified configuration file mapping UI features and data fields to corresponding RBAC rules (Permission Keys & Sensitive Fields).
- `policy-pattern`: A standardized backend layer handling dynamic access control logic (combining functional permissions, data scopes, and business states).

### Modified Capabilities
- `members`: Refactor member queries and updates to rely on the new `MemberPolicy` and return access metadata in `_meta`.
- `auth`: **BREAKING** Remove data scope (Y-axis) logic from CASL `buildAbility`. CASL will only manage pure functional permissions (X-axis) and field unlocks (Z-axis).

## Impact

- **Affected Code**: 
  - `app/utils/casl/ability.ts` (Remove data scope logic)
  - `app/types/role.ts` & `app/utils/rbac/permissions.ts` (Align mapping keys)
  - All existing API handlers (`server/api/**/*.ts`) checking permissions
  - All existing services (`server/services/**/*.ts`) enforcing data scope
- **APIs**: Existing response DTOs (e.g. Member Details/List) will be augmented with `_meta` fields detailing allowable actions.
- **Dependencies**: Minimal external dependency changes. Heavy reliance on existing `CASL` and `Zod` implementations, but orchestrated through the newly introduced Policy layer and Registry.
