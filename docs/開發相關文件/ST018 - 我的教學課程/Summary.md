# ST018 - 我的教學課程 (My Teaching Courses)

**Priority**: Should Have  
**Phase**: 6 - 課程管理模組

## 簡述
實作老師專屬的教學課程列表，透過 functionalGroupIds 過濾僅顯示自己教的班級，並提供快速點名和成績管理入口。

## 核心功能
- 我的教學課程列表（Scope: Group, functionalGroupIds）
- 課程進度顯示
- 學員名單查看
- 快速點名入口
- 成績管理入口
- 課程狀態（進行中、已結束）

## 依賴項
- ✅ ST001: 資料核心與 Schema 定義
- ✅ ST002: RBAC Configuration（Scope: Group, functionalGroupIds）
- ✅ ST015: 課程模板管理
- ✅ ST016: 開課與排程
- ✅ ST017: 課程報名與分班

## 相關模組
- 課程管理模組
- RBAC 權限檢查（course:view, Scope: Group）
