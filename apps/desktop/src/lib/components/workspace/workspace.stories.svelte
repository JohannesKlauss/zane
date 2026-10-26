<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf"
  import { expect, userEvent, waitFor, within } from "storybook/test"

  import Workspace from "./workspace.svelte"

  const { Story } = defineMeta({
    title: "Workspace/Shell",
    component: Workspace,
    args: { persistLayout: false },
    parameters: { layout: "fullscreen", a11y: { test: "error" } },
  })
</script>

<script lang="ts">
  let restart = $state(0)
</script>

<Story name="Midnight" globals={{ appearance: "dark" }} />
<Story name="Supaterm light" globals={{ appearance: "light" }} />

<Story
  name="Persisted panels"
  asChild
  beforeEach={() => {
    const keys = ["paneforge:zane-layout-story", "zane-layout-story:expanded"]

    for (const key of keys) localStorage.removeItem(key)

    return () => {
      for (const key of keys) localStorage.removeItem(key)
    }
  }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const navigationDivider = canvas.getByRole("separator", { name: "Resize navigation" })
    const inspectorDivider = canvas.getByRole("separator", { name: "Resize inspector" })

    navigationDivider.focus()
    await userEvent.keyboard("{ArrowRight}{ArrowRight}")
    inspectorDivider.focus()
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}")
    const navigationWidth = canvas.getByRole("navigation", { name: "Threads and runs" }).getBoundingClientRect().width
    const inspectorWidth = canvas.getByRole("complementary", { name: "Inspector" }).getBoundingClientRect().width

    await userEvent.click(canvas.getByRole("button", { name: "Hide inspector" }))
    await userEvent.click(canvas.getByRole("button", { name: "Hide navigation" }))
    await waitFor(() => expect(localStorage.getItem("paneforge:zane-layout-story")).toContain('"layout":[0,100,0]'))
    await userEvent.click(canvas.getByRole("button", { name: "Simulate restart" }))
    await expect(await canvas.findByRole("button", { name: "Show navigation" })).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Show inspector" })).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Show navigation" }))
    await userEvent.click(canvas.getByRole("button", { name: "Show inspector" }))
    await expect(canvas.getByRole("navigation", { name: "Threads and runs" }).getBoundingClientRect().width).toBeCloseTo(navigationWidth, 0)
    await expect(canvas.getByRole("complementary", { name: "Inspector" }).getBoundingClientRect().width).toBeCloseTo(inspectorWidth, 0)
  }}
>
  <div class="relative h-dvh">
    <button type="button" class="absolute right-4 bottom-14 z-50 rounded-control border border-border bg-secondary px-2 py-1 text-xs focus-visible:ring-2 focus-visible:ring-ring" onclick={() => (restart += 1)}>Simulate restart</button>
    {#key restart}<Workspace layoutId="zane-layout-story" />{/key}
  </div>
</Story>

<Story
  name="Panel controls"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const divider = canvas.getByRole("separator", { name: "Resize navigation" })
    const originalWidth = Number(divider.getAttribute("aria-valuenow"))

    await expect(divider).toHaveAttribute("aria-orientation", "vertical")
    await expect(canvas.getByRole("separator", { name: "Resize inspector" })).toHaveAttribute("aria-orientation", "vertical")
    divider.focus()
    await userEvent.keyboard("{ArrowRight}{ArrowRight}")
    await expect(Number(divider.getAttribute("aria-valuenow"))).toBeGreaterThan(originalWidth)
    const expandedWidth = divider.getAttribute("aria-valuenow")

    await userEvent.click(canvas.getByRole("button", { name: "Hide navigation" }))
    await expect(canvas.queryByRole("navigation", { name: "Threads and runs" })).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole("button", { name: "Show navigation" }))
    await expect(divider).toHaveAttribute("aria-valuenow", expandedWidth)
    await userEvent.click(canvas.getByRole("button", { name: "Hide inspector" }))
    await expect(canvas.queryByRole("tab", { name: "Context" })).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole("button", { name: "Show inspector" }))
    const context = canvas.getByRole("tab", { name: "Context" })

    context.focus()
    await userEvent.keyboard("{ArrowRight}")
    await expect(canvas.getByRole("tab", { name: "Activity" })).toHaveAttribute("aria-selected", "true")
  }}
/>


<Story
  name="Divider keyboard collapse"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const navigation = canvas.getByRole("navigation", { name: "Threads and runs" })
    const divider = canvas.getByRole("separator", { name: "Resize navigation" })
    const expanded = divider.getAttribute("aria-valuenow")

    divider.focus()
    await userEvent.keyboard("{Enter}")
    await expect(canvas.getByRole("button", { name: "Show navigation" })).toHaveAttribute("aria-expanded", "false")
    await expect(canvas.queryByRole("navigation", { name: "Threads and runs" })).not.toBeInTheDocument()
    divider.focus()
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}")
    await expect(navigation.contains(canvasElement.ownerDocument.activeElement)).toBe(false)
    await userEvent.click(canvas.getByRole("button", { name: "Show navigation" }))
    await expect(divider).toHaveAttribute("aria-valuenow", expanded)
    await userEvent.click(canvas.getByRole("button", { name: "Hide navigation" }))
    divider.focus()
    await userEvent.keyboard("{Enter}")
    await expect(canvas.getByRole("navigation", { name: "Threads and runs" })).toBeVisible()
    await expect(divider).toHaveAttribute("aria-valuenow", expanded)
    const inspector = canvas.getByRole("complementary", { name: "Inspector" })
    const inspectorWidth = inspector.getBoundingClientRect().width
    const inspectorDivider = canvas.getByRole("separator", { name: "Resize inspector" })

    inspectorDivider.focus()
    await userEvent.keyboard("{Enter}")
    await expect(canvas.getByRole("button", { name: "Show inspector" })).toBeVisible()
    await expect(canvas.queryByRole("tab", { name: "Context" })).not.toBeInTheDocument()
    await userEvent.keyboard("{Enter}")
    await expect(canvas.getByRole("tab", { name: "Context" })).toBeVisible()
    await expect(inspector.getBoundingClientRect().width).toBeCloseTo(inspectorWidth, 0)
  }}
/>

<Story
  name="Drag collapse and restart"
  asChild
  beforeEach={() => {
    localStorage.removeItem("paneforge:zane-drag-layout-story")
    localStorage.removeItem("zane-drag-layout-story:expanded")
    return () => {
      localStorage.removeItem("paneforge:zane-drag-layout-story")
      localStorage.removeItem("zane-drag-layout-story:expanded")
    }
  }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const navigationDivider = canvas.getByRole("separator", { name: "Resize navigation" })
    const inspectorDivider = canvas.getByRole("separator", { name: "Resize inspector" })

    navigationDivider.focus()
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}")
    inspectorDivider.focus()
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}{ArrowLeft}")
    const navigationWidth = canvas.getByRole("navigation", { name: "Threads and runs" }).getBoundingClientRect().width
    const inspectorWidth = canvas.getByRole("complementary", { name: "Inspector" }).getBoundingClientRect().width
    const navigationBounds = navigationDivider.getBoundingClientRect()

    await userEvent.pointer([
      { target: navigationDivider, keys: "[MouseLeft>]", coords: { clientX: navigationBounds.x, clientY: 100 } },
      { target: canvasElement.ownerDocument.body, coords: { clientX: 0, clientY: 100 } },
      { keys: "[/MouseLeft]" },
    ])
    await expect(canvas.getByRole("button", { name: "Show navigation" })).toBeVisible()
    const inspectorBounds = inspectorDivider.getBoundingClientRect()

    await userEvent.pointer([
      { target: inspectorDivider, keys: "[MouseLeft>]", coords: { clientX: inspectorBounds.x, clientY: 100 } },
      { target: canvasElement.ownerDocument.body, coords: { clientX: canvasElement.ownerDocument.documentElement.clientWidth, clientY: 100 } },
      { keys: "[/MouseLeft]" },
    ])
    await expect(canvas.getByRole("button", { name: "Show inspector" })).toBeVisible()
    await waitFor(() => expect(localStorage.getItem("paneforge:zane-drag-layout-story")).toContain('"layout":[0,100,0]'))
    await userEvent.click(canvas.getByRole("button", { name: "Simulate restart" }))
    await expect(await canvas.findByRole("button", { name: "Show navigation" })).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Show navigation" }))
    await userEvent.click(canvas.getByRole("button", { name: "Show inspector" }))
    await expect(canvas.getByRole("navigation", { name: "Threads and runs" }).getBoundingClientRect().width).toBeCloseTo(navigationWidth, 0)
    await expect(canvas.getByRole("complementary", { name: "Inspector" }).getBoundingClientRect().width).toBeCloseTo(inspectorWidth, 0)
  }}
>
  <div class="relative h-dvh">
    <button type="button" class="absolute right-4 bottom-14 z-50 rounded-control border border-border bg-secondary px-2 py-1 text-xs focus-visible:ring-2 focus-visible:ring-ring" onclick={() => (restart += 1)}>Simulate restart</button>
    {#key restart}<Workspace layoutId="zane-drag-layout-story" />{/key}
  </div>
</Story>

<Story
  name="Thread submission and stop"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const draft = canvas.getByRole("textbox", { name: "Message" })
    const messages = canvas.getByRole("log", { name: "Messages" })

    await expect(canvas.getByRole("button", { name: "Send message" })).toBeDisabled()
    await userEvent.type(draft, "   ")
    await userEvent.keyboard("{Enter}")
    await expect(within(messages).getAllByRole("article")).toHaveLength(2)
    await userEvent.clear(draft)
    await userEvent.type(draft, "First line")
    await userEvent.keyboard("{Shift>}{Enter}{/Shift}")
    await userEvent.type(draft, "Second line")
    await userEvent.click(canvas.getByRole("tab", { name: "Activity" }))
    await userEvent.click(canvas.getByRole("tab", { name: "Context" }))
    await userEvent.click(canvas.getByRole("button", { name: "Hide inspector" }))
    await userEvent.click(canvas.getByRole("button", { name: "Show inspector" }))
    await expect(draft).toHaveValue("First line\nSecond line")
    await userEvent.click(draft)
    await userEvent.keyboard("{Enter}")
    await expect(draft).toHaveValue("")
    await expect(within(messages).getByText("First line Second line")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Stop activity" })).toBeEnabled()
    await userEvent.type(draft, "Keep this draft")
    await userEvent.keyboard("{Enter}")
    await expect(within(messages).getAllByRole("article")).toHaveLength(3)
    await userEvent.click(canvas.getByRole("button", { name: "Stop activity" }))
    await expect(within(messages).getByText("Activity stopped locally.")).toBeVisible()
    await expect(draft).toHaveValue("Keep this draft")
    await userEvent.click(canvas.getByRole("button", { name: /^Run: Review the shell / }))
    await userEvent.click(canvas.getByRole("button", { name: /^Thread: Build the workspace / }))
    await expect(canvas.getByRole("textbox", { name: "Message" })).toHaveValue("Keep this draft")
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }))
    await expect(canvas.getByRole("textbox", { name: "Message" })).toHaveValue("")
    await expect(canvas.getByRole("button", { name: "Stop activity" })).toBeEnabled()
  }}
/>

<Story
  name="Machine input and confirmation"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole("button", { name: /^Run: Review the shell / }))
    const focus = canvas.getByRole("textbox", { name: "Review focus" })

    await expect(canvas.getByRole("button", { name: "Continue" })).toBeDisabled()
    await userEvent.type(focus, "Keyboard access and pane behavior")
    await userEvent.click(canvas.getByRole("button", { name: "Continue" }))
    await expect(canvas.getByRole("heading", { name: "Confirm the review" })).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Back" }))
    await expect(canvas.getByRole("textbox", { name: "Review focus" })).toHaveValue("Keyboard access and pane behavior")
    await userEvent.click(canvas.getByRole("button", { name: "Continue" }))
    await userEvent.click(canvas.getByRole("button", { name: /^Thread: Build the workspace / }))
    await userEvent.click(canvas.getByRole("button", { name: /^Run: Review the shell / }))
    await expect(canvas.getByRole("heading", { name: "Confirm the review" })).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Confirm step" }))
    await expect(canvas.getByRole("heading", { name: "Review complete" })).toBeVisible()
    await expect(canvas.getByText("Confirmed locally. No runner was started.")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Stop run" })).toBeDisabled()
    await userEvent.click(canvas.getByRole("button", { name: "Start again" }))
    await userEvent.click(canvas.getByRole("button", { name: "Stop run" }))
    await expect(canvas.getByRole("heading", { name: "Run stopped" })).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Start again" }))
    await expect(canvas.getByRole("textbox", { name: "Review focus" })).toHaveValue("Keyboard access and pane behavior")
  }}
/>

<Story
  name="Keyboard item actions"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const page = within(canvasElement.ownerDocument.body)
    const actions = canvas.getByRole("button", { name: "Item actions" })

    actions.focus()
    await userEvent.keyboard("{Enter}")
    await expect(page.getByRole("menuitem", { name: "Connect an agent (not available)" })).toHaveAttribute("aria-disabled", "true")
    await waitFor(() => expect(page.getByRole("menuitem", { name: "Reset local item" })).toHaveFocus())
    await userEvent.keyboard("{Home}{Enter}")
    await waitFor(() => expect(page.queryByRole("menu")).not.toBeInTheDocument())
    await expect(canvas.getByText("A little context goes a long way.")).toBeVisible()
    await expect(within(canvas.getByRole("log", { name: "Messages" })).queryByRole("article")).not.toBeInTheDocument()
    await waitFor(() => expect(actions).toHaveFocus())
  }}
/>

<Story
  name="Selection and creation"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const page = within(canvasElement.ownerDocument.body)
    const navigation = canvas.getByRole("navigation", { name: "Threads and runs" })

    await expect(canvas.getByRole("heading", { name: "Build the workspace", level: 1 })).toBeVisible()
    await userEvent.click(within(navigation).getByRole("button", { name: /^Run: Review the shell / }))
    await expect(canvas.getByRole("heading", { name: "Define the review" })).toBeVisible()
    await expect(canvas.queryByRole("log", { name: "Messages" })).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole("button", { name: "New item" }))
    await userEvent.click(page.getByRole("menuitem", { name: "New thread" }))
    await waitFor(() => expect(page.queryByRole("menu")).not.toBeInTheDocument())
    await expect(canvas.getByRole("heading", { name: "New thread 2", level: 1 })).toBeVisible()
    await expect(canvas.getByText("A little context goes a long way.")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "New item" }))
    await userEvent.click(page.getByRole("menuitem", { name: "New run" }))
    await waitFor(() => expect(page.queryByRole("menu")).not.toBeInTheDocument())
    await expect(canvas.getByRole("heading", { name: "New run 2", level: 1 })).toBeVisible()
    await expect(canvas.getByRole("heading", { name: "Define the review" })).toBeVisible()
    await userEvent.click(within(navigation).getByRole("button", { name: /^Thread: Build the workspace / }))
    await expect(canvas.getByRole("heading", { name: "Build the workspace", level: 1 })).toBeVisible()
  }}
/>
