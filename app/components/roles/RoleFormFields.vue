<script setup lang="ts">
import type { PermissionKey, SensitiveField, DataScope } from "~/types/role";
import {
  PERMISSION_GROUPS,
  ALL_SENSITIVE_FIELDS,
  SENSITIVE_FIELD_LABELS,
  SCOPE_OPTIONS,
} from "~/utils/rbac/permissions";

type RoleFormData = {
  name: string;
  description: string;
  scope: DataScope;
  permissions: Record<PermissionKey, boolean>;
  revealAuthority: Record<SensitiveField, boolean>;
};

const formData = defineModel<RoleFormData>({ required: true });
const { isSuperAdmin = false } = defineProps<{ isSuperAdmin?: boolean }>();

function togglePermission(key: PermissionKey): void {
  if (isSuperAdmin) return;
  formData.value.permissions[key] = !formData.value.permissions[key];
}

function toggleReveal(field: SensitiveField): void {
  if (isSuperAdmin) return;
  formData.value.revealAuthority[field] =
    !formData.value.revealAuthority[field];
}

function setScope(value: DataScope): void {
  if (isSuperAdmin) return;
  formData.value.scope = value;
}
</script>

<template>
  <!-- Basic Info -->
  <div
    class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6"
  >
    <h2 class="text-lg font-semibold mb-4">基本資訊</h2>
    <div class="grid grid-cols-1 gap-4">
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium">角色名稱 *</label>
        <InputText v-model="formData.name" placeholder="例如：財務人員" />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium">描述</label>
        <Textarea
          v-model="formData.description"
          rows="2"
          placeholder="角色描述..."
        />
      </div>
    </div>
  </div>

  <!-- Y-axis: Data Scope -->
  <div
    class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6"
  >
    <h2 class="text-lg font-semibold mb-4">
      <i class="pi pi-database mr-2 text-primary" />
      資料範圍
    </h2>
    <p class="text-sm text-slate-500 mb-4">決定此角色可以存取的資料範圍</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div
        v-for="option in SCOPE_OPTIONS"
        :key="option.value"
        :class="[
          'border rounded-lg p-4 transition-all',
          isSuperAdmin ? 'opacity-60' : 'cursor-pointer',
          formData.scope === option.value
            ? 'border-primary bg-primary-50 dark:bg-primary-900/20'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
        ]"
        @click="setScope(option.value as DataScope)"
      >
        <div class="flex items-center gap-2 mb-1">
          <RadioButton
            :modelValue="formData.scope"
            :value="option.value"
            :disabled="isSuperAdmin"
            @update:modelValue="setScope($event as DataScope)"
          />
          <span class="font-semibold text-sm">{{ option.label }}</span>
        </div>
        <p class="text-xs text-slate-500 ml-7">{{ option.description }}</p>
      </div>
    </div>
  </div>

  <!-- X-axis: Function Permissions -->
  <div
    class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6"
  >
    <h2 class="text-lg font-semibold mb-4">
      <i class="pi pi-lock mr-2 text-primary" />
      功能權限
    </h2>
    <p class="text-sm text-slate-500 mb-4">選擇此角色可以執行的操作</p>
    <div
      :class="['space-y-5', { 'opacity-60 pointer-events-none': isSuperAdmin }]"
    >
      <div v-for="group in PERMISSION_GROUPS" :key="group.label">
        <h3
          class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2"
        >
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
              :disabled="isSuperAdmin"
              @update:modelValue="togglePermission(perm.key)"
            />
            <label
              class="text-sm cursor-pointer"
              @click="togglePermission(perm.key)"
            >
              {{ perm.label }}
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Z-axis: Reveal Authority -->
  <div
    class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6"
  >
    <h2 class="text-lg font-semibold mb-4">
      <i class="pi pi-eye mr-2 text-primary" />
      敏感資料解鎖權限
    </h2>
    <p class="text-sm text-slate-500 mb-4">
      決定此角色是否能查看會友的敏感資訊
    </p>
    <div
      :class="[
        'grid grid-cols-1 sm:grid-cols-2 gap-3 ml-2',
        { 'opacity-60 pointer-events-none': isSuperAdmin },
      ]"
    >
      <div
        v-for="field in ALL_SENSITIVE_FIELDS"
        :key="field"
        class="flex items-center gap-2"
      >
        <Checkbox
          :modelValue="formData.revealAuthority[field]"
          :binary="true"
          :disabled="isSuperAdmin"
          @update:modelValue="toggleReveal(field)"
        />
        <label class="text-sm cursor-pointer" @click="toggleReveal(field)">
          {{ SENSITIVE_FIELD_LABELS[field] }}
        </label>
      </div>
    </div>
  </div>
</template>
