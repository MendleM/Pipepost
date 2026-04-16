import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        "src/index.ts",
        "src/tools/**",
        // Pure display/formatting layers — exercised indirectly; runtime tests
        // would just restate their output. Skip to keep coverage signal focused
        // on logic rather than strings.
        "src/format-response.ts",
        "src/format.ts",
        "src/audit/format.ts",
        "src/drafts/format.ts",
        // Type-only modules have no runtime behavior to cover.
        "src/**/types.ts",
      ],
      thresholds: { statements: 90, branches: 75, functions: 90, lines: 90 },
    },
  },
  resolve: {
    alias: { "@": resolve(__dirname, "./src") },
  },
});
