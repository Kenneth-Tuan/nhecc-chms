<script setup lang="ts">
/**
 * 班級管理列表頁 (ST015)
 * 支援分類、教師與狀態篩選，並能快速跳轉至班級詳情。
 */
import BasePageContainer from "~/pages/dashboard/_components/BasePageContainer.vue";
import BasePageHeader from "~/pages/dashboard/_components/BasePageHeader.vue";
import BaseFilterBar from "~/pages/dashboard/_components/BaseFilterBar.vue";

definePageMeta({
  layout: "dashboard",
});

const { fetchClasses, fetchTeachers, isLoading } = useCourseClass();
const { list: listCategories } = useCourseCategories();

const classes = ref<any[]>([]);
const teachers = ref<{ id: string; name: string }[]>([]);
const categories = ref<any[]>([]);

// 篩選狀態
const filters = ref({
  search: "",
  categoryId: null,
  teacherId: null,
  status: "all",
});

const statusOptions = [
  { label: "全部狀態", value: "all" },
  { label: "準備中", value: "SETUP" },
  { label: "進行中", value: "IN_PROGRESS" },
  { label: "已結束", value: "COMPLETED" },
];

// 專門負責抓取班級列表
async function refreshClassList() {
  classes.value = await fetchClasses(filters.value);
}

// 專門負責初始化元數據 (教師、分類)
async function setupInitialData() {
  const [teachersData, categoriesData] = await Promise.all([
    fetchTeachers(),
    listCategories(),
  ]);
  teachers.value = teachersData;
  categories.value = categoriesData;
}

onMounted(async () => {
  await Promise.all([setupInitialData(), refreshClassList()]);
});

// 當篩選器變更時重新載入班級列表
watch(
  () => [
    filters.value.categoryId,
    filters.value.teacherId,
    filters.value.status,
  ],
  () => refreshClassList(),
  { deep: true },
);

function getStatusSeverity(status: string) {
  switch (status) {
    case "SETUP":
      return "secondary";
    case "IN_PROGRESS":
      return "success";
    case "COMPLETED":
      return "info";
    default:
      return "secondary";
  }
}

function getStatusLabel(status: string) {
  return statusOptions.find((opt) => opt.value === status)?.label || status;
}
</script>

<template>
  <BasePageContainer>
    <!-- Header -->
    <BasePageHeader
      title="班級管理"
      description="管理目前正在進行或準備中的所有班級與修課紀錄"
    >
      <template #actions>
        <NuxtLink to="/dashboard/courses/classes/create">
          <Button label="建立新班級" icon="pi pi-plus" class="shadow-md" />
        </NuxtLink>
      </template>
    </BasePageHeader>

    <!-- Filter Bar -->
    <BaseFilterBar :columns="4">
      <div class="flex flex-col gap-1">
        <label class="text-base font-semibold text-slate-500 ml-1"
          >搜尋名稱</label
        >
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="filters.search"
            placeholder="搜尋班級..."
            fluid
            @keyup.enter="refreshClassList"
          />
        </IconField>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-base font-semibold text-slate-500 ml-1"
          >課程分類</label
        >
        <Select
          v-model="filters.categoryId"
          :options="categories"
          option-label="name"
          option-value="id"
          placeholder="全部分類"
          show-clear
          fluid
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-base font-semibold text-slate-500 ml-1"
          >授課老師</label
        >
        <Select
          v-model="filters.teacherId"
          :options="teachers"
          option-label="name"
          option-value="id"
          placeholder="全部老師"
          show-clear
          fluid
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-base font-semibold text-slate-500 ml-1"
          >班級狀態</label
        >
        <Select
          v-model="filters.status"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          fluid
        />
      </div>
    </BaseFilterBar>

    <!-- Data Table -->
    <div
      class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <DataTable
        :value="classes"
        :loading="isLoading"
        responsive-layout="stack"
        breakpoint="960px"
        class="p-datatable-sm"
      >
        <template #empty>
          <div class="text-center py-12">
            <i class="pi pi-inbox text-4xl text-slate-300 mb-3 block" />
            <p class="text-slate-500 text-base">找不到符合條件的班級</p>
          </div>
        </template>

        <Column
          field="name"
          header="班級名稱"
          class="font-bold text-slate-700 text-base"
        >
          <template #body="{ data }">
            <div class="flex flex-col">
              <span class="text-base">{{ data.name }}</span>
              <span class="text-base text-slate-400 font-mono">{{
                data.templateCode
              }}</span>
            </div>
          </template>
        </Column>

        <Column
          field="templateName"
          header="所屬模板"
          class="text-slate-600 text-base"
        />

        <Column header="授課老師">
          <template #body="{ data }">
            <div class="flex flex-wrap gap-2">
              <Tag
                v-for="t in data.teachers"
                :key="t.id"
                :value="t.name"
                severity="secondary"
                class="bg-slate-100 text-slate-600 border-none text-base px-3 py-1"
              />
            </div>
          </template>
        </Column>

        <Column header="課程時間">
          <template #body="{ data }">
            <div class="text-base">
              <div class="flex items-center gap-2">
                <i class="pi pi-calendar" />
                {{ data.startDate }}
              </div>
              <div class="text-slate-400 text-base mt-1">
                至 {{ data.endDate }}
              </div>
            </div>
          </template>
        </Column>

        <Column header="招生進度">
          <template #body="{ data }">
            <div class="w-40">
              <div class="flex justify-between text-base mb-1">
                <span>{{ data.enrollmentCount }} / {{ data.maxCapacity }}</span>
                <span
                  >{{
                    Math.round((data.enrollmentCount / data.maxCapacity) * 100)
                  }}%</span
                >
              </div>
              <ProgressBar
                :value="(data.enrollmentCount / data.maxCapacity) * 100"
                :show-value="false"
                style="height: 8px"
              />
            </div>
          </template>
        </Column>

        <Column header="狀態">
          <template #body="{ data }">
            <Tag
              :value="getStatusLabel(data.status)"
              :severity="getStatusSeverity(data.status)"
              class="text-base px-3 py-1"
            />
          </template>
        </Column>

        <Column header="操作" class="w-24 text-base">
          <template #body="{ data }">
            <div class="flex gap-2">
              <NuxtLink :to="`/dashboard/courses/classes/${data.id}`">
                <Button
                  icon="pi pi-arrow-right"
                  text
                  rounded
                  v-tooltip.top="'進入管理'"
                />
              </NuxtLink>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </BasePageContainer>
</template>

<style scoped>
:deep(.p-datatable-header) {
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}
</style>
