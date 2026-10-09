# Reader memo: the renderer packages and the browser runtime's contract, for the subassembly rung

Read-only. Branch `next` at 1210023. Every claim below has a file and line behind it; the
framework claims are from the installed packages in `node_modules/.pnpm` (react-dom 19.2.8,
preact 11.0.0, solid-js 1.9.15, vue 3.5.43, svelte 5.57.0, lit-html 3.3.3, @lit-labs/ssr 4.1.0,
@lit-labs/ssr-client 1.1.8), not from memory. Two probes were run and their output is quoted.

Governing text: DECISIONS.md:1499 (open entry), DECISIONS.md:2038 and the bullet "A subassembly
is placed by a directive in the view's markup"; TODO.md:321-324; DESIGN 3.4 (depth and cycles
before dispatch), DESIGN 7 (`children` as strings, DESIGN.md:446, 458-459, 463-464), DESIGN 8
("services run before children are fetched", DESIGN.md:564-565).

## 0. What exists today, in one paragraph

No assembly can place another. `renderLocal` hands the view `children: {}`
(core/src/server/render-local.ts:26) and composes nothing; `localFetch` passes neither depth
nor path nor page into it (core/src/server/local-fetch.ts:32-38); the content endpoint reads
`assembly-depth`/`assembly-path` only to refuse a cycle on arrival (create-server.ts:164-172) and
then calls the same `renderLocal` with id, query, params (create-server.ts:179-185). The composer
already takes `depth` and `path` (compose.ts:57-58), increments depth per hop
(settle-placement.ts:79), sends the ancestors alone (settle-placement.ts:81), and refuses depth
and cycle before dispatch (settle-placement.ts:107-112). The directive finder is a regex over
text (find-placements.ts:13-16), ignores a directive inside a comment (17, 48), allows only
`name` and `view` in double quotes (22-23), and accepts `<assembly name="x"></assembly>` and
`<assembly name="x"/>` (49). Every framework renderer but Svelte and Lit exports a `Slot` that
renders `<div data-assembly-slot=NAME>` with the child's HTML inserted raw, and every hydrate half
mounts the view with `children: {}`. No example and no conformance fixture uses a Slot or
`children`; the only nested-island test in the tree is Solid's
(renderer-solid/test/client/hydrate.test.tsx:91-110, fixture nested-markup.ts:12-16).

## 1. The six framework renderers: what Slot renders, what hydrate passes, what a mismatch does

Columns: server Slot / client Slot / hydrate's props / hydration with the envelope in the slot
and "" on the client / re-render with an unchanged value / raw-HTML mechanism verified at.

### React (`renderer-react`)

- Slot: `createElement("div", { "data-assembly-slot": name, dangerouslySetInnerHTML: { __html: children[name] ?? "" } })`, same code both sides (src/client/slot.ts:20-23). Server writes `__html` raw: react-dom-server.node.production.js:1051-1052 (`target.push("" + innerHTML)`).
- hydrate: `hydrateRoot(element, <Provider><component data children={{}}/></Provider>)` (src/client/hydrate.ts:19-28, `children: {}` at 26).
- Hydration, envelope inside the slot, client `__html: ""`:
  - Production: no comparison and no DOM write. `prepareToHydrateHostInstance` (react-dom-client.development.js:5249-5333, same shape in production at :2748) only wires listeners and checks TEXT children. Tail nodes inside the element are not deleted and no mismatch is thrown because `popHydrationState` (5352-5377) skips the check when `shouldSetTextContent` is true, which it is for any non-null `dangerouslySetInnerHTML.__html` (22117-22127). So the child's envelope survives.
  - Development: `diffHydratedProperties` (21361) compares `domElement.innerHTML` with `normalizeHTML(__html)` and records a difference (21501-21508); the only effect is one `console.error` "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up" (5440). The whole switch is skipped when `props.suppressHydrationWarning === true` (21479). The built example bundles production React (no dev-only string in `examples/frameworks/dist/client/*`; `bundle-client.ts:56` minifies, esbuild then defines `NODE_ENV=production`), so the browser proof does not see this warning; `suppressHydrationWarning: true` on the slot div is still the right fix for authors running a development bundle.
- Re-render, unchanged value: DEFECT. `updateProperties`' generic element loop compares the prop values by identity, `_propKey8 === propKey` (21122-21127; production 13611-13620), and `setProp` for `dangerouslySetInnerHTML` then assigns `domElement.innerHTML = key` (20156-20169; production 13074/13288). The current Slot builds a fresh `{ __html }` object on every render, so any state change in a React parent rewrites the slot's innerHTML and destroys the child island (its live nodes, its listeners), even when the string is unchanged. The Slot must hold an identity-stable object (a module-level cache keyed by name, or `useMemo` on the string). Preact's comparison is by string; React's is not.

### Preact (`renderer-preact`)

- Slot: `h("div", { "data-assembly-slot": name, dangerouslySetInnerHTML: { __html: children[name] ?? "" } })` (src/client/slot.ts:20-23). Server writes raw: preact-render-to-string src/index.js:680-681, 744.
- hydrate: `hydrateInto(h(Provider, { value }, h(component, { data, children: {} })), element)` (src/client/hydrate.ts:17-24).
- Hydration: props are not diffed and innerHTML is not written while hydrating: preact/src/diff/index.js:634-635 ("During hydration, props are not diffed at all (including dangerouslySetInnerHTML)"), 656-664 (`!isHydrating && (...)` guards `dom.innerHTML = newHtml.__html`). The envelope survives.
- Re-render: `newHtml.__html != oldHtml.__html && newHtml.__html != dom.innerHTML` (661) — an unchanged string never writes. Safe as is.

### Solid (`renderer-solid`)

- Slot: `createComponent(Dynamic, { component: "div", get "data-assembly-slot"() {...}, get innerHTML() { return props.children[props.name] ?? "" } })` (src/client/slot.ts:18-26). Server: `ssrElement` writes an `innerHTML` prop raw (solid-js/web/dist/server.js:495-504, raw at 504); the div carries a `data-hk` (nested-markup.ts:13).
- hydrate: `hydrateInto(() => Provider{ component({ data, children: {} }) }, element, { renderId: context.id })` (src/client/hydrate.ts:40-50); the server prefixed keys with the placement id (src/server/render-to-markup.ts:36). Keys are gathered by prefix, `key.startsWith(root)` (web.js:655-662); a child's keys start with the child's uuid, never the parent's, so neither claims the other's nodes. Already held either mount order by hydrate.test.tsx:93-110.
- Hydration: `assignProp` returns early for a child property while hydrating: `else if (isHydrating(node)) return value;` (web.js:468; `innerHTML` is a ChildProperty, web.js:25; `isHydrating` 425-427). The envelope survives.
- Re-render: `if (value === prev) return prev;` (web.js:439). The Slot's getters read a plain object, so the render effect never re-runs anyway. Safe as is.

### Vue (`renderer-vue`)

- Slot: `defineComponent` rendering `h("div", { "data-assembly-slot": props.name, innerHTML: props.children[props.name] ?? "" })` (src/client/slot.ts:13-23). Server writes raw: @vue/server-renderer server-renderer.cjs.js:616-618 (`push(props.innerHTML)`).
- hydrate: `createSSRApp(component, { data, children: {} })`, `provide(EVENTS_KEY)`, `mount(element)` (src/client/hydrate.ts:16-20).
- Hydration: `hydrateElement` walks children only for a vnode with array children and no innerHTML (runtime-core.cjs.js:2148-2149); the Slot's vnode has no children, so neither the "more child nodes than client vdom" removal (2158-2169) nor the text branch runs. The prop loop patches only `value`/`indeterminate` on input/option, `on*` listeners, `.`-prefixed props, custom elements and `dynamicProps` (2203-2210); `propHasMismatch` checks class, style and known attributes only (2398-2470). `innerHTML` is neither compared nor written. The envelope survives.
- Re-render: `next !== prev` on the string (5905, 5977) → no `patchDOMProp` (runtime-dom.cjs.js:583-588). Safe as is.

### Svelte (`renderer-svelte`): no Slot export

- What it has: nothing in the package; a view writes `<div data-assembly-slot="x">{@html children.x}</div>` (the `children` prop is passed on both sides: src/server/render-to-markup.ts:23-25, src/client/hydrate.ts:17-20, `children: {}` at 19).
- Server `{@html}`: `'<!---->' + html + '<!---->'`, the opening comment carrying a hash of the value in DEV (svelte/src/internal/server/blocks/html.js:7-11).
- Client `{@html}` (svelte/src/internal/client/dom/blocks/html.js):
  - value `""` while hydrating: the effect sees no change from its initial `''` (75-78), calls `hydrate_next()` once and returns. The server's nodes stay in the DOM, unclaimed; nothing is written. When `{@html}` is the element's sole child (`is_controlled`, decided at compiler fragment.js:103-111) a LATER non-empty value would set `parent_node.innerHTML` (80-94) and destroy the child; a value that stays `""` never does.
  - value non-empty while hydrating: walks the SIBLINGS from the opening comment to the first empty comment and claims them without reading the value (103-131, loop 112-118; "We're deliberately not trying to repair mismatches"); comments inside the child's envelope are descendants, not siblings, so a Svelte child's own markers do not end the walk. DEV only: `check_hash` warns `hydration_html_changed` when `hash(value)` differs from the opening comment's hash (26-40, 125-127).
  - re-render with an unchanged value: `value === (value = get_value())` → return (75-78). Safe.
- Which value the client passes decides everything: `""` leaves the nodes unowned (then any later change wipes them), the server's own string claims them cleanly with no warning. See 2.

### Lit (`renderer-lit`): no Slot export

- What it has: `AssemblyProps` carries `children` and `events` as plain props to a template function (src/props/assembly-props.ts:14-18); a view would write `html\`<div data-assembly-slot="x">${unsafeHTML(props.children.x)}</div>\``. hydrate: `hydrateLit(view({ data, children: {}, events }), container)` (src/client/hydrate.ts:19-23).
- `unsafeHTML` impersonates a TemplateResult whose `strings` is `[value]` (lit-html/directives/unsafe-html.js:31-45) and returns the cached result when `value === this._value` (28-30).
- Server (@lit-labs/ssr lib/render-value.js:456-466): a TemplateResult in a child part is written as `<!--lit-part DIGEST-->` + the template rendered raw + `<!--/lit-part-->`, DIGEST a hash of the strings.
- Client hydrate (@lit-labs/ssr-client node/lib/hydrate-lit-html.js, one minified line): a `TreeWalker(container, SHOW_COMMENT)` over EVERY comment in the subtree; on `lit-part` it opens a part and, for a TemplateResult value, throws `Hydration value mismatch: Unexpected TemplateResult rendered to part` when `"lit-part " + digest(value)` differs from the comment; on `lit-node` with anything but a template instance on top of its stack it throws `Hydration value mismatch: Primitive found where TemplateResult expected`.
  - value `""`/`nothing` on the client against a server part with a digest: `nothing` is a primitive leaf, the comment's digest is not checked for it, and the walk continues; the content is not written. A later non-empty value would set a new TemplateResult into the part and replace the content.
  - value equal to the server's string: digest matches, content untouched.
  - HAZARD, independent of the value: a Lit child's envelope carries its own top-level `<!--lit-part …--><!--lit-node 0-->…<!--/lit-part-->` in the light DOM (what a Lit view renders to: renderer-lit/test/fixtures/button-markup.ts:9-10). The parent's walker reads them as its own parts and throws on the first `lit-node`. A React, Preact, Vue, Solid or Svelte child is safe: their comments (`<!-- -->`, `<!--[-->`, `<!--$-->`, `<!---->`) do not start with `lit-`. A Lit child in its own shadow root is safe: the walker does not enter shadow roots.
  - re-render with an unchanged string: the directive returns its cached result (28-30) and the ChildPart updates an instance with no values; nothing is written. Safe.

## 2. The candidate mechanism, tested against the code

"Render once with no children; the Slot emits the directive; `renderLocal` composes the rendered
markup with depth+1 and the path extended by the parent's identity; the child's envelope
replaces the directive." This half is sound and costs the renderers nothing: `renderLocal`
already has the markup string before it wraps it (render-local.ts:26-27), `compose` takes a
template string, a fetch, depth, path, page, newId (compose.ts:22-66), and the directive survives
every renderer's output. Probe over `findPlacements` from `core/dist`, one slot per framework:

    react   <div data-assembly-slot="x"><assembly name="x"></assembly></div>                 -> x/default
    solid   <div data-hk="a00100" data-assembly-slot="x" ><assembly …></assembly></div>       -> x/default
    svelte  <div …><!----><assembly …></assembly><!----></div>  (and DEV <!--hash-->)         -> x/default
    lit     <div …><!--lit-part 8icj+h3nvZI=--><assembly …></assembly><!--/lit-part--></div>  -> x/default
    markdown  <p>&lt;assembly name=&quot;x&quot;&gt;…</p>                                    -> nothing

The browser half as sketched, "hydrate collects the innerHTML of every `[data-assembly-slot]`
and passes it as `children` so the client Slot renders byte-identical markup", is not sound,
for three reasons found in the frameworks' own code:

1. It is not byte-identical. `innerHTML` does not serialise a declarative shadow root (a child
   with `shadow: true` renders inside `<template shadowrootmode>`, render-envelope.ts:46-51,
   which the parser turned into a shadow root), and it includes the parent framework's own
   markers (Svelte's `<!---->`, Lit's `<!--lit-part-->`) that the server's value never held. For
   Lit the digest then differs and `hydrate` THROWS (section 1); in DEV Svelte warns
   `hydration_html_changed` and React logs the attribute-mismatch error.
2. It is unnecessary. No framework needs the string to match the DOM: React (prod), Preact,
   Solid and Vue never read or write the slot's content while hydrating; Svelte claims by
   markers; Lit checks a digest of the STRING, not the DOM. What matters is only that the client
   value equals what the server rendered BEFORE composition, and the Slot knows that value from
   its `name` alone.
3. It does not address the one real hazard, a Lit parent walking a Lit child's markers.

What is sound instead, and simpler: THE SLOT RENDERS THE DIRECTIVE ON BOTH SIDES. The client Slot
renders exactly what the server Slot rendered, `<assembly name="x"></assembly>` (or, when a
`children[name]` string is supplied, that), so the pre-composition markup is identical on both
sides; `hydrate` halves stay as they are (`children: {}`), nothing reads the DOM before mounting,
and every framework leaves the composed envelope alone:

- React: Slot with `suppressHydrationWarning: true` and an identity-stable `{ __html }` per
  name. Both are required (section 1). Without the stable object a parent re-render wipes the
  child; this is the mutation the browser proof must watch red.
- Preact: Slot unchanged but for rendering the directive when `children[name]` is absent.
- Solid: same; `isHydrating` guard and `value === prev` do the rest.
- Vue: same; innerHTML is never hydrated or compared.
- Svelte: no package code can render inside the author's view, so the "Slot" is a prop the
  renderer hands the view: `children` becomes a Proxy-free object whose missing keys answer the
  directive? No: `children` is `Record<string,string>` and a view reads `children.x`. Two
  honest options: (a) export a `slot(name)` helper from `@assemblejs/renderer-svelte` (plain
  TS, importable in a `.svelte` script) returning `children[name] ?? directive(name)`, used as
  `{@html slot("x")}` inside `<div data-assembly-slot="x">`; (b) export a `Slot.svelte`
  component. (a) needs no `.svelte` compilation of package code and is what the directive
  mechanism needs; the DEV hash check then passes because the server hashed the same directive
  string (svelte server html.js:9). Note Svelte's `is_controlled` path is harmless here because
  the value never changes.
- Lit: export a `slot(name, children)` directive from `@assemblejs/renderer-lit` returning
  `unsafeHTML(children[name] ?? directive(name))`; the digest matches because the strings match.
  The Lit-child-in-Lit-parent hazard needs one of: (i) renderer-lit's `mount` detaches each
  `[data-assembly-slot] > assembly-root` before `hydrateLit` and reattaches it after (synchronous,
  the child's nodes and listeners survive, a custom-element child re-connects and re-renders),
  or (ii) a documented refusal: a Lit view may hold a Lit child only when the child declares
  `shadow: true`, held by a unit test that watches `hydrate` throw on the fixture
  BUTTON_MARKUP placed in a slot. (i) is uniform; (ii) is honest and cheap. Recommend (ii) for
  this rung with the test, (i) recorded as the follow-up.

Mount order: `start` considers envelopes in document order (start.ts:98-100, 112; held by
start.test.ts:57-62), reads and removes every island synchronously (start.ts:55, read-island.ts:21)
before any module loads, and for a built page the real mounts happen when each `lazyRenderer`
module arrives (lazy-renderer.ts:36-39), so parent and child hydrate in EITHER order. Both orders
are safe under the directive mechanism: a parent hydrating after a live child never writes into
the slot (section 1), and a child hydrating after its parent finds its envelope intact because
the parent never touched it. Tear-down is reverse order (start.ts:126-128) so the child goes
first; a parent unmounted alone would remove the slot and the child's nodes with it, which the
runtime never does today.

Two runtime gaps the rung must close:

- `findEnvelopes` is one `querySelectorAll` (find-envelopes.ts:14), which does not enter shadow
  roots: a child placed by a parent with `shadow: true` is never considered. It must also walk
  each found envelope's `shadowRoot`.
- `opensRuntime` (opens-runtime.ts:12-22) and `register-pages`' asset hoisting (register-pages.ts:96-118)
  read the PAGE's placements and diagnostics only: a page of one static parent with a React child
  ships no runtime, and a child's scoped stylesheet is never linked. `renderLocal` must surface
  what it composed (its diagnostics, or the names placed) and boot must count a view's children
  when deciding the runtime; `js` is one entry per build (generate-registry.ts:87,
  generate-client-entry.ts:15-20), so a local child's module is already reachable.

## 3. Template engines

Probe (`engine-probe.mjs`, run from `packages/renderer-templates` against the installed
engines with each loader's own options, load-ejs.ts:14-21, load-handlebars.ts:19-29,
load-nunjucks.ts:14-26, load-pug.ts:12-13):

    ejs / handlebars / nunjucks  <section><assembly name="cart"></assembly>&lt;b&gt;</section>
    pug, literal line  `<assembly name="cart"></assembly>`          -> same
    pug, tag  `assembly(name='cart')`                               -> <assembly name="cart"></assembly>
    pug, tag  `assembly(name='cart')/`                              -> <assembly name="cart"/>   (accepted, find-placements.ts:49)
    pug, tag  `assembly(name="cart" view="mini")`                   -> <assembly name="cart" view="mini"></assembly>
    markdown-it html:false  -> <p>&lt;assembly name=&quot;cart&quot;&gt;&lt;/assembly&gt;</p>
    markdown-it html:true   -> <p><assembly name="cart"></assembly></p>

So a template view writes the directive literally in its source and every engine passes it
through (none escapes its own template text; escaping applies to interpolated values only). Pug
authors write the tag form; Pug emits double-quoted attributes, which the finder requires
(find-placements.ts:22). Markdown cannot place a child: `html: false` is deliberate
(load-markdown.ts:5-9, 12) and turning it on would admit raw HTML in prose, which is an owner
decision, not this rung's; recommend no, and say so in the guide. The `children` locals the four
engines receive (as SafeString in Handlebars and Nunjucks) are never populated under the
directive mechanism; they can stay `{}` this rung and be removed with DESIGN 7's sentence later.

## 4. The html renderer and a `.client.ts`

- A `.html` view is its file's text, `markup: () => view` (generate-registry.ts:72), so a
  literal `<assembly name="x">` in it reaches `renderLocal` unchanged and is composed like any
  other markup. No renderer change; `examples/html/server.mjs` (a hand-written `defineAssembly`)
  works the same way through `markup`.
- A static view's browser half is its `.client.ts`, which default-exports a `ClientRenderer`
  (generate-client-module.ts:19-21; fixture `export default { mount: () => ({ unmount }) }`,
  cli/test/build/build-project.test.ts:128); a framework view may not have one
  (build-problems.ts:70-78). It is mounted on the parent envelope with the child's envelope
  inside; the child mounts on its own envelope by the runtime (start.ts:98-100). The only rule an
  author must keep: do not replace the envelope's innerHTML. A static assembly without a
  `.client.ts` is `mount: "none"` (generate-registry.ts:78); the runtime skips only that envelope
  (start.ts:57) and still mounts the child, provided a runtime is on the page (section 2, gap).

## 5. Files to change, the tests that hold each, the browser proof

Core (the orchestrator's half, listed for the seam):

- `core/src/server/render-local.ts` — compose the markup with `page`, `depth`, `path:
[...path, identity(name, view)]`, `plan: {}`, the local `Fetch`, `limits`, `newId`; return
  what it placed. Tests: `core/test/server/render-local.test.ts` (new: a view's directive is
  replaced by the child's envelope; depth cap refused; a self-placing view refused as a cycle
  before dispatch; the child's services get the page's params and query).
- `core/src/server/local-fetch.ts` (pass `request.page/depth/path`), `create-server.ts:157-207`
  (the content endpoint passes `headers.page/depth/path`, so a remote parent composes its own
  children on its own server and the headers hold depth and cycles across servers),
  `register-pages.ts:96-118` and `opens-runtime.ts` (children's assets and runtime),
  `core/src/client/find-envelopes.ts` (shadow roots). Tests: local-fetch.test.ts,
  create-server.test.ts, register-pages.test.ts, opens-runtime.test.ts, find-envelopes.test.ts.
- `docs/DESIGN.md` 7 ("children arrive as strings" becomes "a view places a child with the
  directive; the composer composes the view's markup"), 8 (unchanged in substance: services ran
  before the view rendered, so a service shapes the child's request through the view's data),
  3.4 (a parent's own identity is appended before it composes).

Renderers:

- `renderer-react/src/client/slot.ts` — directive fallback, `suppressHydrationWarning`, stable
  `{ __html }` per name. Tests: `test/client/slot.test.tsx` (renders the directive when no child;
  the same string on the client), `test/client/hydrate.test.tsx` (happy-dom: an envelope inside
  the slot survives hydration and a parent state change; watched red with a fresh object).
- `renderer-preact/src/client/slot.ts`, `renderer-solid/src/client/slot.ts`,
  `renderer-vue/src/client/slot.ts` — directive fallback. Tests: each `slot.test` and
  `hydrate.test` as above (Solid already has the nested fixture, nested-markup.ts:12-16; extend
  `outer.tsx` to render the directive and assert the parent click keeps the child's node).
- `renderer-svelte/src/...` — `slot(name, children)` helper (new file, one declaration) exported
  from the package root (a `.svelte` view imports it in `<script>`); test in
  `test/client/slot.test.ts`-equivalent (mirror rule) for the string; hydration proved in the
  browser only (hydrate.test.ts:8-18 says why).
- `renderer-lit/src/...` — `slot(name, children)` directive; tests: server markup carries the
  digest of the directive string; client `hydrate` with the directive against the composed
  markup adopts it; a Lit child's markers in the slot make `hydrate` throw (held, as the
  documented refusal) or are survived (if (i) is taken).
- `renderer-templates` — no code change; `test/engine/load-*.test.ts` each gain "the directive
  survives compile" and `load-markdown.test.ts` gains "the directive is escaped".
- `packages/cli` — `generate-registry.ts` unchanged for this rung; `check` later reads a
  framework view's `Slot` names off its AST as it reads `mount` (check/read-view-mount.ts).

Browser proof (`browser/frameworks.browser.ts`, config `browser/playwright.config.ts`:
`testMatch **/*.browser.ts`, `globalSetup build-examples.mjs` which builds the packages and
`examples/frameworks` with the real CLI, `ASSEMBLEJS_CHROMIUM` at :15-20, run by
`pnpm test:browser`, root package.json:41):

- Example: `examples/frameworks` gains a page `src/pages/nested/nested.html` placing
  `<assembly name="react-shell">` and `<assembly name="pug-shell">`, and two assemblies:
  `react-shell/react-shell.react.tsx` (a React counter of its own with `#react-shell-bump`
  and `<Slot name="svelte-counter" children={props.children} />`) and
  `pug-shell/pug-shell.pug` (`section` with `assembly(name="vue-counter")`). One framework parent
  with a different-framework child, one template parent with a framework child.
- Assertions, with `holdScript` (frameworks.browser.ts:40-48) so the server's markup is captured
  first: (1) the server's text holds the child's envelope inside the slot inside the parent's
  envelope (`assembly-root[data-name="react-shell"] [data-assembly-slot="svelte-counter"] >
assembly-root[data-name="svelte-counter"]`), and the same for `pug-shell`/`vue-counter`;
  (2) `#svelte-bump` is captured before release and, after `networkidle`, is the same node
  (adopted, not replaced), clicks to `svelte 1`; (3) `#react-shell-bump` clicks twice to
  `shell 2` and `#svelte-bump` is STILL the same node showing `svelte 1` (the parent's
  re-render left the child alone: this is what goes red when the React Slot's object is not
  identity-stable, or when any renderer writes the slot on re-render); (4) `#vue-bump` inside the
  Pug parent hydrates and clicks to `vue 1`; (5) `script[data-assembly]` count is 0; (6) the
  page's console carries no error or warning (frameworks.browser.ts:80-86, 111), which also holds
  the no-DEV-warning claim should the bundle ever carry development React.
- Watched red: remove the directive fallback from the React Slot (the child is never composed),
  build a fresh `{ __html }` per render (assertion 3), and drop the `suppressHydrationWarning`
  while forcing a development bundle (assertion 6).
