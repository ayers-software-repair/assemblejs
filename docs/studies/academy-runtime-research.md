# Academy runtime research

Read 30 October 2026. These are constraints and candidate tools, not an architecture decision.
No infrastructure was provisioned, licence accepted or model service connected. Context7 and
language-server tools were unavailable; external facts were read from primary documentation.

## Existing site and executable source

- `site/DEPLOY.md` and `.github/workflows/deploy-site.yml`: static site deployment from
  generated source pages. Current hosting supplies no Node execution backend.
- `examples/market/README.md`, `examples/market/shop/src/pages/product/product.page.ts`
  and `browser/market.browser.ts`: four real server projects; a product page composes twelve
  assemblies from three servers. Required products, optional reviews, caching, deferred
  content and streams already exist. Reuse application code and browser proof patterns.
- `conformance/harness/run.mjs`: projects are installed from packed tarballs, built and
  served as real production Node processes; assertions cross HTTP boundaries.
- `examples/realtime/assemblejs.config.ts` and `browser/bus-and-relay.browser.ts` cover
  remote event admission, header forwarding and api relay. The market README's claim that
  a remote assembly cannot call its api is stale; teach from implementation and tests.
- `packages/mcp/src/server/register-seeing-tools.ts` accepts params and query values.
  The market README's statement that the agent surface has no route parameters is stale.
- `packages/core/src/api/api-context.ts` supplies headers and cookies to apis;
  `packages/core/src/service/service-context.ts` intentionally excludes them from services.
  The market README's claim that neither receives them was also stale. All three statements
  are corrected in the README and related About-page teaching text on this research branch
  before Academy reuses the example.
- `docs/DECISIONS.md`, 18 October, "a site page is written from its source": authored
  pages belong in `site-source`, then the pinned platform generator writes `site`.
- `scripts/site-page-text.mjs` supports a restricted readable markup set. Academy content
  must participate deliberately in generated text exports, navigation and both URL prefixes.

## Candidate runtime

[TutorialKit](https://tutorialkit.dev/guides/about/) already provides editor, live preview,
terminal and answer controls. Its [static deployment](https://tutorialkit.dev/guides/deployment/)
may fit the site's artifact flow. Its [MIT licence](https://github.com/stackblitz/tutorialkit/blob/main/LICENSE)
requires retained notices. It uses WebContainers; it does not remove their constraints or prove
Academy's completion, progress, tutoring and certificate behavior.

[WebContainer commercial terms](https://webcontainers.io/enterprise) require a licence for
production commercial/for-profit use; prototypes are exempt. The introduction advertises free
open-source usage, but company-hosted Academy eligibility and terms are unconfirmed. No price
is inferred and no inquiry was submitted.

[Required headers](https://webcontainers.io/guides/configuring-headers) are COOP `same-origin`
and COEP `require-corp`, or the documented `credentialless` mode. These need scoped response
configuration with the shared routing owner if this runtime is selected.

[Browser support](https://webcontainers.io/guides/browser-support) is strongest in Chromium.
Safari is beta; the page calls Firefox beta in its introduction and alpha in its detail.
Do not promise equal browser support. Storage/cookie restrictions can prevent startup.

The [API](https://webcontainers.io/api) permits one concurrent WebContainer instance;
it can spawn several processes and expose multiple ports. Multiple composition servers in one
instance are plausible, not yet proven. Filesystem state is ephemeral; saved progress and edits
need explicit persistence. [Binary snapshots and filesystem mounting](https://webcontainers.io/guides/working-with-the-file-system)
and [bundled dependency guidance](https://webcontainers.io/guides/troubleshooting) may reduce
repeat boot work, but do not establish first-load offline support.

The repo pins Node 22 or newer, pnpm 11.4.0 and esbuild 0.28.2. Upstream
[issue 2150](https://github.com/stackblitz/webcontainer-core/issues/2150) reports pnpm 11
problems with incomplete node:sqlite support. This is an upstream report, not a reproduced
AssembleJS failure. Starter projects also support npm. Verify the exact installed framework,
all renderers, builds, multi-server composition, events, relay, streaming and termination
before selecting a runtime; do not silently replace Node or esbuild behavior.

## Editor and alternatives

[CodeMirror](https://codemirror.net/) documents mobile and accessibility support, under
[MIT](https://github.com/codemirror/view/blob/main/LICENSE). Its
[Tab behavior](https://codemirror.net/examples/tab/) explicitly addresses keyboard traps.
[Monaco](https://github.com/microsoft/monaco-editor/blob/main/README.md) says mobile browsers
are unsupported; a responsive screenshot alone cannot establish usable mobile code editing.

BrowserPod is another candidate, with commercial licensing and native-binary substitutions;
its [licensing](https://browserpod.io/docs/more/licensing),
[pricing](https://browserpod.io/pricing/) and
[native dependencies guide](https://browserpod.io/docs/guides/working-around-native-npm-dependencies)
need a compatibility and authority decision, not an assumed free fallback. Sandpack's
[source licence](https://github.com/codesandbox/sandpack) is permissive, but Nodebox
compatibility was not established in this research.

A hosted Node runner would require new execution infrastructure. Node's
[vm documentation](https://nodejs.org/api/vm.html) explicitly excludes it as a security boundary.
[Container security](https://docs.docker.com/engine/security/) and
[resource limits](https://docs.docker.com/engine/containers/resource_constraints/) require
deliberate isolation, expiry, bounded resources and verified cleanup for visitor code.
Current static hosting does not provide these and no new service/spend authority is inferred.

## Connecting the learner's agent

Existing `packages/check/src/agents/mcp-registrations.ts` generates five project registration
files. `packages/cli/src/commands/project-files.ts` includes these and agent instructions.
`packages/check/src/agents/agent-instructions.ts` documents the check/render/compose loop.
`packages/mcp/src/bin.ts` serves local stdio and a local project root, not a browser transport.

The [StackBlitz FAQ](https://developer.stackblitz.com/guides/user-guide/general-faqs) says
WebContainer servers cannot be reached outside the browser. A local agent cannot see browser
edits through the current stdio server. A downloaded lesson project is a snapshot, not live
synchronization. A live bridge would be new scoped infrastructure.

The current public API package was also checked at 1.6.4. Its `./connect` export provides
`setupConnect`, which reconnects a separate browser preview tab through an opener and
MessagePorts; it does not supply an existing local-agent/MCP/filesystem bridge. The
[contributor explanation](https://github.com/stackblitz/webcontainer-core/issues/1725)
requires the `/webcontainer/connect/*` helper route to be non-isolated, separately from
the main runtime page's COOP/COEP requirements. The
[versioned package](https://registry.npmjs.org/@webcontainer/api/-/api-1.6.4.tgz) was inspected
at source. This leaves a deliberately implemented agent transport possible, but unproven.
The [current AI documentation](https://webcontainers.io/ai) describes embedded agents; it
does not establish that external-agent connection or replace the scripted-tutor scope.

Current official setup references:

- [Claude Code](https://code.claude.com/docs/en/mcp): project `.mcp.json`, reviewed/approved
  by the learner; `/mcp` and a real tool call establish more than a copied setup command.
- [Cursor](https://cursor.com/docs/mcp): existing `.cursor/mcp.json` and reviewed server setup.
- [VS Code](https://code.visualstudio.com/docs/agent-customization/mcp-servers): existing
  `.vscode/mcp.json`, compatible agent, trust/start and actual tool invocation.
- [Official OpenAI documentation for Codex](https://developers.openai.com/codex/mcp):
  command/args/cwd and project-scoped configuration; absolute project paths avoid an agent
  starting a relative command from the wrong directory. No Codex registration change made.
- [Gemini CLI](https://geminicli.com/docs/tools/mcp-server/): existing project settings,
  trust/approval and `/mcp` or list output followed by a tool call.
- [OpenCode](https://opencode.ai/docs/mcp-servers/): existing local configuration; verify
  supported client versions before changing schema. No migration is selected.

[Cursor install links](https://prod.cursor.com/docs/mcp/install-links) and
[VS Code install links](https://code.visualstudio.com/api/extension-guides/ai/mcp) can reduce
setup steps. They still require installed applications, valid paths and user review, and
do not synchronize a browser lesson. No universal install link for every client was established.

Use precise states: project downloaded, setup copied, server configured, then connected only
after an observed handshake/tool result. The built-in scripted tutor works without this setup.

## Historical landing evidence

The read-only design reference is at commit `5f7fdf4d1a7e95c7b0a69bfb269e378e4873ec58`;
its last website change is `b23914a566ff54840ec28668b3a2ad6f0e97346e`.
`Hero.js`, `index.css` and `App.css` show navy, orange/blue/green accents, gold emphasis,
a split hero, large code window and install command. Treat these as visual references only.
Do not port its hidden skip link or interaction that hides all content. Current repo history
also has composition diagrams at `5830efc` and a framework/code arrangement at `14ee8c0`.
The owner's current tagline is "Frameworks Assemble". No landing design has been changed.
