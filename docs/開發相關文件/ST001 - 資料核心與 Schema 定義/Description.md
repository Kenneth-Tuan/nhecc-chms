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

    - **權限與角色 (RBAC - ST-002)**：
      - `role_ids` (String Array, 預設 []): 該會員擁有的角色 ID 列表 (支援多重角色)。
      - `functional_group_ids` (String Array, 預設 []): 該會員參與的功能性群組 ID (如課程 ID、事工 ID)，用於矩陣式組織管理。

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
