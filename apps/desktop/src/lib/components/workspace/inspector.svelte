<script lang="ts">
  import type { Snippet } from "svelte"

  import * as Tabs from "#lib/components/ui/tabs/index.js"

  let {
    context,
    activity,
    footer,
    position,
    value = $bindable("context"),
  }: {
    context: Snippet
    activity: Snippet
    footer?: Snippet
    position?: Snippet
    value?: string
  } = $props()
</script>

<aside aria-label="Inspector" class="flex h-full min-h-0 flex-col bg-background">
  <Tabs.Root bind:value class="min-h-0 flex-1 gap-0">
    <div class="flex h-12 shrink-0 items-center border-b border-border px-3">
      <Tabs.List aria-label="Inspector views" class="w-full bg-transparent p-0">
        <Tabs.Trigger value="context" class="h-6 text-xs text-muted-foreground data-active:bg-accent data-active:text-accent-foreground dark:data-active:border-transparent dark:data-active:bg-accent">Context</Tabs.Trigger>
        <Tabs.Trigger value="activity" class="h-6 text-xs text-muted-foreground data-active:bg-accent data-active:text-accent-foreground dark:data-active:border-transparent dark:data-active:bg-accent">Activity</Tabs.Trigger>
      </Tabs.List>
    </div>
    <Tabs.Content value="context" class="min-h-0 flex-1 overflow-y-auto px-4 py-5">{@render context()}</Tabs.Content>
    <Tabs.Content value="activity" class="min-h-0 flex-1 overflow-y-auto px-4 py-5">{@render activity()}</Tabs.Content>
  </Tabs.Root>
  {#if position}
    <section aria-label="Machine position" class="shrink-0 border-t border-border p-4">{@render position()}</section>
  {/if}
  {#if footer}
    <div class="shrink-0 border-t border-border p-3">{@render footer()}</div>
  {/if}
</aside>
