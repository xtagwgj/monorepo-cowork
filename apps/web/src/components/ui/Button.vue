<script setup lang="ts">
defineProps<{
  text: string;
}>();
</script>

<template>
  <button class="btn">{{ text }}</button>
</template>

<style scoped>
.btn {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  padding: 8px 12px;
}
</style>
