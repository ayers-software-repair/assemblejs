# Decisions

The running log. A decision lands here the moment it is made, with the reason, so no session has
to remember it. Expensive-to-reverse decisions also get an ADR under `docs/adr/`. Nothing here is
edited after the fact; a later decision supersedes an earlier one by saying so.

## The product

- **What it is.** Pages composed on the server from assemblies, each written in one UI framework,
  living either in this project or on another server. Reason: this is the thing the v1 proved and
  the thing nothing else does; server composition of independently owned fragments is the product,
  not server rendering.
- **Who it is for.** A team that wants to hire a React developer, a Vue developer and a Svelte
  developer into one codebase and have each productive on their first day in the framework they
  already know. Every design choice is judged against one scene: two of them pair on the same page
  in their first hour, each in their own framework, and the page composes both.
- **The internal bar**, never used in public copy: it should be simple enough that someone who has
  never seen the framework can assemble a page from parts without a tutorial.
- **No competitor is named or compared against** on any public surface. We describe what we do.

## Vocabulary (fixed; the README defines it, code and docs use it exactly)

Decided one noun at a time. Rule: HTML's own words where HTML already has the thing, machine terms
for structure, data terms for data, nothing invented.

| concept                                     | word                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| the composed page                           | **page**                                                                 |
| the unit, one framework, whole, addressable | **assembly** (**subassembly** when nested)                               |
| an assembly served by another server        | no separate word; the URL says it                                        |
| the server-side data step                   | **service**                                                              |
| the raw-data endpoint                       | **api**                                                                  |
| the runtime                                 | **server** (`createServer()`)                                            |
| the browser wiring                          | **events**                                                               |
| the config file                             | `assemblejs.config.ts`                                                   |
| the server-to-server handshake              | **manifest** (reserved for this)                                         |
| the command                                 | bin `assemblejs`, alias `asm`; verbs new, add, dev, build, check, deploy |

The v1 called these mesh, face, view, preprocessor. Its own word for the server-side data step was
split across two concepts (preprocessor and service); they are one concept here.

## Ruled

- **Rewrite, not a port.** The v1 is read whole as evidence and then set aside. Reason: the v1's
  core cannot start without a bundler's dev server, its quickstart does not complete on a clean
  install, and its composition loop has no failure isolation. Those are architectural, not bugs.
- **Composition:** a page waits for its assemblies, but every assembly carries a deadline and
  declared fallback content, so a slow or dead one degrades instead of blocking or killing the
  page; an assembly may additionally be declared deferred, in which case the page ships a
  placeholder and the browser fills it after load. Owner, 2026-09-03. Reason: the v1 used a bare
  `Promise.all` with neither isolation nor fallback, so one bad child was one bad page.
- **Licence:** Apache-2.0 verbatim, with NOTICE. Copyright line carries no year.
- **Packages:** `@assemblejs/core`, `/cli`, `/create`, `/devtools`, `/renderer-templates`, and one
  `@assemblejs/renderer-*` per framework. Reason: a React team must not install Vue.
- **Everything the mission needs ships in 1.0.** Owner, 2026-09-02. Nothing that the stated
  mission requires is deferred to a later version.
- **Two channels.** Branch `next` publishes prereleases under the `next` dist-tag; branch `main`
  publishes a version exactly once. Reason: npm versions are immutable, so the estate's
  overwrite-in-place practice cannot apply to a package.
- **Publishing** is CI-only through npm trusted publishing (OIDC) behind a reviewed environment.
  There is no publish token anywhere, and no one publishes from a laptop.
- **Style isolation:** an assembly's CSS is scoped by default; Shadow DOM is a per-assembly
  opt-in. The parts that cannot be scoped (keyframes, font-face, imports, page rules) are
  documented as global rather than hidden.
- **Auth** lives in core: basic credentials, an `authenticate` callback, and public routes; boot
  fails loudly when auth is on and credentials are missing. Forwarded to another server's assembly
  only by opt-in.
- **Assemblies from other servers** are allowlisted by exact origin. No wildcards.
- **An assembly is a public HTTP fragment by default**; auth applies when configured.
- **Real-time** is server-sent events through an api handler, delivered to assemblies over the
  events wiring. No WebSocket in core.
- **An assembly may declare named views** (device, locale, experiment) with a selector; one view
  is the default. Reason: the v1 used this in production.
- **Devtools** are development-only and read-only over HTTP. Reason: the v1's rewrite exposed a
  browser-reachable route that ran shell commands.
- **The landing page shows framework names, not third-party logos.** Reason: most framework marks
  require permission for placement on a third-party marketing page, and several forbid recolouring.

## Working practice

- The rules for how this repository is worked live in `CLAUDE.md`; the ledger in `docs/TODO.md`;
  the plan in `docs/PLAN.md`; the reference reads in `docs/dossiers/`.
- Owner, 2026-09-03: nothing lives in a session's memory; check the file, never assume; keep the
  ledger and check tasks off as they are done; do not stray from the plan, and when something
  unexpected forces a change, fix it, log it here, raise it only if the plan's shape changes, then
  pivot and continue.

## 2026-09-03: the reference reads are not published

Expected: the whole reads of the predecessor would live in this repository under `docs/dossiers/`,
because the plan said work roots in its dossier.

Found: the identity gate refused the commit. The dossiers quote the predecessor's package name and
route prefix as evidence, which is exactly what a citation must do. Checking why the gate exists
surfaced the larger problem: the production predecessor is a PRIVATE repository, and these
documents are a detailed autopsy of it, including security findings and production history.

Decided: reference reads stay out of this public repository and live in the private estate
document store. `docs/dossiers/` is in `.gitignore` so it cannot be committed here by accident.
What a contributor needs is the design and the decisions, not an audit of a private predecessor,
and publishing one would expose someone else's code and its weaknesses. The identity gate stays
strict; nothing is excluded from it.

Fix, same day: `.gitignore` alone was not enough, because the gate walked the filesystem and the
dossiers were still on disk. The gate now scans what git TRACKS (`git ls-files -c`, which covers
staged files, so a new file is scanned the moment it could first enter history). Only a tracked
file can be committed, published, or land in a tarball; failing on scratch files that can never
ship teaches people to skip the gate.

Incident logged with it: restoring that scan deleted the gate's own `--self-test` block, and the
flag then printed success without running anything. The three red tests caught it. The self-test
now asserts its own preconditions (the fixture directory exists, the patterns match at least four
fixtures, the publisher fixture is present) and was watched failing with the fixtures removed and
with the publisher fixture removed. A probe that cannot fail is worse than no probe, because it
reports safety.

## 2026-09-03: the design is written, and what it reverses

`docs/DESIGN.md` is the contract, written before any code. It specifies the decisions above
rather than restating them, and it settles every fork the reference reads left open. Four of its
rulings reverse a shape recorded earlier in the planning, and they are recorded here because a
reversal that lives only in the newer document is a trap for the next reader.

- **The placement element is `<sub-assembly>`**, in a page template and as the wrapper in the
  output, the server filling it in place. Reverses the earlier working form, which stuttered.
  Reason for not using the obvious word: `slot` is on the naming rule's taken list, and Shadow
  DOM is a ratified per-assembly opt-in that uses the real `<slot>`, so the framework would ship
  two unrelated meanings of one word. `sub-assembly` is already the ratified word for a nested
  assembly, invents nothing, and satisfies the hyphen a custom element requires.
- **The data an assembly renders with is `data`, not `api`.** `api` is the ratified noun for the
  raw-data endpoint; one word cannot mean two things in the same object.
- **Local assemblies need no declaration.** The filesystem is the registry and the tool generates
  the import module the author never opens. Reverses the earlier shape, where adding an assembly
  edited the author's own server file at marker comments. Reason: the hand-maintained list
  restating the directory tree was the largest single piece of ceremony, and a generator that
  edits the author's source is worse than the ceremony it removes.
- **Services return their data rather than mutating a shared context.** Reason: a mutated context
  makes every service order-dependent and untestable on its own.

Three further rulings the design makes that were not previously recorded either way: a page
template is the whole document and there is no layout concept; routes are a flat table with
parameters; there is no form or mutation machinery, an api takes a POST. Each is in
`docs/DESIGN.md` section 13 with its reason.

## 2026-09-03: the adversarial audit, and the constraints it puts on the design

The defect hunt over the production predecessor ran eight lenses, each finding refuted by an
independent second reader. Raised 74, survived 61: thirteen critical, twenty high, twenty-two
medium, six low. Thirteen fell to refutation, which is the point of the refutation pass.

The finding that matters most is not any single defect but their shape: the architecture is
sound and every failure is at a boundary that was never declared. Four boundaries, four
patterns, and they account for nearly every row. Composition had no isolation and no bounds.
The trust boundary was never stated, so credentials and raw headers crossed it. Configuration
was read from a place that is empty at runtime, so every setting took its default forever and
the security controls keyed on those settings could never turn on. And abstractions were
declared without being wired, so the type system described a system that did not exist.

The design answers each with a section rather than a bullet: configuration is section 4, trust
is section 5, representation is section 6, errors are section 12, and failure isolation with
bounds is sections 3.3 and 3.4. The audit's fifteen imperatives are each traceable into one of
them. That is the audit's real output; the ranked list is the evidence for it.

The audit stays in the private estate document store with the dossiers, for the reason already
recorded: it is a security autopsy of a private repository.

## 2026-09-03: the placement element is two elements, not one

Expected: one custom element serving as both the placeholder an author writes in a page template
and the wrapper the server emits, the server filling it in place. It is the smaller surface and
it was the design's first form.

Found on review: no single word is right in both positions. A placement is nested by definition,
so a name that says so reads correctly in a template and wrongly on the envelope returned by a
bare fetch of `/assembly/<name>/`, where nothing encloses it. A name that ignores the nesting
reads correctly on the envelope and vaguely in a template. The sameness was the constraint
forcing an awkward name, so it was dropped.

Decided: a page template writes `<assembly name="cart">`, which is a directive the server
replaces and never emits, so it needs no hyphen and reads as the plain noun. The server emits
`<assembly-root data-name="cart" …>`, a real custom element, hyphenated as the standard requires,
named for what every framework already calls the element it mounts into. The author writes one
and reads the other, which is the same split every framework has between authored and emitted.

## 2026-09-03: the registration question is what goes to the owner, not the scaffold

Expected: the one front-loaded question would be whether the tool's `new` scaffolds one framework
or two.

Found: that is a template choice, reversible in an afternoon, and the design already has a
defensible answer, so it was decided rather than asked. `new` produces one framework and `add`
brings the second, because the move is the thing worth teaching. The reversal that actually needs
the owner's word is registration: the design recommends that a directory under `assemblies/` is
simply an assembly, with a generated import module the author never opens, replacing the recorded
shape where adding an assembly edits the author's own server file at a marker comment. It changes
the day-one transcript he has already reviewed, it changes what `add` does, and the tool and every
template get built around whichever answer is right.

Consequence for the ladder: B-02 now lands only the package's exports map and build, and the
vocabulary constants move to B-04, where the envelope first needs them. A word still waiting on
the owner is not encoded into six rungs before he has seen it.

## 2026-09-03: an assembly is not registered anywhere. Owner.

Asked against the written design, as the one front-loaded question: when someone adds an
assembly, how does the server learn about it?

Answered: it just exists. A directory under `assemblies/` is an assembly. Nothing to register,
nothing to import, no list restating the directory tree. The tool generates a typed import module
the author never opens and never commits, so the built server keeps a static import graph and
production never scans a directory. `server.ts` is `createServer()` and `listen()`, and it never
grows. Adding an assembly writes that assembly's files and adds one tag to a page template.

This supersedes the earlier recorded shape, where adding an assembly edited the author's own
server file at a marker comment, and it strikes the marker-comment mechanism from the tool
entirely. The owner's words with the answer: it should be as simple as possible.

Consequence: the day-one transcript changes. The generated `server.ts` loses its imports, its
renderer array, its pages array and its assemblies array. `add` never edits the author's source.

## 2026-09-03: the organization rules, and that each one is a tool

Owner, in his own words: "1 thing per file, clear dirs, even though its alot its clear to read",
then "index with subdirs instead of all files by index", then "need to enforce all code styles
too, with best practice tools for making sure things stay uniform, organized".

Seven rules, settled with him and written into `CLAUDE.md`: one declaration per file with the
filename naming it; every directory carrying an index that only re-exports; the package surface
re-exporting child indexes and never a leaf; a sibling importing the leaf and never an index;
`test/` mirroring `src/` exactly; no drawer directory; three hundred lines as the ceiling.

The fourth was the one real fork and he took the strict side: inside a package a module imports
the leaf file. An index is for consumers of a directory, not for the code inside it, which is
what makes an index cycle impossible and what makes the dependency graph true.

None of them is advice. `scripts/check-organization.mjs` reads them off the TypeScript AST rather
than off a regex, because a rule about declarations has to count declarations; it was watched
going red on a fixture that violates six of the seven, one violation per rule, and its
`--self-test` fails if any rule stops firing. `scripts/check-mirror.mjs` covers the fifth and was
watched catching both a source with no test and a test with no source. The module graph's own
rules are dependency-cruiser's, and the two that matter, no cycle and browser code never reaching
server code, were each introduced deliberately, watched failing, and reverted by inverse edit.

Recorded because the first version of the surface rule keyed on the path spelling `src/index.ts`
and was therefore silent on every tree not called `src`, including its own fixture. The
self-test is what found it. A gate whose fixture cannot reach one of its rules is a gate with a
hole in exactly the place nobody looks.

## 2026-09-03: the toolchain is chosen, not inherited

Owner: "dont just adopt the tooling of the other repos. do it right. get the docs. look up
current best practices. etc. you are the maintainer. not me. be prideful. be smart. be exact.
dont overengineer."

So the predecessor's toolchain is evidence, not a template. Measured from its own manifest, it
ran eslint 8 with the google config, prettier, dependency-cruiser, commitlint, husky,
lint-staged, commitizen, auto-changelog, typedoc, jest, sort-package-json, depcheck, typesync and
npm-check-updates. Of those, dependency-cruiser and sort-package-json are carried because they
still earn their place; jest, commitizen and auto-changelog are replaced by vitest and changesets;
depcheck and typesync are superseded by knip and by declaring dependencies properly.

Everything else is being verified against the tools' current documentation before it lands, and
anything that catches nothing another tool already catches is cut. The bar he set is six tools
that each earn their keep over fourteen that overlap.

## 2026-09-03: a separate agent verifies every rung

Owner: "always use a verification subagent to verify your work", and "tripple check everything in
full". Written into `CLAUDE.md` as a working rule. A rung's own proof being green is the author's
claim; a fresh reader with no stake in the work checking it at the source is the verification.
Its findings are fixed before the rung is reported done.

## 2026-09-03: the second verification pass, and what it cost

A separate agent verified B-03 and B-04 adversarially. Three findings were high, and all three
were things a green local run had been asserting were fine.

- **A clean clone could not install, so CI never reached the first gate.** pnpm 11 replaced
  `onlyBuiltDependencies` with `allowBuilds` and refuses an install rather than running an
  unapproved build script. The old key is silently inert. A working tree kept installing because
  its `node_modules` was already built, so the failure was invisible to every local run and
  total in CI. Fixed, and proved on a fresh clone.
- **A transport that misbehaved took the whole page down.** The declared type says a Fetch
  returns a Promise of a result, but a type is a promise about source, not about what a caller
  hands over. A synchronous throw, a non-Promise return and a resolution to `undefined` each
  killed a page over a placement that was never declared required, which is precisely what
  failure isolation exists to prevent. The transport call is now normalised in one place, and
  the composer no longer re-throws anything it did not declare required, which was discarding
  what `allSettled` bought two lines earlier.
- **Two different assemblies could share one identity.** `identity("a/b", "c")` and
  `identity("a", "b/c")` are both `a/b/c`, and a template could declare either, so one
  assembly's content could be served into the other's placement and read from its cache key.
  Placement names and views are now validated against the same shape a declared assembly must
  have, at the point the template is read.

Three more that were silent rather than loud: an uppercase `<ASSEMBLY>` was not a directive at
all and was copied to the output verbatim with no diagnostic, which is the exact silent drop the
finder's own comment claims to prevent; a directive inside an HTML comment dispatched a real
fetch and spliced markup into the comment; and a required placement threw before consulting the
cache, so it killed pages over an outage the cache was there to absorb.

Two gate holes: a `.mts`, `.cts` or `.tsx` source was invisible to both the organization gate and
the mirror gate, so two declarations, a missing test and a self-package import all passed; and
the CI workflow named its steps by hand and had drifted to running EIGHT FEWER gates than
`pnpm check`. CI now runs the one command, because a job that lists its own steps is a second
source of truth about what must pass and the two only ever drift.

The pattern across both verification passes is one thing: every defect was in something that
was reporting success. The gates are the product's memory, and a gate nobody has watched fail is
a comment.

## 2026-09-03: the browser runtime, and what a DOM shim cannot answer

The runtime's logic is proved in happy-dom on every `pnpm test`; four things are proved in real
Chromium and kept out of that suite, because they are what a shim cannot honestly answer: real
layout, a real `IntersectionObserver`, real module loading, and a real click.

The one that decides it is `client:visible`. A shim has no layout, so nothing in it can say
whether an element is on screen; the browser test puts an assembly three thousand pixels down a
page, asserts it has not mounted and still shows the server's markup, scrolls to it, and asserts
it then mounts. It goes red the moment `visible` stops deferring.

Recorded because one unit test was green for a reason it did not claim. "Does not mount twice"
passed with the guard deleted, because reading an island removes it and the second pass then
found nothing to mount. It was testing a side effect. It now puts an island back before the
second pass and goes red when the guard goes. A test that passes for the wrong reason is worse
than a missing test, because it is counted.

## 2026-09-03: the layer rule was answered twice rather than loosened

Building the runtime tripped `client-stays-browser-only` twice, and both times the honest fix
was to say what is genuinely shared rather than to widen the rule to fit the code.

`IslandPayload` moved to `src/island`: it is the wire format, so both sides own it by definition,
the same way `src/json` says what JSON is. `src/vocab` joined the shared list for the same
reason: the server spells the envelope element in order to emit it and the browser spells the
same one in order to find it, which is the entire reason those words live in one module.

After each widening the rule was re-proved against a real violation, browser code reaching
server configuration and then server options, and refused both times. A rule that has been
widened and not re-tested is a rule nobody knows the shape of any more.

## 2026-09-03: events are scoped by construction, not by discipline

An assembly never holds the bus. It holds what `forAssembly` returns, and every subscription made
through that is remembered against that assembly, so the runtime's teardown removes exactly the
ones it added and none of anyone else's. Forgetting to unsubscribe is not something an author can
do, rather than something they are told not to do. The leak test runs a hundred mount and unmount
cycles and asserts the bus returns to exactly the size it started at.

The sender is stamped by the runtime from what it already knows and is never taken from the
caller. A bus where anyone can claim to be anyone is a bus with no addressing at all, and the
test sends a payload whose own field says it is the cart while asserting the message still
arrives stamped as the catalogue.

Replay is opt-in per topic. The race it solves is real: an assembly that hydrates late missing a
message sent before it existed. An unbounded history that nobody reads is not, so a topic keeps
its last message only when it was declared to.

## 2026-09-03: the agent surface, and why it is not a wrapper around the command line

Owner: "this will be the first ai powered microfrontend framework where it exposes an mcp where
an agent can build it by using the mcp, in tandem with you like you use the cli, its like it
knows but its an expert."

Decided: `@assemblejs/mcp`, specified in `docs/DESIGN.md` section 13, and a ladder rung of its
own at B-09b, placed straight after the command line because it needs the composer, the server
and discovery and nothing after them.

The reasoning, because it is the part worth keeping. A command line is built for a person at a
terminal: it prints prose, takes flags in an order, and answers in exit codes. An agent driving
one parses sentences written to be read, guesses what is valid before trying, and learns what it
broke afterwards. The MCP inverts all three. It answers in structures, it says what is valid
before anything is written, and every mutation returns what changed together with what is now
true.

The two tools that make it expert rather than mechanical are `render_assembly` and
`compose_page`. An agent that has just written an assembly can see what it renders, what data it
produced, and which placement fell back, without starting a server, opening a browser or asking
the developer to look. It closes its own loop. Everything else on the surface is ordinary; those
two are the reason this is not a wrapper.

It carries no model and no credential and calls no inference API, ever. The intelligence is the
agent already in the room; what ships is the expertise. That is a cost property as much as a
security one: a framework that phoned an inference API would put a bill and a key into every
project that installed it, and neither of those is ours to put there. It also satisfies the
owner's standing rule that users must not be able to run up a bill through our AI.

It ships capability and not autonomy: one project root resolved once, no shell, no publish, no
deploy, and every written file reported back so the agent's caller can see the whole change.

## 2026-09-03: the agent surface works, and the loop it closes is the point

`@assemblejs/mcp` is wired to the protocol and driven end to end in its own tests: an in-memory
client reads `assemblejs://project`, calls `render_assembly` on an assembly written a moment
before, calls `compose_page` on a template, and asks `explain` why a rule exists.

The loop is the whole argument. An agent writes an assembly, renders it, sees the real envelope
the server would emit, places it on a page, composes that page, and reads one diagnostic per
placement. No server started, no browser opened, nobody asked to look. Every other tool on the
surface is ordinary; those two are why this is not a wrapper around the command line.

Three behaviours were chosen deliberately and each is watched failing:

- **It refuses rather than approximates.** A framework view is source that must be compiled, so
  it comes back with that reason instead of a rendering that is not what ships. Showing an agent
  something plausible and wrong is worse than showing it nothing, because it will believe it.
- **It names what exists.** Asked for an assembly that is not there, it lists the ones that are.
  An agent told "not found" guesses; an agent told what IS there does not.
- **It says what is next.** A rendered assembly comes back with the tag that places it, because
  an assembly nobody placed is the commonest half-finished state there is.

The safety primitive is one guard every path goes through, and it compares the RESOLVED
destination rather than the argument, so a traversal is settled before the check and not after
it. The root is a branded type, so a path that has not been through `resolveRoot` cannot stand
in for one, which is what keeps the check from being the easy thing to skip. A test asserts the
surface has no tool whose name contains shell, exec, publish, deploy or install.

## 2026-09-03: react-dom is ignored by knip, and why that is not a hole

The browser proof bundles its fixture from source, aliasing `@assemblejs/renderer-react/client`
to the renderer's own files. Those files import `react-dom/client`, so the root workspace must be
able to RESOLVE react-dom even though no file in the root names it. knip reports what no file
imports, which is exactly right and exactly why it cannot see this one.

It is listed in `ignoreDependencies` rather than removed, because removing it breaks the bundle,
and rather than papered over with a fake import, because a file importing something it does not
use to satisfy a tool is worse than a line of configuration that says what is going on.

If the browser fixture ever stops bundling renderer source, this entry should go with it.

## 2026-09-03: the mission is demonstrable, and a shim is not where it is demonstrated

`browser/svelte.browser.ts` is the day-one proof: a Svelte assembly and a React assembly on one
page, one click in Svelte, and the React assembly displaying who sent what. Neither imports the
other, neither knows the other's framework, and nothing sits between them but the page's bus.
That sentence is the product, and it is now a test rather than a claim.

Recorded because getting there needed a judgment call. Svelte 5's client runtime reads
`Node.prototype` getter descriptors when it initialises, and neither happy-dom nor jsdom
reproduces them: hydration fails inside svelte before any of this repository's code runs. Several
attempts went into the shim before that was clear.

The call: that is a fidelity limit of the shim, not a defect in the renderer, and a test that
passed on a fake DOM would be asserting something about the fake. So hydration is proved in a
real browser, which is the same answer `client:visible` already gets for the same kind of reason,
and the unit test says IN THE FILE what it does not test and why. A test file that quietly covers
less than its name suggests is the failure mode this whole ladder keeps finding; saying so where
the next reader will see it is the cheapest possible fix.

The two renderers deliberately differ where their frameworks differ. React takes its events
through a context; Svelte takes them as a prop. Each is the idiom an author of that framework
already writes, and wrapping either in the other's habits would be the framework telling people
how to write the framework they already know.

## 2026-09-03: services return, where the reference mutated

The reference is `refs/minimesh/src/types/face.preprocessor.ts`. Its preprocessor is
`(context) => Promise<void> | void` with a `priority?: number`, and
`face.controller.ts:58-78` runs three arrays in a fixed order, each step mutating the shared
context. Read before building, not after.

Two deliberate departures, and the reason for each.

- **A service RETURNS its data.** The reference's preprocessor returns void and mutates. That
  makes every one of them order-dependent, untestable on its own, and silent about what it
  actually contributed. With a return, the data's shape is the function's return type and a
  service can be called in a test with nothing around it.
- **`after: ["name"]` replaces `priority: number`.** A priority number is a claim about every
  other service in the system, made by someone who can only see one of them, and two services
  that both pick 1 have said nothing. Naming what you must follow is a claim about the one
  relationship the author actually knows.

What is kept from the reference, because it was right: services run BEFORE children are fetched,
so a service can shape what its children are asked for, and they run sequentially rather than
concurrently. A service that declared `after` said it needs the one before it to have FINISHED,
and running them together would make that declaration a lie.

Where the reference had three arrays with a fixed global-last order, there is one list. Its own
comment says view, then face, then global, which means the GLOBAL one wins every collision: the
least specific setting overrides the most specific. Here the order is declaration order with
`after` honoured, and the later of two writers wins, which is the same rule the fallback ladder
and the data merge already use.

## 2026-10-03: an api is given its body, and an api route is checked at boot

Expected: the landed `ApiContext` (`query`, `params`) would be enough to mount routes. Found:
the design says "an api takes a POST" (section 14, item 13), and a POST handler that cannot read
what was posted is not one. `ApiContext` gains `body: JsonValue | undefined`, the parsed request
body, absent on a request that carried none.

The boot refusals for an api are four, each one a way for two routes to disagree about which
matched or for a product route to shadow the framework: the same method and path twice (paths
that differ only in a parameter's name count as the same, because they match the same requests),
a path not starting with `/`, a wildcard (routes are a flat table with parameters, item 12), and a
path under `/assembly/` or `/_assemblejs/`, compared without case.

The reply is serialised by the server rather than handed to the router, because the router sends
a bare string as plain text: a handler typed to return JSON answers JSON, whatever value it is.

## 2026-10-03: schemas are deep-merged, and a field claimed twice is refused at boot

Expected: B-12 complete once the api routes were wired. Found by the verifying agent: the plan's
B-12 row and DESIGN section 6 both say composed schemas are deep-merged with a colliding name as a
startup error, and nothing in the code had a schema at all; the 2026-09-03 entry above had settled
data collisions as "the later writer wins" without recording that it departed from the plan.

Built as the plan says. A service and a view may each declare a `schema` (`properties`, each a
JSON Schema, and `required`). A view's composed schema is its services' schemas then its own,
merged: properties unioned, required lists concatenated, and a field declared by two contributors
is a boot error naming both, whichever order they would have run in. The schema has a reader: a
field the composed schema requires that no contributor returned fails the render, so a declared
shape is enforced at the boundary rather than written down and trusted. Data from contributors
that declare no schema still merges later-writer-wins; the entry above is right for them, and
declaring a schema is how an author asks for the stricter rule, and it binds every contributor: a
field a schema declares may be returned only by its declarer, so an undeclared service returning
it fails the render rather than overwriting it. A required field must be declared by someone, not
necessarily by whoever requires it.

The same verification found, and this commit fixes: a caller's own 4xx (an unsupported body type,
a malformed body) was reported as a 500; the server's log was a no-op (`logger: false` with every
failure written to `app.log`), so a correlation id pointed at nothing - failures now go to a
`log` option, standard error by default; an unknown route answered the router's own description
of the request; a product route starting with a parameter could answer an unclaimed path under a
reserved prefix; and an api path outside a flat grammar (an optional or regex parameter, two
parameters in one segment, a `?` or `#`) was accepted, though it matches differently from how it
reads or matches nothing.

## 2026-10-03: open - whether changesets start before the first publish

Expected, from `CLAUDE.md`: a changeset on every `packages/*/src` change. Found: every package
already reads `1.0.0` and nothing has been published, and no rung so far has written one. A
changeset now would move the first release past the `1.0.0` that B-27b names. Changesets start
with the first change after the first publish; until then the packages' versions say what the
first release is, and the release notes say what is in it. This sets aside a rule `CLAUDE.md`
states, so it is raised with the owner rather than settled here, and `CLAUDE.md` is left as he
wrote it until he answers.

## 2026-10-03: the server serves pages, which no rung had named

Expected, from the ladder: B-09's `build` and `dev` sit on top of a server that already serves a
page. Found: `createServer` answered the three assembly endpoints, health and apis, and nothing
else. The composer (B-03) was a pure function no route called, the browser runtime (B-07) was
proved only from hand-built fixtures, and nothing turned a page template into a document or
linked a module into one. B-09's proof (create, build, `node dist/server.js`) cannot pass without
it, so it lands as the first part of B-09. The plan's shape is unchanged: every piece is something
the design already specifies.

- **A page is `{ route, template, place? }`**, passed to `createServer` as `pages`. What an author
  writes in a page's own file is the `PageDeclaration` (`route?`, `place?`) the design's section 8
  shows; the build reads the template from the page's html and joins the two.
- **Every placement goes through the composer and one transport.** The local transport renders
  through `renderLocal`, the same function the content endpoint calls, so a placed assembly is
  byte-for-byte what its endpoint answers. It never throws: a render that throws is logged against
  an id and answered as a failure for the composer's ladder.
- **Templates are read at boot.** A placement with no assembly behind it, a view it does not have,
  policy for a placement the template never makes, a route twice or shadowing a GET api, and
  deferred-with-required are all refusals before listen. A placement with a `url` is refused too,
  until B-13 brings the remote transport; that refusal is B-13's to delete.
- **Browser files.** An assembly may declare `assets` (`css`, `js` urls); the manifest now reports
  them instead of a constant empty list, and a page links the files of every assembly it placed,
  each once. A build's directory is served under `/_assemblejs/assets/` from a listing taken at
  boot, so no request path is ever joined onto the filesystem; an asset the build did not write is
  a boot refusal.
- **The mount mode reaches the browser.** The runtime read `data-mount` and nothing emitted it. An
  assembly declares `mount`, and the envelope carries it when it is not the default; DESIGN 2.4
  lists it with the other conditional attributes.
- **`config` is optional**, read from the process environment when absent, so the author's server
  file does not have to know configuration exists.

## 2026-10-03: what verifying the pages found, and page parameters held back

The verifying agent found that a required placement which timed out answered 503 with an empty
correlation id, because a transport that times out reports none; that a placement which fell back
was logged nowhere; that the composer emitted nothing for a failure with no fallback, where DESIGN
3.3 says an empty envelope marked failed; and that page routes were not held to the flat grammar
apis already were. All four are fixed here, with the rest of what it found.

- **Every failure has an id.** The composer mints one, from the id source it already owns, when
  the transport reported none. A fallback and the empty envelope are both wrapped in an envelope
  whose `data-failed` carries that id, which is how DESIGN 12's "in the fallback envelope" is met
  without a new attribute. The browser runtime never mounts a `data-failed` envelope: its markup
  is the page's stand-in, not anything the assembly's browser half produced. Every placement that
  did not answer is logged against its id by the page that placed it.
- **Page routes take the flat grammar**, now one function both apis and pages call.
- **Page parameters are refused at boot, for now.** `/products/:id` is the design's own example
  route, and nothing carries a page's parameters to the assemblies it places: the request a
  placement receives has a query and no parameters, the cache key is built from the query, and
  the remote transport (B-13) will need to say how parameters cross a server boundary. Accepting
  the route and dropping the value would be the silent kind of wrong. Recorded as an open row
  under B-13, where the request shape is next extended.
- Also: hoisting passes over closing tags inside comments, scripts and styles; asset urls are the
  files' percent-encoded paths, served with a declared type and `nosniff`, a missing one answers
  the failure body; a root-relative asset url outside the asset prefix is a boot refusal because
  nothing serves it; a policy that is not an object is reported rather than thrown on; and the
  immediately-closed directive is recognised in any case, as the self-closing one already was.

## 2026-10-03: the build, and what building a real project exposed

`assemblejs build` is esbuild, owned by `@assemblejs/cli` as a dependency of the command line and
of nothing the server imports. It writes `dist/server.js`, which plain `node` starts with every
package external (the framework and the renderers come from the project's own dependencies), and
`dist/client/`, the browser files. The generated modules the author never opens live in
`.assemblejs/`: `assemblies.ts`, `pages.ts`, `apis.ts`, `project.ts`, and one browser module per
assembly behind one entry.

- **One script per page, one module per island.** The entry starts the runtime with a browser
  half (`lazyRenderer`, in core) that loads an assembly's own module the first time an assembly of
  that name mounts, so `client:visible` defers the download as well as the mount.
- **A static assembly ships nothing.** A plain html view with no `.client.ts` is generated as
  `mount: "none"` and links no script; a page of only static assemblies loads no JavaScript at all.
- **A framework view says when it mounts** by exporting `mount` beside its component (or from a
  Svelte module script). The generator reads the source and names the export only where it
  exists.
- **Directories are pages too.** `src/pages/<name>/<name>.html` is the page at `/<name>`, `home`
  at `/`; a `<name>.page.ts` beside it default-exports a `definePage` declaration. An assembly's
  `<name>.service.ts` default-exports its service; `src/api/<name>.api.ts` its api.
- **`generate` is gone.** It wrote a registry that could not run (it imported a view file as if it
  were a definition), and the design's verbs are new, add, dev, build, check and deploy. `build`
  writes every generated module.
- **The server file is three statements, not two** (DESIGN 15 is updated): it imports the
  generated project module, because a library cannot reach its user's generated module without a
  run-time bundler.
- **The pre-build checks find packages the bundler's way**, walking `node_modules` upward from
  the project, never through `NODE_PATH`: a package manager's command shim points `NODE_PATH` at
  its own store, where node finds packages the project never installed and the bundler then
  does not.

Building the two-framework example for real exposed a defect B-10 and B-11 could not: their proofs
hand the runtime markup written for them, so no React component that calls `useEvents()` was ever
rendered on the server, where it threw for want of a page. Each renderer's server half now renders
inside the events its browser half mounts with: `serverEvents()` in core, which accepts a
subscription that never fires, has no last message, and refuses `send` by name. The React package
is now split so its server and browser entries share one context module.

The proof B-11 named now runs from a real build: `browser/built.browser.ts` builds
`examples/two-frameworks` with the command line, starts `dist/server.js` under plain node, and
clicks the Svelte assembly in Chromium until the React one hears it. It was watched red on islands
that never mount, a registry that links no script, and a React server render without its events.
`ASSEMBLEJS_CHROMIUM` names the browser binary when the one Playwright expects is not installed.

## 2026-10-03: dev is the production build, rebuilt on change

Expected, from DESIGN 11: `dev` runs the bundler in middleware mode, which is where hot reloading
comes from. Found: the build is esbuild owned by the command line and the server has no bundler
seam, by the same section's rule, so there is no middleware to run it in. `dev` instead runs
exactly what production runs: `build`, then `node dist/server.js` in development mode, and on
every change under `src/` (one rebuild per burst of changes) builds again and restarts. A build
that fails leaves the last good server answering and says why. Nothing that works under `dev`
can fail in production for a reason `dev` hid, which a separate dev pipeline cannot promise.

What it does not do yet is refresh the browser: the page reloads by hand. A reload pushed to the
page wants the server-sent events B-18 builds, under the framework's own prefix and only in
development, so it is a ledger row after B-18 rather than a second channel invented now. DESIGN 11
is updated to say what `dev` does.

## 2026-10-03: create, and B-09's proof from the tarballs

`@assemblejs/create` is the command line's own `new` behind the bin `npm create @assemblejs`
runs: one argument, the directory, and no question asked, so a project started either way is the
same project and the starter behaves the same in a terminal and a script.

The rung's proof is `pnpm proof:create`, a script rather than a gate in `pnpm check` because it
needs the network and minutes. It packs core, cli and create with pnpm (real versions where the
workspace says `workspace:*`, as a publish writes them), runs the starter from its tarball with
`npm exec` (what `npm create` runs, handed the unpublished dependencies as tarballs too), points
the project at the tarballs where the starter put each one, installs, builds with the command
line it installed, prunes every development dependency, asserts esbuild and the command line are
gone, and fetches the page `node dist/server.js` composes.

It was green for a reason it did not claim on its first run: it moved the command line into the
project's development dependencies itself, so a starter that installed it at run time still
passed. It now rewrites each dependency where the starter put it, and was watched red on a
starter that lists the command line as a production dependency.

## 2026-10-03: what verifying the build found, and problems as structures

The verifying agent found one defect that served wrong content: generated identifiers were
camel-cased, so `x-1` and `x1` both became `view_x1` and one assembly was silently served with
the other's markup. A name holds only lower case letters, digits and hyphens, so each hyphen is
now an underscore, which gives every name its own identifier. Also fixed from that report:

- `serverEvents().send` drops a message instead of refusing it. A Svelte component that sends
  from its top-level script runs that script again when it hydrates, so refusing on the server
  made a component that works in the browser vanish from the page.
- The client entry is found by its name in the bundler's metafile, not by being listed first,
  because each island's chunk names its own module as an entry point too.
- `.assemblejs/` and `dist/` are removed whole before a build, so nothing a previous build wrote
  outlives what made it.
- A framework view's `mount` is read from its module, always, instead of from a line pattern in
  its source that a comment or a string could satisfy; a module without one reads as undefined.
- The scaffold writes only renderers the build can build (html, React, Svelte), each in its own
  idiom (the Svelte view was JSX, and the React component's name started lower case), and no
  stylesheet until stylesheets are built; `build` names the assemblies whose styles it leaves
  out, and the B-15 row says so.
- `lazyRenderer` warns about an assembly it has no module for, as the runtime does for a
  missing renderer.

**Problems are structures now.** Discovery and the build's checks report each problem as
`{ path, rule, message, fix }` instead of a sentence, because DESIGN 13.5 requires the agent
surface to "refuse with a fix, never with an error string", and the command line prints the same
two halves. The rule ids are the agent surface's rules, so `explain` answers why. The command
logic B-09c's tools reach lands with it: `planAssembly` (what adding one would write, or why
not), `placeAssembly` (a template with a placement at a named position), and `checkProject`
(every finding knowable without building).

## 2026-10-03: the agent surface can build, not only look

B-09c: `create_project`, `add_assembly`, `place_assembly` and `check`. Each is the command line's
own decision (`projectFiles`, `planAssembly`, `placeAssembly`, `checkProject`) bound to the
protocol, writes only through the project-root guard, and answers with every file it wrote and
the state that resulted. Each refusal is a `{ path, rule, message, fix }` structure, and a test
walks the command line's source and the agent surface's to require that every rule a problem
names is one `explain` answers; six rules were added for that.

`place_assembly` takes a page by name and a position by name (`at` start or end, `after` or
`before` a placed assembly), never a line number, so it means the same thing after someone else
edited the file. Asked for a page or an assembly that does not exist, it lists the ones that do
and changes nothing. `create_project` scaffolds into the root only while it holds no project.

The proof B-09b named, which needed these tools, now runs: through the server's own protocol and
never touching a file directly, an agent creates a project, adds an assembly, places it after the
one the starter placed, composes the page and finds its markup in the html, and checks the
project clean.

## 2026-10-03: remote assemblies

B-13 lands DESIGN 5.1 and 2.3 as written, with these settled where the design left them open.

- **Remotes are policy, declared in `assemblejs.config.ts`** (`defineConfig({ remotes })`), and
  passed to `createServer` by the generated project module. Host, port and credentials stay in
  the environment; what this project composes from is a decision, so it is a file.
- **The private-range rule** is applied to names, because the allowlist already governs origins:
  a declared host whose address resolves into a loopback, link-local, private, shared or
  unspecified range is refused, and only an origin declared as an address itself reaches one.
  The check runs before each request; the resolver's answer and the request's own resolution
  can differ (a rebinding window), which the exact allowlist and refused redirects bound.
- **Two runtimes share a page.** A remote fragment's envelope is stamped `data-remote` with its
  origin; each built client entry starts its runtime with the origin it was served from, and a
  runtime mounts only the envelopes from that origin. The consumer hoists the remote's script
  from its manifest, absolutized against the remote, and a built server's assets answer CORS for
  any origin, because they are public and immutable. Proved in Chromium: a page with no browser
  code of its own hydrates a Svelte and a React assembly another server rendered, and the click
  crosses between them on the remote runtime's bus.
- **The cache answers first.** A placement that declares `cache.ttl` is answered from a fresh
  entry before anything is dispatched; the design's "second request is a cache hit" needs it,
  and before this the cache was only a last resort after a failure. A remote placement is keyed
  by its url: the two-server test found two pages placing different remote assemblies under one
  local name sharing an entry.
- **`Limits.maxBytes` is read**, by the composer for every answer and by the remote transport as
  the body streams, which closes the debt B-03 recorded.
- The browser suite builds the packages and the example once, in a global setup, so the tests
  that serve the example never race each other building it.

## 2026-10-03: what verifying dev, create and the agent tools found

The verifying agent found `dev` could lose its server: it waited inside its build queue for the
server to print `listening`, so a server that said something else, or was slow to listen, held
every rebuild and the first Ctrl-C, and the second orphaned it; and anything the build threw (a
dangling link under `src/assemblies` made discovery throw) rejected the queue and ended `dev`
with the server still running. `dev` now ends each step once the server is spawned, catches and
reports whatever a step throws, stops the server before anything else when it is stopped, kills
it if its own process exits, and refuses to start where there is no `src/` to watch. Discovery
passes over a path it cannot stat.

On the agent surface: `create_project` judged an existing project by `package.json` alone and
overwrote an author's `src/server.ts` where there was none, and now refuses a root holding any
file the starter would write or a `src/`; the root guard compared strings, so a link inside the
root carried a write outside it, and now resolves the nearest existing part of the path through
every link; `add_assembly` joined a name onto a path before judging it, and now judges first.

Rule ids are a typed list in the command line (`RULE_IDS`, `RuleId`), so the compiler refuses a
problem naming a rule the agent surface's `explain` could not answer, and that package's tests
hold its rules to the list; the regex over source this replaces missed ids held in a constant.
`check` now reports the two refusals `build` made before bundling (no server file, no Svelte
compiler) by moving them into the checks both share. `placeAssembly` finds the body outside
comments, scripts, styles and quoted attributes. The project resource reports paths relative to
the root as `check` does. The build names Svelte assemblies whose `<style>` it leaves out.
`new` refuses a directory name that cannot name a package, with one that can, and prints the
install command of the package manager that ran it. `pnpm proof:create` builds before it packs,
so its tarballs are the source at that commit, and gives the server thirty seconds to listen.

## 2026-10-03: access is decided once, and the page ships a policy

B-14 lands DESIGN 5.2. `decideAccess` is the one function that decides whether a request may
proceed, called once, from the first hook every request meets, before routing, parsing or
rendering; a test reads the server's source and requires that only the access directory decides.
Settled here:

- **Basic credentials or an `authenticate` check, never both.** Both on is a boot refusal: two
  controls are two places that decide, and the design's point is one. Basic comes from the
  environment (B-05); the check, and the public routes, are policy in `assemblejs.config.ts`.
- **A check that throws is a refusal.** A broken gate is a closed gate.
- **Health is always public**, because a load balancer that cannot read it takes the server out
  of service; every other public route is declared, exactly or as a prefix ending `/*`.
- **A refused request is a 401 with the failure body**, and under basic credentials the
  challenge a browser answers with a prompt; an unknown path is refused before it is matched.
- **The default content security policy** is on every html answer: this origin and the declared
  remotes, nothing inline (the islands are data, not scripts), no plugins, no framing by another
  origin. A project replaces it with `contentSecurityPolicy`. Proved in Chromium: the built
  project and the remote page hydrate under it, and a policy forbidding the page's own scripts
  turns both browser proofs red.
- **Same origin by default.** Nothing grants another origin's page access to data; the one
  exception is a built server's assets, which are public, immutable and loaded cross-origin by a
  page that places a remote assembly.

## 2026-10-03: styles are scoped at build time, and a shadow root gets its own sheet

B-15 lands DESIGN 10. Expected: the build had a stylesheet to scope. Found: it had none; every
`.css` and every Svelte `<style>` was left out (B-09's record). Settled here:

- **Scoping is a selector prefix, `assembly-root[data-name="<name>"]`**, applied with PostCSS to
  every rule outside `@keyframes`, inside `@media`, `@supports`, `@container` and `@layer` as
  anywhere else. `:scope` names the envelope itself. A prefix rather than a rewritten class
  keeps the author's markup as written and needs nothing from the view.
- **One stylesheet per assembly, named by its content's hash**, holding its `.css` files and then
  its Svelte component's `<style>` (already scoped by Svelte). It is an asset of the assembly,
  so a page links only the styles of what it places, and a remote assembly's styles arrive
  through its manifest like its script.
- **Shadow DOM is a framework view's `shadow` export**, read like `mount`. An html view has no
  module to export from, so it cannot opt in; no file convention was invented for it. The
  envelope carries `<template shadowrootmode="open">`, so the markup is in the shadow root before
  any script runs, and the island stays in the light DOM where the runtime reads it.
- **A shadow root gets its own sheet.** Expected: link the scoped sheet inside the root. Found:
  a selector prefixed with the envelope matches nothing inside a shadow root, so the author's
  styles would have silently vanished there (the Svelte classes would still apply, hiding it).
  The build cannot know the opt-in without running the view, so it writes a second, unscoped
  sheet for every framework view (`:scope` becomes `:host`), and the generated registry chooses
  between the two by reading the view's `shadow` export when the server starts. The page does
  not hoist a local shadow assembly's sheet into its head.
- **The holes are asserted, not only written down**: the browser proof runs one assembly's
  animation from another's `@keyframes`, and a page rule reaches the light DOM. If either stops
  leaking, the proof goes red and DESIGN 10 is out of date.

## 2026-10-03: the second remote review, and the access and styles review

Two independent reviews read B-13 to B-15 at the source. What they found, and what changed:

- **A cached remote answer varies on the forwarded headers.** Expected: a credential bypass was
  enough. Found: a header a remote declares in `forward` (a user id, a language) was not part of
  the cache key, so one visitor's answer was served to the next. The key now carries every
  forwarded header's value, as an HTTP cache varies on them; credentials still bypass it.
- **"One envelope" is read the way the browser reads it.** Expected: checking the first and
  last tag was enough. Found: anything between two envelopes reached the page, and the page's
  runtime mounted an unmarked or nested envelope from a remote with the page's own renderers. A
  scan of `<assembly-root>` tags alone would not have held either: a stray `</div>`, a comment
  the browser ends at `--!>`, or an `<li>` with no list of its own closes elements in the page
  and carries the rest of the answer out. So the answer is scanned with the browser's tokenizer
  rules and the tree rules that close elements implicitly, and anything it cannot read exactly
  is refused rather than guessed; core keeps its single dependency. The browser suite generates
  100,000 seeded fragments and requires every one the scanner accepts to stay inside its
  envelope in Chromium in each context a placement sits in; with the tree rules disabled it
  finds escapes within a few thousand. Every envelope in an answer is stamped with the remote's
  origin, replacing any it named, and the runtime takes an envelope's owner from its nearest
  marked ancestor, so ownership no longer depends on where an envelope lands.
- **The manifest is learned beside the content, never in front of it.** Found: a hanging
  manifest failed a placement whose content had arrived, and its body was read uncapped, of any
  type, its files allowed from any origin (`data:`, `javascript:`, another host). It is now read
  with its own one-second deadline, one read in flight per url, under the cap, as JSON only, and
  only files on the remote's own origin are kept. The page waits for that read when it links
  assets, so a slow manifest delays a page by at most that second and fails nothing.
- **A remote assembly in its own shadow root is styled there and nowhere else.** Found: the
  consumer hoisted its unscoped sheet into the page head, where it styled everything, and the
  link inside its root named a path on the consumer's origin. The manifest lists no page styles
  for a shadow assembly, and a remote answer's `<link href>` given as a path from the root is
  linked from the remote's origin. Other root-relative urls in remote markup (an `img src`) are
  not rewritten; a remote that wants them to load on another origin's page writes them absolute.
- **The root guard follows dangling links.** Found: a link inside the root pointing at nothing
  outside it read as missing, so its in-root parent was checked and the write went out through
  it. Every link along a path is now followed, dangling ones included, and the authoring tools
  judge a place occupied with `lstat`.
- **Built browser files are public under access control**, as the B-14 entry already said and
  the server did not do: a page on another origin loads them with no credentials. A blank
  content security policy is a boot refusal rather than a page with none.
- **`pnpm check` builds before it tests.** Found: on a fresh clone the command line's tests
  bundled projects against packages that were not built yet, so CI, which runs `pnpm check`
  straight after install, would have been red; every green run here had a built tree.

## 2026-10-03: the rest of both reviews

- **`check` reads a page's declaration without running it.** A placement whose policy in
  `<name>.page.ts` names a `url` is remote, so it is checked against the remotes in
  `assemblejs.config.ts` (when the url is a literal) rather than reported as a missing
  assembly. `check` stays a reading of the project that executes none of it; a placement whose
  policy is computed is not seen, and boot still refuses an undeclared remote.
- **`dev` always ends.** A stop asks the server to end and, after three seconds, makes it; a
  second Ctrl-C exits at once through `exit`, whose handler kills the server, because a signal
  death runs no `exit` handler at all. A test drives the real command line with a server that
  ignores SIGTERM. Found while proving it: this container's first process does not reap
  orphans, so a killed server lingers as a zombie, and the test counts a zombie as stopped.
- **The private-range check is `net.BlockList`**, covering every reserved IPv4 range (shared,
  benchmarking, documentation, multicast, reserved, broadcast) and IPv6's site-local, multicast
  and NAT64 prefixes. The block list reads every spelling of an IPv6 address, mapped IPv4 in hex
  included, which was checked before relying on it.
- **A stylesheet's references are built with it.** `url(./bg.png)` is copied into
  `dist/client/styles/files/` under its content's hash and the url rewritten; a relative
  `@import`, a missing file and CSS the build cannot parse are problems with rule
  `an-assembly-owns-its-styles`, reported by `build` and `check` before anything is bundled.
  `Io.write` takes bytes as well as text for it.
- **Scoping follows what the author wrote.** A nested rule is scoped through its parent, never
  twice; a `:scope` inside `:not()` or `:is()` is the envelope and the rule is still scoped, so
  it cannot reach outside; a selector starting at `:root`, `html`, `body` or `:host` names the
  envelope; inside `@scope`, `:scope` keeps the meaning `@scope` gives it.
- **A Svelte assembly's styles are its components'**, every one in its directory; a component
  outside every assembly's directory may be used by any, so its `<style>` goes with every
  Svelte assembly (Svelte's own class hashes keep it from touching anything else).
- **Inline styles are refused by the default policy, and now said so** in DESIGN 5.2, rather
  than loosened: the policy's point is that nothing inline applies.

## 2026-10-03: Preact, and a JSX runtime per file

B-16 begins with `@assemblejs/renderer-preact`, the same shape as the React renderer: a server
half rendering through `preact-render-to-string` inside an events context, a browser half that
hydrates into the envelope or the assembly's own shadow root, `useEvents()` and `Slot`. Preact is
its one peer dependency; `preact-render-to-string` is a plain dependency, as it is a renderer's
own machinery, not a framework the author chose.

- **Each JSX file compiles through its own framework's runtime.** Expected: one `jsx:
"automatic"` setting for the bundle. Found: that compiles a Preact view against React's
  runtime. The build names the runtime at the top of each project file as esbuild reads it: the
  framework a file's name says (`.preact.tsx`), else the framework of the assembly whose
  directory holds it, so a Preact view's own components compile as Preact, else React.
- **`examples/frameworks` is the B-16 proof**, one assembly per framework on one page, growing
  as each renderer lands. In Chromium each is server-rendered, keeps the very element the server
  sent through hydration, counts, and is heard by every other over the bus.
- **An equivalent mutant, recorded rather than tested:** Preact's `render` into a container with
  no previous tree adopts the existing DOM much as `hydrate` does, so replacing one with the
  other is not visible to the browser proof. `hydrate` is the documented call and is kept.
- **Package metadata follows the existing renderers'** (author, repository on the GitHub
  organization), which the owner flag on package metadata already covers; a new package did not
  fork the convention ahead of that ruling.

## 2026-10-03: Vue

`@assemblejs/renderer-vue`: every assembly is its own Vue app, created for hydration in the
browser and rendered with `vue/server-renderer` on the server, the events provided under one
injection key and read with `useEvents()` from `setup`. Settled here:

- **The build compiles `.vue` with the project's own `vue/compiler-sfc`**, loaded as the Svelte
  compiler is, so a component compiles with the Vue its runtime will be. A `<script setup>`
  has its template inlined (a string-building render for the server, a hydrating one for the
  browser); any other component gets a render function compiled from its template. A named
  export beside the default (`mount`, `shadow`) is read as from any framework view.
- **A component's scope id is a hash of its path in the project**, so the server and browser
  bundles, built apart, agree, and `<style scoped>` matches the markup it hydrated. Its CSS
  joins the assembly's stylesheet like a Svelte component's.
- **A render error rejects.** Vue on its own warns about a component that throws during a server
  render and sends what it had; the app's error handler rethrows, so the placement falls back
  as any renderer's failure does.
- **The compilers are one bundle** (`Compilers`, `loadCompilers`), and a compiled framework
  the project has views for but has not installed is one table in `buildProblems`, so Solid's
  compiler joins them without another branch in the build.

## 2026-10-03: the third review

A fresh review of the two fix commits found, and this round fixed:

- **A stylesheet reference could publish any file on the host.** `url(../../../etc/passwd)` was
  copied into the public build (and assets are public under access control). A reference must
  now resolve, links followed, inside its assembly's own directory: anything else is a problem
  `build` and `check` report, and the copy refuses it regardless. Proved against the reviewer's
  exact case.
- **`check` reads declarations as literals, not by regex.** The source is compiled to plain
  JavaScript by esbuild, which drops types and comments, and a small reader keeps literal
  objects, arrays and strings, marking anything computed unknown. Nested policy objects, either
  quote, template literals and an origin named only in a comment now read correctly.
- **`dev` ends on SIGHUP**, a closed terminal, taking its server with it.
- **The scanner's Chromium proof claimed more than it ran.** It now parses what the transport
  emits (the marked answer), requires every envelope in it to carry the remote's origin, and runs
  in every context that holds flow content (div, li, td, dd, section, span, label), in template
  content and in a declarative shadow root. Inside `<p>`, `<a>` or `<button>` the parser moves
  block markup out of any assembly, local or remote, which is the page's to avoid, and ownership
  holds there regardless because every envelope is stamped. Each guard the reviewer's mutants
  survived has a test only it fails, and the generator emits the balanced pairs random tokens
  rarely form. The earlier entry's "each context a placement sits in" is narrowed to this.
- **The private-range list adds the IPv6 ranges that carry an IPv4 address** (IPv4-compatible,
  SIIT, 6to4, Teredo) and the discard, documentation, benchmarking and ORCHID ranges. The
  earlier "every reserved range" is narrowed to the ranges the code names.
- **Smaller:** a name starting with dots is a name, not a step out of a directory, in every
  containment check; a root-relative `href` padded with whitespace is rewritten as the browser
  reads it; `html.dark .a` keeps the document condition and `:host(.on)` names the envelope with
  `.on`; the dev tests always stop their servers. The cache key varies on the union of the
  page's forwarded headers, which fragments entries for placements that ignore one but leaks
  nothing; the manifest is fetched from the origin whose address was checked moments before for
  the content, and that window is accepted.
- **Found in passing:** an earlier round's test edits made by text replacement had silently not
  applied where formatting had moved the text; every replacement now asserts it matched.

## 2026-10-03: Solid

`@assemblejs/renderer-solid`: `renderToString` and `hydrate` from `solid-js/web`, the events in a
Solid context, `useEvents()` and `Slot`. Settled here:

- **Solid's JSX is compiled by Solid's preset, which the renderer carries.** Solid compiles JSX
  into DOM creation and string building; no automatic runtime can stand in for it. The renderer
  ships a `./compiler` entry wrapping Babel 7 and `babel-preset-solid` as plain dependencies (Solid
  stays its one peer), and the build loads the project's copy as it loads the Svelte and Vue
  compilers. esbuild strips a file's types first, keeping its JSX, so no TypeScript preset is
  needed. A component in a Solid assembly's directory compiles as Solid like the view does.
- **Each mount gets a fresh hydration state.** Found: Solid keeps hydration state on
  `globalThis._$HY`, which its page bootstrap creates with an inline script the default policy
  refuses, and marks hydration done after the first hydration or the first delegated event, so
  every later island would have been re-rendered rather than adopted. The browser half creates
  that state and clears the done flag on each mount; a test hydrates two counters in turn and
  requires both to keep the server's elements.
- **One markup fixture holds both halves.** The server and browser halves run on two builds of
  Solid, so the server test requires `renderToMarkup` to produce exactly the markup the browser
  test hydrates, in separate vitest projects resolving each build.

## 2026-10-03: Lit, and B-16 done

`@assemblejs/renderer-lit` completes B-16. Settled here:

- **A Lit view is `cart.lit.ts`, default-exporting a function from the assembly's props to a
  template.** Lit's unit of interactivity is the element; the view places elements and hands
  them the assembly's events as a property, which hydration sets. The events arrive as a prop
  (as in Svelte), because a template function has no context to read them from.
- **The server half renders with `@lit-labs/ssr`**: the template with the markers hydration
  reads, each element into a declarative shadow root. The browser half hydrates the template
  with `@lit-labs/ssr-client`, and each element hydrates its own shadow root when defined, Lit's
  hydrate support installed first.
- **Element styles are adopted on hydration, not sent inline.** Found: Lit writes an element's
  styles as an inline `<style>` in its shadow root, which the default policy refuses (a console
  error on every page), and its hydrate support then reuses that root without adopting the
  styles, so the element stayed unstyled. The server half leaves that `<style>` out and the
  browser half adopts the same styles as constructed sheets when the element hydrates; an
  element is styled once it hydrates.
- **The browser half never loads Lit's element base.** Found while proving the above: bundled,
  all of a package's imports load before any of its code runs, so importing `lit` registered
  the element base with the hydrate support before this package adapted it. The browser half
  imports `lit-html` alone (a plain dependency, deduplicated with the project's `lit`), and a
  test holds its sources to that.
- **B-16's proof is one page carrying every framework**: `examples/frameworks` places html,
  React, Svelte, Preact, Vue, Solid and Lit assemblies; in Chromium each is server-rendered,
  keeps the very element the server sent through hydration, counts, and is heard by every
  other, with no warning, error or refused resource on the page.

## 2026-10-03: the fourth review

A fresh review of Preact, Vue and the third round found, and this round fixed:

- **A Vue render error could still send a page with a hole, or end the server.** Vue reports a
  component's error (in setup, render, a child, an async setup, a server prefetch, a watcher)
  to the app's handler; rethrowing there threw into Vue's own handling, which in its production
  build only logs and in its development build could leave a rejection nothing handled. The
  handler now keeps the first error and the render rejects with it once Vue has finished. The
  server tests run against both of Vue's builds.
- **DESIGN 12's first rule was never built.** A listening server now logs a rejection nothing
  handled, or an exception nothing caught, against a correlation id and ends its process,
  installed once per process. Proved in a real process.
- **A shadow root's stylesheet follows the markup.** Found: Vue hydrates from a root's first node,
  met the `<link>` there, reported a mismatch and rendered afresh, dropping the link and
  duplicating the tree. `examples/shadow` holds one shadow assembly per framework, and in
  Chromium every one keeps its link, its server element and its colour, and logs nothing.
- **MathML's mglyph and malignmark stay MathML inside a text integration point**, so a raw-text
  element there is read as markup by the browser; the scanner now reads it so, and refuses the
  answers that carried the rest of the page into an envelope. The generator emits those pairs.
- **A placement from another server inside a page's `<form>` is refused at boot.** A form's end
  tag in the answer would close the page's form; the page's template is the author's own, so
  this is knowable there, and refusing forms in every remote answer was not.
- **A shared JSX file takes the framework of what imports it.** Found: a Preact view's component
  from outside its directory compiled as React and rendered nothing. One imported from two
  frameworks is an error naming both. The runtime pragma now shares the file's first line, so
  every diagnostic keeps its line number.
- **Vue single-file components:** a block read from another file, a template or stylesheet in
  another language, CSS modules and JSX in a script are build errors rather than green builds
  that render wrong, and `v-bind()` in styles reaches the server render of a component with no
  `<script setup>`.
- **`check` reads a declaration with a parser.** Found: the hand-written reader took a quote in a
  regex literal for a string and swallowed the rest of the file, and read objects anywhere. The
  source is compiled by esbuild and parsed by acorn; only the default export's `place` and the
  config's `remotes[].origin` are read; a file that cannot be read is a finding, not a throw.
- **A selector reaching a sibling of the envelope** (`:scope ~ .x`, `body + .x`) is a style
  problem: scoped, the envelope is the assembly, and its siblings are outside it.
- **Smaller:** a stylesheet's `url()` is rewritten inside that `url()` alone; a root-relative
  href padded with control characters is rewritten as the browser reads it; Preact's peer range
  is the version tested.

## 2026-10-03: the Solid and Lit review

A fresh review of the Solid and Lit renderers found, and this round fixed:

- **Lit lost hydration when anything loaded `lit` before its support module.** Found: the
  support patches `LitElement` and must run before any element class is defined, and the bundler
  hoisted the renderer's own `lit` imports ahead of it. The support is its own entry,
  `@assemblejs/renderer-lit/hydration-support`, which a renderer package names as its
  `browserSetup` and the generated browser entry imports before anything else; the browser half
  imports only `lit/html.js`, and the package's side effects keep its shared chunks.
- **Solid islands shared one hydration registry and one key space.** Each placement renders and
  hydrates with its own render id, so its keys carry its id: core's markup input now carries the
  placement id, the one the envelope holds and the browser half is mounted with. Mounting an
  island replaces Solid's registry, so nodes another island has not claimed yet (a lazy part
  whose module arrives later) and that are still in the page are carried over, even when that
  hydration throws. Placement ids on one page are composer UUIDs, so no island's prefix is
  another's.
- **Solid's inline bootstrap script is left out of the server's markup.** Found: for an error a
  boundary caught, it carried the error's message and the server's stack; the page's policy
  refuses it in any case. Rendering stays synchronous: a resource is not rendered on the
  server, which sends its Suspense fallback, and hydrating that fallback is not supported; a
  lazy component renders on the server once preloaded.
- **Lit's styles are left out by an element renderer, not a pattern over its output**, and
  arrive as constructed sheets on hydration, which the policy allows.
- **The browser proofs capture the server's elements before any script runs**, by holding the
  browser entry until they are captured.
- **A Solid file's decorators are lowered before Solid's compiler**, which does not read them.
- **Solid and Lit scaffolds are built and served in the unit suite**, which kills four mutants
  that survived it (the missing-compiler problem, the compiler's type check, the compiler handed
  to the build, the Lit scaffold's name).
- **Files of the view's framework beside it are its components, not second views.** Expected:
  one view file per assembly. Found: `price.lit.ts` beside `cart.lit.ts`, or `row.svelte` beside
  `cart.svelte`, was refused as a second framework. Among several, the view is the file named
  after the assembly and the rest must share its framework.
- **Smaller:** peer ranges are the versions tested; a dead bundler option is gone.

## 2026-10-03: B-17, the template languages

- **One package, one render function, five engines.** `@assemblejs/renderer-templates` renders
  EJS (`.ejs`), Handlebars (`.hbs`), Markdown (`.md`), Nunjucks (`.njk`) and Pug (`.pug`) through
  `renderTemplate(engine, source, input)`. Each engine is imported the first time a template in
  its language renders, so the package itself imports none, and each template compiles once. A
  failed engine load is tried again; a failed compile fails the same way on every render.
- **A template view is a static view, as html is.** The build reads it as text and the registry
  renders it on the server; it has no browser half of its own, a `.client.ts` gives it one, and
  it gets no shadow stylesheet. One CLI concept, `isStaticView`, now answers this for html and
  the five languages where `"html"` was tested in four places.
- **`data` is escaped and `children` is HTML.** Each engine's default output escapes; children
  arrive as safe strings in Handlebars and Nunjucks and are written by the raw form in EJS and
  Pug. (Core passes no children to a local view yet, so the raw form is held by unit tests.)
- **A view is one file.** An include, extends, import or a partial from another file throws at
  render. Found: EJS reads an included file from disk when it is there; an includer that throws
  now refuses it, held by a test that includes a real file. Found by the rung's verifier:
  Nunjucks, given no loaders, reads from `views/` under the working directory, so a template
  could include a file from wherever the server ran; it is given an empty list. A Handlebars
  inline partial is the same file and renders.
- **A template's error names its file**, which the engines' own messages do not: the registry
  hands each render its view's path from the project root.
- **Markdown is prose:** it reads no data, places no children, and shows HTML inside it as text;
  an `.html` view is the place for markup.
- **The agent surface no longer previews Markdown.** Found: it showed a Markdown view's source
  as its rendered markup, which is exactly the approximation it exists to refuse. It previews
  html alone and refuses the rest with the reason.
- `examples/templates` places one assembly per language, with a service's data, on one page.

## 2026-10-03: verifying the Solid and Lit round

An independent verifier checked the fourth review's and the Solid and Lit review's commits at
the source and found, and this round fixed:

- **The Vue "production" test project ran Vue's development build.** Expected: a project's
  `NODE_ENV` selects the build. Found: Vue picks its build when first loaded, before a test
  project's environment applies. Each build is now a run of its own (`NODE_ENV=production vitest run` in the package's test script), and a test proves the build each run loaded. The old
  rethrowing handler now fails the production run, as it fails a production server.
- **Solid's registry carry-over** ran only after a successful hydration, kept detached nodes, and
  could hand a placement mounted again its old markup. It now runs in a `finally`, carries only
  nodes still in the page, and a failed island no longer ends hydration for the rest. The
  equivalent mutant recorded in the round above was not equivalent; that note is withdrawn.
- **Solid's script is matched exactly:** the one script Solid appends, by its header, at the end
  of the markup; an assembly's own script, however similar, stays.
- **The `lit-early` fixture regressed nothing** (assemblies load by dynamic import, after the
  entry's setup) and is removed; the ordering is held by the entry generator's tests and the
  browser proofs.
- **Smaller:** a stray `</style>` in a Lit shadow root is now a failure; the Lit import guard
  covers `lit/index.js`; Lit's and Preact's peer ranges are the versions tested (`^3.3.3`,
  `^11.0.0`); a shared JSX component takes its importer's framework only through a relative
  import, as documented.
- Not changed: `app.test.ts` in core spawns the built `dist/`, so a package-local run needs a
  build first; `pnpm check` builds before it tests.

## 2026-10-03: verifying B-17

The rung's verifier found, beyond the Nunjucks loader above: the build's browser filter was not
held by any test (a template view built as a browser chunk would serve its source as a public
asset), now asserted by the five-of-five proof and by a build of `examples/templates` in the unit
suite; the Handlebars instance is the package's own, not one per template, as its comment now
says; the agent surface lists every renderer it can scaffold. Pug's escaping leaves `'`, which
the README says. Not done here, and in the ledger: a broken template passes `build` and `check`
and is found at its first render, where its placement falls back.

## 2026-10-03: B-18, real-time

- **A stream is an api with `stream` in place of `handle`.** `ApiDefinition` is now the union of
  a data api and a streaming api, so a project's `*.api.ts` files need nothing new and the
  generated module is unchanged; `defineApi` answers the definition's own type, so each kind
  keeps its context's type (overloads would read to the organization gate as three exports).
  A stream runs once per connection with `send` and an `AbortSignal` that aborts when the
  connection closes from either end.
- **The page names its stream** (`definePage({ stream })`), and the server writes it as a meta
  element at the end of the head, where the page's runtime reads it. Expected from DESIGN 3.6:
  "one connection per page". A runtime started for a remote's assemblies never opens one, so a
  page that places another server's assemblies is still one connection.
- **Wire format:** the event source's default message, one `data:` line of
  `{ topic, payload, to? }` JSON; a message that does not parse is dropped. Named events were
  not used because an event source needs a listener per name, and topics are open-ended.
- **Found while testing:** a stream's open connection is not idle, so a server that closes only
  idle connections would wait on it forever; every open stream is closed in `preClose`. Node's
  fetch can also hold a spare connection that sends no request, which the tests' own servers
  close by force; that is the test client, not the stream.
- Equivalent mutant recorded: skipping a send after the connection closed changes nothing a test
  can see, because the router listens for the response's errors, and a write after the end, which
  raw Node raises as an error nothing would catch, reaches that listener; the check stays, so a
  closed stream does no work and depends on no one else's listener.
- Proof: `browser/realtime.browser.ts`, from `examples/realtime`: one push reaches a React and a
  Svelte assembly through the bus, over exactly one connection.

## 2026-10-03: verifying B-18

The rung's verifier found, and this round fixed:

- **A message the stream sent before an assembly subscribed was lost.** Found: the stream opens
  as the runtime starts, assemblies load by dynamic import and subscribe after they render, and a
  stream that sends its current value on connect (the usual pattern) reached one assembly in ten.
  Each topic the stream sends now keeps its last message (`bus.keep`), and an assembly reads what
  it missed with `events.last`. The browser proof now sends the current price on connect and
  needs both assemblies to show it, five runs of five; without the keep it fails every run.
- **No back-pressure:** a client that stopped reading held every message since in the server's
  memory. A connection with a megabyte unsent is closed; its page reconnects and starts again
  from what the stream sends then.
- **`defineApi` had stopped refusing a misspelt property**, as a generic signature turns off the
  excess-property check: `mehtod: "POST"` mounted the route as GET. It is typed as the definition
  again, and a data api's `stream?: never` refuses a definition with both. The register functions
  each take every api and mount their own kind.
- **A stream named and never opened, or never heard:** a page whose placements have no browser
  half of this server's has no runtime to open its stream, which is now a boot error; an
  assembly placed from another server is on that server's bus, which DESIGN 3.6 now says.
- **Smaller:** a HEAD request opened a stream and never answered (no HEAD route now); a
  template with a doctype and no head got the stream's element, and its stylesheets, before the
  doctype (both now go after it); a stream path with a query is accepted, the query being the
  stream's own; tests now hold the heartbeat's end, the cache header and the access decision on a
  stream route.
- Recorded, not changed: without `reply.hijack()` nothing observable differs, but the router's
  documentation requires it before writing to the raw response, so it stays. A failing stream's
  correlation id reaches only the log, and its page reconnects every few seconds, a line each.
