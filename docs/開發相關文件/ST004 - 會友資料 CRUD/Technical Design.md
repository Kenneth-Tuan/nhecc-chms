# ST004 - Technical Design: 會友資料 CRUD 操作

## 1. Overview

### 1.1 Story Reference
- **Story ID**: ST-004
- **Priority**: Must Have (Core Feature)
- **Phase**: 2 - 核心 CRUD 功能
- **User Story**: As a 行政同工或牧區長, I want to 新增、編輯、刪除會友資料, So that 系統能維護最新且正確的會友資訊，以支援各種牧養與管理功能。

### 1.2 Design Goals
1. 實作完整的會友資料 CRUD 操作（Create, Read, Update, Soft Delete）
2. 提供直觀的表單介面，支援頭像上傳功能
3. 實作牧區小組連動下拉選單，確保資料一致性
4. 整合嚴格的表單驗證機制（前後端雙重驗證）
5. 實作軟刪除機制，保留資料歷史記錄
6. 遵循 RBAC 權限控制（member:create, member:edit, member:delete）
7. 提供良好的使用者體驗（Loading States, Error Feedback, Success Messages）

### 1.3 Dependencies
- ✅ **ST001**: 資料核心與 Schema 定義（復用 Member Schema、Type Definitions）
- ✅ **ST002**: RBAC Configuration（權限檢查、Data Scope 過濾）
- ✅ **ST003**: 會友資料列表（列表頁面作為 CRUD 操作的入口）

### 1.4 Tech Stack
- **Frontend**: Nuxt 4, Vue 3.5 (Composition API), PrimeVue 4.5, TypeScript
- **Form Handling**: PrimeVue Form Components + Zod Validation
- **Backend**: Nitro (Server Routes), Firebase Admin SDK
- **Database**: Firebase Firestore
- **File Upload**: Firebase Storage (頭像存儲)
- **Validation**: Zod (前後端共用 Schema)
- **State Management**: Pinia (列表快取與狀態同步)

---

## 2. Feature Specifications

### 2.1 新增會友 (Create Member)

#### 2.1.1 頁面路由
- **路徑**: `/dashboard/members/create`
- **進入點**: 
  - 會友列表頁的「新增會友」按鈕（位於頁面右上角）
  - 權限要求：`member:create`

#### 2.1.2 表單欄位

表單分為 **5 個區塊**（使用 `Divider` 組件分隔）：

##### **A. 基本資訊 (Basic Info)**

| 欄位 | 類型 | 必填 | 驗證規則 | 說明 |
|------|------|------|---------|------|
| **頭像 (avatar)** | File Upload | ❌ | - 格式：JPG, PNG<br>- 大小上限：2MB<br>- 建議尺寸：300x300px | 會友大頭貼 |
| **姓名 (fullName)** | Text Input | ✅ | - 長度：1-50 字<br>- 不可為空白 | 完整中文姓名 |
| **性別 (gender)** | Radio Button | ✅ | 必選 Male / Female | 生理性別 |
| **出生年月日 (dob)** | Date Picker | ✅ | - 格式：YYYY-MM-DD<br>- 不可為未來日期<br>- 年齡 >= 0 | 用於計算年齡 |

##### **B. 聯絡資訊 (Contact Info)** ⚠️ 敏感個資

| 欄位 | 類型 | 必填 | 驗證規則 | 說明 |
|------|------|------|---------|------|
| **手機 (mobile)** | Text Input | ✅ | - 格式：`09XXXXXXXX` (10碼)<br>- 唯一性：不可重複<br>- 自動去除連字號 | 主要聯絡方式 |
| **Email** | Email Input | ✅ | - 標準 Email 格式<br>- 唯一性：建議檢查 | 電子郵件 |
| **Line ID (lineId)** | Text Input | ❌ | 長度上限：50 字 | 選填 |
| **地址 (address)** | Textarea | ❌ | 長度上限：200 字 | 居住地址 |

##### **C. 緊急聯絡人 (Emergency Contact)** ⚠️ 敏感個資

| 欄位 | 類型 | 必填 | 驗證規則 | 說明 |
|------|------|------|---------|------|
| **姓名 (emergencyContactName)** | Text Input | ✅ | 不可為空白 | 緊急聯絡人姓名 |
| **關係 (emergencyContactRelationship)** | Dropdown | ✅ | 選項：父子、母女、父女、母子、配偶、兄弟姊妹、子女、朋友、其他 | 與會友的關係 |
| **電話 (emergencyContactPhone)** | Text Input | ✅ | 格式：`09XXXXXXXX` | 緊急聯絡電話 |

##### **D. 信仰與歸屬 (Faith & Church Info)**

| 欄位 | 類型 | 必填 | 驗證規則 | 說明 |
|------|------|------|---------|------|
| **受洗狀態 (baptismStatus)** | Checkbox | ❌ | 布林值，預設 false | 是否已受洗 |
| **受洗日期 (baptismDate)** | Date Picker | ❌ | - 僅當 `baptismStatus = true` 時顯示<br>- 格式：YYYY-MM-DD<br>- 不可為未來日期 | 受洗日期 |
| **牧區 (zoneId)** | Dropdown | ❌ | - 選項來自 `/api/organization/zones`<br>- 顯示：牧區名稱<br>- 值：牧區 UUID | 所屬牧區 |
| **小組 (groupId)** | Dropdown | ❌ | - **連動邏輯**：僅顯示所選牧區下的小組<br>- 若未選牧區，此欄位 disabled<br>- 若選擇小組，則牧區為必填 | 所屬小組 |
| **角色 (roleIds)** | MultiSelect | ❌ | - 選項來自 `/api/roles?status=Active`<br>- 可複選<br>- 預設：空陣列 | 會友角色（如：小組長、課程老師等） |
| **已上過的課程 (pastCourses)** | MultiSelect | ❌ | - 選項來自 `/api/courses?status=Active`<br>- 可複選 | 福音課程紀錄 |

##### **E. 系統設定 (System Settings)**

| 欄位 | 類型 | 必填 | 預設值 | 說明 |
|------|------|------|--------|------|
| **會籍狀態 (status)** | Dropdown | ✅ | Active | 選項：Active / Inactive / Suspended |

---

#### 2.1.3 頭像上傳功能

**UI 設計**：
```vue
<div class="avatar-upload-section">
  <label class="block text-sm font-medium mb-2">大頭貼</label>
  <div class="flex items-center gap-4">
    <!-- 預覽區 -->
    <Avatar
      :image="avatarPreview || undefined"
      :label="!avatarPreview ? formData.fullName?.charAt(0) : undefined"
      shape="circle"
      class="!w-24 !h-24 !text-3xl"
    />
    
    <!-- 上傳按鈕 -->
    <FileUpload
      mode="basic"
      accept="image/jpeg,image/png"
      :maxFileSize="2000000"
      :auto="false"
      chooseLabel="選擇圖片"
      @select="onAvatarSelect"
    />
    
    <!-- 移除按鈕 -->
    <Button
      v-if="avatarPreview"
      icon="pi pi-trash"
      severity="danger"
      text
      @click="removeAvatar"
    />
  </div>
  <small class="text-slate-500">支援 JPG、PNG 格式，大小上限 2MB</small>
</div>
```

**上傳流程**：
1. **選擇圖片**：觸發 `@select` 事件，立即顯示預覽
2. **提交表單**：先上傳圖片至 Firebase Storage → 取得 Download URL
3. **儲存會友**：將 Download URL 存入 `member.avatar` 欄位

**上傳實作**：
```typescript
// composables/useAvatarUpload.ts
import { ref } from 'vue';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export function useAvatarUpload() {
  const avatarPreview = ref<string | null>(null);
  const avatarFile = ref<File | null>(null);
  const isUploading = ref(false);

  const onAvatarSelect = (event: any) => {
    const file = event.files[0];
    if (!file) return;

    // Validate file size
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('圖片大小不可超過 2MB');
    }

    avatarFile.value = file;

    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (memberUuid: string): Promise<string | null> => {
    if (!avatarFile.value) return null;

    isUploading.value = true;
    try {
      const storage = getStorage();
      const fileRef = storageRef(storage, `avatars/${memberUuid}/${Date.now()}_${avatarFile.value.name}`);
      
      // Upload file
      await uploadBytes(fileRef, avatarFile.value);
      
      // Get download URL
      const downloadURL = await getDownloadURL(fileRef);
      return downloadURL;
    } catch (error) {
      console.error('Avatar upload failed:', error);
      throw new Error('頭像上傳失敗，請稍後再試');
    } finally {
      isUploading.value = false;
    }
  };

  const removeAvatar = () => {
    avatarPreview.value = null;
    avatarFile.value = null;
  };

  return {
    avatarPreview,
    avatarFile,
    isUploading,
    onAvatarSelect,
    uploadAvatar,
    removeAvatar,
  };
}
```

---

#### 2.1.4 牧區小組連動邏輯

**需求**：
- 選擇牧區後，小組下拉選單僅顯示該牧區下的小組
- 未選牧區時，小組下拉選單為 disabled 狀態
- 切換牧區時，清空已選擇的小組
- 若選擇了小組，則牧區為必填（Zod refinement）

**實作**：
```typescript
// composables/useZoneGroupCascade.ts
import { ref, watch, type Ref } from 'vue';
import type { Zone, Group } from '~/types/organization';

export function useZoneGroupCascade() {
  const zones = ref<Zone[]>([]);
  const groups = ref<Group[]>([]);
  const filteredGroups = ref<Group[]>([]);
  const isLoading = ref(false);

  // Fetch organization structure
  const fetchOrganizationStructure = async () => {
    isLoading.value = true;
    try {
      const response = await $fetch('/api/organization/structure');
      zones.value = response.zones;
      groups.value = response.groups;
    } catch (error) {
      console.error('Failed to fetch organization structure:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  // Filter groups by zone
  const filterGroupsByZone = (zoneId: string | null | undefined) => {
    if (!zoneId) {
      filteredGroups.value = [];
      return;
    }
    filteredGroups.value = groups.value.filter(
      (group) => group.type === 'Pastoral' && group.zoneId === zoneId
    );
  };

  // Watch zone change in form
  const watchZoneChange = (
    zoneIdRef: Ref<string | null | undefined>,
    groupIdRef: Ref<string | null | undefined>
  ) => {
    watch(zoneIdRef, (newZoneId) => {
      // Clear group selection when zone changes
      groupIdRef.value = null;
      
      // Update filtered groups
      filterGroupsByZone(newZoneId);
    });
  };

  return {
    zones,
    groups,
    filteredGroups,
    isLoading,
    fetchOrganizationStructure,
    filterGroupsByZone,
    watchZoneChange,
  };
}
```

**使用範例**：
```vue
<script setup lang="ts">
const { zones, filteredGroups, fetchOrganizationStructure, watchZoneChange } = useZoneGroupCascade();

const formData = ref({
  zoneId: null,
  groupId: null,
  // ... other fields
});

onMounted(async () => {
  await fetchOrganizationStructure();
});

// Watch zone changes
watchZoneChange(
  toRef(formData.value, 'zoneId'),
  toRef(formData.value, 'groupId')
);
</script>

<template>
  <Dropdown
    v-model="formData.zoneId"
    :options="zones"
    optionLabel="name"
    optionValue="id"
    placeholder="請選擇牧區"
  />
  
  <Dropdown
    v-model="formData.groupId"
    :options="filteredGroups"
    optionLabel="name"
    optionValue="id"
    placeholder="請選擇小組"
    :disabled="!formData.zoneId"
  />
</template>
```

---

#### 2.1.5 表單驗證

**前端驗證** (使用 Zod Schema)：
```typescript
import { createMemberSchema } from '~/schemas/member.schema';

const validate = async (formData: any) => {
  try {
    await createMemberSchema.parseAsync(formData);
    return { success: true };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }
  }
};
```

**即時驗證 (Real-time Validation)**：
- **手機號碼**：失焦時驗證格式與唯一性
- **Email**：失焦時驗證格式
- **出生年月日**：選擇日期後立即驗證是否為未來日期

**唯一性檢查 API**：
```typescript
// POST /api/members/check-unique
{
  field: 'mobile',
  value: '0912345678',
  excludeUuid?: 'xxx' // 編輯時排除自己
}

// Response
{
  isUnique: boolean,
  message?: string
}
```

---

#### 2.1.6 提交流程

**步驟**：
1. **表單驗證**：前端 Zod Schema 驗證
2. **頭像上傳**（如果有選擇圖片）：
   - 先生成臨時 UUID（作為 Firebase Storage 路徑）
   - 上傳至 `avatars/{tempUuid}/{timestamp}_{filename}`
   - 取得 Download URL
3. **API 呼叫**：`POST /api/members`
   ```typescript
   const payload = {
     ...formData,
     avatar: avatarUrl, // 步驟 2 的結果
   };
   const response = await $fetch('/api/members', {
     method: 'POST',
     body: payload,
   });
   ```
4. **成功處理**：
   - 顯示成功訊息：「會友新增成功！」
   - 導向會友詳情頁：`/dashboard/members/{uuid}`
   - 或導向會友列表頁並刷新列表
5. **失敗處理**：
   - 顯示錯誤訊息（Toast 通知）
   - 保留表單資料，讓使用者修正

---

### 2.2 編輯會友 (Update Member)

#### 2.2.1 頁面路由
- **路徑**: `/dashboard/members/{uuid}/edit`
- **進入點**:
  - 會友列表頁的「編輯」按鈕（每一行的操作欄）
  - 會友詳情頁的「編輯」按鈕（頁面右上角）
  - Quick View Modal 的「編輯」按鈕
  - 權限要求：`member:edit`（且符合 Data Scope）

#### 2.2.2 表單預填邏輯

**載入流程**：
```typescript
// pages/dashboard/members/[uuid]/edit.vue
<script setup lang="ts">
const route = useRoute();
const memberUuid = route.params.uuid as string;

const { member, isLoading, fetchMember } = useMember();
const formData = ref<Partial<CreateMemberPayload>>({});

onMounted(async () => {
  await fetchMember(memberUuid);
  
  // Pre-fill form data
  if (member.value) {
    formData.value = {
      fullName: member.value.fullName,
      gender: member.value.gender,
      dob: member.value.dob,
      email: member.value.email,
      mobile: member.value.mobile,
      address: member.value.address,
      lineId: member.value.lineId,
      emergencyContactName: member.value.emergencyContactName,
      emergencyContactRelationship: member.value.emergencyContactRelationship,
      emergencyContactPhone: member.value.emergencyContactPhone,
      baptismStatus: member.value.baptismStatus,
      baptismDate: member.value.baptismDate,
      status: member.value.status,
      zoneId: member.value.zoneId,
      groupId: member.value.groupId,
      pastCourses: member.value.pastCourses,
      avatar: member.value.avatar,
    };
  }
});
</script>
```

**表單差異**（與新增表單的不同）：
1. **頭像欄位**：顯示現有頭像，提供「更換」與「移除」按鈕
2. **唯一性驗證**：檢查手機號碼時，排除自己的 UUID
3. **表單標題**：「編輯會友資料」
4. **提交按鈕**：「儲存變更」

---

#### 2.2.3 頭像編輯功能

**UI 設計**：
```vue
<div class="avatar-edit-section">
  <label class="block text-sm font-medium mb-2">大頭貼</label>
  <div class="flex items-center gap-4">
    <!-- 預覽區：顯示現有頭像或新選擇的頭像 -->
    <Avatar
      :image="avatarPreview || formData.avatar || undefined"
      :label="!avatarPreview && !formData.avatar ? formData.fullName?.charAt(0) : undefined"
      shape="circle"
      class="!w-24 !h-24 !text-3xl"
    />
    
    <!-- 更換按鈕 -->
    <FileUpload
      mode="basic"
      accept="image/jpeg,image/png"
      :maxFileSize="2000000"
      :auto="false"
      chooseLabel="更換圖片"
      @select="onAvatarSelect"
    />
    
    <!-- 移除按鈕（僅當有頭像時顯示） -->
    <Button
      v-if="formData.avatar || avatarPreview"
      icon="pi pi-trash"
      severity="danger"
      text
      @click="removeAvatar"
    />
  </div>
  <small class="text-slate-500">支援 JPG、PNG 格式，大小上限 2MB</small>
</div>
```

**移除頭像邏輯**：
```typescript
const removeAvatar = () => {
  // Clear preview and file
  avatarPreview.value = null;
  avatarFile.value = null;
  
  // Mark for deletion (send null to API)
  formData.value.avatar = null;
};
```

---

#### 2.2.4 提交流程

**步驟**：
1. **表單驗證**：前端 Zod Schema 驗證（使用 `updateMemberSchema`，所有欄位為 optional）
2. **頭像處理**：
   - 若有新選擇的圖片 → 上傳至 Firebase Storage，取得新 URL
   - 若點擊「移除」→ `avatar = null`（後端刪除舊圖片）
   - 若無變動 → 不傳 `avatar` 欄位
3. **API 呼叫**：`PATCH /api/members/{uuid}`
   ```typescript
   const payload = {
     ...formData.value,
     avatar: newAvatarUrl || formData.value.avatar,
   };
   const response = await $fetch(`/api/members/${memberUuid}`, {
     method: 'PATCH',
     body: payload,
   });
   ```
4. **成功處理**：
   - 顯示成功訊息：「會友資料已更新！」
   - 導向會友詳情頁：`/dashboard/members/{uuid}`
5. **失敗處理**：
   - 顯示錯誤訊息（Toast 通知）
   - 保留表單資料，讓使用者修正

---

#### 2.2.5 樂觀更新 (Optimistic Update)

為提升使用者體驗，編輯成功後立即更新 Pinia Store 中的快取資料：

```typescript
// stores/memberStore.ts
export const useMemberStore = defineStore('member', () => {
  const members = ref<MemberListItem[]>([]);
  
  const updateMemberInList = (uuid: string, updates: Partial<MemberListItem>) => {
    const index = members.value.findIndex((m) => m.uuid === uuid);
    if (index !== -1) {
      members.value[index] = { ...members.value[index], ...updates };
    }
  };

  return {
    members,
    updateMemberInList,
  };
});
```

**使用時機**：
- 編輯成功後，立即更新列表中的會友資料
- 避免重新呼叫列表 API，減少 Loading 時間

---

### 2.3 刪除會友 (Soft Delete Member)

#### 2.3.1 軟刪除機制

**設計原則**：
- **不實際刪除資料**：保留會友紀錄於資料庫
- **標記為 Inactive**：將 `status` 欄位改為 `Inactive`
- **保留歷史記錄**：audit logs 仍可追溯刪除操作
- **可恢復**：管理員可將 `status` 改回 `Active`（透過編輯功能）

#### 2.3.2 刪除觸發點

**位置**：
1. **會友列表頁**：每一行的「刪除」按鈕（操作欄）
2. **會友詳情頁**：頁面右上角的「刪除」按鈕（Dropdown Menu）

**權限要求**：
- `member:delete`
- 符合 Data Scope（僅能刪除管轄範圍內的會友）

#### 2.3.3 刪除確認對話框

**UI 設計**：
```vue
<Dialog
  v-model:visible="showDeleteDialog"
  header="確認刪除"
  :modal="true"
  :style="{ width: '500px' }"
>
  <div class="space-y-4">
    <div class="flex items-center gap-3">
      <i class="pi pi-exclamation-triangle text-amber-500 text-3xl" />
      <p class="text-sm">
        確定要刪除會友「<strong>{{ member.fullName }}</strong>」嗎？
      </p>
    </div>
    
    <!-- Deletion Reason -->
    <div class="field">
      <label for="deletionReason" class="block text-sm font-medium mb-2">
        刪除原因 <span class="text-red-500">*</span>
      </label>
      <Dropdown
        id="deletionReason"
        v-model="deletionReason"
        :options="deletionReasonOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="請選擇刪除原因"
        class="w-full"
      />
    </div>
    
    <!-- Additional Notes (optional) -->
    <div class="field" v-if="deletionReason === 'other'">
      <label for="deletionNotes" class="block text-sm font-medium mb-2">
        備註說明
      </label>
      <Textarea
        id="deletionNotes"
        v-model="deletionNotes"
        rows="3"
        placeholder="請說明刪除原因..."
        class="w-full"
      />
    </div>
    
    <Message severity="warn" :closable="false">
      此操作將會記錄於審計日誌中，會友資料將標記為停用但不會被實際刪除。
    </Message>
  </div>
  
  <template #footer>
    <Button
      label="取消"
      severity="secondary"
      outlined
      @click="showDeleteDialog = false"
    />
    <Button
      label="確認刪除"
      severity="danger"
      :disabled="!deletionReason"
      :loading="isDeletingMember"
      @click="handleDelete"
    />
  </template>
</Dialog>

<script setup lang="ts">
const showDeleteDialog = ref(false);
const deletionReason = ref('');
const deletionNotes = ref('');
const isDeletingMember = ref(false);

const deletionReasonOptions = [
  { label: '離開教會', value: 'left_church' },
  { label: '遷移至其他教會', value: 'transferred' },
  { label: '重複建檔', value: 'duplicate' },
  { label: '資料錯誤', value: 'data_error' },
  { label: '其他原因', value: 'other' },
];

const confirmDelete = () => {
  showDeleteDialog.value = true;
  deletionReason.value = '';
  deletionNotes.value = '';
};

const handleDelete = async () => {
  if (!deletionReason.value) return;
  
  isDeletingMember.value = true;
  try {
    await $fetch(`/api/members/${memberUuid}`, {
      method: 'DELETE',
      body: {
        reason: deletionReason.value,
        notes: deletionNotes.value,
      },
    });
    
    // Success
    toast.add({
      severity: 'success',
      summary: '刪除成功',
      detail: '會友資料已標記為停用',
      life: 3000,
    });
    
    showDeleteDialog.value = false;
    navigateTo('/dashboard/members');
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: '刪除失敗',
      detail: error.data?.message || '無法刪除會友，請稍後再試',
      life: 5000,
    });
  } finally {
    isDeletingMember.value = false;
  }
};
</script>
```

#### 2.3.4 刪除後處理

**前端行為**：
1. 顯示成功訊息：「會友資料已標記為停用」
2. 若在詳情頁：導向會友列表頁
3. 若在列表頁：
   - 從列表中移除該筆資料（樂觀更新）
   - 或重新載入列表（取決於實作策略）

**後端行為**（`DELETE /api/members/{uuid}`）：
```typescript
// server/api/members/[uuid].delete.ts
export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid');
  const userContext = event.context.userContext;

  // Permission check
  if (!userContext.permissions.includes('member:delete')) {
    throw createError({
      statusCode: 403,
      message: '無權刪除會友資料',
    });
  }

  // Fetch member
  const memberDoc = await db.collection('members').doc(uuid).get();
  if (!memberDoc.exists) {
    throw createError({
      statusCode: 404,
      message: '會友不存在',
    });
  }

  const member = memberDoc.data() as Member;

  // Scope check
  if (!canAccessMember(userContext, member)) {
    throw createError({
      statusCode: 403,
      message: '無權刪除此會友（超出管轄範圍）',
    });
  }

  // Parse deletion reason from request body
  const { reason, notes } = await readBody(event);
  
  if (!reason) {
    throw createError({
      statusCode: 400,
      message: '刪除原因為必填',
    });
  }

  // Soft delete: Update status to Inactive
  await memberDoc.ref.update({
    status: 'Inactive',
    deletionReason: reason,
    deletionNotes: notes || '',
    deletedAt: FieldValue.serverTimestamp(),
    deletedBy: userContext.userId,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: userContext.userId,
  });

  // Audit log
  await createAuditLog({
    action: 'member:delete',
    resource: 'members',
    resourceId: uuid,
    userId: userContext.userId,
    details: {
      memberName: member.fullName,
      previousStatus: member.status,
      deletionReason: reason,
      deletionNotes: notes,
    },
  });

  return { success: true, message: '會友已標記為停用' };
});
```

---

### 2.4 會友詳情頁 (Member Detail View)

#### 2.4.1 頁面路由
- **路徑**: `/dashboard/members/{uuid}`
- **進入點**:
  - 會友列表頁點擊姓名或頭像
  - 編輯成功後自動導向
  - 權限要求：符合 Data Scope

#### 2.4.2 頁面佈局

```vue
<template>
  <div class="member-detail-page">
    <!-- Header -->
    <div class="page-header flex justify-between items-center mb-6">
      <div class="flex items-center gap-3">
        <Button
          icon="pi pi-arrow-left"
          text
          @click="navigateTo('/dashboard/members')"
        />
        <h1 class="text-2xl font-bold">會友資料</h1>
      </div>
      
      <!-- Actions -->
      <div class="flex gap-2">
        <Button
          label="編輯"
          icon="pi pi-pencil"
          @click="navigateTo(`/dashboard/members/${uuid}/edit`)"
          v-if="canEdit"
        />
        <Button
          icon="pi pi-ellipsis-v"
          text
          @click="toggleMenu"
        />
        <Menu ref="menu" :model="menuItems" :popup="true" />
      </div>
    </div>

    <!-- Content: Similar to Quick View Modal but full-page -->
    <TabView>
      <TabPanel header="基本資料">
        <MemberBasicInfo :member="member" />
      </TabPanel>
      <TabPanel header="課程紀錄">
        <MemberCourseRecords :member="member" />
      </TabPanel>
    </TabView>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const uuid = route.params.uuid as string;

const { member, isLoading, fetchMember } = useMember();
const auth = useAuth();

const canEdit = computed(() => auth.hasPermission('member:edit'));
const canDelete = computed(() => auth.hasPermission('member:delete'));

const menuItems = computed(() => [
  {
    label: '刪除會友',
    icon: 'pi pi-trash',
    visible: canDelete.value,
    command: () => confirmDelete(),
  },
]);

onMounted(async () => {
  await fetchMember(uuid);
});
</script>
```

---

## 3. API Specification

### 3.1 POST `/api/members` - 建立會友

**Request Body**：
```typescript
{
  fullName: string;
  gender: 'Male' | 'Female';
  dob: string; // ISO date
  email: string;
  mobile: string; // 09XXXXXXXX
  address?: string;
  lineId?: string;
  emergencyContactName: string;
  emergencyContactRelationship: string; // 父子、母女、父女、母子、配偶、兄弟姊妹、子女、朋友、其他
  emergencyContactPhone: string;
  baptismStatus: boolean;
  baptismDate?: string;
  status?: 'Active' | 'Inactive' | 'Suspended'; // default: Active
  zoneId?: string;
  groupId?: string;
  roleIds?: string[]; // 會友角色，default: []
  pastCourses?: string[];
  functionalGroupIds?: string[]; // default: []
  avatar?: string; // Firebase Storage URL
}
```

**Response**：
```typescript
{
  uuid: string;
  fullName: string;
  // ... other member fields
  createdAt: string;
  updatedAt: string;
}
```

**Backend Implementation**：
```typescript
// server/api/members/index.post.ts
import { createMemberSchema } from '~/schemas/member.schema';
import { FieldValue } from 'firebase-admin/firestore';

export default defineEventHandler(async (event) => {
  const userContext = event.context.userContext;

  // Permission check
  if (!userContext.permissions.includes('member:create')) {
    throw createError({
      statusCode: 403,
      message: '無權建立會友資料',
    });
  }

  // Parse and validate request body
  const body = await readBody(event);
  const validatedData = await createMemberSchema.parseAsync(body);

  // Check mobile uniqueness
  const existingMember = await db.collection('members')
    .where('mobile', '==', validatedData.mobile)
    .limit(1)
    .get();

  if (!existingMember.empty) {
    throw createError({
      statusCode: 400,
      message: '此手機號碼已被使用',
    });
  }

  // Validate zone-group relationship
  if (validatedData.groupId) {
    const group = await db.collection('groups').doc(validatedData.groupId).get();
    if (!group.exists || group.data()?.zoneId !== validatedData.zoneId) {
      throw createError({
        statusCode: 400,
        message: '小組與牧區不匹配',
      });
    }
  }

  // Create member document
  const memberRef = db.collection('members').doc();
  const memberData = {
    uuid: memberRef.id,
    ...validatedData,
    roleIds: validatedData.roleIds || [],
    functionalGroupIds: validatedData.functionalGroupIds || [],
    pastCourses: validatedData.pastCourses || [],
    status: validatedData.status || 'Active',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: userContext.userId,
    updatedBy: userContext.userId,
  };

  await memberRef.set(memberData);

  // Audit log
  await createAuditLog({
    action: 'member:create',
    resource: 'members',
    resourceId: memberRef.id,
    userId: userContext.userId,
    details: {
      memberName: validatedData.fullName,
      mobile: validatedData.mobile,
    },
  });

  return {
    ...memberData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
});
```

---

### 3.2 PATCH `/api/members/{uuid}` - 更新會友

**Request Body** (所有欄位皆為 optional)：
```typescript
{
  fullName?: string;
  gender?: 'Male' | 'Female';
  dob?: string;
  email?: string;
  mobile?: string;
  address?: string;
  lineId?: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  baptismStatus?: boolean;
  baptismDate?: string;
  status?: 'Active' | 'Inactive' | 'Suspended';
  zoneId?: string;
  groupId?: string;
  pastCourses?: string[];
  avatar?: string | null; // null = delete avatar
}
```

**Response**：
```typescript
{
  uuid: string;
  // ... updated member fields
  updatedAt: string;
}
```

**Backend Implementation**：
```typescript
// server/api/members/[uuid].patch.ts
import { updateMemberSchema } from '~/schemas/member.schema';

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid');
  const userContext = event.context.userContext;

  // Permission check
  if (!userContext.permissions.includes('member:edit')) {
    throw createError({
      statusCode: 403,
      message: '無權編輯會友資料',
    });
  }

  // Fetch existing member
  const memberDoc = await db.collection('members').doc(uuid).get();
  if (!memberDoc.exists) {
    throw createError({
      statusCode: 404,
      message: '會友不存在',
    });
  }

  const existingMember = memberDoc.data() as Member;

  // Scope check
  if (!canAccessMember(userContext, existingMember)) {
    throw createError({
      statusCode: 403,
      message: '無權編輯此會友（超出管轄範圍）',
    });
  }

  // Parse and validate request body
  const body = await readBody(event);
  const validatedData = await updateMemberSchema.parseAsync(body);

  // Check mobile uniqueness (if mobile is being updated)
  if (validatedData.mobile && validatedData.mobile !== existingMember.mobile) {
    const existingMember = await db.collection('members')
      .where('mobile', '==', validatedData.mobile)
      .limit(1)
      .get();

    if (!existingMember.empty) {
      throw createError({
        statusCode: 400,
        message: '此手機號碼已被使用',
      });
    }
  }

  // Validate zone-group relationship (if being updated)
  if (validatedData.groupId) {
    const zoneId = validatedData.zoneId || existingMember.zoneId;
    const group = await db.collection('groups').doc(validatedData.groupId).get();
    if (!group.exists || group.data()?.zoneId !== zoneId) {
      throw createError({
        statusCode: 400,
        message: '小組與牧區不匹配',
      });
    }
  }

  // Handle avatar deletion
  if (validatedData.avatar === null && existingMember.avatar) {
    // TODO: Delete old avatar from Firebase Storage
    // await deleteFile(existingMember.avatar);
  }

  // Update member document
  const updateData = {
    ...validatedData,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: userContext.userId,
  };

  await memberDoc.ref.update(updateData);

  // Audit log
  await createAuditLog({
    action: 'member:update',
    resource: 'members',
    resourceId: uuid,
    userId: userContext.userId,
    details: {
      memberName: existingMember.fullName,
      changes: Object.keys(validatedData),
    },
  });

  return {
    ...existingMember,
    ...validatedData,
    updatedAt: new Date().toISOString(),
  };
});
```

---

### 3.3 DELETE `/api/members/{uuid}` - 軟刪除會友

**Request Body**：
```typescript
{
  reason: string; // 刪除原因：left_church, transferred, duplicate, data_error, other
  notes?: string; // 額外備註（當 reason = 'other' 時建議填寫）
}
```

**Response**：
```typescript
{
  success: boolean;
  message: string;
}
```

**實作細節**：參考 [2.3.4 刪除後處理](#234-刪除後處理)

---

### 3.4 POST `/api/members/check-unique` - 檢查欄位唯一性

**Request Body**：
```typescript
{
  field: 'mobile' | 'email';
  value: string;
  excludeUuid?: string; // 編輯時排除自己
}
```

**Response**：
```typescript
{
  isUnique: boolean;
  message?: string;
}
```

**Backend Implementation**：
```typescript
// server/api/members/check-unique.post.ts
export default defineEventHandler(async (event) => {
  const { field, value, excludeUuid } = await readBody(event);

  if (!['mobile', 'email'].includes(field)) {
    throw createError({
      statusCode: 400,
      message: '不支援的欄位',
    });
  }

  let query = db.collection('members').where(field, '==', value);

  if (excludeUuid) {
    query = query.where('uuid', '!=', excludeUuid);
  }

  const snapshot = await query.limit(1).get();

  return {
    isUnique: snapshot.empty,
    message: snapshot.empty ? '可使用' : `此${field === 'mobile' ? '手機號碼' : 'Email'}已被使用`,
  };
});
```

---

## 4. Frontend Implementation

### 4.1 File Structure

```
app/
├── pages/
│   └── dashboard/
│       └── members/
│           ├── index.vue                   # 會友列表頁 (已存在於 ST003)
│           ├── create.vue                  # 🆕 新增會友頁
│           └── [uuid]/
│               ├── index.vue               # 🆕 會友詳情頁
│               └── edit.vue                # 🆕 編輯會友頁
├── components/
│   └── member/
│       ├── MemberForm.vue                  # 🆕 會友表單（Create/Edit 共用）
│       ├── MemberBasicInfo.vue             # ✅ 已存在（Quick View Modal 使用）
│       ├── MemberCourseRecords.vue         # ✅ 已存在（Quick View Modal 使用）
│       ├── MemberListTable.vue             # ✅ 已存在
│       └── MemberQuickViewModal.vue        # ✅ 已存在
├── composables/
│   ├── useMember.ts                        # 🔄 擴充 CRUD 方法
│   ├── useZoneGroupCascade.ts              # 🆕 牧區小組連動邏輯
│   └── useAvatarUpload.ts                  # 🆕 頭像上傳邏輯
├── schemas/
│   └── member.schema.ts                    # ✅ 已存在
└── types/
    └── member.ts                           # ✅ 已存在
```

---

### 4.2 頁面實作

#### 4.2.1 新增會友頁 (`pages/dashboard/members/create.vue`)

```vue
<template>
  <div class="create-member-page max-w-4xl mx-auto py-6">
    <!-- Page Header -->
    <div class="flex items-center gap-3 mb-6">
      <Button
        icon="pi pi-arrow-left"
        text
        @click="navigateTo('/dashboard/members')"
      />
      <h1 class="text-2xl font-bold">新增會友</h1>
    </div>

    <!-- Form -->
    <Card>
      <template #content>
        <MemberForm
          :loading="isSubmitting"
          @submit="handleCreate"
          @cancel="navigateTo('/dashboard/members')"
        />
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast';
import type { CreateMemberPayload } from '~/types/member';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth'],
});

const toast = useToast();
const { createMember, isSubmitting } = useMember();

const handleCreate = async (formData: CreateMemberPayload) => {
  try {
    const newMember = await createMember(formData);
    
    toast.add({
      severity: 'success',
      summary: '新增成功',
      detail: `會友「${newMember.fullName}」已成功建立`,
      life: 3000,
    });
    
    // Redirect to member detail page
    navigateTo(`/dashboard/members/${newMember.uuid}`);
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: '新增失敗',
      detail: error.data?.message || '無法建立會友，請稍後再試',
      life: 5000,
    });
  }
};
</script>
```

---

#### 4.2.2 編輯會友頁 (`pages/dashboard/members/[uuid]/edit.vue`)

```vue
<template>
  <div class="edit-member-page max-w-4xl mx-auto py-6">
    <!-- Page Header -->
    <div class="flex items-center gap-3 mb-6">
      <Button
        icon="pi pi-arrow-left"
        text
        @click="navigateTo(`/dashboard/members/${uuid}`)"
      />
      <h1 class="text-2xl font-bold">編輯會友資料</h1>
    </div>

    <!-- Loading State -->
    <Card v-if="isLoading">
      <template #content>
        <div class="flex justify-center py-8">
          <ProgressSpinner />
        </div>
      </template>
    </Card>

    <!-- Form -->
    <Card v-else-if="member">
      <template #content>
        <MemberForm
          :member="member"
          :loading="isSubmitting"
          @submit="handleUpdate"
          @cancel="navigateTo(`/dashboard/members/${uuid}`)"
        />
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast';
import type { UpdateMemberPayload } from '~/types/member';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth'],
});

const route = useRoute();
const uuid = route.params.uuid as string;
const toast = useToast();

const { member, isLoading, fetchMember, updateMember, isSubmitting } = useMember();

onMounted(async () => {
  await fetchMember(uuid);
});

const handleUpdate = async (formData: UpdateMemberPayload) => {
  try {
    const updatedMember = await updateMember(uuid, formData);
    
    toast.add({
      severity: 'success',
      summary: '更新成功',
      detail: '會友資料已成功更新',
      life: 3000,
    });
    
    // Redirect to member detail page
    navigateTo(`/dashboard/members/${uuid}`);
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: '更新失敗',
      detail: error.data?.message || '無法更新會友資料，請稍後再試',
      life: 5000,
    });
  }
};
</script>
```

---

#### 4.2.3 會友詳情頁 (`pages/dashboard/members/[uuid]/index.vue`)

```vue
<template>
  <div class="member-detail-page max-w-6xl mx-auto py-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Member Detail -->
    <div v-else-if="member">
      <!-- Page Header -->
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center gap-3">
          <Button
            icon="pi pi-arrow-left"
            text
            @click="navigateTo('/dashboard/members')"
          />
          <h1 class="text-2xl font-bold">會友資料</h1>
        </div>
        
        <!-- Actions -->
        <div class="flex gap-2">
          <Button
            v-if="auth.hasPermission('member:edit')"
            label="編輯"
            icon="pi pi-pencil"
            @click="navigateTo(`/dashboard/members/${uuid}/edit`)"
          />
          <Button
            v-if="auth.hasPermission('member:delete')"
            icon="pi pi-trash"
            severity="danger"
            outlined
            @click="confirmDelete"
          />
        </div>
      </div>

      <!-- Content -->
      <TabView>
        <TabPanel header="基本資料">
          <MemberBasicInfo :member="member" />
        </TabPanel>
        <TabPanel header="課程紀錄">
          <MemberCourseRecords :member="member" />
        </TabPanel>
      </TabView>
    </div>

    <!-- Not Found -->
    <Card v-else>
      <template #content>
        <div class="text-center py-8">
          <i class="pi pi-exclamation-circle text-4xl text-slate-400 mb-3" />
          <p class="text-lg text-slate-600">會友資料不存在</p>
          <Button
            label="返回列表"
            class="mt-4"
            @click="navigateTo('/dashboard/members')"
          />
        </div>
      </template>
    </Card>

    <!-- Delete Confirmation -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth'],
});

const route = useRoute();
const uuid = route.params.uuid as string;
const confirm = useConfirm();
const toast = useToast();
const auth = useAuth();

const { member, isLoading, fetchMember, deleteMember } = useMember();

onMounted(async () => {
  await fetchMember(uuid);
});

const confirmDelete = () => {
  confirm.require({
    message: `確定要刪除會友「${member.value?.fullName}」嗎？`,
    header: '確認刪除',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: '確認刪除',
    rejectLabel: '取消',
    accept: async () => {
      try {
        await deleteMember(uuid);
        
        toast.add({
          severity: 'success',
          summary: '刪除成功',
          detail: '會友資料已標記為停用',
          life: 3000,
        });
        
        navigateTo('/dashboard/members');
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: '刪除失敗',
          detail: error.data?.message || '無法刪除會友，請稍後再試',
          life: 5000,
        });
      }
    },
  });
};
</script>
```

---

### 4.3 Composables 實作

#### 4.3.1 擴充 `useMember` Composable

```typescript
// composables/useMember.ts
import { ref } from 'vue';
import type { Member, MemberDetail, CreateMemberPayload, UpdateMemberPayload } from '~/types/member';

export function useMember() {
  const member = ref<MemberDetail | null>(null);
  const isLoading = ref(false);
  const isSubmitting = ref(false);

  /**
   * Fetch single member by UUID
   */
  const fetchMember = async (uuid: string): Promise<void> => {
    isLoading.value = true;
    try {
      const response = await $fetch<MemberDetail>(`/api/members/${uuid}`);
      member.value = response;
    } catch (error) {
      console.error('Failed to fetch member:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Create new member
   */
  const createMember = async (payload: CreateMemberPayload): Promise<Member> => {
    isSubmitting.value = true;
    try {
      const response = await $fetch<Member>('/api/members', {
        method: 'POST',
        body: payload,
      });
      return response;
    } catch (error) {
      console.error('Failed to create member:', error);
      throw error;
    } finally {
      isSubmitting.value = false;
    }
  };

  /**
   * Update existing member
   */
  const updateMember = async (uuid: string, payload: UpdateMemberPayload): Promise<Member> => {
    isSubmitting.value = true;
    try {
      const response = await $fetch<Member>(`/api/members/${uuid}`, {
        method: 'PATCH',
        body: payload,
      });
      
      // Update local state
      if (member.value && member.value.uuid === uuid) {
        member.value = { ...member.value, ...response };
      }
      
      return response;
    } catch (error) {
      console.error('Failed to update member:', error);
      throw error;
    } finally {
      isSubmitting.value = false;
    }
  };

  /**
   * Soft delete member (set status to Inactive)
   */
  const deleteMember = async (uuid: string): Promise<void> => {
    isSubmitting.value = true;
    try {
      await $fetch(`/api/members/${uuid}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete member:', error);
      throw error;
    } finally {
      isSubmitting.value = false;
    }
  };

  /**
   * Check if field value is unique
   */
  const checkUnique = async (
    field: 'mobile' | 'email',
    value: string,
    excludeUuid?: string
  ): Promise<boolean> => {
    try {
      const response = await $fetch<{ isUnique: boolean }>('/api/members/check-unique', {
        method: 'POST',
        body: { field, value, excludeUuid },
      });
      return response.isUnique;
    } catch (error) {
      console.error('Failed to check uniqueness:', error);
      return false;
    }
  };

  return {
    member,
    isLoading,
    isSubmitting,
    fetchMember,
    createMember,
    updateMember,
    deleteMember,
    checkUnique,
  };
}
```

---

## 5. Form Component Implementation

### 5.1 MemberForm Component

```vue
<!-- components/member/MemberForm.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="member-form space-y-6">
    <!-- A. 基本資訊 -->
    <Divider align="left">
      <div class="flex items-center gap-2">
        <i class="pi pi-user" />
        <span class="font-semibold">基本資訊</span>
      </div>
    </Divider>

    <!-- Avatar Upload -->
    <div class="avatar-upload-section">
      <label class="block text-sm font-medium mb-2">大頭貼</label>
      <div class="flex items-center gap-4">
        <Avatar
          :image="avatarPreview || formData.avatar || undefined"
          :label="!avatarPreview && !formData.avatar ? formData.fullName?.charAt(0) : undefined"
          shape="circle"
          class="!w-24 !h-24 !text-3xl"
        />
        
        <FileUpload
          mode="basic"
          accept="image/jpeg,image/png"
          :maxFileSize="2000000"
          :auto="false"
          :chooseLabel="member ? '更換圖片' : '選擇圖片'"
          @select="onAvatarSelect"
        />
        
        <Button
          v-if="formData.avatar || avatarPreview"
          icon="pi pi-trash"
          severity="danger"
          text
          @click="removeAvatar"
        />
      </div>
      <small class="text-slate-500">支援 JPG、PNG 格式，大小上限 2MB</small>
      <Message v-if="errors.avatar" severity="error" :closable="false">
        {{ errors.avatar }}
      </Message>
    </div>

    <!-- Full Name -->
    <div class="field">
      <label for="fullName" class="block text-sm font-medium mb-2">
        姓名 <span class="text-red-500">*</span>
      </label>
      <InputText
        id="fullName"
        v-model="formData.fullName"
        placeholder="請輸入姓名"
        :class="{ 'p-invalid': errors.fullName }"
        class="w-full"
      />
      <small v-if="errors.fullName" class="p-error">{{ errors.fullName }}</small>
    </div>

    <!-- Gender -->
    <div class="field">
      <label class="block text-sm font-medium mb-2">
        性別 <span class="text-red-500">*</span>
      </label>
      <div class="flex gap-4">
        <div class="flex items-center">
          <RadioButton
            v-model="formData.gender"
            inputId="gender-male"
            value="Male"
          />
          <label for="gender-male" class="ml-2">男</label>
        </div>
        <div class="flex items-center">
          <RadioButton
            v-model="formData.gender"
            inputId="gender-female"
            value="Female"
          />
          <label for="gender-female" class="ml-2">女</label>
        </div>
      </div>
      <small v-if="errors.gender" class="p-error">{{ errors.gender }}</small>
    </div>

    <!-- Date of Birth -->
    <div class="field">
      <label for="dob" class="block text-sm font-medium mb-2">
        出生年月日 <span class="text-red-500">*</span>
      </label>
      <DatePicker
        id="dob"
        v-model="formData.dob"
        dateFormat="yy-mm-dd"
        :maxDate="new Date()"
        showIcon
        :class="{ 'p-invalid': errors.dob }"
        class="w-full"
      />
      <small v-if="errors.dob" class="p-error">{{ errors.dob }}</small>
    </div>

    <!-- B. 聯絡資訊 -->
    <Divider align="left">
      <div class="flex items-center gap-2">
        <i class="pi pi-phone" />
        <span class="font-semibold">聯絡資訊</span>
      </div>
    </Divider>

    <!-- Mobile -->
    <div class="field">
      <label for="mobile" class="block text-sm font-medium mb-2">
        手機 <span class="text-red-500">*</span>
      </label>
      <InputText
        id="mobile"
        v-model="formData.mobile"
        placeholder="0912345678"
        :class="{ 'p-invalid': errors.mobile }"
        class="w-full"
        @blur="validateMobileUniqueness"
      />
      <small v-if="errors.mobile" class="p-error">{{ errors.mobile }}</small>
    </div>

    <!-- Email -->
    <div class="field">
      <label for="email" class="block text-sm font-medium mb-2">
        Email <span class="text-red-500">*</span>
      </label>
      <InputText
        id="email"
        v-model="formData.email"
        type="email"
        placeholder="example@church.org"
        :class="{ 'p-invalid': errors.email }"
        class="w-full"
      />
      <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
    </div>

    <!-- Line ID -->
    <div class="field">
      <label for="lineId" class="block text-sm font-medium mb-2">Line ID</label>
      <InputText
        id="lineId"
        v-model="formData.lineId"
        placeholder="請輸入 Line ID（選填）"
        class="w-full"
      />
    </div>

    <!-- Address -->
    <div class="field">
      <label for="address" class="block text-sm font-medium mb-2">地址</label>
      <Textarea
        id="address"
        v-model="formData.address"
        rows="3"
        placeholder="請輸入地址（選填）"
        class="w-full"
      />
    </div>

    <!-- C. 緊急聯絡人 -->
    <Divider align="left">
      <div class="flex items-center gap-2">
        <i class="pi pi-shield" />
        <span class="font-semibold">緊急聯絡人</span>
      </div>
    </Divider>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Emergency Contact Name -->
      <div class="field">
        <label for="emergencyContactName" class="block text-sm font-medium mb-2">
          姓名 <span class="text-red-500">*</span>
        </label>
        <InputText
          id="emergencyContactName"
          v-model="formData.emergencyContactName"
          placeholder="請輸入姓名"
          :class="{ 'p-invalid': errors.emergencyContactName }"
          class="w-full"
        />
        <small v-if="errors.emergencyContactName" class="p-error">
          {{ errors.emergencyContactName }}
        </small>
      </div>

      <!-- Emergency Contact Relationship -->
      <div class="field">
        <label for="emergencyContactRelationship" class="block text-sm font-medium mb-2">
          關係 <span class="text-red-500">*</span>
        </label>
        <Dropdown
          id="emergencyContactRelationship"
          v-model="formData.emergencyContactRelationship"
          :options="relationshipOptions"
          placeholder="請選擇關係"
          :class="{ 'p-invalid': errors.emergencyContactRelationship }"
          class="w-full"
        />
        <small v-if="errors.emergencyContactRelationship" class="p-error">
          {{ errors.emergencyContactRelationship }}
        </small>
      </div>

      <!-- Emergency Contact Phone -->
      <div class="field">
        <label for="emergencyContactPhone" class="block text-sm font-medium mb-2">
          電話 <span class="text-red-500">*</span>
        </label>
        <InputText
          id="emergencyContactPhone"
          v-model="formData.emergencyContactPhone"
          placeholder="0912345678"
          :class="{ 'p-invalid': errors.emergencyContactPhone }"
          class="w-full"
        />
        <small v-if="errors.emergencyContactPhone" class="p-error">
          {{ errors.emergencyContactPhone }}
        </small>
      </div>
    </div>

    <!-- D. 信仰與歸屬 -->
    <Divider align="left">
      <div class="flex items-center gap-2">
        <i class="pi pi-heart" />
        <span class="font-semibold">信仰與歸屬</span>
      </div>
    </Divider>

    <!-- Baptism Status -->
    <div class="field">
      <div class="flex items-center">
        <Checkbox
          v-model="formData.baptismStatus"
          inputId="baptismStatus"
          :binary="true"
        />
        <label for="baptismStatus" class="ml-2">已受洗</label>
      </div>
    </div>

    <!-- Baptism Date (conditional) -->
    <div v-if="formData.baptismStatus" class="field">
      <label for="baptismDate" class="block text-sm font-medium mb-2">受洗日期</label>
      <DatePicker
        id="baptismDate"
        v-model="formData.baptismDate"
        dateFormat="yy-mm-dd"
        :maxDate="new Date()"
        showIcon
        class="w-full"
      />
    </div>

    <!-- Zone -->
    <div class="field">
      <label for="zoneId" class="block text-sm font-medium mb-2">牧區</label>
      <Dropdown
        id="zoneId"
        v-model="formData.zoneId"
        :options="zones"
        optionLabel="name"
        optionValue="id"
        placeholder="請選擇牧區（選填）"
        :loading="isLoadingOrg"
        class="w-full"
      />
    </div>

    <!-- Group (cascaded) -->
    <div class="field">
      <label for="groupId" class="block text-sm font-medium mb-2">小組</label>
      <Dropdown
        id="groupId"
        v-model="formData.groupId"
        :options="filteredGroups"
        optionLabel="name"
        optionValue="id"
        :placeholder="formData.zoneId ? '請選擇小組（選填）' : '請先選擇牧區'"
        :disabled="!formData.zoneId"
        class="w-full"
      />
      <small v-if="errors.groupId" class="p-error">{{ errors.groupId }}</small>
    </div>

    <!-- Roles -->
    <div class="field">
      <label for="roleIds" class="block text-sm font-medium mb-2">角色</label>
      <MultiSelect
        id="roleIds"
        v-model="formData.roleIds"
        :options="roles"
        optionLabel="name"
        optionValue="id"
        placeholder="請選擇角色（選填）"
        :loading="isLoadingRoles"
        display="chip"
        class="w-full"
      />
      <small class="text-slate-500">
        可選擇多個角色，如：小組長、課程老師、敬拜團長等
      </small>
    </div>

    <!-- Past Courses -->
    <div class="field">
      <label for="pastCourses" class="block text-sm font-medium mb-2">已上過的課程</label>
      <MultiSelect
        id="pastCourses"
        v-model="formData.pastCourses"
        :options="courses"
        optionLabel="name"
        optionValue="id"
        placeholder="請選擇課程（選填）"
        :loading="isLoadingCourses"
        display="chip"
        class="w-full"
      />
    </div>

    <!-- E. 系統設定 (僅編輯模式顯示) -->
    <Divider v-if="member" align="left">
      <div class="flex items-center gap-2">
        <i class="pi pi-cog" />
        <span class="font-semibold">系統設定</span>
      </div>
    </Divider>

    <!-- Status (edit mode only) -->
    <div v-if="member" class="field">
      <label for="status" class="block text-sm font-medium mb-2">
        會籍狀態 <span class="text-red-500">*</span>
      </label>
      <Dropdown
        id="status"
        v-model="formData.status"
        :options="statusOptions"
        optionLabel="label"
        optionValue="value"
        class="w-full"
      />
    </div>

    <!-- Form Actions -->
    <Divider />
    <div class="flex justify-end gap-2">
      <Button
        label="取消"
        severity="secondary"
        outlined
        @click="$emit('cancel')"
        :disabled="loading"
      />
      <Button
        type="submit"
        :label="member ? '儲存變更' : '建立會友'"
        :loading="loading"
      />
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, toRef } from 'vue';
import { createMemberSchema } from '~/schemas/member.schema';
import { useZoneGroupCascade } from '~/composables/useZoneGroupCascade';
import { useAvatarUpload } from '~/composables/useAvatarUpload';
import type { Member, CreateMemberPayload } from '~/types/member';

interface Props {
  member?: Member; // If provided, it's edit mode
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  submit: [data: CreateMemberPayload];
  cancel: [];
}>();

// Form data
const formData = reactive<Partial<CreateMemberPayload>>({
  fullName: props.member?.fullName || '',
  gender: props.member?.gender || 'Male',
  dob: props.member?.dob || '',
  email: props.member?.email || '',
  mobile: props.member?.mobile || '',
  address: props.member?.address || '',
  lineId: props.member?.lineId || '',
  emergencyContactName: props.member?.emergencyContactName || '',
  emergencyContactRelationship: props.member?.emergencyContactRelationship || '',
  emergencyContactPhone: props.member?.emergencyContactPhone || '',
  baptismStatus: props.member?.baptismStatus || false,
  baptismDate: props.member?.baptismDate || '',
  status: props.member?.status || 'Active',
  zoneId: props.member?.zoneId || null,
  groupId: props.member?.groupId || null,
  pastCourses: props.member?.pastCourses || [],
  avatar: props.member?.avatar || '',
});

// Form errors
const errors = reactive<Record<string, string>>({});

// Options
const relationshipOptions = ['父子', '母女', '父女', '母子', '配偶', '兄弟姊妹', '子女', '朋友', '其他'];
const statusOptions = [
  { label: '啟用', value: 'Active' },
  { label: '停用', value: 'Inactive' },
  { label: '停權', value: 'Suspended' },
];

// Zone & Group cascade
const {
  zones,
  filteredGroups,
  isLoading: isLoadingOrg,
  fetchOrganizationStructure,
  watchZoneChange,
} = useZoneGroupCascade();

// Roles
const roles = ref<any[]>([]);
const isLoadingRoles = ref(false);
const fetchRoles = async () => {
  isLoadingRoles.value = true;
  try {
    const response = await $fetch('/api/roles', {
      query: { status: 'Active' },
    });
    roles.value = response;
  } catch (error) {
    console.error('Failed to fetch roles:', error);
  } finally {
    isLoadingRoles.value = false;
  }
};

// Courses
const courses = ref<any[]>([]);
const isLoadingCourses = ref(false);
const fetchCourses = async () => {
  isLoadingCourses.value = true;
  try {
    const response = await $fetch('/api/courses', {
      query: { status: 'Active' },
    });
    courses.value = response;
  } catch (error) {
    console.error('Failed to fetch courses:', error);
  } finally {
    isLoadingCourses.value = false;
  }
};

// Avatar upload
const {
  avatarPreview,
  avatarFile,
  isUploading,
  onAvatarSelect,
  uploadAvatar,
  removeAvatar,
} = useAvatarUpload();

// Initialize
onMounted(async () => {
  await Promise.all([
    fetchOrganizationStructure(),
    fetchRoles(),
    fetchCourses(),
  ]);
  
  // If editing, filter groups by zone
  if (props.member?.zoneId) {
    filterGroupsByZone(props.member.zoneId);
  }
});

// Watch zone changes
watchZoneChange(
  toRef(formData, 'zoneId'),
  toRef(formData, 'groupId')
);

// Validate mobile uniqueness
const { checkUnique } = useMember();
const validateMobileUniqueness = async () => {
  if (!formData.mobile) return;
  
  const isUnique = await checkUnique('mobile', formData.mobile, props.member?.uuid);
  if (!isUnique) {
    errors.mobile = '此手機號碼已被使用';
  } else {
    delete errors.mobile;
  }
};

// Handle form submission
const handleSubmit = async () => {
  // Clear previous errors
  Object.keys(errors).forEach((key) => delete errors[key]);

  // Validate with Zod
  try {
    await createMemberSchema.parseAsync(formData);
  } catch (error: any) {
    if (error.errors) {
      error.errors.forEach((err: any) => {
        errors[err.path[0]] = err.message;
      });
    }
    return;
  }

  // Upload avatar if new file selected
  let avatarUrl = formData.avatar;
  if (avatarFile.value) {
    try {
      const tempUuid = props.member?.uuid || crypto.randomUUID();
      avatarUrl = await uploadAvatar(tempUuid);
    } catch (error) {
      errors.avatar = '頭像上傳失敗，請稍後再試';
      return;
    }
  }

  // Emit submit event
  emit('submit', {
    ...formData,
    avatar: avatarUrl,
  } as CreateMemberPayload);
};
</script>

<style scoped>
.member-form {
  max-width: 100%;
}

.field {
  margin-bottom: 1.5rem;
}

.p-error {
  color: var(--red-500);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
</style>
```

---

## 6. Error Handling & Validation

### 6.1 Validation Strategy

#### 前端驗證（Frontend Validation）

**時機**：
1. **即時驗證 (Real-time)**：
   - 手機號碼：失焦時檢查格式與唯一性
   - Email：失焦時檢查格式
   - 出生年月日：選擇後立即檢查是否為未來日期

2. **提交驗證 (On Submit)**：
   - 使用 Zod Schema 完整驗證所有欄位
   - 檢查牧區小組連動邏輯

**錯誤顯示**：
- 每個欄位下方顯示紅色錯誤訊息
- 錯誤欄位框線變紅（`p-invalid` class）

#### 後端驗證（Backend Validation）

**時機**：每次 API 呼叫時

**驗證內容**：
1. **Schema 驗證**：使用 Zod 解析 Request Body
2. **業務邏輯驗證**：
   - 手機號碼唯一性
   - Email 唯一性（建議）
   - 牧區小組連動關係
   - 權限與 Scope 檢查

---

### 6.2 Error Response Format

**標準錯誤格式**：
```typescript
{
  statusCode: number;
  message: string;
  errors?: {
    field: string;
    message: string;
  }[];
}
```

**範例**：
```json
{
  "statusCode": 400,
  "message": "表單驗證失敗",
  "errors": [
    {
      "field": "mobile",
      "message": "手機號碼格式不正確"
    },
    {
      "field": "groupId",
      "message": "選擇小組時必須先選擇牧區"
    }
  ]
}
```

---

### 6.3 Common Error Scenarios

| 錯誤情境 | HTTP Status | 錯誤訊息 | 前端處理 |
|---------|-------------|---------|---------|
| 手機號碼重複 | 400 | 此手機號碼已被使用 | 顯示於 mobile 欄位下方 |
| 牧區小組不匹配 | 400 | 小組與牧區不匹配 | 顯示於 groupId 欄位下方 |
| 未選牧區但選了小組 | 400 | 選擇小組時必須先選擇牧區 | 顯示於 groupId 欄位下方 |
| 出生年月日為未來日期 | 400 | 日期不可為未來日期 | 顯示於 dob 欄位下方 |
| 會友不存在 | 404 | 會友不存在 | Toast 通知，導向列表頁 |
| 無權限編輯 | 403 | 無權編輯會友資料 | Toast 通知，停留在當前頁 |
| 超出 Data Scope | 403 | 無權編輯此會友（超出管轄範圍） | Toast 通知，停留在當前頁 |
| 頭像上傳失敗 | 500 | 頭像上傳失敗，請稍後再試 | 顯示於頭像欄位下方 |

---

## 7. Security Considerations

### 7.1 Permission Checks

**前端檢查**（UI 隱藏）：
```typescript
// 新增按鈕
const canCreate = computed(() => auth.hasPermission('member:create'));

// 編輯按鈕
const canEdit = computed(() => auth.hasPermission('member:edit'));

// 刪除按鈕
const canDelete = computed(() => auth.hasPermission('member:delete'));
```

**後端檢查**（強制執行）：
```typescript
// server/api/members/index.post.ts
if (!userContext.permissions.includes('member:create')) {
  throw createError({ statusCode: 403, message: '無權建立會友資料' });
}
```

---

### 7.2 Data Scope Enforcement

**編輯與刪除操作**：必須檢查使用者是否有權限存取該會友

```typescript
// server/utils/permission.ts
export function canAccessMember(userContext: UserContext, member: Member): boolean {
  const scope = userContext.scope;

  switch (scope.type) {
    case 'global':
      return true; // Can access all members

    case 'zone':
      return member.zoneId === scope.zoneId;

    case 'group':
      return member.groupId === scope.groupId;

    case 'self':
      return member.uuid === userContext.userId;

    default:
      return false;
  }
}
```

---

### 7.3 Input Sanitization

**防止 XSS 攻擊**：
- 所有文字輸入欄位在儲存前應過濾 HTML 標籤
- 使用 Firebase Firestore 的參數化查詢，防止 NoSQL Injection

```typescript
// server/utils/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}
```

---

### 7.4 File Upload Security

**頭像上傳限制**：
1. **檔案類型**：僅允許 `image/jpeg`, `image/png`
2. **檔案大小**：上限 2MB
3. **檔案名稱**：使用 UUID + Timestamp，避免路徑穿越攻擊
4. **Storage Rules**：Firebase Storage 設定適當的讀寫權限

**Firebase Storage Rules**：
```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{userId}/{fileName} {
      // Allow authenticated users to upload their own avatar
      allow write: if request.auth != null 
                   && request.resource.size < 2 * 1024 * 1024 
                   && request.resource.contentType.matches('image/(jpeg|png)');
      
      // Allow all authenticated users to read avatars
      allow read: if request.auth != null;
    }
  }
}
```

---

### 7.5 Avatar Cleanup Strategy

為避免 Firebase Storage 佔用過多空間，需實作定期清理機制：

**清理策略**：

1. **更換頭像時自動刪除舊檔案**：
```typescript
// server/api/members/[uuid].patch.ts
const handleAvatarUpdate = async (memberUuid: string, newAvatarUrl: string) => {
  // Fetch existing member
  const memberDoc = await db.collection('members').doc(memberUuid).get();
  const member = memberDoc.data();
  
  // Delete old avatar if exists
  if (member?.avatar) {
    try {
      const oldAvatarPath = extractPathFromUrl(member.avatar);
      await deleteFile(oldAvatarPath);
    } catch (error) {
      console.error('Failed to delete old avatar:', error);
      // Don't block the update if deletion fails
    }
  }
  
  // Update with new avatar URL
  await memberDoc.ref.update({ avatar: newAvatarUrl });
};

// Helper function to extract storage path from URL
function extractPathFromUrl(url: string): string {
  const match = url.match(/avatars\/[^?]+/);
  return match ? match[0] : '';
}
```

2. **定期清理未使用的頭像（Scheduled Function）**：
```typescript
// server/tasks/cleanup-avatars.ts
/**
 * 定期清理未使用的頭像檔案
 * 執行頻率：每週一次（週日凌晨 2:00）
 */
export const cleanupUnusedAvatars = scheduledFunction(
  '0 2 * * 0', // Cron: Every Sunday at 2:00 AM
  async () => {
    try {
      // 1. List all avatar files in Storage
      const bucket = admin.storage().bucket();
      const [files] = await bucket.getFiles({ prefix: 'avatars/' });
      
      // 2. Get all member avatar URLs from Firestore
      const membersSnapshot = await db.collection('members').get();
      const usedAvatarUrls = new Set<string>();
      
      membersSnapshot.forEach((doc) => {
        const member = doc.data();
        if (member.avatar) {
          usedAvatarUrls.add(member.avatar);
        }
      });
      
      // 3. Delete files not referenced in Firestore
      let deletedCount = 0;
      for (const file of files) {
        const fileUrl = await file.getSignedUrl({ action: 'read', expires: '2099-01-01' });
        
        if (!usedAvatarUrls.has(fileUrl[0])) {
          // File not referenced by any member
          const lastModified = new Date(file.metadata.updated);
          const daysSinceModified = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24);
          
          // Only delete if file is older than 7 days (safety buffer)
          if (daysSinceModified > 7) {
            await file.delete();
            deletedCount++;
            console.log(`Deleted unused avatar: ${file.name}`);
          }
        }
      }
      
      console.log(`Cleanup completed. Deleted ${deletedCount} unused avatar files.`);
      
      // 4. Log cleanup result
      await db.collection('system_logs').add({
        type: 'avatar_cleanup',
        timestamp: FieldValue.serverTimestamp(),
        deletedCount,
        totalFiles: files.length,
      });
      
    } catch (error) {
      console.error('Avatar cleanup failed:', error);
      throw error;
    }
  }
);
```

3. **手動清理介面（Admin Only）**：
```typescript
// server/api/admin/cleanup-avatars.post.ts
export default defineEventHandler(async (event) => {
  const userContext = event.context.userContext;

  // Permission check: Only admins can trigger manual cleanup
  if (!userContext.permissions.includes('admin:system')) {
    throw createError({
      statusCode: 403,
      message: '無權執行此操作',
    });
  }

  // Trigger cleanup job
  await cleanupUnusedAvatars();

  return { success: true, message: '頭像清理任務已觸發' };
});
```

**清理原則**：
- ✅ 更換頭像時自動刪除舊檔案（即時清理）
- ✅ 每週定期掃描並刪除未使用的檔案（批次清理）
- ✅ 保留 7 天安全緩衝期（避免誤刪）
- ✅ 提供手動清理介面供管理員使用
- ✅ 記錄清理結果至系統日誌

---

## 8. Audit Logging

### 8.1 Logged Actions

每次 CRUD 操作皆需記錄至 `audit_logs` collection：

| Action | 記錄內容 |
|--------|---------|
| **member:create** | 會友姓名、手機號碼 |
| **member:update** | 會友姓名、變更欄位列表 |
| **member:delete** | 會友姓名、原始狀態 |

### 8.2 Audit Log Schema

```typescript
interface AuditLog {
  id: string;
  action: string; // 'member:create' | 'member:update' | 'member:delete'
  resource: string; // 'members'
  resourceId: string; // Member UUID
  userId: string; // 操作者 UUID
  userName: string; // 操作者姓名
  timestamp: Timestamp;
  details: Record<string, any>; // 額外資訊
}
```

### 8.3 Implementation

```typescript
// server/utils/audit.ts
export async function createAuditLog(data: {
  action: string;
  resource: string;
  resourceId: string;
  userId: string;
  details?: Record<string, any>;
}): Promise<void> {
  const logRef = db.collection('audit_logs').doc();
  
  await logRef.set({
    id: logRef.id,
    ...data,
    timestamp: FieldValue.serverTimestamp(),
  });
}
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

**前端 Composables**：
```typescript
// composables/useMember.test.ts
describe('useMember', () => {
  it('should create member successfully', async () => {
    const { createMember } = useMember();
    const payload = { /* ... */ };
    const result = await createMember(payload);
    expect(result.uuid).toBeDefined();
  });

  it('should check mobile uniqueness', async () => {
    const { checkUnique } = useMember();
    const isUnique = await checkUnique('mobile', '0912345678');
    expect(isUnique).toBe(true);
  });
});
```

**後端 API**：
```typescript
// server/api/members/index.post.test.ts
describe('POST /api/members', () => {
  it('should return 403 if user has no permission', async () => {
    // Mock user without member:create permission
    const response = await $fetch('/api/members', {
      method: 'POST',
      body: { /* ... */ },
    });
    expect(response.statusCode).toBe(403);
  });

  it('should return 400 if mobile is duplicated', async () => {
    // Test uniqueness validation
  });
});
```

---

### 9.2 Integration Tests

**Complete CRUD Flow**：
```typescript
describe('Member CRUD Integration', () => {
  let createdMemberUuid: string;

  it('should create a new member', async () => {
    const response = await createMember({ /* ... */ });
    createdMemberUuid = response.uuid;
    expect(response.fullName).toBe('測試會友');
  });

  it('should fetch the created member', async () => {
    const member = await fetchMember(createdMemberUuid);
    expect(member.uuid).toBe(createdMemberUuid);
  });

  it('should update the member', async () => {
    const updated = await updateMember(createdMemberUuid, {
      fullName: '更新後的姓名',
    });
    expect(updated.fullName).toBe('更新後的姓名');
  });

  it('should soft delete the member', async () => {
    await deleteMember(createdMemberUuid);
    const member = await fetchMember(createdMemberUuid);
    expect(member.status).toBe('Inactive');
  });
});
```

---

### 9.3 E2E Tests (Playwright)

**使用者操作流程**：
```typescript
// e2e/member-crud.spec.ts
import { test, expect } from '@playwright/test';

test('Create member flow', async ({ page }) => {
  // Navigate to create page
  await page.goto('/dashboard/members/create');

  // Fill in form
  await page.fill('#fullName', '測試會友');
  await page.click('label:has-text("男")');
  await page.fill('#mobile', '0912345678');
  // ... fill other fields

  // Submit form
  await page.click('button[type="submit"]');

  // Assert success message
  await expect(page.locator('.p-toast')).toContainText('新增成功');

  // Assert redirected to detail page
  await expect(page).toHaveURL(/\/dashboard\/members\/[a-z0-9-]+$/);
});
```

---

## 10. Implementation Checklist

### 10.1 Frontend Tasks

- [ ] **Pages**
  - [ ] 新增會友頁 (`/dashboard/members/create`)
  - [ ] 編輯會友頁 (`/dashboard/members/[uuid]/edit`)
  - [ ] 會友詳情頁 (`/dashboard/members/[uuid]`)

- [ ] **Components**
  - [ ] `MemberForm.vue` - 會友表單（Create/Edit 共用）
  - [ ] 頭像上傳元件整合

- [ ] **Composables**
  - [ ] 擴充 `useMember` - 新增 CRUD 方法
  - [ ] `useZoneGroupCascade` - 牧區小組連動
  - [ ] `useAvatarUpload` - 頭像上傳邏輯

- [ ] **Validation**
  - [ ] 表單即時驗證（手機、Email、出生日期）
  - [ ] Zod Schema 提交驗證
  - [ ] 唯一性檢查 API 整合

- [ ] **UI/UX**
  - [ ] Loading States（表單提交中、圖片上傳中）
  - [ ] Success/Error Toast 通知
  - [ ] 刪除確認對話框
  - [ ] 表單錯誤顯示

---

### 10.2 Backend Tasks

- [ ] **API Routes**
  - [ ] `POST /api/members` - 建立會友
  - [ ] `PATCH /api/members/[uuid]` - 更新會友
  - [ ] `DELETE /api/members/[uuid]` - 軟刪除會友
  - [ ] `POST /api/members/check-unique` - 唯一性檢查

- [ ] **Validation**
  - [ ] Zod Schema 驗證（前後端共用）
  - [ ] 手機號碼唯一性檢查
  - [ ] 牧區小組連動邏輯驗證

- [ ] **Security**
  - [ ] 權限檢查（member:create, member:edit, member:delete）
  - [ ] Data Scope 過濾（編輯/刪除時）
  - [ ] Input Sanitization
  - [ ] Firebase Storage Rules

- [ ] **Audit Logging**
  - [ ] Create 操作記錄
  - [ ] Update 操作記錄
  - [ ] Delete 操作記錄

---

### 10.3 Testing Tasks

- [ ] **Unit Tests**
  - [ ] `useMember` composable
  - [ ] `useZoneGroupCascade` composable
  - [ ] `useAvatarUpload` composable
  - [ ] Backend API handlers

- [ ] **Integration Tests**
  - [ ] Complete CRUD flow
  - [ ] Permission & Scope enforcement

- [ ] **E2E Tests**
  - [ ] Create member flow
  - [ ] Edit member flow
  - [ ] Delete member flow

---

### 10.4 Documentation Tasks

- [ ] **Technical Docs**
  - [ ] API Specification
  - [ ] Form Validation Rules
  - [ ] Error Handling Guide

- [ ] **User Docs**
  - [ ] 新增會友操作指南
  - [ ] 編輯會友操作指南
  - [ ] 常見問題解答

---

## 11. Questions & Clarifications

*（此區塊記錄需要澄清的問題，將整理至 Questions.md）*

### 11.1 待釐清問題

1. **頭像存儲策略**：
   - Q: 若會友被刪除（軟刪除），頭像檔案是否需要保留？還是立即刪除？
   - Q: 頭像檔案的命名規則？是否需要加上 Timestamp 避免快取問題？

2. **Email 唯一性**：
   - Q: Email 是否也需要唯一性檢查？（目前 mobile 為強制唯一）

3. **軟刪除後的資料存取**：
   - Q: `status = Inactive` 的會友是否還能在列表中被搜尋到？
   - Q: 是否需要「復原」功能（將 Inactive 改回 Active）？

4. **牧區小組連動的邊界情況**：
   - Q: 若會友原本有 groupId，編輯時清空 zoneId，系統應該自動清空 groupId 還是報錯？

5. **課程紀錄 (pastCourses)**：
   - Q: 在 Create/Edit 表單中，`pastCourses` 是否需要顯示？還是僅在詳情頁 Tab 2 管理？

6. **角色指派 (roleIds)**：
   - Q: 新增/編輯會友時，是否需要直接指派角色？還是透過另一個介面（ST009）？

7. **敏感資料遮罩**：
   - Q: Create/Edit 表單中的敏感欄位（手機、Email 等）是否需要遮罩？還是完整顯示？

---

## 12. Appendix

### 12.1 Related Stories

- **ST001**: 資料核心與 Schema 定義
- **ST002**: RBAC Configuration
- **ST003**: 會友資料列表
- **ST005**: 敏感資料解鎖機制（Quick View Modal 使用）

### 12.2 External References

- [PrimeVue Form Components](https://primevue.org/inputtext/)
- [Zod Documentation](https://zod.dev/)
- [Firebase Storage API](https://firebase.google.com/docs/storage)
- [Nuxt 3 Form Handling](https://nuxt.com/docs/getting-started/data-fetching)

---

**Document Version**: 1.0  
**Last Updated**: 2025-02-11  
**Author**: AI Assistant  
**Status**: ✅ Ready for Implementation
