<script setup lang="ts" generic="T extends { id: string }">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";
import MeasuredRow from "./MeasuredRow.vue";

const props = withDefaults(
  defineProps<{
    items: T[];
    overscan: number;
    estimatedItemHeight?: number;
    hasMoreTop?: boolean;
    loadingTop?: boolean;
    topLoadOffset?: number;
  }>(),
  {
    estimatedItemHeight: 120,
    hasMoreTop: false,
    loadingTop: false,
    topLoadOffset: 120
  }
);

const emit = defineEmits<{
  loadTop: [];
}>();

const scroller = useTemplateRef<HTMLDivElement>("scroller");
const heightMap = ref<Record<string, number>>({});
const viewportHeight = ref(640);
const scrollTop = ref(0);
const prependAnchor = ref<{ id: string; offset: number } | null>(null);

const offsets = computed(() => {
  const acc: number[] = [0];
  for (const item of props.items) {
    const h = heightMap.value[item.id] ?? props.estimatedItemHeight;
    acc.push(acc[acc.length - 1]! + h);
  }
  return acc;
});

const totalHeight = computed(() => offsets.value[offsets.value.length - 1] ?? 0);

function findStartByOffset(target: number): number {
  const arr = offsets.value;
  let left = 0;
  let right = props.items.length;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if ((arr[mid + 1] ?? 0) <= target) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  return Math.min(Math.max(left, 0), Math.max(0, props.items.length - 1));
}

const firstVisibleIndex = computed(() => {
  if (props.items.length === 0) return 0;
  return findStartByOffset(scrollTop.value);
});

const visibleCount = computed(() => {
  if (props.items.length === 0) return 0;
  let count = 0;
  let cursor = firstVisibleIndex.value;
  let covered = 0;
  while (cursor < props.items.length && covered < viewportHeight.value) {
    covered += heightMap.value[props.items[cursor]!.id] ?? props.estimatedItemHeight;
    cursor += 1;
    count += 1;
  }
  return Math.max(1, count);
});

const renderStart = computed(() => Math.max(0, firstVisibleIndex.value - props.overscan));
const renderEnd = computed(() => Math.min(props.items.length - 1, firstVisibleIndex.value + visibleCount.value + props.overscan));

const renderedItems = computed(() => props.items.slice(renderStart.value, renderEnd.value + 1));
const topPadding = computed(() => offsets.value[renderStart.value] ?? 0);
const bottomPadding = computed(() => {
  const endOffset = offsets.value[renderEnd.value + 1] ?? 0;
  return Math.max(0, totalHeight.value - endOffset);
});

function onScroll(): void {
  if (!scroller.value) return;
  scrollTop.value = scroller.value.scrollTop;
  if (scrollTop.value <= props.topLoadOffset && props.hasMoreTop && !props.loadingTop) {
    const anchorIndex = firstVisibleIndex.value;
    const anchorItem = props.items[anchorIndex];
    const anchorTop = offsets.value[anchorIndex] ?? 0;
    if (anchorItem) {
      prependAnchor.value = { id: anchorItem.id, offset: scrollTop.value - anchorTop };
    }
    emit("loadTop");
  }
}

function onResize(itemId: string, size: number): void {
  if (size <= 0) return;
  if (heightMap.value[itemId] === size) return;
  heightMap.value = { ...heightMap.value, [itemId]: size };
  if (prependAnchor.value && scroller.value) {
    const anchorIdx = props.items.findIndex((x) => x.id === prependAnchor.value?.id);
    if (anchorIdx >= 0) {
      const anchorOffsetTop = offsets.value[anchorIdx] ?? 0;
      scroller.value.scrollTop = anchorOffsetTop + prependAnchor.value.offset;
      scrollTop.value = scroller.value.scrollTop;
    }
  }
}

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (!scroller.value) return;
  viewportHeight.value = scroller.value.clientHeight;
  resizeObserver = new ResizeObserver(() => {
    viewportHeight.value = scroller.value?.clientHeight ?? viewportHeight.value;
  });
  resizeObserver.observe(scroller.value);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});

watch(
  () => props.items.length,
  async () => {
    if (!prependAnchor.value || !scroller.value) return;
    await nextTick();
    const anchorIdx = props.items.findIndex((x) => x.id === prependAnchor.value?.id);
    if (anchorIdx >= 0) {
      const anchorOffsetTop = offsets.value[anchorIdx] ?? 0;
      scroller.value.scrollTop = anchorOffsetTop + prependAnchor.value.offset;
      scrollTop.value = scroller.value.scrollTop;
    }
    requestAnimationFrame(() => {
      prependAnchor.value = null;
    });
  }
);

defineExpose({
  scrollToBottom: () => {
    if (!scroller.value) return;
    scroller.value.scrollTop = scroller.value.scrollHeight;
    scrollTop.value = scroller.value.scrollTop;
  }
});
</script>

<template>
  <div ref="scroller" class="virtual-scroller" @scroll="onScroll">
    <div :style="{ height: `${topPadding}px` }" />
    <div v-for="item in renderedItems" :key="item.id" class="virtual-row">
      <MeasuredRow :item-id="item.id" @resize="onResize">
        <slot name="default" :item="item" />
      </MeasuredRow>
    </div>
    <div :style="{ height: `${bottomPadding}px` }" />
  </div>
</template>

<style scoped>
.virtual-scroller {
  height: 72vh;
  overflow: auto;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
}

.virtual-row {
  margin-bottom: 10px;
}

.virtual-row:last-child {
  margin-bottom: 0;
}
</style>
