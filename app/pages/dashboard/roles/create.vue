<script setup lang="ts">
/**
 * Create Role Page (ST002)
 */
import type { DataScope } from '~/types/role';
import { createEmptyPermissions, createEmptyRevealAuthority } from '~/utils/rbac/permissions';

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
      <RolesRoleFormFields v-model="formData" />

      <!-- Actions -->
      <div class="flex items-center gap-3 justify-end">
        <Button label="取消" severity="secondary" outlined @click="router.back()" />
        <Button label="建立角色" icon="pi pi-check" :loading="isSubmitting" @click="submitForm" />
      </div>
    </div>
  </div>
</template>
