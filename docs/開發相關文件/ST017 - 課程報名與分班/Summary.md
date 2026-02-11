# ST017 - 課程報名與分班 (Course Enrollment & Class Assignment)

**Priority**: Should Have  
**Phase**: 6 - 課程管理模組

## 簡述
實作課程報名功能，監控報名人數、處理候補（Waitlist）、分班作業、以及自動更新學員的 functionalGroupIds。

## 核心功能
- 課程報名介面（學員選課）
- 報名審核（自動/手動）
- 候補機制（Waitlist）
- 分班作業（管理員手動分配）
- 學員 functionalGroupIds 自動更新
- 報名人數統計
- 檢查擋修條件（Pre-requisites）

## 依賴項
- ✅ ST001: 資料核心與 Schema 定義
- ✅ ST002: RBAC Configuration
- ✅ ST015: 課程模板管理
- ✅ ST016: 開課與排程

## 相關模組
- 課程管理模組
- RBAC 權限檢查（course:manage, course:view）
