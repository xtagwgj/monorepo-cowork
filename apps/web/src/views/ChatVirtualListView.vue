<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef } from "vue";
import ChatCardHost from "../features/chat/components/ChatCardHost.vue";
import VirtualDynamicList from "../features/chat/components/VirtualDynamicList.vue";
import { createMockRange } from "../features/chat/mock";
import type { ChatMessage } from "../features/chat/types";

const MAX_SEQ = 500;
const PAGE_SIZE = 10;

const overscan = ref(4);
const seed = ref(2026);
const loadingTop = ref(false);

const startSeq = ref(MAX_SEQ - PAGE_SIZE + 1);
const list = ref<ChatMessage[]>(createMockRange(startSeq.value, MAX_SEQ, seed.value));
const virtualRef = useTemplateRef<{ scrollToBottom: () => void }>("virtualRef");

const hasMoreTop = computed(() => startSeq.value > 1);

async function loadTop(): Promise<void> {
  if (loadingTop.value || !hasMoreTop.value) return;
  loadingTop.value = true;

  await new Promise((resolve) => setTimeout(resolve, 120));

  const nextStart = Math.max(1, startSeq.value - PAGE_SIZE);
  const older = createMockRange(nextStart, startSeq.value - 1, seed.value);
  list.value = [...older, ...list.value];
  startSeq.value = nextStart;

  await nextTick();
  loadingTop.value = false;
}

async function regenerate(): Promise<void> {
  seed.value += 1;
  startSeq.value = MAX_SEQ - PAGE_SIZE + 1;
  list.value = createMockRange(startSeq.value, MAX_SEQ, seed.value);
  await nextTick();
  virtualRef.value?.scrollToBottom();
}

onMounted(async () => {
  await nextTick();
  virtualRef.value?.scrollToBottom();
});
</script>

<template>
  <section class="chat-page">
    <header class="toolbar">
      <h2>Chat Virtual List Demo</h2>
      <div class="controls">
        <label>
          overscan(n)
          <input v-model.number="overscan" type="number" min="1" max="20" />
        </label>
        <button @click="regenerate">重新生成随机卡片</button>
      </div>
      <p>
        渲染策略: 当前屏幕可见数 + 上下 {{ overscan }} 条。向上滚动自动加载历史消息，并保持视口锚点稳定。
      </p>
    </header>

    <VirtualDynamicList
      ref="virtualRef"
      :items="list"
      :overscan="overscan"
      :has-more-top="hasMoreTop"
      :loading-top="loadingTop"
      :estimated-item-height="140"
      @load-top="loadTop"
    >
      <template #default="{ item }">
        <ChatCardHost :item="item" />
      </template>
    </VirtualDynamicList>

    <footer class="footnote">
      <span>已加载 {{ list.length }} 条，最早 seq: {{ startSeq }}</span>
      <span v-if="loadingTop">加载历史中...</span>
      <span v-else-if="!hasMoreTop">没有更多历史了</span>
      <span>类型覆盖: text / image / file / system / todo / quote</span>
    </footer>
  </section>
</template>

<style scoped>
.chat-page {
  display: grid;
  gap: 12px;
}

.toolbar {
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 12px;
}

.controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

label {
  display: flex;
  align-items: center;
  gap: 8px;
}

input {
  width: 72px;
}

.footnote {
  color: #334155;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 13px;
}
</style>
