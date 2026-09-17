import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup-env.ts"],
    // Integration tests share one live DB and each does global `limparBanco()`
    // truncation in beforeEach. Running test files in parallel lets one file's
    // truncation wipe rows another file's test is mid-way through using,
    // producing flaky FK-violation / undefined-row failures. Serialize files.
    fileParallelism: false,
  },
});
