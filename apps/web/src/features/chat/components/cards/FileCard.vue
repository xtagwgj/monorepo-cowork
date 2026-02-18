<script setup lang="ts">
defineProps<{ payload: Record<string, unknown> }>();
</script>

<template>
  <article class="card file-card">
    <h4>{{ payload.fileName }}</h4>
    <p>size: {{ payload.size }}</p>
    <p>{{ payload.desc }}</p>
  </article>
</template>

<style scoped>
.card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; }
h4, p { margin: 0 0 6px; }
</style>
