# Current-source workspace preview integration

This bounded scenario answers whether the accepted async tooling change can support an actual
browser workspace preview. It does not retry immutable published next.2 or adopt a runtime.
Use only the hosted workflow; no product build/server/browser proof runs on the desktop seat.

Preparation reuses the conformance packer and the CLI's canonical projectFiles operation.
It builds and packs twelve current-source packages from a clean checked-out commit, records
commit/tree and archive hashes, every published JavaScript module (split chunks included) and
packed metadata bytes, and delivers those tarballs to the guest. Download and filesystem
readback hashes must agree. Installed metadata and all modules must still match; nested
framework copies are refused so a root match cannot conceal a different dependency.
The numeric package version can match the older registry release; byte identity is the gate.
The guest does not bootstrap an AssembleJS CLI from npm exec. External peers remain the pinned
versions from the accepted installation scenario. The failed worker-thread environment flag
is not applied. Native substitutions and bundled third-party notice gaps remain explicit;
no native or production-runtime compatibility claim follows from a package install.

Only the fresh temporary CI origin registers the exact SDK's service worker. The provided
project retains its default CSP and allows only the four extracted static SDK preview scripts
by SHA-256. Dynamic, duplicate or missing shims fail; no SDK code is evaluated to hash them.
No product/company-origin runtime assets, server policy or routing change is made here.

Acceptance requires actual TypeScript error/recovery, static config syntax rejection/recovery,
missing-assembly check/recovery, all
current-source package identities, build/typecheck, a 200 framed document and its CSP, six
framework mounts, five template outputs, and React input changing the actual preview.
Stop must yield exit 143 through the SDK's worker termination before teardown; this is not a
graceful-signal claim. Cleanup unregisters the service worker, closes the page and fixture,
and records failures. Page/console errors and failed network responses remain strict, with
no retries. Retained artifacts include state, screenshots/trace and the actual package assets.

Small Node boundary tests use synthetic bytes only to test refusal, hashing and confinement.
Those files are never delivered by the hosted framework packer and cannot establish runtime
compatibility. Existing lifecycle/shim evidence is reused locally; the hosted path exercises
its required boundary checks and actual integration. No local broad suite is added.

This single-server scenario is not the full supplied Market workspace, lesson progression,
external-agent transport, persistence or certificate. Multi-server and production isolation,
remaining distribution notices and a final runtime decision remain separate requirements.

## Hosted outcome: current-source preview is not accepted

At reviewed head `f027523a214f891d631a129dcbf8ada1fa9abaa7`, workflow run
`41160120114`, job `124415613038` packed the pull-request merge checkout
`ef152600a8bda2bf7b7be7531662ba5d88bf07f4` (tree
`60e1925ee9e80fa3b4f4af422a6dbfd376123521`). The probe compared those exact
identities to its host checkout. All twelve installed framework packages matched their
packed metadata and JavaScript hashes. The hosted boundary suite passed 21 cases.

Actual TypeScript failure/recovery, configuration syntax rejection, missing placement
rejection/recovery and build/typecheck passed. The real server started and its framed
document answered 200. Sequential assertions passed Preact, React and Vue before Svelte
returned an empty fallback with `data-failed="1e06bd2b"`. Its server diagnostic was
`Cannot read properties of null (reading 'p')` at Svelte 5.57.0
`src/internal/server/context.js:73`, through `Renderer.component` at renderer.js:327.
Remaining framework/template assertions, changed input and Stop acceptance were not reached.
Browser errors and failed network requests were empty. Service-worker cleanup went from
one registration to zero. These results do not establish complete preview acceptance.

Artifact `13027075449` retains state, screenshot, trace and actual package assets; archive
SHA-256 is `29b0e3b671c094fd1341e2d71bf3d117bd9fff1e9ce05c52fc0099ad039c5ec2`.
The unchanged normal-runtime regression passed separately in run `41160120017`.

Independent source inspection found a concrete causal mechanism in the exact SDK 1.1.4:
`transpileEsm` snapshots used named imports into constants. Svelte's renderer imports the
mutable `ssr_context`, initially null. Its component pushes context, but its child restores
the imported parent value; a snapshot retains null and the following pop dereferences it.
The SDK's live-binding fallback runs only for an initialization ReferenceError, whereas
this is a later rendering TypeError. The guest's generated wrapper was not captured, so
this remains a strong source-supported inference rather than an isolated runtime proof.
The complete public boot options and README expose no live-binding toggle.

Keep this experiment draft. Do not rerun unchanged, relax assertions, replace the framework
compiler or patch vendor internals to conceal the failure. No runtime is selected here.
Independent interface/curriculum work continues without claiming a working browser Academy.
