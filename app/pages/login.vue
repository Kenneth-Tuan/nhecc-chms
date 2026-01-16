<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import { externalAuth } from "@/plugins/liff.js";

const email = ref("");
const password = ref("");
const loading = ref(false);
const errorMsg = ref("");

const router = useRouter();
const { loginWithEmail, loginWithGoogle } = useAuth();
const googleLoading = ref(false);

// Firebase error code translations
const getErrorMessage = (errorCode) => {
  const errorMessages = {
    "auth/invalid-email": "Email 格式不正確",
    "auth/user-disabled": "此帳號已被停用",
    "auth/user-not-found": "找不到此帳號",
    "auth/wrong-password": "密碼錯誤",
    "auth/invalid-credential": "帳號或密碼錯誤",
    "auth/too-many-requests": "登入嘗試次數過多，請稍後再試",
    "auth/popup-closed-by-user": "登入視窗已關閉",
    "auth/popup-blocked": "彈出視窗被封鎖，請允許彈出視窗",
    "auth/cancelled-popup-request": "登入已取消",
    "auth/account-exists-with-different-credential":
      "此 Email 已使用其他方式註冊",
  };
  return errorMessages[errorCode] || "登入失敗，請稍後再試";
};

async function onLogin() {
  if (!email.value || !password.value) {
    errorMsg.value = "請輸入帳號與密碼";
    return;
  }

  loading.value = true;
  errorMsg.value = "";

  try {
    await loginWithEmail(email.value, password.value);
    router.push("/");
  } catch (err) {
    errorMsg.value = getErrorMessage(err.code);
  } finally {
    loading.value = false;
  }
}

function onLineLogin() {
  console.log("LINE Login triggered");
  externalAuth();
}

async function onGoogleLogin() {
  googleLoading.value = true;
  errorMsg.value = "";

  try {
    await loginWithGoogle();
    router.push("/");
  } catch (err) {
    errorMsg.value = getErrorMessage(err.code);
  } finally {
    googleLoading.value = false;
  }
}

function goToRegister() {
  router.push("/register");
}
</script>

<template>
  <div
    class="u-flex u-items-center u-justify-center u-min-h-screen u-bg-surface-100 dark:u-bg-nhecc-dark-900! u-transition-colors u-duration-300"
  >
    <div
      class="u-w-full u-max-w-400px u-p-8 u-flex u-flex-col u-items-center u-justify-center"
    >
      <!-- Main Login Card -->
      <Card
        class="u-w-full u-rd-24px u-border-none u-shadow-xl dark:u-bg-#2a1f1a! u-overflow-hidden"
      >
        <template #content>
          <div class="u-text-center u-mb-6">
            <h2 class="u-text-1.5rem u-font-700 u-mb-1">Welcome Back</h2>
            <p
              class="u-text-surface-500 dark:u-text-surface-400 u-text-0.875rem"
            >
              Please sign in to continue
            </p>
          </div>

          <form @submit.prevent="onLogin" class="u-flex u-flex-col u-gap-6">
            <!-- Email Field -->
            <div class="u-flex u-flex-col u-gap-2">
              <label
                for="email"
                class="u-text-0.875rem u-font-600 u-text-surface-700 dark:u-text-surface-300"
                >Email or Username</label
              >
              <IconField>
                <InputIcon class="pi pi-user" />
                <InputText
                  id="email"
                  v-model="email"
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
                  placeholder="Enter your password"
                  :feedback="false"
                  toggleMask
                  class="u-w-full"
                  inputClass="u-w-full custom-input"
                  :disabled="loading"
                />
              </IconField>
            </div>

            <!-- Forgot Password -->
            <div class="u-text-right">
              <a
                href="#"
                class="u-text-primary u-text-0.8125rem u-font-600 u-no-underline hover:u-underline"
                >Forgot Password?</a
              >
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
              label="Log In"
              icon="pi pi-sign-in"
              iconPos="right"
              class="u-w-full u-rd-12px u-p-3 u-font-700"
              :loading="loading"
            />

            <!-- Divider -->
            <Divider align="center" class="u-my-2">
              <span class="u-text-0.75rem u-text-surface-400 u-font-700"
                >OR</span
              >
            </Divider>

            <!-- Third Party Login -->
            <Button
              type="button"
              label="Google Login"
              icon="pi pi-google"
              class="u-w-full u-rd-12px u-font-600"
              severity="danger"
              outlined
              :loading="googleLoading"
              @click="onGoogleLogin"
            />

            <Button
              type="button"
              label="LINE Login"
              icon="pi pi-comment"
              class="u-w-full u-rd-12px u-font-600 u-mt-2"
              severity="success"
              outlined
              @click="onLineLogin"
            />

            <!-- Register Link -->
            <div class="u-text-center u-mt-4">
              <span
                class="u-text-0.875rem u-text-surface-600 dark:u-text-surface-400"
                >New here?
              </span>
              <a
                href="#"
                @click.prevent="goToRegister"
                class="u-text-primary u-text-0.875rem u-font-700 u-no-underline hover:u-underline"
                >Register Account</a
              >
            </div>
          </form>
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped></style>
