<script lang="ts">
  import { MessageSquare, MoreHorizontal, PanelLeft, PanelRight, RotateCcw, Workflow } from "@lucide/svelte"

  import { Button } from "#lib/components/ui/button/index.js"
  import * as DropdownMenu from "#lib/components/ui/dropdown-menu/index.js"

  import type { ShellControls } from "./app-shell.svelte"
  import type { ItemKind } from "./types.js"

  let {
    title,
    kind,
    controls,
    onreset,
  }: {
    title: string
    kind: ItemKind
    controls: ShellControls
    onreset: () => void
  } = $props()
</script>

<header class="flex h-12 min-w-0 shrink-0 items-center gap-2 border-b border-border bg-toolbar px-2 text-toolbar-foreground">
  <Button variant="ghost" size="icon-sm" aria-label={controls.navigationOpen ? "Hide navigation" : "Show navigation"} aria-expanded={controls.navigationOpen} title={controls.navigationOpen ? "Hide navigation" : "Show navigation"} onclick={controls.toggleNavigation}>
    <PanelLeft class="size-4" aria-hidden="true" />
  </Button>
  <div class="flex min-w-0 flex-1 items-center gap-2">
    {#if kind === "thread"}
      <MessageSquare class="size-3.5 shrink-0 text-icon-muted" aria-hidden="true" />
    {:else}
      <Workflow class="size-3.5 shrink-0 text-icon-muted" aria-hidden="true" />
    {/if}
    <h1 class="truncate text-xs font-medium" title={title}>{title}</h1>
  </div>
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button {...props} variant="ghost" size="icon-sm" aria-label="Item actions" title="Item actions">
          <MoreHorizontal class="size-4" aria-hidden="true" />
        </Button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end" class="w-48">
      <DropdownMenu.Item onSelect={onreset}><RotateCcw class="size-4" aria-hidden="true" />Reset local item</DropdownMenu.Item>
      <DropdownMenu.Separator />
      <DropdownMenu.Item disabled>Connect an agent (not available)</DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
  <Button variant="ghost" size="icon-sm" aria-label={controls.inspectorOpen ? "Hide inspector" : "Show inspector"} aria-expanded={controls.inspectorOpen} title={controls.inspectorOpen ? "Hide inspector" : "Show inspector"} onclick={controls.toggleInspector}>
    <PanelRight class="size-4" aria-hidden="true" />
  </Button>
</header>
