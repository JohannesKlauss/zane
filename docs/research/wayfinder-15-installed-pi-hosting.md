# Hosting an existing Pi setup

Research for [Investigate hosting an existing Pi setup](https://github.com/JohannesKlauss/zane/issues/17), under [Ship Zane's first production task-machine runtime](https://github.com/JohannesKlauss/zane/issues/15). This is evidence for a later hosting and compatibility decision, **not an architecture selection**. The first map requires an existing Pi setup, a repository-free scratch run, host-controlled drafting with no Jira writes, and safe interruption handling. A bundled fallback and no-Pi onboarding are later work.

## Evidence and limits

- On 2026-10-30, the local `pi --version` reported **1.4.0**. Its package is `@earendil-works/pi-coding-agent`; [v1.4.0][pi-release] was the latest published Pi release at research time. The release tag resolves to commit `4a080252f06caf63a525d7873c5d94d3c23887e0`. The installed SDK, RPC, and extension docs have the same Git blob hashes as that tag.
- Pi's `main` was at [`e5c6182babfbc08a161eccb3d34c7dc30c913f88`][pi-main-checked] when checked. Its SDK, RPC, RPC command, RPC UI, JSON, and security docs and its RPC client source had the same blob hashes as v1.4.0; its extension guide had changed. The behavioral statements below are pinned to **v1.4.0**, not promises for every Pi release or fork.
- The comparison is based on primary documentation and source, plus local executable/launcher metadata. No Pi-hosting test session, test model request, prototype, or product integration was run. No credential values or user configuration contents were inspected. Therefore compatibility with any particular installed extension, packaged app, or interrupted run remains to be verified in production-oriented integration tests.

## At a glance

| Concern | Installed CLI in RPC mode | Embedded SDK |
| --- | --- | --- |
| Runtime identity | Runs the selected Pi executable with `--mode rpc`; CLI startup determines its version, configuration, and resources. | Imports a particular `@earendil-works/pi-coding-agent` module. Using the user's files with a separately bundled module does **not** make it the user's installed runtime. |
| Interface | Long-lived process, JSONL commands and events over pipes; normal CLI arguments and startup behavior apply. | In-process `createAgentSession`, `AgentSession` methods, event subscriptions, resource loaders, and session managers. |
| Existing setup | Loads normal CLI-discovered resources and CLI-provided built-ins, subject to cwd, trust, flags, and environment. | Defaults discover user resources and auth, but do **not** reproduce every CLI startup service, built-in extension, trust decision, or invocation flag. |
| Human interaction | Standard dialogs are a request/response subprotocol; terminal-only extension UI is unavailable or degraded. | The host can bind an `ExtensionUIContext`, but must supply its own implementation and mode; there is no documented native desktop mode or automatic translation of TUI components. |
| Stop and recovery | `abort`, queue controls, process shutdown, and persisted session commands exist; none alone proves arbitrary extension-owned work has stopped or a machine run is safe to resume. | `abort`, `waitForIdle`, session/runtime disposal, and persistent or in-memory sessions exist; disposal and idle likewise are not a general process-tree or external-side-effect guarantee. |

Both options are documented, but their observable behavior is not equivalent. See [Pi CLI integration][pi-cli-integration], [SDK][pi-sdk], [RPC][pi-rpc], and the source-specific differences below.

## Discovery and version compatibility

Pi documents a managed installer, npm, and Nix installations, with `pi --version` and `pi --help` for the installed interface. The v1.4.0 package requires Node.js **22.19.0 or newer**. There is no one documented universal location or SDK-discovery procedure covering every installation method, version manager, standalone build, wrapper, or rebrand. PATH lookup and an explicitly selected executable are distinct possibilities, not proof of which setup a person normally uses. [Install methods][pi-install]; [package manifest][pi-package]; [CLI reference][pi-cli].

The local managed launcher is one concrete counterexample to assuming that `pi` is a JS file: `$HOME/.pi/agent/bin/pi` is a shell launcher that reads the active managed version, optionally prepends the installer's private Node directory to `PATH`, and then `exec`s that release's executable. Pi's [current installer source][pi-installer] describes this layout. npm, Nix, and other installations need not match it. Selecting a shell alias or function, a wrapper with extra arguments, or an executable by absolute path may produce different flags or environment; normal executable lookup does not reproduce an interactive shell alias automatically. Node's spawn uses the supplied environment's `PATH` and defaults to no shell. [Node child-process reference][node-child].

**Important v1.4.0 client limitation:** Pi's exported `RpcClient.start()` does not spawn the `pi` executable. It calls `spawn("node", [cliPath, "--mode", "rpc", ...])`, with `cliPath` defaulting to the literal `dist/cli.js`. A shell launcher or standalone executable cannot simply be substituted as that JS entrypoint; this can bypass launcher-selected Node and environment. The client also merges the supplied environment with its own process environment. [Client source][pi-client-start]. A custom transport that actually launches the selected executable is a distinct option; neither option is a decision here.

Do not infer cross-version wire compatibility from matching executable names or TypeScript types. The v1.4.0 RPC command union and `get_state` have no documented protocol-version negotiation. For example, [v0.84.4's prompt response][pi-old-rpc] has no `disposition`, and its [`agent_settled` event][pi-old-settled] has no `aborted` field, whereas v1.4.0 has both. A supported version/capability policy and visible incompatibility handling remain decisions; the release evidence does not establish a safe minimum range. [v1.4.0 RPC types][pi-rpc-types]; [v1.4.0 events][pi-json].

## Models, credentials, and resources

The normal agent directory defaults to `~/.pi/agent` and can be overridden with `PI_CODING_AGENT_DIR` or the SDK's `agentDir`. It contains settings, `models.json`, `auth.json`, personal extensions, skills, prompts, and other resources. Pi supports saved OAuth/API credentials, provider environment variables, ambient cloud credentials, custom endpoints, and provider extensions. Pi can resolve some credential values by executing configured commands; environment-based credentials work only if present in the launched process. The host need not extract or display credential values to use these mechanisms, and must treat diagnostics, transcripts, and environment as sensitive. [Configuration][pi-config]; [model selection and credential precedence][pi-models]; [providers][pi-providers]; [environment][pi-env].

The SDK's default `ModelRuntime`, `SettingsManager`, and `DefaultResourceLoader` use the configured agent directory and cwd. However, **loading the same files is not the same as running the same version or startup sequence**. In the v1.4.0 source, direct `createAgentSession()` resolves its initial model before constructing the `AgentSession` that flushes extension-provided provider registrations. The CLI's `createAgentSessionServices()` explicitly registers those providers and refreshes the runtime before session/model selection. Extension-provided default or restored models therefore need explicit compatibility verification; the CLI and minimal SDK path cannot be presumed to select the same model. [SDK model selection][pi-sdk-source]; [SDK session construction][pi-sdk-new-source]; [session construction and extension binding][pi-session-construction]; [CLI service registration][pi-services-source].

The SDK returns `modelFallbackMessage` if a saved selection cannot be restored and another model is chosen. In v1.4.0 the CLI passes that message to interactive mode, not to the RPC mode invocation; RPC `get_state` reports the actual selected model but its response has no fallback-reason field. A host that needs to avoid a silent substitution must consider the actual selection and how to surface or reject a mismatch; neither path makes that product policy automatic. [SDK fallback][pi-sdk-source]; [CLI dispatch][pi-main-dispatch]; [RPC state][pi-rpc-types].

The CLI supplies four built-in extensions: `llama.cpp`, `codemode`, `tool-search`, and `mcp`. User extensions can replace the last three. The SDK docs explicitly say that SDK sessions do not automatically load the CLI built-ins and show how to add the public codemode, tool-search, and MCP factories, then bind extensions for `session_start`. The v1.4.0 package's public root exports those three factories, not the CLI's `builtInExtensions` collection or a llama.cpp factory; parity for the fourth therefore needs separate investigation rather than an invented import. [CLI built-ins][pi-builtins]; [SDK setup][pi-sdk]; [public exports][pi-exports]; [package exports][pi-package].

Skills are discovered from personal, project, Agent Skills, configured, package, and explicit CLI locations. They are advertised as descriptions/paths; the model normally reads their full instructions when needed, and `/skill:name` expands them explicitly. Extensions are executable TypeScript/JavaScript with providers, tools, commands, flags, hooks, and state. CLI `-e`, `--skill`, other resource flags, tool selectors, and shell-provided extra flags are invocation-specific: neither a bare executable nor an SDK import can infer a user's usual shell invocation. [Skills][pi-skills]; [extensions][pi-extensions]; [CLI resource flags][pi-cli]; [packages][pi-packages].

## Scratch, trust, and session ownership

A real existing directory can be Pi's cwd; a Git repository is not a stated prerequisite. Cwd selects built-in tool paths, project resources, context and session grouping. It is **not a sandbox**: commands can reach other paths and network services available to the OS user. Personal instructions load, and context files are searched through cwd ancestors even without a repository. Project `.agents/skills` discovery also walks ancestors, stopping at a repository root when there is one. Thus an empty scratch directory does not necessarily mean an empty effective context. [SDK cwd][pi-sdk]; [context discovery source][pi-context-source]; [skills][pi-skills]; [security][pi-security].

**Trust differs by entrypoint in v1.4.0.** The CLI resolves project trust; in RPC/print/JSON, when no override, extension, or saved decision applies, `ask` and `never` skip trust-gated project resources. Context files still load regardless of trust, and the project `sessionDir` is consulted before trust. By contrast, the minimal SDK path calls `SettingsManager.create(cwd, agentDir)` without a trust override; that manager defaults `projectTrusted` to `true`, and the default loader reload has no CLI trust resolver. An SDK host must consciously supply/manage trust behavior instead of assuming it inherits the CLI's prompt-or-skip policy. These are source-level findings, not proof of how a future Pi release behaves. [CLI trust][pi-security]; [SDK creation][pi-sdk-source]; [settings default][pi-trust-source]; [loader trust hook][pi-loader-trust]; [CLI trust orchestration][pi-main-trust].

Pi normally persists an append-only JSONL entry tree under its agent session directory, grouped by cwd; `--session-dir` overrides the environment and settings, and `--no-session` or `SessionManager.inMemory()` is ephemeral and cannot be resumed after exit. In the normal new-session path, Pi creates the session file only once a user or assistant message exists; it can contain prompts, tool arguments, output, file contents, and extension data. Pi owns the active branch and compaction projection. Machine position, human decisions, artifact ownership, and recovery status remain separate host concerns: a transcript is not an atomic machine checkpoint or evidence that an external action occurred exactly once. [Sessions][pi-sessions]; [file format][pi-session-format]; [persistence source][pi-history-source].

RPC exposes `get_state`, `get_messages`, `get_entries` with an entry cursor, `get_tree`, `switch_session`, `fork`, and `clone`. In v1.4.0 there is no dedicated RPC command for navigating the current tree to an arbitrary entry; `/tree` is a TUI command, though an extension could expose its own command. The SDK exposes `navigateTree()` directly. Session replacement can change the effective cwd and requires rebinding subscriptions and extension context; a missing recorded cwd fails non-interactive CLI startup rather than silently making a new workspace. [RPC commands][pi-rpc-commands]; [RPC union][pi-rpc-types]; [SDK lifecycle][pi-sdk]; [CLI cwd handling][pi-main-cwd].

The v1.4.0 session manager holds its own in-memory leaf/index and appends entries to the file. The consulted API/docs do not establish a concurrent-writer or lease guarantee for a CLI and Zane simultaneously owning the same session. Ownership and recovery of a previously live process need an explicit policy rather than assuming a shared JSONL file coordinates writers. [Session manager source][pi-history-source].

## Events, completion, and continuation

RPC is newline-delimited JSON, with commands on stdin and responses, events, and extension UI records on stdout. Command IDs correlate responses; session events generally do not carry the originating command ID. Split on LF, handle CRLF and UTF-8 boundaries, keep reading stdout, honor backpressure, and treat stderr as diagnostics rather than protocol. A successful `prompt` response means **accepted/queued/handled**, not completed. For a prompt with disposition `handled` there may be no agent run or `agent_settled` to await. [RPC framing and lifecycle][pi-rpc]; [prompt disposition][pi-rpc-commands].

`message_update` is delta-based on the wire, and `message_end` is the authoritative completed message. Tool events carry call IDs and error information. `agent_end` is only the end of one low-level run; retries, compaction recovery, queued messages, and extension `agent_before_settle` continuations can follow. `agent_settled` means that session-level automatic work has settled, not that the draft is valid or successful: inspect final message stop reasons such as `error`, `aborted`, `length`, or `deferred`, plus the machine's own output validation. The SDK exposes session events and `prompt()`/`waitForIdle()` directly. [Events][pi-json]; [message types][pi-message-types]; [SDK][pi-sdk]; [extension lifecycle][pi-extensions].

There is a further distinction between **settling one run** and **proving the process has no future work**. In v1.4.0, an extension's `agent_settled` handler can request a new run; source defers that request until after the settled event is emitted. Extensions may also own independent processes or network work. A host needs a rule for such new work and correlation with its machine step, not just a single event interpreted as global quiescence. [Settlement source][pi-settlement-source]; [extension lifecycle][pi-extensions].

The exported v1.4.0 `RpcClient.promptAndWait()` subscribes before prompting, but its implementation does not inspect the returned `handled` disposition before waiting for `agent_settled`. It can consequently time out when an extension consumes a prompt without starting a run. This is a version-specific source observation, not a claim about all clients. [Client completion source][pi-client-completion].

## Human and extension UI

In RPC mode, `select`, `confirm`, `input`, and `editor` emit `extension_ui_request` and wait for an `extension_ui_response` with the same request ID; cancellation returns `undefined` or `false`. `notify`, status, text-only widgets, title, and editor-text updates are fire-and-forget. Some dialogs support extension-provided timeouts and abort signals, but the editor request has no timeout in the v1.4.0 wire type. A client must distinguish user response, cancellation, timeout, stale requests, process exit, and approval authority; leaving an unanswered request can leave extension work waiting. [RPC UI][pi-rpc-ui]; [wire types][pi-rpc-types]; [implementation][pi-rpc-mode].

RPC sets `ctx.mode` to `"rpc"` and `ctx.hasUI` to true, but `ctx.ui.custom()` returns `undefined`; terminal input, custom component factories, headers/footers, custom editors, theme switching, and other TUI controls are no-ops or unsupported. An extension that assumes a real terminal may degrade or behave differently even though it sees `hasUI`. Print/JSON provide no interactive UI. The host cannot claim full extension compatibility merely because the extension loaded. [RPC limitations][pi-rpc-ui]; [extension modes][pi-extensions]; [TUI API][pi-tui].

The v1.4.0 typed `RpcClient` dispatches non-response records to listeners typed as session events, but exposes no public method to send `extension_ui_response`; its sender is private and accepts the normal command union. The [separate RPC extension UI example][pi-rpc-ui-example] demonstrates the lower-level protocol. A host using the wire protocol must handle that subprotocol; the typed client alone does not provide the whole dialog exchange. [Client API/source][pi-client-completion]; [RPC UI types][pi-rpc-types].

For SDK embedding, `bindExtensions({ uiContext, mode, ... })` can supply UI and command actions and emits `session_start`; without a UI context the runner uses no-op UI. Its default mode is `print`, and available mode values are `tui`, `rpc`, `json`, and `print`, not a distinct desktop mode. An adapter must decide how extensions see its capabilities and cannot automatically make an arbitrary TUI component into native GUI controls. [Extension binding][pi-bind-source]; [runner defaults][pi-runner-ui]; [UI interface][pi-ui-types].

## Cancellation, cleanup, and interruption

Pi documents `abort` as stopping the active agent operation and waiting for idle. `clear_queue` matters separately: Pi documents clearing steering/follow-up messages before `abort` because queued work may otherwise continue. Direct RPC `bash` is a separate command with `abort_bash`; in v1.4.0 that handler calls the synchronous `abortBash()` and returns, while the originating bash command has its own eventual response. `abort` alone does not call `abortBash()`. An unresponsive tool, UI request, extension, or external effect may need further handling. [RPC abort/queue/bash][pi-rpc-commands]; [session abort][pi-session-abort]; [RPC dispatch][pi-rpc-mode]; [bash controllers][pi-session-bash].

Closing RPC stdin requests shutdown, and SIGTERM/SIGHUP are handled. The v1.4.0 source emits `session_shutdown` via runtime disposal, then calls synchronous `session.dispose()`, which requests aborts but does not await agent idle. The SIGTERM/SIGHUP path additionally signals **tracked** detached children. This is useful cleanup behavior, not a guarantee that every extension, independently detached descendant, remote operation, or external side effect has finished. `SIGKILL` cannot run the handler. [RPC shutdown][pi-rpc-shutdown]; [runtime disposal][pi-runtime-dispose]; [session disposal][pi-session-dispose]; [signal handling][pi-rpc-signal].

Pi's built-in local shell starts a separate process group on Unix, tracks it, and on abort calls a process-tree helper that sends `SIGKILL` to that group, falling back to the child PID. This covers that implementation's tracked group, not arbitrary extension processes or children that escape it. Node documents that children can outlive their parent on non-Windows systems. The v1.4.0 `RpcClient.stop()` stops reading stdout, sends SIGTERM, and after one second sends SIGKILL and resolves without awaiting a subsequent exit event in that timeout branch. Do not equate that return, a signal send, `agent_settled`, or a Pi process exit with proof that **all owned work** has stopped. [Built-in shell source][pi-bash-source]; [tree-kill helper][pi-shell-source]; [Node process lifetime][node-child]; [client stop][pi-client-stop].

The map requires a stopped run not to be presented as stopped while owned work is still running, and interrupted runs to be handled visibly and safely after restart. The sources do not supply a complete host-level solution for ownership across crashes, detached extensions, remote calls, or non-cooperative work. Retention, liveness verification, termination escalation, uncertain side effects, and retry/reconciliation remain lifecycle decisions; automatic resume is not required by the map.

## Trust, permissions, and the no-Jira-write boundary

Pi explicitly says it does not ask before every tool call. Extensions run with the Pi process's OS permissions and can execute arbitrary code, inspect credentials and history, or start work. A child process is a crash/lifetime boundary, **not** an OS sandbox; changing cwd or declining project trust does not constrain the user's global extensions or tool access. Tool annotations are unverified hints. [Pi security][pi-security]; [extensions][pi-extensions].

A particularly important v1.4.0 caveat: `--tools read,...` does not necessarily remove MCP tools reachable through codemode; `--no-mcp` disables the **built-in** MCP extension, not a replacement extension. Even a disabled model-facing tool list does not prevent arbitrary loaded extension startup code or subprocesses from making external calls. Therefore the map's no-Jira-write outcome and any approval policy cannot be established solely by a prompt, a selected working directory, or a superficially read-only tool list while also claiming unrestricted extension compatibility. The permitted resources, isolation/trust boundary, and what to do when compatibility cannot be safely honored are unresolved product decisions. [CLI tool rules][pi-cli]; [MCP exposure and replacements][pi-mcp]; [Pi security][pi-security].

## Packaged macOS Electron constraints

Zane's baseline declares Electron **45.0.0**, packages an ASAR, and sets the `RunAsNode` fuse to false. Electron 45 ships Node **24.22.0**, above Pi 1.4.0's declared Node minimum; that comparison alone does not establish SDK, extension, native-module, worker, or packaging compatibility. The disabled fuse means Electron's `ELECTRON_RUN_AS_NODE`/ordinary Electron-backed `child_process.fork()` path is unavailable. It does **not** prohibit spawning a separate installed `pi` or `node` executable. [Zane package][zane-package]; [Zane Forge configuration][zane-forge]; [Electron release][electron-release]; [Pi manifest][pi-package]; [Electron fuses][electron-fuses].

Electron's `utilityProcess.fork()` runs a Node script with message ports and configurable cwd/environment, but its stdin must be ignored; it is not a drop-in direct host for Pi's stdin-driven RPC protocol. It could host other work, or a separate bridge could launch a Pi child, but those are distinct designs to evaluate. On macOS, utility-process `disclaim` changes TCC attribution and `allowLoadingUnsignedLibraries` has signing/entitlement implications; neither is a general sandbox guarantee. [Electron utility process][electron-utility].

ASAR is read-only, cannot be used as an actual cwd, and has limitations for spawned binaries and native modules. An installed Pi outside the app bundle, its Node runtime, native dependencies, WASM/worker assets, scratch/session files, and any packaged helper must be evaluated according to their real paths rather than assumed to work because development mode works. Finder/Dock and shell launches can present different environments; command lookup uses the actual child `PATH`, and provider keys or secret-manager helpers may depend on that environment. Sandboxing, TCC/Keychain access, signing, environment import, extension binaries, and arm64/x64 compatibility need a packaged-app test matrix; this note does not assert which entitlements will be needed. [Electron ASAR][electron-asar]; [Node spawn][node-child]; [Pi environment][pi-env]; [Electron security][electron-security].

## Unresolved questions for the map

1. Which installed distributions/versions and executable selection methods are in the first compatibility contract? How are upgrades, wrappers, invocation flags, protocol changes, and model fallback surfaced without silently switching setups?
2. If SDK hosting remains an option, how will it discover or identify the actual installed SDK, reproduce the required CLI built-ins and provider-registration order, and deliberately resolve project trust? Which differences are acceptable and visible?
3. Which extension dialogs can the desktop support, and how should unsupported TUI components, custom providers, command-driven authentication, or an unavailable UI fail or degrade? How are actual human approval, cancellation, timeout, and stale responses distinguished?
4. What session storage, single-writer ownership, cwd lifetime, and sensitive-data retention policy supports a scratch machine while keeping Pi's conversation tree authoritative and Zane's machine state distinct?
5. What constitutes verified stop when Pi, a built-in shell, custom extensions, nested children, MCP servers, or remote calls are active? What durable state and explicit recovery are shown after host/process interruption or an uncertain external result?
6. How will the built-in machine preserve the user's setup while enforcing its approval and **no Jira writes** requirements, including indirect MCP/codemode and extension-owned side effects? Which capabilities or setups must be rejected rather than silently altered?
7. Which packaged macOS configurations actually preserve PATH, credential resolution, native assets, TCC behavior, and cleanup, including Finder launch, Apple Silicon/Intel, signed or unsigned builds as relevant, and the project's existing Electron fuses?

## Sources

Pi links below are pinned to release commit `4a080252f06caf63a525d7873c5d94d3c23887e0` unless noted.

- Pi v1.4.0: [release][pi-release], [SDK][pi-sdk], [RPC protocol][pi-rpc], [extension UI][pi-rpc-ui], [security][pi-security].
- Earlier protocol evidence: [v0.84.4 prompt response][pi-old-rpc] and [settled event][pi-old-settled].
- Electron v45: [release][electron-release], [fuses][electron-fuses], [utility processes][electron-utility], [ASAR][electron-asar].
- Pi's [current installer][pi-installer] is a live, unpinned source; the launcher observation is local to this research.

[pi-main-checked]: https://github.com/earendil-works/pi/commit/e5c6182babfbc08a161eccb3d34c7dc30c913f88
[pi-release]: https://github.com/earendil-works/pi/releases/tag/v1.4.0
[pi-install]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/docs/quickstart.md#1-install-pi
[pi-installer]: https://pi.dev/install.sh
[pi-package]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/package.json
[pi-cli]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/docs/cli.md
[pi-cli-integration]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/docs/cli-integration.md
[pi-sdk]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/docs/sdk.md
[pi-rpc]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/docs/rpc.md
[pi-rpc-commands]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/docs/rpc-commands.md
[pi-rpc-ui]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/docs/rpc-extension-ui.md
[pi-json]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/docs/json.md
[pi-message-types]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/docs/message-types.md
[pi-config]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/docs/configuration.md
[pi-models]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/docs/models.md
[pi-providers]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/docs/providers.md
[pi-env]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/docs/environment-variables.md
[pi-skills]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/docs/skills.md
[pi-extensions]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/docs/extensions.md
[pi-packages]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/docs/packages.md
[pi-mcp]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/docs/mcp.md
[pi-security]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/docs/security.md
[pi-sessions]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/docs/sessions.md
[pi-session-format]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/docs/session-format.md
[pi-tui]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/docs/tui.md
[pi-rpc-ui-example]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/examples/rpc-extension-ui.ts
[pi-rpc-types]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/modes/rpc/rpc-types.ts
[pi-old-rpc]: https://github.com/earendil-works/pi/blob/b79e4cc834970cca69daebffab7df1da7d1e52c4/packages/coding-agent/src/modes/rpc/rpc-types.ts#L115-L121
[pi-old-settled]: https://github.com/earendil-works/pi/blob/b79e4cc834970cca69daebffab7df1da7d1e52c4/packages/coding-agent/src/core/agent-session.ts#L145-L152
[pi-client-start]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/modes/rpc/rpc-client.ts#L28-L132
[pi-client-stop]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/modes/rpc/rpc-client.ts#L145-L168
[pi-client-completion]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/modes/rpc/rpc-client.ts#L466-L605
[pi-rpc-mode]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/modes/rpc/rpc-mode.ts
[pi-rpc-shutdown]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/modes/rpc/rpc-mode.ts#L724-L743
[pi-rpc-signal]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/modes/rpc/rpc-mode.ts#L365-L381
[pi-sdk-source]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/core/sdk.ts#L190-L251
[pi-sdk-new-source]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/core/sdk.ts#L449-L477
[pi-services-source]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/core/agent-session-services.ts#L132-L196
[pi-session-construction]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/core/agent-session.ts#L485-L526
[pi-trust-source]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/core/settings-manager.ts#L310-L355
[pi-loader-trust]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/core/resource-loader.ts#L518-L529
[pi-main-trust]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/main.ts#L738-L799
[pi-main-cwd]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/main.ts#L687-L720
[pi-main-dispatch]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/main.ts#L872-L960
[pi-context-source]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/core/resource-loader.ts#L232-L273
[pi-builtins]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/extensions/index.ts
[pi-exports]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/index.ts#L400-L415
[pi-bind-source]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/core/agent-session.ts#L3318-L3342
[pi-runner-ui]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/core/extensions/runner.ts#L331-L368
[pi-ui-types]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/core/extensions/types.ts#L139-L326
[pi-history-source]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/core/session-manager.ts#L979-L1195
[pi-settlement-source]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/core/agent-session.ts#L1078-L1097
[pi-session-abort]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/core/agent-session.ts#L2495-L2515
[pi-session-bash]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/core/agent-session.ts#L3896-L3973
[pi-session-dispose]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/core/agent-session.ts#L1412-L1435
[pi-runtime-dispose]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/core/agent-session-runtime.ts#L404-L411
[pi-bash-source]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/core/tools/bash.ts#L88-L160
[pi-shell-source]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/src/utils/shell.ts#L198-L247
[zane-package]: https://github.com/JohannesKlauss/zane/blob/f31f44292e9627cbcbf26ced3a6c7ec64149a687/apps/desktop/package.json
[zane-forge]: https://github.com/JohannesKlauss/zane/blob/f31f44292e9627cbcbf26ced3a6c7ec64149a687/apps/desktop/forge.config.mts#L12-L56
[electron-release]: https://github.com/electron/electron/releases/tag/v45.0.0
[electron-fuses]: https://github.com/electron/electron/blob/54f961b44b83e4ece81065ab60a182fd0c38c01e/docs/tutorial/fuses.md#runasnode
[electron-utility]: https://github.com/electron/electron/blob/54f961b44b83e4ece81065ab60a182fd0c38c01e/docs/api/utility-process.md
[electron-asar]: https://github.com/electron/electron/blob/54f961b44b83e4ece81065ab60a182fd0c38c01e/docs/tutorial/asar-archives.md
[electron-security]: https://github.com/electron/electron/blob/54f961b44b83e4ece81065ab60a182fd0c38c01e/docs/tutorial/security.md
[node-child]: https://github.com/nodejs/node/blob/v24.18.0/doc/api/child_process.md
