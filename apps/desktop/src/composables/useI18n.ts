import { inject, provide, shallowRef } from "vue";
import type { InjectionKey, ShallowRef } from "vue";

type Locale = "en" | "zh";

const messages = {
  en: {
    runtime: {
      eyebrow: "Desktop Runtime",
      loading: "Loading runtime",
      unavailable: "Runtime unavailable",
      ready: "Runtime ready",
      refresh: "Refresh",
      refreshing: "Refreshing...",
      empty: "Start the Tauri shell to fetch runtime metadata from Rust.",
      app: "App",
      tauri: "Tauri",
      target: "Target",
      profile: "Profile"
    },
    shell: {
      eyebrow: "Tauri Desktop",
      title: "Cowork now runs on a lighter desktop runtime.",
      copy:
        "The desktop shell now uses Tauri 2, Vue 3, Vite 8, and Vue DevTools to reduce the memory overhead of Electron while keeping a familiar frontend workflow.",
      sync: "Sync runtime summary",
      syncing: "Syncing runtime...",
      uiTag: "shadcn/vue styled UI"
    },
    file: {
      eyebrow: "File Workbench",
      title: "Chunked IO for large files",
      copy:
        "Reads and writes run through buffered Rust sessions so multi-GB transfers do not need to load the full file into memory.",
      sourceFilePath: "Source file path",
      destinationFolder: "Destination folder",
      outputFileName: "Output file name",
      chunkSize: "Chunk size in bytes",
      chooseFile: "Choose file",
      choosingFile: "Choosing...",
      chooseFolder: "Choose folder",
      choosingFolder: "Picking...",
      copySessions: "Copy with read/write sessions",
      copyBackend: "Copy fully in Rust",
      copying: "Copying...",
      running: "Running...",
      previewFirstChunk: "Preview first chunk",
      reading: "Reading...",
      listFolder: "List folder",
      listing: "Listing...",
      openSystem: "Open in system",
      targetPath: "Target path",
      chunkPreview: "Chunk preview",
      noPreview: "No preview loaded.",
      folderEntries: "Selected folder entries",
      noFolderListing: "No folder listing loaded.",
      activity: "Activity",
      noActivity: "Actions and transfer status will appear here.",
      dir: "dir",
      file: "file",
      sourcePlaceholder: "/path/to/source.iso",
      destinationPlaceholder: "/path/to/output",
      outputPlaceholder: "copy.bin",
      selectedFolderLog: "Selected folder: {path}",
      selectedFileLog: "Selected file: {path}",
      openedFolderLog: "Opened in system shell: {path}",
      loadedFolderLog: "Loaded {count} entries from {path}",
      previewLog: "Read {count} bytes for preview from {path}",
      copiedLog: "Copied {source} to {destination} with {chunkSize} byte chunks.",
      backendCopiedLog: "Backend streamed {count} bytes to {path}.",
      selectFolderFailed: "Failed to select a folder.",
      selectFileFailed: "Failed to select a file.",
      openDirectoryFailed: "Failed to open the directory.",
      readFolderFailed: "Failed to read the folder.",
      previewFailed: "Failed to preview the file.",
      copyFailed: "Failed to copy the file.",
      backendCopyFailed: "Backend copy failed."
    }
  },
  zh: {
    runtime: {
      eyebrow: "桌面运行时",
      loading: "正在加载运行时",
      unavailable: "运行时不可用",
      ready: "运行时已就绪",
      refresh: "刷新",
      refreshing: "刷新中...",
      empty: "启动 Tauri 桌面壳后即可从 Rust 端获取运行时信息。",
      app: "应用",
      tauri: "Tauri",
      target: "目标平台",
      profile: "构建模式"
    },
    shell: {
      eyebrow: "Tauri 桌面端",
      title: "Cowork 已切换到更轻量的桌面运行时。",
      copy:
        "桌面端现在基于 Tauri 2、Vue 3、Vite 8 和 Vue DevTools，降低 Electron 的内存开销，同时保留熟悉的前端工作流。",
      sync: "同步运行时信息",
      syncing: "同步中...",
      uiTag: "shadcn/vue 风格界面"
    },
    file: {
      eyebrow: "文件工作台",
      title: "面向大文件的分块 IO",
      copy:
        "读写操作通过 Rust 侧缓冲会话执行，多 GB 文件传输也不需要一次性载入内存。",
      sourceFilePath: "源文件路径",
      destinationFolder: "目标文件夹",
      outputFileName: "输出文件名",
      chunkSize: "分块大小（字节）",
      chooseFile: "选择文件",
      choosingFile: "选择中...",
      chooseFolder: "选择文件夹",
      choosingFolder: "选择中...",
      copySessions: "按读写会话复制",
      copyBackend: "完全由 Rust 复制",
      copying: "复制中...",
      running: "执行中...",
      previewFirstChunk: "预览首个分块",
      reading: "读取中...",
      listFolder: "列出文件夹",
      listing: "读取中...",
      openSystem: "系统打开",
      targetPath: "目标路径",
      chunkPreview: "分块预览",
      noPreview: "尚未加载预览。",
      folderEntries: "已选文件夹内容",
      noFolderListing: "尚未加载文件夹列表。",
      activity: "操作记录",
      noActivity: "这里会显示操作与传输状态。",
      dir: "目录",
      file: "文件",
      sourcePlaceholder: "/path/to/source.iso",
      destinationPlaceholder: "/path/to/output",
      outputPlaceholder: "copy.bin",
      selectedFolderLog: "已选择文件夹：{path}",
      selectedFileLog: "已选择文件：{path}",
      openedFolderLog: "已通过系统打开：{path}",
      loadedFolderLog: "已从 {path} 读取 {count} 个条目",
      previewLog: "已从 {path} 读取 {count} 字节用于预览",
      copiedLog: "已用 {chunkSize} 字节分块将 {source} 复制到 {destination}。",
      backendCopiedLog: "Rust 后端已向 {path} 写入 {count} 字节。",
      selectFolderFailed: "选择文件夹失败。",
      selectFileFailed: "选择文件失败。",
      openDirectoryFailed: "打开目录失败。",
      readFolderFailed: "读取文件夹失败。",
      previewFailed: "预览文件失败。",
      copyFailed: "复制文件失败。",
      backendCopyFailed: "后端复制失败。"
    }
  }
} as const;

type MessageTree = typeof messages.en;
type SectionKey = keyof MessageTree;
type SectionMessages<S extends SectionKey> = MessageTree[S];
type MessageKey = {
  [S in SectionKey]: `${S}.${Extract<keyof SectionMessages<S>, string>}`;
}[SectionKey];

interface I18nContext {
  locale: ShallowRef<Locale>;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
}

const I18N_KEY: InjectionKey<I18nContext> = Symbol("desktop-i18n");

export function resolveLocale(language?: string): Locale {
  return language?.toLowerCase().startsWith("zh") ? "zh" : "en";
}

export function provideDesktopI18n(): I18nContext {
  const locale = shallowRef<Locale>(resolveLocale(globalThis.navigator?.language));

  function t(key: MessageKey, params?: Record<string, string | number>): string {
    const [section, name] = key.split(".") as [SectionKey, string];
    const rawMessage = messages[locale.value][section][name as keyof MessageTree[typeof section]] as string;

    if (!params) {
      return rawMessage;
    }

    return rawMessage.replace(/\{(\w+)\}/g, (_, token: string) => String(params[token] ?? `{${token}}`));
  }

  const context: I18nContext = { locale, t };
  provide(I18N_KEY, context);
  return context;
}

export function useDesktopI18n(): I18nContext {
  const context = inject(I18N_KEY);
  if (!context) {
    throw new Error("Desktop i18n has not been provided.");
  }

  return context;
}
