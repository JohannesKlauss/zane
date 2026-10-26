<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf"
  import { expect, fireEvent, fn, userEvent, within } from "storybook/test"

  import Composer from "./composer.svelte"

  const { Story } = defineMeta({
    title: "Workspace/Composer",
    component: Composer,
    args: { onsubmit: fn(), onstop: fn() },
    parameters: { a11y: { test: "error" } },
  })
</script>

<Story name="Empty · Midnight" globals={{ appearance: "dark" }} />
<Story name="Empty · Supaterm light" globals={{ appearance: "light" }} />
<Story name="Ready · Midnight" globals={{ appearance: "dark" }} args={{ draft: "Compare the two approaches." }} />
<Story name="Ready · Supaterm light" globals={{ appearance: "light" }} args={{ draft: "Compare the two approaches." }} />
<Story name="Busy · Midnight" globals={{ appearance: "dark" }} args={{ busy: true, draft: "A draft for the next message." }} />
<Story name="Busy · Supaterm light" globals={{ appearance: "light" }} args={{ busy: true, draft: "A draft for the next message." }} />
<Story name="Disabled · Midnight" globals={{ appearance: "dark" }} args={{ disabled: true }} />
<Story name="Disabled · Supaterm light" globals={{ appearance: "light" }} args={{ disabled: true }} />

<Story
  name="Keyboard and composition"
  play={async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole("textbox", { name: "Message" })

    await userEvent.type(input, "  First line")
    await userEvent.keyboard("{Shift>}{Enter}{/Shift}")
    await userEvent.type(input, "Second line  ")
    await fireEvent.keyDown(input, { key: "Enter", isComposing: true })
    await expect(args.onsubmit).not.toHaveBeenCalled()
    await expect(input).toHaveValue("  First line\nSecond line  ")
    await userEvent.keyboard("{Enter}")
    await expect(args.onsubmit).toHaveBeenCalledOnce()
    await expect(args.onsubmit).toHaveBeenCalledWith("First line\nSecond line")
  }}
/>

<Story
  name="Whitespace is not submitted"
  play={async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.type(canvas.getByRole("textbox", { name: "Message" }), "   ")
    await userEvent.keyboard("{Enter}")
    await expect(canvas.getByRole("button", { name: "Send message" })).toBeDisabled()
    await expect(args.onsubmit).not.toHaveBeenCalled()
  }}
/>

<Story
  name="Stop callback"
  args={{ busy: true }}
  play={async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Stop activity" }))
    await expect(args.onstop).toHaveBeenCalledOnce()
    await expect(args.onsubmit).not.toHaveBeenCalled()
  }}
/>
