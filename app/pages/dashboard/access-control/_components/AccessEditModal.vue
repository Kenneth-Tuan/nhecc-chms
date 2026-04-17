<script setup lang="ts">
/**
 * 授權編輯 Modal
 * 雙 scope (admin / functions) 視圖 + Zone/Group 選擇器
 */
import type { DataAccess, DataAccessPatchPayload } from "~/types/data-access";
import { createEmptyDataAccess } from "~/types/data-access";

const props = defineProps<{
  visible: boolean;
  userId: string;
  userName: string;
  roleNames?: string[];
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const toast = useToast();
const {
  zones,
  allGroups,
  isLoading: isOrgLoading,
  fetchOrganizationStructure,
} = useZoneGroupCascade();

const isLoading = ref(false);
const isSaving = ref(false);
const activeTab = ref(0);
const accessData = ref<DataAccess | null>(null);

const adminZones = computed(() => accessData.value?.admin.zone ?? []);
const adminGroups = computed(() => accessData.value?.admin.group ?? []);
const functionsTargets = computed(
  () => accessData.value?.functions.targets ?? {}
);

async function loadData(): Promise<void> {
  isLoading.value = true;
  try {
    await fetchOrganizationStructure();
    const res = await $fetch<{ data: DataAccess }>(
      `/api/data-access/${props.userId}`
    );
    accessData.value = {
      ...createEmptyDataAccess(),
      updatedAt: "",
      updatedBy: "",
      ...res.data,
    } as DataAccess;
  } catch {
    toast.add({
      severity: "error",
      summary: "錯誤",
      detail: "載入授權資料失敗",
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
}

async function patchAccess(payload: DataAccessPatchPayload): Promise<void> {
  isSaving.value = true;
  try {
    await $fetch(`/api/data-access/${props.userId}`, {
      method: "PATCH",
      body: payload,
    });
    await loadData();
  } catch {
    toast.add({
      severity: "error",
      summary: "錯誤",
      detail: "更新失敗",
      life: 3000,
    });
  } finally {
    isSaving.value = false;
  }
}

async function toggleAdminGlobal(val: boolean): Promise<void> {
  await patchAccess({ action: "setGlobal", scope: "admin", isGlobal: val });
}

async function toggleFunctionsGlobal(val: boolean): Promise<void> {
  await patchAccess({ action: "setGlobal", scope: "functions", isGlobal: val });
}

async function addAdminZone(zoneId: string): Promise<void> {
  await patchAccess({
    action: "grant",
    scope: "admin",
    field: "zone",
    id: zoneId,
  });
}

async function removeAdminZone(zoneId: string): Promise<void> {
  await patchAccess({
    action: "revoke",
    scope: "admin",
    field: "zone",
    id: zoneId,
  });
}

async function addAdminGroup(groupId: string): Promise<void> {
  await patchAccess({
    action: "grant",
    scope: "admin",
    field: "group",
    id: groupId,
  });
}

async function removeAdminGroup(groupId: string): Promise<void> {
  await patchAccess({
    action: "revoke",
    scope: "admin",
    field: "group",
    id: groupId,
  });
}

const selectedAdminZone = ref<string | null>(null);
const selectedAdminGroup = ref<string | null>(null);

function getZoneName(id: string): string {
  return zones.value.find((z) => z.id === id)?.name ?? id;
}

function getGroupName(id: string): string {
  return allGroups.value.find((g) => g.id === id)?.name ?? id;
}

function resolveTargetName(targetType: string, id: string): string {
  if (targetType === "zone") return getZoneName(id);
  if (targetType === "group") return getGroupName(id);
  return id;
}

function onShow(): void {
  activeTab.value = 0;
  loadData();
}
</script>

<template>
  <Dialog
    :visible="visible"
    :modal="true"
    :style="{ width: '700px', maxWidth: '95vw' }"
    :closable="true"
    @update:visible="!$event && $emit('close')"
    @show="onShow"
  >
    <template #header>
      <div class="flex items-center gap-3 flex-wrap">
        <div class="flex items-center gap-2">
          <i class="pi pi-shield text-primary" />
          <span class="font-semibold">授權管理 — {{ userName }}</span>
        </div>
        <div v-if="roleNames?.length" class="flex flex-wrap gap-1">
          <Tag
            v-for="r in roleNames"
            :key="r"
            :value="r"
            severity="secondary"
            class="!text-[10px]"
          />
        </div>
      </div>
    </template>

    <div v-if="isLoading || isOrgLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <div v-else-if="accessData" class="min-h-[300px]">
      <Tabs v-model:value="activeTab">
        <TabList>
          <Tab :value="0">行政 (Admin)</Tab>
          <Tab :value="1">功能 (Functions)</Tab>
        </TabList>
        <TabPanels>
          <!-- Admin Scope Tab -->
          <TabPanel :value="0">
            <div class="space-y-6 p-4">
              <div class="flex items-center gap-3">
                <ToggleSwitch
                  :modelValue="accessData.admin.isGlobal"
                  :disabled="isSaving"
                  @update:modelValue="toggleAdminGlobal"
                />
                <span class="font-semibold">全域行政權</span>
              </div>

              <Message
                v-if="accessData.admin.isGlobal"
                severity="warn"
                :closable="false"
                class="!text-xs"
              >
                全域模式已啟用，以下清單不影響實際權限範圍（僅作記錄）
              </Message>

              <!-- Zone list -->
              <div>
                <h4
                  class="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2"
                >
                  可管理的牧區
                </h4>
                <div class="flex flex-wrap gap-2 mb-3">
                  <Tag
                    v-for="zId in adminZones"
                    :key="zId"
                    :value="getZoneName(zId)"
                    severity="info"
                    class="!text-xs"
                  >
                    <template #default>
                      <span>{{ getZoneName(zId) }}</span>
                      <button
                        v-if="!accessData.admin.isGlobal"
                        class="ml-2 hover:text-red-500"
                        :disabled="isSaving"
                        @click="removeAdminZone(zId)"
                      >
                        <i class="pi pi-times text-[10px]" />
                      </button>
                    </template>
                  </Tag>
                  <span
                    v-if="adminZones.length === 0"
                    class="text-xs text-slate-400"
                    >尚未指定</span
                  >
                </div>
                <div v-if="!accessData.admin.isGlobal" class="flex items-center gap-2">
                  <Select
                    v-model="selectedAdminZone"
                    :options="zones.filter((z) => !adminZones.includes(z.id))"
                    optionLabel="name"
                    optionValue="id"
                    placeholder="新增牧區..."
                    class="w-48"
                    size="small"
                  />
                  <Button
                    icon="pi pi-plus"
                    size="small"
                    :disabled="!selectedAdminZone || isSaving"
                    @click="
                      selectedAdminZone &&
                        addAdminZone(selectedAdminZone).then(
                          () => (selectedAdminZone = null)
                        )
                    "
                  />
                </div>
              </div>

              <Divider />

              <!-- Group list -->
              <div>
                <h4
                  class="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2"
                >
                  可管理的小組
                </h4>
                <div class="flex flex-wrap gap-2 mb-3">
                  <Tag
                    v-for="gId in adminGroups"
                    :key="gId"
                    :value="getGroupName(gId)"
                    severity="warn"
                    class="!text-xs"
                  >
                    <template #default>
                      <span>{{ getGroupName(gId) }}</span>
                      <button
                        v-if="!accessData.admin.isGlobal"
                        class="ml-2 hover:text-red-500"
                        :disabled="isSaving"
                        @click="removeAdminGroup(gId)"
                      >
                        <i class="pi pi-times text-[10px]" />
                      </button>
                    </template>
                  </Tag>
                  <span
                    v-if="adminGroups.length === 0"
                    class="text-xs text-slate-400"
                    >尚未指定</span
                  >
                </div>
                <div v-if="!accessData.admin.isGlobal" class="flex items-center gap-2">
                  <Select
                    v-model="selectedAdminGroup"
                    :options="
                      allGroups.filter((g) => !adminGroups.includes(g.id))
                    "
                    optionLabel="name"
                    optionValue="id"
                    placeholder="新增小組..."
                    class="w-48"
                    size="small"
                  />
                  <Button
                    icon="pi pi-plus"
                    size="small"
                    :disabled="!selectedAdminGroup || isSaving"
                    @click="
                      selectedAdminGroup &&
                        addAdminGroup(selectedAdminGroup).then(
                          () => (selectedAdminGroup = null)
                        )
                    "
                  />
                </div>
              </div>
            </div>
          </TabPanel>

          <!-- Functions Scope Tab -->
          <TabPanel :value="1">
            <div class="space-y-6 p-4">
              <div class="flex items-center gap-3">
                <ToggleSwitch
                  :modelValue="accessData.functions.isGlobal"
                  :disabled="isSaving"
                  @update:modelValue="toggleFunctionsGlobal"
                />
                <span class="font-semibold">全域功能權</span>
              </div>

              <Message
                v-if="accessData.functions.isGlobal"
                severity="warn"
                :closable="false"
                class="!text-xs"
              >
                全域模式已啟用，以下清單不影響實際權限範圍（僅作記錄）
              </Message>

              <div
                v-for="(ids, targetType) in functionsTargets"
                :key="targetType"
              >
                <h4
                  class="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 capitalize"
                >
                  {{ targetType }}
                </h4>
                <div class="flex flex-wrap gap-2">
                  <Tag
                    v-for="id in ids"
                    :key="id"
                    :value="resolveTargetName(targetType as string, id)"
                    severity="success"
                    class="!text-xs"
                  >
                    <template #default>
                      <span>{{ resolveTargetName(targetType as string, id) }}</span>
                      <button
                        v-if="!accessData.functions.isGlobal"
                        class="ml-2 hover:text-red-500"
                        :disabled="isSaving"
                        @click="
                          patchAccess({
                            action: 'revoke',
                            scope: 'functions',
                            targetType: targetType as string,
                            id,
                          })
                        "
                      >
                        <i class="pi pi-times text-[10px]" />
                      </button>
                    </template>
                  </Tag>
                </div>
              </div>
              <p
                v-if="Object.keys(functionsTargets).length === 0"
                class="text-sm text-slate-400"
              >
                尚無功能授權。可透過 API 或 migration script 新增。
              </p>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>

    <template #footer>
      <Button
        label="關閉"
        severity="secondary"
        outlined
        @click="$emit('close')"
      />
    </template>
  </Dialog>
</template>
