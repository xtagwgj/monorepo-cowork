<script setup lang="ts">
import DesktopShell from "@/components/desktop/DesktopShell.vue";
import { provideDesktopI18n } from "@/composables/useI18n";

provideDesktopI18n();
</script>

<template>
  <main class="app-shell">
    <DesktopShell />
  </main>
</template>

<style scoped>
.app-shell {
  width: min(1120px, calc(100vw - 2rem));
}
</style>
