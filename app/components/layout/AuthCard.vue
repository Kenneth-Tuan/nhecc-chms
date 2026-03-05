<template>
  <div
    :class="[
      //   'auth-card',
      'relative overflow-hidden',
      'flex flex-col',
      'w-full max-w-xl',
      'bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm',
      'rounded-3xl',
      'shadow-2xl',
    ]"
  >
    <div class="relative z-10 w-full">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.auth-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("~/assets/icons/NHECC_ICON-01.png");
  background-position: center;
  background-repeat: no-repeat;
  background-size: 400px;
  filter: blur(2px);
  transform: scale(1.5);
  opacity: 0.15;
  pointer-events: none;
  z-index: 0;
}

:deep(.dark) .auth-card::before {
  opacity: 0.2;
}
</style>
