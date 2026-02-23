<script setup lang="ts">
import { zodResolver } from "@primevue/forms/resolvers/zod";
import {
  step1Schema,
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

// Social login state from query params (Google/LINE redirect)
const socialUid = ref(route.query.uid as string | undefined);
const isSocialRegister = computed(() => !!socialUid.value);

const formData = ref<Partial<RegisterFormValues>>({
  fullName: (route.query.fullName as string) || "",
  email: (route.query.email as string) || "",
  gender: "MALE",
  isBaptized: false,
  previousCourses: [],
});

// Pre-fill avatar from social login (LINE or Google)
const socialAvatar = ref((route.query.avatar as string) || "");
onMounted(() => {
  // Also check pendingLineProfile from composable state
  if (!socialAvatar.value && firebaseAuth.pendingLineProfile.value?.picture) {
    socialAvatar.value = firebaseAuth.pendingLineProfile.value.picture;
  }
  if (socialAvatar.value) {
    formData.value.avatar = socialAvatar.value;
  }

  // Social login: skip step 1, go directly to profile completion
  if (isSocialRegister.value) {
    activeStep.value = 2;
  }
});

// Dynamic Options for Step 2
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
    const uid = await firebaseAuth.registerWithEmail(
      formData.value.email!,
      (e.values as any).password
    );

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
    if (!uid) throw new Error("Missing user ID");

    // If this is a social register, create the Member record first
    if (isSocialRegister.value && route.query.social) {
      await $fetch("/api/auth/register", {
        method: "POST",
        body: {
          uid,
          fullName: formData.value.fullName || route.query.fullName || "",
          phone: formData.value.phone || "",
          email: formData.value.email || route.query.email || "",
          avatar: formData.value.avatar,
        },
      });
    }

    // Update member profile with step 2 data
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
  if (socialUid.value && isSocialRegister.value && route.query.social) {
    try {
      await $fetch("/api/auth/register", {
        method: "POST",
        body: {
          uid: socialUid.value,
          fullName: formData.value.fullName || route.query.fullName || "",
          phone: "",
          email: formData.value.email || route.query.email || "",
          avatar: formData.value.avatar,
        },
      });
    } catch {
      // Member might already exist, ignore
    }
  }
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
      <!-- Header Area -->
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
        <!-- STEP 1: Account Info -->
        <StepPanel
          v-slot="{ activateCallback }"
          :value="1"
          class="p-6 sm:p-8 pt-2"
        >
          <Form
            :initial-values="formData"
            :resolver="zodResolver(step1Schema)"
            @submit="onStep1Submit"
            class="flex-1 flex flex-col space-y-5"
          >
            <SmartField v-bind="F.fullName" />
            <SmartField v-bind="F.phone" />
            <SmartField v-bind="F.email" />

            <Divider />

            <SmartField v-bind="F.password" />
            <SmartField v-bind="F.confirmPassword" />

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

        <!-- STEP 2: Profile Info -->
        <StepPanel
          v-slot="{ activateCallback }"
          :value="2"
          class="p-6 sm:p-8 pt-2"
        >
          <!-- Avatar (Outside Form usually, or handled manually) -->
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
            <!-- Basic Info -->
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

            <!-- Contact -->
            <section class="space-y-4">
              <h2
                class="text-lg font-bold flex items-center gap-2 mb-6 pl-3 text-slate-800 dark:text-white border-l-4 border-primary"
              >
                聯絡資訊
              </h2>
              <div class="grid grid-cols-1 gap-5">
                <SmartField v-bind="F.lineId" />
                <SmartField v-bind="F.address" />
              </div>
            </section>

            <!-- Emergency -->
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

            <!-- Faith -->
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

            <!-- Experience -->
            <section class="space-y-4">
              <h2
                class="text-lg font-bold flex items-center gap-2 mb-6 pl-3 text-slate-800 dark:text-white border-l-4 border-primary"
              >
                過去經歷
              </h2>
              <SmartField v-bind="F.previousCourses" />
            </section>

            <!-- Footer -->
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
