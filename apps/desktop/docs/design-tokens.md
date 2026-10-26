# Design-token foundation

`src/routes/layout.css` is the only production palette source. Tailwind v4 utilities,
shadcn-svelte controls, the renderer, and Storybook all consume its semantic variables.
There is no upstream theme engine or React runtime dependency.

## Provenance

Ported from `supabitapp/supaterm` at
[`5a05f44ec3f960716139f9723ceab6995b3c0b50`](https://github.com/supabitapp/supaterm/tree/5a05f44ec3f960716139f9723ceab6995b3c0b50):

- [Midnight colors](https://github.com/supabitapp/supaterm/blob/5a05f44ec3f960716139f9723ceab6995b3c0b50/packages/shared/src/builtInThemePalettes.ts#L3-L73)
- [Supaterm light colors](https://github.com/supabitapp/supaterm/blob/5a05f44ec3f960716139f9723ceab6995b3c0b50/packages/shared/src/themePalettes.ts#L144-L208)
- [Semantic mapping](https://github.com/supabitapp/supaterm/blob/5a05f44ec3f960716139f9723ceab6995b3c0b50/apps/web/src/index.css#L1077-L1158)
- [Geometry, fonts, and composer elevation](https://github.com/supabitapp/supaterm/blob/5a05f44ec3f960716139f9723ceab6995b3c0b50/apps/web/src/index.css#L79-L188)

The complete upstream MIT notice is retained in
[`static/licenses/supaterm.txt`](../static/licenses/supaterm.txt). Keeping it in static
assets also includes it in the packaged renderer and built Storybook.

## Mapping decisions

Raw OKLCH values are retained without RGB conversion. Dark is **Midnight**, not
`SUPATERM_DARK_THEME_COLORS`; light is `SUPATERM_LIGHT_THEME_COLORS`.

| Upstream role                                             | Application variable                                                   |
| --------------------------------------------------------- | ---------------------------------------------------------------------- |
| `canvas` / `text`                                         | `--background` / `--foreground`                                        |
| `surface` / `surfaceOverlay`                              | `--card` / `--popover`                                                 |
| `messageAction` / `messageActionForeground`               | `--primary` / `--primary-foreground`                                   |
| `messageActionHover`                                      | `--message-action-hover`                                               |
| `accentSurface` / `accentSurfaceForeground`               | `--accent` / `--accent-foreground`                                     |
| `focus`                                                   | `--ring` and `--sidebar-ring`                                          |
| `error` / `errorForeground` / `errorSurface`              | `--destructive` / `--destructive-foreground` / `--destructive-surface` |
| `chrome` / `toolbar` and toolbar controls                 | `--app-chrome-background`, `--toolbar-*`                               |
| `surfaceRaised` / `messageSurface`                        | `--surface-raised` / `--message-surface`                               |
| `textMuted`, `placeholder`, `secondaryLabel`, `iconMuted` | `--text-muted`, `--placeholder`, `--secondary-label`, `--icon-muted`   |
| `sidebar*`                                                | Corresponding `--sidebar-*` variables                                  |

The shadcn sidebar primary/ring aliases share the action/focus tokens. Its generic
sidebar accent maps to row hover; explicit row-hover, row-active, and row-selected
variables preserve the three upstream states. Shared foreground and chrome aliases
do not duplicate palette values.

The upstream system sans and monospace stacks replace Nunito Sans; no webfont is
required. The base radius is 10px, compact controls use an 8px radius, and the
existing Button retains its compact 32/28/24px sizes. Sidebar insets, control gaps,
floating-content insets, inside focus outlines, and light/dark composer shadows
follow the upstream foundation. The appearance editor, contrast engine, grain,
terminal, diff, and syntax themes are intentionally not ported.

## Appearance lifecycle

`static/appearance.js` is a small, idempotent classic script loaded synchronously
from the renderer head and Storybook's preview head, before body content. It sets
`.dark`, `data-appearance`, and `color-scheme` on `document.documentElement`, so
body-level portals inherit the same appearance.

The Appearance select stores `light` or `dark` in local storage under
`zane.appearance`. System removes that override. Missing or invalid preferences
follow the OS, including live OS changes; explicit preferences do not. Storage
events synchronize other windows. If storage is unavailable, appearance changes
still work for the current session. The Storybook test runner loads this same script
because it does not use `preview-head.html`.

## File renderer

The universal `src/hooks.ts` reroute maps `file://…/index.html` to its directory's
root route, preserving the file URL and relative asset base. HTTP routing and
other paths are unchanged; no custom protocol or hash router is added.
