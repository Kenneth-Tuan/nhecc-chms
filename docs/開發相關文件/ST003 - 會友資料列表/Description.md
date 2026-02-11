Story 3: 會友列表檢視與 Scope 過濾 (Member List View)

ID: ST-003
Priority: Must Have (Core Feature)

As a 牧區長或小組長,
I want to 在瀏覽會友列表時，系統能自動過濾出我管轄範圍內的成員，並提供搜尋與排序功能，
So that 我能快速找到目標對象進行牧養，且不會越權看到其他牧區的資料。

Acceptance Criteria (AC):

Scope 自動過濾 (Auto-Scoping Logic)：

後端 API 必須根據 Request User 的 Role Scope (Y 軸) 強制加入查詢條件 (WHERE Clause)，前端無法繞過：

Global: 回傳所有 Active/Inactive 會友。

Zone: 強制加入 WHERE zone_id = {user.zone_id}。

Group: 強制加入 WHERE group_id = {user.group_id}。

多重角色處理：若使用者同時擁有 Zone Leader (Zone A) 與 Group Leader (Group B) 角色，查詢結果應為兩者的聯集 (Union)。

列表欄位呈現 (Columns & Rendering)：

基本資訊：

Avatar: 頭像 (若無則顯示預設圖)。

Name: 姓名。

Gender: 性別 (可使用 Icon 呈現)。

Age: 系統自動計算 (Current Date - DOB)，不顯示具體出生年月日。

組織資訊：

Group: 顯示所屬小組名稱 (若為 Pending 則顯示 "待分發")。

敏感資訊 (依循 ST-002 Z 軸規範)：

Mobile: 一律顯示遮罩格式 (如 09**-\***-\*\*8)。列表頁不提供「點擊解鎖」功能 (避免在列表中大量觸發 Audit Log，解鎖需進入詳情頁或點擊單獨的 Quick View Modal)。

狀態標籤 (Status Badge)：

依據 status 顯示不同顏色標籤 (Active=Green, Inactive=Grey, Suspended=Red)。

搜尋與篩選 (Search & Filter)：

關鍵字搜尋：

支援欄位：full_name (模糊搜尋)、mobile (支援搜尋末三碼或完整號碼，即使列表顯示遮罩，後端仍需支援搜尋)。

Scope 限制：搜尋結果必須限制在使用者的 Scope 內 (例如：小組長搜尋 "David"，只能搜出自己組內的 David)。

進階篩選 (Advanced Filter)：

Status: 篩選 Active / Inactive。

Group: 僅針對 Scope >= Zone 的使用者，提供下拉選單篩選其管轄下的小組 (Cascade Dropdown)。

分頁與排序 (Pagination & Sorting)：

Server-side Pagination：預設每頁顯示 20 筆，API 需回傳 total_count、current_page、total_pages。

預設排序：依 created_at (加入時間) 降序排列 (新進人員在最上面)。

欄位排序：支援點擊表頭依 Age 或 Name 進行排序。

操作區塊 (Action Column)：

列表最右側提供「更多 (...)」按鈕。

依據 ST-002 X 軸 (Function) 權限動態顯示選項：

若無 Member:Edit 權限，則不顯示「編輯」按鈕。

若無 Member:Delete 權限，則不顯示「刪除」按鈕。

所有人都應有「查看詳情 (View Detail)」按鈕。

快速預覽視窗 (Quick View Modal) [新增]：

觸發方式：點擊列表的「查看詳情」或整行 (Row click)，彈出 Modal。

預設狀態 (Masked by Default)：

Modal 開啟時，敏感資料（手機、緊急聯絡人）必須維持遮罩狀態（如 09**-\***-\*\*8），不可自動轉為明碼。

原因：避免「誤開」導致系統產生無意義的稽核紀錄 (Audit Log Spam)，並防止背後偷窺 (Shoulder Surfing)。

解鎖互動 (Reveal Interaction)：

若使用者擁有 can_reveal 權限，敏感欄位旁需顯示「眼睛 icon」。

使用者需主動點擊 icon，前端才呼叫 Reveal API 取得明碼，並觸發後端稽核紀錄。

便利性優化 (Optional)：

可在 Modal 頂部提供一個「顯示所有敏感資料」按鈕（僅對有權限者顯示），點擊後一次性解鎖該 Modal 內所有欄位並記錄 Log，以減少多次點擊的麻煩。
