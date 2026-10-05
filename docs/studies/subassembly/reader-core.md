# Reader memo: packages/core and the subassembly rung

Read-only. Repository /home/user/assemblejs, branch `next` at 1210023. Every path below is
under `packages/core/src/` unless it starts with `docs/`, `test/`, `packages/` or `conformance/`.
Line numbers are from `cat -n` of the files as they are on this commit.

Second reader, same commit: every citation below was re-opened. A correction is marked
**[corrected]** where it stands, an addition **[added]**; a claim not marked was confirmed at the
cited line. A browser fact marked _(probe)_ was run in Chromium 141 headless
(`/opt/pw-browsers/chromium-1194/chrome-linux/chrome --headless=new --dump-dom`) on the pages in
`scratchpad/subassembly/probe/` (shadow.html, slot.html, style.html).

## 0. The ruling, and the code it lands on

- Ruling (docs/DECISIONS.md:2060-2064): a subassembly is placed by `<assembly name="...">` inside
  a template view, as a page places one, and by a `Slot` bound to the same name in a framework
  view; the key a view reads a child by is the name. **[corrected]** The ruling does not say
  children are local: that is the orchestrator's sketch. It says a deferred placement from another
  server stays refused at boot (DECISIONS:2065-2066). What local-only children can and cannot hold
  across two servers is 1.7.
- What the open entry said was missing (DECISIONS:1499-1517): where a child is named, what key a
  view reads it by, how a service shapes the request. The first two are ruled; the third is not
  (see 1.6).
- Today a local render hands its view `children: {}`: server/render-local.ts:26. Every renderer
  package already takes `children` on the server (react/server/react-renderer.ts:17-21,
  render-to-markup.ts:29; svelte/server/render-to-markup.ts:24; lit/server/render-to-markup.ts:24;
  vue/server/render-to-markup.ts:23; solid/server/render-to-markup.ts:32-33;
  preact/server/render-to-markup.ts:27) and hands `children: {}` in the browser
  (react/client/hydrate.ts:26, preact:21, solid:45, vue:16, svelte:19, lit:21).
- The four `Slot`s emit `<div data-assembly-slot="<name>">` with `children[name] ?? ""` written
  raw: react/client/slot.ts:20-23, preact/client/slot.ts:20-23, solid/client/slot.ts:14-27
  (innerHTML getter 23-25), vue/client/slot.ts:20-22. Svelte and Lit have no Slot.
  **[corrected]** Nothing in packages, docs or examples shows how a Svelte or Lit view writes a
  child (grep `{@html` and `unsafeHTML`: no hit); their props say only that children are HTML keyed
  by placement name (lit/src/props/assembly-props.ts:9-10; svelte/src/props/assembly-props.ts:14).
- Template engines already write `children.<name>` raw and `data` escaped:
  renderer-templates/src/engine/load-handlebars.ts:22-28 (SafeString), load-nunjucks.ts:14,23,
  load-ejs.ts:14-16,21, load-pug.ts:13; Markdown has `html: false` (load-markdown.ts:12), so a
  directive in a `.md` view is text, never a placement (consistent with DECISIONS:1137-1138).
- An html view's markup is the file's text, no input at all: cli/src/generate/generate-registry.ts:72
  (`markup: () => view`), 70 (template), 73 (framework).
- **[added]** `renderLocal`, `localFetch` and `pageFetch` are public exports (server/index.ts:51,52,58,
  re-exported by src/index.ts:23) of core at 1.0.0 (packages/core/package.json:3). A new signature
  changes the published surface; before the first publish it needs no changeset
  (DECISIONS:2043-2045), and the typedoc reference (DECISIONS:2057-2059) will show it.
- **[added]** The generated registry gives every assembly one view, `default`
  (cli/src/generate/generate-registry.ts:76), so a directive's `view=` reaches only an assembly
  declared by hand with several views.

### 0.1 [added] What the sketch changes that DESIGN and the types still say

- One pass and a splice means a view never receives a child: `children` is `{}` on the server for
  every view (render-local.ts:26 stays as it is), and a Slot's `children` prop is filled only in
  the browser, from the DOM. Four texts then say something false: DESIGN 7:446,458-459 ("Children
  arrive already rendered, as strings. One conversion, in the caller"), assembly/markup-input.ts:8-9
  and :13, renderer/render-input.ts:6-7 and :13, and B-17's "`children` is HTML"
  (DECISIONS:1126-1128). The template engines' `children` locals (renderer-templates
  load-handlebars.ts:23-28, load-nunjucks.ts:20-25, load-ejs.ts:16,21, load-pug.ts:13) become a path
  nothing fills on the server, and CLAUDE.md's Style says "No legacy or compatibility paths".
  Decide and record: `children` leaves the server inputs (MarkupInput, RenderInput, the engines)
  and lives only in the browser props, or it stays as `{}` with every comment rewritten as
  "collected in the browser". Rendering twice (discover, compose, render again with `children`
  filled) would keep DESIGN 7's text, but runs every view twice and still has to find the directive
  in a template view's markup, so it buys nothing the ruling asks for.
- DESIGN 7:458-459 also says "plain HTML and Markdown nest exactly as React does"; B-17 says a
  Markdown view "places no children" (DECISIONS:1137-1138; load-markdown.ts:6-8,12). Drop Markdown
  from that sentence in the same rewrite.
- The key is the name (the ruling), and `children` is a `Record<string, string>`
  (markup-input.ts:13). Two placements of one name in one view (two views of it included) are two
  envelopes with two ids (settle-placement.ts:26) under one key: the browser's collection can hold
  one, and a Slot handed the other's markup rewrites the second child. So one placement per name
  per view is a consequence of the ruling, and core can hold it: renderLocal refuses (throws) a view
  whose markup places a name twice. A list that places `price` once per item cannot be written
  under it; record the consequence with the rule.

## 1. Placements: found, settled, cached, spliced; what renderLocal needs

### 1.1 Found

compose/find-placements.ts:13-16 matches `<assembly ...>` (PLACEMENT_ELEMENT, vocab/placement-element.ts:11),
case-insensitive, anywhere in the string; a directive inside `<!-- -->` is skipped (:17,35-39,48).
`<assembly-root ...>` cannot match: after `<assembly` the regex needs whitespace, `/` or `>`,
and `-` is none of them. Refused by throw: not self-closed or immediately closed (:49-54), an
attribute other than `name`/`view` (:23,60-64), a repeated attribute (:67-71), unreadable
leftovers (:75-80), no name (:82-85), a name or view outside `^[a-z][a-z0-9-]*$` (:21,86-97).
Each placement is `{name, view, start, end}` (compose/placement.ts:6-12).

### 1.2 Settled

compose/compose.ts:29 finds; :34-42 refuses defer+required; :47-66 settles every placement
concurrently under `allSettled`, handing settlePlacement `depth: options.depth ?? 0` (:57) and
`path: options.path ?? []` (:58), the page's `query`, `params`, `headers`, `newId`, `now`.
compose/settle-placement.ts (file lines): id minted :26; deferred placeholder :45-58; refusal
before dispatch :62-65 via :108-112 (`depth + 1 > limits.depth` -> "depth"; `path.includes(identity(name, view))` -> "cycle"),
answered by fallBack with `cached = false` so the cache never answers a refusal (fall-back.ts:26);
cache read :68-70; the request :74-86 carries `depth: input.depth + 1` (:79) and `path: input.path`
(:81, the ancestors alone, never the target: DECISIONS:1532-1535); `race` :88, :151-173 answers on
the deadline whether or not the transport honours the signal; the answer is measured against
`limits.maxBytes` (:91-94); a good answer is written to the cache (:96); any failure climbs the
ladder (:99-104). `call` :123-144 turns a throwing or non-Promise transport into a result.
Required failure propagates as RequiredFailure (compose.ts:68-73; fall-back.ts:31-34).

### 1.3 Cached

compose/placement-cache.ts:17-21: only a plan with `cache.ttl > 0` and no credential header reads
or writes; key `${ttl}|${cacheKey(name, view, query, plan?.url, headers, params)}`.
compose/cache-key.ts:28-33: `url ?? identity(name, view)`, then `;params`, then `?query`, then the
varied headers. A nested placement has no plan (1.5), so it is never cached on its own.

### 1.4 Spliced

compose.ts:81-101: output is template text up to `placement.start`, the settled html, text from
`placement.end`; a settle that rejected (a defect, not a required failure) is spliced as nothing
and recorded as `source: "fallback", reason: "invalid"` (:92-99). Order is the template's.

### 1.5 What renderLocal would need

Today: `renderLocal(assembly, view, id, query, params = {})` (server/render-local.ts:14-20),
called by the content endpoint (server/create-server.ts:179-185) and by localFetch
(server/local-fetch.ts:32-38). It has none of: page id, depth, path, headers, signal, a Fetch,
limits, newId, now, log.

To run the composer over the view's markup it must call compose with (ComposeOptions,
compose/compose-options.ts:9-33):

- `template`: the rendered markup (the string from `declared.markup(...)`, render-local.ts:26),
  BEFORE renderEnvelope wraps it (so the island, which writes `<` as the JSON escape
  backslash-u003c, **[corrected]**: the first writing lost the backslash,
  encode/encode-island-json.ts:15-21, is never scanned; it would be inert anyway).
- `plan: {}` (children local, no policy, per the sketch), so every child is a local default:
  deadline DEFAULT_DEADLINE, no fallback, not required, not deferred, no cache.
- `fetch`: the server's local transport. Not pageFetch (server/page-fetch.ts:13-22, which routes by
  the PAGE's plan); the local Fetch alone. local-fetch.ts imports render-local.ts (:8,
  **[corrected]** from :7), so render-local.ts importing local-fetch.ts is a cycle that
  `.dependency-cruiser.cjs:6-15` (`no-circular`) refuses; `tsPreCompilationDeps: true` (:95) counts
  a type-only import too, so render-local.ts may take `type { Fetch }` from compose/fetch.ts and
  nothing from local-fetch.ts. Shape that avoids it: renderLocal takes `fetch: Fetch` as an argument;
  localFetch builds a closure `const fetch: Fetch = async (request) => renderLocal(..., { fetch, ... })`
  and hands itself in; the content endpoint is given that same Fetch. **[corrected]**
  create-server.ts:243 builds it inline as registerPages' `local:` option, not as a named value;
  hoist it to one `const` that the endpoint (:179) and registerPages (:243) both use.
- `page`: `request.page` in localFetch; on the content endpoint `headers.page` (server/composition-headers.ts:10)
  or, for a bare fetch ("you are the page", DESIGN 2.1:61), a fresh uuid.
- `depth`: the ARRIVED depth, unchanged: `request.depth` in localFetch (already `parent + 1`,
  settle-placement.ts:79); `headers.depth` on the endpoint (read-composition-headers.ts:34-38 has
  already refused one above the cap). settlePlacement then dispatches children at `depth + 1`
  and refuses when `depth + 1 > limits.depth` (:109). Passing 0 here (compose.ts:57's default) is
  the recursion bug of 6.1.
- `path`: the arrived path plus this assembly's own identity: `[...request.path, identity(assembly.name, view)]`
  (compose/identity.ts:5-7). The endpoint knows its own name (create-server.ts:164) and extends
  with it. **[corrected]** No alias reaches a path in this rung: a page composes with `path: []`
  (compose.ts:58; register-pages.ts:70-81 passes none), the target is never on its own path
  (settle-placement.ts:80-81; DECISIONS:1532-1535), and the transport sends no `assembly-path` for
  an empty one (create-remote-transport.ts:125). The page's name for a remote (DECISIONS:1626-1628)
  would reach a path only when a server extends a path and then dispatches to a remote child, which
  local-only children never do. Each server extends with its own identity and checks against its
  own names.
- `query`, `params`: the parent's (request.query / headers.params): what services already get
  (render-local.ts:25; create-server.ts:183-184). See 1.6 for shaping.
- `headers`: `{}` for children. The forwarded headers exist only for a remote's declared keys
  (server/register-pages.ts:55-61) and for the credential test of the cache (placement-cache.ts:18);
  a local child with no plan reads neither.
- `limits`: `{ depth: maxDepth, maxBytes }`. Today two caps can disagree: register-pages.ts:70-81
  passes no `limits` to compose (DEFAULT_LIMITS, depth 8, compose/default-limits.ts:6) while the
  endpoint refuses on arrival at `options.maxDepth ?? 8` (create-server.ts:88, 141-144). A server
  started with `maxDepth: 3` dispatches to 8 and refuses arrivals above 3. The nested composer
  must take the server's cap; the page's compose should too (same change).
- `newId`: randomUUID; `now`: performance.now (as register-pages.ts:79-80).
- Return: `{ html, diagnostics }` not `string`. The children's diagnostics must reach a log (DESIGN
  12; register-pages.ts:96-105 logs every page placement that fell back; today nothing would log a
  nested child's fallback) and the hoist (3.3). localFetch returns AssemblyResponse
  (compose/assembly-response.ts:5-18), which has no room for them: add `nested?: readonly Diagnostic[]`
  to the ok branch and `children?: readonly Diagnostic[]` to Diagnostic (compose/diagnostic.ts:5-18),
  filled by settlePlacement from the answer, so the page's compose result is a tree.
- `signal`: see 6.3.

### 1.6 Depth and cycle: today and across two servers

- Depth 0 (a page): compose passes depth 0 (register-pages.ts:70-81 passes none; compose.ts:57), so
  a page's placements are dispatched at 1 (settle-placement.ts:79) and refused only when
  `1 > limits.depth`. The cap is reached by nesting alone.
- Arrival: read-composition-headers.ts:34-38 refuses `depth > maxDepth` (so 8 arrives at cap 8);
  :48-52 refuses a path longer than the cap; :53-57 a part not `name/view`. create-server.ts:162-172
  answers 400 when the path already holds the endpoint's own identity. Held by
  test/server/create-server.test.ts:188-194 and conformance/specs/contract/content.spec.mjs:68-75
  (**[corrected]** from 66-72).
- Page on A places parent on B, parent places child on B (the only shape this rung allows):
  A sends `assembly-depth: 1`, `assembly-path` absent (create-remote-transport.ts:124-125 sends the
  path only when non-empty; the page is not on it). B's endpoint accepts (1 <= cap). B's renderLocal
  composes with depth 1, path `[parent/default]` (B's own name). Child dispatched at depth 2, refused
  as "cycle" when it is `parent/default` (settle-placement.ts:110), refused as "depth" when
  `1 + 1 > cap`. A grandchild on B sees `[parent/default, child/default]`. Every refusal is B's own,
  before dispatch (DESIGN 3.4:263-271); the arrival refusal on B (create-server.ts:165) is the second
  line and never the one relied on. Correct, PROVIDED renderLocal passes the arrived depth and the
  extended path (1.5). A conformance spec can send `assembly-depth: <cap>` and
  `assembly-path: child/default` to B's parent endpoint and read the nested failed envelope with
  `reason` only in B's log (the envelope carries the id, fall-back.ts:36-44). **[corrected]** No
  spec can set B's cap: a CLI-built fixture has no depth setting anywhere (config/project-config.ts:12-23
  has none; the generated server is `createServer({ ...project, config })`,
  cli/src/commands/project-files.ts:26-30; only ServerOptions.maxDepth, server-options.ts:34, reaches
  create-server.ts:88; grep `maxDepth` in packages/cli and conformance: no hit). Both fixture
  servers run at 8. So the spec drives depth by header: `assembly-depth: 8` is accepted
  (read-composition-headers.ts:34 refuses only above the cap) and B's composer refuses every child
  at 9; through A's page it takes a real chain of nine on B. A config field for the cap is a surface
  change to record, not one to slip in.
- Services shaping a child's request (DESIGN 8:564-565, not ruled): the only shaping the directive
  can carry today is `view` (find-placements.ts:23,86), which a template view writes from data
  (`<assembly name="price" view="{{data.priceView}}">`) and a Slot would take as a prop. A child's
  own query is not expressible: the directive has no `query` attribute (an unknown attribute
  throws, :60-64), and AssemblyRequest.query (compose/assembly-request.ts:22) is the parent's.
  Note the standing asymmetry: locally a placement's services get the page's query
  (register-pages.ts:76 -> page-fetch -> local-fetch.ts:36 -> render-local.ts:25), over HTTP the
  transport sends none (create-remote-transport.ts:131-135; held by
  test/remote/create-remote-transport.test.ts:130,147,152, **[corrected]** from 147-148), while a deferred fill sends the page's
  `location.search` (client/fill-deferred.ts:29-30). assembly/data-input.ts:4 says "Its own query,
  and nothing of the page's". Decide before adding shaping: a `query` attribute (validated like
  params, read-composition-headers.ts:63-69 / compose/read-params.ts) would be "the child's own
  query", carried on the content URL over HTTP, and in the cache key (cache-key.ts:27,31). Record in
  DECISIONS whichever way; it is not in the sketch.

### 1.7 [added] Across two servers: what local-only children hold, and four edges

- Depth accumulates across the hop through real composition: A's page sends 1, B composes at 1,
  B's children go at 2 (1.6). A parent's depth refusal across two servers is real.
- A cycle cannot span servers with local-only children: every path starts on B with B's own
  identity (1.5), as A's page sends none. B's parent refusing `P -> Q -> P` on B is a parent's cycle
  refusal in a two-server setup; a cycle that crosses servers (A's x places B's y places A's x)
  needs a remote child, which the sketch excludes. Under the sketch, the cross-server half of the
  ruling's "cycle refusal held across two servers" is held by a spec sending the headers an upstream
  composer would send, which the contract says is the internal behaviour exactly (DESIGN 2.1:70-72;
  vocab/composition-header.ts:7-9). Whether that is what the owner meant decides whether children
  may be remote; settle it before the conformance spec is written.
- A nested name that only the PAGE declared as a remote reaches the local Fetch (plan `{}`), which
  answers `status` "no assembly ... in this server" (local-fetch.ts:22-29): a nested fallback, never
  a transport call. No child can be deferred: deferral reads the plan (settle-placement.ts:45).
- A deferred parent composes one level shallower than the same parent rendered with the page: the
  fill sends `assembly-id` and `assembly-params` only (client/fill-deferred.ts:32-33), so the
  endpoint reads depth 0 (read-composition-headers.ts:30) where localFetch would pass 1. The fill
  should send `assembly-depth: 1`, which DESIGN 3.5:280-281 and fill-deferred.ts:11-14 ("as a
  placement rendered with the page is asked") already promise.
- The two transports agree for equal composition state: localFetch passes the request's depth,
  path and params; the transport sends the same (create-remote-transport.ts:122-127) and the
  endpoint reads them back (read-composition-headers.ts:26-72). The one input that differs is the
  query (1.6), and with nesting it reaches every child too.

## 2. The envelope, nested

- Server: renderEnvelope inserts `markup` verbatim (envelope/envelope-input.ts:12-16;
  render-envelope.ts:46-52); nothing in core scans a local view's markup, so a nested
  `<assembly-root>` is already legal there. Attributes are built from a fixed list and escaped
  (:19-35); the island script is `data-assembly="<id>"` (:37-40). A shadow assembly's markup goes
  inside `<template shadowrootmode="open">` (:46-51): a child inside a shadow parent is inside that
  template.
- Remote answers: remote/scan-fragment.ts accepts nested envelopes (only one at the TOP level,
  :85-86; refused inside SVG/MathML, :93); remote/mark-remote.ts:11-13,30-32 stamps EVERY envelope in
  the answer with `data-remote`, so a nested child from B is mounted by B's runtime
  (client/start.ts:45-47) and left by A's. A nested island is a `<script>`, read as raw text
  (scan-fragment.ts:104-112). Nothing breaks here.
- Browser order: client/find-envelopes.ts:13-15 is `querySelectorAll` in document order (outer
  before inner, test/client/find-envelopes.test.ts:9-20); start.ts:98-100 considers each;
  read-island.ts:17 reads only `script[data-assembly="<own id>"]` and removes it (:21), leaving a
  nested island for its own envelope (test/client/read-island.test.ts:54-60). **[corrected]** A
  double mount is stopped first by the island's removal, not the map: `mounted` is written only
  inside the scheduled run (start.ts:84), so a second `consider` before an `idle`/`visible` mount
  runs passes :37 and is stopped at :55-58 (no island left); after the run, :37 stops it. unmountAll is reverse order (:128-134, inner before outer;
  test/client/start.test.ts:57-61, 206-220). A deferred parent whose answer holds children is
  handled: start.ts:105-108 considers the filled envelope and every envelope inside it.
- What breaks:
  1. Shadow roots. `querySelectorAll` (find-envelopes.ts:14) and the fill's `findEnvelopes(filled)`
     (start.ts:107) do not enter a shadow root. A child placed by a parent with `shadow: true`
     (assembly/assembly-definition.ts:18; render-envelope.ts:46-51) is never found: never mounted,
     its island never removed. findEnvelopes must also walk `element.shadowRoot` of every envelope
     it finds (and the outer is mounted on `element.shadowRoot ?? element`, start.ts:80, so a child in
     the shadow is in the subtree the parent's framework hydrates).
     _(probe, shadow.html)_: `document.querySelectorAll("assembly-root")` finds 2 of 3, missing the
     child in the shadow parent; the child's own nested declarative shadow root does attach; and
     `child.closest("[data-remote]")` is `null` from inside the shadow root, so start.ts:42-44's "an
     envelope inside a remote's envelope came from that remote too, marked or not" holds only in the
     light DOM. In a remote shadow parent what keeps A's runtime off the child is the child's own
     stamp: mark-remote.ts:30-32 stamps every envelope, and scan-fragment.ts reads a `<template>`'s
     content as ordinary tags (`template` is in neither RAW_TEXT :12 nor REFUSED :15-17).
  2. Mount modes. "Outer before inner" (find-envelopes.ts:5-11) holds only for `load`
     (schedule-mount.ts:14-17). An outer `idle`/`visible` with an inner `load` mounts inner first,
     then the outer hydrates a subtree another framework already drives. Not new, but a nested
     placement makes it reachable from an author's declaration (assembly-definition.ts:12). Either
     defer a child's mount until its ancestors have mounted, or record it as a rule.
  3. Hydration of the Slot. Each hydrate hands `children: {}` (0 above); the Slot then renders
     `__html: ""` / `innerHTML: ""` against DOM holding the child's envelope. Whether a framework
     rewrites `innerHTML` during hydration differs per framework and is not verified here (no
     documentation read in this session; do not assert it). The sketch's collection (read the
     innerHTML of each `[data-assembly-slot]` before hydrating and pass it as `children`) makes the
     question moot in every framework: the Slot's value equals the DOM's serialisation, so there is
     no mismatch and nothing to rewrite. Two consequences: (a) the collected string includes the
     child's island `<script>` when the outer mounts first (the runtime removes it afterwards,
     read-island.ts:21), so a later re-render of the outer that changes the `children` prop would
     rewrite the slot, resurrecting the island and destroying the child's live root; `children`
     must be constant for the life of a mount, and a test should hold that an outer re-render with
     the same prop leaves the child's DOM nodes identical (`isSameNode`). (b) Collection must look
     in the hydrate's own root (`element.shadowRoot ?? element`) and must not cross into a nested
     envelope's own slots: `:scope [data-assembly-slot]` would find a grandchild's slot too; collect
     only slots whose nearest `assembly-root` ancestor is this envelope.
     _(probe, slot.html)_: from the outer envelope `querySelectorAll("[data-assembly-slot]")` finds
     3, the grandchild's slot included. A slot's `innerHTML` is the DOM's serialisation, not the
     server's bytes: a shadow child's `<template shadowrootmode>` is absent (attached, not
     serialised), `title='x'` comes back `title="x"`, `&#39;` comes back `'`. So "byte-identical" in
     the sketch holds as "equal to what the DOM serialises at collection time", which is the value a
     framework would compare against; a test compares the client prop with `innerHTML`, never with
     the server string.
  4. Svelte and Lit have no Slot (and nothing in the repository shows their raw form, 0). The browser
     half must still produce byte-equal output: the same collection applies, keyed by whatever
     marker those views emit. Today they emit no `[data-assembly-slot]`, so there is nothing to
     collect from: a Svelte or Lit parent needs a Slot (or a documented wrapper) in this rung, or
     is out of it. Decide and record.
  5. `data-failed` outer (start.ts:41): skipped entirely, so children inside a fallback envelope are
     never mounted. Fine, since a fallback's markup is the page's (fall-back.ts:36-44, no children).
  6. **[added]** A child placed where the parser closes its container. _(probe, shadow.html)_:
     `<p><assembly-root ...><div>block</div></assembly-root></p>` parses as
     `<p><assembly-root ...></assembly-root></p><div>block</div><p></p>`: the child's markup lands
     outside its envelope. Locally that is what ships. Over HTTP, A's scanner refuses B's whole
     parent answer for the same markup (start-tag-refusal.ts:59-65, "a <div> inside an open <p>"),
     so the parent falls back `invalid` on A while it renders split on B: the transports disagree
     (DESIGN 3.1:192-195). One fix keeps them equal: when a view placed a child, renderLocal reads its
     own envelope with scanFragment (remote/scan-fragment.ts:36) and throws on a refusal, so both
     answer the parent's failure. (A page template has the same hazard today, but there a local and a
     remote placement break alike, since the scanner reads a fragment out of its context.)

## 3. The data boundary

- The content endpoint (create-server.ts:157-208) and localFetch (local-fetch.ts:32-38) both call
  renderLocal; composing children inside it changes what BOTH answer, identically: the parent's
  envelope with every child's envelope spliced where the directive stood, each child's own island
  inside its own envelope. That is DESIGN 5.3:389-397 ("never the rendered bytes of child
  assemblies" in the island: the children are in the DOM, not the island) and
  island/island-payload.ts:8-9. projectIsland (envelope/project-island.ts:13-22) names six fields
  and is untouched.
- The data endpoint (create-server.ts:213-226) calls resolveData only (server/resolve-data.ts:25-50)
  and stays as it is: the parent's `/api/` answers the parent's data, which is what its island
  carries. A child's data is its own `/api/`. No drift: still one function (render-local.ts:25).
- Nested failures over HTTP: a child that falls back inside the parent is a 200 for the parent
  (the parent rendered), its failed envelope inside with its correlation id (fall-back.ts:43). The
  parent's `data-failed` is for the parent alone. B must log the nested diagnostics (1.5: renderLocal
  returns them, the endpoint logs them as register-pages.ts:96-105 does).
- The manifest (server/build-manifest.ts:32-39; DESIGN 2.3:94-123) names the parent's own assets
  (:33-36) and nothing about children. A framework view's children are known only at render
  (Slot calls in JSX), a Pug view's too (Pug writes `assembly(name="x")`, not the literal tag), so
  the manifest cannot list children statically without a declaration beside the view, which the
  ruling did not add. Recommendation: the manifest says nothing about children. What a consumer
  needs (3.3) it can learn from the envelopes it already scans.

### 3.3 Hoisting, the real gap

register-pages.ts:106-115 hoists css/js per `diagnostic.name` of the PAGE's placements only, and
`opensRuntime` (server/opens-runtime.ts:12-22) and the deferral rule (placement-problems.ts:60-64)
read page placements only. So:

- A local child's scoped stylesheet (generate-registry.ts:80-90) is never linked: unstyled child.
- A static html parent with a framework child, on a page with no other browser half, links no
  runtime (generate-registry.ts:77-78,87: `js` only when the assembly has a browser half): the child
  never mounts. The js is one client entry per build, so with any browser half on the page it is
  already there; the css is per assembly and never is.
- Remote: A hoists what B's manifest for the PARENT says (register-pages.ts:110,
  create-remote-transport.ts:87-90): B's child's css never reaches A's page; B's runtime script
  reaches it only if the parent itself has a browser half.
  Fix within the contract: (local) hoist for every diagnostic in the tree (1.5), which also fixes
  `opensRuntime` once it can see nested local names; (remote) the transport already walks every
  `assembly-root` tag in the answer (mark-remote.ts:27-32) and can read each nested envelope's
  `data-name`/`data-view`, then `learn` (create-remote-transport.ts:64-84) each child's manifest at
  `origin/assembly/<name>/<view>/manifest/` once per version, and `assets(url)` (:87-90) answers the
  union. No new header, no manifest field; DESIGN 2.3 "once per version" holds per assembly. A
  nested remote name an attacker's data could forge (an author's raw write, 6.2) only makes A fetch a
  manifest from an origin it already declared and link files from that origin (read-manifest.ts:52-62,
  **[corrected]** from 48-58, keeps only same-origin urls), which is what the parent's manifest may do
  already.
- **[added]** `version` is one per server, not per assembly (create-server.ts:87, sent at :206), so
  the parent's `assembly-version` is its nested children's too, and learning each nested manifest
  "once per version" keys correctly in `learn`'s per-url map (create-remote-transport.ts:64-65). A
  nested `data-name`/`data-view` must pass the segment shape (parse-content-url.ts:238) before a
  manifest url is built from it: it is an attribute a raw write in a B view could forge.
- **[added]** A non-shadow child inside a shadow parent is unstyled. The parent's root links only the
  parent's own sheet (render-local.ts:35; render-envelope.ts:49-51), and a page-head sheet does not
  reach into a shadow root (DESIGN 10:640-641). _(probe, style.html)_: the child's scoped rule in the
  page head leaves it `rgb(0, 0, 0)`; the same scoped rule linked inside the parent's root applies
  (`rgb(255, 0, 0)`), since the child's envelope is inside that tree (unlike the host case
  DECISIONS:824-826 found). Fix in renderLocal: a shadow parent's root also links each non-shadow
  local child's scoped sheet (needs the nested diagnostics and the assemblies map). A shadow child
  carries its own sheet wherever it sits.

## 4. Caching

- A page placement with a lifetime caches the parent's whole envelope, children inside
  (settle-placement.ts:96 writes `answer.html`). **[corrected]** Not "already true today" for a
  remote parent: no assembly has children today; it becomes true once B composes before answering. Right by DESIGN 3.2:223-226 (the cache holds a placement's
  answer) and by render-local.ts:7-12 (a local placement answers what the endpoint answers).
- Key: no change needed. The children are a function of the parent's identity, query, params
  and forwarded headers (cache-key.ts:17-34), which the key already carries; a child's view chosen
  by the parent's service is a function of the same inputs. A child's own query (1.6, if added) is
  chosen by the parent and so is also a function of them.
- The children inherit the parent's lifetime and are never cached on their own (no plan,
  placement-cache.ts:17-18). A child that was refused or fell back is cached INSIDE a good parent
  for the lifetime: today a refused page placement is never cached (settle-placement.ts:62-65,
  fall-back.ts:26), but a nested refusal is just bytes in the parent's html. Either accept it
  (record: "a parent's lifetime covers its children's failures") or have settlePlacement decline to
  write when the answer's nested diagnostics carry a reason. Recommend the latter: it is one
  condition at settle-placement.ts:96 once `nested` exists (1.5), and it keeps "caches nothing on
  failure" (DESIGN 2.1:54-55) true for the subtree.
- **[added]** Over HTTP A cannot see B's nested diagnostics: B answers 200 and no header says a child
  fell back. A rule taken from local diagnostics alone makes the same parent cache differently local
  and remote (DESIGN 3.1:192-195). Take it from the markup, which both transports have: an answer
  holding a nested `assembly-root[data-failed]` is not written. mark-remote already visits every
  envelope start tag (mark-remote.ts:27-32) and can report it; for a local answer the same reading
  of renderLocal's output, or `nested`, gives the same verdict.
- `version` on a cached entry (content-cache.ts:4-8, **[corrected]** from 3-7) stays the parent's.

## 5. The html renderer and a directive in a static view

There is no html renderer module in core: an html view is `markup: () => <string>`
(generate-registry.ts:72), rendered through the same `declared.markup` call (render-local.ts:26).
So nothing in a renderer changes: renderLocal's composer finds the literal directive in the
returned string and splices the child, exactly as a page template is treated. What should change:

- Boot/`check`: a page's directives are read at boot (server/page-problems.ts:59-67,
  placement-problems.ts:28-36: unknown name or view refused). An html, EJS, Handlebars or Nunjucks
  view's source holds the directive literally and can be read the same way at boot (a Pug or
  framework view cannot). Recommend: scan static sources for directives at boot and in `check`
  for a name with no assembly behind it, refusing a `view` the child lacks and a self-placement
  (`name` equal to the assembly's own, a cycle at the first hop); render time stays the gate for the
  rest.
- Markdown: `html: false` makes the directive text (load-markdown.ts:12); matches B-17.
- **[added]** A data-driven `view` (`<assembly name="price" view="{{data.priceView}}">`) is escaped by
  the engine and then held to the segment shape (find-placements.ts:91-96); a value outside it
  throws, which fails the PARENT (local-fetch.ts:40-48 answers `status`; the endpoint answers 500,
  create-server.ts:186-201), not the child. Record that a service shaping a child badly fails its
  parent, on both transports alike.
- **[added]** A static html view with a `.client.ts` (generate-registry.ts:77-79) mounts on its own
  envelope; whatever its script does to the subtree also reaches the child's envelope inside it.
  The author's, as DESIGN 10:639-641 already says of styles; state it beside the directive.

## 6. Risks

### 6.1 Infinite recursion

renderLocal -> compose -> local Fetch -> renderLocal is bounded by exactly two lines:
settle-placement.ts:109 (depth) and :110 (cycle). compose.ts:57-58 default `depth` to 0 and `path`
to `[]`, so a renderLocal that forgets either composes a self-placing view at depth 0 with an empty
path on every level: no refusal, an unbounded async chain, and no signal to stop it (6.3). The page
still answers at its deadline (race, :151-173) while the server keeps rendering. Hold it with: a
view placing itself answers one nested failed envelope with reason "cycle" and renders exactly
once (count the markup calls, with a test timeout); a chain `a -> b -> a` answers "cycle" at the
third hop; a straight chain longer than the cap answers "depth" at the cap and renders cap+1 times.
Watch each red by mutating renderLocal to pass `depth: 0` and by dropping the path extension.
Make `depth` and `path` required on the nested call site (a type, not a default).

### 6.2 A directive in visitor data

Trace of every position (DESIGN 5.4:399-413):

- Envelope attributes: escapeAttribute (encode/escape-attribute.ts:9-16) turns `<` to `&lt;`; the
  island: encodeIslandJson :15-21 writes `<` as the JSON escape backslash-u003c (**[corrected]**:
  the first writing lost the backslash). Neither can hold a `<assembly`.
- Renderer text: every framework escapes text; each template engine escapes `data`
  (load-handlebars.ts:6-8, load-nunjucks.ts:14, load-ejs.ts:6-7, load-pug.ts:6-7, **[corrected]**
  for the last two); Markdown shows
  HTML as text. The html view has no data.
- The explicit raw forms (`<%- %>`, `!=`, `{{{ }}}`, `| safe`, `{@html}`, `unsafeHTML`,
  `dangerouslySetInnerHTML`) are the author's one raw mechanism (DESIGN 7:463-464). An author who
  writes a visitor's string raw already hands the visitor the page. What the composer ADDS on
  that path: a visitor's `<assembly name="x">` places any local assembly `x` inside the parent,
  with the parent's query and params (or, with an unknown attribute, throws at
  find-placements.ts:60-64 and fails the parent's render into its fallback). Containment: a
  nested child is local, has no policy, no url, no credential, and answers what its public content
  endpoint answers to anyone (DESIGN 2.1:70-72); the one difference is that localFetch does not
  pass the access hook (access/register-access.ts:23-45 is an HTTP hook), so a page listed in
  `publicRoutes` (create-server.ts:115-118) could compose an assembly whose endpoint is not public.
  That is already true of every local page placement today; record it, do not design around it.
- Fallback markup (`plan.fallback`) and the deferred placeholder's `<template data-fallback>`
  (settle-placement.ts:56-57) are the page author's. A nested child has no plan, so no fallback.
- Recommendation: no second scanner. Keep find-placements as the one reader; the composer runs
  over the view's markup only (not the envelope); a directive the view wrote from a visitor's
  raw string is the author's raw write, and DESIGN 7's sentence already names it.

### 6.3 Limits, deadlines, signals

- maxBytes: each nested answer is measured by the composing level (settle-placement.ts:91-94); the
  parent's whole envelope is measured again by the page's compose, and over HTTP by readCapped
  (remote/read-capped.ts:25-28). A parent of N children each under the cap can exceed it as a
  whole and falls back as "too-large" after all N rendered. Consistent, bounded, wasteful; the cap
  is DEFAULT_LIMITS.maxBytes on both transports (create-server.ts:244).
- Deadlines: a child's default deadline is DEFAULT_DEADLINE each, independent of the parent's.
  The page's race answers at the parent's deadline (settle-placement.ts:88) and aborts the
  controller (:163), but localFetch ignores `request.signal` (local-fetch.ts:32-38 pass none) and
  renderLocal has no signal: nested work continues after the page gave up, up to cap x 3000 ms.
  Add `signal` to ComposeOptions and SettleInput and compose children under
  `AbortSignal.any([parent, own])`; services cannot be cancelled, but no further child is
  dispatched once the parent's signal is aborted (check it before `call`).
- **[added]** DESIGN 3.3:250-252 enforces a deadline "so a slow remote is actually cancelled, not
  merely ignored while it keeps a socket and a request context alive"; nested local work that
  ignores the signal is that case in process.
- Depth cap disagreement between the composer and arrival (1.5, limits).
- compose-options.ts:24 says "Ancestor ids"; the path is identities (assembly-request.ts:14-21).
  A doc drift to fix in passing.

### 6.4 [added] The scanner meets runtime output for the first time

- A page's template is the author's static text (register-pages.ts:71). renderLocal's composer reads
  a view's RENDERED markup, data in it: the first time find-placements meets runtime values.
- Escaped positions are safe because every renderer escapes `<` in text, held in conformance
  (DECISIONS:1485-1488), and the attribute encoder escapes `<` (escape-attribute.ts:14).
- In a raw position, any `<assembly` followed by whitespace, `/` or `>` that is not exactly a
  directive throws (find-placements.ts:49-54, 60-64, 67-71, 75-85, 91-96): a visitor's string there
  fails the parent rather than placing anything, the safer of the two outcomes 6.2 names.
- Only comments are skipped (:17, :48). A directive inside `<script>`, `<style>`, `<textarea>` or
  `<title>` in a view's markup is placed, and the child's island `</script>` then ends an enclosing
  script early. Hold it with a test, or skip raw-text elements as comments are skipped.

### 6.5 [added] Breadth is unbounded

Limits holds depth and maxBytes only (limits.ts:5-10). A view placing N children renders N, each with
its own DEFAULT_DEADLINE (default-deadline.ts:8), and a chain multiplies: C children per level to the
cap is C to the power of the depth renders for one request, bounded in time only by the page's
race. An author's view is trusted to place what it places; a raw write of visitor data is the one way
a visitor adds placements (6.2). Record a breadth cap per render, or record its absence.

### 6.6 [added] Placement context

2, item 6: a directive placed inside `<p>` (or wherever the parser closes a container) splits the
child from its envelope locally and fails the parent over HTTP.

## 7. Files to change, the tests that hold each, the mutations to watch

Core (test/ mirrors src/: one `.test.ts` per file, same path).

| src                                                                         | change                                                                                                                                                                                                                                    | test                                                                                                                     | watched red by                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| server/render-local.ts                                                      | takes the composition state and a Fetch; composes the view's markup with depth as arrived, path extended by own identity, plan `{}`, headers `{}`, the server's limits, signal; returns `{ html, diagnostics }`                           | test/server/render-local.test.ts                                                                                         | self-placing view -> one nested "cycle" envelope, one render (mutate: depth 0 / path not extended -> hangs or recurses); chain past cap -> "depth" at the cap; a directive in an html view's string is spliced; a view's `data` holding `<assembly name="x">` escaped is NOT placed; child failure is a nested failed envelope with an id and the parent is still 200-shaped; `children` handed to the view is `{}` on the first pass (the mechanism renders once) |
| server/local-fetch.ts                                                       | builds the Fetch closure that hands itself to renderLocal; carries `nested` diagnostics; passes `request.signal`                                                                                                                          | test/server/local-fetch.test.ts                                                                                          | nested diagnostics present on the ok answer (mutate: dropped); a child of a child reaches depth 3 on the request it sees                                                                                                                                                                                                                                                                                                                                           |
| server/create-server.ts                                                     | content endpoint uses the one local Fetch, page from headers or fresh, logs nested diagnostics; limits carry `maxDepth`; page compose gets the same limits                                                                                | test/server/create-server.test.ts                                                                                        | parent endpoint with `assembly-path: child/default` answers 200 with the child refused inside (mutate: path not passed -> child renders); `assembly-depth: <cap>` -> child refused "depth"; nested failure's id appears in the log (mutate: not logged); a server with `maxDepth: 2` refuses at 2 from its own composer                                                                                                                                            |
| server/register-pages.ts                                                    | hoist assets over the diagnostic tree; log nested fallbacks                                                                                                                                                                               | test/server/register-pages.test.ts                                                                                       | a page with a static parent and a framework child links the child's css and the runtime (mutate: tree not walked)                                                                                                                                                                                                                                                                                                                                                  |
| server/opens-runtime.ts, placement-problems.ts                              | runtime presence counts nested local browser halves where boot can see them (static sources)                                                                                                                                              | their tests                                                                                                              | a page of one static html parent placing a React child defers nothing wrongly / opens the stream                                                                                                                                                                                                                                                                                                                                                                   |
| compose/compose-options.ts, settle-input.ts, settle-placement.ts            | `signal`; `nested` from the answer into `Diagnostic.children`; decline the cache write when the subtree carries a reason                                                                                                                  | test/compose/{compose-options,settle-input,settle-placement}.test.ts                                                     | aborted parent signal -> no child dispatched (mutate: signal ignored); cache not written for a parent whose child fell back (mutate: written)                                                                                                                                                                                                                                                                                                                      |
| compose/diagnostic.ts, assembly-response.ts                                 | `children?` / `nested?`                                                                                                                                                                                                                   | their type tests                                                                                                         | compile-time                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| compose/compose.ts                                                          | `limits` required from the server, no change to defaults otherwise; (optional) refuse a nested call with no `depth`/`path` by type                                                                                                        | test/compose/compose.test.ts                                                                                             | depth passed down is the arrived depth + 1 (:147-160 already holds depth 2 -> 3, the nested case; **[corrected]** not the page case)                                                                                                                                                                                                                                                                                                                               |
| client/find-envelopes.ts                                                    | walk `shadowRoot` of each envelope found, document order kept                                                                                                                                                                             | test/client/find-envelopes.test.ts                                                                                       | a child in a declarative shadow root is found after its parent (mutate: not entered)                                                                                                                                                                                                                                                                                                                                                                               |
| client/start.ts                                                             | consider envelopes under shadow roots; (decide) mount order under `idle`/`visible`                                                                                                                                                        | test/client/start.test.ts                                                                                                | shadow child mounted once, its island removed; outer `visible` + inner `load`: whichever rule is chosen, held                                                                                                                                                                                                                                                                                                                                                      |
| client/fill-deferred.ts                                                     | none expected; test that a filled parent's children in its shadow are considered (after find-envelopes change)                                                                                                                            | test/client/fill-deferred.test.ts                                                                                        | mutation: fill considers only light-DOM envelopes                                                                                                                                                                                                                                                                                                                                                                                                                  |
| remote/create-remote-transport.ts (+ mark-remote.ts returning nested names) | learn nested envelopes' manifests once per version; `assets` answers the union                                                                                                                                                            | test/remote/{create-remote-transport,mark-remote}.test.ts                                                                | an answer with a nested envelope learns two manifests (mutate: only the parent's); a nested name from another origin is never fetched                                                                                                                                                                                                                                                                                                                              |
| server/build-manifest.ts                                                    | none                                                                                                                                                                                                                                      |                                                                                                                          |                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| envelope/*                                                                  | none                                                                                                                                                                                                                                      | test/envelope/render-envelope.test.ts: a nested envelope string survives verbatim (already implied by "markup verbatim") |                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| server/render-local.ts (more, **[added]**)                                  | refuse a view placing one name twice (0.1); a shadow parent links its non-shadow children's scoped sheets in its root (3.3); (option) read its own envelope with scanFragment when it placed a child (2, item 6)                          | test/server/render-local.test.ts                                                                                         | two `<assembly name="x">` in one view -> the render throws (mutate: refusal removed -> two envelopes, one key); shadow parent with a plain child -> the child's `<link>` inside the parent's `<template shadowrootmode>` (mutate: parent's css only); a child inside `<p>` -> the render throws (mutate: scan skipped -> a split DOM shipped)                                                                                                                      |
| vocab/ new file (e.g. placement-name.ts), **[added]**                       | the one segment shape `^[a-z][a-z0-9-]*$`, today copied at find-placements.ts:21 and parse-content-url.ts:238, and needed by every Slot and by nested-manifest learning (3.3); vocab is browser-shareable (.dependency-cruiser.cjs:57-72) | test/vocab/<file>.test.ts                                                                                                | `price-2` accepted; `Price`, `x"y`, `a/b`, `../x` refused (mutate: anchor dropped)                                                                                                                                                                                                                                                                                                                                                                                 |
| assembly/markup-input.ts, renderer/render-input.ts, **[added]**             | the comments, or the field, per 0.1                                                                                                                                                                                                       | their type tests; render-local.test                                                                                      | a server render's view receives `children: {}` and its directive is spliced (mutate: children filled -> double markup)                                                                                                                                                                                                                                                                                                                                             |
| client/fill-deferred.ts, **[added]**                                        | send `assembly-depth: 1` (1.7)                                                                                                                                                                                                            | test/client/fill-deferred.test.ts                                                                                        | the fill's request carries depth 1 (mutate: header dropped)                                                                                                                                                                                                                                                                                                                                                                                                        |
| remote/mark-remote.ts, **[added]**                                          | report a nested `data-failed` envelope (4) and nested `data-name`/`data-view` (3.3)                                                                                                                                                       | test/remote/mark-remote.test.ts                                                                                          | a failed nested envelope is reported (mutate: only the outer read); a nested name `../x` yields no manifest url                                                                                                                                                                                                                                                                                                                                                    |
| compose/find-placements.ts (option), **[added]**                            | skip raw-text elements as comments are skipped (6.4)                                                                                                                                                                                      | test/compose/find-placements.test.ts                                                                                     | a directive inside `<script>` is not a placement (mutate: skip removed)                                                                                                                                                                                                                                                                                                                                                                                            |
| vocab/*, compose/find-placements.ts                                         | none unless `query` shaping is ruled (then: ALLOWED, placement.ts, assembly-request.ts, cache-key.ts, create-remote-transport.ts url, read-composition-headers.ts)                                                                        | test/compose/find-placements.test.ts                                                                                     | `<assembly-root>` is not a directive (add if absent); a directive in a view's comment is skipped                                                                                                                                                                                                                                                                                                                                                                   |

Renderer packages (not core, listed for the orchestrator): each `client/slot.ts` emits the
directive when `children[name]` is absent and the collected HTML when present; each
`client/hydrate.ts` collects `[data-assembly-slot]` innerHTML under its own root before hydrating
(constant for the mount); Svelte and Lit need a decision (2.4). Tests: `test/client/slot.test.*`
hold "absent -> directive, present -> verbatim"; `test/client/hydrate.test.*` hold "hydrating a
parent leaves the child's nodes the same nodes" (mutate: `children: {}` -> child DOM replaced).
renderer-templates needs nothing: the raw forms already write children.

Conformance: a `nested` fixture (local parent and child in every static and framework kind; a
parent in a shadow root; a self-placing view; a chain past the cap) and, in `remote`, a producer
parent that places a producer child, placed by the consumer's page: the child's css linked on the
consumer's page, both envelopes `data-remote`, and the parent endpoint refusing a child by path and
by depth with the headers the consumer sends. Each watched red on: path not extended, depth passed
as 0, nested manifests not learned, shadow not entered. **[added]** Depth by header or by a real
chain, never by a cap (1.6: no fixture can set one). A nested failure's id must be found in the
producer's log, as every failure spec finds its id (DECISIONS:1540-1542), so the spec lands only with
nested logging (1.5). The cycle spec's reach across servers waits on 1.7's question.

Docs: DESIGN 2.4 (a served fragment MAY hold envelopes), 3.4 (a parent extends the path with its
own identity; the composing server's cap is the one that refuses), 7 and 8 (the directive and the
Slot, the name as the key, children constant per mount), 10 (already says a nested assembly sits
inside its parent's envelope, :639-641); DECISIONS entries for: hoisting through the tree and
nested manifests, cache of a parent with a failed child, mount order under `idle`/`visible`, the
Svelte/Lit slot, query shaping (1.6), the two caps, the public-page/in-process composition note (6.2).

## 8. Found in passing, not this rung's

- Two depth caps (1.5). - Page query reaches local services, not remote ones, and the deferred fill
  sends it (1.6). - compose-options.ts:24 wording. - find-envelopes and shadow roots (2) is a latent
  bug already for any envelope the page's template puts inside a shadow assembly by hand.
- **[added]** CLAUDE.md's Packages line says core holds "HTML and WebComponents renderers"; nothing in
  packages/core/src names one (grep `"html"` there: no hit). - DESIGN 7:458-459's Markdown nesting
  against B-17 (0.1). - start.ts:42-44's comment stops at a shadow boundary (2, item 1). - CLAUDE.md
  names a Chromium at `~/.cache/ms-playwright/chromium-1243/...`, absent in this container;
  `/opt/pw-browsers/chromium-1194` is the one present. - ProjectConfig has no depth cap, so DESIGN
  2.1:63's "a server refuses above its cap" is 8 for every CLI-built project.
