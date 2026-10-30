# Open runtime package/build probe

This is a pending hosted compatibility experiment under accepted issue 16. It extends the
merged MIT runtime mechanics probe without selecting a production runtime, adding paid
hosting, contacting a vendor or creating an account. Basic file/process success does not
establish package/build compatibility. Academy's curriculum and interface work continue.

The exact runtime is `@vivari/core@1.0.0`; its source/archive and cleanup limits are recorded
in `academy-open-runtime-probe.md`. Its
[pinned npm generator](https://raw.githubusercontent.com/maitrungduc1410/vivari/2629c71097238400c45aefa213ef61df4794c2b7/scripts/vendor-npm.mjs)
and [loader](https://raw.githubusercontent.com/maitrungduc1410/vivari/2629c71097238400c45aefa213ef61df4794c2b7/packages/kernel-host/load-real-npm.js)
define gzip around a four-byte little-endian header length, JSON file index and concatenated
file bytes. The fixture prepares actual npm 10.9.2 in that format, records its archive hash
and serves it as `/vendor/npm-pack.bin` without HTTP gzip decoding. A separate unit test
independently decodes binary offsets and rejects wrong versions and symbolic links.
Synthetic format fixtures are never delivered to the runtime as npm.

The hosted browser uses a fresh isolated origin and disables service-worker registration.
It must execute the real npm version command, report Node 22 or newer, scaffold through
the published next.2 CLI and install exact next.2 renderers with the already-proven framework
peers. Guest lifecycle scripts stay enabled. It then adds six framework and five template
assemblies, places them with the starter assembly, watches the real checker reject a missing
assembly, repairs it and invokes the project's build/typecheck command. Require twelve
built assemblies, a nonempty server bundle, exact command exits and no browser errors.
No preview server starts and no hydration or remote-composition acceptance is implied.

The runtime aliases native esbuild/Rollup/lightningcss to Wasm packages and has a
[node-gyp skip stub](https://raw.githubusercontent.com/maitrungduc1410/vivari/2629c71097238400c45aefa213ef61df4794c2b7/packages/kernel-host/node-gyp-stub.js).
Record effective package names/versions, bounded command output and the reported runtime
version; an install exit 0 is not native-build proof. Full bundled third-party notices,
preview routing, persistence, complete pending-operation cleanup, atomic approval and
live external-agent access remain separate gates.

All SDK waits have external deadlines. Commands have 90 seconds, the build test five minutes,
and the single-worker/no-retry job ten minutes. Await finite commands before teardown;
retain final state, browser/network errors and failure traces even when the experiment fails.
Only hosted CI runs the browser/server proof; local checks cover source and the small format/
deadline tests. No runtime assets are deployed to the shared product/company origin.

The first workflow revision at `fd8a841` was rejected before any job started (run
`41120240434`): it placed `runner.temp` in job-level environment expressions. GitHub's
[context availability table](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#context-availability)
allows the runner context in step environment expressions, not job environment expressions.
Use the shell's `RUNNER_TEMP` during preparation and step environment for the browser command.
This is harness validation failure, not evidence about runtime/package compatibility.
