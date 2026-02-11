# ST009 - 角色指派介面 (Role Assignment Interface)

**Priority**: Must Have (Core Feature)  
**Phase**: 4 - 角色與權限管理

## 簡述
實作為會友指派角色的介面，支援多重角色、角色移除、以及角色變更後的權限即時生效機制。

## 核心功能
- 會友角色列表顯示
- 新增角色（MultiSelect 下拉選單）
- 移除角色（需檢查最後一個角色不可移除）
- 預覽角色權限（顯示該角色的 XYZ 三軸設定）
- 角色變更後清除 UserContext 快取

## 依賴項
- ✅ ST001: 資料核心與 Schema 定義
- ✅ ST002: RBAC Configuration
- ✅ ST004: 會友資料 CRUD

## 相關模組
- 角色管理模組
- RBAC 權限檢查（system:config）
