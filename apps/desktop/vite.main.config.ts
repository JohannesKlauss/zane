import { defineConfig } from "vite-plus"

// https://vitejs.dev/config
export default defineConfig({
  build: {
    outDir: ".vite/build",
    rolldownOptions: {
      external: ["electron-squirrel-startup"],
    },
    lib: {
      formats: ["es"],
      entry: "electron/main.ts",
      fileName: "main",
    },
  },
})
