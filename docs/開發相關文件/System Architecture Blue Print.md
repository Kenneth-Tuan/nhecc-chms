# ⛪ 教會管理系統 - 系統架構藍圖

**System Architecture & Feature Hierarchy**  
**Version**: 2.0  
**Last Updated**: 2026-02-11  
**Based on**: ST001 & ST002 Technical Design

本系統核心邏輯分為 **「教務行政 (Admin)」** 與 **「牧養現場 (Pastoral)」** 兩大支柱，並透過 **矩陣式組織架構** 支援跨牧區的功能性群組管理（如課程班級、事工團隊）。

---

## Part 1: 功能模組總覽

### 1. 儀表板與首頁模組 (Dashboard & Home)

這是所有角色的進入點，依據身分動態渲染不同內容。

| **功能項目**     | **邏輯描述**                                                    | **適用角色**                 |
| ---------------- | --------------------------------------------------------------- | ---------------------------- |
| **全域戰情室**   | 顯示全教會 KPI（人數、奉獻、趨勢）、待辦事項警示（紅/橘卡片）。 | `Super Admin`, `Zone Leader` |
| **牧區戰情室**   | 顯示特定牧區的出席率、異常小組警示、待分發新人。                | `Zone Leader`                |
| **小組長儀表板** | 顯示組員修課狀況、需優先關懷名單、下一次聚會提醒。              | `Group Leader`               |
| **教學概況**     | 顯示進行中的課程、下堂課時間、未完成點名提示。                  | `Teacher`                    |
| **雙重身分整合** | 在管理員首頁插入「我的牧養小組」Widget，提供快速切換入口。      | `Admin + Leader`             |

---

### 2. 人員與組織模組 (People & Organization)

管理「人」以及「人與人的關係」。

| **功能層級**   | **功能項目**          | **詳細邏輯**                                                               | **權限角色**           |
| -------------- | --------------------- | -------------------------------------------------------------------------- | ---------------------- |
| **會友資料庫** | **會友列表 (CRUD)**   | 搜尋、篩選、新增、編輯、停權/封存 (軟刪除)。                               | `Admin`                |
|                | **進階篩選**          | 依受洗狀態、牧區、角色、標籤進行過濾。                                     | `Admin`                |
|                | **資料匯出/入**       | Excel 批次匯入或匯出報表。                                                 | `Admin`                |
|                | **敏感資料遮罩**      | 手機、Email、Line ID、地址、緊急聯絡人預設遮罩，需權限解鎖查看。           | 依角色而定             |
| **組織架構**   | **牧區/小組管理**     | 視覺化 Tree View，管理牧區與小組的階層關係（Tab 1）。                      | `Admin`                |
|                | **課程群組管理**      | 查看課程班級的功能性群組架構（Tab 2），實際管理由課程模組負責。            | `Admin`, `Teacher`     |
|                | **事工群組管理**      | 查看事工團隊的功能性群組架構（Tab 3），實際管理由事工模組負責。            | `Admin`                |
|                | **成員調度**          | 拖拉 (Drag & Drop) 成員至不同小組或牧區。                                  | `Admin`, `Zone Leader` |
|                | **待處理池**          | 管理「已註冊但未歸屬小組」的游離會友。                                     | `Admin`, `Zone Leader` |
| **小組增員**   | **主動搜尋 (Pull)**   | 小組長可搜尋「無組別」會友並直接拉入小組。                                 | `Group Leader`         |
|                | **邀請連結 (Invite)** | 產生小組專屬 QR Code/連結，新人註冊即自動入組。                            | `Group Leader`         |
| **角色管理**   | **角色 CRUD**         | 建立、編輯、刪除角色（系統角色受保護）。                                   | `Admin`                |
|                | **權限設定**          | 設定角色的 XYZ 三軸權限（功能、範圍、解鎖）。                              | `Admin`                |
|                | **角色指派**          | 為會友指派一個或多個角色（支援多重角色）。                                 | `Admin`                |

**重要更新 (ST001/ST002)**：
- 會友資料新增 `roleIds: string[]` 支援多重角色
- 會友資料新增 `functionalGroupIds: string[]` 支援矩陣式組織（課程、事工）
- 小組資料新增 `type: 'Pastoral' | 'Functional'` 區分牧養小組與功能小組
- 敏感資料（mobile, email, lineId, address, emergencyContact）預設遮罩，格式如 `092*-3**-6**`

---

### 3. 教育與課程模組 (Education & Courses)

管理「課程週期」與「教學執行」。

| **功能層級** | **功能項目**     | **詳細邏輯**                                                               | **權限角色**   |
| ------------ | ---------------- | -------------------------------------------------------------------------- | -------------- |
| **課程規劃** | **課程模板管理** | 定義課綱 (S101, M200)、擋修條件 (Pre-requisites)。                         | `Admin`        |
|              | **開課與排程**   | 建立實體班級實例 (Instance)，指定時間、地點、講師。                        | `Admin`        |
|              | **報名與分班**   | 監控報名人數、處理候補 (Waitlist)、分班作業。                              | `Admin`        |
| **教學執行** | **我的教學課程** | 老師專屬列表，僅顯示自己教的班級（透過 `functionalGroupIds` 過濾）。        | `Teacher`      |
|              | **課堂點名**     | 針對單堂課程進行學員出席紀錄。                                             | `Teacher`      |
|              | **成績與結業**   | 輸入分數、評語，標記是否通過 (Pass/Fail)。                                 | `Teacher`      |
| **修課監控** | **修課紀錄查詢** | 在會友詳情中查看歷史修課與成績。                                           | `Admin`, `Leader` (僅組員) |

**重要更新 (ST002)**：
- 課程班級建立時自動產生 `Functional` 類型的 Group
- 老師透過 `functionalGroupIds` 管理跨牧區的學員（矩陣式組織）

---

### 4. 牧養與關懷模組 (Shepherding)（not MVP scope）

這是小組長與區長的核心工作區，強調「質化紀錄」。

| **功能層級** | **功能項目**     | **詳細邏輯**                                     | **權限角色**                 |
| ------------ | ---------------- | ------------------------------------------------ | ---------------------------- |
| **小組管理** | **我的小組名單** | 查看組員聯繫方式、撥打電話、Line 連結。          | `Group Leader`               |
|              | **組員詳情**     | 編輯組員基本資料 (有限度)、查看修課狀態。        | `Group Leader`               |
| **聚會紀錄** | **每週聚會點名** | 紀錄出席、缺席、請假、新人、奉獻金額。           | `Group Leader`               |
|              | **聚會內容紀錄** | 填寫聚會主題、氣氛量表 (1-5 星)。                | `Group Leader`               |
| **牧養筆記** | **私密筆記**     | 撰寫對組員的關懷紀錄 (僅上層可見)。              | `Leader`, `Zone`, `Pastor`   |
| **牧區監督** | **小組健康監控** | 查看旗下各小組的出席率紅綠燈、聚會紀錄繳交狀況。 | `Zone Pastor`, `Zone Leader` |

---

### 5. 系統與權限模組 (System & Settings)

定義系統規則與安全性。

| **功能項目**               | **詳細邏輯**                                                         | **適用角色** |
| -------------------------- | -------------------------------------------------------------------- | ------------ |
| **角色管理 (RBAC)**        | 定義角色並設定 XYZ 三軸權限（功能/範圍/解鎖）。                      | `Admin`      |
| **系統角色保護**           | Super Admin 等系統角色不可刪除或修改核心權限。                       | `System`     |
| **權限上下文快取**         | UserContext 快取 5 分鐘，減少重複計算。                              | `System`     |
| **帳號安全**               | 重設密碼 (發送連結/手動設定)、強制登出。                             | `Admin`      |
| **講師資格標記**           | 在會友資料中標記是否具備教學資格 (連動開課搜尋)。                    | `Admin`      |
| **敏感資料解鎖審計**       | 記錄所有解鎖敏感資料的操作（誰、何時、查看了誰的資料）。             | `System`     |

---

## Part 2: 資料架構設計

### 2.1 核心資料表 Schema

#### Collection: `members` (會友資料)

```typescript
interface Member {
  // 系統識別
  uuid: string;                    // PK
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
  updatedBy?: string;

  // 基本資料
  fullName: string;                // 姓名 (必填)
  gender: 'Male' | 'Female';       // 生理性別 (必填)
  dob: Date;                       // 出生年月日 (必填)
  
  // 敏感個資 ⚠️ (預設遮罩)
  email: string;                   // Email (必填)
  mobile: string;                  // 手機號碼 (必填, 唯一值)
  address?: string;                // 居住地址 (選填)
  lineId?: string;                 // Line ID (選填)
  
  // 緊急聯絡人
  emergencyContactName: string;          // 緊急聯絡人姓名 (必填)
  emergencyContactRelationship: string;  // 關係 (必填)
  emergencyContactPhone: string;         // 緊急聯絡人電話 (必填) ⚠️

  // 教會資訊
  baptismStatus: boolean;          // 是否受洗 (預設 false)
  baptismDate?: Date | null;       // 受洗日 (Nullable)
  status: 'Active' | 'Inactive' | 'Suspended';  // 會籍狀態
  zoneId?: string | null;          // 所屬牧區 ID (FK, Nullable)
  groupId?: string | null;         // 所屬小組 ID (FK, Nullable)
  pastCourses?: string[];          // 已上過的福音課程

  // 🆕 RBAC & 矩陣式組織 (ST002 新增)
  roleIds: string[];               // 角色 ID 列表 (支援多重角色)
  functionalGroupIds: string[];    // 功能性群組 ID (如課程班級、事工團隊)

  // Avatar
  avatar?: string;
}
```

#### Collection: `groups` (小組與功能性群組)

```typescript
interface Group {
  id: string;                      // PK
  name: string;                    // 小組/群組名稱
  
  // 🆕 群組類型 (ST002 新增)
  type: 'Pastoral' | 'Functional'; // 'Pastoral': 牧養小組, 'Functional': 課程/事工
  
  leaderId?: string;               // 負責人 ID
  leaderName?: string;             // 負責人姓名 (快取)
  parentZoneId?: string;           // 所屬牧區 ID (僅 Pastoral 需要)
  
  status: 'Active' | 'Inactive';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Collection: `zones` (牧區)

```typescript
interface Zone {
  id: string;                      // PK
  name: string;                    // 牧區名稱
  leaderId?: string;               // 牧區長 UUID
  leaderName?: string;             // 牧區長姓名 (快取)
  status: 'Active' | 'Inactive';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Collection: `roles` (角色定義)

```typescript
interface Role {
  id: string;                      // PK
  name: string;                    // 顯示名稱 (Unique)
  description?: string;            // 描述
  isSystem: boolean;               // 系統角色標記 (True: 禁止刪除/改名)
  
  // X 軸: 功能權限
  permissions: Record<PermissionKey, boolean>;
  
  // Y 軸: 資料範圍
  scope: 'Global' | 'Zone' | 'Group' | 'Self';
  
  // Z 軸: 解鎖權限
  revealAuthority: {
    mobile: boolean;
    email: boolean;
    lineId: boolean;
    address: boolean;
    emergencyContact: boolean;
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
}
```

### 2.2 敏感資料遮罩機制

所有敏感欄位在 API 回傳時預設遮罩，僅當使用者角色有 `revealAuthority` 權限時，才顯示「眼睛 icon」允許解鎖查看。

| **欄位**                  | **遮罩格式範例**                  | **說明**                           |
| ------------------------- | --------------------------------- | ---------------------------------- |
| `mobile`                  | `092*-3**-6**`                    | 保留前 3 碼第一位、第 2 段第一位、第 3 段第一位 |
| `email`                   | `pe***@example.com`               | 保留前 2 字元和 domain             |
| `lineId`                  | `pe***_123`                       | 保留前 2 字元和最後 3 字元         |
| `address`                 | `台北市內湖區***`                 | 保留前 10 字元                     |
| `emergencyContactPhone`   | `092*-1**-4**`                    | 同 mobile                          |

**API Response 格式：**
```json
{
  "mobile": "092*-3**-6**",
  "mobileCanReveal": true,  // 前端顯示眼睛 icon
  "email": "pe***@example.com",
  "emailCanReveal": false   // 前端不顯示 icon
}
```

### 2.3 組織架構設計

#### 組織架構管理頁面 (3 個 Tab)

**Tab 1: 牧區/小組 (Pastoral Groups)**
- 左側：Tree View 顯示牧區 → 小組的階層關係
- 右側：待分類池（尚未分配到小組的會友）
- 功能：拖拉成員至不同小組、編輯牧區/小組資訊

**Tab 2: 課程 (Functional Groups - Courses)**
- 顯示所有課程班級的功能性群組
- 僅供查看，實際管理由「課程管理模組」負責
- 提供「前往課程管理」按鈕（需 `course:manage` 權限）

**Tab 3: 事工 (Functional Groups - Ministries)**
- 顯示所有事工團隊的功能性群組（如敬拜團、招待組）
- 僅供查看，實際管理由「事工管理模組」負責（後續開發）
- 提供「前往事工管理」按鈕

#### 矩陣式組織實作

透過 `functionalGroupIds` 實現跨牧區管理：

**範例：老師管理課程學員**
1. 老師 A 被指派為 S101 班級的 Leader
2. S101 班級建立時產生 `Group { id: 'course_s101', type: 'Functional', leaderId: 'teacher_a' }`
3. 學員 B 註冊課程時，`functionalGroupIds` 加入 `'course_s101'`
4. 老師 A 查詢學員列表時，API 過濾 `WHERE 'course_s101' IN functionalGroupIds`

---

## Part 3: RBAC 權限架構

### 3.1 核心設計哲學 (Design Philosophy)

本系統採用 **XYZ 三軸矩陣** 的權限控制模型，將「功能」、「範圍」、「解鎖」解耦。

- **X 軸 - 功能權限 (Function Permissions):** 使用者「可以執行什麼動作？」
- **Y 軸 - 資料範圍 (Data Scope):** 使用者「可以看到哪些資料？」
- **Z 軸 - 解鎖權限 (Reveal Authority):** 使用者「可以解鎖哪些敏感欄位？」

### 3.2 Y 軸 - 資料範圍 (Data Scope)

**4 種 Scope 定義：**

| **代碼 (Code)** | **名稱 (Name)**  | **邏輯定義 (Logic)**                                                       | **典型應用角色**             |
| --------------- | ---------------- | -------------------------------------------------------------------------- | ---------------------------- |
| `Global`        | **全教會資料**   | 無過濾條件。可存取系統內所有資料。                                         | 超級管理員、主任牧師         |
| `Zone`          | **僅限所屬牧區** | `WHERE zoneId = currentUser.zoneId`。包含該牧區下所有小組與成員。         | 牧區長、牧區秘書             |
| `Group`         | **僅限所屬/管理的群組** | `WHERE groupId IN managedGroupIds`。包含牧養小組 + 功能性群組（課程、事工）。 | 小組長、老師、事工負責人     |
| `Self`          | **僅限本人**     | `WHERE uuid = currentUser.uuid`。                                          | 一般會友                     |

**重要更新**：
- ❌ **移除 `ASSIGNED` Scope**（舊版藍圖有，已廢棄）
- ✅ **`Group` Scope 具有多態性**：透過 `functionalGroupIds` 同時管理牧養小組和功能性群組

### 3.3 X 軸 - 功能權限 (Function Permissions)

**13 種權限 Key 定義：**

| **Permission Key**      | **說明**                  | **模組**     |
| ----------------------- | ------------------------- | ------------ |
| `dashboard:view`        | 檢視儀表板                | 儀表板       |
| `dashboard:export`      | 匯出數據報表              | 儀表板       |
| `member:view`           | 查看會友列表              | 人員管理     |
| `member:create`         | 新增會友                  | 人員管理     |
| `member:edit`           | 編輯會友資料              | 人員管理     |
| `member:delete`         | 刪除會友                  | 人員管理     |
| `member:export`         | 匯出會友名單 (Excel)      | 人員管理     |
| `org:view`              | 查看組織架構              | 組織架構     |
| `org:manage`            | 管理組織架構（新增/編輯） | 組織架構     |
| `system:config`         | 角色與系統設定            | 系統設定     |
| `course:view`           | 查看課程                  | 課程管理     |
| `course:manage`         | 管理課程內容              | 課程管理     |
| `course:grade`          | 評分與結課                | 課程管理     |

### 3.4 Z 軸 - 解鎖權限 (Reveal Authority)

**5 種敏感欄位的解鎖權限：**

| **Reveal Key**      | **對應欄位**                                                         |
| ------------------- | -------------------------------------------------------------------- |
| `mobile`            | `member.mobile`                                                      |
| `email`             | `member.email`                                                       |
| `lineId`            | `member.lineId`                                                      |
| `address`           | `member.address`                                                     |
| `emergencyContact`  | `member.emergencyContactName`, `emergencyContactRelationship`, `emergencyContactPhone` |

**運作邏輯**：
- **預設**: 所有敏感欄位回傳遮罩值
- **canReveal = true**: 前端顯示「眼睛 icon」，點擊後呼叫 `/api/members/:id/reveal/:field` 取得明碼
- **canReveal = false**: 前端不顯示 icon，永遠顯示遮罩

### 3.5 預設角色權限矩陣

| **角色 ID**       | **角色名稱** | **Scope** | **關鍵權限 (X 軸)**                                                | **解鎖權限 (Z 軸)** |
| ----------------- | ------------ | --------- | ------------------------------------------------------------------ | ------------------- |
| `super_admin`     | 超級管理員   | `Global`  | 🟢 所有權限全開                                                     | 🟢 全部可解鎖       |
| `zone_leader`     | 牧區長       | `Zone`    | ✅ member:view/edit/export<br>✅ org:view/manage<br>❌ system:config | 🟢 全部可解鎖       |
| `group_leader`    | 小組長       | `Group`   | ✅ member:view/edit<br>✅ org:view<br>❌ member:delete/export       | ⚠️ 僅 mobile        |
| `teacher`         | 課程老師     | `Group`   | ✅ course:view/manage/grade<br>✅ member:view<br>❌ member:edit     | ⚠️ 僅 mobile        |
| `general`         | 一般會友     | `Self`    | ❌ 所有權限關閉（僅能查看自己資料）                                 | ❌ 無               |

**系統角色保護**：
- 5 種預設角色設定 `isSystem: true`
- 不可刪除、不可修改 `name` 和 `isSystem` 欄位
- 刪除角色前檢查是否有使用者正在使用

---

## Part 4: 系統實作規範

### 4.1 權限解析演算法 (Permission Resolution)

當使用者登入時，系統計算 `UserContext`（權限上下文）：

#### 演算法步驟

**Step 1: 載入使用者的所有角色**
```typescript
const member = await getMemberById(userId);
const roles = await getRolesByIds(member.roleIds);
```

**Step 2: 解析 Scope (取最大範圍)**
```typescript
const scopeHierarchy = { Global: 3, Zone: 2, Group: 1, Self: 0 };
const maxScope = roles.reduce((max, role) => 
  scopeHierarchy[role.scope] > scopeHierarchy[max] ? role.scope : max
, 'Self');
```

**Step 3: 計算 managedGroupIds（多態性處理）**

若 Scope 為 `Group`，則 `managedGroupIds` 包含：
- 使用者擔任 Leader 的所有群組（牧養 + 功能性）
- 使用者自己所屬的 `groupId` 和 `functionalGroupIds`

```typescript
if (maxScope === 'Group') {
  const ledGroups = await getGroupsByLeaderId(userId);
  managedGroupIds = ledGroups.map(g => g.id);
  
  if (member.groupId) managedGroupIds.push(member.groupId);
  if (member.functionalGroupIds) managedGroupIds.push(...member.functionalGroupIds);
  
  managedGroupIds = [...new Set(managedGroupIds)]; // 去重
}
```

**Step 4: 合併功能權限 (Union Strategy)**

任一角色有 `true`，即為 `true`。

```typescript
const mergedPermissions = {};
roles.forEach(role => {
  Object.keys(role.permissions).forEach(key => {
    mergedPermissions[key] = mergedPermissions[key] || role.permissions[key];
  });
});
```

**Step 5: 合併解鎖權限 (Union Strategy)**

任一角色有權限，即有權限。

```typescript
const mergedReveal = {};
roles.forEach(role => {
  Object.keys(role.revealAuthority).forEach(key => {
    mergedReveal[key] = mergedReveal[key] || role.revealAuthority[key];
  });
});
```

#### UserContext 結構

```typescript
interface UserContext {
  userId: string;
  isSuperAdmin: boolean;
  scope: 'Global' | 'Zone' | 'Group' | 'Self';
  managedGroupIds: string[];       // 管理的群組 ID (牧養 + 功能性)
  managedZoneId?: string;          // 管理的牧區 ID
  permissions: Record<string, boolean>;      // X 軸合併結果
  revealAuthority: Record<string, boolean>;  // Z 軸合併結果
  roleIds: string[];               // 原始角色 ID (審計用)
}
```

### 4.2 Middleware 設計

#### Middleware 執行順序

```
Request → Authentication Middleware → RBAC Middleware → API Handler
          (Token 驗證)                (權限注入)        (業務邏輯)
```

#### 4.2.1 Authentication Middleware

**`server/middleware/01.auth.ts`**

```typescript
export default defineEventHandler(async (event) => {
  // 略過公開 API
  const publicPaths = ['/api/auth/login', '/api/health'];
  if (publicPaths.some(path => event.path.startsWith(path))) {
    return;
  }

  // 從 Cookie 取得 Token
  const token = getCookie(event, 'auth_token');
  
  if (!token) {
    throw createError({ statusCode: 401, message: '未提供驗證令牌' });
  }

  try {
    const decoded = await verifyAuthToken(token);
    event.context.userId = decoded.uid;
  } catch (error) {
    throw createError({ statusCode: 401, message: '無效的驗證令牌' });
  }
});
```

#### 4.2.2 RBAC Middleware

**`server/middleware/02.rbac.ts`**

```typescript
export default defineEventHandler(async (event) => {
  const userId = event.context.userId;
  if (!userId) return;

  try {
    // 解析使用者權限上下文並注入 event.context
    const userContext = await authService.resolveUserContext(userId);
    event.context.userContext = userContext;
    
    // 快取到記憶體中（TTL: 5 分鐘）
    await cacheUserContext(userId, userContext, 300);
  } catch (error) {
    console.error('Failed to resolve user context:', error);
    throw createError({ statusCode: 500, message: '無法解析使用者權限' });
  }
});
```

#### 4.2.3 Permission Check Helper

```typescript
// server/utils/permission.ts

/**
 * 檢查使用者是否有指定權限
 */
export function hasPermission(userContext: UserContext, permission: string): boolean {
  if (userContext.isSuperAdmin) return true;
  return userContext.permissions[permission] === true;
}

/**
 * 要求使用者必須有指定權限，否則拋出 403
 */
export function requirePermission(event: H3Event, permission: string): void {
  const userContext = event.context.userContext;
  
  if (!hasPermission(userContext, permission)) {
    throw createError({
      statusCode: 403,
      message: `無權限執行此操作 (需要: ${permission})`,
    });
  }
}

/**
 * 根據 Data Scope 過濾查詢
 */
export function applyScopeFilter(
  query: FirebaseFirestore.Query,
  userContext: UserContext
): FirebaseFirestore.Query {
  if (userContext.scope === 'Global') return query;
  
  if (userContext.scope === 'Zone') {
    return query.where('zoneId', '==', userContext.managedZoneId);
  }
  
  if (userContext.scope === 'Group') {
    return query.where('groupId', 'in', userContext.managedGroupIds);
  }
  
  if (userContext.scope === 'Self') {
    return query.where('uuid', '==', userContext.userId);
  }
  
  return query.where('uuid', '==', 'never_match');
}
```

### 4.3 API 架構

#### 核心 API Endpoints

**Role Management (角色管理)**
- `GET /api/roles` - 取得角色列表
- `POST /api/roles` - 建立角色
- `GET /api/roles/:id` - 取得單一角色
- `PATCH /api/roles/:id` - 更新角色
- `DELETE /api/roles/:id` - 刪除角色

**Auth Context (權限上下文)**
- `GET /api/auth/context` - 取得使用者權限上下文（前端初始化時呼叫）

**Organization Structure (組織架構)**
- `GET /api/organization/structure?type=pastoral` - 取得牧區/小組架構
- `GET /api/organization/structure?type=functional` - 取得功能性群組架構

**Member Management (會友管理)**
- `GET /api/members` - 取得會友列表（自動套用 Scope 過濾）
- `POST /api/members` - 建立會友
- `GET /api/members/:id` - 取得單一會友（敏感欄位預設遮罩）
- `PATCH /api/members/:id` - 更新會友
- `DELETE /api/members/:id` - 刪除會友（軟刪除）
- `POST /api/members/:id/reveal/:field` - 解鎖敏感欄位（需 revealAuthority 權限）

#### API Response 範例

**GET /api/auth/context - 回應範例**
```json
{
  "userId": "member_001",
  "isSuperAdmin": false,
  "scope": "Group",
  "managedGroupIds": ["group_001", "course_s101"],
  "managedZoneId": null,
  "permissions": {
    "dashboard:view": true,
    "member:view": true,
    "member:edit": true,
    "member:create": false,
    "member:delete": false,
    "member:export": false,
    "org:view": true,
    "org:manage": false,
    "system:config": false,
    "course:view": true,
    "course:manage": false,
    "course:grade": false
  },
  "revealAuthority": {
    "mobile": true,
    "email": false,
    "lineId": false,
    "address": false,
    "emergencyContact": false
  },
  "roleIds": ["group_leader", "teacher"]
}
```

**GET /api/organization/structure - 回應範例（層級結構）**
```json
[
  {
    "zoneId": "zone_001",
    "zoneName": "林牧區",
    "zoneLeaderId": "member_leader_001",
    "zoneLeaderName": "林大衛",
    "groups": [
      {
        "groupId": "group_001",
        "groupName": "喜樂小組",
        "groupType": "Pastoral",
        "groupLeaderId": "member_leader_011",
        "groupLeaderName": "陳小明",
        "memberCount": 15
      },
      {
        "groupId": "group_002",
        "groupName": "平安小組",
        "groupType": "Pastoral",
        "groupLeaderId": "member_leader_012",
        "groupLeaderName": "李美玲",
        "memberCount": 18
      }
    ]
  }
]
```

### 4.4 UserContext 快取機制

**目的**: 避免每個 API 請求都重新計算權限

**實作**:
- 記憶體快取（Map）
- TTL: 5 分鐘
- Key: `userId`
- Value: `{ context: UserContext, expiry: number }`

**快取失效時機**:
- TTL 過期
- 使用者角色變更
- 使用者登出

---

## Part 5: 角色視野與使用者體驗

### 5.1 角色視野總結 (User Experience Recap)

這部分總結了當不同使用者登入系統時，他們的 **Sidebar (側邊欄)** 與 **首頁** 會長什麼樣子。

#### A. 系統管理員 (Super Admin) - 上帝視角

- **Sidebar:** 儀表板、課程管理、會友管理、組織架構、角色管理、系統設定。
- **首頁:** 待辦事項警示、全教會 KPI、快速操作區。
- **Scope:** `Global` - 看到所有資料

#### B. 小組長 (Group Leader) - 牧養視角

- **Sidebar:** 儀表板 (小組版)、我的小組 (名單/紀錄)、牧養筆記、個人設定。
- **首頁:** 組員修課狀態、需關懷名單、新增組員按鈕。
- **Scope:** `Group` - 僅看到自己小組的成員

#### C. 老師 (Teacher) - 任務視角

- **Sidebar:** 我的教學課程、行事曆。
- **首頁:** 下堂課卡片、未完成點名提示。
- **Scope:** `Group` - 僅看到自己教的課程學員（透過 `functionalGroupIds`）

#### D. 區長/牧師 (Zone Leader) - 管理視角

- **Sidebar:** 我的牧區 (Dashboard)、牧養筆記 (監控)。
- **首頁:** 牧區總覽戰情室 (小組紅綠燈列表)、待分發新人池。
- **Scope:** `Zone` - 看到整個牧區的資料

#### E. 雙重身分 (Admin + Leader) - 混合視角

- **Sidebar:** 分區顯示「教務行政區」與「我的牧養區」。
- **首頁:** Admin 首頁 + 插入「我的小組」Widget。
- **Scope:** `Global` (Admin 角色) + `Group` (Leader 角色) = Union 取最大

### 5.2 多重角色案例分析

#### 案例 1: 傳道人（同時是牧區長和課程老師）

**角色組合:**
- `zone_leader` (Scope: Zone)
- `teacher` (Scope: Group)

**實際效果:**
- 查看會友列表：看到整個牧區的會友（Zone Scope 較大）
- 查看課程學員：看到自己教的課程學員（透過 `functionalGroupIds`）
- 解鎖權限：可解鎖所有欄位（Zone Leader 有全部解鎖權限）

#### 案例 2: 小組長（同時是敬拜團團長）

**角色組合:**
- `group_leader` (Scope: Group, managedGroupIds: ['group_001'])
- 自訂角色 `worship_leader` (Scope: Group, managedGroupIds: ['worship_team'])

**實際效果:**
- 查看會友列表：看到小組成員 + 敬拜團成員（Union）
- 解鎖權限：僅能解鎖 mobile（小組長權限）

---

## Part 6: 部署與維護

### 6.1 Migration Checklist

- [ ] 建立 `roles` Collection 並執行 Seed Script（5 種預設角色）
- [ ] 更新 `members` Collection Schema（新增 `roleIds`, `functionalGroupIds`）
- [ ] 更新 `groups` Collection Schema（新增 `type` 欄位）
- [ ] 為現有會友指派預設角色 (`general`)
- [ ] 設定 Firestore Security Rules
- [ ] 設定 Firestore Composite Indexes
- [ ] 部署 Authentication Middleware
- [ ] 部署 RBAC Middleware
- [ ] 測試權限解析邏輯
- [ ] 更新 Member API（整合 Data Scope 過濾 + 資料遮罩）
- [ ] 部署到 Staging 環境
- [ ] UAT 測試
- [ ] 部署到 Production

### 6.2 Seed Data - 預設角色

系統初始化時需自動建立以下 5 種角色（`isSystem: true`）：

| 角色 ID         | 角色名稱     | Scope    | 說明                           |
| --------------- | ------------ | -------- | ------------------------------ |
| `super_admin`   | 超級管理員   | `Global` | 所有權限全開，不受限制         |
| `zone_leader`   | 牧區長       | `Zone`   | 管理所屬牧區的會友與小組       |
| `group_leader`  | 小組長       | `Group`  | 負責小組牧養與關懷             |
| `teacher`       | 課程老師     | `Group`  | 管理課程學員與評分（矩陣式）   |
| `general`       | 一般會友     | `Self`   | 僅能查看與編輯自己的資料       |

詳細權限設定參考 Section 3.5。

### 6.3 Mock Data（開發環境）

為了方便本地開發測試，提供以下 Mock Data：

**Mock Roles (`app/data/roles.mock.ts`)**
- 5 種系統角色 + 1 種自訂角色範例
- 包含完整的權限設定和 memberCount

**Mock Members (`app/data/members.mock.ts`)**
- 10 位會友假資料
- 包含 `roleIds` 和 `functionalGroupIds`
- 敏感資料已遮罩

**Mock Organization (`app/data/organization.mock.ts`)**
- 4 個牧區、11 個小組
- 包含牧區長、小組長資訊

**Mock API Implementation**
- 開發環境 (`NODE_ENV=development`) 自動使用 Mock Data
- 正式環境使用真實 Firebase 資料

### 6.4 Rollback Plan

若 RBAC 實作有問題：
1. **緊急關閉**: 將所有使用者的 `roleIds` 設為 `['super_admin']`（暫時全開）
2. **Middleware 旁路**: 在 `02.rbac.ts` 加入環境變數開關
3. **資料回滾**: 從備份恢復 `members` 和 `groups` Collection

---

## Part 7: 總結與設計原則

### 7.1 核心設計原則

1. **權限最小化 (Principle of Least Privilege)**: 預設給予最小權限，需要時才授予
2. **Privacy by Default**: 敏感資料預設遮罩，需明確授權才能解鎖
3. **多重角色支援**: 使用者可同時擁有多個角色，權限採 Union 策略
4. **矩陣式組織**: 透過 `functionalGroupIds` 支援跨牧區的功能性群組管理
5. **系統韌性**: 系統角色不可刪除，刪除角色前檢查使用者
6. **審計追蹤**: 記錄所有敏感操作（未來可擴充）

### 7.2 技術亮點

- **XYZ 三軸權限模型**: 功能、範圍、解鎖三軸解耦，靈活組合
- **UserContext 快取**: 5 分鐘快取，減少重複計算
- **Middleware 分層**: Authentication → RBAC → API Handler，職責清晰
- **Service Layer Pattern**: 業務邏輯與 API 分離，易於測試
- **Type Safety**: 全面使用 TypeScript，避免錯誤

### 7.3 未來擴充方向

- **動態權限**: 支援在 Runtime 新增權限項目
- **權限繼承**: 支援角色繼承（如 Zone Leader 繼承 Group Leader 權限）
- **審計日誌**: 記錄所有角色變更與權限檢查失敗
- **權限測試工具**: 提供「模擬使用者」功能
- **批次指派角色**: 支援一次將多個使用者指派給某角色

---

## 附錄: 設計決策紀錄

### 為什麼移除 `ASSIGNED` Scope？

**舊設計 (已廢棄)**:
- 使用 `ASSIGNED` Scope + `resource_assignments` 表來管理跨牧區指派
- 需要額外的 JOIN 查詢，複雜度高

**新設計 (ST002)**:
- 使用 `functionalGroupIds` 直接儲存在 Member 資料中
- `Group.type = 'Functional'` 區分功能性群組
- 查詢更簡單：`WHERE 'course_s101' IN functionalGroupIds`
- 不需要額外的表和 JOIN

### 為什麼 Z 軸改為「解鎖權限」？

**舊設計 (已廢棄)**:
- Z 軸稱為「欄位級安全性」，定義模糊

**新設計 (ST002)**:
- Z 軸稱為「解鎖權限 (Reveal Authority)」
- 明確定義 5 種敏感欄位
- 預設遮罩，需權限才能解鎖
- 前端顯示「眼睛 icon」，UX 直觀

### 為什麼採用 Union Strategy？

**原因**:
- 教會組織複雜，使用者常有多重身分（如傳道人同時是小組長和老師）
- Union Strategy 符合「最大寬容原則」，避免權限衝突
- 範例：小組長 (Scope: Group) + 課程觀察員 (Scope: Global) = 可看全教會課程但僅看自己小組的牧養筆記

---

**Document Version**: 2.0  
**Last Updated**: 2026-02-11  
**Based on**: ST001 & ST002 Technical Design  
**Status**: Final - Ready for Implementation
