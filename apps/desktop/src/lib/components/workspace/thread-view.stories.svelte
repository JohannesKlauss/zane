<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf"
  import { expect, fn, userEvent, within } from "storybook/test"
  import type { ComponentProps } from "svelte"

  import Composer from "./composer.svelte"
  import ThreadView from "./thread-view.svelte"
  import type { Message } from "./types.js"

  const messages: Message[] = [
    { id: "user", role: "user", content: "Let's keep the next step small." },
    { id: "assistant", role: "assistant", content: "A sample assistant message.\n\nThe composer stays within reach while the conversation scrolls." },
  ]

  const { Story } = defineMeta({
    title: "Workspace/Thread view",
    component: ThreadView,
    args: { messages },
    render: template,
    parameters: { a11y: { test: "error" } },
  })
</script>

{#snippet template(args: Omit<ComponentProps<typeof ThreadView>, "children">)}
  <div class="flex h-[560px] max-w-3xl flex-col border border-border">
    <ThreadView {...args}><Composer onsubmit={fn()} onstop={fn()} /></ThreadView>
  </div>
{/snippet}

<Story name="Messages · Midnight" globals={{ appearance: "dark" }} />
<Story name="Messages · Supaterm light" globals={{ appearance: "light" }} />
<Story name="Empty · Midnight" globals={{ appearance: "dark" }} args={{ messages: [] }} />
<Story name="Empty · Supaterm light" globals={{ appearance: "light" }} args={{ messages: [] }} />

<Story
  name="Independent scroll"
  args={{ messages: Array.from({ length: 24 }, (_, index): Message => ({ id: `message-${index}`, role: index % 2 === 0 ? "user" : "assistant", content: `Local message ${index + 1}.\n\nA longer fixture checks that the transcript scrolls without moving the composer out of reach.` })) }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const log = canvas.getByRole("log", { name: "Messages" })
    const composer = canvas.getByRole("form", { name: "Message composer" })
    const originalTop = composer.getBoundingClientRect().top

    await expect(log.scrollHeight).toBeGreaterThan(log.clientHeight)
    log.scrollTop = 0
    await userEvent.click(canvas.getByRole("button", { name: "Jump to latest" }))
    await expect(log.scrollTop).toBeGreaterThan(0)
    await expect(composer.getBoundingClientRect().top).toBe(originalTop)
    await expect(canvas.getByRole("button", { name: "Send message" })).toBeVisible()
  }}
/>
