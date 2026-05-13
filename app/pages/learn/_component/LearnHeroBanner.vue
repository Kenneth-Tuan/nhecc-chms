<script setup lang="ts">
interface HeroStat {
  label: string;
  value?: string | number;
  icon?: string;
  iconClass?: string;
}

withDefaults(
  defineProps<{
    eyebrow?: string;
    title: string;
    subtitle?: string;
    description?: string;
    stats?: HeroStat[];
    statsLayout?: "metric" | "info";
  }>(),
  {
    eyebrow: "LEARNING HUB",
    subtitle: "",
    description: "",
    stats: () => [],
    statsLayout: "metric",
  }
);
</script>

<template>
  <section
    class="relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white px-5 py-6 text-slate-950 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:shadow-2xl md:px-10 md:py-10"
  >
    <div
      class="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-blue-100/80 blur-3xl dark:bg-blue-500/30"
    />
    <div
      class="absolute -bottom-16 left-8 h-36 w-36 rounded-full bg-emerald-100/80 blur-2xl dark:bg-emerald-400/20"
    />
    <div
      class="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-white/40"
    />

    <div
      class="relative z-10 flex flex-col gap-7 md:flex-row md:items-end md:justify-between"
    >
      <div class="min-w-0">
        <slot name="eyebrow">
          <p
            class="mb-3 text-xs font-black tracking-[0.32em] text-blue-600 dark:text-blue-200"
          >
            {{ eyebrow }}
          </p>
        </slot>

        <h1 class="text-4xl font-black tracking-tight md:text-6xl">
          {{ title }}
        </h1>
        <p
          v-if="subtitle"
          class="mt-3 text-lg font-bold text-slate-500 dark:text-slate-300"
        >
          {{ subtitle }}
        </p>
        <p
          v-if="description"
          class="mt-3 max-w-xl text-base font-semibold leading-relaxed text-slate-500 dark:text-slate-300 md:text-lg"
        >
          {{ description }}
        </p>
      </div>

      <div
        v-if="stats.length > 0"
        class="grid gap-3 md:min-w-80"
        :class="statsLayout === 'info' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-3'"
      >
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="rounded-2xl border border-slate-100 bg-slate-50 p-4 backdrop-blur dark:border-white/10 dark:bg-white/10"
        >
          <div v-if="stat.value === undefined" class="flex items-center gap-2">
            <i v-if="stat.icon" :class="[stat.icon, stat.iconClass]" />
            <p class="min-w-0 break-words text-sm font-bold text-slate-500 dark:text-slate-300">
              {{ stat.label }}
            </p>
          </div>
          <template v-else>
            <p class="text-2xl font-black">{{ stat.value }}</p>
            <p class="text-xs font-bold text-slate-500 dark:text-slate-300">
              {{ stat.label }}
            </p>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>
