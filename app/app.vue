<script setup>
const { isLoading } = useGlobalLoading();

useHead({
  meta: [
    { charset: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { key: "theme-color", name: "theme-color", content: "#e57f4f" },
  ],
  link: [{ rel: "icon", href: "/NHECC_ICON-01.png" }],
  htmlAttrs: {
    lang: "zh_tw",
  },
  viewport:
    "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
});

useSeoMeta({
  titleTemplate: "NHECC-ChMS",
  ogImage: "/NHECC_ICON-01.png",
  twitterImage: "/NHECC_ICON-01.png",
  twitterCard: "summary_large_image",
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <!-- 避免使用 watch：使用 v-if 在開啟時進行渲染，動態拉取隨機經文與 Lottie -->
  <Transition name="fade">
    <AppGlobalLoading v-if="isLoading" />
  </Transition>

  <!-- Toast 設定：手機版置中 (方便閱讀)，桌機版保持右下 -->
  <Toast
    :position="
      $viewport && $viewport.isLessThan('sm') ? 'top-center' : 'top-right'
    "
    class="!max-w-[calc(100vw-2rem)]"
  />
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
