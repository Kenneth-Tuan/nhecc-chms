<script setup lang="ts">
/**
 * 課程模板編輯頁 (ST015)
 */
import type { CourseTemplate } from "~/types/course";
import TemplateForm from "../_components/TemplateForm.vue";
import { updateCourseTemplateSchema } from "~/schemas/course.schema";
import BasePageContainer from "~/pages/dashboard/_components/BasePageContainer.vue";
import BasePageHeader from "~/pages/dashboard/_components/BasePageHeader.vue";

definePageMeta({
  layout: "dashboard",
});

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { getById, update } = useCourseTemplates();
const { uploadAttachments, isUploading: isUploadingAttachments } = useCourseAttachmentUpload();

const templateId = computed(() => route.params.id as string);
const template = ref<CourseTemplate | null>(null);
const isLoading = ref(false);
const isSaving = ref(false);
const isSavingCombined = computed(() => isSaving.value || isUploadingAttachments.value);

onMounted(async () => {
  isLoading.value = true;
  try {
    template.value = await getById(templateId.value);
  } catch (e: any) {
    toast.add({
      severity: "error",
      summary: "錯誤",
      detail: e.data?.message || "載入課程模板失敗",
      life: 5000,
    });
    router.push("/dashboard/courses/templates");
  } finally {
    isLoading.value = false;
  }
});

async function handleSubmit(payload: any, pendingFiles: File[]): Promise<void> {
  const result = updateCourseTemplateSchema.safeParse(payload);
  if (!result.success) {
    const firstError = result.error.issues[0];
    toast.add({
      severity: "warn",
      summary: "驗證失敗",
      detail: firstError.message,
      life: 4000,
    });
    return;
  }

  isSaving.value = true;
  try {
    // 1. 先更新基本資料
    const updatedTemplate = await update(templateId.value, result.data);

    // 2. 上傳待上傳的本地檔案
    if (pendingFiles && pendingFiles.length > 0) {
      const newAttachments = await uploadAttachments(templateId.value, pendingFiles);
      
      // 3. 合併現有與新上傳附件
      const existingAttachments = updatedTemplate.attachments || [];
      const mergedAttachments = [...existingAttachments, ...newAttachments];

      // 4. 回寫 Firestore
      await update(templateId.value, {
        attachments: mergedAttachments,
      });
    }

    toast.add({
      severity: "success",
      summary: "成功",
      detail: "課程模板已更新",
      life: 3000,
    });
    router.push("/dashboard/courses/templates");
  } catch (e: any) {
    toast.add({
      severity: "error",
      summary: "更新失敗",
      detail: e.message || e.data?.message || "發生未知錯誤",
      life: 5000,
    });
  } finally {
    isSaving.value = false;
  }
}


function handleCancel(): void {
  router.push("/dashboard/courses/templates");
}
</script>

<template>
  <BasePageContainer>
    <!-- Header -->
    <BasePageHeader title="編輯課程模板" description="修改課程的基本資訊、擋修條件與相關附件" back-to="/dashboard/courses/templates" />

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Form -->
    <div v-else-if="template"
      class="bg-surface-0 dark:bg-surface-900 border border-slate-200 dark:border-surface-700 rounded-2xl p-6 md:p-8 shadow-sm">
      <TemplateForm :template="template" :is-saving="isSavingCombined" @submit="handleSubmit" @cancel="handleCancel" />
    </div>

  </BasePageContainer>
</template>
