<script lang="ts">
  import { Workflow } from "@lucide/svelte"
  import type { Snippet } from "svelte"

  let {
    title,
    status,
    step,
    totalSteps,
    children,
    actions,
  }: {
    title: string
    status: string
    step: number
    totalSteps: number
    children: Snippet
    actions: Snippet
  } = $props()
</script>

<div class="flex min-h-0 flex-1 flex-col gap-4 p-5">
  <div class="flex shrink-0 items-center justify-between gap-2 text-xs text-muted-foreground">
    <p class="flex items-center gap-2"><Workflow class="size-4 text-primary" aria-hidden="true" />Machine run</p>
    <span>Local fixture</span>
  </div>
  <section aria-label="Current machine step" class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
    <header class="shrink-0 border-b border-border p-5">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p class="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">Step {String(step).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}</p>
        <span role="status" class="rounded-md bg-accent px-2 py-1 text-[10px] font-medium text-accent-foreground">{status}</span>
      </div>
      <h2 class="text-lg font-medium tracking-tight">{title}</h2>
    </header>
    <div class="min-h-0 flex-1 overflow-y-auto p-5">{@render children()}</div>
    <footer class="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-surface-raised px-5 py-3">{@render actions()}</footer>
  </section>
</div>
