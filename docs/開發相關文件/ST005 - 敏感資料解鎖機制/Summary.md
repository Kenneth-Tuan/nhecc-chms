# ST005 - 敏感資料解鎖機制 (Sensitive Data Reveal)

**Priority**: Must Have (Security Feature)  
**Phase**: 2 - 核心 CRUD 功能

## 簡述
實作敏感資料（手機、Email、Line ID、地址、緊急聯絡人）的解鎖查看機制，包含權限檢查、審計日誌記錄、以及前端眼睛 icon 互動。

## 核心功能
- 敏感欄位遮罩顯示（5 種格式）
- 眼睛 icon 解鎖互動
- Reveal API（單一欄位解鎖）
- 審計日誌記錄（誰、何時、查看了誰的哪個欄位）
- 批次解鎖（Quick View Modal 一次解鎖所有欄位）

## 依賴項
- ✅ ST001: 資料核心與 Schema 定義
- ✅ ST002: RBAC Configuration（Z 軸 revealAuthority）
- ✅ ST003: 會友資料列表

## 相關模組
- RBAC 權限檢查（revealAuthority）
- 審計與安全模組
