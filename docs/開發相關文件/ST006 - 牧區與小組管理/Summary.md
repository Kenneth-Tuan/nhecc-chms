# ST006 - 牧區與小組管理 (Zone & Group Management)

**Priority**: Must Have (Core Feature)  
**Phase**: 3 - 組織架構管理

## 簡述
實作牧區（Zone）與小組（Group）的 CRUD 功能，包含 Leader 指派、狀態管理、以及階層關係維護。

## 核心功能
- 牧區 CRUD（新增、編輯、刪除、啟用/停用）
- 小組 CRUD（需指定所屬牧區）
- Leader 指派（牧區長、小組長）
- 牧區小組階層關係維護
- 統計資訊（成員數量、小組數量）

## 依賴項
- ✅ ST001: 資料核心與 Schema 定義
- ✅ ST002: RBAC Configuration

## 相關模組
- 組織架構模組
- RBAC 權限檢查（org:manage）
