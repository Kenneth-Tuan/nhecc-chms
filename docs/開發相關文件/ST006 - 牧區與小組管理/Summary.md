# ST006 - 牧區與小組管理 (Zone & Group Management)

**ID**: ST-006  
**Priority**: Must Have (Core Feature)  
**Phase**: 3 - 組織架構管理  
**Status**: 🔲 規劃中

## 簡述
實作牧區（Zone）與小組（Group）的完整 CRUD 功能，包含 Leader 指派、狀態管理、階層關係維護、以及刪除前檢查機制。

## 核心功能
- **牧區管理**: 新增、編輯、刪除、啟用/停用牧區
- **小組管理**: 新增、編輯、刪除、啟用/停用小組（需指定所屬牧區）
- **Leader 指派**: 指派牧區長與小組長，自動更新 leaderName 快取
- **階層關係維護**: 驗證牧區與小組的連動關係
- **刪除前檢查**: 檢查牧區下是否有啟用的小組或會友
- **統計資訊**: 動態計算成員數量、小組數量
- **角色自動指派提示**: 指派 Leader 時自動檢查角色並提示是否指派

## 關鍵 AC
- 牧區名稱必須唯一（不區分大小寫）
- 小組名稱在同一牧區內必須唯一
- 刪除牧區前檢查是否有啟用的小組（若有則禁止刪除）
- 刪除牧區/小組前檢查是否有會友（若有則顯示警告）
- 小組長必須是該牧區的會友（Pastoral 小組限制）
- 支援 Functional 小組類型（課程、事工群組）

## 依賴項
- ✅ **ST001**: 資料核心與 Schema 定義 (members, zones, groups collections)
- ✅ **ST002**: RBAC Configuration (org:view, org:manage 權限)

## 相關 Stories
- **ST007**: 組織架構三 Tab 介面（使用此 Story 的 API）
- **ST008**: 成員調度與待處理池（使用此 Story 的資料）

## 文件
- [詳細需求](./Description.md)
- [技術設計](./Technical%20Design.md)
- [問題與澄清](./Questions.md)
