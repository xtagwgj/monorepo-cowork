<script setup lang="ts" generic="T extends { id: string }">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";
import MeasuredRow from "./MeasuredRow.vue";

const props = withDefaults(
  defineProps<{
    items: T[];
    overscan: number;
    itemGap?: number;
    estimatedItemHeight?: number;
    hasMoreTop?: boolean;
    loadingTop?: boolean;
    topLoadOffset?: number;
    hasMoreBottom?: boolean;
    loadingBottom?: boolean;
    bottomLoadOffset?: number;
  }>(),
  {
    itemGap: 10,
    estimatedItemHeight: 120,
    hasMoreTop: false,
    loadingTop: false,
    topLoadOffset: 120,
    hasMoreBottom: false,
    loadingBottom: false,
    bottomLoadOffset: 180
  }
);

const emit = defineEmits<{
  loadTop: [];
  loadBottom: [];
}>();

const scroller = useTemplateRef<HTMLDivElement>("scroller");
const heightMap = ref<Record<string, number>>({});
const viewportHeight = ref(640);
const scrollTop = ref(0);
const liveAnchor = ref<{ id: string; offset: number } | null>(null);
const pendingAnchor = ref<{ id: string; offset: number } | null>(null);

function rowSizeById(itemId: string): number {
  return (heightMap.value[itemId] ?? props.estimatedItemHeight) + props.itemGap;
}

const offsets = computed(() => {
  const acc: number[] = [0];
  for (const item of props.items) {
    acc.push(acc[acc.length - 1]! + rowSizeById(item.id));
  }
  return acc;
});

const totalHeight = computed(() => {
  if (props.items.length === 0) return 0;
  return Math.max(0, (offsets.value[offsets.value.length - 1] ?? 0) - props.itemGap);
});

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
    covered += rowSizeById(props.items[cursor]!.id);
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
  if (props.items.length === 0) return 0;
  let endOffset = offsets.value[renderEnd.value + 1] ?? 0;
  if (renderEnd.value === props.items.length - 1) {
    endOffset -= props.itemGap;
  }
  return Math.max(0, totalHeight.value - endOffset);
});

function onScroll(): void {
  if (!scroller.value) return;
  scrollTop.value = scroller.value.scrollTop;
  captureAnchor();

  if (scrollTop.value <= props.topLoadOffset && props.hasMoreTop && !props.loadingTop) {
    pendingAnchor.value = liveAnchor.value ? { ...liveAnchor.value } : null;
    emit("loadTop");
  }

  const rest = totalHeight.value - (scrollTop.value + viewportHeight.value);
  if (rest <= props.bottomLoadOffset && props.hasMoreBottom && !props.loadingBottom) {
    emit("loadBottom");
  }
}

function onResize(itemId: string, size: number): void {
  if (size <= 0) return;
  if (heightMap.value[itemId] === size) return;
  heightMap.value = { ...heightMap.value, [itemId]: size };
  if (pendingAnchor.value && scroller.value) {
    const anchorIdx = props.items.findIndex((x) => x.id === pendingAnchor.value?.id);
    if (anchorIdx >= 0) {
      const anchorOffsetTop = offsets.value[anchorIdx] ?? 0;
      scroller.value.scrollTop = anchorOffsetTop + pendingAnchor.value.offset;
      scrollTop.value = scroller.value.scrollTop;
    }
  }
}

function captureAnchor(): void {
  if (props.items.length === 0) {
    liveAnchor.value = null;
    return;
  }
  const anchorIndex = firstVisibleIndex.value;
  const anchorItem = props.items[anchorIndex];
  const anchorTop = offsets.value[anchorIndex] ?? 0;
  if (!anchorItem) {
    liveAnchor.value = null;
    return;
  }
  liveAnchor.value = {
    id: anchorItem.id,
    offset: scrollTop.value - anchorTop
  };
}

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (!scroller.value) return;
  viewportHeight.value = scroller.value.clientHeight;
  captureAnchor();
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
  () => props.items.map((item) => item.id),
  (newIds, oldIds) => {
    if (!scroller.value || pendingAnchor.value) return;
    if (newIds.length === oldIds.length && newIds.every((id, idx) => id === oldIds[idx])) return;

    const isTailAppend =
      newIds.length >= oldIds.length && oldIds.every((oldId, idx) => newIds[idx] === oldId);

    if (!isTailAppend && liveAnchor.value) {
      pendingAnchor.value = { ...liveAnchor.value };
    }
  },
  { flush: "pre" }
);

watch(
  () => props.items.map((item) => item.id),
  async () => {
    if (!pendingAnchor.value || !scroller.value) return;
    await nextTick();
    const anchorIdx = props.items.findIndex((x) => x.id === pendingAnchor.value?.id);
    if (anchorIdx >= 0) {
      const anchorOffsetTop = offsets.value[anchorIdx] ?? 0;
      scroller.value.scrollTop = anchorOffsetTop + pendingAnchor.value.offset;
      scrollTop.value = scroller.value.scrollTop;
      captureAnchor();
    }
    requestAnimationFrame(() => {
      pendingAnchor.value = null;
    });
  }
);

defineExpose({
  scrollToBottom: () => {
    if (!scroller.value) return;
    scroller.value.scrollTop = scroller.value.scrollHeight;
    scrollTop.value = scroller.value.scrollTop;
  },
  scrollToTop: () => {
    if (!scroller.value) return;
    scroller.value.scrollTop = 0;
    scrollTop.value = 0;
  },
  scrollToIndex: (index: number) => {
    if (!scroller.value || index < 0 || index >= props.items.length) return;
    const targetOffset = offsets.value[index] ?? 0;
    scroller.value.scrollTop = targetOffset;
    scrollTop.value = targetOffset;
  }
});
</script>

<template>
  <div ref="scroller" class="virtual-scroller" @scroll="onScroll">
    <div :style="{ height: `${topPadding}px` }" />
    <div
      v-for="(item, idx) in renderedItems"
      :key="item.id"
      class="virtual-row"
      :style="{ marginBottom: idx === renderedItems.length - 1 ? '0px' : `${itemGap}px` }"
    >
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
</style>
