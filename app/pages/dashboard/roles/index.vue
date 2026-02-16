<script setup lang="ts">
/**
 * Role Management List Page (ST002)
 */
import type { Role } from "~/types/role";

definePageMeta({
  layout: "dashboard",
});

const auth = useAuth();
const router = useRouter();
const toast = useToast();

const roles = ref<Role[]>([]);
const isLoading = ref(false);
const totalItems = ref(0);

async function fetchRoles(): Promise<void> {
  isLoading.value = true;
  try {
    const response = await $fetch<{
      data: Role[];
      pagination: { totalItems: number };
    }>("/api/roles");
    roles.value = response.data;
    totalItems.value = response.pagination.totalItems;
  } catch {
    toast.add({
      severity: "error",
      summary: "錯誤",
      detail: "載入角色列表失敗",
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
}

async function deleteRole(role: Role): Promise<void> {
  if (role.isSystem) {
    toast.add({
      severity: "warn",
      summary: "無法刪除",
      detail: "系統角色不可刪除",
      life: 3000,
    });
    return;
  }

  try {
    await $fetch(`/api/roles/${role.id}`, { method: "DELETE" });
    toast.add({
      severity: "success",
      summary: "成功",
      detail: "角色已刪除",
      life: 3000,
    });
    await fetchRoles();
  } catch (err: unknown) {
    const message =
      (err as { data?: { message?: string } })?.data?.message || "刪除失敗";
    toast.add({
      severity: "error",
      summary: "錯誤",
      detail: message,
      life: 3000,
    });
  }
}

const scopeLabel: Record<string, string> = {
  Global: "全教會",
  Zone: "牧區",
  Group: "小組",
  Self: "個人",
};

const scopeSeverity: Record<string, string> = {
  Global: "danger",
  Zone: "warn",
  Group: "info",
  Self: "secondary",
};

onMounted(() => {
  fetchRoles();
});
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">角色管理</h1>
        <p class="text-sm text-slate-500 mt-1">管理系統角色與權限設定</p>
      </div>
      <Button
        v-if="auth.hasPermission('system:config')"
        label="新增角色"
        icon="pi pi-plus"
        @click="router.push('/dashboard/roles/create')"
      />
    </div>

    <!-- Table -->
    <div
      class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"
    >
      <DataTable
        :value="roles"
        :loading="isLoading"
        stripedRows
        class="!border-none"
      >
        <Column field="name" header="角色名稱" class="!font-semibold">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <span class="font-semibold">{{ data.name }}</span>
              <Tag
                v-if="data.isSystem"
                value="系統"
                severity="secondary"
                class="!text-xs"
              />
            </div>
          </template>
        </Column>

        <Column field="description" header="描述" class="!text-slate-500">
          <template #body="{ data }">
            <span class="text-sm text-slate-500 dark:text-slate-400">{{
              data.description
            }}</span>
          </template>
        </Column>

        <Column field="scope" header="資料範圍">
          <template #body="{ data }">
            <Tag
              :value="scopeLabel[data.scope] || data.scope"
              :severity="(scopeSeverity[data.scope] as any) || 'info'"
              class="!text-xs"
            />
          </template>
        </Column>

        <Column header="權限數量">
          <template #body="{ data }">
            <span class="text-sm">
              {{ Object.values(data.permissions).filter(Boolean).length }} 項
            </span>
          </template>
        </Column>

        <Column header="操作" :style="{ width: '120px' }">
          <template #body="{ data }">
            <div class="flex items-center gap-1">
              <Button
                icon="pi pi-pencil"
                text
                rounded
                size="small"
                @click="router.push(`/dashboard/roles/${data.id}/edit`)"
              />
              <Button
                v-if="!data.isSystem"
                icon="pi pi-trash"
                text
                rounded
                size="small"
                severity="danger"
                @click="deleteRole(data)"
              />
            </div>
          </template>
        </Column>

        <template #empty>
          <div class="text-center py-8 text-slate-400">
            <i class="pi pi-shield text-4xl mb-3" />
            <p>尚無角色資料</p>
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>
