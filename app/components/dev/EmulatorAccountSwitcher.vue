<script setup lang="ts">
/**
 * 僅在 Firebase Emulator 模式顯示：一鍵切換 seed 測試帳，免密碼交叉測試。
 */
import { useToast } from "primevue/usetoast";

interface EmulatorAccount {
  uid: string;
  fullName: string;
  email: string;
  roleLabels: string;
}

const runCfg = useRuntimeConfig();
const toast = useToast();
const { switchEmulatorTestUser, loading } = useFirebaseAuth();

const enabled = computed(() => runCfg.public.useEmulator === true);
const accounts = ref<EmulatorAccount[]>([]);
const selectedUid = ref<string | null>(null);
const expanded = ref(true);

const selectOptions = computed(() =>
  accounts.value.map((a) => ({
    label: `${a.fullName} · ${a.email}`,
    value: a.uid,
    title: a.roleLabels,
  }))
);

onMounted(async () => {
  if (!enabled.value) return;
  try {
    const list = await $fetch<EmulatorAccount[]>("/api/dev/emulator-accounts");
    accounts.value = list;
    if (list.length && !selectedUid.value) {
      selectedUid.value = list[0]!.uid;
    }
  } catch {
    accounts.value = [];
  }
});

async function onSwitch() {
  if (!selectedUid.value) return;
  try {
    await switchEmulatorTestUser(selectedUid.value);
    toast.add({
      severity: "success",
      summary: "已切換帳號",
      detail: accounts.value.find((a) => a.uid === selectedUid.value)?.fullName,
      life: 2500,
    });
  } catch (e: any) {
    toast.add({
      severity: "error",
      summary: "切換失敗",
      detail:
        e?.data?.message || e?.message || "請確認 Emulator 已啟動且已 seed",
      life: 5000,
    });
  }
}
</script>

<template>
  <div
    v-if="enabled"
    class="fixed top-4 left-4 z-21 max-w-[min(100vw-2rem,22rem)]"
  >
    <div
      class="rounded-lg border border-amber-400/80 bg-amber-50/95 p-3 text-xs text-amber-950 shadow-lg backdrop-blur-sm dark:border-amber-500/50 dark:bg-amber-950/90 dark:text-amber-50"
    >
      <Button
        type="button"
        variant="text"
        size="small"
        label="Emulator 切換角色"
        :icon="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-up'"
        icon-pos="right"
        class="mb-2 w-full justify-between font-semibold text-amber-900 dark:text-amber-100"
        @click="expanded = !expanded"
      />
      <p v-if="expanded" class="mb-2 leading-snug opacity-90">
        免密碼切換 seed 帳號；僅本機 Emulator 有效。
      </p>
      <div v-show="expanded" class="flex flex-col gap-2">
        <Select
          v-model="selectedUid"
          :options="selectOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="選擇帳號"
          class="w-full"
          size="small"
          :loading="loading"
        />
        <Button
          label="切換並刷新權限"
          size="small"
          severity="secondary"
          :loading="loading"
          :disabled="!selectedUid"
          class="w-full"
          @click="onSwitch"
        />
      </div>
    </div>
  </div>
</template>
