# Skill-kit hosting for Zane

Research for [Investigate skill-kit hosting for Zane](https://github.com/JohannesKlauss/zane/issues/16), under [Ship Zane's first production task-machine runtime](https://github.com/JohannesKlauss/zane/issues/15). This is an interface investigation, not an architecture decision.

## Scope and answer

As of **2026-10-30**, npm's `latest` is `@contentful/skill-kit` **1.10.16**, published on 2026-10-29. The corresponding upstream tag resolves to commit `99bbfd399df8c05df53d1f50ce895d8d13e2064b`. This note uses that commit for source citations and spot-checks the relevant compiled modules in the published npm tarball. It is source research: no prototype, integration run, packaged-app test, or inspection of the user's Pi configuration or credentials was performed. [npm latest][npm-latest] · [registry history][npm-history] · [version metadata][npm] · [tag][tag] · [release source][source]

**Finding:** The documented MCP and CLI protocols let a Node/Electron application call `start` and `advance` itself, keeping the model out of the routing loop. They do **not** by themselves provide a desktop interaction API, a Pi adapter, an enforceable current-step boundary, a complete event/state feed, or a run-cancellation contract. A host would have to provide those missing controls, or use a different/upstream-extended interface. The available evidence does not establish that any option meets Zane's production lifecycle and packaging requirements as-is. [architecture][architecture] · [MCP tools][mcp-tools] · [engine advance][engine-advance]

## Available interfaces

| Interface | What is actually exposed | Hosting significance |
| --- | --- | --- |
| **Documented MCP stdio server** | A built workflow can run `scripts/run mcp`; the simple workflow server exposes `start` and `advance`. The client receives JSON encoded in a tool-result text block. Sessions and engine state live in the server process. [architecture][architecture] · [MCP entry][mcp-entry] · [tools][mcp-tools] | A host can be the MCP client, submit responses, and use the returned next step without letting Pi invoke these tools. This is a documented transport, not evidence that the SDK supplies a production desktop controller. |
| **Documented CLI protocol** | `start` and `advance` run as separate invocations. Stateless mode passes `--params`, `--step`, `--output`, and `--history`; session mode uses a JSONL file and returns a pointer/line number. `cleanup` removes that file. [CLI protocol][cli-protocol] · [CLI entry][cli-entry] | A host can own the calls and replay input, but it must manage history, processes, file privacy, failures, and action ambiguity. It should not assume the temporary session file is a durable, authoritative run log. |
| **Exported `/test` harness** | `runSkill(skill, { model, params?, host? })` accepts an async `ModelAdapter.respond(stepName, prompt)` and returns a trace only when the run finishes. [test exports][test-exports] · [harness][harness] · [model type][model-type] | A real host callback could wait for a person or invoke Pi; it is not restricted to canned values. However, upstream describes this as a **test harness**. The callback is not given the response schema or preamble, and the options expose no external signal, pause/resume history, or reference loader. Its implementation throws on invalid output rather than offering an interactive retry. No production-support promise for this use was found. [testing docs][testing-docs] · [harness][harness] |
| **Internal engine** | `WorkflowEngine` has `start`, `advance`, and replay methods in the compiled distribution, but is absent from the package's root, `/cli`, and `/test` exports. `createMcpServer` is likewise not exported by `/cli`. [package exports][package] · [root exports][root-exports] · [CLI exports][cli-exports] | A deep import, vendoring, or fork would depend on an internal interface rather than a documented public embedding contract. The public `/cli` entry points use process arguments and stdio, not a host-owned per-run controller. [MCP entry][mcp-entry] · [CLI entry][cli-entry] |

These are interface descriptions, not recommendations to choose one. Composite/reference servers add their own behavior; the concrete MCP observations below concern the ordinary workflow server. [composite MCP][mcp-composite]

## Routing, validation, and actions

- **Direct evidence.** The engine validates configured params at construction. On `advance`, it validates the submitted step response against that step's ArkType schema, executes its optional action, saves state, evaluates `next`, and returns a prompt, terminal result, redirect, or validation error. Invalid step responses return `retry: true`; the caller is responsible for submitting again. A missing response schema means no response validation, and this implementation replaces the submitted value with `{}`. JSON Schema conversion can fail and leave the returned `schema` as `null` even when the internal ArkType validator exists. [engine setup][engine-setup] · [engine advance][engine-advance] · [prompt construction][engine-prompt]
- **Direct evidence.** A named action's input schema is asserted, but the inspected engine calls `actionDef.run` and freezes its return without asserting the declared action **output** schema. When store schemas are configured, invalid sub-store `save` writes produce a stderr warning and are still applied. Final-output validation, if configured, validates the last response, not an independently proven human approval. [action definition][action] · [engine advance][engine-advance] · [final output][engine-final]
- **Important source observation, not runtime-reproduced.** `advance(stepName, output)` checks that the supplied name exists but does not compare it with `currentStep`; the MCP tool passes the caller's name straight through. Thus a caller can submit a different existing step with a schema-valid value, potentially running that step's action or reaching its terminal transition. The host must track and serialize the expected step, reject stale/duplicate/out-of-order advances, and keep the advancement interface out of model control if required steps are to be mandatory. [engine advance][engine-advance] · [MCP session][mcp-session] · [MCP tools][mcp-tools]
- **Source observation, not runtime-reproduced.** Explicit `maxVisits`/`onMaxVisits` and an implicit limit for detected cycles exist. But the graph builder does not add a `'self'` string unless it names an actual step, and excludes the current step from function-transition targets, while `resolveNext` maps `'self'` to the current step. Do not assume the implicit detector covers every self-loop; an explicit guard and upstream confirmation matter. [cycle detection][cycle-guard] · [transition resolution][engine-transitions]
- **Inference.** Actions are executable application code, run inside the skill process between validation and the returned transition. A schema-valid `{ approved: true }` proves shape, not who approved it. A built-in definition does not itself sandbox actions, authorize tools, or permit a Jira write; approval provenance and allowed effects remain host policy. [step/action types][step-types] · [engine advance][engine-advance]

## Human interaction and Pi

**What skill-kit emits.** `act.askUser`, `confirm`, `plan`, `survey`, `checklist`, and `subagent` are authored as prompt segments but rendered into XML-like strings in the step prompt; a text preamble maps tags to tools the *model* is expected to call. The upstream architecture explicitly says the skill cannot itself cause the host to render UI or call host tools. The simple workflow MCP server registers `start`/`advance`, not an elicitation or interaction-response API. `act.subagent` is a directive, not a Pi invocation: its `no-recurse` attribute is an instruction, and its configured `output` schema is not included in the rendered tag. Step `response` validation is separate. [architecture: host constraint][host-constraint] · [prompt assembly][engine-prompt] · [primitive registry][primitives] · [subagent renderer][subagent] · [MCP tools][mcp-tools]

**What a host could do, as an inference.** For a constrained built-in definition, Zane could interpret supported directives or maintain explicit per-step interaction metadata, render its own controls, collect actual human responses, map them to the authored response schema, and submit those values itself. That mapping is Zane's contract, not an upstream structured interaction callback. Mixed prompt pieces, multiple questions in one step, optional schemas, and dynamically generated content need a defined policy. The renderers interpolate question text and attributes directly, without general XML escaping, so a generic strict-XML parser cannot be assumed safe for arbitrary authored text. [ask-user renderer][ask-user] · [survey renderer][survey] · [prompt assembly][engine-prompt] · [response types][result-types]

**Pi is separate.** No Pi-specific host is present in the inspected skill-kit host registry, and the exported skill-kit interfaces do not invoke Pi. As examples of Pi's *own* interfaces, Pi **1.4.0** documents an in-process `createAgentSession`/`prompt`/`subscribe` API and a CLI `--mode rpc` JSONL subprocess with events and extension-UI requests. A host could bridge an agent-work step to one of those independently and feed its result back to skill-kit. This does not establish equivalence to any particular installed Pi version or guarantee extension compatibility: Pi's SDK documentation explicitly says several CLI built-in extensions are not loaded automatically by SDK sessions. The parallel Pi-hosting research should establish that compatibility contract. [skill-kit hosts][hosts] · [Pi 1.4.0 SDK][pi-sdk] · [Pi 1.4.0 RPC][pi-rpc] · [Pi extension UI limits][pi-ui]

## Protocol details and source-level discrepancies

### MCP

- `start({ params? })` returns `status: "prompt"` with a session ID, step, prompt, schema, and preamble; `advance({ session, step, output })` returns `prompt`, `done`, or `error`. `output` is restricted by the MCP tool schema to a JSON object. The workflow status/error is inside JSON text content; a client must inspect it rather than rely only on an MCP `isError` flag. [MCP tools][mcp-tools] · [MCP result formatter][mcp-format]
- **Source observation.** The initial simple-MCP `start` returns `engine.start()` directly; it does not call `autoAdvance`. Later `advance` calls do auto-advance promptless steps. An initially promptless step therefore still appears as a prompt to the caller. MCP's result formatter discards `completed` and `autoAdvanced` fields, so the response does not expose a complete history of intermediate steps/actions. The simple server offers no run-status, history, or cancel tool. [MCP entry][mcp-entry] · [auto-advance][auto-advance] · [MCP formatter][mcp-format]
- **Source observation, not runtime-reproduced.** `engine.start()` includes `skill.system` in its preamble, but the MCP session formatter substitutes its own generated preamble, which does not include that skill-level system text. Preserve or avoid relying on that instruction only after resolving the discrepancy for the chosen integration. [engine start][engine-start] · [MCP formatter][mcp-format]

### CLI state and replay

- Session mode's default directory is checked for current-user ownership and mode `0700`; new files are created with mode `0600`. The file contains JSONL params, prompts, outputs, and results in plaintext, and cleanup unlinks it. A caller-supplied session directory bypasses the default directory helper. These permissions are not a retention, encryption, or crash-recovery policy. [secure temp][secure-tmp] · [session file][session-file] · [CLI entry][cli-entry]
- Replay rebuilds the store from supplied history and reruns `save`, without rerunning actions. It skips malformed or unknown history entries; if a response fails revalidation, this version retains the raw response instead of rejecting the history. Therefore replay is not proof of ordered, valid, or tamper-free execution. A crash after an action has had an effect but before its result is recorded can leave the outcome unknown; the source does not establish exactly-once effects. [replay][engine-replay] · [CLI invocation][cli-protocol] · [engine advance][engine-advance]
- **Source-traced concern, not runtime-reproduced.** `autoAdvance` includes the last automatic step in both `autoAdvanced` and the final `completed` field. Session mode also writes intermediate results, and `reconstructHistory` appends both fields without deduplication: even a single promptless entry step appears capable of being replayed twice. Stateless mode drops intermediate output, including the preceding step's `completed` record when auto-advance follows it. Verify this with upstream or production-focused tests before relying on promptless-step history or action-result recovery. [auto-advance][auto-advance] · [output writer][output-writer] · [history reconstruction][session-history]

## Observability, stop, and restart

**Direct evidence.** Definitions can include `onStepStart`, `onStepComplete`, `onStepValidationFailed`, `onTransition`, and `onSkillComplete` observers. These are author-provided callbacks, not a transport subscription; callback failures are caught and written to stderr. The dispatcher schedules callbacks and flushes pending promises at terminal/redirect, so they are not a durable, synchronous audit log. Ordinary MCP clients see only call results, not those observer events or the full store. [observer types][observers] · [observer dispatcher][observer-dispatch] · [engine advance][engine-advance] · [MCP formatter][mcp-format]

**Cancellation gap.** The engine constructs a private `AbortController` and passes its signal to actions, but the inspected engine has no method that aborts it; the MCP handlers ignore request context and expose no session cancel/close. An MCP cancellation notification is a request to stop, not an acknowledgement that work and its effects have ended; the protocol allows it to be ignored in some cases. The single-invocation CLI catches top-level exceptions and prints them to stderr with exit status 1; validation errors instead use protocol results. [engine setup][engine-setup] · [actions][engine-advance] · [MCP tools][mcp-tools] · [MCP cancellation][mcp-cancel] · [CLI entry][cli-entry]

**Implication for the map's safety requirement.** A host needs an explicit lifecycle for the skill process, Pi work, and any owned descendants: request cancellation, observe actual completion/exit, and only then report a stopped run. Node's `kill()` sends a signal; the `close` event is separate, and descendants may outlive a parent. Pi 1.4.0's `abort` waits for session idle, but queued steering/follow-up work can continue unless handled; that is distinct from stopping a skill action or descendant. After interruption, retain an explicit incomplete/unknown-outcome state rather than treating an in-memory MCP session or JSONL replay as proof that all work stopped. The precise escalation, retention, and retry policy remains undecided. [Node 24 child processes][node-child] · [Pi RPC commands][pi-commands] · [MCP sessions][mcp-session]

## Packaged macOS implications

- **Version and distribution.** The npm package is ESM and requires Node **>=24**. `skill-kit build` defaults to Bun-compiled standalone executables; its default targets are `darwin-arm64` and `linux-x64`, with `darwin-x64` available explicitly. Node mode bundles to an `.mjs` targeted at Node 24, and its generated shell wrapper looks for an external `node` on `PATH` and rejects older versions. A partial Bun target build can succeed if at least one target succeeds, so required macOS targets need independent verification. [package metadata][npm] · [build implementation][build] · [targets][targets] · [Node wrapper][node-wrapper]
- **Published export condition.** The 1.10.16 manifest maps a `source` condition to `./src/*.ts`, but the published tarball contains `dist` and `bin`, not `src`; the regular `import` condition targets `dist`. A bundler configured to select `source` therefore needs particular verification. [package export map and files][package] · [published tarball][tarball]
- **Electron is not automatically the wrapper's `node`.** At Zane commit `f31f44292e9627cbcbf26ced3a6c7ec64149a687`, the desktop pins Electron **45.0.0**, whose release embeds Node **24.22.0**; this satisfies the package's numerical minimum in a Node-capable Electron process, not proof of a packaged integration. The generated `scripts/run` still searches for a separate `node`. Zane's Forge config enables ASAR and disables `RunAsNode`; Electron documents that this disables `ELECTRON_RUN_AS_NODE` and makes `child_process.fork` throw. [Zane manifest][zane-package] · [Electron 45 release][electron-release] · [Zane Forge config][zane-forge] · [Electron fuses][electron-fuses]
- **Process and file layout.** Electron offers utility processes, but its documented `utilityProcess.fork` supports piped stdout/stderr and **not stdin**, so an unmodified stdio MCP server cannot simply use that process's stdin as its MCP transport. Electron also documents ASAR as read-only and restricts execution of packaged binaries; shell wrappers, external Node, native helpers, references, and scratch/session files need an appropriate real-filesystem layout. No packaging approach or sandbox guarantee has been demonstrated here. [utility process][utility] · [ASAR limitations][asar]
- **Reference-loading caveat, source observation.** The generated wrapper for an ordinary workflow calls `main(def)`. That entry point uses no-op references, and its MCP branch calls `mcpMain` without a reference loader; the latter also defaults to no-op references. Thus copying a `references/` directory into a built ordinary skill does not by itself establish that its `refs.load()` works through this entry point. Composite/reference entry points differ. [generated wrapper][generated-wrapper] · [CLI entry][cli-entry] · [MCP entry][mcp-entry] · [build][build]
- **License.** Skill-kit is MIT; its copyright and permission notice must accompany copies or substantial portions. Upstream's notice inventories third-party licenses; the exact dependencies and any compiled runtime included in a shipped artifact need their own attribution review. [MIT license][license] · [upstream notice][notice]

## Questions left for the parent map

1. Which documented boundary, if any, should the production host use: MCP, stateless/session CLI, or an upstream-supported embedding API? Will upstream support an externally driven engine with current-step enforcement, typed interaction requests, cancellation, and state/events?
2. What restricted contract for the first built-in machine guarantees that real user approval, agent work, schema mapping, and allowed effects cannot be substituted by model output? What happens for mixed or unsupported primitives and schema-to-JSON conversion failures?
3. How will Zane coordinate Pi, actions, processes and descendants on stop; detect and present interrupted/unknown outcomes after restart; and avoid unsafe replay? Can the CLI auto-advance/history and MCP preamble observations be confirmed or fixed upstream?
4. How will the packaged app provide the required runtime and real filesystem resources under the existing ASAR/fuse settings, including any needed macOS architectures and license notices? The actual installed Pi version, discovery, extensions and trust policy remain for the separate Pi investigation.

## Sources

Sources below are primary. Versioned source observations are pinned to the release commit rather than to a moving branch. Documentation and code can disagree: for example, the website's testing guide says `runSkill` retries validation, whereas the inspected 1.10.16 implementation throws; this note follows the implementation for that version. [testing docs][testing-docs] · [harness][harness]

[npm]: https://registry.npmjs.org/%40contentful%2Fskill-kit/1.10.16
[npm-latest]: https://registry.npmjs.org/%40contentful%2Fskill-kit/latest
[npm-history]: https://registry.npmjs.org/%40contentful%2Fskill-kit
[tarball]: https://registry.npmjs.org/@contentful/skill-kit/-/skill-kit-1.10.16.tgz
[tag]: https://api.github.com/repos/contentful/skill-kit/git/tags/7fdc8a8a7b85bc3143889e4cfdbf76941eea68b2
[source]: https://github.com/contentful/skill-kit/tree/99bbfd399df8c05df53d1f50ce895d8d13e2064b
[architecture]: https://contentful.github.io/skill-kit/architecture/
[host-constraint]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/docs-site/src/pages/architecture/index.mdx#L156-L170
[package]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/package.json#L1-L37
[root-exports]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/index.ts
[cli-exports]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/cli.ts
[test-exports]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/test.ts
[harness]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/testing/run-skill.ts#L5-L82
[model-type]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/types.ts#L569-L581
[testing-docs]: https://contentful.github.io/skill-kit/getting-started/testing/
[engine-setup]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/runtime/engine.ts#L38-L73
[engine-start]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/runtime/engine.ts#L75-L84
[engine-advance]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/runtime/engine.ts#L91-L215
[engine-replay]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/runtime/engine.ts#L217-L258
[engine-transitions]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/runtime/engine.ts#L260-L313
[engine-prompt]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/runtime/engine.ts#L315-L380
[engine-final]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/runtime/engine.ts#L382-L395
[action]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/action.ts
[cycle-guard]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/validation/cycle-guard.ts#L10-L75
[step-types]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/types.ts#L250-L320
[result-types]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/types.ts#L491-L524
[observers]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/types.ts#L337-L349
[observer-dispatch]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/runtime/observer-dispatch.ts
[primitives]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/primitives/registry.ts#L1-L70
[ask-user]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/primitives/ask-user.ts#L44-L73
[survey]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/primitives/survey.ts#L43-L98
[subagent]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/primitives/subagent.ts#L7-L39
[hosts]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/protocol/host.ts#L3-L169
[mcp-entry]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/protocol/mcp-entry.ts#L17-L75
[mcp-tools]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/protocol/mcp-tools.ts#L11-L40
[mcp-session]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/protocol/mcp-session.ts#L35-L92
[mcp-format]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/protocol/mcp-session.ts#L43-L132
[mcp-composite]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/protocol/mcp-composite.ts
[mcp-cancel]: https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/cancellation
[auto-advance]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/protocol/auto-advance.ts
[output-writer]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/protocol/output-writer.ts
[cli-protocol]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/protocol/single-invocation.ts#L7-L56
[cli-entry]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/protocol/cli-entry.ts
[secure-tmp]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/protocol/secure-tmp.ts
[session-file]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/protocol/session.ts
[session-history]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/protocol/session.ts#L70-L100
[build]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/build/index.ts#L37-L183
[targets]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/build/targets.ts
[node-wrapper]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/build/node-scripts-run-template.ts
[generated-wrapper]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/src/build/node-wrapper-template.ts
[license]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/LICENSE
[notice]: https://github.com/contentful/skill-kit/blob/99bbfd399df8c05df53d1f50ce895d8d13e2064b/NOTICE
[pi-sdk]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/docs/sdk.md
[pi-rpc]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/docs/rpc.md
[pi-commands]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/docs/rpc-commands.md#abort
[pi-ui]: https://github.com/earendil-works/pi/blob/4a080252f06caf63a525d7873c5d94d3c23887e0/packages/coding-agent/docs/rpc-extension-ui.md#limitations
[zane-package]: https://github.com/JohannesKlauss/zane/blob/f31f44292e9627cbcbf26ced3a6c7ec64149a687/apps/desktop/package.json#L59
[zane-forge]: https://github.com/JohannesKlauss/zane/blob/f31f44292e9627cbcbf26ced3a6c7ec64149a687/apps/desktop/forge.config.mts#L13-L56
[electron-release]: https://releases.electronjs.org/release/v45.0.0
[electron-fuses]: https://www.electronjs.org/docs/latest/tutorial/fuses#runasnode
[utility]: https://www.electronjs.org/docs/latest/api/utility-process#utilityprocessforkmodulepath-args-options
[asar]: https://www.electronjs.org/docs/latest/tutorial/asar-archives#limitations-of-the-node-api
[node-child]: https://nodejs.org/docs/latest-v24.x/api/child_process.html#subprocesskillsignal
