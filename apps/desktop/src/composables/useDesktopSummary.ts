import { computed, shallowRef } from "vue";
import { invoke } from "@tauri-apps/api/core";

export interface DesktopSummary {
  appName: string;
  tauriVersion: string;
  targetTriple: string;
  profile: string;
}

export function useDesktopSummary() {
  const summary = shallowRef<DesktopSummary | null>(null);
  const errorMessage = shallowRef<string | null>(null);
  const isLoading = shallowRef(false);

  const statusLabel = computed(() => {
    if (isLoading.value) {
      return "Loading runtime";
    }

    if (errorMessage.value) {
      return "Runtime unavailable";
    }

    return "Runtime ready";
  });

  async function refresh(): Promise<void> {
    isLoading.value = true;
    errorMessage.value = null;

    try {
      summary.value = await invoke<DesktopSummary>("desktop_summary");
    } catch (error) {
      summary.value = null;
      errorMessage.value = error instanceof Error ? error.message : "Failed to reach the Tauri backend.";
    } finally {
      isLoading.value = false;
    }
  }

  return {
    errorMessage,
    isLoading,
    refresh,
    statusLabel,
    summary
  };
}
