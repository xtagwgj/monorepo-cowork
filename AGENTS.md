# AGENTS.md - Agentic Coding Guidelines

This document provides guidelines for agents working in this monorepo.

## Project Overview

- **Monorepo**: pnpm workspaces with Turbo
- **Package Manager**: pnpm 9.15.4
- **TypeScript**: Strict mode enabled
- **Testing**: Vitest
- **Apps**: web (Vue 3), desktop (Tauri + Vue 3), docs (Vue 3)
- **Packages**: ui, utils, types, config-eslint

## Commands

### Root Commands (run from project root)

```bash
# Install dependencies
pnpm install

# Development - runs all apps in parallel
pnpm dev

# Build all packages/apps
pnpm build

# Run all tests
pnpm test

# Type check all packages/apps
pnpm typecheck

# Lint all packages/apps
pnpm lint

# Run changeset for versioning
pnpm changeset
pnpm version-packages
pnpm release
```

### Running a Single Test

From any package directory:

```bash
# Run tests in a specific package
cd packages/utils && pnpm test

# Run a specific test file
npx vitest run src/index.test.ts

# Run tests in watch mode
npx vitest
```

### Individual App/Package Commands

| Package | Commands |
|---------|----------|
| apps/web | `dev`, `build`, `typecheck`, `test` |
| apps/desktop | `dev`, `build`, `typecheck`, `test` |
| apps/docs | `dev`, `build`, `typecheck`, `test` |
| packages/ui | `dev`, `build`, `typecheck`, `test` |
| packages/utils | `build`, `typecheck`, `test` |
| packages/types | `build`, `typecheck` |

## Code Style Guidelines

### General

- Use TypeScript for all new code
- Use ES modules (`import`/`export`, not CommonJS)
- Use `void` for discarding returned promises: `void someAsyncFn()`

### Vue 3 Composition API

- Use `<script setup lang="ts">` for all Vue components
- Use `defineProps` and `defineEmits` with TypeScript types
- Use composables (functions starting with `use*`) for reusable logic
- Use Pinia for state management

Example:
```vue
<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps<{
  label: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  click: [id: string];
}>();

const count = ref(0);
const doubled = computed(() => count.value * 2);
</script>
```

### Naming Conventions

- **Files**: kebab-case (e.g., `my-component.vue`, `utils.ts`)
- **Components**: PascalCase (e.g., `MyComponent.vue`)
- **Composables/Functions**: camelCase, prefix with `use` for Vue composables (e.g., `useCounter`, `formatDate`)
- **Types/Interfaces**: PascalCase (e.g., `UserInfo`, `ApiResponse`)
- **Constants**: SCREAMING_SNAKE_CASE for config values

### Imports

- Use absolute imports with workspace aliases: `@cowork/ui`, `@cowork/utils`
- Group imports: external → workspace → relative
- Use `import type` for type-only imports

Example:
```typescript
import { ref } from "vue";                     // external
import { useCounterStore } from "@cowork/ui";  // workspace
import { cn } from "./utils";                  // relative
import type { User } from "./types";           // type-only
```

### TypeScript

- Enable `strict: true` in tsconfig
- Use explicit return types for functions
- Avoid `any`, use `unknown` when type is truly unknown
- Use optional chaining (`?.`) and nullish coalescing (`??`)

### Error Handling

- Use try/catch with async functions
- Return `null` or use optional types for potentially missing values
- Use `Result<T, E>` pattern for operations that can fail (when appropriate)

Example:
```typescript
async function fetchUser(id: string): Promise<User | null> {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return null;
  }
}
```

### Testing (Vitest)

- Use `describe` and `it` blocks
- Place tests alongside source files with `.test.ts` or `.spec.ts` suffix
- Use `expect` assertions from vitest

Example:
```typescript
import { describe, expect, it } from "vitest";
import { cn } from "./index";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", undefined, "b")).toBe("a b");
  });
});
```

### ESLint

- Minimal rules: only `no-console: warn`
- Add `@ts-expect-error` or `@ts-ignore` only when necessary and with a comment explaining why
- Prefer `@ts-expect-error` over `@ts-ignore`

### Project-Specific Patterns

#### Workspace Dependencies

Always use workspace protocol for internal packages:
```json
"@cowork/ui": "workspace:*",
"@cowork/utils": "workspace:*"
```

#### Catalog Versions

Use `catalog:` in package.json for shared dependency versions:
```json
"vue": "catalog:",
"vitest": "catalog:"
```

#### Tauri Desktop

- Prefer Tauri 2 when replacing Electron desktop shells
- Keep Vue UI in the Vite app and isolate Rust commands to `src-tauri/src/main.rs`
- Wrap raw `invoke()` calls in typed composables before they reach components

## Git Conventions

- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages
- Use Changesets for versioning: `pnpm changeset` to create changesets

## Additional Resources

- [Vue 3 Docs](https://vuejs.org/)
- [Vitest Docs](https://vitest.dev/)
- [TypeScript Docs](https://www.typescriptlang.org/)
- [Tauri Docs](https://tauri.app/)
