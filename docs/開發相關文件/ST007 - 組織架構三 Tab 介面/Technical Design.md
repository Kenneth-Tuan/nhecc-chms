# ST007 - Technical Design: 組織架構三 Tab 介面

## 1. Overview

### 1.1 Story Reference
- **Story ID**: ST-007
- **Priority**: Must Have (Core Feature)
- **User Story**: As a 行政同工 / 牧區長, I want to 在單一頁面查看完整的組織架構（包含牧區/小組、課程、事工）, So that 我能快速了解組織架構的全貌，並方便管理成員的歸屬與分配。

### 1.2 Design Goals
1. 實作三 Tab 介面（牧區/小組、課程、事工）
2. 實作 Tree View 顯示階層關係
3. 實作待處理池（未歸屬會友列表）
4. 支援 Tab 狀態記錄與切換
5. 整合 RBAC 權限控制

### 1.3 Tech Stack
- **Frontend**: Nuxt 4, Vue 3.5 (Composition API), PrimeVue 4.5, TypeScript
- **Backend**: Nitro (Server Routes), Firebase Admin SDK
- **Database**: Firestore
- **State Management**: Pinia (composables)

---

## 2. Data Models

### 2.1 Tree Node Structure

```typescript
// Tree View 節點結構
export interface TreeNode {
  key: string;                    // 唯一識別 (zoneId or groupId)
  label: string;                  // 顯示名稱
  type: 'zone' | 'group';         // 節點類型
  data: ZoneTreeData | GroupTreeData;
  children?: TreeNode[];          // 子節點（小組）
  leaf?: boolean;                 // 是否為葉節點
  icon?: string;                  // Icon class
}

export interface ZoneTreeData {
  id: string;
  name: string;
  leaderId?: string;
  leaderName?: string;
  groupCount: number;
  memberCount: number;
  status: 'Active' | 'Inactive';
}

export interface GroupTreeData {
  id: string;
  name: string;
  parentZoneId: string;
  leaderId?: string;
  leaderName?: string;
  memberCount: number;
  status: 'Active' | 'Inactive';
}
```

### 2.2 Pending Pool Member

```typescript
export interface PendingMember {
  uuid: string;
  fullName: string;
  avatar?: string;
  baptismStatus: boolean;
  email: string;               // 遮罩版本
  mobile: string;              // 遮罩版本
  createdAt: Timestamp;
}
```

### 2.3 Functional Group (Course/Ministry)

```typescript
export interface FunctionalGroupDisplay {
  id: string;
  name: string;
  type: 'Functional';
  category: 'Course' | 'Ministry';  // 區分課程與事工
  leaderId?: string;
  leaderName?: string;
  memberCount: number;
  status: 'Active' | 'Inactive' | 'InProgress' | 'Completed';
  
  // 課程特有欄位
  courseCode?: string;          // 班級代碼
  startDate?: Date;
  endDate?: Date;
  
  // 事工特有欄位
  ministryType?: string;        // 事工類型（如：敬拜、招待）
}
```

---

## 3. Frontend Architecture

### 3.1 File Structure

```
app/
├── components/
│   ├── organization/
│   │   ├── OrganizationTabs.vue      # 主容器（3 Tab）
│   │   ├── PastoralTab.vue           # Tab 1: 牧區/小組
│   │   ├── CourseTab.vue             # Tab 2: 課程
│   │   ├── MinistryTab.vue           # Tab 3: 事工
│   │   ├── ZoneGroupTree.vue         # Tree View 元件
│   │   ├── TreeNodeItem.vue          # Tree 節點元件
│   │   ├── PendingPool.vue           # 待處理池元件
│   │   ├── PendingMemberCard.vue     # 待處理池會友卡片
│   │   └── QuickAssignDialog.vue     # 快速分配對話框
│   └── common/
│       └── ...                       # 通用元件
├── pages/
│   └── organization/
│       └── index.vue                 # 組織架構頁面
├── composables/
│   ├── useOrganizationTree.ts        # Tree View 邏輯
│   ├── usePendingPool.ts             # 待處理池邏輯
│   └── useFunctionalGroups.ts        # 功能性群組邏輯
└── types/
    └── organization.ts               # 型別定義
```

### 3.2 Composables

**`app/composables/useOrganizationTree.ts`**

```typescript
import type { TreeNode, ZoneWithStats, GroupWithStats } from '~/types/organization';

export const useOrganizationTree = () => {
  const treeData = ref<TreeNode[]>([]);
  const expandedKeys = ref<Record<string, boolean>>({});
  const loading = ref(false);

  // 載入組織架構
  const loadTreeData = async () => {
    loading.value = true;
    try {
      const response = await $fetch<{
        zones: ZoneWithStats[];
        groups: GroupWithStats[];
      }>('/api/organization/tree');

      treeData.value = buildTreeNodes(response.zones, response.groups);
      
      // 從 LocalStorage 恢復展開狀態
      const savedState = localStorage.getItem('org-tree-expanded');
      if (savedState) {
        expandedKeys.value = JSON.parse(savedState);
      }
    } catch (error) {
      console.error('Failed to load tree data:', error);
    } finally {
      loading.value = false;
    }
  };

  // 建立 Tree 節點
  const buildTreeNodes = (zones: ZoneWithStats[], groups: GroupWithStats[]): TreeNode[] => {
    return zones.map(zone => {
      const zoneGroups = groups.filter(g => g.parentZoneId === zone.id);

      return {
        key: `zone_${zone.id}`,
        label: zone.name,
        type: 'zone',
        data: {
          id: zone.id,
          name: zone.name,
          leaderId: zone.leaderId,
          leaderName: zone.leaderName,
          groupCount: zone.groupCount,
          memberCount: zone.memberCount,
          status: zone.status,
        },
        icon: 'pi pi-home',
        children: zoneGroups.map(group => ({
          key: `group_${group.id}`,
          label: group.name,
          type: 'group',
          data: {
            id: group.id,
            name: group.name,
            parentZoneId: group.parentZoneId,
            leaderId: group.leaderId,
            leaderName: group.leaderName,
            memberCount: group.memberCount,
            status: group.status,
          },
          icon: 'pi pi-users',
          leaf: true,
        })),
      } as TreeNode;
    });
  };

  // 展開/收合節點
  const toggleNode = (key: string) => {
    expandedKeys.value[key] = !expandedKeys.value[key];
    saveExpandedState();
  };

  // 展開所有節點
  const expandAll = () => {
    treeData.value.forEach(node => {
      expandedKeys.value[node.key] = true;
    });
    saveExpandedState();
  };

  // 收合所有節點
  const collapseAll = () => {
    expandedKeys.value = {};
    saveExpandedState();
  };

  // 儲存展開狀態到 LocalStorage
  const saveExpandedState = () => {
    localStorage.setItem('org-tree-expanded', JSON.stringify(expandedKeys.value));
  };

  // 搜尋節點
  const searchTree = (keyword: string) => {
    if (!keyword) {
      return treeData.value;
    }

    const lowerKeyword = keyword.toLowerCase();
    return treeData.value
      .map(zone => ({
        ...zone,
        children: zone.children?.filter(group =>
          group.label.toLowerCase().includes(lowerKeyword)
        ),
      }))
      .filter(zone =>
        zone.label.toLowerCase().includes(lowerKeyword) ||
        (zone.children && zone.children.length > 0)
      );
  };

  return {
    treeData,
    expandedKeys,
    loading,
    loadTreeData,
    toggleNode,
    expandAll,
    collapseAll,
    searchTree,
  };
};
```

**`app/composables/usePendingPool.ts`**

```typescript
import type { PendingMember } from '~/types/organization';

export const usePendingPool = () => {
  const pendingMembers = ref<PendingMember[]>([]);
  const loading = ref(false);
  const searchKeyword = ref('');
  const filterBaptismStatus = ref<boolean | null>(null);

  // 載入待處理池
  const loadPendingMembers = async () => {
    loading.value = true;
    try {
      const response = await $fetch<PendingMember[]>('/api/organization/pending-pool', {
        query: {
          search: searchKeyword.value,
          baptismStatus: filterBaptismStatus.value,
        },
      });
      pendingMembers.value = response;
    } catch (error) {
      console.error('Failed to load pending members:', error);
    } finally {
      loading.value = false;
    }
  };

  // 篩選後的會友
  const filteredMembers = computed(() => {
    let result = pendingMembers.value;

    // 搜尋篩選
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase();
      result = result.filter(m =>
        m.fullName.toLowerCase().includes(keyword) ||
        m.email.toLowerCase().includes(keyword) ||
        m.mobile.includes(keyword)
      );
    }

    // 受洗狀態篩選
    if (filterBaptismStatus.value !== null) {
      result = result.filter(m => m.baptismStatus === filterBaptismStatus.value);
    }

    return result;
  });

  return {
    pendingMembers,
    filteredMembers,
    loading,
    searchKeyword,
    filterBaptismStatus,
    loadPendingMembers,
  };
};
```

**`app/composables/useFunctionalGroups.ts`**

```typescript
import type { FunctionalGroupDisplay } from '~/types/organization';

export const useFunctionalGroups = () => {
  const courseGroups = ref<FunctionalGroupDisplay[]>([]);
  const ministryGroups = ref<FunctionalGroupDisplay[]>([]);
  const loading = ref(false);

  // 載入課程群組
  const loadCourseGroups = async () => {
    loading.value = true;
    try {
      const response = await $fetch<FunctionalGroupDisplay[]>('/api/organization/functional-groups', {
        query: { category: 'Course' },
      });
      courseGroups.value = response;
    } catch (error) {
      console.error('Failed to load course groups:', error);
    } finally {
      loading.value = false;
    }
  };

  // 載入事工群組
  const loadMinistryGroups = async () => {
    loading.value = true;
    try {
      const response = await $fetch<FunctionalGroupDisplay[]>('/api/organization/functional-groups', {
        query: { category: 'Ministry' },
      });
      ministryGroups.value = response;
    } catch (error) {
      console.error('Failed to load ministry groups:', error);
    } finally {
      loading.value = false;
    }
  };

  return {
    courseGroups,
    ministryGroups,
    loading,
    loadCourseGroups,
    loadMinistryGroups,
  };
};
```

### 3.3 Component Design

**`app/components/organization/OrganizationTabs.vue`**

```vue
<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
});

const route = useRoute();
const router = useRouter();

// Tab 狀態
const activeTab = ref(Number(route.query.tab) || 0);

// Tab 項目
const tabItems = [
  { label: '牧區/小組', icon: 'pi pi-sitemap' },
  { label: '課程', icon: 'pi pi-book' },
  { label: '事工', icon: 'pi pi-users' },
];

// 切換 Tab
const onTabChange = (index: number) => {
  activeTab.value = index;
  router.push({ query: { tab: index } });
};

// 權限檢查
const { userContext } = useAuth();
const canViewOrganization = computed(() => 
  hasPermission(userContext.value, 'org:view')
);

onMounted(() => {
  if (!canViewOrganization.value) {
    router.push('/');
  }
});
</script>

<template>
  <div class="organization-page">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">組織架構管理</h1>
        <p class="text-slate-600">查看與管理教會的組織架構、牧區、小組與成員歸屬</p>
      </div>
    </div>

    <!-- Tab View -->
    <TabView :active-index="activeTab" @update:active-index="onTabChange">
      <!-- Tab 1: 牧區/小組 -->
      <TabPanel>
        <template #header>
          <div class="flex items-center gap-2">
            <i :class="tabItems[0].icon" />
            <span>{{ tabItems[0].label }}</span>
          </div>
        </template>
        <PastoralTab />
      </TabPanel>

      <!-- Tab 2: 課程 -->
      <TabPanel>
        <template #header>
          <div class="flex items-center gap-2">
            <i :class="tabItems[1].icon" />
            <span>{{ tabItems[1].label }}</span>
          </div>
        </template>
        <CourseTab />
      </TabPanel>

      <!-- Tab 3: 事工 -->
      <TabPanel>
        <template #header>
          <div class="flex items-center gap-2">
            <i :class="tabItems[2].icon" />
            <span>{{ tabItems[2].label }}</span>
          </div>
        </template>
        <MinistryTab />
      </TabPanel>
    </TabView>
  </div>
</template>

<style scoped>
.organization-page {
  padding: 2rem;
}
</style>
```

**`app/components/organization/PastoralTab.vue`**

```vue
<script setup lang="ts">
const { treeData, expandedKeys, loading, loadTreeData, expandAll, collapseAll } = useOrganizationTree();
const { pendingMembers, loadPendingMembers } = usePendingPool();

// 搜尋關鍵字
const searchKeyword = ref('');

// 篩選狀態
const filterStatus = ref<string | null>(null);

// 載入資料
onMounted(async () => {
  await Promise.all([
    loadTreeData(),
    loadPendingMembers(),
  ]);
});

// 重新整理
const refresh = async () => {
  await Promise.all([
    loadTreeData(),
    loadPendingMembers(),
  ]);
};
</script>

<template>
  <div class="pastoral-tab">
    <!-- 工具列 -->
    <div class="toolbar flex justify-between items-center mb-4">
      <div class="flex items-center gap-3">
        <InputText
          v-model="searchKeyword"
          placeholder="搜尋牧區/小組..."
          class="w-64"
        >
          <template #prefix>
            <i class="pi pi-search" />
          </template>
        </InputText>

        <Select
          v-model="filterStatus"
          :options="[
            { label: '全部', value: null },
            { label: '僅啟用', value: 'Active' },
            { label: '僅停用', value: 'Inactive' },
          ]"
          option-label="label"
          option-value="value"
          placeholder="狀態"
          show-clear
          class="w-40"
        />
      </div>

      <div class="flex items-center gap-2">
        <Button
          label="展開全部"
          icon="pi pi-angle-down"
          severity="secondary"
          text
          @click="expandAll"
        />
        <Button
          label="收合全部"
          icon="pi pi-angle-up"
          severity="secondary"
          text
          @click="collapseAll"
        />
        <Button
          icon="pi pi-refresh"
          severity="secondary"
          text
          rounded
          @click="refresh"
        />
      </div>
    </div>

    <!-- 內容區 -->
    <div class="content-area grid grid-cols-3 gap-4">
      <!-- 左側：Tree View -->
      <div class="col-span-2">
        <Card>
          <template #content>
            <ZoneGroupTree
              :tree-data="treeData"
              :expanded-keys="expandedKeys"
              :loading="loading"
              :search-keyword="searchKeyword"
            />
          </template>
        </Card>
      </div>

      <!-- 右側：待處理池 -->
      <div class="col-span-1">
        <PendingPool :members="pendingMembers" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.pastoral-tab {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.content-area {
  min-height: 600px;
}
</style>
```

**`app/components/organization/ZoneGroupTree.vue`**

```vue
<script setup lang="ts">
import type { TreeNode } from '~/types/organization';

const props = defineProps<{
  treeData: TreeNode[];
  expandedKeys: Record<string, boolean>;
  loading: boolean;
  searchKeyword?: string;
}>();

// 右鍵選單
const contextMenuRef = ref();
const selectedNode = ref<TreeNode | null>(null);

const menuItems = computed(() => {
  if (!selectedNode.value) return [];

  if (selectedNode.value.type === 'zone') {
    return [
      { label: '編輯牧區', icon: 'pi pi-pencil', command: () => editZone() },
      { label: '新增小組', icon: 'pi pi-plus', command: () => addGroup() },
      { separator: true },
      { label: '刪除牧區', icon: 'pi pi-trash', command: () => deleteZone() },
    ];
  } else {
    return [
      { label: '編輯小組', icon: 'pi pi-pencil', command: () => editGroup() },
      { separator: true },
      { label: '刪除小組', icon: 'pi pi-trash', command: () => deleteGroup() },
    ];
  }
});

const onNodeContextMenu = (event: any) => {
  selectedNode.value = event.node;
  contextMenuRef.value.show(event.originalEvent);
};

const editZone = () => {
  navigateTo(`/organization/zones/${selectedNode.value?.data.id}/edit`);
};

const addGroup = () => {
  navigateTo(`/organization/groups/create?zoneId=${selectedNode.value?.data.id}`);
};

const deleteZone = () => {
  // TODO: 實作刪除確認對話框
  console.log('Delete zone:', selectedNode.value?.data.id);
};

const editGroup = () => {
  navigateTo(`/organization/groups/${selectedNode.value?.data.id}/edit`);
};

const deleteGroup = () => {
  // TODO: 實作刪除確認對話框
  console.log('Delete group:', selectedNode.value?.data.id);
};
</script>

<template>
  <div class="zone-group-tree">
    <Tree
      :value="treeData"
      :expanded-keys="expandedKeys"
      :loading="loading"
      @node-expand="$emit('node-expand', $event)"
      @node-collapse="$emit('node-collapse', $event)"
      @node-context-menu="onNodeContextMenu"
    >
      <template #default="{ node }">
        <TreeNodeItem :node="node" />
      </template>
    </Tree>

    <ContextMenu ref="contextMenuRef" :model="menuItems" />
  </div>
</template>

<style scoped>
.zone-group-tree {
  min-height: 400px;
}
</style>
```

---

## 4. Backend Architecture

### 4.1 API Routes

#### GET /api/organization/tree

**`server/api/organization/tree.get.ts`**

```typescript
import { zoneService } from '~/server/services/zone.service';
import { groupService } from '~/server/services/group.service';
import { requirePermission, applyScopeFilter } from '~/server/utils/permission';

export default defineEventHandler(async (event) => {
  // 權限檢查: org:view
  requirePermission(event, 'org:view');

  const userContext = event.context.userContext;

  try {
    // 取得牧區列表（根據 DataScope 過濾）
    const zonesResult = await zoneService.getZones({
      page: 1,
      limit: 1000,
      status: 'Active',
    });

    // 取得小組列表（根據 DataScope 過濾）
    const groupsResult = await groupService.getGroups({
      page: 1,
      limit: 1000,
      type: 'Pastoral',
      status: 'Active',
    });

    // 根據 DataScope 過濾
    let zones = zonesResult.zones;
    let groups = groupsResult.groups;

    if (userContext.scope === 'Zone') {
      zones = zones.filter(z => z.id === userContext.managedZoneId);
      groups = groups.filter(g => g.parentZoneId === userContext.managedZoneId);
    } else if (userContext.scope === 'Group') {
      groups = groups.filter(g => userContext.managedGroupIds.includes(g.id));
      zones = zones.filter(z => groups.some(g => g.parentZoneId === z.id));
    }

    return {
      zones,
      groups,
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '無法取得組織架構',
    });
  }
});
```

#### GET /api/organization/pending-pool

**`server/api/organization/pending-pool.get.ts`**

```typescript
import { memberRepository } from '~/server/repositories/member.repository';
import { requirePermission } from '~/server/utils/permission';

export default defineEventHandler(async (event) => {
  // 權限檢查: org:view
  requirePermission(event, 'org:view');

  const query = getQuery(event);

  try {
    // 查詢未歸屬會友 (zoneId = null AND groupId = null)
    const members = await memberRepository.findPendingMembers({
      search: query.search as string | undefined,
      baptismStatus: query.baptismStatus as boolean | undefined,
    });

    return members;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '無法取得待處理池',
    });
  }
});
```

#### GET /api/organization/functional-groups

**`server/api/organization/functional-groups.get.ts`**

```typescript
import { groupRepository } from '~/server/repositories/group.repository';
import { requirePermission } from '~/server/utils/permission';

export default defineEventHandler(async (event) => {
  // 權限檢查: org:view
  requirePermission(event, 'org:view');

  const query = getQuery(event);
  const category = query.category as 'Course' | 'Ministry' | undefined;

  try {
    // 查詢功能性群組
    const groups = await groupRepository.findFunctionalGroups({
      category,
      status: 'Active',
    });

    return groups;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '無法取得功能性群組',
    });
  }
});
```

### 4.2 Repository Methods (New)

**`server/repositories/member.repository.ts` (新增方法)**

```typescript
/**
 * 查詢待處理池會友（未歸屬牧區與小組）
 */
async findPendingMembers(params: {
  search?: string;
  baptismStatus?: boolean;
}): Promise<PendingMember[]> {
  let query = this.db
    .collection(this.collection)
    .where('zoneId', '==', null)
    .where('groupId', '==', null)
    .where('status', '==', 'Active');

  if (params.baptismStatus !== undefined) {
    query = query.where('baptismStatus', '==', params.baptismStatus) as any;
  }

  const snapshot = await query
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      uuid: data.uuid,
      fullName: data.fullName,
      avatar: data.avatar,
      baptismStatus: data.baptismStatus,
      email: data.email,        // 遮罩版本
      mobile: data.mobile,      // 遮罩版本
      createdAt: data.createdAt,
    } as PendingMember;
  });
}
```

**`server/repositories/group.repository.ts` (新增方法)**

```typescript
/**
 * 查詢功能性群組（課程/事工）
 */
async findFunctionalGroups(params: {
  category?: 'Course' | 'Ministry';
  status?: string;
}): Promise<FunctionalGroupDisplay[]> {
  let query = this.db
    .collection(this.collection)
    .where('type', '==', 'Functional');

  if (params.category) {
    query = query.where('metadata.category', '==', params.category) as any;
  }

  if (params.status) {
    query = query.where('status', '==', params.status) as any;
  }

  const snapshot = await query
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      type: data.type,
      category: data.metadata?.category || 'Course',
      leaderId: data.leaderId,
      leaderName: data.leaderName,
      memberCount: 0,  // TODO: 統計成員數量
      status: data.status,
      courseCode: data.metadata?.courseCode,
      startDate: data.metadata?.startDate,
      endDate: data.metadata?.endDate,
      ministryType: data.metadata?.ministryType,
    } as FunctionalGroupDisplay;
  });
}
```

---

## 5. Testing & Performance

### 5.1 Performance Optimization
- **Tree View 懶加載**: 預設僅載入牧區層級，點擊展開時才載入小組
- **待處理池分頁**: 限制最多顯示 100 筆，超過則分頁
- **LocalStorage 快取**: 快取 Tree View 的展開狀態

### 5.2 Testing Strategy
- **Unit Tests**: 測試 composables 的邏輯
- **E2E Tests**: 測試 Tab 切換、Tree View 互動、待處理池篩選

---

## 6. Questions & Clarifications

記錄於 `Questions.md`

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-16  
**Author**: AI Assistant  
**Status**: Draft - Pending Review
