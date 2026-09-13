import { onMounted, onUnmounted, ref } from 'vue';

/** Tailwind `lg` — persistent sidebar / dual editor panels. */
export const LG_MEDIA = '(min-width: 1024px)';

export function useViewportLg() {
  const isLgLayout = ref(false);
  let unsub: (() => void) | null = null;

  onMounted(() => {
    if (!import.meta.client) return;
    const mq = window.matchMedia(LG_MEDIA);
    const sync = (): void => {
      isLgLayout.value = mq.matches;
    };
    sync();
    mq.addEventListener('change', sync);
    unsub = () => mq.removeEventListener('change', sync);
  });

  onUnmounted(() => {
    unsub?.();
  });

  return { isLgLayout };
}
