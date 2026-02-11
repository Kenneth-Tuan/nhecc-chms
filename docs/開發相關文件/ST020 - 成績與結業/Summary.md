# ST020 - 成績與結業 (Grading & Course Completion)

**Priority**: Should Have  
**Phase**: 6 - 課程管理模組

## 簡述
實作成績管理與結業功能，老師可輸入分數、評語，標記學員是否通過（Pass/Fail），並自動更新會友的 pastCourses。

## 核心功能
- 成績輸入介面（分數、評語）
- 通過/不通過標記
- 出席率納入結業判斷
- 批次結業
- 自動更新 member.pastCourses
- 結業證書產生（預留）
- 成績查詢（學員端）

## 依賴項
- ✅ ST001: 資料核心與 Schema 定義
- ✅ ST002: RBAC Configuration
- ✅ ST018: 我的教學課程
- ✅ ST019: 課堂點名

## 相關模組
- 課程管理模組
- RBAC 權限檢查（course:grade, Scope: Group）
