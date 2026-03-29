<script setup lang="ts">
import { computed } from "vue";
import type { ApiMethodDoc, DocsLocale } from "@/data/api-docs";
import { t } from "@/data/api-docs";

const props = defineProps<{
  locale: DocsLocale;
  labels: {
    capability: string;
    input: string;
    output: string;
    invokeExample: string;
    boundary: string;
    name: string;
    type: string;
    required: string;
    description: string;
    noInputParameters: string;
    yes: string;
    no: string;
  };
  method: ApiMethodDoc;
}>();

const localizedSummary = computed(() => t(props.method.summary, props.locale));
const localizedCapability = computed(() => t(props.method.capability, props.locale));
const localizedOutputDescription = computed(() => t(props.method.outputDescription, props.locale));
const localizedBoundaries = computed(() => props.method.boundaries.map((item) => t(item, props.locale)));
</script>

<template>
  <article class="method-card" :id="method.name">
    <div class="method-card__header">
      <div>
        <p class="method-card__module">{{ method.sourceFile }}</p>
        <h2 class="method-card__title">{{ method.name }}</h2>
      </div>
      <p class="method-card__summary">{{ localizedSummary }}</p>
    </div>

    <section class="method-card__section">
      <h3>{{ labels.capability }}</h3>
      <p>{{ localizedCapability }}</p>
    </section>

    <section class="method-card__section">
      <h3>{{ labels.input }}</h3>
      <table class="method-card__table">
        <thead>
          <tr>
            <th>{{ labels.name }}</th>
            <th>{{ labels.type }}</th>
            <th>{{ labels.required }}</th>
            <th>{{ labels.description }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="method.inputs.length === 0">
            <td colspan="4">{{ labels.noInputParameters }}</td>
          </tr>
          <tr v-for="field in method.inputs" :key="field.name">
            <td><code>{{ field.name }}</code></td>
            <td><code>{{ field.type }}</code></td>
            <td>{{ field.required ? labels.yes : labels.no }}</td>
            <td>{{ t(field.description, locale) }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="method-card__section">
      <h3>{{ labels.output }}</h3>
      <p><code>{{ method.output }}</code></p>
      <p>{{ localizedOutputDescription }}</p>
    </section>

    <section class="method-card__section">
      <h3>{{ labels.invokeExample }}</h3>
      <pre><code>{{ method.usage }}</code></pre>
    </section>

    <section class="method-card__section">
      <h3>{{ labels.boundary }}</h3>
      <ul class="method-card__boundaries">
        <li v-for="item in localizedBoundaries" :key="item">{{ item }}</li>
      </ul>
    </section>
  </article>
</template>

<style scoped>
.method-card {
  display: grid;
  gap: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.86);
  padding: 1.5rem;
  box-shadow: 0 22px 70px -48px rgba(15, 23, 42, 0.55);
  scroll-margin-top: 2rem;
}

.method-card__header {
  display: grid;
  gap: 0.75rem;
}

.method-card__module {
  margin: 0;
  color: #0f766e;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  overflow-wrap: anywhere;
}

.method-card__title {
  margin: 0.25rem 0 0;
  color: #0f172a;
  font-size: 1.5rem;
}

.method-card__summary {
  margin: 0;
  color: #334155;
  line-height: 1.7;
}

.method-card__section {
  display: grid;
  gap: 0.55rem;
}

.method-card__section h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
}

.method-card__section p {
  margin: 0;
  color: #475569;
  line-height: 1.7;
}

.method-card__table {
  width: 100%;
  border-collapse: collapse;
  overflow: hidden;
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.95);
}

.method-card__table th,
.method-card__table td {
  padding: 0.85rem;
  border-bottom: 1px solid rgba(203, 213, 225, 0.65);
  text-align: left;
  vertical-align: top;
  color: #334155;
  font-size: 0.92rem;
}

.method-card__table th {
  color: #0f172a;
}

.method-card__table tr:last-child td {
  border-bottom: 0;
}

.method-card__section pre {
  margin: 0;
  overflow: auto;
  border-radius: 18px;
  background: #0f172a;
  color: #e2e8f0;
  padding: 1rem;
}

.method-card__boundaries {
  display: grid;
  gap: 0.55rem;
  margin: 0;
  padding-left: 1.2rem;
  color: #475569;
}
</style>
