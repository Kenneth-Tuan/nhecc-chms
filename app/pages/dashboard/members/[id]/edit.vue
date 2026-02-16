<script setup lang="ts">
/**
 * Edit Member Page (ST004)
 */
import type { MemberDetail, UpdateMemberPayload } from '~/types/member';
import { useOrganizationStore } from '~/stores/organization.store';

definePageMeta({
  layout: 'dashboard',
});

const route = useRoute();
const router = useRouter();
const toast = useToast();
const orgStore = useOrganizationStore();
const memberUuid = route.params.id as string;

const { isSubmitting, fieldErrors, clearFieldError, validateUpdate, submitUpdate } = useMemberForm();
const { avatarPreview, avatarFile, isUploading, avatarError, shouldRemoveAvatar, onAvatarSelect, uploadAvatar, removeAvatar, initFromExisting } = useAvatarUpload();
const { mobileError, emailWarning, isCheckingMobile, isCheckingEmail, checkMobileUnique, checkEmailDuplicate } = useMemberValidation();

const isLoading = ref(true);
const member = ref<MemberDetail | null>(null);
const zoneGroupMismatch = ref(false);

// Form data
const form = ref({
  fullName: '',
  gender: '' as 'Male' | 'Female' | '',
  dob: '',
  email: '',
  mobile: '',
  address: '',
  lineId: '',
  emergencyContactName: '',
  emergencyContactRelationship: '',
  emergencyContactPhone: '',
  baptismStatus: false,
  baptismDate: '',
  status: 'Active' as 'Active' | 'Inactive' | 'Suspended',
  zoneId: null as string | null,
  groupId: null as string | null,
  roleId: null as string | null,
  pastCourses: [] as string[],
  existingAvatar: null as string | null,
});

// Zone-group cascade
const filteredGroups = computed(() => {
  if (!form.value.zoneId) return [];
  return orgStore.getGroupsByZone(form.value.zoneId);
});

function onZoneChange(): void {
  form.value.groupId = null;
}

// Option lists
const genderOptions = [
  { label: '男', value: 'Male' },
  { label: '女', value: 'Female' },
];

const relationshipOptions = [
  { label: '父子', value: '父子' },
  { label: '母女', value: '母女' },
  { label: '父女', value: '父女' },
  { label: '母子', value: '母子' },
  { label: '配偶', value: '配偶' },
  { label: '兄弟姊妹', value: '兄弟姊妹' },
  { label: '子女', value: '子女' },
  { label: '朋友', value: '朋友' },
  { label: '其他', value: '其他' },
];

const statusOptions = [
  { label: '啟用', value: 'Active' },
  { label: '停用', value: 'Inactive' },
  { label: '停權', value: 'Suspended' },
];

const zoneOptions = computed(() =>
  orgStore.zones.map((z) => ({ label: z.name, value: z.id })),
);

const groupOptions = computed(() =>
  filteredGroups.value.map((g) => ({ label: g.name, value: g.id })),
);

const roleOptions = computed(() =>
  orgStore.roles.map((r) => ({ label: r.name, value: r.id })),
);

const courseOptions = computed(() =>
  orgStore.courses.map((c) => ({ label: c.name, value: c.id })),
);

// Date helpers
const maxDate = new Date();
const dobDate = computed({
  get: () => (form.value.dob ? new Date(form.value.dob) : null),
  set: (val: Date | null) => {
    form.value.dob = val ? val.toISOString().split('T')[0] : '';
  },
});
const baptismDateValue = computed({
  get: () => (form.value.baptismDate ? new Date(form.value.baptismDate) : null),
  set: (val: Date | null) => {
    form.value.baptismDate = val ? val.toISOString().split('T')[0] : '';
  },
});

// Avatar display logic
const displayAvatar = computed(() => {
  if (avatarPreview.value) return avatarPreview.value;
  if (shouldRemoveAvatar.value) return undefined;
  return form.value.existingAvatar || undefined;
});

const hasAvatar = computed(() => !!displayAvatar.value);

// Mobile blur handler
async function onMobileBlur(): Promise<void> {
  if (form.value.mobile) {
    await checkMobileUnique(form.value.mobile, memberUuid);
  }
}

// Email blur handler
async function onEmailBlur(): Promise<void> {
  if (form.value.email) {
    await checkEmailDuplicate(form.value.email, memberUuid);
  }
}

// Form submission
async function handleSubmit(): Promise<void> {
  const payload: UpdateMemberPayload = {
    fullName: form.value.fullName.trim(),
    gender: form.value.gender as 'Male' | 'Female',
    dob: form.value.dob,
    email: form.value.email.trim(),
    mobile: form.value.mobile.trim().replace(/-/g, ''),
    address: form.value.address?.trim() || undefined,
    lineId: form.value.lineId?.trim() || undefined,
    emergencyContactName: form.value.emergencyContactName.trim(),
    emergencyContactRelationship: form.value.emergencyContactRelationship,
    emergencyContactPhone: form.value.emergencyContactPhone.trim().replace(/-/g, ''),
    baptismStatus: form.value.baptismStatus,
    baptismDate: form.value.baptismStatus ? form.value.baptismDate || undefined : undefined,
    status: form.value.status,
    zoneId: form.value.zoneId || undefined,
    groupId: form.value.groupId || undefined,
    roleIds: form.value.roleId ? [form.value.roleId] : [],
    pastCourses: form.value.pastCourses,
  };

  // Frontend validation
  if (!validateUpdate(payload)) {
    toast.add({
      severity: 'error',
      summary: '表單驗證失敗',
      detail: '請檢查紅色標記的欄位',
      life: 5000,
    });
    return;
  }

  // Check mobile uniqueness
  if (mobileError.value) {
    toast.add({
      severity: 'error',
      summary: '錯誤',
      detail: '手機號碼已被使用，請更換',
      life: 3000,
    });
    return;
  }

  // Handle avatar changes
  if (avatarFile.value) {
    try {
      const avatarUrl = await uploadAvatar(memberUuid);
      if (avatarUrl) {
        payload.avatar = avatarUrl;
      }
    } catch {
      toast.add({
        severity: 'error',
        summary: '頭像上傳失敗',
        detail: '請稍後再試',
        life: 5000,
      });
      return;
    }
  } else if (shouldRemoveAvatar.value) {
    payload.avatar = undefined;
  }

  const result = await submitUpdate(memberUuid, payload);
  if (result.success) {
    router.push('/dashboard/members');
  }
}

// Load member data and reference data
async function loadData(): Promise<void> {
  isLoading.value = true;
  try {
    const [memberData] = await Promise.all([
      $fetch<MemberDetail>(`/api/members/${memberUuid}`),
      orgStore.fetchStructure(),
      orgStore.fetchCourses(),
      orgStore.fetchRoles(),
    ]);

    member.value = memberData;

    // Pre-fill form
    form.value = {
      fullName: memberData.fullName,
      gender: memberData.gender,
      dob: memberData.dob,
      email: memberData.email,
      mobile: memberData.mobile,
      address: memberData.address || '',
      lineId: memberData.lineId || '',
      emergencyContactName: memberData.emergencyContactName,
      emergencyContactRelationship: memberData.emergencyContactRelationship,
      emergencyContactPhone: memberData.emergencyContactPhone,
      baptismStatus: memberData.baptismStatus,
      baptismDate: memberData.baptismDate || '',
      status: memberData.status,
      zoneId: memberData.zoneId || null,
      groupId: memberData.groupId || null,
      roleId: memberData.roleIds?.[0] || null,
      pastCourses: memberData.pastCourses || [],
      existingAvatar: memberData.avatar || null,
    };

    // Initialize avatar preview
    if (memberData.avatar) {
      initFromExisting(memberData.avatar);
    }

    // Check zone-group mismatch
    if (memberData.zoneId && memberData.groupId) {
      const group = orgStore.groups.find((g) => g.id === memberData.groupId);
      if (group && group.type === 'Pastoral' && group.zoneId !== memberData.zoneId) {
        zoneGroupMismatch.value = true;
      }
    }
  } catch {
    toast.add({
      severity: 'error',
      summary: '錯誤',
      detail: '載入會友資料失敗',
      life: 3000,
    });
    router.push('/dashboard/members');
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="max-w-4xl">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <Button icon="pi pi-arrow-left" text rounded @click="router.back()" />
      <div>
        <h1 class="text-2xl font-bold">編輯會友資料</h1>
        <p class="text-sm text-slate-500 mt-1">
          {{ member?.fullName || '載入中...' }}
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Zone-Group Mismatch Warning -->
      <Message v-if="zoneGroupMismatch" severity="warn" :closable="false">
        此會友的牧區與小組資料不匹配，請重新選擇牧區與小組。
      </Message>

      <!-- A. Basic Info -->
      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 class="text-lg font-semibold mb-4">
          <i class="pi pi-user mr-2 text-primary" />
          基本資訊
        </h2>

        <!-- Avatar -->
        <div class="mb-6">
          <label class="block text-sm font-medium mb-2">大頭貼</label>
          <div class="flex items-center gap-4">
            <Avatar
              :image="displayAvatar"
              :label="!displayAvatar ? (form.fullName?.charAt(0) || '?') : undefined"
              shape="circle"
              class="!w-24 !h-24 !text-3xl !bg-primary-100 dark:!bg-primary-900/30 !text-primary shrink-0"
            />
            <div class="flex flex-col gap-2">
              <FileUpload
                mode="basic"
                accept="image/jpeg,image/png"
                :maxFileSize="2000000"
                :auto="false"
                chooseLabel="更換圖片"
                @select="onAvatarSelect"
              />
              <Button
                v-if="hasAvatar"
                icon="pi pi-trash"
                label="移除"
                severity="danger"
                text
                size="small"
                @click="removeAvatar"
              />
            </div>
          </div>
          <small class="text-slate-500 mt-1 block">支援 JPG、PNG 格式，大小上限 2MB</small>
          <small v-if="avatarError" class="text-red-500 mt-1 block">{{ avatarError }}</small>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Full Name -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">姓名 <span class="text-red-500">*</span></label>
            <InputText
              v-model="form.fullName"
              placeholder="請輸入完整姓名"
              :invalid="!!fieldErrors.fullName"
              @input="clearFieldError('fullName')"
            />
            <small v-if="fieldErrors.fullName" class="text-red-500">{{ fieldErrors.fullName }}</small>
          </div>

          <!-- Gender -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">性別 <span class="text-red-500">*</span></label>
            <div class="flex items-center gap-4 h-[42px]">
              <div v-for="option in genderOptions" :key="option.value" class="flex items-center gap-2">
                <RadioButton
                  v-model="form.gender"
                  :value="option.value"
                  :inputId="`gender-${option.value}`"
                />
                <label :for="`gender-${option.value}`" class="text-sm cursor-pointer">{{ option.label }}</label>
              </div>
            </div>
            <small v-if="fieldErrors.gender" class="text-red-500">{{ fieldErrors.gender }}</small>
          </div>

          <!-- Date of Birth -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">出生年月日 <span class="text-red-500">*</span></label>
            <DatePicker
              v-model="dobDate"
              dateFormat="yy-mm-dd"
              :maxDate="maxDate"
              showIcon
              placeholder="選擇日期"
              :invalid="!!fieldErrors.dob"
            />
            <small v-if="fieldErrors.dob" class="text-red-500">{{ fieldErrors.dob }}</small>
          </div>
        </div>
      </div>

      <!-- B. Contact Info -->
      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 class="text-lg font-semibold mb-4">
          <i class="pi pi-phone mr-2 text-primary" />
          聯絡資訊
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Mobile -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">手機 <span class="text-red-500">*</span></label>
            <div class="relative">
              <InputText
                v-model="form.mobile"
                placeholder="0912345678"
                :invalid="!!fieldErrors.mobile || !!mobileError"
                class="w-full"
                @blur="onMobileBlur"
                @input="clearFieldError('mobile')"
              />
              <i v-if="isCheckingMobile" class="pi pi-spin pi-spinner absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <small v-if="fieldErrors.mobile" class="text-red-500">{{ fieldErrors.mobile }}</small>
            <small v-else-if="mobileError" class="text-red-500">{{ mobileError }}</small>
          </div>

          <!-- Email -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Email <span class="text-red-500">*</span></label>
            <div class="relative">
              <InputText
                v-model="form.email"
                type="email"
                placeholder="email@example.com"
                :invalid="!!fieldErrors.email"
                class="w-full"
                @blur="onEmailBlur"
                @input="clearFieldError('email')"
              />
              <i v-if="isCheckingEmail" class="pi pi-spin pi-spinner absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <small v-if="fieldErrors.email" class="text-red-500">{{ fieldErrors.email }}</small>
            <small v-else-if="emailWarning" class="text-amber-500">{{ emailWarning }}</small>
          </div>

          <!-- Line ID -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Line ID</label>
            <InputText v-model="form.lineId" placeholder="選填" />
          </div>

          <!-- Address -->
          <div class="flex flex-col gap-2 md:col-span-2">
            <label class="text-sm font-medium">地址</label>
            <Textarea v-model="form.address" rows="2" placeholder="選填" />
            <small v-if="fieldErrors.address" class="text-red-500">{{ fieldErrors.address }}</small>
          </div>
        </div>
      </div>

      <!-- C. Emergency Contact -->
      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 class="text-lg font-semibold mb-4">
          <i class="pi pi-exclamation-circle mr-2 text-primary" />
          緊急聯絡人
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">姓名 <span class="text-red-500">*</span></label>
            <InputText
              v-model="form.emergencyContactName"
              placeholder="緊急聯絡人姓名"
              :invalid="!!fieldErrors.emergencyContactName"
              @input="clearFieldError('emergencyContactName')"
            />
            <small v-if="fieldErrors.emergencyContactName" class="text-red-500">{{ fieldErrors.emergencyContactName }}</small>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">關係 <span class="text-red-500">*</span></label>
            <Select
              v-model="form.emergencyContactRelationship"
              :options="relationshipOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="請選擇"
              :invalid="!!fieldErrors.emergencyContactRelationship"
              @change="clearFieldError('emergencyContactRelationship')"
            />
            <small v-if="fieldErrors.emergencyContactRelationship" class="text-red-500">{{ fieldErrors.emergencyContactRelationship }}</small>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">電話 <span class="text-red-500">*</span></label>
            <InputText
              v-model="form.emergencyContactPhone"
              placeholder="0912345678"
              :invalid="!!fieldErrors.emergencyContactPhone"
              @input="clearFieldError('emergencyContactPhone')"
            />
            <small v-if="fieldErrors.emergencyContactPhone" class="text-red-500">{{ fieldErrors.emergencyContactPhone }}</small>
          </div>
        </div>
      </div>

      <!-- D. Faith & Church Info -->
      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 class="text-lg font-semibold mb-4">
          <i class="pi pi-heart mr-2 text-primary" />
          信仰與歸屬
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Baptism -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">受洗狀態</label>
            <div class="flex items-center gap-2 h-[42px]">
              <Checkbox v-model="form.baptismStatus" :binary="true" inputId="baptismStatus" />
              <label for="baptismStatus" class="text-sm cursor-pointer">已受洗</label>
            </div>
          </div>

          <div v-if="form.baptismStatus" class="flex flex-col gap-2">
            <label class="text-sm font-medium">受洗日期</label>
            <DatePicker
              v-model="baptismDateValue"
              dateFormat="yy-mm-dd"
              :maxDate="maxDate"
              showIcon
              placeholder="選擇日期（選填）"
            />
          </div>

          <!-- Zone -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">牧區</label>
            <Select
              v-model="form.zoneId"
              :options="zoneOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="請選擇牧區（選填）"
              showClear
              :loading="orgStore.isLoadingStructure"
              @change="onZoneChange"
            />
          </div>

          <!-- Group -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">小組</label>
            <Select
              v-model="form.groupId"
              :options="groupOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="請先選擇牧區"
              showClear
              :disabled="!form.zoneId"
              :invalid="!!fieldErrors.groupId"
            />
            <small v-if="fieldErrors.groupId" class="text-red-500">{{ fieldErrors.groupId }}</small>
          </div>

          <!-- Role -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">角色</label>
            <Select
              v-model="form.roleId"
              :options="roleOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="請選擇角色（選填）"
              showClear
              :loading="orgStore.isLoadingRoles"
            />
          </div>

          <!-- Past Courses -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">已上過的課程</label>
            <MultiSelect
              v-model="form.pastCourses"
              :options="courseOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="請選擇（選填）"
              :maxSelectedLabels="3"
              :loading="orgStore.isLoadingCourses"
            />
          </div>
        </div>
      </div>

      <!-- E. System Settings -->
      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 class="text-lg font-semibold mb-4">
          <i class="pi pi-cog mr-2 text-primary" />
          系統設定
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">會籍狀態 <span class="text-red-500">*</span></label>
            <Select
              v-model="form.status"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
            />
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3 justify-end">
        <Button label="取消" severity="secondary" outlined @click="router.back()" />
        <Button
          label="儲存變更"
          icon="pi pi-check"
          type="submit"
          :loading="isSubmitting || isUploading"
        />
      </div>
    </form>
  </div>
</template>
