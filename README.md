# Zane

**A desktop command surface for deterministic agent task machines. Threads are chats, runs are processes.**

Zane combines a free-form AI pair programmer ([pi](https://github.com/earendil-works/pi-coding-agent)) with deterministic, testable task machines built on Contentful's [skill-kit](https://contentful.github.io/skill-kit/). Instead of relying on prose skills and the model's good will, a task machine is a typed state machine: steps with prompts, ArkType schemas, and explicit transitions. The agent reasons freely *within* each step; the machine controls where it goes next. Branching is code, not hope.

## Why

- Multi-step agent workflows written as prose skills are fragile: input gathering, branching, approval gates, and output validation all get tangled into one long prompt that the model may or may not follow.
- Coding agents are powerful but process-free; ticket work *is* a process. We want the process to be explicit, reviewed, versioned, and shared across the company (~20 devs).
- [Supaterm](https://github.com/supabitapp/supaterm) (a fork of [t3code](https://github.com/pingdotgg/t3code)) proves the UX: three-pane layout, effortless git/GitHub integration, threads with worktrees. But it is thread-centric and multi-provider. Zane is run-centric and goes deep on pi only.
- Product owners should be able to create well-structured Jira tickets *through* machines — no repo, no terminal, no prompt engineering.

## Core concepts

| Concept | Meaning |
|---|---|
| **Thread** | A free pi chat session. Chats look like chats. |
| **TaskMachine** | A skill-kit skill + a manifest (Jira binding, workspace default, execution mode). Either **builtin catalog** (shipped read-only in the app binary) or **personal** (files on local disk, fully editable, executable in the surface). |
| **MachineRun** | A machine executing. First-class entity with step history, current step, artifacts, and a per-run pi session. Runs look like processes. |
| **Workspace** | Where a run/thread points: new worktree / recent worktree / current checkout / **scratch** (no repo at all — e.g. ticket-creation machines). |
| **PiProfile** | `AdoptedUserPi` (use the developer's own `~/.pi` setup — extensions, skills, models, credentials) or `BundledProfile` (curated minimal setup for non-technical users). |
| **JiraSite** | A Jira instance (Cloud or Data Center) with per-user API credentials. Multiple sites supported (own + customer Jiras). |

## How it works

The surface is the orchestrator. The skill-kit engine runs embedded in the app and drives the machine: it emits a step prompt + schema, the prompt is fed to pi, the structured response is validated against the step's ArkType schema, side-effect actions run, and the engine computes the next step. Interactive primitives (`askUser`, `survey`, `plan`, `confirm`) render as native GUI elements instead of terminal prompts.

- **Electron** app. The **orchestrator is a standalone Node package** with a typed API — Electron's main process is merely host #1 (keeps CLI host, remote host, and a future multiplayer server possible).
- **pi is embedded in-process** via the `@earendil-works/pi-coding-agent` SDK — one `AgentSession` per run. *Wrap, don't re-model*: pi's own session manager owns conversation state (tree, branching, compaction); the app stores only metadata and links. When the user has pi installed, their setup is adopted as-is.
- **skill-kit engine embedded** in-process. Run state is an append-only step-history JSONL — kill the app mid-run, resume by reconstruction.
- **Light FP, no Effect**: [`@praha/byethrow`](https://github.com/praha-inc/byethrow) `Result`s everywhere + a tiny (~150 LOC) homegrown task controller (AbortController ownership, LIFO finalizer stack, combinators like `timeout`/`all`/`retry`). The only try/catch in the codebase lives inside that module.
- **git/GitHub** via the `git` and `gh` CLIs (already authenticated on dev machines); GraphQL query shapes borrowed from Supaterm/t3code (MIT) as a behavioral blueprint.
- **Jira** via REST, per-user API tokens stored in the OS keychain. Per-surface-project site/project config overrides the app default. Descriptions render markdown→ADF on Cloud (wiki markup on Data Center).

## Design locks

Resolved in a full design walkthrough (2026-10-24). These are settled — changing them requires a conversation, not a PR:

1. **Surface-as-orchestrator** — the app owns and drives every run (not the agent). One pi session per run; free chat is a separate mode.
2. **Two machine namespaces** — builtin catalog (read-only) + personal (local disk). Catalog machines can be duplicated into the personal namespace and altered there.
3. **Fresh build, not a Supaterm fork** — Supaterm/t3code serves as reference implementation and MIT parts bin (UI components, GraphQL docs). No Effect-TS; byethrow + task controller instead.
4. **Four-way workspace picker** per thread/run (new worktree / recent worktree / checkout / scratch); the machine manifest preselects the sensible default, the picker always offers the choice.
5. **Machine-as-Jira-template** — the manifest declares its Jira binding (project, issue type, field mapping); created issues are label-bound (`machine-<name>`) so any surface can resolve the ticket→machine link via plain JQL. Write-back is comment-first; status transitions are opt-in per manifest.
6. **Catalog vendored in the binary** — behind a `CatalogSource` interface (`Builtin` / `Fs` now, `Git` possible later). Runs pin `machine@appVersion`. Release cadence must stay routine.
7. **Adopt the user's pi setup when present; bundled profile otherwise.** Per-user LLM API keys, always — no shared key, no gateway.
8. **Authoring is a machine** — a shipped `machine-author` meta-machine (interview → scaffold → offline test via `runSkill`+`mockModel` → preview run → save to disk). No embedded code editor; "open in detected IDE" instead.
9. **Step-forward run UI** — center: current step card (prompt → step-scoped transcript → native form when waiting for input); right: artifacts (diffs, ticket, PR) + a **position graph** of the machine (statically derived from the SkillDefinition, visited-path overlay). Runs never look like transcripts.
10. **MVP order**: `ticket-intake` → `ticket-implementation` → `machine-author` (see roadmap).

**Carried assertions** (unvetoed, revisit if they bite): manifest `execution: attended | unattended` (catalog defaults unattended, personal attended, overridable per run); 0..1 primary ticket link per run; the graph is read-only (editing happens in code); run state = step-history JSONL.

## Roadmap

### v0.1 — `ticket-intake`: "a PO makes a ticket"

One builtin machine: brain dump → structured Jira ticket. Scratch workspace only — no git needed — but forces the entire vertical: Electron shell, orchestrator package, embedded pi with bundled profile + per-user key onboarding, skill-kit engine driving a run, step-forward rendering with native forms, Jira create path (markdown→ADF), label binding, run persistence/resume. If this works end-to-end, the architecture is proven.

### v0.2 — `ticket-implementation`: "a dev burns down a ticket"

The dev loop: Jira ticket → worktree → pi implements → PR → comment back to Jira. Forces: workspace picker, git/`gh` integration, the ticket panel (status badge with transition dropdown, assign-to-me, inline summary edit), PR row with checks, adopted-pi profile, graph visualization.

### v0.3 — `machine-author`: "a dev authors a machine"

The authoring flow as a shipped meta-machine, plus personal machines on disk, duplicate-to-personal, and open-in-IDE. Deliberately last: it consumes the mature platform and dogfoods every primitive.

## Non-goals (for now)

Multi-provider support (Claude Code, Codex, ACP, …), mobile apps, automations/scheduling, local/remote host sync, multiplayer/SSO, embedded code editor, visual machine editing, npm-registry machine distribution, Jira entity properties, OAuth 3LO.

## Attribution

- [pi](https://github.com/earendil-works/pi-coding-agent) — the agent, embedded via its SDK.
- [skill-kit](https://github.com/contentful/skill-kit) — the task-machine foundation (typed state machines for agent skills), by Contentful.
- [Supaterm](https://github.com/supabitapp/supaterm) / [t3code](https://github.com/pingdotgg/t3code) — UX inspiration and MIT-licensed parts donor.

## License

MIT — see [LICENSE](LICENSE).
