<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef } from "vue";
import ChatCardHost from "../features/chat/components/ChatCardHost.vue";
import VirtualDynamicList from "../features/chat/components/VirtualDynamicList.vue";
import { createMockRange } from "../features/chat/mock";
import type { ChatMessage } from "../features/chat/types";

const MAX_SEQ = 500;
const PAGE_SIZE = 10;

const overscan = ref(4);
const itemGap = ref(16);
const maxInMemory = ref(20);
const seed = ref(2026);
const loadingTop = ref(false);
const loadingBottom = ref(false);

const startSeq = ref(MAX_SEQ - PAGE_SIZE + 1);
const endSeq = ref(MAX_SEQ);
const list = ref<ChatMessage[]>(createMockRange(startSeq.value, endSeq.value, seed.value));
const virtualRef = useTemplateRef<{ scrollToBottom: () => void }>("virtualRef");

const hasMoreTop = computed(() => startSeq.value > 1);
const hasMoreBottom = computed(() => endSeq.value < MAX_SEQ);

function trimWindowFromBottomIfNeeded(): void {
  const overflow = Math.max(0, list.value.length - maxInMemory.value);
  if (overflow === 0) return;
  list.value = list.value.slice(0, list.value.length - overflow);
  endSeq.value -= overflow;
}

function trimWindowFromTopIfNeeded(): void {
  const overflow = Math.max(0, list.value.length - maxInMemory.value);
  if (overflow === 0) return;
  list.value = list.value.slice(overflow);
  startSeq.value += overflow;
}

async function loadTop(): Promise<void> {
  if (loadingTop.value || !hasMoreTop.value) return;
  loadingTop.value = true;

  await new Promise((resolve) => setTimeout(resolve, 120));

  const nextStart = Math.max(1, startSeq.value - PAGE_SIZE);
  const older = createMockRange(nextStart, startSeq.value - 1, seed.value);
  list.value = [...older, ...list.value];
  startSeq.value = nextStart;

  trimWindowFromBottomIfNeeded();

  await nextTick();
  loadingTop.value = false;
}

async function loadBottom(): Promise<void> {
  if (loadingBottom.value || !hasMoreBottom.value) return;
  loadingBottom.value = true;

  await new Promise((resolve) => setTimeout(resolve, 120));

  const nextEnd = Math.min(MAX_SEQ, endSeq.value + PAGE_SIZE);
  const newer = createMockRange(endSeq.value + 1, nextEnd, seed.value);
  list.value = [...list.value, ...newer];
  endSeq.value = nextEnd;

  trimWindowFromTopIfNeeded();

  await nextTick();
  loadingBottom.value = false;
}

async function regenerate(): Promise<void> {
  seed.value += 1;
  startSeq.value = MAX_SEQ - PAGE_SIZE + 1;
  endSeq.value = MAX_SEQ;
  list.value = createMockRange(startSeq.value, endSeq.value, seed.value);
  trimWindowFromTopIfNeeded();
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
        <label>
          card gap(px)
          <input v-model.number="itemGap" type="number" min="0" max="40" />
        </label>
        <label>
          max in-memory
          <input v-model.number="maxInMemory" type="number" min="20" max="300" step="10" />
        </label>
        <button @click="regenerate">重新生成随机卡片</button>
      </div>
      <p>
        渲染策略: 当前屏幕可见数 + 上下 {{ overscan }} 条。数据策略: 滑动窗口上限 {{ maxInMemory }}，超限后从远端方向淘汰，避免 chatList 内存无限增长。
      </p>
      <p>
        Base64 大字段建议: chatList 只存 metadata + blobKey，不直接存 base64。进入可视区时按需读取内容，离开后释放 URL/缓存。
      </p>
    </header>

    <VirtualDynamicList
      ref="virtualRef"
      :items="list"
      :overscan="overscan"
      :item-gap="itemGap"
      :has-more-top="hasMoreTop"
      :loading-top="loadingTop"
      :has-more-bottom="hasMoreBottom"
      :loading-bottom="loadingBottom"
      :estimated-item-height="140"
      @load-top="loadTop"
      @load-bottom="loadBottom"
    >
      <template #default="{ item }">
        <ChatCardHost :item="item" />
      </template>
    </VirtualDynamicList>

    <footer class="footnote">
      <span>窗口范围: seq {{ startSeq }} ~ {{ endSeq }}</span>
      <span>chatList 当前长度: {{ list.length }}</span>
      <span v-if="loadingTop">加载历史中...</span>
      <span v-if="loadingBottom">加载新消息中...</span>
      <span v-if="!hasMoreTop && !hasMoreBottom">已达到双向边界</span>
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
  flex-wrap: wrap;
}

label {
  display: flex;
  align-items: center;
  gap: 8px;
}

input {
  width: 88px;
}

.footnote {
  color: #334155;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 13px;
}
</style>
