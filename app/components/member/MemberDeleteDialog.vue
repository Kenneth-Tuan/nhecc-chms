<script setup lang="ts">
/**
 * Member Delete Confirmation Dialog (ST004)
 * Requires deletion reason before soft-deleting a member.
 */
import type { DeletionReason } from '~/types/member';

const props = defineProps<{
  visible: boolean;
  memberName: string;
  memberUuid: string;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  deleted: [];
}>();

const toast = useToast();

const deletionReason = ref<DeletionReason | ''>('');
const deletionNotes = ref('');
const isDeleting = ref(false);

const dialogVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val),
});

const deletionReasonOptions = [
  { label: '離開教會', value: 'left_church' },
  { label: '遷移至其他教會', value: 'transferred' },
  { label: '重複建檔', value: 'duplicate' },
  { label: '資料錯誤', value: 'data_error' },
  { label: '其他原因', value: 'other' },
];

async function handleDelete(): Promise<void> {
  if (!deletionReason.value) return;

  isDeleting.value = true;
  try {
    await $fetch(`/api/members/${props.memberUuid}`, {
      method: 'DELETE',
      body: {
        reason: deletionReason.value,
        notes: deletionNotes.value || undefined,
      },
    });

    toast.add({
      severity: 'success',
      summary: '刪除成功',
      detail: '會友資料已標記為停用',
      life: 3000,
    });

    dialogVisible.value = false;
    emit('deleted');
  } catch (err: unknown) {
    const message = (err as { data?: { message?: string } })?.data?.message || '刪除失敗';
    toast.add({
      severity: 'error',
      summary: '錯誤',
      detail: message,
      life: 5000,
    });
  } finally {
    isDeleting.value = false;
  }
}

function resetState(): void {
  deletionReason.value = '';
  deletionNotes.value = '';
}

watch(dialogVisible, (newVal) => {
  if (newVal) {
    resetState();
  }
});
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    header="確認刪除"
    :modal="true"
    :style="{ width: '500px' }"
  >
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <i class="pi pi-exclamation-triangle text-amber-500 text-3xl" />
        <p>
          確定要刪除會友「<strong>{{ memberName }}</strong>」嗎？
        </p>
      </div>

      <!-- Deletion Reason -->
      <div class="flex flex-col gap-2">
        <label for="deletionReason" class="text-sm font-medium">
          刪除原因 <span class="text-red-500">*</span>
        </label>
        <Select
          id="deletionReason"
          v-model="deletionReason"
          :options="deletionReasonOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="請選擇刪除原因"
          class="w-full"
        />
      </div>

      <!-- Additional Notes -->
      <div v-if="deletionReason === 'other'" class="flex flex-col gap-2">
        <label for="deletionNotes" class="text-sm font-medium">
          備註說明
        </label>
        <Textarea
          id="deletionNotes"
          v-model="deletionNotes"
          rows="3"
          placeholder="請說明刪除原因..."
          class="w-full"
        />
      </div>

      <Message severity="warn" :closable="false">
        此操作將會記錄於審計日誌中，會友資料將標記為停用但不會被實際刪除。
      </Message>
    </div>

    <template #footer>
      <Button
        label="取消"
        severity="secondary"
        outlined
        @click="dialogVisible = false"
      />
      <Button
        label="確認刪除"
        severity="danger"
        :disabled="!deletionReason"
        :loading="isDeleting"
        @click="handleDelete"
      />
    </template>
  </Dialog>
</template>
