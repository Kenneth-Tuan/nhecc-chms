<script setup>
import {
  dailyVerse,
  quickActions,
  todaysTasks,
  churchNews,
  announcements,
} from "@/data/home.data.ts";

const seeAllNews = () => {
  navigateTo({ id: "news" });
};

const navigateTo = (navItem) => {
  console.log("Navigate to:", navItem.id);
};

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
});

onUnmounted(() => {
  window.removeEventListener("resize", checkScroll);
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <section class="px-4">
      <div class="relative w-full overflow-hidden rounded-md shadow-xl group">
        <div
          class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10"
        ></div>
        <div
          class="h-52 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          :style="{ backgroundImage: `url(${dailyVerse.image})` }"
        ></div>
        <div class="absolute bottom-0 left-0 right-0 p-6 z-20">
          <div class="flex items-center gap-2 mb-2">
            <i class="pi pi-comment" un-text="primary" un-font="bold" />
            <span
              class="text-white/90 text-xs font-bold uppercase tracking-widest"
              >Daily Verse</span
            >
          </div>
          <p class="text-white text-2xl font-bold leading-snug mb-1">
            {{ dailyVerse.fullText }}
          </p>
          <p class="text-primary text-base font-semibold mt-2">
            {{ dailyVerse.reference }}
          </p>
        </div>
      </div>
    </section>

    <!-- Announcements -->
    <section class="px-4">
      <div class="flex items-center justify-between mb-5 px-1">
        <h2 class="text-2xl font-bold tracking-tight">Announcements</h2>
        <Button label="View All" variant="text" un-font="bold" />
      </div>
      <div class="flex flex-col gap-6">
        <Panel
          v-for="ann in announcements"
          :key="ann.id"
          :pt="{
            root: {
              class: [
                'border-none',
                'shadow-md overflow-hidden',
                'dark:bg-surface-800',
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
          }"
        >
          <template #header>
            <div class="flex flex-row justify-between items-center flex-gap-2">
              <i
                v-if="ann.isPinned"
                class="pi pi-thumbtack text-primary dark:text-primary-300 font-bold"
              ></i>

              <div class="text-lg font-bold leading-tight">
                {{ ann.title }}
              </div>
            </div>
          </template>
          <template #footer>
            <div class="flex flex-row justify-between items-center">
              <div class="flex items-center gap-2">
                <i class="pi pi-clock text-xs text-surface-400"></i>
                <span class="text-xs font-medium text-surface-400">{{
                  ann.date
                }}</span>
              </div>

              <Button label="More" rounded text size="small" />
            </div>
          </template>
          <template #icons> </template>
          <p class="m-0 leading-relaxed line-clamp-2 text-surface-500">
            {{ ann.content }}
          </p>
        </Panel>
      </div>
    </section>

    <!-- Church News -->
    <section class="px-4">
      <div class="flex items-center justify-between mb-5 px-1">
        <h2 class="text-2xl font-bold tracking-tight">Church News</h2>
        <Button
          label="See All"
          variant="text"
          un-font="bold"
          @click="seeAllNews"
        />
      </div>
      <div class="relative group">
        <Button
          icon="pi pi-chevron-left"
          rounded
          outlined
          class="!absolute left--2 top-1/2 -translate-y-1/2 z-20 bg-surface-0/90 dark:bg-surface-800/90 backdrop-blur-sm !w-10 !h-10 !p-0 shadow-lg border-surface-200 dark:border-surface-700 text-primary"
          :disabled="!canScrollLeft"
          @click="scroll('left')"
          aria-label="Scroll Left"
        />

        <div
          ref="churchNewsContainer"
          class="flex overflow-x-auto mb-6 pb-4 gap-4 no-scrollbar snap-x snap-mandatory scroll-smooth px-2 md:px-12"
          @scroll="checkScroll"
        >
          <div
            v-for="news in churchNews"
            :key="news.id"
            class="snap-start shrink-0 w-72 rounded-xl bg-surface-0 dark:bg-surface-800 shadow-md overflow-hidden flex flex-col relative border-none"
          >
            <div
              class="h-32 bg-cover bg-center"
              :style="{ backgroundImage: `url(${news.image})` }"
            ></div>
            <div class="p-4 flex-1 flex flex-col justify-center">
              <p
                class="text-xs text-primary font-bold uppercase mb-1 tracking-wider"
              >
                {{ news.category }}
              </p>
              <h3 class="font-bold text-lg">
                {{ news.title }}
              </h3>
            </div>
          </div>
        </div>

        <Button
          icon="pi pi-chevron-right"
          rounded
          outlined
          class="!absolute right--2 top-1/2 -translate-y-1/2 z-20 bg-surface-0/90 dark:bg-surface-800/90 backdrop-blur-sm !w-10 !h-10 !p-0 shadow-lg border-surface-200 dark:border-surface-700 text-primary"
          :disabled="!canScrollRight"
          @click="scroll('right')"
          aria-label="Scroll Right"
        />
      </div>
    </section>
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
