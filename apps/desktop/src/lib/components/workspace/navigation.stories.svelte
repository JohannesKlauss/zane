<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf"
  import { expect, fn, userEvent, waitFor, within } from "storybook/test"
  import type { ComponentProps } from "svelte"

  import Navigation from "./navigation.svelte"
  import type { NavigationItem } from "./types.js"

  const items: NavigationItem[] = [
    { id: "thread", kind: "thread", title: "Build the workspace", status: "Working" },
    { id: "run", kind: "run", title: "Review the shell", status: "Needs input" },
  ]

  const { Story } = defineMeta({
    title: "Workspace/Navigation",
    component: Navigation,
    args: { items, selectedId: "thread", onselect: fn(), oncreate: fn() },
    render: template,
    parameters: { a11y: { test: "error" } },
  })
</script>

{#snippet template(args: ComponentProps<typeof Navigation>)}
  <div class="h-[520px] w-64"><Navigation {...args} /></div>
{/snippet}

<Story name="Selected · Midnight" globals={{ appearance: "dark" }} />
<Story name="Selected · Supaterm light" globals={{ appearance: "light" }} />
<Story name="Empty · Midnight" globals={{ appearance: "dark" }} args={{ items: [] }} />
<Story name="Empty · Supaterm light" globals={{ appearance: "light" }} args={{ items: [] }} />

<Story
  name="Selection and keyboard creation"
  play={async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const page = within(canvasElement.ownerDocument.body)

    await userEvent.click(canvas.getByRole("button", { name: /^Run: Review the shell / }))
    await expect(args.onselect).toHaveBeenCalledOnce()
    await expect(args.onselect).toHaveBeenCalledWith("run")
    canvas.getByRole("button", { name: "New item" }).focus()
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(page.getByRole("menuitem", { name: "New thread" })).toHaveFocus())
    await userEvent.keyboard("{ArrowDown}{Enter}")
    await expect(args.oncreate).toHaveBeenCalledOnce()
    await expect(args.oncreate).toHaveBeenCalledWith("run")
  }}
/>
