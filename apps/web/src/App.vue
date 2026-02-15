<script setup lang="ts">
import { useNow } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { useCounterStore } from "./stores/counter";

const now = useNow();
const counter = useCounterStore();
const { count } = storeToRefs(counter);
</script>

<template>
  <main>
    <h1>cowork web</h1>
    <p>now: {{ now.toLocaleTimeString() }}</p>
    <p>count: {{ count }}</p>
    <div style="display:flex;gap:8px;">
      <button @click="counter.increment">+1</button>
      <CowButton label="Shared UI Button" />
      <RouterLink to="/about">About</RouterLink>
    </div>
    <RouterView />
  </main>
</template>
