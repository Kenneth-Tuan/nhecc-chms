Story 2: 角色權限矩陣配置 (RBAC Configuration)

ID: ST-002
Priority: Must Have (Core Architecture)

As a 系統管理員 (Super Admin),
I want to 在後台新增或編輯「角色 (Role)」並設定其 XYZ 三軸權限，
So that 我可以彈性地創造出如「社青小組長」、「財務人員」等不同職責的角色，並精確控制他們能看到什麼、做什麼。

Acceptance Criteria (AC):

角色管理 (Role CRUD)：

管理員可建立新角色（輸入名稱、描述）。

系統預設角色 (System Seed)：系統初始化時需自動建立 Super Admin, Zone Leader, Group Leader, General Member 四種範本角色，且 Super Admin 不可被刪除或修改權限。

X 軸 - 功能權限設定 (Function Permission)：

UI 需提供「功能權限勾選表」，將系統功能分群。工程師需實作以下 Key：

Dashboard:View (儀表板存取)

Member:View, Member:Create, Member:Edit, Member:Delete, Member:Export (匯出是大忌，需獨立控管)

Org:Manage (組織架構調整)

System:Config (角色與系統設定)

Y 軸 - 資料範圍設定 (Data Scope)：

每個角色僅能選擇 單一 Scope 層級（避免邏輯混亂）：

Global: 全教會資料。

Zone: 僅限使用者所屬牧區 (users.zone_id = members.zone_id)。

Group: 僅限使用者所屬小組 (users.group_id = members.group_id)。

Self: 僅限本人。

Z 軸 - 隱私深度設定 (Privacy Depth - Reveal Capability)：

核心邏輯 (Masked by Default)：

所有敏感欄位 (mobile, address, emergency_contact_phone) 在 API 回傳時，預設一律為遮罩狀態 (Masked)。

Z 軸權限僅控制「使用者是否有權解鎖查看明碼」。

設定選項：

針對每個敏感欄位（或群組），提供一個 Allow Reveal (允許解鎖) 的 Checkbox。

API 行為規範：

若 Allow Reveal = True: 回傳遮罩值，並標記 can_reveal: true。前端顯示遮罩 + 眼睛 icon (可點擊)。

若 Allow Reveal = False: 回傳遮罩值，並標記 can_reveal: false。前端僅顯示遮罩 (無 icon，不可點擊)。

注意：不再支援 Hidden (完全不回傳欄位) 或 Plain (直接回傳明碼) 狀態，以統一 UI 體驗與資安標準。

多重角色邏輯 (Conflict Resolution)

若使用者被指派多個角色，權限採 「最大寬容原則 (Union/Permissive)」：

Scope: 取範圍最大者 (Global > Zone > Group)。

Function: 只要任一角色有 True，即為 True。

Depth (Reveal): 只要任一角色擁有該欄位的 Allow Reveal 權限，即視為 True。
