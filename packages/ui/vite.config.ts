import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, "src/index.ts"),
      name: "CoworkUI",
      fileName: "index",
      formats: ["es"]
    },
    rollupOptions: {
      external: ["vue"]
    }
  },
  test: {
    environment: "node"
  }
});
