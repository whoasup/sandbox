<script setup lang="ts">
import AppSidebar from '../components/AppSidebar.vue';
</script>

<template>
  <div class="flex h-screen bg-surface-sunken">
    <AppSidebar />
    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <slot />
    </div>
  </div>
</template>
