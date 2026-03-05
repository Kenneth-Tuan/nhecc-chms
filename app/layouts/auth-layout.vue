<template>
  <div
    :class="[
      'flex items-center justify-center',
      'w-full h-dvh',
      'overflow-hidden',
      'bg-slate-50 dark:bg-slate-950',
      'transition-colors duration-300',
    ]"
  >
    <slot />
  </div>
</template>
