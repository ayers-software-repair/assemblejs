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

Still unproven: exact resolved package versions, build/typecheck/check, all renderers,
real multi-server composition and api/event/stream behavior, live preview, edit/rebuild,
termination, reset and saved-state restoration. This is the vendor demo environment, not an
owned Academy origin or direct integration of the current WebContainer API.

Production licensing and the external-agent filesystem boundary remain as recorded in
`academy-runtime-research.md`. The public tutorial's success does not resolve either.

An independent reader reviewed this record and the complete candidate lesson/proof ladder
against the runtime study and relevant scaffold, MCP and Market source, with no material
findings. It did not replay browser actions. Identity, tracked-tree emoji, formatting and
staged diff checks passed for this documentation increment; earlier self-tests in the session
demonstrated the identity and emoji gates rejecting known-bad fixtures.
