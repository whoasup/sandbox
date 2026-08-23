import { readonly, ref } from 'vue';
import type { UiTheme } from '../types';

const STORAGE_KEY = 'ui-kit-theme';

const theme = ref<UiTheme>('light');

function applyTheme(next: UiTheme) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset['theme'] = next;
}

/**
 * Single source of truth for the active theme. State is module level on purpose:
 * every caller shares the same ref, so a toggle anywhere updates the whole app.
 */
export function useTheme() {
  function setTheme(next: UiTheme) {
    theme.value = next;
    applyTheme(next);
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, next);
  }

  function toggleTheme() {
    setTheme(theme.value === 'light' ? 'dark' : 'light');
  }

  /** Call from a client-only hook: reads the persisted or system preference. */
  function initTheme(fallback: UiTheme = 'light') {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(STORAGE_KEY) as UiTheme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(stored ?? (prefersDark ? 'dark' : fallback));
  }

  return {
    theme: readonly(theme),
    setTheme,
    toggleTheme,
    initTheme,
  };
}
