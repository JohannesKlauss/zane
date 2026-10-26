<script lang="ts">
  import { ArrowUp, Square } from "@lucide/svelte"

  import { Button } from "#lib/components/ui/button/index.js"
  import { Textarea } from "#lib/components/ui/textarea/index.js"

  let {
    draft = $bindable(""),
    busy = false,
    disabled = false,
    onsubmit,
    onstop,
  }: {
    draft?: string
    busy?: boolean
    disabled?: boolean
    onsubmit: (text: string) => void
    onstop: () => void
  } = $props()

  const id = $props.id()

  function submit() {
    const text = draft.trim()

    if (text && !busy && !disabled) onsubmit(text)
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) return

    event.preventDefault()
    submit()
  }
</script>

<form
  aria-label="Message composer"
  class="mx-auto w-full max-w-3xl rounded-xl border border-border bg-surface-raised p-2 shadow-composer focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20"
  onsubmit={(event) => { event.preventDefault(); submit() }}
>
  <Textarea
    bind:value={draft}
    aria-label="Message"
    aria-describedby={`${id}-hint`}
    placeholder="Ask a question, or describe what comes next…"
    class="max-h-40 min-h-20 resize-none overflow-y-auto border-0 bg-transparent text-sm focus-visible:ring-0 dark:bg-transparent"
    {disabled}
    onkeydown={handleKeydown}
  />
  <div class="flex min-w-0 items-center justify-between gap-2 px-1 pb-1">
    <p class="min-w-0 text-[11px] leading-4 text-muted-foreground" role="status">
      {#if busy}
        <span class="mr-1 inline-block size-1.5 rounded-full bg-primary"></span>Local activity in progress
      {:else if disabled}
        Composer unavailable
      {:else}
        Local only · no agent connected
      {/if}
    </p>
    {#if busy}
      <Button variant="secondary" size="sm" aria-label="Stop activity" onclick={onstop}>
        <Square class="size-3 fill-current" aria-hidden="true" />Stop
      </Button>
    {:else}
      <Button type="submit" size="sm" aria-label="Send message" disabled={disabled || !draft.trim()}>
        <ArrowUp class="size-3.5" aria-hidden="true" />Send
      </Button>
    {/if}
  </div>
</form>
<p id={`${id}-hint`} class="mx-auto mt-2 max-w-3xl px-1 text-[10px] text-muted-foreground">Enter to send · Shift+Enter for a new line</p>
