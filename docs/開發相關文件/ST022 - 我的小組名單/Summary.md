# ST022 - 我的小組名單 (My Group Members)

**Priority**: Should Have  
**Phase**: 7 - 小組管理功能

## 簡述
實作小組長專屬的組員名單查看功能，提供組員聯繫方式、撥打電話、Line 連結、以及組員詳情編輯。

## 核心功能
- 我的小組名單（Scope: Group）
- 組員聯繫方式
  - 一鍵撥打電話（tel: link）
  - Line 連結（需解鎖 Line ID）
- 組員詳情查看
- 有限度編輯組員資料
- 修課狀態查看
- 生日提醒

## 依賴項
- ✅ ST001: 資料核心與 Schema 定義
- ✅ ST002: RBAC Configuration（Scope: Group）
- ✅ ST003: 會友資料列表
- ✅ ST005: 敏感資料解鎖機制

## 相關模組
- 小組管理模組
- RBAC 權限檢查（member:view, member:edit, Scope: Group）
