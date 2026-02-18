<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from "vue";

const props = defineProps<{ itemId: string }>();
const emit = defineEmits<{ resize: [itemId: string, height: number] }>();
const rowRef = useTemplateRef<HTMLDivElement>("rowRef");

let observer: ResizeObserver | null = null;

onMounted(() => {
  if (!rowRef.value) return;
  observer = new ResizeObserver(() => {
    if (!rowRef.value) return;
    emit("resize", props.itemId, rowRef.value.offsetHeight);
  });
  observer.observe(rowRef.value);
  emit("resize", props.itemId, rowRef.value.offsetHeight);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
});
</script>

<template>
  <div ref="rowRef">
    <slot />
  </div>
</template>
