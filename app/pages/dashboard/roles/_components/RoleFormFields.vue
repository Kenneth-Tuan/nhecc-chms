<script setup lang="ts">
import type { PermissionKey } from "~/types/role";
import { PERMISSION_GROUPS } from "~/utils/rbac/permissions";

type RoleFormData = {
  name: string;
  description: string;
  permissions: Record<PermissionKey, boolean>;
};

const formData = defineModel<RoleFormData>({ required: true });
const { isSuperAdmin = false } = defineProps<{ isSuperAdmin?: boolean }>();

function togglePermission(key: PermissionKey): void {
  if (isSuperAdmin) return;
  formData.value.permissions[key] = !formData.value.permissions[key];
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
</template>
