import { mkdtemp, readFile, readdir, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import { expect, it } from "vite-plus/test"

import { packageRenderer } from "../electron/package-renderer.ts"

it("packages the complete SvelteKit renderer after Forge cleans its build directory", async () => {
  const buildPath = await mkdtemp(path.join(tmpdir(), "zane-renderer-package-"))

  try {
    await packageRenderer(buildPath)
    const renderer = path.join(buildPath, ".vite/renderer/main_window")
    const html = await readFile(path.join(renderer, "index.html"), "utf8")

    expect(html).toContain("appearance.js")
    expect(html).toContain("_app/immutable/entry/")
    expect(await readFile(path.join(renderer, "appearance.js"), "utf8")).toContain("zaneAppearance")
    expect(await readdir(path.join(renderer, "_app/immutable/nodes"))).toContainEqual(
      expect.stringMatching(/^2\..+\.js$/),
    )
  } finally {
    await rm(buildPath, { recursive: true, force: true })
  }
}, 60_000)
