export type DocsLocale = "en" | "zh";

export interface LocalizedText {
  en: string;
  zh: string;
}

export interface ApiField {
  name: string;
  type: string;
  required: boolean;
  description: LocalizedText;
}

export interface ApiMethodDoc {
  name: string;
  sourceFile: "commands/app.rs" | "commands/files.rs" | "commands/system.rs";
  order: number;
  summary: LocalizedText;
  capability: LocalizedText;
  inputs: ApiField[];
  output: string;
  outputDescription: LocalizedText;
  usage: string;
  boundaries: LocalizedText[];
}

export interface ApiGroupDoc {
  sourceFile: ApiMethodDoc["sourceFile"];
  title: LocalizedText;
  description: LocalizedText;
}

export function t(text: LocalizedText, locale: DocsLocale): string {
  return text[locale];
}

export function resolveDocsLocale(language?: string): DocsLocale {
  return language?.toLowerCase().startsWith("zh") ? "zh" : "en";
}

export const apiGroups: ApiGroupDoc[] = [
  {
    sourceFile: "commands/app.rs",
    title: {
      en: "Runtime metadata APIs",
      zh: "运行时元信息接口"
    },
    description: {
      en: "APIs implemented in `app.rs`, focused on desktop host metadata.",
      zh: "实现于 `app.rs` 的接口，主要负责暴露桌面宿主运行时信息。"
    }
  },
  {
    sourceFile: "commands/files.rs",
    title: {
      en: "File streaming APIs",
      zh: "文件流式处理接口"
    },
    description: {
      en: "APIs implemented in `files.rs`, ordered by the typical lifecycle of large-file operations.",
      zh: "实现于 `files.rs` 的接口，按大文件操作的典型生命周期顺序排列。"
    }
  },
  {
    sourceFile: "commands/system.rs",
    title: {
      en: "System integration APIs",
      zh: "系统集成接口"
    },
    description: {
      en: "APIs implemented in `system.rs`, focused on shell handoff and system dialogs.",
      zh: "实现于 `system.rs` 的接口，主要负责系统打开与原生选择器能力。"
    }
  }
];

export const apiMethods: ApiMethodDoc[] = [
  {
    name: "desktop_summary",
    sourceFile: "commands/app.rs",
    order: 1,
    summary: {
      en: "Read desktop runtime metadata exposed by the Tauri host.",
      zh: "读取 Tauri 宿主暴露的桌面运行时元信息。"
    },
    capability: {
      en: "Returns app name, Tauri version label, target triple, and build profile.",
      zh: "返回应用名、Tauri 版本标识、目标平台三元组以及构建模式。"
    },
    inputs: [],
    output: "Promise<{ appName: string; tauriVersion: string; targetTriple: string; profile: string }>",
    outputDescription: {
      en: "Static runtime summary for the current desktop shell instance.",
      zh: "当前桌面壳实例的静态运行时摘要。"
    },
    usage: `import { invoke } from "@tauri-apps/api/core";

const summary = await invoke("desktop_summary");`,
    boundaries: [
      {
        en: "Read-only command with no filesystem or system side effects.",
        zh: "只读接口，不会产生文件系统或系统级副作用。"
      },
      {
        en: "The current Tauri version value is an app-defined support label (`2.x`), not a dynamically probed crate version.",
        zh: "当前返回的 Tauri 版本值是应用定义的支持标识（`2.x`），不是运行时动态探测的 crate 精确版本。"
      }
    ]
  },
  {
    name: "open_read_session",
    sourceFile: "commands/files.rs",
    order: 1,
    summary: {
      en: "Open a buffered read session for large-file chunked reads.",
      zh: "为大文件分块读取打开一个带缓冲的读会话。"
    },
    capability: {
      en: "Creates a Rust-side `BufReader<File>` session and returns a session id for later chunk pulls.",
      zh: "在 Rust 侧创建 `BufReader<File>` 会话，并返回后续分块拉取所需的会话 id。"
    },
    inputs: [
      {
        name: "path",
        type: "string",
        required: true,
        description: {
          en: "Absolute path to the source file.",
          zh: "源文件的绝对路径。"
        }
      }
    ],
    output: "Promise<{ sessionId: number; path: string; size: number; bytesProcessed: number }>",
    outputDescription: {
      en: "A read session descriptor with canonicalized path and total file size.",
      zh: "读会话描述对象，包含规范化路径和文件总大小。"
    },
    usage: `const session = await invoke("open_read_session", {
  path: "/Users/name/Downloads/big.iso"
});`,
    boundaries: [
      {
        en: "The file must live inside a built-in trusted root or a root previously approved by the system picker.",
        zh: "文件必须位于内置可信根目录中，或位于此前通过系统选择器批准过的目录中。"
      },
      {
        en: "This command only opens the session; consumers must call `read_chunk` and `close_read_session` afterwards.",
        zh: "该接口只负责打开会话；调用方后续仍需调用 `read_chunk` 和 `close_read_session`。"
      }
    ]
  },
  {
    name: "read_chunk",
    sourceFile: "commands/files.rs",
    order: 2,
    summary: {
      en: "Read the next chunk from an existing read session.",
      zh: "从现有读会话中读取下一个分块。"
    },
    capability: {
      en: "Streams bytes out of Rust without loading the whole file into memory.",
      zh: "在不将整个文件载入内存的前提下，从 Rust 端流式返回字节数据。"
    },
    inputs: [
      {
        name: "sessionId",
        type: "number",
        required: true,
        description: {
          en: "Session id returned by `open_read_session`.",
          zh: "由 `open_read_session` 返回的会话 id。"
        }
      },
      {
        name: "chunkSize",
        type: "number",
        required: true,
        description: {
          en: "Requested chunk size in bytes. The backend clamps it to `1..=8 MiB`.",
          zh: "请求的分块字节大小，后端会将其限制在 `1..=8 MiB`。"
        }
      }
    ],
    output: "Promise<{ bytes: number[]; bytesRead: number; totalBytesRead: number; eof: boolean }>",
    outputDescription: {
      en: "Raw bytes for the current chunk, plus cumulative progress and end-of-file status.",
      zh: "当前分块的原始字节数组，以及累计读取进度和是否到达文件末尾的状态。"
    },
    usage: `const chunk = await invoke("read_chunk", {
  sessionId: session.sessionId,
  chunkSize: 1024 * 1024
});`,
    boundaries: [
      {
        en: "Unknown or already-closed session ids fail immediately.",
        zh: "未知或已关闭的会话 id 会立即返回错误。"
      },
      {
        en: "The file itself is streamed, but each chunk still crosses the IPC boundary, so chunk size should remain practical.",
        zh: "文件本身是流式处理的，但每个分块仍需经过 IPC 边界，因此分块大小仍应保持在合理范围。"
      }
    ]
  },
  {
    name: "close_read_session",
    sourceFile: "commands/files.rs",
    order: 3,
    summary: {
      en: "Dispose a buffered read session.",
      zh: "释放一个带缓冲的读会话。"
    },
    capability: {
      en: "Releases the Rust-side reader and removes the session from shared state.",
      zh: "释放 Rust 侧 reader，并从共享状态中移除对应会话。"
    },
    inputs: [
      {
        name: "sessionId",
        type: "number",
        required: true,
        description: {
          en: "Session id returned by `open_read_session`.",
          zh: "由 `open_read_session` 返回的会话 id。"
        }
      }
    ],
    output: "Promise<void>",
    outputDescription: {
      en: "No payload; success means the session was removed.",
      zh: "无返回体；成功即表示会话已被移除。"
    },
    usage: `await invoke("close_read_session", {
  sessionId: session.sessionId
});`,
    boundaries: [
      {
        en: "Closing the same session twice returns an error.",
        zh: "重复关闭同一个会话会返回错误。"
      },
      {
        en: "Consumers should always close read sessions in long-lived desktop flows to avoid leaking handles.",
        zh: "在长生命周期桌面流程中，调用方应始终关闭读会话，避免句柄泄漏。"
      }
    ]
  },
  {
    name: "open_write_session",
    sourceFile: "commands/files.rs",
    order: 4,
    summary: {
      en: "Open a buffered write session for large-file chunked writes.",
      zh: "为大文件分块写入打开一个带缓冲的写会话。"
    },
    capability: {
      en: "Creates a Rust-side `BufWriter<File>` session for append or truncate writes.",
      zh: "在 Rust 侧创建 `BufWriter<File>` 会话，支持追加或截断写入。"
    },
    inputs: [
      {
        name: "payload.path",
        type: "string",
        required: true,
        description: {
          en: "Destination file path.",
          zh: "目标文件路径。"
        }
      },
      {
        name: "payload.truncate",
        type: "boolean",
        required: false,
        description: {
          en: "Defaults to `true`. When `false`, the session appends to the existing file.",
          zh: "默认值为 `true`；设为 `false` 时，会话将以追加模式写入已有文件。"
        }
      },
      {
        name: "payload.createParent",
        type: "boolean",
        required: false,
        description: {
          en: "Defaults to `true`. Creates parent directories before opening the file.",
          zh: "默认值为 `true`；在打开文件前自动创建父目录。"
        }
      }
    ],
    output: "Promise<{ sessionId: number; path: string; size: null; bytesProcessed: number }>",
    outputDescription: {
      en: "A write session descriptor with canonicalized destination path and current written byte count.",
      zh: "写会话描述对象，包含规范化后的目标路径和当前已写入字节数。"
    },
    usage: `const writer = await invoke("open_write_session", {
  payload: {
    path: "/Users/name/Desktop/output.bin",
    truncate: true,
    createParent: true
  }
});`,
    boundaries: [
      {
        en: "Parent directories are auto-created only when `createParent` is enabled.",
        zh: "仅当 `createParent` 启用时才会自动创建父目录。"
      },
      {
        en: "Destination paths must pass the same allowlist policy as read paths; newly chosen folders are approved through the system picker.",
        zh: "目标路径与读取路径共用同一套白名单策略；新选择的目录需通过系统选择器获得批准。"
      }
    ]
  },
  {
    name: "write_chunk",
    sourceFile: "commands/files.rs",
    order: 5,
    summary: {
      en: "Write raw bytes to an open write session.",
      zh: "向打开的写会话写入原始字节。"
    },
    capability: {
      en: "Streams arbitrary binary chunks into the buffered writer held by Rust.",
      zh: "将任意二进制分块流式写入 Rust 持有的缓冲 writer。"
    },
    inputs: [
      {
        name: "sessionId",
        type: "number",
        required: true,
        description: {
          en: "Session id returned by `open_write_session`.",
          zh: "由 `open_write_session` 返回的会话 id。"
        }
      },
      {
        name: "bytes",
        type: "number[]",
        required: true,
        description: {
          en: "Raw byte array to write.",
          zh: "待写入的原始字节数组。"
        }
      }
    ],
    output: "Promise<{ bytesWritten: number; totalBytesWritten: number }>",
    outputDescription: {
      en: "Write count for the current chunk plus cumulative bytes written.",
      zh: "当前分块写入字节数，以及累计写入字节数。"
    },
    usage: `await invoke("write_chunk", {
  sessionId: writer.sessionId,
  bytes: chunk.bytes
});`,
    boundaries: [
      {
        en: "This writes into the buffer only; call `flush_write_session` or `close_write_session` to guarantee persistence.",
        zh: "该接口只会写入缓冲区；要确保落盘，需要继续调用 `flush_write_session` 或 `close_write_session`。"
      },
      {
        en: "The frontend still controls IPC payload size by deciding how large each chunk should be.",
        zh: "前端仍然需要通过控制 chunk 大小来决定每次 IPC 传输的数据量。"
      }
    ]
  },
  {
    name: "flush_write_session",
    sourceFile: "commands/files.rs",
    order: 6,
    summary: {
      en: "Flush the write buffer to disk without closing the session.",
      zh: "在不关闭会话的情况下，将写缓冲刷新到磁盘。"
    },
    capability: {
      en: "Forces buffered bytes onto the filesystem while keeping the session alive.",
      zh: "强制将当前缓冲区中的字节落盘，同时保持会话可继续使用。"
    },
    inputs: [
      {
        name: "sessionId",
        type: "number",
        required: true,
        description: {
          en: "Session id returned by `open_write_session`.",
          zh: "由 `open_write_session` 返回的会话 id。"
        }
      }
    ],
    output: "Promise<void>",
    outputDescription: {
      en: "No payload; success means the buffered bytes were flushed.",
      zh: "无返回体；成功即表示缓冲中的字节已刷新到磁盘。"
    },
    usage: `await invoke("flush_write_session", {
  sessionId: writer.sessionId
});`,
    boundaries: [
      {
        en: "Flush does not release the file handle or remove the session.",
        zh: "刷新不会释放文件句柄，也不会移除会话。"
      },
      {
        en: "An invalid session id returns an error.",
        zh: "无效会话 id 会返回错误。"
      }
    ]
  },
  {
    name: "close_write_session",
    sourceFile: "commands/files.rs",
    order: 7,
    summary: {
      en: "Flush and dispose a buffered write session.",
      zh: "刷新并释放一个带缓冲的写会话。"
    },
    capability: {
      en: "Ensures pending bytes are written and removes the writer from shared state.",
      zh: "确保待写入字节落盘，并将 writer 从共享状态中移除。"
    },
    inputs: [
      {
        name: "sessionId",
        type: "number",
        required: true,
        description: {
          en: "Session id returned by `open_write_session`.",
          zh: "由 `open_write_session` 返回的会话 id。"
        }
      }
    ],
    output: "Promise<void>",
    outputDescription: {
      en: "No payload; success means the buffered writer was flushed and released.",
      zh: "无返回体；成功即表示 writer 已刷新并释放。"
    },
    usage: `await invoke("close_write_session", {
  sessionId: writer.sessionId
});`,
    boundaries: [
      {
        en: "Consumers should always close write sessions to release handles deterministically.",
        zh: "调用方应始终关闭写会话，以确定性释放句柄。"
      },
      {
        en: "Closing a missing session returns an error.",
        zh: "关闭不存在的会话会返回错误。"
      }
    ]
  },
  {
    name: "copy_file_streaming",
    sourceFile: "commands/files.rs",
    order: 8,
    summary: {
      en: "Copy one file to another fully inside Rust.",
      zh: "完全在 Rust 后端内部完成整文件复制。"
    },
    capability: {
      en: "Runs a buffered read/write loop in the backend for high-throughput whole-file copies.",
      zh: "在后端执行带缓冲的读写循环，用于高吞吐整文件复制。"
    },
    inputs: [
      {
        name: "sourcePath",
        type: "string",
        required: true,
        description: {
          en: "Source file path.",
          zh: "源文件路径。"
        }
      },
      {
        name: "destinationPath",
        type: "string",
        required: true,
        description: {
          en: "Destination file path.",
          zh: "目标文件路径。"
        }
      },
      {
        name: "chunkSize",
        type: "number",
        required: true,
        description: {
          en: "Requested internal copy chunk size. Backend clamps it to `1..=8 MiB`.",
          zh: "内部复制使用的分块大小，后端会将其限制在 `1..=8 MiB`。"
        }
      }
    ],
    output: "Promise<{ bytesWritten: number; totalBytesWritten: number }>",
    outputDescription: {
      en: "Reports total bytes written for the whole copy. `bytesWritten` remains `0` because the command is not incremental.",
      zh: "返回整个复制过程的总写入字节数。由于该命令不是增量回传，`bytesWritten` 固定为 `0`。"
    },
    usage: `const result = await invoke("copy_file_streaming", {
  sourcePath: "/Users/name/Downloads/big.iso",
  destinationPath: "/Users/name/Desktop/big-copy.iso",
  chunkSize: 1024 * 1024
});`,
    boundaries: [
      {
        en: "Best fit for full-copy flows where the frontend does not need per-chunk control.",
        zh: "更适合前端不需要逐块干预的整文件复制场景。"
      },
      {
        en: "Source and destination must both pass the access policy.",
        zh: "源路径和目标路径都必须通过访问策略校验。"
      }
    ]
  },
  {
    name: "list_directory",
    sourceFile: "commands/files.rs",
    order: 9,
    summary: {
      en: "Enumerate entries inside an approved directory.",
      zh: "枚举已批准目录中的文件条目。"
    },
    capability: {
      en: "Returns a shallow directory listing for UI exploration or destination previews.",
      zh: "返回单层目录列表，适用于 UI 浏览或目标目录预览。"
    },
    inputs: [
      {
        name: "path",
        type: "string",
        required: true,
        description: {
          en: "Directory path to list.",
          zh: "待列举的目录路径。"
        }
      }
    ],
    output: "Promise<Array<{ path: string; name: string; isDir: boolean }>>",
    outputDescription: {
      en: "Alphabetically sorted directory entries with full paths and directory flags.",
      zh: "按名称排序的目录条目数组，包含完整路径和目录标记。"
    },
    usage: `const entries = await invoke("list_directory", {
  path: "/Users/name/Desktop"
});`,
    boundaries: [
      {
        en: "Lists only one directory level; it does not recurse.",
        zh: "只列出当前目录这一层，不会递归进入子目录。"
      },
      {
        en: "The target directory must be inside a trusted or approved root.",
        zh: "目标目录必须位于可信根目录或已批准目录之内。"
      }
    ]
  },
  {
    name: "open_path_in_system",
    sourceFile: "commands/system.rs",
    order: 1,
    summary: {
      en: "Open a file or directory with the host operating system.",
      zh: "使用宿主操作系统打开文件或目录。"
    },
    capability: {
      en: "Delegates to `open`, `cmd /C start`, or `xdg-open` depending on platform.",
      zh: "按平台分别委托给 `open`、`cmd /C start` 或 `xdg-open`。"
    },
    inputs: [
      {
        name: "path",
        type: "string",
        required: true,
        description: {
          en: "File or directory path to open.",
          zh: "需要打开的文件或目录路径。"
        }
      }
    ],
    output: "Promise<void>",
    outputDescription: {
      en: "No payload; success means the handoff to the system shell succeeded.",
      zh: "无返回体；成功即表示已成功交给系统 shell 处理。"
    },
    usage: `await invoke("open_path_in_system", {
  path: "/Users/name/Desktop"
});`,
    boundaries: [
      {
        en: "The path still passes through the access allowlist before the shell command is invoked.",
        zh: "在调用系统 shell 前，该路径仍会先经过访问白名单校验。"
      },
      {
        en: "Success means the shell command launched successfully, not that the target application completed later work.",
        zh: "成功只表示系统命令成功启动，不代表目标应用后续一定完成了全部操作。"
      }
    ]
  },
  {
    name: "pick_file",
    sourceFile: "commands/system.rs",
    order: 2,
    summary: {
      en: "Open the native file picker and approve the selected file path.",
      zh: "打开原生文件选择器，并批准用户选中的文件路径。"
    },
    capability: {
      en: "Lets users pick a file through the host OS and registers that file's parent directory in the access allowlist.",
      zh: "允许用户通过宿主系统选择文件，并将该文件所在父目录登记到访问白名单中。"
    },
    inputs: [
      {
        name: "initialDirectory",
        type: "string | null",
        required: false,
        description: {
          en: "Optional initial folder for the picker.",
          zh: "可选的选择器初始目录。"
        }
      }
    ],
    output: "Promise<{ path: string } | null>",
    outputDescription: {
      en: "Returns the approved canonical file path, or `null` when the user cancels.",
      zh: "返回已批准的规范化文件路径；如果用户取消，则返回 `null`。"
    },
    usage: `const picked = await invoke("pick_file", {
  initialDirectory: "/Users/name/Downloads"
});`,
    boundaries: [
      {
        en: "Available only when the platform has a supported picker implementation (`osascript`, PowerShell, `zenity`, or `kdialog`).",
        zh: "仅当平台具备受支持的选择器实现（`osascript`、PowerShell、`zenity` 或 `kdialog`）时可用。"
      },
      {
        en: "Cancelling is not treated as an error; the command returns `null`.",
        zh: "用户取消不视为错误；该接口会返回 `null`。"
      }
    ]
  },
  {
    name: "pick_folder",
    sourceFile: "commands/system.rs",
    order: 3,
    summary: {
      en: "Open the native folder picker and approve the selected directory.",
      zh: "打开原生文件夹选择器，并批准用户选中的目录。"
    },
    capability: {
      en: "Lets users choose a directory and registers it as an approved root for later file access.",
      zh: "允许用户选择目录，并将其登记为后续文件访问可用的批准根目录。"
    },
    inputs: [
      {
        name: "initialDirectory",
        type: "string | null",
        required: false,
        description: {
          en: "Optional initial folder for the picker.",
          zh: "可选的选择器初始目录。"
        }
      }
    ],
    output: "Promise<string | null>",
    outputDescription: {
      en: "Returns the approved canonical directory path, or `null` when the user cancels.",
      zh: "返回已批准的规范化目录路径；如果用户取消，则返回 `null`。"
    },
    usage: `const folder = await invoke("pick_folder", {
  initialDirectory: "/Users/name/Desktop"
});`,
    boundaries: [
      {
        en: "Only supported where a platform picker backend is available.",
        zh: "仅在存在平台原生选择器后端时可用。"
      },
      {
        en: "Selecting a folder expands the current desktop session's filesystem allowlist.",
        zh: "选择文件夹会扩展当前桌面会话中的文件系统白名单。"
      }
    ]
  }
];
