<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf"
  import { expect, fn, userEvent, within } from "storybook/test"

  import { Button } from "#lib/components/ui/button/index.js"
  import { Textarea } from "#lib/components/ui/textarea/index.js"

  import MachineStep from "./machine-step.svelte"

  type Args = {
    title: string
    status: string
    step: number
    totalSteps: number
    oncontinue: () => void
    disabled: boolean
  }

  const { Story } = defineMeta({
    title: "Workspace/Machine step",
    render: template,
    args: { title: "Define the review", status: "Needs input", step: 1, totalSteps: 2, oncontinue: fn(), disabled: false },
    parameters: { a11y: { test: "error" } },
  })
</script>

{#snippet template({ oncontinue, disabled, ...args }: Args)}
  <div class="flex h-[540px] max-w-2xl flex-col">
    <MachineStep {...args}>
      <p class="mb-6 text-sm text-muted-foreground">Step content and actions are supplied by the caller, independently of a thread.</p>
      <Textarea aria-label="Step input" placeholder="What should this run focus on?" />
      {#snippet actions()}<Button size="sm" onclick={oncontinue} {disabled}>Continue</Button>{/snippet}
    </MachineStep>
  </div>
{/snippet}

<Story name="Input · Midnight" globals={{ appearance: "dark" }} />
<Story name="Input · Supaterm light" globals={{ appearance: "light" }} />
<Story name="Disabled · Midnight" globals={{ appearance: "dark" }} args={{ disabled: true }} />
<Story name="Disabled · Supaterm light" globals={{ appearance: "light" }} args={{ disabled: true }} />

<Story
  name="Step action"
  play={async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Continue" }))
    await expect(args.oncontinue).toHaveBeenCalledOnce()
  }}
/>
