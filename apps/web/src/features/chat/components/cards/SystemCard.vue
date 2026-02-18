<script setup lang="ts">
defineProps<{ payload: Record<string, unknown> }>();
</script>

<template>
  <article class="card system-card">
    <strong>[{{ payload.level }}]</strong>
    <span>{{ payload.content }}</span>
  </article>
</template>

<style scoped>
.card { background: #fff7ed; border: 1px solid #fdba74; border-radius: 12px; padding: 12px; display: flex; gap: 8px; align-items: baseline; }
</style>
