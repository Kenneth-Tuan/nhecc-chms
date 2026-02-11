# ST016 - 開課與排程 (Course Scheduling)

**Priority**: Should Have  
**Phase**: 6 - 課程管理模組

## 簡述
實作開課功能，建立實體班級實例（Instance），指定時間、地點、講師、以及自動產生功能性群組（Functional Group）。

## 核心功能
- 建立班級實例（選擇課程模板）
- 設定時間、地點、講師
- 自動產生 Functional Group（type: 'Functional'）
- 講師自動加入 functionalGroupIds
- 排課日曆視圖
- 班級狀態（籌備中、進行中、已結束）

## 依賴項
- ✅ ST001: 資料核心與 Schema 定義
- ✅ ST002: RBAC Configuration
- ✅ ST015: 課程模板管理

## 相關模組
- 課程管理模組
- RBAC 權限檢查（course:manage）
