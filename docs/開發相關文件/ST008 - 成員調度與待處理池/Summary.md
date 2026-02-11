# ST008 - 成員調度與待處理池 (Member Transfer & Pending Pool)

**Priority**: Must Have (Core Feature)  
**Phase**: 3 - 組織架構管理

## 簡述
實作會友在牧區/小組間的調度轉移功能，以及管理「已註冊但未歸屬小組」的待處理池。

## 核心功能
- 成員轉移（小組間、牧區間）
- 待處理池列表（zoneId 和 groupId 皆為 null 的會友）
- 拖拉分配（Drag & Drop）
- 批次分配
- 轉移歷史記錄（Audit Log）

## 依賴項
- ✅ ST001: 資料核心與 Schema 定義
- ✅ ST002: RBAC Configuration
- ✅ ST003: 會友資料列表
- ✅ ST006: 牧區與小組管理
- ✅ ST007: 組織架構三 Tab 介面

## 相關模組
- 組織架構模組
- RBAC 權限檢查（member:edit, org:manage）
