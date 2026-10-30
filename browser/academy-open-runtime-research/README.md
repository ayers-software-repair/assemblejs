# Hosted open-runtime mechanics research

This evaluates exact `@vivari/core@1.0.0` basic mechanics, not AssembleJS compatibility or a
selected production runtime. It uses no account, metered service, model inference or new hosting.
Do not run its browser/server proof on the desktop seat; use the separate hosted workflow.

The temporary isolated origin serves the unchanged published SDK/hashed workers and the
pinned upstream MIT notice. Wasm is embedded in those workers. Boot disables the preview
service worker; the kernel still attempts its npm delivery fetch. The missing
`/vendor/npm-pack.bin` is expected and explicitly checked, without supplying a fake package
manager or claiming an installation. Fresh hosted browser storage avoids a restored npm tree.

The probe mounts one file, reads it through the host API, runs a dependency-free Node command
that copies it, reads the result back and requires actual finite process exits 0 and 7.
All boot/filesystem/spawn/output/exit waits are bounded externally. It awaits both finite
processes before calling teardown, then closes the page and fixture. One worker, no retries,
90-second test and six-minute job; JSON and failure trace are retained.

Published 1.0.0 differs from current online docs: mount is sequential and teardown does not
settle pending filesystem/process promises or remove every window listener. This test does
not claim atomic application, pending-operation cleanup, persistent restore, npm, framework
builds, previews, mobile editing or external-agent access. The full bundled third-party
notice audit remains open. No runtime assets are deployed to the product/company origin.

Source/version/asset constraints are recorded in `docs/studies/academy-open-runtime-probe.md`.
