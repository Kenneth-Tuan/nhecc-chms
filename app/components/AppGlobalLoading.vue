<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import lottie from "lottie-web";
import { loadingVerses } from "~/utils/constants";

const lottieContainer = ref<HTMLElement | null>(null);
const currentVerse = ref<string>("");

let animation: any = null;

onMounted(() => {
  // 隨機選擇經文與對應動畫
  const randomIndex = Math.floor(Math.random() * loadingVerses.length);
  const selectedTheme = loadingVerses[randomIndex];

  if (!selectedTheme) return;

  currentVerse.value = selectedTheme.text;

  // 初始化 Lottie 動畫
  if (lottieContainer.value) {
    animation = lottie.loadAnimation({
      container: lottieContainer.value,
      renderer: "svg", // 使用 SVG 渲染效能好
      loop: true,
      autoplay: true,
      path: selectedTheme.lottie, // 根據經文載入對應動畫
    });
  }
});

onUnmounted(() => {
  if (animation) {
    animation.destroy();
    animation = null;
  }
});
</script>

<template>
  <div
    class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
  >
    <div class="flex flex-col items-center max-w-lg w-full p-6 text-center">
      <!-- Lottie 動畫容器 -->
      <div ref="lottieContainer" class="w-[200px] h-[200px] mb-6"></div>

      <!-- 隨機經文顯示：照顧大齡使用者，字體大小至少 18px -->
      <p
        class="text-white text-[18px] md:text-[22px] font-medium leading-[1.6] tracking-wide px-4 drop-shadow-md"
      >
        {{ currentVerse }}
      </p>
    </div>
  </div>
</template>
