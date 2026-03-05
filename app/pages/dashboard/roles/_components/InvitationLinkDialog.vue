<script setup lang="ts">
/**
 * 邀請連結 Dialog
 * 用於角色管理頁面，產生一次性邀請連結（僅綁定角色）。
 */
import type { Invitation } from "~/types/invitation";

const props = defineProps<{
  visible: boolean;
  roleId: string;
  roleName: string;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

const toast = useToast();

const isCreating = ref(false);
const generatedLink = ref("");
const generatedInvitation = ref<Invitation | null>(null);
const copied = ref(false);

const dialogVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit("update:visible", val),
});

function resetForm(): void {
  generatedLink.value = "";
  generatedInvitation.value = null;
  copied.value = false;
  isCreating.value = false;
}

function onShow(): void {
  resetForm();
  generateLink();
}

async function generateLink(): Promise<void> {
  isCreating.value = true;
  try {
    const res = await $fetch<{ success: boolean; data: Invitation }>(
      "/api/invitations",
      {
        method: "POST",
        body: { roleIds: [props.roleId] },
      },
    );

    generatedInvitation.value = res.data;
    const baseUrl = window.location.origin;
    generatedLink.value = `${baseUrl}/register/invite?token=${res.data.token}`;
  } catch (err: any) {
    toast.add({
      severity: "error",
      summary: "產生失敗",
      detail: err?.data?.message || "無法產生邀請連結",
      life: 4000,
    });
    dialogVisible.value = false;
  } finally {
    isCreating.value = false;
  }
}

async function copyLink(): Promise<void> {
  try {
    await navigator.clipboard.writeText(generatedLink.value);
    copied.value = true;
    toast.add({
      severity: "success",
      summary: "已複製",
      detail: "邀請連結已複製到剪貼簿",
      life: 2000,
    });
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    toast.add({
      severity: "error",
      summary: "複製失敗",
      detail: "請手動選取並複製",
      life: 3000,
    });
  }
}

async function resendLink(): Promise<void> {
  if (!generatedInvitation.value) return;

  isCreating.value = true;
  try {
    const res = await $fetch<{ success: boolean; data: Invitation }>(
      `/api/invitations/${generatedInvitation.value.token}/resend`,
      { method: "POST" },
    );

    generatedInvitation.value = res.data;
    const baseUrl = window.location.origin;
    generatedLink.value = `${baseUrl}/register/invite?token=${res.data.token}`;

    toast.add({
      severity: "success",
      summary: "已重新產生",
      detail: "新的邀請連結已產生，有效期重新計算 24 小時",
      life: 3000,
    });
  } catch (err: any) {
    toast.add({
      severity: "error",
      summary: "失敗",
      detail: err?.data?.message || "無法重新產生邀請連結",
      life: 4000,
    });
  } finally {
    isCreating.value = false;
  }
}
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    :header="`邀請連結 — ${roleName}`"
    :style="{ width: '480px' }"
    modal
    :closable="true"
    @show="onShow"
  >
    <!-- Loading -->
    <div v-if="isCreating && !generatedLink" class="flex justify-center py-8">
      <ProgressSpinner />
    </div>

    <!-- 生成結果 -->
    <div v-else-if="generatedLink" class="space-y-4">
      <div
        class="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
      >
        <i class="pi pi-check-circle text-green-500 text-lg" />
        <span class="text-sm font-medium text-green-700 dark:text-green-300">
          邀請連結已產生！
        </span>
      </div>

      <p class="text-sm text-slate-500">
        分享此連結給受邀者，對方使用此連結註冊後將自動綁定「<strong>{{
          roleName
        }}</strong
        >」角色。
      </p>

      <div class="space-y-2">
        <label class="text-sm font-medium text-slate-600 dark:text-slate-400">
          邀請連結
        </label>
        <div class="flex gap-2">
          <InputText
            :modelValue="generatedLink"
            readonly
            class="flex-1 !text-xs !font-mono"
          />
          <Button
            :icon="copied ? 'pi pi-check' : 'pi pi-copy'"
            :severity="copied ? 'success' : 'primary'"
            @click="copyLink"
            v-tooltip.top="'複製連結'"
          />
        </div>
      </div>

      <div
        class="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
      >
        <i class="pi pi-clock text-amber-500 text-sm" />
        <span class="text-xs text-amber-700 dark:text-amber-300">
          此連結有效期為 24 小時，僅限使用一次。
        </span>
      </div>

      <div class="flex justify-between pt-2">
        <Button
          label="重新產生"
          icon="pi pi-refresh"
          severity="secondary"
          text
          size="small"
          :loading="isCreating"
          @click="resendLink"
        />
        <Button label="完成" @click="dialogVisible = false" />
      </div>
    </div>
  </Dialog>
</template>
