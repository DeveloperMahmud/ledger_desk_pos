import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    // Domain-rule tests do not need a browser; Node is faster and more stable on free Windows runners.
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Keep Windows CI/free-tier runners stable under constrained process limits.
    fileParallelism: false,
    maxWorkers: 1,
  },
});
