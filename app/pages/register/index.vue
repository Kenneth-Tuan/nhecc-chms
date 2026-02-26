<script setup lang="ts">
import { zodResolver } from "@primevue/forms/resolvers/zod";
import {
  getStep1Schema,
  step2Schema,
  type RegisterFormValues,
  userFieldDefs as F,
} from "~/utils/user/formDef";
import SmartField from "@/components/form/SmartField.vue";
import { pastoralZones } from "~/data/pastoral-zones.data";
import { useToast } from "primevue/usetoast";
import { useAuthStore } from "~/stores/auth.store";
import { useFirebaseAuth } from "~/composables/useFirebaseAuth";

const route = useRoute();
const firebaseAuth = useFirebaseAuth();
const authStore = useAuthStore();
const toast = useToast();

const activeStep = ref(1);
const loading = ref(false);

const isGoogle = computed(() => route.query.social === "google");
const isLine = computed(
  () =>
    route.query.social === "line" ||
    !!firebaseAuth.pendingLineProfile.value ||
    (!!route.query.code && !!route.query.liffClientId),
);
const isSocialRegister = computed(() => isGoogle.value || isLine.value);
const socialUid = ref(route.query.uid as string | undefined);

const currentStep1Schema = computed(() =>
  getStep1Schema(isSocialRegister.value),
);

const formData = ref<Partial<RegisterFormValues>>({
  fullName: (route.query.fullName as string) || "",
  email: (route.query.email as string) || "",
  phone: "",
  lineId: (route.query.lineId as string) || "",
  gender: "MALE",
  isBaptized: false,
  previousCourses: [],
});

const socialAvatar = ref((route.query.avatar as string) || "");
const syncFromQuery = () => {
  if (route.query.fullName)
    formData.value.fullName = route.query.fullName as string;
  if (route.query.email) formData.value.email = route.query.email as string;
  if (route.query.lineId) formData.value.lineId = route.query.lineId as string;
  if (route.query.avatar) formData.value.avatar = route.query.avatar as string;
  if (route.query.uid) socialUid.value = route.query.uid as string;
};

onMounted(async () => {
  syncFromQuery();

  // 偵測 LINE LIFF 重定向回呼
  if (route.query.code && route.query.liffClientId) {
    loading.value = true;
    try {
      const result = await firebaseAuth.loginWithLine();
      if (result) {
        if (!result.isNewUser) {
          // 如果已經註冊，導向儀表板
          navigateTo("/dashboard");
          return;
        }
        // 是新用戶，從個人檔案填入資料
        if (result.lineProfile) {
          formData.value.fullName = result.lineProfile.name;
          formData.value.lineId = result.lineProfile.userId;
          formData.value.avatar = result.lineProfile.picture;
          socialAvatar.value = result.lineProfile.picture;
          socialUid.value = result.uid;
        }
      }
    } catch (e: any) {
      toast.add({
        severity: "error",
        summary: "LINE 驗證失敗",
        detail: e.message || "無法取得 LINE 個人資訊",
        life: 4000,
      });
    } finally {
      loading.value = false;
    }
  }

  // 如果缺少查詢參數（LINE 重定向常見情況），則回退到待處理的 LINE 個人檔案
  if (isLine.value && firebaseAuth.pendingLineProfile.value) {
    const profile = firebaseAuth.pendingLineProfile.value;
    if (!formData.value.fullName) formData.value.fullName = profile.name;
    if (!formData.value.lineId) formData.value.lineId = profile.userId;
    if (!formData.value.avatar) formData.value.avatar = profile.picture;
    if (!socialAvatar.value) socialAvatar.value = profile.picture;
  }

  // 確保初始社交註冊登陸時活動步驟為 1
  activeStep.value = 1;
});

// 步驟 2 的動態選項
const availableGroups = computed(() => {
  if (!formData.value.pastoralZone) return [];
  const zone = pastoralZones.find((z) => z.id === formData.value.pastoralZone);
  return zone ? zone.groups : [];
});

/** File Upload Logic **/
const fileUploadRef = ref();
const onFileSelect = (event: any) => {
  const file = event.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    // @ts-ignore
    formData.value.avatar = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};
const triggerFileUpload = () => {
  fileUploadRef.value.choose();
};

/** Form Handlers **/
const onStep1Submit = async (e: any) => {
  if (!e.valid) return;

  formData.value = { ...formData.value, ...e.values };

  loading.value = true;
  try {
    let uid = socialUid.value;

    if (!isSocialRegister.value) {
      uid = await firebaseAuth.registerWithEmail(
        formData.value.email!,
        (e.values as any).password,
      );
    }

    if (!uid) throw new Error("缺少用戶識別碼 (Missing User ID)");

    await $fetch("/api/auth/register", {
      method: "POST",
      body: {
        uid,
        fullName: formData.value.fullName,
        phone: formData.value.phone,
        email: formData.value.email,
        avatar: formData.value.avatar,
      },
    });

    socialUid.value = uid;
    activeStep.value = 2;
  } catch (err: any) {
    const msg =
      err.code === "auth/email-already-in-use"
        ? "此 Email 已被註冊"
        : err.message || "註冊失敗";
    toast.add({
      severity: "error",
      summary: "註冊失敗",
      detail: msg,
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

const onStep2Submit = async (e: any) => {
  if (!e.valid) return;

  formData.value = { ...formData.value, ...e.values };

  loading.value = true;
  try {
    const uid = socialUid.value;
    if (!uid) throw new Error("缺少用戶 ID");

    // 個人檔案更新邏輯...

    // 使用步驟 2 的資料更新會友個人檔案
    await $fetch(`/api/members/${uid}`, {
      method: "PATCH",
      body: {
        gender: formData.value.gender === "MALE" ? "Male" : "Female",
        dob: formData.value.birthDate
          ? new Date(formData.value.birthDate).toISOString().split("T")[0]
          : "",
        lineId: formData.value.lineId,
        address: formData.value.address,
        emergencyContactName: formData.value.emergencyContactName,
        emergencyContactPhone: formData.value.emergencyContactPhone,
        baptismStatus: formData.value.isBaptized,
        baptismDate: formData.value.baptismDate
          ? new Date(formData.value.baptismDate).toISOString().split("T")[0]
          : undefined,
        zoneId: formData.value.pastoralZone,
        groupId: formData.value.homeGroup,
        pastCourses: formData.value.previousCourses,
        avatar: formData.value.avatar,
      },
    });

    await authStore.loadContext();
    navigateTo("/dashboard");
  } catch (err: any) {
    toast.add({
      severity: "error",
      summary: "更新失敗",
      detail: err.message || "無法更新個人資料",
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

const handleSkip = async () => {
  await authStore.loadContext();
  navigateTo("/dashboard");
};

definePageMeta({
  layout: "auth-layout",
});
</script>

<template>
  <div
    :class="[
      'flex flex-col',
      'overflow-hidden',
      'w-full max-w-[520px]',
      'min-h-screen sm:min-h-[850px]',
      'bg-white dark:bg-slate-900',
      'sm:rounded-[40px]',
      'shadow-2xl',
    ]"
  >
    <Stepper v-model:value="activeStep" class="flex flex-col h-full">
      <!-- 標題區域 -->
      <header :class="['shrink-0 text-center', 'pt-10 px-6 sm:px-8 pb-4']">
        <StepList
          class="!flex !justify-center !gap-2 !mb-6 !bg-transparent !p-0 !border-0 !shadow-none"
        >
          <Step v-slot="{ activateCallback, value }" asChild :value="1">
            <div @click="activateCallback" class="cursor-pointer">
              <div
                :class="[
                  'h-1.5 w-12 rounded-full transition-all',
                  Number(value) <= activeStep
                    ? 'bg-primary'
                    : 'bg-slate-200 dark:bg-slate-800',
                ]"
              ></div>
            </div>
          </Step>
          <Step v-slot="{ activateCallback, value }" asChild :value="2">
            <div
              @click="Number(value) <= activeStep ? activateCallback() : null"
              :class="[
                Number(value) <= activeStep
                  ? 'cursor-pointer'
                  : 'cursor-default',
              ]"
            >
              <div
                :class="[
                  'h-1.5 w-12 rounded-full transition-all',
                  Number(value) <= activeStep
                    ? 'bg-primary'
                    : 'bg-slate-200 dark:bg-slate-800',
                ]"
              ></div>
            </div>
          </Step>
        </StepList>

        <h1 :class="['text-2xl font-bold', 'text-slate-800 dark:text-white']">
          {{ activeStep === 1 ? "建立新帳號" : "完成個人資料" }}
        </h1>
        <p :class="['text-sm mt-1 px-4', 'text-slate-500 dark:text-slate-400']">
          {{
            activeStep === 1
              ? "請輸入您的基本資訊以開始使用教會學習平台"
              : "讓我們更了解您，提供個人化的學習體驗"
          }}
        </p>
      </header>

      <StepPanels>
        <!-- 步驟 1: 帳號資訊 -->
        <StepPanel
          v-slot="{ activateCallback }"
          :value="1"
          class="p-6 sm:p-8 pt-2"
        >
          <Form
            :initial-values="formData"
            :resolver="zodResolver(currentStep1Schema)"
            @submit="onStep1Submit"
            class="flex-1 flex flex-col space-y-5"
          >
            <SmartField v-bind="F.fullName" />
            <SmartField v-bind="F.phone" />
            <SmartField v-bind="F.email" :disabled="isGoogle" />
            <SmartField v-if="isLine" v-bind="F.lineId" :disabled="isLine" />

            <template v-if="!isSocialRegister">
              <Divider />
              <SmartField v-bind="F.password" />
              <SmartField v-bind="F.confirmPassword" />
            </template>

            <div class="mt-auto pt-6">
              <Button
                label="下一步 (Next)"
                type="submit"
                :loading="loading"
                class="font-bold !text-lg !w-full !rounded-xl shadow-md shadow-blue-300"
              />
              <p
                class="text-[11px] leading-normal text-center mt-4 px-4 text-slate-400"
              >
                點擊下一步即代表您同意本平台的
                <NuxtLink to="#" class="underline hover:text-slate-600"
                  >服務條款</NuxtLink
                >
                與
                <NuxtLink to="#" class="underline hover:text-slate-600"
                  >隱私政策</NuxtLink
                >
              </p>
            </div>
          </Form>

          <div
            class="pt-8 mt-4 text-center border-t border-slate-50 dark:border-slate-800/50"
          >
            <p class="text-sm text-slate-500 dark:text-slate-400">
              已經有帳號了嗎？
              <NuxtLink
                to="/login"
                class="font-bold text-primary hover:underline"
                >立即登入</NuxtLink
              >
            </p>
          </div>
        </StepPanel>

        <!-- 步驟 2: 個人資料 -->
        <StepPanel
          v-slot="{ activateCallback }"
          :value="2"
          class="p-6 sm:p-8 pt-2"
        >
          <!-- 大頭貼 (通常在表單外，或手動處理) -->
          <div class="flex flex-col items-center mb-8 shrink-0">
            <FileUpload
              ref="fileUploadRef"
              mode="basic"
              name="avatar"
              accept="image/*"
              customUpload
              auto
              :maxFileSize="1000000"
              class="hidden"
              @select="onFileSelect"
            />
            <div
              class="relative cursor-pointer transition-transform hover:scale-105"
              @click="triggerFileUpload"
            >
              <Avatar
                :image="formData.avatar || undefined"
                :icon="formData.avatar ? undefined : 'pi pi-user'"
                class="w-24 h-24 !bg-slate-100 dark:!bg-slate-800 !border-2 !border-slate-50 dark:!border-slate-800 shadow-inner"
                size="xlarge"
                shape="circle"
                :style="
                  !formData.avatar ? { fontSize: '3rem', color: '#cbd5e1' } : {}
                "
                :pt="{
                  image: { class: 'object-cover w-full h-full rounded-full' },
                }"
              />
              <div
                class="absolute bottom-0 right-0 flex items-center justify-center w-8 h-8 bg-primary text-white shadow-md border-2 border-white dark:border-slate-900 rounded-full"
              >
                <i class="pi pi-camera text-sm"></i>
              </div>
            </div>
            <span
              class="text-xs font-bold uppercase tracking-widest mt-3 text-slate-400"
              >上傳大頭貼</span
            >
          </div>

          <Form
            :initial-values="formData"
            :resolver="zodResolver(step2Schema)"
            @submit="onStep2Submit"
            class="space-y-10"
          >
            <!-- 基本資料 -->
            <section class="space-y-4">
              <h2
                class="text-lg font-bold flex items-center gap-2 mb-6 pl-3 text-slate-800 dark:text-white border-l-4 border-primary"
              >
                基本資料
              </h2>
              <div class="grid grid-cols-1 gap-5">
                <SmartField v-bind="F.gender" />
                <SmartField v-bind="F.birthDate" />
                <SmartField v-bind="F.maritalStatus" />
              </div>
            </section>

            <!-- 聯絡資訊 -->
            <section class="space-y-4">
              <h2
                class="text-lg font-bold flex items-center gap-2 mb-6 pl-3 text-slate-800 dark:text-white border-l-4 border-primary"
              >
                聯絡資訊
              </h2>
              <div class="grid grid-cols-1 gap-5">
                <SmartField v-bind="F.lineId" :disabled="isLine" />
                <SmartField v-bind="F.address" />
              </div>
            </section>

            <!-- 緊急聯絡人 -->
            <section class="space-y-4">
              <h2
                class="text-lg font-bold flex items-center gap-2 mb-6 pl-3 text-slate-800 dark:text-white border-l-4 border-primary"
              >
                緊急聯絡人
              </h2>
              <div class="grid grid-cols-1 gap-5">
                <SmartField v-bind="F.emergencyContactName" />
                <SmartField v-bind="F.emergencyContactPhone" />
              </div>
            </section>

            <!-- 信仰狀態 -->
            <section class="space-y-4">
              <h2
                class="text-lg font-bold flex items-center gap-2 mb-6 pl-3 text-slate-800 dark:text-white border-l-4 border-primary"
              >
                信仰狀態
              </h2>
              <div class="grid grid-cols-1 gap-5">
                <SmartField v-bind="F.isBaptized" />

                <div
                  v-if="formData.isBaptized"
                  class="animate-fade-in animate-duration-300"
                >
                  <SmartField v-bind="F.baptismDate" />
                </div>

                <SmartField v-bind="F.pastoralZone" :options="pastoralZones" />
                <SmartField
                  v-bind="F.homeGroup"
                  :options="availableGroups"
                  :disabled="!formData.pastoralZone"
                />
              </div>
            </section>

            <!-- 過去經歷 -->
            <section class="space-y-4">
              <h2
                class="text-lg font-bold flex items-center gap-2 mb-6 pl-3 text-slate-800 dark:text-white border-l-4 border-primary"
              >
                過去經歷
              </h2>
              <SmartField v-bind="F.previousCourses" />
            </section>

            <!-- 頁尾 -->
            <footer class="pt-8 pb-4 space-y-4">
              <Button
                label="完成註冊並開始使用"
                type="submit"
                :loading="loading"
                class="!py-4 !w-full !font-bold !text-lg shadow-blue-300 shadow-md !rounded-xl"
              />
              <Button
                label="稍後在個人檔案中完成"
                variant="text"
                raised
                class="!text-sm !font-medium !w-full !text-slate-400 hover:!text-slate-600"
                @click="handleSkip"
              />
            </footer>
          </Form>
        </StepPanel>
      </StepPanels>
    </Stepper>
  </div>
</template>
