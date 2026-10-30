# Hosted open-runtime mechanics research

This evaluates exact `@vivari/core@1.0.0` mechanics and published framework installation/build,
not a selected production runtime. It uses no account, metered service, model inference or new hosting.
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
90-second mechanics test; JSON and failure trace are retained.

The separate framework test receives real npm 10.9.2, packed from its installed archive using
the pinned runtime's binary format. A small Node test independently decodes file offsets and
rejects wrong versions and symlinks; it also checks operation deadlines. The synthetic test
files are never served as npm. The hosted preparation uses `--ignore-scripts` only to package
npm itself; the guest framework install keeps lifecycle scripts enabled.

That test invokes published `@asmjs/cli@1.0.0-next.2`, installs exact framework/renderer peers,
adds six framework and five template assemblies, requires a real missing-assembly check
failure and repair, then builds/typechecks all twelve assemblies including the starter.
It records the runtime's reported Node version and effective core/CLI/esbuild/TypeScript
package names/versions. Native-tool aliases and the runtime's node-gyp skip stub mean that
install success alone cannot prove native compatibility. No preview server starts.
The build scenario has a five-minute test limit and bounded commands; the job has ten minutes.

Published 1.0.0 differs from current online docs: mount is sequential and teardown does not
settle pending filesystem/process promises or remove every window listener. This test does
not claim atomic application, pending-operation cleanup, persistent restore, previews,
mobile editing or external-agent access. Installation/build remain pending until hosted
evidence passes; the basic mechanics result cannot satisfy that gate. The full bundled third-party
notice audit remains open. No runtime assets are deployed to the product/company origin.

Source/version/asset constraints are recorded in `docs/studies/academy-open-runtime-probe.md`.
The installation scenario is `docs/studies/academy-open-package-probe.md`.
