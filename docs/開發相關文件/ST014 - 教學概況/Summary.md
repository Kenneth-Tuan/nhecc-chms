# ST014 - 教學概況 (Teacher Dashboard)

**Priority**: Should Have  
**Phase**: 5 - 儀表板模組

## 簡述
實作老師專屬儀表板，顯示進行中的課程、下堂課時間、未完成點名提示、以及學員出席統計。

## 核心功能
- 進行中課程卡片
- 下堂課時間提醒
- 未完成點名提示（紅色警示）
- 學員出席統計
- 快速點名入口
- 我的教學課程列表

## 依賴項
- ✅ ST001: 資料核心與 Schema 定義
- ✅ ST002: RBAC Configuration（Scope: Group, functionalGroupIds）
- 🔲 ST015+: 課程管理模組（部分功能需課程模組完成）

## 相關模組
- 儀表板模組
- 課程管理模組
- RBAC 權限檢查（dashboard:view, course:view）
