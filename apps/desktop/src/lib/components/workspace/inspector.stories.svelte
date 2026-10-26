<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf"
  import { expect, fn, userEvent, within } from "storybook/test"

  import Inspector from "./inspector.svelte"
  import StatusActions from "./status-actions.svelte"

  type Args = { empty: boolean; showPosition: boolean }

  const { Story } = defineMeta({
    title: "Workspace/Inspector",
    render: template,
    args: { empty: false, showPosition: false },
    parameters: { a11y: { test: "error" } },
  })
</script>

{#snippet template({ empty, showPosition }: Args)}
  {#snippet position()}
    <p class="text-xs font-medium">Position extension</p>
    <p class="mt-2 text-xs leading-5 text-muted-foreground">A future machine-position view can be supplied here.</p>
  {/snippet}
  <div class="h-[520px] w-72 border border-border">
    <Inspector position={showPosition ? position : undefined}>
      {#snippet context()}
        <h2 class="text-xs font-medium">Workspace context</h2>
        <p class="mt-3 text-xs leading-5 text-muted-foreground">{empty ? "No context attached yet." : "Local fixture · Zane workspace. External services are not connected."}</p>
      {/snippet}
      {#snippet activity()}
        <h2 class="text-xs font-medium">Local activity</h2>
        <p class="mt-3 text-xs leading-5 text-muted-foreground">{empty ? "No activity yet." : "Review focus submitted locally."}</p>
      {/snippet}
      {#snippet footer()}
        <StatusActions status={empty ? "Ready" : "Needs input"} actionLabel="Stop run" actionDisabled={empty} onaction={fn()} onreset={fn()} />
      {/snippet}
    </Inspector>
  </div>
{/snippet}

<Story name="Content · Midnight" globals={{ appearance: "dark" }} />
<Story name="Content · Supaterm light" globals={{ appearance: "light" }} />
<Story name="Empty · Midnight" globals={{ appearance: "dark" }} args={{ empty: true }} />
<Story name="Empty · Supaterm light" globals={{ appearance: "light" }} args={{ empty: true }} />
<Story name="Position extension" args={{ showPosition: true }} />

<Story
  name="Keyboard tabs"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    canvas.getByRole("tab", { name: "Context" }).focus()
    await userEvent.keyboard("{ArrowRight}")
    await expect(canvas.getByRole("tab", { name: "Activity" })).toHaveFocus()
    await expect(canvas.getByRole("tab", { name: "Activity" })).toHaveAttribute("aria-selected", "true")
    await expect(canvas.getByText("Review focus submitted locally.")).toBeVisible()
    await userEvent.keyboard("{Home}")
    await expect(canvas.getByRole("tab", { name: "Context" })).toHaveAttribute("aria-selected", "true")
  }}
/>
