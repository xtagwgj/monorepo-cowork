<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ payload: Record<string, unknown> }>();
const items = computed(() => (props.payload.items as Array<{ id: string; done: boolean; text: string }>) ?? []);
</script>

<template>
  <article class="card todo-card">
    <h4>{{ payload.title }}</h4>
    <ul>
      <li v-for="item in items" :key="item.id">
        <input type="checkbox" :checked="item.done" disabled />
        <span>{{ item.text }}</span>
      </li>
    </ul>
  </article>
</template>

<style scoped>
.card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; }
h4 { margin: 0 0 8px; }
ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 6px; }
li { display: flex; gap: 8px; align-items: center; }
</style>
