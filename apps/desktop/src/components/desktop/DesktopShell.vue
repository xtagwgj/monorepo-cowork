<script setup lang="ts">
import { onMounted } from "vue";
import FileWorkbench from "@/components/desktop/FileWorkbench.vue";
import DesktopStatusCard from "@/components/desktop/DesktopStatusCard.vue";
import Button from "@/components/ui/Button.vue";
import { useDesktopSummary } from "@/composables/useDesktopSummary";

const { errorMessage, isLoading, refresh, statusLabel, summary } = useDesktopSummary();

onMounted(() => {
  void refresh();
});
</script>

<template>
  <section class="desktop-shell">
    <div class="desktop-shell__hero">
      <p class="desktop-shell__eyebrow">Tauri Desktop</p>
      <h1 class="desktop-shell__title">Cowork now runs on a lighter desktop runtime.</h1>
      <p class="desktop-shell__copy">
        The desktop shell now uses Tauri 2, Vue 3, Vite 8, and Vue DevTools to reduce the memory overhead of Electron while keeping a familiar frontend workflow.
      </p>
      <div class="desktop-shell__actions">
        <Button @click="refresh">
          {{ isLoading ? "Syncing runtime..." : "Sync runtime summary" }}
        </Button>
        <Button class="desktop-shell__secondary" variant="ghost">
          shadcn/vue styled UI
        </Button>
      </div>
    </div>

    <DesktopStatusCard
      :error-message="errorMessage"
      :is-loading="isLoading"
      :status-label="statusLabel"
      :summary="summary"
      @refresh="refresh"
    />

    <FileWorkbench />
  </section>
</template>

<style scoped>
.desktop-shell {
  display: grid;
  gap: 1.5rem;
}

.desktop-shell__hero {
  display: grid;
  gap: 1rem;
}

.desktop-shell__eyebrow {
  margin: 0;
  color: #0f766e;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.desktop-shell__title {
  margin: 0;
  max-width: 12ch;
  color: #0f172a;
  font-size: clamp(2.6rem, 7vw, 5rem);
  line-height: 0.96;
}

.desktop-shell__copy {
  margin: 0;
  max-width: 60ch;
  color: #334155;
  font-size: 1.05rem;
  line-height: 1.7;
}

.desktop-shell__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.desktop-shell__secondary {
  cursor: default;
}

@media (max-width: 640px) {
  .desktop-shell__title {
    max-width: none;
  }
}
</style>
