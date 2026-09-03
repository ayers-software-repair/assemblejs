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

## 3. The design

`docs/DESIGN.md` is the contract, written before any code: the three endpoints of an assembly and
the headers that carry composition state, the envelope, the composer's signature and its failure
ladder, configuration, the trust boundaries, representation, the renderer interface, the events
API, the service and api signatures, the runtime shape and the error contract. It settles every
fork the reference reads left open and it is what the ladder below builds, rung by rung.

The points below are the shape it assumes, and they follow from decisions already made:

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

Frozen 2026-09-03 against `docs/DESIGN.md`. Every rung is one pull request onto `next`, whole but
thin, and names the command that proves it. A rung is done when that command has been run in the
session that did the work and its output pasted, not when the diff looks right. Every new gate is
watched failing on a known-bad input before it is trusted.

The order follows the design's own dependency: the composer is a pure function, so it is built and
proven before a server exists; the envelope and the encoders come before anything emits markup;
configuration comes before anything can be configured open.

Until the owner enables Actions for this repository, every proof below is local only. That is
logged in `docs/TODO.md` and it does not stop a rung; it stops the claim that CI proved it.

| rung  | what lands                                                                                                                                                                                                                                              | proof                                                                                                                                                                         |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B-01  | Repository skeleton, gates, working rules. **Done, `c565074`.**                                                                                                                                                                                         | `pnpm check`                                                                                                                                                                  |
| B-02  | `@assemblejs/core` shell: exports map and tsup build only. The vocabulary constants land at B-04, with the envelope that first needs them, so a word still awaiting the owner is not encoded into six rungs before he has seen it                       | `pnpm --filter @assemblejs/core build && node -e "import('@assemblejs/core')"`                                                                                                |
| B-03  | The pure composer (design 3.2, 3.3, 3.4, 3.5): deadlines, settle-independently, the fallback ladder with its `source`, depth and cycle refused before dispatch, defer, required, and `defer` with `required` as a boot error. No HTTP anywhere in it    | `pnpm --filter @assemblejs/core test -- compose`, red-tested first: a hanging fetch, a self-referencing plan, a plan nine deep, a failing required placement                  |
| B-04  | The vocabulary in one module and nowhere else, then the envelope and the encoders (design 2.4, 5.3, 5.4): one canonical attribute set, the allowlist projection, three encoders by position, no interpolation into a tag string                         | `pnpm --filter @assemblejs/core test -- envelope`, red-tested on a payload carrying a literal closing-script sequence and on a header-shaped field                            |
| B-05  | Configuration (design 4): read from the process environment, schema-validated at boot, echoed in the banner, refuses to start unresolved, no default credential                                                                                         | `pnpm --filter @assemblejs/core test -- config`, red-tested by starting with a required variable unset and with a control enabled but its credential missing                  |
| B-06  | The server: the three endpoints, the four request headers validated on arrival, `/_assemblejs/` reserved, the HTML renderer, the error contract with correlation ids, nothing thrown after listen, asset roots from resolved module paths               | `node examples/html/server.js` then `curl` the three endpoints; a test asserts no exception message and no credential reaches a body                                          |
| B-07  | The browser runtime: envelope discovery, island parsed then removed, native module import, the four mount modes                                                                                                                                         | Playwright: a static assembly ships no script, a `client:visible` assembly mounts only when scrolled to                                                                       |
| B-08  | Events (design 9): typed, page-scoped, addressable, opt-in last-value replay, unmount removing exactly its own references                                                                                                                               | Playwright: two assemblies exchange an event; a leak test mounts and unmounts a hundred times and asserts the listener count returns to its start                             |
| B-09  | `@assemblejs/cli` and `@assemblejs/create`: `new`, `add`, `dev`, `build`; filesystem discovery with the generated import module the author never opens; templates inside `files`; non-interactive outside a TTY                                         | `npm create` from the packed tarball into a temp directory, then `build`, then `node dist/server.js` with no bundler installed                                                |
| B-10  | `@assemblejs/renderer-react`: server render, client mount, the events binding                                                                                                                                                                           | Playwright: it hydrates beside a plain HTML assembly                                                                                                                          |
| B-11  | `@assemblejs/renderer-svelte`, and the day-one proof: two frameworks on one page, from packed tarballs, one exchanging an event the other displays                                                                                                      | the day-one script, start to interaction, under five minutes                                                                                                                  |
| B-12  | Services and apis (design 8): return not mutate, declaration order with `after`, schemas deep-merged with a name collision as a startup error, api routes                                                                                               | tests for order, for the merge, and for the collision; `curl` an api route                                                                                                    |
| B-13  | Remote assemblies (design 5.1): exact-origin allowlist, redirects refused, private ranges denied, per-key forward list, size and content-type caps, the manifest handshake once per version, per-placement cache never holding a credentialled response | two servers in one test: it renders, an unlisted origin fails at boot, a redirect fails, a timeout falls back, no cookie is ever forwarded, the second request is a cache hit |
| B-14  | Auth and policy (design 5.2): one evaluation point before everything else, basic credentials, the callback, public routes; a content policy and same-origin CORS on by default with allowlisted remotes added                                           | 401 without and 200 with; a test asserts there is exactly one place that decides                                                                                              |
| B-15  | Styles (design 10): build-time scoping per assembly, Shadow DOM opt-in, the global holes documented                                                                                                                                                     | two assemblies with the same class name do not collide; the documented holes are asserted to still leak, so the documentation cannot go stale                                 |
| B-16  | `renderer-preact`, `renderer-vue`, `renderer-solid`, `renderer-lit`                                                                                                                                                                                     | the B-10 hydration proof per framework, and one page carrying all six                                                                                                         |
| B-17  | `@assemblejs/renderer-templates`: EJS, Markdown, Nunjucks, Handlebars, Pug behind one interface, engines loaded on first use                                                                                                                            | generate, build and run one project per engine, five of five                                                                                                                  |
| B-18  | Real-time (design 3.6): an api handler streaming server-sent events, one connection per page, delivered onto the events bus                                                                                                                             | Playwright: a server push reaches two assemblies in different frameworks                                                                                                      |
| B-19  | `@assemblejs/devtools`: read-only, development-only, with the boot assertion that nothing under its prefix accepts a write                                                                                                                              | the assertion red-tested by registering a POST under the prefix and watching boot refuse                                                                                      |
| B-20  | `check`, `perf` and `deploy` verbs                                                                                                                                                                                                                      | a generated project passes `check`; `deploy` writes a build that runs                                                                                                         |
| B-21  | Conformance harness and the first specs, installed from packed tarballs, never through workspace links                                                                                                                                                  | `node conformance/harness/run.mjs` green on the first specs                                                                                                                   |
| B-22  | Conformance breadth, batch one                                                                                                                                                                                                                          | the matrix green for the batch                                                                                                                                                |
| B-23  | Conformance breadth, batch two                                                                                                                                                                                                                          | the matrix green for the batch                                                                                                                                                |
| B-24  | Conformance breadth, batch three, and the acceptance table: every intent from the predecessor's tests either mapped to a test here or struck with its reason                                                                                            | the table has no blank row                                                                                                                                                    |
| B-25  | Size budgets, pack check, Scorecard                                                                                                                                                                                                                     | budgets asserted; a Scorecard run                                                                                                                                             |
| B-26  | Release dry run: changesets version, pack every package, publish dry run with provenance from the reviewed environment                                                                                                                                  | the dry run lists every package and the tarball contents are read                                                                                                             |
| B-27a | Estate integration and the first `next` prerelease                                                                                                                                                                                                      | the prerelease resolves from npm under the `next` tag; the site answers at its prefix                                                                                         |
| B-27b | `1.0.0` on `main`, after the flip and after the cold quickstart by someone who has never seen it                                                                                                                                                        | provenance visible on the published package                                                                                                                                   |

## 5. Verification

- `pnpm check` runs, in order, what CI runs: the identity gate against its own red fixtures then
  the tree, the header check, lint, typecheck, tests, build, and the pack check.
- Every gate is watched failing on a known-bad input before it is trusted.
- The conformance suite generates real projects from packed tarballs and runs them; it never
  resolves the packages through workspace links, because that would not prove what a user gets.
- Before the first stable release, someone who has never seen the project follows the quickstart
  cold on a clean machine, and what they hit is fixed before it ships.
