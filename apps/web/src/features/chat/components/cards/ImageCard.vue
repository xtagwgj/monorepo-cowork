<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ payload: Record<string, unknown> }>();
const ratio = computed(() => Number(props.payload.ratio ?? 0.7));
</script>

<template>
  <article class="card image-card">
    <h4>{{ payload.title }}</h4>
    <div class="ph" :style="{ paddingTop: `${Math.max(30, ratio * 100)}%` }">image placeholder</div>
    <p>{{ payload.caption }}</p>
  </article>
</template>

<style scoped>
.card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; }
h4, p { margin: 0 0 8px; }
.ph { border-radius: 10px; background: linear-gradient(135deg, #e2e8f0, #cbd5e1); display: grid; place-items: center; color: #334155; font-size: 12px; margin-bottom: 8px; }
</style>
