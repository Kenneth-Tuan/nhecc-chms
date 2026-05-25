<script setup>
import { useRoute } from "vue-router";
import { useToast } from "primevue/usetoast";
import {
  dailyVerse,
  quickActions,
  todaysTasks,
  churchNews as staticChurchNews,
  announcements,
} from "@/data/home.data.ts";

const seeAllNews = () => {
  navigateTo({ id: "news" });
};

// 獲取最新動態消息，若無資料則 Fallback 到靜態 mock 資料
const { data: dynamicNews } = await useFetch("/api/church-news/latest");

// 預設卡片圖，以防爬下來的活動沒有附圖
const defaultNewsImage = "https://images.unsplash.com/photo-1438029071396-1e831a7fa5d8?w=500&auto=format&fit=crop&q=60";

const isNewsDialogVisible = ref(false);
const selectedNews = ref(null);

const showNewsDetail = (news) => {
  selectedNews.value = news;
  isNewsDialogVisible.value = true;
};

const churchNews = computed(() => {
  if (dynamicNews.value && dynamicNews.value.length > 0) {
    return dynamicNews.value.map((item, index) => ({
      id: index + 1,
      title: item.title,
      category: "最新消息",
      image: item.imageUrl || defaultNewsImage,
      signUpUrl: item.signUpUrl,
      contentHtml: item.contentHtml,
    }));
  }
  return staticChurchNews.map((item) => ({
    ...item,
    contentHtml: `<p><strong>${item.title}</strong> 的詳細介紹內容正在準備中，請密切關注教會官網更新。</p>`,
  }));
});

const openSignUp = (url) => {
  if (url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }
};

const navigateToPlace = (navItem) => {
  console.log("Navigate to:", navItem.id);
};

const route = useRoute();
const toast = useToast();

// Scroll Logic for Church News
const churchNewsContainer = ref(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(true);

const checkScroll = () => {
  const el = churchNewsContainer.value;
  if (el) {
    const tolerance = 1;
    canScrollLeft.value = el.scrollLeft > tolerance;
    canScrollRight.value =
      el.scrollLeft + el.clientWidth < el.scrollWidth - tolerance;
  }
};

const scroll = (direction) => {
  const el = churchNewsContainer.value;
  if (el) {
    const scrollAmount = el.clientWidth * 0.8;
    const targetScroll =
      direction === "left"
        ? el.scrollLeft - scrollAmount
        : el.scrollLeft + scrollAmount;

    el.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  }
};

onMounted(() => {
  checkScroll();
  window.addEventListener("resize", checkScroll);

  if (route.query.error === "unauthorized") {
    toast.add({
      severity: "warn",
      summary: "無權限限制",
      detail: "您沒有管理者權限，無法存取該頁面。",
      life: 4000,
    });
    // Remove the query param
    const newQuery = { ...route.query };
    delete newQuery.error;
    navigateTo({ path: route.path, query: newQuery }, { replace: true });
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", checkScroll);
});
</script>

<template>
  <div :class="[
    'flex flex-col gap-6', // layout
  ]">
    <section>
      <div :class="[
        'relative overflow-hidden group', // position
        'w-full', // scaling
        'rounded-md', // border
        'shadow-xl', // shadow
      ]">
        <div :class="[
          'absolute inset-0 z-10', // position
          'bg-gradient-to-t from-black/90 via-black/40 to-transparent', // colors
        ]"></div>
        <div :class="[
          'h-52', // scaling
          'bg-cover bg-center', // etc
          'transition-transform duration-700 group-hover:scale-105', // animation
        ]" :style="{ backgroundImage: `url(${dailyVerse.image})` }"></div>
        <div :class="[
          'absolute bottom-0 left-0 right-0 z-20', // position
          'p-6', // spacing
        ]">
          <div :class="[
            'flex items-center gap-2', // layout
            'mb-2', // spacing
          ]">
            <i class="pi pi-comment" un-text="primary" un-font="bold" />
            <span :class="[
              'text-xs font-bold uppercase tracking-widest', // font
              'text-white/90', // colors
            ]">Daily Verse</span>
          </div>
          <p :class="[
            'text-2xl font-bold leading-snug', // font
            'mb-1', // spacing
            'text-white', // colors
          ]">
            {{ dailyVerse.fullText }}
          </p>
          <p :class="[
            'text-base font-semibold', // font
            'mt-2', // spacing
            'text-primary', // colors
          ]">
            {{ dailyVerse.reference }}
          </p>
        </div>
      </div>
    </section>

    <!-- Announcements -->
    <section v-show="false">
      <div :class="[
        'flex items-center justify-between', // layout
        'mb-5 px-1', // spacing
      ]">
        <h2 :class="[
          'text-2xl font-bold tracking-tight', // font
        ]">
          Announcements
        </h2>
        <Button label="View All" variant="text" un-font="bold" />
      </div>
      <div :class="[
        'flex flex-col gap-6', // layout
      ]">
        <Panel v-for="ann in announcements" :key="ann.id" :pt="{
          root: {
            class: [
              'overflow-hidden', // position
              'transition-shadow duration-300', // animation
              'border-none', // border
              'shadow-md hover:shadow-lg', // shadow
              'dark:bg-surface-800', // etc
            ],
          },
          header: {
            class: [
              'border-none',
              ann.isPinned
                ? 'bg-primary-100 dark:bg-primary-800'
                : 'bg-surface-50 dark:bg-surface-700',
            ],
          },
          content: {
            class: ['pt-2'],
          },
        }">
          <template #header>
            <div :class="[
              'flex flex-row justify-between items-center flex-gap-2', // layout
            ]">
              <i v-if="ann.isPinned" :class="[
                'pi pi-thumbtack', // etc
                'font-bold', // font
                'text-primary dark:text-primary-300', // colors
              ]"></i>

              <div :class="[
                'text-lg font-bold leading-tight', // font
              ]">
                {{ ann.title }}
              </div>
            </div>
          </template>
          <template #footer>
            <div :class="[
              'flex flex-row justify-between items-center', // layout
            ]">
              <div :class="[
                'flex items-center gap-2', // layout
              ]">
                <i :class="[
                  'pi pi-clock', // etc
                  'text-xs', // font
                  'text-surface-400', // colors
                ]"></i>
                <span :class="[
                  'text-xs font-medium', // font
                  'text-surface-400', // colors
                ]">{{ ann.date }}</span>
              </div>

              <Button label="More" rounded text size="small" />
            </div>
          </template>
          <template #icons> </template>
          <p :class="[
            'text-surface-500', // font/color
            'm-0 leading-relaxed line-clamp-2', // spacing/etc
          ]">
            {{ ann.content }}
          </p>
        </Panel>
      </div>
    </section>

    <!-- Church News -->
    <section>
      <div :class="[
        'flex items-center justify-between', // layout
        'mb-5 px-1', // spacing
      ]">
        <h2 :class="[
          'text-2xl font-bold tracking-tight', // font
        ]">
          最新消息
        </h2>
        <Button v-show="false" label="See All" variant="text" un-font="bold" @click="seeAllNews" />
      </div>
      <div :class="[
        'relative group', // position
      ]">
        <Button icon="pi pi-chevron-left" rounded outlined :class="[
          '!absolute left--2 top-1/2 -translate-y-1/2 z-20', // position
          '!p-0', // spacing
          '!w-10 !h-10', // scaling
          'bg-surface-0/90 dark:bg-surface-800/90 backdrop-blur-sm', // colors
          'border-surface-200 dark:border-surface-700', // border
          'shadow-lg', // shadow
          'text-primary', // etc
        ]" :disabled="!canScrollLeft" @click="scroll('left')" aria-label="Scroll Left" />

        <div ref="churchNewsContainer" :class="[
          'flex overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth', // layout
          'mb-6 pb-4 px-2 md:px-12 gap-4', // spacing
        ]" @scroll="checkScroll">
          <div v-for="news in churchNews" :key="news.id" :class="[
            'flex flex-col snap-start shrink-0 relative overflow-hidden', // layout/position
            'w-72', // scaling
            'bg-surface-0 dark:bg-surface-800', // colors
            'rounded-xl border-none', // border
            'shadow-md cursor-pointer', // shadow
            'hover:shadow-lg hover:translate-y--1 transition-all duration-300', // hover effects
          ]" @click="showNewsDetail(news)">
            <div :class="[
              'h-32', // scaling
              'bg-cover bg-center', // etc
            ]" :style="{ backgroundImage: `url(${news.image})` }"></div>
            <div :class="[
              'flex-1 flex flex-col justify-between', // layout
              'p-4 gap-3', // spacing
            ]">
              <div>
                <p :class="[
                  'text-xs font-bold uppercase tracking-wider', // font
                  'mb-1', // spacing
                  'text-primary', // colors
                ]">
                  {{ news.category }}
                </p>
                <h3 :class="[
                  'font-bold text-lg line-clamp-2', // font
                ]">
                  {{ news.title }}
                </h3>
              </div>
              <Button v-if="news.signUpUrl" label="線上報名" icon="pi pi-external-link" iconPos="right"
                class="w-full text-sm font-semibold !py-2" @click.stop="openSignUp(news.signUpUrl)" />
            </div>
          </div>
        </div>

        <Button icon="pi pi-chevron-right" rounded outlined :class="[
          '!absolute right--2 top-1/2 -translate-y-1/2 z-20', // position
          '!p-0', // spacing
          '!w-10 !h-10', // scaling
          'bg-surface-0/90 dark:bg-surface-800/90 backdrop-blur-sm', // colors
          'border-surface-200 dark:border-surface-700', // border
          'shadow-lg', // shadow
          'text-primary', // etc
        ]" :disabled="!canScrollRight" @click="scroll('right')" aria-label="Scroll Right" />
      </div>
    </section>

    <!-- 消息詳細內容對話框 -->
    <Dialog v-model:visible="isNewsDialogVisible" modal :header="selectedNews?.title || '消息詳情'"
      :style="{ width: '90vw', maxWidth: '560px' }" :pt="{
        root: {
          class: 'border-none rounded-2xl overflow-hidden shadow-2xl dark:bg-surface-900'
        },
        header: {
          class: 'bg-surface-0 dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800 p-5'
        },
        content: {
          class: 'p-0 dark:bg-surface-900'
        },
        footer: {
          class: 'bg-surface-50 dark:bg-surface-950 p-4 border-t border-surface-100 dark:border-surface-800 flex justify-end gap-3'
        }
      }">
      <div v-if="selectedNews" class="flex flex-col">
        <!-- 頂部大圖 -->
        <div
          class="w-full bg-surface-100 dark:bg-surface-800 flex justify-center items-center overflow-hidden border-b border-surface-100 dark:border-surface-800">
          <img :src="selectedNews.image" :alt="selectedNews.title" class="w-full h-auto max-h-[350px] object-contain" />
        </div>

        <!-- 內容區域 -->
        <div class="p-6 max-h-[50vh] flex flex-col gap-4">
          <!-- 消息分類標記 -->
          <div>
            <span
              class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-primary-50 dark:bg-primary-950 text-primary dark:text-primary-300">
              {{ selectedNews.category }}
            </span>
          </div>

          <!-- HTML 富文本內容 -->
          <div
            class="prose dark:prose-invert max-w-none text-surface-700 dark:text-surface-300 text-base leading-relaxed"
            v-html="selectedNews.contentHtml"></div>
        </div>
      </div>

      <!-- 底部操作列 -->
      <template #footer>
        <Button label="關閉" severity="secondary" outlined class="text-base font-semibold px-4 py-2"
          @click="isNewsDialogVisible = false" />
        <Button v-if="selectedNews?.signUpUrl" label="線上報名" icon="pi pi-external-link" iconPos="right"
          class="text-base font-semibold px-5 py-2" @click.stop="openSignUp(selectedNews.signUpUrl)" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 20px);
}
</style>
