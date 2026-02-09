# User Stories: 核心基礎建設 (Foundation Phase)

**Epic 範圍**：組織架構 (Organization)、權限核心 (RBAC)、會友資料管理 (Membership) **文件狀態**：Updated (v1.3 + 優化建議整合：關係欄位、分頁機制、安全逾時) **版本**：v1.4

## Story 1: 會友資料核心與 Schema 定義 (Member Core & Schema)

**ID**: ST-001 **Priority**: Must Have (Blocker)

> **As a** 行政同工, **I want to** 建立與編輯會友的詳細資料（CRUD），包含緊急聯絡人與過往課程紀錄， **So that** 系統擁有正確且完整的基礎資料，以供後續的分組與牧養使用。

**Acceptance Criteria (AC):**

1.  **資料規格定義 (Data Schema Spec)**： 工程師需依照以下規範建立資料表 (`members`)：
    - **識別與聯絡資訊**：
      - `uuid` (PK): 系統自動產生。
      - `full_name` (String, 必填): 姓名。
      - `gender` (Enum: Male/Female, 必填): 生理性別。

    - **敏感個資 (需支援加密/權限控管)**：
      - `dob` (Date, 必填): 出生年月日。
      - `email` (String, 必填): 電子郵件。
      - `address` (String, 選填): 居住地址。
      - `line_id` (String, 選填): Line ID。
      - `mobile` (String, 必填, 唯一值): 手機號碼。
      - `emergency_contact_name` (String, 必填): 緊急聯絡人姓名。
      - `emergency_contact_relationship` (Enum/String, 必填): 緊急聯絡人關係 (如: 父子, 母女, 配偶, 朋友)。
      - `emergency_contact_phone` (String, 必填): 緊急聯絡人電話 (視為敏感資料)。

    - **教會與牧養資訊**：
      - `baptism_status` (Boolean, 預設 False): 是否受洗。
      - `baptism_date` (Date, Nullable): 受洗日。
      - `status` (Enum: Active/Inactive/Suspended, 預設 Active): 會籍狀態。
      - `zone_id` (FK, Nullable): 所屬牧區 ID (若為 Null 則視為未分區)。
      - `group_id` (FK, Nullable): 所屬小組 ID (需與 zone_id 連動，若 zone_id 為空則此欄必為空)。
      - `past_courses` (String Array / JSON, 選填): 已上過的福音課程 (多選)。

2.  **建立與編輯 (Create & Edit)**：
    - 提供表單介面輸入上述資料。
    - **牧區與小組連動邏輯**：
      - 選擇 `zone_id` 後，`group_id` 的下拉選單僅能顯示該牧區下的小組。
      - 若 `zone_id` 未選，`group_id` 應鎖定無法選擇。

    - **福音課程選項**：
      - `past_courses` 的選項來源 (Options) 需預留由後台設定檔或 API 取得的彈性。

3.  **驗證與防呆**：
    - `mobile` 與 `emergency_contact_phone` 需符合台灣手機格式。
    - 系統需防止 `mobile` 重複建立。

## Story 2: 角色權限矩陣配置 (RBAC Configuration)

**ID**: ST-002 **Priority**: Must Have (Dependency)

> **As a** 系統管理員, **I want to** 定義角色的 XYZ 三軸權限（功能、範圍、深度）， **So that** 當資料建立後，系統能知道誰有權限讀取或修改這些資料。

**Acceptance Criteria (AC):**

1.  **Scope (範圍軸)**：
    - 定義資料的可見邊界：`Global` (全教會)、`Zone` (僅本牧區)、`Group` (僅本小組)、`Self` (僅本人)。
    - **連動查詢**：Scope 為 `Zone` 的角色，查詢時系統自動過濾 `WHERE zone_id = {user.zone_id}`。

2.  **Function (功能軸)**：
    - 定義操作權限：`Member:Create`, `Member:Edit`, `Member:Delete`, `Member:View_Sensitive`。

3.  **Depth (深度軸)**：
    - 針對 ST-001 定義的敏感欄位 (`mobile`, `address`, `emergency_contact_phone`) 設定預設行為：`Masked` (遮罩) 或 `Hidden` (隱藏)。

## Story 3: 會友列表檢視與 Scope 過濾 (Member List View)

**ID**: ST-003 **Priority**: Must Have

> **As a** 牧區長或小組長, **I want to** 在瀏覽會友列表時，只看到我管轄範圍內的會友， **So that** 我能專注於我的牧養對象，且不會越權看到其他牧區的資料。

**Acceptance Criteria (AC):**

1.  **資料查詢 (Query Filtering)**：
    - 後端 API 需根據 Request User 的 Role Scope 自動加入 `WHERE` 條件。
    - _案例_：牧區長發出 `GET /members` 請求時，後端強制執行 `WHERE zone_id = {current_user_zone_id}`。

2.  **列表欄位**：
    - 顯示：頭像、姓名、性別、年齡、手機 (依權限遮罩)、所屬小組、狀態。

3.  **搜尋功能**：
    - 支援對 `full_name` 與 `mobile` (末三碼) 進行模糊搜尋。搜尋結果同樣受 Scope 限制。

4.  **分頁機制 (Pagination) \[新增\]**：
    - 考量未來資料量，API 需支援 Server-side pagination (預設每頁 20 筆)。
    - 前端列表需實作無限捲動 (Infinite Scroll) 或 頁碼切換。

## Story 4: 敏感資料遮罩與點擊解鎖 (Data Masking & Reveal)

**ID**: ST-004 **Priority**: Must Have

> **As a** 小組長, **I want to** 預設看到部分遮罩的敏感資料，並在必要時點擊查看完整資訊， **So that** 我能保護會友隱私，同時在需要聯繫時取得資訊。

**Acceptance Criteria (AC):**

1.  **遮罩規則 (Masking Rules)**：
    - `mobile` & `emergency_contact_phone`: 顯示 `09**-***-**8` (保留前2後1)。
    - `address`: 顯示 `台北市******`。

2.  **權限旗標 (Flags)**：
    - API 回傳需包含 `can_reveal_{field}` 欄位。若為 True，前端在欄位旁顯示「眼睛 icon」。

3.  **解鎖與稽核 (Reveal & Audit)**：
    - 點擊眼睛 icon -> 呼叫 `GET /member/{id}/reveal/{field}`。
    - 後端紀錄 Audit Log: `{User} revealed {Field} of {Member} at {Timestamp}`。
    - 前端將該欄位更新為明碼。

4.  **安全逾時 (Auto-masking Timeout) \[新增\]**：
    - 當敏感資料解鎖後，若使用者閒置超過 60 秒或切換頁面，前端應自動將其恢復為遮罩狀態，減少「背後偷看 (Shoulder Surfing)」風險。

## Story 5: 組織架構視覺化管理 (Organization Visual Management)

**ID**: ST-005 **Priority**: Should Have (Requires ST-001 Data)

> **As a** 系統管理員或牧區長, **I want to** 在一個統一的介面管理組織樹狀圖與「待分發」的會友， **So that** 我能直觀地掌握目前組織的人數分佈。

**Acceptance Criteria (AC):**

1.  **版面配置**：
    - 左側 **Structure Tree**：渲染 牧區 (`zone_id`) > 小組 (`group_id`) 結構，並顯示 `Count(members)`。
    - 右側 **Pending Pool**：Query `WHERE group_id IS NULL` 的會友資料，以卡片呈現。

2.  **連動邏輯**：
    - 點擊左側樹狀節點，右下方列表顯示該節點成員。

3.  **CRUD 操作**：
    - 管理員可新增/修改/刪除樹狀節點 (Zone/Group)。

## Story 6: 拖曳分派與組織調動 (Drag & Drop Assignment)

**ID**: ST-006 **Priority**: Should Have

> **As a** 牧區長, **I want to** 透過拖曳的方式，將會友從「待分發區」移入小組， **So that** 我能快速完成組織人員編制。

**Acceptance Criteria (AC):**

1.  **拖曳互動 (Drag & Drop)**：
    - Source: 右上 Pending Pool 或 右下 Member List。
    - Target: 左側 Structure Tree 的特定小組節點。

2.  **後端更新**：
    - Drop 事件觸發 `PATCH /members/{id}` 更新 `zone_id` 與 `group_id`。
    - **邏輯**：若拖入某小組，需同時更新該會友的 `group_id` 與該小組所屬的 `zone_id`。

3.  **即時回饋**：
    - 成功後，UI 即時反映人數變化與列表更新。
