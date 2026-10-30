# Academy runtime research

Read 30 October 2026. These are constraints and candidate tools, not an architecture decision.
No infrastructure was provisioned, production runtime adopted or model service connected.
Context7 and language-server tools were unavailable; external facts were read from primary documentation.

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
production commercial/for-profit use; prototypes are exempt. The
[contact page](https://webcontainers.io/contact) explicitly offers a free open-source API
inquiry route, not an automatic eligibility grant. Company-hosted Academy eligibility and
price remain unconfirmed. No inquiry, account or purchase was submitted.

[Required headers](https://webcontainers.io/guides/configuring-headers) are COOP `same-origin`
and COEP `require-corp`, or the documented `credentialless` mode. These need scoped response
configuration with the shared routing owner if this runtime is selected.

[Browser support](https://webcontainers.io/guides/browser-support) is strongest in Chromium.
Safari is beta; the page calls Firefox beta in its introduction and alpha in its detail.
Do not promise equal browser support. Storage/cookie restrictions can prevent startup.

The [API](https://webcontainers.io/api) permits one concurrent WebContainer instance;
it can spawn several processes and expose multiple ports. The controlled next.2 probe now
proves required remote React composition/hydration across two processes using the same build,
alongside six framework mounts, five templates, real check failure/recovery and both process
exits (PR19, research run `41095157424`, artifact `12994939244`). Full Market, independently
built projects, relay and streams remain unproven in this runtime. Filesystem state is ephemeral;
saved progress and edits need explicit persistence.
[Binary snapshots and filesystem mounting](https://webcontainers.io/guides/working-with-the-file-system)
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

## Production browser-runtime comparison

Read 30 October 2026 after the bounded probe. Academy remains browser-based. These options
do not authorize vendor contact, accounts, subscriptions or infrastructure changes.

| Option                                     | Verified price or unknown                                                                                                                                                           | Hosting reuse and material limits                                                                                                                                                                                                           |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WebContainer API                           | No verified public production API quote; free OSS inquiry route exists, eligibility unconfirmed.                                                                                    | Existing static delivery can serve the UI; scoped isolation headers are needed. It is the tested candidate, with the bounded limits above.                                                                                                  |
| BrowserPod Pro                             | $20/month includes 20,000 runtime-metering tokens; top-ups cost $10 per 10,000 tokens. OSS grants require application.                                                              | Reuses static delivery and browser compute, but requires a publisher account/key and origin setup. Native esbuild substitution and exact AssembleJS compatibility remain untested.                                                          |
| Separate Node runner behind the browser UI | Example 2 GiB ARM compute plus one public IPv4: $15.91/month at 730 hours; 4 GiB: $28.18, excluding disk, traffic, logs, isolation/control services, taxes and burst-credit policy. | Static delivery and deployment conventions are reusable. Existing app hosting is not an approved per-learner execution boundary or measured spare capacity. Separate isolation, admission, preview origins, expiry and cleanup need review. |

[StackBlitz Terms 1.5(c)](https://stackblitz.com/terms-of-service) requires a plan or written
licence covering production/commercial API use and incorporates documented limits. Section
2.3 restricts competing products/services; describe the optional workspace's actual scope
when clarifying eligibility rather than assuming coverage. Separate written agreements govern
conflicts. The [AUP](https://stackblitz.com/acceptable-use-policy) repeats the usage boundary.
The [ordinary pricing FAQ](https://stackblitz.com/pricing) is not a verified API quote.
These are recorded terms, not a conclusion about Academy's classification.

BrowserPod's [pricing](https://browserpod.io/pricing/) and [FAQ](https://browserpod.io/faq/)
exclude commercial work from Free and list the Pro allowance. Its
[pricing policy](https://browserpod.io/pricing-policy/) spends ten tokens at boot and ten
more at each hourly extension: short separate boots consume full units. For example,
10,000 boots each lasting under one hour consume 100,000 tokens, costing $20 base plus $80
above the included allowance at published top-up rates, before tax or any grant. The policy
states a 1,000,000-token monthly Pro fair-use ceiling and reserves termination after ten
continuous hours. These tokens meter runtime licensing, not model inference; no hard
spending cap is assumed. Preserve one runtime through lessons rather than rebooting each one.

The Node examples use public [US East Linux price data](<https://b0.p.awsstatic.com/pricing/2.0/meteredUnitMaps/ec2/USD/current/ec2-ondemand-without-sec-sel/US%20East%20(N.%20Virginia)/Linux/index.json>):
t4g.small $0.0168/hour and t4g.medium $0.0336/hour, plus one IPv4 at
[$0.005/hour](https://aws.amazon.com/vpc/pricing/). These are illustrative components, not a
complete service quote or session-capacity measurement. No existing app credentials, private
state or unrelated host is available to visitor code under this comparison. Ordinary Lambda's
[900-second ceiling](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html)
and [environment reuse](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html)
do not provide an existing persistent, isolated learner workspace.

The owner subsequently excluded additional paid hosting and required paid runtime licensing.
The prices above are comparison evidence, not selected options. No vendor inquiry is
authorized; an OSS inquiry/grant route is not a confirmed free entitlement. Academy remains
browser-based. Continue independent lesson/interface work and the free-route checks below.
Every option still needs persistence, current-revision checks and verified external-agent access.

## Free browser-delivery routes

The [StackBlitz editor SDK](https://developer.stackblitz.com/platform/api/javascript-sdk)
is different from directly embedding the WebContainer API. Its documented `embedProject`
can create a supplied `node` project without a pre-created project ID; public GitHub
projects can also be embedded. The [pricing FAQ](https://stackblitz.com/pricing) permits
viewing/editing public projects without a GitHub account and lists unlimited public projects
on Personal. [Terms 1.5(b)](https://stackblitz.com/terms-of-service) expressly permits SDK/editor
embedding within the applicable plan/documentation limits, separately from 1.5(c)'s direct
WebContainer API licence. The general restrictions still apply; this is not clearance of
Academy's eventual workspace scope or a claim that paid embedding is always required.

The [VM interface](https://developer.stackblitz.com/platform/api/javascript-sdk-vm) exposes
file snapshots, full-content file diffs and editor/preview controls for Node projects.
Its documented API has no process-spawn, command-exit or atomic compare-and-apply method.
Those missing controls matter for real CLI/check evidence and preserving concurrent edits;
a snapshot followed by `applyFsDiff` is not a demonstrated approval transaction. Generated
projects are ephemeral unless forked to an account; Academy's own saved-state requirements
remain. Exact AssembleJS execution, multi-server previews, current-revision checks, approval
safety and live-agent access have not been tested through this SDK. It is a concrete free
public-project candidate to evaluate, not an accepted replacement for the earlier API probe.

[Vivari](https://vivari.run/docs/) is a self-hostable browser runtime with a first-party
[MIT licence](https://github.com/maitrungduc1410/vivari/blob/master/LICENSE), rather than a
metered hosted runtime requirement. Its [embedding guide](https://vivari.run/docs/embedding/)
documents same-origin SDK/worker assets, a preview service worker and separately hosted
package-manager deliveries. No vendor account or paid runtime API is specified by this route.
The published `@vivari/core@1.0.0` archive was inspected without running it: registry metadata
says MIT and no runtime dependencies; the archive omits a licence file, so redistribution
must deliberately retain the upstream notice and audit bundled third-party notices.

That archive's fetcher aliases native esbuild to esbuild-wasm, Rollup to its Wasm package
and lightningcss to its Wasm package; its process worker patches esbuild's service path.
This is a toolchain difference, not the exact previously proven WebContainer scenario.
Its [deployment guide](https://vivari.run/docs/deployment/) requires isolation headers and a
root-scoped preview service worker. Default previews share the editor origin and its storage;
separate-origin preview modes need extra static-origin configuration. Do not register that
worker at the shared company's origin or assume arbitrary preview code is isolated there.
Published API docs describe spawn/exit, filesystem and teardown, but no AssembleJS proof has
run. The inspected archive SHA-256 is
`f3ccad6b04976bd1926c019acc92e2068d3dd2f4ce8f38300ab25c3978213bd5`.

[Rifty's source](https://github.com/vanilla-wave/rifty) also publishes first-party code under
MIT and documents self-hosted browser execution. Its own compatibility boundary is a Node
API subset, changing 0.x APIs, explicit worker/service-worker bundling and package
substitutions; its transitive licence audit is separately tracked upstream. It has not been
tested with AssembleJS. [Nodebox's actual licence](https://github.com/Sandpack/nodebox-runtime/blob/main/LICENSE)
limits external distribution/use to specified non-commercial cases; Sandpack's separate
permissive licence does not establish blanket Nodebox coverage for this Academy.

These source checks establish fee-free candidates and concrete gaps, not production
compatibility or adoption. Next, use a bounded hosted probe of the real published framework
before choosing one; keep paid services, new accounts and vendor submissions out of that work.

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
The restored "Frameworks Assemble" landing landed in PR20 as `d1f0d5b`, after all six normal
CI jobs, strict hosted five-width/keyboard/repeated-navigation proof and independent visual
QA passed at `46ebb89`. The shared frame pin is unchanged. Optional native cross-document
transitions are disabled in the product stylesheet after the recorded navigation failures;
the error assertions remain strict. Post-merge CI `41106297217`, landing proof `41106297250`
and the existing next-site deployment `41106297243` passed at `d1f0d5b`. Live HTTP reads of
all 18 declared pages, the product stylesheet and both model-readable text exports match
the merged source byte-for-byte after the workflow's canonical metadata and error-page
prefix transforms. This accepts the candidate landing, not Academy availability or a stable
promotion.
