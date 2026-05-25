<script setup lang="ts">
import { ref, computed } from "vue";
import type { ZoneWithGroups } from "~/types/organization";

// 使用 defineModel 來進行雙向綁定
const visible = defineModel<boolean>("visible", { required: true });

const props = defineProps<{
  assignTarget: { uuid: string; fullName: string } | null;
  zones: ZoneWithGroups[];
  isAssigning: boolean;
}>();

const emit = defineEmits<{
  (e: "confirm", targetId: string, groupId: string): void;
}>();

const assignSelectedZone = ref<string | null>(null);
const assignSelectedGroup = ref<string | null>(null);

// 轉化 availableZones 格式
const availableZones = computed(() =>
  props.zones.map((z) => ({
    label: z.name,
    value: z.id,
  }))
);

// 根據所選牧區轉化 availableGroups 格式
const availableGroups = computed(() => {
  if (!assignSelectedZone.value) return [];
  const zone = props.zones.find((z) => z.id === assignSelectedZone.value);
  if (!zone?.groups) return [];
  return zone.groups.map((g) => ({
    label: g.name,
    value: g.id,
  }));
});

// 當 dialog 關閉時重置選擇狀態
function onHide() {
  assignSelectedZone.value = null;
  assignSelectedGroup.value = null;
}

function confirmAssign() {
  if (!props.assignTarget || !assignSelectedGroup.value) return;
  emit("confirm", props.assignTarget.uuid, assignSelectedGroup.value);
}

function handleClose() {
  visible.value = false;
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :modal="true"
    :closable="true"
    :style="{ width: '450px', maxWidth: '95vw' }"
    header="分配會友"
    @hide="onHide"
  >
    <div v-if="assignTarget" class="space-y-4">
      <!-- Member Info -->
      <div
        class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-surface-800 rounded-lg"
      >
        <Avatar
          :label="assignTarget.fullName?.charAt(0)"
          shape="circle"
          size="large"
          class="!bg-primary/10 !text-primary"
        />
        <div>
          <p class="font-bold text-slate-800 dark:text-surface-100">
            {{ assignTarget.fullName }}
          </p>
          <p class="text-xs text-slate-400">待分配</p>
        </div>
      </div>

      <!-- Zone Select -->
      <div>
        <label
          class="block text-sm font-medium text-slate-700 dark:text-surface-200 mb-1"
        >
          牧區 <span class="text-red-500">*</span>
        </label>
        <Select
          v-model="assignSelectedZone"
          :options="availableZones"
          optionLabel="label"
          optionValue="value"
          placeholder="請選擇牧區"
          class="w-full"
          @change="assignSelectedGroup = null"
        />
      </div>

      <!-- Group Select -->
      <div>
        <label
          class="block text-sm font-medium text-slate-700 dark:text-surface-200 mb-1"
        >
          小組 <span class="text-red-500">*</span>
        </label>
        <Select
          v-model="assignSelectedGroup"
          :options="availableGroups"
          optionLabel="label"
          optionValue="value"
          placeholder="請先選擇牧區"
          class="w-full"
          :disabled="!assignSelectedZone"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="取消" outlined @click="handleClose" />
        <Button
          label="確定分配"
          icon="pi pi-check"
          :loading="isAssigning"
          :disabled="!assignSelectedGroup"
          @click="confirmAssign"
        />
      </div>
    </template>
  </Dialog>
</template>
