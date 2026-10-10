# Design

The contract, written before the code. Everything here is decided. What it reverses from an
earlier record is named in section 14; what remains genuinely open for the owner is section 15.

The rule that produced this document: **an assembly is an HTTP resource, and the contract is the
product.** Get the resource contract exactly right and everything else is convenience on top of
it. Any server, in any language, can serve an assembly by answering three requests correctly.
That is what makes a second team, a second framework or a second service cost nothing to add to
a page, and it is the thing that has to be right before a line of code is written.

Decisions already in `docs/DECISIONS.md` are not restated. This document specifies them.

---

## 1. The model

Four nouns and nothing else.

| noun         | what it is                                                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **assembly** | A piece of a page written in one UI framework. Whole, addressable, renderable on its own. Nested inside another it is a **subassembly**. |
| **page**     | A route that renders a template which places assemblies. A page is an assembly that has a route.                                         |
| **service**  | A function that runs on the server before an assembly renders and returns its data.                                                      |
| **api**      | A route that serves data to anyone.                                                                                                      |

A **server** composes pages from assemblies. **Events** are how assemblies talk in the browser.
The **manifest** is how one server describes an assembly to another.

An assembly whose address is a URL is served by another server. There is no separate word,
because there is no separate concept: the composer treats every assembly identically and only
the transport differs.

---

## 2. The assembly contract

Three endpoints per assembly. This is the specification; a conformance suite tests an
implementation against it, and the reference implementation is only the first to pass.

Framework-owned routes live under `/_assemblejs/` and are never part of the contract.

### 2.1 Content

    GET /assembly/<name>/
    GET /assembly/<name>/<view>/

Answers `200` with `Content-Type: text/html; charset=utf-8` and a **fragment**, never a
document: no `<html>`, `<head>` or `<body>`. The fragment is exactly one element, the envelope
of section 2.4, containing the assembly's markup and its data island.

An assembly that fails to render, or whose service throws, answers `500` with the same kind of
fragment: its fallback envelope, marked `data-failed` with the correlation id its failure is
logged against. A composing server reads the status, applies its own fallback policy and caches
nothing; a bare fetch still reads an envelope.

Request headers, all optional, all prefixed `assembly-`:

| header            | meaning                                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `assembly-page`   | Opaque id of the page being composed. Present means "you are a fragment"; absent means "you are the page".                        |
| `assembly-id`     | The id this instance must stamp on its envelope. The parent allocates it, so the parent can address the result before it arrives. |
| `assembly-depth`  | How many assemblies deep this request is. A server refuses above its cap.                                                         |
| `assembly-path`   | Comma-separated identities of the ancestors, each `name/view`, innermost last. Used to detect a cycle.                            |
| `assembly-params` | The page's route parameters (`/products/:id`), form-encoded (`id=42`), for the services this fragment runs. Absent means none.    |

Every one of these is validated on arrival against its declared shape (id and page: one uuid;
depth: an integer within the cap; path: `name/view` identities, at most the cap,
comma-separated; params: at most 2048 bytes, each name a parameter's, `[A-Za-z_][A-Za-z0-9_]*`,
and named once). A malformed value is `400`, never a coerced default. They are composition state, so an outside caller may
send them and get exactly the behaviour an internal caller gets: there is no privileged variant
of this route.

Response headers:

| header             | meaning                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `assembly-version` | The version of this assembly's output, from its manifest. A parent holding assets for a different version discards them. |
| `assembly-name`    | Echoes the assembly served, so a proxy or a mistake is visible.                                                          |

The framework claims no query-string namespace. An assembly's query string is its own.

### 2.2 Data

    GET /assembly/<name>/<view>/api/

Answers `200 application/json` with **exactly the object the content endpoint put in the island**
for the same request. Same services, same inputs, same output. Not a second code path: one
function produces the data and both endpoints call it, so the two can never drift.

A service that throws answers `500` with a correlation id and no partial data. The content
endpoint, given the same throw, renders the assembly's fallback and logs against the same id.

### 2.3 Manifest

    GET /assembly/<name>/<view>/manifest/

Answers `200 application/json`:

```json
{
  "contract": 1,
  "name": "cart",
  "view": "default",
  "version": "9f2c1a",
  "views": ["default", "compact"],
  "renderer": "svelte",
  "assets": { "css": ["…"], "js": ["…"] },
  "public": true
}
```

`contract` is the version of _this specification_, an integer, bumped only by a breaking change
to the three endpoints. `version` is the version of _this assembly's output_, an opaque string,
used to detect skew during a rolling deploy.

The body is built by naming each field that goes in. Nothing server-private can appear here,
because nothing is copied wholesale: no template, no service, no filesystem path, no config.

A consuming server fetches the manifest **once per version**, caches it, and refetches when a
content response carries an `assembly-version` it has not seen. That is the whole handshake. A
manifest that cannot be fetched is a warning and a retry, never a boot failure: a page whose
remote has no manifest still renders, its assets simply are not hoisted.

### 2.4 The envelope

Every fragment is wrapped in one element, and this is the canonical attribute set. Nothing else
is emitted, and every other section refers here rather than restating it.

```html
<assembly-root data-name="cart" data-id="a7f3" data-view="default" data-renderer="svelte">
  …the assembly's own markup…
  <script type="application/json" data-assembly="a7f3">
    { …data… }
  </script>
</assembly-root>
```

Added only when they apply: `data-remote` (the origin, when the assembly came from another
server), `data-defer` (the content has not been fetched yet), `data-failed` (the render or the
fetch failed and this is a fallback; its value is the failure's correlation id, section 12),
`data-mount` (when the browser half runs, section 9, when it
is not the default `load`).

`assembly-root` is a custom element with no behaviour of its own. It is the styling scope hook,
the hydration hook, and the element a renderer's `mount` receives, which is what every framework
already calls a root. It is chosen so the boundary is visible in devtools and addressable in CSS
without a class convention. An author may add classes and attributes to it through the
assembly's declaration, never through the page template, which keeps a page from styling another
team's internals.

It is deliberately not the same element the author writes in a template. A page template, or
an assembly's own view, places an assembly with `<assembly name="cart">`, which is a template
directive: the server replaces it and it is never emitted, so it needs no hyphen and carries no
meaning in the browser. The two
are separate because one word cannot be right in both positions. A placement is nested by
definition and a served fragment is not, so a name that reads correctly in a template reads
wrongly on a bare fetch, and the reverse. The author writes the directive and reads the
envelope, which is the same split every framework has between what is authored and what is
emitted.

The data island sits inside the envelope, next to the markup. The browser runtime reads it,
parses it and removes it. It carries only what section 5.3 allows.

An assembly's view may place others (section 7). Each one's envelope stands where the view
placed it, inside its parent's, so the envelopes of a page are a tree. The runtime takes them
in document order, a parent before what it holds, and each hydrates when its own module
arrives, in either order: a parent writes nothing where a child stands. An envelope inside one
marked `data-remote` came from that server, and is marked so too.

---

## 3. Composition

### 3.1 One interface for local and remote

```ts
type AssemblyRequest = {
  name: string;
  view: string;
  id: string;
  page: string;
  depth: number;
  path: readonly string[];
  query: URLSearchParams;
  headers: Readonly<Record<string, string>>;
  signal: AbortSignal;
};

type AssemblyResponse =
  | { ok: true; html: string; source: "local" | "remote" | "cache"; version?: string }
  | { ok: false; reason: Reason; detail: string; correlationId: string };

type Reason = "timeout" | "status" | "transport" | "content-type" | "too-large" | "invalid";

type Fetch = (req: AssemblyRequest) => Promise<AssemblyResponse>;
```

A local assembly is rendered in process; a remote one is fetched over HTTP. **Both go through
this one function**, with the same deadline, the same headers and the same result type, so
moving an assembly to another server changes a URL and nothing else. A local assembly is not a
faster special case with a shortcut; making it one is how the two paths drift.

**A fetch never rejects and never throws.** It returns a result. Nothing in the composition path
puts an `async` function inside a promise executor, where a rejection becomes an unhandled one
that no `catch` can see.

### 3.2 The composer is pure

```ts
compose(input: {
  template: string
  plan: readonly AssemblyPlan[]
  fetch: Fetch
  cache?: ContentCache
  limits: Limits
}): Promise<{ html: string; diagnostics: Diagnostic[] }>

type AssemblyPlan = {
  name: string
  view: string
  url?: string          // present means another server
  deadline: number
  fallback?: string
  required?: boolean
  defer?: boolean
  cache?: { ttl: number }
}

type ContentCache = {
  get(key: string): { html: string; version?: string } | undefined
  set(key: string, value: { html: string; version?: string }, ttl: number): void
}

type Diagnostic = {
  name: string
  id: string
  source: "local" | "remote" | "cache" | "fallback"
  reason?: Reason
  correlationId?: string
  ms: number
}
```

No HTTP, no framework, no filesystem, no clock it does not own. Template and a fetch function
in, HTML and a list of what happened out. It is fully testable before a server exists, and the
server is a thin wrapper that supplies a real `fetch`.

The composer owns the fallback ladder, so `source` on a diagnostic always says which rung
answered. `fetch` reports only what the transport did.

### 3.3 Failure is isolated, always

Every placement settles on its own. A page with three assemblies renders when the slowest of
them finishes or times out, never later, and never fails because one of them did.

- Each placement has a **deadline**, default 3000 ms, configurable per placement, always finite.
  It is enforced with `AbortSignal.timeout`, so a slow remote is actually cancelled, not merely
  ignored while it keeps a socket and a request context alive.
- Any answer that is not a `2xx` `text/html` body within the cap is a failure. A `404`, a `500`
  and a JSON body are all failures. None of them is ever rendered as content.
- On failure the placement renders, in order: its declared **fallback**, then the **last good**
  cached response if one is held, then an empty envelope with `data-failed`. Every case appends
  a diagnostic naming the rung that answered.
- A placement declared `required: true` turns its own failure into the page's failure, with a
  `503` and the diagnostic. This is opt-in and it is the only way a page dies from a child.
- Placements resolve concurrently under `allSettled` semantics, and the output order is the
  template's order regardless of which finished first.

### 3.4 Depth and cycles, checked before dispatch

`assembly-depth` increments per hop; `assembly-path` carries the ancestors' identities, each
`name/view`: an instance's id is new on every render, so only what it is can recur. Both are checked
by the **parent, before it dispatches**, not only by the child on arrival: a request that would
exceed `limits.depth` (default 8), or whose target already appears on the path, is never sent.
The placement takes its fallback and a diagnostic. A server also refuses on arrival, because a
request can come from anywhere, but the refusal a well-behaved composer relies on is its own.

An assembly composes what its own view places as a page composes its template: at the depth it
arrived with, its own identity added to the ancestors, on its own server and under that
server's one cap. So its children are dispatched one level deeper with their parent among their
ancestors, wherever the request for the parent came from, and the two headers hold depth and
cycles across as many servers as a page reaches. A child a view places is this server's: it has
no policy of its own, so it takes the default deadline, falls back to nothing, is never
required, deferred or cached alone, and a failure beneath a parent keeps that parent's answer
out of the cache.

A page cannot be made to recurse by any request an outsider can send, and a self-referencing
assembly is a diagnostic at the first hop rather than a hang, a socket exhaustion or a stack
overflow. Where a view's source says what it places, the loop is not even a request: a view
that places itself, or leads back to itself, is refused at boot (section 7).

### 3.5 Deferred assemblies

A placement declared `defer: true` is not fetched during the page render. The server emits its
empty envelope with `data-defer`, carrying the page's route parameters as `data-params`, and the
browser runtime fetches the content endpoint after load, with the envelope's id, those
parameters as `assembly-params` and the page's own query, and puts the envelope that answers in
its place, parsed as the page was (a declarative shadow root attached), then mounts it like any
other. Should that fetch fail, the placement shows what any failed placement shows: its declared
fallback, carried inert in the placeholder, in the server's failed envelope with its logged id.
Deferring is the answer for a genuinely slow assembly that must not hold the page; everything
else uses the deadline.

What a deferred assembly's view places arrives with the answer that fills it, composed inside
it. The page cannot read those envelopes when it is served, so it links ahead what they will
need, the runtime and each stylesheet, from what the deferred view's source is known to place.

`defer` and `required` together are a boot error. A deferred assembly's outcome arrives after
the page has shipped, so it cannot fail the page, and a declaration that says it can is a
misunderstanding worth catching at boot rather than a rule worth explaining in prose. So is a
deferral nothing could carry out: one from another server, whose fragment the browser cannot
fetch across that server's same-origin policy, and one on a page where no assembly of this
server's has a browser half, placed by the page or by the view of one it places, so no runtime
is there to fetch it. A deadline or a cache on a
deferred placement is policy nothing reads, refused like any other.

### 3.6 Real-time

An api handler may hold a response open and stream server-sent events. The browser runtime opens
one connection per page, not one per assembly, and delivers each message onto the page's event
bus, where assemblies receive it exactly like any other event. Nothing in the assembly's code
knows the message came from the network.

```ts
// src/api/prices.api.ts: `stream` in place of `handle`, run once per connection
export default defineApi({
  path: "/api/prices",
  stream: ({ send, signal }) => {
    const off = feed.subscribe((price) => send("price", price)); // or send(topic, payload, { name })
    signal.addEventListener("abort", off);
  },
});

// src/pages/home/home.page.ts: the page names its one stream
export default definePage({ stream: "/api/prices" });
```

Each message is one `data:` line of JSON, `{ topic, payload, to? }`, which cannot be broken by a
line break in the payload. It arrives on the bus from the sender `{ id: "server" }`, an id no
placement can have, and each topic the stream sends keeps its last message per address: the
stream opens while assemblies are still loading, so one that mounts later reads what it missed
with `events.last`, and only what it would have been delivered.
The page's own runtime opens the stream its head names; a remote's runtime never does, and an
assembly placed from another server is on that server's bus, which the stream does not reach.
A stream answers GET and not HEAD, writes a comment while quiet, drops a connection whose queue,
once past what the socket takes at once, does not drain within thirty seconds (what it holds
meanwhile is what the stream sent in that time), and is closed before the server stops. Over HTTP/1.1
a browser holds six connections per origin, and every open page with a stream holds one of them
(two in development, with the reload stream): beyond six such tabs, the next page waits. A page naming a stream that is
not one of the server's streaming apis (a query after the path is the stream's own), or naming
one with no assembly of this server's that runs in the browser to open it, is a boot error.

There is no WebSocket in core.

---

## 4. Configuration

The root of the largest class of defect found in the predecessor: settings that were read from a
place that was empty at runtime, so every value silently took its default and the security
controls keyed on them could never turn on.

- **Configuration is read from the process environment**, once, at boot. Not from a bundler's
  compile-time constants, not from a global the build populates, not from anything whose absence
  looks like a default.
- **It is validated against a schema at boot** and the resolved values are echoed in the startup
  banner. An unset variable with no safe default refuses to start, naming the variable.
- **Every security control defaults closed** and none is keyed on a mode string the operator
  cannot set. There is no environment name that silently unlocks a route.
- **The mode is explicit.** Development behaviour is enabled by the CLI setting it, and is off
  in every other case, including an unset variable.
- **A missing credential for an enabled control is a boot failure**, never a warning and never a
  default credential. The framework ships no default password.

---

## 5. Trust

The composer treats a remote assembly as a third party, because it is one.

### 5.1 Outbound

- A remote assembly's origin must appear in the config's `remotes` allowlist, **matched
  exactly**. No wildcards, no subdomain patterns.
- Redirects are **not followed** (`redirect: "error"`). A redirect is a way to leave the
  allowlist after it has been checked. An origin resolving into a loopback, link-local or
  private range is refused unless that origin was itself declared, so the allowlist is the only
  thing that can widen reach.
- **Nothing is forwarded by default.** Not cookies, not `authorization`, not `host`, not the
  query string, not `x-forwarded-*`. A remote declares what it needs, per remote, per key:
  `forward: ["accept-language"]`. Forwarding a credential to another company's server is a
  decision, never a default. A composition header cannot be declared forwarded: the composer
  sends those itself, and a visitor must not be able to stand in for it.
- The response is capped, default 2 MiB, and must be `text/html`. Anything else is a failure.
- Remote response headers are discarded. Nothing a remote sets reaches the visitor.

### 5.2 Inbound

A fragment is a public HTTP resource unless auth is configured. Auth is one seam in core: basic
credentials or an `authenticate(request)` callback, plus a list of public routes, evaluated in
**one place before anything else**, so there is no second path that disagrees with the first.
The framework ships no user store, no login page and no session.

A default content-security policy and a same-origin CORS policy ship on by default; allowlisted
remote origins are added to the policy automatically, because they are the only extra origins
the page is designed to load from. Nothing inline runs or applies under it: no inline script, no
`<style>` block and no `style` attribute, a framework's server-rendered `style` included. Styles
belong in an assembly's stylesheet (section 10); a project that needs more replaces the policy.

### 5.3 The server-to-browser boundary

The island carries an **allowlist projection**, defined once and by name:

    { id, name, view, renderer, data, deferred }

That is the whole set. Not the request. Not headers. Not cookies. **Never** the rendered bytes
of child assemblies, which are already in the DOM. Growing the server's internal context can
never leak a new field, because nothing is spread and nothing is copied wholesale.

### 5.4 Encoding

One encoder per position, and the position decides which:

- **Text**, for anything between tags.
- **Attribute**, for every attribute value in the envelope, always quoted.
- **Script**, for the JSON island: `<` escaped, U+2028 and U+2029 escaped, tested against a
  payload containing a literal closing-script sequence.

**No request-derived value is ever interpolated into a tag string.** Attributes are set from
known keys with encoded values; the envelope is built, not concatenated. Nothing crosses into
markup without passing an encoder, and nothing crosses to the browser except JSON, which the
type system enforces rather than a document asserting it.

---

## 6. Representation

One canonical form per concept, with an explicit encode and decode at each boundary.

- A rendered child is a **string**, everywhere, from the moment it is produced. Not a buffer
  that becomes a string somewhere unnamed, not a buffer that reaches a serializer.
- Data is a **plain JSON object**. A map, a class instance, a regular expression and a buffer
  never reach a serializer or a merger, because they never enter the data path.
- Composed schemas are **deep-merged**: properties are unioned, required lists concatenated. A
  name that collides across composition levels is a **startup error**, not a silent overwrite in
  whichever direction the merge happened to run.
- Every conversion is one function with a name, called at the boundary. A value never changes
  representation as a side effect of being passed somewhere.

---

## 7. Rendering

A renderer is two functions in two entry points, and it never wraps a framework.

```ts
// @assemblejs/renderer-x            server
export interface Renderer {
  readonly name: string;
  readonly extensions: readonly string[];
  render(input: RenderInput): string | Promise<string>;
}

export type RenderInput = {
  readonly template: unknown; // whatever the extension loaded
  readonly data: Readonly<JsonObject>;
  readonly helpers: Readonly<Record<string, unknown>>;
  readonly url: URL;
};

// @assemblejs/renderer-x/client     browser
export interface ClientRenderer {
  mount(el: Element, data: JsonObject, ctx: MountContext): MountHandle;
}
export type MountHandle = { unmount(): void };
```

- **A view places a child by writing the directive, and is never handed one.** The view renders
  once. The composer then reads its markup as it reads a page's template and puts each child's
  envelope where its directive stood. A plain html or template view writes
  `<assembly name="cart">` in its own markup. A framework view writes it with its renderer's
  slot, `<Slot name="cart" />` in React, Preact, Vue and Solid, `slot("cart")` in Svelte and
  Lit, which writes the same markup on the server and in the browser, so a parent hydrates
  around the child the server placed and writes nothing into the slot when it renders again. No
  renderer reaches for a child or agrees with another about what one is, so plain HTML holds
  React as React holds plain HTML. Markdown is prose and places nothing.
- **A placement's name is written where the placement is.** What a view places is read from its
  source before any request: the build writes it beside the view, boot refuses a name with no
  assembly, a view the assembly lacks and a view that leads back to itself, and `check` says the
  same in the file. Which view of a child a parent shows may come from its data; which child it
  is may not. A Pug view writes the directive in its own syntax and is read when it renders.
- **A Lit view holds a Lit assembly only behind a shadow root.** Lit hydrates a view by reading
  every marker in its tree, and would read a Lit child's as the parent's. A shadow root hides
  them; without one the parent refuses to mount, by name, and `check` says so before a browser
  does.
- **No try/catch inside a renderer.** A failed render throws, the composer catches it, and the
  placement falls back. A renderer that returns its own error `<div>` produces markup that
  passes every check downstream.
- **Escape by default**, with one explicit raw mechanism. The directive a slot writes is the
  single exception and the only exception: markup built from a name and a view, each held to
  the shape an assembly's name has, so nothing a visitor supplied can be written through it.
- **`mount` returns a handle and the runtime calls `unmount`.** A teardown nothing invokes is
  not a teardown.

The view file's extension picks the renderer. Where an extension is shared, the filename says
which: `cart.react.tsx`, `cart.preact.tsx`, `cart.solid.tsx`, and `cart.lit.ts` among a
project's own TypeScript. `cart.svelte`, `cart.vue`, `cart.md` and `cart.html` need no infix,
and nor do the template languages, `cart.ejs`, `cart.hbs`, `cart.njk` and `cart.pug`, which with
`cart.md` render through `@assemblejs/renderer-templates`. A page's frameworks are then visible
from a directory listing.

Renderers ship one per package with one real peer dependency, so installing the framework you
use does not install the five you do not.

---

## 8. The author's day

```
src/
  pages/
    home/
      home.html                 the page template
      home.page.ts              route and any placement policy
  assemblies/
    hello-react/
      hello-react.react.tsx     the view; extension and infix pick the renderer
      hello-react.css           styles, scoped to this assembly automatically
      hello-react.client.ts     optional: browser behaviour
      hello-react.service.ts    optional: server data
  api/
    time.api.ts
assemblejs.config.ts            policy only: remotes, access, the content policy, budgets
AGENTS.md                       what an agent that opens the project is told (13.7)
.mcp.json                       the project's agent surface, registered (13.7)
```

**A directory under `assemblies/` is an assembly.** There is no registry to maintain, no import
to add, no list restating the directory tree. The CLI generates a typed module the author never
opens and never commits; the built server imports it, so production has a static import graph
and no runtime globbing. This is the one recommendation waiting on the owner's word; section 14
states it, with what it reverses and what it costs.

A page template places assemblies by name:

```html
<main>
  <assembly name="hello-react"></assembly>
  <assembly name="hello-svelte"></assembly>
</main>
```

A name with no assembly behind it is a boot error, found by scanning templates at startup, not a
blank space discovered by a visitor.

Policy, when a placement needs any, lives in the page's own file:

```ts
export default definePage({
  route: "/",
  place: {
    cart: {
      url: "https://checkout.example.com/assembly/cart/",
      deadline: 500,
      fallback: "<p>Cart unavailable</p>",
    },
  },
});
```

A local placement needs no entry at all. The template alone is enough, which is the point:
adding a second framework to a page is one file and one tag.
When a local placement needs policy, the entry is the same shape without a url:

```ts
export default definePage({
  place: { cart: { deadline: 500, fallback: "<p>Cart unavailable</p>" } },
});
```

A placement from another server names a declared remote, and the remotes are policy, declared
once in `assemblejs.config.ts`:

```ts
export default defineConfig({
  remotes: [{ origin: "https://checkout.example.com", forward: ["accept-language"] }],
});
```

So are the page budgets: what each page may send a visitor before anything mounts, in gzipped
bytes by part (`document`, `styles`, `scripts`), declared as `budgets` in the same file. `perf`
weighs the production build and holds every page to them; nothing on the server reads them.

A service returns; it does not mutate:

```ts
export default defineService({
  name: "greeting",
  async run(ctx) {
    return { greeting: `Hello, ${ctx.params.name ?? "world"}` };
  },
});
```

A service is given the request's `query` and the route `params` of the page that placed the
assembly, `{ id: "42" }` for `/products/:id`, which reach it the same way whether the page is on
this server or another: an object with no prototype, so a parameter named `constructor` is a
parameter and nothing else. Returning is testable in isolation, composes without hidden order, and
makes the data shape the function's return type. Services run in declaration order; one that must follow another says
`after: ["greeting"]`. There is no priority number. Services run **before** the view renders,
and what the view places is composed after it, so a service shapes which view of a child its
parent places: the view writes it from its data. A child is given the params and the query its
parent was given.

An api is a route:

```ts
export default defineApi({
  path: "/api/time",
  handle: () => ({ now: new Date().toISOString() }),
});
```

One method per definition, `GET` unless `method` says otherwise. The handler is given the
request's `query`, its route `params` and its parsed `body`, and whatever it returns is the JSON
reply. A path is literal segments and whole-segment `:parameters`. One that is declared twice for
one method, does not start with `/`, uses a wildcard or any other pattern, or lands under
`/assembly/` or `/_assemblejs/` is a boot error.

---

## 9. The browser

One runtime, framework-free, served once per page. It finds every envelope, reads and removes
each island, and mounts each assembly through its renderer's client half.

    mount:   client:load      mount immediately (default)
             client:idle      mount when the browser is idle
             client:visible   mount when the envelope scrolls into view
             client:none      never mount; the assembly is static HTML

Declared per assembly. A static view (html, or a template with no `.client.ts` beside it)
ships no JavaScript at all, which is a mode and not an accident; a framework view declared
`none` is left as the server sent it, and the page it is on still carries the runtime for the
rest.

Events are typed, page-scoped and owned by the assembly:

```ts
const events = useEvents(); // scoped to this assembly
events.send("cart:add", { sku }); // sender identity stamped by the runtime
const off = events.on("cart:add", handler); // released when the page unmounts its assemblies
```

- Subscriptions are held per assembly by the runtime, which releases **exactly the references
  it handed out** when it unmounts the page's assemblies together. A leak is not possible by
  forgetting.
- Delivery is addressable by something the sender can name: every assembly, one name, one
  instance id, or the page.
- **Last-value replay is opt-in per topic.** A late-hydrating assembly can see the message it
  missed. There is no unbounded history that nobody reads, and no buffer that is filled and
  never replayed. Every topic the page's stream sends opts in, because the stream opens while
  assemblies are still loading. What is kept is one message per topic and address, and `last`
  answers an assembly only a message it would have been delivered.
- Every event carries the sending assembly's id, stamped by the runtime, not supplied by the
  sender.
- The public surface is this typed object. Raw event dispatch is never the API.

Two assemblies from different frameworks exchange events with no adapter, because the bus
belongs to the page and not to any framework's tree. That is what makes the mixed-framework page
real.

---

## 10. Styles

An assembly's stylesheet is compiled at build time with a scope derived from its name, so two
independently written assemblies cannot collide. Shadow DOM is a per-assembly opt-in for hard
isolation.

Every file a stylesheet names beside it is built with it, and one it cannot carry (a relative
`@import`, a missing file, a file outside the assembly's own directory) is a build problem, not a
broken link found later or a file published by accident.

A selector that starts at the document (`:root`, `html`, `body`) starts at the envelope instead;
one that says more about the document (`html.dark`) stays a condition on it, with the envelope
inside. A selector that needs the document anywhere but at its start matches nothing.

Stated plainly rather than implied: `@keyframes`, `@font-face`, `@import` and `@page` are global
by nature and are not scoped. A nested assembly sits inside its parent's envelope, so a parent's
descendant selectors reach into it, and a page's own rules reach every assembly not in a shadow
root. Nothing pretends otherwise.

A page links the stylesheet of every assembly in the markup it serves, at any depth, read from
the envelopes themselves, so an answer that came from the cache is styled as one that was just
composed. A stylesheet linked by the page does not reach into a shadow root, so an assembly in
one links the sheets of the assemblies placed inside it in that root. For an assembly from
another server the page links what that server's manifests declare, for the assembly it asked
for and for each one that server composed inside its answer.

---

## 11. Runtime shape

- `node dist/server.js` starts a built application with no bundler present. The server owns its
  own HTTP server and has no dev-toolchain module anywhere on the boot path, at module load or
  behind a condition.
- **Nothing throws after `listen`.** Every check that can refuse to start runs before the socket
  is open, so a process that is accepting connections is a process that is configured.
- Asset roots resolve from **resolved module paths**, never from string arithmetic over a
  directory name, so an install layout the author did not anticipate cannot silently produce a
  path that does not exist.
- The bundler is a development and build-time tool owned by the CLI. `assemblejs dev` runs the
  same build and the same `node dist/server.js` as production, and rebuilds and restarts on every
  change; `assemblejs build` emits the server and the client assets; neither leaves a trace in
  the running server. `assemblejs check` reports every problem found without building, each with
  its file, rule and fix. `assemblejs perf` builds, starts the build in production and weighs
  what each page, at the route it is mounted at, sends a visitor from its own origin before
  anything mounts; a page that falls back fails it. `assemblejs deploy` builds and writes
  `deploy/`, the build and a package.json of the project's dependencies alone, refused when the
  server imports a package those would not install, and never over a `deploy/` it did not write.
  None of them publishes or touches a remote.
- A server in development mode links one more script into every page, from under the devtools
  prefix and carrying the boot of the server that rendered the page, which
  listens on a stream for the server's boot and reloads the page when it hears another, so a page
  follows `dev` across each restart; in production neither exists. A request the server fails
  outright is answered with its failure body, which carries no script, and reloads by hand.
- The dev server binds loopback by default. Devtools are development-only, read-only over HTTP,
  and a boot assertion refuses to start if any route under the devtools prefix accepts anything
  but `GET` or `HEAD`. A server is handed devtools as data, `createServer({ devtools })`: routes
  under `/_assemblejs/devtools/`, each answering a read from a summary of the project (names,
  routes, settings; no function, credential or template source) and the failures the process
  logged most recently. In production the server mounts none of them, so a project hands them
  over unconditionally; `@assemblejs/devtools` supplies an overview page and the same reading as
  JSON. Devtools answer only a request from this machine's loopback, by where the connection came
  from and the name it used, so neither another machine nor a page on another site that points
  its own name at 127.0.0.1 reads anything from them.

---

## 12. Errors

- A process-level `unhandledRejection` and `uncaughtException` handler logs and exits, rather
  than leaving a process running in a state nothing accounted for.
- Every failure gets a **correlation id**. The visitor sees the id; the log holds the exception.
  A message from an exception never reaches a response body.
- The correlation id appears on the diagnostic, in the log line, and in the fallback envelope,
  so one failing assembly on one page can be found in a log without guessing.

---

## 13. The agent surface

An MCP server, shipped as `@assemblejs/mcp`, so an agent builds with this framework the way a
developer does, with the framework's own knowledge behind it rather than a guess at it.

This is the thing nothing else in the category has, and it follows from the mission rather than
decorating it. The mission is that a team of mixed frontend developers share one page without
learning each other's frameworks. An agent is exactly that developer: it knows some frameworks
well, has never seen this project, and must not break the parts it did not write.

### 13.1 Why a CLI is not enough

A command line is built for a person at a terminal. It prints prose, takes flags in an order,
and answers in exit codes. An agent driving it has to parse sentences that were written to be
read, guess what is valid before trying, and find out what it broke afterwards.

The MCP inverts all three: it answers in structures, it says what is valid before anything is
written, and every mutation returns what changed together with what is now true.

### 13.2 It carries no model and no key

The server runs locally against the developer's own project and calls no paid model, ever. It
holds no credential and reaches no network by itself. The intelligence is the agent already in
the room; what this ships is the expertise, not the reasoning.

That is a security property and a cost property at once: a framework that phoned an inference
API would put a bill and a key in every project that installed it, and neither belongs to us.

### 13.3 What an agent reads

Resources, not commands, because an agent that has to ask what exists spends its first three
turns finding out.

| resource                       | what it answers                                                                                                                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `assemblejs://project`         | Every assembly, page, renderer and setting, and how they are wired. The whole shape in one read.                                                                                 |
| `assemblejs://assembly/{name}` | One assembly: its files, its view, its renderer, the shape of its data, where it is placed.                                                                                      |
| `assemblejs://contract`        | The three endpoints, their headers and the envelope, as a specification. An agent writing a remote assembly in another language reads this and needs nothing else.               |
| `assemblejs://rules`           | The constraints real code must satisfy, with the reason for each. One framework per assembly; a view places a child with the directive; nothing crosses to the browser but JSON. |
| `assemblejs://diagnostics`     | What is wrong right now, per assembly and per placement, with the correlation id that finds it in a log.                                                                         |

### 13.4 What an agent does

Every tool answers with the change it made and the state that resulted. None of them prints
prose for a human to re-read.

| tool              | what it does                                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `create_project`  | Scaffolds a project that runs.                                                                                                            |
| `add_assembly`    | Writes an assembly for a named renderer, and returns the files and the tag that places it.                                                |
| `place_assembly`  | Puts the placement into a page template, or into another assembly's view, at a named position.                                            |
| `render_assembly` | Renders one assembly NOW, what its view places composed inside it, and returns its HTML, its data and the account of each child.          |
| `compose_page`    | Composes a page NOW and returns the HTML with one diagnostic per placement, and beneath it one per assembly that placement's view placed. |
| `check`           | Runs the gates and returns findings as structures, each with the file, the rule and the fix.                                              |
| `explain`         | Why a rule exists, so an agent can decide rather than comply.                                                                             |

`render_assembly` and `compose_page` are the two that matter most, and they are the reason this
is not a wrapper. An agent that writes an assembly can immediately see what it renders, what
data it produced and which placement fell back, without starting a server, opening a browser or
asking the developer to look. It closes its own loop.

### 13.5 What makes it expert rather than mechanical

Four properties, each of which is a thing a human maintainer would otherwise have to say out
loud on a pull request.

- **It refuses with a fix, never with an error string.** An assembly named `Cart` comes back as
  a refusal that names the rule, the reason, and `cart` as the name that would work.
- **It says what is next.** Adding an assembly returns the tag that places it, because an
  assembly nobody placed is the most common half-finished state there is.
- **It knows what it cannot know.** Asked to place an assembly on a page that does not exist, it
  says so and lists the pages that do, rather than creating one nobody asked for.
- **It never edits the author's own files to register anything.** The generated module is
  regenerated; a page template, or a view that holds the directive as markup, is edited only
  when the agent asked for a placement, at a named position, and the diff comes back with the
  answer. A view its author writes as source is never edited: the answer is the line to write.

### 13.6 Safety

The framework ships capability, not autonomy.

- Every tool is scoped to one project root, resolved once, and refuses a path outside it.
- Nothing runs a shell command. `check` runs the gates in process and returns findings.
- Nothing publishes, deploys, or touches a remote. Those stay in the command line, where a
  person types them.
- Mutating tools report every file they wrote, so the agent's caller can see the whole change.

### 13.7 What a new project carries

An agent meets a project before it meets the framework, so the project says what it is. Beside
the project's own files, `new` writes what an agent needs in its first minute:

| file                                                | what it is                                                                                                                                                                                                                                |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                                         | What a page, an assembly, a placement, a service and an api are; how to ask the project and change it; every rule of `assemblejs://rules`, by its id. The command line's part stands between two comments, and the rest is the project's. |
| `CLAUDE.md`                                         | One line, `@AGENTS.md`. Claude Code reads a `CLAUDE.md` in place of `AGENTS.md` wherever one exists in the project or above it, and the import is its documented way to share the one file.                                               |
| `.mcp.json`, `.cursor/mcp.json`, `.vscode/mcp.json` | The project's own server, registered for each client that reads a registration from a project, in that client's form.                                                                                                                     |

The server is a development dependency of the project, `@assemblejs/mcp` beside the command
line, and each registration runs its entry point with node. No shell, no package runner and
nothing fetched when an agent starts, and the server an agent talks to is the one the project
installed. It is built on one exact version of the command line, and checks with that one.

**The root is the one thing a registration must get right**, because every tool is scoped to it
(13.6). Cursor and VS Code fill their workspace folder into a server's arguments, so their
registrations name the server in full and hand it the root as its one argument, whatever
directory it is started in. `.mcp.json` has no such variable, so its server is named by a path
from the directory Claude Code starts it in, which is the session's: observed, not documented.
What Claude Code does document is the project's root in the server's environment, as
`CLAUDE_PROJECT_DIR`, and the server takes its root from there. A server given neither an
argument nor that variable works where it was started, and one whose root is no directory
refuses to start, on standard error.

**Held current, and never rewritten behind the author's back.** The instructions carry no
version: they are what the installed command line writes, or they are not, and `check` says
which (`agent-instructions-are-current`). It refuses, the same way, this server registered
otherwise than this version registers it, a registered server the project does not depend on,
and a `CLAUDE.md` that hides the instructions by not importing them. A project that carries
none of these files has nothing to hold.

Two command lines judge those instructions: the project's, when a person runs `check`, and the
one the server is built on, when an agent does. Installed at versions that were not released
together, each would call the other's instructions out of date, and no rewriting would satisfy
both. So where the installed server is built on another command line than the one installed
beside it, `check` reports that and nothing else about these files, from either side, with the
update that puts it right.

`assemblejs add agents` is the one thing that writes them after `new`. Into a project that has
none it writes all of them; in one that has some it rewrites only what is the command line's
own: its part of `AGENTS.md`, the one import in `CLAUDE.md`, its own server in a registration.
Another server in a registration and the project's own text in an instruction file are kept,
and a registration that is not JSON it can write back whole is refused before anything is
written. `create_project` writes the same files and merges the same way, into a root that may
hold some of them already: the registration that started the server there is the commonest.

### 13.8 What a person asks for

Tools are the agent's to call. A prompt is the person's to pick: the protocol lists them, and a
client that supports prompts offers them to its user, Claude Code and VS Code as commands. There are four, the things a person asks an agent
for most in the order a project grows, and each answers a brief, one message in the person's
voice, written as the framework would brief an agent that had never seen it.

| prompt           | what a person fills in         | what the brief has the agent do                                                                                                                       |
| ---------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `add_assembly`   | a name, and a renderer or none | Look for it first; add it; write its view; render it; place it where it was told to, or say that it is not placed and ask; check.                     |
| `place_assembly` | an assembly, and where or not  | Place it on the page or in the assembly named, or ask which when none was; compose it and read the account of each placement; check.                  |
| `make_page`      | a name                         | Write the page's whole document from the one a new project's page is written with; place what belongs on it, asking when not told; compose it; check. |
| `fix_findings`   | nothing                        | Check; take each finding by the fix it names, with `explain` where that is not enough; change nothing wider; check again until none is left.          |

A brief does three things a tool's description cannot. It gives the order: look before adding,
see before saying it is done, and `check` last, every time. It says where to stop and ask: an
assembly that exists, a place nobody named, a page whose contents nobody gave. And it says what
an answer means: that a refusal carries its fix, that a placement which fell back looks the
same in the markup as one that worked, that a fix which is a command is for a shell this
server does not run.

What a person fills in becomes part of what a model reads, so a prompt takes only a name of the
framework's own shape, or one of its own list for a renderer; the protocol refuses anything
else as invalid before a brief is written. A prompt names no tool and no resource the server
does not have, which its tests hold.

---

## 14. Decided here

Each of these was open, or reverses something recorded earlier. Each is decided, with the
reason, so nothing has to be remembered.

1. **A page template writes `<assembly name="…">` and the server emits `<assembly-root …>`.**
   Two elements, because no single word is right in both positions: a placement is nested by
   definition, a served fragment is not. The template form is a directive the server replaces
   and never emits, so it needs no hyphen and reads as the plain noun. The emitted form is a
   real custom element, so it takes the hyphen, and `root` is what every framework already calls
   the element it mounts into. This reverses the earlier `<assemble-assembly>` working form,
   which stutters, and it avoids `slot`, which the naming rule lists as taken and which would
   ship a second meaning beside a ratified Shadow DOM opt-in that uses the real `<slot>`. The
   plan left this detail to the rung that emits it.
2. **The data an assembly renders with is `data`**, not `api`. `api` is the ratified noun for
   the raw-data endpoint, and one word cannot mean two things in the same object.
3. **The CLI's `new` produces a one-framework project and `add` brings the second.** The move
   is the thing worth teaching, and a first `dev` that already shows two frameworks hides it.
   It also keeps the smallest project small and installs no framework the author did not ask
   for. The two-framework page is what the tutorial's second minute produces, not its first.
4. **Services return their data** rather than mutating a shared context. A mutated context makes
   every service order-dependent and untestable alone.
5. **Nothing is forwarded to a remote assembly by default.** Forwarding an incoming
   `authorization` header to a third-party origin is a credential leak that looks like a
   convenience.
6. **The data endpoint calls the same function the content endpoint calls**, rather than
   re-entering the content route with a flag. Re-entry is elegant and it loses the composition
   state the render had, so the two answers can differ.
7. **Events replay the last value only, opt-in per topic** (each topic the page's stream sends
   opts in). It solves the real race, a late island missing an early message, without an unread
   history.
8. **Islands ship native modules**, not immediately-invoked bundles over a page global. The
   browsers all support it; the global was a bundler workaround.
9. **Depth and cycles are refused by the parent before dispatch**, not only by the child on
   arrival, and not by a comment naming a known problem.
10. **Caching is per-placement and explicit.** There is no global cache with a blanket lifetime,
    and no cached response for a request that carried a credential.
11. **A page template is the whole document. There is no layout concept.** A shared head, nav or
    footer is an assembly the page places. One composition concept is the discipline this design
    is built on, and a second one is the kind of thing that makes a framework need a tutorial.
12. **Routes are a flat table with parameters** (`/products/:id`). Nested routes, wildcards and
    route groups are not in 1.0. Nothing the mission needs requires them, and every one of them
    is a way for two routes to disagree about which matched.
13. **No form or mutation machinery in the framework.** An api takes a POST. Each framework
    already has opinions about forms and ours would fight all of them.
14. **Nothing is exported without a test that exercises it from a consumer's position.** Doc
    examples compile in CI. An abstraction with no reader is deleted rather than kept for the
    day something might want it.
15. **Every gate is watched failing on a known-bad input before it is trusted.** The quality bar
    is behaviour, not a coverage number.
16. **A view places a child with the directive and is never handed one.** This reverses
    "children arrive as strings". A renderer that is handed its children must be rendered twice,
    or told what they are before it has run, and a framework's browser half would have to read
    them back out of the page to hydrate. Rendering once and composing the markup needs neither,
    and a slot that writes the same directive on both sides gives every framework the same
    markup to hydrate against.
17. **A child a view places is this server's, with no policy of its own.** A view has nowhere to
    declare a deadline, a fallback or a url for what it places, and nothing needed one. A child
    from another server, a child's own query and a cap on how many a view may place are each
    one question, asked when an application needs it.
18. **What a view places is read from its source, and its name is never computed.** Everything
    decided before a request reads it: whether a page carries the runtime, what a deferred
    parent's children need linked, whether the assembly exists. A name that is data would be
    known only to a render.
19. **A Lit assembly in a Lit view's own tree is refused, not repaired.** Detaching the child
    while its parent hydrates would move live nodes. A shadow root on the child is one line and
    hides it.
20. **A project installs its agent surface and registers it by a path, not by a package
    runner.** A registration that fetched the server when an agent started would run whatever
    version the registry held that day, against a project checked by another, and would need a
    network and a shell. The cost is one more development dependency in every project, which a
    built server never installs.
21. **The rules live with the command line.** `new` writes them into a project and `check`
    names them, and the agent surface, which depends on the command line, explains the same
    list. One list in the package both read is the only arrangement in which they cannot differ.

---

## 15. Answered by the owner

**How does an assembly get registered? It does not.** Owner, 2026-09-03, against this design.

A directory under `assemblies/` simply is an assembly. Nothing to register, nothing to import,
no list restating the directory tree, no file two people editing different assemblies both have
to touch. The tool generates a typed import module the author never opens and never commits, so
the built server still has a static import graph and production never scans a directory.

`server.ts` never grows. Its whole job is to hand the server what the build found:

```ts
import { createServer } from "@assemblejs/core";
import project from "../.assemblejs/project.js";

const app = await createServer(project);
await app.listen();
```

`.assemblejs/project.ts` is the generated module: the assemblies, pages and apis the build
found on disk, the version of the build's output, and where its browser files are. The import is
the one line a two-line file cannot avoid, because a library cannot import a module its user's
build generates without a bundler doing it at run time, which is what section 11 rules out.

Adding an assembly writes the assembly's own files and adds one tag to a page template. That is
the whole change. This supersedes the earlier recorded shape, where adding an assembly edited
the author's server file at a marker comment.

Nothing else in this document is open.
