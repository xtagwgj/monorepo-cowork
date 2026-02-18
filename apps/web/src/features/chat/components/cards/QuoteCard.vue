<script setup lang="ts">
defineProps<{ payload: Record<string, unknown> }>();
</script>

<template>
  <article class="card quote-card">
    <blockquote>{{ payload.quote }}</blockquote>
    <small>- {{ payload.author }}</small>
  </article>
</template>

<style scoped>
.card { background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 12px; padding: 12px; }
blockquote { margin: 0 0 8px; line-height: 1.5; }
</style>
