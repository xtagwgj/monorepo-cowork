# Desktop App Development

`apps/desktop` is the Tauri desktop shell for the monorepo. The frontend stays in Vue 3 + Vite, and native or system-facing work lives in Rust under `src-tauri`.

## Architecture

### Frontend

- `src/components/desktop/DesktopShell.vue`: route-level composition surface for the desktop home screen.
- `src/components/desktop/FileWorkbench.vue`: file IO demo and manual test surface.
- `src/composables/useDesktopSummary.ts`: runtime summary loader.
- `src/composables/useFileWorkbench.ts`: typed frontend wrapper around Tauri commands for file and system operations.
- `src/composables/useI18n.ts`: locale detection and string lookup. Chinese is used when the system language starts with `zh`; all other locales fall back to English.

### Backend

- `src-tauri/src/main.rs`: Tauri bootstrap only. It wires shared state and registers commands.
- `src-tauri/src/commands/app.rs`: app/runtime metadata commands.
- `src-tauri/src/commands/files.rs`: high-throughput file commands, including chunked sessions and streaming copy.
- `src-tauri/src/commands/system.rs`: OS integration such as opening a path and choosing files or folders.
- `src-tauri/src/domain/access.rs`: allowlist enforcement for filesystem and shell operations.
- `src-tauri/src/domain/models.rs`: serde request/response models shared by commands.
- `src-tauri/src/domain/sessions.rs`: buffered session state and chunk sizing rules.
- `src-tauri/src/domain/error.rs`: small shared error type for Rust commands.

## File IO Design

- Large files are handled with `BufReader` / `BufWriter` sessions stored in `SessionState`.
- The UI can either:
  - open a read session and a write session, then shuttle chunks explicitly, or
  - call `copy_file_streaming` to keep the whole copy in Rust.
- `normalize_chunk_size()` clamps transfer chunks to `1..=8 MiB`, which is a practical balance between syscall overhead and memory usage.
- The implementation is intended for multi-GB files and avoids loading whole files into memory.

## Access Boundaries

- Filesystem and shell actions are guarded by `AccessPolicy`.
- Built-in trusted roots include the workspace plus the user's Home, Desktop, Documents, and Downloads directories.
- Paths selected via system file or folder pickers are registered as approved roots for the current app session.
- Raw typed paths outside these trusted or approved roots are rejected.

## Command Conventions

- Keep commands thin and feature-scoped inside `src-tauri/src/commands`.
- Prefer request/response structs in `domain/models.rs` over ad hoc tuples.
- Prefer returning `Result<T, String>` from the Tauri boundary, but keep richer error handling in internal helpers.
- If a command needs shared mutable process state, store it in `SessionState` or another managed type instead of globals.

## Testing Strategy

- Rust:
  - use unit tests for stable logic in modules such as chunk normalization, state helpers, and path validation.
  - use manual end-to-end verification through the desktop UI for system dialogs and shell integration.
- Vue:
  - keep Tauri `invoke()` calls inside composables so components stay easy to test.
  - if the file workbench grows, split feature UI from command orchestration before adding component tests.
  - keep locale logic in pure helpers or composables so it can be covered by Vitest.

## Common Tasks

Run the desktop shell:

```bash
pnpm --filter @cowork/desktop dev
```

Type-check the Vue desktop app:

```bash
pnpm --filter @cowork/desktop typecheck
```

Check the Rust backend:

```bash
cd apps/desktop/src-tauri
cargo check
```

## Extension Guidelines

- New OS integrations belong in `commands/system.rs` unless they deserve their own feature module.
- New file-transfer features should build on the existing session-based API unless there is a measured reason to bypass it.
- Keep `main.rs` boring. If it starts accumulating helpers or business rules, move them into `commands` or `domain`.
