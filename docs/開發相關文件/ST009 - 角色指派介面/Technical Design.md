# ST009 - Technical Design: 角色指派介面

## 1. Overview

### 1.1 Story Reference
- **Story ID**: ST-009
- **Priority**: Must Have (Core Feature)
- **User Story**: As a 行政同工, I want to 在會友資料中指派、移除、查看角色，並依角色篩選會友列表, So that 我能靈活管理會友的系統權限，確保每位會友擁有正確的角色與存取範圍。

### 1.2 Design Goals
1. 實作會友角色指派介面（新增、移除）
2. 實作角色預覽功能（顯示 XYZ 三軸）
3. 實作會友列表的角色篩選與顯示
4. 實作 UserContext 快取清除機制
5. 整合 RBAC 權限控制

### 1.3 Tech Stack
- **Frontend**: Nuxt 4, Vue 3.5 (Composition API), PrimeVue 4.5, TypeScript
- **Backend**: Nitro (Server Routes), Firebase Admin SDK
- **Database**: Firestore
- **Cache**: Redis 或 Node Memory Cache
- **Validation**: Zod

---

## 2. Data Models

### 2.1 Member Role Assignment

```typescript
// 會友的角色列表（已存在於 Member Interface）
interface Member {
  // ... 其他欄位
  roleIds: string[];               // 角色 ID 列表
}

// 角色指派請求
export interface RoleAssignmentRequest {
  memberId: string;
  roleIds: string[];               // 新的角色 ID 列表
  forceLogout?: boolean;           // 是否強制登出（選填）
}

// 批次角色指派請求
export interface BatchRoleAssignmentRequest {
  memberIds: string[];
  roleIds: string[];
  mode: 'add' | 'replace';         // 新增模式或取代模式
}
```

### 2.2 Role with Details (for Preview)

```typescript
export interface RoleWithDetails {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  scope: 'Global' | 'Zone' | 'Group' | 'Self';
  
  // X 軸: 功能權限
  permissions: Record<string, boolean>;
  
  // Z 軸: 解鎖權限
  revealAuthority: {
    mobile: boolean;
    email: boolean;
    lineId: boolean;
    address: boolean;
    emergencyContact: boolean;
  };
  
  // 統計資訊
  memberCount?: number;            // 擁有此角色的會友數量
}
```

---

## 3. Frontend Architecture

### 3.1 File Structure

```
app/
├── components/
│   ├── member/
│   │   ├── MemberRoleManager.vue     # 角色管理區塊（編輯頁）
│   │   ├── MemberRoleCard.vue        # 角色卡片
│   │   ├── MemberRoleSelector.vue    # 角色選擇器
│   │   ├── RolePreviewDialog.vue     # 角色預覽對話框
│   │   └── BatchRoleAssignDialog.vue # 批次指派對話框
│   └── common/
│       └── ...                        # 通用元件
├── pages/
│   └── members/
│       ├── [id]/
│       │   ├── index.vue              # 會友詳情頁（顯示角色）
│       │   └── edit.vue               # 會友編輯頁（管理角色）
│       └── index.vue                  # 會友列表（角色篩選）
├── composables/
│   ├── useMemberRole.ts               # 會友角色管理邏輯
│   └── useRolePreview.ts              # 角色預覽邏輯
└── types/
    └── role-assignment.ts             # 角色指派相關型別
```

### 3.2 Type Definitions

**`app/types/role-assignment.ts`**

```typescript
export interface RoleAssignmentRequest {
  memberId: string;
  roleIds: string[];
  forceLogout?: boolean;
}

export interface BatchRoleAssignmentRequest {
  memberIds: string[];
  roleIds: string[];
  mode: 'add' | 'replace';
}

export interface RoleDisplayInfo {
  id: string;
  name: string;
  scope: 'Global' | 'Zone' | 'Group' | 'Self';
  scopeLabel: string;
  scopeSeverity: 'danger' | 'warn' | 'info' | 'secondary';
  isSystem: boolean;
}
```

### 3.3 Composables

**`app/composables/useMemberRole.ts`**

```typescript
import type { RoleAssignmentRequest, BatchRoleAssignmentRequest, RoleDisplayInfo } from '~/types/role-assignment';
import type { Role } from '~/types/role';

export const useMemberRole = () => {
  const toast = useToast();

  // 更新會友角色
  const updateMemberRoles = async (request: RoleAssignmentRequest): Promise<boolean> => {
    try {
      await $fetch('/api/members/roles/assign', {
        method: 'POST',
        body: request,
      });

      toast.add({
        severity: 'success',
        summary: '角色已更新',
        detail: '會友的角色已成功更新',
        life: 3000,
      });

      return true;
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: '更新失敗',
        detail: error?.data?.message || '請稍後再試',
        life: 5000,
      });
      return false;
    }
  };

  // 批次指派角色
  const batchAssignRoles = async (request: BatchRoleAssignmentRequest): Promise<boolean> => {
    try {
      const response = await $fetch<{
        successCount: number;
        failedCount: number;
      }>('/api/members/roles/batch-assign', {
        method: 'POST',
        body: request,
      });

      if (response.failedCount > 0) {
        toast.add({
          severity: 'warn',
          summary: '批次指派完成',
          detail: `已成功指派 ${response.successCount} 位會友，${response.failedCount} 位會友指派失敗`,
          life: 5000,
        });
      } else {
        toast.add({
          severity: 'success',
          summary: '批次指派成功',
          detail: `已為 ${response.successCount} 位會友指派角色`,
          life: 3000,
        });
      }

      return true;
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: '批次指派失敗',
        detail: error?.data?.message || '請稍後再試',
        life: 5000,
      });
      return false;
    }
  };

  // 取得角色列表
  const fetchRoles = async (): Promise<Role[]> => {
    try {
      const response = await $fetch<{ data: Role[] }>('/api/roles');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      return [];
    }
  };

  // 取得角色顯示資訊
  const getRoleDisplayInfo = (role: Role): RoleDisplayInfo => {
    const scopeLabels: Record<string, string> = {
      Global: '全教會',
      Zone: '牧區',
      Group: '小組',
      Self: '個人',
    };

    const scopeSeverities: Record<string, 'danger' | 'warn' | 'info' | 'secondary'> = {
      Global: 'danger',
      Zone: 'warn',
      Group: 'info',
      Self: 'secondary',
    };

    return {
      id: role.id,
      name: role.name,
      scope: role.scope,
      scopeLabel: scopeLabels[role.scope],
      scopeSeverity: scopeSeverities[role.scope],
      isSystem: role.isSystem,
    };
  };

  return {
    updateMemberRoles,
    batchAssignRoles,
    fetchRoles,
    getRoleDisplayInfo,
  };
};
```

**`app/composables/useRolePreview.ts`**

```typescript
import type { Role } from '~/types/role';

export const useRolePreview = () => {
  const selectedRole = ref<Role | null>(null);
  const showDialog = ref(false);

  // 開啟角色預覽
  const openRolePreview = async (roleId: string) => {
    try {
      const role = await $fetch<Role>(`/api/roles/${roleId}`);
      selectedRole.value = role;
      showDialog.value = true;
    } catch (error) {
      console.error('Failed to fetch role:', error);
    }
  };

  // 關閉對話框
  const closeDialog = () => {
    showDialog.value = false;
    selectedRole.value = null;
  };

  // 取得權限列表（X 軸）
  const permissionList = computed(() => {
    if (!selectedRole.value) return [];

    return Object.entries(selectedRole.value.permissions)
      .filter(([_, enabled]) => enabled)
      .map(([key, _]) => {
        const labels: Record<string, string> = {
          'dashboard:view': '檢視儀表板',
          'dashboard:export': '匯出數據報表',
          'member:view': '查看會友列表',
          'member:create': '新增會友',
          'member:edit': '編輯會友資料',
          'member:delete': '刪除會友',
          'member:export': '匯出會友名單',
          'org:view': '查看組織架構',
          'org:manage': '管理組織架構',
          'system:config': '角色與系統設定',
          'course:view': '查看課程',
          'course:manage': '管理課程內容',
          'course:grade': '評分與結課',
        };
        return { key, label: labels[key] || key };
      });
  });

  // 取得解鎖權限列表（Z 軸）
  const revealAuthorityList = computed(() => {
    if (!selectedRole.value) return [];

    return Object.entries(selectedRole.value.revealAuthority)
      .filter(([_, enabled]) => enabled)
      .map(([key, _]) => {
        const labels: Record<string, string> = {
          mobile: '手機號碼',
          email: '電子郵件',
          lineId: 'Line ID',
          address: '居住地址',
          emergencyContact: '緊急聯絡人',
        };
        return { key, label: labels[key] || key };
      });
  });

  return {
    selectedRole,
    showDialog,
    permissionList,
    revealAuthorityList,
    openRolePreview,
    closeDialog,
  };
};
```

### 3.4 Component Design

**`app/components/member/MemberRoleManager.vue`**

```vue
<script setup lang="ts">
import type { Member } from '~/types/member';
import type { Role } from '~/types/role';
import { useMemberRole } from '~/composables/useMemberRole';
import { useRolePreview } from '~/composables/useRolePreview';

const props = defineProps<{
  member: Member;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  update: [];
}>();

const { updateMemberRoles, fetchRoles, getRoleDisplayInfo } = useMemberRole();
const { openRolePreview } = useRolePreview();

// 所有可用角色
const allRoles = ref<Role[]>([]);

// 會友當前角色
const memberRoles = ref<string[]>(props.member.roleIds || []);

// 載入角色列表
onMounted(async () => {
  allRoles.value = await fetchRoles();
});

// 可用角色（排除已擁有的）
const availableRoles = computed(() => 
  allRoles.value.filter(role => !memberRoles.value.includes(role.id))
);

// 會友當前角色詳情
const memberRoleDetails = computed(() => 
  allRoles.value
    .filter(role => memberRoles.value.includes(role.id))
    .map(role => getRoleDisplayInfo(role))
);

// 新增角色
const onAddRoles = (selectedRoleIds: string[]) => {
  memberRoles.value = [...memberRoles.value, ...selectedRoleIds];
};

// 移除角色
const onRemoveRole = (roleId: string) => {
  // 檢查是否為最後一個角色
  if (memberRoles.value.length === 1) {
    toast.add({
      severity: 'error',
      summary: '無法移除',
      detail: '每位會友至少需要一個角色',
      life: 3000,
    });
    return;
  }

  // 顯示確認對話框
  confirm.require({
    message: '確定要移除此角色嗎？移除後該會友的權限將改變。',
    header: '確認移除',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: '確定移除',
    rejectLabel: '取消',
    accept: () => {
      memberRoles.value = memberRoles.value.filter(id => id !== roleId);
    },
  });
};

// 儲存變更
const onSave = async () => {
  const success = await updateMemberRoles({
    memberId: props.member.uuid,
    roleIds: memberRoles.value,
  });

  if (success) {
    emit('update');
  }
};

// 查看角色權限
const onViewRolePermissions = (roleId: string) => {
  openRolePreview(roleId);
};
</script>

<template>
  <div class="member-role-manager">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold">角色與權限</h3>
      <Button
        v-if="!readonly"
        label="儲存變更"
        icon="pi pi-save"
        severity="primary"
        size="small"
        @click="onSave"
      />
    </div>

    <!-- 當前角色列表 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
      <MemberRoleCard
        v-for="roleInfo in memberRoleDetails"
        :key="roleInfo.id"
        :role="roleInfo"
        :readonly="readonly"
        @remove="onRemoveRole(roleInfo.id)"
        @view-permissions="onViewRolePermissions(roleInfo.id)"
      />
    </div>

    <!-- 新增角色 -->
    <div v-if="!readonly && availableRoles.length > 0">
      <MultiSelect
        :model-value="[]"
        :options="availableRoles"
        option-label="name"
        option-value="id"
        placeholder="+ 新增角色"
        filter
        display="chip"
        class="w-full"
        @update:model-value="onAddRoles"
      >
        <template #option="{ option }">
          <div class="flex items-center justify-between w-full">
            <span>{{ option.name }}</span>
            <Tag
              :value="getRoleDisplayInfo(option).scopeLabel"
              :severity="getRoleDisplayInfo(option).scopeSeverity"
              size="small"
            />
          </div>
        </template>
      </MultiSelect>
    </div>

    <!-- 若無可用角色 -->
    <div v-else-if="!readonly" class="text-sm text-slate-500">
      已擁有所有角色
    </div>

    <!-- 角色預覽對話框 -->
    <RolePreviewDialog />
  </div>
</template>

<style scoped>
.member-role-manager {
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}
</style>
```

**`app/components/member/MemberRoleCard.vue`**

```vue
<script setup lang="ts">
import type { RoleDisplayInfo } from '~/types/role-assignment';

const props = defineProps<{
  role: RoleDisplayInfo;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  remove: [];
  'view-permissions': [];
}>();
</script>

<template>
  <div class="role-card">
    <div class="flex items-center justify-between p-3 bg-white rounded border hover:shadow-sm transition-shadow">
      <div class="flex items-center gap-3">
        <i class="pi pi-shield text-xl text-slate-600" />
        <div>
          <div class="font-semibold">{{ role.name }}</div>
          <Tag
            :value="role.scopeLabel"
            :severity="role.scopeSeverity"
            size="small"
          />
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button
          icon="pi pi-eye"
          severity="secondary"
          text
          rounded
          size="small"
          v-tooltip.top="'查看權限'"
          @click="emit('view-permissions')"
        />
        <Button
          v-if="!readonly && !role.isSystem"
          icon="pi pi-times"
          severity="danger"
          text
          rounded
          size="small"
          v-tooltip.top="'移除角色'"
          @click="emit('remove')"
        />
      </div>
    </div>
  </div>
</template>
```

**`app/components/member/RolePreviewDialog.vue`**

```vue
<script setup lang="ts">
import { useRolePreview } from '~/composables/useRolePreview';

const { selectedRole, showDialog, permissionList, revealAuthorityList, closeDialog } = useRolePreview();
</script>

<template>
  <Dialog
    :visible="showDialog"
    :header="`${selectedRole?.name} - 權限詳情`"
    :modal="true"
    :closable="true"
    :style="{ width: '600px' }"
    @update:visible="closeDialog"
  >
    <div v-if="selectedRole" class="flex flex-col gap-4">
      <!-- 角色資訊 -->
      <div class="p-3 bg-slate-50 rounded">
        <div class="flex items-center gap-2 mb-2">
          <i class="pi pi-info-circle text-slate-600" />
          <span class="font-semibold">角色資訊</span>
        </div>
        <div class="text-sm text-slate-600">
          <div><strong>名稱:</strong> {{ selectedRole.name }}</div>
          <div><strong>描述:</strong> {{ selectedRole.description || '無' }}</div>
          <div><strong>系統角色:</strong> {{ selectedRole.isSystem ? '是' : '否' }}</div>
        </div>
      </div>

      <!-- Y 軸: 資料範圍 -->
      <div>
        <div class="flex items-center gap-2 mb-2">
          <i class="pi pi-database text-slate-600" />
          <span class="font-semibold">資料範圍（Y 軸）</span>
        </div>
        <Tag
          :value="selectedRole.scope"
          :severity="scopeSeverity[selectedRole.scope]"
        />
        <p class="text-sm text-slate-600 mt-2">
          {{ scopeDescriptions[selectedRole.scope] }}
        </p>
      </div>

      <!-- X 軸: 功能權限 -->
      <div>
        <div class="flex items-center gap-2 mb-2">
          <i class="pi pi-cog text-slate-600" />
          <span class="font-semibold">功能權限（X 軸）</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <Tag
            v-for="perm in permissionList"
            :key="perm.key"
            :value="perm.label"
            severity="success"
          />
        </div>
        <p v-if="permissionList.length === 0" class="text-sm text-slate-500">
          無特殊權限
        </p>
      </div>

      <!-- Z 軸: 解鎖權限 -->
      <div>
        <div class="flex items-center gap-2 mb-2">
          <i class="pi pi-eye text-slate-600" />
          <span class="font-semibold">解鎖權限（Z 軸）</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <Tag
            v-for="reveal in revealAuthorityList"
            :key="reveal.key"
            :value="reveal.label"
            severity="warn"
          />
        </div>
        <p v-if="revealAuthorityList.length === 0" class="text-sm text-slate-500">
          無解鎖權限
        </p>
      </div>
    </div>

    <template #footer>
      <Button label="關閉" severity="secondary" @click="closeDialog" />
    </template>
  </Dialog>
</template>

<script lang="ts">
const scopeSeverity: Record<string, 'danger' | 'warn' | 'info' | 'secondary'> = {
  Global: 'danger',
  Zone: 'warn',
  Group: 'info',
  Self: 'secondary',
};

const scopeDescriptions: Record<string, string> = {
  Global: '可存取系統內所有資料，無過濾條件',
  Zone: '僅可存取所屬牧區的資料',
  Group: '僅可存取所屬/管理的群組資料（包含牧養小組與功能性群組）',
  Self: '僅可存取本人資料',
};
</script>
```

---

## 4. Backend Architecture

### 4.1 API Routes

#### POST /api/members/roles/assign

**`server/api/members/roles/assign.post.ts`**

```typescript
import { memberService } from '~/server/services/member.service';
import { requirePermission } from '~/server/utils/permission';
import { clearUserContextCache } from '~/server/utils/cache';

export default defineEventHandler(async (event) => {
  // 權限檢查: system:config
  requirePermission(event, 'system:config');

  const body = await readBody(event);
  const { memberId, roleIds, forceLogout } = body;

  // 驗證
  if (!memberId || !roleIds || !Array.isArray(roleIds)) {
    throw createError({
      statusCode: 400,
      message: '缺少必要參數',
    });
  }

  // 驗證至少有一個角色
  if (roleIds.length === 0) {
    throw createError({
      statusCode: 400,
      message: '每位會友至少需要一個角色',
    });
  }

  try {
    await memberService.updateMemberRoles(memberId, roleIds);

    // 清除 UserContext 快取
    await clearUserContextCache(memberId);

    // 若需強制登出（由 ST010 實作）
    if (forceLogout) {
      // await authService.forceLogout(memberId);
    }

    return { success: true };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '更新角色失敗',
    });
  }
});
```

#### POST /api/members/roles/batch-assign

**`server/api/members/roles/batch-assign.post.ts`**

```typescript
import { memberService } from '~/server/services/member.service';
import { requirePermission } from '~/server/utils/permission';
import { clearUserContextCache } from '~/server/utils/cache';

export default defineEventHandler(async (event) => {
  // 權限檢查: system:config
  requirePermission(event, 'system:config');

  const body = await readBody(event);
  const { memberIds, roleIds, mode } = body;

  // 驗證
  if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
    throw createError({
      statusCode: 400,
      message: '缺少會友 ID 列表',
    });
  }

  if (memberIds.length > 50) {
    throw createError({
      statusCode: 400,
      message: '批次指派最多 50 位會友',
    });
  }

  if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
    throw createError({
      statusCode: 400,
      message: '缺少角色 ID 列表',
    });
  }

  try {
    const result = await memberService.batchUpdateMemberRoles(memberIds, roleIds, mode);

    // 批次清除 UserContext 快取
    await Promise.all(memberIds.map(id => clearUserContextCache(id)));

    return result;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '批次指派失敗',
    });
  }
});
```

### 4.2 Service Layer (New Methods)

**`server/services/member.service.ts` (新增方法)**

```typescript
/**
 * 更新會友角色
 */
async updateMemberRoles(memberId: string, roleIds: string[]): Promise<void> {
  // 檢查會友是否存在
  const member = await memberRepository.findById(memberId);
  if (!member) {
    throw createError({ statusCode: 404, message: '找不到該會友' });
  }

  // 驗證至少有一個角色
  if (roleIds.length === 0) {
    throw createError({
      statusCode: 400,
      message: '每位會友至少需要一個角色',
    });
  }

  // 驗證角色是否存在
  const roles = await roleRepository.findByIds(roleIds);
  if (roles.length !== roleIds.length) {
    throw createError({
      statusCode: 400,
      message: '部分角色不存在',
    });
  }

  // 更新會友角色
  await memberRepository.update(memberId, { roleIds });

  // 寫入 Audit Log（預留給 ST027）
  // await auditService.logRoleChange({
  //   operatorId: userContext.userId,
  //   memberId,
  //   oldRoleIds: member.roleIds,
  //   newRoleIds: roleIds,
  // });
}

/**
 * 批次更新會友角色
 */
async batchUpdateMemberRoles(
  memberIds: string[],
  roleIds: string[],
  mode: 'add' | 'replace'
): Promise<{ successCount: number; failedCount: number; errors: Array<{ memberId: string; error: string }> }> {
  // 驗證角色是否存在
  const roles = await roleRepository.findByIds(roleIds);
  if (roles.length !== roleIds.length) {
    throw createError({
      statusCode: 400,
      message: '部分角色不存在',
    });
  }

  const errors: Array<{ memberId: string; error: string }> = [];

  // 批次更新
  for (const memberId of memberIds) {
    try {
      const member = await memberRepository.findById(memberId);
      if (!member) {
        errors.push({ memberId, error: '會友不存在' });
        continue;
      }

      let newRoleIds: string[];
      if (mode === 'add') {
        // 新增模式：保留原有角色，追加新角色
        newRoleIds = [...new Set([...member.roleIds, ...roleIds])];
      } else {
        // 取代模式：移除所有原有角色，僅保留選定角色
        newRoleIds = roleIds;
      }

      await memberRepository.update(memberId, { roleIds: newRoleIds });
    } catch (error: any) {
      errors.push({ memberId, error: error.message });
    }
  }

  return {
    successCount: memberIds.length - errors.length,
    failedCount: errors.length,
    errors,
  };
}
```

### 4.3 Cache Management

**`server/utils/cache.ts` (新增方法)**

```typescript
// 使用 Node Memory Cache 或 Redis
import NodeCache from 'node-cache';

const userContextCache = new NodeCache({ stdTTL: 300 }); // 5 分鐘

/**
 * 清除使用者權限快取
 */
export async function clearUserContextCache(userId: string): Promise<void> {
  const key = `userContext:${userId}`;
  userContextCache.del(key);
  
  // 若使用 Redis
  // await redis.del(key);
}

/**
 * 批次清除使用者權限快取
 */
export async function batchClearUserContextCache(userIds: string[]): Promise<void> {
  const keys = userIds.map(id => `userContext:${id}`);
  userContextCache.del(keys);
  
  // 若使用 Redis
  // await redis.del(...keys);
}
```

### 4.4 Repository Methods (New)

**`server/repositories/role.repository.ts` (新增方法)**

```typescript
/**
 * 根據多個角色 ID 查詢角色
 */
async findByIds(roleIds: string[]): Promise<Role[]> {
  if (roleIds.length === 0) return [];

  const snapshot = await this.db
    .collection(this.collection)
    .where(FieldPath.documentId(), 'in', roleIds)
    .get();

  return snapshot.docs.map(doc => doc.data() as Role);
}

/**
 * 統計擁有某角色的會友數量
 */
async countMembersByRole(roleId: string): Promise<number> {
  const snapshot = await this.db
    .collection('members')
    .where('roleIds', 'array-contains', roleId)
    .count()
    .get();

  return snapshot.data().count;
}
```

---

## 5. Integration with Member Pages

### 5.1 會友編輯頁整合

**`app/pages/members/[id]/edit.vue` (修改)**

在現有的會友編輯頁中，新增「角色管理」Section：

```vue
<template>
  <div class="member-edit-page">
    <!-- ... 現有的內容 ... -->

    <!-- 新增：角色管理 Section -->
    <Card class="mt-6">
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-shield" />
          <span>角色與權限</span>
        </div>
      </template>
      <template #content>
        <MemberRoleManager
          :member="member"
          @update="loadMember"
        />
      </template>
    </Card>
  </div>
</template>
```

### 5.2 會友詳情頁整合

**`app/pages/members/[id]/index.vue` (修改)**

在現有的會友詳情頁中，新增「角色與權限」Tab 或 Section：

```vue
<template>
  <div class="member-detail-page">
    <!-- ... 現有的內容 ... -->

    <!-- 新增：角色與權限 Section -->
    <Card class="mt-6">
      <template #title>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="pi pi-shield" />
            <span>角色與權限</span>
          </div>
          <Button
            v-if="canEditRoles"
            label="編輯角色"
            icon="pi pi-pencil"
            severity="secondary"
            size="small"
            text
            @click="goToEdit"
          />
        </div>
      </template>
      <template #content>
        <MemberRoleManager
          :member="member"
          readonly
        />
      </template>
    </Card>
  </div>
</template>
```

### 5.3 會友列表頁整合

**`app/pages/members/index.vue` (修改)**

新增角色篩選器與角色欄位：

```vue
<template>
  <div class="members-page">
    <!-- 篩選區 -->
    <div class="filters-section">
      <!-- ... 現有的篩選器 ... -->

      <!-- 新增：角色篩選器 -->
      <MultiSelect
        v-model="filters.roleIds"
        :options="allRoles"
        option-label="name"
        option-value="id"
        placeholder="篩選角色"
        filter
        display="chip"
        class="w-full"
      />
    </div>

    <!-- 表格 -->
    <DataTable :value="members" :loading="loading">
      <!-- ... 現有的欄位 ... -->

      <!-- 新增：角色欄位 -->
      <Column header="角色">
        <template #body="{ data }">
          <div class="flex flex-wrap gap-2">
            <Tag
              v-for="roleId in data.roleIds.slice(0, 2)"
              :key="roleId"
              :value="getRoleName(roleId)"
              severity="info"
              size="small"
            />
            <Tag
              v-if="data.roleIds.length > 2"
              :value="`+${data.roleIds.length - 2}`"
              severity="secondary"
              size="small"
              v-tooltip="getRemainingRoles(data.roleIds)"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

**Frontend:**
- `useMemberRole` composable: 測試角色指派、移除、批次指派
- `useRolePreview` composable: 測試角色預覽邏輯

**Backend:**
- `member.service.ts`: 測試角色更新、批次更新、驗證邏輯
- `cache.ts`: 測試快取清除功能

### 6.2 Integration Tests

- API Routes: 測試完整的 Request/Response 流程
- UserContext Cache: 測試快取清除與重新計算

### 6.3 E2E Tests

- 使用 Playwright 測試完整的角色指派流程
- 測試至少一個角色的防呆機制
- 測試批次指派流程

---

## 7. Security & Performance

### 7.1 Security
- **權限檢查**: 所有 API 需檢查 `system:config` 權限
- **角色驗證**: 驗證所有 roleIds 皆為有效的角色
- **至少一個角色**: 防止會友無角色的情況

### 7.2 Performance
- **角色列表快取**: 前端快取角色列表（TTL: 5 分鐘）
- **批次更新**: 使用 Firestore Batch Write
- **快取清除**: 非同步清除，不阻擋主流程

---

## 8. Questions & Clarifications

記錄於 `Questions.md`

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-16  
**Author**: AI Assistant  
**Status**: Draft - Pending Review
