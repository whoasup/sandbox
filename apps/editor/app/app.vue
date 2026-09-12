<script setup lang="ts">
import { createThemeContext } from '@sandbox/ui-kit';

// Provided once at the app root so the shell sidebar (and every page)
// can read/change theme via `useTheme()`. Editor document context is
// *not* created here — only on `/editor/:projectId`.
createThemeContext();
</script>

<template>
  <div class="h-full min-h-screen">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
