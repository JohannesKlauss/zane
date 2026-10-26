<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf"
  import { expect, fn, userEvent, within } from "storybook/test"

  import ContentHeader from "./content-header.svelte"

  const { Story } = defineMeta({
    title: "Workspace/Content header",
    component: ContentHeader,
    args: {
      title: "Build the workspace",
      kind: "thread",
      controls: { navigationOpen: true, inspectorOpen: true, toggleNavigation: fn(), toggleInspector: fn() },
      onreset: fn(),
    },
    parameters: { layout: "fullscreen", a11y: { test: "error" } },
  })
</script>

<Story name="Thread · Midnight" globals={{ appearance: "dark" }} />
<Story name="Thread · Supaterm light" globals={{ appearance: "light" }} />
<Story name="Run · Midnight" globals={{ appearance: "dark" }} args={{ title: "Review the shell", kind: "run" }} />
<Story name="Run · Supaterm light" globals={{ appearance: "light" }} args={{ title: "Review the shell", kind: "run" }} />

<Story
  name="Pane callbacks"
  play={async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole("button", { name: "Hide navigation" }))
    await expect(args.controls.toggleNavigation).toHaveBeenCalledOnce()
    await userEvent.click(canvas.getByRole("button", { name: "Hide inspector" }))
    await expect(args.controls.toggleInspector).toHaveBeenCalledOnce()
  }}
/>
