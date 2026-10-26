import { cp } from "node:fs/promises"
import path from "node:path"

import { createBuilder } from "vite-plus"

export async function packageRenderer(buildPath: string) {
  const root = path.resolve(import.meta.dirname, "..")
  const renderer = ".vite/renderer/main_window"

  const builder = await createBuilder({
    root,
    configFile: path.join(root, "vite.config.ts"),
    logLevel: "warn",
  })

  await builder.buildApp()
  await cp(path.join(root, renderer), path.join(buildPath, renderer), { recursive: true })
}
