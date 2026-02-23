<script setup lang="ts">
/**
 * Edit Role Page (ST002)
 */
import type { Role, PermissionKey, SensitiveField, DataScope } from '~/types/role';

definePageMeta({
  layout: 'dashboard',
});

const route = useRoute();
const router = useRouter();
const toast = useToast();
const roleId = route.params.id as string;

const role = ref<Role | null>(null);
const isLoading = ref(true);
const isSubmitting = ref(false);

const formData = ref({
  name: '',
  description: '',
  scope: 'Self' as DataScope,
  permissions: {} as Record<PermissionKey, boolean>,
  revealAuthority: {} as Record<SensitiveField, boolean>,
});

const isSystemRole = computed(() => role.value?.isSystem === true);
const isSuperAdmin = computed(() => role.value?.id === 'super_admin');

async function fetchRole(): Promise<void> {
  isLoading.value = true;
  try {
    const data = await $fetch<Role>(`/api/roles/${roleId}`);
    role.value = data;
    formData.value = {
      name: data.name,
      description: data.description,
      scope: data.scope,
      permissions: { ...data.permissions },
      revealAuthority: { ...data.revealAuthority },
    };
  } catch {
    toast.add({ severity: 'error', summary: '錯誤', detail: '載入角色失敗', life: 3000 });
    router.push('/dashboard/roles');
  } finally {
    isLoading.value = false;
  }
}

async function submitForm(): Promise<void> {
  if (!formData.value.name.trim()) {
    toast.add({ severity: 'warn', summary: '提示', detail: '請填寫角色名稱', life: 3000 });
    return;
  }

  isSubmitting.value = true;
  try {
    await $fetch(`/api/roles/${roleId}`, {
      method: 'PATCH',
      body: formData.value,
    });
    toast.add({ severity: 'success', summary: '成功', detail: '角色更新成功', life: 3000 });
    router.push('/dashboard/roles');
  } catch (err: unknown) {
    const message = (err as { data?: { message?: string } })?.data?.message || '更新失敗';
    toast.add({ severity: 'error', summary: '錯誤', detail: message, life: 3000 });
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(() => {
  fetchRole();
});
</script>

<template>
  <div class="max-w-4xl">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <Button icon="pi pi-arrow-left" text rounded @click="router.back()" />
      <div>
        <h1 class="text-2xl font-bold">編輯角色</h1>
        <p class="text-sm text-slate-500 mt-1">
          {{ role?.name || '載入中...' }}
          <Tag v-if="isSystemRole" value="系統角色" severity="secondary" class="!text-xs ml-2" />
        </p>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <div v-else class="space-y-6">
      <Message v-if="isSuperAdmin" severity="warn" :closable="false">
        超級管理員角色的權限不可修改，僅能調整名稱和描述。
      </Message>

      <RolesRoleFormFields v-model="formData" :is-super-admin="isSuperAdmin" />

      <!-- Actions -->
      <div class="flex items-center gap-3 justify-end">
        <Button label="取消" severity="secondary" outlined @click="router.back()" />
        <Button label="更新角色" icon="pi pi-check" :loading="isSubmitting" @click="submitForm" />
      </div>
    </div>
  </div>
</template>
