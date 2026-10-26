<script module lang="ts">
  export type ShellControls = {
    navigationOpen: boolean
    inspectorOpen: boolean
    toggleNavigation: () => void
    toggleInspector: () => void
  }
</script>

<script lang="ts">
  import type { PaneAPI } from "paneforge"
  import { onMount, type Snippet } from "svelte"

  import * as Resizable from "#lib/components/ui/resizable/index.js"

  let {
    navigation,
    header,
    children,
    inspector,
    persistLayout = true,
    layoutId = "zane-workspace-v1",
  }: {
    navigation: Snippet
    header: Snippet<[ShellControls]>
    children: Snippet
    inspector: Snippet
    persistLayout?: boolean
    layoutId?: string
  } = $props()

  type Side = "navigation" | "inspector"

  let navigationPane: PaneAPI | undefined = $state()
  let inspectorPane: PaneAPI | undefined = $state()
  let navigationOpen = $derived(!navigationPane?.isCollapsed())
  let inspectorOpen = $derived(!inspectorPane?.isCollapsed())

  const sides: Side[] = ["navigation", "inspector"]
  const expanded = { navigation: 21, inspector: 25 }
  const dragging = { navigation: false, inspector: false }
  let ready = false

  function getPane(side: Side) {
    return side === "navigation" ? navigationPane : inspectorPane
  }

  function saveExpanded() {
    if (!persistLayout || !ready) return

    try {
      localStorage.setItem(`${layoutId}:expanded`, JSON.stringify(expanded))
    } catch {}
  }

  function rememberSize(side: Side, size: number) {
    if (!ready || dragging[side] || !Number.isFinite(size) || size <= 0) return

    expanded[side] = size
    saveExpanded()
  }

  onMount(() => {
    if (persistLayout) {
      try {
        const saved = JSON.parse(localStorage.getItem(`${layoutId}:expanded`) ?? "null")

        for (const side of sides) {
          const size = saved?.[side]
          const maximum = side === "navigation" ? 32 : 38

          if (Number.isFinite(size) && size >= 18 && size <= maximum) expanded[side] = size
        }
      } catch {}
    }

    ready = true

    for (const side of sides) rememberSize(side, getPane(side)?.getSize() ?? 0)
  })

  function trackDrag(side: Side, isDragging: boolean) {
    const size = getPane(side)?.getSize() ?? 0

    if (isDragging && size > 0) expanded[side] = size

    dragging[side] = isDragging

    if (!isDragging) rememberSize(side, size)

    saveExpanded()
  }

  function togglePane(side: Side) {
    const pane = getPane(side)

    if (!pane) return

    if (pane.isCollapsed()) pane.resize(expanded[side])
    else {
      rememberSize(side, pane.getSize())
      pane.collapse()
    }
  }

  function handleDividerKey(side: Side, event: KeyboardEvent) {
    if (event.key !== "Enter") return

    event.preventDefault()
    togglePane(side)
  }

  function toggleNavigation() {
    togglePane("navigation")
  }

  function toggleInspector() {
    togglePane("inspector")
  }
</script>

<div class="h-full min-h-0 w-full overflow-hidden bg-background text-sm">
  <Resizable.PaneGroup
    id={layoutId}
    direction="horizontal"
    autoSaveId={persistLayout ? layoutId : undefined}
    keyboardResizeBy={2}
  >
    <Resizable.Pane
      bind:this={navigationPane}
      id={`${layoutId}-navigation`}
      order={1}
      defaultSize={21}
      minSize={18}
      maxSize={32}
      collapsible
      collapsedSize={0}
      onResize={(size) => rememberSize("navigation", size)}
    >
      <div class="h-full min-w-0" hidden={!navigationOpen} inert={!navigationOpen}>
        {@render navigation()}
      </div>
    </Resizable.Pane>
    <Resizable.Handle
      aria-label="Resize navigation"
      aria-orientation="vertical"
      onkeydowncapture={(event) => handleDividerKey("navigation", event)}
      onDraggingChange={(isDragging) => trackDrag("navigation", isDragging)}
      class="z-10 shrink-0 hover:bg-ring focus-visible:bg-ring data-[active]:bg-ring"
      ondblclick={() => navigationPane?.resize(21)}
      title="Drag or use arrow keys to resize. Double-click to reset."
    />
    <Resizable.Pane id={`${layoutId}-content`} order={2} defaultSize={54} minSize={35}>
      <main aria-label="Work area" class="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
        {@render header({ navigationOpen, inspectorOpen, toggleNavigation, toggleInspector })}
        <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
          {@render children()}
        </div>
      </main>
    </Resizable.Pane>
    <Resizable.Handle
      aria-label="Resize inspector"
      aria-orientation="vertical"
      onkeydowncapture={(event) => handleDividerKey("inspector", event)}
      onDraggingChange={(isDragging) => trackDrag("inspector", isDragging)}
      class="z-10 shrink-0 hover:bg-ring focus-visible:bg-ring data-[active]:bg-ring"
      ondblclick={() => inspectorPane?.resize(25)}
      title="Drag or use arrow keys to resize. Double-click to reset."
    />
    <Resizable.Pane
      bind:this={inspectorPane}
      id={`${layoutId}-inspector`}
      order={3}
      defaultSize={25}
      minSize={18}
      maxSize={38}
      collapsible
      collapsedSize={0}
      onResize={(size) => rememberSize("inspector", size)}
    >
      <div class="h-full min-w-0" hidden={!inspectorOpen} inert={!inspectorOpen}>
        {@render inspector()}
      </div>
    </Resizable.Pane>
  </Resizable.PaneGroup>
</div>
