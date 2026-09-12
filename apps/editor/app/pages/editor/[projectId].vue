<script setup lang="ts">
/**
 * Client-only editor page: document context uses provide/inject and must not
 * run during SSR. ClientOnly + ssr:false keep the workspace off the server.
 */
definePageMeta({
  ssr: false,
});
</script>

<template>
  <div class="flex h-full min-h-0 flex-col" data-testid="editor-route-shell">
    <ClientOnly>
      <EditorWorkspace />
      <template #fallback>
        <div
          class="flex flex-1 items-center justify-center text-text-muted"
          data-testid="editor-booting"
        >
          Загрузка редактора…
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
