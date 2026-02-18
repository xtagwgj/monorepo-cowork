<script setup lang="ts">
defineProps<{ payload: Record<string, unknown> }>();
</script>

<template>
  <article class="card text-card">
    <h4>{{ payload.title }}</h4>
    <p>{{ payload.body }}</p>
  </article>
</template>

<style scoped>
.card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; }
h4 { margin: 0 0 8px; }
p { margin: 0; line-height: 1.45; }
</style>
