/**
 * Reveal Sensitive Data Composable
 * Handles the reveal/mask toggle for sensitive fields.
 */
import type { RevealResponse } from '~/types/api';

export function useRevealSensitiveData() {
  const revealedFields = ref<Record<string, Record<string, string>>>({});
  const isRevealing = ref(false);
  const revealTimers = ref<Record<string, ReturnType<typeof setTimeout>>>({});

  /**
   * Reveal specific fields for a member.
   * Auto-masks after 30 seconds.
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
          method: 'POST',
          body: { fields },
        },
      );

      // Store revealed data
      if (!revealedFields.value[memberId]) {
        revealedFields.value[memberId] = {};
      }

      for (const [field, value] of Object.entries(response.data)) {
        revealedFields.value[memberId][field] = value;
      }

      // Auto-mask after 30 seconds
      const timerKey = `${memberId}-${fields.join(',')}`;
      if (revealTimers.value[timerKey]) {
        clearTimeout(revealTimers.value[timerKey]);
      }

      revealTimers.value[timerKey] = setTimeout(() => {
        maskFields(memberId, fields);
      }, 30000);

      return response.data;
    } catch (err) {
      console.error('Failed to reveal fields:', err);
      throw err;
    } finally {
      isRevealing.value = false;
    }
  }

  /**
   * Reveal all sensitive fields for a member.
   */
  async function revealAll(memberId: string): Promise<void> {
    const allFields = [
      'mobile',
      'email',
      'lineId',
      'address',
      'emergencyContactPhone',
    ];
    await revealFields(memberId, allFields);
  }

  /**
   * Mask specific fields (remove from revealed cache).
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
   * Check if a field is currently revealed.
   */
  function isFieldRevealed(memberId: string, field: string): boolean {
    return !!revealedFields.value[memberId]?.[field];
  }

  /**
   * Get the revealed value for a field.
   */
  function getRevealedValue(
    memberId: string,
    field: string,
  ): string | undefined {
    return revealedFields.value[memberId]?.[field];
  }

  /**
   * Clean up all timers.
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
