<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf"
  import { expect, fn, userEvent, waitFor, within } from "storybook/test"
  import type { ComponentProps } from "svelte"

  import StatusActions from "./status-actions.svelte"

  const { Story } = defineMeta({
    title: "Workspace/Status actions",
    component: StatusActions,
    args: { status: "Ready", actionLabel: "Stop local activity", actionDisabled: true, onaction: fn(), onreset: fn() },
    render: template,
    parameters: { a11y: { test: "error" } },
  })
</script>

{#snippet template(args: ComponentProps<typeof StatusActions>)}
  <div class="w-72 rounded-lg border border-border p-3"><StatusActions {...args} /></div>
{/snippet}

<Story name="Idle · Midnight" globals={{ appearance: "dark" }} />
<Story name="Idle · Supaterm light" globals={{ appearance: "light" }} />
<Story name="Working · Midnight" globals={{ appearance: "dark" }} args={{ status: "Working", actionDisabled: false }} />
<Story name="Working · Supaterm light" globals={{ appearance: "light" }} args={{ status: "Working", actionDisabled: false }} />

<Story
  name="Actions"
  args={{ status: "Working", actionDisabled: false }}
  play={async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const page = within(canvasElement.ownerDocument.body)

    await userEvent.click(canvas.getByRole("button", { name: "Stop local activity" }))
    await expect(args.onaction).toHaveBeenCalledOnce()
    canvas.getByRole("button", { name: "Status actions" }).focus()
    await userEvent.keyboard("{Enter}")
    await waitFor(() => expect(page.getByRole("menuitem", { name: "Reset local item" })).toHaveFocus())
    await userEvent.keyboard("{Home}{Enter}")
    await expect(args.onreset).toHaveBeenCalledOnce()
    await waitFor(() => expect(page.queryByRole("menu")).not.toBeInTheDocument())
  }}
/>
