# ST024 - 牧養筆記 (Pastoral Notes)

**Priority**: Could Have (Not MVP Scope)  
**Phase**: 8 - 牧養與關懷模組

## 簡述
實作牧養筆記功能，小組長、區長、牧師可撰寫對組員的私密關懷紀錄，僅上層可見，並支援標籤分類與搜尋。

## 核心功能
- 撰寫牧養筆記（私密）
- 筆記權限控制（僅上層可見）
- 標籤分類（關懷、探訪、代禱、輔導）
- 筆記搜尋
- 筆記歷史查看
- 提醒功能（下次關懷時間）

## 依賴項
- ✅ ST001: 資料核心與 Schema 定義
- ✅ ST002: RBAC Configuration（Scope: Group/Zone）
- ✅ ST022: 我的小組名單

## 相關模組
- 牧養與關懷模組
- RBAC 權限檢查（Scope: Group/Zone，特殊權限檢查）
