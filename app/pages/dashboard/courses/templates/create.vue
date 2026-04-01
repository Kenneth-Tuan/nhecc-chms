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
const { create } = useCourseTemplates();

const isSaving = ref(false);

async function handleSubmit(payload: any): Promise<void> {
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
    await create(result.data);
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
      detail: e.data?.message || "發生未知錯誤",
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
      class="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm"
    >
      <TemplateForm
        :is-saving="isSaving"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </div>
  </BasePageContainer>
</template>
