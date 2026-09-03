# Design

The contract, written before the code. Everything here is decided. What it reverses from an
earlier record is named in section 13; what remains genuinely open for the owner is section 14.

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

Request headers, all optional, all prefixed `assembly-`:

| header           | meaning                                                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `assembly-page`  | Opaque id of the page being composed. Present means "you are a fragment"; absent means "you are the page".                        |
| `assembly-id`    | The id this instance must stamp on its envelope. The parent allocates it, so the parent can address the result before it arrives. |
| `assembly-depth` | How many assemblies deep this request is. A server refuses above its cap.                                                         |
| `assembly-path`  | Comma-separated ids of the ancestors, innermost last. Used to detect a cycle.                                                     |

Every one of these is validated on arrival against its declared shape (id and page: one uuid;
depth: an integer within the cap; path: uuids, at most the cap, comma-separated). A malformed
value is `400`, never a coerced default. They are composition state, so an outside caller may
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
<sub-assembly data-name="cart" data-id="a7f3" data-view="default" data-renderer="svelte">
  …the assembly's own markup…
  <script type="application/json" data-assembly="a7f3">
    { …data… }
  </script>
</sub-assembly>
```

Added only when they apply: `data-remote` (the origin, when the assembly came from another
server), `data-defer` (the content has not been fetched yet), `data-failed` (the render or the
fetch failed and this is a fallback).

`sub-assembly` is a custom element with no behaviour of its own. It is the styling scope hook
and the hydration hook. It is chosen so the boundary is visible in devtools and addressable in
CSS without a class convention, and so that the same element serves as the placeholder in a page
template and as the wrapper in the output: the server fills it in place. An author may add
classes and attributes to it through the assembly's declaration, never through the page
template, which keeps a page from styling another team's internals.

The data island sits inside the envelope, next to the markup. The browser runtime reads it,
parses it and removes it. It carries only what section 5.3 allows.

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

`assembly-depth` increments per hop; `assembly-path` carries the ancestor ids. Both are checked
by the **parent, before it dispatches**, not only by the child on arrival: a request that would
exceed `limits.depth` (default 8), or whose target already appears on the path, is never sent.
The placement takes its fallback and a diagnostic. A server also refuses on arrival, because a
request can come from anywhere, but the refusal a well-behaved composer relies on is its own.

A page cannot be made to recurse by any request an outsider can send, and a self-referencing
assembly is a diagnostic at the first hop rather than a hang, a socket exhaustion or a stack
overflow.

### 3.5 Deferred assemblies

A placement declared `defer: true` is not fetched during the page render. The server emits its
empty envelope with `data-defer`, and the browser runtime fetches the content endpoint after
load and replaces the envelope's children. Deferring is the answer for a genuinely slow assembly
that must not hold the page; everything else uses the deadline.

`defer` and `required` together are a boot error. A deferred assembly's outcome arrives after
the page has shipped, so it cannot fail the page, and a declaration that says it can is a
misunderstanding worth catching at boot rather than a rule worth explaining in prose.

### 3.6 Real-time

An api handler may hold a response open and stream server-sent events. The browser runtime opens
one connection per page, not one per assembly, and delivers each message onto the page's event
bus, where assemblies receive it exactly like any other event. Nothing in the assembly's code
knows the message came from the network.

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
  decision, never a default.
- The response is capped, default 2 MiB, and must be `text/html`. Anything else is a failure.
- Remote response headers are discarded. Nothing a remote sets reaches the visitor.

### 5.2 Inbound

A fragment is a public HTTP resource unless auth is configured. Auth is one seam in core: basic
credentials or an `authenticate(request)` callback, plus a list of public routes, evaluated in
**one place before anything else**, so there is no second path that disagrees with the first.
The framework ships no user store, no login page and no session.

A default content-security policy and a same-origin CORS policy ship on by default; allowlisted
remote origins are added to the policy automatically, because they are the only extra origins
the page is designed to load from.

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
  readonly children: Readonly<Record<string, string>>; // already HTML
  readonly helpers: Readonly<Record<string, unknown>>;
  readonly url: URL;
};

// @assemblejs/renderer-x/client     browser
export interface ClientRenderer {
  mount(el: Element, data: JsonObject, ctx: MountContext): MountHandle;
}
export type MountHandle = { unmount(): void };
```

- **Children arrive already rendered, as strings.** One conversion, in the caller. No renderer
  reaches for children itself, so plain HTML and Markdown nest exactly as React does.
- **No try/catch inside a renderer.** A failed render throws, the composer catches it, and the
  placement falls back. A renderer that returns its own error `<div>` produces markup that
  passes every check downstream.
- **Escape by default**, with one explicit raw mechanism. `children` are the single exception
  and the only exception: they are already-rendered HTML by contract.
- **`mount` returns a handle and the runtime calls `unmount`.** A teardown nothing invokes is
  not a teardown.

The view file's extension picks the renderer. Where an extension is shared, the filename says
which: `cart.react.tsx`, `cart.preact.tsx`, `cart.solid.tsx`. `cart.svelte`, `cart.vue`,
`cart.md` and `cart.html` need no infix. A page's frameworks are then visible from a directory
listing.

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
assemblejs.config.ts            policy only: remotes, deadlines, renderers, port
```

**A directory under `assemblies/` is an assembly.** There is no registry to maintain, no import
to add, no list restating the directory tree. The CLI generates a typed module the author never
opens and never commits; the built server imports it, so production has a static import graph
and no runtime globbing.

A page template places assemblies by name, using the same element that will wrap them:

```html
<main>
  <sub-assembly name="hello-react"></sub-assembly>
  <sub-assembly name="hello-svelte"></sub-assembly>
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

A service returns; it does not mutate:

```ts
export default defineService({
  name: "greeting",
  async run(ctx) {
    return { greeting: `Hello, ${ctx.params.name ?? "world"}` };
  },
});
```

Returning is testable in isolation, composes without hidden order, and makes the data shape the
function's return type. Services run in declaration order; one that must follow another says
`after: ["greeting"]`. There is no priority number. Services run **before** children are
fetched, so a service can shape what its children are asked for.

An api is a route:

```ts
export default defineApi({
  path: "/api/time",
  GET: () => ({ now: new Date().toISOString() }),
});
```

---

## 9. The browser

One runtime, framework-free, served once per page. It finds every envelope, reads and removes
each island, and mounts each assembly through its renderer's client half.

    mount:   client:load      mount immediately (default)
             client:idle      mount when the browser is idle
             client:visible   mount when the envelope scrolls into view
             client:none      never mount; the assembly is static HTML

Declared per assembly. A static assembly ships no JavaScript at all, which is a mode and not an
accident.

Events are typed, page-scoped and owned by the assembly:

```ts
const events = useEvents(); // scoped to this assembly
events.send("cart:add", { sku }); // sender identity stamped by the runtime
const off = events.on("cart:add", handler); // removed automatically on unmount
```

- Subscriptions are held by the assembly's handle, and `unmount` removes **exactly the
  references it added**. A leak is not possible by forgetting.
- Delivery is addressable by something the sender can name: every assembly, one name, one
  instance id, or the page.
- **Last-value replay is opt-in per topic.** A late-hydrating assembly can see the message it
  missed. There is no unbounded history that nobody reads, and no buffer that is filled and
  never replayed.
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

Stated plainly rather than implied: `@keyframes`, `@font-face`, `@import` and `@page` are global
by nature and are not scoped. Nothing pretends otherwise.

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
- The bundler is a development and build-time tool owned by the CLI. `assemblejs dev` runs it in
  middleware mode, which is where hot reloading comes from; `assemblejs build` emits the server
  and the client assets; neither leaves a trace in the running server.
- The dev server binds loopback by default. Devtools are development-only, read-only over HTTP,
  and a boot assertion refuses to start if any route under the devtools prefix accepts anything
  but `GET` or `HEAD`.

---

## 12. Errors

- A process-level `unhandledRejection` and `uncaughtException` handler logs and exits, rather
  than leaving a process running in a state nothing accounted for.
- Every failure gets a **correlation id**. The visitor sees the id; the log holds the exception.
  A message from an exception never reaches a response body.
- The correlation id appears on the diagnostic, in the log line, and in the fallback envelope,
  so one failing assembly on one page can be found in a log without guessing.

---

## 13. Decided here

Each of these was open, or reverses something recorded earlier. Each is decided, with the
reason, so nothing has to be remembered.

1. **The placement element is `<sub-assembly>`**, both in a page template and as the wrapper in
   the output; the server fills it in place. It reverses the earlier `<assemble-assembly>`
   working form, which stutters, and it avoids `slot`, which the naming rule lists as already
   taken and which would ship a second meaning next to a ratified Shadow DOM opt-in that uses
   the real `<slot>`. `sub-assembly` is exactly the ratified word for a nested assembly, needs
   no new vocabulary, and satisfies the hyphen a custom element requires. The plan left this
   detail to be decided at the rung that emits it.
2. **The data an assembly renders with is `data`**, not `api`. `api` is the ratified noun for
   the raw-data endpoint, and one word cannot mean two things in the same object.
3. **Local assemblies need no declaration**; the filesystem is the registry and the CLI
   generates the import module. This reverses the earlier working shape, where `add` edited the
   author's `server.ts` at marker comments. A hand-maintained list restating the directory tree
   was the largest single piece of ceremony, and a generator that edits the author's source to
   register something is worse than the ceremony it removes.
4. **Services return their data** rather than mutating a shared context. A mutated context makes
   every service order-dependent and untestable alone.
5. **Nothing is forwarded to a remote assembly by default.** Forwarding an incoming
   `authorization` header to a third-party origin is a credential leak that looks like a
   convenience.
6. **The data endpoint calls the same function the content endpoint calls**, rather than
   re-entering the content route with a flag. Re-entry is elegant and it loses the composition
   state the render had, so the two answers can differ.
7. **Events replay the last value only, opt-in per topic.** It solves the real race, a late
   island missing an early message, without an unread history.
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

---

## 14. Open for the owner

One item. Everything else in this document is decided, and section 13 names the four decisions
that reverse an earlier record and can be overruled by a word.

- **Does the CLI's `new` produce a one-framework project or a two-framework page?** The mission
  is that many frameworks share one page, and a first `dev` that already shows two frameworks
  talking to each other demonstrates it in the first minute. It also makes the smallest project
  bigger than it needs to be, and installs a framework the author did not ask for. The recorded
  transcript starts with one and adds the second by hand, which teaches the move rather than
  showing the result. Both are defensible and the choice is about what the product says on first
  contact.
