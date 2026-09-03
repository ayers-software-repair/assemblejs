# Implementation plan

This is the plan of record. It governs every change; work does not stray from it. When something
unexpected forces a change, the change is made, logged in `docs/DECISIONS.md` with what was
expected and what was found, and only raised with the owner when the plan's shape changes.

Decisions already made are in `docs/DECISIONS.md` and are not restated here. The reads of the
predecessor are evidence about a private codebase and are kept in the private estate document
store, not in this repository.

## 1. What is being built

A server that composes pages out of assemblies. An assembly is a piece of a page written in one
UI framework, whole and addressable: it can be rendered in this process or fetched from another
server over HTTP, it hydrates in the browser as an island, and it talks to other assemblies over
a typed event channel. A page is a template that places assemblies. A service supplies an
assembly's data on the server before it renders. An api serves raw data to anyone.

The framework's job is to make the second framework free: adding a Svelte assembly to a page full
of React assemblies costs one command and one file, and neither developer has to learn the other's
framework or the framework's own jargon.

## 2. Order of work

1. **Read the predecessors whole.** Done: eleven dossiers plus a direct read of the contract types,
   the composition loop, the controllers, boot, the view builder, config and the public index.
2. **Aggregate.** One design brief from the dossiers, and one ranked defect audit of the v1 whose
   real output is the set of design rules that would have prevented each class of defect.
3. **Design.** Write the contract before any code: the request and response shape of an assembly's
   content, manifest and data endpoints; the headers that carry composition state; the payload the
   server emits per assembly; the renderer interface; the events API; the service and api
   signatures. Open choices are put to the owner in one pass, against the written design.
4. **Freeze the ladder.** One rung per gate, each with the command that proves it.
5. **Build the ladder.** One rung per pull request onto `next`, proof command run and pasted
   before the next rung starts.

## 3. Shape of the implementation

Settled before the design, because these follow from decisions already made:

- pnpm workspace monorepo, ESM only, TypeScript, Node 22 or newer.
- `node dist/server.js` starts a built app with no bundler present. A bundler is a development and
  build-time tool owned by the CLI, never a runtime dependency of the server.
- One interface for reaching an assembly, whether it is in this process or on another server: the
  same request shape, the same deadline, the same fallback, the same cache, the same headers. A
  local assembly is not a special case with a shortcut.
- The composer is a pure function first: template and a fetch function in, HTML out, no HTTP in
  it, so it is testable before a server exists. The server is a thin wrapper over it.
- A renderer is two functions: server renders template and data to HTML; browser mounts an element
  with data. Nothing in a framework is wrapped or renamed.
- Nothing crosses the server-to-browser boundary except JSON, and that is enforced rather than
  documented.
- One failing assembly never takes a page down unless it is declared required.

## 4. Ladder

Frozen at the end of step 4 above. Every rung names the command that proves it; a rung is done
when that command has been run and its output pasted, not when the diff looks right.

## 5. Verification

- `pnpm check` runs, in order, what CI runs: the identity gate against its own red fixtures then
  the tree, the header check, lint, typecheck, tests, build, and the pack check.
- Every gate is watched failing on a known-bad input before it is trusted.
- The conformance suite generates real projects from packed tarballs and runs them; it never
  resolves the packages through workspace links, because that would not prove what a user gets.
- Before the first stable release, someone who has never seen the project follows the quickstart
  cold on a clean machine, and what they hit is fixed before it ships.
