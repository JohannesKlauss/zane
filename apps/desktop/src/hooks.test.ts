import { expect, it } from "vite-plus/test"

import { reroute } from "./hooks.ts"

it.each([
  ["file:///Applications/Zane%20App/renderer/index.html", "/Applications/Zane%20App/renderer/"],
  ["file:///tmp/renderer/index.html?window=2", "/tmp/renderer/"],
  ["file:///tmp/renderer/other.html", "/tmp/renderer/other.html"],
  ["https://zane.example/index.html", "/index.html"],
  ["http://localhost:4174/", "/"],
])("routes %s to %s without changing unrelated paths", async (input, expected) => {
  expect(await reroute({ url: new URL(input), fetch })).toBe(expected)
})
