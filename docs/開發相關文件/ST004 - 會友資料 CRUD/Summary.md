# ST004 - 會友資料 CRUD (Member CRUD Operations)

**Priority**: Must Have (Core Feature)  
**Phase**: 2 - 核心 CRUD 功能

## 簡述
實作會友資料的新增、編輯、刪除功能，包含表單驗證、牧區小組連動、以及軟刪除機制。

## 核心功能
- 新增會友（含頭像上傳）
- 編輯會友資料
- 軟刪除（狀態改為 Inactive）
- 牧區小組連動下拉選單
- 表單驗證（手機格式、Email、必填欄位）

## 依賴項
- ✅ ST001: 資料核心與 Schema 定義
- ✅ ST002: RBAC Configuration
- ✅ ST003: 會友資料列表

## 相關模組
- 人員與組織模組
- RBAC 權限檢查（member:create, member:edit, member:delete）
