import type { ComputedRef, InjectionKey, Ref } from 'vue';
import { computed, inject, onMounted, onScopeDispose, provide, ref, watch } from 'vue';

/** The user's stored choice: an explicit theme, or `'system'` to follow the OS setting. */
export type ThemePreference = 'light' | 'dark' | 'system';
/** What's actually applied to `[data-theme]` once `'system'` has been resolved. */
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContext {
  preference: Ref<ThemePreference>;
  resolvedTheme: ComputedRef<ResolvedTheme>;
  setTheme: (preference: ThemePreference) => void;
}

const THEME_KEY: InjectionKey<ThemeContext> = Symbol('theme');

/**
 * `localStorage` key + `prefers-color-scheme` query. Keep these in sync
 * with the inline no-flash boot script registered in the app's
 * `nuxt.config.ts` (`app.head.script`), which resolves the theme the same
 * way before Vue ever hydrates.
 */
const STORAGE_KEY = 'ui-theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    // localStorage can throw in privacy mode / when disabled by the browser.
    return 'system';
  }
}

function writeStoredPreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Preference just won't persist across reloads.
  }
}

function applyToDocument(theme: ResolvedTheme): void {
  document.documentElement.setAttribute('data-theme', theme);
}

/**
 * Creates the shared theme state and makes it available to descendants via
 * `provide`. Call once, from the app root — mirrors the
 * `createEditorDocumentContext()` / `useEditorDocument()` pattern used
 * elsewhere in this codebase, which keeps this SSR-safe: a module-level
 * singleton would leak one request's resolved theme into another's
 * response, whereas `provide`/`inject` state is freshly created per render.
 */
export function createThemeContext(): ThemeContext {
  // SSR-safe default. The inline boot script (`nuxt.config.ts`) has already
  // set the correct `data-theme` on `<html>` before this ever paints
  // client-side, so this default only matters for the (non-visual) server
  // render, until `onMounted` below syncs from `localStorage`/`matchMedia`.
  const preference = ref<ThemePreference>('system');
  const systemPrefersDark = ref(false);

  const resolvedTheme = computed<ResolvedTheme>(() =>
    preference.value === 'system' ? (systemPrefersDark.value ? 'dark' : 'light') : preference.value,
  );

  watch(resolvedTheme, (theme) => applyToDocument(theme));

  function setTheme(next: ThemePreference): void {
    preference.value = next;
    writeStoredPreference(next);
  }

  onMounted(() => {
    preference.value = readStoredPreference();

    const media = window.matchMedia(DARK_QUERY);
    systemPrefersDark.value = media.matches;

    const onChange = (event: MediaQueryListEvent): void => {
      systemPrefersDark.value = event.matches;
    };
    media.addEventListener('change', onChange);
    onScopeDispose(() => media.removeEventListener('change', onChange));
  });

  const context: ThemeContext = { preference, resolvedTheme, setTheme };
  provide(THEME_KEY, context);
  return context;
}

/** Reads the theme context created by `createThemeContext()` higher up the tree. */
export function useTheme(): ThemeContext {
  const context = inject(THEME_KEY);
  if (!context) {
    throw new Error(
      'useTheme() must be called within a component tree started by createThemeContext()',
    );
  }
  return context;
}
