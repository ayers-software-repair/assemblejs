# Synthesis: the subassembly rung, decided and laddered

Written 2026-10-09 by the seat, against `next` at a7dfefc, after reading `reader-core.md` and
`reader-renderers.md` whole. The two memos were written against 1210023 and second-read there;
the files they rest on have not changed since (re-read today: `server/render-local.ts:14-36`,
`server/local-fetch.ts:20-48`, `compose/compose.ts:22-66`, `compose/settle-placement.ts:60-115`,
`compose/find-placements.ts:13-23`, `client/find-envelopes.ts:13-15`,
`server/create-server.ts:157-208`, `server/register-pages.ts:62-118`, `server/opens-runtime.ts:12-22`,
`renderer-react/src/client/slot.ts:13-24`). Where the two memos disagree, this file decides and
says why. Everything below is the design the ladder in section 5 builds; DESIGN is amended at
S-09 with the same words.

## 1. The ruling

A subassembly is placed by `<assembly name="x">` inside a template view, as a page places one,
and by a `Slot` bound to the same name in a framework view; the key a view reads a child by is
the name (DECISIONS 2026-10-05, the rulings entry). A deferred placement from another server
stays refused at boot. Then: nested composition, services shaping a child's request, and a
parent's depth and cycle refusal held across two servers in conformance.

## 2. The mechanism, decided

**Render once; the directive is the seam.** A view renders with no children. A template view
wrote the directive literally; a framework view's `Slot` emitted it. `renderLocal` then runs the
composer over the view's rendered markup, before the envelope wraps it, with the local
transport, and each child's envelope replaces its directive. The page never knows: it placed the
parent, and the parent's envelope holds the children (reader-core 1.5; reader-renderers 2, the
probe showing the directive survives every renderer's output).

**The Slot renders the directive on both sides.** The browser half of a framework parent
renders the same pre-composition markup the server did, `<div data-assembly-slot="x"><assembly
name="x"></assembly></div>`, and never reads the DOM. Reader-core 2.3's sketch, collecting each
slot's `innerHTML` and handing it back as `children`, is rejected on reader-renderers 2's three
findings: `innerHTML` is not the server's bytes (shadow roots are not serialised, Svelte and Lit
markers are added), no framework needs the strings to match the DOM, and it does nothing for the
one real hazard (a Lit parent reading a Lit child's markers). What holds per framework, read in
the frameworks' own code (reader-renderers 1): React in production neither compares nor writes
`dangerouslySetInnerHTML` while hydrating, Preact and Solid guard it behind `isHydrating`, Vue
neither compares nor writes `innerHTML`, Svelte's `{@html}` claims by markers, Lit checks a digest
of the string. Two requirements fall out and are held by tests: React's Slot carries
`suppressHydrationWarning` and an identity-stable `{ __html }` per name, because React's
re-render compares that object by identity and would rewrite the slot (and destroy the child's
live root) on every parent state change; and a Lit view may hold a Lit child only when the child
declares `shadow: true`, the documented refusal, with the detach-and-reattach mount recorded as
the follow-up.

**`children` leaves the interface.** Under this mechanism nothing on the server or in the
browser is ever handed a child's markup: the server composes after the view rendered, and the
browser renders the directive. The `children` field of `MarkupInput` and `RenderInput`, the
`children` prop every renderer passes, the `children` locals of the four template engines and
the Slots' `children` prop are a path nothing fills, and CLAUDE.md's Style forbids a path kept
for compatibility. A `Slot` takes `name` and an optional `view`. Svelte and Lit, whose package
code cannot render inside the author's view, get a `slot(name, view?)` function returning the
directive string, used as `{@html slot("x")}` and `${unsafeHTML(slot("x"))}`; the digest and the
hash then match because both sides hashed the same string. This is a renderer-interface change
before the first publish and carries the rung's changeset (minor, every renderer and core).

**Children are local, and have no plan.** A view has no `place` policy, so every child composes
with plan `{}`: the default deadline, no fallback markup, not required, not deferred, no cache
of its own. A name only the page declared as a remote reaches the local transport and falls
back ("no assembly ... in this server"). A remote child would need a view-level policy that the
ruling did not add; it is not in this rung and is recorded in section 4 as the one later
question, asked only if a real application needs it.

**One placement per name per view.** The key is the name and `children` was a record; two
placements of one name in one view are two envelopes under one key. `renderLocal` refuses a view
whose markup places a name twice; a list placing `price` once per item is not writable under the
ruling, and the guides say so.

**Depth and path are the arrived ones.** `renderLocal` takes the composition state: the page id
(from `localFetch`'s request or the content endpoint's headers, or a fresh id for a bare fetch),
the arrived depth unchanged, the arrived path extended by the parent's own identity, the parent's
query and params, headers `{}`, the server's limits, a signal. The composer then dispatches each
child at `depth + 1` and refuses before dispatch exactly as it does for a page (reader-core 1.2,
1.6). `depth` and `path` are required on the nested call by type, never defaulted: a default of
0 and `[]` is the unbounded recursion of reader-core 6.1, watched red by the mutation that passes
them. The server's `maxDepth` becomes the one cap: the page's compose takes it too, so the
composer never dispatches deeper than arrival would accept.

**Two servers.** A page on A placing a parent on B: A sends `assembly-depth: 1` and no path; B
composes the parent at depth 1 with path `[parent/default]`; B's children go at 2 and B refuses
`parent/default` as a cycle and `cap + 1` as depth, before dispatch, on B's own log. With local
children a cycle cannot cross servers, so the ruling's "held across two servers" is held by the
contract: a conformance spec sends B the headers an upstream composer sends (`assembly-depth`
at the cap, `assembly-path` naming the child) and reads the nested failed envelope's id in B's
log. No fixture can set a cap, so depth is driven by header or by a real chain, never by a cap
(reader-core 1.6, 1.7).

**Failure, diagnostics, caching.** `renderLocal` returns `{ html, diagnostics }`; `localFetch`
carries the nested diagnostics on its answer and `settlePlacement` hangs them under the parent's
diagnostic, so a page's compose result is a tree and the page logs every nested fallback with its
id, as it logs its own. A parent whose subtree carries a failure is not cached, decided from the
markup (a nested `assembly-root[data-failed]`) so local and remote answers cache alike. The
parent's data endpoint is untouched: a child's data is its own `/api/`.

**Hoisting and the runtime.** `register-pages` hoists css and js over the whole diagnostic tree;
a shadow parent links each non-shadow local child's scoped sheet inside its own root (a page-head
sheet does not reach a shadow root; probed); `opensRuntime` and the deferral rule count the
children boot can see in static sources. For a remote parent, the transport already walks every
envelope in the answer: it learns each nested envelope's manifest once per version, after the
nested name and view pass the segment shape, and `assets` answers the union. The manifest itself
says nothing about children.

**The browser runtime.** `findEnvelopes` also walks each found envelope's `shadowRoot`, document
order kept; `start` considers envelopes under shadow roots; `fill-deferred` sends
`assembly-depth: 1`, as its own comment promises. Mount order needs no rule: a parent hydrating
after a live child never writes into the slot, a child hydrating after its parent finds its
envelope intact (reader-renderers 2).

**The finder meets runtime output.** The composer reads a view's rendered markup, data in it.
Every escaped position is safe (every renderer escapes `<` in text; the attribute encoder too).
In a raw position a visitor's `<assembly` that is not exactly a directive fails the parent's
render into its fallback rather than placing anything; a directive a view wrote from a
visitor's raw string is the author's raw write, which DESIGN 7 already names. The finder skips
`<script>`, `<style>`, `<textarea>` and `<title>` as it skips comments, so a child's island can
never end an enclosing script early. No second scanner. A view placing a child reads its own
envelope with the fragment scanner and throws on a refusal, so a child placed where the parser
closes its container (inside `<p>`) fails the parent alike on both transports instead of
shipping a split DOM locally and a refusal remotely.

**Signals and limits.** `ComposeOptions` and `SettleInput` carry a `signal`; children compose
under `AbortSignal.any([parent, own])` and no child is dispatched once the parent's signal is
aborted. Breadth is unbounded and recorded so: a view places what it places, bounded in time by
the page's race; a breadth cap is a later row if a real application asks for one.

**Boot and `check`.** A static source (html, EJS, Handlebars, Nunjucks) holds the directive
literally and is read at boot and by `check` as a page template is: a name with no assembly, a
view the child lacks, and a self-placement are problems before any request. A framework view's
`Slot` names are read off its AST where `check` already reads `mount`; a Pug view is checked at
render only, and the guide says so. Markdown cannot place a child; `html: false` stays.

## 3. What the owner's phrase "services shaping a child's request" means here

A service runs before the view renders and the view writes the directive from its data: the
child's `view` is the one attribute a service shapes (`<assembly name="price"
view="{{data.priceView}}">`, or `<Slot name="price" view={data.priceView} />`). A value outside
the segment shape fails the parent, on both transports alike. The child inherits the parent's
params and query, which is what the child's services already receive. A child's own query is a
new surface (an attribute, a header, a cache-key part); it is not written here and is not
needed by any example or fixture. If a real application needs it, it is one plan question.

## 4. Decided here, and the one later question

Decided here and recorded in DECISIONS at S-09: the directive on both sides and `children`
leaving the interface; local children with no plan; one placement per name per view; arrived
depth and extended path, required by type; the one cap; a failed subtree is not cached; hoisting
through the tree and nested manifests once per version; shadow roots walked; the fill sends depth
1; raw-text elements skipped; the parent reads its own envelope with the scanner; Svelte and
Lit `slot()`; the Lit-in-Lit refusal; Markdown places nothing; breadth unbounded, recorded.

Later, only if an application asks: a remote child (a view-level policy), a child's own query,
a breadth cap. None is asked now.

## 5. The ladder

Each rung is one commit on `next` with its changeset where it touches `packages/*/src`, its
tests red first by the named mutation, the fast gates per commit and the long gate (conformance,
the browser proof) once at S-08. Core's `test/` mirrors `src/`, one file per file.

| rung | what lands                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | proof and the mutation watched red                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-01 | The one segment shape in `vocab/` (today copied at `find-placements.ts` and `parse-content-url.ts`), read by the finder, the url parser and later every Slot; the finder skips raw-text elements as it skips comments                                                                                                                                                                                                                                                                                                                                                   | `test/vocab/*.test.ts`: `price-2` accepted, `Price`, `a/b`, `../x` refused (anchor dropped); `find-placements.test.ts`: a directive inside `<script>` is not a placement (skip removed)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| S-02 | Core composes a view's markup: `renderLocal` takes the composition state and a `Fetch`, composes with plan `{}`, headers `{}`, the server's limits and a signal, refuses one name placed twice, reads its own envelope with the scanner when it placed a child, returns `{ html, diagnostics }`; `localFetch` is the closure that hands itself in and carries `nested`; the content endpoint uses that one `Fetch`, passes the headers' page, depth and path, logs nested failures; the page's compose takes the server's cap; `signal` threaded; `Diagnostic.children` | `render-local.test.ts`: a self-placing view renders once and holds one nested `cycle` envelope (depth 0 passed, path not extended: a hang under the test timeout); a chain past the cap answers `depth` at the cap; a directive in an html view's string is spliced; `data` holding an escaped directive places nothing; a child inside `<p>` throws; two placements of one name throw. `create-server.test.ts`: `assembly-path: child/default` to the parent answers 200 with the child refused inside; `assembly-depth` at the cap refuses the child; a server with `maxDepth: 2` refuses at 2 from its own composer; a nested failure's id is in the log. `settle-placement.test.ts`: an aborted parent dispatches no child; a parent whose child fell back is not cached |
| S-03 | Hoisting over the tree in `register-pages`; a shadow parent links its non-shadow children's sheets in its root; `opensRuntime` and the deferral rule count static sources' children                                                                                                                                                                                                                                                                                                                                                                                     | `register-pages.test.ts`: a static parent with a framework child links the child's css and the runtime (tree not walked); `render-local.test.ts`: the child's `<link>` inside the parent's `<template shadowrootmode>` (parent's css only)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| S-04 | The browser runtime: `findEnvelopes` walks shadow roots; `start` considers them; `fill-deferred` sends depth 1                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `find-envelopes.test.ts`: a child in a declarative shadow root is found after its parent (not entered); `start.test.ts`: a shadow child mounted once, its island removed; `fill-deferred.test.ts`: the request carries `assembly-depth: 1` (header dropped)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| S-05 | Remote: `mark-remote` reports nested names, views and a nested `data-failed`; the transport learns each nested manifest once per version after the segment shape; `assets` answers the union; a failed subtree is not cached, decided from the markup                                                                                                                                                                                                                                                                                                                   | `mark-remote.test.ts`, `create-remote-transport.test.ts`: an answer with a nested envelope learns two manifests (only the parent's); a nested name `../x` yields no manifest url; a nested failed envelope keeps the answer out of the cache (written)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| S-06 | The renderers: `children` leaves `MarkupInput`, `RenderInput`, every renderer's props and hydrate, the engines' locals; `Slot({ name, view? })` renders the directive on both sides, React's with `suppressHydrationWarning` and a stable object per name; `slot(name, view?)` exported by renderer-svelte and renderer-lit; the Lit-in-Lit refusal; the engines' tests hold that the directive survives compile and Markdown escapes it; `examples/frameworks` gains the `nested` page                                                                                 | each `slot.test`: the directive when nothing was composed; each `hydrate.test`: an envelope inside the slot survives hydration and a parent state change (React: a fresh object per render); Lit: a Lit child's markers in the slot make `hydrate` throw; the browser proof's six assertions on the `nested` page, red on the directive fallback removed, on a fresh `{ __html }`, and on the warning suppression dropped under a development bundle                                                                                                                                                                                                                                                                                                                         |
| S-07 | `check` reads directives in static sources and `Slot` names off framework views where it reads `mount`: a name with no assembly, a missing view, a self-placement, a name placed twice; the agent surface's `place_assembly` can target an assembly's view, and `explain` names the rules                                                                                                                                                                                                                                                                               | `check` tests: each problem reported with its file and rule (reader removed); `create-mcp-server.test.ts`: an agent places a child in a view through the protocol and composes the parent to see it                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| S-08 | Conformance: a `nested` fixture (a local parent and child in every static and framework kind, a shadow parent, a self-placing view, a chain past the cap) and, in `remote`, a producer parent placing a producer child placed by the consumer's page: the child's css on the consumer's page, both envelopes `data-remote`, refusals by path and by depth from the headers the consumer sends, the nested failure's id in the producer's log                                                                                                                            | `pnpm conformance` green with the new specs; each spec watched red on: path not extended, depth passed as 0, nested manifests not learned, shadow not entered                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| S-09 | DESIGN 2.4, 3.4, 7, 8 and 10 say the mechanism in these words; every camp's guide shows a child; DECISIONS carries section 4; the rung's changeset (minor on core and every renderer); the memos are deleted, this file with them, once DESIGN carries their result                                                                                                                                                                                                                                                                                                     | `check:site`, `site-links --check`, the identity and emoji gates; a reader with no stake confirms DESIGN against the tests (the repo's verification rule)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

Order: S-01 to S-09 as numbered. S-06 can start after S-02 lands and does not wait on S-03 to
S-05; S-08 waits on all of them.

## 7. S-02, file by file (written 2026-10-09 before the 22:00 hold; the code to write next)

- `compose/diagnostic.ts`: `children?: readonly Diagnostic[]`, what the answering assembly
  composed inside itself. `compose/assembly-response.ts`: the ok branch gains
  `nested?: readonly Diagnostic[]`. `compose/compose-options.ts` and `settle-input.ts`: a
  `signal?: AbortSignal`, the parent's; the "Ancestor ids" comment becomes identities.
- `compose/holds-failed-envelope.ts` (new): whether markup holds a nested
  `<assembly-root ... data-failed>`; `settle-placement.ts` writes the cache only when it does not,
  hangs `answer.nested` under the diagnostic as `children`, refuses to dispatch when
  `input.signal` is already aborted (fallback, reason `timeout`), and hands the transport
  `AbortSignal.any([input.signal, controller.signal])`. `compose.ts` passes the signal through.
- `compose/duplicate-placement-names.ts` (new): the names a list of placements places twice.
- `server/local-render-input.ts` (new type): `id`, `page`, `depth`, `path`, `query`, `params`,
  `fetch`, `limits`, `signal?`, `newId`, `now`. `server/local-rendered.ts` (new type): `html`,
  `diagnostics`. `server/render-local.ts`: `renderLocal(assembly, view, input)`: resolve data,
  render the view with `children: {}`, find the placements in the markup (a malformed directive
  throws and fails the parent), refuse a name placed twice, compose the markup with plan `{}`,
  headers `{}`, the arrived depth, the path extended by `identity(name, view)`, the given
  limits, signal, ids and clock; wrap the envelope; when it placed a child, read its own
  envelope with `scanFragment` and throw on a refusal; return `{ html, diagnostics }`.
- `server/local-fetch.ts`: `localFetch(assemblies, log, limits)` builds the one `Fetch` that
  hands itself to `renderLocal` with `request.{id,page,depth,path,query,params,signal}`,
  `randomUUID` and `performance.now`, and answers `{ ok: true, html, source: "local", nested }`.
- `server/log-fallbacks.ts` (new): walks a diagnostic tree and logs every fallback with its id,
  naming the page route or the parent assembly; used by `register-pages` (replacing its inline
  loop) and by the content endpoint for nested failures.
- `server/create-server.ts`: `limits = { depth: maxDepth, maxBytes: DEFAULT_LIMITS.maxBytes }`;
  one `local = localFetch(byName, log, limits)` for the endpoint and `registerPages`; the
  content endpoint calls `renderLocal` with the headers' page (or a fresh uuid), depth, path,
  params, the query, `local`, `limits`, and logs the nested fallbacks; `registerPages` takes
  `limits` and passes them to `compose`.
- Tests, mirrors first: `duplicate-placement-names`, `holds-failed-envelope`, `log-fallbacks`,
  `local-render-input`, `local-rendered` (type tests in the file's pattern); `render-local.test`
  rewritten to the new signature plus the S-02 cases of section 5; `local-fetch.test` with
  `limits` and the nested cases; `create-server.test` with the header-driven refusals, the
  `maxDepth: 2` server and the nested id in the log; `settle-placement.test` with the aborted
  signal and the uncached failed subtree; `register-pages.test` passing `limits`. The mutations
  to watch red are in section 5's S-02 row.

## 6. Found in passing, not this rung's (reader-core 8, confirmed)

Two depth caps today (fixed in S-02); the page's query reaches local services and not remote ones
while the deferred fill sends it; `compose-options.ts` says "ancestor ids" where the path holds
identities (fixed in S-02); `findEnvelopes` and shadow roots is a latent defect already for a
hand-placed envelope inside a shadow assembly (fixed in S-04); CLAUDE.md's Packages line says
core holds "HTML and WebComponents renderers" while nothing in core names one (a ledger row);
`ProjectConfig` has no depth cap, so every CLI-built server refuses at 8 (a ledger row, with the
cap's surface left to a later ruling).
