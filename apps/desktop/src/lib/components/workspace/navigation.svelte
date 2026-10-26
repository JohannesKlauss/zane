<script lang="ts">
  import { ChevronDown, MessageSquare, Plus, Workflow } from "@lucide/svelte"

  import { Button } from "#lib/components/ui/button/index.js"
  import * as DropdownMenu from "#lib/components/ui/dropdown-menu/index.js"

  import type { ItemKind, NavigationItem } from "./types.js"

  let {
    project = "Zane",
    items,
    selectedId,
    onselect,
    oncreate,
  }: {
    project?: string
    items: NavigationItem[]
    selectedId: string
    onselect: (id: string) => void
    oncreate: (kind: ItemKind) => void
  } = $props()

  const groups: { kind: ItemKind; label: string }[] = [
    { kind: "thread", label: "Threads" },
    { kind: "run", label: "Machine runs" },
  ]
</script>

<nav aria-label="Threads and runs" class="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
  <div class="flex h-16 shrink-0 items-center gap-2.5 px-4">
    <span class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
      <Workflow class="size-4" aria-hidden="true" />
    </span>
    <div class="min-w-0">
      <p class="truncate text-sm font-semibold text-foreground">{project}</p>
      <p class="truncate text-xs text-sidebar-muted-foreground">Local workspace</p>
    </div>
  </div>

  <div class="shrink-0 px-sidebar-inset pb-5">
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Button {...props} variant="outline" class="w-full justify-start border-sidebar-border bg-sidebar-control-surface text-sidebar-foreground" aria-label="New item">
            <Plus class="size-4" aria-hidden="true" />
            <span class="flex-1 text-left">New item</span>
            <ChevronDown class="size-3.5" aria-hidden="true" />
          </Button>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content class="w-48">
        <DropdownMenu.Item onSelect={() => oncreate("thread")}>
          <MessageSquare class="size-4" aria-hidden="true" /> New thread
        </DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => oncreate("run")}>
          <Workflow class="size-4" aria-hidden="true" /> New run
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </div>

  <div class="min-h-0 flex-1 overflow-y-auto px-sidebar-inset">
    {#each groups as group (group.kind)}
      <section class="mb-6" aria-label={group.label}>
        <div class="mb-2 flex items-center justify-between px-sidebar-row-inset text-[11px] font-medium text-sidebar-muted-foreground">
          <h2>{group.label}</h2>
          <span>{items.filter((item) => item.kind === group.kind).length}</span>
        </div>
        <div class="space-y-1">
          {#each items.filter((item) => item.kind === group.kind) as item (item.id)}
            <button
              type="button"
              class="group flex w-full items-start gap-2.5 rounded-control px-sidebar-row-inset py-2 text-left outline-none transition-colors hover:bg-sidebar-row-hover focus-visible:ring-2 focus-visible:ring-sidebar-ring active:bg-sidebar-row-active aria-pressed:bg-sidebar-row-selected aria-pressed:text-foreground"
              aria-label={`${item.kind === "thread" ? "Thread" : "Run"}: ${item.title} ${item.status}`}
              aria-pressed={selectedId === item.id}
              onclick={() => onselect(item.id)}
              title={item.title}
            >
              {#if item.kind === "thread"}
                <MessageSquare class="mt-0.5 size-3.5 shrink-0 text-sidebar-muted-foreground group-aria-pressed:text-primary" aria-hidden="true" />
              {:else}
                <Workflow class="mt-0.5 size-3.5 shrink-0 text-sidebar-muted-foreground group-aria-pressed:text-primary" aria-hidden="true" />
              {/if}
              <span class="min-w-0 flex-1">
                <span class="block truncate text-xs font-medium leading-5">{item.title}</span>
                <span class="block truncate text-[11px] leading-4 text-sidebar-muted-foreground group-aria-pressed:text-sidebar-foreground">{item.status}</span>
              </span>
            </button>
          {:else}
            <p class="px-sidebar-row-inset py-2 text-xs text-sidebar-muted-foreground">No {group.kind === "thread" ? "threads" : "runs"} yet</p>
          {/each}
        </div>
      </section>
    {/each}
  </div>

  <div class="shrink-0 border-t border-sidebar-border px-4 py-3">
    <p class="flex items-center gap-2 text-xs font-medium"><span class="size-1.5 rounded-full bg-primary"></span>Local preview</p>
    <p class="mt-1 text-[11px] text-sidebar-muted-foreground">No services connected</p>
  </div>
</nav>
