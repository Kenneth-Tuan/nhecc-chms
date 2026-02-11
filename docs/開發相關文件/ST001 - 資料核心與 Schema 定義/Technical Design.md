# ST001 - Technical Design: 會友資料核心與 Schema 定義

## 1. Overview

### 1.1 Story Reference
- **Story ID**: ST-001
- **Priority**: Must Have (Blocker)
- **User Story**: As a 行政同工, I want to 建立與編輯會友的詳細資料（CRUD），包含緊急聯絡人與過往課程紀錄，So that 系統擁有正確且完整的基礎資料，以供後續的分組與牧養使用。

### 1.2 Design Goals
1. 建立完整的會友資料 CRUD 功能
2. 實作資料驗證與防呆機制
3. 支援牧區與小組的連動邏輯
4. 為後續 RBAC (ST-002) 預留資料遮罩與權限控制介面
5. 遵循專案架構規範（Service Layer Pattern、Type Safety）

### 1.3 Tech Stack
- **Frontend**: Nuxt 4, Vue 3.5 (Composition API), PrimeVue 4.5, TypeScript
- **Backend**: Nitro (Server Routes), Firebase Admin SDK
- **Database**: Firebase Realtime Database / Firestore
- **Validation**: Zod
- **State Management**: Pinia (預留)

---

## 2. Data Schema Design

### 2.1 Database Schema (Firebase Collection: `members`)

```typescript
interface Member {
  // 系統識別
  uuid: string;                    // PK, 由 Firebase 自動生成
  createdAt: Timestamp;            // 建立時間
  updatedAt: Timestamp;            // 更新時間
  createdBy?: string;              // 建立者 UUID (預留)
  updatedBy?: string;              // 更新者 UUID (預留)

  // 基本資料
  fullName: string;                // 姓名 (必填)
  gender: 'Male' | 'Female';       // 生理性別 (必填)
  dob: Date;                       // 出生年月日 (必填)
  email: string;                   // 電子郵件 (必填) ⚠️ 敏感個資
  mobile: string;                  // 手機號碼 (必填, 唯一值) ⚠️ 敏感個資
  address?: string;                // 居住地址 (選填) ⚠️ 敏感個資
  lineId?: string;                 // Line ID (選填) ⚠️ 敏感個資

  // 緊急聯絡人
  emergencyContactName: string;          // 緊急聯絡人姓名 (必填)
  emergencyContactRelationship: string;  // 關係 (必填, 如: 父子, 母女, 配偶, 朋友)
  emergencyContactPhone: string;         // 緊急聯絡人電話 (必填) ⚠️ 敏感個資

  // 教會與牧養資訊
  baptismStatus: boolean;          // 是否受洗 (預設 false)
  baptismDate?: Date | null;       // 受洗日 (Nullable)
  status: 'Active' | 'Inactive' | 'Suspended';  // 會籍狀態 (預設 Active)
  zoneId?: string | null;          // 所屬牧區 ID (FK, Nullable)
  groupId?: string | null;         // 所屬小組 ID (FK, Nullable, 需與 zoneId 連動)
  pastCourses?: string[];          // 已上過的福音課程 (選填, Array of Course IDs)

  // 權限與角色 (RBAC - 新增於 ST-002)
  roleIds: string[];               // 該會員擁有的角色 ID 列表 (支援多重角色, 預設 [])
  functionalGroupIds: string[];    // 該會員參與的功能性群組 ID (如課程、事工, 預設 [])

  // Avatar (預留)
  avatar?: string;                 // 大頭貼 URL (選填)
}
```

### 2.2 Related Collections

#### 2.2.1 `zones` (牧區)
```typescript
interface Zone {
  id: string;                      // PK
  name: string;                    // 牧區名稱
  leaderId?: string;               // 牧區長 UUID
  leaderName?: string;             // 牧區長姓名 (快取，避免多次查詢)
  status: 'Active' | 'Inactive';   // 狀態
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 2.2.2 `groups` (小組與功能性群組)
```typescript
interface Group {
  id: string;                      // PK
  name: string;                    // 小組名稱
  type: 'Pastoral' | 'Functional'; // 群組類型：牧養小組 or 功能小組 (課程/事工) - 新增於 ST-002
  zoneId?: string;                 // 所屬牧區 ID (FK, 僅 Pastoral 類型需要)
  leaderId?: string;               // 小組長/負責人 UUID
  leaderName?: string;             // 小組長姓名 (快取，避免多次查詢)
  status: 'Active' | 'Inactive';   // 狀態
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**注意**: 從 ST-002 開始，`groups` collection 支援兩種類型：
- `Pastoral`: 傳統牧養小組，屬於某個牧區 (需要 `zoneId`)
- `Functional`: 功能性群組（課程班級、事工團隊），不屬於牧區，用於矩陣式管理

#### 2.2.3 `courses` (課程選項)
```typescript
interface Course {
  id: string;                      // PK
  name: string;                    // 課程名稱
  code: string;                    // 課程代碼 (如: ALPHA, HAPPINESS_GROUP)
  category: string;                // 課程分類
  status: 'Active' | 'Inactive';   // 狀態
  createdAt: Timestamp;
}
```

### 2.3 Validation Rules

#### 2.3.1 Mobile Phone Format
- **格式**: 台灣手機號碼 `09XX-XXX-XXX` 或 `09XXXXXXXX`
- **正則表達式**: `^09\d{8}$` (儲存時去除連字號)
- **唯一性**: `mobile` 必須唯一，建立時需檢查重複

#### 2.3.2 Email Format
- **格式**: 標準 Email 格式
- **驗證**: 使用 Zod 的 `.email()` 方法

#### 2.3.3 Zone & Group Relationship
- **連動邏輯**:
  - 若 `zoneId` 為 null，則 `groupId` 必須為 null
  - 若 `zoneId` 有值，則 `groupId` 只能選擇該牧區下的小組
  - 前端下拉選單需根據 `zoneId` 動態載入 `groups`

#### 2.3.4 Date Fields
- **dob**: 必填，需合理（不可未來日期，年齡 > 0）
- **baptismDate**: 若 `baptismStatus` 為 true，建議填寫（但非強制）

---

## 3. Frontend Architecture

### 3.1 File Structure

```
app/
├── components/
│   ├── member/
│   │   ├── MemberForm.vue          # 會友表單（Create/Edit）
│   │   ├── MemberCard.vue          # 會友卡片
│   │   └── MemberListItem.vue      # 列表項目
│   ├── common/
│   │   └── SchemaForm.vue          # 已存在的通用表單元件
│   └── form/
│       └── SmartField.vue          # 已存在的智能欄位元件
├── pages/
│   └── members/
│       ├── index.vue               # 會友列表頁
│       ├── create.vue              # 新增會友頁
│       └── [id]/
│           ├── index.vue           # 會友詳情頁
│           └── edit.vue            # 編輯會友頁
├── composables/
│   ├── useMember.ts                # 會友 CRUD 邏輯
│   └── useZoneGroup.ts             # 牧區小組連動邏輯
├── utils/
│   └── member/
│       ├── formDef.ts              # 會友表單定義（類似 user/formDef.ts）
│       ├── schema.ts               # Zod Schema
│       └── validation.ts           # 驗證邏輯
└── types/
    └── member.ts                   # Member 相關型別定義
```

### 3.2 Type Definitions

**`app/types/member.ts`**

```typescript
import type { Timestamp } from 'firebase/firestore';

export type Gender = 'Male' | 'Female';
export type MemberStatus = 'Active' | 'Inactive' | 'Suspended';
export type EmergencyRelationship = '父子' | '母女' | '父女' | '母子' | '配偶' | '朋友' | '其他';

export interface Member {
  uuid: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
  updatedBy?: string;

  // 基本資料
  fullName: string;
  gender: Gender;
  dob: Date;
  email: string;
  mobile: string;
  address?: string;
  lineId?: string;

  // 緊急聯絡人
  emergencyContactName: string;
  emergencyContactRelationship: EmergencyRelationship | string;
  emergencyContactPhone: string;

  // 教會資訊
  baptismStatus: boolean;
  baptismDate?: Date | null;
  status: MemberStatus;
  zoneId?: string | null;
  groupId?: string | null;
  pastCourses?: string[];

  // Avatar
  avatar?: string;
}

// API Response (with masking metadata - 預留給 ST-002)
export interface MemberResponse extends Omit<Member, 'mobile' | 'email' | 'lineId' | 'address' | 'emergencyContactPhone'> {
  mobile: string;
  mobileCanReveal?: boolean;
  email: string;
  emailCanReveal?: boolean;
  lineId?: string;
  lineIdCanReveal?: boolean;
  address?: string;
  addressCanReveal?: boolean;
  emergencyContactPhone: string;
  emergencyContactPhoneCanReveal?: boolean;
}

export interface Zone {
  id: string;
  name: string;
  leaderId?: string;
  leaderName?: string;
  status: 'Active' | 'Inactive';
}

export interface Group {
  id: string;
  name: string;
  zoneId: string;
  leaderId?: string;
  leaderName?: string;
  status: 'Active' | 'Inactive';
}

// 牧區與小組層級結構（用於組織架構 API）
export interface ZoneWithGroups {
  zoneId: string;
  zoneName: string;
  zoneLeaderId?: string;
  zoneLeaderName?: string;
  groups: {
    groupId: string;
    groupName: string;
    groupLeaderId?: string;
    groupLeaderName?: string;
  }[];
}

export interface Course {
  id: string;
  name: string;
  code: string;
  category: string;
  status: 'Active' | 'Inactive';
}
```

### 3.3 Zod Schema & Validation

**`app/utils/member/schema.ts`**

```typescript
import { z } from 'zod';

// 手機號碼驗證
const mobileSchema = z
  .string()
  .min(10, '手機號碼格式錯誤')
  .regex(/^09\d{8}$/, '請輸入有效的手機號碼 (09XXXXXXXX)')
  .transform(val => val.replace(/-/g, '')); // 移除連字號

// 會友 Schema
export const memberSchema = z.object({
  // 基本資料
  fullName: z.string().min(2, '姓名至少需要 2 個字').max(50, '姓名過長'),
  gender: z.enum(['Male', 'Female'], { required_error: '請選擇性別' }),
  dob: z.date({ required_error: '請選擇出生日期' })
    .refine(date => date < new Date(), '出生日期不能是未來日期'),
  email: z.string().email('Email 格式錯誤'),
  mobile: mobileSchema,
  address: z.string().optional(),
  lineId: z.string().optional(),

  // 緊急聯絡人
  emergencyContactName: z.string().min(2, '緊急聯絡人姓名至少需要 2 個字'),
  emergencyContactRelationship: z.string().min(1, '請選擇或輸入關係'),
  emergencyContactPhone: mobileSchema,

  // 教會資訊
  baptismStatus: z.boolean().default(false),
  baptismDate: z.date().nullable().optional(),
  status: z.enum(['Active', 'Inactive', 'Suspended']).default('Active'),
  zoneId: z.string().nullable().optional(),
  groupId: z.string().nullable().optional(),
  pastCourses: z.array(z.string()).default([]),

  // Avatar
  avatar: z.string().url().optional(),
}).refine(
  data => !data.groupId || data.zoneId,
  {
    message: '選擇小組前必須先選擇牧區',
    path: ['groupId'],
  }
);

export type MemberFormValues = z.infer<typeof memberSchema>;

// 建立會友 Schema (不含 UUID, timestamps)
export const createMemberSchema = memberSchema;

// 更新會友 Schema (部分更新)
export const updateMemberSchema = memberSchema.partial();
```

### 3.4 Form Definition

**`app/utils/member/formDef.ts`**

```typescript
import type { FieldSchema } from '~/types/form';

// 性別選項
const genderOptions = [
  { label: '男', value: 'Male' },
  { label: '女', value: 'Female' },
];

// 受洗狀態選項
const baptismStatusOptions = [
  { label: '是', value: true },
  { label: '否', value: false },
];

// 緊急聯絡人關係選項
const relationshipOptions = [
  { label: '父子', value: '父子' },
  { label: '母女', value: '母女' },
  { label: '父女', value: '父女' },
  { label: '母子', value: '母子' },
  { label: '配偶', value: '配偶' },
  { label: '朋友', value: '朋友' },
  { label: '其他', value: '其他' },
];

// 會籍狀態選項
const statusOptions = [
  { label: '啟用', value: 'Active' },
  { label: '停用', value: 'Inactive' },
  { label: '暫停', value: 'Suspended' },
];

export const memberFieldDefs = {
  // === 基本資訊 Section ===
  fullName: {
    name: 'fullName',
    label: '中文姓名',
    icon: 'pi pi-user',
    placeholder: '請輸入姓名',
    required: true,
    component: 'InputText',
  },
  gender: {
    name: 'gender',
    label: '性別',
    required: true,
    component: 'SelectButton',
    options: genderOptions,
  },
  dob: {
    name: 'dob',
    label: '出生年月日',
    icon: 'pi pi-calendar',
    required: true,
    component: 'DatePicker',
    extraProps: {
      dateFormat: 'yy/mm/dd',
      showIcon: true,
      maxDate: new Date(),
    },
  },

  // === 聯絡資訊 Section ===
  mobile: {
    name: 'mobile',
    label: '行動電話',
    icon: 'pi pi-phone',
    placeholder: '0912-345-678',
    required: true,
    type: 'tel',
    component: 'InputMask',
    extraProps: {
      mask: '9999-999-999',
    },
  },
  email: {
    name: 'email',
    label: '電子郵件',
    icon: 'pi pi-envelope',
    placeholder: 'example@email.com',
    required: true,
    type: 'email',
    component: 'InputText',
  },
  lineId: {
    name: 'lineId',
    label: 'Line ID',
    icon: 'pi pi-comment',
    placeholder: '請輸入 Line ID',
    component: 'InputText',
  },
  address: {
    name: 'address',
    label: '通訊地址',
    icon: 'pi pi-map-marker',
    placeholder: '請輸入通訊地址',
    component: 'Textarea',
    extraProps: {
      rows: 2,
      autoResize: true,
    },
  },

  // === 緊急聯絡人 Section ===
  emergencyContactName: {
    name: 'emergencyContactName',
    label: '緊急聯絡人姓名',
    icon: 'pi pi-user',
    placeholder: '聯絡人姓名',
    required: true,
    component: 'InputText',
  },
  emergencyContactRelationship: {
    name: 'emergencyContactRelationship',
    label: '緊急聯絡人關係',
    required: true,
    component: 'Select',
    options: relationshipOptions,
    placeholder: '請選擇關係',
    extraProps: {
      optionLabel: 'label',
      optionValue: 'value',
    },
  },
  emergencyContactPhone: {
    name: 'emergencyContactPhone',
    label: '緊急聯絡人電話',
    icon: 'pi pi-phone',
    placeholder: '0912-345-678',
    required: true,
    type: 'tel',
    component: 'InputMask',
    extraProps: {
      mask: '9999-999-999',
    },
  },

  // === 信仰與歸屬 Section ===
  baptismStatus: {
    name: 'baptismStatus',
    label: '帳號狀態',
    component: 'SelectButton',
    options: baptismStatusOptions,
  },
  baptismDate: {
    name: 'baptismDate',
    label: '受洗日期',
    icon: 'pi pi-calendar',
    component: 'DatePicker',
    extraProps: {
      dateFormat: 'yy/mm/dd',
      showIcon: true,
      maxDate: new Date(),
    },
  },
  zoneId: {
    name: 'zoneId',
    label: '歸屬牧區',
    component: 'Select',
    placeholder: '請選擇牧區',
    extraProps: {
      optionLabel: 'name',
      optionValue: 'id',
      filter: true,
      showClear: true,
    },
  },
  groupId: {
    name: 'groupId',
    label: '歸屬小組',
    component: 'Select',
    placeholder: '請先選擇牧區',
    extraProps: {
      optionLabel: 'name',
      optionValue: 'id',
      filter: true,
      showClear: true,
    },
  },
  pastCourses: {
    name: 'pastCourses',
    label: '曾經參與過的福音課程',
    component: 'MultiSelect',
    placeholder: '請選擇課程（可複選）',
    extraProps: {
      optionLabel: 'name',
      optionValue: 'id',
      filter: true,
      display: 'chip',
    },
  },

  // === 系統欄位 ===
  status: {
    name: 'status',
    label: '會籍狀態',
    component: 'Select',
    options: statusOptions,
    extraProps: {
      optionLabel: 'label',
      optionValue: 'value',
    },
  },
  avatar: {
    name: 'avatar',
    label: '大頭貼',
    component: 'FileUpload',
    extraProps: {
      mode: 'basic',
      accept: 'image/*',
      maxFileSize: 2000000, // 2MB
      auto: true,
    },
  },
} as const satisfies Record<string, FieldSchema>;

// 根據不同場景組合欄位
export const memberFormSections = {
  basic: [
    memberFieldDefs.fullName,
    memberFieldDefs.gender,
    memberFieldDefs.dob,
  ],
  contact: [
    memberFieldDefs.mobile,
    memberFieldDefs.email,
    memberFieldDefs.lineId,
    memberFieldDefs.address,
  ],
  emergency: [
    memberFieldDefs.emergencyContactName,
    memberFieldDefs.emergencyContactRelationship,
    memberFieldDefs.emergencyContactPhone,
  ],
  faith: [
    memberFieldDefs.baptismStatus,
    memberFieldDefs.baptismDate,
    memberFieldDefs.zoneId,
    memberFieldDefs.groupId,
    memberFieldDefs.pastCourses,
  ],
  system: [
    memberFieldDefs.status,
    memberFieldDefs.avatar,
  ],
};
```

### 3.5 Composables

**`app/composables/useMember.ts`**

```typescript
import type { Member, MemberFormValues } from '~/types/member';

export const useMember = () => {
  const toast = useToast();

  // 建立會友
  const createMember = async (data: MemberFormValues): Promise<Member | null> => {
    try {
      const response = await $fetch<Member>('/api/members', {
        method: 'POST',
        body: data,
      });

      toast.add({
        severity: 'success',
        summary: '建立成功',
        detail: '會友資料已建立',
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

  // 更新會友
  const updateMember = async (uuid: string, data: Partial<MemberFormValues>): Promise<Member | null> => {
    try {
      const response = await $fetch<Member>(`/api/members/${uuid}`, {
        method: 'PATCH',
        body: data,
      });

      toast.add({
        severity: 'success',
        summary: '更新成功',
        detail: '會友資料已更新',
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

  // 取得會友列表
  const fetchMembers = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    zoneId?: string;
    groupId?: string;
    status?: string;
  }) => {
    return await $fetch<{
      members: Member[];
      total: number;
      page: number;
      limit: number;
    }>('/api/members', {
      method: 'GET',
      query: params,
    });
  };

  // 取得單一會友
  const fetchMemberById = async (uuid: string): Promise<Member | null> => {
    try {
      return await $fetch<Member>(`/api/members/${uuid}`);
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: '取得失敗',
        detail: '無法取得會友資料',
        life: 5000,
      });
      return null;
    }
  };

  // 刪除會友 (軟刪除)
  const deleteMember = async (uuid: string): Promise<boolean> => {
    try {
      await $fetch(`/api/members/${uuid}`, {
        method: 'DELETE',
      });

      toast.add({
        severity: 'success',
        summary: '刪除成功',
        detail: '會友資料已刪除',
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
    createMember,
    updateMember,
    fetchMembers,
    fetchMemberById,
    deleteMember,
  };
};
```

**`app/composables/useZoneGroup.ts`**

```typescript
import type { ZoneWithGroups } from '~/types/member';

export const useZoneGroup = () => {
  const organizationStructure = ref<ZoneWithGroups[]>([]);
  const zones = computed(() => 
    organizationStructure.value.map(zone => ({
      id: zone.zoneId,
      name: zone.zoneName,
      leaderId: zone.zoneLeaderId,
      leaderName: zone.zoneLeaderName,
    }))
  );
  const filteredGroups = ref<any[]>([]);

  // 載入完整組織架構（牧區 + 小組）
  const fetchOrganizationStructure = async () => {
    try {
      const response = await $fetch<ZoneWithGroups[]>('/api/organization/structure');
      organizationStructure.value = response;
    } catch (error) {
      console.error('Failed to fetch organization structure:', error);
    }
  };

  // 根據牧區 ID 取得該牧區的所有小組
  const getGroupsByZone = (zoneId: string | null) => {
    if (!zoneId) {
      return [];
    }
    const zone = organizationStructure.value.find(z => z.zoneId === zoneId);
    return zone?.groups || [];
  };

  // 根據牧區篩選小組
  const filterGroupsByZone = (zoneId: string | null) => {
    filteredGroups.value = getGroupsByZone(zoneId);
  };

  // Watch zoneId 變化，自動更新小組選項
  const watchZoneChange = (zoneIdRef: Ref<string | null>, groupIdRef: Ref<string | null>) => {
    watch(zoneIdRef, (newZoneId, oldZoneId) => {
      if (newZoneId !== oldZoneId) {
        // 清空小組選擇
        groupIdRef.value = null;

        // 更新小組選項
        filterGroupsByZone(newZoneId);
      }
    });
  };

  return {
    organizationStructure,
    zones,
    filteredGroups,
    fetchOrganizationStructure,
    getGroupsByZone,
    filterGroupsByZone,
    watchZoneChange,
  };
};
```

### 3.6 Component Design

**`app/components/member/MemberForm.vue`**

```vue
<script setup lang="ts">
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { memberSchema, type MemberFormValues } from '~/utils/member/schema';
import { memberFormSections } from '~/utils/member/formDef';
import type { Member, Course } from '~/types/member';

const props = defineProps<{
  member?: Member;           // 編輯模式時傳入
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [data: MemberFormValues];
}>();

// 表單資料
const formData = ref<Partial<MemberFormValues>>(
  props.member || {
    gender: 'Male',
    baptismStatus: false,
    status: 'Active',
    pastCourses: [],
  }
);

// 牧區小組連動
const { zones, filteredGroups, fetchOrganizationStructure, filterGroupsByZone } = useZoneGroup();

// 課程選項
const courses = ref<Course[]>([]);
const fetchCourses = async () => {
  try {
    const response = await $fetch<Course[]>('/api/courses', {
      query: { status: 'Active' },
    });
    courses.value = response;
  } catch (error) {
    console.error('Failed to fetch courses:', error);
  }
};

// 初始化
onMounted(async () => {
  await Promise.all([
    fetchOrganizationStructure(),
    fetchCourses(),
  ]);

  // 編輯模式：載入該牧區的小組
  if (props.member?.zoneId) {
    filterGroupsByZone(props.member.zoneId);
  }
});

// Watch 牧區變化
watchZoneChange(
  toRef(formData.value, 'zoneId'),
  toRef(formData.value, 'groupId')
);

// 動態更新欄位選項
const dynamicFieldDefs = computed(() => {
  return {
    ...memberFormSections,
    faith: [
      memberFormSections.faith[0],
      memberFormSections.faith[1],
      {
        ...memberFormSections.faith[2],
        options: zones.value,
      },
      {
        ...memberFormSections.faith[3],
        options: filteredGroups.value,
        disabled: !formData.value.zoneId,
        placeholder: formData.value.zoneId ? '請選擇小組' : '請先選擇牧區',
      },
      {
        ...memberFormSections.faith[4],
        options: courses.value,
      },
    ],
  };
});

// 提交表單
const onFormSubmit = (e: any) => {
  if (e.valid) {
    emit('submit', e.values as MemberFormValues);
  }
};
</script>

<template>
  <div class="member-form">
    <SchemaForm
      v-model="formData"
      :fields="[
        ...dynamicFieldDefs.basic,
        ...dynamicFieldDefs.contact,
        ...dynamicFieldDefs.emergency,
        ...dynamicFieldDefs.faith,
        ...(member ? dynamicFieldDefs.system : []),
      ]"
      :resolver="zodResolver(memberSchema)"
      :loading="loading"
      :submit-label="member ? '儲存變更' : '建立會友'"
      @submit="onFormSubmit"
    >
      <!-- Section 分隔 -->
      <template #basic-section>
        <Divider align="left">
          <div class="flex items-center gap-2">
            <i class="pi pi-user" />
            <span class="font-semibold">基本資訊</span>
          </div>
        </Divider>
      </template>

      <template #contact-section>
        <Divider align="left">
          <div class="flex items-center gap-2">
            <i class="pi pi-phone" />
            <span class="font-semibold">聯絡資訊</span>
          </div>
        </Divider>
      </template>

      <template #emergency-section>
        <Divider align="left">
          <div class="flex items-center gap-2">
            <i class="pi pi-shield" />
            <span class="font-semibold">緊急聯絡人</span>
          </div>
        </Divider>
      </template>

      <template #faith-section>
        <Divider align="left">
          <div class="flex items-center gap-2">
            <i class="pi pi-heart" />
            <span class="font-semibold">信仰與歸屬</span>
          </div>
        </Divider>
      </template>
    </SchemaForm>
  </div>
</template>

<style scoped>
.member-form {
  max-width: 800px;
  margin: 0 auto;
}
</style>
```

---

## 4. Backend Architecture

### 4.1 File Structure

```
server/
├── api/
│   └── members/
│       ├── index.get.ts         # GET /api/members (列表)
│       ├── index.post.ts        # POST /api/members (建立)
│       ├── [uuid].get.ts        # GET /api/members/:uuid (單筆)
│       ├── [uuid].patch.ts      # PATCH /api/members/:uuid (更新)
│       └── [uuid].delete.ts     # DELETE /api/members/:uuid (刪除)
├── services/
│   └── member.service.ts        # 會友業務邏輯
├── repositories/
│   └── member.repository.ts     # 會友資料存取層
├── utils/
│   ├── validation.ts            # 驗證工具
│   ├── firebase.ts              # Firebase Admin SDK 初始化
│   └── error.ts                 # 錯誤處理
└── middleware/
    └── auth.ts                  # 驗證中介層 (預留給 ST-002)
```

### 4.2 API Routes

#### 4.2.0 GET `/api/organization/structure` - 取得組織架構（牧區與小組層級）

**Response:**
```typescript
ZoneWithGroups[]
```

**Implementation (`server/api/organization/structure.get.ts`):**

```typescript
import { organizationService } from '~/server/services/organization.service';

export default defineEventHandler(async (event) => {
  try {
    const structure = await organizationService.getOrganizationStructure();
    return structure;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '無法取得組織架構',
    });
  }
});
```

**Service Implementation (`server/services/organization.service.ts`):**

```typescript
import { getFirestore } from 'firebase-admin/firestore';
import type { ZoneWithGroups } from '~/types/member';

class OrganizationService {
  private db = getFirestore();

  async getOrganizationStructure(): Promise<ZoneWithGroups[]> {
    // 取得所有啟用的牧區
    const zonesSnapshot = await this.db
      .collection('zones')
      .where('status', '==', 'Active')
      .orderBy('name', 'asc')
      .get();

    // 取得所有啟用的小組
    const groupsSnapshot = await this.db
      .collection('groups')
      .where('status', '==', 'Active')
      .orderBy('name', 'asc')
      .get();

    const groupsByZone: Record<string, any[]> = {};
    groupsSnapshot.docs.forEach(doc => {
      const group = doc.data();
      if (!groupsByZone[group.zoneId]) {
        groupsByZone[group.zoneId] = [];
      }
      groupsByZone[group.zoneId].push({
        groupId: doc.id,
        groupName: group.name,
        groupLeaderId: group.leaderId,
        groupLeaderName: group.leaderName,
      });
    });

    // 組合層級結構
    const structure: ZoneWithGroups[] = zonesSnapshot.docs.map(doc => {
      const zone = doc.data();
      return {
        zoneId: doc.id,
        zoneName: zone.name,
        zoneLeaderId: zone.leaderId,
        zoneLeaderName: zone.leaderName,
        groups: groupsByZone[doc.id] || [],
      };
    });

    return structure;
  }
}

export const organizationService = new OrganizationService();
```

#### 4.2.1 GET `/api/members` - 取得會友列表

**Request Query Parameters:**
```typescript
{
  page?: number;        // 頁碼 (預設 1)
  limit?: number;       // 每頁筆數 (預設 10)
  search?: string;      // 搜尋關鍵字 (姓名/Email/手機)
  zoneId?: string;      // 牧區 ID
  groupId?: string;     // 小組 ID
  status?: string;      // 會籍狀態
}
```

**Response:**
```typescript
{
  members: Member[];
  total: number;
  page: number;
  limit: number;
}
```

**Implementation (`server/api/members/index.get.ts`):**

```typescript
import { memberService } from '~/server/services/member.service';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const search = query.search as string | undefined;
  const zoneId = query.zoneId as string | undefined;
  const groupId = query.groupId as string | undefined;
  const status = query.status as string | undefined;

  try {
    const result = await memberService.getMembers({
      page,
      limit,
      search,
      zoneId,
      groupId,
      status,
    });

    return result;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '無法取得會友列表',
    });
  }
});
```

#### 4.2.2 POST `/api/members` - 建立會友

**Request Body:**
```typescript
MemberFormValues (根據 memberSchema)
```

**Response:**
```typescript
Member (含 uuid, createdAt, updatedAt)
```

**Implementation (`server/api/members/index.post.ts`):**

```typescript
import { memberService } from '~/server/services/member.service';
import { memberSchema } from '~/utils/member/schema';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // Zod 驗證
  const validationResult = memberSchema.safeParse(body);
  if (!validationResult.success) {
    throw createError({
      statusCode: 400,
      message: '資料驗證失敗',
      data: validationResult.error.flatten(),
    });
  }

  try {
    const member = await memberService.createMember(validationResult.data);
    return member;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '建立會友失敗',
    });
  }
});
```

#### 4.2.3 GET `/api/members/:uuid` - 取得單一會友

**Response:**
```typescript
Member
```

**Implementation (`server/api/members/[uuid].get.ts`):**

```typescript
import { memberService } from '~/server/services/member.service';

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid');

  if (!uuid) {
    throw createError({
      statusCode: 400,
      message: '缺少會友 UUID',
    });
  }

  try {
    const member = await memberService.getMemberById(uuid);

    if (!member) {
      throw createError({
        statusCode: 404,
        message: '找不到該會友',
      });
    }

    return member;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '無法取得會友資料',
    });
  }
});
```

#### 4.2.4 PATCH `/api/members/:uuid` - 更新會友

**Request Body:**
```typescript
Partial<MemberFormValues>
```

**Response:**
```typescript
Member
```

**Implementation (`server/api/members/[uuid].patch.ts`):**

```typescript
import { memberService } from '~/server/services/member.service';
import { updateMemberSchema } from '~/utils/member/schema';

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid');
  const body = await readBody(event);

  if (!uuid) {
    throw createError({
      statusCode: 400,
      message: '缺少會友 UUID',
    });
  }

  // Zod 驗證
  const validationResult = updateMemberSchema.safeParse(body);
  if (!validationResult.success) {
    throw createError({
      statusCode: 400,
      message: '資料驗證失敗',
      data: validationResult.error.flatten(),
    });
  }

  try {
    const member = await memberService.updateMember(uuid, validationResult.data);

    if (!member) {
      throw createError({
        statusCode: 404,
        message: '找不到該會友',
      });
    }

    return member;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '更新會友失敗',
    });
  }
});
```

#### 4.2.5 DELETE `/api/members/:uuid` - 刪除會友

**Response:**
```typescript
{ success: true }
```

**Implementation (`server/api/members/[uuid].delete.ts`):**

```typescript
import { memberService } from '~/server/services/member.service';

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid');

  if (!uuid) {
    throw createError({
      statusCode: 400,
      message: '缺少會友 UUID',
    });
  }

  try {
    await memberService.deleteMember(uuid);
    return { success: true };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '刪除會友失敗',
    });
  }
});
```

### 4.3 Service Layer

**`server/services/member.service.ts`**

```typescript
import { memberRepository } from '~/server/repositories/member.repository';
import type { Member, MemberFormValues } from '~/types/member';

class MemberService {
  /**
   * 建立會友
   */
  async createMember(data: MemberFormValues): Promise<Member> {
    // 檢查手機號碼是否重複
    const existingMember = await memberRepository.findByMobile(data.mobile);
    if (existingMember) {
      throw createError({
        statusCode: 409,
        message: '此手機號碼已被註冊',
      });
    }

    // 驗證牧區與小組連動
    if (data.groupId && !data.zoneId) {
      throw createError({
        statusCode: 400,
        message: '選擇小組前必須先選擇牧區',
      });
    }

    // 建立會友
    const member = await memberRepository.create(data);
    return member;
  }

  /**
   * 取得會友列表
   */
  async getMembers(params: {
    page: number;
    limit: number;
    search?: string;
    zoneId?: string;
    groupId?: string;
    status?: string;
  }): Promise<{
    members: Member[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { members, total } = await memberRepository.findAll(params);

    return {
      members,
      total,
      page: params.page,
      limit: params.limit,
    };
  }

  /**
   * 取得單一會友
   */
  async getMemberById(uuid: string): Promise<Member | null> {
    return await memberRepository.findById(uuid);
  }

  /**
   * 更新會友
   */
  async updateMember(uuid: string, data: Partial<MemberFormValues>): Promise<Member | null> {
    // 檢查會友是否存在
    const existingMember = await memberRepository.findById(uuid);
    if (!existingMember) {
      return null;
    }

    // 若更新手機號碼，檢查是否重複
    if (data.mobile && data.mobile !== existingMember.mobile) {
      const duplicateMember = await memberRepository.findByMobile(data.mobile);
      if (duplicateMember) {
        throw createError({
          statusCode: 409,
          message: '此手機號碼已被註冊',
        });
      }
    }

    // 驗證牧區與小組連動
    if (data.groupId && !data.zoneId && !existingMember.zoneId) {
      throw createError({
        statusCode: 400,
        message: '選擇小組前必須先選擇牧區',
      });
    }

    // 更新會友
    const updatedMember = await memberRepository.update(uuid, data);
    return updatedMember;
  }

  /**
   * 刪除會友 (軟刪除)
   */
  async deleteMember(uuid: string): Promise<void> {
    const member = await memberRepository.findById(uuid);
    if (!member) {
      throw createError({
        statusCode: 404,
        message: '找不到該會友',
      });
    }

    // 軟刪除：將狀態改為 Inactive
    await memberRepository.update(uuid, { status: 'Inactive' });
  }
}

export const memberService = new MemberService();
```

### 4.4 Repository Layer

**`server/repositories/member.repository.ts`**

```typescript
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { Member, MemberFormValues } from '~/types/member';

class MemberRepository {
  private db = getFirestore();
  private collection = 'members';

  /**
   * 建立會友
   */
  async create(data: MemberFormValues): Promise<Member> {
    const docRef = this.db.collection(this.collection).doc();

    const member: Member = {
      uuid: docRef.id,
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await docRef.set(member);
    return member;
  }

  /**
   * 根據 UUID 查詢會友
   */
  async findById(uuid: string): Promise<Member | null> {
    const docSnap = await this.db.collection(this.collection).doc(uuid).get();

    if (!docSnap.exists) {
      return null;
    }

    return docSnap.data() as Member;
  }

  /**
   * 根據手機號碼查詢會友
   */
  async findByMobile(mobile: string): Promise<Member | null> {
    const snapshot = await this.db
      .collection(this.collection)
      .where('mobile', '==', mobile)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data() as Member;
  }

  /**
   * 查詢會友列表
   */
  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    zoneId?: string;
    groupId?: string;
    status?: string;
  }): Promise<{ members: Member[]; total: number }> {
    let query = this.db.collection(this.collection).where('status', '!=', 'Inactive');

    // 篩選條件
    if (params.zoneId) {
      query = query.where('zoneId', '==', params.zoneId);
    }
    if (params.groupId) {
      query = query.where('groupId', '==', params.groupId);
    }
    if (params.status) {
      query = query.where('status', '==', params.status);
    }

    // 搜尋 (Firebase 不支援 LIKE，需使用全文搜尋或 Algolia)
    // 這裡簡化為前端篩選或使用 array-contains
    // TODO: 考慮整合 Algolia 或 ElasticSearch

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

    const members = snapshot.docs.map(doc => doc.data() as Member);

    return { members, total };
  }

  /**
   * 更新會友
   */
  async update(uuid: string, data: Partial<MemberFormValues>): Promise<Member | null> {
    const docRef = this.db.collection(this.collection).doc(uuid);

    const updateData = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();
    return updatedDoc.data() as Member;
  }

  /**
   * 刪除會友 (實際刪除，不建議使用)
   */
  async delete(uuid: string): Promise<void> {
    await this.db.collection(this.collection).doc(uuid).delete();
  }
}

export const memberRepository = new MemberRepository();
```

---

## 5. UI/UX Design Reference

### 5.1 會友列表頁 (Members List)

根據設計稿 `人員管理 - 列表/screen.png`：

**Layout:**
- 頂部：標題、匯出 Excel 按鈕、新增會友按鈕
- 篩選區：搜尋框、牧區下拉選單、受洗狀態、歸屬小組
- 表格：顯示姓名/暱稱、聯絡資訊、身份標籤、歸屬小組、系統權限、操作

**Component Mapping:**
- 搜尋框: `<InputText>` with `pi-search` icon
- 下拉選單: `<Select>` (PrimeVue)
- 表格: `<DataTable>` (PrimeVue)
- 按鈕: `<Button>` (severity="secondary" for primary actions)
- 標籤: `<Tag>` (受洗狀態、小組身份)

**Implementation (`app/pages/members/index.vue`):**

```vue
<script setup lang="ts">
import type { Member } from '~/types/member';

definePageMeta({
  layout: 'dashboard',
});

const { fetchMembers } = useMember();
const { zones, fetchZones } = useZoneGroup();

// 篩選參數
const filters = ref({
  search: '',
  zoneId: null as string | null,
  groupId: null as string | null,
  status: null as string | null,
});

// 分頁
const page = ref(1);
const limit = ref(10);
const total = ref(0);

// 會友列表
const members = ref<Member[]>([]);
const loading = ref(false);

// 載入會友列表
const loadMembers = async () => {
  loading.value = true;
  try {
    const result = await fetchMembers({
      page: page.value,
      limit: limit.value,
      ...filters.value,
    });
    members.value = result.members;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
};

// 初始化
onMounted(async () => {
  await fetchOrganizationStructure();
  await loadMembers();
});

// 篩選變更時重新載入
watch(filters, () => {
  page.value = 1;
  loadMembers();
}, { deep: true });

// 分頁變更
const onPageChange = (event: any) => {
  page.value = event.page + 1;
  loadMembers();
};

// 匯出 Excel
const exportExcel = () => {
  // TODO: 實作匯出功能
  console.log('Export Excel');
};

// 前往新增頁面
const goToCreate = () => {
  navigateTo('/members/create');
};

// 編輯會友
const editMember = (uuid: string) => {
  navigateTo(`/members/${uuid}/edit`);
};

// 刪除會友
const { deleteMember } = useMember();
const confirmDelete = (uuid: string) => {
  // TODO: 使用 PrimeVue ConfirmDialog
  if (confirm('確定要刪除此會友嗎？')) {
    deleteMember(uuid).then(success => {
      if (success) {
        loadMembers();
      }
    });
  }
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
          label="匯出 Excel"
          icon="pi pi-download"
          severity="secondary"
          outlined
          @click="exportExcel"
        />
        <Button
          label="+ 新增會友"
          icon="pi pi-plus"
          severity="secondary"
          @click="goToCreate"
        />
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section mb-6 p-4 bg-white rounded-lg shadow">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <InputText
          v-model="filters.search"
          placeholder="姓名、電話或 Email..."
          class="w-full"
        >
          <template #prefix>
            <i class="pi pi-search" />
          </template>
        </InputText>

        <Select
          v-model="filters.zoneId"
          :options="zones"
          option-label="name"
          option-value="id"
          placeholder="所有角色"
          show-clear
          class="w-full"
        />

        <Select
          v-model="filters.status"
          :options="[
            { label: '已受洗', value: 'baptized' },
            { label: '未受洗', value: 'not_baptized' },
          ]"
          option-label="label"
          option-value="value"
          placeholder="受洗狀態"
          show-clear
          class="w-full"
        />

        <Select
          v-model="filters.groupId"
          placeholder="歸屬小組"
          show-clear
          class="w-full"
        />
      </div>
    </div>

    <!-- Table -->
    <DataTable
      :value="members"
      :loading="loading"
      striped-rows
      :rows="limit"
      :total-records="total"
      :paginator="true"
      @page="onPageChange"
      class="shadow"
    >
      <!-- 姓名/暱稱 -->
      <Column field="fullName" header="姓名/暱稱">
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
              <div class="text-sm text-slate-500">{{ data.gender === 'Male' ? '男' : '女' }}</div>
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
            <div class="flex items-center gap-2">
              <i class="pi pi-envelope text-slate-400" />
              <span>{{ data.email }}</span>
            </div>
          </div>
        </template>
      </Column>

      <!-- 身份標籤 -->
      <Column header="身份標籤">
        <template #body="{ data }">
          <div class="flex flex-wrap gap-2">
            <Tag
              v-if="data.baptismStatus"
              severity="success"
              value="已受洗"
            />
            <Tag
              v-else
              severity="warn"
              value="小組友"
            />
          </div>
        </template>
      </Column>

      <!-- 歸屬小組 -->
      <Column field="groupId" header="歸屬小組">
        <template #body="{ data }">
          <span v-if="data.groupId">{{ data.groupId }}</span>
          <span v-else class="text-slate-400">未分組</span>
        </template>
      </Column>

      <!-- 系統權限 -->
      <Column header="系統權限">
        <template #body="{ data }">
          <Tag :value="data.status" />
        </template>
      </Column>

      <!-- 操作 -->
      <Column header="操作">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button
              icon="pi pi-pencil"
              severity="secondary"
              text
              rounded
              @click="editMember(data.uuid)"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              @click="confirmDelete(data.uuid)"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<style scoped>
.members-page {
  padding: 2rem;
}
</style>
```

### 5.2 會友編輯頁 (Member Edit)

根據設計稿 `人員管理 - 編輯/screen.png`：

**Layout:**
- 左側：大頭貼、系統權限、帳號狀態、註冊日期、最後登入
- 右側：基本與聯絡檔、信仰與歸屬（Sections）

**Implementation (`app/pages/members/[id]/edit.vue`):**

```vue
<script setup lang="ts">
import type { MemberFormValues } from '~/utils/member/schema';

definePageMeta({
  layout: 'dashboard',
});

const route = useRoute();
const uuid = route.params.id as string;

const { fetchMemberById, updateMember } = useMember();

// 載入會友資料
const member = ref<Member | null>(null);
const loading = ref(false);

const loadMember = async () => {
  loading.value = true;
  try {
    member.value = await fetchMemberById(uuid);
  } finally {
    loading.value = false;
  }
};

onMounted(loadMember);

// 提交更新
const submitting = ref(false);
const onSubmit = async (data: MemberFormValues) => {
  submitting.value = true;
  try {
    const updated = await updateMember(uuid, data);
    if (updated) {
      navigateTo('/members');
    }
  } finally {
    submitting.value = false;
  }
};

// 返回列表
const goBack = () => {
  navigateTo('/members');
};
</script>

<template>
  <div class="member-edit-page">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">編輯會友: {{ member?.fullName }}</h1>
        <Breadcrumb
          :home="{ label: '會友名單管理', to: '/members' }"
          :model="[{ label: '編輯資料' }]"
        />
      </div>
      <div class="flex gap-3">
        <Button
          label="重設密碼"
          icon="pi pi-key"
          severity="secondary"
          outlined
        />
        <Button
          label="儲存變更"
          icon="pi pi-save"
          severity="secondary"
          type="submit"
          form="member-form"
          :loading="submitting"
        />
      </div>
    </div>

    <!-- Content -->
    <div v-if="!loading && member" class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Left Sidebar -->
      <div class="lg:col-span-1">
        <Card>
          <template #content>
            <!-- Avatar -->
            <div class="flex flex-col items-center gap-4">
              <Avatar
                :image="member.avatar"
                :label="member.fullName[0]"
                shape="circle"
                size="xlarge"
                style="width: 120px; height: 120px"
              />
              <Button
                label="更換圖片"
                icon="pi pi-image"
                severity="secondary"
                text
                size="small"
              />
            </div>

            <Divider />

            <!-- System Info -->
            <div class="space-y-4">
              <div>
                <label class="text-sm text-slate-600">系統權限</label>
                <Select
                  :model-value="member.status"
                  :options="[
                    { label: '一般會友', value: 'Active' },
                    { label: '小組長', value: 'GroupLeader' },
                  ]"
                  option-label="label"
                  option-value="value"
                  class="w-full mt-1"
                />
              </div>

              <div>
                <label class="text-sm text-slate-600">帳號狀態</label>
                <div class="mt-1">
                  <ToggleSwitch :model-value="member.status === 'Active'" />
                  <span class="ml-2">啟用</span>
                </div>
              </div>

              <Divider />

              <div>
                <div class="text-sm text-slate-600">註冊日期</div>
                <div class="font-semibold">{{ member.createdAt }}</div>
              </div>

              <div>
                <div class="text-sm text-slate-600">最後登入</div>
                <div class="font-semibold">{{ member.updatedAt }}</div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Main Form -->
      <div class="lg:col-span-3">
        <Card>
          <template #content>
            <MemberForm
              :member="member"
              :loading="submitting"
              @submit="onSubmit"
            />
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
.member-edit-page {
  padding: 2rem;
}
</style>
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

**Frontend:**
- `useMember` composable: 測試 CRUD 方法
- `useZoneGroup` composable: 測試連動邏輯
- Zod Schema: 測試驗證規則

**Backend:**
- `member.service.ts`: 測試業務邏輯
- `member.repository.ts`: 測試資料存取

**Testing Framework:** Vitest

### 6.2 Integration Tests

- API Routes: 測試完整的 Request/Response 流程
- Firebase Integration: 測試資料庫操作

### 6.3 E2E Tests

- 使用 Playwright 測試完整的會友 CRUD 流程
- 測試牧區小組連動邏輯
- 測試表單驗證

---

## 7. Security Considerations

### 7.1 資料遮罩 (預留給 ST-002)

敏感欄位 (`mobile`, `email`, `lineId`, `address`, `emergencyContactPhone`) 在 API 回傳時預設遮罩：
- **Mobile 格式**: `092*-3**-6**` (只顯示前 3 碼第一位、第 2 段第一位、第 3 段第一位)
- **Email 格式**: `pe***@example.com` (保留前 2 字元和 domain)
- **Line ID 格式**: `pe***_123` (保留前 2 字元和最後 3 字元)
- **Address 格式**: `台北市內湖區***` (保留前 10 字元)
- **權限控制**: 根據使用者角色的 Z 軸權限決定是否顯示「眼睛 icon」解鎖功能

**Implementation (預留介面):**

```typescript
// server/utils/masking.ts

/**
 * 遮罩手機號碼
 * @example maskMobile('0912345678') => '091*-3**-6**'
 */
export function maskMobile(mobile: string, canReveal: boolean = false): {
  value: string;
  canReveal: boolean;
} {
  // 移除可能的連字號
  const cleaned = mobile.replace(/-/g, '');
  
  // 格式化為 092*-3**-6**
  if (cleaned.length === 10) {
    const part1 = cleaned.substring(0, 3) + '*';      // 092*
    const part2 = cleaned.substring(4, 5) + '**';     // 3**
    const part3 = cleaned.substring(7, 8) + '**';     // 6**
    const masked = `${part1}-${part2}-${part3}`;
    return { value: masked, canReveal };
  }
  
  // 備用格式
  return { value: '****-***-***', canReveal };
}

/**
 * 遮罩 Email
 * @example maskEmail('peter.chen@example.com') => 'pe***@example.com'
 */
export function maskEmail(email: string, canReveal: boolean = false): {
  value: string;
  canReveal: boolean;
} {
  const [localPart, domain] = email.split('@');
  if (!domain) return { value: '***@***.***', canReveal };
  
  const visibleChars = Math.min(2, localPart.length);
  const masked = localPart.substring(0, visibleChars) + '***' + '@' + domain;
  return { value: masked, canReveal };
}

/**
 * 遮罩 Line ID
 * @example maskLineId('peter_chen_123') => 'pe***_123'
 */
export function maskLineId(lineId: string, canReveal: boolean = false): {
  value: string;
  canReveal: boolean;
} {
  if (lineId.length <= 5) {
    return { value: '***', canReveal };
  }
  
  const prefix = lineId.substring(0, 2);
  const suffix = lineId.substring(lineId.length - 3);
  const masked = `${prefix}***${suffix}`;
  return { value: masked, canReveal };
}

/**
 * 遮罩地址
 * @example maskAddress('台北市內湖區成功路四段168號') => '台北市內湖區***'
 */
export function maskAddress(address: string, canReveal: boolean = false): {
  value: string;
  canReveal: boolean;
} {
  const visibleLength = Math.min(10, address.length);
  const masked = address.substring(0, visibleLength) + '***';
  return { value: masked, canReveal };
}

/**
 * 應用所有遮罩規則到會友資料
 */
export function applyMemberMasking(
  member: Member,
  permissions: {
    canRevealMobile: boolean;
    canRevealEmail: boolean;
    canRevealLineId: boolean;
    canRevealAddress: boolean;
    canRevealEmergencyPhone: boolean;
  }
): MemberResponse {
  return {
    ...member,
    ...maskMobile(member.mobile, permissions.canRevealMobile),
    mobile: maskMobile(member.mobile, permissions.canRevealMobile).value,
    mobileCanReveal: permissions.canRevealMobile,
    ...maskEmail(member.email, permissions.canRevealEmail),
    email: maskEmail(member.email, permissions.canRevealEmail).value,
    emailCanReveal: permissions.canRevealEmail,
    ...(member.lineId && {
      lineId: maskLineId(member.lineId, permissions.canRevealLineId).value,
      lineIdCanReveal: permissions.canRevealLineId,
    }),
    ...(member.address && {
      address: maskAddress(member.address, permissions.canRevealAddress).value,
      addressCanReveal: permissions.canRevealAddress,
    }),
    emergencyContactPhone: maskMobile(member.emergencyContactPhone, permissions.canRevealEmergencyPhone).value,
    emergencyContactPhoneCanReveal: permissions.canRevealEmergencyPhone,
  };
}
```

### 7.2 RBAC Integration (預留給 ST-002)

- **Middleware**: `server/middleware/auth.ts` 驗證 JWT Token
- **Permission Check**: 根據使用者角色檢查 X 軸 (功能權限) 和 Y 軸 (資料範圍)
- **Data Filtering**: Repository 層根據 `DataScope` 篩選資料

---

## 8. Performance Optimization

### 8.1 Frontend

- **Lazy Loading**: 分頁載入會友列表
- **Debounce**: 搜尋框使用 `useDebounceFn` (300ms)
- **Caching**: 使用 Pinia 快取牧區、小組、課程選項

### 8.2 Backend

- **Indexing**: Firebase 為 `mobile`, `zoneId`, `groupId`, `status` 建立索引
- **Pagination**: 使用 `offset` + `limit` 實作分頁
- **Batch Operations**: 批次查詢牧區、小組資料

### 8.3 Database

- **Composite Index**: `zoneId` + `groupId` + `status` + `createdAt`
- **Unique Constraint**: `mobile` 欄位唯一性

---

## 9. Migration & Deployment

### 9.1 Database Migration

**Step 1: 建立 Collections**
```javascript
// Firebase Admin SDK Script
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// 建立 members collection 索引
db.collection('members').doc('_indexes').set({
  indexes: [
    { field: 'mobile', type: 'ASCENDING' },
    { field: 'zoneId', type: 'ASCENDING' },
    { field: 'groupId', type: 'ASCENDING' },
    { field: 'status', type: 'ASCENDING' },
    { field: 'createdAt', type: 'DESCENDING' },
  ],
});
```

**Step 2: Seed Data**
```javascript
// 匯入初始牧區、小組資料
// 參考 app/data/pastoral-zones.data.ts
```

### 9.2 Deployment Checklist

- [ ] 建立 Firebase Collections (`members`, `zones`, `groups`, `courses`)
- [ ] 設定 Firebase Security Rules
- [ ] 建立資料庫索引
- [ ] 匯入初始資料 (Seed Data)
- [ ] 測試 API Routes
- [ ] 測試前端表單驗證
- [ ] 測試牧區小組連動
- [ ] 部署到 Staging 環境
- [ ] UAT 測試
- [ ] 部署到 Production

---

## 10. Mock Data for Local Development

### 10.1 組織架構假資料

**`app/data/organization.mock.ts`**

```typescript
import type { ZoneWithGroups } from '~/types/member';

export const mockOrganizationStructure: ZoneWithGroups[] = [
  {
    zoneId: 'zone_001',
    zoneName: '林牧區',
    zoneLeaderId: 'member_leader_001',
    zoneLeaderName: '林大衛',
    groups: [
      {
        groupId: 'group_001',
        groupName: '喜樂小組',
        groupLeaderId: 'member_leader_011',
        groupLeaderName: '陳小明',
      },
      {
        groupId: 'group_002',
        groupName: '平安小組',
        groupLeaderId: 'member_leader_012',
        groupLeaderName: '李美玲',
      },
      {
        groupId: 'group_003',
        groupName: '恩典小組',
        groupLeaderId: 'member_leader_013',
        groupLeaderName: '張志強',
      },
    ],
  },
  {
    zoneId: 'zone_002',
    zoneName: '張牧區',
    zoneLeaderId: 'member_leader_002',
    zoneLeaderName: '張恩慈',
    groups: [
      {
        groupId: 'group_004',
        groupName: '愛心小組',
        groupLeaderId: 'member_leader_014',
        groupLeaderName: '王大明',
      },
      {
        groupId: 'group_005',
        groupName: '信心小組',
        groupLeaderId: 'member_leader_015',
        groupLeaderName: '黃淑芬',
      },
      {
        groupId: 'group_006',
        groupName: '盼望小組',
        groupLeaderId: 'member_leader_016',
        groupLeaderName: '劉建國',
      },
    ],
  },
  {
    zoneId: 'zone_003',
    zoneName: '李牧區',
    zoneLeaderId: 'member_leader_003',
    zoneLeaderName: '李約翰',
    groups: [
      {
        groupId: 'group_007',
        groupName: '得勝小組',
        groupLeaderId: 'member_leader_017',
        groupLeaderName: '周雅婷',
      },
      {
        groupId: 'group_008',
        groupName: '豐盛小組',
        groupLeaderId: 'member_leader_018',
        groupLeaderName: '鄭偉強',
      },
      {
        groupId: 'group_009',
        groupName: '榮耀小組',
        groupLeaderId: 'member_leader_019',
        groupLeaderName: '吳佳蓉',
      },
    ],
  },
  {
    zoneId: 'zone_004',
    zoneName: '社青牧區',
    zoneLeaderId: 'member_leader_004',
    zoneLeaderName: '蔡安平',
    groups: [
      {
        groupId: 'group_010',
        groupName: 'Young Adults 1',
        groupLeaderId: 'member_leader_020',
        groupLeaderName: '謝明宏',
      },
      {
        groupId: 'group_011',
        groupName: 'Young Adults 2',
        groupLeaderId: 'member_leader_021',
        groupLeaderName: '林詩涵',
      },
    ],
  },
];
```

### 10.2 課程假資料

**`app/data/courses.mock.ts`**

```typescript
import type { Course } from '~/types/member';

export const mockCourses: Course[] = [
  {
    id: 'course_001',
    name: '啟發課程 (Alpha)',
    code: 'ALPHA',
    category: '福音預工',
    status: 'Active',
    createdAt: new Date('2023-01-01'),
  },
  {
    id: 'course_002',
    name: '幸福小組',
    code: 'HAPPINESS_GROUP',
    category: '福音預工',
    status: 'Active',
    createdAt: new Date('2023-01-01'),
  },
  {
    id: 'course_003',
    name: '經歷神營會',
    code: 'ENCOUNTER_GOD',
    category: '靈命成長',
    status: 'Active',
    createdAt: new Date('2023-01-01'),
  },
  {
    id: 'course_004',
    name: '從懷疑到相信',
    code: 'DOUBT_TO_FAITH',
    category: '福音預工',
    status: 'Active',
    createdAt: new Date('2023-01-01'),
  },
  {
    id: 'course_005',
    name: '新生命課程',
    code: 'NEW_LIFE',
    category: '門徒訓練',
    status: 'Active',
    createdAt: new Date('2023-01-01'),
  },
  {
    id: 'course_006',
    name: '領袖學校',
    code: 'LEADERSHIP_SCHOOL',
    category: '領袖訓練',
    status: 'Active',
    createdAt: new Date('2023-01-01'),
  },
];
```

### 10.3 會友假資料

**`app/data/members.mock.ts`**

```typescript
import type { Member } from '~/types/member';

export const mockMembers: Member[] = [
  {
    uuid: 'member_001',
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-02-10T14:20:00Z'),
    fullName: '陳小明',
    gender: 'Male',
    dob: new Date('1995-06-12'),
    email: 'peter.chen@example.com',
    mobile: '0912345678',
    address: '台北市內湖區成功路四段 168 號',
    lineId: 'peter_chen_123',
    emergencyContactName: '陳大華',
    emergencyContactRelationship: '父子',
    emergencyContactPhone: '0922123456',
    baptismStatus: true,
    baptismDate: new Date('2023-10-15'),
    status: 'Active',
    zoneId: 'zone_001',
    groupId: 'group_001',
    pastCourses: ['course_001', 'course_002'],
    avatar: 'https://i.pravatar.cc/150?img=12',
  },
  {
    uuid: 'member_002',
    createdAt: new Date('2024-02-20T09:15:00Z'),
    updatedAt: new Date('2024-02-20T09:15:00Z'),
    fullName: '林雅婷',
    gender: 'Female',
    dob: new Date('1998-03-25'),
    email: 'grace.lin@example.com',
    mobile: '0923456789',
    lineId: 'grace_lin_99',
    emergencyContactName: '林淑芬',
    emergencyContactRelationship: '母女',
    emergencyContactPhone: '0933234567',
    baptismStatus: false,
    status: 'Active',
    zoneId: 'zone_001',
    groupId: 'group_002',
    pastCourses: ['course_004'],
    avatar: 'https://i.pravatar.cc/150?img=45',
  },
  {
    uuid: 'member_003',
    createdAt: new Date('2024-01-10T11:00:00Z'),
    updatedAt: new Date('2024-02-08T16:30:00Z'),
    fullName: '張志強',
    gender: 'Male',
    dob: new Date('1988-11-08'),
    email: 'david.chang@example.com',
    mobile: '0934567890',
    address: '新北市板橋區文化路二段 256 號',
    lineId: 'david_chang',
    emergencyContactName: '張玉萍',
    emergencyContactRelationship: '配偶',
    emergencyContactPhone: '0944345678',
    baptismStatus: true,
    baptismDate: new Date('2018-12-25'),
    status: 'Active',
    zoneId: 'zone_002',
    groupId: 'group_004',
    pastCourses: ['course_001', 'course_003', 'course_005'],
    avatar: 'https://i.pravatar.cc/150?img=33',
  },
  {
    uuid: 'member_004',
    createdAt: new Date('2024-03-01T08:45:00Z'),
    updatedAt: new Date('2024-03-01T08:45:00Z'),
    fullName: '王美玲',
    gender: 'Female',
    dob: new Date('2000-07-14'),
    email: 'may.wang@example.com',
    mobile: '0945678901',
    emergencyContactName: '王建國',
    emergencyContactRelationship: '父女',
    emergencyContactPhone: '0955456789',
    baptismStatus: false,
    status: 'Active',
    zoneId: 'zone_004',
    groupId: 'group_010',
    pastCourses: [],
    avatar: 'https://i.pravatar.cc/150?img=20',
  },
  {
    uuid: 'member_005',
    createdAt: new Date('2023-11-20T13:20:00Z'),
    updatedAt: new Date('2024-02-05T10:10:00Z'),
    fullName: '黃志豪',
    gender: 'Male',
    dob: new Date('1992-09-30'),
    email: 'john.huang@example.com',
    mobile: '0956789012',
    address: '台北市信義區信義路五段 7 號',
    lineId: 'john_huang_888',
    emergencyContactName: '黃秀娟',
    emergencyContactRelationship: '母子',
    emergencyContactPhone: '0966567890',
    baptismStatus: true,
    baptismDate: new Date('2022-04-10'),
    status: 'Active',
    zoneId: 'zone_003',
    groupId: 'group_007',
    pastCourses: ['course_001', 'course_002', 'course_003'],
    avatar: 'https://i.pravatar.cc/150?img=8',
  },
  {
    uuid: 'member_006',
    createdAt: new Date('2024-02-15T15:00:00Z'),
    updatedAt: new Date('2024-02-15T15:00:00Z'),
    fullName: '劉佳蓉',
    gender: 'Female',
    dob: new Date('1996-05-22'),
    email: 'joy.liu@example.com',
    mobile: '0967890123',
    emergencyContactName: '劉建宏',
    emergencyContactRelationship: '其他',
    emergencyContactPhone: '0977678901',
    baptismStatus: false,
    status: 'Active',
    zoneId: 'zone_002',
    groupId: 'group_005',
    pastCourses: ['course_004'],
    avatar: 'https://i.pravatar.cc/150?img=27',
  },
  {
    uuid: 'member_007',
    createdAt: new Date('2023-12-10T09:30:00Z'),
    updatedAt: new Date('2024-01-20T11:40:00Z'),
    fullName: '周偉強',
    gender: 'Male',
    dob: new Date('1985-02-18'),
    email: 'william.chou@example.com',
    mobile: '0978901234',
    address: '桃園市中壢區中央路 123 號',
    lineId: 'william_c',
    emergencyContactName: '周雅雯',
    emergencyContactRelationship: '配偶',
    emergencyContactPhone: '0988789012',
    baptismStatus: true,
    baptismDate: new Date('2015-06-14'),
    status: 'Active',
    zoneId: 'zone_003',
    groupId: 'group_008',
    pastCourses: ['course_001', 'course_005', 'course_006'],
    avatar: 'https://i.pravatar.cc/150?img=15',
  },
  {
    uuid: 'member_008',
    createdAt: new Date('2024-01-25T14:15:00Z'),
    updatedAt: new Date('2024-01-25T14:15:00Z'),
    fullName: '鄭淑芬',
    gender: 'Female',
    dob: new Date('1993-12-05'),
    email: 'sophia.cheng@example.com',
    mobile: '0989012345',
    emergencyContactName: '鄭文傑',
    emergencyContactRelationship: '朋友',
    emergencyContactPhone: '0990890123',
    baptismStatus: false,
    status: 'Active',
    zoneId: 'zone_001',
    groupId: 'group_003',
    pastCourses: [],
    avatar: 'https://i.pravatar.cc/150?img=38',
  },
  {
    uuid: 'member_009',
    createdAt: new Date('2023-10-05T10:00:00Z'),
    updatedAt: new Date('2024-02-11T09:25:00Z'),
    fullName: '吳建國',
    gender: 'Male',
    dob: new Date('1990-08-17'),
    email: 'kevin.wu@example.com',
    mobile: '0901234567',
    address: '台中市西屯區台灣大道三段 99 號',
    lineId: 'kevin_wu_777',
    emergencyContactName: '吳秀蘭',
    emergencyContactRelationship: '母子',
    emergencyContactPhone: '0912901234',
    baptismStatus: true,
    baptismDate: new Date('2021-09-19'),
    status: 'Active',
    zoneId: 'zone_004',
    groupId: 'group_011',
    pastCourses: ['course_002', 'course_003'],
    avatar: 'https://i.pravatar.cc/150?img=51',
  },
  {
    uuid: 'member_010',
    createdAt: new Date('2024-02-28T16:45:00Z'),
    updatedAt: new Date('2024-02-28T16:45:00Z'),
    fullName: '謝雅惠',
    gender: 'Female',
    dob: new Date('1999-04-11'),
    email: 'alice.hsieh@example.com',
    mobile: '0923012345',
    emergencyContactName: '謝明宗',
    emergencyContactRelationship: '父女',
    emergencyContactPhone: '0934023456',
    baptismStatus: false,
    status: 'Active',
    zoneId: 'zone_003',
    groupId: 'group_009',
    pastCourses: ['course_001'],
    avatar: 'https://i.pravatar.cc/150?img=24',
  },
];
```

### 10.4 Mock API Implementation

**`server/api/organization/structure.get.ts` (Development Mode)**

```typescript
import { mockOrganizationStructure } from '~/app/data/organization.mock';

export default defineEventHandler(async (event) => {
  // 開發環境使用 Mock Data
  if (process.env.NODE_ENV === 'development') {
    // 模擬 API 延遲
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockOrganizationStructure;
  }

  // 正式環境使用真實資料
  try {
    const { organizationService } = await import('~/server/services/organization.service');
    const structure = await organizationService.getOrganizationStructure();
    return structure;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '無法取得組織架構',
    });
  }
});
```

**`server/api/courses/index.get.ts` (Development Mode)**

```typescript
import { mockCourses } from '~/app/data/courses.mock';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  // 開發環境使用 Mock Data
  if (process.env.NODE_ENV === 'development') {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    let filtered = mockCourses;
    if (query.status) {
      filtered = filtered.filter(c => c.status === query.status);
    }
    
    return filtered;
  }

  // 正式環境使用真實資料
  // TODO: Implement real API
  return [];
});
```

**`server/api/members/index.get.ts` (Development Mode)**

```typescript
import { mockMembers } from '~/app/data/members.mock';
import { applyMemberMasking } from '~/server/utils/masking';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  
  // 開發環境使用 Mock Data
  if (process.env.NODE_ENV === 'development') {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    let filtered = mockMembers;
    
    // 篩選
    if (query.zoneId) {
      filtered = filtered.filter(m => m.zoneId === query.zoneId);
    }
    if (query.groupId) {
      filtered = filtered.filter(m => m.groupId === query.groupId);
    }
    if (query.status) {
      filtered = filtered.filter(m => m.status === query.status);
    }
    if (query.search) {
      const searchTerm = (query.search as string).toLowerCase();
      filtered = filtered.filter(m => 
        m.fullName.toLowerCase().includes(searchTerm) ||
        m.email.toLowerCase().includes(searchTerm) ||
        m.mobile.includes(searchTerm)
      );
    }
    
    // 分頁
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);
    
    // 應用資料遮罩（開發環境預設無權限解鎖）
    const masked = paginated.map(member => 
      applyMemberMasking(member, {
        canRevealMobile: false,
        canRevealEmail: false,
        canRevealLineId: false,
        canRevealAddress: false,
        canRevealEmergencyPhone: false,
      })
    );
    
    return {
      members: masked,
      total: filtered.length,
      page,
      limit,
    };
  }

  // 正式環境使用真實資料
  // TODO: Implement real API
  return {
    members: [],
    total: 0,
    page: 1,
    limit: 10,
  };
});
```

**`server/api/members/[uuid].get.ts` (Development Mode)**

```typescript
import { mockMembers } from '~/app/data/members.mock';
import { applyMemberMasking } from '~/server/utils/masking';

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid');

  if (!uuid) {
    throw createError({
      statusCode: 400,
      message: '缺少會友 UUID',
    });
  }

  // 開發環境使用 Mock Data
  if (process.env.NODE_ENV === 'development') {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const member = mockMembers.find(m => m.uuid === uuid);
    
    if (!member) {
      throw createError({
        statusCode: 404,
        message: '找不到該會友',
      });
    }
    
    // 應用資料遮罩
    return applyMemberMasking(member, {
      canRevealMobile: false,
      canRevealEmail: false,
      canRevealLineId: false,
      canRevealAddress: false,
      canRevealEmergencyPhone: false,
    });
  }

  // 正式環境使用真實資料
  // TODO: Implement real API
  throw createError({
    statusCode: 404,
    message: '找不到該會友',
  });
});
```

### 10.5 環境變數設置

**`.env.development`**

```env
# 開發環境設定
NODE_ENV=development
USE_MOCK_DATA=true

# Firebase (開發環境可留空)
FIREBASE_PROJECT_ID=your-dev-project-id
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

## 11. Future Enhancements (Out of Scope for ST-001)

- **全文搜尋**: 整合 Algolia 或 ElasticSearch
- **批次匯入**: CSV/Excel 匯入會友資料
- **頭像上傳**: 整合 Firebase Storage
- **審計日誌**: 記錄所有會友資料變更
- **資料遮罩解鎖**: 實作 Z 軸權限控制（ST-002）
- **多重角色管理**: 使用者可擁有多個角色（ST-002）

---

## 11. References

- **Story Document**: `ST001 - 資料核心與 Schema 定義.md`
- **Design Mockups**: `docs/設計稿/人員管理 - 列表/`, `docs/設計稿/人員管理 - 編輯/`
- **Related Stories**: ST-002 (RBAC), ST-003 (會友資料列表)
- **Tech Stack**: Nuxt 4, PrimeVue 4, Firebase, TypeScript, Zod

---

## Appendix A: API Contract Example

### POST /api/members

**Request:**
```json
{
  "fullName": "王小明",
  "gender": "Male",
  "dob": "1990-05-15",
  "email": "wang@example.com",
  "mobile": "0912345678",
  "address": "台北市內湖區成功路四段 168 號",
  "lineId": "wangxiaoming",
  "emergencyContactName": "王大華",
  "emergencyContactRelationship": "父子",
  "emergencyContactPhone": "0922123456",
  "baptismStatus": true,
  "baptismDate": "2020-12-25",
  "status": "Active",
  "zoneId": "zone_001",
  "groupId": "group_001",
  "pastCourses": ["course_001", "course_002"]
}
```

**Response (201 Created):**
```json
{
  "uuid": "member_abc123",
  "fullName": "王小明",
  "gender": "Male",
  "dob": "1990-05-15",
  "email": "wa***@example.com",
  "emailCanReveal": false,
  "mobile": "091*-3**-6**",
  "mobileCanReveal": false,
  "address": "台北市內湖區***",
  "addressCanReveal": false,
  "lineId": "wa***ing",
  "lineIdCanReveal": false,
  "emergencyContactName": "王大華",
  "emergencyContactRelationship": "父子",
  "emergencyContactPhone": "092*-1**-4**",
  "emergencyContactPhoneCanReveal": false,
  "baptismStatus": true,
  "baptismDate": "2020-12-25",
  "status": "Active",
  "zoneId": "zone_001",
  "groupId": "group_001",
  "pastCourses": ["course_001", "course_002"],
  "createdAt": "2026-02-11T10:30:00Z",
  "updatedAt": "2026-02-11T10:30:00Z"
}
```

---

## Appendix B: Database Security Rules (Firebase)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Members Collection
    match /members/{memberId} {
      // 讀取: 需驗證身份 (預留 RBAC)
      allow read: if request.auth != null;
      
      // 建立: 需驗證身份且有 MEMBER_CREATE 權限
      allow create: if request.auth != null 
        && hasPermission('MEMBER_CREATE');
      
      // 更新: 需驗證身份且有 MEMBER_EDIT 權限
      allow update: if request.auth != null 
        && hasPermission('MEMBER_EDIT');
      
      // 刪除: 需驗證身份且有 MEMBER_DELETE 權限
      allow delete: if request.auth != null 
        && hasPermission('MEMBER_DELETE');
    }
    
    // Helper Functions (預留給 ST-002)
    function hasPermission(permission) {
      return true; // TODO: Implement RBAC check
    }
  }
}
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-11  
**Author**: AI Assistant  
**Status**: Draft - Pending Review
