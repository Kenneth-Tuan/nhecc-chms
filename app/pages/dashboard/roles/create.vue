<script setup lang="ts">
/**
 * Create Role Page (ST002)
 */
import type { PermissionKey, SensitiveField, DataScope } from '~/types/role';
import {
  PERMISSION_GROUPS,
  ALL_SENSITIVE_FIELDS,
  SENSITIVE_FIELD_LABELS,
  createEmptyPermissions,
  createEmptyRevealAuthority,
} from '~/utils/rbac/permissions';

definePageMeta({
  layout: 'dashboard',
});

const router = useRouter();
const toast = useToast();
const isSubmitting = ref(false);

const formData = ref({
  name: '',
  description: '',
  scope: 'Self' as DataScope,
  permissions: createEmptyPermissions(),
  revealAuthority: createEmptyRevealAuthority(),
});

const scopeOptions = [
  { label: '全域（Global）', value: 'Global', description: '可存取全教會資料' },
  { label: '牧區（Zone）', value: 'Zone', description: '僅限所屬牧區' },
  { label: '小組（Group）', value: 'Group', description: '僅限所屬小組' },
  { label: '個人（Self）', value: 'Self', description: '僅限本人資料' },
];

function togglePermission(key: PermissionKey): void {
  formData.value.permissions[key] = !formData.value.permissions[key];
}

function toggleReveal(field: SensitiveField): void {
  formData.value.revealAuthority[field] = !formData.value.revealAuthority[field];
}

async function submitForm(): Promise<void> {
  if (!formData.value.name.trim()) {
    toast.add({ severity: 'warn', summary: '提示', detail: '請填寫角色名稱', life: 3000 });
    return;
  }

  isSubmitting.value = true;
  try {
    await $fetch('/api/roles', {
      method: 'POST',
      body: formData.value,
    });
    toast.add({ severity: 'success', summary: '成功', detail: '角色建立成功', life: 3000 });
    router.push('/dashboard/roles');
  } catch (err: unknown) {
    const message = (err as { data?: { message?: string } })?.data?.message || '建立失敗';
    toast.add({ severity: 'error', summary: '錯誤', detail: message, life: 3000 });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="max-w-4xl">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <Button icon="pi pi-arrow-left" text rounded @click="router.back()" />
      <div>
        <h1 class="text-2xl font-bold">新增角色</h1>
        <p class="text-sm text-slate-500 mt-1">設定角色的權限與資料範圍</p>
      </div>
    </div>

    <div class="space-y-6">
      <!-- Basic Info -->
      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 class="text-lg font-semibold mb-4">基本資訊</h2>
        <div class="grid grid-cols-1 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">角色名稱 *</label>
            <InputText v-model="formData.name" placeholder="例如：財務人員" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">描述</label>
            <Textarea v-model="formData.description" rows="2" placeholder="角色描述..." />
          </div>
        </div>
      </div>

      <!-- Y-axis: Data Scope -->
      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 class="text-lg font-semibold mb-4">
          <i class="pi pi-database mr-2 text-primary" />
          資料範圍（Y 軸）
        </h2>
        <p class="text-sm text-slate-500 mb-4">決定此角色可以存取的資料範圍</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="option in scopeOptions"
            :key="option.value"
            :class="[
              'border rounded-lg p-4 cursor-pointer transition-all',
              formData.scope === option.value
                ? 'border-primary bg-primary-50 dark:bg-primary-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
            ]"
            @click="formData.scope = option.value as DataScope"
          >
            <div class="flex items-center gap-2 mb-1">
              <RadioButton
                :modelValue="formData.scope"
                :value="option.value"
                @update:modelValue="formData.scope = $event as DataScope"
              />
              <span class="font-semibold text-sm">{{ option.label }}</span>
            </div>
            <p class="text-xs text-slate-500 ml-7">{{ option.description }}</p>
          </div>
        </div>
      </div>

      <!-- X-axis: Function Permissions -->
      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 class="text-lg font-semibold mb-4">
          <i class="pi pi-lock mr-2 text-primary" />
          功能權限（X 軸）
        </h2>
        <p class="text-sm text-slate-500 mb-4">選擇此角色可以執行的操作</p>
        <div class="space-y-5">
          <div v-for="group in PERMISSION_GROUPS" :key="group.label">
            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <i :class="group.icon" />
              {{ group.label }}
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 ml-6">
              <div
                v-for="perm in group.permissions"
                :key="perm.key"
                class="flex items-center gap-2"
              >
                <Checkbox
                  :modelValue="formData.permissions[perm.key]"
                  :binary="true"
                  @update:modelValue="togglePermission(perm.key)"
                />
                <label class="text-sm cursor-pointer" @click="togglePermission(perm.key)">
                  {{ perm.label }}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Z-axis: Reveal Authority -->
      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 class="text-lg font-semibold mb-4">
          <i class="pi pi-eye mr-2 text-primary" />
          敏感資料解鎖權限（Z 軸）
        </h2>
        <p class="text-sm text-slate-500 mb-4">決定此角色是否能查看會友的敏感資訊</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-2">
          <div
            v-for="field in ALL_SENSITIVE_FIELDS"
            :key="field"
            class="flex items-center gap-2"
          >
            <Checkbox
              :modelValue="formData.revealAuthority[field]"
              :binary="true"
              @update:modelValue="toggleReveal(field)"
            />
            <label class="text-sm cursor-pointer" @click="toggleReveal(field)">
              {{ SENSITIVE_FIELD_LABELS[field] }}
            </label>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3 justify-end">
        <Button label="取消" severity="secondary" outlined @click="router.back()" />
        <Button label="建立角色" icon="pi pi-check" :loading="isSubmitting" @click="submitForm" />
      </div>
    </div>
  </div>
</template>
