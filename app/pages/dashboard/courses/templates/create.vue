<script setup lang="ts">
/**
 * 課程模板建立頁 (ST015)
 */
import TemplateForm from "./_components/TemplateForm.vue";
import { createCourseTemplateSchema } from "~/schemas/course.schema";
import BasePageContainer from "~/pages/dashboard/_components/BasePageContainer.vue";
import BasePageHeader from "~/pages/dashboard/_components/BasePageHeader.vue";

definePageMeta({
  layout: "dashboard",
});

const router = useRouter();
const toast = useToast();
const { create, update } = useCourseTemplates();
const { uploadAttachments, isUploading: isUploadingAttachments } = useCourseAttachmentUpload();

const isSaving = ref(false);
const isSavingCombined = computed(() => isSaving.value || isUploadingAttachments.value);

async function handleSubmit(payload: any, pendingFiles: File[]): Promise<void> {
  // 前端驗證
  const result = createCourseTemplateSchema.safeParse(payload);
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
    // 1. 先建立基本資料
    const newTemplate = await create(result.data);

    // 2. 上傳待上傳的本地檔案
    if (pendingFiles && pendingFiles.length > 0) {
      const newAttachments = await uploadAttachments(newTemplate.id, pendingFiles);
      
      // 3. 回寫 Firestore
      await update(newTemplate.id, {
        attachments: newAttachments,
      });
    }

    toast.add({
      severity: "success",
      summary: "成功",
      detail: "課程模板已建立",
      life: 3000,
    });
    router.push("/dashboard/courses/templates");
  } catch (e: any) {
    toast.add({
      severity: "error",
      summary: "建立失敗",
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
    <BasePageHeader
      title="建立課程模板"
      description="定義課程的基本資訊、擋修條件與相關附件"
      back-to="/dashboard/courses/templates"
    />

    <div
      class="bg-surface-0 dark:bg-surface-900 border border-slate-200 dark:border-surface-700 rounded-2xl p-6 md:p-8 shadow-sm"
    >
      <TemplateForm
        :is-saving="isSavingCombined"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />

    </div>
  </BasePageContainer>
</template>
