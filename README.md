# monorepo-cowork

基于 `pnpm + Turborepo + Changesets + TypeScript` 的 Vue3 Monorepo。

## 目录

```text
monorepo-cowork/
├── apps/
│   ├── web/
│   ├── docs/
│   └── electron/
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

## 版本发布

```bash
pnpm changeset
pnpm version-packages
pnpm release
```
