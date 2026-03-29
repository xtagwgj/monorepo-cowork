import { computed, shallowRef } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { useDesktopI18n } from "./useI18n";

export interface DesktopSummary {
  appName: string;
  tauriVersion: string;
  targetTriple: string;
  profile: string;
}

export function useDesktopSummary() {
  const { t } = useDesktopI18n();
  const summary = shallowRef<DesktopSummary | null>(null);
  const errorMessage = shallowRef<string | null>(null);
  const isLoading = shallowRef(false);

  const statusLabel = computed(() => {
    if (isLoading.value) {
      return t("runtime.loading");
    }

    if (errorMessage.value) {
      return t("runtime.unavailable");
    }

    return t("runtime.ready");
  });

  async function refresh(): Promise<void> {
    isLoading.value = true;
    errorMessage.value = null;

    try {
      summary.value = await invoke<DesktopSummary>("desktop_summary");
    } catch (error) {
      summary.value = null;
      errorMessage.value = error instanceof Error ? error.message : t("runtime.unavailable");
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
