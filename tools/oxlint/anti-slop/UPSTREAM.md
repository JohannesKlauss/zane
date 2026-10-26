# Anti-slop provenance

- Installed from `../../../.pi/skills/install-anti-slop` using the bundled `scripts/install.mjs`.
- Upstream repository and commit: unknown; the supplied assets do not identify them.
- Installed paths: `tools/oxlint/anti-slop/index.ts`, `rules/`, `shared/`, `effect/`, and `vendor/`.
- Pristine source snapshot SHA-256: `8c5567fa6b6a2523d9557c77bbdfaa93d832821e73a67135413e084c98465180`.
  Computed over all source files sorted by relative path, concatenating each relative path, a NUL byte, its raw contents, and a NUL byte. This record is not part of that snapshot. The supplied local skill retains the pristine source.
- Intentional deviations: none in copied source. Only the generic plugin is enabled; no workspace package declares a direct Effect dependency.
- Stylistic license and upstream details are preserved in `vendor/eslint-stylistic/LICENSE` and `vendor/eslint-stylistic/UPSTREAM.md`.