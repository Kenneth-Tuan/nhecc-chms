/**
 * 解鎖敏感資料 Composable
 * 處理敏感欄位的顯隱切換邏輯。
 */
import type { RevealResponse } from "~/types/api";

export function useRevealSensitiveData() {
  const revealedFields = ref<Record<string, Record<string, string>>>({});
  const isRevealing = ref(false);
  const revealTimers = ref<Record<string, ReturnType<typeof setTimeout>>>({});

  /**
   * 解鎖特定會友的指定欄位。
   * 30 秒後會自動重新遮蔽。
   */
  async function revealFields(
    memberId: string,
    fields: string[],
  ): Promise<Record<string, string>> {
    isRevealing.value = true;

    try {
      const response = await $fetch<{ success: boolean; data: RevealResponse }>(
        `/api/members/${memberId}/reveal`,
        {
          method: "POST",
          body: { fields },
        },
      );

      // 儲存已解鎖的資料
      if (!revealedFields.value[memberId]) {
        revealedFields.value[memberId] = {};
      }

      for (const [field, value] of Object.entries(response.data)) {
        revealedFields.value[memberId][field] = value;
      }

      // 30 秒後自動重新遮蔽
      const timerKey = `${memberId}-${fields.join(",")}`;
      if (revealTimers.value[timerKey]) {
        clearTimeout(revealTimers.value[timerKey]);
      }

      revealTimers.value[timerKey] = setTimeout(() => {
        maskFields(memberId, fields);
      }, 30000);

      return response.data;
    } catch (err) {
      console.error("Failed to reveal fields:", err);
      throw err;
    } finally {
      isRevealing.value = false;
    }
  }

  /**
   * 解賞某位會友的所有敏感欄位。
   */
  async function revealAll(memberId: string): Promise<void> {
    const allFields = [
      "mobile",
      "email",
      "lineId",
      "address",
      "emergencyContactPhone",
    ];
    await revealFields(memberId, allFields);
  }

  /**
   * 遮蔽指定欄位（從緩存中移除）。
   */
  function maskFields(memberId: string, fields: string[]): void {
    if (!revealedFields.value[memberId]) return;

    for (const field of fields) {
      delete revealedFields.value[memberId][field];
    }

    if (Object.keys(revealedFields.value[memberId]).length === 0) {
      delete revealedFields.value[memberId];
    }
  }

  /**
   * 檢查特定欄位當前是否已解鎖。
   */
  function isFieldRevealed(memberId: string, field: string): boolean {
    return !!revealedFields.value[memberId]?.[field];
  }

  /**
   * 獲取欄位的解鎖數值。
   */
  function getRevealedValue(
    memberId: string,
    field: string,
  ): string | undefined {
    return revealedFields.value[memberId]?.[field];
  }

  /**
   * 清理所有計時器。
   */
  function cleanup(): void {
    for (const timer of Object.values(revealTimers.value)) {
      clearTimeout(timer);
    }
    revealTimers.value = {};
    revealedFields.value = {};
  }

  onUnmounted(() => {
    cleanup();
  });

  return {
    revealedFields,
    isRevealing,
    revealFields,
    revealAll,
    maskFields,
    isFieldRevealed,
    getRevealedValue,
    cleanup,
  };
}
