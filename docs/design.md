# Product and architecture design

This is the design baseline from the October 24, 2026 discussion, reconciled with
[Tech Stack & Patterns](https://github.com/JohannesKlauss/zane/issues/1).
It records intended behavior, not a checklist of shipped features. Agreed product
decisions, technical proposals, and open questions have separate sections.

## Agreed product decisions

### Purpose and core concepts

Zane combines free-form Pi conversations with predefined, executable task machines.
Developers use it to code and work from issue-tracker context. Product owners use
it to turn a brain dump into a ticket without a repository or terminal setup.
Machines should make a team's process repeatable and shareable without requiring
every person to write prompts or workflow code.

| Concept          | Meaning                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| Thread           | A free-form Pi conversation with Pi's session navigation and extensibility.                                        |
| Task machine     | A workflow definition built with Contentful's skill-kit. Its steps, response validation, and routing are explicit. |
| Machine run      | One execution of a task machine, with its own progress, inputs, step activity, and artifacts.                      |
| Workspace        | The checkout, worktree, or repository-free scratch directory selected for a thread or run.                         |
| Built-in machine | A read-only catalog definition distributed with the application.                                                   |
| Personal machine | An editable definition on the user's local disk that the surface can execute.                                      |

Threads and runs are both first-class concepts. A run is not a special message
inside a thread, and a thread does not have to execute a machine.

### The surface owns the process

The surface orchestrates runs and integrates skill-kit, Pi, workspaces, GitHub,
and issue trackers. It asks the engine which step comes next, presents human
interactions, invokes the agent for step work, and submits results for validation.
The agent does not decide whether to skip the machine's required steps.

Determinism means explicit routing and validation around agent work. It does not
mean identical model output on every invocation, or transactional external actions.
The host integration must enforce this boundary rather than rely on the model to
remember a prose skill.

### Threads are chats, runs are processes

Use a three-pane desktop layout inspired by Supaterm:

- Left: project context and navigation between threads and runs.
- Center: a conversation for a thread, or the current step and its interactions
  for a run. Step-scoped agent activity can be inspected without turning the whole
  run into a chat transcript.
- Right: contextual artifacts and actions, such as changes, PRs, and related
  tickets. A machine-position graph belongs in the lower-right area.

The graph shows the machine's structure and current position. It is a read-only
visualization, not a workflow editor. Graph extraction is an open technical
question below.

Render skill-kit interactions as desktop controls, including questions, surveys,
confirmations, and plan approval. A PO should not need to interpret terminal
output or agent protocol messages.

The initial appearances are Midnight in dark mode and Supaterm in light mode.
The [design-token foundation](../apps/desktop/docs/design-tokens.md) is the
canonical reference for implemented palettes and their provenance.

### Catalog, customization, and authoring

Ship the predefined catalog with the app binary. Catalog changes use the app's
release channel; no separate git or package-registry catalog is required.

A user can create and alter personal machines inside the surface. Forking a
built-in machine creates a personal copy on disk. Editing the built-in definition
in place or upstreaming a personal change through the surface is outside the
initial scope.

Authoring is itself a built-in task machine. It guides the user through defining
the workflow, generating its code, validating and testing it, trying it, and
refining it. The result lives on disk and can be executed from the surface without
switching to a terminal. The packaging and validation mechanism remains to be
proved.

Do not embed a code editor or build a visual programming tool. Detect installed
editors and provide an open-in-editor action. Users can also manage personal
machine files outside Zane.

### Preserve the user's Pi setup

Pi is the only agent harness in the initial scope. Zane must integrate the user's
own Pi setup, including its extensions, skills, model configuration, credentials,
and session-tree navigation. A generic cross-provider thread abstraction must not
hide Pi's native capabilities.

Offer a curated bundled fallback for people without a Pi installation. Bundled
defaults must not silently replace a developer's customized setup. The exact
runtime/version compatibility contract is still open; using the bundled SDK with
user configuration is not automatically equivalent to using their installed Pi.

Model access always uses per-user API credentials. Do not ship a shared model key
or require a company model gateway.

### Workspace choice stays flexible

Thread and run creation should make the target clear without adding a separate
workspace-management workflow. Offer these choices:

- A new worktree.
- An existing worktree, including a recent one.
- The current checkout.
- Repository-free scratch space.

A ticket-intake run can use scratch space. Do not require a git repository or
create a worktree for every machine. A manifest-suggested default is a proposed
convenience, not a reason to remove the user's choice.

Git/worktree and GitHub interactions should follow Supaterm's low-friction creation,
context selection, and PR controls. Full feature parity is not an initial goal.

### Issue trackers are part of the working context

Start with Jira. Support both company and customer instances through credentials
for the respective user's account. An application default provides the Jira
site/account/project; each surface project can override that configuration.
Credentials should be referenced by configuration rather than copied into project
files. Storage and supported authentication variants need an explicit design.

Give related tickets a compact panel comparable to Supaterm's PR controls. Users
can open the ticket, choose an available Jira workflow transition, and make quick
edits without leaving the surface. The transition picker must respect the ticket's
workflow rather than list arbitrary statuses. The initial quick-edit fields are
still to be scoped.

The initial integration direction is machine-driven ticket creation, a visible
label-based ticket-to-machine association, and comment-first result write-back.
Automatic status transitions are opt-in. The label convention and the distinction
between an intake machine and an implementation machine need definition.

Linear and GitHub Issues are possible tracker integrations, not requirements for
the first Jira slice.

### Delivery order and scope

The desktop/theme foundation and
[minimal three-pane shell](https://github.com/JohannesKlauss/zane/issues/6)
precede the workflow slices:

1. `ticket-intake`: a PO's brain dump becomes a structured Jira ticket. Exercise
   credential onboarding, repository-free runs, guided inputs, and the Jira write
   path before adding the coding workflow.
2. `ticket-implementation`: start from a Jira ticket, select a workspace, implement
   with Pi, create a PR, and write a result back to the ticket.
3. `machine-author`: create, test, refine, and save personal machines through the
   shipped authoring machine. Add catalog-to-personal copies and editor handoff.

The initial scope excludes alternative agent harnesses, mobile apps, scheduling,
local/remote host synchronization, embedded code editing, and visual graph editing.
[Cross-project references](https://github.com/JohannesKlauss/zane/issues/8) and
[multiplayer](https://github.com/JohannesKlauss/zane/issues/9) are separate roadmap
items, not dependencies for the first workflow slices.

## Proposed technical approach

Electron, Svelte 5, shadcn-svelte, Tailwind v4, and Vite+ provide the established
application foundation. Build fresh rather than fork Supaterm's provider and
orchestration stack. Use Supaterm/t3code as a UX reference and reuse suitable
framework-independent material with its license attribution.

The remaining architecture is a proposal:

- Put orchestration behind a typed Node package API independent of Electron UI
  objects. Electron is the desktop host, not the definition of the domain.
- Prefer the Pi SDK for programmatic control if it meets the user's setup and
  extension compatibility requirements. Start by evaluating one Pi session per
  machine run to preserve context across steps.
- Keep Pi authoritative for conversation trees, branches, and compaction. Zane
  owns run state and app metadata instead of inventing a competing conversation
  model. GUI navigation still needs a deliberate integration.
- Adapt skill-kit's engine and interaction primitives to a surface-driven run.
  Prove the host contract before assuming its CLI/MCP distribution format can be
  imported directly as an embedded engine.
- Favor functional domain modeling, functions, and explicit result values with
  byethrow. Convert dependency exceptions and rejected promises at integration
  boundaries; do not use exceptions as ordinary domain branching.
- Evaluate Effection for structured concurrency as proposed in the stack issue.
  The earlier small homegrown controller was a candidate, not an agreed line-count
  budget or a proven replacement for cancellation and resource management.
- Evaluate SQLite for durable state as proposed in the stack issue. An append-only
  step log may be useful, but neither the storage format nor crash-resume semantics
  are settled.
- Use Supaterm's git/GitHub behavior and suitable API queries as implementation
  references. CLI versus API adapters, authentication discovery, and prerequisite
  installation still need validation. Do not assume `git` and `gh` exist on every
  machine.

Keep the evolving library inventory in
[Tech Stack & Patterns](https://github.com/JohannesKlauss/zane/issues/1), rather than
maintain a second dependency checklist here.

## Open questions

Resolve these through focused design or integration tests before treating them as
architecture guarantees:

- **Pi compatibility.** How does Zane discover and select a user installation and
  version? Which extensions and UI requests can the desktop render? TUI-specific
  widgets need a compatibility policy. Define ownership when the CLI and surface
  open the same session, and what navigation means during a machine run.
- **Skill-kit hosting and graphs.** Establish the engine/host contract for prompts,
  validated outputs, actions, and human input. Declarative transitions can describe
  edges, but arbitrary TypeScript transition functions are not automatically
  statically enumerable. Decide whether machines need explicit graph metadata.
- **Durability and side effects.** Define persisted run states, checkpoints, and
  retry behavior. A lost response after a Jira ticket or PR is created can cause
  duplicate writes on retry. Recovery needs action-specific identifiers or
  reconciliation; a JSONL history alone does not provide exactly-once execution.
- **Cancellation and cleanup.** Define stop, timeout, and pause behavior, ownership
  of child work, and resource release on success, failure, and cancellation. Do not
  report a run stopped while its owned work still runs. Do not silently discard
  workspace changes or artifacts on cancellation.
- **Permissions and trust.** Set explicit approval rules for machine code, agent
  tools, and external writes. Being in the built-in catalog does not by itself
  authorize unattended execution. Generated and local machines are executable
  code, not automatically sandboxed data.
- **Machine identity and versions.** Define how a run records its exact machine
  definition, how app updates affect existing runs, and what happens when a user
  edits a personal machine during execution. An app version alone cannot identify
  a locally edited definition.
- **Jira scope and credentials.** Specify the v1 quick-edit fields, ticket-binding
  labels, supported Cloud/Data Center authentication and API differences, and
  secure credential storage. Do not assume every customer site has the same
  workflow, field schema, or permissions.

Update this document when a proposal is accepted, rejected, or proved in code.
Keep implementation detail in the relevant package docs and link to it rather than
copy it here.
