/**
 * Member Validation Composable (ST004)
 * Provides real-time field validation for member forms.
 */

interface UniqueCheckResponse {
  isUnique: boolean;
  message?: string;
}

export function useMemberValidation() {
  const mobileError = ref<string | null>(null);
  const emailWarning = ref<string | null>(null);
  const isCheckingMobile = ref(false);
  const isCheckingEmail = ref(false);

  /** Check mobile number uniqueness (called on blur) */
  async function checkMobileUnique(
    mobile: string,
    excludeUuid?: string,
  ): Promise<boolean> {
    const rawMobile = mobile.replace(/\D/g, "");
    if (!rawMobile || !/^09\d{8}$/.test(rawMobile)) {
      mobileError.value = null;
      return true;
    }

    isCheckingMobile.value = true;
    mobileError.value = null;
    try {
      const response = await $fetch<UniqueCheckResponse>(
        "/api/members/check-unique",
        {
          method: "POST",
          body: { field: "mobile", value: rawMobile, excludeUuid },
        },
      );

      if (!response.isUnique) {
        mobileError.value = "此手機號碼已被使用";
        return false;
      }
      return true;
    } catch (error) {
      console.error("Mobile uniqueness check failed:", error);
      return true;
    } finally {
      isCheckingMobile.value = false;
    }
  }

  /** Check email and show suggestion warning if duplicate (called on blur) */
  async function checkEmailDuplicate(
    email: string,
    excludeUuid?: string,
  ): Promise<void> {
    if (!email) {
      emailWarning.value = null;
      return;
    }

    isCheckingEmail.value = true;
    emailWarning.value = null;
    try {
      const response = await $fetch<UniqueCheckResponse>(
        "/api/members/check-unique",
        {
          method: "POST",
          body: { field: "email", value: email, excludeUuid },
        },
      );

      if (!response.isUnique) {
        emailWarning.value = "此 Email 已被使用，請確認是否為不同會友";
      }
    } catch (error) {
      console.error("Email uniqueness check failed:", error);
    } finally {
      isCheckingEmail.value = false;
    }
  }

  /** Validate date is not in the future */
  function validatePastDate(date: string): boolean {
    if (!date) return true;
    return new Date(date) <= new Date();
  }

  /** Reset all validation state */
  function resetValidation(): void {
    mobileError.value = null;
    emailWarning.value = null;
    isCheckingMobile.value = false;
    isCheckingEmail.value = false;
  }

  return {
    mobileError,
    emailWarning,
    isCheckingMobile,
    isCheckingEmail,
    checkMobileUnique,
    checkEmailDuplicate,
    validatePastDate,
    resetValidation,
  };
}
