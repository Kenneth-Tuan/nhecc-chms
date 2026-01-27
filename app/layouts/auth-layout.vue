<template>
  <div
    :class="[
      'flex items-center justify-center',
      'p-0 sm:p-4',
      'min-h-screen',
      'bg-slate-50 dark:bg-slate-950',
      'transition-colors duration-300',
    ]"
  >
    <slot />
  </div>
</template>
