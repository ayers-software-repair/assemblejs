# Open browser-runtime probe

Source inspection on 30 October 2026, before runtime execution. This is a bounded candidate
evaluation under accepted issue 16, with no added paid hosting, required paid runtime licence,
vendor contact, accounts or adoption. Academy remains browser-based; independent curriculum
work continues. The public editor-SDK candidate's failed result is preserved separately in
`academy-runtime-research.md` and draft PR22.

## Exact published source

`@vivari/core@1.0.0`, first-party MIT, is pinned as a development-only dependency. Its npm
metadata names source commit `2629c71097238400c45aefa213ef61df4794c2b7`; the 24-file archive
has SHA-256 `f3ccad6b04976bd1926c019acc92e2068d3dd2f4ce8f38300ab25c3978213bd5`.
The published declarations and JavaScript, not newer online API guarantees, govern this probe.

The archive includes its four hashed workers, referenced by root `/assets/...` URLs, and
embeds Wasm as data URLs. It contains no LICENSE/NOTICE; the fixture carries the exact
[pinned upstream MIT notice](https://raw.githubusercontent.com/maitrungduc1410/vivari/2629c71097238400c45aefa213ef61df4794c2b7/LICENSE).
Its empty dependency field does not establish the licences of bundled Node/runtime/Wasm
code. Complete third-party notice review remains required before redistribution in a product.

The published API supports `Vivari.boot({serviceWorkerUrl:false})`, mount, filesystem calls,
spawn, output/exit and teardown. Source inspection found limits that current online docs
have since strengthened:

- Mount writes directories/files sequentially, without an atomic transaction.
- Teardown terminates the kernel and clears pending maps without settling outstanding
  filesystem/process-exit promises; anonymous window listeners are not all removed.
- Several operations have no built-in deadline. The harness must bound waits externally
  and close the browser even when boot never returns a runtime handle.

These follow the pinned [mount](https://raw.githubusercontent.com/maitrungduc1410/vivari/2629c71097238400c45aefa213ef61df4794c2b7/packages/core/src/mount.ts),
[bridge](https://raw.githubusercontent.com/maitrungduc1410/vivari/2629c71097238400c45aefa213ef61df4794c2b7/packages/core/src/bridge.ts)
and [process](https://raw.githubusercontent.com/maitrungduc1410/vivari/2629c71097238400c45aefa213ef61df4794c2b7/packages/core/src/process.ts) sources,
independently read by a separate verification agent.

## Installation is a separate gate

The missing npm delivery is not an ordinary tarball. The pinned
[generator](https://raw.githubusercontent.com/maitrungduc1410/vivari/2629c71097238400c45aefa213ef61df4794c2b7/scripts/vendor-npm.mjs)
packs npm 10.9.2 as gzip around a little-endian header length, JSON file index and file bytes.
The [loader](https://raw.githubusercontent.com/maitrungduc1410/vivari/2629c71097238400c45aefa213ef61df4794c2b7/packages/kernel-host/load-real-npm.js)
eagerly fetches `/vendor/npm-pack.bin` even without an install; its absence is nonfatal and
leaves npm unavailable. Yarn/pnpm/corepack/tsgo deliveries are also absent and loaded lazily.
This basic probe deliberately installs nothing and records that expected missing resource.

The runtime maps native esbuild/Rollup/lightningcss to Wasm alternatives. Its pinned
[node-gyp stub](https://raw.githubusercontent.com/maitrungduc1410/vivari/2629c71097238400c45aefa213ef61df4794c2b7/packages/kernel-host/node-gyp-stub.js)
prints a skip warning and exits 0, including a synthetic version reply. A later install exit 0
would not prove a native addon built or that the original toolchain was unchanged. Any
framework evaluation must record effective installed packages and test actual behavior.

## Scoped proof

The separate hosted workflow serves the exact package on its own temporary origin, with
isolation headers, GET/path guards and no registered service worker. It checks shared-file
round-trip through a finite dependency-free Node command and actual exits 0/7, awaits those
processes, calls teardown and closes the browser/fixture. Known-bad HTTP method/path requests
must be refused. All waits/test/job are bounded; no retries. Retain actual outputs and errors.

A pass proves only those mechanics. It does not resolve framework installation/build,
preview routing, persistence, complete cleanup, atomic approval or external-agent access.

## Bounded result

PR23 merged as `ea60a16b972aca91e783c4ffcabf87af183ee6a2`, with the reviewed/tested tree
equal to `d7047aef81b65d95f7c4098e581e35d450c29320`. Hosted run `41115669173` passed one
mechanics test in 2.3 seconds; all six normal CI jobs (`41115668933`) and the landing proof
also passed. Personal review and a separate reader independently checked full source and
artifact `13004938531`, SHA-256
`a083480dd4117b9f11ec9ea6888f20abfaa02b5dd4af292af7a858fb8767c832`.

The actual records show the copied file content, expected process output and exits 0/7,
teardown called after both finite exits, no page errors and only the expected missing npm
delivery. This accepts the scoped research proof. The limits above remain open.
