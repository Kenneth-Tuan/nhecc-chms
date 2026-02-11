# ST003 - Technical Design: 會友資料列表檢視與 Scope 過濾

## 1. Overview

### 1.1 Story Reference
- **Story ID**: ST-003
- **Priority**: Must Have (Core Feature)
- **User Story**: As a 牧區長或小組長, I want to 在瀏覽會友列表時，系統能自動過濾出我管轄範圍內的成員，並提供搜尋與排序功能，So that 我能快速找到目標對象進行牧養，且不會越權看到其他牧區的資料。

### 1.2 Design Goals
1. 實作基於 RBAC 的 Data Scope 自動過濾（Global / Zone / Group / Self）
2. 提供直觀的搜尋與進階篩選功能
3. 支援 Quick View Modal 快速查看會友詳情
4. 遵循 Privacy by Default 原則（敏感資料遮罩）
5. 整合 ST001 與 ST002 的核心功能

### 1.3 Tech Stack
- **Frontend**: Nuxt 4, Vue 3.5 (Composition API), PrimeVue 4.5 DataTable, TypeScript
- **Backend**: Nitro (Server Routes), Firebase Admin SDK
- **Database**: Firebase Firestore
- **State Management**: Pinia (列表快取)
- **Dependencies**: 復用 ST001 的 `useMember` composable 與 ST002 的 `applyScopeFilter` utility

---

## 2. Feature Specifications

### 2.1 列表頁面 (Member List View)

#### 2.1.1 顯示欄位

根據 ST001/ST002 的 Member Schema 與確認的需求，列表欄位如下：

| 欄位 | 說明 | 資料來源 | 遮罩規則 |
|------|------|---------|---------|
| **Avatar** | 頭像（圓形） | `member.avatar` 或預設圖 | - |
| **姓名** | 中文全名 | `member.fullName` | - |
| **性別** | 使用 Icon 呈現 | `member.gender` | - |
| **年齡** | 系統計算足歲 | 計算自 `member.dob` | - |
| **聯絡資訊** | 手機號碼 | `member.mobile` | ⚠️ **遮罩顯示** (`092*-3**-6**`) |
| **角色標籤** | 主要角色 + 數量提示 | `member.roleIds` | Hover 顯示完整清單 |
| **歸屬小組** | 小組名稱 或「待分發」 | `member.groupId` | 未分配顯示橘色 Badge |
| **會籍狀態** | Active / Inactive | `member.status` | Tag 顯示 |
| **操作** | 編輯、刪除按鈕 | 根據權限動態顯示 | - |

**年齡計算公式**：
```typescript
const calculateAge = (dob: Date): number => {
  const today = new Date();
  const birthDate = new Date(dob);
  return Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
};
```

**角色標籤顯示邏輯**：
```typescript
// 範例：會友有 3 個角色 ['group_leader', 'teacher', 'worship_leader']
// 顯示：「小組長 +2」
// Hover Tooltip：「小組長、課程老師、敬拜團長」
```

**待分發小組樣式**：
- 背景色：橘色 (`severity="warn"`)
- 文字：「待分發」
- 點擊行為：導向 `/organization/structure` 頁面

---

#### 2.1.2 搜尋功能

**搜尋欄位**：
- `fullName`（姓名模糊搜尋，前端過濾）

**UI 設計**：
```vue
<div class="search-bar flex gap-2">
  <InputText 
    v-model="searchKeyword" 
    placeholder="搜尋姓名..."
    class="flex-1"
  />
  <Button 
    label="搜尋" 
    icon="pi pi-search" 
    @click="handleSearch"
  />
  <Button 
    label="清除" 
    icon="pi pi-times" 
    severity="secondary" 
    outlined
    @click="clearSearch"
    v-if="searchKeyword"
  />
</div>
```

**搜尋結果提示**：
```vue
<Message severity="info" v-if="searchActive">
  搜尋結果：找到 {{ filteredCount }} 筆符合「{{ searchKeyword }}」的資料
</Message>
```

**關鍵字高亮**：
```typescript
const highlightText = (text: string, keyword: string): string => {
  if (!keyword) return text;
  const regex = new RegExp(`(${keyword})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};
```

**技術實作**：
- 姓名搜尋：前端模糊匹配（載入 Scope 內所有會友後過濾）
- 原因：Firestore 不支援 LIKE 查詢

---

#### 2.1.3 進階篩選 (Advanced Filters)

**篩選器清單**：

1. **Status（會籍狀態）**
   - 選項：全部 / 啟用 (Active) / 停用 (Inactive)
   - 預設：啟用 (Active)

2. **受洗狀態**
   - 選項：全部 / 已受洗 / 未受洗
   - 預設：全部

3. **Zone & Group（依權限動態顯示）**
   - **Scope = Global**：聯級篩選（Zone → Group）
   - **Scope = Zone**：僅顯示 Group 篩選（該 Zone 下的小組）
   - **Scope = Group / Self**：不顯示篩選器

**Zone-Group Cascade 邏輯**：
```typescript
// 監聽 Zone 變化，自動更新 Group 選項
watch(selectedZone, (newZone) => {
  selectedGroup.value = null; // 清空 Group 選擇
  availableGroups.value = getGroupsByZone(newZone);
});
```

**「待分發」篩選**：
- 在 Group 下拉選單中加入特殊選項：`{ label: '待分發', value: 'PENDING' }`
- 後端處理：`WHERE groupId IS NULL`

---

#### 2.1.4 排序功能

**可排序欄位**：
- **年齡 (Age)**：依 `dob` 欄位升序/降序

**UI 設計**：
- 使用 PrimeVue DataTable 的 `sortable` 屬性
- 顯示升序/降序 icon（▲ / ▼）

**實作範例**：
```vue
<Column field="age" header="年齡" sortable :sortField="'dob'">
  <template #body="{ data }">
    {{ calculateAge(data.dob) }} 歲
  </template>
</Column>
```

---

#### 2.1.5 分頁功能

**分頁設定**：
- 預設每頁：20 筆
- 可選擇：10 / 20 / 50 / 100 筆
- 分頁樣式：數字分頁 + 上一頁/下一頁按鈕

**總筆數顯示**：
```
顯示 1-20 筆，共 156 筆資料
```

**PrimeVue DataTable 設定**：
```vue
<DataTable
  :value="members"
  :paginator="true"
  :rows="rowsPerPage"
  :rowsPerPageOptions="[10, 20, 50, 100]"
  :totalRecords="totalRecords"
  paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
  currentPageReportTemplate="顯示 {first}-{last} 筆，共 {totalRecords} 筆資料"
>
  <!-- ... columns -->
</DataTable>
```

---

#### 2.1.6 操作按鈕 (Action Column)

**權限控制邏輯**：

| 按鈕 | 顯示條件 | 行為 |
|------|---------|------|
| **查看詳情** | `hasPermission('member:view')` | 點擊整行觸發 Quick View Modal |
| **編輯** | `hasPermission('member:edit')` | 導向編輯頁 `/members/:id/edit` |
| **刪除** | `hasPermission('member:delete')` | 顯示確認 Dialog，軟刪除（設定 status = Inactive） |

**實作範例**：
```vue
<Column header="操作">
  <template #body="{ data }">
    <div class="flex gap-2">
      <Button
        v-if="hasPermission('member:edit')"
        icon="pi pi-pencil"
        severity="secondary"
        text
        rounded
        @click="editMember(data.uuid)"
      />
      <Button
        v-if="hasPermission('member:delete')"
        icon="pi pi-trash"
        severity="danger"
        text
        rounded
        @click="confirmDelete(data.uuid)"
      />
    </div>
  </template>
</Column>
```

---

### 2.2 Quick View Modal

#### 2.2.1 觸發方式

**點擊整行 (Row Click)**：
```vue
<DataTable
  :value="members"
  @row-click="onRowClick"
  selectionMode="single"
>
  <!-- ... -->
</DataTable>

<script setup>
const onRowClick = (event: any) => {
  const member = event.data;
  showQuickView(member.uuid);
};
</script>
```

---

#### 2.2.2 Modal Tab 結構

**Tab 1: 基本資料**

```
Layout:
┌─────────────────────────────────────────────────────────────┐
│ Modal Header: 會友詳情 - 王小明                [X]            │
├─────────────┬───────────────────────────────────────────────┤
│             │ Tab 1: 基本資料 | Tab 2: 修課紀錄              │
├─────────────┼───────────────────────────────────────────────┤
│   左側      │                   右側                         │
│             │                                               │
│  [Avatar]   │  ▼ 基本資訊                                    │
│   王小明    │    姓名：王小明    性別：男    年齡：34 歲     │
│             │    生日：1990-05-15                           │
│  [Tags]     │                                               │
│  ☑ 小組長   │  ▼ 聯絡資訊 [👁 顯示所有敏感資料]              │
│  ☑ 課程老師 │    手機：092*-3**-6** [👁]                    │
│             │    Email：pe***@example.com [👁]              │
│  [Status]   │    Line ID：pe***_123 [👁]                    │
│  ✅ 啟用    │    地址：台北市內湖區*** [👁]                   │
│             │                                               │
│  註冊日期   │  ▼ 緊急聯絡人 [👁 顯示所有敏感資料]             │
│  2024-01-15 │    姓名：王大華    關係：父子                  │
│             │    電話：092*-1**-4** [👁]                    │
│  最後登入   │                                               │
│  2 小時前   │  ▼ 教會資訊                                    │
│             │    受洗狀態：已受洗    受洗日期：2020-12-25    │
│             │    歸屬牧區：林牧區    歸屬小組：喜樂小組      │
└─────────────┴───────────────────────────────────────────────┘
│  [取消]                                    [編輯資料]         │
└─────────────────────────────────────────────────────────────┘
```

**Tab 2: 修課紀錄**

```vue
<TabPanel header="修課紀錄">
  <DataTable :value="courseRecords" v-if="courseRecords.length > 0">
    <Column field="courseName" header="課程名稱" />
    <Column field="completionDate" header="完成日期">
      <template #body="{ data }">
        {{ data.completionDate || '-' }}
      </template>
    </Column>
    <Column field="status" header="課程狀態">
      <template #body="{ data }">
        <Tag 
          :value="data.status" 
          :severity="getStatusSeverity(data.status)"
        />
      </template>
    </Column>
  </DataTable>
  
  <!-- Empty State -->
  <div v-else class="text-center py-8">
    <i class="pi pi-inbox text-6xl text-slate-300 mb-4" />
    <p class="text-slate-600">目前尚無修課紀錄</p>
  </div>
</TabPanel>
```

**課程狀態對應**：
- `畢業`：已完成課程（severity="success"）
- `未通過`：未通過課程（severity="danger"）
- `進行中`：課程進行中（severity="info"）

---

#### 2.2.3 敏感資料解鎖機制

**API 設計**：
```typescript
POST /api/members/:id/reveal
Request Body: {
  fields: ['mobile', 'email', 'lineId', 'address', 'emergencyContactPhone']
}

Response: {
  mobile: "0912-345-678",
  email: "peter.chen@example.com",
  lineId: "peter_chen_123",
  address: "台北市內湖區成功路四段168號",
  emergencyContactPhone: "0922-123-456"
}
```

**前端實作**：

1. **單一欄位解鎖**：
```vue
<div class="flex items-center gap-2">
  <span>{{ member.mobile }}</span>
  <Button 
    v-if="member.mobileCanReveal"
    icon="pi pi-eye"
    text
    rounded
    size="small"
    @click="revealField('mobile')"
  />
</div>
```

2. **一次性解鎖所有敏感資料**：
```vue
<Button 
  label="顯示所有敏感資料"
  icon="pi pi-eye"
  severity="secondary"
  outlined
  size="small"
  @click="confirmRevealAll"
/>
```

**確認 Dialog**：
```vue
<script setup>
const confirmRevealAll = () => {
  confirm.require({
    message: '您確定要查看所有敏感資料嗎？此操作將被記錄。',
    header: '確認查看敏感資料',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: '確定查看',
    rejectLabel: '取消',
    accept: async () => {
      await revealAllFields();
    },
  });
};

const revealAllFields = async () => {
  const fields = ['mobile', 'email', 'lineId', 'address', 'emergencyContactPhone'];
  const response = await $fetch(`/api/members/${memberId}/reveal`, {
    method: 'POST',
    body: { fields },
  });
  
  // 更新本地狀態
  Object.assign(revealedData, response);
};
</script>
```

**狀態管理**：
- 解鎖狀態僅在 Modal 開啟期間有效
- 關閉 Modal 後自動重置為遮罩狀態

---

#### 2.2.4 響應式設計

**桌面版**：標準 Modal（寬度 800px）

**移動端（< 768px）**：下方滑出 (Bottom Sheet)
```vue
<Dialog
  v-model:visible="showModal"
  :modal="true"
  :position="isMobile ? 'bottom' : 'center'"
  :style="{ 
    width: isMobile ? '100%' : '800px',
    maxHeight: isMobile ? '90vh' : 'auto'
  }"
>
  <!-- Modal Content -->
</Dialog>
```

---

## 3. API Specification

### 3.1 GET `/api/members` - 取得會友列表（整合 Scope 過濾）

**Request Query Parameters**：
```typescript
{
  page?: number;          // 頁碼（預設 1）
  limit?: number;         // 每頁筆數（預設 20）
  search?: string;        // 搜尋關鍵字（姓名）
  status?: string;        // Active / Inactive / All
  baptismStatus?: string; // true / false / all
  zoneId?: string;        // 牧區 ID（僅 Scope >= Global 可用）
  groupId?: string;       // 小組 ID（含 'PENDING' 代表待分發）
  sortBy?: string;        // 排序欄位（dob）
  sortOrder?: string;     // asc / desc
}
```

**Response**：
```typescript
{
  members: MemberResponse[];  // 含遮罩與 canReveal 元數據
  total: number;              // 總筆數
  page: number;               // 當前頁
  totalPages: number;         // 總頁數
}
```

**Scope 過濾實作**（Backend）：
```typescript
// server/api/members/index.get.ts
import { applyScopeFilter } from '~/server/utils/permission';
import { applyMemberMasking } from '~/server/utils/masking';

export default defineEventHandler(async (event) => {
  const userContext = event.context.userContext;
  const query = getQuery(event);

  // 基礎查詢
  let firestoreQuery = db.collection('members');

  // === 套用 Scope 過濾（強制） ===
  firestoreQuery = applyScopeFilter(firestoreQuery, userContext);

  // === 套用其他篩選條件 ===
  if (query.status && query.status !== 'All') {
    firestoreQuery = firestoreQuery.where('status', '==', query.status);
  }

  if (query.baptismStatus && query.baptismStatus !== 'all') {
    const baptized = query.baptismStatus === 'true';
    firestoreQuery = firestoreQuery.where('baptismStatus', '==', baptized);
  }

  if (query.groupId) {
    if (query.groupId === 'PENDING') {
      firestoreQuery = firestoreQuery.where('groupId', '==', null);
    } else {
      firestoreQuery = firestoreQuery.where('groupId', '==', query.groupId);
    }
  }

  // === 排序 ===
  if (query.sortBy === 'dob') {
    const order = query.sortOrder === 'asc' ? 'asc' : 'desc';
    firestoreQuery = firestoreQuery.orderBy('dob', order);
  } else {
    firestoreQuery = firestoreQuery.orderBy('createdAt', 'desc');
  }

  // === 分頁 ===
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const offset = (page - 1) * limit;

  const snapshot = await firestoreQuery.offset(offset).limit(limit).get();
  const members = snapshot.docs.map(doc => doc.data());

  // === 套用資料遮罩 ===
  const maskedMembers = members.map(member => 
    applyMemberMasking(member, userContext.revealAuthority)
  );

  // === 總筆數 ===
  const countSnapshot = await firestoreQuery.count().get();
  const total = countSnapshot.data().count;

  return {
    members: maskedMembers,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
});
```

---

### 3.2 POST `/api/members/:id/reveal` - 解鎖敏感資料

**Request Body**：
```typescript
{
  fields: string[];  // ['mobile', 'email', 'lineId', 'address', 'emergencyContactPhone']
}
```

**Response**：
```typescript
{
  mobile?: string;
  email?: string;
  lineId?: string;
  address?: string;
  emergencyContactPhone?: string;
}
```

**實作**：
```typescript
// server/api/members/[id]/reveal.post.ts
export default defineEventHandler(async (event) => {
  const memberId = getRouterParam(event, 'id');
  const { fields } = await readBody(event);
  const userContext = event.context.userContext;

  // 驗證權限
  if (!hasPermission(userContext, 'member:view')) {
    throw createError({ statusCode: 403, message: '無權限查看會友資料' });
  }

  // 檢查 Scope 權限
  const member = await memberRepository.findById(memberId);
  if (!isInScope(member, userContext)) {
    throw createError({ statusCode: 403, message: '該會友不在您的管轄範圍內' });
  }

  // 驗證解鎖權限
  const result: any = {};
  for (const field of fields) {
    if (!userContext.revealAuthority[field]) {
      throw createError({ 
        statusCode: 403, 
        message: `無權限解鎖欄位: ${field}` 
      });
    }
    result[field] = member[field];
  }

  // 記錄 Audit Log
  await auditLogger.log({
    action: 'REVEAL_SENSITIVE_DATA',
    userId: userContext.userId,
    targetMemberId: memberId,
    fields,
    timestamp: new Date(),
  });

  return result;
});
```

---

## 4. Frontend Architecture

### 4.1 File Structure

```
app/
├── pages/
│   └── members/
│       └── index.vue                    # 會友列表頁（主頁面）
├── components/
│   └── member/
│       ├── MemberListFilters.vue        # 篩選器組件
│       ├── MemberListTable.vue          # 列表表格組件
│       ├── MemberQuickViewModal.vue     # Quick View Modal
│       │   ├── MemberBasicInfo.vue      # Tab 1: 基本資料
│       │   └── MemberCourseRecords.vue  # Tab 2: 修課紀錄
│       └── RevealButton.vue             # 敏感資料解鎖按鈕組件
├── composables/
│   ├── useMemberList.ts                 # 列表邏輯（新增）
│   └── useMember.ts                     # 復用 ST001
├── stores/
│   └── memberList.store.ts              # 列表狀態管理（Pinia）
└── utils/
    └── member/
        └── helpers.ts                   # 輔助函數（年齡計算等）
```

---

### 4.2 Composables

#### 4.2.1 useMemberList (新增)

```typescript
// app/composables/useMemberList.ts
import type { MemberResponse } from '~/types/member';
import type { UserContext } from '~/types/rbac';

export const useMemberList = () => {
  const authStore = useAuthStore();
  const memberListStore = useMemberListStore();
  const toast = useToast();

  // === 狀態 ===
  const members = ref<MemberResponse[]>([]);
  const loading = ref(false);
  const total = ref(0);
  const page = ref(1);
  const limit = ref(20);

  // === 篩選條件 ===
  const filters = ref({
    search: '',
    status: 'Active',
    baptismStatus: 'all',
    zoneId: null as string | null,
    groupId: null as string | null,
  });

  // === 排序 ===
  const sortBy = ref('createdAt');
  const sortOrder = ref<'asc' | 'desc'>('desc');

  // === 載入會友列表 ===
  const fetchMembers = async () => {
    loading.value = true;
    try {
      const response = await $fetch('/api/members', {
        method: 'GET',
        query: {
          page: page.value,
          limit: limit.value,
          ...filters.value,
          sortBy: sortBy.value,
          sortOrder: sortOrder.value,
        },
      });

      members.value = response.members;
      total.value = response.total;

      // 快取到 Pinia Store（5 分鐘 TTL）
      memberListStore.setMembers(response.members, 300);
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: '載入失敗',
        detail: error?.data?.message || '無法載入會友列表',
        life: 5000,
      });
    } finally {
      loading.value = false;
    }
  };

  // === 搜尋功能（前端過濾） ===
  const searchKeyword = ref('');
  const searchActive = computed(() => searchKeyword.value.length > 0);
  
  const filteredMembers = computed(() => {
    if (!searchActive.value) return members.value;
    
    const keyword = searchKeyword.value.toLowerCase();
    return members.value.filter(m => 
      m.fullName.toLowerCase().includes(keyword)
    );
  });

  const handleSearch = () => {
    filters.value.search = searchKeyword.value;
    page.value = 1;
    fetchMembers();
  };

  const clearSearch = () => {
    searchKeyword.value = '';
    filters.value.search = '';
    fetchMembers();
  };

  // === 排序功能 ===
  const onSort = (event: any) => {
    sortBy.value = event.sortField;
    sortOrder.value = event.sortOrder === 1 ? 'asc' : 'desc';
    fetchMembers();
  };

  // === 分頁功能 ===
  const onPageChange = (event: any) => {
    page.value = event.page + 1;
    limit.value = event.rows;
    fetchMembers();
  };

  // === 刪除會友 ===
  const deleteMember = async (uuid: string) => {
    try {
      await $fetch(`/api/members/${uuid}`, { method: 'DELETE' });
      toast.add({
        severity: 'success',
        summary: '刪除成功',
        detail: '會友已刪除',
        life: 3000,
      });
      fetchMembers();
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: '刪除失敗',
        detail: error?.data?.message || '請稍後再試',
        life: 5000,
      });
    }
  };

  // === 權限檢查 ===
  const canViewMembers = computed(() => 
    authStore.hasPermission('member:view')
  );

  const canEditMember = computed(() => 
    authStore.hasPermission('member:edit')
  );

  const canDeleteMember = computed(() => 
    authStore.hasPermission('member:delete')
  );

  return {
    // 狀態
    members,
    filteredMembers,
    loading,
    total,
    page,
    limit,
    filters,
    sortBy,
    sortOrder,
    
    // 搜尋
    searchKeyword,
    searchActive,
    handleSearch,
    clearSearch,
    
    // 功能
    fetchMembers,
    onSort,
    onPageChange,
    deleteMember,
    
    // 權限
    canViewMembers,
    canEditMember,
    canDeleteMember,
  };
};
```

---

#### 4.2.2 useRevealSensitiveData (新增)

```typescript
// app/composables/useRevealSensitiveData.ts
export const useRevealSensitiveData = (memberId: string) => {
  const toast = useToast();
  const confirm = useConfirm();

  const revealedData = ref<Record<string, string>>({});
  const revealing = ref(false);

  // === 解鎖單一欄位 ===
  const revealField = async (field: string) => {
    if (revealedData.value[field]) {
      // 已解鎖，直接顯示
      return;
    }

    revealing.value = true;
    try {
      const response = await $fetch(`/api/members/${memberId}/reveal`, {
        method: 'POST',
        body: { fields: [field] },
      });

      revealedData.value[field] = response[field];
      
      toast.add({
        severity: 'info',
        summary: '已解鎖',
        detail: `已顯示${getFieldLabel(field)}`,
        life: 2000,
      });
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: '解鎖失敗',
        detail: error?.data?.message || '無權限查看此資料',
        life: 5000,
      });
    } finally {
      revealing.value = false;
    }
  };

  // === 一次性解鎖所有欄位 ===
  const revealAllFields = async () => {
    confirm.require({
      message: '您確定要查看所有敏感資料嗎？此操作將被記錄。',
      header: '確認查看敏感資料',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '確定查看',
      rejectLabel: '取消',
      accept: async () => {
        revealing.value = true;
        try {
          const fields = ['mobile', 'email', 'lineId', 'address', 'emergencyContactPhone'];
          const response = await $fetch(`/api/members/${memberId}/reveal`, {
            method: 'POST',
            body: { fields },
          });

          Object.assign(revealedData.value, response);
          
          toast.add({
            severity: 'info',
            summary: '已解鎖全部敏感資料',
            life: 2000,
          });
        } catch (error: any) {
          toast.add({
            severity: 'error',
            summary: '解鎖失敗',
            detail: error?.data?.message || '請稍後再試',
            life: 5000,
          });
        } finally {
          revealing.value = false;
        }
      },
    });
  };

  // === 重置狀態（關閉 Modal 時呼叫） ===
  const resetRevealedData = () => {
    revealedData.value = {};
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      mobile: '手機號碼',
      email: 'Email',
      lineId: 'Line ID',
      address: '地址',
      emergencyContactPhone: '緊急聯絡人電話',
    };
    return labels[field] || field;
  };

  return {
    revealedData,
    revealing,
    revealField,
    revealAllFields,
    resetRevealedData,
  };
};
```

---

### 4.3 Pinia Store

```typescript
// app/stores/memberList.store.ts
import { defineStore } from 'pinia';
import type { MemberResponse } from '~/types/member';

interface CacheEntry {
  data: MemberResponse[];
  expiry: number;
}

export const useMemberListStore = defineStore('memberList', {
  state: () => ({
    cache: null as CacheEntry | null,
  }),

  getters: {
    isCacheValid: (state) => {
      if (!state.cache) return false;
      return state.cache.expiry > Date.now();
    },

    cachedMembers: (state) => {
      if (!state.cache || state.cache.expiry <= Date.now()) {
        return null;
      }
      return state.cache.data;
    },
  },

  actions: {
    setMembers(members: MemberResponse[], ttlSeconds: number) {
      this.cache = {
        data: members,
        expiry: Date.now() + ttlSeconds * 1000,
      };
    },

    clearCache() {
      this.cache = null;
    },
  },
});
```

---

### 4.4 Component Implementation

#### 4.4.1 主頁面 (pages/members/index.vue)

```vue
<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['auth'],
});

const { 
  members,
  filteredMembers,
  loading,
  total,
  page,
  limit,
  filters,
  searchKeyword,
  searchActive,
  handleSearch,
  clearSearch,
  fetchMembers,
  onSort,
  onPageChange,
  deleteMember,
  canViewMembers,
  canEditMember,
  canDeleteMember,
} = useMemberList();

const { hasPermission } = useAuth();
const confirm = useConfirm();

// 權限檢查
if (!canViewMembers.value) {
  // 顯示無權限頁面
  navigateTo('/unauthorized');
}

// Quick View Modal
const showQuickView = ref(false);
const selectedMemberId = ref<string | null>(null);

const onRowClick = (event: any) => {
  selectedMemberId.value = event.data.uuid;
  showQuickView.value = true;
};

// 初始化
onMounted(() => {
  fetchMembers();
});

// 刪除確認
const confirmDelete = (uuid: string, name: string) => {
  confirm.require({
    message: `確定要刪除會友「${name}」嗎？`,
    header: '刪除確認',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: '確定刪除',
    acceptClass: 'p-button-danger',
    rejectLabel: '取消',
    accept: () => deleteMember(uuid),
  });
};

// 計算年齡
const calculateAge = (dob: Date): number => {
  const today = new Date();
  const birthDate = new Date(dob);
  return Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
};

// 角色標籤顯示
const getRoleTags = (member: any) => {
  if (!member.roleIds || member.roleIds.length === 0) return '';
  if (member.roleIds.length === 1) return member.roleNames[0];
  return `${member.roleNames[0]} +${member.roleIds.length - 1}`;
};

const getRoleTooltip = (member: any) => {
  if (!member.roleNames) return '';
  return member.roleNames.join('、');
};
</script>

<template>
  <div class="members-page">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">會友名單管理</h1>
        <p class="text-slate-600">管理所有註冊用戶、設定權限與分組歸屬</p>
      </div>
      <div class="flex gap-3">
        <Button
          v-if="hasPermission('member:export')"
          label="匯出 Excel"
          icon="pi pi-download"
          severity="secondary"
          outlined
        />
        <Button
          v-if="hasPermission('member:create')"
          label="+ 新增會友"
          icon="pi pi-plus"
          severity="secondary"
          @click="navigateTo('/members/create')"
        />
      </div>
    </div>

    <!-- Filters -->
    <MemberListFilters v-model:filters="filters" @search="fetchMembers" />

    <!-- Search Bar -->
    <div class="search-section mb-4 flex gap-2">
      <InputText
        v-model="searchKeyword"
        placeholder="搜尋姓名..."
        class="flex-1"
        @keyup.enter="handleSearch"
      />
      <Button
        label="搜尋"
        icon="pi pi-search"
        @click="handleSearch"
      />
      <Button
        v-if="searchActive"
        label="清除"
        icon="pi pi-times"
        severity="secondary"
        outlined
        @click="clearSearch"
      />
    </div>

    <!-- Search Result Message -->
    <Message v-if="searchActive" severity="info" class="mb-4">
      搜尋結果：找到 {{ filteredMembers.length }} 筆符合「<mark>{{ searchKeyword }}</mark>」的資料
    </Message>

    <!-- Table -->
    <DataTable
      :value="filteredMembers"
      :loading="loading"
      :paginator="true"
      :rows="limit"
      :rowsPerPageOptions="[10, 20, 50, 100]"
      :totalRecords="total"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
      currentPageReportTemplate="顯示 {first}-{last} 筆，共 {totalRecords} 筆資料"
      @page="onPageChange"
      @sort="onSort"
      @row-click="onRowClick"
      selectionMode="single"
      striped-rows
      class="shadow"
    >
      <!-- 姓名/暱稱 -->
      <Column header="姓名/暱稱">
        <template #body="{ data }">
          <div class="flex items-center gap-3">
            <Avatar
              :image="data.avatar"
              :label="data.fullName[0]"
              shape="circle"
              size="large"
            />
            <div>
              <div class="font-semibold">{{ data.fullName }}</div>
              <div class="text-sm text-slate-500">
                <i :class="data.gender === 'Male' ? 'pi pi-mars' : 'pi pi-venus'" />
                {{ calculateAge(data.dob) }} 歲
              </div>
            </div>
          </div>
        </template>
      </Column>

      <!-- 聯絡資訊 -->
      <Column header="聯絡資訊">
        <template #body="{ data }">
          <div class="text-sm">
            <div class="flex items-center gap-2">
              <i class="pi pi-phone text-slate-400" />
              <span>{{ data.mobile }}</span>
            </div>
          </div>
        </template>
      </Column>

      <!-- 角色標籤 -->
      <Column header="角色標籤">
        <template #body="{ data }">
          <Tag
            v-if="data.roleIds && data.roleIds.length > 0"
            :value="getRoleTags(data)"
            v-tooltip.top="getRoleTooltip(data)"
          />
        </template>
      </Column>

      <!-- 歸屬小組 -->
      <Column header="歸屬小組">
        <template #body="{ data }">
          <Tag
            v-if="data.groupId"
            :value="data.groupName"
          />
          <Tag
            v-else
            value="待分發"
            severity="warn"
            @click.stop="navigateTo('/organization/structure')"
            class="cursor-pointer"
          />
        </template>
      </Column>

      <!-- 會籍狀態 -->
      <Column header="會籍狀態">
        <template #body="{ data }">
          <Tag
            :value="data.status === 'Active' ? '啟用' : '停用'"
            :severity="data.status === 'Active' ? 'success' : 'secondary'"
          />
        </template>
      </Column>

      <!-- 年齡（可排序） -->
      <Column field="dob" header="年齡" sortable>
        <template #body="{ data }">
          {{ calculateAge(data.dob) }} 歲
        </template>
      </Column>

      <!-- 操作 -->
      <Column header="操作">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button
              v-if="canEditMember"
              icon="pi pi-pencil"
              severity="secondary"
              text
              rounded
              @click.stop="navigateTo(`/members/${data.uuid}/edit`)"
            />
            <Button
              v-if="canDeleteMember"
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              @click.stop="confirmDelete(data.uuid, data.fullName)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Quick View Modal -->
    <MemberQuickViewModal
      v-model:visible="showQuickView"
      :member-id="selectedMemberId"
    />
  </div>
</template>

<style scoped>
.members-page {
  padding: 2rem;
}

mark {
  background-color: yellow;
  font-weight: bold;
}
</style>
```

---

#### 4.4.2 Quick View Modal Component

```vue
<script setup lang="ts">
// app/components/member/MemberQuickViewModal.vue
import type { MemberResponse } from '~/types/member';

const props = defineProps<{
  visible: boolean;
  memberId: string | null;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

const { fetchMemberById } = useMember();
const { 
  revealedData, 
  revealing, 
  revealField, 
  revealAllFields, 
  resetRevealedData 
} = useRevealSensitiveData(props.memberId || '');

const member = ref<MemberResponse | null>(null);
const loading = ref(false);
const activeTab = ref(0);

// 載入會友資料
watch(() => props.visible, async (visible) => {
  if (visible && props.memberId) {
    loading.value = true;
    member.value = await fetchMemberById(props.memberId);
    loading.value = false;
  } else {
    // 關閉時重置狀態
    resetRevealedData();
    activeTab.value = 0;
  }
});

// 取得顯示值（已解鎖則顯示明碼，否則顯示遮罩）
const getDisplayValue = (field: string, maskedValue: string): string => {
  return revealedData.value[field] || maskedValue;
};

// 響應式判斷
const isMobile = ref(false);
onMounted(() => {
  isMobile.value = window.innerWidth < 768;
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 768;
  });
});
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :modal="true"
    :position="isMobile ? 'bottom' : 'center'"
    :style="{ 
      width: isMobile ? '100%' : '800px',
      maxHeight: isMobile ? '90vh' : 'auto'
    }"
    :header="`會友詳情 - ${member?.fullName || ''}`"
  >
    <div v-if="!loading && member" class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- 左側 Sidebar -->
      <div class="lg:col-span-1">
        <div class="flex flex-col items-center gap-4">
          <!-- Avatar -->
          <Avatar
            :image="member.avatar"
            :label="member.fullName[0]"
            shape="circle"
            size="xlarge"
            style="width: 120px; height: 120px"
          />

          <!-- 角色標籤 -->
          <div class="flex flex-wrap gap-2 justify-center">
            <Tag
              v-for="roleId in member.roleIds"
              :key="roleId"
              :value="roleId"
            />
          </div>

          <!-- 會籍狀態 -->
          <div class="text-center">
            <div class="text-sm text-slate-600">會籍狀態</div>
            <Tag
              :value="member.status === 'Active' ? '啟用' : '停用'"
              :severity="member.status === 'Active' ? 'success' : 'secondary'"
              class="mt-1"
            />
          </div>

          <Divider />

          <!-- 系統資訊 -->
          <div class="w-full space-y-3 text-sm">
            <div>
              <div class="text-slate-600">註冊日期</div>
              <div class="font-semibold">
                {{ new Date(member.createdAt).toLocaleDateString('zh-TW') }}
              </div>
            </div>
            <div>
              <div class="text-slate-600">最後更新</div>
              <div class="font-semibold">
                {{ new Date(member.updatedAt).toLocaleDateString('zh-TW') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右側主內容 -->
      <div class="lg:col-span-3">
        <TabView v-model:active-index="activeTab">
          <!-- Tab 1: 基本資料 -->
          <TabPanel header="基本資料">
            <MemberBasicInfo
              :member="member"
              :revealed-data="revealedData"
              :revealing="revealing"
              @reveal-field="revealField"
              @reveal-all="revealAllFields"
            />
          </TabPanel>

          <!-- Tab 2: 修課紀錄 -->
          <TabPanel header="修課紀錄">
            <MemberCourseRecords :member-id="member.uuid" />
          </TabPanel>
        </TabView>
      </div>
    </div>

    <!-- Loading -->
    <div v-else class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Footer Buttons -->
    <template #footer>
      <Button
        label="取消"
        severity="secondary"
        outlined
        @click="emit('update:visible', false)"
      />
      <Button
        v-if="hasPermission('member:edit')"
        label="編輯資料"
        icon="pi pi-pencil"
        severity="secondary"
        @click="navigateTo(`/members/${member?.uuid}/edit`)"
      />
    </template>
  </Dialog>
</template>
```

---

## 5. Security Considerations

### 5.1 Scope 過濾的強制執行

**原則**：所有查詢必須在後端套用 `applyScopeFilter`，前端無法繞過。

```typescript
// ✅ Good
firestoreQuery = applyScopeFilter(firestoreQuery, userContext);

// ❌ Bad - 前端直接查詢全部資料
const members = await db.collection('members').get();
```

### 5.2 敏感資料解鎖的審計

**每次解鎖都記錄 Audit Log**：
```typescript
await auditLogger.log({
  action: 'REVEAL_SENSITIVE_DATA',
  userId: userContext.userId,
  targetMemberId: memberId,
  fields: ['mobile', 'email'],
  timestamp: new Date(),
  ipAddress: event.node.req.socket.remoteAddress,
});
```

### 5.3 權限檢查的多層防護

**前端檢查（UX 優化）**：
```typescript
if (!hasPermission('member:view')) {
  navigateTo('/unauthorized');
}
```

**後端檢查（安全保障）**：
```typescript
requirePermission(event, 'member:view');
```

---

## 6. Performance Optimization

### 6.1 前端快取策略

**使用 Pinia Store 快取列表資料（TTL: 5 分鐘）**：
- 避免頁面切換後重新載入
- 減少不必要的 API 請求

### 6.2 分頁查詢

**Server-side Pagination**：
- 每次僅載入當前頁的資料
- 使用 Firestore 的 `offset` 與 `limit`

### 6.3 Firestore 索引優化

**建議建立的 Composite Indexes**：
```
Collection: members
- status (ASC) + createdAt (DESC)
- status (ASC) + dob (ASC)
- status (ASC) + dob (DESC)
- zoneId (ASC) + status (ASC) + createdAt (DESC)
- groupId (ASC) + status (ASC) + createdAt (DESC)
```

---

## 7. Empty State & Error Handling

### 7.1 Empty State

**場景 1: 無會友資料**
```vue
<div v-if="members.length === 0 && !loading" class="text-center py-12">
  <i class="pi pi-users text-6xl text-slate-300 mb-4" />
  <h3 class="text-xl font-bold mb-2">目前尚無會友資料</h3>
  <p class="text-slate-600 mb-6">請點擊右上角「新增會友」按鈕開始建立。</p>
  <Button
    v-if="hasPermission('member:create')"
    label="新增會友"
    icon="pi pi-plus"
    severity="secondary"
    @click="navigateTo('/members/create')"
  />
</div>
```

**場景 2: 搜尋無結果**
```vue
<Message v-if="searchActive && filteredMembers.length === 0" severity="warn">
  找不到符合「{{ searchKeyword }}」的資料，請嘗試其他關鍵字。
</Message>
```

**場景 3: 篩選無結果**
```vue
<Message v-if="!searchActive && members.length === 0" severity="info">
  目前沒有符合篩選條件的會友。
</Message>
```

---

### 7.2 Loading State

**使用 PrimeVue DataTable 的內建 Loading**：
```vue
<DataTable :value="members" :loading="loading">
  <!-- ... -->
</DataTable>
```

---

### 7.3 Error Handling

**API 錯誤處理**：
```typescript
try {
  await fetchMembers();
} catch (error: any) {
  if (error.statusCode === 401) {
    // 未登入，跳轉至登入頁
    navigateTo('/login');
  } else if (error.statusCode === 403) {
    // 無權限
    toast.add({
      severity: 'error',
      summary: '無權限',
      detail: '您沒有查看會友列表的權限',
      life: 5000,
    });
    navigateTo('/unauthorized');
  } else if (error.statusCode >= 500) {
    // 伺服器錯誤
    toast.add({
      severity: 'error',
      summary: '系統錯誤',
      detail: '伺服器發生錯誤，請稍後再試',
      life: 5000,
    });
  } else {
    // 其他錯誤
    toast.add({
      severity: 'error',
      summary: '載入失敗',
      detail: error.message || '請稍後再試',
      life: 5000,
    });
  }
}
```

**網路斷線處理**：
```typescript
const handleNetworkError = () => {
  toast.add({
    severity: 'warn',
    summary: '網路連線異常',
    detail: '請檢查您的網路連線',
    life: 0,
    closable: true,
    sticky: true,
  });
};
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

**useMemberList Composable**：
- 測試搜尋功能（前端過濾）
- 測試排序功能
- 測試分頁邏輯

**useRevealSensitiveData Composable**：
- 測試單一欄位解鎖
- 測試批次解鎖
- 測試狀態重置

---

### 8.2 Integration Tests

**API Routes**：
- 測試 Scope 過濾是否正確套用
- 測試篩選條件組合
- 測試解鎖 API 的權限檢查

---

### 8.3 E2E Tests (Playwright)

**關鍵流程**：
1. 登入後進入會友列表頁
2. 使用搜尋功能
3. 使用進階篩選
4. 點擊會友行觸發 Quick View Modal
5. 解鎖敏感資料
6. 編輯會友資料

---

## 9. Migration & Deployment

### 9.1 Checklist

- [ ] 確認 ST001 與 ST002 已部署完成
- [ ] 建立 Firestore Composite Indexes
- [ ] 部署 `/api/members` 列表 API（整合 Scope 過濾）
- [ ] 部署 `/api/members/:id/reveal` 解鎖 API
- [ ] 部署前端列表頁面與 Modal 組件
- [ ] 測試不同角色的 Scope 過濾
- [ ] 測試敏感資料解鎖機制
- [ ] 測試響應式設計（桌面 + 移動端）
- [ ] UAT 測試
- [ ] 部署到 Production

---

### 9.2 Rollback Plan

若功能有問題：
1. 回滾前端部署（恢復舊版列表頁）
2. 回滾 API（暫時移除 Scope 過濾）
3. 使用 Feature Flag 關閉解鎖功能

---

## 10. Future Enhancements (Out of Scope)

- **全文搜尋**：整合 Algolia 或 ElasticSearch
- **批次操作**：批次編輯、批次刪除
- **匯出功能**：Excel 匯出含篩選條件
- **列表自訂欄位**：使用者可自訂顯示欄位
- **進階排序**：支援姓名排序（中文筆劃）
- **虛擬滾動**：大數據量時的效能優化

---

## 11. References

- **Story Document**: `ST003 - 會友資料列表.md`
- **Questions Document**: `ST003 - Questions.md`
- **Design Mockups**: `docs/設計稿/人員管理 - 列表/`
- **Related Stories**: 
  - ST001 (會友資料核心與 Schema 定義)
  - ST002 (RBAC Configuration)
  - ST004 (會友資料 CRUD)
- **Tech Stack**: Nuxt 4, PrimeVue 4, Firebase, TypeScript, Pinia

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-11  
**Author**: AI Assistant  
**Status**: Ready for Implementation
