<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { UiText, UiThemeSwitcher } from '@sandbox/ui-kit';
import { readLastProjectId } from '../composables/useProjects';

const props = withDefaults(
  defineProps<{
    /** When true, used as the mobile overlay drawer (not the lg+ rail). */
    drawer?: boolean;
  }>(),
  { drawer: false },
);

const emit = defineEmits<{
  navigate: [];
}>();

const route = useRoute();

const themeLabels = { light: 'Светлая', dark: 'Тёмная', system: 'Системная' };

const editorHref = ref('/');

onMounted(() => {
  const lastId = readLastProjectId();
  editorHref.value = lastId ? `/editor/${lastId}` : '/';
});

const navItems = computed(() => [
  { to: '/', label: 'Проекты', match: (path: string) => path === '/' },
  {
    to: editorHref.value,
    label: 'Редактор',
    match: (path: string) => path.startsWith('/editor'),
  },
  {
    to: '/docs',
    label: 'Документация',
    match: (path: string) => path.startsWith('/docs'),
  },
]);

const activePath = computed(() => route.path);

function onNavClick(): void {
  if (props.drawer) emit('navigate');
}
</script>

<template>
  <aside
    :id="drawer ? 'app-nav-drawer' : undefined"
    class="app-sidebar flex w-56 max-w-[min(16rem,85vw)] shrink-0 flex-col border-r border-border bg-surface"
    :class="drawer ? 'h-full shadow-lg' : ''"
    :data-testid="drawer ? 'app-nav-drawer' : 'app-sidebar'"
  >
    <div class="border-b border-border px-4 py-4">
      <UiText size="lg" weight="bold" as="p">Sandbox</UiText>
      <UiText size="xs" tone="muted" as="p">Планировщик комнат</UiText>
    </div>

    <nav class="flex flex-1 flex-col gap-1 p-3" aria-label="Основная навигация">
      <NuxtLink
        v-for="item in navItems"
        :key="item.label"
        :to="item.to"
        class="min-h-11 rounded-md px-3 py-2 text-sm font-medium text-text no-underline transition-colors hover:bg-surface-raised"
        :class="
          item.match(activePath) ? 'bg-primary text-text-on-primary hover:bg-primary-hover' : ''
        "
        :aria-current="item.match(activePath) ? 'page' : undefined"
        @click="onNavClick"
      >
        {{ item.label }}
      </NuxtLink>
    </nav>

    <div class="border-t border-border p-3">
      <UiText size="xs" tone="muted" as="p" class="mb-2">Тема</UiText>
      <UiThemeSwitcher size="sm" :labels="themeLabels" />
    </div>
  </aside>
</template>
