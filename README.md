# monorepo-cowork

基于 `pnpm + Turborepo + Changesets + TypeScript` 的 Vue3 Monorepo。

当前桌面端已从 Electron 迁移为 `Tauri 2 + Vue 3 + Vite`，以降低内存占用并统一前端技术栈。

## 目录

```text
monorepo-cowork/
├── apps/
│   ├── web/
│   ├── docs/
│   └── desktop/
├── packages/
│   ├── ui/
│   ├── utils/
│   ├── types/
│   └── config-eslint/
├── tooling/
│   └── tsconfig/
├── .changeset/
├── .github/workflows/
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## 快速开始

```bash
pnpm install
pnpm dev
```

单独启动桌面端：

```bash
pnpm --filter @cowork/desktop dev
```

## 版本发布

```bash
pnpm changeset
pnpm version-packages
pnpm release
```
