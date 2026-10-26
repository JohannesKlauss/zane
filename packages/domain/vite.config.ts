import { defineConfig } from "vite-plus"

export default defineConfig({
  pack: {
    deps: {
      // tsdown <0.23 compatibility: resolve external dependency subpaths.
      // Remove to preserve subpath imports as written (the new default).
      // https://tsdown.dev/options/dependencies#deps-resolvedepsubpath
      resolveDepSubpath: true,
    },
    dts: {
      generator: "tsgo",
    },
    exports: true,
  },
  test: {
    projects: [
      {
        test: {
          name: "domain:unit",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.integration.test.ts"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
      {
        test: {
          name: "domain:integration",
          include: ["src/**/*.integration.test.ts"],
          setupFiles: ["./vitest.setup.ts"],
          globalSetup: ["@epaper/persistence/testing/global-setup"],
        },
      },
    ],
  },
})
