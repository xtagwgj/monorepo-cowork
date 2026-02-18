<script setup lang="ts">
import { computed } from "vue";
import type { ChatMessage } from "../types";
import TextCard from "./cards/TextCard.vue";
import ImageCard from "./cards/ImageCard.vue";
import FileCard from "./cards/FileCard.vue";
import SystemCard from "./cards/SystemCard.vue";
import TodoCard from "./cards/TodoCard.vue";
import QuoteCard from "./cards/QuoteCard.vue";

const props = defineProps<{ item: ChatMessage }>();

const componentMap = {
  text: TextCard,
  image: ImageCard,
  file: FileCard,
  system: SystemCard,
  todo: TodoCard,
  quote: QuoteCard
} as const;

const cardComponent = computed(() => componentMap[props.item.type] ?? TextCard);
</script>

<template>
  <div class="host">
    <component :is="cardComponent" :payload="item.payload" />
  </div>
</template>

<style scoped>
.host { width: 100%; }
</style>
