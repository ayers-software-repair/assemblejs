# Open runtime package/build probe

This is a hosted compatibility experiment under accepted issue 16. It extends the
merged MIT runtime mechanics probe without selecting a production runtime, adding paid
hosting, contacting a vendor or creating an account. Basic file/process success does not
establish package/build compatibility. Academy's curriculum and interface work continue.

## Published 1.0.0 result: incompatible at CLI startup

At `2b91553581d72dc8cb4328dd728ec6e9d045427f`, hosted run `41120957170`, job
`124287022521`, passed the original mechanics probe and both Node format/deadline tests,
but failed the framework probe. npm reported 10.9.2 and exited 0; Node reported v24.18.0
and exited 0. The real `npm exec --package=@asmjs/cli@1.0.0-next.2 -- assemblejs new ...`
then exited 1: `Vivari: no vendored Node builtin 'internal/blocklist'`.

The trace retains successful registry tarball downloads. Its actual published core bundle
imports and constructs `net.BlockList` at module load. The runtime's getter requires
`internal/blocklist`, absent from its builtin factory registry. A separate reader verified
that source chain and the downloaded artifact. No project install, check, build, preview
or hydration acceptance follows. No framework security behavior is bypassed to hide this.

Artifact `13007823375` has SHA-256
`f47600133c07c29affe7d536d24013a091f8a091bcf6cfbec98a8ab524516848` and retains the command
state, empty browser/network error arrays, the passing mechanics state and failure trace.
The delivered real-npm asset has 2,408 files, 11,745,533 raw file bytes and SHA-256
`89404abe9a5c4dd78130f34a122e6ed9fbc4869f3fb5a54212ce2cfeeaa435cd`; independent local
preparation produced the same asset and its actual npm CLI reported 10.9.2.

Registry metadata now reports a newer published 1.1.4, source commit
`8e91ade350445a61abed81dad61dc6ab1734cb40`. Inspect its actual archive/API before treating
newer online documentation as applicable or attempting another development-only probe.
No production runtime is selected by that investigation.

## Newer published 1.1.4: scaffold passes, installation fails

The development-only dependency now pins 1.1.4. Its 27-file published archive has SHA-256
`46c0cac57f9185ded3cf0ab013f1fa383a770b0ae65b6fec2711aeb9ff22ac27`; the registry SHA-512
also matches. Independent inspection found an actual `internal/blocklist` factory and
address/range/subnet implementation, including IPv4-mapped IPv6 handling. This is a reason
to rerun the experiment, not successful framework execution.

The published boot/filesystem/spawn/output/exit/kill/teardown calls used here remain compatible.
Npm now loads lazily, so the dependency-free mechanics test requires no missing resources.
The npm asset format is unchanged. Mount batches its writes but supplies no transactional
rollback. Teardown now rejects pending filesystem requests, settles process exits with -1,
closes output and removes registered listeners; this finite-command test does not prove those
pending-operation paths. Use the published source/declarations rather than assuming every
newer online guarantee. The fixture carries the exact
[1.1.4 upstream notice](https://raw.githubusercontent.com/maitrungduc1410/vivari/8e91ade350445a61abed81dad61dc6ab1734cb40/LICENSE);
the archive still has no LICENSE/NOTICE files and full bundled notices remain open.

Native aliases and node-gyp skipping remain. Bcrypt also maps to bcryptjs, and the runtime
patches npm Arborist peer handling. Delivering the actual pinned npm archive does not mean
the executed toolchain is unmodified. No guest install flags suppress scripts, peer checks
or executable links. The earlier 1.0.0 result remains failed and is not relabelled.

At `ef653edc0e040f4af02fabf55f66c13332eb4e06`, hosted run `41122153163`, job
`124290724496`, passed basic mechanics and the two Node tests. Framework execution progressed
through npm 10.9.2, reported Node v24.18.0 and the actual next.2 CLI scaffold, all exit 0.
The scaffold wrote the expected project files. The subsequent actual framework/peer install
exited 1: `npm error Maximum call stack size exceeded`. Package inspection, checker exercises
and build/typecheck were not reached. Framework browser/network errors are empty; the basic
test has no missing resources, matching lazy npm loading.

Artifact `13007734988` has SHA-256
`01134ed5943643d3d940f3138f0f2874bdb5a8b7a094e258bfafbee34b28d66b`, independently
verified against its upload log and metadata. It retains the actual command state and trace,
but not the referenced npm debug file. The stack overflow's cause remains unproven. The
next diagnostic revision reads only that npm-cache log path before teardown, retaining its
last 64,000 characters or the actual read failure. It keeps the failed install expectation
and all build/check/browser gates; this is diagnostic collection, not acceptance by retry.
The actual-runner Node regression was watched failing without log collection, then passing
with bounded capture. Its mocked runtime/DOM boundaries also exercise an outside-cache
path and an unreadable log, preserving the original failure and teardown. These tests do
not execute or qualify the third-party runtime.

Diagnostic head `73771ef` did not execute: merging the lesson-copy checkpoint into next
created a TODO conflict in the open experiment. GitHub
[does not run pull-request workflows with merge conflicts](https://docs.github.com/en/actions/how-tos/troubleshoot-workflows#triggering-event-conditions).
Merge next into the owned branch and preserve both the completed authored-copy record and
the open runtime task. No workflow trigger/security setting or acceptance gate is relaxed.

At merged-base head `1a5fe79e0ba2136baef7f86c5599fb4c772c047a`, diagnostic run
`41123911249`, job `124297369522`, artifact `13008879915` retains the actual npm log.
Its ZIP SHA-256 is `8ecfaa3e59742f98e3b1bb1aad285185d53d0b1c1f00aeebb2044de57363ced0`.
The five Node tests and basic mechanics passed; installation still failed. The log shows
relative cwd `academy-open-build`, a doubled config path and repeated Arborist
`realpathCached` recursion at line 38. Independent readers traced this to the published
runtime retaining `options.cwd` unchanged: its path resolver can repeatedly prepend that
relative directory instead of reaching `/`. This is a harness path correction, not a reason
to patch npm, weaken dependency checks or remove framework protection.

Use `/academy-open-build` consistently; the real CLI supports absolute project directories.
Before installing, invoke `node -p process.cwd()` and require that exact root. The actual-runner
regression rejected relative spawn directories before this change and passed afterward.
Scaffolding/install/check/build must still pass in the hosted runtime; this correction is
not a claim that later compatibility gaps are resolved.

## Scenario and evidence limits

The first evaluated runtime was `@vivari/core@1.0.0`; its source/archive and historical cleanup
limits are recorded in `academy-open-runtime-probe.md`. Its
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

At `727b9a1`, hosted run `41120445643`, job `124285523562`, passed both small Node tests
but preparation refused the host-generated `node_modules/.bin/arborist` symlink. No browser
or guest framework command ran and no browser artifact exists. Keep the packer's refusal;
prepare the host npm tree with [`--bin-links=false`](https://docs.npmjs.com/cli/v10/commands/npm-install/#bin-links)
so generated host executable links are not added. Guest framework commands retain normal
script/link behavior. The pinned upstream generator itself packs regular files only.
