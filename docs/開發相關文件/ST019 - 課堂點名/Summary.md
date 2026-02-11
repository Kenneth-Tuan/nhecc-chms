# ST019 - 課堂點名 (Class Attendance)

**Priority**: Should Have  
**Phase**: 6 - 課程管理模組

## 簡述
實作課堂點名功能，老師可針對單堂課程進行學員出席紀錄，支援手機/平板操作，並自動計算出席率。

## 核心功能
- 課堂點名介面（勾選/快速滑動）
- 出席狀態（出席、缺席、請假、遲到、早退）
- 手機/平板友善設計
- 出席率自動計算
- 歷史點名記錄查看
- 匯出點名表

## 依賴項
- ✅ ST001: 資料核心與 Schema 定義
- ✅ ST002: RBAC Configuration
- ✅ ST018: 我的教學課程

## 相關模組
- 課程管理模組
- RBAC 權限檢查（course:manage, Scope: Group）
