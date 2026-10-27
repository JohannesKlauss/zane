import type { R } from "@praha/byethrow"

export const hasDependencies =
  <Deps extends readonly unknown[]>() =>
  <Args extends readonly unknown[], R extends R.ResultAsync<unknown, unknown>>(
    fn: (deps: Deps, ...args: Args) => R,
  ) =>
  (deps: Deps) =>
  (...args: Args): R =>
    fn(deps, ...args)
