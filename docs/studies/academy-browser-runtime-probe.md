# Browser runtime compatibility probe

In progress, 30 October 2026. This is a bounded public-package prototype, not a runtime
selection, production integration or a claim that Academy exists.

The official StackBlitz starter documentation links `https://node.new`; opening it in the
research browser returned Forbidden. No account, access workaround or repository upload
was attempted. The official WebContainer API tutorial at
<https://webcontainer-tutorial.pages.dev> provided an isolated demo terminal instead.

Through that visible terminal:

```text
node --version
v22.22.3

npm exec --yes --package=@asmjs/cli@1.0.0-next.2 -- assemblejs new academy-probe
```

The published CLI wrote the actual starter's package/config/source/style files, README,
agent instructions and five client MCP registrations. The shell returned its prompt after
8 seconds. No local repository files or credentials were sent to the vendor.

The next command was the ordinary generated-project installation:

```text
npm install --prefix academy-probe
```

It remained at a spinner without a completion result across several minutes of observation.
Interrupt attempts did not produce a returned prompt in subsequent snapshots. No second
install or build was started; the viewport override was reset and the owned research tab
closed. There is no successful-install or framework-failure claim, nor an observed orderly
process-termination result. A new probe needs a controlled terminal and bounded diagnostics.

At that point, resolved versions, check/build/typecheck and runtime behavior remained unproven.

## Second, bounded trial

Reopened the public tutorial in a fresh owned tab. A visible terminal command reported Node
22.22.3 and that the previous scratch project's package file did not exist. This confirms
that particular reload did not restore those files, not general persistence support.

Used a Node child-process wrapper with inherited terminal output and a 45-second deadline
for each command. The deadline would kill the exact child; it did not fire on successful
commands. Repeated the pinned CLI scaffold, then installed with network diagnostics:

```text
npm install --prefix academy-probe --verbose --fetch-retries=0 --fetch-timeout=15000
```

Installation added 67 packages in 4 seconds and exited 0, with npm 10.8.2 on Node 22.22.3.
The wrapper returned the prompt after 8 seconds for scaffold plus install. This changes
network retry/timeout diagnostics, not peer resolution or compatibility policy; no force,
legacy-peer-deps or dependency override was used. The first attempt's stall cause remains
unknown. Optional packages for other operating systems were skipped in verbose output.

Read the installed package files: core, cli, mcp, build and check were all 1.0.0-next.2;
esbuild was 0.28.2. Then, in the generated project directory:

```text
node node_modules/@asmjs/cli/dist/bin.js check
no problems
PROBE_EXIT 0

npm run typecheck
> assemblejs build && tsc -b
built 1 assembly(s), 1 page(s), 0 api(s) into dist/
PROBE_EXIT 0
```

The shell returned its prompt after 2 seconds. This establishes actual check, build and
TypeScript success for the plain-html starter in this browser environment.

## Renderer installation limit

Tried installing all seven published renderer packages at 1.0.0-next.2, with the same
45-second child deadline and 15-second fetch timeout/no retries. Automatic peer selection
returned exit 1 in 3 seconds: npm reported `Found: react@undefined` while resolving
react-dom 19.3.1, whose React peer was `^19.3.1`. This is an observed resolver failure in
the vendor environment, not a demonstrated renderer defect.

Read the repository's actual tested peer versions and made one bounded diagnostic attempt
with those explicit dependencies: Preact 11.0.0, React/React DOM 19.2.8, Vue 3.5.43, Svelte
5.57.0, Solid 1.9.15 and Lit 3.3.3. That command returned exit 1 after 12 seconds with
`Failed to fetch`. No force, legacy-peer-deps or peer override was used. No all-renderer
build was attempted after the failed installation. The fetched-package failure needs a
controlled reproduction before assigning a product or runtime root cause.

A follow-on inline log-reading command had a quoting/parse error; a read-only tail command
then confirmed npm's `Failed to fetch`, unfinished reify/finalize timers and exit 1. It did
not establish the failing package URL. All bounded commands had returned a prompt before
the owned research tab was closed; no application server was started by this probe.

Still unproven: all renderers, real multi-server composition and api/event/stream behavior,
live preview, edit/rebuild, orderly termination, reset and saved-state restoration. This is
the vendor demo environment, not an owned Academy origin or direct integration of the
current WebContainer API.

Production licensing and the external-agent filesystem boundary remain as recorded in
`academy-runtime-research.md`. The public tutorial's success does not resolve either.

An independent reader reviewed this record and the complete candidate lesson/proof ladder
against the runtime study and relevant scaffold, MCP and Market source, with no material
findings. It did not replay browser actions. Identity, tracked-tree emoji, formatting and
staged diff checks passed for this documentation increment; earlier self-tests in the session
demonstrated the identity and emoji gates rejecting known-bad fixtures.
A follow-up independent review covered the second trial and renderer-install observations,
with no documentary findings. It verified the peer versions against the manifests and
preserved the distinction between starter success and unproven all-renderer compatibility.
