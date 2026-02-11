# ST015 - 課程模板管理 (Course Template Management)

**Priority**: Should Have  
**Phase**: 6 - 課程管理模組

## 簡述
實作課程模板的 CRUD 功能，定義課綱（如 S101, M200）、擋修條件、課程大綱、以及課程分類。

## 核心功能
- 課程模板 CRUD
- 課程代碼（唯一值）
- 課程大綱（Syllabus）
- 擋修條件（Pre-requisites）
- 課程分類（神學、門徒培育、宣教）
- 課程狀態（Active/Inactive）

## 依賴項
- ✅ ST001: 資料核心與 Schema 定義
- ✅ ST002: RBAC Configuration

## 相關模組
- 課程管理模組
- RBAC 權限檢查（course:manage）
