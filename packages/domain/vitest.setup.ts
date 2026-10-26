import { resultMatchers } from "@praha/byethrow-testing"
import type { ResultMatchers } from "@praha/byethrow-testing"
import { expect, beforeAll, afterAll, vi } from "vite-plus/test"

declare module "vite-plus/test" {
  interface Matchers<
    R extends void | Promise<void> = void | Promise<void>,
    T = unknown,
  > extends ResultMatchers<T> {}
}

beforeAll(() => {
  vi.stubEnv("TZ", "UTC")
})

afterAll(() => {
  vi.unstubAllEnvs()
})

expect.extend(resultMatchers)
