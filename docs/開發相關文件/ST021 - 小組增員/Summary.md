# ST021 - 小組增員 (Group Member Recruitment)

**Priority**: Should Have  
**Phase**: 7 - 小組管理功能

## 簡述
實作小組長的增員功能，包含主動搜尋無組別會友（Pull）、產生小組專屬邀請連結、以及 QR Code 掃描自動入組。

## 核心功能
- 主動搜尋（Pull）
  - 搜尋 groupId 為 null 的會友
  - 直接拉入小組
- 邀請連結（Invite）
  - 產生小組專屬 QR Code/連結
  - 新人註冊時自動入組
  - 邀請連結有效期管理

## 依賴項
- ✅ ST001: 資料核心與 Schema 定義
- ✅ ST002: RBAC Configuration（Scope: Group）
- ✅ ST003: 會友資料列表
- ✅ ST006: 牧區與小組管理

## 相關模組
- 小組管理模組
- RBAC 權限檢查（member:edit, Scope: Group）
