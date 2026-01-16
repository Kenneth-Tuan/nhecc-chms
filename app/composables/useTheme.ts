// app/composables/useTheme.ts
import { useDark, useToggle } from "@vueuse/core";

export const useTheme = () => {
  const isDark = useDark();
  const toggle = useToggle(isDark);

  /**
   * 帶有 View Transition 圓形擴散效果的切換函數
   */

  const startViewTransition = (event: MouseEvent) => {
    if (!import.meta.client || !document.startViewTransition) {
      toggle();
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      toggle();
    });

    transition.ready.then(() => {
      const duration = 600;
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: duration,
          easing: "cubic-bezier(.76,.32,.29,.99)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  return {
    isDark,
    startViewTransition,
  };
};
