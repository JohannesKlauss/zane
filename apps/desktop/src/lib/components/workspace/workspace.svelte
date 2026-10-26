<script lang="ts">
  import { ArrowRight, Check, CircleCheck, RotateCcw } from "@lucide/svelte"

  import AppearancePreference from "#lib/components/appearance-preference.svelte"
  import { Button } from "#lib/components/ui/button/index.js"
  import { Textarea } from "#lib/components/ui/textarea/index.js"

  import AppShell from "./app-shell.svelte"
  import Composer from "./composer.svelte"
  import ContentHeader from "./content-header.svelte"
  import Inspector from "./inspector.svelte"
  import MachineStep from "./machine-step.svelte"
  import Navigation from "./navigation.svelte"
  import StatusActions from "./status-actions.svelte"
  import ThreadView from "./thread-view.svelte"
  import type { ItemKind, Message, NavigationItem } from "./types.js"

  type LocalThread = NavigationItem & {
    kind: "thread"
    draft: string
    messages: Message[]
    activity: string[]
  }

  type LocalRun = NavigationItem & {
    kind: "run"
    draft: string
    brief: string
    phase: "input" | "confirmation" | "complete" | "stopped"
    activity: string[]
  }

  type LocalItem = LocalThread | LocalRun

  let { persistLayout = true, layoutId = "zane-workspace-v1" }: { persistLayout?: boolean; layoutId?: string } = $props()

  let items = $state<LocalItem[]>([
    {
      id: "thread-welcome", kind: "thread", title: "Build the workspace", status: "Ready", draft: "", activity: [],
      messages: [
        { id: "welcome-user", role: "user", content: "Let's make room for focused work." },
        { id: "welcome-assistant", role: "assistant", content: "A thread for the conversation. A machine run for the next deliberate step.\n\nThis is a local preview. Try the composer below, or open “Review the shell” to walk through a two-step run. No agent or external service is connected." },
      ],
    },
    { id: "run-welcome", kind: "run", title: "Review the shell", status: "Needs input", draft: "", brief: "", phase: "input", activity: [] },
  ])
  let selectedId = $state("thread-welcome")
  let selected = $derived(items.find((item) => item.id === selectedId) ?? items[0])

  const stepTitles = {
    input: "Define the review",
    confirmation: "Confirm the review",
    complete: "Review complete",
    stopped: "Run stopped",
  }

  function createItem(kind: ItemKind) {
    const number = items.filter((item) => item.kind === kind).length + 1
    const common = { id: crypto.randomUUID(), title: `New ${kind} ${number}`, draft: "", activity: [] }
    const item: LocalItem = kind === "thread"
      ? { ...common, kind, status: "Ready", messages: [] }
      : { ...common, kind, status: "Needs input", brief: "", phase: "input" }

    items.push(item)
    selectedId = item.id
  }

  function resetItem() {
    selected.draft = ""
    selected.status = selected.kind === "thread" ? "Ready" : "Needs input"
    selected.activity.push("Item reset locally.")

    if (selected.kind === "thread") selected.messages = []
    else { selected.phase = "input"; selected.brief = "" }
  }

  function submitMessage(text: string) {
    if (selected.kind !== "thread" || selected.status === "Working") return

    selected.messages.push({ id: crypto.randomUUID(), role: "user", content: text })
    selected.draft = ""
    selected.status = "Working"
    selected.activity.push("Message submitted locally.")
  }

  function stopActivity() {
    if (selected.kind === "thread" && selected.status === "Working") {
      selected.status = "Stopped"
      selected.activity.push("Activity stopped locally.")
    } else if (selected.kind === "run" && selected.phase !== "complete" && selected.phase !== "stopped") {
      selected.phase = "stopped"
      selected.status = "Stopped"
      selected.activity.push("Run stopped locally.")
    }
  }

  function advanceRun(event: SubmitEvent) {
    event.preventDefault()

    if (selected.kind !== "run") return

    if (selected.phase === "input" && selected.draft.trim()) {
      selected.brief = selected.draft.trim()
      selected.phase = "confirmation"
      selected.status = "Needs confirmation"
      selected.activity.push("Review focus submitted locally.")
    } else if (selected.phase === "confirmation") {
      selected.phase = "complete"
      selected.status = "Completed"
      selected.activity.push("Review confirmed locally.")
    }
  }

  function returnToInput() {
    if (selected.kind !== "run") return

    selected.phase = "input"
    selected.status = "Needs input"
  }

  function restartRun() {
    if (selected.kind !== "run") return

    returnToInput()
    selected.brief = ""
    selected.activity.push("Run restarted locally.")
  }
</script>

<div class="h-dvh w-full overflow-hidden" aria-label="Workspace">
  <AppShell {persistLayout} {layoutId}>
    {#snippet navigation()}
      <Navigation {items} {selectedId} onselect={(id) => (selectedId = id)} oncreate={createItem} />
    {/snippet}
    {#snippet header(controls)}
      <ContentHeader title={selected.title} kind={selected.kind} {controls} onreset={resetItem} />
    {/snippet}
    {#snippet children()}
      {#key selected.id}
        {#if selected.kind === "thread"}
          <ThreadView messages={selected.messages} notice={selected.status === "Stopped" ? "Activity stopped locally." : undefined}>
            <Composer bind:draft={selected.draft} busy={selected.status === "Working"} onsubmit={submitMessage} onstop={stopActivity} />
          </ThreadView>
        {:else}
          <form class="flex min-h-0 flex-1 flex-col" aria-label="Machine step" onsubmit={advanceRun}>
            <MachineStep title={stepTitles[selected.phase]} status={selected.status} step={selected.phase === "input" || !selected.brief ? 1 : 2} totalSteps={2}>
              {#if selected.phase === "input"}
                <p class="mb-6 text-sm leading-6 text-muted-foreground">Give this run a focus. You'll review the input before confirming the next step.</p>
                <label for={`focus-${selected.id}`} class="mb-2 block text-xs font-medium">Review focus</label>
                <Textarea id={`focus-${selected.id}`} bind:value={selected.draft} class="min-h-28 resize-y text-sm" placeholder="For example, keyboard access and pane behavior…" />
                <p class="mt-3 text-xs leading-5 text-muted-foreground">This fixture records your input locally. It doesn't inspect code or start a runner.</p>
              {:else if selected.phase === "confirmation"}
                <p class="mb-5 text-sm leading-6 text-muted-foreground">Check the focus below, then confirm this step. Go back if you'd like to change it.</p>
                <div class="rounded-lg border border-border bg-surface-raised p-4">
                  <h3 class="mb-2 text-xs font-medium text-muted-foreground">Review focus</h3>
                  <p class="whitespace-pre-wrap text-sm leading-6 wrap-anywhere">{selected.brief}</p>
                </div>
              {:else if selected.phase === "complete"}
                <CircleCheck class="mb-4 size-8 text-primary" aria-hidden="true" />
                <p class="text-sm font-medium">Confirmed locally. No runner was started.</p>
                <p class="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground wrap-anywhere">{selected.brief}</p>
              {:else}
                <p class="text-sm leading-6 text-muted-foreground">Your input is still here. Start again to return to the first step.</p>
              {/if}
              {#snippet actions()}
                {#if selected.kind === "run" && selected.phase === "input"}
                  <Button type="submit" size="sm" disabled={!selected.draft.trim()}>Continue<ArrowRight class="size-3.5" aria-hidden="true" /></Button>
                {:else if selected.kind === "run" && selected.phase === "confirmation"}
                  <Button variant="ghost" size="sm" onclick={returnToInput}>Back</Button>
                  <Button type="submit" size="sm"><Check class="size-3.5" aria-hidden="true" />Confirm step</Button>
                {:else}
                  <Button variant="outline" size="sm" onclick={restartRun}><RotateCcw class="size-3.5" aria-hidden="true" />Start again</Button>
                {/if}
              {/snippet}
            </MachineStep>
          </form>
        {/if}
      {/key}
    {/snippet}
    {#snippet inspector()}
      <Inspector>
        {#snippet context()}
          <p class="mb-4 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">{selected.kind === "thread" ? "Thread context" : "Run context"}</p>
          <h2 class="text-xs font-medium wrap-anywhere">{selected.title}</h2>
          <p class="mt-2 text-xs leading-5 text-muted-foreground">{selected.kind === "thread" ? "A conversation in your local workspace." : "A deliberate, step-by-step workflow."}</p>
          <dl class="mt-5 space-y-3 text-xs">
            <div class="flex justify-between gap-2"><dt class="text-muted-foreground">Status</dt><dd>{selected.status}</dd></div>
            <div class="flex justify-between gap-2"><dt class="text-muted-foreground">Workspace</dt><dd>Zane</dd></div>
            <div class="flex justify-between gap-2"><dt class="text-muted-foreground">Execution</dt><dd>Local fixture</dd></div>
          </dl>
          <div class="mt-6 border-t border-border pt-5">
            <p class="text-xs font-medium">Connections</p>
            <p class="mt-2 text-xs leading-5 text-muted-foreground">Agents, Git, and issue trackers aren't connected. Your input stays in this window.</p>
          </div>
          <div class="mt-6 [&_label]:flex-col [&_label]:items-start [&_label]:text-xs [&_select]:w-full [&_select]:min-w-0"><AppearancePreference /></div>
        {/snippet}
        {#snippet activity()}
          <h2 class="text-xs font-medium">Local activity</h2>
          {#if selected.activity.length === 0}
            <p class="mt-3 text-xs leading-5 text-muted-foreground">No activity yet. Send a message or complete a machine step to see it here.</p>
          {:else}
            <ol class="mt-4 space-y-4">
              {#each selected.activity as event, index (`${selected.id}-${index}`)}
                <li class="flex gap-2 text-xs leading-5"><span class="mt-2 size-1 shrink-0 rounded-full bg-primary"></span>{event}</li>
              {/each}
            </ol>
          {/if}
        {/snippet}
        {#snippet footer()}
          <StatusActions status={selected.status} actionLabel={selected.kind === "thread" ? "Stop local activity" : "Stop run"} actionDisabled={selected.kind === "thread" ? selected.status !== "Working" : selected.phase === "complete" || selected.phase === "stopped"} onaction={stopActivity} onreset={resetItem} />
        {/snippet}
      </Inspector>
    {/snippet}
  </AppShell>
</div>
