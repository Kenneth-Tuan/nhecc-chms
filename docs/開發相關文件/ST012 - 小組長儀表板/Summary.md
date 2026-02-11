# ST012 - 小組長儀表板 (Group Leader Dashboard)

**Priority**: Should Have  
**Phase**: 5 - 儀表板模組

## 簡述
實作小組長專屬儀表板，顯示組員修課狀況、需關懷名單、下次聚會提醒、以及新增組員快速入口。

## 核心功能
- 組員修課狀態卡片
- 需優先關懷名單（長期未聚會、生日提醒）
- 下一次聚會提醒
- 新增組員按鈕
- 小組統計（成員數、出席率）
- 我的小組 Widget

## 依賴項
- ✅ ST001: 資料核心與 Schema 定義
- ✅ ST002: RBAC Configuration（Scope: Group）
- ✅ ST003: 會友資料列表

## 相關模組
- 儀表板模組
- 牧養與關懷模組
- RBAC 權限檢查（dashboard:view, Scope: Group）
