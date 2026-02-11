# ST013 - 牧區戰情室 (Zone Dashboard)

**Priority**: Should Have  
**Phase**: 5 - 儀表板模組

## 簡述
實作牧區長專屬儀表板，顯示牧區總覽、小組健康狀況（紅綠燈）、待分發新人、以及異常小組警示。

## 核心功能
- 牧區總覽戰情室
- 小組健康監控（出席率紅綠燈列表）
- 待分發新人池快速入口
- 異常小組警示（長期未聚會、無小組長）
- 牧區統計（總人數、小組數、平均出席率）

## 依賴項
- ✅ ST001: 資料核心與 Schema 定義
- ✅ ST002: RBAC Configuration（Scope: Zone）
- ✅ ST003: 會友資料列表
- ✅ ST006: 牧區與小組管理

## 相關模組
- 儀表板模組
- 組織架構模組
- RBAC 權限檢查（dashboard:view, Scope: Zone）
