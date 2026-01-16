<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";

const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const errorMsg = ref("");

const router = useRouter();
const { registerWithEmail } = useAuth();

// Password validation
const passwordMinLength = 6;
const isPasswordMatch = computed(
  () => password.value === confirmPassword.value
);
const isPasswordValid = computed(
  () => password.value.length >= passwordMinLength
);

// Firebase error code translations
const getErrorMessage = (errorCode) => {
  const errorMessages = {
    "auth/email-already-in-use": "此 Email 已被註冊",
    "auth/invalid-email": "Email 格式不正確",
    "auth/weak-password": "密碼強度不足，請使用至少 6 個字元",
    "auth/operation-not-allowed": "Email/Password 註冊功能尚未啟用",
  };
  return errorMessages[errorCode] || "註冊失敗，請稍後再試";
};

async function onRegister() {
  // Form validation
  if (!email.value || !password.value || !confirmPassword.value) {
    errorMsg.value = "請填寫所有欄位";
    return;
  }

  if (!isPasswordValid.value) {
    errorMsg.value = `密碼長度至少需要 ${passwordMinLength} 個字元`;
    return;
  }

  if (!isPasswordMatch.value) {
    errorMsg.value = "密碼與確認密碼不一致";
    return;
  }

  loading.value = true;
  errorMsg.value = "";

  try {
    await registerWithEmail(email.value, password.value);
    router.push("/");
  } catch (err) {
    errorMsg.value = getErrorMessage(err.code);
  } finally {
    loading.value = false;
  }
}

function goToLogin() {
  router.push("/login");
}
</script>

<template>
  <div
    class="u-flex u-items-center u-justify-center u-min-h-screen u-bg-surface-100 dark:u-bg-nhecc-dark-900! u-transition-colors u-duration-300"
  >
    <div
      class="u-w-full u-max-w-400px u-p-8 u-flex u-flex-col u-items-center u-justify-center"
    >
      <!-- Main Register Card -->
      <Card
        class="u-w-full u-rd-24px u-border-none u-shadow-xl dark:u-bg-#2a1f1a! u-overflow-hidden"
      >
        <template #content>
          <div class="u-text-center u-mb-6">
            <h2 class="u-text-1.5rem u-font-700 u-mb-1">Create Account</h2>
            <p
              class="u-text-surface-500 dark:u-text-surface-400 u-text-0.875rem"
            >
              Sign up to get started
            </p>
          </div>

          <form @submit.prevent="onRegister" class="u-flex u-flex-col u-gap-5">
            <!-- Email Field -->
            <div class="u-flex u-flex-col u-gap-2">
              <label
                for="email"
                class="u-text-0.875rem u-font-600 u-text-surface-700 dark:u-text-surface-300"
                >Email</label
              >
              <IconField>
                <InputIcon class="pi pi-envelope" />
                <InputText
                  id="email"
                  v-model="email"
                  type="email"
                  placeholder="Enter your email"
                  class="u-w-full custom-input"
                  :disabled="loading"
                />
              </IconField>
            </div>

            <!-- Password Field -->
            <div class="u-flex u-flex-col u-gap-2">
              <label
                for="password"
                class="u-text-0.875rem u-font-600 u-text-surface-700 dark:u-text-surface-300"
                >Password</label
              >
              <IconField>
                <InputIcon class="pi pi-lock" />
                <Password
                  id="password"
                  v-model="password"
                  placeholder="At least 6 characters"
                  :feedback="true"
                  toggleMask
                  class="u-w-full"
                  inputClass="u-w-full custom-input"
                  :disabled="loading"
                />
              </IconField>
            </div>

            <!-- Confirm Password Field -->
            <div class="u-flex u-flex-col u-gap-2">
              <label
                for="confirmPassword"
                class="u-text-0.875rem u-font-600 u-text-surface-700 dark:u-text-surface-300"
                >Confirm Password</label
              >
              <IconField>
                <InputIcon class="pi pi-lock" />
                <Password
                  id="confirmPassword"
                  v-model="confirmPassword"
                  placeholder="Re-enter your password"
                  :feedback="false"
                  toggleMask
                  class="u-w-full"
                  inputClass="u-w-full custom-input"
                  :disabled="loading"
                  :invalid="confirmPassword && !isPasswordMatch"
                />
              </IconField>
              <small
                v-if="confirmPassword && !isPasswordMatch"
                class="u-text-red-500 u-text-0.75rem"
              >
                Passwords do not match
              </small>
            </div>

            <!-- Error Message -->
            <Message
              v-if="errorMsg"
              severity="error"
              size="small"
              variant="simple"
            >
              {{ errorMsg }}
            </Message>

            <!-- Submit Button -->
            <Button
              type="submit"
              label="Create Account"
              icon="pi pi-user-plus"
              iconPos="right"
              class="u-w-full u-rd-12px u-p-3 u-font-700"
              :loading="loading"
              :disabled="!isPasswordValid || !isPasswordMatch"
            />

            <!-- Login Link -->
            <div class="u-text-center u-mt-2">
              <span
                class="u-text-0.875rem u-text-surface-600 dark:u-text-surface-400"
                >Already have an account?
              </span>
              <a
                href="#"
                @click.prevent="goToLogin"
                class="u-text-primary u-text-0.875rem u-font-700 u-no-underline hover:u-underline"
                >Sign In</a
              >
            </div>
          </form>
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped></style>
