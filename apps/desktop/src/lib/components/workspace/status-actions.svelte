<script lang="ts">
  import { MoreHorizontal, RotateCcw, Square } from "@lucide/svelte"

  import { Button } from "#lib/components/ui/button/index.js"
  import * as DropdownMenu from "#lib/components/ui/dropdown-menu/index.js"

  let {
    status,
    actionLabel,
    actionDisabled = false,
    onaction,
    onreset,
  }: {
    status: string
    actionLabel: string
    actionDisabled?: boolean
    onaction: () => void
    onreset: () => void
  } = $props()
</script>

<div class="flex min-w-0 items-center gap-1.5">
  <p role="status" class="flex min-w-0 flex-1 items-center gap-2 text-[11px]" title={status}>
    <span class="size-1.5 shrink-0 rounded-full bg-primary"></span><span class="truncate">{status}</span>
  </p>
  <Button variant="outline" size="xs" aria-label={actionLabel} disabled={actionDisabled} onclick={onaction} title={actionDisabled ? "No active local work to stop" : actionLabel}>
    <Square class="size-2.5" aria-hidden="true" />Stop
  </Button>
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button {...props} variant="ghost" size="icon-xs" aria-label="Status actions" title="Status actions"><MoreHorizontal class="size-3.5" aria-hidden="true" /></Button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end" class="w-48">
      <DropdownMenu.Item onSelect={onreset}><RotateCcw class="size-3.5" aria-hidden="true" />Reset local item</DropdownMenu.Item>
      <DropdownMenu.Separator />
      <DropdownMenu.Item disabled>Connect services (not available)</DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>
