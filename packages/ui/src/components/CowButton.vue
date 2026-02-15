<script setup lang="ts">
defineProps<{
  label: string;
}>();
</script>

<template>
  <button class="cow-btn">{{ label }}</button>
</template>

<style scoped>
.cow-btn {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  padding: 8px 16px;
  cursor: pointer;
}
</style>
