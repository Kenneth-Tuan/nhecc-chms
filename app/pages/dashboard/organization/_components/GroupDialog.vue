<script setup lang="ts">
import { ref, watch } from "vue";

// TODO: 修改傳值方式
const props = defineProps<{
  visible: boolean;
  zoneId: string;
  initialData?: {
    id?: string;
    name: string;
    zoneId: string;
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
      zoneId: string;
      leaders?: { id: string; name: string }[];
    },
  ): void;
}>();

const groupForm = ref<{
  id?: string;
  name: string;
  zoneId: string;
  leaders?: { id: string; name: string }[];
}>({ name: "", zoneId: "", leaders: [] });

const filteredGroupLeaderCandidates = ref<{ id: string; name: string }[]>([]);

// Initialize form from props when visible/initialData changes
watch(
  () => props.initialData,
  (newVal) => {
    if (newVal) {
      groupForm.value = {
        ...newVal,
        leaders: newVal.leaders ? [...newVal.leaders] : [],
      };
    } else {
      groupForm.value = { name: "", zoneId: props.zoneId, leaders: [] };
    }
  },
  { immediate: true },
);

// If zoneId changes while creating new group
watch(
  () => props.zoneId,
  (newVal) => {
    if (!props.initialData?.id) {
      groupForm.value.zoneId = newVal;
    }
  },
);

function searchGroupLeaders(event: any) {
  const query = event.query.toLowerCase();
  filteredGroupLeaderCandidates.value = props.candidates.filter((c) =>
    c.name.toLowerCase().includes(query),
  );
}

function handleSave() {
  emit("save", groupForm.value);
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
    :header="groupForm.id ? '編輯小組' : '新增小組'"
  >
    <div class="space-y-4 pt-2">
      <div>
        <label
          class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          小組名稱 <span class="text-red-500">*</span>
        </label>
        <InputText
          v-model="groupForm.name"
          class="w-full"
          placeholder="例如：恩典小組"
        />
      </div>
      <div>
        <label
          class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          小組長
        </label>
        <AutoComplete
          v-model="groupForm.leaders"
          :suggestions="filteredGroupLeaderCandidates"
          @complete="searchGroupLeaders"
          optionLabel="name"
          multiple
          class="w-full"
          placeholder="請搜尋並選擇小組長"
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
          :disabled="!groupForm.name"
          @click="handleSave"
        />
      </div>
    </template>
  </Dialog>
</template>
