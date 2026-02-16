# ST006 - Technical Design: 牧區與小組管理

## 1. Overview

### 1.1 Story Reference
- **Story ID**: ST-006
- **Priority**: Must Have (Core Feature)
- **User Story**: As a 行政同工 / 牧區長, I want to 建立、編輯、刪除牧區與小組，並指派負責的牧區長與小組長, So that 系統能夠維護完整的組織架構，並支援後續的成員管理與權限控制。

### 1.2 Design Goals
1. 建立完整的牧區與小組 CRUD 功能
2. 實作牧區與小組的階層關係驗證
3. 支援 Leader 指派與角色檢查
4. 實作刪除前的資料一致性檢查
5. 整合 RBAC 權限控制

### 1.3 Tech Stack
- **Frontend**: Nuxt 4, Vue 3.5 (Composition API), PrimeVue 4.5, TypeScript
- **Backend**: Nitro (Server Routes), Firebase Admin SDK
- **Database**: Firestore
- **Validation**: Zod
- **State Management**: Pinia (composables)

---

## 2. Data Schema Design

### 2.1 Database Schema (Firebase Collections)

#### Collection: `zones` (牧區)

```typescript
interface Zone {
  id: string;                      // PK, 由 Firebase 自動生成
  name: string;                    // 牧區名稱 (必填, 唯一值)
  leaderId?: string;               // 牧區長 UUID (FK 指向 members, 選填)
  leaderName?: string;             // 牧區長姓名 (快取, 選填)
  description?: string;            // 牧區描述 (選填)
  status: 'Active' | 'Inactive';   // 狀態 (預設 Active)
  
  // 系統欄位
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;              // 建立者 UUID (預留)
  updatedBy?: string;              // 更新者 UUID (預留)
}
```

#### Collection: `groups` (小組與功能性群組)

```typescript
interface Group {
  id: string;                      // PK, 由 Firebase 自動生成
  name: string;                    // 小組名稱 (必填)
  type: 'Pastoral' | 'Functional'; // 群組類型 (預設 Pastoral)
  parentZoneId?: string;           // 所屬牧區 ID (FK, 僅 Pastoral 需要)
  leaderId?: string;               // 小組長 UUID (FK 指向 members, 選填)
  leaderName?: string;             // 小組長姓名 (快取, 選填)
  description?: string;            // 小組描述 (選填)
  status: 'Active' | 'Inactive';   // 狀態 (預設 Active)
  
  // 系統欄位
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;              // 建立者 UUID (預留)
  updatedBy?: string;              // 更新者 UUID (預留)
}
```

### 2.2 Validation Rules

#### 2.2.1 Zone Validation
- **name**: 必填，唯一值（不區分大小寫），2-50 字元
- **leaderId**: 選填，必須是有效的 member UUID
- **status**: 必填，預設 'Active'

#### 2.2.2 Group Validation
- **name**: 必填，2-50 字元，同牧區內唯一
- **type**: 必填，預設 'Pastoral'
- **parentZoneId**: 當 `type = 'Pastoral'` 時必填，當 `type = 'Functional'` 時必須為空
- **leaderId**: 選填，必須是有效的 member UUID，且該會友的 `zoneId` 必須等於 `parentZoneId`（僅限 Pastoral 小組）
- **status**: 必填，預設 'Active'

#### 2.2.3 Business Logic Validation
- **刪除牧區前檢查**: 
  - 若有啟用的小組 (`groups.status = 'Active' AND groups.parentZoneId = zoneId`)，禁止刪除
  - 若有會友 (`members.zoneId = zoneId`)，顯示警告但允許刪除（會友變為未分區）
- **刪除小組前檢查**: 
  - 若有會友 (`members.groupId = groupId`)，顯示警告但允許刪除（會友變為未分組）
- **轉移小組至其他牧區**: 
  - 自動更新該小組所有成員的 `zoneId` 為新牧區的 ID

---

## 3. Frontend Architecture

### 3.1 File Structure

```
app/
├── components/
│   ├── organization/
│   │   ├── ZoneForm.vue          # 牧區表單（Create/Edit）
│   │   ├── GroupForm.vue         # 小組表單（Create/Edit）
│   │   ├── ZoneCard.vue          # 牧區卡片
│   │   ├── GroupCard.vue         # 小組卡片
│   │   ├── LeaderSelector.vue   # Leader 選擇器
│   │   └── DeleteConfirmDialog.vue # 刪除確認對話框
│   └── common/
│       └── ...                   # 通用元件
├── pages/
│   └── organization/
│       ├── zones/
│       │   ├── index.vue         # 牧區列表頁
│       │   ├── create.vue        # 新增牧區頁
│       │   └── [id]/
│       │       └── edit.vue      # 編輯牧區頁
│       └── groups/
│           ├── index.vue         # 小組列表頁
│           ├── create.vue        # 新增小組頁
│           └── [id]/
│               └── edit.vue      # 編輯小組頁
├── composables/
│   ├── useZone.ts                # 牧區 CRUD 邏輯
│   ├── useGroup.ts               # 小組 CRUD 邏輯
│   └── useOrganization.ts        # 組織架構通用邏輯
├── utils/
│   └── organization/
│       ├── zoneFormDef.ts        # 牧區表單定義
│       ├── groupFormDef.ts       # 小組表單定義
│       └── schema.ts             # Zod Schema
└── types/
    └── organization.ts           # Zone & Group 型別定義
```

### 3.2 Type Definitions

**`app/types/organization.ts`**

```typescript
import type { Timestamp } from 'firebase/firestore';

export type ZoneStatus = 'Active' | 'Inactive';
export type GroupStatus = 'Active' | 'Inactive';
export type GroupType = 'Pastoral' | 'Functional';

export interface Zone {
  id: string;
  name: string;
  leaderId?: string;
  leaderName?: string;
  description?: string;
  status: ZoneStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
  updatedBy?: string;
}

export interface Group {
  id: string;
  name: string;
  type: GroupType;
  parentZoneId?: string;
  leaderId?: string;
  leaderName?: string;
  description?: string;
  status: GroupStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
  updatedBy?: string;
}

// 帶有統計資訊的 Zone
export interface ZoneWithStats extends Zone {
  groupCount: number;    // 小組數量
  memberCount: number;   // 成員數量
}

// 帶有統計資訊的 Group
export interface GroupWithStats extends Group {
  zoneName?: string;     // 所屬牧區名稱
  memberCount: number;   // 成員數量
}

// Leader 候選人
export interface LeaderCandidate {
  uuid: string;
  fullName: string;
  baptismStatus: boolean;
  zoneId?: string;
  groupId?: string;
  hasZoneLeaderRole: boolean;   // 是否有牧區長角色
  hasGroupLeaderRole: boolean;  // 是否有小組長角色
}

// 刪除前檢查結果
export interface DeleteCheckResult {
  canDelete: boolean;
  hasActiveGroups?: number;     // 啟用的小組數量（僅牧區）
  hasMembersCount?: number;     // 成員數量
  warnings: string[];           // 警告訊息
  errors: string[];             // 錯誤訊息（禁止刪除的原因）
}
```

### 3.3 Zod Schema & Validation

**`app/utils/organization/schema.ts`**

```typescript
import { z } from 'zod';

// 牧區 Schema
export const zoneSchema = z.object({
  name: z.string()
    .min(2, '牧區名稱至少需要 2 個字')
    .max(50, '牧區名稱不能超過 50 個字'),
  leaderId: z.string().optional(),
  description: z.string().max(500, '描述不能超過 500 個字').optional(),
  status: z.enum(['Active', 'Inactive']).default('Active'),
});

export type ZoneFormValues = z.infer<typeof zoneSchema>;

// 小組 Schema
export const groupSchema = z.object({
  name: z.string()
    .min(2, '小組名稱至少需要 2 個字')
    .max(50, '小組名稱不能超過 50 個字'),
  type: z.enum(['Pastoral', 'Functional']).default('Pastoral'),
  parentZoneId: z.string().optional(),
  leaderId: z.string().optional(),
  description: z.string().max(500, '描述不能超過 500 個字').optional(),
  status: z.enum(['Active', 'Inactive']).default('Active'),
}).refine(
  data => data.type !== 'Pastoral' || data.parentZoneId,
  {
    message: '牧養小組必須選擇所屬牧區',
    path: ['parentZoneId'],
  }
).refine(
  data => data.type !== 'Functional' || !data.parentZoneId,
  {
    message: '功能性小組不應設定所屬牧區',
    path: ['parentZoneId'],
  }
);

export type GroupFormValues = z.infer<typeof groupSchema>;
```

### 3.4 Composables

**`app/composables/useZone.ts`**

```typescript
import type { Zone, ZoneWithStats, ZoneFormValues, DeleteCheckResult, LeaderCandidate } from '~/types/organization';

export const useZone = () => {
  const toast = useToast();

  // 建立牧區
  const createZone = async (data: ZoneFormValues): Promise<Zone | null> => {
    try {
      const response = await $fetch<Zone>('/api/organization/zones', {
        method: 'POST',
        body: data,
      });

      toast.add({
        severity: 'success',
        summary: '建立成功',
        detail: '牧區已建立',
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

  // 更新牧區
  const updateZone = async (id: string, data: Partial<ZoneFormValues>): Promise<Zone | null> => {
    try {
      const response = await $fetch<Zone>(`/api/organization/zones/${id}`, {
        method: 'PATCH',
        body: data,
      });

      toast.add({
        severity: 'success',
        summary: '更新成功',
        detail: '牧區資料已更新',
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

  // 取得牧區列表
  const fetchZones = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) => {
    return await $fetch<{
      zones: ZoneWithStats[];
      total: number;
      page: number;
      limit: number;
    }>('/api/organization/zones', {
      method: 'GET',
      query: params,
    });
  };

  // 取得單一牧區
  const fetchZoneById = async (id: string): Promise<ZoneWithStats | null> => {
    try {
      return await $fetch<ZoneWithStats>(`/api/organization/zones/${id}`);
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: '取得失敗',
        detail: '無法取得牧區資料',
        life: 5000,
      });
      return null;
    }
  };

  // 刪除前檢查
  const checkBeforeDelete = async (id: string): Promise<DeleteCheckResult | null> => {
    try {
      return await $fetch<DeleteCheckResult>(`/api/organization/zones/${id}/check-delete`);
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: '檢查失敗',
        detail: '無法檢查刪除條件',
        life: 5000,
      });
      return null;
    }
  };

  // 刪除牧區
  const deleteZone = async (id: string): Promise<boolean> => {
    try {
      await $fetch(`/api/organization/zones/${id}`, {
        method: 'DELETE',
      });

      toast.add({
        severity: 'success',
        summary: '刪除成功',
        detail: '牧區已刪除',
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

  // 取得 Leader 候選人（可當牧區長的會友）
  const fetchLeaderCandidates = async (): Promise<LeaderCandidate[]> => {
    try {
      return await $fetch<LeaderCandidate[]>('/api/organization/zones/leader-candidates');
    } catch (error) {
      console.error('Failed to fetch leader candidates:', error);
      return [];
    }
  };

  return {
    createZone,
    updateZone,
    fetchZones,
    fetchZoneById,
    checkBeforeDelete,
    deleteZone,
    fetchLeaderCandidates,
  };
};
```

**`app/composables/useGroup.ts`**

```typescript
import type { Group, GroupWithStats, GroupFormValues, DeleteCheckResult, LeaderCandidate } from '~/types/organization';

export const useGroup = () => {
  const toast = useToast();

  // 建立小組
  const createGroup = async (data: GroupFormValues): Promise<Group | null> => {
    try {
      const response = await $fetch<Group>('/api/organization/groups', {
        method: 'POST',
        body: data,
      });

      toast.add({
        severity: 'success',
        summary: '建立成功',
        detail: '小組已建立',
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

  // 更新小組
  const updateGroup = async (id: string, data: Partial<GroupFormValues>): Promise<Group | null> => {
    try {
      const response = await $fetch<Group>(`/api/organization/groups/${id}`, {
        method: 'PATCH',
        body: data,
      });

      toast.add({
        severity: 'success',
        summary: '更新成功',
        detail: '小組資料已更新',
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

  // 取得小組列表
  const fetchGroups = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    zoneId?: string;
    type?: string;
    status?: string;
  }) => {
    return await $fetch<{
      groups: GroupWithStats[];
      total: number;
      page: number;
      limit: number;
    }>('/api/organization/groups', {
      method: 'GET',
      query: params,
    });
  };

  // 取得單一小組
  const fetchGroupById = async (id: string): Promise<GroupWithStats | null> => {
    try {
      return await $fetch<GroupWithStats>(`/api/organization/groups/${id}`);
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: '取得失敗',
        detail: '無法取得小組資料',
        life: 5000,
      });
      return null;
    }
  };

  // 刪除前檢查
  const checkBeforeDelete = async (id: string): Promise<DeleteCheckResult | null> => {
    try {
      return await $fetch<DeleteCheckResult>(`/api/organization/groups/${id}/check-delete`);
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: '檢查失敗',
        detail: '無法檢查刪除條件',
        life: 5000,
      });
      return null;
    }
  };

  // 刪除小組
  const deleteGroup = async (id: string): Promise<boolean> => {
    try {
      await $fetch(`/api/organization/groups/${id}`, {
        method: 'DELETE',
      });

      toast.add({
        severity: 'success',
        summary: '刪除成功',
        detail: '小組已刪除',
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

  // 取得 Leader 候選人（該牧區的會友）
  const fetchLeaderCandidates = async (zoneId: string): Promise<LeaderCandidate[]> => {
    try {
      return await $fetch<LeaderCandidate[]>(`/api/organization/groups/leader-candidates`, {
        query: { zoneId },
      });
    } catch (error) {
      console.error('Failed to fetch leader candidates:', error);
      return [];
    }
  };

  return {
    createGroup,
    updateGroup,
    fetchGroups,
    fetchGroupById,
    checkBeforeDelete,
    deleteGroup,
    fetchLeaderCandidates,
  };
};
```

### 3.5 Component Design

**`app/components/organization/ZoneForm.vue`**

```vue
<script setup lang="ts">
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { zoneSchema, type ZoneFormValues } from '~/utils/organization/schema';
import type { Zone, LeaderCandidate } from '~/types/organization';

const props = defineProps<{
  zone?: Zone;           // 編輯模式時傳入
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [data: ZoneFormValues];
}>();

// 表單資料
const formData = ref<Partial<ZoneFormValues>>(
  props.zone || {
    status: 'Active',
  }
);

// Leader 候選人
const { fetchLeaderCandidates } = useZone();
const leaderCandidates = ref<LeaderCandidate[]>([]);

onMounted(async () => {
  leaderCandidates.value = await fetchLeaderCandidates();
});

// 提交表單
const onFormSubmit = (e: any) => {
  if (e.valid) {
    emit('submit', e.values as ZoneFormValues);
  }
};
</script>

<template>
  <div class="zone-form">
    <Form
      :initial-values="formData"
      :resolver="zodResolver(zoneSchema)"
      @submit="onFormSubmit"
    >
      <!-- 牧區名稱 -->
      <Field name="name" v-slot="{ field, errorMessage }">
        <FloatLabel>
          <InputText
            v-bind="field"
            :invalid="!!errorMessage"
            class="w-full"
          />
          <label>牧區名稱 *</label>
        </FloatLabel>
        <small v-if="errorMessage" class="text-red-500">{{ errorMessage }}</small>
      </Field>

      <!-- 牧區長 -->
      <Field name="leaderId" v-slot="{ field, errorMessage }">
        <FloatLabel>
          <Select
            v-bind="field"
            :options="leaderCandidates"
            option-label="fullName"
            option-value="uuid"
            filter
            show-clear
            :invalid="!!errorMessage"
            class="w-full"
          >
            <template #option="{ option }">
              <div class="flex items-center gap-2">
                <span>{{ option.fullName }}</span>
                <Tag
                  v-if="option.baptismStatus"
                  severity="success"
                  value="已受洗"
                  size="small"
                />
                <Tag
                  v-if="option.hasZoneLeaderRole"
                  severity="info"
                  value="牧區長"
                  size="small"
                />
              </div>
            </template>
          </Select>
          <label>牧區長</label>
        </FloatLabel>
        <small v-if="errorMessage" class="text-red-500">{{ errorMessage }}</small>
      </Field>

      <!-- 牧區描述 -->
      <Field name="description" v-slot="{ field, errorMessage }">
        <FloatLabel>
          <Textarea
            v-bind="field"
            rows="3"
            auto-resize
            :invalid="!!errorMessage"
            class="w-full"
          />
          <label>牧區描述</label>
        </FloatLabel>
        <small v-if="errorMessage" class="text-red-500">{{ errorMessage }}</small>
      </Field>

      <!-- 狀態 -->
      <Field name="status" v-slot="{ field }">
        <div class="flex items-center gap-2">
          <ToggleSwitch v-model="field.value" :true-value="'Active'" :false-value="'Inactive'" />
          <label>啟用狀態</label>
        </div>
      </Field>

      <!-- 提交按鈕 -->
      <div class="flex justify-end gap-2">
        <Button
          type="button"
          label="取消"
          severity="secondary"
          outlined
          @click="$router.back()"
        />
        <Button
          type="submit"
          :label="zone ? '儲存變更' : '建立牧區'"
          severity="primary"
          :loading="loading"
        />
      </div>
    </Form>
  </div>
</template>

<style scoped>
.zone-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
```

---

## 4. Backend Architecture

### 4.1 File Structure

```
server/
├── api/
│   └── organization/
│       ├── zones/
│       │   ├── index.get.ts               # GET /api/organization/zones (列表)
│       │   ├── index.post.ts              # POST /api/organization/zones (建立)
│       │   ├── [id].get.ts                # GET /api/organization/zones/:id (單筆)
│       │   ├── [id].patch.ts              # PATCH /api/organization/zones/:id (更新)
│       │   ├── [id].delete.ts             # DELETE /api/organization/zones/:id (刪除)
│       │   ├── [id]/check-delete.get.ts   # GET /api/organization/zones/:id/check-delete
│       │   └── leader-candidates.get.ts   # GET /api/organization/zones/leader-candidates
│       └── groups/
│           ├── index.get.ts               # GET /api/organization/groups (列表)
│           ├── index.post.ts              # POST /api/organization/groups (建立)
│           ├── [id].get.ts                # GET /api/organization/groups/:id (單筆)
│           ├── [id].patch.ts              # PATCH /api/organization/groups/:id (更新)
│           ├── [id].delete.ts             # DELETE /api/organization/groups/:id (刪除)
│           ├── [id]/check-delete.get.ts   # GET /api/organization/groups/:id/check-delete
│           └── leader-candidates.get.ts   # GET /api/organization/groups/leader-candidates
├── services/
│   ├── zone.service.ts            # 牧區業務邏輯
│   └── group.service.ts           # 小組業務邏輯
├── repositories/
│   ├── zone.repository.ts         # 牧區資料存取層
│   └── group.repository.ts        # 小組資料存取層
└── utils/
    ├── validation.ts              # 驗證工具
    └── permission.ts              # 權限檢查工具 (from ST002)
```

### 4.2 Service Layer

**`server/services/zone.service.ts`**

```typescript
import { zoneRepository } from '~/server/repositories/zone.repository';
import { groupRepository } from '~/server/repositories/group.repository';
import { memberRepository } from '~/server/repositories/member.repository';
import type { Zone, ZoneFormValues, ZoneWithStats, DeleteCheckResult, LeaderCandidate } from '~/types/organization';

class ZoneService {
  /**
   * 建立牧區
   */
  async createZone(data: ZoneFormValues): Promise<Zone> {
    // 檢查名稱是否重複
    const existingZone = await zoneRepository.findByName(data.name);
    if (existingZone) {
      throw createError({
        statusCode: 409,
        message: '此牧區名稱已存在',
      });
    }

    // 若有 leaderId，驗證會友是否存在並取得名稱
    let leaderName: string | undefined;
    if (data.leaderId) {
      const leader = await memberRepository.findById(data.leaderId);
      if (!leader) {
        throw createError({
          statusCode: 400,
          message: '找不到該會友',
        });
      }
      leaderName = leader.fullName;
    }

    // 建立牧區
    const zone = await zoneRepository.create({
      ...data,
      leaderName,
    });

    // 若有 leaderId，更新該會友的 zoneId
    if (data.leaderId) {
      await memberRepository.update(data.leaderId, { zoneId: zone.id });
    }

    return zone;
  }

  /**
   * 取得牧區列表（帶統計）
   */
  async getZones(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
  }): Promise<{
    zones: ZoneWithStats[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { zones, total } = await zoneRepository.findAll(params);

    // 計算統計資訊
    const zonesWithStats = await Promise.all(
      zones.map(async (zone) => {
        const groupCount = await groupRepository.countByZone(zone.id, 'Active');
        const memberCount = await memberRepository.countByZone(zone.id);

        return {
          ...zone,
          groupCount,
          memberCount,
        } as ZoneWithStats;
      })
    );

    return {
      zones: zonesWithStats,
      total,
      page: params.page,
      limit: params.limit,
    };
  }

  /**
   * 取得單一牧區（帶統計）
   */
  async getZoneById(id: string): Promise<ZoneWithStats | null> {
    const zone = await zoneRepository.findById(id);
    if (!zone) {
      return null;
    }

    const groupCount = await groupRepository.countByZone(id, 'Active');
    const memberCount = await memberRepository.countByZone(id);

    return {
      ...zone,
      groupCount,
      memberCount,
    } as ZoneWithStats;
  }

  /**
   * 更新牧區
   */
  async updateZone(id: string, data: Partial<ZoneFormValues>): Promise<Zone | null> {
    // 檢查牧區是否存在
    const existingZone = await zoneRepository.findById(id);
    if (!existingZone) {
      return null;
    }

    // 若更新名稱，檢查是否重複
    if (data.name && data.name !== existingZone.name) {
      const duplicateZone = await zoneRepository.findByName(data.name);
      if (duplicateZone) {
        throw createError({
          statusCode: 409,
          message: '此牧區名稱已存在',
        });
      }
    }

    // 若更新 leaderId，驗證會友並取得名稱
    let leaderName: string | undefined;
    if (data.leaderId !== undefined) {
      if (data.leaderId) {
        const leader = await memberRepository.findById(data.leaderId);
        if (!leader) {
          throw createError({
            statusCode: 400,
            message: '找不到該會友',
          });
        }
        leaderName = leader.fullName;

        // 更新該會友的 zoneId
        await memberRepository.update(data.leaderId, { zoneId: id });
      } else {
        leaderName = undefined;
      }

      // 若原本有 Leader，清除其 zoneId（選填：視需求決定）
      // if (existingZone.leaderId && existingZone.leaderId !== data.leaderId) {
      //   await memberRepository.update(existingZone.leaderId, { zoneId: null });
      // }
    }

    // 更新牧區
    const updatedZone = await zoneRepository.update(id, {
      ...data,
      leaderName,
    });

    return updatedZone;
  }

  /**
   * 刪除前檢查
   */
  async checkBeforeDelete(id: string): Promise<DeleteCheckResult> {
    const result: DeleteCheckResult = {
      canDelete: true,
      warnings: [],
      errors: [],
    };

    // 檢查是否有啟用的小組
    const activeGroupCount = await groupRepository.countByZone(id, 'Active');
    if (activeGroupCount > 0) {
      result.canDelete = false;
      result.hasActiveGroups = activeGroupCount;
      result.errors.push(`此牧區下仍有 ${activeGroupCount} 個啟用的小組，請先停用或移除小組`);
    }

    // 檢查是否有會友
    const memberCount = await memberRepository.countByZone(id);
    if (memberCount > 0) {
      result.hasMembersCount = memberCount;
      result.warnings.push(`此牧區下仍有 ${memberCount} 位會友，刪除後會友將變為未分區狀態`);
    }

    return result;
  }

  /**
   * 刪除牧區
   */
  async deleteZone(id: string): Promise<void> {
    const zone = await zoneRepository.findById(id);
    if (!zone) {
      throw createError({
        statusCode: 404,
        message: '找不到該牧區',
      });
    }

    // 執行刪除前檢查
    const checkResult = await this.checkBeforeDelete(id);
    if (!checkResult.canDelete) {
      throw createError({
        statusCode: 400,
        message: checkResult.errors.join(', '),
      });
    }

    // 軟刪除：將狀態改為 Inactive
    await zoneRepository.update(id, { status: 'Inactive' });

    // 將該牧區的會友的 zoneId 和 groupId 設為 null
    await memberRepository.clearZoneForMembers(id);
  }

  /**
   * 取得 Leader 候選人
   */
  async getLeaderCandidates(): Promise<LeaderCandidate[]> {
    // 取得所有啟用的會友
    const members = await memberRepository.findAll({
      page: 1,
      limit: 1000,  // 限制最多 1000 筆
      status: 'Active',
    });

    return members.members.map(member => ({
      uuid: member.uuid,
      fullName: member.fullName,
      baptismStatus: member.baptismStatus,
      zoneId: member.zoneId,
      groupId: member.groupId,
      hasZoneLeaderRole: member.roleIds?.includes('zone_leader') || false,
      hasGroupLeaderRole: member.roleIds?.includes('group_leader') || false,
    }));
  }
}

export const zoneService = new ZoneService();
```

**`server/services/group.service.ts`**

```typescript
import { groupRepository } from '~/server/repositories/group.repository';
import { zoneRepository } from '~/server/repositories/zone.repository';
import { memberRepository } from '~/server/repositories/member.repository';
import type { Group, GroupFormValues, GroupWithStats, DeleteCheckResult, LeaderCandidate } from '~/types/organization';

class GroupService {
  /**
   * 建立小組
   */
  async createGroup(data: GroupFormValues): Promise<Group> {
    // 驗證：Pastoral 小組必須有 parentZoneId
    if (data.type === 'Pastoral' && !data.parentZoneId) {
      throw createError({
        statusCode: 400,
        message: '牧養小組必須選擇所屬牧區',
      });
    }

    // 驗證：Functional 小組不應有 parentZoneId
    if (data.type === 'Functional' && data.parentZoneId) {
      throw createError({
        statusCode: 400,
        message: '功能性小組不應設定所屬牧區',
      });
    }

    // 若有 parentZoneId，驗證牧區是否存在且啟用
    if (data.parentZoneId) {
      const zone = await zoneRepository.findById(data.parentZoneId);
      if (!zone) {
        throw createError({
          statusCode: 400,
          message: '找不到該牧區',
        });
      }
      if (zone.status !== 'Active') {
        throw createError({
          statusCode: 400,
          message: '該牧區已停用',
        });
      }

      // 檢查小組名稱在該牧區內是否重複
      const existingGroup = await groupRepository.findByNameInZone(data.name, data.parentZoneId);
      if (existingGroup) {
        throw createError({
          statusCode: 409,
          message: '此牧區下已有相同名稱的小組',
        });
      }
    }

    // 若有 leaderId，驗證會友並取得名稱
    let leaderName: string | undefined;
    if (data.leaderId) {
      const leader = await memberRepository.findById(data.leaderId);
      if (!leader) {
        throw createError({
          statusCode: 400,
          message: '找不到該會友',
        });
      }

      // 驗證：Pastoral 小組的 Leader 必須在該牧區
      if (data.type === 'Pastoral' && leader.zoneId !== data.parentZoneId) {
        throw createError({
          statusCode: 400,
          message: '小組長必須是該牧區的會友',
        });
      }

      leaderName = leader.fullName;
    }

    // 建立小組
    const group = await groupRepository.create({
      ...data,
      leaderName,
    });

    // 若有 leaderId，更新該會友的 groupId
    if (data.leaderId) {
      await memberRepository.update(data.leaderId, { groupId: group.id });
    }

    return group;
  }

  /**
   * 取得小組列表（帶統計）
   */
  async getGroups(params: {
    page: number;
    limit: number;
    search?: string;
    zoneId?: string;
    type?: string;
    status?: string;
  }): Promise<{
    groups: GroupWithStats[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { groups, total } = await groupRepository.findAll(params);

    // 計算統計資訊
    const groupsWithStats = await Promise.all(
      groups.map(async (group) => {
        const memberCount = await memberRepository.countByGroup(group.id);

        // 取得牧區名稱
        let zoneName: string | undefined;
        if (group.parentZoneId) {
          const zone = await zoneRepository.findById(group.parentZoneId);
          zoneName = zone?.name;
        }

        return {
          ...group,
          zoneName,
          memberCount,
        } as GroupWithStats;
      })
    );

    return {
      groups: groupsWithStats,
      total,
      page: params.page,
      limit: params.limit,
    };
  }

  /**
   * 取得單一小組（帶統計）
   */
  async getGroupById(id: string): Promise<GroupWithStats | null> {
    const group = await groupRepository.findById(id);
    if (!group) {
      return null;
    }

    const memberCount = await memberRepository.countByGroup(id);

    // 取得牧區名稱
    let zoneName: string | undefined;
    if (group.parentZoneId) {
      const zone = await zoneRepository.findById(group.parentZoneId);
      zoneName = zone?.name;
    }

    return {
      ...group,
      zoneName,
      memberCount,
    } as GroupWithStats;
  }

  /**
   * 更新小組
   */
  async updateGroup(id: string, data: Partial<GroupFormValues>): Promise<Group | null> {
    // 檢查小組是否存在
    const existingGroup = await groupRepository.findById(id);
    if (!existingGroup) {
      return null;
    }

    // 若更新名稱 + parentZoneId，檢查是否重複
    const updatedName = data.name || existingGroup.name;
    const updatedZoneId = data.parentZoneId !== undefined ? data.parentZoneId : existingGroup.parentZoneId;
    if (updatedName !== existingGroup.name || updatedZoneId !== existingGroup.parentZoneId) {
      if (updatedZoneId) {
        const duplicateGroup = await groupRepository.findByNameInZone(updatedName, updatedZoneId);
        if (duplicateGroup && duplicateGroup.id !== id) {
          throw createError({
            statusCode: 409,
            message: '此牧區下已有相同名稱的小組',
          });
        }
      }
    }

    // 若更新 parentZoneId（轉移牧區）
    if (data.parentZoneId !== undefined && data.parentZoneId !== existingGroup.parentZoneId) {
      if (data.parentZoneId) {
        const zone = await zoneRepository.findById(data.parentZoneId);
        if (!zone || zone.status !== 'Active') {
          throw createError({
            statusCode: 400,
            message: '該牧區不存在或已停用',
          });
        }
      }

      // 將該小組所有成員的 zoneId 更新為新牧區
      await memberRepository.transferMembersToZone(id, data.parentZoneId || null);
    }

    // 若更新 leaderId，驗證會友並取得名稱
    let leaderName: string | undefined;
    if (data.leaderId !== undefined) {
      if (data.leaderId) {
        const leader = await memberRepository.findById(data.leaderId);
        if (!leader) {
          throw createError({
            statusCode: 400,
            message: '找不到該會友',
          });
        }

        // 驗證：Pastoral 小組的 Leader 必須在該牧區
        if (existingGroup.type === 'Pastoral' && leader.zoneId !== updatedZoneId) {
          throw createError({
            statusCode: 400,
            message: '小組長必須是該牧區的會友',
          });
        }

        leaderName = leader.fullName;

        // 更新該會友的 groupId
        await memberRepository.update(data.leaderId, { groupId: id });
      } else {
        leaderName = undefined;
      }
    }

    // 更新小組
    const updatedGroup = await groupRepository.update(id, {
      ...data,
      leaderName,
    });

    return updatedGroup;
  }

  /**
   * 刪除前檢查
   */
  async checkBeforeDelete(id: string): Promise<DeleteCheckResult> {
    const result: DeleteCheckResult = {
      canDelete: true,
      warnings: [],
      errors: [],
    };

    // 檢查是否有會友
    const memberCount = await memberRepository.countByGroup(id);
    if (memberCount > 0) {
      result.hasMembersCount = memberCount;
      result.warnings.push(`此小組下仍有 ${memberCount} 位會友，刪除後會友將變為未分組狀態`);
    }

    return result;
  }

  /**
   * 刪除小組
   */
  async deleteGroup(id: string): Promise<void> {
    const group = await groupRepository.findById(id);
    if (!group) {
      throw createError({
        statusCode: 404,
        message: '找不到該小組',
      });
    }

    // 軟刪除：將狀態改為 Inactive
    await groupRepository.update(id, { status: 'Inactive' });

    // 將該小組的會友的 groupId 設為 null
    await memberRepository.clearGroupForMembers(id);
  }

  /**
   * 取得 Leader 候選人（該牧區的會友）
   */
  async getLeaderCandidates(zoneId: string): Promise<LeaderCandidate[]> {
    // 取得該牧區的所有啟用會友
    const members = await memberRepository.findAll({
      page: 1,
      limit: 1000,
      zoneId,
      status: 'Active',
    });

    return members.members.map(member => ({
      uuid: member.uuid,
      fullName: member.fullName,
      baptismStatus: member.baptismStatus,
      zoneId: member.zoneId,
      groupId: member.groupId,
      hasZoneLeaderRole: member.roleIds?.includes('zone_leader') || false,
      hasGroupLeaderRole: member.roleIds?.includes('group_leader') || false,
    }));
  }
}

export const groupService = new GroupService();
```

### 4.3 Repository Layer

**`server/repositories/zone.repository.ts`**

```typescript
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { Zone, ZoneFormValues } from '~/types/organization';

class ZoneRepository {
  private db = getFirestore();
  private collection = 'zones';

  /**
   * 建立牧區
   */
  async create(data: ZoneFormValues & { leaderName?: string }): Promise<Zone> {
    const docRef = this.db.collection(this.collection).doc();

    const zone: Zone = {
      id: docRef.id,
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await docRef.set(zone);
    return zone;
  }

  /**
   * 根據 ID 查詢牧區
   */
  async findById(id: string): Promise<Zone | null> {
    const docSnap = await this.db.collection(this.collection).doc(id).get();

    if (!docSnap.exists) {
      return null;
    }

    return docSnap.data() as Zone;
  }

  /**
   * 根據名稱查詢牧區（不區分大小寫）
   */
  async findByName(name: string): Promise<Zone | null> {
    const snapshot = await this.db
      .collection(this.collection)
      .where('name', '==', name)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data() as Zone;
  }

  /**
   * 查詢牧區列表
   */
  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
  }): Promise<{ zones: Zone[]; total: number }> {
    let query = this.db.collection(this.collection);

    // 篩選條件
    if (params.status) {
      query = query.where('status', '==', params.status) as any;
    } else {
      // 預設不顯示 Inactive
      query = query.where('status', '==', 'Active') as any;
    }

    // TODO: 搜尋功能（Firebase 不支援 LIKE，需使用 Algolia 或前端過濾）

    // 總數
    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    // 分頁
    const offset = (params.page - 1) * params.limit;
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(params.limit)
      .get();

    const zones = snapshot.docs.map(doc => doc.data() as Zone);

    return { zones, total };
  }

  /**
   * 更新牧區
   */
  async update(id: string, data: Partial<ZoneFormValues & { leaderName?: string }>): Promise<Zone | null> {
    const docRef = this.db.collection(this.collection).doc(id);

    const updateData = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();
    return updatedDoc.data() as Zone;
  }

  /**
   * 刪除牧區（實際刪除，不建議使用）
   */
  async delete(id: string): Promise<void> {
    await this.db.collection(this.collection).doc(id).delete();
  }
}

export const zoneRepository = new ZoneRepository();
```

**`server/repositories/group.repository.ts`**

```typescript
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { Group, GroupFormValues } from '~/types/organization';

class GroupRepository {
  private db = getFirestore();
  private collection = 'groups';

  /**
   * 建立小組
   */
  async create(data: GroupFormValues & { leaderName?: string }): Promise<Group> {
    const docRef = this.db.collection(this.collection).doc();

    const group: Group = {
      id: docRef.id,
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await docRef.set(group);
    return group;
  }

  /**
   * 根據 ID 查詢小組
   */
  async findById(id: string): Promise<Group | null> {
    const docSnap = await this.db.collection(this.collection).doc(id).get();

    if (!docSnap.exists) {
      return null;
    }

    return docSnap.data() as Group;
  }

  /**
   * 根據名稱在特定牧區內查詢小組
   */
  async findByNameInZone(name: string, zoneId: string): Promise<Group | null> {
    const snapshot = await this.db
      .collection(this.collection)
      .where('name', '==', name)
      .where('parentZoneId', '==', zoneId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data() as Group;
  }

  /**
   * 查詢小組列表
   */
  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    zoneId?: string;
    type?: string;
    status?: string;
  }): Promise<{ groups: Group[]; total: number }> {
    let query = this.db.collection(this.collection);

    // 篩選條件
    if (params.zoneId) {
      query = query.where('parentZoneId', '==', params.zoneId) as any;
    }
    if (params.type) {
      query = query.where('type', '==', params.type) as any;
    }
    if (params.status) {
      query = query.where('status', '==', params.status) as any;
    } else {
      // 預設不顯示 Inactive
      query = query.where('status', '==', 'Active') as any;
    }

    // 總數
    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    // 分頁
    const offset = (params.page - 1) * params.limit;
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(params.limit)
      .get();

    const groups = snapshot.docs.map(doc => doc.data() as Group);

    return { groups, total };
  }

  /**
   * 更新小組
   */
  async update(id: string, data: Partial<GroupFormValues & { leaderName?: string }>): Promise<Group | null> {
    const docRef = this.db.collection(this.collection).doc(id);

    const updateData = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();
    return updatedDoc.data() as Group;
  }

  /**
   * 統計特定牧區的小組數量
   */
  async countByZone(zoneId: string, status?: string): Promise<number> {
    let query = this.db
      .collection(this.collection)
      .where('parentZoneId', '==', zoneId);

    if (status) {
      query = query.where('status', '==', status) as any;
    }

    const snapshot = await query.count().get();
    return snapshot.data().count;
  }

  /**
   * 刪除小組（實際刪除，不建議使用）
   */
  async delete(id: string): Promise<void> {
    await this.db.collection(this.collection).doc(id).delete();
  }
}

export const groupRepository = new GroupRepository();
```

### 4.4 API Routes (Samples)

#### POST /api/organization/zones

**`server/api/organization/zones/index.post.ts`**

```typescript
import { zoneService } from '~/server/services/zone.service';
import { zoneSchema } from '~/utils/organization/schema';
import { requirePermission } from '~/server/utils/permission';

export default defineEventHandler(async (event) => {
  // 權限檢查: org:manage
  requirePermission(event, 'org:manage');

  const body = await readBody(event);

  // Zod 驗證
  const validationResult = zoneSchema.safeParse(body);
  if (!validationResult.success) {
    throw createError({
      statusCode: 400,
      message: '資料驗證失敗',
      data: validationResult.error.flatten(),
    });
  }

  try {
    const zone = await zoneService.createZone(validationResult.data);
    return zone;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '建立牧區失敗',
    });
  }
});
```

#### GET /api/organization/zones/:id/check-delete

**`server/api/organization/zones/[id]/check-delete.get.ts`**

```typescript
import { zoneService } from '~/server/services/zone.service';
import { requirePermission } from '~/server/utils/permission';

export default defineEventHandler(async (event) => {
  // 權限檢查: org:manage
  requirePermission(event, 'org:manage');

  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少牧區 ID',
    });
  }

  try {
    const result = await zoneService.checkBeforeDelete(id);
    return result;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '檢查失敗',
    });
  }
});
```

---

## 5. Testing Strategy

### 5.1 Unit Tests

**Frontend:**
- `useZone` composable: 測試 CRUD 方法
- `useGroup` composable: 測試 CRUD 方法
- Zod Schema: 測試驗證規則（Pastoral 小組必須有 parentZoneId）

**Backend:**
- `zone.service.ts`: 測試業務邏輯（名稱唯一性、刪除前檢查）
- `group.service.ts`: 測試業務邏輯（牧區驗證、Leader 驗證）
- `zone.repository.ts`: 測試資料存取
- `group.repository.ts`: 測試資料存取

### 5.2 Integration Tests

- API Routes: 測試完整的 Request/Response 流程
- Firebase Integration: 測試資料庫操作

### 5.3 E2E Tests

- 使用 Playwright 測試完整的牧區/小組 CRUD 流程
- 測試刪除前檢查機制
- 測試 Leader 指派與角色提示

---

## 6. Security & Performance

### 6.1 Security
- **RBAC 權限檢查**: 所有 API 需檢查 `org:view` 或 `org:manage` 權限
- **資料範圍過濾**: 根據使用者的 `DataScope` 過濾可見的牧區/小組
- **Input Validation**: 使用 Zod Schema 驗證所有輸入

### 6.2 Performance
- **分頁載入**: 預設每頁 20 筆
- **統計快取**: 成員數量、小組數量在前端計算，避免每次查詢
- **Leader 候選人**: 限制最多載入 1000 筆 + 搜尋功能

---

## 7. Migration & Deployment

### 7.1 Database Migration
- 建立 `zones` Collection
- 建立 `groups` Collection
- 建立索引：`zones.name`, `groups.parentZoneId`, `groups.type`

### 7.2 Deployment Checklist
- [ ] 建立 Firestore Collections
- [ ] 設定 Security Rules
- [ ] 建立資料庫索引
- [ ] 匯入初始資料（Seed Data）
- [ ] 測試 API Routes
- [ ] 測試前端表單驗證
- [ ] 測試刪除前檢查機制
- [ ] 測試 Leader 指派流程
- [ ] 部署到 Staging 環境
- [ ] UAT 測試
- [ ] 部署到 Production

---

## 8. Questions & Clarifications

以下問題需要產品經理或業務方澄清：

1. **牧區長更換時，原牧區長的 `zoneId` 是否需要清除？**
   - 目前設計：不清除，允許牧區長仍保留在該牧區
   - 替代方案：清除 `zoneId`，牧區長變為未分區狀態

2. **小組長更換時，原小組長的 `groupId` 是否需要清除？**
   - 目前設計：不清除，允許小組長仍保留在該小組
   - 替代方案：清除 `groupId`，小組長變為未分組狀態

3. **刪除牧區時，若有會友，是否需要二次確認對話框？**
   - 目前設計：顯示警告訊息但允許刪除
   - 替代方案：禁止刪除，必須先將會友轉移到其他牧區

4. **牧區名稱唯一性是否區分大小寫？**
   - 目前設計：不區分大小寫（「林牧區」與「林牧区」視為重複）
   - 替代方案：區分大小寫

5. **小組名稱唯一性範圍？**
   - 目前設計：同牧區內唯一（不同牧區可有同名小組）
   - 替代方案：全系統唯一

6. **功能性小組（Functional）是否需要在此 Story 實作？**
   - 目前設計：支援 Functional 類型，但不強制使用
   - 替代方案：僅實作 Pastoral 小組，Functional 留給後續 Story

7. **Leader 指派時，是否自動指派對應角色？**
   - 目前設計：顯示提示對話框，由使用者決定是否自動指派
   - 替代方案：強制自動指派角色

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-16  
**Author**: AI Assistant  
**Status**: Draft - Pending Review
