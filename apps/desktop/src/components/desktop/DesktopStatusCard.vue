<script setup lang="ts">
import Button from "@/components/ui/Button.vue";
import type { DesktopSummary } from "@/composables/useDesktopSummary";

defineProps<{
  errorMessage: string | null;
  isLoading: boolean;
  statusLabel: string;
  summary: DesktopSummary | null;
}>();

const emit = defineEmits<{
  refresh: [];
}>();
</script>

<template>
  <section class="status-card">
    <div class="status-card__header">
      <div>
        <p class="status-card__eyebrow">Desktop Runtime</p>
        <h2 class="status-card__title">{{ statusLabel }}</h2>
      </div>
      <Button :disabled="isLoading" variant="outline" @click="emit('refresh')">
        {{ isLoading ? "Refreshing..." : "Refresh" }}
      </Button>
    </div>

    <p v-if="errorMessage" class="status-card__error">
      {{ errorMessage }}
    </p>

    <dl v-else-if="summary" class="status-card__grid">
      <div class="status-card__item">
        <dt>App</dt>
        <dd>{{ summary.appName }}</dd>
      </div>
      <div class="status-card__item">
        <dt>Tauri</dt>
        <dd>{{ summary.tauriVersion }}</dd>
      </div>
      <div class="status-card__item">
        <dt>Target</dt>
        <dd>{{ summary.targetTriple }}</dd>
      </div>
      <div class="status-card__item">
        <dt>Profile</dt>
        <dd>{{ summary.profile }}</dd>
      </div>
    </dl>

    <p v-else class="status-card__empty">
      Start the Tauri shell to fetch runtime metadata from Rust.
    </p>
  </section>
</template>

<style scoped>
.status-card {
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.88)),
    rgba(255, 255, 255, 0.82);
  padding: 1.5rem;
  box-shadow: 0 30px 80px -48px rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(14px);
}

.status-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.status-card__eyebrow,
.status-card__item dt {
  margin: 0;
  color: #64748b;
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.status-card__title {
  margin: 0.45rem 0 0;
  color: #0f172a;
  font-size: clamp(1.4rem, 2vw, 2rem);
}

.status-card__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0 0;
}

.status-card__item {
  border-radius: 20px;
  background: rgba(241, 245, 249, 0.9);
  padding: 1rem;
}

.status-card__item dd {
  margin: 0.4rem 0 0;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 600;
}

.status-card__error,
.status-card__empty {
  margin: 1.25rem 0 0;
  color: #475569;
  line-height: 1.6;
}

.status-card__error {
  color: #b91c1c;
}

@media (max-width: 640px) {
  .status-card__header {
    flex-direction: column;
  }
}
</style>
