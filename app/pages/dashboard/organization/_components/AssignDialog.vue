<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { TreeNode } from "primevue/treenode";

const props = defineProps<{
  visible: boolean;
  assignTarget: { uuid: string; fullName: string } | null;
  treeNodes: TreeNode[];
  isAssigning: boolean;
}>();

const emit = defineEmits<{
  (e: "update:visible", val: boolean): void;
  (e: "confirm", targetId: string, groupId: string): void;
}>();

const assignSelectedZone = ref<string | null>(null);
const assignSelectedGroup = ref<string | null>(null);

// Reset selections when dialog opens
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      assignSelectedZone.value = null;
      assignSelectedGroup.value = null;
    }
  },
);

const availableZones = computed(() =>
  props.treeNodes.map((z) => ({
    label: z.label,
    value: z.key as string,
  })),
);

const availableGroups = computed(() => {
  if (!assignSelectedZone.value) return [];
  const zone = props.treeNodes.find((z) => z.key === assignSelectedZone.value);
  if (!zone?.children) return [];
  return zone.children.map((g) => ({
    label: g.label,
    value: g.key as string,
  }));
});

function confirmAssign() {
  if (!props.assignTarget || !assignSelectedGroup.value) return;
  emit("confirm", props.assignTarget.uuid, assignSelectedGroup.value);
}

function handleClose() {
  emit("update:visible", false);
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :modal="true"
    :closable="true"
    :style="{ width: '450px', maxWidth: '95vw' }"
    header="分配會友"
  >
    <div v-if="assignTarget" class="space-y-4">
      <!-- Member Info -->
      <div
        class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
      >
        <Avatar
          :label="assignTarget.fullName?.charAt(0)"
          shape="circle"
          size="large"
          class="!bg-primary/10 !text-primary"
        />
        <div>
          <p class="font-bold text-slate-800 dark:text-slate-200">
            {{ assignTarget.fullName }}
          </p>
          <p class="text-xs text-slate-400">待分配</p>
        </div>
      </div>

      <!-- Zone Select -->
      <div>
        <label
          class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
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
          class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
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
