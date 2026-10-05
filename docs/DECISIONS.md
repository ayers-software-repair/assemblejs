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
  project's environment applies. Each build is now a run of its own, the package's test script
  running `NODE_ENV=production vitest run` after the first, and a test proves the build each run
  loaded. The old rethrowing handler now fails the production run, as it fails a production
  server.
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
  generated module is unchanged; `defineApi` is typed as the definition (first made generic, which
  dropped the check of misspelt properties; see "verifying B-18").
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
  memory. A connection with a megabyte unsent was closed; that measured a burst rather than a
  stalled client and was replaced, see "verifying dev reload and the B-18 fixes".
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

## 2026-10-03: dev reloads the page

Expected, from "dev is the production build" above: a reload pushed to the page over B-18's
server-sent events, under the framework's prefix and only in development. Built so: a server in
development mode serves a reload script and a reload stream (first under `/_assemblejs/dev/`,
since under the devtools prefix), which tells each connection one boot id per process, and links
the script into every page. `dev`
restarts the server after each rebuild; the page's event source reconnects to the new process,
hears a new boot and reloads. A script file rather than the page's runtime, because a page whose
assemblies ship no JavaScript has no runtime and must reload all the same, and the policy runs no
inline script. The page's own stream is untouched: in development a page holds two connections,
its own and this one. Proof: `browser/dev.browser.ts` runs `assemblejs dev` on a copy of an
example, edits a view, and the open page shows the edit with no hand on the browser.

## 2026-10-03: verifying dev reload and the B-18 fixes

The verifier of `dev`'s reload and of the B-18 fix round found, and this round fixed:

- **`last` handed out messages addressed to someone else.** Found: keeping every stream topic
  kept one message per topic, so a message to `{ name: "cart" }` was what any assembly read back.
  The bus now keeps one message per topic and address, and `last` answers an assembly the latest
  one it would have been delivered. DESIGN 9 and decision 7 now say the stream's topics opt in.
- **Back-pressure measured a burst, not a stalled client.** Found: a response holds what one
  synchronous burst wrote until the next tick, so a megabyte snapshot to a client that was reading
  closed the stream, which reconnected and was sent it again. A write the socket cannot take at
  once now waits for it to drain; one that does not drain in thirty seconds drops the client,
  destroying its socket rather than ending it, so what was queued is let go.
- **The reload routes sat beside the devtools prefix**, outside the read-only rule B-19 adds;
  they are under it now.
- **A first connection could learn the wrong boot.** Found: a page rendered by a server that then
  restarted heard the new boot first and never reloaded. The page now links the script with the
  boot of the server that rendered it, and reloads whenever it hears another.
- **A doctype after a leading comment** still got the head's elements before it; they now go
  after it.
- **Recorded, not changed:** a request the server fails outright is answered with its JSON
  failure body, which can carry no script, so in development it reloads by hand. Over HTTP/1.1 a
  browser holds six connections per origin and each page with a stream holds one (two in
  development), which DESIGN 3.6 now says; HTTP/2 would lift it and needs TLS, which a local
  development server does not have. Tests now hold the reload stream's absence in production and
  both reload routes behind the access decision.

## 2026-10-03: B-19, devtools

Expected, from DESIGN 11 and the plan: devtools development-only and read-only over HTTP, with a
boot assertion that nothing under their prefix accepts a write. The design names no seam, so:

- **A server is handed devtools as data**, `createServer({ devtools })`, a list of routes under
  `/_assemblejs/devtools/`, each answering a GET from a view: a summary of the project copied out
  of its declarations field by field (names, routes, settings; no function, credential or
  template source) and the failures this process logged most recently, fifty at most. Core
  depends on no devtools package; the package depends on core's types.
- **Mounted in development, ignored in production**, rather than refused there, so a project's
  server file hands devtools over unconditionally and the same build runs in both modes.
- **The boot assertion watches the router, not the devtools list:** every route mounted under the
  prefix by anyone, the server's own reload routes included, is checked as it is mounted, and one
  that answers anything but GET or HEAD refuses the server before it listens, in either mode.
  Proof: a devtools route declared POST, and `createServer` rejecting with that route named.
- **`@assemblejs/devtools`** serves an overview (every value escaped, its stylesheet a file the
  page's policy allows, no form, script or button) and `project.json`. `examples/two-frameworks`
  hands it over, and the dev browser proof opens it in Chromium with no console error.
- The project scaffold does not add devtools; a project opts in with one import and one option.

## 2026-10-03: verifying B-19

The rung's verifier found, and this round fixed:

- **The boot assertion was read before the router was ready**, when a plugin's routes are not yet
  mounted, so a write a plugin mounted under the prefix would have passed. It is read after
  `ready()` now, the app closed and the boot refused; a test mounts a write through a plugin.
- **The browser proof ran against whatever devtools build was on disk**, as the suite's setup did
  not build the package: a stale build passed, a fresh clone failed. The setup builds it.
- **Devtools were readable through DNS rebinding:** in development with no credentials, a page on
  another site that points its own name at 127.0.0.1 could read the recent failures and their
  stacks. Devtools answer only a request whose Host is this machine's loopback.
- **A devtools route that writes booted in production**, where nothing is mounted for the router
  to see; it is refused there by the declaration check, so a project boots in both modes or in
  neither. The reload paths under the prefix are reserved, and each recorded failure is bounded.
- **The doctype pattern backtracked** on a template opening with a run of comments, doubling in
  time per comment on every request; each comment is matched without looking past its end.
- **Recorded, not changed:** the stall rule drops a client whose queue does not drain within
  thirty seconds, so a snapshot that takes longer than that to reach a slow client is sent again
  after it reconnects; what a stalled client holds meanwhile is what the stream sent in that time,
  as DESIGN 3.6 now says. What `last` keeps grows with the distinct addresses a topic is sent to.
  Equivalent mutants: closing the app on a refused boot (nothing listens yet), clearing the stall
  timer on close (it finds the stream already closed), recording failures in production (nothing
  reads them there). Package metadata naming the GitHub organization is the owner's open row.

## 2026-10-03: B-20, the check, perf and deploy verbs

The plan names the verbs and the proof ("a generated project passes `check`; `deploy` writes a
build that runs") and the design says no more, so:

- **`check`** prints what `checkProject` finds (the function the agent surface already calls),
  one problem per line with its file, message, rule and fix, and exits 1 when there is any. It
  builds and starts nothing. A project `new` writes passes it.
- **`perf`** builds, starts the built server in production on a port the system gives it, and
  asks each page for what a visitor's browser would fetch first: the document, the stylesheets
  and the module scripts it links, each once, weighed as sent and gzipped. It measures the
  server production runs rather than estimating from files on disk; the chunks an assembly loads
  when it mounts are not counted, which the report's shape says. Any part not answered with 200
  fails the command. Size budgets, which would turn these numbers into a gate, are B-25.
- **`deploy`** builds and writes `deploy/` whole: the build's `dist/` and a package.json with the
  project's name, version, engines and dependencies, one `start` script and no devDependencies,
  so installing it brings no bundler. It writes no lockfile, as the project's lockfile describes
  devDependencies the deploy does not have. It publishes nothing and touches no remote; where the
  directory goes is the author's. `deploy/` joins the generated project's `.gitignore`.
- Proof: a generated project passes `check`; a generated project's `deploy/` starts with plain
  node from inside itself and serves its page.

## 2026-10-03: B-21, the conformance harness

- **From the outside, over HTTP alone.** `conformance/harness/run.mjs` packs core, cli and
  create, creates a project from the starter's tarball, lays a fixture's files over it, installs
  every `@assemblejs` package from its tarball (an override pins core to the tarball whoever asks
  for it), builds with the command line the project installed, starts `dist/server.js` under
  plain node in production, and runs `conformance/specs/*.spec.mjs` against it with node's own
  test runner. A spec names the DESIGN section it holds the server to and reads only what an
  HTTP client can: no import of a package, no workspace link. It needs the network and minutes,
  so it is `pnpm conformance`, run on demand like `pnpm proof:create`, not a gate in `pnpm check`.
- **The first specs** hold DESIGN 2 to the reference server: the content endpoint (a fragment
  that is exactly one envelope, the echoed name and version, the parent's id stamped, every
  malformed composition header a 400, 404 for an unknown assembly or view), the data endpoint
  (the island's object exactly; a throwing service a 500 with an id and nothing else), the
  manifest (the named fields and nothing else, the content endpoint's version) and the envelope
  (the canonical attributes and only those that apply, the island inside it addressed by its id
  and unable to end its script, the directive never emitted).
- **Found by the first run:** given a service that throws, the content endpoint answered the JSON
  failure body, where DESIGN 2.2 says it renders the assembly's fallback and logs against the
  same id. It now answers the fallback envelope, marked `data-failed` with the logged id, under a
  500, so a composing server still applies its own policy and caches nothing while a bare fetch
  reads an envelope. Proof: `pnpm conformance`, 14 of 14, after the same specs were red on it.

## 2026-10-03: verifying B-20

The rung's verifier found, and this round fixed:

- **`perf` weighed the route a page's directory implies, not the one its `.page.ts` declares**,
  so a page at `/store` failed as `/shop` answering 404. It reads the declared route, as `check`
  now does; a route the file computes is a failure, as only running the project could tell it.
- **The deploy proof did not prove the deploy runs on its own**, as it resolved packages from the
  example around it. `deploy` now reads the packages the built server imports and refuses a
  deploy whose dependencies would not install them: one listed only in devDependencies, one not
  listed, a `workspace:` specifier. A local `file:` or `link:` dependency is pointed from
  `deploy/`. The proof checks the server's packages are in the deploy's dependencies, and a
  dev-only import is refused with nothing written.
- **`deploy` removed any `deploy/`**, a common name for an author's own infrastructure. It writes
  a marker, and rewrites only a directory that carries one; it reads package.json before
  touching anything.
- **`perf` left its server running when interrupted**, and passed a page whose assembly fell
  back. It stops the server on a signal and on every return, and a fallback fails the page.
- **`perf` read only core's exact tags**, and fetched a file from another origin, touching a
  remote. It reads link and script tags as a browser does (any attribute order, any quoting,
  every character reference), names a file from another origin without fetching it, and gives
  each request thirty seconds.
- **`check` passed a page the server refuses at boot**: a declared route with a parameter.
- **Devtools trusted the Host header alone**: under a server listening beyond loopback, another
  machine sending `Host: localhost` read them. The connection's peer must be loopback too. A
  devtools route declared HEAD now boots in both modes, as the router's assertion reads HEAD.
- **Recorded, not changed:** the `ready()` move of the B-19 round has no path in today: no option
  hands a server a plugin, and a server refuses routes once built; it stays as the place the
  assertion belongs. `perf` takes a free port by asking the system and handing it over, which a
  race could lose, since the configuration refuses port 0; and a parent environment with
  credentials turned on makes every page answer 401, which `perf` reports.

## 2026-10-04: verifying B-21 and the B-20 round

The verifier ran `pnpm conformance` (14 of 14), read the generated project (every `@assemblejs`
package a real directory from its tarball, none on the registry to fall back to), served a
deploy installed on its own outside the tree, and watched every guard of the B-20 round go red
under mutation. It found, and this round fixed:

- **DESIGN said `assembly-path` carries ancestors' ids; the server reads `name/view`.** The
  server is right: an instance's id is new on every render, so a path of ids can never contain
  its own target and no cycle could ever be seen. DESIGN 2.1 and 3.4 now say identities, and a
  spec holds the server to refusing a path of uuids and accepting a path of identities. A server
  written to the old text would have been refused by this one, with nothing saying why.
- **The specs passed three servers DESIGN refuses**: one answering the content fallback under
  200, which a composer would render and cache as content; one whose failure body carries data;
  one whose envelope carries a bare attribute. Each is now a spec, watched red on that mutation,
  and DESIGN 2.1 says what B-21 decided: a failed render answers its fallback envelope under 500.
- **`check` refused only a route with a parameter**, of every route the server refuses at boot.
  The route rules are now one function in core, `pageRouteProblems`, which boot and `check` both
  call, and `check` refuses two pages at one route.
- **The harness could leave a server running**, when one never listened, and never removed its
  working directory. A server that does not come up is stopped before the failure is reported
  (watched: without the stop, the fake server outlived the run). A run that passes removes its
  directory; one that fails keeps it to be read. It resolves the workspace from its own location,
  runs each fixture's specs from that fixture's directory and refuses a fixture with none.
- **`perf` read tags a browser does not**: inside a comment or a script's text. It weighed only
  `type="module"`, exactly as cased, and threw on a numeric reference past the last code point.
  It now weighs every script a browser runs, classic or module, and each `modulepreload`, turns
  an impossible reference into U+FFFD as a browser does, and decodes the named references markup
  escapes with, leaving any other named reference as written (the B-20 entry's "every character
  reference" was more than it did). An interrupt now abandons a request in flight.
- **`deploy` passed `catalog:`**, as workspace-only as `workspace:`, and named a subpath import as
  a package. A `#` import the build left for the runtime is refused: a deploy's package.json does
  not map it.
- **Tests left about nine hundred directories in the system's temporary directory.** Every
  package's suite now runs under one global setup that gives the run a directory of its own,
  points `os.tmpdir()` into it and removes it at the end (watched: 37 directories left by two
  test directories without it, none with it). A test that was there twice is there once.
- **Recorded, not changed:** an interrupt during the build is answered when the build returns,
  as esbuild takes no signal. `deploy` reads static and dynamic imports, not `require`; the
  server bundle is ESM and keeps packages external, so a `require` would be the author's own
  `createRequire`, which the deploy's run would report. The deploy's own proof in the cli suite
  still resolves the workspace around it; the run of a deploy installed on its own belongs to
  conformance batch three, where projects install from tarballs.

## 2026-10-04: the conformance matrix, and its three batches

Expected: PLAN's B-22 to B-24 hold "the matrix" green batch by batch.

Found: no document defines the matrix or what a batch holds. Decided here, from DESIGN, so the
three rungs have a fixed scope rather than one chosen as each is written. The matrix is DESIGN's
sections that a server answers over HTTP, each held by a fixture (a real project, installed from
the tarballs) and the specs under `conformance/specs/<fixture>/`:

- **Batch one, B-22: rendering and local composition.** Every renderer shipped (html, the five
  template languages, the six frameworks) answers DESIGN 2's three endpoints with one envelope
  naming it, its markup inside and what it was given escaped (DESIGN 7, 5.4); a static view is
  declared never to mount and names no script, a framework view's script is served (DESIGN 9); a
  page of all of them places each in the template's order, contains the one that fails, shows a
  declared fallback, and dies only for a placement declared required (DESIGN 3.3, 12); a view
  that throws in any framework or template language is the server's failure, each failure's id
  the one it is logged against (DESIGN 7, 12); a declared mount mode reaches the envelope and a
  page of static views ships no script (DESIGN 9); a deferred placement ships its placeholder
  (DESIGN 3.5).
- **Batch two, B-23: across servers.** Two servers from the tarballs: a remote placement, the
  manifest handshake with its script and its scoped stylesheet (DESIGN 10), every failure a
  remote can produce (status, type, size, deadline, a redirect), what is forwarded and what comes
  back, the cache (DESIGN 3.1 to 3.3, 5.1); the real-time stream (DESIGN 3.6); a project's apis.
- **Batch three, B-24: trust and the command line, and the acceptance table.** Inbound access,
  the policy and the boundary (DESIGN 5.2, 5.3); production carries no development surface
  (devtools, reload); `check` and `deploy` from the installed command line, and the deploy run on
  its own; then the table of every intent from the predecessor's tests.
- **Not in the matrix, and why.** A parent's depth and cycle refusal across servers needs one
  assembly to place another, which nothing can yet (the open question below, 2026-10-04). DESIGN
  4 (configuration), 6 (representation) and 11 (runtime shape) are what the fixtures are built
  and started with rather than answers to read; DESIGN 8 is the authoring surface the fixtures
  are written in; DESIGN 13, the agent surface, is not HTTP.

- **B-22, batch one, landed.** The `rendering` fixture holds thirteen assemblies, one per view
  kind and one whose render throws, on three pages: all of them, one with a declared fallback,
  one with the failing placement required. 53 specs; each kind of claim was watched red on a
  mutation: the template's order reversed, a declared fallback dropped, Nunjucks escaping off, a
  static view no longer declared never to mount, a required failure answered 200, a failed
  render's own endpoint answering 200. (The harness change that packs once for several fixtures
  and gives each renderer its framework landed a commit earlier, with the B-21 round; B-22's own
  commit said otherwise.)
- **Found by the first run, and not a defect:** Preact, Solid and Svelte write a `>` in text as
  it is, escaping only `<`. Nothing can start an element without a `<`, so the spec accepts
  either, and its second check, that no value given with markup in it reaches the markup
  unescaped, is what holds every renderer to escaping.
- **Found running the browser suite for the rung:** one run of three failed, the styles example
  "exited with 1" before it listened, and the suite said nothing more. Taking its port before the
  run reproduced that exactly. Every suite that starts a server picked a random port and piped
  away its stderr; each now asks the system for a free port, and an early exit carries what the
  server wrote (watched: the held port now reads as the server's own `node:net` error).
- **Corrected: the fallback ladder's order was observable**, and this entry said it was not. The
  server holds one cache for every page, and any failing placement read it before its own
  fallback, so one page showed what another had cached, unmarked. Fixed with the verification of
  B-22, below.

## 2026-10-04: open, for the owner: how an assembly places a subassembly

Expected: B-23 holds depth and cycles "refused before dispatch" (DESIGN 3.4) across servers,
which needs one assembly to place another: a subassembly, in the README's words.

Found: no assembly can. A local render hands its view `children: {}` (DECISIONS, B-17: "core
passes no children to a local view yet"), and nothing in DESIGN says how an author declares a
child: DESIGN 7 gives a renderer `children` as rendered strings, keyed by something, and DESIGN 8
says services run before children are fetched "so a service can shape what its children are
asked for", but neither says where a child is named (a directive in the view's own markup, which
a framework view cannot write; a declaration beside the view; a field the service returns),
what key a view reads it by, or how a service shapes the request. Each answer is a different
authoring surface, so it is not one to choose in passing.

Decided for now: B-23 holds everything across servers that does not need a subassembly, and
the refusal on arrival (a depth past the cap, a malformed path) stays held by the `contract`
fixture. Depth and cycles refused by a parent before dispatch, across two servers, wait for the
owner's answer and land with it. Raised with the owner; recorded here so the gap is not
mistaken for a test that was forgotten.

## 2026-10-04: verifying B-22

The verifier ran every fixture green, then found, and this round fixed:

- **One page showed what another page had cached, unmarked.** The server holds one cache for
  every page, keyed without the page, and a failing placement read it before its own fallback,
  whether or not it had declared a lifetime. Now only a placement that declared a lifetime reads
  or writes the cache at all, and the ladder runs in DESIGN 3.3's order: the declared fallback,
  then the last good content, then the empty envelope. A placement refused before dispatch is
  never answered from the cache, and a required one is saved only by its own last good content.
  The ladder is its own module (`fallBack`), the cache rules another (`placementCache`). A spec
  fills the cache on one page and fails the same assembly on another, watched red on the old
  order.
- **`assembly-path` still disagreed with DESIGN**: the composer sent the target in its own path,
  so a server refusing a path that names it (DESIGN 3.4) would have refused every request; and
  this server never refused one on arrival. The composer now sends the ancestors alone, and the
  content endpoint answers 400 to a path that already holds the assembly, a spec holding both.
- **`check` let a page share a route with a GET api**, which boot refuses. It reads each api's
  path from its source, as it reads a page's route. (Its claim, every route boot refuses, was
  still false for routes among apis; made true in the round after.) Placement policy (a view the assembly lacks, policy for an unplaced name,
  deferred and required) is still boot's alone, as `check` never claimed it.
- **The specs passed a server with one constant failure id, and one shipping a script on every
  page.** The harness now keeps what each server writes, and every failure spec finds its id in
  the server's own log (DESIGN 12); two failures have two ids. A page of static views alone is
  held to shipping no script.
- **The matrix left out what it did not say**: styles (DESIGN 10) join B-23, the declared mount
  modes and a throwing view in every framework and template language join B-22, and what is not
  in the matrix is now said, with why.
- **`perf` read a custom element as the element its name begins with** (`<title-bar>` swallowed
  the document after it), ended a comment where a browser does not, and counted links a
  `noscript` or `template` holds and a `nomodule` script. Each now reads as a browser reads it.
- **The harness left servers running on a signal sent to it alone**: it now stops every server
  and the specs before it ends, and runs the specs without blocking so the signal is heard. The
  interrupt test for `perf` now holds the run to its time, watched red at thirty seconds.

## 2026-10-04: B-23, across servers, and the deferred placement it found missing

- **The `remote` fixture is two projects and a third server the spec runs.** A producer (an
  assembly per behaviour, apis, a stream) and a consumer whose config and pages read the
  producer's origin from the environment, as a deployment would, and declare a second remote on
  a port the harness sets aside, where the spec runs a server that misbehaves on purpose. 16
  specs: a remote placement marked with its origin, its script served to any origin and its
  stylesheet scoped to its envelope, the page's policy naming the remote; a 500, a 404, an answer
  past the cap and one past its deadline each contained, a required one failing the page; a
  lifetime honoured; a JSON answer and a redirect refused, the redirect never followed, the
  remote's headers discarded, nothing of the visitor's forwarded but the declared key; an api,
  a stream of one data line per message, refused for HEAD and named in its page's head.
- **Found by the first run: a deferred placement rendered nothing**, and the browser had nothing
  to fill. The owner's ruling of 2026-09-03 says the page ships a placeholder the browser fills
  after load. The composer now emits the empty envelope, marked `data-defer`, and the runtime
  fetches the content endpoint by that envelope's id once the page has loaded, puts the answer in
  its place, and mounts it like any other; anything but one envelope with that id leaves the
  placeholder. A deferred placement from another server, which a browser could not fetch across
  the remote's same-origin policy, and one of an assembly with no browser half, which puts no
  runtime on the page, are refused at boot. Held by the `rendering` fixture over HTTP (the
  placeholder, and what its id fetches) and by the frameworks example in a real browser, the
  browser test watched red with the fill turned off.
- **Each new spec was watched red on a mutation**: the cache read without a lifetime, no
  stylesheet hoisted, a script on every page, a deferred placement emitting nothing, a constant
  failure id, no cycle refused on arrival, a declared mount mode dropped.

## 2026-10-04: verifying B-23 and the deferred placement

The verifier ran every fixture and the browser suite green, then found, and this round fixed:

- **A deferred assembly in its own shadow root was filled into the light DOM**, unstyled, and its
  hydration failed: the answer was parsed as plain markup, which never attaches a declarative
  shadow root. It is now parsed as the page was (`setHTMLUnsafe`, where the browser has it), and
  a browser test holds a deferred React and Svelte assembly in their shadow roots, styled and
  hydrated, watched red with the old parsing.
- **A deferred placement that failed showed nothing and carried no id**, its declared fallback
  never seen. The placeholder now carries the fallback inert, and a failure shows it in the
  server's failed envelope with the id its failure is logged against, or marked failed with no
  id when no answer came. The fill now carries the page's query, as a placement rendered with the
  page receives it.
- **The boot refusal of a deferred static assembly was too broad**: another assembly's browser
  half puts the runtime on the page, which fills it. It now refuses only a page with no runtime
  at all. A deadline or a cache on a deferred placement, which nothing reads, is refused like any
  other unread policy. DESIGN 3.5 now says all of this, the refusals included.
- **Raised with the owner:** the ruling of 2026-09-03 says a deferred assembly's placeholder is
  filled by the browser after load. Two deferrals cannot be filled as shipped, so boot refuses
  them rather than ship a placeholder that stays empty: one from another server, whose fragment
  the browser cannot fetch across that server's same-origin policy, and one on a page with no
  runtime. Lifting the first means a remote opting into cross-origin fragments, a policy change
  that is the owner's.
- **`perf` stopped weighing a shadow assembly's stylesheet**, as the last round made every
  `template` inert; one declaring a shadow root is not, and is read again.
- **The remote specs passed a constant failure id, a 4xx accepted as content, a fetch not
  cancelled at its deadline, and a cache that never forgets.** Every remote failure's id is now
  found in the consumer's log and is its own; the hostile server answers a 404 and a 500 each
  carrying a well-formed envelope, and stalls a request whose connection the spec sees closed at
  the deadline; a short lifetime is seen to pass. Each was watched red on its mutation.
- **A signal to the harness while a server was starting left it running**, and one during the
  pack took the default action. A server is tracked from the moment it is spawned, the handlers
  are installed before the pack, and the kept directory is named (watched: without the tracking,
  the consumer outlived a SIGTERM sent 30ms into its start). Every project is built before a port
  is set aside, so a reserved port is held for seconds rather than minutes; an unknown `{name}`
  in a project's environment is an error.
- **`check` passed api routes boot refuses**: two that match the same requests, one under a
  reserved prefix. It reads each api's route and holds it to core's own `apiProblems`.
  Placement policy (a view the assembly lacks, policy for an unplaced name, the deferral rules)
  is still boot's alone; that `check` should read it too is a ledger row.
- **Two pages with different lifetimes shared one cache entry**, the longer one's: the key now
  carries the lifetime.
- **The unit tests let four mutations through** (the fill's element check, a fill finishing
  after its cancel, the envelopes inside a filled one, asking for one placeholder twice); each
  is now held, watched red.
- **Recorded, not changed:** a remote placement's identity on the path is the page's name for
  it, not the remote's own; nothing reads it until an assembly can place another (the open
  question above), where it is to be settled. The private-range refusal of DESIGN 5.1 needs an
  undeclared loopback origin, which boot refuses, so it stays held by the transport's unit tests.

## 2026-10-05: B-24a, trust and the command line; the acceptance table held back

Expected: PLAN's B-24, "conformance breadth, batch three, and the acceptance table", as one rung.

Found: the table's source is the `legacy-tests` dossier, which lives outside this tree by design
(gitignored `docs/dossiers/`, absent from a cloud session), and no summary of it exists in DESIGN
or here. The rung splits: B-24a, the conformance half, lands here; B-24b, the table, is a ledger
row for the owner, as the client-dossier row is. A split of a rung is a change to the ladder's
shape, so it is raised with him rather than settled.

- **The `trust` fixture is four projects from the tarballs**, held over HTTP by 43 specs:
  `guarded` (basic credentials from the environment, a public route exactly and a prefix from the
  config, an html assembly with a browser half and a stylesheet, a stream, an api that reads a
  body); `checked` (the product's own check reading a header, one value making it throw, a
  replaced policy); `open` (no control on, a declared remote nothing places, a service that reads
  nothing); `plain` (one html assembly on one page, the starter's shape, for the command line).
  DESIGN 5.2: every kind of route (page, content, data, manifest, api, stream) refused without
  credentials with the challenge and the failure body alone, and answered with them; an unknown
  path refused before it is matched; the decision before the body is read, on an api that reads
  one; health, the built browser files (to any origin) and the declared public routes needing
  none, the exact one exactly and the prefix for everything under it; a credential in no body;
  the product's check with no basic challenge, a throwing check refusing and logged against the
  id the visitor was told, the project's policy replacing the default as written; two deciders
  refusing to boot. DESIGN 5.3: the island exactly its six named fields; nothing of the query, a
  cookie, a header's value or name, or a credential in the page; the default policy on every html
  answer and on no JSON one, naming this origin and the declared remote, nothing inline, no
  plugin, no wildcard; same origin by default, a page from another origin granted nothing and a
  preflight granted nothing; every answer `nosniff`. DESIGN 11: nothing under the devtools prefix
  answering for any method in production, no page linking the reload script, the banner saying
  production, and the same build in development serving the reload stream and script and linking
  the script, so their absence is the mode's and not the build's; the devtools themselves are
  mounted only for a server handed them, which `dev` does, so their absence in either mode is
  this build's. The command line the project installed: `check` passing the project as written
  and refusing a placement with no assembly, naming the file, the rule and the whole fix;
  `deploy` writing a directory that, copied away from the project and installed from its own
  package.json, runs with no bundler and no development dependency in it.
- **The harness tells a spec each project's root** (`CONFORMANCE_ROOT_<NAME>`), and the shared
  helper starts a build under an environment of the spec's own (`started`), answering its origin
  or its exit and output: how a boot refusal and the development inverse are held from outside.
  A server that has not listened in 30 seconds is stopped rather than awaited forever, its output
  is read whole (`close`, not `exit`), and a port another spec file drew in the same moment is
  tried again on another.
- **Every spec passed its first run.** Each claim was then watched red by a mutation aimed at
  it, in five runs of the fixture against a mutated tree, the packages' tarballs included: the
  page made public and the prefix dropped, and the whole assembly and api surface made public;
  the check admitting everyone; a seventh island field; the development surface mounted whatever
  the mode, and never; `check` passing a missing assembly, and reporting a problem of its own;
  the deploy keeping its development dependencies, and its build copied where the start script
  does not look; no policy, no `nosniff`, every origin granted, preflights included; the policy
  forgetting the declared remote, and allowing inline scripts; two deciders unrefused; other
  credentials than the spec's; the service echoing the query, and the page carrying the
  request's cookie, a header and the credential; the decision moved after parsing; the user in a
  refusal's body; the policy on every answer; health not public, and the built browser files not
  public, and served to this origin alone; the banner lying; no public route under the check; an
  unmatched path skipping the decision; the basic challenge sent under the product's check; a
  check that threw logged against nothing. Four claims were split into one test per thing they
  held, so each could be seen red on its own.
- **Found by the mutations, and recorded:** the type system refuses a seventh island field at
  compile time (DESIGN 5.3's own claim), so the mutation had to spread past it; moving the
  decision to a later hook still refuses an unknown path, because the router runs the root hooks
  for its not-found handler too, so "before it is matched" was watched red only by skipping the
  decision for an unmatched request; a project placing a missing assembly cannot be a fixture
  mutation, as boot refuses it, so the `check` claims were red-tested through `check` itself.
- **Found by the verification, and fixed:** a check that threw was swallowed and logged nowhere,
  so a gate broken on every request gave 401s with no trace of why. DESIGN 12 says the visitor
  sees the id and the log holds the exception; the one decision now hands what the check threw to
  the server, which logs it against the id the failure body carries, held by a unit test watched
  red and by the fixture, which finds the id in the server's log. A refusal nothing threw for is
  not a failure and is logged against nothing, which the fixture holds too. The verification also
  found a claim the first runs had reached only as a side effect of a mutation aimed elsewhere,
  a body-reading claim held on a route that read no body, and a development-surface claim that
  overreached to routes this build never mounts; each is corrected above.
- **Not held here, and why:** the private-range refusal and the manifest handshake stay with
  B-23's fixture and the unit tests; DESIGN 4's refusal of a control turned on without its
  credential is configuration, outside the matrix (2026-10-04).

## 2026-10-05: `check` reads placement policy as boot does

Expected, from the ledger row the verifications of B-22 and B-23 left: `check` refuses every page
boot refuses, placement policy included (DESIGN 11: every problem found without building).

Found: boot's rules for a placement (an assembly or a view that does not exist, policy for a name
the template never places, policy that is not an object, deferred with required, a deferral from
another server or on a page with no runtime, a deadline or a cache on a deferral, a deadline that
is not positive and finite) and for a page's stream (not a streaming api's path without
parameters, nothing on the page to open it) were written inline in `pageProblems`, and `check`
read a page declaration only for its remote urls, as strings; a number or a boolean in it read as
computed. Settled here:

- **One set of rules, two readers.** The placement rules are their own module in core
  (`placementProblems`, each finding naming the placement and whether the assembly, the view or
  the policy is wrong), as are the stream rules (`streamProblems`, `streamPaths`) and what they
  read of an assembly (`PlacedAssembly`: its views, and whether it puts the runtime on the page;
  `opensRuntime`; `isRemotePolicy`). Boot reads those facts off the definitions the registry
  built; `check` reads them off the files (one view, `default`; a browser half for a framework
  view or a static one with a `.client.ts`) and calls the same functions, so both refuse the same
  page the same way, with a fix beside each finding and two rules the agent surface explains
  (`policy-names-a-placement`, `a-page-opens-one-stream`).
- **`check` reads a declaration once** (`readPagePolicy`: the policy of each placement, the
  placements from another server with their url where it is written, and the stream), and reads
  literals as written: a number, a negated number, a boolean and a null are literals now, kept
  as written for the rules to refuse; what is computed reads as undefined rather than null, so a
  written null is not mistaken for it. What is computed is not reported either way: a computed
  policy is no policy, a computed deadline or flag is absent from its policy, a computed stream
  is no stream. A computed url is kept as a mark that the placement is another server's; a
  written one is held to the url rules boot holds it to, now one function in core
  (`remotePlacementProblems`: the content endpoint shape, the declared origin, the page's forms).
- **`check` reads a framework view's own `mount`.** Found by the verification: the registry
  writes a view's `mount` export into the definition, so a view declaring `mount = "none"` puts
  no runtime on the page at boot, and `check` had assumed every framework view did. It now reads
  the export from the view's source (`readViewMount`: a `.ts` or `.tsx` file whole, a Svelte
  component's module script, a Vue component's plain script), never run; a mount it cannot read,
  computed or absent, is a view that mounts, as the registry resolves it at run time.
- **Also found by the verification, and fixed:** the stream-path rule had stopped running for a
  page whose template cannot be read, which it did before the refactor; the rule now takes
  "unknown" for whether the runtime is on the page and holds the path alone there, in both
  readers. The messages are byte for byte what they were; their order is not, and a view named
  `constructor` is refused now, which a prototype lookup had let through. The agent surface's
  rule names the policy findings it had left out.
- Every new rule in `check` was watched red before it was read (the five cases failed with
  nothing reported), and the factored core rules were watched red under two mutations (the
  runtime always on the page; no policy ever remote). Proof: the core, cli and mcp suites, the
  gates, and the `trust` fixture's command-line spec, which runs `check` from the tarballs on a
  project as written and on two the rules refuse.
- **Found by the check chain, under load, and fixed:** the test that ends `dev` on a second
  Ctrl-C read the server's pid file the moment it existed, and between the file's creation and
  its write it is empty; a pid read as 0 names the whole process group, which a signal probe
  always finds, so the server read as outliving dev when it had not. The test now waits for a
  pid it can parse. Recorded in the ledger's traps.

## 2026-10-05: `build` and `check` compile each template view

Expected, from the ledger row the verification of B-17 left: a template its engine cannot read
refuses the build rather than falling back at its first render.

Found: Handlebars compiles lazily, on the first render, so of the five engines it alone let an
unreadable template through `compile`; and `check` was synchronous, where loading a project's
own engines is not. Settled here:

- **Every template view is compiled, once, before anything is built or served**, by `build` and
  by `check` (`templateProblems`), with the compiler the project's own
  `@assemblejs/renderer-templates` loads for its language, found the way the bundler finds a
  package and imported from the project's copy, never ours, so a template compiles with the
  engines its server will render it with. One that throws is a problem naming the file and what
  the engine said on one line, cut where the engine starts advising about options this build
  does not expose and without the lines that only draw a caret under an excerpt, under a rule
  of its own (`a-template-view-compiles`), which the agent surface explains; `check` prints the
  file, `build` the assembly and the message, as it prints every problem. A view that cannot be
  read, and a package or an engine of it that cannot be loaded, are problems of their own kind,
  never blamed on the template. A project without the package has nothing to compile with,
  which the build already reports, so the check says nothing then.
- **Handlebars parses when it compiles**, the parse handed to compile so it happens once; a
  template it cannot parse throws then, as in every other engine. What an engine resolves only
  as it renders still throws then: a value the data has not and, in Handlebars and Nunjucks, a
  helper or a filter the template lacks, a helper given the wrong number of arguments, and a
  partial, an include or a parent it names, which a view, being one file, never has. That is
  what the `rendering` fixture's broken views do, and why they still build. Markdown never
  throws, so a `.md` view is never reported. The compiler's contract says all of this.
- **`check` is asynchronous now**, as is the agent surface's `check` tool and the verb, because
  it loads the project's engines; nothing else about it changed.
- Watched red: the check made to report nothing, and the eager parse removed, each against its
  tests. Proof: the cli, mcp and template suites, the gates, and the `rendering` fixture from the
  tarballs, whose template views fail at render and build as before. The verification found a
  test leaving directories in the examples tree, read and load failures blamed on the engine,
  and a broken install rejecting the whole check instead of being one of its findings; each is
  fixed above. The cli suite reaches the project's engines through the templates example, which
  resolves to the workspace package's built output, so the suite alone needs that package built
  first; `pnpm check` builds before it tests. Recorded in the ledger's traps.

## 2026-10-05: a page's route parameters reach the assemblies it places

Expected, from the row held back on 2026-10-03: `/products/:id` is the design's own example
route, and nothing carried a page's parameters to its placements, so boot refused the route.

Found: the request a placement receives had a query and no parameters, the cache key was built
from the query, a service's context already named `params` and was always given none, and the
remote transport had no way to send them. Settled here:

- **A page's parameters are composition state, carried like the rest of it.** The router hands
  them to compose, every placement's request carries them, the local transport hands them to
  `resolveData` as the services' `params`, and the cache key carries them beside the query, so a
  different parameter is a different page. Across servers they are the fifth composition header,
  `assembly-params`, form-encoded in name order, read on arrival like the other four: at most
  2048 bytes, each name a parameter's and named once, otherwise 400 naming the header. The
  content and the data endpoints both read it, so the data a fragment is rendered from is what
  its data endpoint answers. An outside caller may send it and gets what a parent gets: a
  parameter is what a service is given, never a privilege. DESIGN 2.1, 3.5 and 8 say so.
- **A deferred placement carries them for the browser.** The placeholder is marked
  `data-params` with the same encoding, and the fill sends it as the header, so the fill is the
  request a placement rendered with the page would have received. Proved in Chromium from the
  shadow example, at `/item/:sku`.
- **`perf` invents no value for a parameter.** A page whose route has one has no one url to
  weigh, so it is reported as not weighed, and the command does not fail for it.
- **Held where it fits under the ceiling.** The composer, the placeholder, the local and remote
  transports, the header's reading and the browser's fill each have a unit test. The two server
  wirings, the page route handing the router's parameters to compose and the endpoints reading
  the header, are held by the `contract` fixture over HTTP, because the unit files for both sit
  at 300 lines and a test file mirrors one source file; the `remote` fixture holds a parameter
  crossing to another server's assembly. Watched red: the browser proof with the fill's header
  dropped (the tag read "none"), the header's reading, the key and the placeholder each under
  their unit tests.
- **Found by the verification, and fixed:** `check` keyed two pages' collision on the route as
  written where boot keys it as the router matches, so two routes differing only in a
  parameter's name passed `check` and failed boot, a case the old refusal of any parameter had
  hidden; `check` keys them as boot does now. A parameter named `__proto__` was dropped on the
  wire, as a plain object's setter swallows it, where the router's own parameters, which have no
  prototype, kept it; the parameters read from the header have no prototype either now, so a
  parameter named like a property of every object is a key of its own on both sides, and DESIGN 8
  says so. A remote declared as forwarding `assembly-params`, or any composition header, let a
  visitor's header stand in for the composer's; boot refuses such a declaration now, and the
  transport sets the composition headers over the forwarded ones regardless. Each watched red.
- **Recorded, not changed:** the router bounds each parameter's value at 100 characters and the
  header the whole encoding at 2048 bytes, so a route of more than twenty parameters with
  multibyte values could compose locally and be refused by a remote; a route like that is not
  one this design describes, and the cap stays where DESIGN 2.1 names it.

## 2026-10-05: B-25, size budgets and the pack check; the Scorecard run is the owner's

Expected, from PLAN: "Size budgets, pack check, Scorecard", proved by "budgets asserted; a
Scorecard run".

Found: `perf` measured and nothing held the numbers (B-20); the pack check held what a tarball
carries and not what it weighs; and the Scorecard workflow exists for Actions, which runs nothing
on this repository, and its binary is a release on github.com, which this session's proxy
refuses. Settled here:

- **Every package has a size budget**, in `scripts/size-budgets.json`, in packed bytes as
  `npm pack --dry-run --json` reports them, and the pack check refuses a tarball over it, a
  package with none, and a budget for a name that is no package: a package nobody measured grows
  unnoticed, and a budget is raised on purpose, in a change that says why. Each is set by hand,
  between a fifth and three tenths above the size the check printed for it on 2026-10-05, to a
  round hundred: headroom for a feature, not for a second copy of anything; no formula
  reproduces the twelve numbers and none is claimed. The check's self-test is not a flag but
  the first thing every run does: a synthetic package shipping `dist/x.test.js`, the first real
  package a byte over, the second with no budget, each refused by name before the real packs
  are believed. Fewer than two
  packages, a budgets file that is missing, cannot be parsed or is not an object, and a pack
  that fails (no `packages/`, `npm pack` refusing), each end the run with one line and exit 1,
  never a stack trace (probed in a scratch tree: `null`, `[]`, `"abc"`, no file, one package,
  none).
- **A project's pages have budgets too**, declared in `assemblejs.config.ts` as `budgets`, in
  gzipped bytes by part (`document`, `styles`, `scripts`, one list in `perf/page-parts.ts` that
  both the reader and the comparison use), read by `perf` and by nothing on the server: policy,
  where the other policy lives, read from the source as `check` reads it. `perf` holds every
  page it weighs to them and fails the command for one over; a budget it cannot read, a part a
  page does not send, a value that is not a whole number of bytes above zero, a computed value,
  a computed `budgets` object, or one with a spread or a computed key in it, fails it before
  anything is built, and `check` reports the same under `a-budget-is-whole-bytes`, so the agent
  surface's `explain` answers it. A page with a parameter in its route is not weighed and so not
  held. DESIGN 8 says so.
- **A config that is not one written object must write its budgets.** `export default
defineConfig(load())` and `export default { ...base }` could carry budgets `perf` cannot see,
  so, unlike `check`'s reading of remotes and routes (computed is not reported either way,
  because boot refuses what is wrong), `perf` refuses such a config, and `check` reports it,
  unless `budgets` is written beside what it brings in, `{}` to say none: budgets are read by
  `perf` alone, so what is written in `assemblejs.config.ts` is the budget by definition. Every
  config in the tree (the four conformance fixtures; the examples and the starter write none)
  is one written object, so none is refused. `readDefaultExport` also follows the name a call
  is given (`defineConfig(shared)`)
  to its declaration, one call deep, and a numeric key in an object literal is read as its
  string, so `budgets: { 5: 10 }` is refused by name.
- **An object read as a literal says when its keys are not all written.** `literalOf` dropped a
  spread or a computed key and returned the entries beside it, so `budgets: { ...shared }` read
  as no budgets at all. Making such an object computed as a whole would lose the `route` of a
  page declared as `{ ...base, route }`, which `check` would then take for the directory's. So
  the object keeps its written entries and carries `UNWRITTEN`, a symbol, beside them: a reader
  that walks the entries (policy, origins, routes) never meets it, and the one reader that must
  have the whole object, `readBudgets`, asks for it by name.
- **The Scorecard run is the owner's.** The workflow is in place; until the organization allows
  Actions on this repository it runs nothing, and the binary cannot be fetched from here. The
  ledger row splits: budgets and the pack check are done (B-25a), the run stays open under the
  owner's Actions row (B-25b). A split of a rung is a change to the ladder's shape, so, as with
  B-24, it is raised with the owner rather than settled; PLAN's row stands until he rules.
- Watched red: the pack check's self-test with the test-file pattern removed from its allowlist
  ("FAILED to refuse a known-bad input", exit 1) and every run since; `perf` on a page over
  budget, a part it does not send, a budget of zero, a computed value, a computed `budgets` and
  a config that cannot compile, with its refusal disabled against the test that expects each;
  `readBudgets` with its spread refusal disabled, and with its refusal of a config that is not
  one written object disabled, against the tests that expect them; `readDefaultExport` with the
  call's name not followed; `check` with its budgets reading disabled, against the test that
  expects the finding.
- Verified by a separate agent twice. The first pass's fourteen findings were fixed: among them
  a computed `budgets` object escaping `perf` silently, the budgets set wider than the record
  said, the self-test watching only the budget half of the check, and `check` not reading
  budgets at all. The second pass found six more in the fixes, fixed before this landed: `check`
  reporting a config that cannot compile twice (one read now serves remotes and budgets, with a
  test), the budgets sentence above not matching the file (rewritten to what is true), the
  perf-level and reader tests short of what "watched red" claimed (added), three more silent
  escapes (`defineConfig(shared)`, `{ ...base }`, a numeric key; the ruling above), the mcp
  rules test holding its rules to include every project rule rather than to exactly them (the
  comment on `RULE_IDS` now says so), and the pack check's own packing able to end in a stack
  trace (guarded).

## 2026-10-05: B-26, the release dry run; what it found in the release path

Expected, from PLAN: "Release dry run: changesets version, pack every package, publish dry run
with provenance from the reviewed environment", proved by "the dry run lists every package and
the tarball contents are read".

Found: the local half can be run here and was; the provenance half cannot. `npm publish` and
`pnpm publish`, dry or not, are denied to this session by its settings, and provenance is minted
by Actions' OIDC token in the `release` environment, which runs nothing on this repository yet
(the Actions row). Run here, with the output in the session:

- `pnpm changeset status --verbose`: "Some packages have been changed but no changesets were
  found", exit 1; `pnpm changeset version`: "No unreleased changesets found", exit 1, nothing
  written. Both as the open 2026-10-03 ruling predicts: no changeset exists yet.
- Every package packed (`npm pack` into the scratchpad, twelve tarballs, `1.0.0` each) and every
  tarball listed with `tar -tzf`: 109 entries, every one `package/dist/**`, `package.json`,
  `README.md`, `LICENSE` or `NOTICE`; no test, map, fixture, config or source. Sizes as the pack
  check printed them, all under budget. `publint` and `are-the-types-wrong` green on each
  (`check:publish`, in `pnpm check`).
- The registry answers 404 for `@assemblejs/core`, `@assemblejs/cli` and `@assemblejs/create`
  (a control lookup of another package answers), so nothing is published and `1.0.0` is free.

Settled here, from what the reading found:

- **The release workflow could not have run.** `release.yml` passed `publish`, `commit` and
  `title` to `changesets/action` at its pinned commit, whose `action.yml` (read at that commit)
  takes `publish-script`, `commit-message` and `pr-title`; the old names are the v1 inputs, and
  the action's own source at that commit (`src/index.ts`, `src/utils.ts`) refuses them before
  anything else runs: "The following inputs have been renamed ... Please update your workflow
  file.", so the job would have failed on every push. Renamed. The `GITHUB_TOKEN` environment
  line went with them: the action reads its `github-token` input (the workflow token by
  default) and refuses a `GITHUB_TOKEN` environment that differs from it, so the line did
  nothing today and would break a custom token tomorrow. The comment at the top of the file
  now says what the action does, from its source: with changesets, the version pull request;
  with none and a version npm lacks, it publishes.
- **Pre mode on `next` is not entered.** The comment claimed `next` publishes `1.0.0-next.N`
  under the `next` tag; `.changeset/pre.json`, which `changeset pre enter next` writes (read in
  `@changesets/pre`), does not exist, so a push to `next` with the action working and the
  trusted publisher set would publish `1.0.0` itself. In pre mode, `changeset publish` (its
  `getReleaseTag`, read in `@changesets/cli`) passes `--tag next` for a package the registry
  does not have, and from the second prerelease on publishes to `latest` itself while the
  package has only prereleases; whether the registry also sets `latest` on a package's first
  publish is not readable from here and needs a run in Actions. Not entered here: when the
  first release happens, and under which tag, is the owner's, and this is raised with him with
  the changesets question.
- **`@assemblejs/cli`'s `files` named a `templates` directory that does not exist**; the starter
  is written from code. Removed; the tarball is the same eight files.
- Read for the first publish and left to the owner, each a setting outside this tree: the
  trusted publisher is configured per package on npmjs.com, naming `release.yml` and the
  `release` environment, and whether one can be attached to a package that does not exist yet
  is his to confirm there; the action creates GitHub releases from each package's
  `CHANGELOG.md` by default (none exists yet; the planned `RELEASE_NOTES.md` body is the
  release-notes row's); the version pull request needs the repository setting that lets
  Actions open pull requests. `changeset publish` runs `pnpm publish`, which packs (rewriting
  `workspace:*`) and hands the tarball to the `npm` on the path, so the workflow's npm 11.5.1
  step is the one that mints provenance; the file lists of `npm pack` and `pnpm pack` are the
  same (checked on the cli).
- The ledger row splits as B-24 and B-25 did: B-26a, the local dry run, is done; B-26b, the
  publish dry run with provenance from the reviewed environment, is the owner's and waits on
  Actions. Raised with him.
- Verified by a separate agent at the source, the action's code included; its findings fixed
  before this landed: the cause recorded for the old inputs (a refusal, not a silent
  versioning), the tag changesets passes on a first prerelease, the dead `GITHUB_TOKEN` line,
  and "the tarball unchanged" where "the same eight files" is the exact claim.

## 2026-10-05: the site's guides and its generated links; the API reference waits on a ruling

Expected, from the ledger's site rows: the guides "owed once the renderers exist, so a guide can
show real code"; `scripts/site-links.py`, "cross-links generated from `pages.json`, never
hand-written"; the API reference "generated into `site/docs/api/` at deploy time, never
committed". The renderers exist, so the first two are owed now.

Found and settled:

- **Four pages under `site/docs/`**: the tutorial (one project from `npm create` to `deploy`,
  nine steps) and one guide per camp, React, Vue and Svelte. Every file they show is read from
  the repository's own examples (`two-frameworks`, `frameworks`, `realtime`, `shadow`,
  `styles`), from what `add` writes (`assembly-files.ts`), or, for the page policy and the
  budgets no example declares, from DESIGN 8 and the tests of `page-placement.ts` and
  `read-budgets.ts`; every claim from DESIGN 8, 9 and 10 or the code it describes: the props
  (`data`, `children`, and `events` as a Svelte prop), the service context (`query`, `params`),
  `useEvents` from each renderer's `client` entry, `on` returning its unsubscribe, `last` for a
  stream topic, the four mount modes read by `read-mount-mode.ts` with `load` the default,
  `shadow`, a stylesheet beside the view (`discover-assemblies.ts` takes any `.css` in the
  directory), where a Vue or Svelte view writes its `mount` export (`view-script.ts`: a plain
  `<script>` beside `<script setup>`, or `<script module>`), the renderer peer dependencies from
  each package's `package.json`, and the config names from `read-config.ts`. Declared in
  `pages.json`, linked from the docs index, not in the footer nav.
- **The links are generated.** `scripts/site-links.mjs` reads `pages.json` and rewrites the
  region between `<!-- links -->` and `<!-- /links -->` on every page that has one: the landing
  page first (except on itself), then every `in_nav` page except the page itself, in manifest
  order, then, on the landing page alone, the `external` entries, joined by the page's own
  `sep`, with hrefs relative to the page's directory. The rule was read off the four footers
  written by hand before it, which it reproduces byte for byte; the one change it made was to
  add "Report an issue" to the landing page, which the manifest declared and no page carried.
  `--check` is in `check:site`, so a link typed by hand cannot drift and a page added to the
  manifest reaches every footer; a nav page without a region is refused. The self-test runs
  first, every time, on a scratch site with a hand-typed region and a nav page without one.
  Watched red on `install.html` with a link removed by hand.
- **Named `.mjs`, not `.py` as the row said.** Every gate in `pnpm check` is Node or bash and
  none is Python, the deploy workflow sets up no Python, and the site check that runs it is
  Node; a Python generator would be the one tool in the chain that CI could not run. The row's
  name was carried from another product's pattern, whose script was not readable from here, so
  the rule above is this repository's own reading of `pages.json`'s `sep` and `in_nav`; raised
  with the owner in case that product's generator reads them differently.
- **The API reference is not done.** Generating it at deploy time means a build step
  (typedoc or like, over the built packages) in `deploy-site.yml`, which DEPLOY.md and the
  workflow's own comment define as "static pages, no build". Adding one is a change to the
  deploy's shape, so it is the owner's: which generator, run where, and whether `site/` stops
  being "the whole site". Raised; the row stays open.
- `LANDING.md` marked two claims as ahead of the code, the remote transport (B-13) and the
  agent surface (B-09b); both are built and proved, so the table now names what backs them
  and the section says no claim is ahead.

## 2026-10-05: the owner's rulings on everything raised this week

Asked as plan questions at the end of the session, answered in one sitting. Each ruling closes
an entry above or a ledger row, and names what lands with it.

- **Changesets start with the first change after the first publish** (closes 2026-10-03,
  open). Until then the packages' versions say what the first release is. CLAUDE.md's Release
  section says so in one sentence, written with the gate script below.
- **`next` enters changesets pre mode now.** `pnpm changeset pre enter next` wrote
  `.changeset/pre.json` (`mode: "pre"`, `tag: "next"`); committed here. A working `release.yml`
  on `next` now publishes `1.0.0-next.N` with `--tag next`. Whether the registry also sets
  `latest` on a package's very first publish is seen on the first run in Actions, not from
  here.
- **The release workflow's renamed inputs stay** (`publish-script`, `commit-message`,
  `pr-title`; the `GITHUB_TOKEN` line gone), as B-26a found them.
- **The second halves of B-24, B-25 and B-26 fold into B-27a.** The acceptance table, the
  Scorecard run and the provenance publish are estate integration; the three OWNER rows are
  struck and B-27a's row names them. PLAN stays frozen.
- **`scripts/site-links.mjs` stays `.mjs`**, with the rule recorded in the site entry above.
- **The API reference is typedoc at deploy time.** `deploy-site.yml` gains Node, pnpm, install,
  build and a typedoc run into `site/docs/api/`; DEPLOY.md's "no build" sentence is rewritten;
  typedoc becomes a root devDependency. Lands as its own commit.
- **A subassembly is placed by a directive in the view's markup** (closes 2026-10-04, open):
  `<assembly name="...">` inside a template view, as a page places one, and a `Slot` bound to
  the same name in a framework view; the key a view reads a child by is the name. This is the
  next rung after the commits named here: nested composition, services shaping a child's
  request, and a parent's depth and cycle refusal held across two servers in conformance.
- **A deferred placement from another server stays refused at boot.** A remote assembly is
  fetched by the server with its deadline; deferral is local. The row is struck.
- **Author lines leave the packages; the repository url stays; the law is amended.** Each
  `packages/*/package.json` drops `author` (credit is the root `package.json` alone, as the law
  said); `repository` and `bugs` keep the organization's url because npm provenance verifies
  the package against it, and CLAUDE.md's identity law names that url as the one allowed
  mention. Lands with the gate script.
- **CLAUDE.md's gate paragraph gets the script it claims**, `scripts/check-claude-gates.mjs`,
  which reads the gates the paragraph names and fails on one absent from the `check` chain,
  self-tested, in `pnpm check`; the Packages list gains `@assemblejs/mcp`. Lands as its own
  commit.
- **GitHub releases come from each package's `CHANGELOG.md`**, the changesets action's
  default, so `release.yml` keeps `create-github-releases` as it is. The release-notes rows are
  rewritten around that: `CHANGELOG.md` is per package and written by changesets, not
  hand-kept at the root; `RELEASE_NOTES.md` and the site page remain the user-facing register;
  the drift gate maps the packages' changelog headings to the site page's sections.
- **The order of work now:** this commit (pre mode and the rulings), then the gate script with
  the metadata and CLAUDE.md changes, then typedoc at deploy time; then stop. The subassembly
  rung is the next session's.

## 2026-10-05: CLAUDE.md's gate paragraph has its check; author lines leave the packages

From the rulings above. `scripts/check-claude-gates.mjs` reads the gate paragraph in CLAUDE.md
(every backticked `check:*`, `lint`, `typecheck`, `build` or `test` it names) and package.json's
`check` chain, and fails on a gate named and not run; it runs as `check:claude`, after its own
self-test, which refuses a paragraph naming a gate the chain lacks and a CLAUDE.md with no such
paragraph. Watched red on `check:bogus` written into the paragraph. The paragraph now names
`check:claude` too and says which script checks it, where it claimed a check that did not exist.
The Packages list names `@assemblejs/mcp`. The identity law's two package.json sentences were held
by no gate before this (the verifier of this change read `identity-gate.sh` whole: it refused the
legacy strings and the publisher name, nothing about `author` or the organization's handle, which
is how twelve author lines passed every gate since B-02). Now they are: the gate's third rule
refuses `"author"` in any package.json but the root's, its fourth refuses the organization's
handle on any package.json line but the repository `"url"` and `"bugs"`, and its fixture carries
both so the self-test watches each rule fire. The twelve lines are gone; credit is the root
`package.json`; the handle stays on the `repository` and `bugs` urls provenance verifies against.
The Release section says when changesets start and that `next` is in pre mode, and CONTRIBUTING.md
and the pull request template, which demanded a changeset per src change, now say the same. The
gate script's self-test also holds its regex to the bare verbs and its reading to the one
paragraph, after a verifier showed two mutations it let through.

## 2026-10-05: guides for the other camps

Expected, from the README and the ledger's guides row: a guide for each camp a renderer serves.
The site had three, React, Vue and Svelte; the renderers for Preact, Solid and Lit and the
template package exist and are proved by `examples/frameworks`, `examples/shadow` and
`examples/templates`, so four more were owed, in the shape of the three.

Found and settled:

- **Four pages under `site/docs/`**: `preact.html`, `solid.html`, `lit.html` and
  `templates.html` (EJS, Handlebars, Nunjucks, Pug and Markdown), each with the three's header,
  `h2` sections, `dl`/`div.item`/`dt`/`dd` and generated footer. The templates page has no events
  section: a template view has no events of its own, and its `.client.ts` is handed them in its
  mount context. Every code block is a file in the tree, each matched verbatim by a scratch
  script against the repository and against what `add` writes: the counters of
  `examples/frameworks` (with the Preact counter's `label.tsx`), the boxes and sheets of
  `examples/shadow`, the views, a service, the sheet and the page of `examples/templates`, the
  view `add` writes for each renderer (`assembly-files.ts`), the `idle-label` fixture (the one
  Preact view in the tree that exports `mount`), the `badge` fixture's `.client.ts`, the
  `two-frameworks` service, and the four-language render of `render-template.test.ts`. The page
  policy block is the one the three carry: DESIGN 8's example as a local placement, with the
  placement `page-placement.test.ts` holds. The ledes say where everything is from, and name the
  conformance fixtures on the two pages that show one.
- **Every prose claim read at the source.** The peers: `preact ^11.0.0`, `solid-js ^1.9.15`,
  `lit ^3.3.3`, and none on the templates package, whose five engines are its own dependencies,
  each imported the first time its language renders (`load-compiler.ts`). The client entries:
  `useEvents` for Preact and Solid; Lit's exports only `hydrate` and `HYDRATION_SUPPORT`, its
  `AssemblyProps` carrying `events`, which the view binds to an element as a property
  (`lit-counter`). The props each renderer's `renderToMarkup` and `hydrate` pass, and the
  server's events they render with (`server-events.ts`). What a template sees (`load-*.ts`):
  `data` and `children`, EJS's only locals in strict mode, children as safe strings in
  Handlebars and Nunjucks and by the raw form in EJS and Pug, Markdown reading neither (B-17),
  and Pug leaving `'` unescaped (the package's README; probed against the installed Pug). A
  template view's browser half is a `.client.ts` default-exporting an object with `mount`
  (`generate-client-module.ts`, `lazy-renderer.ts`, `client-renderer.ts`, `mount-context.ts`),
  refused beside a framework view (`build-problems.ts`); without one the registry declares the
  assembly `none`, and with one writes no `mount` or `shadow`, so it mounts at load in the
  page's own tree (`generate-registry.ts`). The modes, and an unknown one read as `none`
  (`read-mount-mode.ts`); a `.ts` or `.tsx` view read whole for its exports (`view-script.ts`).
  Styles: any `.css` in the directory (`discover-assemblies.ts`), and a second sheet for a
  framework view's shadow root, none for a static view (`write-styles.ts`). The JSX runtime
  chosen per file (`jsx-source.ts`), the Solid compiler loaded from the project's own renderer
  (`load-solid-compiler.ts`), and Lit's hydration support imported first in the page's script
  (`generate-client-entry.ts`, `renderer-packages.ts`).
- **The first draft, read against the same sources, said more than they do in six places, each
  corrected:** Pug refuses an include when it compiles, so the page says "refused" and not "when
  it renders"; the package's own instance is Handlebars's alone; the Markdown view `add` writes
  reads no title; `check` reports a lone `cart.tsx`, not a component beside a named view; a lazy
  Solid component renders only once its module is loaded; the mount context carries the view
  as well.
- **What the tree does not have is said, not invented.** No Solid or Lit view exports `mount`,
  so those two pages state the modes without a block. The README's list also names a web
  component, which no renderer in the tree is, so no page claims one.
- **Declared and linked.** Four entries in `pages.json` after `docs/svelte.html` (`in_nav`
  false, `sep " &middot; "`), four items in the docs index's Guides section, footers written by
  `scripts/site-links.mjs`, which changes nothing on a second run. Watched red, each restored by
  the inverse edit: `check-site.mjs` on a link to `nowhere.html` typed into `preact.html`, and on
  `lit.html` moved aside while declared; `site-links.mjs --check` on the "Getting started" anchor
  removed from `solid.html`'s footer.

## 2026-10-05: two claims the six guides inherited, corrected at the source

Found by the reader who verified the last four guides, in all six and in DESIGN 9: "`none`
never mounts, and the assembly ships no JavaScript at all" is true of a static view and not of a
framework view, whose page still carries the runtime; `packages/core/src/client/start.ts` reads
the mode and returns before mounting, and nothing else. The sentence now says that on every
guide and in DESIGN 9. And the `definePage` block the guides show for local policy was in no
example, test or DESIGN section, so the ledes' "from the examples, the design document or the
tests" was not literal; DESIGN 8 now carries that exact block as the local form of the policy
example above it.

## 2026-10-05: three claims brought back to the code

From the resume block's list of what remains. `events.ts` said the runtime calls an `on` unsubscribe
"on unmount"; `start.ts` releases every subscription in `unmountAll`, when the page's assemblies
are unmounted together, and nothing unmounts one assembly alone, so the comment now says that.
`readBudgets` called a budget it could not read as a number "computed", true of `process.env.D`
and false of `Infinity`, `NaN` or a bare name, which `literalOf` also reads as undefined; the
message is now "not written as a number; write it as a whole number of bytes above zero", held
by the reader's tests and by `perf` at the command level, and watched red by reverting the
word. CLAUDE.md's entry for `@assemblejs/mcp` now names what its tools do: `create_project`,
`add_assembly`, `place_assembly`, `check`, `render_assembly`, `compose_page` and `explain`
(`create-mcp-server.ts`, `register-authoring-tools.ts`). No changeset: nothing is published.
The verifier found the same false word at the object level (`budgets: b`, a literal object
behind a name, is reported as "computed" because `readDefaultExport` follows names for the
default export only) and DESIGN 9 still saying `unmount` removes an assembly's subscriptions;
DESIGN 9 is corrected here, the object-level wording is a ledger row.
