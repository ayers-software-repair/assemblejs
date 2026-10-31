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
