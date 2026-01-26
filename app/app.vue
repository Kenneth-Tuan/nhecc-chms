<script setup>
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
</template>
