# ST007 - 組織架構三 Tab 介面 (Organization Structure 3-Tab Interface)

**Priority**: Must Have (Core Feature)  
**Phase**: 3 - 組織架構管理

## 簡述
實作組織架構管理頁面，包含三個 Tab：牧區/小組（Tab 1）、課程（Tab 2）、事工（Tab 3），提供視覺化的組織架構查看與管理介面。

## 核心功能
- **Tab 1: 牧區/小組**
  - Tree View 顯示階層關係
  - 待分類池（Pending Pool）
  - 拖拉成員至小組
- **Tab 2: 課程**
  - 顯示功能性群組（課程班級）
  - 前往課程管理按鈕
- **Tab 3: 事工**
  - 顯示功能性群組（事工團隊）
  - 前往事工管理按鈕（預留）

## 依賴項
- ✅ ST001: 資料核心與 Schema 定義
- ✅ ST002: RBAC Configuration
- ✅ ST006: 牧區與小組管理

## 相關模組
- 組織架構模組
- RBAC 權限檢查（org:view, org:manage）
