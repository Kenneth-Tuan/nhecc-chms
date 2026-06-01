# Member Management Specification

## Purpose

提供系統同工檢視會友清單、搜尋與進階篩選、會友基本資料快速預覽，以及新增、編輯、刪除會友的入口網頁與功能。

## Requirements

### Requirement: Member List Display

系統 SHALL 展示會友的清單，並提供分頁、欄位格式化呈現與載入狀態回饋。

#### Scenario: 正常載入會友清單
- GIVEN 使用者成功進入會友管理頁面
- WHEN 頁面發送的 API 請求成功回傳會友資料
- THEN 系統 SHALL 呈現會友 DataTable，並以條列呈現每位會友
- AND 「會友」欄位顯示頭像、姓名、性別圖示及年齡
- AND 「聯絡資訊」欄位顯示手機號碼
- AND 「角色」欄位以 Tag 顯示會友的角色（多於一個時以 `+N` 標記並在 Hover 時以 Tooltip 顯示其餘角色）
- AND 「歸屬小組」欄位顯示對應小組，無小組時顯示黃色「待分發」Tag
- AND 「受洗」欄位顯示受洗圖示（已受洗為綠色勾選，未受洗為灰色減號）
- AND 「狀態」欄位顯示啟用狀態 Tag（啟用為綠色，停用為灰色，停權為紅色）

#### Scenario: 載入中狀態
- GIVEN 使用者進入頁面或切換分頁條件
- WHEN API 正在請求資料中
- THEN 系統 SHALL 呈現 ProgressSpinner 載入動畫並顯示「載入中...」提示

#### Scenario: 載入失敗狀態
- GIVEN 使用者進入頁面
- WHEN API 請求發生錯誤
- THEN 系統 SHALL 顯示紅色錯誤訊息區塊
- AND 提供「重試」按鈕以供使用者手動重新載入

#### Scenario: 無會友資料時的空狀態
- GIVEN 使用者進入頁面或進行條件篩選
- WHEN API 回傳無符合之會友資料
- THEN 系統 SHALL 顯示「沒有找到會友資料」的提示訊息，並建議使用者調整篩選條件

#### Scenario: 分頁與每頁筆數切換
- GIVEN 系統已呈現會友清單
- WHEN 使用者點擊分頁器（Paginator）切換頁碼，或切換每頁筆數下拉選單（10, 20, 50, 100 筆）
- THEN 系統 SHALL 根據新的分頁參數發送 API 請求並更新資料清單

---

### Requirement: Search and Filter Members

系統 SHALL 提供以關鍵字搜尋及多維度條件（會籍狀態、受洗狀態、牧區、小組）進行篩選的功能。

#### Scenario: 關鍵字搜尋會友
- GIVEN 使用者已進入會友清單頁面
- WHEN 使用者選擇搜尋欄位（姓名或手機），輸入關鍵字並按下 Enter 鍵或點擊「搜尋」按鈕
- THEN 系統 SHALL 發送關鍵字搜尋請求並刷新清單
- AND 顯示搜尋結果筆數提示（例如「找到 N 筆符合『關鍵字』的資料」）
- AND 搜尋框旁出現「清除」按鈕，點擊後清除關鍵字並重新載入

#### Scenario: 依狀態篩選會友
- GIVEN 使用者已進入會友清單頁面
- WHEN 使用者切換會籍狀態（全部、啟用、停用、停權）或受洗狀態（全部、已受洗、未受洗）篩選器
- THEN 系統 SHALL 立即應用該篩選條件，重新載入並顯示篩選後的會友清單

#### Scenario: 依牧區與小組級聯篩選
- GIVEN 使用者已進入會友清單頁面且 orgStructure 組織架構載入成功
- WHEN 使用者選擇特定「牧區」
- THEN 系統 SHALL 自動過濾並顯示該牧區對應的「小組」下拉選單選項
- WHEN 使用者進一步選擇「小組」（全部小組、待分發或特定小組）
- THEN 系統 SHALL 重新整理清單，僅顯示符合該牧區與小組條件的會友

#### Scenario: 重設所有篩選條件
- GIVEN 使用者已設定部分搜尋或篩選條件
- WHEN 使用者點擊「重設」按鈕
- THEN 系統 SHALL 將所有篩選條件（關鍵字、狀態、牧區、小組）還原為預設值，並重新載入完整清單

---

### Requirement: Quick View Details

系統 SHALL 提供會友詳情快速預覽彈窗。

#### Scenario: 觸發快速預覽彈窗
- GIVEN 系統已呈現會友清單
- WHEN 使用者點擊清單中的任一列會友 Row
- THEN 系統 SHALL 顯示 MemberQuickViewModal 彈窗
- AND 發送 `/api/members/${uuid}` 請求獲取該會友詳情
- AND 載入期間於彈窗中呈現載入中狀態

#### Scenario: 快速預覽載入失敗
- GIVEN 使用者點擊會友列發送詳情請求
- WHEN API 請求詳情失敗
- THEN 系統 SHALL 關閉彈窗
- AND 彈出「載入會友詳情失敗」的 Toast 錯誤提示

---

### Requirement: Member Creation and Editing Navigation

系統 SHALL 根據使用者權限提供新增與編輯會友的導向功能。

#### Scenario: 擁有新增權限者可見新增按鈕
- GIVEN 當前登入使用者擁有 `create:Member` 權限
- WHEN 頁面渲染時
- THEN 系統 SHALL 顯示「新增會友」按鈕，點擊後導向 `/dashboard/members/create`

#### Scenario: 擁有編輯權限者可進行編輯
- GIVEN 當前登入使用者擁有 `update:Member` 權限
- WHEN 系統渲染資料列時
- THEN 清單操作欄位 SHALL 顯示編輯按鈕，點擊後導向 `/dashboard/members/edit/${uuid}`

---

### Requirement: Member Deletion

系統 SHALL 提供會友刪除功能，並包含二次確認防呆機制。

#### Scenario: 觸發刪除確認與執行
- GIVEN 當前登入使用者擁有 `delete:Member` 權限，且該列會友非使用者本人
- WHEN 使用者點擊該會友列操作欄位的刪除按鈕
- THEN 系統 SHALL 彈出 MemberDeleteDialog 確認視窗，要求輸入確認
- WHEN 使用者在對話框中確認刪除且後端 API 回傳成功
- THEN 系統 SHALL 關閉確認視窗，顯示刪除成功提示，並自動重新載入會友清單
