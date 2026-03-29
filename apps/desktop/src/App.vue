<script setup lang="ts">
import DesktopShell from "@/components/desktop/DesktopShell.vue";
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
