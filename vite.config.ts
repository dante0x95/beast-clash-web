import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    clearMocks: true,
    coverage: {
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.fixture.ts",
        "src/api/schema.d.ts",
        "src/main.tsx",
        "src/testing/**",
      ],
      include: ["src/**"],
      provider: "v8",
    },
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/testing/setup.ts"],
  },
});
