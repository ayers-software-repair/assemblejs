# Academy research

Research began 30 October 2026 on `codex/assemblejs-academy`, based on
`024ab2b8e9bf27e5e40c57f650068096d4027092`. No Academy runtime or landing design
has been chosen. Website-management subsequently reported next.2 publication and installed
acceptance complete and transferred ongoing AssembleJS implementation to this maintainer.
This session read the local acceptance receipts' source/version identifiers but did not
rerun publication or installed acceptance. Shared company routing remains with the manager.

## Owner requirements

- AssembleJS Academy is a full interactive tutorial and usable demo within this site.
- Latest owner correction: Academy is AI first so the learner's agent can teach as they go.
  This supersedes the earlier no-AI requirement. The owner selected both their existing agent
  and an in-site tutor, preferring hardcoded guidance to real AI inference. Recommendation:
  a clearly labelled guided tutor with authored explanations and hints, branching on actual
  lesson-check results; unknown failures are shown honestly rather than answered speculatively.
  The external agent receives lesson, code and check context. No provider, credentials,
  paid service or account requirement is chosen.
- Owner agreed to the scripted tutor plus existing-agent recommendation and requires a very
  easy connection path. Provide one clear Connect your agent action with the shortest verified
  setup supported by each agent, passing current lesson and check context. Do not claim
  one-click installation for clients whose actual setup does not support it. Built-in guided
  tutoring works immediately without agent setup.
- Further owner direction: show the final working application and its actual editable source
  together. Agent mode is a selling point: a request such as "Add a calculator" should run
  a prepared workflow, explain the choice of tools and update the real code and preview.
  Supported follow-up customizations may be phrased naturally; do not claim unrestricted
  language understanding from a scripted system. The owner clarified that this is
  AssembleJS's selling point, demonstrated in the provided Academy project. Learners do
  not need to upload their own code. Do not add repository import or code-upload flows.
- Owner explicitly requires a code view like coding-agent products: file tree, tabs and
  highlighted editable source alongside preview, with changed files and readable diffs for
  agent-mode actions. This exposes the actual project; it is not a decorative code sample.
- Owner requires three agent modes and a tutorial that takes the learner through each:
  Plan proposes without editing; Approval presents changes for approve/reject before they
  reach the project; Auto applies supported changes and runs checks. Teach a real rejection,
  a revised approval and automatic application, with observable file/preview results and
  checks. No mode is merely an unexplained selector.
- Latest clarification: Academy demonstrates a real optional visual workspace built on
  AssembleJS. The same project is editable through the coding-agent-style UI, CLI, manual
  changes or the learner's existing agent. Guided/demo actions use prepared workflows;
  actual files, operations, checks and the running application must remain real. Reconcile
  this with the existing Studio design rather than creating a parallel product engine.
- Real lesson checks and saved progress unlock a downloadable completion certificate.
- Research official Svelte, SvelteKit, React, Vue, Preact, Solid and Lit exercises
  in the agent's browser before design or implementation. Record actions and outcomes,
  including editor, preview, feedback, solve/reset, resume, keyboard and mobile behavior.
- Inspect existing examples, docs generation, conformance and demo flow before choosing
  infrastructure. Teach server composition across frameworks from real code.
- Inspect older landing history and the read-only reference before improving the current
  design. Preserve the owner's tagline, "Frameworks Assemble".
- Research runtime, hosting and licensing constraints before choosing infrastructure.
- Owner clarification: the linked Svelte tutorial is the standard for depth. Academy examples
  must expand substantially beyond simple snippets into connected, realistic application work.
- Keep learning simpler than the reference: short explanations, clear tasks and immediate
  feedback. Expand the depth without reproducing the reference course's wordiness or content.

## Research state

The clean branch is isolated from the release worktree. The first source reads covered
`examples/market/README.md`, `site-source/docs/tutorial.html`, the conformance harness,
`site/DEPLOY.md`, the deployment workflow and root package scripts. A separate reader
is checking those against current implementation and historical landing sources.

Browser research is in progress. Course visits alone do not count as completed exercises.
Coverage below is partial; visiting a course is not completing it.

### Svelte and SvelteKit: observed 30 October

- <https://svelte.dev/tutorial/svelte/welcome-to-svelte>: read the four-part progression
  (basic/advanced Svelte and basic/advanced SvelteKit) and introduction. No exercise check
  is available on the introduction; solve is disabled.
- <https://svelte.dev/tutorial/svelte/your-first-component>: replaced the starter through
  the editor with a script variable and uppercase interpolation. The iframe rendered
  `Hello SVELTE!`. No completion badge or test result appeared. Replaced the source with
  malformed markup; the terminal reported `Error compiling App.svelte`, `Unexpected token`,
  line 1 column 5. The preview retained its last working output. Solve restored working
  solution code and became Reset; Reset restored the original starter. Tab from the
  editor moved focus to the preview reload control rather than trapping the keyboard.
- <https://svelte.dev/tutorial/svelte/state>: manually added `$state(0)` and an increment
  handler. The preview button changed from `Clicked 0 times` to `Clicked 1 time` on click.
  Reloading the tutorial retained the lesson URL but discarded edited code and runtime
  count, restoring the unsolved starter. No account was used.
- At 390 by 844, State showed a bottom text/editor switch. Activating it displayed a
  full-width editor above the live preview and changed the URL to include the active file.
  A screenshot confirmed the layout. This is responsive viewport proof, not a physical
  touch-keyboard or screen-reader test. The viewport was reset afterwards.
- <https://svelte.dev/tutorial/kit/introducing-sveltekit>: read the project structure and
  file tree. This uses a running project, not the component-only compiler preview.
- <https://svelte.dev/tutorial/kit/pages>: used New file under routes, entered
  `about/+page.svelte`, wrote the page and navigation manually, then clicked About in the
  preview. The preview URL became `/about`, with heading `about` and the new page text.
  The terminal showed Vite 8.0.16, a WebContainer WASI binding download, startup and GET
  logs. A transient unavailable preview during startup recovered into the working app.
  Runtime startup, nested-file editing and preview navigation are therefore observed.

- <https://svelte.dev/tutorial/kit/page-data>: used Solve for the multi-file server-data
  exercise (not a manual completion). Blog links changed to server-loaded post titles;
  navigating to `/blog/safety` showed its title and body. Entering `/blog/nope` in the
  preview URL yielded a 404 heading and a terminal `404 GET` record. The menu exposes
  routing, loading, headers/cookies, shared modules, forms, API routes, app state and
  errors/redirects. This confirms practical application progression, not full course coverage.

### React: observed 30 October

<https://react.dev/learn/tutorial-tic-tac-toe> is a connected game tutorial with many
independent inline sandboxes, progressing from a square through a board, shared state,
winner detection and history. Its later exercises list improvements such as sorting
history and showing move coordinates. These are observations of course structure, not
a claim that every exercise has been completed.

Activated the starter sandbox and replaced its code with a stateful square. Clicking the
empty preview button rendered X. Reload retained the edited source; Clear restored the
original starter. No account or fork was required for inline editing. Tab and Escape then
Tab kept focus in this editor during the probe; a verified keyboard-exit shortcut remains
open. At 390 by 844, the document measured 375 pixels wide; a screenshot showed code above
preview, with horizontal scrolling inside the code editor. Native mobile editing and full
keyboard/screen-reader coverage are not established. The viewport was reset afterwards.

Returned to the complete game sandbox and read its actual Square/Board/Game source.
Played five moves to an X win; another empty-square click left the board/history unchanged.
Jumped to move 2 and made a different move: the board returned to the earlier position,
the new branch contained three moves, and the abandoned moves 4 and 5 disappeared.
Copied the complete editor document through its UI and changed the turn-label text; the
preview changed while retaining the current board/history. Escape then Tab again retained
editor focus. Clear restored the original turn label and empty board. This is a manual
customization and interaction probe of the completed example, not manual rebuilding of
the whole game from the starter.

### Vue: observed 30 October

<https://vuejs.org/tutorial/> exposes 15 steps: start, declarative rendering, attribute
bindings, event listeners, form bindings, conditional rendering, lists, computed values,
lifecycle/template refs, watchers, components, props, emits, slots and completion.
Composition/options and SFC/HTML preferences are explicit.

Manually solved step 2 with a reactive message; preview rendered `Learning Vue`. The editor's
input buffer initially inserted source instead of replacing the document; selecting all
then editing corrected it. A transient duplicate-script compiler error cleared after the
document update. Show me replaced the file with a working solution and became Reset.
The initial import-map error also cleared; it is recorded as a transient, not an accepted
failure. Step 7 was solved manually with add/remove functions: adding `Practice composition`
created a fourth item; clicking its X removed it. Reload kept step 7's URL but restored the
unsolved starter. Tab stayed in the editor during the probe. At 390 by 844, Output switched
the lower workspace to preview and became Code; screenshot confirmed the responsive layout.
No account used. Full 15-step completion and native mobile/screen-reader proof remain open.

Returned for connected state/component work. Manually implemented step 8's computed todo
filter: hiding completed items reduced three rows to one; checking the last row emptied
the filtered list. Manually imported/rendered step 11's child and saw its heading. In step
12, used Show me, then manually changed the parent's greeting; the child's heading updated.
In step 13, inspected the child's emit declaration and manually connected the parent listener;
the parent changed from its placeholder to the emitted message. In step 14, manually supplied
slot content using parent state; it replaced the child's fallback. Transient import-map
errors appeared during step changes and cleared as the compiler settled. This expands actual
data-flow evidence without claiming the untouched lifecycle/watcher exercises complete.

### Preact: observed 30 October

<https://preactjs.com/tutorial/01-vdom>: manually added emphasis and a purple style, then
used Run. A Congratulations message appeared. Replaced the solution with plain text,
removed both requirements and ran it; the iframe showed plain text but Congratulations
remained after a separate settled-state observation. Solve restored solution code.
Do not copy this completion behavior: Academy must tie checks to the current code version.

<https://preactjs.com/tutorial/02-events>: manually added a click handler that logged the
requested message, ran it and clicked the preview button; the exercise then congratulated
the learner. The first replacement preview was blank; adding an explicit createElement
import produced the working button. No root-cause claim about the compiler is made.
Reload restored the starter and removed completion. Tab stayed in the editor. At 390 by
844, a screenshot showed narrow side-by-side lesson/editor panes with separate scrolling,
rather than a stacked mobile workspace. No account used. Further chapters remain open.

Continued to `03-components`: read the component/children/lifecycle exercise, used Solve
and clicked the rendered button through its passed handler. In `04-state`, read both class
and hook variants and manually added hook state plus a functional increment. Run produced
an empty iframe, both with and without an additional createElement import. Reload and the
official Solve recovered a visible counter; two clicks changed 0 to 2. Reapplying the manual
edit through Run again yielded an empty preview. The cause was not established; this is
successful interaction with the official solution and a reproducible manual-run limitation,
not a completed manual state exercise. Later refs/effects/application chapters remain open.

### Solid: observed 30 October

<https://www.solidjs.com/tutorial/introduction_basics> exposes a lesson menu covering
introduction/signals/effects, control flow, lifecycle, bindings, props, stores, reactivity
and async resources/suspense. The interface provides a file/import-map editor, Result,
generated Output, compile modes and Solve/Reset.

At <https://www.solidjs.com/tutorial/introduction_signals>, manually added a signal and
interval update. The Output tab eventually displayed generated reactive JavaScript. Solve
loaded the official answer; Reset restored the unsolved starter. The Result iframe stayed
empty after switching tabs and refreshing, including with the official solution; its body
was read as empty. No counter execution/completion is claimed. Captured logs showed no error,
so cause remains unknown. The editor advertised Alt+F1 accessibility options; pressing it did
not expose an accessible dialog in this probe. At 390 by 844, the document measured 375 pixels
wide and the screenshot showed lesson text and navigation; native editing is unproven.

### Lit: observed 30 October

Worked through all eight Intro to Lit steps at <https://lit.dev/tutorials/intro-to-lit/>:

1. Introduction: Solve changed the preview from STARTING to COMPLETED; Reset was exercised.
2. Define a component: manually defined and registered the element; preview rendered its greeting.
3. Properties/expressions: manually added the reactive message; preview rendered `Hello again.`
4. Events: manually added the input handler; entering Learner produced `Hello, Learner`.
5. More expressions: added the disabled expression; input was disabled until Enable editing
   was checked, then enabled.
6. Template logic: manually rendered the todo array and implemented Add. A new item appeared
   in the preview and the input cleared.
7. Styles: added scoped completion styles and conditional classes. The first item had class
   completed; clicking it removed that class. A screenshot showed its initial strike-through.
8. Finishing touches: manually filtered completed items and added an empty-state partial.
   Hide completed reduced two items to one; completing the last item showed the empty message.

The last page displayed Tutorial complete even before its starter was solved. That is course
navigation text, not demonstrated completion validation. Both Solve and Reset are always
present; language toggles warn that switching discards edits. File tabs expose HTML and component
source. Full-document copy was needed to read code beyond the editor's virtualized visible lines.
Two ordinary clicks on the style item were blocked by header/iframe coordinate handling; after
visual inspection, forced semantic clicks verified the state changes. This is automation proof,
not physical interaction proof. At 390 by 844, document width was 375 and the lesson was stacked
vertically; native mobile editing is unproven. Tab focus reached the editor's shadow host, so no
keyboard-exit claim is made. Reload kept step 8 but restored its unsolved starter, both list
items and unchecked Hide completed control; edits and runtime completion did not resume.

The sequential Svelte source/Solve walkthrough now reaches the core course end, with selected
manual interaction probes; it is not independent manual completion of every exercise.
Detailed evidence and untested interactions are in `academy-svelte-walkthrough.md`.
`academy-sveltekit-walkthrough.md` continues through routing, data, forms and api handlers,
including observed errors and recovery. Later Kit chapters and deeper React/Vue/Preact/Solid
application exercises remain open. Lit's introductory sequence is covered; its separate
advanced courses are not.

`academy-workspace-source-inventory.md` records the actual reuse boundary: existing inspector
routes are deliberately read-only. Shared assembly planning, checks and dev rebuild/reload
exist; editable source, reviewed application and concurrent-edit protection do not. Failure
diagnostics are not redacted, so public Academy reuse cannot copy the loopback response.

## Continuation

Finish and record tutorial observations; inspect hosting/runtime licences; complete the
source and historical-design inventory. Only then choose Academy architecture, lesson
ladder and landing changes. Independent review and hosted proof are required before
reporting implementation complete. Stable publication remains held.

## Research checkpoint verification

Source/document review by a separate agent found three stale market teaching claims;
the README and public About assembly now match the current api/service and MCP sources.
The follow-up review found no remaining source/document mismatch. It did not independently
execute tutorials or establish runtime compatibility.

Cheap gates run in this session: identity self-test rejected eight known-bad matches and
the tree passed; headers passed across fourteen source trees; emoji self-test rejected four
bad lines and the tracked tree passed; working and staged diff checks passed. The first
emoji tree run was blocked by sandbox Git subprocess access, then passed on the read-only
retry with that access. New records were staged before the later tree checks.

Hook setup unexpectedly populated worktree dependencies from the existing pnpm cache before
running Husky. It completed in 1.8 seconds, without changes to the lockfile or package metadata.
No build, broad tests, product browser proof, publication or deployment ran here. Full product
verification remains hosted and pending actual implementation.

The next source-only checkpoint adds the sequential walkthroughs and workspace inventory.
An independent GPT-6.1 Sol reader reviewed all four records and the TODO diff with no
remaining findings. Its complete-source review verified the inventory and corrected the
failure-log disclosure wording; it did not reproduce browser actions. Identity and emoji
self-tests again rejected known-bad fixtures; both trees passed, headers passed across
fourteen packages, all five records passed formatting, and the staged diff check passed.
Accepted execution issue: <https://github.com/ayers-software-repair/assemblejs/issues/16>.
