<script setup lang="ts">
import { computed, shallowRef } from "vue";
import ApiMethodCard from "@/components/ApiMethodCard.vue";
import { apiGroups, apiMethods, resolveDocsLocale, t, type DocsLocale } from "@/data/api-docs";

const locale = shallowRef<DocsLocale>(resolveDocsLocale(globalThis.navigator?.language));
const fileFilter = shallowRef<"all" | "commands/app.rs" | "commands/files.rs" | "commands/system.rs">("all");
const search = shallowRef("");

const labels = computed(() => {
  if (locale.value === "zh") {
    return {
      heroEyebrow: "Tauri 桌面 API",
      heroTitle: "Cowork 桌面壳方法文档",
      heroCopy:
        "此页面整理了当前桌面宿主暴露的全部 Tauri 命令。每个方法都包含入参、出参、调用方式、能力边界，以及它在文件内的实现归属。",
      methods: "方法数",
      sourceFiles: "源码文件",
      search: "搜索",
      searchPlaceholder: "按方法名、能力或源码文件搜索",
      file: "文件分类",
      all: "全部",
      contents: "目录",
      capability: "能力说明",
      input: "入参",
      output: "出参",
      invokeExample: "调用示例",
      boundary: "能力边界",
      name: "名称",
      type: "类型",
      required: "必填",
      description: "说明",
      noInputParameters: "该方法没有入参。",
      yes: "是",
      no: "否",
      langEnglish: "English",
      langChinese: "中文"
    };
  }

  return {
    heroEyebrow: "Tauri Desktop API",
    heroTitle: "Cowork desktop shell methods",
    heroCopy:
      "This page documents every Tauri command currently exposed by the desktop host. Each method includes its input contract, output contract, invoke example, source file grouping, and the boundary conditions you should design against.",
    methods: "Methods",
    sourceFiles: "Source files",
    search: "Search",
    searchPlaceholder: "Find by method name, capability, or source file",
    file: "File category",
    all: "All",
    contents: "Contents",
    capability: "Capability",
    input: "Input",
    output: "Output",
    invokeExample: "Invoke Example",
    boundary: "Boundary",
    name: "Name",
    type: "Type",
    required: "Required",
    description: "Description",
    noInputParameters: "No input parameters.",
    yes: "Yes",
    no: "No",
    langEnglish: "English",
    langChinese: "中文"
  };
});

const filteredGroups = computed(() => {
  const keyword = search.value.trim().toLowerCase();

  return apiGroups
    .filter((group) => fileFilter.value === "all" || group.sourceFile === fileFilter.value)
    .map((group) => {
      const methods = apiMethods
        .filter((method) => method.sourceFile === group.sourceFile)
        .sort((left, right) => left.order - right.order)
        .filter((method) => {
          if (!keyword) {
            return true;
          }

          return (
            method.name.toLowerCase().includes(keyword) ||
            method.sourceFile.toLowerCase().includes(keyword) ||
            t(method.summary, locale.value).toLowerCase().includes(keyword) ||
            t(method.capability, locale.value).toLowerCase().includes(keyword)
          );
        });

      return {
        ...group,
        methods
      };
    })
    .filter((group) => group.methods.length > 0);
});

const methodCount = computed(() =>
  filteredGroups.value.reduce((count, group) => count + group.methods.length, 0)
);

function setLocale(nextLocale: DocsLocale): void {
  locale.value = nextLocale;
}
</script>

<template>
  <main class="docs-page">
    <section class="hero">
      <div class="hero__content">
        <p class="hero__eyebrow">{{ labels.heroEyebrow }}</p>
        <h1 class="hero__title">{{ labels.heroTitle }}</h1>
        <p class="hero__copy">
          {{ labels.heroCopy }}
        </p>
      </div>
      <div class="hero__meta">
        <div class="hero__lang-switch">
          <button
            :class="['hero__lang-button', locale === 'en' && 'hero__lang-button--active']"
            type="button"
            @click="setLocale('en')"
          >
            {{ labels.langEnglish }}
          </button>
          <button
            :class="['hero__lang-button', locale === 'zh' && 'hero__lang-button--active']"
            type="button"
            @click="setLocale('zh')"
          >
            {{ labels.langChinese }}
          </button>
        </div>
        <div class="hero__stat">
          <span>{{ labels.methods }}</span>
          <strong>{{ methodCount }}</strong>
        </div>
        <div class="hero__stat">
          <span>{{ labels.sourceFiles }}</span>
          <strong>{{ filteredGroups.length }}</strong>
        </div>
      </div>
    </section>

    <section class="toolbar">
      <label class="toolbar__field">
        <span>{{ labels.search }}</span>
        <input v-model="search" :placeholder="labels.searchPlaceholder" />
      </label>
      <label class="toolbar__field">
        <span>{{ labels.file }}</span>
        <select v-model="fileFilter">
          <option value="all">{{ labels.all }}</option>
          <option value="commands/app.rs">commands/app.rs</option>
          <option value="commands/files.rs">commands/files.rs</option>
          <option value="commands/system.rs">commands/system.rs</option>
        </select>
      </label>
    </section>

    <section class="layout">
      <aside class="sidebar">
        <h2>{{ labels.contents }}</h2>
        <div class="sidebar__groups">
          <section v-for="group in filteredGroups" :key="group.sourceFile" class="sidebar__group">
            <p class="sidebar__group-title">{{ t(group.title, locale) }}</p>
            <p class="sidebar__group-file">{{ group.sourceFile }}</p>
            <nav class="sidebar__nav">
              <a v-for="method in group.methods" :key="method.name" :href="`#${method.name}`">
                <span>{{ method.name }}</span>
                <small>#{{ method.order }}</small>
              </a>
            </nav>
          </section>
        </div>
      </aside>

      <section class="content">
        <section v-for="group in filteredGroups" :key="group.sourceFile" class="content__group">
          <header class="content__group-header">
            <p class="content__group-file">{{ group.sourceFile }}</p>
            <h2>{{ t(group.title, locale) }}</h2>
            <p>{{ t(group.description, locale) }}</p>
          </header>

          <ApiMethodCard
            v-for="method in group.methods"
            :key="method.name"
            :labels="labels"
            :locale="locale"
            :method="method"
          />
        </section>
      </section>
    </section>
  </main>
</template>

<style scoped>
.docs-page {
  display: grid;
  gap: 1.5rem;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 36px;
  background:
    radial-gradient(circle at top right, rgba(45, 212, 191, 0.28), transparent 32%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.9));
  padding: 2rem;
  box-shadow: 0 30px 90px -58px rgba(15, 23, 42, 0.65);
}

.hero__eyebrow {
  margin: 0;
  color: #0f766e;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.hero__title {
  margin: 0.5rem 0 0;
  color: #0f172a;
  font-size: clamp(2.4rem, 6vw, 4.6rem);
  line-height: 0.95;
}

.hero__copy {
  margin: 1rem 0 0;
  max-width: 62ch;
  color: #334155;
  line-height: 1.8;
}

.hero__meta {
  display: grid;
  gap: 1rem;
}

.hero__lang-switch {
  display: inline-flex;
  gap: 0.5rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.74);
  padding: 0.4rem;
}

.hero__lang-button {
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #475569;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  padding: 0.65rem 0.95rem;
}

.hero__lang-button--active {
  background: #0f172a;
  color: #f8fafc;
}

.hero__stat {
  display: grid;
  align-content: center;
  gap: 0.35rem;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.75);
  padding: 1.25rem;
}

.hero__stat span {
  color: #64748b;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.hero__stat strong {
  color: #0f172a;
  font-size: 2rem;
}

.toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 1rem;
}

.toolbar__field {
  display: grid;
  gap: 0.55rem;
}

.toolbar__field span {
  color: #475569;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.toolbar__field input,
.toolbar__field select {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.88);
  padding: 0.95rem 1rem;
  font: inherit;
  color: #0f172a;
}

.layout {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 1.25rem;
  align-items: start;
}

.sidebar {
  position: sticky;
  top: 1.5rem;
  display: grid;
  gap: 0.85rem;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.78);
  padding: 1.25rem;
  overflow: hidden;
}

.sidebar h2 {
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
}

.sidebar__groups {
  display: grid;
  gap: 1rem;
}

.sidebar__group {
  display: grid;
  gap: 0.55rem;
}

.sidebar__group-title {
  margin: 0;
  color: #0f172a;
  font-weight: 700;
}

.sidebar__group-file {
  margin: 0;
  color: #64748b;
  font-size: 0.82rem;
  overflow-wrap: anywhere;
}

.sidebar__nav {
  display: grid;
  gap: 0.5rem;
}

.sidebar__nav a {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 0.75rem;
  width: 100%;
  min-width: 0;
  border-radius: 16px;
  padding: 0.8rem 0.9rem;
  color: #1e293b;
  text-decoration: none;
  background: rgba(248, 250, 252, 0.88);
}

.sidebar__nav a span,
.sidebar__nav a small {
  min-width: 0;
  overflow-wrap: anywhere;
}

.sidebar__nav a small {
  color: #64748b;
}

.content {
  display: grid;
  gap: 1.5rem;
}

.content__group {
  display: grid;
  gap: 1rem;
}

.content__group-header {
  display: grid;
  gap: 0.45rem;
}

.content__group-file {
  margin: 0;
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.content__group-header h2 {
  margin: 0;
  color: #0f172a;
}

.content__group-header p:last-child {
  margin: 0;
  color: #475569;
  line-height: 1.7;
}

@media (max-width: 960px) {
  .hero,
  .toolbar,
  .layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }
}
</style>
