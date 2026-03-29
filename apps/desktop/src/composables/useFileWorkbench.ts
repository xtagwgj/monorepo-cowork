import { computed, shallowRef } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { useDesktopI18n } from "./useI18n";

const DEFAULT_CHUNK_SIZE = 1024 * 1024;

interface FileSessionInfo {
  sessionId: number;
  path: string;
  size?: number | null;
  bytesProcessed: number;
}

interface ReadChunkResult {
  bytes: number[];
  bytesRead: number;
  totalBytesRead: number;
  eof: boolean;
}

interface WriteChunkResult {
  bytesWritten: number;
  totalBytesWritten: number;
}

interface FileEntry {
  path: string;
  name: string;
  isDir: boolean;
}

interface PickedPath {
  path: string;
}

export function useFileWorkbench() {
  const { t } = useDesktopI18n();
  const sourcePath = shallowRef("");
  const destinationDirectory = shallowRef("");
  const destinationName = shallowRef("copy.bin");
  const chunkSize = shallowRef(DEFAULT_CHUNK_SIZE);
  const directoryEntries = shallowRef<FileEntry[]>([]);
  const previewText = shallowRef("");
  const errorMessage = shallowRef<string | null>(null);
  const activityLog = shallowRef<string[]>([]);
  const isCopying = shallowRef(false);
  const isBrowsingDirectory = shallowRef(false);
  const isPreviewing = shallowRef(false);
  const isSelectingSourceFile = shallowRef(false);
  const isSelectingFolder = shallowRef(false);

  const destinationPath = computed(() => {
    if (!destinationDirectory.value || !destinationName.value) {
      return "";
    }

    return `${destinationDirectory.value.replace(/[\\/]+$/, "")}/${destinationName.value}`;
  });

  const canCopy = computed(
    () =>
      Boolean(sourcePath.value.trim()) &&
      Boolean(destinationDirectory.value.trim()) &&
      Boolean(destinationName.value.trim()) &&
      !isCopying.value
  );

  function appendLog(message: string): void {
    activityLog.value = [message, ...activityLog.value].slice(0, 12);
  }

  function clearError(): void {
    errorMessage.value = null;
  }

  async function pickSourceFile(): Promise<void> {
    isSelectingSourceFile.value = true;
    clearError();

    try {
      const picked = await invoke<PickedPath | null>("pick_file", {
        initialDirectory: destinationDirectory.value || null
      });

      if (picked?.path) {
        sourcePath.value = picked.path;
        appendLog(t("file.selectedFileLog", { path: picked.path }));
      }
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : t("file.selectFileFailed");
    } finally {
      isSelectingSourceFile.value = false;
    }
  }

  async function pickDestinationDirectory(): Promise<void> {
    isSelectingFolder.value = true;
    clearError();

    try {
      const selectedPath = await invoke<string | null>("pick_folder", {
        initialDirectory: destinationDirectory.value || null
      });

      if (selectedPath) {
        destinationDirectory.value = selectedPath;
        appendLog(t("file.selectedFolderLog", { path: selectedPath }));
      }
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : t("file.selectFolderFailed");
    } finally {
      isSelectingFolder.value = false;
    }
  }

  async function openDestinationDirectory(): Promise<void> {
    if (!destinationDirectory.value) {
      return;
    }

    clearError();

    try {
      await invoke("open_path_in_system", { path: destinationDirectory.value });
      appendLog(t("file.openedFolderLog", { path: destinationDirectory.value }));
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : t("file.openDirectoryFailed");
    }
  }

  async function listSelectedDirectory(): Promise<void> {
    if (!destinationDirectory.value) {
      return;
    }

    isBrowsingDirectory.value = true;
    clearError();

    try {
      directoryEntries.value = await invoke<FileEntry[]>("list_directory", {
        path: destinationDirectory.value
      });
      appendLog(
        t("file.loadedFolderLog", {
          count: directoryEntries.value.length,
          path: destinationDirectory.value
        })
      );
    } catch (error) {
      directoryEntries.value = [];
      errorMessage.value = error instanceof Error ? error.message : t("file.readFolderFailed");
    } finally {
      isBrowsingDirectory.value = false;
    }
  }

  async function previewSourceChunk(): Promise<void> {
    if (!sourcePath.value.trim()) {
      return;
    }

    isPreviewing.value = true;
    clearError();

    let readSessionId: number | null = null;

    try {
      const session = await invoke<FileSessionInfo>("open_read_session", {
        path: sourcePath.value
      });
      readSessionId = session.sessionId;

      const chunk = await invoke<ReadChunkResult>("read_chunk", {
        sessionId: readSessionId,
        chunkSize: Math.min(chunkSize.value, 64 * 1024)
      });

      previewText.value = new TextDecoder().decode(Uint8Array.from(chunk.bytes));
      appendLog(t("file.previewLog", { count: chunk.bytesRead, path: sourcePath.value }));
    } catch (error) {
      previewText.value = "";
      errorMessage.value = error instanceof Error ? error.message : t("file.previewFailed");
    } finally {
      if (readSessionId !== null) {
        await invoke("close_read_session", { sessionId: readSessionId }).catch(() => undefined);
      }

      isPreviewing.value = false;
    }
  }

  async function copyByChunks(): Promise<void> {
    if (!canCopy.value || !destinationPath.value) {
      return;
    }

    isCopying.value = true;
    clearError();

    let readSessionId: number | null = null;
    let writeSessionId: number | null = null;

    try {
      const readSession = await invoke<FileSessionInfo>("open_read_session", {
        path: sourcePath.value
      });
      readSessionId = readSession.sessionId;

      const writeSession = await invoke<FileSessionInfo>("open_write_session", {
        payload: {
          path: destinationPath.value,
          truncate: true,
          createParent: true
        }
      });
      writeSessionId = writeSession.sessionId;

      while (true) {
        const chunk = await invoke<ReadChunkResult>("read_chunk", {
          sessionId: readSessionId,
          chunkSize: chunkSize.value
        });

        if (chunk.bytesRead === 0) {
          break;
        }

        await invoke<WriteChunkResult>("write_chunk", {
          sessionId: writeSessionId,
          bytes: chunk.bytes
        });

        if (chunk.eof) {
          break;
        }
      }

      await invoke("flush_write_session", { sessionId: writeSessionId });
      appendLog(
        t("file.copiedLog", {
          source: sourcePath.value,
          destination: destinationPath.value,
          chunkSize: chunkSize.value
        })
      );
      await listSelectedDirectory();
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : t("file.copyFailed");
    } finally {
      if (readSessionId !== null) {
        await invoke("close_read_session", { sessionId: readSessionId }).catch(() => undefined);
      }

      if (writeSessionId !== null) {
        await invoke("close_write_session", { sessionId: writeSessionId }).catch(() => undefined);
      }

      isCopying.value = false;
    }
  }

  async function copyInBackend(): Promise<void> {
    if (!canCopy.value || !destinationPath.value) {
      return;
    }

    isCopying.value = true;
    clearError();

    try {
      const result = await invoke<WriteChunkResult>("copy_file_streaming", {
        sourcePath: sourcePath.value,
        destinationPath: destinationPath.value,
        chunkSize: chunkSize.value
      });

      appendLog(
        t("file.backendCopiedLog", {
          count: result.totalBytesWritten.toLocaleString(),
          path: destinationPath.value
        })
      );
      await listSelectedDirectory();
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : t("file.backendCopyFailed");
    } finally {
      isCopying.value = false;
    }
  }

  return {
    activityLog,
    canCopy,
    chunkSize,
    copyByChunks,
    copyInBackend,
    destinationDirectory,
    destinationName,
    destinationPath,
    directoryEntries,
    errorMessage,
    isBrowsingDirectory,
    isCopying,
    isPreviewing,
    isSelectingFolder,
    isSelectingSourceFile,
    listSelectedDirectory,
    openDestinationDirectory,
    pickDestinationDirectory,
    pickSourceFile,
    previewSourceChunk,
    previewText,
    sourcePath
  };
}
