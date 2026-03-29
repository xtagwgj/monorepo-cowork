<script setup lang="ts">
import { computed } from "vue";
import Button from "@/components/ui/Button.vue";
import { useFileWorkbench } from "@/composables/useFileWorkbench";

const {
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
  listSelectedDirectory,
  openDestinationDirectory,
  pickDestinationDirectory,
  previewSourceChunk,
  previewText,
  sourcePath
} = useFileWorkbench();

const entryPreview = computed(() => directoryEntries.value.slice(0, 8));
</script>

<template>
  <section class="workbench">
    <div class="workbench__intro">
      <div>
        <p class="workbench__eyebrow">File Workbench</p>
        <h2 class="workbench__title">Chunked IO for large files</h2>
      </div>
      <p class="workbench__copy">
        Reads and writes run through buffered Rust sessions so multi-GB transfers do not need to load the full file into memory.
      </p>
    </div>

    <div class="workbench__grid">
      <label class="workbench__field">
        <span>Source file path</span>
        <input v-model="sourcePath" class="workbench__input" placeholder="/path/to/source.iso" />
      </label>

      <label class="workbench__field">
        <span>Destination folder</span>
        <div class="workbench__input-row">
          <input
            v-model="destinationDirectory"
            class="workbench__input"
            placeholder="/path/to/output"
          />
          <Button
            :disabled="isSelectingFolder"
            variant="outline"
            @click="pickDestinationDirectory"
          >
            {{ isSelectingFolder ? "Picking..." : "Choose folder" }}
          </Button>
        </div>
      </label>

      <label class="workbench__field">
        <span>Output file name</span>
        <input v-model="destinationName" class="workbench__input" placeholder="copy.bin" />
      </label>

      <label class="workbench__field">
        <span>Chunk size in bytes</span>
        <input v-model.number="chunkSize" class="workbench__input" min="1" step="65536" type="number" />
      </label>
    </div>

    <div class="workbench__actions">
      <Button :disabled="!canCopy" @click="copyByChunks">
        {{ isCopying ? "Copying..." : "Copy with read/write sessions" }}
      </Button>
      <Button :disabled="!canCopy" variant="outline" @click="copyInBackend">
        {{ isCopying ? "Running..." : "Copy fully in Rust" }}
      </Button>
      <Button :disabled="!sourcePath || isPreviewing" variant="outline" @click="previewSourceChunk">
        {{ isPreviewing ? "Reading..." : "Preview first chunk" }}
      </Button>
      <Button :disabled="!destinationDirectory" variant="outline" @click="listSelectedDirectory">
        {{ isBrowsingDirectory ? "Listing..." : "List folder" }}
      </Button>
      <Button :disabled="!destinationDirectory" variant="ghost" @click="openDestinationDirectory">
        Open in system
      </Button>
    </div>

    <p v-if="destinationPath" class="workbench__target">
      Target path: {{ destinationPath }}
    </p>
    <p v-if="errorMessage" class="workbench__error">{{ errorMessage }}</p>

    <div class="workbench__panels">
      <article class="workbench__panel">
        <p class="workbench__panel-label">Chunk preview</p>
        <pre class="workbench__preview">{{ previewText || "No preview loaded." }}</pre>
      </article>

      <article class="workbench__panel">
        <p class="workbench__panel-label">Selected folder entries</p>
        <ul class="workbench__list">
          <li v-for="entry in entryPreview" :key="entry.path" class="workbench__list-item">
            <span>{{ entry.name }}</span>
            <span>{{ entry.isDir ? "dir" : "file" }}</span>
          </li>
          <li v-if="entryPreview.length === 0" class="workbench__list-empty">No folder listing loaded.</li>
        </ul>
      </article>

      <article class="workbench__panel">
        <p class="workbench__panel-label">Activity</p>
        <ul class="workbench__log">
          <li v-for="entry in activityLog" :key="entry" class="workbench__log-entry">
            {{ entry }}
          </li>
          <li v-if="activityLog.length === 0" class="workbench__list-empty">
            Actions and transfer status will appear here.
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>

<style scoped>
.workbench {
  display: grid;
  gap: 1.25rem;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.8);
  padding: 1.5rem;
  box-shadow: 0 28px 80px -52px rgba(15, 23, 42, 0.55);
}

.workbench__intro {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.workbench__eyebrow,
.workbench__panel-label,
.workbench__field span {
  margin: 0;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.workbench__title {
  margin: 0.4rem 0 0;
  color: #0f172a;
  font-size: clamp(1.5rem, 2vw, 2.1rem);
}

.workbench__copy {
  margin: 0;
  max-width: 42ch;
  color: #475569;
  line-height: 1.7;
}

.workbench__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.workbench__field {
  display: grid;
  gap: 0.6rem;
}

.workbench__input-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
}

.workbench__input {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.92);
  color: #0f172a;
  padding: 0.85rem 1rem;
  font: inherit;
}

.workbench__input:focus-visible {
  outline: 2px solid rgba(15, 23, 42, 0.15);
  outline-offset: 2px;
}

.workbench__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.workbench__target {
  margin: 0;
  color: #334155;
  font-size: 0.95rem;
}

.workbench__error {
  margin: 0;
  color: #b91c1c;
}

.workbench__panels {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.workbench__panel {
  display: grid;
  gap: 0.8rem;
  border-radius: 22px;
  background: rgba(241, 245, 249, 0.88);
  padding: 1rem;
  min-height: 220px;
}

.workbench__preview {
  margin: 0;
  overflow: auto;
  color: #1e293b;
  font-family: "IBM Plex Mono", "SFMono-Regular", monospace;
  font-size: 0.84rem;
  white-space: pre-wrap;
  word-break: break-word;
}

.workbench__list,
.workbench__log {
  display: grid;
  gap: 0.55rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.workbench__list-item {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: #1e293b;
  font-size: 0.92rem;
}

.workbench__log-entry,
.workbench__list-empty {
  color: #475569;
  font-size: 0.92rem;
  line-height: 1.5;
}

@media (max-width: 960px) {
  .workbench__grid,
  .workbench__panels {
    grid-template-columns: 1fr;
  }

  .workbench__intro {
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .workbench__input-row {
    grid-template-columns: 1fr;
  }
}
</style>
