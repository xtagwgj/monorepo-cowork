<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@cowork/utils";

const props = withDefaults(
  defineProps<{
    variant?: "default" | "outline" | "ghost";
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    class?: string;
  }>(),
  {
    variant: "default",
    type: "button",
    disabled: false,
    class: ""
  }
);

const classes = computed(() =>
  cn(
    "button",
    `button--${props.variant}`,
    props.disabled && "button--disabled",
    props.class
  )
);
</script>

<template>
  <button :class="classes" :disabled="disabled" :type="type">
    <slot />
  </button>
</template>

<style scoped>
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 999px;
  border: 1px solid transparent;
  padding: 0.72rem 1.1rem;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    background-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease;
  cursor: pointer;
}

.button:hover {
  transform: translateY(-1px);
}

.button:focus-visible {
  outline: 2px solid rgba(15, 23, 42, 0.18);
  outline-offset: 2px;
}

.button--default {
  background: #111827;
  color: #f8fafc;
  box-shadow: 0 18px 40px -24px rgba(15, 23, 42, 0.8);
}

.button--default:hover {
  background: #1f2937;
}

.button--outline {
  border-color: rgba(148, 163, 184, 0.4);
  background: rgba(255, 255, 255, 0.72);
  color: #0f172a;
}

.button--outline:hover {
  border-color: rgba(71, 85, 105, 0.4);
  background: rgba(255, 255, 255, 0.92);
}

.button--ghost {
  background: transparent;
  color: #334155;
}

.button--ghost:hover {
  background: rgba(15, 23, 42, 0.06);
}

.button--disabled,
.button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  transform: none;
}
</style>
