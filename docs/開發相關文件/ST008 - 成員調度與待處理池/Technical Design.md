# ST008 - Technical Design: 成員調度與待處理池

## 1. Overview

### 1.1 Story Reference
- **Story ID**: ST-008
- **Priority**: Must Have (Core Feature)
- **User Story**: As a 行政同工 / 牧區長, I want to 將會友在牧區/小組間調度轉移，並管理尚未歸屬的會友, So that 我能靈活分配會友到合適的牧區與小組，確保所有會友都有明確的歸屬。

### 1.2 Design Goals
1. 實作拖拉分配功能（HTML5 Drag & Drop）
2. 實作點擊分配功能（快速分配對話框）
3. 實作批次分配功能
4. 實作成員轉移功能
5. 實作 Audit Log 寫入（預留查詢介面）

### 1.3 Tech Stack
- **Frontend**: Nuxt 4, Vue 3.5 (Composition API), PrimeVue 4.5, TypeScript
- **Backend**: Nitro (Server Routes), Firebase Admin SDK
- **Database**: Firestore
- **Drag & Drop**: HTML5 Drag & Drop API

---

## 2. Data Models

### 2.1 Transfer Request

```typescript
export interface TransferRequest {
  memberId: string;              // 會友 UUID
  targetZoneId: string;          // 目標牧區 ID
  targetGroupId: string;         // 目標小組 ID
}

export interface BatchTransferRequest {
  memberIds: string[];           // 會友 UUID 列表
  targetZoneId: string;          // 目標牧區 ID
  targetGroupId: string;         // 目標小組 ID
}
```

### 2.2 Transfer Log (Audit, 預留)

```typescript
export interface TransferLog {
  id: string;
  timestamp: Timestamp;
  operatorId: string;            // 操作者 UUID
  operatorName: string;          // 操作者姓名
  memberId: string;              // 會友 UUID
  memberName: string;            // 會友姓名
  operationType: 'assign' | 'transfer' | 'remove';
  from: {
    zoneId?: string;
    zoneName?: string;
    groupId?: string;
    groupName?: string;
  };
  to: {
    zoneId?: string;
    zoneName?: string;
    groupId?: string;
    groupName?: string;
  };
}
```

---

## 3. Frontend Architecture

### 3.1 File Structure

```
app/
├── components/
│   ├── organization/
│   │   ├── PendingMemberCard.vue     # 待處理池會友卡片（支援拖拉）
│   │   ├── QuickAssignDialog.vue    # 快速分配對話框
│   │   ├── BatchAssignDialog.vue    # 批次分配對話框
│   │   ├── TransferDialog.vue       # 轉移對話框
│   │   └── DraggableTreeNode.vue    # 可拖拉的 Tree 節點（Drop Target）
│   └── common/
│       └── ...                       # 通用元件
├── composables/
│   ├── useMemberTransfer.ts          # 會友分配與轉移邏輯
│   ├── useDragAndDrop.ts             # 拖拉功能邏輯
│   └── useZoneGroupSelector.ts       # 牧區小組選擇器邏輯
└── types/
    └── transfer.ts                   # Transfer 相關型別定義
```

### 3.2 Composables

**`app/composables/useMemberTransfer.ts`**

```typescript
import type { TransferRequest, BatchTransferRequest } from '~/types/transfer';

export const useMemberTransfer = () => {
  const toast = useToast();

  // 單一會友分配
  const assignMember = async (request: TransferRequest): Promise<boolean> => {
    try {
      await $fetch('/api/organization/assign-member', {
        method: 'POST',
        body: request,
      });

      toast.add({
        severity: 'success',
        summary: '分配成功',
        detail: '會友已成功分配',
        life: 3000,
      });

      return true;
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: '分配失敗',
        detail: error?.data?.message || '請稍後再試',
        life: 5000,
      });
      return false;
    }
  };

  // 批次分配
  const batchAssignMembers = async (request: BatchTransferRequest): Promise<{
    success: number;
    failed: number;
  }> => {
    try {
      const response = await $fetch<{
        successCount: number;
        failedCount: number;
        errors: Array<{ memberId: string; error: string }>;
      }>('/api/organization/batch-assign', {
        method: 'POST',
        body: request,
      });

      if (response.failedCount > 0) {
        toast.add({
          severity: 'warn',
          summary: '批次分配完成',
          detail: `已成功分配 ${response.successCount} 位會友，${response.failedCount} 位會友分配失敗`,
          life: 5000,
        });
      } else {
        toast.add({
          severity: 'success',
          summary: '批次分配成功',
          detail: `已成功分配 ${response.successCount} 位會友`,
          life: 3000,
        });
      }

      return {
        success: response.successCount,
        failed: response.failedCount,
      };
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: '批次分配失敗',
        detail: error?.data?.message || '請稍後再試',
        life: 5000,
      });
      return { success: 0, failed: request.memberIds.length };
    }
  };

  // 轉移會友
  const transferMember = async (request: TransferRequest): Promise<boolean> => {
    try {
      await $fetch('/api/organization/transfer-member', {
        method: 'POST',
        body: request,
      });

      toast.add({
        severity: 'success',
        summary: '轉移成功',
        detail: '會友已成功轉移',
        life: 3000,
      });

      return true;
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: '轉移失敗',
        detail: error?.data?.message || '請稍後再試',
        life: 5000,
      });
      return false;
    }
  };

  return {
    assignMember,
    batchAssignMembers,
    transferMember,
  };
};
```

**`app/composables/useDragAndDrop.ts`**

```typescript
export const useDragAndDrop = () => {
  // 拖拉資料
  const dragData = ref<{
    memberId: string;
    memberName: string;
  } | null>(null);

  // 開始拖拉
  const onDragStart = (event: DragEvent, memberId: string, memberName: string) => {
    if (!event.dataTransfer) return;

    dragData.value = { memberId, memberName };

    // 設定拖拉資料
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/json', JSON.stringify({ memberId, memberName }));

    // 設定拖拉圖片（可選）
    const dragImage = document.createElement('div');
    dragImage.innerHTML = `<div class="drag-preview">${memberName}</div>`;
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    event.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // 清理
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  // 結束拖拉
  const onDragEnd = () => {
    dragData.value = null;
  };

  // Drag Over (目標節點)
  const onDragOver = (event: DragEvent, nodeType: 'zone' | 'group') => {
    event.preventDefault();
    
    if (!event.dataTransfer) return;

    // 僅小組節點可放置
    if (nodeType === 'group') {
      event.dataTransfer.dropEffect = 'move';
    } else {
      event.dataTransfer.dropEffect = 'none';
    }
  };

  // Drop (目標節點)
  const onDrop = (event: DragEvent, targetZoneId: string, targetGroupId: string): {
    memberId: string;
    memberName: string;
    targetZoneId: string;
    targetGroupId: string;
  } | null => {
    event.preventDefault();
    
    if (!event.dataTransfer) return null;

    try {
      const data = JSON.parse(event.dataTransfer.getData('application/json'));
      return {
        memberId: data.memberId,
        memberName: data.memberName,
        targetZoneId,
        targetGroupId,
      };
    } catch (error) {
      console.error('Failed to parse drop data:', error);
      return null;
    }
  };

  return {
    dragData,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
  };
};
```

**`app/composables/useZoneGroupSelector.ts`**

```typescript
import type { Zone, Group } from '~/types/organization';

export const useZoneGroupSelector = () => {
  const zones = ref<Zone[]>([]);
  const groups = ref<Group[]>([]);
  const filteredGroups = ref<Group[]>([]);

  // 載入牧區列表
  const loadZones = async () => {
    try {
      const response = await $fetch<{ zones: Zone[] }>('/api/organization/zones', {
        query: { status: 'Active', limit: 1000 },
      });
      zones.value = response.zones;
    } catch (error) {
      console.error('Failed to load zones:', error);
    }
  };

  // 載入所有小組
  const loadGroups = async () => {
    try {
      const response = await $fetch<{ groups: Group[] }>('/api/organization/groups', {
        query: { type: 'Pastoral', status: 'Active', limit: 1000 },
      });
      groups.value = response.groups;
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  // 根據牧區篩選小組
  const filterGroupsByZone = (zoneId: string | null) => {
    if (!zoneId) {
      filteredGroups.value = [];
      return;
    }

    filteredGroups.value = groups.value.filter(g => g.parentZoneId === zoneId);
  };

  // Watch zoneId 變化
  const watchZoneChange = (zoneIdRef: Ref<string | null>, groupIdRef: Ref<string | null>) => {
    watch(zoneIdRef, (newZoneId, oldZoneId) => {
      if (newZoneId !== oldZoneId) {
        groupIdRef.value = null;
        filterGroupsByZone(newZoneId);
      }
    });
  };

  return {
    zones,
    groups,
    filteredGroups,
    loadZones,
    loadGroups,
    filterGroupsByZone,
    watchZoneChange,
  };
};
```

### 3.3 Component Design

**`app/components/organization/PendingMemberCard.vue`**

```vue
<script setup lang="ts">
import type { PendingMember } from '~/types/organization';
import { useDragAndDrop } from '~/composables/useDragAndDrop';

const props = defineProps<{
  member: PendingMember;
}>();

const emit = defineEmits<{
  click: [];
}>();

const { onDragStart, onDragEnd } = useDragAndDrop();

const handleDragStart = (event: DragEvent) => {
  onDragStart(event, props.member.uuid, props.member.fullName);
};

const handleDragEnd = () => {
  onDragEnd();
};
</script>

<template>
  <div
    class="pending-member-card"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @click="emit('click')"
  >
    <div class="flex items-center gap-3 p-3 cursor-move hover:bg-slate-50 rounded border">
      <Avatar
        :image="member.avatar"
        :label="member.fullName[0]"
        shape="circle"
      />
      <div class="flex-1">
        <div class="font-semibold">{{ member.fullName }}</div>
        <div class="text-sm text-slate-500">
          {{ member.mobile }} | {{ member.email }}
        </div>
      </div>
      <div>
        <Tag
          v-if="member.baptismStatus"
          severity="success"
          value="已受洗"
          size="small"
        />
        <Tag
          v-else
          severity="warn"
          value="小組友"
          size="small"
        />
      </div>
      <i class="pi pi-bars text-slate-400" />
    </div>
  </div>
</template>

<style scoped>
.pending-member-card {
  user-select: none;
}

.pending-member-card:active {
  opacity: 0.5;
}
</style>
```

**`app/components/organization/QuickAssignDialog.vue`**

```vue
<script setup lang="ts">
import type { PendingMember } from '~/types/organization';
import { useMemberTransfer } from '~/composables/useMemberTransfer';
import { useZoneGroupSelector } from '~/composables/useZoneGroupSelector';

const props = defineProps<{
  member: PendingMember;
  visible: boolean;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  success: [];
}>();

const { assignMember } = useMemberTransfer();
const { zones, filteredGroups, loadZones, loadGroups, filterGroupsByZone, watchZoneChange } = useZoneGroupSelector();

// 表單資料
const selectedZoneId = ref<string | null>(null);
const selectedGroupId = ref<string | null>(null);
const submitting = ref(false);

// 載入資料
onMounted(async () => {
  await Promise.all([loadZones(), loadGroups()]);
});

// Watch 牧區變化
watchZoneChange(selectedZoneId, selectedGroupId);

// 提交分配
const onSubmit = async () => {
  if (!selectedZoneId.value || !selectedGroupId.value) {
    return;
  }

  submitting.value = true;
  const success = await assignMember({
    memberId: props.member.uuid,
    targetZoneId: selectedZoneId.value,
    targetGroupId: selectedGroupId.value,
  });
  submitting.value = false;

  if (success) {
    emit('update:visible', false);
    emit('success');
  }
};

// 關閉對話框
const onClose = () => {
  emit('update:visible', false);
  selectedZoneId.value = null;
  selectedGroupId.value = null;
};
</script>

<template>
  <Dialog
    :visible="visible"
    :header="`分配會友：${member.fullName}`"
    :modal="true"
    :closable="true"
    :style="{ width: '500px' }"
    @update:visible="onClose"
  >
    <div class="flex flex-col gap-4">
      <!-- 會友資訊 -->
      <div class="flex items-center gap-3 p-3 bg-slate-50 rounded">
        <Avatar
          :image="member.avatar"
          :label="member.fullName[0]"
          shape="circle"
          size="large"
        />
        <div>
          <div class="font-semibold text-lg">{{ member.fullName }}</div>
          <div class="text-sm text-slate-600">
            <Tag
              v-if="member.baptismStatus"
              severity="success"
              value="已受洗"
              size="small"
            />
            <Tag
              v-else
              severity="warn"
              value="小組友"
              size="small"
            />
          </div>
        </div>
      </div>

      <!-- 牧區選擇 -->
      <div>
        <label class="block mb-2 font-semibold">牧區 *</label>
        <Select
          v-model="selectedZoneId"
          :options="zones"
          option-label="name"
          option-value="id"
          placeholder="請選擇牧區"
          filter
          show-clear
          class="w-full"
        />
      </div>

      <!-- 小組選擇 -->
      <div>
        <label class="block mb-2 font-semibold">小組 *</label>
        <Select
          v-model="selectedGroupId"
          :options="filteredGroups"
          option-label="name"
          option-value="id"
          :placeholder="selectedZoneId ? '請選擇小組' : '請先選擇牧區'"
          :disabled="!selectedZoneId"
          filter
          show-clear
          class="w-full"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="取消"
          severity="secondary"
          outlined
          @click="onClose"
        />
        <Button
          label="確定分配"
          severity="primary"
          :disabled="!selectedZoneId || !selectedGroupId"
          :loading="submitting"
          @click="onSubmit"
        />
      </div>
    </template>
  </Dialog>
</template>
```

**`app/components/organization/DraggableTreeNode.vue`**

```vue
<script setup lang="ts">
import type { TreeNode } from '~/types/organization';
import { useDragAndDrop } from '~/composables/useDragAndDrop';
import { useMemberTransfer } from '~/composables/useMemberTransfer';

const props = defineProps<{
  node: TreeNode;
}>();

const emit = defineEmits<{
  success: [];
}>();

const { onDragOver, onDrop } = useDragAndDrop();
const { assignMember } = useMemberTransfer();

const isDragOver = ref(false);
const canDrop = computed(() => props.node.type === 'group');

const handleDragOver = (event: DragEvent) => {
  onDragOver(event, props.node.type);
  isDragOver.value = canDrop.value;
};

const handleDragLeave = () => {
  isDragOver.value = false;
};

const handleDrop = async (event: DragEvent) => {
  isDragOver.value = false;

  if (props.node.type !== 'group') {
    // 不能放置到牧區節點
    return;
  }

  const dropData = onDrop(
    event,
    props.node.data.parentZoneId,
    props.node.data.id
  );

  if (!dropData) return;

  // 執行分配
  const success = await assignMember({
    memberId: dropData.memberId,
    targetZoneId: dropData.targetZoneId,
    targetGroupId: dropData.targetGroupId,
  });

  if (success) {
    emit('success');
  }
};
</script>

<template>
  <div
    class="tree-node-drop-target"
    :class="{
      'drag-over': isDragOver && canDrop,
      'drag-over-invalid': isDragOver && !canDrop,
    }"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <slot />
  </div>
</template>

<style scoped>
.tree-node-drop-target {
  transition: background-color 0.2s;
}

.drag-over {
  background-color: rgba(34, 197, 94, 0.1);
  border: 2px dashed #22c55e;
}

.drag-over-invalid {
  background-color: rgba(239, 68, 68, 0.1);
  border: 2px dashed #ef4444;
}
</style>
```

---

## 4. Backend Architecture

### 4.1 API Routes

#### POST /api/organization/assign-member

**`server/api/organization/assign-member.post.ts`**

```typescript
import { memberService } from '~/server/services/member.service';
import { requirePermission } from '~/server/utils/permission';

export default defineEventHandler(async (event) => {
  // 權限檢查: member:edit + org:manage
  requirePermission(event, 'member:edit');
  requirePermission(event, 'org:manage');

  const body = await readBody(event);
  const { memberId, targetZoneId, targetGroupId } = body;

  // 驗證
  if (!memberId || !targetZoneId || !targetGroupId) {
    throw createError({
      statusCode: 400,
      message: '缺少必要參數',
    });
  }

  try {
    await memberService.assignMember(memberId, targetZoneId, targetGroupId, event.context.userContext);

    return { success: true };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '分配失敗',
    });
  }
});
```

#### POST /api/organization/batch-assign

**`server/api/organization/batch-assign.post.ts`**

```typescript
import { memberService } from '~/server/services/member.service';
import { requirePermission } from '~/server/utils/permission';

export default defineEventHandler(async (event) => {
  // 權限檢查: member:edit + org:manage
  requirePermission(event, 'member:edit');
  requirePermission(event, 'org:manage');

  const body = await readBody(event);
  const { memberIds, targetZoneId, targetGroupId } = body;

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
      message: '批次分配最多 50 位會友',
    });
  }

  if (!targetZoneId || !targetGroupId) {
    throw createError({
      statusCode: 400,
      message: '缺少目標牧區或小組',
    });
  }

  try {
    const result = await memberService.batchAssignMembers(
      memberIds,
      targetZoneId,
      targetGroupId,
      event.context.userContext
    );

    return result;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '批次分配失敗',
    });
  }
});
```

#### POST /api/organization/transfer-member

**`server/api/organization/transfer-member.post.ts`**

```typescript
import { memberService } from '~/server/services/member.service';
import { requirePermission } from '~/server/utils/permission';

export default defineEventHandler(async (event) => {
  // 權限檢查: member:edit + org:manage
  requirePermission(event, 'member:edit');
  requirePermission(event, 'org:manage');

  const body = await readBody(event);
  const { memberId, targetZoneId, targetGroupId } = body;

  // 驗證
  if (!memberId || !targetZoneId || !targetGroupId) {
    throw createError({
      statusCode: 400,
      message: '缺少必要參數',
    });
  }

  try {
    await memberService.transferMember(memberId, targetZoneId, targetGroupId, event.context.userContext);

    return { success: true };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '轉移失敗',
    });
  }
});
```

### 4.2 Service Layer (New Methods)

**`server/services/member.service.ts` (新增方法)**

```typescript
/**
 * 分配會友到牧區與小組
 */
async assignMember(
  memberId: string,
  targetZoneId: string,
  targetGroupId: string,
  userContext: UserContext
): Promise<void> {
  // 檢查會友是否存在
  const member = await memberRepository.findById(memberId);
  if (!member) {
    throw createError({ statusCode: 404, message: '找不到該會友' });
  }

  // 檢查牧區是否存在且啟用
  const zone = await zoneRepository.findById(targetZoneId);
  if (!zone || zone.status !== 'Active') {
    throw createError({ statusCode: 400, message: '目標牧區不存在或已停用' });
  }

  // 檢查小組是否存在且啟用
  const group = await groupRepository.findById(targetGroupId);
  if (!group || group.status !== 'Active') {
    throw createError({ statusCode: 400, message: '目標小組不存在或已停用' });
  }

  // 驗證小組是否屬於該牧區
  if (group.parentZoneId !== targetZoneId) {
    throw createError({ statusCode: 400, message: '小組不屬於該牧區' });
  }

  // 權限檢查（Zone Scope 僅能分配到自己的牧區）
  if (userContext.scope === 'Zone' && userContext.managedZoneId !== targetZoneId) {
    throw createError({ statusCode: 403, message: '無權限分配到其他牧區' });
  }

  // 更新會友
  await memberRepository.update(memberId, {
    zoneId: targetZoneId,
    groupId: targetGroupId,
  });

  // 寫入 Audit Log（預留）
  // await auditService.logTransfer({
  //   operatorId: userContext.userId,
  //   memberId,
  //   operationType: 'assign',
  //   to: { zoneId: targetZoneId, groupId: targetGroupId },
  // });
}

/**
 * 批次分配會友
 */
async batchAssignMembers(
  memberIds: string[],
  targetZoneId: string,
  targetGroupId: string,
  userContext: UserContext
): Promise<{ successCount: number; failedCount: number; errors: Array<{ memberId: string; error: string }> }> {
  // 檢查牧區與小組（同 assignMember）
  const zone = await zoneRepository.findById(targetZoneId);
  if (!zone || zone.status !== 'Active') {
    throw createError({ statusCode: 400, message: '目標牧區不存在或已停用' });
  }

  const group = await groupRepository.findById(targetGroupId);
  if (!group || group.status !== 'Active') {
    throw createError({ statusCode: 400, message: '目標小組不存在或已停用' });
  }

  if (group.parentZoneId !== targetZoneId) {
    throw createError({ statusCode: 400, message: '小組不屬於該牧區' });
  }

  // 權限檢查
  if (userContext.scope === 'Zone' && userContext.managedZoneId !== targetZoneId) {
    throw createError({ statusCode: 403, message: '無權限分配到其他牧區' });
  }

  // 批次更新（使用 Firestore Batch）
  const results = await memberRepository.batchUpdate(memberIds, {
    zoneId: targetZoneId,
    groupId: targetGroupId,
  });

  return results;
}

/**
 * 轉移會友到其他牧區/小組
 */
async transferMember(
  memberId: string,
  targetZoneId: string,
  targetGroupId: string,
  userContext: UserContext
): Promise<void> {
  // 檢查會友是否存在
  const member = await memberRepository.findById(memberId);
  if (!member) {
    throw createError({ statusCode: 404, message: '找不到該會友' });
  }

  // 記錄原歸屬（用於 Audit Log）
  const fromZoneId = member.zoneId;
  const fromGroupId = member.groupId;

  // 執行分配（邏輯同 assignMember）
  await this.assignMember(memberId, targetZoneId, targetGroupId, userContext);

  // 寫入 Audit Log（預留）
  // await auditService.logTransfer({
  //   operatorId: userContext.userId,
  //   memberId,
  //   operationType: 'transfer',
  //   from: { zoneId: fromZoneId, groupId: fromGroupId },
  //   to: { zoneId: targetZoneId, groupId: targetGroupId },
  // });
}
```

### 4.3 Repository Methods (New)

**`server/repositories/member.repository.ts` (新增方法)**

```typescript
/**
 * 批次更新會友（使用 Firestore Batch）
 */
async batchUpdate(
  memberIds: string[],
  data: Partial<Member>
): Promise<{ successCount: number; failedCount: number; errors: Array<{ memberId: string; error: string }> }> {
  const batch = this.db.batch();
  const errors: Array<{ memberId: string; error: string }> = [];

  for (const memberId of memberIds) {
    try {
      const docRef = this.db.collection(this.collection).doc(memberId);
      const updateData = {
        ...data,
        updatedAt: Timestamp.now(),
      };
      batch.update(docRef, updateData);
    } catch (error: any) {
      errors.push({ memberId, error: error.message });
    }
  }

  await batch.commit();

  return {
    successCount: memberIds.length - errors.length,
    failedCount: errors.length,
    errors,
  };
}
```

---

## 5. Testing & Performance

### 5.1 Performance Optimization
- **Firestore Batch Write**: 批次分配使用 Batch Write，最多 500 筆/次
- **拖拉防抖**: 拖拉事件使用 debounce，避免頻繁觸發

### 5.2 Testing Strategy
- **Unit Tests**: 測試 composables 的邏輯
- **E2E Tests**: 測試拖拉分配、點擊分配、批次分配流程

---

## 6. Questions & Clarifications

記錄於 `Questions.md`

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-16  
**Author**: AI Assistant  
**Status**: Draft - Pending Review
