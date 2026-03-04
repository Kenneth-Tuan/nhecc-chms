<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  visible: boolean;
  initialData?: {
    id?: string;
    name: string;
    leaders?: { id: string; name: string }[];
  } | null;
  candidates: { id: string; name: string }[];
  isSaving: boolean;
}>();

const emit = defineEmits<{
  (e: "update:visible", val: boolean): void;
  (
    e: "save",
    data: {
      id?: string;
      name: string;
      leaders?: { id: string; name: string }[];
    },
  ): void;
}>();

const zoneForm = ref<{
  id?: string;
  name: string;
  leaders?: { id: string; name: string }[];
}>({ name: "", leaders: [] });

const filteredZoneLeaderCandidates = ref<{ id: string; name: string }[]>([]);

// Initialize form from props when visible changes (or initialData changes)
watch(
  () => props.initialData,
  (newVal) => {
    if (newVal) {
      zoneForm.value = {
        ...newVal,
        leaders: newVal.leaders ? [...newVal.leaders] : [],
      };
    } else {
      zoneForm.value = { name: "", leaders: [] };
    }
  },
  { immediate: true },
);

function searchZoneLeaders(event: any) {
  const query = event.query.toLowerCase();
  filteredZoneLeaderCandidates.value = props.candidates.filter((c) =>
    c.name.toLowerCase().includes(query),
  );
}

function handleSave() {
  emit("save", zoneForm.value);
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
    :style="{ width: '400px', maxWidth: '95vw' }"
    :header="zoneForm.id ? '編輯牧區' : '新增牧區'"
  >
    <div class="space-y-4 pt-2">
      <div>
        <label
          class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          牧區名稱 <span class="text-red-500">*</span>
        </label>
        <InputText
          v-model="zoneForm.name"
          class="w-full"
          placeholder="例如：學生牧區"
        />
      </div>
      <div>
        <label
          class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          牧區長
        </label>
        <AutoComplete
          v-model="zoneForm.leaders"
          :suggestions="filteredZoneLeaderCandidates"
          @complete="searchZoneLeaders"
          optionLabel="name"
          multiple
          class="w-full"
          placeholder="請搜尋並選擇牧區長"
          :pt="{ inputMultiple: { class: 'w-full' } }"
        />
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="取消" outlined @click="handleClose" />
        <Button
          label="儲存"
          icon="pi pi-check"
          :loading="isSaving"
          :disabled="!zoneForm.name"
          @click="handleSave"
        />
      </div>
    </template>
  </Dialog>
</template>
