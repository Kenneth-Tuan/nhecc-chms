# ST002 - Technical Design: 角色權限矩陣配置 (RBAC Configuration)

## 1. Overview

### 1.1 Story Reference
- **Story ID**: ST-002
- **Priority**: Must Have (Core Architecture)
- **User Story**: As a 系統管理員, I want to 定義角色的 XYZ 三軸權限，並支援矩陣式組織管理（如老師、敬拜團長），So that 系統能精確控制誰能讀取或修改資料。

### 1.2 Design Goals
1. **矩陣式權限支援**: 透過「功能性群組 (Functional Groups)」解決跨牧區管理（如老師管學生）的需求
2. **XYZ 三軸實作**:
   - X (Function): 功能操作權限
   - Y (Scope): 資料可見範圍（擴充支援 Functional Group）
   - Z (Reveal): 敏感資料解鎖權限 (Privacy by Default)
3. **高效能驗證**: 在 Middleware 層解析權限，減少資料庫讀取
4. **系統韌性**: 保護系統預設角色 (System Roles) 不被破壞
5. **UI/UX 友善**: 提供直觀的權限設定介面

### 1.3 Tech Stack
- **Frontend**: Nuxt 4, Vue 3.5 (Composition API), PrimeVue 4.5, TypeScript
- **Backend**: Nitro (Server Routes), Firebase Admin SDK
- **Database**: Firebase Firestore
- **Validation**: Zod
- **State Management**: Pinia (權限快取)

---

## 2. Data Schema Design

### 2.1 Collection: `roles` (角色定義)

儲存角色的定義與 XYZ 設定。

```typescript
interface Role {
  id: string;             // PK (e.g., 'super_admin', 'zone_leader', 'course_teacher')
  name: string;           // 顯示名稱 (Unique, e.g., "超級管理員")
  description?: string;   // 描述
  isSystem: boolean;      // System Role Flag (True: 禁止刪除/改名)
  
  // === X 軸: 功能權限 (Function Permissions) ===
  // 採用 Map 結構以利 O(1) 查找
  permissions: {
    // 儀表板 & 數據
    'dashboard:view': boolean;           // 存取儀表板
    'dashboard:export': boolean;         // 匯出報表
    
    // 人員管理
    'member:view': boolean;              // 查看會友列表
    'member:create': boolean;            // 新增會友
    'member:edit': boolean;              // 編輯會友資料
    'member:delete': boolean;            // 刪除會友
    'member:export': boolean;            // 匯出會友名單 (Excel)
    
    // 組織架構
    'org:view': boolean;                 // 查看組織架構
    'org:manage': boolean;               // 管理組織架構 (新增/編輯牧區小組)
    
    // 系統設定
    'system:config': boolean;            // 角色與系統設定
    
    // 課程管理 (預留給教育模組)
    'course:view': boolean;              // 查看課程
    'course:manage': boolean;            // 管理課程內容
    'course:grade': boolean;             // 評分與結課
  };

  // === Y 軸: 資料範圍 (Data Scope) ===
  // 定義該角色能「觸及」的資料邊界
  // 'Group' Scope 具有「多態性」，包含牧養小組與功能小組
  scope: 'Global' | 'Zone' | 'Group' | 'Self';

  // === Z 軸: 解鎖權限 (Reveal Authority) ===
  // 定義該角色能否「解鎖」特定敏感欄位
  revealAuthority: {
    mobile: boolean;                     // 手機號碼
    email: boolean;                      // Email
    lineId: boolean;                     // Line ID
    address: boolean;                    // 通訊地址
    emergencyContact: boolean;           // 緊急聯絡人 (name, relationship, phone)
  };

  // 元數據
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;                    // 建立者 UUID
}
```

### 2.2 Collection: `members` (Schema Update from ST-001)

在 ST-001 基礎上，新增角色關聯與功能性群組欄位。

```typescript
interface Member {
  // ...ST-001 原有欄位 (uuid, fullName, zoneId, groupId...)...

  // [New] 角色指派 (User-Role Relation)
  // 直接 Embedding，避免 Join 查詢
  roleIds: string[];  // e.g., ['group_leader', 'worship_leader']

  // [New] 功能性群組 (Matrix Organization)
  // 儲存該會員參與的所有非牧養群組 ID (如課程 ID、敬拜團 ID)
  functionalGroupIds: string[]; // e.g., ['course_s101', 'worship_team_a']
}
```

**變更影響**: ST-001 的 Member Schema 已同步更新。

### 2.3 Collection: `groups` (Schema Update)

復用 `groups` collection，但增加 `type` 來區分是「牧養小組」還是「功能小組」。

```typescript
interface Group {
  id: string;             // PK
  name: string;           // 名稱 (e.g., "喜樂小組" or "S101 成長班")
  
  // [New] 群組類型
  // 'Pastoral': 牧養小組 (對應 member.groupId)
  // 'Functional': 功能小組 (對應 member.functionalGroupIds) - 包含課程、事工、活動
  type: 'Pastoral' | 'Functional'; 
  
  leaderId?: string;      // 負責人 ID (擁有該 Group Scope 的人)
  leaderName?: string;    // 負責人姓名 (快取)
  parentZoneId?: string;  // 僅 Pastoral 類型需要 (所屬牧區)
  
  status: 'Active' | 'Inactive';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**注意**: Functional Groups 的建立與管理將在後續的課程/事工模組中處理，ST-002 僅提供架構查看介面。

---

## 3. Permission Resolution Logic

### 3.1 權限解析演算法 (Union Strategy)

當使用者登入時，系統需計算其 `UserContext`。這是 RBAC 的核心大腦。

#### 演算法步驟

**Step 1: 載入使用者的所有角色**
```typescript
const member = await getMemberById(userId);
const roles = await getRolesByIds(member.roleIds);
```

**Step 2: 解析 Scope (多態性處理)**

若 User 的任一 Role Scope 為 `Group`，則其 `managedGroupIds` 包含：
- `member.groupId` (如果他是該牧養小組的 Leader)
- PLUS 任何他擔任 Leader 的 `functionalGroupIds`

```typescript
// Pseudo-code
const scopeHierarchy = { Global: 3, Zone: 2, Group: 1, Self: 0 };
const maxScope = roles.reduce((max, role) => 
  scopeHierarchy[role.scope] > scopeHierarchy[max] ? role.scope : max
, 'Self');

let managedGroupIds: string[] = [];
let managedZoneId: string | undefined;

if (maxScope === 'Group') {
  // 找出該使用者擔任 Leader 的所有群組
  const ledGroups = await getGroupsByLeaderId(userId);
  managedGroupIds = ledGroups.map(g => g.id);
  
  // 同時包含他自己所屬的群組（如果有的話）
  if (member.groupId) managedGroupIds.push(member.groupId);
  if (member.functionalGroupIds) managedGroupIds.push(...member.functionalGroupIds);
  
  managedGroupIds = [...new Set(managedGroupIds)]; // 去重
} else if (maxScope === 'Zone') {
  managedZoneId = member.zoneId || undefined;
}
```

**Step 3: 解析 X 軸 (功能權限 - Union)**

任一角色有 True，即為 True。

```typescript
const mergedPermissions = {};
roles.forEach(role => {
  Object.keys(role.permissions).forEach(key => {
    mergedPermissions[key] = mergedPermissions[key] || role.permissions[key];
  });
});
```

**Step 4: 解析 Z 軸 (解鎖權限 - Union)**

任一角色有權限，即有權限。

```typescript
const mergedReveal = {};
roles.forEach(role => {
  Object.keys(role.revealAuthority).forEach(key => {
    mergedReveal[key] = mergedReveal[key] || role.revealAuthority[key];
  });
});
```

### 3.2 Resolved User Context Structure

```typescript
interface UserContext {
  userId: string;
  isSuperAdmin: boolean;         // 快速判斷 (若有 super_admin 角色)
  
  // 解析後的有效 Scope
  scope: 'Global' | 'Zone' | 'Group' | 'Self';
  
  // 該使用者有權管理的 Group IDs (包含牧養與功能性)
  // 用於 Firestore: WHERE groupId IN (...) OR functionalGroupIds ARRAY-CONTAINS-ANY (...)
  managedGroupIds: string[];     // e.g., ['group_001', 'course_s101']
  
  // 該使用者有權管理的 Zone ID
  managedZoneId?: string;        // e.g., 'zone_001'

  // 最終權限表
  permissions: Record<string, boolean>;      // X 軸合併結果
  revealAuthority: Record<string, boolean>;  // Z 軸合併結果
  
  // 原始角色 (供審計用)
  roleIds: string[];
}
```

---

## 4. API Specification

### 4.1 Role Management Endpoints

#### 4.1.1 GET `/api/roles` - 取得角色列表

**Query Parameters:**
```typescript
{
  page?: number;        // 頁碼 (預設 1)
  limit?: number;       // 每頁筆數 (預設 10)
  search?: string;      // 搜尋關鍵字 (角色名稱)
  status?: string;      // 'all' | 'system' | 'custom'
}
```

**Response:**
```json
{
  "roles": [
    {
      "id": "super_admin",
      "name": "超級管理員",
      "description": "擁有系統所有權限，不受限制",
      "isSystem": true,
      "scope": "Global",
      "memberCount": 3,
      "permissions": {
        "dashboard:view": true,
        "member:view": true,
        // ... all true
      },
      "revealAuthority": {
        "mobile": true,
        "email": true,
        // ... all true
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 10
}
```

**Implementation (`server/api/roles/index.get.ts`):**
```typescript
import { roleService } from '~/server/services/role.service';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  
  // Permission Check
  const userContext = event.context.userContext;
  if (!userContext.permissions['system:config']) {
    throw createError({
      statusCode: 403,
      message: '無權限存取角色設定',
    });
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const search = query.search as string | undefined;
  const status = query.status as string | undefined;

  try {
    const result = await roleService.getRoles({
      page,
      limit,
      search,
      status,
    });

    return result;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '無法取得角色列表',
    });
  }
});
```

#### 4.1.2 POST `/api/roles` - 建立角色

**Request Body:**
```json
{
  "name": "社青小組長",
  "description": "負責社青牧區的小組牧養",
  "scope": "Group",
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
  }
}
```

**Response (201 Created):**
```json
{
  "id": "role_abc123",
  "name": "社青小組長",
  "description": "負責社青牧區的小組牧養",
  "isSystem": false,
  "scope": "Group",
  "permissions": { /* ... */ },
  "revealAuthority": { /* ... */ },
  "createdAt": "2026-02-11T10:30:00Z",
  "updatedAt": "2026-02-11T10:30:00Z",
  "createdBy": "user_xyz"
}
```

#### 4.1.3 GET `/api/roles/:id` - 取得單一角色

**Response:**
```json
{
  "id": "group_leader",
  "name": "小組長",
  "description": "負責小組牧養與關懷",
  "isSystem": true,
  "scope": "Group",
  "memberCount": 42,
  "permissions": { /* ... */ },
  "revealAuthority": { /* ... */ },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### 4.1.4 PATCH `/api/roles/:id` - 更新角色

**Request Body:**
```json
{
  "description": "更新後的描述",
  "permissions": {
    "member:view": true,
    "member:edit": true
    // 只需傳遞要更新的欄位
  }
}
```

**Validation Rules:**
- ⚠️ System Role (`isSystem: true`) 不可修改 `name` 和核心權限
- ⚠️ 不可將 `isSystem` 從 true 改為 false

#### 4.1.5 DELETE `/api/roles/:id` - 刪除角色

**Validation:**
```typescript
// 檢查是否為 System Role
if (role.isSystem) {
  throw createError({
    statusCode: 403,
    message: '系統預設角色不可刪除',
  });
}

// 檢查是否有使用者正在使用此角色
const usersWithRole = await db.collection('members')
  .where('roleIds', 'array-contains', roleId)
  .count();

if (usersWithRole > 0) {
  throw createError({
    statusCode: 409,
    message: `無法刪除角色：仍有 ${usersWithRole} 位使用者隸屬於此角色，請先解除指派`,
  });
}
```

**Response:**
```json
{
  "success": true,
  "message": "角色已刪除"
}
```

### 4.2 Auth & Context Endpoint

#### 4.2.1 GET `/api/auth/context` - 取得使用者權限上下文

**用途**: 前端 SPA 初始化時呼叫，取得 `UserContext`。

**Response:**
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
    // ... 所有權限
  },
  "revealAuthority": {
    "mobile": true,
    "email": false,
    "lineId": false,
    "address": false,
    "emergencyContact": false
  },
  "roleIds": ["group_leader", "course_teacher"]
}
```

**Implementation (`server/api/auth/context.get.ts`):**
```typescript
import { authService } from '~/server/services/auth.service';

export default defineEventHandler(async (event) => {
  const userId = event.context.userId; // 由 auth middleware 注入

  if (!userId) {
    throw createError({
      statusCode: 401,
      message: '未登入',
    });
  }

  try {
    const userContext = await authService.resolveUserContext(userId);
    return userContext;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '無法取得權限上下文',
    });
  }
});
```

### 4.3 Organization Structure Endpoint (Updated)

#### GET `/api/organization/structure` - 取得組織架構（新增 type 參數）

**Query Parameters:**
```typescript
{
  type?: 'pastoral' | 'functional'; // 篩選類型
}
```

**Response (type=pastoral):**
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
      }
    ]
  }
]
```

**Response (type=functional):**
```json
{
  "courses": [
    {
      "groupId": "course_s101",
      "groupName": "S101 成長班",
      "groupType": "Functional",
      "groupLeaderId": "member_teacher_001",
      "groupLeaderName": "王老師",
      "memberCount": 28
    }
  ],
  "ministries": [
    {
      "groupId": "worship_team",
      "groupName": "敬拜團",
      "groupType": "Functional",
      "groupLeaderId": "member_worship_leader",
      "groupLeaderName": "李敬拜",
      "memberCount": 12
    }
  ]
}
```

---

## 5. Middleware Design

### 5.1 Authentication Middleware

**`server/middleware/01.auth.ts`** (執行順序：第一層)

```typescript
import { verifyAuthToken } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  // 略過公開 API
  const publicPaths = ['/api/auth/login', '/api/health'];
  if (publicPaths.some(path => event.path.startsWith(path))) {
    return;
  }

  // 從 Cookie 取得 Token
  const token = getCookie(event, 'auth_token');
  
  if (!token) {
    throw createError({
      statusCode: 401,
      message: '未提供驗證令牌',
    });
  }

  try {
    // 驗證 Token 並取得 userId
    const decoded = await verifyAuthToken(token);
    event.context.userId = decoded.uid;
  } catch (error) {
    throw createError({
      statusCode: 401,
      message: '無效的驗證令牌',
    });
  }
});
```

### 5.2 RBAC Middleware

**`server/middleware/02.rbac.ts`** (執行順序：第二層)

```typescript
import { authService } from '~/server/services/auth.service';

export default defineEventHandler(async (event) => {
  // 略過不需要 RBAC 的路徑
  const skipPaths = ['/api/auth/login', '/api/health'];
  if (skipPaths.some(path => event.path.startsWith(path))) {
    return;
  }

  const userId = event.context.userId;
  
  if (!userId) {
    // auth middleware 應該已處理，這裡是防禦性檢查
    return;
  }

  try {
    // 解析使用者權限上下文並注入 event.context
    const userContext = await authService.resolveUserContext(userId);
    event.context.userContext = userContext;
    
    // 快取到記憶體中（TTL: 5 分鐘）
    // 避免每個 API 都重新計算
    await cacheUserContext(userId, userContext, 300);
  } catch (error) {
    console.error('Failed to resolve user context:', error);
    throw createError({
      statusCode: 500,
      message: '無法解析使用者權限',
    });
  }
});
```

### 5.3 Permission Check Helper

**`server/utils/permission.ts`**

```typescript
import type { UserContext } from '~/types/rbac';
import type { H3Event } from 'h3';

/**
 * 檢查使用者是否有指定權限
 */
export function hasPermission(
  userContext: UserContext,
  permission: string
): boolean {
  if (userContext.isSuperAdmin) return true;
  return userContext.permissions[permission] === true;
}

/**
 * 要求使用者必須有指定權限，否則拋出 403 錯誤
 */
export function requirePermission(
  event: H3Event,
  permission: string
): void {
  const userContext = event.context.userContext;
  
  if (!userContext) {
    throw createError({
      statusCode: 401,
      message: '未登入',
    });
  }

  if (!hasPermission(userContext, permission)) {
    throw createError({
      statusCode: 403,
      message: `無權限執行此操作 (需要: ${permission})`,
    });
  }
}

/**
 * 根據 Data Scope 過濾 Firestore 查詢
 */
export function applyScopeFilter(
  query: FirebaseFirestore.Query,
  userContext: UserContext,
  collectionName: string = 'members'
): FirebaseFirestore.Query {
  if (userContext.isSuperAdmin || userContext.scope === 'Global') {
    // 無限制，回傳原 query
    return query;
  }

  if (userContext.scope === 'Zone') {
    // 僅限該牧區
    return query.where('zoneId', '==', userContext.managedZoneId);
  }

  if (userContext.scope === 'Group') {
    // 僅限管理的群組（包含牧養 + 功能性）
    // Firestore: 需使用 array-contains-any 或 IN
    // 注意：IN 限制 10 個值，若超過需分批查詢
    if (userContext.managedGroupIds.length === 0) {
      // 無管理群組，回傳空結果
      return query.where('uuid', '==', 'never_match');
    }
    
    // 查詢 groupId 符合 OR functionalGroupIds 包含任一個
    return query.where('groupId', 'in', userContext.managedGroupIds);
    // TODO: 處理 functionalGroupIds 的查詢（需要 OR 邏輯，可能需要多次查詢合併）
  }

  if (userContext.scope === 'Self') {
    // 僅限本人
    return query.where('uuid', '==', userContext.userId);
  }

  // 預設：無權限
  return query.where('uuid', '==', 'never_match');
}
```

---

## 6. Service Layer

### 6.1 Role Service

**`server/services/role.service.ts`**

```typescript
import { roleRepository } from '~/server/repositories/role.repository';
import type { Role } from '~/types/rbac';

class RoleService {
  /**
   * 建立角色
   */
  async createRole(data: Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'isSystem'>): Promise<Role> {
    // 檢查名稱是否重複
    const existingRole = await roleRepository.findByName(data.name);
    if (existingRole) {
      throw createError({
        statusCode: 409,
        message: '角色名稱已存在',
      });
    }

    // 建立角色（非系統角色）
    const role = await roleRepository.create({
      ...data,
      isSystem: false,
    });

    return role;
  }

  /**
   * 取得角色列表
   */
  async getRoles(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
  }): Promise<{
    roles: Role[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { roles, total } = await roleRepository.findAll(params);

    // 計算每個角色的歸屬人數
    const rolesWithCount = await Promise.all(
      roles.map(async (role) => {
        const count = await roleRepository.countMembersByRoleId(role.id);
        return {
          ...role,
          memberCount: count,
        };
      })
    );

    return {
      roles: rolesWithCount,
      total,
      page: params.page,
      limit: params.limit,
    };
  }

  /**
   * 取得單一角色
   */
  async getRoleById(id: string): Promise<Role | null> {
    return await roleRepository.findById(id);
  }

  /**
   * 更新角色
   */
  async updateRole(id: string, data: Partial<Role>): Promise<Role | null> {
    const existingRole = await roleRepository.findById(id);
    if (!existingRole) {
      return null;
    }

    // System Role 保護
    if (existingRole.isSystem) {
      if (data.name || data.isSystem === false) {
        throw createError({
          statusCode: 403,
          message: '系統預設角色不可修改名稱或移除系統標記',
        });
      }
    }

    // 若更新名稱，檢查是否重複
    if (data.name && data.name !== existingRole.name) {
      const duplicateRole = await roleRepository.findByName(data.name);
      if (duplicateRole) {
        throw createError({
          statusCode: 409,
          message: '角色名稱已存在',
        });
      }
    }

    const updatedRole = await roleRepository.update(id, data);
    return updatedRole;
  }

  /**
   * 刪除角色
   */
  async deleteRole(id: string): Promise<void> {
    const role = await roleRepository.findById(id);
    if (!role) {
      throw createError({
        statusCode: 404,
        message: '找不到該角色',
      });
    }

    // System Role 保護
    if (role.isSystem) {
      throw createError({
        statusCode: 403,
        message: '系統預設角色不可刪除',
      });
    }

    // 檢查是否有使用者正在使用此角色
    const usersWithRole = await roleRepository.countMembersByRoleId(id);
    if (usersWithRole > 0) {
      throw createError({
        statusCode: 409,
        message: `無法刪除角色：仍有 ${usersWithRole} 位使用者隸屬於此角色，請先解除指派`,
      });
    }

    await roleRepository.delete(id);
  }
}

export const roleService = new RoleService();
```

### 6.2 Auth Service

**`server/services/auth.service.ts`**

```typescript
import { getFirestore } from 'firebase-admin/firestore';
import type { UserContext, Role } from '~/types/rbac';
import { roleRepository } from '~/server/repositories/role.repository';
import { memberRepository } from '~/server/repositories/member.repository';

class AuthService {
  private db = getFirestore();

  /**
   * 解析使用者權限上下文 (核心演算法)
   */
  async resolveUserContext(userId: string): Promise<UserContext> {
    // Step 1: 載入使用者資料
    const member = await memberRepository.findById(userId);
    if (!member) {
      throw createError({
        statusCode: 404,
        message: '找不到使用者',
      });
    }

    // Step 2: 載入所有角色
    const roles = await roleRepository.findByIds(member.roleIds);

    // Step 3: 解析 Scope (取最大範圍)
    const scopeHierarchy = { Global: 3, Zone: 2, Group: 1, Self: 0 };
    const maxScope = roles.reduce((max, role) => 
      scopeHierarchy[role.scope] > scopeHierarchy[max] ? role.scope : max
    , 'Self' as 'Global' | 'Zone' | 'Group' | 'Self');

    // Step 4: 計算 managedGroupIds 和 managedZoneId
    let managedGroupIds: string[] = [];
    let managedZoneId: string | undefined;

    if (maxScope === 'Group') {
      // 找出該使用者擔任 Leader 的所有群組
      const ledGroups = await this.db
        .collection('groups')
        .where('leaderId', '==', userId)
        .where('status', '==', 'Active')
        .get();
      
      managedGroupIds = ledGroups.docs.map(doc => doc.id);
      
      // 同時包含他自己所屬的群組
      if (member.groupId) managedGroupIds.push(member.groupId);
      if (member.functionalGroupIds) managedGroupIds.push(...member.functionalGroupIds);
      
      managedGroupIds = [...new Set(managedGroupIds)]; // 去重
    } else if (maxScope === 'Zone') {
      managedZoneId = member.zoneId || undefined;
    }

    // Step 5: 合併功能權限 (Union)
    const mergedPermissions: Record<string, boolean> = {};
    roles.forEach(role => {
      Object.keys(role.permissions).forEach(key => {
        mergedPermissions[key] = mergedPermissions[key] || role.permissions[key];
      });
    });

    // Step 6: 合併解鎖權限 (Union)
    const mergedReveal: Record<string, boolean> = {};
    roles.forEach(role => {
      Object.keys(role.revealAuthority).forEach(key => {
        mergedReveal[key] = mergedReveal[key] || role.revealAuthority[key];
      });
    });

    // Step 7: 檢查是否為 Super Admin
    const isSuperAdmin = member.roleIds.includes('super_admin');

    // Step 8: 組裝 UserContext
    const userContext: UserContext = {
      userId,
      isSuperAdmin,
      scope: maxScope,
      managedGroupIds,
      managedZoneId,
      permissions: mergedPermissions,
      revealAuthority: mergedReveal,
      roleIds: member.roleIds,
    };

    return userContext;
  }
}

export const authService = new AuthService();
```

---

## 7. Frontend Architecture

### 7.1 File Structure

```
app/
├── components/
│   ├── role/
│   │   ├── RoleList.vue             # 角色列表組件
│   │   ├── RoleForm.vue             # 角色表單（新增/編輯）
│   │   ├── PermissionCheckboxGroup.vue  # 權限勾選組
│   │   └── RoleSidebar.vue          # 左側角色選單
│   └── organization/
│       ├── StructureTree.vue        # 組織架構樹（牧區/小組）
│       ├── PendingPool.vue          # 待分類池
│       └── FunctionalGroupList.vue  # 功能性群組列表（課程/事工）
├── pages/
│   ├── roles/
│   │   ├── index.vue                # 角色列表頁
│   │   ├── create.vue               # 新增角色頁
│   │   └── [id]/
│   │       └── edit.vue             # 編輯角色頁
│   └── organization/
│       └── structure.vue            # 組織架構管理頁（3 Tabs）
├── composables/
│   ├── useRole.ts                   # 角色 CRUD
│   ├── usePermission.ts             # 權限檢查
│   └── useAuth.ts                   # 使用者上下文
├── utils/
│   └── rbac/
│       ├── permissions.ts           # 權限常數定義
│       └── schema.ts                # Zod Schema
├── types/
│   └── rbac.ts                      # RBAC 相關型別
└── stores/
    └── auth.store.ts                # 使用者上下文 Store (Pinia)
```

### 7.2 Type Definitions

**`app/types/rbac.ts`**

```typescript
import type { Timestamp } from 'firebase/firestore';

// 權限 Key 類型
export type PermissionKey =
  | 'dashboard:view'
  | 'dashboard:export'
  | 'member:view'
  | 'member:create'
  | 'member:edit'
  | 'member:delete'
  | 'member:export'
  | 'org:view'
  | 'org:manage'
  | 'system:config'
  | 'course:view'
  | 'course:manage'
  | 'course:grade';

// Data Scope 類型
export type DataScope = 'Global' | 'Zone' | 'Group' | 'Self';

// 解鎖權限 Key 類型
export type RevealKey = 'mobile' | 'email' | 'lineId' | 'address' | 'emergencyContact';

// 角色
export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  scope: DataScope;
  permissions: Record<PermissionKey, boolean>;
  revealAuthority: Record<RevealKey, boolean>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
  memberCount?: number; // 前端顯示用（非資料庫欄位）
}

// 使用者權限上下文
export interface UserContext {
  userId: string;
  isSuperAdmin: boolean;
  scope: DataScope;
  managedGroupIds: string[];
  managedZoneId?: string;
  permissions: Record<string, boolean>;
  revealAuthority: Record<string, boolean>;
  roleIds: string[];
}

// 權限群組（用於 UI 顯示）
export interface PermissionGroup {
  label: string;
  icon: string;
  permissions: {
    key: PermissionKey;
    label: string;
    description?: string;
  }[];
}
```

### 7.3 Permission Constants

**`app/utils/rbac/permissions.ts`**

```typescript
import type { PermissionGroup } from '~/types/rbac';

// 權限分組定義（對應設計稿的分組）
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: '儀表板 & 數據',
    icon: 'pi pi-chart-bar',
    permissions: [
      {
        key: 'dashboard:view',
        label: '檢視儀表板',
        description: '查看統計數據與圖表',
      },
      {
        key: 'dashboard:export',
        label: '匯出數據報表',
        description: '下載報表與統計資料',
      },
    ],
  },
  {
    label: '人員管理',
    icon: 'pi pi-users',
    permissions: [
      {
        key: 'member:view',
        label: '檢視會友列表',
        description: '查看會友基本資料',
      },
      {
        key: 'member:create',
        label: '新增會友資料',
        description: '建立新會友帳號',
      },
      {
        key: 'member:edit',
        label: '成員資料/轉移',
        description: '編輯會友資料與轉移小組',
      },
      {
        key: 'member:delete',
        label: '刪除會友',
        description: '移除會友帳號（危險操作）',
      },
      {
        key: 'member:export',
        label: '匯出會友名單',
        description: '下載 Excel 報表',
      },
    ],
  },
  {
    label: '組織架構',
    icon: 'pi pi-sitemap',
    permissions: [
      {
        key: 'org:view',
        label: '檢視組織圖',
        description: '查看牧區小組架構',
      },
      {
        key: 'org:manage',
        label: '新增/編輯小組',
        description: '調整組織架構',
      },
    ],
  },
  {
    label: '收費館位',
    icon: 'pi pi-graduation-cap',
    permissions: [
      {
        key: 'course:view',
        label: '檢視收費資訊',
        description: '查看課程與館位資料',
      },
      {
        key: 'course:manage',
        label: '新增館位紀錄',
        description: '管理課程內容',
      },
      {
        key: 'course:grade',
        label: '評分與結課',
        description: '批改作業與結課',
      },
    ],
  },
];

// Data Scope 選項
export const DATA_SCOPE_OPTIONS = [
  {
    label: '全教會 (Global)',
    value: 'Global',
    description: '可存取所有會友資料，不受限制',
  },
  {
    label: '僅限所屬牧區 (My Zone Only)',
    value: 'Zone',
    description: '此角色所在的使用者僅能看到所屬牧區的資料',
  },
  {
    label: '僅限所屬小組 (My Group Only)',
    value: 'Group',
    description: '此角色所在的使用者僅能看到所屬小組或管理群組的資料',
  },
  {
    label: '僅限本人 (Self)',
    value: 'Self',
    description: '僅能查看與編輯自己的資料',
  },
];

// 解鎖權限選項
export const REVEAL_AUTHORITY_OPTIONS = [
  {
    key: 'mobile',
    label: '手機號碼',
  },
  {
    key: 'email',
    label: 'Email',
  },
  {
    key: 'lineId',
    label: 'Line ID',
  },
  {
    key: 'address',
    label: '通訊地址',
  },
  {
    key: 'emergencyContact',
    label: '緊急聯絡人資訊',
  },
];
```

### 7.4 Composables

**`app/composables/useRole.ts`**

```typescript
import type { Role } from '~/types/rbac';

export const useRole = () => {
  const toast = useToast();

  // 建立角色
  const createRole = async (data: Partial<Role>): Promise<Role | null> => {
    try {
      const response = await $fetch<Role>('/api/roles', {
        method: 'POST',
        body: data,
      });

      toast.add({
        severity: 'success',
        summary: '建立成功',
        detail: '角色已建立',
        life: 3000,
      });

      return response;
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: '建立失敗',
        detail: error?.data?.message || '請稍後再試',
        life: 5000,
      });
      return null;
    }
  };

  // 更新角色
  const updateRole = async (id: string, data: Partial<Role>): Promise<Role | null> => {
    try {
      const response = await $fetch<Role>(`/api/roles/${id}`, {
        method: 'PATCH',
        body: data,
      });

      toast.add({
        severity: 'success',
        summary: '更新成功',
        detail: '角色已更新',
        life: 3000,
      });

      return response;
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: '更新失敗',
        detail: error?.data?.message || '請稍後再試',
        life: 5000,
      });
      return null;
    }
  };

  // 取得角色列表
  const fetchRoles = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) => {
    return await $fetch<{
      roles: Role[];
      total: number;
      page: number;
      limit: number;
    }>('/api/roles', {
      method: 'GET',
      query: params,
    });
  };

  // 取得單一角色
  const fetchRoleById = async (id: string): Promise<Role | null> => {
    try {
      return await $fetch<Role>(`/api/roles/${id}`);
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: '取得失敗',
        detail: '無法取得角色資料',
        life: 5000,
      });
      return null;
    }
  };

  // 刪除角色
  const deleteRole = async (id: string): Promise<boolean> => {
    try {
      await $fetch(`/api/roles/${id}`, {
        method: 'DELETE',
      });

      toast.add({
        severity: 'success',
        summary: '刪除成功',
        detail: '角色已刪除',
        life: 3000,
      });

      return true;
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: '刪除失敗',
        detail: error?.data?.message || '請稍後再試',
        life: 5000,
      });
      return false;
    }
  };

  return {
    createRole,
    updateRole,
    fetchRoles,
    fetchRoleById,
    deleteRole,
  };
};
```

**`app/composables/useAuth.ts`**

```typescript
import type { UserContext } from '~/types/rbac';

export const useAuth = () => {
  const authStore = useAuthStore();

  // 取得使用者權限上下文
  const fetchUserContext = async (): Promise<UserContext | null> => {
    try {
      const context = await $fetch<UserContext>('/api/auth/context');
      authStore.setUserContext(context);
      return context;
    } catch (error) {
      console.error('Failed to fetch user context:', error);
      return null;
    }
  };

  // 檢查是否有指定權限
  const hasPermission = (permission: string): boolean => {
    const context = authStore.userContext;
    if (!context) return false;
    if (context.isSuperAdmin) return true;
    return context.permissions[permission] === true;
  };

  // 檢查是否能解鎖指定欄位
  const canReveal = (field: string): boolean => {
    const context = authStore.userContext;
    if (!context) return false;
    if (context.isSuperAdmin) return true;
    return context.revealAuthority[field] === true;
  };

  return {
    fetchUserContext,
    hasPermission,
    canReveal,
  };
};
```

**`app/stores/auth.store.ts`**

```typescript
import { defineStore } from 'pinia';
import type { UserContext } from '~/types/rbac';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    userContext: null as UserContext | null,
  }),

  getters: {
    isAuthenticated: (state) => state.userContext !== null,
    isSuperAdmin: (state) => state.userContext?.isSuperAdmin || false,
  },

  actions: {
    setUserContext(context: UserContext) {
      this.userContext = context;
    },

    clearUserContext() {
      this.userContext = null;
    },

    hasPermission(permission: string): boolean {
      if (!this.userContext) return false;
      if (this.userContext.isSuperAdmin) return true;
      return this.userContext.permissions[permission] === true;
    },

    canReveal(field: string): boolean {
      if (!this.userContext) return false;
      if (this.userContext.isSuperAdmin) return true;
      return this.userContext.revealAuthority[field] === true;
    },
  },

  persist: {
    storage: persistedState.localStorage,
    paths: ['userContext'],
  },
});
```

---

## 8. UI Component Design

### 8.1 角色列表頁 (`/roles`)

根據設計稿 `角色管理 - 列表/screen.png`：

**`app/pages/roles/index.vue`**

```vue
<script setup lang="ts">
import type { Role } from '~/types/rbac';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'permission'], // 檢查 system:config 權限
});

const { fetchRoles, deleteRole } = useRole();
const { hasPermission } = useAuth();

// 檢查權限
if (!hasPermission('system:config')) {
  navigateTo('/');
}

// 篩選參數
const filters = ref({
  search: '',
  status: 'all' as 'all' | 'system' | 'custom',
});

// 分頁
const page = ref(1);
const limit = ref(10);
const total = ref(0);

// 角色列表
const roles = ref<Role[]>([]);
const loading = ref(false);

// 載入角色列表
const loadRoles = async () => {
  loading.value = true;
  try {
    const result = await fetchRoles({
      page: page.value,
      limit: limit.value,
      search: filters.value.search,
      status: filters.value.status === 'all' ? undefined : filters.value.status,
    });
    roles.value = result.roles;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
};

// 初始化
onMounted(loadRoles);

// 篩選變更時重新載入
watch(filters, () => {
  page.value = 1;
  loadRoles();
}, { deep: true });

// 分頁變更
const onPageChange = (event: any) => {
  page.value = event.page + 1;
  loadRoles();
};

// 前往新增頁面
const goToCreate = () => {
  navigateTo('/roles/create');
};

// 編輯角色
const editRole = (id: string) => {
  navigateTo(`/roles/${id}/edit`);
};

// 刪除角色
const confirmDelete = (role: Role) => {
  if (role.isSystem) {
    toast.add({
      severity: 'warn',
      summary: '無法刪除',
      detail: '系統預設角色不可刪除',
      life: 3000,
    });
    return;
  }

  confirm.require({
    message: `確定要刪除角色「${role.name}」嗎？`,
    header: '刪除確認',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: '確定刪除',
    rejectLabel: '取消',
    accept: async () => {
      const success = await deleteRole(role.id);
      if (success) {
        loadRoles();
      }
    },
  });
};

// 狀態標籤顏色
const getStatusSeverity = (isSystem: boolean) => {
  return isSystem ? 'success' : 'info';
};

const getStatusLabel = (isSystem: boolean) => {
  return isSystem ? '啟用' : '啟用';
};
</script>

<template>
  <div class="roles-page">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">角色權限設定</h1>
        <p class="text-slate-600">定義系統角色及其對應的作業權限範圍</p>
      </div>
      <div class="flex gap-3">
        <Button
          label="+ 新增角色"
          icon="pi pi-plus"
          severity="secondary"
          @click="goToCreate"
        />
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section mb-6 p-4 bg-white rounded-lg shadow">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InputText
          v-model="filters.search"
          placeholder="角色名稱"
          class="w-full"
        >
          <template #prefix>
            <i class="pi pi-search" />
          </template>
        </InputText>

        <Select
          v-model="filters.status"
          :options="[
            { label: '所有', value: 'all' },
            { label: '系統角色', value: 'system' },
            { label: '自訂角色', value: 'custom' },
          ]"
          option-label="label"
          option-value="value"
          placeholder="狀態 - 所有"
          class="w-full"
        />

        <div class="flex items-center gap-2">
          <Button
            label="查詢"
            icon="pi pi-filter"
            severity="secondary"
            @click="loadRoles"
          />
        </div>
      </div>
    </div>

    <!-- Table -->
    <DataTable
      :value="roles"
      :loading="loading"
      striped-rows
      :rows="limit"
      :total-records="total"
      :paginator="true"
      @page="onPageChange"
      class="shadow"
    >
      <!-- 角色代碼/名稱 -->
      <Column header="角色代碼/名稱">
        <template #body="{ data }">
          <div>
            <div class="font-bold text-lg">{{ data.id.toUpperCase() }}</div>
            <div class="text-sm text-slate-500">{{ data.name }}</div>
          </div>
        </template>
      </Column>

      <!-- 角色權限 -->
      <Column field="description" header="角色權限">
        <template #body="{ data }">
          <span class="text-sm">{{ data.description || '－' }}</span>
        </template>
      </Column>

      <!-- 歸屬人數 -->
      <Column header="歸屬人數" class="text-center">
        <template #body="{ data }">
          <Tag :value="`${data.memberCount || 0} 人`" severity="info" />
        </template>
      </Column>

      <!-- 狀態 -->
      <Column header="狀態" class="text-center">
        <template #body="{ data }">
          <Tag
            :value="getStatusLabel(data.isSystem)"
            :severity="getStatusSeverity(data.isSystem)"
          />
        </template>
      </Column>

      <!-- 最後異動 -->
      <Column header="最後異動">
        <template #body="{ data }">
          <div class="text-sm">
            <div>{{ data.createdBy || 'System' }}</div>
            <div class="text-slate-400">
              {{ new Date(data.updatedAt).toLocaleDateString('zh-TW') }}
            </div>
          </div>
        </template>
      </Column>

      <!-- 操作 -->
      <Column header="操作" class="text-center">
        <template #body="{ data }">
          <div class="flex gap-2 justify-center">
            <Button
              icon="pi pi-pencil"
              severity="secondary"
              text
              rounded
              @click="editRole(data.id)"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              :disabled="data.isSystem"
              @click="confirmDelete(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<style scoped>
.roles-page {
  padding: 2rem;
}
</style>
```

### 8.2 角色編輯頁 (`/roles/:id/edit`)

根據設計稿 `角色管理 - 編輯/screen.png`：

**`app/pages/roles/[id]/edit.vue`**

```vue
<script setup lang="ts">
import type { Role } from '~/types/rbac';
import { PERMISSION_GROUPS, DATA_SCOPE_OPTIONS } from '~/utils/rbac/permissions';

definePageMeta({
  layout: 'dashboard',
});

const route = useRoute();
const roleId = route.params.id as string;

const { fetchRoleById, updateRole, fetchRoles } = useRole();

// 當前角色
const currentRole = ref<Role | null>(null);
const loading = ref(false);

// 所有角色列表（左側 Sidebar 用）
const allRoles = ref<Role[]>([]);

// 表單資料
const formData = ref({
  name: '',
  description: '',
  scope: 'Group' as 'Global' | 'Zone' | 'Group' | 'Self',
  permissions: {} as Record<string, boolean>,
  revealAuthority: {} as Record<string, boolean>,
});

// 載入角色
const loadRole = async (id: string) => {
  loading.value = true;
  try {
    const role = await fetchRoleById(id);
    if (role) {
      currentRole.value = role;
      formData.value = {
        name: role.name,
        description: role.description || '',
        scope: role.scope,
        permissions: { ...role.permissions },
        revealAuthority: { ...role.revealAuthority },
      };
    }
  } finally {
    loading.value = false;
  }
};

// 載入所有角色（Sidebar）
const loadAllRoles = async () => {
  const result = await fetchRoles({ limit: 100 });
  allRoles.value = result.roles;
};

// 初始化
onMounted(async () => {
  await Promise.all([
    loadRole(roleId),
    loadAllRoles(),
  ]);
});

// 切換角色
const switchRole = (id: string) => {
  navigateTo(`/roles/${id}/edit`);
};

// 全選/取消全選
const toggleAllPermissions = (checked: boolean) => {
  PERMISSION_GROUPS.forEach(group => {
    group.permissions.forEach(perm => {
      formData.value.permissions[perm.key] = checked;
    });
  });
};

// 儲存
const submitting = ref(false);
const saveRole = async () => {
  submitting.value = true;
  try {
    await updateRole(roleId, formData.value);
    await loadRole(roleId);
  } finally {
    submitting.value = false;
  }
};

// 返回列表
const goBack = () => {
  navigateTo('/roles');
};
</script>

<template>
  <div class="role-edit-page">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <Breadcrumb
        :home="{ label: '角色權限設定', to: '/roles' }"
        :model="[{ label: currentRole?.name || '編輯角色' }]"
      />
      <div class="flex gap-3">
        <Button
          label="取消"
          severity="secondary"
          outlined
          @click="goBack"
        />
        <Button
          label="儲存變更"
          icon="pi pi-save"
          severity="secondary"
          :loading="submitting"
          @click="saveRole"
        />
      </div>
    </div>

    <!-- Content -->
    <div v-if="!loading && currentRole" class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Left Sidebar -->
      <div class="lg:col-span-1">
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-shield text-primary" />
              <span>角色列表</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-2">
              <div
                v-for="role in allRoles"
                :key="role.id"
                :class="[
                  'p-3 rounded-lg cursor-pointer transition-colors',
                  role.id === roleId ? 'bg-primary-50 border-l-4 border-primary' : 'hover:bg-slate-50',
                ]"
                @click="switchRole(role.id)"
              >
                <div class="font-semibold">{{ role.name }}</div>
                <div class="text-sm text-slate-500">{{ role.memberCount || 0 }} 人</div>
              </div>
            </div>
          </template>
        </Card>

        <Card class="mt-4">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-cog text-primary" />
              <span>角色設定</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <!-- 角色名稱 -->
              <div>
                <label class="font-semibold mb-2 block">角色名稱</label>
                <InputText
                  v-model="formData.name"
                  :disabled="currentRole.isSystem"
                  class="w-full"
                />
              </div>

              <!-- 描述 -->
              <div>
                <label class="font-semibold mb-2 block">描述</label>
                <Textarea
                  v-model="formData.description"
                  rows="4"
                  class="w-full"
                  placeholder="負責某牧區帳檔，西元年牧區等擔任牧中時期使用"
                />
              </div>

              <!-- Data Scope -->
              <div>
                <label class="font-semibold mb-2 block">
                  資料授權範圍 (Data Scope)
                  <i class="pi pi-question-circle text-slate-400 ml-2" />
                </label>
                <Select
                  v-model="formData.scope"
                  :options="DATA_SCOPE_OPTIONS"
                  option-label="label"
                  option-value="value"
                  class="w-full"
                />
                <p class="text-sm text-slate-500 mt-2">
                  {{ DATA_SCOPE_OPTIONS.find(o => o.value === formData.scope)?.description }}
                </p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Main Content -->
      <div class="lg:col-span-3">
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="pi pi-lock text-primary" />
                <span>功能權限表</span>
              </div>
              <div class="flex gap-2">
                <Button
                  label="全選"
                  size="small"
                  text
                  @click="toggleAllPermissions(true)"
                />
                <Button
                  label="展開全部"
                  size="small"
                  text
                />
              </div>
            </div>
          </template>
          <template #content>
            <!-- 權限分組 -->
            <div class="space-y-6">
              <div
                v-for="group in PERMISSION_GROUPS"
                :key="group.label"
                class="permission-group"
              >
                <div class="flex items-center gap-2 mb-3">
                  <i :class="group.icon" class="text-primary" />
                  <h3 class="font-bold text-lg">{{ group.label }}</h3>
                </div>

                <div class="grid grid-cols-2 gap-4 ml-6">
                  <div
                    v-for="perm in group.permissions"
                    :key="perm.key"
                    class="flex items-start gap-3"
                  >
                    <Checkbox
                      v-model="formData.permissions[perm.key]"
                      :binary="true"
                      :input-id="perm.key"
                    />
                    <label :for="perm.key" class="cursor-pointer">
                      <div class="font-semibold">{{ perm.label }}</div>
                      <div v-if="perm.description" class="text-sm text-slate-500">
                        {{ perm.description }}
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <!-- 隱私解鎖權限 -->
              <Divider />

              <div class="permission-group">
                <div class="flex items-center gap-2 mb-3">
                  <i class="pi pi-eye text-primary" />
                  <h3 class="font-bold text-lg">隱私資料解鎖權限</h3>
                </div>

                <div class="ml-6 text-sm text-slate-600 mb-4">
                  <p>預設所有敏感資料都會遮罩顯示。勾選以下選項可允許該角色「點擊眼睛圖示」來查看明碼。</p>
                </div>

                <div class="grid grid-cols-2 gap-4 ml-6">
                  <div class="flex items-start gap-3">
                    <Checkbox
                      v-model="formData.revealAuthority.mobile"
                      :binary="true"
                      input-id="reveal-mobile"
                    />
                    <label for="reveal-mobile" class="cursor-pointer font-semibold">
                      手機號碼
                    </label>
                  </div>

                  <div class="flex items-start gap-3">
                    <Checkbox
                      v-model="formData.revealAuthority.email"
                      :binary="true"
                      input-id="reveal-email"
                    />
                    <label for="reveal-email" class="cursor-pointer font-semibold">
                      Email
                    </label>
                  </div>

                  <div class="flex items-start gap-3">
                    <Checkbox
                      v-model="formData.revealAuthority.lineId"
                      :binary="true"
                      input-id="reveal-lineId"
                    />
                    <label for="reveal-lineId" class="cursor-pointer font-semibold">
                      Line ID
                    </label>
                  </div>

                  <div class="flex items-start gap-3">
                    <Checkbox
                      v-model="formData.revealAuthority.address"
                      :binary="true"
                      input-id="reveal-address"
                    />
                    <label for="reveal-address" class="cursor-pointer font-semibold">
                      通訊地址
                    </label>
                  </div>

                  <div class="flex items-start gap-3">
                    <Checkbox
                      v-model="formData.revealAuthority.emergencyContact"
                      :binary="true"
                      input-id="reveal-emergency"
                    />
                    <label for="reveal-emergency" class="cursor-pointer font-semibold">
                      緊急聯絡人資訊
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Loading -->
    <div v-else class="flex justify-center items-center h-96">
      <ProgressSpinner />
    </div>
  </div>
</template>

<style scoped>
.role-edit-page {
  padding: 2rem;
}

.permission-group {
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: #f8fafc;
}
</style>
```

### 8.3 組織架構管理頁 (`/organization/structure`)

根據設計稿 `架構管理/screen.png`，並擴充為 3 個 Tab：

**`app/pages/organization/structure.vue`**

```vue
<script setup lang="ts">
import type { ZoneWithGroups } from '~/types/member';

definePageMeta({
  layout: 'dashboard',
});

const { fetchOrganizationStructure } = useZoneGroup();
const { hasPermission } = useAuth();

// Tab 管理
const activeTab = ref(0);
const tabs = [
  { label: '牧區/小組', icon: 'pi pi-sitemap' },
  { label: '課程', icon: 'pi pi-graduation-cap' },
  { label: '事工', icon: 'pi pi-users' },
];

// 牧區小組結構
const pastoralStructure = ref<ZoneWithGroups[]>([]);
const loading = ref(false);

// 載入牧區小組架構
const loadPastoralStructure = async () => {
  loading.value = true;
  try {
    const result = await fetchOrganizationStructure();
    pastoralStructure.value = result;
  } finally {
    loading.value = false;
  }
};

onMounted(loadPastoralStructure);

// 前往課程管理
const goToCourseManagement = () => {
  if (hasPermission('course:manage')) {
    navigateTo('/courses');
  }
};

// 前往事工管理
const goToMinistryManagement = () => {
  navigateTo('/ministries');
};
</script>

<template>
  <div class="structure-page">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">組織架構管理</h1>
        <Breadcrumb
          :home="{ label: '首頁', to: '/' }"
          :model="[{ label: '教會治理' }, { label: '組織架構' }]"
        />
      </div>
      <div class="flex gap-3">
        <Button
          v-if="hasPermission('org:manage')"
          label="編輯架構"
          icon="pi pi-pencil"
          severity="secondary"
        />
      </div>
    </div>

    <!-- Tabs -->
    <TabView v-model:active-index="activeTab" class="mb-6">
      <!-- Tab 1: 牧區/小組 -->
      <TabPanel>
        <template #header>
          <div class="flex items-center gap-2">
            <i class="pi pi-sitemap" />
            <span>牧區/小組</span>
          </div>
        </template>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Left: Structure Tree -->
          <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-sitemap text-primary" />
                <span>組織架構樹 (Structure Tree)</span>
              </div>
            </template>
            <template #content>
              <div v-if="!loading" class="space-y-4">
                <div
                  v-for="zone in pastoralStructure"
                  :key="zone.zoneId"
                  class="zone-node"
                >
                  <!-- 牧區 -->
                  <div class="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div class="flex items-center gap-2">
                      <i class="pi pi-folder text-amber-600" />
                      <span class="font-bold">{{ zone.zoneName }}</span>
                      <span class="text-sm text-slate-500">
                        總人數: {{ zone.groups.reduce((sum, g) => sum + (g.memberCount || 0), 0) }} 人
                      </span>
                    </div>
                  </div>

                  <!-- 小組列表 -->
                  <div class="ml-6 mt-2 space-y-2">
                    <div
                      v-for="group in zone.groups"
                      :key="group.groupId"
                      class="group-node flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div class="flex items-center gap-2">
                        <i class="pi pi-users text-blue-600" />
                        <span class="font-semibold">{{ group.groupName }}</span>
                        <span class="text-sm text-slate-500">{{ group.memberCount || 0 }} 人</span>
                      </div>
                      <Button
                        icon="pi pi-arrow-down"
                        size="small"
                        text
                        rounded
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="flex justify-center py-8">
                <ProgressSpinner />
              </div>
            </template>
          </Card>

          <!-- Right: Pending Pool -->
          <Card>
            <template #title>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <i class="pi pi-inbox text-primary" />
                  <span>待分類區 (Pending Pool)</span>
                  <Badge value="5 人" severity="warn" />
                </div>
                <span class="text-sm text-slate-500">尚未分配至教資料或</span>
              </div>
            </template>
            <template #content>
              <div class="space-y-3">
                <!-- 待分類會友列表 -->
                <div class="pending-member flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div class="flex items-center gap-3">
                    <Avatar label="陳" size="large" shape="circle" />
                    <div>
                      <div class="font-semibold">陳小明</div>
                      <div class="text-sm text-slate-500">小組民</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-sm">0912-345-678</span>
                    <Button
                      label="放入牧資至小組"
                      size="small"
                      severity="secondary"
                    />
                  </div>
                </div>

                <!-- 提示訊息 -->
                <Message severity="info">
                  將會友拖曳到左側小組即可完成分配
                </Message>
              </div>
            </template>
          </Card>
        </div>
      </TabPanel>

      <!-- Tab 2: 課程 -->
      <TabPanel>
        <template #header>
          <div class="flex items-center gap-2">
            <i class="pi pi-graduation-cap" />
            <span>課程</span>
          </div>
        </template>

        <Card>
          <template #content>
            <div class="text-center py-12">
              <i class="pi pi-graduation-cap text-6xl text-slate-300 mb-4" />
              <h3 class="text-xl font-bold mb-2">課程功能性群組</h3>
              <p class="text-slate-600 mb-6">
                課程班級由「課程管理模組」建立與管理。<br>
                此頁面僅供查看課程架構。
              </p>
              <Button
                v-if="hasPermission('course:manage')"
                label="前往課程管理"
                icon="pi pi-arrow-right"
                severity="secondary"
                @click="goToCourseManagement"
              />
              <p v-else class="text-sm text-slate-500">
                您沒有課程管理權限
              </p>
            </div>
          </template>
        </Card>
      </TabPanel>

      <!-- Tab 3: 事工 -->
      <TabPanel>
        <template #header>
          <div class="flex items-center gap-2">
            <i class="pi pi-users" />
            <span>事工</span>
          </div>
        </template>

        <Card>
          <template #content>
            <div class="text-center py-12">
              <i class="pi pi-users text-6xl text-slate-300 mb-4" />
              <h3 class="text-xl font-bold mb-2">事工功能性群組</h3>
              <p class="text-slate-600 mb-6">
                事工團隊（如敬拜團、招待組）由「事工管理模組」建立與管理。<br>
                此頁面僅供查看事工架構。
              </p>
              <Button
                label="前往事工管理"
                icon="pi pi-arrow-right"
                severity="secondary"
                @click="goToMinistryManagement"
              />
            </div>
          </template>
        </Card>
      </TabPanel>
    </TabView>
  </div>
</template>

<style scoped>
.structure-page {
  padding: 2rem;
}

.zone-node {
  margin-bottom: 1.5rem;
}

.group-node {
  cursor: pointer;
}

.pending-member {
  cursor: move;
}
</style>
```

---

## 9. System Seed Data

### 9.1 預設角色定義

**Migration Script: `scripts/seed-roles.ts`**

```typescript
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

export const SYSTEM_ROLES = [
  {
    id: 'super_admin',
    name: '超級管理員',
    description: '擁有系統所有權限，不受限制',
    isSystem: true,
    scope: 'Global',
    permissions: {
      'dashboard:view': true,
      'dashboard:export': true,
      'member:view': true,
      'member:create': true,
      'member:edit': true,
      'member:delete': true,
      'member:export': true,
      'org:view': true,
      'org:manage': true,
      'system:config': true,
      'course:view': true,
      'course:manage': true,
      'course:grade': true,
    },
    revealAuthority: {
      mobile: true,
      email: true,
      lineId: true,
      address: true,
      emergencyContact: true,
    },
  },
  {
    id: 'zone_leader',
    name: '牧區長',
    description: '管理所屬牧區的會友與小組',
    isSystem: true,
    scope: 'Zone',
    permissions: {
      'dashboard:view': true,
      'dashboard:export': false,
      'member:view': true,
      'member:create': false,
      'member:edit': true,
      'member:delete': false,
      'member:export': true,
      'org:view': true,
      'org:manage': true,
      'system:config': false,
      'course:view': true,
      'course:manage': false,
      'course:grade': false,
    },
    revealAuthority: {
      mobile: true,
      email: true,
      lineId: true,
      address: true,
      emergencyContact: true,
    },
  },
  {
    id: 'group_leader',
    name: '小組長',
    description: '負責小組牧養與關懷',
    isSystem: true,
    scope: 'Group',
    permissions: {
      'dashboard:view': true,
      'dashboard:export': false,
      'member:view': true,
      'member:create': false,
      'member:edit': true,
      'member:delete': false,
      'member:export': false,
      'org:view': true,
      'org:manage': false,
      'system:config': false,
      'course:view': true,
      'course:manage': false,
      'course:grade': false,
    },
    revealAuthority: {
      mobile: true,
      email: false,
      lineId: false,
      address: false,
      emergencyContact: false,
    },
  },
  {
    id: 'teacher',
    name: '課程老師',
    description: '管理課程學員與評分（矩陣式角色）',
    isSystem: true,
    scope: 'Group',
    permissions: {
      'dashboard:view': false,
      'dashboard:export': false,
      'member:view': true,
      'member:create': false,
      'member:edit': false,
      'member:delete': false,
      'member:export': false,
      'org:view': false,
      'org:manage': false,
      'system:config': false,
      'course:view': true,
      'course:manage': true,
      'course:grade': true,
    },
    revealAuthority: {
      mobile: true,
      email: false,
      lineId: false,
      address: false,
      emergencyContact: false,
    },
  },
  {
    id: 'general',
    name: '一般會友',
    description: '預設角色，僅能查看與編輯自己的資料',
    isSystem: true,
    scope: 'Self',
    permissions: {
      'dashboard:view': false,
      'dashboard:export': false,
      'member:view': false,
      'member:create': false,
      'member:edit': false,
      'member:delete': false,
      'member:export': false,
      'org:view': false,
      'org:manage': false,
      'system:config': false,
      'course:view': true,
      'course:manage': false,
      'course:grade': false,
    },
    revealAuthority: {
      mobile: false,
      email: false,
      lineId: false,
      address: false,
      emergencyContact: false,
    },
  },
];

async function seedRoles() {
  const db = getFirestore();

  for (const role of SYSTEM_ROLES) {
    await db.collection('roles').doc(role.id).set({
      ...role,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log(`✅ Created role: ${role.name}`);
  }

  console.log('🎉 All system roles seeded successfully!');
}

seedRoles().catch(console.error);
```

---

## 10. Mock Data for Local Development

### 10.1 角色假資料

**`app/data/roles.mock.ts`**

```typescript
import type { Role } from '~/types/rbac';

export const mockRoles: Role[] = [
  {
    id: 'super_admin',
    name: '超級管理員',
    description: '擁有系統所有權限，不受限制',
    isSystem: true,
    scope: 'Global',
    permissions: {
      'dashboard:view': true,
      'dashboard:export': true,
      'member:view': true,
      'member:create': true,
      'member:edit': true,
      'member:delete': true,
      'member:export': true,
      'org:view': true,
      'org:manage': true,
      'system:config': true,
      'course:view': true,
      'course:manage': true,
      'course:grade': true,
    },
    revealAuthority: {
      mobile: true,
      email: true,
      lineId: true,
      address: true,
      emergencyContact: true,
    },
    memberCount: 3,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    createdBy: 'System',
  },
  {
    id: 'zone_leader',
    name: '牧區長',
    description: '管理所屬牧區的會友與小組',
    isSystem: true,
    scope: 'Zone',
    permissions: {
      'dashboard:view': true,
      'dashboard:export': false,
      'member:view': true,
      'member:create': false,
      'member:edit': true,
      'member:delete': false,
      'member:export': true,
      'org:view': true,
      'org:manage': true,
      'system:config': false,
      'course:view': true,
      'course:manage': false,
      'course:grade': false,
    },
    revealAuthority: {
      mobile: true,
      email: true,
      lineId: true,
      address: true,
      emergencyContact: true,
    },
    memberCount: 4,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    createdBy: 'System',
  },
  {
    id: 'group_leader',
    name: '小組長',
    description: '負責小組牧養與關懷',
    isSystem: true,
    scope: 'Group',
    permissions: {
      'dashboard:view': true,
      'dashboard:export': false,
      'member:view': true,
      'member:create': false,
      'member:edit': true,
      'member:delete': false,
      'member:export': false,
      'org:view': true,
      'org:manage': false,
      'system:config': false,
      'course:view': true,
      'course:manage': false,
      'course:grade': false,
    },
    revealAuthority: {
      mobile: true,
      email: false,
      lineId: false,
      address: false,
      emergencyContact: false,
    },
    memberCount: 42,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    createdBy: 'System',
  },
  {
    id: 'teacher',
    name: '課程老師',
    description: '管理課程學員與評分（矩陣式角色）',
    isSystem: true,
    scope: 'Group',
    permissions: {
      'dashboard:view': false,
      'dashboard:export': false,
      'member:view': true,
      'member:create': false,
      'member:edit': false,
      'member:delete': false,
      'member:export': false,
      'org:view': false,
      'org:manage': false,
      'system:config': false,
      'course:view': true,
      'course:manage': true,
      'course:grade': true,
    },
    revealAuthority: {
      mobile: true,
      email: false,
      lineId: false,
      address: false,
      emergencyContact: false,
    },
    memberCount: 8,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    createdBy: 'System',
  },
  {
    id: 'general',
    name: '一般會友',
    description: '預設角色，僅能查看與編輯自己的資料',
    isSystem: true,
    scope: 'Self',
    permissions: {
      'dashboard:view': false,
      'dashboard:export': false,
      'member:view': false,
      'member:create': false,
      'member:edit': false,
      'member:delete': false,
      'member:export': false,
      'org:view': false,
      'org:manage': false,
      'system:config': false,
      'course:view': true,
      'course:manage': false,
      'course:grade': false,
    },
    revealAuthority: {
      mobile: false,
      email: false,
      lineId: false,
      address: false,
      emergencyContact: false,
    },
    memberCount: 856,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    createdBy: 'System',
  },
  // 自訂角色範例
  {
    id: 'role_custom_001',
    name: '社青小組長',
    description: '負責社青牧區的小組牧養',
    isSystem: false,
    scope: 'Group',
    permissions: {
      'dashboard:view': true,
      'dashboard:export': false,
      'member:view': true,
      'member:create': false,
      'member:edit': true,
      'member:delete': false,
      'member:export': false,
      'org:view': true,
      'org:manage': false,
      'system:config': false,
      'course:view': true,
      'course:manage': false,
      'course:grade': false,
    },
    revealAuthority: {
      mobile: true,
      email: false,
      lineId: false,
      address: false,
      emergencyContact: false,
    },
    memberCount: 5,
    createdAt: new Date('2025-01-05T10:00:00Z'),
    updatedAt: new Date('2025-01-05T10:00:00Z'),
    createdBy: 'Admin - 2025/01/05',
  },
];
```

### 10.2 Mock API Implementation

**`server/api/roles/index.get.ts` (Development Mode)**

```typescript
import { mockRoles } from '~/app/data/roles.mock';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  // 開發環境使用 Mock Data
  if (process.env.NODE_ENV === 'development') {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let filtered = mockRoles;
    
    // 搜尋
    if (query.search) {
      const searchTerm = (query.search as string).toLowerCase();
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(searchTerm) ||
        r.id.toLowerCase().includes(searchTerm)
      );
    }
    
    // 狀態篩選
    if (query.status === 'system') {
      filtered = filtered.filter(r => r.isSystem);
    } else if (query.status === 'custom') {
      filtered = filtered.filter(r => !r.isSystem);
    }
    
    // 分頁
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);
    
    return {
      roles: paginated,
      total: filtered.length,
      page,
      limit,
    };
  }

  // 正式環境使用真實資料
  // TODO: Implement real API
  return {
    roles: [],
    total: 0,
    page: 1,
    limit: 10,
  };
});
```

**`server/api/auth/context.get.ts` (Development Mode)**

```typescript
import type { UserContext } from '~/types/rbac';

export default defineEventHandler(async (event) => {
  const userId = event.context.userId || 'member_001'; // Mock userId

  // 開發環境使用 Mock Data
  if (process.env.NODE_ENV === 'development') {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Mock: 假設該使用者是小組長
    const mockContext: UserContext = {
      userId,
      isSuperAdmin: false,
      scope: 'Group',
      managedGroupIds: ['group_001', 'course_s101'],
      managedZoneId: undefined,
      permissions: {
        'dashboard:view': true,
        'dashboard:export': false,
        'member:view': true,
        'member:create': false,
        'member:edit': true,
        'member:delete': false,
        'member:export': false,
        'org:view': true,
        'org:manage': false,
        'system:config': false,
        'course:view': true,
        'course:manage': false,
        'course:grade': false,
      },
      revealAuthority: {
        mobile: true,
        email: false,
        lineId: false,
        address: false,
        emergencyContact: false,
      },
      roleIds: ['group_leader', 'teacher'],
    };
    
    return mockContext;
  }

  // 正式環境使用真實資料
  const { authService } = await import('~/server/services/auth.service');
  return await authService.resolveUserContext(userId);
});
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

**Permission Resolution Logic:**
- 測試 Union Strategy（X 軸、Z 軸）
- 測試 Scope 解析（Global > Zone > Group > Self）
- 測試多重角色合併邏輯

**Role Service:**
- 測試 System Role 保護機制
- 測試角色名稱重複檢查
- 測試刪除前的使用者檢查

### 11.2 Integration Tests

**API Routes:**
- 測試完整的 CRUD 流程
- 測試權限檢查 Middleware
- 測試 Data Scope 過濾

**Auth Context:**
- 測試 Token 驗證
- 測試 UserContext 快取機制

### 11.3 E2E Tests

使用 Playwright 測試：
- 角色列表頁面的篩選與分頁
- 角色編輯頁面的權限勾選
- System Role 的編輯限制
- 刪除角色的防呆機制

---

## 12. Security Considerations

### 12.1 System Role Protection

**Implementation:**
```typescript
// server/utils/rbac.ts
export function isSystemRole(roleId: string): boolean {
  const SYSTEM_ROLE_IDS = [
    'super_admin',
    'zone_leader',
    'group_leader',
    'teacher',
    'general',
  ];
  return SYSTEM_ROLE_IDS.includes(roleId);
}

export function validateRoleModification(role: Role, changes: Partial<Role>) {
  if (role.isSystem) {
    if (changes.name !== undefined || changes.isSystem === false) {
      throw createError({
        statusCode: 403,
        message: '系統預設角色不可修改名稱或移除系統標記',
      });
    }
  }
}
```

### 12.2 Permission Check Best Practices

```typescript
// ✅ Good: 使用 requirePermission helper
export default defineEventHandler(async (event) => {
  requirePermission(event, 'member:edit');
  // ... 業務邏輯
});

// ❌ Bad: 直接檢查（容易遺漏）
export default defineEventHandler(async (event) => {
  if (!event.context.userContext.permissions['member:edit']) {
    throw createError({ statusCode: 403 });
  }
});
```

### 12.3 Data Scope Enforcement

```typescript
// 在查詢會友時，必須套用 Scope 過濾
let query = db.collection('members');
query = applyScopeFilter(query, userContext);

const snapshot = await query.get();
```

---

## 13. Performance Optimization

### 13.1 UserContext Caching

使用記憶體快取減少重複計算：

```typescript
// server/utils/cache.ts
const userContextCache = new Map<string, { context: UserContext; expiry: number }>();

export async function getCachedUserContext(userId: string): Promise<UserContext | null> {
  const cached = userContextCache.get(userId);
  if (cached && cached.expiry > Date.now()) {
    return cached.context;
  }
  return null;
}

export function cacheUserContext(userId: string, context: UserContext, ttlSeconds: number) {
  userContextCache.set(userId, {
    context,
    expiry: Date.now() + ttlSeconds * 1000,
  });
}
```

### 13.2 Database Indexing

**Firestore Composite Indexes:**
```
Collection: members
- roleIds (ARRAY) + status (ASC)
- groupId (ASC) + status (ASC)
- zoneId (ASC) + status (ASC)

Collection: groups
- leaderId (ASC) + status (ASC)
- type (ASC) + status (ASC)

Collection: roles
- isSystem (ASC) + createdAt (DESC)
```

---

## 14. Migration & Deployment

### 14.1 Migration Checklist

- [ ] 建立 `roles` Collection 並執行 Seed Script
- [ ] 更新 `members` Collection Schema（新增 `roleIds`, `functionalGroupIds`）
- [ ] 更新 `groups` Collection Schema（新增 `type` 欄位）
- [ ] 為現有會友指派預設角色 (`general`)
- [ ] 設定 Firestore Security Rules（Role CRUD 需 `system:config` 權限）
- [ ] 設定 Firestore Indexes
- [ ] 部署 RBAC Middleware
- [ ] 測試權限解析邏輯
- [ ] 更新 ST001 的 Member API（整合 Data Scope 過濾）
- [ ] 部署到 Staging 環境
- [ ] UAT 測試
- [ ] 部署到 Production

### 14.2 Rollback Plan

若 RBAC 實作有問題：
1. **緊急關閉**: 將所有使用者的 `roleIds` 設為 `['super_admin']`（暫時全開）
2. **Middleware 旁路**: 在 `02.rbac.ts` 加入環境變數開關
3. **資料回滾**: 從備份恢復 `members` 和 `groups` Collection

---

## 15. Future Enhancements (Out of Scope for ST-002)

- **動態權限**: 支援在 Runtime 新增權限項目（不需修改程式碼）
- **權限繼承**: 支援角色繼承（如 Zone Leader 繼承 Group Leader 權限）
- **審計日誌**: 記錄所有角色變更與權限檢查失敗
- **權限測試工具**: 提供「模擬使用者」功能，測試不同角色的畫面
- **批次指派角色**: 支援一次將多個使用者指派給某角色
- **角色複製**: 快速建立類似角色
- **權限模板**: 預設的權限組合（如「唯讀角色」、「編輯者」）

---

## 16. References

- **Story Document**: `ST002 - RBAC Configuration.md`
- **Design Mockups**: 
  - `docs/設計稿/角色管理 - 列表/`
  - `docs/設計稿/角色管理 - 編輯/`
  - `docs/設計稿/架構管理/`
- **Related Stories**: 
  - ST-001 (會友資料核心)
  - ST-003 (會友資料列表 - 需整合 RBAC 過濾)
- **Tech Stack**: Nuxt 4, PrimeVue 4, Firebase, TypeScript, Zod

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-11  
**Author**: AI Assistant  
**Status**: Draft - Pending Review
