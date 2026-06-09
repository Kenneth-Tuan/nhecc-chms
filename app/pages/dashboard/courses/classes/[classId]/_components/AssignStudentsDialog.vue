<script setup lang="ts">
import { useToast } from "primevue/usetoast";

const visible = defineModel<boolean>("visible", { required: true });

const props = defineProps<{
  classId: string;
}>();

const emit = defineEmits<{
  (e: "assigned"): void;
}>();

const { fetchAssignableMembers, adminAssignStudents } = useCourseEnrollment();
const toast = useToast();

const assignableMembers = ref<{ userId: string; fullName: string; mobile: string; prerequisiteError?: string }[]>([]);
const selectedMembers = ref<{ userId: string; fullName: string; mobile: string; prerequisiteError?: string }[]>([]);
const isLoading = ref(false);
const isSubmitting = ref(false);
const searchQuery = ref("");

// 當 Dialog 顯示時載入資料
async function loadAssignableMembers() {
  if (!props.classId) return;
  isLoading.value = true;
  selectedMembers.value = [];
  searchQuery.value = "";
  try {
    const data = await fetchAssignableMembers(props.classId);
    assignableMembers.value = data || [];
  } catch (error: any) {
    toast.add({
      severity: "error",
      summary: "載入失敗",
      detail: error.message || "無法取得可指派的會員名單",
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
}

async function handleConfirm() {
  if (selectedMembers.value.length === 0) return;
  isSubmitting.value = true;
  try {
    const userIds = selectedMembers.value.map((m) => m.userId);
    await adminAssignStudents(props.classId, userIds);
    toast.add({
      severity: "success",
      summary: "指派成功",
      detail: `已成功指派 ${userIds.length} 位學生`,
      life: 3000,
    });
    emit("assigned");
    visible.value = false;
  } catch (error: any) {
    toast.add({
      severity: "error",
      summary: "指派失敗",
      detail: error.message || "指派學生時發生錯誤",
      life: 3000,
    });
  } finally {
    isSubmitting.value = false;
  }
}

function handleClose() {
  visible.value = false;
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="指派學生到班級"
    :style="{ width: '600px', maxWidth: '95vw' }"
    @show="loadAssignableMembers"
  >
    <div class="flex flex-col gap-4 text-base">
      <!-- Search Input -->
      <div class="flex flex-col gap-2">
        <span class="relative flex items-center">
          <i class="pi pi-search absolute left-3 text-slate-400"></i>
          <InputText
            v-model="searchQuery"
            placeholder="搜尋姓名..."
            class="pl-10 w-full text-base"
          />
        </span>
      </div>

      <!-- Members DataTable -->
      <DataTable
        v-model:selection="selectedMembers"
        :value="assignableMembers"
        selectionMode="multiple"
        dataKey="userId"
        :paginator="true"
        :rows="5"
        :loading="isLoading"
        :globalFilterFields="['fullName']"
        :globalFilter="searchQuery"
        stripedRows
        class="text-base"
      >
        <template #empty>
          <div class="text-center py-8 text-slate-500 text-base">
            {{ isLoading ? "載入中..." : "目前沒有可指派的會員。" }}
          </div>
        </template>
        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
        <Column field="fullName" header="姓名" class="whitespace-nowrap"></Column>
        <Column field="mobile" header="聯絡電話" class="whitespace-nowrap"></Column>
        <Column header="先修條件狀態" class="whitespace-nowrap">
          <template #body="{ data }">
            <Tag v-if="data.prerequisiteError" severity="warn" :value="data.prerequisiteError" />
            <Tag v-else severity="success" value="符合" />
          </template>
        </Column>
      </DataTable>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2 text-base">
        <Button label="取消" outlined severity="secondary" @click="handleClose" />
        <Button
          :label="isSubmitting ? '指派中...' : '確認指派'"
          icon="pi pi-check"
          :loading="isSubmitting"
          :disabled="selectedMembers.length === 0 || isSubmitting"
          @click="handleConfirm"
        />
      </div>
    </template>
  </Dialog>
</template>
