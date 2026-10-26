<script lang="ts">
  import { MessageSquare, Workflow } from "@lucide/svelte"
  import { tick, type Snippet } from "svelte"

  import { Button } from "#lib/components/ui/button/index.js"

  import type { Message } from "./types.js"

  let { messages, notice, children }: { messages: Message[]; notice?: string; children: Snippet } = $props()
  let scrollArea: HTMLDivElement | undefined = $state()

  $effect(() => {
    const lastMessage = messages.at(-1)?.id

    if (lastMessage) {
      tick().then(() => scrollArea?.scrollTo({ top: scrollArea.scrollHeight }))
    }
  })
</script>

<div class="flex min-h-0 flex-1 flex-col">
  <div bind:this={scrollArea} role="log" aria-label="Messages" aria-live="polite" aria-relevant="additions" class="min-h-0 flex-1 overflow-y-auto px-5 py-8 outline-none focus-visible:ring-1 focus-visible:ring-ring">
    {#if messages.length === 0}
      <div class="mx-auto flex h-full max-w-sm flex-col items-center justify-center text-center">
        <span class="mb-4 flex size-10 items-center justify-center rounded-xl border border-border bg-surface-raised text-muted-foreground"><MessageSquare class="size-5" aria-hidden="true" /></span>
        <h2 class="text-base font-medium">A little context goes a long way.</h2>
        <p class="mt-2 text-xs leading-5 text-muted-foreground">Start with a question, an idea, or something to work through.</p>
      </div>
    {:else}
      <div class="mx-auto flex w-full max-w-3xl flex-col gap-7">
        <div class="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span>Conversation</span>
          <Button variant="ghost" size="xs" class="text-[11px]" onclick={() => scrollArea?.scrollTo({ top: scrollArea.scrollHeight })}>Jump to latest</Button>
        </div>
        {#each messages as message (message.id)}
          <article aria-label={message.role === "user" ? "Your message" : "Assistant message"} class={message.role === "user" ? "ml-auto max-w-[90%]" : "w-full"}>
            <div class="mb-2 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
              {#if message.role === "assistant"}<Workflow class="size-3.5 text-primary" aria-hidden="true" />{/if}
              {message.role === "user" ? "You" : "Zane"}
            </div>
            <div class={message.role === "user" ? "whitespace-pre-wrap rounded-xl bg-message px-4 py-3 text-sm leading-6 text-message-foreground [overflow-wrap:anywhere]" : "whitespace-pre-wrap text-sm leading-6 [overflow-wrap:anywhere]"}>{message.content}</div>
          </article>
        {/each}
        {#if notice}<p role="status" class="border-l-2 border-border pl-3 text-xs text-muted-foreground">{notice}</p>{/if}
      </div>
    {/if}
  </div>
  <div class="shrink-0 px-4 pb-4 pt-2">{@render children()}</div>
</div>
