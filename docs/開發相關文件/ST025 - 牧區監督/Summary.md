# ST025 - 牧區監督 (Zone Supervision)

**Priority**: Could Have (Not MVP Scope)  
**Phase**: 8 - 牧養與關懷模組

## 簡述
實作牧區監督功能，區長/牧師可查看旗下各小組的健康狀況（出席率紅綠燈）、聚會紀錄繳交狀況、以及小組長關懷提醒。

## 核心功能
- 小組健康監控
  - 出席率紅綠燈列表
  - 異常小組警示
- 聚會紀錄繳交狀況
- 小組長關懷提醒
- 牧區統計報表
- 小組長管理（查看所有小組長）

## 依賴項
- ✅ ST001: 資料核心與 Schema 定義
- ✅ ST002: RBAC Configuration（Scope: Zone）
- ✅ ST006: 牧區與小組管理
- ✅ ST023: 聚會紀錄

## 相關模組
- 牧養與關懷模組
- RBAC 權限檢查（Scope: Zone）
