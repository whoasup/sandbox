<script setup lang="ts">
import { createThemeContext } from '@sandbox/ui-kit';

// Provided once, here at the app root, so every descendant (the theme
// switcher in `EditorToolbar`, and anything else in the future) can read
// and change the current theme via `useTheme()`.
createThemeContext();
</script>

<template>
  <div class="min-h-screen">
    <NuxtPage />
  </div>
</template>
