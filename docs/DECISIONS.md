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

## 2026-10-05: CI breadth, ahead of Actions running

Expected, from the resume block: a conformance job and node 24. Found: `ci.yml` already runs
`pnpm check` on node 22 and 24 and the browser proof on 22; nothing ran the conformance
harness, which is kept out of `pnpm check` because it needs the network and minutes. Settled: a
`conformance` job on node 22, the same pinned checkout, pnpm and node actions as the other
jobs, `pnpm install --frozen-lockfile` then `pnpm conformance` (the harness builds and packs the
packages the fixtures install, core, cli, create and the renderers, itself). Proved here: `pnpm conformance` on this tree, every spec passed (contract
20, remote 19, rendering 69, trust 44 by the runner's own counts). Actions runs nothing on
this repository yet, so the job's first green is the owner's to see.

## 2026-10-05: the object-level budgets wording

The verifier of the "three claims" entry found the same false word one level up: `budgets: b`,
a literal object behind a name, and `budgets: Infinity` were both reported as "computed",
because `readDefaultExport` follows a name for the default export alone and hands `readBudgets`
undefined for either. The message is now "budgets is not written as an object of parts and
bytes; write it as one", true of both, held by `read-budgets.test.ts` and by `perf` at the
command level in `run-perf.test.ts`. Following the name one step is left undone: `readDeclared`
is handed a value, not the program, and a written object is what the design asks for.

## 2026-10-09: the first changeset, and 1.0.0-next.0

Expected, from the 2026-10-05 rulings: `next` in pre mode publishes `1.0.0-next.N`, and
changesets start after the first publish. Found: the two cannot both hold. The release run of
2026-10-05 on `f51f844` tried to publish `@assemblejs/core@1.0.0` and failed only because the
registry answered 404. With no changeset, `changeset version` writes nothing and `changeset
publish` ships whatever the manifests say, `1.0.0`, under the `next` tag. Pre mode changes the
version a changeset computes; it computes nothing without one. Read in the installed tool:
`incrementVersion` is `semver.inc(oldVersion, type)` plus `-<tag>.<n>`, so `1.0.0` with a patch
would be `1.0.1-next.0`, and `1.0.0-next.0` is reached from `0.0.0` with a major.

Ruled by the owner, 2026-10-09 (D1202 in the estate record): one changeset on `next` now; the
first publish is `1.0.0-next.0` under the `next` tag; `1.0.0` stays for `main` after the flip. This amends the 2026-10-05 note
that changesets start after the first publish and keeps his 2 September rulings: `next` is
`1.0.0-next.N`, `main` publishes once, the first publish of each package is by his hand and OIDC
after it.

Done here:

- One changeset naming every package as a major, with the summary that is each package's first
  changelog entry. The manifests were set to `0.0.0` for the one command that reads them,
  `pnpm changeset version`, which wrote `1.0.0-next.0` into all twelve, a `CHANGELOG.md` beside
  each, and filed the changeset under `.changeset/pre/`, where the tool keeps what the stable
  release reuses. Nothing else moved: `workspace:*` ranges and the private examples are as they
  were.
- The peer dependency on `@assemblejs/core` in the devtools and every renderer was `1.x`, which
  no prerelease satisfies; the tool pinned each to `1.0.0-next.0` and moves the pin with every
  prerelease, so one channel's packages version in lockstep. The range the stable `1.0.0`
  carries is settled when pre mode exits, at B-27b, not here.
- `CHANGELOG.md` is in no package's `files` list and the registry does not add it on its own
  (npm's always-included set is package.json, README, LICENSE, main and bin), so the tarballs are
  unchanged; the changelog is the repository's and the GitHub release body's.
- Two places wrote the version by hand: the `^1.0.0` the command line writes into a new
  project's manifest, which resolves no prerelease, and the `1.0.0` the agent surface announces.
  Both read their package's version from now on; a ledger row, landed next.
- CLAUDE.md, CONTRIBUTING.md and the pull request template say the rule as it now is.
- Three ledger rows were stale and are corrected with their evidence: Actions runs (every
  workflow has run since 2026-10-05), `RELEASES_PAT` exists (2026-09-11), the OIDC role exists
  (2026-10-07).

## 2026-10-09: tests build what they read, and the release gate

Found on this machine: the Stop hook's test gate ran the suites against `dist/` folders built
on 2026-09-10, and one core test went red for a build that predated the code it was testing
(`exit-on-unhandled.ts` landed 2026-10-03; the old build let Node's own handler print its
trailer where the test expected the server's log line). CI never saw it because `pnpm check`
builds before it tests. The owner's rule, asked as a question: tests rebuild before they use a
build.

Settled:

- **Every suite builds what it reads.** `scripts/build-when-stale.mjs` is a second vitest
  global setup beside `test-temp-root.mjs`, in every package's config: before the first test,
  each workspace package whose `dist/` is missing or older than its `src/`, `package.json` or
  `tsup.config.ts` is built, all stale ones in one `pnpm --filter ... build` so dependencies
  build first. A fresh build costs a stat per file and no build. Watched red first: the natural
  red above; then core's source touched newer than its build, the setup building core, the
  suite green.
- **The Vue config declared `test` twice**, so its second value replaced the first and the Vue
  suite never ran the temporary-root setup; no gate catches a duplicate key in a config file.
  One `test` object now carries both. A duplicate-key lint for the config files is a ledger
  row.
- **Lint ignores `.claude/worktrees/`.** A lane's worktree is a second checkout; `eslint .`
  linted it through a second tsconfig and went red on import order it had not changed. The
  resume block's warning is replaced by the ignore.
- **The release workflow asks the registry first.** A `registry` job runs `npm view
@assemblejs/core version`; on a 404 the publish job is skipped, on an answer it runs, on any
  other failure the run stops. The first publish is the owner's, by hand (his ruling of
  2 September, kept on 2026-10-09), so until it happens a push to `next` fires `ci` and this
  one request and nothing else; the 404 that was a red run on every push since 2026-10-05 is
  the expected answer now. The `needs` context is available in a job's `if` (GitHub's context
  availability table, read 2026-10-09).

## 2026-10-09: AI first

The owner's direction, given in the seat's own session on 2026-10-09 and answered as a plan
question the same evening.

- **The framework is AI first.** His words, cleaned: great tooling for agents, so they understand
  it; other frameworks did not have this in mind from the beginning; the best practices and
  components built in, so what an agent builds does not look machine-made; the frontend
  framework of the future. The agent surface is a product surface, not an add-on, and the
  standard of what an agent produces is the framework's to hold.
- **Four surfaces ship in 1.0**, all four chosen when offered as a set (D1207 in the estate
  record), under his standing rule that everything the mission needs is in 1.0: agent instructions in every new project (`new`
  writes `AGENTS.md` and the MCP registration, `check` holds them current); `llms.txt` and
  `llms-full.txt` on the site, generated from the same pages as the docs; MCP prompts for the
  common tasks, listed by the protocol; built-in components and best practices, a token-based
  starter design system with accessible components and `check` rules that refuse what reads as
  machine-made, its shape settled by a design memo and his answer before code. PLAN 4.1 carries
  them as A-01 to A-04 with their proofs; they follow the subassembly rung and precede B-27b.
- **How it is tested in full: the joint session.** He proposed building something together, he
  on the command line and the agent beside him on the MCP server, the same application, so both
  roads are walked at once. Settled: that session is the stranger test B-27b's row requires, run
  from packed tarballs after the subassembly rung and A-01 to A-03, and every snag is a ledger
  row before `1.0.0`.
- **The hero line he wants** for the landing page, the first microfrontend framework for
  AI-enabled development, is a claim and goes into `site/LANDING.md`'s table paired with what
  backs it: the agent surface, the instructions `new` writes and the prompts, all shipped. It
  names no competitor, which the standing rule still forbids.
- **Tests build what they read**, his rule of the same evening, is the entry above.

## 2026-10-09: two standing rules carried in from the estate record

Both were ruled on 2026-09-01 with the product's first plan and recorded only in the estate's
records; an audit of 2026-09-11 asked for them here, where the code is.

- **No paid model runs on any event an outsider can trigger.** The agent surface carries no
  model and no credential (DESIGN 13.2); `ci`, the browser proof, conformance, `release` and the
  Scorecard call none; a pull request from a fork runs the same gates with no secret. A workflow
  that would call a model on a push or a pull request is refused in review, whatever it costs.
- **The branch-to-channel map.** `next` publishes `1.0.0-next.N` under the `next` dist-tag and
  its site to `/assemblejs/next/`; `main` publishes `1.0.0` once, after the flip, and its site to
  `/assemblejs/`. The Release section of CLAUDE.md, `release.yml` and `deploy-site.yml` each say
  their half of it.

## 2026-10-09: the version is read from the package

Expected: with every package at `1.0.0-next.0`, a project the command line generates installs
from the next channel, and the agent surface announces the version it was published at.

Found: the version was typed twice more. `project-files.ts` wrote `^1.0.0` for
`@assemblejs/core` and `@assemblejs/cli` into a new project's manifest, and `^1.0.0` matches no
prerelease, so a project generated by `1.0.0-next.0` could not install. `create-mcp-server.ts`
announced `version: "1.0.0"` in the initialize result.

Settled:

- **One function, `ownVersion(moduleUrl)`, in the command line's `commands/`**, beside the file
  that first needed it. The caller passes its `import.meta.url`; the manifest is found by walking
  up from there, so the answer is the same from `src/<dir>/` and from the flat `dist/` tsup
  writes, and the same function answers for whichever package the caller lives in. The agent
  surface imports it from `@assemblejs/cli`, as it imports the command line's other logic. A
  first draft defined the function twice, once per package, byte for byte; the one-definition
  law and the duplication gate are why there is one.
- **A generated project depends on `^<the command line's version>`**: `^1.0.0-next.0` today,
  which matches later `1.0.0-next.N` and `1.0.0`.
- **Watched red first**: the project manifest against the literal (`expected '^1.0.0' to be
'^1.0.0-next.0'`), the initialize result against the literal, the built `dist/` of both
  packages through a child process (the agent surface driven by a real client over an in-memory
  transport); and, under a mutation that walked from the function's own module instead of the
  caller's, a module under the workspace root answered the command line's version where the
  root's `0.0.0` was expected, and a module no package owns was not refused. Every published
  package shares one version, so the root is the one manifest that tells the two walks apart.
- The `^1.0.0` strings in the deploy tests are inputs to the deploy checks, not any package's
  version, and stay. The test clients' own `version: "1.0.0"` names the test client, not the
  server.

## 2026-10-09: the subassembly rung, decided

From the two reader memos (`docs/studies/subassembly/`, written against 1210023, second-read
there, and held to the tree today: the files they rest on have not changed), synthesised in
`docs/studies/subassembly/synthesis.md`, which carries the reasons (all three deleted at S-09,
once DESIGN carried their result; in the history at `0ac9f53`). The decisions, so they
outlive the studies:

- **Render once; the directive is the seam.** A view renders with no children; a template view
  wrote `<assembly name="x">`, a framework view's `Slot` emitted it; `renderLocal` composes the
  view's rendered markup with the local transport and each child's envelope replaces its
  directive. The page placed the parent and never learns of the children.
- **The Slot renders the directive on both sides.** The browser never reads the DOM to learn a
  child. Reader-core's sketch of collecting each slot's `innerHTML` is rejected on the renderer
  memo's findings in the frameworks' own code: `innerHTML` is not the server's bytes, no
  framework needs the strings to match the DOM, and it leaves the one real hazard. React's Slot
  carries `suppressHydrationWarning` and an identity-stable `{ __html }` per name, because React
  compares that object by identity on re-render and would rewrite the slot and destroy the live
  child. A Lit view may hold a Lit child only when the child declares `shadow: true`; the
  detach-and-reattach mount is the recorded follow-up.
- **`children` leaves the interface**: `MarkupInput`, `RenderInput`, every renderer's props and
  hydrate, the template engines' locals, the Slots. Nothing fills it under this mechanism and the
  Style forbids a path kept for compatibility. `Slot({ name, view? })`; `slot(name, view?)` for
  Svelte and Lit returns the directive string. A renderer-interface change, carried by the
  rung's changeset.
- **Children are local, with no plan**: default deadline, no fallback, never required, never
  deferred, no cache of their own. A remote child would need a view-level policy; not in this
  rung, asked only if an application needs it.
- **One placement per name per view**, refused by `renderLocal`: the key is the name.
- **The arrived depth, the path extended by the parent's own identity, both required by type**
  on the nested call. The server's `maxDepth` is the one cap, for the page's compose too.
- **Two servers**: a cycle cannot cross servers with local children; the ruling's "held across
  two servers" is held by the contract, a spec sending B the headers an upstream composer sends
  and reading the nested failure's id in B's log. Depth by header or by a real chain, never by a
  cap, which no fixture can set.
- **Failures**: `renderLocal` returns `{ html, diagnostics }`; the tree reaches the page's log;
  a parent whose subtree carries a failure is not cached, decided from the markup so both
  transports agree.
- **Hoisting over the tree**; a shadow parent links its non-shadow children's sheets in its root;
  the transport learns nested manifests once per version after the segment shape; the manifest
  says nothing about children.
- **The browser runtime** walks shadow roots; the deferred fill sends depth 1; mount order needs
  no rule under this mechanism.
- **The finder skips raw-text elements** as it skips comments; a view that placed a child reads
  its own envelope with the fragment scanner, so a child inside `<p>` fails the parent alike on
  both transports.
- **A signal** threads through compose and settle; breadth is unbounded and recorded so.
- **Services shape a child's request through the view it chooses** (`view` from data); a child's
  own query is a later surface, not written. Markdown places nothing.
- **Boot and `check`** read static sources' directives and framework views' `Slot` names; Pug is
  checked at render.
- Nine bites, S-01 to S-09, in PLAN 4.2 and the ledger; the studies are deleted at S-09 once
  DESIGN carries their result.

## 2026-10-09: S-02, a view's children composed, and three things the plan had wrong

Expected, from the entry above and PLAN 4.2: `renderLocal` composes the view's markup, refuses a
name placed twice, and reads its own envelope with the fragment scanner when it placed a child;
the new cases land in the tests of `create-server`, `register-pages` and `settle-placement`.

Found, reading the code the plan rested on rather than the memos about it:

- **A page places one name twice, so a view may.** The repository's own page test places `hello`
  twice and expects two envelopes, and the owner's ruling says a view places a child "as a page
  places one". The refusal came from reader-core, where `children` was a record with the name
  as its key; under the mechanism chosen, a view reads no child by key, so nothing is left for
  two placements of one name to collide on. Each directive is replaced by its own envelope with
  its own id. No refusal is written. This supersedes "one placement per name per view" above.
- **The fragment scanner is how another server's markup is read, and it is not run on this
  server's own.** DESIGN 5 opens "the composer treats a remote assembly as a third party": the
  scanner refuses what it cannot follow exactly, which is right for a stranger's markup and
  wrong for an author's. Read in `scan-fragment.ts` and `start-tag-refusal.ts`, it refuses an
  `iframe` or a `noscript`, and markup written with implied end tags (`<li>one<li>two`, an
  unclosed `<p>`): valid HTML a template author writes, which would fail a view only once it
  placed a child. Considered and not taken: keeping the scan and documenting its refusals. The
  hazard it was meant to catch, a child whose block content sits inside an open `<p>` and so is
  moved out of its envelope by the parser, is real, exists for a page's placements today
  unchecked, and is neither new nor nested: it is a ledger row of its own, a placement-context
  check for pages and views alike. This supersedes "a view that placed a child reads its own
  envelope with the fragment scanner" above.
- **A file's tests live in its mirror, and three mirrors were full.** Lint holds every file to
  300 lines, tests included; the mirrors of `create-server`, `register-pages` and
  `settle-placement` stood at 299, 300 and 293. So the behaviour landed where it has a test of its
  own: `registerAssemblies` (the contract's three endpoints, out of `create-server`),
  `logFallbacks`, `refuseBeforeDispatch` (a refactor commit first, every existing test untouched
  and green), then `holdsFailedEnvelope`, with the cache's refusal inside `placementCache`, where
  every other rule about what the cache may hold already is.

Settled, as built:

- `renderLocal(assembly, view, input)` renders the view once, composes its markup with no
  policy, the arrived depth and the path extended by the assembly's own identity, and answers
  `{ html, diagnostics }`. `LocalRenderInput` requires depth and path by type.
- `localFetch(assemblies, log, limits)` hands itself to each render, carries the children's
  account as `nested`, and passes the request's signal. `settlePlacement` hangs `nested` under
  the diagnostic as `children`.
- One cap: `maxDepth` is the depth of the limits the content endpoint reads headers against,
  the page's composer and every view's composer. A server with `maxDepth: 2` refuses the third
  level from its own composer; at zero the page's composer refuses the page's own placement.
- The content endpoint composes from the headers it arrived with, so a parent on another server
  holds the cap and the cycle across the hop; a nested fallback is logged by the server that
  composed it (`assembly "hello" inside "shell" was answered by the fallback after cycle`).
- A placement's answer holding a failed envelope is never written to the cache, decided from the
  markup, which is what both transports hand back.
- A composition takes a signal. A placement not yet dispatched when it aborts is refused as a
  timeout, after the refusals the design makes, so a reason never depends on timing; a transport
  already called hears it through `AbortSignal.any`, which Node documents as "a new AbortSignal
  which will be aborted if any of the provided signals are aborted" (added in 20.3). A service
  already running is not cancelled.
- A malformed directive in a view's markup fails that view's render, on both transports alike.

Watched red, each restored by the inverse edit: recorded with the commit.

**Verification.** CLAUDE.md requires a separate agent to verify every rung and calls a
self-verified rung unverified. The owner ruled in this seat on 2026-10-09, after that law was
written, that the seat does the work itself with no sub tasks. This bite is therefore
self-verified: its tests watched red under the mutations named in the commit, and the gates' own
output. Whether a verifier is exempt from his ruling is his to say; it is on his morning list.

## 2026-10-09: S-03 reads the markup it serves

Expected, from PLAN 4.2 and the synthesis: `register-pages` hoists css and js by walking the
diagnostic tree S-02 built, and `opensRuntime` and the deferral rule count the children boot can
see in static sources.

Found:

- **A cache hit has no tree.** `settlePlacement` answers a fresh cache entry as `{ html,
diagnostic }` with the diagnostic it mints then: the cache holds html, never an account. A
  parent placed with a lifetime would link its children's sheets on the first request and lose
  them on every one after. The diagnostic tree says how a page was composed; it is not a record
  of what the page holds.
- **The markup is.** Every assembly on a page is in an envelope that names it, whichever rung
  answered and however deep it sits. So a page links the browser files of every local envelope
  in the html it is about to send, read from that html: `localAssets(html, assemblies)`. An
  envelope stamped with another server's origin, and everything inside it, is that server's
  (S-05 learns those from its manifests, read the same way from its answer). An envelope inside
  a shadow parent's root gets its sheet from that root, not from the head.
- **Boot sees definitions, not sources.** `pageProblems` is handed markup functions; a template
  view's cannot be called without its services' data. Whether a page carries a runtime when its
  only browser half is a view's child, and what a deferred parent's children need linked before
  the browser fills it, are knowable only from what the command line reads off static sources.
  That reader lands at S-07, so the seam does too: the generated registry writes each view's
  static placements onto the definition, and boot reads them. Until then a page whose stream or
  deferral is opened only by a view's child is refused at boot as before; no shipped example or
  fixture is one.

Also found, and rowed: the agent surface renders and composes by its own path
(`render-assembly.ts` builds the envelope itself, `compose-page.ts` has its own transport), so an
agent composing a parent is shown the child's directive rather than the child; it moves onto
core's transport at S-07. And the content endpoint is the one caller that gives `renderLocal` no
signal.

## 2026-10-09: S-03 as built, and what extracting the finder's spans found

Built as the entry above says: `localAssets(html, assemblies)` reads the envelopes in served
markup; `pageAssets` uses it for this server's assemblies and the manifests for another server's;
a shadow parent's root links its own sheet and those of the children placed inside it, each once.
This server's files are linked first, in the order they stand on the page, then another server's
in the order the page placed them.

Found while moving the finder's comment and raw-text patterns into one shared reader
(`inertSpans`): the two patterns were matched independently over the whole template. A `<script`
written inside a comment therefore opened a stretch that ran to the next real `</script>`, and
every directive between was passed over without a word, the silent drop the finder exists to
prevent. That was S-01's own code, a day old and never pushed. The reader is one pass now, each
stretch consumed whole before the next is looked for; a comment whose closing dashes are its
opening ones (`<!-->`, `<!--->`) ends where the parser ends it; one never closed runs to the end.
Each is held by a test watched red.

## 2026-10-10: S-05, another server's children are linked by the url that was asked

Expected, from the synthesis: the transport learns each nested envelope's manifest once per
version, and `assets(url)` answers the union.

Considered and not taken: linking another server's assemblies by the envelopes in the served
markup, as this server's are. A remote's envelope names are its own: nothing in the contract
makes the name an answer carries equal the name in the url it was asked at, and the transport's
own fixtures answer one name at several urls. The page asked for a url, so the page links what
that url's answers have needed.

Settled:

- `markRemote` names each assembly the answer holds inside it, once, by its content endpoint on
  the remote's origin. An envelope marked failed is a fallback and needs no files; a name or view
  that is not a segment is no endpoint the contract describes and is left out, decided by the one
  parser of content urls rather than by a second check.
- `learnedManifests` reads each nested assembly's manifest by the same once-per-version rule and
  keeps, for the url asked, every child that version's answers have held. A superset on purpose:
  two requests' answers can hold different children, and an answer served again from the page's
  cache holds one of them with nothing to say which; a stylesheet too many is one request, a
  stylesheet too few is an unstyled child. A new version starts the account again.
- A child's manifest that cannot be read is a logged warning and a retry, and never holds back
  the files that were read.
- A failed subtree being kept out of the cache was built at S-02, from the markup, so it already
  holds for another server's answer.

## 2026-10-09: S-06, a slot writes the directive, and what the plan had wrong

Expected, from the synthesis: `children` leaves the interface; a `Slot` writes the directive on
both sides; Svelte and Lit get a `slot()` that answers the string, exported from the package
root; a Lit view holding a Lit child is a documented refusal, held by watching Lit's own
hydration throw; the `nested` page has two parents; the browser proof runs on GitHub's runners.

Found:

- Lit refuses less than the plan relied on. Its hydration throws only when a child's template
  binds an attribute, and the message names conditional rendering. A Lit child that binds
  nothing is taken for the parent's own without a word, and its nodes are removed the next time
  the parent view renders (probed in the browser project: `<p>plain</p>` between one part's
  markers, hydrated, rendered again, gone). A refusal that depends on what the child happens to
  bind is not a refusal.
- The package root is the server half, and a browser bundle that imported a slot from it would
  load the server renderer. A slot is exported where `Slot` and `useEvents` already are, the
  `/client` entry, so a server loads Lit's browser half, which installs Lit's support for
  hydration; that support patches Lit's element base when the base loads after it. Read in
  `@lit-labs/ssr` 4.1.0, `lib/lit-element-renderer.js`: the server renderer assigns its own
  `createRenderRoot` after its imports, calls `ReactiveElement.prototype.update` directly, and
  calls an element's `connectedCallback` only when asked. One patch stays in force on a server,
  seen in a probe: an element's `observedAttributes` gains `defer-hydration`. It changes nothing
  the server renders. Held by a test that renders one element in two processes, the browser
  half loaded first and loaded last, and compares the markup.
- The study's page had no Svelte parent, and Svelte's hydration cannot run in a DOM shim
  (`renderer-svelte/test/client/hydrate.test.ts` says why). Nothing would have proved one.
- Vue does not render a slot again while its name and view stand: a parent's render skips a
  child component whose props did not change. "Writes something else on every render" cannot be
  watched red there. What is watched is the slot written as an element of Vue's own in place of
  markup, which Vue replaces when it hydrates.
- The browser proof runs on this machine. The suite takes the estate's sealed launcher as its
  browser binary (`ASSEMBLEJS_CHROMIUM`), one worker, and Playwright's pipe passes through it. A
  `TMPDIR` as long as a session's scratch directory aborts the browser at launch on a socket
  path longer than the system allows; the default runs.

Settled:

- `placementDirective(name, view?)`, in core's client entry, is the one definition of what a
  slot writes. It is the one markup a framework view writes unescaped, so it is built from
  segments alone: a name or a view that is not one throws and never becomes markup.
- `Slot({ name, view? })` in React, Preact, Vue and Solid writes `<div data-assembly-slot>`
  holding the directive, on both sides. React's says its difference is meant
  (`suppressHydrationWarning`) and keeps its `{ __html }` object, one per mounted slot, in
  its own state, because React compares that object by identity when a parent renders again.
  Not one store for the page, keyed by directive: a server renders too, and a view named from a
  request would grow it without end. Not a memo: React's reference says a memo may be thrown
  away and names state for a value that must be kept (react.dev, reference/react/useMemo,
  caveats, read 2026-10-09).
- `slot(name, view?)` in Svelte answers the string, written with `{@html}`. In Lit it answers
  the `unsafeHTML` directive itself, so a view writes `${slot("cart")}` and imports one thing.
- The Lit refusal is this package's own. `litAssemblyInTree` answers the innermost envelope
  around any Lit marker in the view's own tree, and `hydrate` throws before Lit reads a marker,
  naming both assemblies and the fix (`export const shadow = true` in the child's view). A
  shadow root, the child's own or one between the two, hides the markers and is allowed. The
  rule holds at any depth: a Lit assembly under a React one under a Lit view is the same tree.
- `children` is gone from `MarkupInput`, `RenderInput`, every `AssemblyProps`, every hydrate
  and server render, and the four engines' locals. EJS's strict locals are `data` alone.
- The `nested` page of `examples/frameworks`: one plain html assembly places a shell per
  framework and each shell places a counter written in another, three deep, each counter once.
- The agent rule `children-arrive-as-strings` is replaced by
  `a-view-places-a-child-with-the-directive`.

Considered and not taken: detaching each child before Lit hydrates and putting it back after,
so a Lit view could hold a Lit child in one tree. It moves live nodes: a custom element
disconnects and connects again, and focus and a running transition are lost. The refusal says
what to do and costs nothing. It stays the follow-up the synthesis named.

Not in this bite, and where it is: DESIGN 7 and the guides under `site/docs` still describe
`children` (S-09); `check` does not yet refuse a Lit assembly under a Lit view or a slot whose
name it cannot read, and a deferred parent's children are not yet linked (S-07).

Watched red, each mutation alone, the file put back from its own bytes, and the hash of every
changed file the same after the run as before it. A run that broke before a spec failed is not
a red: two mutations first broke the declaration build and were rewritten to typecheck.

- core, a name or a view that is not a segment is not refused: `placement-directive.test.ts`,
  and React's `slot.test.tsx` where the slot refuses it.
- core, the view left out of the directive: the same two files, two specs each.
- React, a fresh object for the slot on every render: `hydrate.test.tsx`, the child gone after
  the parent's second render. In the browser, one of seventeen: "a react assembly holds a
  svelte one".
- React, a slot keeps its first directive when it is given another name: `slot.test.tsx`.
- React, `suppressHydrationWarning` removed: `hydrate.test.tsx`, one error from React's
  development build.
- React, the slot writes nothing: `slot.test.tsx`. In the browser: twelve envelopes served
  where thirteen are expected, the react pair, and the five pairs that wait to hear the Svelte
  counter.
- Preact, the slot writes something else on every render: `hydrate.test.tsx`, the child gone.
- Preact, Vue, Solid, Svelte and Lit, the slot writes nothing: each one's `slot.test`, and its
  server render where a fixture holds the markup (Solid, Svelte, Lit).
- Vue, the directive written as an element of Vue's own: `hydrate.test.ts`, the child gone
  when Vue hydrates.
- Lit, the refusal removed from `hydrate`: Lit's own message for the child that binds an
  attribute, and no throw at all for the child that binds nothing.
- Lit, only a marker that binds an attribute counts: the specs for the child that binds none.
- Lit, any marker counts, the view's own included: nine specs across three files.
- Markdown, `html: true`: both specs of `load-markdown.test.ts`.

Green only, and why: the four engines' "the directive survives compile" specs hold the
engines' behaviour, which no line of this package decides; the warning suppression in a real
browser, because the example bundles React's production build, which reports nothing; the
Svelte, Preact, Vue, Solid and Lit pairs in the browser, whose failure is watched in the unit
suites, except Svelte's, which only a browser can run.

## 2026-10-09: the landing page is on staging

Expected: the first deploy of `/assemblejs/next/` waits on live AWS state. `deploy-site` run
38016226372 had failed at the credentials step, because the role trusted the old form of
GitHub's OIDC subject and this repository is issued the immutable one.

Found: the lead changed the role's trust to the immutable form for `refs/heads/next` and
`refs/heads/main` once the owner had signed in to AWS (2026-10-09 23:47 EDT, the estate's
record), and asked for the dispatch. `deploy-site` run 38021878568, dispatched on `next` at
`03a5a1f`, succeeded at every step. `https://d3kq4cwuz8axg8.cloudfront.net/assemblejs/next/`
answers 200 with the title "AssembleJS"; the body is byte for byte `site/index.html` at that
commit, and the six files it links answer 200. Read from the run's own record and from the
page, after the run ended.

Settled:

- A push to `next` that touches `site/**` deploys to `/assemblejs/next/`. Its `deploy-site`
  run is read to its end like `ci` and `release`, and the page it changed is fetched.
- `/assemblejs/` deploys from `main`, which has no `site/` and no deploy workflow until `next`
  is promoted. That is the release line and the owner's to call.
- Nothing is synced or invalidated by hand. The workflow is the one way the bucket changes.

## 2026-10-10: S-07, what a view places is known before it renders

Expected, from the plan: `check` reads directives and slot names; the registry writes each
view's static placements for boot; the agent surface uses core's transport.

Found:

- Two refusals at boot were wrong, and one page could never have worked. A page whose only
  placement is a plain html parent with framework children was refused for deferring that
  parent, and for naming a stream, on the ground that nothing on it had a browser half
  (`placementProblems`, `opensRuntime`: a page's own placements were all they read). Let
  through, the same page would have been served with the placeholder and no runtime, because a
  placeholder names only the parent, and nothing would have filled it.
- Boot cannot know a renderer by name: nothing in core names a framework. The rule about Lit
  is `check`'s, which reads renderers from file names, and the browser half's own at mount.
- A computed view is legitimate, a computed name is not. A service shapes which view of a
  child a parent shows (the synthesis, section 3); nothing decided before a request can read a
  name that is data, and a slot whose name changes in the browser writes over its child.
- For a Svelte or a Vue component the slot is written in markup, not in a module `check`
  already parses, and `check` runs without the project's compilers. They are read as text.
- A template's directive can be entangled with the engine's own syntax. Read with everything
  the engine writes replaced by a marker, such a source is no longer a directive the finder
  reads; that is not a finding, since the render may well place it.

Settled:

- `AssemblyView.placements`, each a `ViewPlacement`: a name, and a view only where the source
  writes one. A placement with no view stands for any view its assembly has.
- One walk, `placedBeneath`, over what views are known to place, each name and view once. It
  serves the runtime rule (`opensRuntime` counts what is beneath a placement), the loop check,
  the deferred link and `check`'s rule about Lit.
- `viewPlacementProblems`, called by boot and by `check`: a name with no assembly, a view the
  assembly lacks, a view that places itself or leads back to itself. Only written views are
  followed when looking for a way back, so nothing is refused on a guess.
- `localAssets` links, for a deferred placement, the files of everything its view is known to
  place, at any depth, a shadow root hiding sheets as it does in served markup.
- `check` reads each kind of view by what it is (`readViewPlacements`): a plain html view as a
  page's template; EJS, Handlebars and Nunjucks past what the engine writes; a module by its
  syntax tree, following the name it imports `Slot` or `slot` under from a renderer's browser
  entry; Svelte and Vue as text. Pug is left to the render and Markdown places nothing.
- Three rules of `check`'s own, each explained by the agent surface:
  `a-placement-is-named-where-it-is-written`, `an-assembly-is-never-its-own-ancestor`,
  `lit-holds-lit-behind-a-shadow-root`. The last holds at any depth and stops at a shadow root.
- The agent surface declares the project's assemblies as a server would (`projectAssemblies`)
  and renders and composes through `localFetch`. A view that needs a build throws its reason,
  so a child that is one falls back as any failed render does and the reason is told.
  `RenderedAssembly.children` is the account of what a view placed.
- `place_assembly` takes `in`. A view that holds the directive as markup is written into; any
  other is its author's source, and the answer is the line to write and its import.
- The example's `nested-later` page defers the plain html parent of twelve assemblies.

The agent surface's tarball budget is raised from 21000 bytes to 25000 (it packs to 23134):
three rules with their reasons, the two ways a fallback is told, and placing in a view. No
other package crossed its budget.

Not read: a slot reached through a namespace import; a Vue slot written in kebab case; a slot
in a module the view reaches by a package's name; a Pug view. A Pug view is written as unread
and its placements are the render's. For the other three the registry says less than the view
places, and says it as known: a deferred parent's child placed that way arrives without its
files linked ahead, and `check`'s rule about Lit does not see it. Boot refuses nothing wrongly
for it. The build writes what it read and refuses nothing: boot refuses, and `check` says
where.

Watched red, each mutation alone, by the harness S-06 describes: ten in core, thirteen in the
command line, eight in the agent surface. In the browser, with the deferred link removed, one
of eighteen: "a deferred assembly arrives with every assembly its view places".

## 2026-10-10: after S-07, a view is read with its components, and S-08's fixture changes

Found, by a reader of S-07 with no stake in it:

- A view split into components was read from its own file alone. A slot written in a
  component beside the view (`preact-counter/label.tsx` is such a component) was read as
  nothing, and written into the registry as nothing.
- The `nested` conformance fixture the plan describes cannot boot. It holds "a self-placing
  view", and since S-07 a view whose source places itself is refused before anything listens,
  and every other assertion of that fixture would go down with it.

Settled:

- `viewModules` follows a framework view's imports by relative path, to any depth, and
  `viewFindings` reads every module it reaches. What a view places is what its author wrote in
  the view or in a component it is split into.
- S-08 holds the two refusals apart. Read from the source: a fixture of its own whose `check`
  exits 1 naming `an-assembly-is-never-its-own-ancestor`, and whose server refuses to start
  with the same sentence. At render, where no source says it: the headers an upstream composer
  sends (`assembly-path` naming the child), and a Pug view that places itself, which nothing
  reads before it renders, held to one nested `cycle` envelope.

Watched red, each alone: a framework view read from its own file; only the view's own imports
followed; a `.js` import not taken for the TypeScript behind it.

## 2026-10-10: S-08, an assembly inside an assembly, held from the outside

Expected, from the plan: a `nested` fixture and a two-server nested spec.

Decided otherwise: the nested cases live in the `rendering` fixture, not in a fixture of their
own. That fixture already installs every renderer from its tarball; a second project of the
same seven packages would double the longest install in the run and prove nothing the first
does not. The two-server cases live in `remote`, as planned.

Held, over HTTP, against projects installed from the packed tarballs:

- A parent in every kind of view (plain html, EJS, Handlebars, Nunjucks, Pug, React, Preact,
  Solid, Svelte, Vue, Lit, and a React parent in a shadow root) holds the child its view
  places, written in another kind, inside its own envelope; its content endpoint answers it
  composed.
- A service shapes which view of its child a parent places (the EJS parent writes the view
  from its data).
- A shadow parent links its child's stylesheet inside its own root, and the page does not.
- A chain renders eight deep, and the ninth is refused before dispatch with a logged id.
- A Pug view that places itself, which nothing reads before it renders, holds one refusal.
- The headers a composer sends hold a child to its ancestors and to the cap.
- A deferred plain html parent is served empty with its child's runtime linked ahead, and the
  answer that fills it holds the child.
- A view whose source places itself: `check` exits 1 naming the rule, the build writes what it
  read, and the server refuses to start. Run in a copy of the project, so the server under
  test is left as it is.
- Across two servers: a parent from the producer arrives with the producer's child inside it,
  both marked with the producer's origin; the consumer's page links the child's stylesheet,
  which it never asked for by name; the producer refuses its own child by the ancestors and
  the depth it is sent, with the id in its own log.

`treeOf` in `specs/http.mjs` reads a page's envelopes as a tree; `envelopesOf` stops at the
first closing tag and cannot see what stands inside an envelope.

Watched red, each mutation alone around a run of the fixture it touches: a child's ancestors
without its parent (the self-placing view); children composed at depth zero (the chain and the
headers); the deferred link removed; boot not holding what a view places (the server started);
a nested manifest not learned (the two-server stylesheet); a shadow parent not linking in its
root. Each turned red the spec named and no other.

## 2026-10-10: S-09, DESIGN says what was built, and the studies go

Expected, from the plan: DESIGN 2.4, 3.4, 7, 8 and 10 say the mechanism; every guide shows a
child; the studies are deleted once DESIGN carries their result.

Settled:

- DESIGN 2.4 (the envelopes of a page are a tree), 3.4 (an assembly composes its own view's
  placements at the depth it arrived with, itself among the ancestors; a child is local and
  has no policy), 3.5 (a deferred assembly's children are linked ahead), 7 (a view places a
  child with the directive and is never handed one; a placement's name is written in place; the
  rule about Lit; `children` gone from `RenderInput`), 8 (a service shapes which view of a
  child its parent places), 10 (what a page links, and a shadow parent's root), 13 (the rules
  line and the three tools), and 14, items 16 to 19: the reversal of "children arrive as
  strings" and the three decisions that came with it.
- The seven guides under `site/docs` name one prop where they named two, show an assembly
  placed inside the one being written, in that framework's own form, and no longer mention
  `children`. The Lit guide says what a Lit view may hold and the line that fixes it.
- The two reader memos and their synthesis are deleted. What they found in passing and nobody
  had rowed is on the ledger now: a page's query reaching this server's services and not
  another server's, and a project having no way to set the depth cap. CLAUDE.md's line on what
  core holds is corrected: core holds no renderer.

Held by the site's own gates (every page declared, linked and readable), and by the specs each
amended sentence rests on, read one against the other:

- 2.4, a tree of envelopes, a nested one marked with its server's origin, and the order the
  runtime takes them in: `conformance/specs/rendering/nested.spec.mjs`,
  `conformance/specs/remote/nested.spec.mjs`, `core/test/client/start.test.ts`.
- 3.4, a child one level deeper with its parent among its ancestors, asked with its parent's
  params and query, and an empty envelope for one that is refused:
  `core/test/server/render-local.test.ts`; a failed subtree kept out of the cache:
  `core/test/compose/holds-failed-envelope.test.ts`.
- 3.5, a deferred assembly's children linked ahead: `core/test/server/local-assets.test.ts`,
  `core/test/server/page-assets.test.ts`, the browser proof's `nested-later` page.
- 7, the slot, the name written in place, and the rule about Lit: each renderer's
  `test/client/slot.test` and `hydrate.test`, `core/test/server/view-placement-problems.test.ts`
  and `boot-problems.test.ts`, the command line's `test/check/`, and
  `renderer-lit/test/client/lit-assembly-in-tree.test.ts`.
- 8, a service shaping which view of a child is placed: the EJS parent in
  `conformance/specs/rendering/nested.spec.mjs`.
- 10, what a page links and what a shadow parent links in its root:
  `core/test/server/local-assets.test.ts`, `render-local.test.ts`,
  `core/test/remote/learned-manifests.test.ts`.
- 13, the three tools: the agent surface's `test/server/create-mcp-server.test.ts` and
  `test/author/place-in-view.test.ts`.

Two sentences had no spec of their own and got one in this commit, each watched red: a child
asked with its parent's query, and the empty envelope of a refused child. The reading is the
seat's own. The plan asked for a reader with no stake; the owner's ruling against subagents
leaves that to him, and it is on the morning list.

## 2026-10-10: A-01, a new project is written for the agents that will work in it

Expected, from the plan (PLAN 4.1): `new` writes an `AGENTS.md` carrying the framework's rules
and the MCP registration, `.mcp.json` and the editor equivalents, and `check` holds it current;
proved from the tarballs by an agent-shaped test that reads the project through nothing but the
files `new` wrote and the MCP server.

What each client documents (read 2026-10-10, each claim from the page named):

- Claude Code, `code.claude.com/docs/en/mcp`. A project's servers are in `.mcp.json` at its
  root, under `mcpServers`. An entry with no `type` is read as stdio, and `"type": "stdio"` is
  written in the page's own examples. `${VAR}` and `${VAR:-default}` are expanded in `command`,
  `args` and `env`, from Claude Code's own environment. It "sets `CLAUDE_PROJECT_DIR` in the
  spawned server's environment to the project root, so your server can resolve project-relative
  paths without depending on the working directory"; the variable is not in its own
  environment, so in an argument it expands to its default. The page does not say what
  directory a stdio server is started in.
- Claude Code, `code.claude.com/docs/en/memory`. `AGENTS.md` is read only where no `CLAUDE.md`,
  `.claude/CLAUDE.md` or `CLAUDE.local.md` stands in the working directory or above it, and
  from v2.1.277. Its remedy is a `CLAUDE.md` beside it holding `@AGENTS.md`. An `@` and a path
  outside a code span or a fenced block, anywhere in an instruction file, is an import.
  Block-level HTML comments are stripped before the file reaches the model.
- VS Code, `code.visualstudio.com/docs/copilot/reference/mcp-configuration`. `.vscode/mcp.json`,
  under `servers`; a stdio entry has `type`, `command`, `args`, `env` and `cwd` ("Defaults to
  the workspace folder when run in a workspace"); predefined variables such as
  `${workspaceFolder}` are filled in the server configuration. Its Agent Host also reads
  `.mcp.json` at the workspace root, "the portable format". What it does with one name in both
  files is not stated.
- Cursor, `cursor.com/docs/context/mcp`. `.cursor/mcp.json`, under `mcpServers`; `type` is
  required; variables are resolved in `command`, `args`, `env`, `url` and `headers`, and
  `${workspaceFolder}` is "the folder that contains `.cursor/mcp.json`". The page does not say
  what directory a server is started in.
- `AGENTS.md` at a project's root is read by Cursor (`cursor.com/docs/context/rules`) and by
  VS Code (`code.visualstudio.com/docs/copilot/customization/custom-instructions`).

Observed, not documented (this machine, Claude Code 2.1.296): a stdio server of the running
session had the session's directory as its working directory and `CLAUDE_PROJECT_DIR` naming
it; the shell its Bash tool runs did not carry that variable.

Settled:

- **Three files for instructions and registration, each because a client reads it.**
  `AGENTS.md` for every client that reads one. `CLAUDE.md`, one line, `@AGENTS.md`, because
  Claude Code otherwise never sees the instructions in a project that sits beneath any
  `CLAUDE.md`, which is every project in this workspace, nor on a version before 2.1.277. A
  registration for each of the three clients whose project-level form was read. Another
  client is one entry in `MCP_REGISTRATIONS`, after its documentation is read: a row.
- **The instructions are generated, between two comments, with no version.** What a page, an
  assembly, a placement, a service and an api are; how to ask the project and change it; every
  rule's id and sentence from the one list. They say in their own text who keeps them, since
  the comment that says so is stripped before Claude Code's model sees it, and every `@` in
  them stands in a code span, since one anywhere else is read as an import.
- **The server is installed, and started by its path.** `@assemblejs/mcp` is a development
  dependency of every new project and each registration is `node` and its entry point: no
  shell, no package runner, nothing fetched when an agent starts, and the version an agent
  talks to is the one the project's `check` is. The cost was measured in a project installed
  from the tarballs: 90 of the 151 packages a new project installs, 15 MB of 48, are there for
  the agent surface alone, because the protocol's SDK depends on express and hono for
  transports this server does not use. All are development dependencies, and neither
  `npm prune --omit=dev` nor `deploy` carries one. Whether that weight is acceptable, or the
  SDK is bundled into the package with its notices, is the owner's: the morning list.
- **How the server finds its root.** The directory given as its one argument; else
  `CLAUDE_PROJECT_DIR`; else where it was started. Cursor's and VS Code's registrations name
  the server in full and hand it `${workspaceFolder}`, so neither depends on a directory no
  page promises. `.mcp.json` has no variable for the root that is set where arguments are
  expanded, so its server is named from where Claude Code starts it, and a session started
  beneath the project's root would not find it. That is a failure the client shows, not a
  wrong project; nothing in the documentation offers better.
- **The rules moved to the command line.** `new` writes them and `check` names them; the agent
  surface, which depends on the command line, explains the same list. `RULES`, `findRule` and
  `Rule` are the command line's exports now.
- **`add agents`, under the verb the command line already has.** It writes the files into a
  project that has none and rewrites only its own part of each in one that has; a registration
  that is not JSON it can write back whole, one with a comment for instance, is refused before
  anything is written. `create_project` merges the same way, because the root it is asked to
  scaffold into usually holds the registration that started it.
- **`check` holds what a project carries, and asks for nothing it does not.** A project with no
  `AGENTS.md` part, no registration and no `CLAUDE.md` has nothing to hold. One that carries
  them is red when its part of `AGENTS.md` is not this version's, when its server is registered
  otherwise, when the server is registered and not depended on, and when a `CLAUDE.md` does
  not bring `AGENTS.md` in. So an upgrade that changes a rule's sentence turns `check` red
  until `add agents` is run, which is the point of the rule and is said in its fix.

- **Two command lines judge the instructions, and they must be one version.** The packed
  agent surface asks for the command line at one exact version (`workspace:*`, written by the
  workspace as `1.0.0-next.0`; read from the tarball), and the release configuration neither
  fixes nor links the packages' versions. A project that updated one and not the other would
  have a person's `check` and an agent's `check` each calling the other's instructions out of
  date, and `add agents` satisfying only whichever ran it. `check` now compares what the
  installed server is built on with the command line installed beside it and, where they
  differ, reports that alone, with `npm update` of the two as its fix. Every release of the
  command line brings a release of the agent surface built on it (`updateInternalDependencies`),
  so the update always has somewhere to go. Found by the review before the push.

What the plan had wrong, or did not know:

- Every conformance fixture and `proof:create` would have failed at `npm install`: the starter
  now writes a package that is not on the registry (`npm view @assemblejs/mcp`: 404). The
  harness and the proof install every package of ours the starter wrote from its tarball, where
  the starter put it, and override the command line as they did core.
- DESIGN 13.3 names five resources and the server has two, and its `assemblejs://project`
  lists assemblies only. Nothing recorded the gap; B-09b is checked. The instructions send an
  agent to that resource, so they say "the assemblies that exist", which is true, and the gap
  is a row.

The command line's tarball budget is raised from 81000 bytes to 100000 (it packs to 96246) and
the agent surface's lowered from 25000 to 18000 (it packs to 16322): the rules moved from one
to the other, and the instructions and the registrations are new. Both packages ship their
code twice, `bin.js` and `index.js` each being the whole bundle, which is why the command line
grew by twice what was added. Building them to share it is a row.

Proved: `pnpm conformance agents`, 10 of 10, in a project exactly as `npm create` wrote it
from the tarballs. Each registration starts the installed server on the project, Cursor's and
VS Code's from another directory; an agent adds an assembly, places it on the page and composes
it through that server; the project's own build then serves the same page; and `check` refuses
a hand-edited `AGENTS.md` and a `CLAUDE.md` without the import until `add agents` is run; and
with the installed server's manifest edited to another command line, the project's `check` and
the server's `check` tool name the same one problem. The other four fixtures and
`pnpm proof:create` pass with the agent surface installed in every project they make.

Watched red, each mutation alone. In the unit suites, 66: what `add agents` keeps and what it
rewrites in each of the five files; each of the four things `check` reports and each it must
not; how an import is read, in a span, in a block closed or not, from the file that holds it;
the root from the argument, the environment and the directory, in that order; the entry point
refusing what is no directory; `create_project` merging, refusing and reading through the
root's guard; and the instructions held to the server they describe, its name, its entry
point, its tools and its resources; and the two command lines held to one version, with what
that check must leave alone. Two survived a first run and each got the case it lacked: an
import shown in a code span, where the spec's case could not have matched with or without the
guard, and the command line's name, which the agent surface's own manifest could not tell from
another dependency. Around a run of the fixture, 9: the starter not installing the server, the
root not handed over, the entry point ignoring it, `check` not holding the files, `add agents`
dropping the project's own text from either instruction file, a rule left out, a tool named
that the server has not, and the two versions not compared. With the harness no longer pointing the starter's packages at their tarballs,
the install fails before a spec runs.

Not done, and why: the directory Claude Code starts a project's server in is observed, not
documented, so the registration that depends on it is proved against what was seen. A session
on Windows, and one started beneath the project's root, were not run.

## 2026-10-10: one copy of the code in the command line, the agent surface and the starter

Found by A-01, which crossed the command line's tarball budget by adding half of what the
budget said it had added: each of these three packages builds two entry points, `bin.js` and
`index.js`, and each was the whole bundle. Every byte of source was packed twice.

They are built split now (`splitting: true`, as the framework renderers already are, for
another reason): the code is one chunk and each entry point imports it. `bin.js` in the command
line is 147 bytes. The version each package announces is read by walking up from the module
that asks, so it is the same from a chunk as from an entry point, which the agent surface's
suite holds by asking the built package through a real client.

The command line's budget is lowered from 100000 bytes to 66000 (it packs to 62313 with the
work in the tree; the unsplit build packs to 97470). The agent surface is mostly its licence
and its declarations, so it is nearly the size it was, and the starter was small already; their
budgets stand.

Held by the budget, watched red: with the split turned off again, `pnpm check:pack` refuses the
command line. Proved on the build: the three packages' suites, which start each built `bin.js`,
`pnpm check:exports` and `pnpm check:publish`.

## 2026-10-10: A-03, the prompts a person asks for

Expected, from the plan (PLAN 4.1): MCP prompts for the common tasks, add an assembly, place
it, make a page, fix what `check` found, listed by the protocol; proved by an agent-shaped test
that lists them through the protocol and follows one to a composed page.

What was read (2026-10-10):

- The protocol, `modelcontextprotocol.io/specification/2025-11-25/server/prompts`. Prompts "are
  designed to be **user-controlled**, meaning they are exposed from servers to clients with the
  intention of the user being able to explicitly select them for use", as slash commands for
  one. `prompts/list` and `prompts/get`; a message's role is `user` or `assistant`; an invalid
  name and a missing required argument are `-32602`; "Implementations **MUST** carefully
  validate all prompt inputs and outputs to prevent injection attacks".
- Claude Code, `code.claude.com/docs/en/mcp`: a server's prompts "become available as
  commands", listed as `/servername:promptname (MCP)`, their arguments space-separated, each a
  single token. VS Code, `code.visualstudio.com/docs/copilot/customization/mcp-servers`: "Type
  `/<MCP server>.<prompt>` in the chat input." Cursor, `cursor.com/docs/context/mcp`: prompts
  are "Supported", and the page does not say how a person picks one. So the site and the
  READMEs say commands of the first two and support of the third.
- The SDK as installed, 1.30.0, its own `server/mcp.d.ts`: `registerPrompt(name, { title,
description, argsSchema }, callback)`, every argument a string.

Settled:

- **Four prompts, in the order a project grows**: `add_assembly`, `place_assembly`,
  `make_page`, `fix_findings`. Two share a name with the tool that does the mechanical half;
  the two lists are separate in the protocol, and a person asking for an assembly should not
  have to learn a second word for it.
- **A brief is what a tool's description cannot be.** One message, in the person's voice. It
  gives the order: look before adding, see before saying it is done, `check` last. It says
  where to stop and ask: an assembly that exists, a place nobody named, a page whose contents
  nobody gave. And it says what an answer means: a refusal carries its fix, a placement that
  fell back looks the same in the markup, a fix that is a command is for a shell this server
  does not run.
- **What a person fills in is a name, or one of a list.** It becomes part of what a model
  reads. A name is the vocabulary's own shape (`SEGMENT`) and a renderer is one the command
  scaffolds; the protocol answers `-32602` for anything else before a brief is written.
- **The page a brief hands over is the starter's.** `pageDocument` in the command line is the
  one definition of the document a new project's page is written with; the prompt for a page
  gives it with nothing placed. There is no `add page` verb and no `add_page` tool: the plan
  asked for prompts, a page is one file, and the brief is where its document comes from.
- **The fixture has two projects**, each the starter's, untouched: A-01's spec and the prompts'
  both change the project they run in, and a fixture's spec files run at once. The harness
  makes a project that has no directory of its own, so neither needs a placeholder file that
  the starter did not write.

Found on the way:

- Two faults in the binding, each by the spec written for it. An argument that may be left out
  lost its description in the listing, described before it was made optional. And a prompt
  that takes nothing, registered with an empty shape, refused a client that sent it no
  arguments, which is how a client sends none.
- `render_assembly` and `compose_page` show a plain html view and refuse every other with the
  reason, by design (B-09b). The instructions A-01 writes said they render an assembly; they
  now say which views are shown at once and where the rest are seen, and the briefs say the
  same. That the loop closes only for plain html is the largest gap left in the agent surface,
  and is a row. Three public sentences said more than that and are brought down to it: the
  landing page's, the root README's and the agent surface's own; `site/LANDING.md` records
  the claim found ahead.
- The shape of a name is written five times beside the vocabulary's one. A row.

The agent surface's tarball budget is raised from 18000 bytes to 20500 (it packs to 18915):
the four briefs.

Proved: `pnpm conformance agents`, 14 of 14. The protocol lists the four prompts with what a
person fills in; a prompt refuses what is not a name; an agent takes from the brief for a page
the file to write and the document to write in it, calls what the brief names in the order it
names it, and the page composes and is served by the project's own build at its address; and
the brief for findings leads from one finding, through `explain` and the fix it names, to none.

Watched red, each mutation alone. In the unit suites, 19: an argument listed without its
description, a prompt that takes nothing asking for an object, a name of any shape and a
renderer nobody scaffolds reaching a brief, nothing required, the brief in the model's voice,
no prompts listed, one left out of the list; a renderer nobody asked for, an existing assembly
added again, a place chosen for the agent, home served at its name, a document that is not the
starter's, a tool and a resource the server has not, a brief that does not end with `check`;
the document's placements out of order and a new project's page written another way; and the
instructions silent on which views are shown. Around a run of the fixture, 4: no prompts
listed, the prompt for findings refusing a client that sends nothing, the brief handing over
another file, and the document not titled with its page. One more survived and was replaced: a
document whose body opened with another tag still took a placement and was served, which is
the placement's leniency and no fault of the brief's. With the harness refusing a project that
has no directory, the fixture stops before it is built.

## 2026-10-10: two specs built one example in place, and removed each other's build

Seen once, in about twenty runs of the command line's suite that night: `bundle-client.test.ts`
failed with "Could not resolve ./client/counter.js". The cause is at
`build/build-project.ts:58-59`: a build begins by removing the project's `dist` and its
generated `.assemblejs`. `build-project.test.ts` built `examples/two-frameworks` itself, and
`bundle-client.test.ts` bundled the same directory, and spec files run at once.

Both now copy the example's source into a directory of their own, nested in the example so it
resolves the workspace's packages as the example does, which is what the specs of `dev`,
`perf`, `deploy` and the server's start already did. Run together twelve times, the two files
did not fail; no spec builds an example in place. A race cannot be watched red on demand, so
this one is held by its cause being gone, not by a count.

## 2026-10-10: one definition of a name's shape

Core's vocabulary holds the shape of a segment once (`SEGMENT`, and `SEGMENT_PATTERN` for a
longer pattern to embed), and says in its own comment that three copies had drifted apart
before. The command line still wrote it four times, for a page, an assembly, an assembly being
added and an api file, and twice more, with the agent surface, for a project's own name.

A page, an assembly and an api file are named by the vocabulary's segment, so they test with
it. A project's name is not a segment of the framework's grammar: it names a directory and a
package. It has one definition of its own, `PROJECT_NAME` in the command line, which the
command and `create_project` both ask. Each place that tests a name was watched red while it
accepted any: seven mutations.

## 2026-10-10: A-02, the site as text for a model to read

Expected, from the plan (PLAN 4.1): `llms.txt` and `llms-full.txt` on the site, generated from
`pages.json` and the pages, never hand-kept, declared in `pages.json`; `check:site` refuses a
page missing from them; a drift test regenerates and diffs.

What was read (2026-10-10):

- `llmstxt.org`. The file is `llms.txt` "at the root path `/llms.txt` of a website or at any
  subpath"; it holds "An H1 with the name of the project or site. This is the only required
  section", a blockquote with a short summary, any Markdown but headings, and then sections
  "delimited by H2 headers" holding file lists: "a required markdown hyperlink `[name](url)`,
  then optionally a `:` and notes about the file". An "Optional" section is for "links an agent
  can skip when a shorter context is needed". It does not mention `llms-full.txt`.
- `mintlify.com/docs/ai/llmstxt`, for what the second file is where it is published:
  `llms-full.txt` "combines your entire documentation site into a single file".
- The AWS CLI's `s3 sync` reference, for the upload: `--content-type` "overrides any guessed
  mime types".

Settled:

- **Generated, and held by one check.** `scripts/site-llms.mjs` writes both files from the
  manifest and the pages, as `scripts/site-links.mjs` writes the links, and `--check` in
  `check:site` refuses either when it is not what it would write. A page added to the manifest,
  a sentence changed on a page and an edit by hand are the same drift. The manifest names the
  two files, and a page says `in_llms: false` to be left out, which the 404 page does.
- **The index is llmstxt.org's form.** The name from the manifest, the blockquote from the
  landing page's description, its opening paragraph beneath, the pages under "Docs" in the
  manifest's order, each with the first sentence beneath its title as its note, and the links
  that leave the site under "Optional".
- **The full file is every page as text**, in that order, each under its own title with where
  it came from. A convention, not llmstxt.org's, and the script's own comment says so.
- **Every link is relative.** The one folder is published at two addresses, the channel's and
  the product's, and an absolute link would be right at one. A link inside a page is written
  from the site's root, since the file that now holds it stands there.
- **A page is read from its DOM, and what cannot be said fails the run.** The DOM is the one
  the tests already use (`happy-dom`); the elements the pages use today each have a rule, and
  an element with none, or words in no paragraph, stops the generator with the page's name.
  Markup added to a page cannot go missing from the text without anyone being told. A "<" in
  prose is kept from opening a tag, which a Markdown reader would show nothing of; code is
  left as written.
- **Uploaded as the pages are.** The deploy sent anything that was not a page with a week's
  cache. The two files change when a page does, so they get the pages' five minutes, and are
  named as text in utf-8.

Not done: the instructions `new` writes do not point at `llms.txt` yet. Which address a
project should be sent to is not settled, and the product's does not answer until `main` has
a site. A row.

Watched red. The generator tests itself, as the other site scripts do, and 16 mutations of it
and of the page reader beside it, `scripts/site-page-text.mjs`, each alone, each failed that
self-test: a footer said, a page the manifest leaves out read, an
unknown element and words in no paragraph dropped in silence, a hand edit called right, a link
not rewritten from the root, code not marked, a fence its own code could close, a note that is
the whole paragraph, the landing page among the docs, a block of code in a description taken
for a line, a label not said, no source given, the external links left out, a "<" in prose
left to open a tag, and one in code escaped as if it were prose. And `pnpm
check:site` refused three known-bad sites: the index edited by hand, a sentence changed on a
page, and a page marked to be left out, each without the files being written again.

## 2026-10-10: A-04's memo is written, and nothing is built

The plan asks for a design memo and the owner's answer before any of A-04. The memo is
`docs/studies/built-in-components.md`. It was written from four things read at their source:
that nothing in a project is shared between assemblies but the page, so a token has nowhere to
live; that the default content policy already refuses an inline style and `check` says nothing
of it; that `check` reads a view for what it places and for nothing else; and that the estate's
own site kit has roles bound by a skin with their contrast held by a checker, which this
repository's site already runs.

It proposes one tokens file that every page links, with the estate's role names and their
invariants held by `check`; components as styled native HTML; five rules, each refusing only
what its reader can be certain of, with the success criterion of WCAG 2.2 it rests on quoted
from the specification; and what reading an element's attributes in each kind of view takes,
which is what S-07 built for placements, one level deeper. About nine bites.

It asks one thing: what a built-in component is. The advice is styled native HTML for 1.0.
The question is on the estate's morning list, and no code of A-04 is written until it is
answered.

## 2026-10-10: what it would take to show an agent a framework view

Expected, from the row A-03 left: build what `render_assembly` and `compose_page` must, with
the project's own renderers, and render it.

Found, reading the agent surface before building: it runs none of the project's code today, and
that is not an accident of how far it got. It reads sources as text and as syntax trees; a
plain html view is its own markup; nothing is imported, evaluated or spawned (no `import(`, no
`eval`, no child process in `packages/mcp/src`, nor in the command line's `check`, `discovery`
or `agents`). No service runs either, which is why a rendered assembly's `data` is always
empty, where DESIGN 13.4 says an agent sees "what data it produced".

Showing a React, a Vue or an EJS view means running it: the component's module, the template's
code, and the service that feeds it. Inside the agent surface that is a way round a
permission. A person lets an agent call this server's tools and edit files, and withholds a
shell; the agent writes a service that starts a process, calls `render_assembly`, and has run
a command. DESIGN 13.6 says the framework ships capability, not autonomy, and that nothing
here runs a shell. A tool that runs what an agent just wrote is a shell with another name.

Three ways, and the choice is the owner's, since it changes what DESIGN 13.2 and 13.6 promise:

- **Stay as it is.** The tools show plain html and say why not the rest; an agent that has a
  shell runs `dev` and reads the page. True today, and the instructions and the briefs say it.
- **Run it here, in a process of its own, under Node's permission model.** The real render
  and the real data, with what the process may touch cut down. How far that model can be
  trusted on the Node versions the framework supports is not established.
- **Show it from the project's own `dev` server.** The server a person started is where the
  project's code already runs with their leave. `dev` writes where it listens into the
  generated directory; the tools ask it for the assembly or the page, by the contract's own
  endpoints, and answer what it rendered with its account and its data. The agent surface
  still runs nothing. With no server running, the answer is to start one.

The advice is the third. Nothing is built until he answers; the row waits, and the question is
on the estate's morning list.

## 2026-10-10: the API reference, typedoc at deploy time

Expected, from the ruling of 2026-10-05: `deploy-site.yml` gains Node, pnpm, install, build and
a typedoc run into `site/docs/api/`; DEPLOY.md's "no build" sentence is rewritten; typedoc
becomes a root devDependency.

An interrupted agent had built all of it once, and its work was kept as a patch under
`docs/studies/`. The patch was read whole and not applied: the tree had moved under it, and it
is out of the tree now (`git show 90f3069:docs/studies/typedoc-at-deploy.wip.patch`). What it
settled was built again against today's tree, and each thing said below was seen again.

- **typedoc 0.28.20**, exact, at the root; the registry gives its peer range as TypeScript
  `5.0.x` through `6.0.x`, and the workspace is on 6.0.3. `pnpm site:api` is the bare command;
  every option is in the root `typedoc.json`. The lockfile is pnpm's: besides typedoc's own
  fourteen packages it re-resolved one optional peer, the bundler core's test runner sees
  (0.27.7, which the packages' build tool already installs, where it was 0.28.2). Core's suite
  passes under it.
- **One root config over a tsconfig that only references the packages.** Twenty-two entry
  points: each package's `src/index.ts`, and each subpath its `exports` names. Clean with
  `treatWarningsAsErrors`: 22 modules, 480 pages, 13 seconds here. Each page says where its
  source is, as a link to the repository at the commit that was generated.
- **Each entry file names itself**, with a `@module` comment after its header, so the
  reference lists `@assemblejs/core/client` and not a path nobody imports. A comment is not a
  declaration, and the organization gate is clean.
- **`check:reference` is a gate of its own in the chain**, after the build. It holds the entry
  points to the packages' `exports` (`scripts/check-reference.mjs`), since nothing else ties the
  two lists together and a subpath left out of `typedoc.json` would be missing with nothing to
  say so. And it generates the whole reference, warnings as errors: the deploy runs typedoc only
  on a push that touches the site, so without this a change to a package that breaks the
  reference would pass CI and fail the next deploy, for a reason that push did not cause.
- **What typedoc does not hold here.** Its check that a public signature names no type an
  entry point leaves unexported never fires in this arrangement: it lets a reference pass
  wherever the type's package is not the project's own (`makeIntentionallyExportedHelper` in its
  `dist/index.js`), and one project over twelve packages makes that every reference. Seen by
  giving an exported function an unexported interface to return: the page named it, unlinked,
  and typedoc said nothing. Running typedoc once per package would hold it. A row.
- **`pages.json` marks the page `generated`**, with the note the index for a model lists it
  by. `check-site.mjs` does not require it in the tree and does not walk the tree it heads:
  with the tree on disk and the mark not yet written, the gate reported 1920 links to pages
  nobody declared. `llms-full.txt` leaves the reference out, being hundreds of pages of its
  own.
- **Two jobs, and only one holds the role.** This is where the row departs from the patch.
  The patch installed, built and ran typedoc in the job that assumes the deploy's role, where
  a dependency's script would run beside the right to write the bucket. The reference is
  generated in a job of its own, whose only permission is to read the repository, and reaches
  the deploy as an artifact; the job that assumes the role installs nothing. GitHub's
  documentation of `permissions`: "If you specify the access for any of these permissions, all
  of those that are not specified are set to `none`", and fetching an OIDC token "requires
  `id-token: write`". The ruling's words, that the workflow gains an install, a build and a
  typedoc run, hold.
- **`eslint .` reads no ignore file of git's**, so `eslint.config.js` ignores the generated
  tree, for when a preview is on disk. The whole check chain was run with the tree on disk and
  the gates that could see it were run again without it.

Not done: nothing is deleted from the bucket, so a removed symbol's page stays reachable (a
row); and a push that changes only the packages does not republish the reference, as ruled.

Watched red: 13 mutations of the three site scripts, each alone, each against the script's own
self-test: the site gate's four ways of treating a generated page and its refusal of an
undeclared link, the reference check's five, and the index's three for a generated page. And
on the real tree: typedoc given an entry that does not exist stops at exit 3 with nothing
written; an entry point with its `@module` removed and the reference page with its `generated`
mark removed are each refused by the gates; and a link in a comment to a thing that is not
there, and an entry point's source that does not compile, each fail `pnpm check:reference`.

## 2026-10-10: release notes, the estate's one pattern

Expected, from the owner's order of 2026-09-03 and the ruling of 2026-10-05: this repository
gains the surfaces it lacked. The changelogs are changesets', one per package, and are the
GitHub release's body; `RELEASE_NOTES.md` and `site/release-notes.html` are written by hand for
a user; a gate holds the page to the changelogs in structure only.

Settled:

- **`RELEASE_NOTES.md`** in the pattern's form: the product and its version as the heading,
  one line of what it is, a paragraph led in bold for each of its four parts, the address for
  an issue. No dates and no history, which the changelogs carry.
- **`site/release-notes.html`**: one section for `1.0.0-next.0`, the only version there is. It
  says that version is versioned and not yet published, because that is true (the registry
  answers 404 for `@assemblejs/core`, asked today), and the sentence becomes a date at the
  first publish (a row). Declared in `pages.json` and in the nav, as the reference product has
  it, so every page's generated links gained it and the index for a model lists it.
- **The page is written in the kit's one content shape, a heading and a table of rows.** The
  reference product writes a note's subsections as smaller headings and lists, and styles them
  in a stylesheet of its own (`magpie/site/site.css:11-14`: "which kit.css's h2/dl shape does
  not carry"). This site links the kit and its skin and nothing else, and the kit at this
  site's pin resets every margin and has no rule for either, so the same markup here would be
  unstyled. Copying the reference's rules into a second product is the duplicate the kit exists
  to end; the shape belongs in the kit, which is the platform's to change (a row, for the
  lead). The contract the gate holds, the section and its id, is the reference's exactly.
- **The drift gate is the reference product's, for twelve changelogs.**
  `scripts/check-release-notes.mjs`: one section for each version any package's changelog
  heads, exactly once, newest first, none for a version no changelog has, and
  `RELEASE_NOTES.md` headed by the newest. The versions of twelve files are one list, so it
  orders them itself, a prerelease before its release and the tenth prerelease after the
  second. It reads no prose: the page and the changelogs say the same thing differently on
  purpose.
- **It runs in three places, as the reference's runs in its release and its deploy.** In
  `check:site`; in the deploy, before the site is published; and in the release job, before
  it versions or publishes. The last is the one that guards a publish: the push that merges
  the version pull request is the push the release job publishes from, it changes no file
  under `site/`, so the deploy does not run, and CI on `next` would go red only after the
  registry had the version, which cannot be taken back. The script needs nothing installed.
  The release job is skipped until the registry has `@assemblejs/core`, so that step has not
  run in Actions and cannot yet; its proof is the same command, in the deploy's run and on
  this machine against the known-bad inputs below (a row to read it at its first run).
- **Where the notes for a version are written: on the version pull request's own branch, as
  its last commit.** The changelogs gain a version's heading in the pull request the
  changesets action opens, and the page and `RELEASE_NOTES.md` gain the version there. Read in
  the pinned action (v2.1.1, `8488615`, `src/github.ts`): by default it pushes through the
  API, and `pushChanges` writes the version commit onto the pushed commit and moves the branch
  to it with `force: true`, at every push to `next`. A commit added by hand is gone at the
  next push; the gate is then red again wherever it runs. Merging publishes and deploys from
  one push, so the notes reach the site with the version and not before.
- **CI on that pull request waits to be approved.** The release job hands the action no token
  of its own, so the pull request is opened with the workflow's. GitHub's documentation
  (`github/docs`, `data/reusables/actions/actions-do-not-trigger-workflows.md`, read today):
  "when a workflow using `GITHUB_TOKEN` creates or updates a pull request, the resulting
  `pull_request` event creates workflow runs in an **approval-required** state", started by
  "a user with write access to the repository". So that pull request is not red by itself; it
  shows runs waiting, and they fail at `check:site` once started, until the notes are there.
  The commit that adds the notes is a person's push and starts CI in the ordinary way.
- **No old releases**: `gh release list` lists none.

Measured, in a clone of its own with an install of its own, at `f1d217b`, as the release
workflow runs it (`CI=true pnpm changeset version`):

- The version step works: exit 0, twelve manifests and twelve changelogs written, every package
  `1.0.0-next.1`, the seventeen changesets then waiting filed under `.changeset/pre/`, the
  lockfile untouched.
- **The packages' versions part ways after it.** A changeset naming the agent surface alone
  moved it to `1.0.0-next.2` and nothing else. One naming the command line alone then moved the
  command line and create to `1.0.0-next.2` and the agent surface to `1.0.0-next.3`, and left
  the server at `1.0.0-next.1`. DECISIONS 2026-10-09 expected "one channel's packages version in
  lockstep". They do only when a changeset names them all.
- Two things here are right only while the twelve share one version. The gate: a version one
  package reaches after another already has its section, so a cut of one renderer alone can
  pass with nothing written (the script's header says so). And a new project's manifest, which
  asks for the server and the agent surface at the command line's own version
  (`commands/project-files.ts`): after a cut of the command line alone it asks for
  `@assemblejs/core@^1.0.0-next.2`, which no registry would have (semver 7.8.5:
  `maxSatisfying(["1.0.0-next.0", "1.0.0-next.1"], "^1.0.0-next.2")` is `null`), and
  `npm install` in a project just made fails. Nothing is published, so nobody has met it.
- One fixed group would end both: with the twelve named in `fixed` (the tool's schema:
  "Packages that should always be released together with the same version"), a changeset
  naming one renderer moved all twelve to one number, and a package nothing changed in gained
  an entry with nothing under it. The other way is to keep the versions apart, and have a new
  project's manifest ask for the versions the packages were built beside, and the notes say
  which package a version is of. **Which is the owner's**: he kept changesets on 2026-09-09
  on the reasoning that a bump for each package computes which packages move
  (`ayers.repair/docs/CODESTYLE-HOOKS-RULING.md:270-278`), and one group moves all twelve
  every time. "Lockstep" in the 2026-10-09 entry was this seat's expectation and never his
  word. Nothing is published and no cut can happen before he answers, so nothing is built on
  either until he does (a row; the estate's morning list).
- **The changesets waiting are already in what the first publish ships.** The first publish is
  `1.0.0-next.0` of the tree as it stands that day, and the version pull request after it would
  cut `1.0.0-next.1` for changes `1.0.0-next.0` already holds. They fold into the first entry:
  with the manifests at `0.0.0`, the changelogs removed and the first changeset back from
  `.changeset/pre/`, the version step wrote `1.0.0-next.0` into all twelve with one entry
  holding every change, and left none waiting. A step before his publish, by his word (a row;
  the estate's morning list).

A lesson for the tooling, not the tree: the dry run was first tried in a copy with this
checkout's `node_modules` linked into it. pnpm 11 checks an install before `pnpm exec`, found a
copy it had not installed, and set about removing the modules directory it had been handed; it
stopped only for want of a terminal to ask at. Nothing was removed. A dry run gets a clone and
an install of its own, which takes two seconds from the store.

With it, a truth fix the review of the last commit asked for: the descriptions of
`render_assembly` and `compose_page`, which an agent reads when it lists the tools, and DESIGN
13.4 said an agent sees an assembly's data and any view. They say what holds: a plain html
view, nothing of the project's run, and any other view answered with the reason.

Watched red: 8 mutations of the gate, each alone, each against its self-test; and on the real
tree a version injected into one package's changelog, the page's section renamed, and the
notes headed by another version, each refused.

## 2026-10-10: what an agent reads (DESIGN 13.3), the first half

Expected, from DESIGN 13.3: five resources, the project's whole shape first among them. Found
writing A-01: the agent surface had two, and its `assemblejs://project` listed assemblies and
nothing of the pages, the apis, the config or how any of it is wired.

Settled:

- **The shape is read by the command line and never run.** `readShape`, in
  `packages/cli/src/shape/`, is built from the readers `check` already holds a project with
  (`discoverPages`, `discoverAssemblies`, `discoverApis`, `viewFindings`, `pageRoute`,
  `readDefaultExport`), so the shape and `check` read a file the same way and neither needs a
  build. The agent surface serves it with the project's root beside it, after holding each of
  the four places it is read from to that root.
- **What a source computes is marked, never left out.** The readers `check` uses drop what
  they cannot read as a literal, which is right for a rule (it cannot judge what it cannot
  read) and wrong for a description (a missing deadline reads as no deadline). So the shape
  shows a declaration as written: a computed value reads `(computed)` where it stands, an
  object a source spreads into has `...` among its keys marked the same way, and what a file
  that does not compile would have said reads `(unread)`. `viewFindings` now names the views
  that hold a placement it could not read, so the shape does not call those computed.
- **The config is shown by naming each field**: remotes, public routes, the content security
  policy, whether it declares an access check, budgets. The check itself is code and is not
  shown, and nothing else the file holds reaches a reader. The config holds policy only by
  design (DESIGN 4: where a project runs and its credentials come from the environment), and
  the shape does not lean on that.
- **`assemblejs://assembly/{name}` is a template with a list.** Read in the SDK (1.30.0,
  `server/mcp.js`): a template's `list` callback is merged into `resources/list`, and the SDK
  declares `listChanged`. Read in Claude Code's documentation (`code.claude.com/docs/en/mcp`,
  "Use MCP resources"): resources are what `@` offers a person, and it "automatically provides
  tools to list and read MCP resources"; it says nothing of templates. So each assembly is
  listed as a resource of its own, and a tool that writes one sends the notice to list again.
- **Listing opens nothing but the directory the assemblies are in.** Found in review, before
  the push: the list took its names from the whole shape, and the shape refuses a project one
  of whose four places leads out of the root. The SDK awaits a template's `list` inside
  `resources/list` and catches nothing, so a config that is a link out of the project failed
  the whole request, the fixed resources with it, for a client that lists on connecting.
  Watched through the protocol first (`-32603`, twice), then the names were read by discovery
  alone, and where even that refuses, none is listed. The reads still refuse.
- **An assembly the project has not is `-32002`.** The specification (2025-11-25,
  server/resources, Error Handling): "Resource not found: `-32002`". The SDK's own list of
  codes does not name it and answers an address no template matches with `-32602`; that one
  is the SDK's to change.
- **One definition each** for three things the shape shares with `check`: whether an assembly
  has a browser half (`hasBrowserHalf`), a path from the root (`fromRoot`), and the mark on a
  computed value, which the policy reader already wrote as a word of its own.

Two rows of 13.3 came down, because no source gives them (a row): the shape of an assembly's
data, which is what its service returns; and what is wrong on a running server with the id
that finds it in a log, which waits with showing an agent a framework view on how an agent is
shown a running project. What `check` finds is not served a second time under another name.

Not here, and next: `assemblejs://contract` and `compose_page` by a page's name.

Found, and rowed: `pageRoute` reads a declaration whose default export is not written as an
object as one that declares no route. And the four places the shape is read from are held to
the root while a link one level further down is followed, by the shape and by `check` alike;
`check` read that way before this.

A budget moved on purpose: the command line's tarball, 66000 to 69000 bytes. The shape reader
took it from 62422 to 66356. The agent surface's went from 19029 to 20384 and stays under its 20500.

Watched red: 56 mutations in the unit suites, each alone, each restored from its own bytes;
one survived the first run, a root given as a path from where it is asked, because the spec
wrote its project where a path that is not resolved still happened to lead, and it is red now
that the spec writes beneath the directory it asks from. And 4 around a run of the `agents`
fixture from packed tarballs: the instructions not naming the one assembly's resource, an
assembly that is not there answered as an invalid request, assemblies not listed, and no page
said to place an assembly.

## 2026-10-10: nothing outside the root is read

Ordered by the lead ahead of everything else, on a row this seat had written the same morning:
the agent surface held four places to the root, and a link one level further down was followed.

Found, watched on the code as it stood before a line of it changed: through the agent's own
`check`, a finding quoted what stood outside the project. An api file that was a link to a file
outside came back as `api "SECRET-NO-SLASH" does not start with "/"`, and a page directory that
was a link came back as `page "landing" places "secret-placed"`, each word of it from a file the
project did not hold. The shape read the same files and showed a route, a policy and a stream
from them. A project cloned from somewhere else can carry such a link, and the reader is a
model.

Settled:

- **One read, held to the root.** `readInside(root, file)` is how a reader opens a file. It
  resolves the path, follows every link along it to where it really leads, a link to a link
  and a link to nothing included, and refuses with `OutsideRootError` before anything is
  opened. A file outside is never read to find out what it was, so nothing of it can reach a
  finding's words: not a value, not an engine's complaint about it.
- **It is the guard the agent surface's tools already had**, moved down. `followLinks`, the
  refusal and the rule itself (`insideRoot`) are the command line's now, and the surface's
  `withinRoot` is that rule asked of the root a server was started on. One definition, used by
  `check`, by the shape and by every tool.
- **Discovery takes the project's root, and stops at it.** It was handed a directory and
  listed whatever stood there. It now asks, before an entry is so much as looked at, whether
  it leads out: a directory that does is reported and not listed, since even its files' names
  are not the project's; a file that does is reported and kept by its name, for a reader to
  refuse and the shape to mark. Every caller had been spelling `src/assemblies`, `src/pages`
  and `src/api` for itself; discovery spells each once.
- **An import that climbs out is not followed.** A framework view is read with the components
  it is split into, by the relative paths it imports, and a path can climb out of the root
  with no link in it. Such an import is not followed nor looked for, and is a finding on the
  view. What two projects share comes in as a package.
- **A rule, so the finding can be explained.** `a-project-stays-inside-its-root`, in the list
  `explain` answers and the instructions `new` writes. A file that leads out reads `(unread)`
  in the shape, and the finding beside it says why. The shape no longer throws for the four
  places: it marks, reports and tells the rest.
- **Installed packages are the exception, and the only one.** `check` finds a package in
  `node_modules` beside the project and in each directory above it, as the bundler does
  (`findPackage`); it reads an installed package's manifest; and it loads the project's own
  template engine to compile its template views (`loadTemplateCompiler`). Each goes through
  the package manager's links, which lead wherever it keeps packages: a workspace's root, a
  store beside it. Holding those to the project's root would break every workspace, and they
  are the boundary the server itself runs inside, started from
  `node_modules/@assemblejs/mcp`. Nothing else follows a link out. The lead's order said
  every file; this is where it does not hold, and it is his to overrule. (He let it stand the
  same morning, on the condition that the design say the boundary where trust is written:
  DESIGN 5.5, with what is handed back from an installed package.)
- **`add agents` writes nothing through a link that leads out.** It read the file to bring it
  up to date; not reading it, it would have written a new one over whatever stood outside.
- **A stylesheet's `url()` written outside its assembly is refused without being looked for.**
  `check` said "there is no such file" or "outside its own directory" by whether the file was
  there, which told anyone asking whether any path on the machine exists.

- **The guard takes a path as a read takes it.** Found before the push: a reader hands the
  guard the path it was about to open, which under a root that is not whole (`app`) is a path
  from where it is asked (`app/src/x`). The guard resolved it against the root a second time
  and asked about `app/app/src/x`, which is nothing, and so no link out. Every caller in the
  tree hands it a whole root, so nothing was open; a spec with a root from where it is asked
  said a link out was none, and `leadsOut` and `readInside` now resolve both as a read does.
- **A declaration is read once.** The shape read a page's declaration and then asked the
  route reader, which read it again; the second read hid whether the first was guarded. One
  rule, `declaredRoute`, says what route a declaration gives, from a reading of it, and both
  the route reader and the shape use it.
- **The server file is a file of the project like any other**: one that leads out is a
  finding, which the build refuses on.

Read, and found already held: a template view is one file to every engine. EJS's includer
throws, Nunjucks has no loader and Pug is given no filename, so no engine's own include opens
a second file.

Not changed: the build's own reads (a row). Discovery refuses a build that holds a link out
before the bundler or anything else of the build runs.

A budget moved on purpose: the command line's tarball, 69000 to 73000 bytes. The guard, its
rule and the readers' use of it took it from 66356 to 69550; the agent surface's, which the
guard left, went from 20384 to 19540.

Watched red, the specs written first: on the code as it stood, three of the shape's specs and
both of the agent's check's, the two findings above among what they caught. Then 54 mutations
in the unit suites, each alone, each restored from its own bytes: every guarded read handed
`/` for its root, every report taken out, the guard itself. One survived the first run, the
shape's read of a declaration, because the route reader read the same file a second time and
its guard hid the first; a declaration is read once now, and the mutation is red. And 4 around
a run of the `agents` fixture from packed tarballs, on a project with a link put into it.
Every fixture from packed tarballs after it: agents 16, contract 20, remote 22, rendering 78,
trust 44.

## 2026-10-10: the second reading of the design

The lead had the design read a second time, by the cto seat, read-only, against the tree by
its sha. Nine findings. Two are in this change, since the guides are on staging and one of them
showed a sample that fails; the rest are rows, in the order this seat will take them.

Found by the reader, and read again here at each line named:

- **A project's assembly has one view.** The registry writes it as `default` and nothing else
  (`cli/src/generate/generate-registry.ts`), and a parent that names another is refused at
  `check` and at boot. Core holds several views for an assembly declared by hand. DESIGN 7
  said a view may come from data, which is core's truth, and the seven guides, the rule and
  the fix `check` gives said it to a project's author, the template guide with a sample. In a
  project that sample names a view the child has only if its data says `default`.
- **The directive is written closed.** DESIGN wrote `<assembly name="cart">` in three places.
  The finder refuses a directive "neither self-closing nor immediately closed", and the page or
  the view that holds it fails whole.

Settled:

- Every surface a project's author reads says what a project holds: one view, so none is
  named. The rule `a-placement-is-named-where-it-is-written` says the name is never computed
  and no longer adds that a view may be. The design keeps core's sentence, scoped to an
  assembly declared by hand, and "The author's day" loses it.
- **Whether a project's assembly may have several views is the owner's**, on the estate's
  morning list. The contract already answers at `/assembly/<name>/<view>/`; a project has no
  way to write a second.
- The directive is written closed wherever it is shown: the design, the rule, what a finding
  shows, two tools' descriptions, core's own word for the element. DESIGN 2.4 says an opening
  tag alone is refused.
- A comment in the browser runtime said an outer assembly mounts before an inner one and that
  the other order hands a framework a subtree another is driving. Each hydrates when its own
  module arrives, in either order, which is what DESIGN 2.4 says and the code does; the
  comment says so now.

The record of S-09 cited three specs that hold less than their sentence. Corrected here:

- For 8, a view chosen from data: `conformance/specs/rendering/nested.spec.mjs` asserts the
  child's view is `default`, from a service that returns `default`, which is also what a
  directive with no view gives. What that case holds is when the directive is read, after the
  template has rendered, and it is retitled to that. A child with several views placed with
  the one its parent's data names is held by a new spec in
  `core/test/server/render-local.test.ts`.
- For 3.4, a failed subtree kept out of the cache: `holds-failed-envelope.test.ts` holds the
  question alone. The cache refusing the write is `core/test/compose/placement-cache.test.ts`,
  "never writes an answer holding a failed envelope".
- For 7, a parent hydrating around its child: for Svelte the unit specs hold the directive's
  text and the renderer's shape. That a Svelte parent hydrates around its child and writes
  nothing again is the browser proof's, `browser/frameworks.browser.ts`, the pairs it nests.

## 2026-10-10: a value written raw

The second reading's fourth finding, taken as the lead ordered it: say in the design what an
unescaped value can place, and hold it with a spec.

Found by the reader, and read again here at each file named:

- The composer reads what a view rendered (`core/src/server/render-local.ts`, its call to
  `compose`), and a directive in it is settled whoever wrote it. The local transport answers
  any name this server holds (`core/src/server/local-fetch.ts`).
- The access decision is made in the first hook of a request, of that request's path
  (`core/src/access/register-access.ts`). A placement rendered with the answer is composed in
  this process, so the decision is never asked of it. A spec already held that for a child a
  page's author placed (`conformance/specs/trust/inbound.spec.mjs`, "placed without
  credentials too"); the design did not say it. A placement a page defers is the other case:
  the browser asks for it at the assembly's own address (`core/src/client/fill-deferred.ts`),
  and that request is decided like any other. A view's own children are never deferred.
- `check` refuses a name the source computes (`cli/src/check/view-findings.ts`). It does not
  read what a view writes raw, and neither boot nor a render can tell a directive its author
  wrote from one a value wrote.

Measured, by specs that each went red on a change made to break them:

- A directive a visitor sends in a page's address is placed by a view that writes it raw, in
  EJS (`<%- %>`), Handlebars (`{{{ }}}`), Nunjucks (`| safe`), Pug (`!{ }`) and Svelte
  (`{@html}`), and is text where the same view escapes it.
- A name no assembly has is a failed envelope inside a parent that answered. A directive the
  finder refuses fails the view whole: a 500 at the view's own address, its failed envelope on
  a page.
- Under basic credentials, an assembly no open page places answers 401 at its own address,
  and is shown, to a visitor with no credentials, on an open page whose view writes that
  visitor's value raw.

Settled:

- The design says it where it claimed otherwise. Section 7: which child a view holds is not
  its data's to choose, and `check` is what holds that; then what a value written raw places,
  and what bounds it. Section 5.2: the decision is made of the address a request asked;
  what that address places and renders with its answer is not asked again, and what a page
  defers is. 14.18 points to both.
- The surfaces an author and an agent read say to write a visitor's value escaped: the
  templates guide, the Svelte guide, and the instructions `new` writes into a project.
- Each raw form was read in its engine's own documentation before a guide named it: EJS's
  README ("Tags"), Handlebars' guide ("HTML Escaping", the triple-stash), Nunjucks' templating
  reference (the `safe` filter), Pug's history (`!{code}`, since 0.6.0) and Svelte's reference
  (`{@html ...}`, with its own warning to escape what is not under the author's control).

Not settled here, and rowed with this seat's advice (TODO, the second reading, 4a): the
composer could refuse it. The registry already carries what each view's source places, so a
render could refuse a directive naming anything else, in every view `check` reads. It would
also refuse what the reader does not see in such a view, a slot inside a component that comes
from a package and a directive built in code, which render today. That changes what a view
may do, so it is the lead's to order.

Considered and not done:

- A rule in `check` against a raw form. It would refuse what is right, markup a project's own
  service builds, and it cannot see what a framework's raw form is handed.
- A mark on each directive its author wrote, new at every render, which one a value wrote
  would lack. Every template would be rewritten at build to carry it: a design of its own,
  larger than what it closes.

One of the changes made to break a spec found a hole in the spec. With a view's placement of
the child refused before dispatch, the page case stayed green: it asked which child each
parent held and not whether that child answered. It asks now, by the child's own markup, and
the same change turns it red.

Also corrected in this change: three times in the ledger's resume block had been typed
without a clock and were wrong by between twenty minutes and over an hour. Each push there now
carries the time its `ci` run was created at.

## 2026-10-10: the fault of a value written raw is the owner's to close

The lead read the push that said and held the second reading's fourth finding, and ruled the
same morning:

- **Closing it is the owner's choice, not this seat's and not the lead's.** It changes what the
  framework promises about access. It stands first on the estate's morning list, as SECURITY
  (item 0), and nothing for it is built into `next` until he has chosen. This seat had rowed
  its own proposal, that the composer refuse a name a view's source does not place, as the
  lead's to order; that row (4a) is rewritten as the fault itself.
- **The spec that holds the fault says so.** `conformance/specs/trust/raw.spec.mjs` was green
  while the hole was open, under a title that read as a statement of how things are. Its cases
  are titled KNOWN FAULT, and its head says their green is not soundness.
- **The outcome nobody disputes has a spec, red, on a branch.** A visitor with no credentials
  is not shown the ledger, however a directive naming it came to be in the page: the local
  branch `security/guarded-wherever-placed`, cut from this change and not pushed.
- **Three ways are written for him**, `docs/studies/placement-and-access.md`: the access
  decision follows the assembly wherever it is placed (the lead's advice as the root); the
  composer places only what a view's source places; or both.

Added with it:

- A second open page in the trust fixture whose view is written in Pug, since no reader sees a
  Pug view before it renders: the fault is held through a view `check` reads and through one
  it does not.
- Measured for the memo with the command line's own reader, over the examples and every
  fixture: 104 views, 97 read for what they place, 7 unread, every one of them Pug; 27
  recorded as placing a child. No example configures access. One fixture page shows a guarded
  assembly to everyone by its author's own directive, `/public/notice`, and a spec holds that.
- Found while reading for it, and rowed (4b): nothing counts the placements of one request.
  The composer's limits are depth and the size of one answer.

Also ruled: the lexer and parser Pug installs are not to be declared by the templates
renderer until Pug's own source and documentation have been read for a way through the
installed Pug to its parse tree. That reading is the first step of finding 3.

## 2026-10-10: every static view is read

The second reading's third finding, and with it the fifth. The design said what a view places
is "read from its source before any request", and named Pug as the one exception. The reader
found more left to the render, and three things that followed which no sentence said and no
spec held.

Found by the reader, and read again here:

- Unread, each silently: a Pug view; a template whose directive did not read once what its
  language computes was masked; a slot reached through a namespace import.
- For such a view, a deferred parent's children lost the stylesheets linked ahead for them
  (`core/src/server/local-assets.ts`); a page whose only browser half stood beneath one was
  refused a deferral or a stream at boot, though its render would have put the runtime on it
  (`opens-runtime.ts`, `placement-problems.ts`); and a missing name, a missing view or a loop
  was not refused at boot.

The lead's order was to make it true before saying it, and to add no dependency for it if the
installed Pug has a way to its parse tree.

Settled:

- **A Pug view is read from the tree the project's own Pug makes of it.** Pug's compile takes
  a list of plugins, and hands the tree its parser made to each one's `postParse`. Read in the
  installed `pug@3.0.4/lib/index.js`: `options.plugins` at line 81, `applyPlugins` at 43 to 47,
  the tree handed to `postParse` at 135 to 141, and `compile` passing the option through at 284. Its README says nothing of plugins: the door is in its source alone. A spec asks the
  installed Pug for a tree and goes red if a later one stops handing it over. Nothing is
  declared: neither Pug's lexer nor its parser is a dependency of ours.
- **The project's own Pug is found as its templates renderer finds it**, in `node_modules`
  beside where that package really is and in each directory above, never by asking node to
  resolve the name. Found by a spec written to be refused: under a test runner a package
  manager had started, node resolved the workspace's Pug, through `NODE_PATH`, for a project
  that had none.
- **The tree is written as the markup its directives stand in**, and the one reader of
  directives reads that, so a Pug view is held to the rules an html view is: a directive tag
  with every attribute it was given and whatever is inside it; text as written, since Pug
  writes it so; every other tag as its name around what it holds, so a script's text stays
  text; a comment as a comment. A tag whose own name is computed is not taken for a directive:
  only a render knows what it is.
- **A directive in a template that does not read as it is written is a finding**, where it
  was passed over, in EJS, Handlebars, Nunjucks and Pug. Passed over, the view passed `check`
  and failed whole at every render that reached the directive.
- **A build refuses a view whose placement cannot be read**, as it refuses a template that
  does not compile, and for the same reason. The other rules a view is held to stay `check`'s
  and boot's.
- **One that does not read only for what the template computes in it is still its render's.**
  `<assembly name="cart" {{#if x}}view="wide"{{/if}}></assembly>` does not read once the block
  is masked, and reads at every render. The first form of this change refused it, and would
  have refused a build over a view that works; the reviewer consulted before the push caught
  it. Such a view is unread, as it was, with no finding, and the design lists it among what a
  render alone knows. So a static view of a built project can still be without a record, and
  nothing here says otherwise.
- **A renderer's client imported whole is followed**: `client.Slot` and `client.slot`, in a
  module, a Svelte and a Vue view. So is a Vue slot written in kebab case, which Vue's own
  reference says a template may do (`vuejs.org/api/sfc-script-setup`, "Using Components"). An
  earlier record (S-07) listed both as unread; the third it listed, a slot in a component
  that comes from a package, still is, and the ledger's row for it stays open.
- **What a render alone still knows is said**, DESIGN 7, with what follows from it: a slot
  handed on under another name, a slot inside a component that comes from a package, a tag
  whose own name a template computes, what a value written raw holds, and a view of an
  assembly declared by hand that does not say what it places. Core holds each consequence
  with a spec of a view nothing read.
- **Finding 5 with it.** DESIGN 3.4 said a loop is refused at boot. That holds where each
  hop's view is written; a placement whose view is computed is held for its name alone, and a
  loop through one is refused at its render. The rendering fixture's loop is now such a one,
  an EJS view that places itself with a view its data gives. It had been a Pug view, which
  reached its render only because nothing read Pug.

Two specs were wrong, and a mutation found each:

- The spec of a Pug that throws as it loads never loaded the Pug that throws: node kept the
  one the case before had loaded from the same file. Each case has a project of its own now.
- Nothing asked for a block beneath a line of code, `- if (x)` with a directive under it.

Proof: fifty unit mutations, each alone, each red. Two went red only after the specs above
were corrected, and one only once it was written so that it compiled. Three around the
rendering fixture. With a Pug source never
read, the fixture's server would not start. With that and one page's deferral removed it
started, which is what says the deferral was what boot refused, and three specs went red: the
deferral, the stylesheet linked ahead, and the Pug view that places itself. With an assembly
let be its own ancestor, the loop's spec and the composition headers' went red.

## 2026-10-10: how many assemblies one request places

Found while reading for the fault of a value written raw, and rowed as 4b: the composer
settled every directive a template held, all at once, and its limits were depth and the size
of one answer. The lead ordered a limit as a plain guard, since it changes no promise about
access and so waits on nobody: beside depth and bytes in the same definition, refused the way
a loop is refused, its number chosen from a measure, and no setting for it.

Measured: every page of every example and of every project of every conformance fixture was
built, served and asked, and every envelope in its answer counted, nested and failed ones
among them. Forty-four pages. The most is 24, the rendering fixture's page of twelve parents
each holding a child; the next two place 13. Three pages whose routes take a parameter were
not asked, and by their templates place 2, 1 and 1. One example has no page.

Settled:

- **`limits.placements`, 256.** Ten times the most measured, which leaves a page of a hundred
  assemblies, each holding one of its own, room to stand. The server has no setting for it,
  and where a project would set one waits on the same question as the depth cap (the
  estate's morning list, item 6).
- **What counts** is every placement a request's templates write, at every depth composed in
  this process, the refused among them. Each takes its number where its template is composed,
  in the order written.
- **One past the limit is refused before dispatch**, as one too deep is: its fallback, a
  diagnostic and a log line with the reason `too-many`, and nothing rendered for it. Depth and
  a cycle are said first, and an abort last.
- **A deferred placement counts and is never refused**: nothing is rendered for it now. The
  request the browser later fills it with has a count of its own, and so has a request to
  another server. Each server bounds its own work.
- **What is counted is what the request composes.** A placement answered from the cache is
  one, whatever the answer holds, and at an assembly's own address the assembly asked for is
  not counted. So a page can hold more envelopes than the limit. The reviewer consulted
  before the push found the design saying "places" where the code bounds what is composed.
- **Refused is not free**, found by the same reviewer: each directive past the limit still
  takes an id, a failed envelope, a diagnostic and a log line. The design says so, and
  bounding it is rowed as 4c for the lead, since it touches what DESIGN 12 promises of a
  failed envelope's id.
- **The count is a function handed down with the request**, as its clock and its source of
  ids are, so the composer still owns no state.
- **Which placements are refused, past the limit, is not promised across templates composed
  at once.** Siblings render at once, and each numbers its children when its own markup is
  ready, so the order is the order they finished. Making it the order written would make
  every view's children wait on every view before it, on every page, for the sake of a
  request already past its limit. Within one template it is the order written, and how many
  are placed never varies. The lead accepted this on a condition for the specs, which they
  keep: they hold that the number placed never passes the limit, that a refused placement
  carries the reason, that nothing past the limit is rendered and that under the limit
  nothing changes, and none names which placements were refused across views.
- **`too-many` joins the design's list of reasons with `depth` and `cycle`**, which the second
  reading's finding 7 had found missing from it.

Also in this change, by the lead's word on the last: the directive that is refused and the
one left to its render are pinned side by side in one spec
(`cli/test/check/view-findings.test.ts`).

Proof: eleven unit mutations, each alone, each red. Two around the rendering fixture: with
the count never asked, the spec of what is past the limit and the spec of a page's views
together went red; with the count not handed to what a view composes, the second alone did.

## 2026-10-10: the design's listings are held to the source

The second reading's seventh finding: the listings in DESIGN 3.1 and 3.2 lacked `nested` on
an answer, `children` on a diagnostic, the plan as a record by name, the page, depth, path,
query and params the composer takes, two of the reasons, and `params` on a request. Each had
been true once. Nothing read them, so each fell behind as the code moved.

Settled, on the reviewer's advice to choose the method before editing:

- **A gate, not a note.** `scripts/check-design-listings.mjs`, run by `pnpm check` as
  `check:design`. Every type, interface and function `docs/DESIGN.md` declares in a `ts` code
  block is held to the declaration of that name in the source, found in the file the
  organization rules give it: the same members under the same names, each optional where the
  source's is and of the same type; the same members of a union; the same parameters and
  result of a function. `readonly`, comments and layout are the listing's to leave out. A
  name no source declares is a problem, so a listing cannot rename what it lists.
- **The listings are rewritten as the source has them.** `Reason` is `FailureReason`, its real
  name. The composer's signature is a declaration and its options a type, where it had been a
  sketch no parser reads. `Limits` is listed.
- **Found by the gate on its first run**, beyond what the reader had: a diagnostic's `view` and
  its `deferred` source, the name of a transport's parameter, and that a client renderer
  mounts into `Element | ShadowRoot`, where section 7 said `Element`.

Its self-test refuses eight ways of being out of step, each by name: a member the listing
lacks, one the source lacks, one required where the source's is optional, one of another
type, a method with other parameters, a union that lacks a member, a function with another
result, and a name no source declares; and passes a listing in step.

Corrected with it: the changeset, the ledger and the memo said one request "places" no more
than 256 assemblies, where the limit bounds what a request composes; a cached answer counts
as one whatever it holds. The design had been corrected before the last push and these had
not.

## 2026-10-10: what a refused placement costs

Row 4c, found by the reviewer consulted before the limit was pushed: a placement refused for
passing a request's limit still took an id, an empty failed envelope, a diagnostic and a line
in the log, so a stored value written raw that named ten thousand assemblies wrote ten thousand
lines on every visit. The lead decided it as this seat advised, as a guard that changes no
promise about access: one line a request for every such refusal, carrying how many, the
envelopes sharing its id, and one diagnostic the same way.

Settled:

- **The request's count keeps the account.** It is a `PlacementCount` now, made by
  `countPlacements`: it numbers the placements, and is told of each one refused for passing
  the limit. It answers the one id they all carry, minted when the first is refused, and at
  the end the one diagnostic: how many, the first of them, that id.
- **Each refused placement still leaves its empty failed envelope**, and the id on any of them
  finds the one line, so what DESIGN 12 promises of a failure's id holds.
- **Whoever began the count gives the account, once**: the composition that composed the
  request's first template. One that was handed a count leaves it to its owner. So the
  diagnostic and the line stand where the request does: on a page among the page's, at an
  assembly's own address among its children's.
- **An assembly's own address refuses an answer past the limit on bytes.** The lead asked that
  a flood's answer be under the limit on bytes or refused by it. Placed on a page it was
  refused. Asked for at its own address it was sent whole, 3.7 MB for ten thousand
  directives at 368 bytes an empty envelope: the content endpoint had no limit of its own. It
  answers `500` with its fallback envelope now, as for a render that throws, and logs why.
  This is beyond what the lead ordered, which named the line and the diagnostic, and is his
  to overrule.

Measured on the rendering fixture, a stored value naming an assembly ten thousand times: the
request renders 256 of them, 255 on a page whose own placement of the view is the first; it
writes one line for the 9,744, or the 9,745; and it answers in under 4 KB either way.

The gate on the design's listings went red on this change until they followed it: a count is
a `PlacementCount`, a diagnostic may say how many it accounts for, and the count's own type is
listed.

Proof: ten unit mutations, each alone, each red. Two around the rendering fixture: with a
refusal given an id of its own and the count never told, the spec of one id and one line and
both specs of the flood went red; with the byte limit not asked at an assembly's own address,
the flood's spec at that address did.

## 2026-10-11: a guarded assembly is guarded wherever it is placed

The owner ruled on the morning of 2026-10-10, typed to the lead (estate D1242): "protected
protected everywhere". Way A of `docs/studies/placement-and-access.md`, as the lead and this seat
advised: the decision an assembly's own address makes is made again at each placement, for the
visitor asking. Way B, the composer placing only what a view's source records, is not ruled and
is not built; it stays in the memo as a proposal.

Expected, in DESIGN 5.2 as it stood: one decision a request, of the address asked, and what that
address placed composed without asking again, so an open page showed a guarded assembly to
everyone. Found and measured on 2026-10-10 (the KNOWN FAULT spec): a visitor with no
credentials, whose value a view wrote raw, was shown an assembly whose own address answered them 401.

Settled:

- **The composer asks, the server answers.** `settlePlacement` asks `admitted(input)` after the
  refusals before dispatch and before the cache: a visitor who may not be shown an assembly is
  not shown another visitor's cached answer of it either. `Admit` is `(name, view) =>
Admission`, and the server binds it to the request in `admitFor(policy, headers, log)`, built
  on `decideAccess`, the one decision that exists: the spec that pins where access is decided
  now names four files, two of them callers of the one, none a second rule. Nothing of the
  visitor reaches the composer but the answer (DESIGN 5.1 holds).
- **Where it is asked.** `registerPages` asks for each of this server's assemblies a page
  places; `registerAssemblies` for each a view places under the content endpoint, so an
  assembly placed on a page shows the same as it answers at its address with the same
  credentials. A placement whose plan names a url is not asked about: that server decides of
  the request it is sent. A deferred placement is not asked about: the browser asks the address.
- **What a refusal shows and costs.** The declared fallback or an empty envelope marked failed
  with no id, a diagnostic with the new reason `access`, no log line: a visitor not let in is no
  failure. A check that throws refuses, and what it threw is logged against an id the envelope
  then carries, through `checkThrew`, the one line the hook writes for the same case.
- **Decided once a visitor.** `admitFor` keeps each assembly and view's answer for the length
  of the request, so the product's `authenticate` is asked once for each, as a `GET` of the
  assembly's address with what the visitor sent; a default view's two addresses are tried in
  order, the second only where the first refuses.
- **The fixture changes under the ruling**, as the lead said it would: `/public/notice` in the
  trust fixture placed the badge for everyone by its author's directive and now stands it
  empty for a visitor without credentials, and `inbound.spec.mjs` says so; the KNOWN FAULT spec
  is the spec of the rule, the red branch `security/guarded-wherever-placed` turned green by the
  code with its two cases unchanged in substance; a new page `/public/later` defers the ledger,
  to show the deferred case left to the address; and both boards' own addresses are opened
  (`/assembly/board/*`, `/assembly/pinboard/*`), the memo's remedy. The first run without the
  second showed the rule biting the fixture's own page: `/public/pinboard` stood its Pug board
  empty for a guest, since nothing had opened the board's address, and the two Pug cases passed
  with nothing inside to check; the boards' specs now also assert the board itself answered. With
  the board open, the rule shows at a content endpoint too: a visitor's raw value names the
  ledger there and is shown it only with credentials. The templates guide no longer says "for
  anyone who can open the page".
- **No setting.** Nothing turns the rule off: an assembly meant for everyone is opened by its
  address in `publicRoutes`, the memo's remedy, pinned in `admit-for.test.ts`.

## 2026-10-11: what stops when the asker leaves, and a placement whose settling threw

Row 8 of the second reading, two things in code and five in the design, taken as the lead ordered
after way A.

Expected: a page and an assembly's own address hand their composition the request's signal, as
the design says a composition nobody waits for starts no further work. Found: neither route did;
`compose` and `renderLocal` took a signal and were handed none, so a child's view whose service
took its time still composed its children for an asker who had left. Measured against a real
listening server (vitest, `app.listen` on port 0): a child whose service waits 150 ms and places a
grandchild rendered that grandchild for an asker that aborted after 30 ms. Fastify 5.12.1's
`request.signal` is what both routes read now (its `Reference/Request.md`: created lazily on first
access, aborts when the handler timeout fires or the client disconnects; `lib/request.js` attaches
`raw.on('close')` at that first access, and `lib/reply.js` removes the listener once the reply has
finished), read at the top of each handler before anything is awaited. A probe on this machine
showed the trap the lazy getter sets: for a POST whose body was read, the signal reads aborted
once the handler has consumed the body, since the request stream's close is the same event; both
routes here are GETs, and the spec holds them against a listening server on both Node versions
CI runs.

Settled:

- **The reason is `aborted`, not `timeout`.** A placement refused before dispatch because the
  request it belongs to had ended was given `timeout`, the reason of a deadline that elapsed,
  which an operator would read as the assembly's slowness. It is the request's own end now, its
  asker gone or a parent's deadline passed: `aborted`, in `FailureReason`, refused where depth,
  cycle and too-many are.
- **Accounted once a request.** Nobody is waiting for lines about a request nobody is waiting
  for. `PlacementCount.refuse(reason, name, view)` keeps one account a reason, `too-many` and
  `aborted` (`RefusedReason`), each under one id minted at the first, and `account()` answers one
  diagnostic for each reason met, in order. The design's listings follow and `check:design`
  holds them.
- **A placement whose settling threw shows what a failed one shows.** The composer's rejected
  branch rendered nothing and accounted an `invalid` with an empty id, so the page lost the
  placement without a trace a visitor or the log could follow. `failedSettling` renders the
  declared fallback or an empty envelope marked failed, under one id for the envelope, the
  diagnostic and the line; the diagnostic carries `cause`, what was thrown, and `logFallbacks`
  says it. The cache is not read for it, since the cache may be what threw: the one spec that
  reaches the branch is a `ContentCache` whose `get` throws, and only that placement fails. A
  placement declared required fails its page, as for any failure of its.
- **Five sentences in the design**, each read in the code first: a parent's deadline ends its
  child (3.3, the signal `settlePlacement` hands each request is the parent's and the deadline's
  together); the byte cap is measured with every child composed inside (3.4, measured on the
  rendered answer); a deferred fill sends no page id and composes under one of its own (3.5,
  `fillDeferred` sends id, depth and params); a page that first sees a remote's version waits up
  to a second for its manifest (2.3, `MANIFEST_DEADLINE` in `learnedManifests`); a slot whose
  name or view changes in the browser writes a directive nothing composes (7, the React slot
  makes a new object only then, and no runtime composes).

## 2026-10-11: three findings said

The last three rows of the second reading, each a read and a sentence rather than a change of
behaviour.

- **The slot's element is named** (finding 6). A React, Preact, Vue or Solid slot writes the
  directive inside `<div data-assembly-slot="name">`, because each of those frameworks needs a
  node of its own to be told to leave alone when the view renders again; Svelte, Lit, html and
  the templates write the directive bare. Making the six the same would take that node from the
  four, so the design says it instead: DESIGN 2.4 and 7 name the element and say the envelope
  stands inside it, and the four guides tell an author to lay the child out by that element and
  never by what is inside. No code changed.
- **The producer is asked at depth 7** (finding 10), one below the cap, where its child is still
  placed and marked no failure, beside the case at 8 where it is refused. The remote fixture:
  22 passing.
- **Lit's markers, read at the source** (finding 11). `@lit-labs/ssr` 4.1.0 `render` marks a
  value with `lit-part` comments unless it is a template of the package's server-only `html`
  (`isHydratable` in `lib/server-template.js`); a template of Lit's own `html` and a plain value
  are both marked. So the mount, which judges a Lit child by the markers it finds, and `check`,
  which judges by the renderer's name, agree on every view this renderer renders, and differ
  only on a server-only template, which never hydrates and is in no danger; `check` refuses it
  too, by name, which costs an author a shadow root they did not need. Held by a spec in
  `renderer-lit/test/server/render-to-markup.test.ts`, said in DESIGN 7.

## 2026-10-11: the envelope's words

The attributes of the envelope, the attribute on its data island, the one on a deferred
envelope's fallback and the two headers a content answer carries were spelled by hand at
every site that wrote or read one, in core's server and browser halves, the command line's
performance reader and the Lit renderer's mount. Spelled by hand in two places, a word can
drift, and the browser would read what the server never wrote.

Settled: four definitions in core's vocabulary, `ENVELOPE_ATTRIBUTE` (the nine attributes),
`ISLAND_ATTRIBUTE`, `FALLBACK_ATTRIBUTE` and `RESPONSE_HEADER` (the two headers), exported from
`@assemblejs/core`, the first from `@assemblejs/core/client` too, and every site reads its word
from them; a spec for each holds the words to what DESIGN 2.4 names. DESIGN 2.4 gains
`data-params`, which it had not named. Nothing a server sends or a browser reads changes, and
the conformance fixtures, which read the real bytes, say so.

The work was parked on a local branch on 2026-10-10 when the lead ordered the second reading
first. Brought onto `next` on 2026-10-11 by a rebase in a worktree of its own (two conflicts,
both an import line beside one way A added), then finished on `next`: after the rebase no site
in any package spelled a word by hand, including those added since the fork.

## 2026-10-11: the owner's seven answers

The lead put every question this seat held to the owner in one lump on the morning of
2026-10-11, each with a recommendation, and he chose (estate D1252). His option labels,
verbatim, with the rows each opens:

1. **Built-in components: "Plain HTML + tokens".** A-04 is built as the memo
   `docs/studies/built-in-components.md` proposed in that form: plain html assemblies styled by
   one tokens file every page links, and rules `check` holds them to; no framework component
   library.
2. **Versions: "One number".** The twelve packages share one version. Changesets is configured
   for it (fixed groups), the release-notes gate and a new project's manifest already assume it.
3. **The waiting change notes: "Yes", folded before the first publish.** The notes written
   since every package was set to `1.0.0-next.0` are folded into the first entry; the first
   publish ships them as one.
4. **One view per assembly: "One view".** As the design and the guides say today; nothing to
   build, and the framework's several views for a declared assembly stay as they are.
5. **A page's data across servers: "Only a server named trusted".** A page's query and route
   parameters reach another server's assembly only when the project declares that remote
   trusted; otherwise, as today, nothing of the visitor's is forwarded but the headers the
   remote declared.
6. **The nesting depth: "In the project's config file".** `assemblejs.config.ts` gets the field
   for `limits.depth`, read by the command line's server as `createServer`'s `maxDepth` is;
   whether the limit on how many a request places rides with it was tied to this question and
   is answered the same way.
7. **An agent's preview of a framework view: "Dev server, tool runs nothing".** The agent's
   tools render a framework view by asking the project's own running dev server, and never run
   the project's code themselves.

Also recorded by the lead the same morning: assemblejs.com is the owner's again, served from
the same CloudFront distribution through the ayers.repair prefix router; `/next/` is the
landing page as `next` has it, and `/` answers 404 until a stable release lands at
`/assemblejs/`. Two rows from that: the main landing page comes with the release alignment, and
assemblejs.com wants a 404 page of its own.

## 2026-10-11: the limits are in the config file

The owner's answer of this morning (D1252, "In the project's config file") to where a project
sets the depth cap; the lead had tied the limit on how many placements a request composes to
the same question, so both are answered by it.

Settled:

- **`limits: { depth, placements }` in `assemblejs.config.ts`**, `LimitsConfig`: each a whole
  number, each optional, one left out keeping the server's default (8 and 256). The config file
  is spread into the server's options as every field of it is, so `createServer` takes `limits`
  in place of `maxDepth`, which leaves; the limit on bytes stays the server's own.
- **Refused at boot outside its bounds**: a depth below zero or not whole, a count of placements
  below one or not whole, each named by `limitProblems` beside the access problems, before
  anything listens. A server allowed to compose nothing is a mistake and not a policy.
- **Shown as a setting.** `check`'s settings shape and the agent surface's described project
  carry `limits` as written, computed or unread, like every other field.
- **Held in the trust fixture** by a project of its own, `bounded`, whose config sets a depth of
  one and two placements: on its one page the chain's child is refused for the depth and the
  third placement for the count, accounted once, and the two inside the bounds render.

## 2026-10-11: one version

The owner's answer of this morning (D1252, "One number") to whether the twelve packages share one
version or keep one each. Each had kept its own, and after a first release that changed only
some of them the numbers would have parted, which a new project's manifest (`^<version>` of the
command line's own) and the release-notes gate were both written as if they never did.

Settled:

- **One fixed group**, `"fixed": [["@assemblejs/*"]]` in `.changeset/config.json`. The installed
  `@changesets/config` 4.0.0 expands the glob with picomatch and refuses a pattern that matches
  no package; changesets' own guide (changesets.dev/guide/fixed-packages, read 2026-10-11): "all
  packages in the group will be version-bumped and published together even when there are no
  changes", so "all packages will always have the same version".
- **A gate holds it**, `scripts/check-one-version.mjs` as `check:one-version` in the chain and
  in CLAUDE.md's gate paragraph: every `packages/*/package.json` names one version, the fixed
  group is exactly that one glob, and every package's name is under it. Its self-test goes red
  on a second version, a missing group, a partial group and a package outside the group.
- **Measured** in a clone of the repository with an install of its own: `changeset version` in
  pre mode moves every package to the same `1.0.0-next.N` and writes each package's changelog.

## 2026-10-11: the waiting change notes

The owner's answer of this morning (D1252, "Yes") to folding the change notes that gathered
since every package was set to `1.0.0-next.0` into the first entry before the first publish.
The first publish ships the tree as it stands that day as `1.0.0-next.0`, so a note describing
a change already in that version belongs in that version's entry, not in a bump to `next.1` the
publish never makes.

Settled:

- **`scripts/fold-changesets.mjs`** reads every pending changeset, its packages, bumps and note,
  and writes the note under `### Major`, `### Minor` or `### Patch Changes` of the version each
  package has now in its `CHANGELOG.md`, making the heading where it is missing and keeping the
  order major, minor, patch; then removes the changeset. Its self-test holds the shape it writes,
  the order, a second note under an existing heading, an older version left alone, and the
  refusal of a version the changelog lacks. No commit hash on a folded note: the first entry is
  one note per package, not a history.
- **Run once now** on the twenty-nine that had gathered, and to be run again by hand before the
  first publish for any that gather after, as the owner's step. The release-notes gate is
  unmoved: the version headings are the same.
- **`RELEASE_NOTES.md`** says in a paragraph what the first prerelease gained since its notes
  were first written, for a user; the package changelogs hold the detail.

## 2026-10-11: a trusted remote

The owner's answer of this morning (D1252, "Only a server named trusted") to whether a page's
data reaches another server's assembly. Read in the code first: the route parameters already
crossed to every remote as `assembly-params` (the remote fixture's `parameters.spec.mjs`), and
the query never did (DESIGN 5.1, "not the query string"); the question on the morning list was
the query's.

Settled:

- **`trusted: true` on a declared remote** hands it the page's query with each placement, on the
  content url it is asked at (`contentRequestUrl`), which that server's content endpoint reads
  as it reads any query; an untrusted remote is asked at the bare url, whatever the visitor
  typed. The route parameters keep crossing to every remote: a page's route is the author's,
  and the design and a spec already held it.
- **Refused at boot** when written as anything but a boolean, since a truthy string would hand a
  visitor's query to a server nobody meant to trust.
- **Held in the remote fixture**: the consumer trusts its producer, a page passes its query to
  the producer's `echo`, and the outbound spec goes on holding the query away from the hostile
  remote, which is declared and not trusted.

## 2026-10-11: the dev server renders for the agent

The owner's answer of this morning (D1252, "Dev server, tool runs nothing") to how an agent is
shown a framework view. The agent surface rendered a plain html view in process and refused every
other, since a framework or template view is source its renderer compiles and running the
project's code in the tool was never the design (13.6).

Settled:

- **`dev` records where it listens.** `.assemblejs/dev.json` under the root holds `{ url }` from
  the moment the server says it is listening until dev stops it, or restarts it on a change; the
  command line's io gains `remove` for it. The directory is already ignored by a new project.
- **The tools ask that server.** `devServerUrl` reads the record and asks the server's health
  before believing it, so a record a dead dev left is nothing; `devServerFetch` is the composer's
  transport for a running project, asking the content endpoint for each placement with the
  composition headers and the query, as a page asks another server. With a dev server running,
  `render_assembly` asks it for any assembly and `compose_page` for every placement, so what the
  agent is shown is what the project serves, services and all; without one, the tools do as
  before, and the refusal of a framework view now says to start the dev server
  (`needsTheDevServer`, in place of `needsABuild`).
- **The tool still runs nothing of the project's.** The one address it reaches is the dev server
  on this machine, at the recorded url, said in DESIGN 13.4 and 13.6.
- **The agent surface's tarball budget moves**, from 20500 to 21500 bytes: the two modules that
  find and ask the dev server packed it to 20817, measured by `check:pack`, and the budget is
  raised to hold them with the usual room, on purpose and with the measure, as the rule for a
  budget asks.

Corrected the same day, by "the tools ask the dev server as a composer asks" below: as this
landed, the tools sent ids the content endpoint refuses, and no request to a real dev server was
answered. The proof this entry rested on was a stand-in server in the specs.

## 2026-10-11: the tokens every page links

The first bite of A-04 as the owner chose it (D1252, "Plain HTML + tokens"): the tokens file and
its link, as `docs/studies/built-in-components.md` proposed and left to the seat to decide.

Settled:

- **One file, `src/tokens.css`**, custom properties at `:root`: the estate's colour roles as the
  site's own skin names them (`--surface`, `--surface-panel`, `--border`, `--ink`, `--ink-muted`,
  `--accent`, `--accent-strong`, `--accent-alt`, `--accent-wash`, the three faces), three scales
  (`--space-1..4`, `--text-1..4`, `--corner`), and a dark scheme rebinding the colours under
  `prefers-color-scheme`. `new` writes it with placeholder values that pass their contrast; the
  look is the author's to set there and nowhere else.
- **Carried whole and unscoped.** `writeTokens` reads the file, carries every file it names as an
  assembly's sheet is carried, and writes it to the build named by its content's hash, so a
  changed token is a new url. It is not scoped to an envelope: a custom property at `:root` is
  inherited by every assembly, one in a shadow root included, and a scoped selector would reach
  none of them.
- **Linked first on every page.** `createServer` takes `styles`, the urls every page links before
  any assembly's sheet; the built project declares the tokens there, and `pageAssets` puts them
  ahead. A project without the file has no tokens and links none.
- **What follows**, in bites as the memo laid them out: the invariants `check` holds the tokens
  to, the stylesheet of components and the starter's use of it, the element readers, and the
  five rules.
- **The command line's tarball budget moves**, from 73000 to 76000 bytes: the starter now ships
  the tokens file, 1.3 kB of CSS that every new project needs, and the writer that carries it,
  which packed the command line to 74586, measured by `check:pack`. Nothing could leave first:
  the tokens are the bite. The stylesheet of components will move it again, with its measure.

## 2026-10-11: the tokens hold their contrast

The second bite of A-04 (D1252, "Plain HTML + tokens"): the invariants the memo gave each colour
role, held by `check`.

Settled:

- **The numbers are WCAG 2.2's.** Text against its ground at 4.5:1 or more (1.4.3, level AA) and
  what identifies a control at 3:1 or more (1.4.11, level AA), by WCAG's own definitions of
  relative luminance (`L = 0.2126 R + 0.7152 G + 0.0722 B` over linearised sRGB channels) and
  contrast ratio (`(L1 + 0.05) / (L2 + 0.05)`), read from the specification on 2026-10-11 and
  held in `relativeLuminance` and `contrastRatio`.
- **Which pairs.** The inks, `--ink` and `--ink-muted`, against each ground text is set on,
  `--surface`, `--surface-panel` and `--accent-wash`, at 4.5:1; the accents, `--accent`,
  `--accent-strong` and `--accent-alt`, against the two surfaces at 3:1. Twelve invariants, in
  `TOKEN_INVARIANTS`, each with its WCAG criterion in its words.
- **Both schemes.** `readTokens` reads the light scheme at the top of the file and the dark one
  as the light rebound by what the `prefers-color-scheme: dark` rule declares, as the browser
  would have it; each invariant is held in each.
- **Only what the reader is certain of.** A role bound to a variable, a named colour or nothing
  is not judged; a hex colour is. A file the reader cannot parse is one finding where it breaks.
- **One rule**, `tokens-hold-their-contrast`, in `RULE_IDS` and `RULES` with its reason and its
  smell, run by `check` with the project's other findings and answered by `explain`. The
  starter's tokens pass it in both schemes, which the spec holds.
- **The command line's tarball budget moves**, from 76000 to 78000 bytes: the five modules of
  this bite packed it to 76761, measured by `check:pack`. Each bite of A-04 that adds code moves
  it with its own measure; none is guessed ahead.

## 2026-10-11: the components HTML has

The third bite of A-04 (D1252, "Plain HTML + tokens"): the stylesheet of components the memo's
option A describes, written by `new` beside the tokens, and the starter's use of it.

Settled:

- **A component is an element HTML already has, a class, and the tokens.** `src/components.css`
  styles the button (`.button`, and `button` itself), the field with its label (`.field`), the
  link, the list, the table, the notice and the dialog, each with its focus ring
  (`:focus-visible`, as the estate's kit draws it) and its states (hover, disabled, invalid, the
  dialog's backdrop). Every value is a token or a plain length; the sheet names no colour of its
  own, which the spec holds, so the colour rule to come has nothing to refuse in it.
- **Carried and linked after the tokens.** `writeProjectStyles` replaces `writeTokens`: the two
  project sheets, each optional, written whole and unscoped and named by content, in that order,
  which is the order every page links them. Unscoped on purpose: the components style the
  elements every kind of view writes, so a scope would reach none of them.
- **The starter uses it.** The new project's one assembly is a notice holding the greeting and a
  link to the tutorial styled as the button, so a project's first page already reads as set,
  and the agents fixture holds that markup through the tools and the built server. A modal
  `dialog` is styled and not opened: the starter ships no script, and HTML's own attributes for
  opening one (`command`, `commandfor`, read on MDN 2026-10-11) are newer than the element and
  not yet baseline across browsers, so the starter does not rely on them.
- **The command line's tarball budget moves**, from 78000 to 80000 bytes, as the tokens' decision
  said it would: the components the starter ships, 2 kB of CSS a new project needs, packed it to
  78575, measured by `check:pack`.

## 2026-10-11: the elements a view writes

The fourth bite of A-04 (D1252): the element reader for the views written as markup, which the
rules about markup need, as the memo said, one level deeper than what S-07 built for placements.

Settled:

- **One tokenizer of start tags**, `readElements`: each tag outside a comment and outside a
  script, style, textarea or title, through core's own `inertSpans`, with its attributes as
  written, quoted, unquoted or bare, names lower-cased as the parser reads them, the first of a
  repeated attribute kept as the parser keeps it, and `computed` where the template's marker
  stands anywhere in the tag, so a rule knows a render may write more there.
- **The masking shared.** `markedTemplate` and `COMPUTED_MARKER` leave `templatePlacements` for
  modules of their own, read by the placement reader and the element reader alike, so the two
  can never disagree on what a template computes; a plain html view is its own markup.
- **`templateElements`** reads html, EJS, Handlebars, Nunjucks and Pug views through them, and
  Markdown as writing no element of its own; a source that cannot be read as markup is left to
  the render, undefined, as its placements are.
- **Nothing refuses yet.** The readers for modules, Lit, Vue and Svelte follow, then one bite a
  rule.

## 2026-10-11: the elements a module writes

The fifth bite of A-04 (D1252): the element reader for views written as modules, React, Preact
and Solid through JSX and Lit through its templates, as the memo laid it out.

Settled:

- **JSX is read off the syntax tree `check` already builds**: esbuild's automatic runtime
  compiles each element to a call of `jsx`, `jsxs` or `jsxDEV` with the tag as a string and the
  props as an object, and `scriptElements` reads those calls, under whatever names the module
  imports them from a `jsx-runtime` or `jsx-dev-runtime`. A prop written in place is kept, a
  computed one stands as the marker, a boolean written `true` is a bare attribute, a spread makes
  the element computed, and a component, whose tag is not a string, is passed over as nothing
  the browser sees here.
- **Lit through its templates**: each `html` template's fixed parts, joined by the marker where
  its expressions go, are read by the same tokenizer the template views use.
- **Names are lower-cased** as the browser reads them (`className` reads as `classname`, which
  the rules account for). `at` is where the element stands in the compiled module, near enough to
  find the tag by; a finding names the file and the tag.
- **Nothing refuses yet.** Vue and Svelte follow, then one bite a rule.
- **The command line's tarball budget moves**, from 80000 to 82000 bytes: the module reader
  packed it to 80782, measured by `check:pack`.

## 2026-10-11: the elements Vue and Svelte write

The sixth bite of A-04 (D1252): the last two element readers, as the memo laid them out: the
markup of a Vue or Svelte component read as elements, with the same tokenizer as the rest.

Settled:

- **Vue**: the `<template>` part as markup, every `{{ }}` standing as the marker. An attribute
  bound with `:name` or `v-bind:name` is the attribute `name` with the marker for its value and
  makes the element computed; a directive (`v-if`, `v-for`, `@`, `v-on:`, `#slot`) writes no
  attribute the browser reads and is left out; `v-bind` of a whole object makes the element
  computed. A component with no template writes no element.
- **Svelte**: everything outside the script and style, every `{ }` expression standing as the
  marker from the inside out where they nest, so a block is text between tags and `alt={value}`
  is the attribute with the marker for its value; a spread makes its element computed.
- **One tokenizer for all six kinds of view** now reads the elements: `templateElements`,
  `scriptElements`, `vueElements` and `svelteElements` all end in `readElements`, so no two
  readers disagree on what a tag or an attribute is. The rules follow, one bite each.

## 2026-10-11: a view has no inline style

The first rule of A-04's markup rules (D1252), on the element readers the bites before built.

Settled:

- **`viewElements`** reads every assembly's elements by its view's kind, as the placement reader
  reads its placements: the view and, for a framework view, each component it is split into,
  Pug through the project's own Pug, and leaves out a view it cannot read, so the rules say
  nothing of what the reader is not certain of.
- **`a-view-has-no-inline-style`** refuses a `style` attribute on any element, written or
  computed, in any of the six kinds of view: `style="..."` in markup, `style={{ }}` in JSX,
  `:style` in Vue (read as `style` bound), `style={look}` in Svelte. The reason is the memo's: a
  style attribute does nothing under the default content security policy (DESIGN 5.2), and it
  is a value invented where it is used, where the tokens and the stylesheet are the one place a
  look is set (DESIGN 10). The finding names the assembly and the element and says to move the
  style into a `.css` file in the assembly's directory.
- **Next**: `an-image-has-an-alternative`, `a-control-has-a-name`, `a-colour-is-a-token`, each
  its own bite.
- **The command line's tarball budget moves**, from 82000 to 84000 bytes: the aggregator and the
  rule packed it to 82549, measured by `check:pack`.

## 2026-10-11: an image has an alternative

The second markup rule of A-04 (D1252), on the same element readers.

Settled: `an-image-has-an-alternative` refuses an `img` with no `alt` attribute at all, in any
kind of view. An empty `alt` passes, since it says the image is decoration; an `alt` the view
computes passes, since it is present and only a render knows its text; an `img` the view spreads
attributes onto is left alone, since the spread may carry the alt and the reader cannot see it.
The reason is WCAG 2.2's, 1.1.1 at level A: non-text content has a text alternative that serves
the equivalent purpose. The finding names the assembly and says to give the image an alt that
says what it shows, or `alt=""` if it is decoration.

## 2026-10-11: a control has a name

The third markup rule of A-04 (D1252), on the same element readers.

Settled: `a-control-has-a-name` refuses an `input`, a `select` or a `textarea` with no name the
reader can find, in any kind of view. What names a control is read from the HTML accessibility
API mappings (W3C HTML-AAM, section 4.1, read 2026-10-11): `aria-label` or `aria-labelledby`,
then the `label` element, then `title`, then for a text field and a textarea `placeholder`; an
input of type button is named by its `value`; a submit, reset or image input takes a default
when it has none, a hidden one is not shown, and a `button` is named by its content. The reasons
are WCAG 2.2's at level A (read 2026-10-11): 3.3.2, "labels or instructions are provided when
content requires user input", and 4.1.2, the name of every user interface component can be
programmatically determined.

What the reader is certain of is the bound of the rule, as with the two before it:

- A `label` names a control by its written `for` (`htmlFor` in JSX, which the reader lower-cases)
  matching the control's written `id`, in any file of the view.
- A `label` may wrap a control, which the reader of start tags cannot see: one with no written
  `for` that stands before the control in its file, or in any other file of the view, where the
  component tree is not read, spares the control. A `<label>Name</label><input>` with no `for`
  therefore passes, the limit of a reader that does not pair end tags.
- A control the view spreads onto, or whose type it computes, is left to the render; so is one
  with a computed id while any label of the view has a computed `for`.
- A `button` is never judged, since its name is its content; the memo's "a button with none"
  is read as the input of type button, whose value is an attribute.
- An empty naming attribute is no name: `aria-label=""` or a bare `title` is refused.

The finding names the assembly and the control and says to give it an id and a `label for` it, or
to wrap it in a `label`, and that an `aria-label` names a control that shows no label. Two leaf
files carry what the rules share: `spreadElement` (moved out of `element-problems.ts`) and the
pair `WrittenElement`, which `viewElements` now returns.

The command line's tarball budget moves, from 84000 to 86000 bytes: the rule and its leaf files
packed it to 84432, measured by `check:pack`.

## 2026-10-11: a colour is a token

The last rule of A-04 (D1252), on the stylesheets `styleProblems` already parses.

Settled: `a-colour-is-a-token` refuses a literal colour in any declaration of an assembly's
stylesheet, a custom property of the assembly's own included, when the project has
`src/tokens.css`; a project without the file has no tokens to read and is held to the markup
rules alone, as the memo said. A literal colour is a hex colour, one of the colour functions of
CSS Color Level 4 (`rgb`, `rgba`, `hsl`, `hsla`, `hwb`, `lab`, `lch`, `oklab`, `oklch`, `color`;
its sections 5.1, 7, 8, 9.3, 9.4 and 10.1, read 2026-10-11) with what it holds, or one of the
148 named colours of its section 6.1, in any case. `transparent` and `currentcolor` decide no
colour of their own and pass; so do a string, a `url()` and the name a `var()` reads, which the
reader blanks before it looks, so `var(--red)` and `url(red.png)` are not colours set there. A
stylesheet the reader cannot open or parse is `styleProblems`' finding already and is passed over.
The finding names the assembly, the property, the colour and the line, and says to read a token
instead, a colour the tokens lack being a new role there. The reason is the memo's: a colour is
one decision, made in one file. With it the seven answers of D1252 are all built.

The command line's tarball budget moves, from 86000 to 88000 bytes: the rule, with the 148
names, packed it to 86282, measured by `check:pack`.

## 2026-10-11: the domain's 404 page

P5-8's second half, as far as this repository reaches.

Found: `site/404.html` linked its kit, skin, mark, icon and pages by relative paths, and a
distribution serves a custom error page at whatever address was not found, so on
`assemblejs.com/docs/nowhere.html` every one of those paths would resolve under `docs/` and
miss. Fixed: every path on the page is absolute from the domain's root, which the prefix router
sends to `/assemblejs/` (`ayers.repair/infra/cloudfront/prefix-router.js`, read 2026-10-11).
Until the promotion of `next` to `main` puts the main channel there, the page served from the
`next` prefix reaches for a kit that is not yet at the root, which is the state the row names.

Not this repository's: the company distribution maps 403 and 404 to `/404.html` at the bucket's
root, the business site's page (`README-functions.md` there, config read 2026-09-23). For the
domain to show this page, its error response names `/assemblejs/404.html`; whether the domain is
a distribution of its own or an alias of the company's is in AWS, not in any repository, and
this seat has no credentials to read it. The morning list carries it.

Amended the same day from the lead's reading of AWS: assemblejs.com is its own distribution today
and moves this week onto the one ayers.repair site distribution as an alias with every product
domain (D1265). Custom error responses are per distribution and cannot differ by Host, so the
domain's 404 page is the shared `/404.html` of ayers.repair, reading the Host and showing the
product's words and links, each domain mapped to its prefix by the router there; that work is
Astra's, in ayers.repair, not this repository's. `site/404.html` here keeps its absolute paths:
it is the page a visitor to `/assemblejs/404.html` sees, and the words Astra's page shows for this
product. By the owner's order of 2026-10-11 the product domains answer 404 at the edge until he
launches each, so assemblejs.com shows nothing until his word; the `next` prefix on the
ayers.repair address stays this seat's proof surface.

The ledger's rows the Phase 5 bites had already closed are checked off here, each with its
commit: the depth cap (P5-1), the page's query across servers (P5-4), the content endpoint's
signal (way A), one version (P5-2) and A-04 itself.

Also in this pass, the ledger's duplicate-key row: `eslint .` does lint the config files, and
`no-dupe-keys` is in the recommended set, but typescript-eslint's `eslint-recommended` turns it
off for `.ts` files on the ground that the compiler reports a duplicate, and no tsconfig includes
a config file, so a probe file with `test` declared twice linted clean (exit 0, 2026-10-11). The
core rule is turned back on for `*.config.{ts,js,mjs}`; the same probe now fails the lint.

## 2026-10-11: the house editorconfig

The ledger's row: adopt the house `.editorconfig` with a byte-equality drift test.

Settled: the root `.editorconfig` is platform/codestyle's file, byte for byte, as the kit's README
asks of every first-party repository ("Copied byte-identical into every first-party repo", read
2026-10-11). The kit's own workflow notes that this repository, being public, does not check
platform out with a credential in CI, so the drift test here is a hash, not a `cmp` against a
checkout: `check:editorconfig` holds the file to the canonical's sha256 at platform `v0.54.1`
(the file last changed before `v0.21.0`; the site-kit pin `ayersPlatform` is `v0.20.4`, which
predates it, so the pin cannot serve), and refuses a nested `.editorconfig` as magpie's drift
test does. Re-syncing is copying the file and recording the new hash and tag. What changes for
an editor: Markdown keeps its trailing spaces (a hard line break), Go would indent with tabs, and
the indent width is stated per language rather than for every file; Prettier reads the same two
values it read before, so no formatted file changes.

## 2026-10-11: the eslint pin

The ledger's row: one eslint version with the kit, or a stated reason.

Settled: one version. eslint moves from 10.9.1 to 10.10.0, the kit's pin (platform/codestyle
`package.json`, read 2026-10-11; the registry has 10.10.0 since 2026-10-02 and a 10.11.0 the kit
has not taken). The plugins admit it by their peer ranges, read in `node_modules`:
typescript-eslint 8.69.0 and eslint-plugin-import-x `^8.57.0 || ^9.0.0 || ^10.0.0`,
eslint-plugin-unicorn `>=10.4`, `@eslint/js` `^10.0.0`. `pnpm lint` ran green at the new version
before the commit; syncpack finds one version across the workspace.

## 2026-10-11: an unread declaration leaves the route unknown

The ledger's row on `pageRoute`, found 2026-10-10.

Found: `declaredRoute` answered the directory's route for every declaration that was not read as
an object, so `export default makePage()`, `export default { ...base }` and a file with no
default export all read as "declares no route", where the first two may carry one and the third
the build refuses (the registry imports the declaration's default and spreads it into the page,
`generate-pages.ts`). Settled: a declaration the reader did not get as a literal is unknown, as a
computed route already was; an object with a spread among its entries is unknown too, since the
spread may carry the route; a literal that is not an object (`export default 5`) leaves the route
implied, which is what spreading it into the page does at run time. `check` then holds nothing
against such a page's route, the shape shows it computed, and `perf` says the route is not written
as a literal. Two mutations, each alone, watched red.

## 2026-10-11: the guides on a slot behind a package name

The ledger's row: DESIGN 7 says a slot inside a component that comes from a package is a render's
alone; the framework guides did not. Each of the six (React, Preact, Vue, Svelte, Solid, Lit) now
says, in its paragraph on the slot, that `check` reads the slot in the view and in each component
of the project the view imports by a relative path, and that a slot inside a component from a
package is decided by nothing before a request. The wording is the design's; the sentence stands
where a reader meets the slot, not in a section of its own.

## 2026-10-11: the build reads inside the root

The ledger's row, found 2026-10-10: four reads of the build opened files directly, held only by
discovery's refusal of a link out before the build runs.

Settled: every one goes through the root guard. The source hash (`sourceVersion`) and the files a
stylesheet names (`carryReferences`) read bytes, so they open `readFileSync(insideRoot(root,
file))`, the same guard `readInside` is built on, where a text read would hash a binary source as
text; the assemblies' and the project's stylesheets (`writeStyles`, `writeProjectStyles`) read
through `readInside`. A file whose path is inside the project but which is a link to a file
outside it is refused unopened with `OutsideRootError`, one spec apiece, each written against the
unguarded read first. Discovery's refusal stands before them; this closes the gap for a link
written after discovery, or a path the build reaches that discovery did not list.

## 2026-10-11: the contract as an agent reads it

The ledger's row for the third fixed resource DESIGN 13.3 names.

Settled: `assemblejs://contract` answers a structure, not prose: the contract version, the route
prefix and the default view, the three endpoints with what each answers and refuses, the five
composition headers with their shapes, the two response headers, the manifest's eight fields and
the envelope, its element, the attributes always written and the ones written when they apply,
the island's script type and attribute, the fallback template's attribute and the placement
directive. Every name is core's own constant (`CONTRACT_VERSION`, `ASSEMBLY_ROUTE_PREFIX`,
`DEFAULT_VIEW`, `COMPOSITION_HEADER`, `RESPONSE_HEADER`, `ENVELOPE_ELEMENT`,
`ENVELOPE_ATTRIBUTE`, `ISLAND_SCRIPT_TYPE`, `ISLAND_ATTRIBUTE`, `FALLBACK_ATTRIBUTE`,
`PLACEMENT_ELEMENT`), so a rename there renames here in the same build; the meanings are this
surface's sentences, written for an agent that will implement the contract elsewhere, never a copy
of DESIGN 2. The manifest's field names are the one list written by hand, and the spec holds it to
the keys of a real server's manifest, as it holds the response headers to a real content answer,
the envelope's element and attributes to its body, the island to its script, and the refusals to
a malformed header and an unknown assembly. The instructions `new` writes name the resource, and
the agents fixture expects it among the listed ones.

The agent surface's tarball budget moves, from 21500 to 24000 bytes: the resource packed it to
23228, measured by `check:pack`.

## 2026-10-11: compose_page by name

The ledger's row: `compose_page` took a template, so it could not know the policy a page declares.

Settled: `compose_page` takes a page by its name. `composePage` finds the page as discovery does,
reads its template and its declaration through the root guard, reads the policy as `check` reads
it (`readPagePolicy`), turns it into the server's placements (`pagePlacements`: each field kept
when written as the server's type, left out when computed or wrong) and plans it with core's own
`pagePlan`, so the plan is the one the server would make. A placement from another server, by a
url written or computed, is composed deferred and its url dropped: the surface reaches no network
(DESIGN 13.2), and a deferred envelope is what the browser fills on a served page. A page the
project has not, or a declaration that cannot be read, is a problem the agent acts on. The
template path stays as `composeTemplate`, which `composePage` calls; the prompts, the
instructions `new` writes and the agents fixture call the tool by the page's name.

The agent surface's tarball budget moves, from 24000 to 25000 bytes: the page reader packed it
to 24039, measured by `check:pack`.

## 2026-10-11: a placement inside an open paragraph

The ledger's row on placement context, found 2026-10-09 (DECISIONS 2026-10-09, S-02).

Found: a directive inside an open `<p>` composes an envelope the browser then tears: the parser
closes the paragraph at the first block the assembly holds (its `section`, its `div`), and the
rest of the assembly's markup, its data island included, lands outside the envelope and outside
the paragraph, so the island is not found and the assembly does not hydrate. Nothing said so.

Settled: `findPlacements` refuses a directive that stands inside a paragraph the parser has not
closed, and since every reader of the directive calls it (`check` on a page's template and on a
view, the server at boot, the composer on a page and on a view's rendered markup) the one refusal
reaches each. What closes a paragraph is read from the HTML parser's "in body" insertion mode
(html.spec.whatwg.org, parsing, read 2026-10-11): `</p>`; the start tags whose rule opens "If the
stack of open elements has a p element in button scope, then close a p element" (address,
article, aside, blockquote, center, details, dialog, dir, div, dl, fieldset, figcaption, figure,
footer, header, hgroup, main, menu, nav, ol, p, search, section, summary, ul, h1 to h6, pre,
listing, plaintext, hr, xmp); and the end tags that generate implied end tags, those of the same
elements and of li, dd, dt, td, th, tr, tbody, thead, tfoot, caption, form, table, button, body
and html. An end tag of an element opened inside the paragraph leaves it open, as the parser
does; a tag inside a comment or a raw-text element is no tag. The scan is of start and end tags
before the directive, not a full tree, so it errs only toward passing: a paragraph closed by an
end tag this list lacks reads as open to nothing, since only an open one is refused.

The other elements the parser closes on its own (`li`, `dd`, `dt`, `option`, the table parts) are
closed by their own siblings' start tags, not by a block inside them, so a placement inside them
is not torn the same way and is not refused.

The core tarball budget moves, from 75000 to 78000 bytes: the paragraph scan packed it to 75281,
measured by `check:pack`.

## 2026-10-11: registrations for the clients beyond the three

The ledger's row from A-01: one registration per client, after its documentation is read.

Read 2026-10-11, each client's own documentation:

- Gemini CLI reads `.gemini/settings.json` in the project, servers under `mcpServers`, each with
  `command`, `args` and optionally `cwd`, `env`, `timeout`, `trust`; no transport field. A
  registration is written, the command and its argument the project's own server, started where
  the CLI runs, which is the project.
- opencode reads `opencode.json` (or `.jsonc`) from the project root, the directory it runs in;
  a local server stands under `mcp` with `type: "local"` and one `command` array. A registration
  is written in that form, the one place a command is an array, which the readers, the writer
  and the agents fixture take.
- Codex reads `~/.codex/config.toml` and, for a trusted project, `.codex/config.toml`: TOML, one
  `[mcp_servers.<name>]` table. The command line's registration reader and writer are JSON and
  stay so; the instructions give the one line, `codex mcp add assemblejs -- node <path>`.
- Zed takes a server under `context_servers` in its settings; its documentation shows the user
  settings file and does not say a project's `.zed/settings.json` holds the key, so none is
  written, and the instructions say the entry of `.mcp.json` is what to paste.
- JetBrains AI Assistant has no project file: servers are added in the IDE's settings, which
  take the `mcpServers` JSON shape pasted or imported. The instructions say so.

The McpRegistration type gains `mcp` among the keys a client lists servers under; the writer and
the drift check were already generic over the key. The agents fixture starts each written
registration as its client does: the two new ones from the project's root.

## 2026-10-11: a placement inside an element's shadow root

The ledger's row found 2026-10-09 on the fragment scanner: a `slot()` written in a Lit element's
`render` places a child inside the element's own declarative shadow root. Reproduced at the
markup, which is where it is decided: an envelope inside `<template shadowrootmode="open">` has
its stylesheet linked in the page's head by `localAssets`, which tracks an assembly's shadow root
and not an element's, and a sheet in the head does not reach into an element's root. The child
would stand unstyled.

Settled: the directive is refused where it is read, as the paragraph case is. `findPlacements`
refuses a directive that stands inside a declarative shadow root not yet closed (one pass over
the template's `<template>` tags, counting depth so only the roots among them count), so the
composer, the server at boot and a view at render say the same thing, and `render_assembly`
hands the agent the reason. Linking the sheet inside was the other way, and it is not taken: it
would rewrite what another renderer wrote, and an element's root is the element's own; a child
belongs in the view's template, outside the element, where the page styles it. `check` reads a
Lit view's slots from its module and does not yet tell those in an element's `render` from those
in the view's template; a view that places one is refused at the render the agent asks for, and
by the build's render of it, not by `check` first. That reading is a row of its own.

## 2026-10-11: check reads a slot in an element's render

The row the entry above opened, closed the same day.

Settled: the module reader (`scriptPlacements`) walks the tree knowing where each node stands,
the class it is in by name and whether it is inside that class's `render` method, and a slot
written there is reported in a new field of what a view places, `shadowed`, shown as
`<Class>.render() places "<name>"`, and is no placement of the view's. `viewFindings` turns each
into a finding, `a-placement-stands-outside-an-element`, with the composer's reason: the child
would stand in the element's own shadow root, where the page's stylesheets do not reach. Any class
counts, not only one that extends `LitElement` by that name: a Lit element may extend a base of
the project's own, and a `render` on a class in a view is an element's in every case this reader
meets. A slot in another method of the class is the view's as before, since only `render` writes
the shadow root.

## 2026-10-11: the reference's retired pages

The ledger's row found 2026-10-10: nothing was deleted from the bucket, so a symbol's page the
reference no longer generates stayed reachable, and whether the deploy's role could delete was
not known here.

The lead read the role from IAM on 2026-10-11: `gh-deploy-assemblejs-site` holds `s3:PutObject`,
`s3:GetObject` and `s3:DeleteObject` on `assemblejs/*` of the site bucket, `s3:ListBucket` on the
bucket, and the two invalidations. A delete is within the grant.

Settled: never `--delete` across the product's prefix, since the `next` channel's prefix stands
under it and a main deploy would erase the channel; the reference alone is mirrored, `aws s3 sync
site/docs/api/ .../docs/api/ --delete --size-only`, after the three syncs that upload with their
headers. The AWS CLI reference (s3 sync, read 2026-10-11): `--delete` removes what the destination
has and the source has not, filters excepted; `--size-only` makes size the one criterion to copy.
Every file under docs/api was uploaded moments before at the same size, so the mirror copies
nothing and no object loses its content type or cache control; it deletes. The workflow runs on a
push that touches `site/`, so the step is first exercised at the next such push, not by this one.

## 2026-10-11: the reference runs once per package

The ledger's row found 2026-10-10: typedoc's check that a public signature names no unexported
type never fired here. Read in typedoc 0.28.20's `dist/index.js` (`validateExports` and its
intentionally-exported helper): a referenced type whose package is not the project's passes, and
one typedoc project over twelve packages made that every type. The remedy the row named is the
one taken: typedoc's `packages` entry point strategy (typedoc.org, Options.Input and
Options.Package_Options, read 2026-10-11), which converts each package as a project of its own
and merges the results into one site, so a type's package is the project's and the check holds.

Settled: the root `typedoc.json` names `packages/*` under that strategy and, in `packageOptions`,
the conversion options each package takes (its own `tsconfig.json`, externals and internals
excluded, no readme); each package carries a `typedoc.json` of its own naming its entry points,
since the strategy copies nothing from the root and the packages' entry points differ. The
rendering options stay at the root. `tsconfig.typedoc.json`, the one program over twelve
references, is gone: each package is read through its own. `check-reference.mjs` reads the entry
points from the packages' files and holds them to the packages' `exports` as before; the check
that each entry's package was referenced by the removed tsconfig goes with it, and its self-test
says so.

Watched red before it was trusted: a probe run of the strategy found `VueBlock`, an interface the
command line's `VueDescriptor` names in its public fields and no entry point exported, and
`MountMode`, which the core's client entry exports and the probe, reading each package's
`src/index.ts` alone, did not see; the real configuration reads every entry point and holds the
first alone. `VueBlock` is exported now, from its own file, as the repository's one-declaration
rule asks of it. What the site serves changes in one way: a package with several entry points is a
node of its own, `@assemblejs/core`, with its three specifiers as modules under it, where one run
over the twelve laid every specifier flat; a package with one entry point is one module, as before.
Nothing in the site links a module page by its path, only `docs/api/index.html`, and the reference
still reads by the specifier a user imports.

## 2026-10-11: the kit at v0.54.3

The ledger's row on a note's subsections, the last that waited on the kit.

The fold was cut here on the lead's word (platform branch `asm/codestyle-note-fold`, `4a93154` on
`6b989c6`, the kit's test watched red first) and tagged by the cto seat as `v0.54.3` (`69c72d4`,
with a docs commit of its own). Verified at the source before the pin moved: the tag's `kit.css`
holds the three rules, and every role the kit references at that tag, thirteen, is bound by this
site's `skin.css`. `ayersPlatform` moves from `v0.20.4` to `v0.54.3`, thirty-four tags in one
step, since the deploy stages the kit at the pin and nothing else in this repository reads it.

`site/release-notes.html` takes the reference's shape, read from magpie's page: a status line and
an introduction under the version, then h3 groups each with a list, where it had a definition
table. Its words are brought to what the tree holds on this day, since the page is hand-kept for
a user and the version is not yet published: the registrations name Gemini CLI and opencode, the
agent surface renders every kind of view through the dev server and reads the contract, and
`check`'s five rules on a view stand named. The page as text is regenerated with it.

## 2026-10-11: the mark of a mounted assembly

Found: the built-page proof (`browser/built.browser.ts`) failed three times today and passed on
each rerun, on "Clicked 0" or "nothing yet" after a click. It waited for every island's script to
be gone, which the runtime does when it starts, before any assembly's module has arrived, and
then clicked a button whose handler React had not yet attached. The server's markup was doing its
job; the proof was asking too early, and nothing on the page said when an assembly was live.

Settled: the runtime writes one mark, `data-mounted`, on an envelope once its renderer has
mounted the assembly, and removes it when it unmounts it (`MOUNTED_ATTRIBUTE` in core's
vocabulary, beside the server's words and not among them: `renderEnvelope` never writes it, which
a spec holds). A static assembly, declared `none`, is never marked. The proof waits for the mark
on both assemblies before it clicks. A page, a test or a person has the same signal, which the
design lacked: section 9 says it now. A retrying click in the proof would have hidden the race
and said nothing to anyone else.

The fix's own run then showed the same race in the styles proof, a click on a remote assembly's
button before React had mounted it. Seventeen clicks across eight proofs each waited for something
else, the islands read, the network idle or the markup's text, none of which is the mount; so one
helper, `clickMounted` in `browser/mounted.ts`, now stands at every click: it reads the control's
own envelope, through a shadow root where the assembly has one, waits for the mark, then clicks.
The runtime proof's assertion that a static envelope lacks `data-hydrated`, a word nothing ever
wrote, reads `data-mounted` now, the word the runtime does write.

## 2026-10-11: one rule for a commit's header

The ledger's row from the house style rulings: when the shared house check set lands, hold
commitlint and the house's shell script to the same verdict on the same messages, so one rule
does not become two.

The set has landed: platform/codestyle carries `check-conventional.sh`, and a cross-test of its
own, `cross-test-conventional.sh`, twelve messages through both. Read at `v0.54.4`: that cross-test
needs a sibling checkout with commitlint installed and its self-test skips green without one, so
where it runs alone it holds nothing. This repository has commitlint in its own CI, which makes
it the one place the two can be run together on every push.

Settled: `check:commit-rule`, in `pnpm check`. The house's script and the two files it sources
(`gates_range.sh`, `codestyle_key.sh`) are byte-copies under `scripts/house/`, from platform's
`v0.54.4` tag, held to their hashes as the root `.editorconfig` is; the kit's README says this
repository vendors the kit's scripts rather than checking platform out. The gate runs 33 messages
through `commitlint` (21.2.2, config-conventional, this repository's config) and through the
script's `--message` mode, and holds each verdict to the one recorded.

Measured, not assumed: the two agree on 25, the house's own twelve among them, and part ways on 8.
Read against commitlint's own sources in `node_modules` (`@commitlint/is-ignored` `defaults.js`,
`@commitlint/config-conventional` `index.js`):

| message                                 | commitlint | house script | why                                                                                           |
| --------------------------------------- | ---------- | ------------ | --------------------------------------------------------------------------------------------- |
| `feat(): add the thing`                 | passes     | refuses      | an empty scope is no scope to commitlint                                                      |
| `feat: add the thing ` (trailing space) | refuses    | passes       | `header-trim`                                                                                 |
| `Merge branch 'main' into next`         | passes     | refuses      | commitlint ignores a merge; the script skips one in a range and judges it in a hook           |
| `fixup! feat: add the thing`            | passes     | refuses      | commitlint ignores `fixup!`, `squash!`, `amend!`                                              |
| `1.0.0`                                 | passes     | refuses      | commitlint ignores a message that is a version alone                                          |
| `Revert fix: the thing`                 | passes     | refuses      | commitlint ignores everything that begins `Revert `; the script takes git's quoted form alone |
| a body line over 100 characters         | refuses    | passes       | `body-max-line-length`; the script reads the header alone                                     |
| a footer line over 100 characters       | refuses    | passes       | `footer-max-line-length`; the same                                                            |

None is this repository's to settle: which side is right in each is the house's rule, and the
script is platform's. They are recorded as differences and held as such, so one that closes at a
re-sync, or turns around, or a new one that opens when either side is upgraded, is a red here.
Sent to the lead with the table. Watched red on the real tree, each alone and restored: a verdict
of the rule recorded wrong, a difference recorded that is none, and the house's script edited to
take another type, which the hash refuses before any verdict is asked.

Found beside it, and a row of its own: nothing in CI reads a commit's header at all, and the
sign-off is read on a pull request alone.

## 2026-10-11: CI reads every commit

Found with the entry above: CONTRIBUTING asks a conventional header, a sign-off and no attribution
trailer of every commit, and `scripts/check-trailers.sh` says of the sign-off that "nothing else
enforces it, so it runs both locally and in CI". In CI it ran on a pull request alone, and every
commit in this repository is pushed, so the job has been skipped on every run; and the header was
read by the husky hook and by nothing else. A commit made with `--no-verify`, or on a machine
without the hooks, reached `next` unread.

Settled: the job is `commits`, on a push and on a pull request, two steps: `commitlint --from
--to` with the repository's own config, the hook's judge and no second one, then the trailers
script over the same range. A pull request is read for its own commits, as before. A push is read
from a floor to the tip and not for the push's own range: `ci.yml` cancels the run in flight when
a newer push arrives, and with a range per push that run's commits would never be read. The floor
is the repository's first commit, `c565074`, named in the workflow: the 184 commits above it pass
both steps today, read here, with 14 warnings from commitlint on a footer with no blank line
before it, which are not errors. The cost is seconds.

What a floor commits the branch to: one commit that fails either step turns every later run red,
on a branch that is never rewritten. That is the intent, since the alternative is a rule a single
`--no-verify` passes unseen; and the way out is named in the workflow, moving the floor above
that commit with the reason recorded here, never loosening a step. A squash merge of a pull
request with several authors is the case to know: GitHub writes a `Co-authored-by` trailer into
the squash message, which the trailers step refuses, so the one who merges edits it out, as
CONTRIBUTING's "no other attribution trailer, ever" already asks.

Watched before it was trusted, the two steps run on a clone: green on the history as it stands;
red, both, on one commit with no conventional header and no sign-off; red on the trailers alone
for a signed commit with an attribution trailer. The workflow itself is proven by its first run.

## 2026-10-11: what failed on the dev server

The ledger's row from DESIGN 13.3: what is wrong on a running server, per placement, with the id
that finds it in a log. It waited on how an agent is shown a running project, which the owner
settled ("Dev server, tool runs nothing", D1252) and P5-5 built.

Found in what P5-5 built (`dev-server-fetch.ts`, read 2026-10-11): an assembly that failed on the
dev server answers its fallback envelope under a 500, marked `data-failed` with the id its failure
is logged against (DESIGN 2.1), and the transport dropped the body and answered `status` with no
id, so the composer minted one of its own that is in nobody's log. And an answer that stood with a
child fallen back inside it said nothing at all: the composer holds no account of another server's
children (`diagnostic.ts`, on `children`), so the agent was shown a page with no problems. The design's own sentence, that a
placement that fell back looks identical in the markup and the account is what says it did, did
not hold through the dev server.

Settled: the transport reads the markup, which is where another server's failures are written.
`failedEnvelopes` reads every envelope marked failed with its assembly and its id, by the element
reader the command line already has. A failed answer is answered with the server's own id, so the
tool's account and its fallback envelope carry the id the dev server's log has, and the problem
says so. Each placement that fell back inside an answer that stands is said as a problem with its
own id. The cause is not said: it is in the log, as it is for any server (12), and an id is what
finds it. `fallbackProblems` takes what a transport said of placements no account here holds; the
local transport says none, and nothing of its account changes.

The two specs that carried one dev-server fixture, word for word, share it now from
`test/fixtures/dev-server.ts`, with the two assemblies this needs. Five mutations, each alone,
watched red.

Corrected the same day: an envelope marked failed with no id was said to have its reason in the
server's log, and it has none. Read in `compose/admitted.ts`, `settle-placement.ts` and
`server/log-fallbacks.ts` ("a visitor not let in is no failure"), and held
by the trust fixture (`inbound.spec.mjs`, the badge that "stands empty"): a placement the server
will not show to the one asking is answered with `data-failed=""` and nothing is logged, since a
refusal for who is asking is no failure. The tool says that now, in place of pointing at a log
that holds nothing.

## 2026-10-11: the tools ask the dev server as a composer asks

Found while proving the entry above against the artifact: P5-5, as it landed this morning
(`5a08454`), never worked against a real dev server. `render_assembly` sent `assembly-id:
preview-<name>` and `compose_page` `preview-<n>`, both with `assembly-page: preview`. The content
endpoint holds each to one uuid and answers a malformed value with a 400, never a coerced default
(DESIGN 2.1; `read-composition-headers.ts`). Measured with a probe against a server made by
`createServer`: both tools' ids answered 400, uuids answered the envelope. So with a dev server
running, every assembly was refused and every placement on a page fell back, and the owner's
answer, "Dev server, tool runs nothing", was recorded as built when it was not. The specs were
green because the dev server in them was a hand-written stand-in that answers whatever it is sent,
and no fixture ran the tools against a server of the framework.

Settled:

- **The tools send what a composer sends.** A uuid for the page and for every id, as the server's
  own pages do. The stable `preview-` ids go; nothing held them, and a tool that composes is a
  composer.
- **A refusal says why.** A request the server refuses answers, as JSON, the id it logged the
  refusal against and a line for each header that did not fit. The transport carries both, so an
  agent reads "assembly-id is not a uuid" where it read "answered 400". This defect would have
  been one line on its first day.
- **The specs' dev server is real.** `test/fixtures/dev-server.ts` is a server of the framework,
  listening, with an assembly whose service throws and one whose view places an assembly the
  server has not; the ids the tools report for what failed are held to that server's own log.
  The transport's own spec keeps a scripted server, to read what was asked of it, and sends ids
  of the contract's shape.
- **The agents fixture asks.** In the project as `npm create` wrote it, with its built server
  running and recorded as `dev` records its own, `compose_page` and `render_assembly` are called
  through the installed MCP server: every placement answered by the server, none rendered here.

Watched red before the fix: the five dev-server specs against the real server with the ids as
they were sent, each on "answered 400"; and the fixture's step, run once with the old page id,
on the tools' own new words, "the dev server refused the request for "hello" (400): assembly-page
is not a uuid". The mechanism that let it through is closed in two places,
the real server in the specs and the step in the fixture; a stand-in no longer stands between the
tools and the contract.

Found beside it, a row: `render_assembly` answers `data: {}` through the dev server, though the
island in the html it answered holds what the service returned.

## 2026-10-11: the data a run returned

The row found with the entry above, and with it the last of what DESIGN 13.3 named as wanted and
not given: the shape of an assembly's data, "known to a run of it or to the project's types and
to no reading of a file".

`render_assembly` answers the html, the data and the account together (`RenderedAssembly`), and
it answered `data: {}` on every path. Rendered here that is true, since a plain html view is
rendered with no service. Through the dev server it was false: the server ran the service, and
the island of the envelope it answered carries what the service returned.

Settled: `islandData` reads the island of the envelope with the id the tool sent, found by the
opening the server writes it with and ending at the first end of a script, which the island's
encoding never holds (`encodeIslandJson` escapes `<`). One path for both transports: rendered
here the island holds no data and the answer is empty as before; through the dev server it is one
run's data. That is the run the design asked for, on the terms the owner set for a running project
(D1252, "Dev server, tool runs nothing"): the dev server runs the service, the tool reads the
answer. A reading of the project's types stays unbuilt and unasked for. The data endpoint was not
used, since it would run the services a second time for what the first answer already holds.

The agent surface's tarball budget moves, from 25000 to 27000 bytes: today's work on the dev
server's path, the ids, the refusal's words, the failed envelopes and the island, packed it to
25378, measured by `check:pack`.

## 2026-10-11: the eleventh dossier's verification

The ledger held one row of Phase 1 open since September: the eleventh dossier, the browser
runtime's, verified, "its first verifier died mid-run and the second one's outcome was never
recorded", and it called the dossiers outside this tree. Both were wrong. The dossiers are on
this machine in `docs/dossiers/`, which the repository ignores, as the first entries of this file
decided; and the second reader's record is among them, written the same night as the dossier.

Its verdict: trustworthy with corrections. It confirms what a builder leans on hardest, and it
finds four claims wrong and several imprecise, each with the reference's own lines beside it.
The four, in this product's words: that the predecessor mounted a framework's components by a
second path of its own, where there was one path and an adapter that looked its own root up and
did nothing, silently, when the lookup missed; how many renderers it shipped; the form of the
script that registered an assembly's browser half; and where the uniqueness of an id was held.

Held against the public record, read whole for it on 2026-10-11: no sentence of DESIGN, of this
file or of PLAN rests on any of the four as the dossier had them. The design that was built is
the corrected finding: one mount path, and a renderer's browser half that is handed the element
already resolved and returns a handle or throws (DESIGN 9; the comment on `hydrate` in the React
renderer says so in the reader's own terms). The row is closed. The record itself stays where
the dossiers stay.

The acceptance table that the plan's B-24 names, every intent from the predecessor's tests
mapped to a test here or struck with its reason, was marked outside this tree for the same
mistaken reason and is workable here; it is the next entry's.

## 2026-10-11: the acceptance table

The plan's B-24, second half, carried by B-27a: every intent from the predecessor's tests either
mapped to a test here or struck with its reason. The tests were read whole in September, and the
dossier of that reading ends in its own acceptance list: fourteen behaviours a fresh
implementation must reproduce, three things to redesign, and five questions it left open. Those
twenty-two are the intents; the rest of that suite the dossier itself cut, as tests that assert
nothing. Each is set out here in this product's words, with the test in this tree that holds it
or the reason it is not carried. Every path was opened on 2026-10-11, not recalled. The dossier's
own citations stay with the dossier.

The fourteen behaviours:

| #   | the intent                                                                                                                     | here                 | held by, or struck because                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | A view's renderer is chosen from what the view is, and an unknown one is refused                                               | mapped               | the file name says the framework, and an extension two frameworks share is refused without its infix: `packages/cli/test/discovery/renderer-for-view.test.ts`; a view whose renderer the project has not installed is refused by `check` and by the build (`a-view-needs-its-renderer`: `packages/cli/test/build/load-compilers.test.ts`, `packages/cli/test/check/check-project.test.ts`)                                                                                                                                       |
| 2   | The steps that make a view's data run in a known order                                                                         | mapped, redesigned   | services run in declaration order, one after another where it says `after`, then the view's own data on top: `packages/core/test/service/run-services.test.ts`, `order-services.test.ts`, `packages/core/test/server/resolve-data.test.ts`. No page-wide or global step: a service belongs to a view                                                                                                                                                                                                                             |
| 3   | One address scheme per assembly: content, data, manifest; and a health address                                                 | mapped               | DESIGN 2: `packages/core/test/server/register-assemblies.test.ts`, `create-server.test.ts`, and from the tarballs over HTTP `conformance/specs/contract/` (content, data, envelope, manifest, parameters)                                                                                                                                                                                                                                                                                                                        |
| 4   | The content route's pipeline: static files first, a cache with a default lifetime, never in development, a header saying a hit | struck in part       | static files are served from a list made at boot: `packages/core/test/server/register-assets.test.ts`. The cache is a placement's, and only where its page declares a lifetime: `packages/core/test/compose/placement-cache.test.ts`, `content-cache.test.ts`, `cache-key.test.ts`. No default lifetime, no switch on the mode, no header: nothing is cached that nobody asked to be, and a rule keyed on a mode string is the predecessor's largest class of defect (DESIGN 4). A hit is said in the account, `source: "cache"` |
| 5   | The manifest never carries what is the server's own                                                                            | mapped, inverted     | built by naming each field that goes in, where the predecessor removed three and shipped the rest: `packages/core/test/server/build-manifest.test.ts`                                                                                                                                                                                                                                                                                                                                                                            |
| 6   | Only an allowed part of the server's context crosses to the browser                                                            | mapped               | six named fields and nothing else, headers and cookies included: `packages/core/test/envelope/project-island.test.ts`; the rule `nothing-crosses-but-json`                                                                                                                                                                                                                                                                                                                                                                       |
| 7   | Events: an address, a payload, and a late subscriber can read what it missed                                                   | mapped, redesigned   | typed, page-scoped, owned by the assembly: `packages/core/test/client/events/`. The bounded queue of the last ten becomes the last message on a topic that declared it: `create-bus.test.ts` ("keeps only the last one, not a history nobody reads")                                                                                                                                                                                                                                                                             |
| 8   | A child's rendered bytes become a string before its parent's template                                                          | struck               | there is no such step to need it: a parent's view places a child by the directive, and the composer replaces the directive in markup that is already a string (DESIGN 3.2)                                                                                                                                                                                                                                                                                                                                                       |
| 9   | Each view is wired to its routes; the developer's route exists only in development                                             | mapped               | three endpoints per assembly, mounted by one function: `register-assemblies.test.ts`; the devtools routes "are not mounted at all in production": `packages/core/test/server/register-devtools.test.ts`                                                                                                                                                                                                                                                                                                                          |
| 10  | A view's scripts and stylesheets are found by reading its rendered template                                                    | struck, replaced     | an assembly's files are the build's to declare, and a page links them from the envelopes it serves: `packages/core/test/server/local-assets.test.ts`, `page-assets.test.ts`, `hoist-assets.test.ts`. Nothing is scraped from markup                                                                                                                                                                                                                                                                                              |
| 11  | Two assemblies or two views of one name are refused at load                                                                    | mapped               | "refuses a duplicate name, which would otherwise be a silent shadow": `packages/core/test/server/boot-problems.test.ts`; in a project a directory is an assembly, so its name is unique by the file system                                                                                                                                                                                                                                                                                                                       |
| 12  | A container of named services: one of each, the later replaces, a missing one throws                                           | struck               | there is no container. A service is a function a view declares; a name declared twice is refused, and so is an `after` that names a service nobody declared (`packages/core/test/service/order-services.test.ts`), and two contributors that declare one field of the data are refused at boot (`boot-problems.test.ts`)                                                                                                                                                                                                         |
| 13  | Access: who must sign in, and that a failed sign-in is refused                                                                 | mapped, redesigned   | `packages/core/test/access/`, and from the tarballs `conformance/specs/trust/` (54 specs). Not keyed on the mode: every control defaults closed, and an enabled one without its credential is a boot failure (DESIGN 4, 5)                                                                                                                                                                                                                                                                                                       |
| 14  | The small contracts under the predecessor's utilities: validation, patterns, escaping, an error's mapping to a status          | mapped where carried | escaping: `packages/core/test/encode/`; the one pattern a name is held to: `packages/core/test/vocab/segment.test.ts`; a failure's body and its log line: `packages/core/test/failure/`. Each lives in the directory that owns its concept; there is no utilities directory to carry a pattern bank in (CLAUDE.md, rule 6)                                                                                                                                                                                                       |

The three it said to redesign:

| the intent                                                                                                                         | here   | held by                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The server and its controllers testable without being coupled to where their module lives                                          | mapped | `createServer(options)` is handed its config, its log and its assemblies, and is asked through `inject` with nothing listening: `packages/core/test/server/create-server.test.ts`                                        |
| A fresh context for each request, in place of one shared and reset                                                                 | mapped | the composer is pure, template and transport in, markup and account out (DESIGN 3.2): `packages/core/test/compose/compose.test.ts`; a service is given its own request, "not another assembly's": `resolve-data.test.ts` |
| Real coverage of nesting, of another server, of hydration in a browser, of a generated project that builds and serves, built first | mapped | `conformance/` from the packed tarballs over HTTP, five fixtures; `browser/` in a real browser, 42; the agents fixture in a project as the starter wrote it                                                              |

The five questions it left open, as the design answered them:

| the question                                                         | the answer                                                                                                                                                | where                                                                                                      |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Are lifecycle hooks the product's own surface?                       | No. The server hands out its own Fastify instance, and declares no hooks of its own to test                                                               | `App.fastify`, `packages/core/src/server/app.ts`                                                           |
| Is the data endpoint a second pass through the content route?        | No. One function produces the data and both endpoints call it                                                                                             | DESIGN 2.2; `resolve-data.ts`                                                                              |
| Keep the bounded replay queue, or subscribe before publish?          | Neither: the last message, on a topic that asks for it                                                                                                    | DESIGN 9; row 7                                                                                            |
| Does anything rest on a weak hash?                                   | Nothing can: every hash in the packages is SHA-256, seven uses in six files, the build's file names and versions and the comparison of a basic credential | `packages/core/src/access/matches-basic.ts` and the command line's `build/` and `styles/`, read 2026-10-11 |
| What is the suite's gate: behaviour, mutation, or a coverage number? | Behaviour, each probe watched failing by a mutation aimed at it; no coverage number is configured anywhere                                                | CLAUDE.md, "a probe is watched failing"; no threshold in any `vitest.config.ts`                            |

Counted: of the fourteen behaviours, ten are mapped, four of them redesigned or inverted, one
is struck in part, and three are struck, each with what stands where it stood. The three
redesigns are mapped. The five questions are answered by the design as built. Nothing in the
list is left neither mapped nor struck.

B-27a's other two parts, the Scorecard run and the publish dry run with provenance, are Actions
and the owner's first publish, and stay with him.

## 2026-10-11: the sentences go back up

On 2026-10-10 seven places said an agent renders the assembly it adds, and the agent surface
rendered a plain html view and refused any other, so each was brought down to what held, with a
row to bring them back when the surface could show a framework view. The owner's answer settled
how (D1252), P5-5 built it, and the row was ticked this morning without the sentences going back,
on a build that, as the entries above record, did not work until this evening.

They go back now that the claim is proven from the tarballs against a built server, each in the
form that holds, both halves said: any view through the project's running dev server, a plain
html one with nothing running. The landing page's paragraph and its row in `site/LANDING.md`; the
root README; the agent surface's README; the instructions `new` writes into `AGENTS.md`, which
told an agent the tools show such a view nowhere; the brief for adding an assembly, whose fourth
step told it the same; the start page. DESIGN 13.3 and 13.4 and the two tools' own descriptions
were brought current with P5-5 and its correction.

In the same pass, the lists of clients a new project is registered for, which named three in the
root README, the agent surface's README, the tutorial and the start page, name the five the
command line writes since this afternoon.

Not done here, and a row: the hero line the owner asked for on 2026-10-09 is on no page. What
backs it is built; where it stands on the front door is with the lead.

## 2026-10-11: the hero line stands on the front door

The owner's line of 2026-10-09 is the landing page's headline, on the lead's go of this evening,
which needed no new word from him: he asked for the line, and the entry of that day settled that
it is a claim with a row. "One page. Every framework.", the headline until now, is the line
beneath it. Its row in `site/LANDING.md` stays, and the new line has a row of its own.

- **The spelling is the tree's.** His own words had the term as one word. The product's own
  definition and the core package's published description hyphenate it, so the headline does:
  "The first micro-frontend framework for AI-enabled development", one spelling on every
  surface a reader sets side by side.
- **The markup.** The two lines are one heading group, `<hgroup>`, the heading and a paragraph
  beside it, which is the element HTML has for this (MDN, the `hgroup` element, read 2026-10-11:
  it "allows the grouping of a heading with any secondary content, such as subheadings, an
  alternative title, or tagline", each "a `<p>` element within the `<hgroup>`"). The headline's
  two hyphenated words are each kept on one line, because a phone's width broke the first at its
  hyphen. One rule styles the line beneath, in the display face and the accent, both tokens. The
  page was drawn in the sealed browser at 1280, 768, 390 and 320 pixels wide and read at each.
- **The text files.** `scripts/site-page-text.mjs` takes the paragraph beneath a page's `<h1>`
  as what the page is, and `llms.txt` prints the landing page's. Read as any other paragraph,
  the line beneath the headline would have taken the describing paragraph's place there. So the
  reader learned the heading group: its paragraph is said where it stands, and is never the
  page's description. The generator's self-test was given a title in a heading group and
  watched red twice before the reader changed: the element with no way of being said, then,
  read as a plain container, the wrong paragraph in the index. `llms.txt` is byte for byte what
  it was; `llms-full.txt` has the new title and the line beneath it.
- **What backs "the first".** Nothing in this repository can prove a first, and the row says
  so. The half a gate holds is "for AI-enabled development": the agent surface, what `new`
  writes, the prompts, the `agents` fixture. "The first" rests on two web searches of
  2026-10-11 that found no micro-frontend framework shipping an agent surface or saying this of
  itself, recorded with their date so that the day it stops being true is findable. No
  competitor is named, here or on the page.
- **Not moved.** The page's `<title>`, its `description` and its `og:description` are as they
  were, the last of which still opens with the older line; whether a shared link should lead
  with the new one is the lead's or the owner's. Every other block of the page is as another
  seat left it on 2026-10-11 (`d37f901`). The public cut of the page is the owner's; this is
  `next`, and staging.

## 2026-10-11: one commit rule

The cto settled the commit rule the same evening `check:commit-rule` recorded eight messages on
which commitlint and the house's script parted: one verdict for each, and a commitlint config
the kit ships beside the script, `codestyle/commitlint.config.mjs`. It is platform `9595638`,
tagged `v0.55.0` at `c120253`, which this seat read on the remote with `git ls-remote` before
copying anything.

| the message                         | the rule   | the side that moved                                           |
| ----------------------------------- | ---------- | ------------------------------------------------------------- |
| `feat(): add the thing`             | refused    | commitlint, which took an empty scope for none                |
| `feat: add the thing`, then a space | refused    | the script, which allowed a trailing space                    |
| `Merge branch 'main' into next`     | not judged | the script, which judged a merge in a hook                    |
| `fixup! feat: add the thing`        | not judged | the script                                                    |
| `1.0.0`                             | refused    | commitlint, which let a bare version by                       |
| `Revert fix: the thing`             | refused    | commitlint, which let by every message that begins Revert     |
| a body line of 101 characters       | refused    | the script, which read the header alone                       |
| a footer line of 101 characters     | refused    | the script; every line after the header, a URL's own excepted |

What is not judged is what git itself writes: a merge, a revert or a reapply in git's quoted
form, an autosquash marker. A revert written by hand takes the `revert` type like any header.

- **Copied, byte for byte, and held to their hashes**: the script, changed; the kit's config,
  new; the two files the script sources, unchanged. Four files under `scripts/house`, their
  hashes and the tag in `check:commit-rule`.
- **This repository's commitlint is the copy.** The root `commitlint.config.mjs` re-exports
  the copy's default, and the `.cjs` it replaces is gone, so the hook, CI's `commits` job and
  the gate judge by one object. A re-export, not `extends`: nothing here rests on how
  commitlint merges an extended config's `ignores` and local rules.
- **The fixtures are one verdict a message**, 51 of them: the kit's own self-test lists first,
  18 it accepts and 16 it refuses, then the edges. No difference is recorded. The form for one
  is kept and proven on a made-up message in the self-test, because an upgrade of either side
  can open one: that is a red here and a finding for the kit, and until the kit answers it the
  difference is written down with its reason and held.
- **Watched red three times before green**: the new script against the hash recorded for
  `v0.54.4`; the old rows against the new script, which reported five differences closed; one
  verdict a row with commitlint still on its defaults, seven reds, among them a comment line
  and git's scissors line, which only the kit's config reads the script's way. Green came
  with the config switched and nothing else, which is also the proof that the re-export
  carries the kit's ignores and its two rules.
- **The formatter would have rewritten the copy at commit.** The pre-commit hook runs the
  formatter and the linter's fixer on every staged `.mjs`, and the kit's config has lines
  wider than this repository's. Measured before the ignore: the formatter called the copy
  unformatted. `scripts/house` is in `.prettierignore` and in the linter's ignores, each with
  its reason, and after the commit the committed copy is hashed again.
- **The history passes.** CI reads every commit from a floor. Under the new config the 195
  commits from the first to this one give no error and 14 warnings, each a footer with no
  blank line before it; the script, asked for each of the 194 that are not merges, refuses
  none. Both measured here before the push, because one refused commit turns every later run
  red.
- **`CONTRIBUTING.md`** says the three things a contributor can now be refused for that the
  old sentence did not: a header over 100 characters, an empty scope, a long line with no URL.
- **Not moved: the pin.** `ayersPlatform` stays at `v0.54.3`. It names the site kit the deploy
  stages, `sitekit/` is byte for byte the same from there to `v0.55.0`, and the new tag's own
  CI was still running; the row says when it moves.

## 2026-10-11: the description leads with the headline

The lead decided, within the owner's order for the hero line: the landing page's `description`
and its `og:description` take the headline sentence, and its `<title>` stays the product's
name. Each leads with the sentence and keeps what it said after it. The description is more
than a search result's snippet here: `scripts/site-llms.mjs` prints it as the one line that
says what the site is, at the head of both text files, so the sentence that describes the
product stays behind the one that sells it. `og:description` reads as the page does, the
headline and then the line beneath it, and keeps its last two words. Both text files are
regenerated; their first line is the new description.

## 2026-10-11: no browser on this machine

The desktop session of this machine died at 19:17:13 on 2026-10-11, and every terminal session
with it. The journal has the shell killed by signal 9 and names no sender; it has no line from
the kernel's out-of-memory killer and none from the memory-pressure daemon. The lead then gave
the estate's standing ruling, D1276: no browser process on this machine by any seat or lane,
the sealed launcher included, until the owner changes it.

- **What this seat had run**, said in full because the ruling follows it: the sealed launcher
  seven times between 19:11:33 and 19:12:10, headless, to draw the landing page for the entry
  above. The first two were stopped at launch by AppArmor's limit on user namespaces. The
  five that drew ran with the sandbox off, the flag Playwright itself passes whenever
  `chromiumSandbox` is not set true (read in playwright-core 1.62.1), and all had exited by
  19:12:10. Then the check chain, to 19:15:48, and a commit at 19:15:58. Nothing of this
  seat's was running when the shell died, and the journal logged no application scope for
  those launches. That shows no cause. The ruling does not wait for one.
- **From here** no session of this repository starts a browser on this machine, for a
  screenshot, a walk or the Playwright suite. The browser proof runs in the `browser proof`
  job of `ci`; a browser assertion is watched red and then green there, on a push. A page's
  look is read from its markup and stylesheet, and the staged page with curl. S-06's finding
  of 2026-10-09, that the proof runs here through the sealed launcher, describes what was
  done until this evening.
- **`CLAUDE.md` still says otherwise.** Its Tooling paragraph tells a session to run the proof
  here. The lead asked this seat to amend it. A session does not edit an instruction file at
  another session's request, whichever way the edit leans; the paragraph waits for the owner's
  own word, and a row holds it. The handoff block in `docs/TODO.md` and the seat's memory carry
  the ruling until then, so no session of this seat acts on the old paragraph.

## 2026-10-11: one pin

`ayersPlatform` moves from `v0.54.3` to `v0.55.0`, and the tree names one platform tag where it
named three: the site kit's, which is the pin; the root `.editorconfig`'s, `v0.54.1`; and, since
this evening, the commit rule's, `v0.55.0`. The deploy's own comment has said from the start
that a product has one platform pin and everything platform-sourced comes from it. Nothing held
the copies to that.

- **Read before the move.** Platform's own `ci` on `c120253`, the commit the tag names, is run
  38184256522, green on its four jobs, read here; the cto had said a line would come only if it
  went red, and silence was not taken for green. `sitekit/` is byte for byte the same from
  `v0.54.3` to `v0.55.0`, so the deploy stages what it staged. The house `.editorconfig` hashes
  the same at `v0.54.1`, `v0.54.3` and `v0.55.0`. Each of the five copies was compared with
  that tag's file, byte for byte, before its record was moved to it.
- **The gate.** `scripts/platform-pin.mjs` reads the pin, and `check:editorconfig` and
  `check:commit-rule` each refuse a copy whose recorded tag is not the pin. Both watched red
  with the copies recorded at `v0.55.0` and the pin still at `v0.54.3`, and each self-test
  holds the refusal. What it cannot do is compare the bytes with the tag: this repository is
  public and its CI checks nothing out with a credential, so that comparison is made on a
  machine that has platform. What it does is make the pin unable to move, or a copy to be
  taken from elsewhere, without each copy's record being opened.
- **A comment that had gone stale.** `check-editorconfig.mjs` said the pin predates the house
  file, so its own tag stood apart. That was true until the pin moved to `v0.54.3` this
  afternoon (`4c43b76`), and it now says what holds.
- **`site/DEPLOY.md`** says the pin's whole reach. That edit is under `site/`, so the push
  runs the deploy, which checks platform out at the new pin: the proof that the tag can be
  staged from.

## 2026-10-11: the audit

The owner, at this seat on the evening of 2026-10-11, after the seat told him the code was
complete: "compelte all code items yoiu can. then ultracode audit. use it in scratch as much as
you can to test it. find bugs. brutally review it. I have a hard time believing its complete".
He was right, and the seat's sentence was wrong. Green CI was what it rested on, and CI proves
what the fixtures do.

- **What his words changed, for this work.** "Ultracode" is his order for a workflow of agents,
  so the ruling of 2026-10-09 against sub tasks does not hold for it; the estate's rule that a
  workflow runs Sonnet alone does, and every agent ran Sonnet. The overnight order's limits on
  load, relayed by the lead, gave way to his own word. D1276 did not: the seat starts no
  browser. He logged into his own Chrome ("ive logged into claude in chrome. use that to test")
  and the seat drives that through the extension.
- **Two sources.** The seat used the framework as a stranger does: the twelve tarballs packed
  from `45ea049`, a project made by `npm create`, every renderer added, a shop of thirteen
  assemblies on five pages written with the command line and the documentation, run under
  `dev`, `build`, `perf` and `deploy`, driven in his Chrome and through the installed MCP
  server. And a workflow of eleven read-only finders, one to an area, read the source and
  probed the built packages, each finding then put to one or two refuters told to count doubt
  as a refutation: 141 agents, 84 findings, 66 standing, 6 disputed, 12 refuted.
- **What it found** is Phase 6 of `docs/TODO.md`, a row each. Four blockers, each reproduced by
  the seat before it was a row: an encoded spelling of a guarded address passes the access
  check; a cached placement shows a guarded child to a visitor the guard refuses; a link whose
  target climbs out through another link is read as inside the root; `check` misreads every
  Pug view. Using it found a build of seventeen seconds for any project with a Svelte view, a
  dev loop that deletes the files of the server it has just started, and a starter whose first
  page is unstyled and whose first link is dead.
- **A workflow's finding is not a fact here until the seat has read it.** Each of its rows says
  PREMISE UNVERIFIED until then. The evidence, every finding with its input and probe, is kept
  outside this tree, in the estate's audit records, because the scratch directory is under
  `/tmp`.
- **His further orders of the same evening**, each a row: the scratch projects become showcase
  projects under `examples/`, "production grade", "complex proejcts real world scenarious",
  "extremely complex. not very simple", the first written with the command line as a user and
  the second through the MCP server as an agent; and "a mode on each to enable the boxes around
  them that tell you when and where things are so you can see how it works". Asked where that
  mode lives, he chose the framework: one outline mode, off by default, that any project
  switches on in development or in production.

## 2026-10-11: an address is its every spelling

The audit's first blocker. The access decision was handed the request's path as it was sent
(`register-access.ts`), and the router decodes a path before it matches. So a rule a product
writes about a path, `path.startsWith("/admin")` in its `authenticate`, was asked about
`/%61dmin/users`, said yes, and the router served `/admin/users`. A guarded assembly's own
address and its data and manifest endpoints fell the same way. Under basic credentials nothing
fell, since every address is then refused alike; under a check or a public route written by
path, everything did.

- **The decision is made of the path as the router reads it.** `requestedPath` is the one
  reading: the path without its query, each segment decoded once. Decoding once is what the
  router does, so what an encoded percent sign leaves is not decoded again. An encoded slash
  stays encoded, as the router keeps it inside a segment: decoding never joins two segments or
  splits one, so a public route `/assembly/widget/*` is not matched by a path that hides its
  slashes. A segment that does not decode has no address, and is a 400.
- **The same reading serves a public route**, so `/api/%6Fpen` is the public `/api/open` it
  spells, where before it was refused: the rule leans both ways and holds both ways.
- **Proof.** A core spec with a check written by path, watched red on the code as it stood
  (`/%61dmin/users: expected 200 to be 401`), and a step of the `trust` fixture, which asks the
  built server every spelling of a guarded api over HTTP; its known-bad case is the tarball of
  `45ea049`, which the seat had watched answer 200 over a raw socket. DESIGN 5.2 says it.

## 2026-10-11: a link's target is walked

The audit's third blocker. `followLinks` followed every link along a path, and resolved a
link's own target as text: `resolve(current, readlinkSync(next))`. Text resolution removes a
step back together with the step before it, without asking whether that step was a link. So
`esc -> out/../note.txt`, with `out` a link to a directory outside the project, read as
`note.txt` beside the link, inside the root; the system opens `out` first, lands outside, steps
back there, and opens a file the guard never saw. `readInside` returned it, and `leadsOut` said
the path stayed in.

The follower now reads a path as the system does, a step at a time, and a link's target is more
steps taken from where the link stands, or from the root when the target names one. A step back
is taken from where the walk really is. Nothing else about it moved: a link to nothing is
followed, the part of a path not yet written is carried over, and a chain past forty links is a
loop. Two specs hold it, each watched red on the old follower: the follower's own, on a link
whose target climbs out and back, and the guard's, where `leadsOut` must say so
(`src/climbs.ts: expected false to be true`).

## 2026-10-11: a kept answer knows what it holds

The audit's second blocker. A placement's answer is the assembly's envelope with every
assembly its view placed composed inside it, for the visitor who asked. Settling a placement
asked whether this visitor may be shown the outer assembly, then read the cache, and a hit was
the whole answer as it was composed for someone else. An open assembly whose view places a
guarded one, kept by its page for a lifetime, was therefore served to every visitor after the
first member, the guarded assembly's markup inside it, while that assembly's own address went
on answering 401. The guard against keeping a credentialled answer never tripped: the headers
the composer sees are the ones a remote declared it wants, not the visitor's own.

- **An answer is kept with the assemblies it holds**, read off the account of what the
  answering view placed, at any depth: `CachedContent.holds`. A placement the browser fills
  later is not among them; the answer holds its place alone and its address decides for it.
- **It is read for a visitor only when each of them would be shown to that visitor**, by the
  same `Admit` the request already carries, so each is asked once a request however often it is
  placed. This is DESIGN 5.2's own sentence, "asked before a cached answer is used", made true
  of what the answer holds and not of its outside alone. On a fresh hit and on the fallback
  rung alike, which is why the ladder is asynchronous now.
- **Refused, the cache is passed over and the placement is composed for this visitor**, who is
  shown the open assembly with the guarded one refused inside it. That answer holds a failed
  envelope and is never written, so the member's entry is not replaced by a guest's.
- **What was not recorded is no one's a control decides about.** An entry with no `holds`, from
  a cache that keeps only what it knows, is not read while a control is on; a check that throws
  refuses. With no control on, nothing is asked and nothing changed.
- **Not chosen:** refusing to keep any answer that holds another assembly while a control is on.
  It is simpler and it would have ended caching for every composed assembly on a guarded
  server, the members' own included.
- **Proof.** Core specs of the placement cache and of a server composed twice for two visitors,
  watched red (`expected '<body>...' not to contain 'BALANCE-9912'`); a step of the `trust`
  fixture, a kept page asked as a guest, a member and a guest again over HTTP; the seat's own
  run of the old tarball, which showed the guest the member's content.

## 2026-10-11: a Pug view is read with its attributes

The audit's fourth blocker. `check` reads a Pug view through the markup made from the tree the
project's own Pug parses, and that markup was first written for one reader, the reader of
placements: it kept a directive's attributes and wrote every other tag as its bare name. The
three element rules, which came later and "hold in any kind of view", read the same markup. So
in a Pug view an `img` with an alt was reported as having none, an `input` with an `aria-label`
as having no name, and a `style` attribute was never seen: two false findings on correct views,
of the kind that gets a rule turned off, and one rule silently not applied.

Every tag is written with the attributes it was given now. A written value is escaped as Pug's
render escapes it, which also keeps true what the old markup got by omission: markup inside an
attribute's value, a directive included, is not markup. What the template computes stands as
the marker, as in every other template language, in a value or, for attributes handed over as
an object, as a bare attribute, which the rules already read as a spread. Specs of the markup
and of the elements read from it through the installed Pug, watched red (`Received: "<img></img>"`).

## 2026-10-11: the dev loop

Using the framework as its documentation says found that `dev` did not survive a project of
any size. Four faults, one after another, each made worse by the one before.

- **A build took seventeen seconds for one Svelte view.** The JSX plugin's `onResolve` took
  every relative import in the bundle and asked esbuild to resolve it, to learn whether a
  project file with no framework in its name is reached from one that has; it asked about the
  imports inside packages too, each a round trip between esbuild and JavaScript. React, Preact
  and Vue ship bundled; Svelte ships its runtime as about 120 source files of relative imports,
  and a trace showed 3,040 opens of those files and one directory read 347 times. Timed in a
  scratch project by renderer: html 0.9 s, each other renderer 1.0 to 1.8 s, Svelte 16.7 s.
  A package's own imports are not the project's, and are left to the default now. A spec with
  a package of relative imports listens for the plugin's questions: two were asked, none are.
- **Every burst of changes queued a whole build.** `dev` chained one build per burst, 100 ms
  apart, so eleven `add assembly` commands were a backlog of builds, each of the whole
  project. Changes made while a build runs are one build after it (`folded`), and the sources
  are watched from before the first build, so a change during it is not missed.
- **A build deleted the files of the server that was running.** A build began by removing
  `dist`. The server `dev` had just started from `dist` died with
  `ENOENT ... scandir dist/client/` or `Cannot find module dist/server.js`; a build that
  failed after that left
  "the last good build" with no files; and the generated directory went too, with the record
  the agent surface reads. A build is made whole beside `dist`, in `.assemblejs/building`, and
  replaces `dist` only once it has succeeded. Between the two the caller is asked (`settle`):
  `dev` stops the old server there, so it serves its own files to its last request, and
  the new one starts from a `dist` that is whole. A build removes from `.assemblejs` what a
  build writes (`BUILD_WRITES`) and nothing else. For the `build` command this means a failed
  build leaves the last `dist` in place and says it failed by its exit, where it used to leave
  none: nothing half-made is ever in `dist`.
- **A build could be made of two moments.** Sources read at the start and at the end of a long
  build disagreed, and the server built from them refused to boot. A build during which a
  source changed is left unused; the build after it is of the sources as they are.

Not chosen: running the dev server from a copy of each build. It keeps the build untouched and
moves the server one directory deeper than production runs it, and a project that reads a file
beside its build would then find it in one and not the other; `dev` runs `node dist/server.js`
as production does, and that sentence stays true.

The writers of browser files still address `dist`; the build hands them an io that writes what
is addressed there beneath the directory being built (`stagedIo`). Giving each writer the
directory was the other way, and touched five signatures and their specs for the same effect.

Proof: specs of each part, the dev loop's two watched red on the old loop (`expected 500 to be
200`) and by mutation (`expected [ true, true ] to deeply equal [ false, true ]`); the command
line's suite, 689 specs in 12.6 s where it took 21. Then the artifact: tarballs packed from
this tree and the scratch shop of thirteen assemblies installed from them. It builds in 5.1 to
5.4 s where it took 20. Under `dev`, eight saves 0.4 s apart and then a Svelte view that does
not parse left the page and its script answering 200 at every probe, logged one "the last good
build is still running", kept the record, and built once when the view was removed.

## 2026-10-11: the starter and the arguments

What a stranger meets first, each found by being one.

- **The first page was not a page.** `tokens.css` set the roles and `components.css` the
  classes, and nothing styled `body`: the page was white, black and Times New Roman, and in a
  browser set to the dark scheme the tokens flipped beneath it, a dark notice on a white page
  with its link in the light accent. The components open with the page itself now, its ground,
  its ink and its type from the tokens, and the tokens declare `color-scheme: light dark`, so
  what the browser draws, its canvas, scrollbars and form controls, follows them (MDN,
  `color-scheme`, read 2026-10-11: "To opt the entire page into the user's color scheme
  preferences, declare `color-scheme` on the `:root` element").
- **The arguments were not read.** Every `--flag` took the next word for its value, whatever
  the flag: `--cwd=shop` was a flag named `cwd=shop` that swallowed a word, a mistyped
  `--render react` was kept in silence and the assembly written as plain html, and `--version`
  was an unknown command. `readArguments` knows the two flags that take a value and the two
  switches; a flag is read written apart or with an equals; a flag nobody knows, one left
  without its value and a switch handed one are each refused with the usage, exit 2.
  `--version` and `-v` print the version the package's own manifest holds.
- **`new` with an absolute directory** joined it beneath where the command ran and then said to
  `cd` to the absolute one, three findings of the workflow on one line. It is where it says.
- **pnpm 11 failed a fresh project's first install.** pnpm refuses an install while a
  dependency's install script has not been ruled on (pnpm.io/settings/build, read 2026-10-11:
  `strictDepBuilds`, default true, "the installation will exit with a non-zero exit code if any
  dependencies have unreviewed build scripts"; the ruling is `allowBuilds` in
  `pnpm-workspace.yaml`, which replaced the older keys in v11). Seen here with pnpm 11.4.0:
  `ERR_PNPM_IGNORED_BUILDS` for esbuild, exit 1, and every `pnpm exec` after it refused. A
  project made by pnpm is written the ruling, `esbuild: false`: the build reaches the bundler's
  binary without its script, so nothing runs that is not needed. With it the same install
  exits 0 and the installed command builds. A project made by npm is not written pnpm's file.
- **The command line's tarball budget moves from 88000 to 94000.** Measured at 90,598 bytes
  after this entry and the one above: the dev loop's three modules, the argument reader, the
  starter's page rule. `ci` 38195380554 went red on it at 89,168, on the commit above, with
  every spec green; this is the fix forward.
- **Not in this entry, and rows:** a new project's `tsconfig.json` and the types a TypeScript
  view needs; what the starter's guide link names, which is the owner's; and the hint that
  `add assembly` could give when a renderer's packages are not installed.

## 2026-10-11: what a server would fail at, it refuses before it listens

The audit's six rows on the server, each read at the source and reproduced against the built
package before it was believed (`createServer` and `inject`, and for the host a real `listen`).
One rule under four of them: a server that is accepting connections is a server that is
configured, which `bootProblems` already says of itself and which these did not meet.

- **A view was read through the object.** Expected: a view is one the assembly declared. Found:
  seven readers wrote `assembly.views[view]`, and a view's name is whatever a url or a
  directive holds. Measured: `/assembly/card/constructor/` a 500 with a failed envelope
  naming the view and a `TypeError` in the log, `/assembly/card/toString/api/` a 200 of `{}`,
  `/assembly/card/__proto__/manifest/` a 200 manifest of a view that is not there. Every other
  lookup by a caller's name in the server was already an own-property read (a page's plan, a
  renderer, a module); the views were the ones missed. `declaredView` is the one reading now,
  and the two walks of what a view places read a view's placements the same way, since
  `constructor` is a usable segment and a view may be named it.
- **A header value was checked when it was sent.** Expected: a policy that cannot be sent is a
  boot error, as a blank one is. Found: `contentSecurityPolicy: "a;\n b"` booted and answered
  every html request with a 500 whose body was the router's own, the platform's message in it
  (`Invalid character in header content ["content-security-policy"]`); a `version` with a line
  break or a character past the platform's range did the same to every content answer.
  `sentHeaderProblems` asks the platform its own rule rather than writing one: Node's
  `http.validateHeaderValue`, "the low-level validations on the provided value that are done
  when `res.setHeader(name, value)` is called" (nodejs.org, the `http` page for v22, read
  2026-10-11; added in v14.3.0). A policy written over several lines is refused, not folded:
  a value that is present and unusable refuses here, and the message says to write it on one
  line. Every other header the server sets is a constant or a name already held to a segment.
- **The order of services was settled per request.** `orderServices` says of itself that every
  way it can be wrong is a boot failure, and only `runServices` called it. Measured: a name
  twice, an `after` naming nothing and a circle each booted, and each answered every request
  for that view with a 500. Boot calls the same function for each view and reports its
  problems with the assembly and the view named. No second validator.
- **An empty host was every interface.** `ASSEMBLEJS_HOST=` was handed on as `""`, and the
  server then listened on `::` (measured: `address()` answered `{"address":"::"}`). Fastify's
  own default is `localhost`, "when no specific host is provided" (Fastify's
  `docs/Reference/Server.md`, `listen`, read through context7 2026-10-11); an empty one is
  not that, as the measure shows. Empty is
  unset for the mode, the port and the control in this same function, so it is for the host:
  loopback. A value with a space in it is present and unreadable, so it refuses; it failed
  only at `listen` before, as a lookup error. What a host name is otherwise is the resolver's
  to say, at `listen`, before anything is served. A `Config` handed to `createServer` whole is
  its caller's own statement and is not read again.
- **A url that is not one was answered by the router.** `/assembly/card/%zz/` was a 400 whose
  body was the router's: the path repeated in it, no id, and no `nosniff`, since no hook runs
  for a request the router refuses first. Fastify's `frameworkErrors` option is where that
  answer is replaced ("Only `FST_ERR_BAD_URL` and `FST_ERR_ASYNC_CONSTRAINT` are implemented
  at present", Fastify's `docs/Reference/Server.md`, read through context7 2026-10-11; the
  signature read from the pinned 5.12.1's `fastify.d.ts`). `answerFailure` is the one answer to a failure now, what a route
  threw and what the router refused alike, and it sets `nosniff` itself.
- **Parameters had a prototype when none were sent.** DESIGN 8 says a service's `params` are
  "an object with no prototype"; the fallback for an absent header was `{}`. It is one now.
- **Proof.** Nineteen cases watched red, then green; the probes re-run against the rebuilt
  package; two steps added to the contract fixture's content spec (a view named after what
  every object has, and a url that is not one), each watched red against a build from before
  the fix and green in the fixture's own run.
- **A case of the command line's suite read who ran it.** `new` writes pnpm its settings when
  pnpm ran it (the entry above), and the case that lists a new project's files did not say who
  did: green run by hand, red under `pnpm test`, which is how `ci` runs it. `ci` did not reach
  it while its verify jobs stopped at the emoji gate on sixteen site pages another seat had
  pushed; that seat's fix landed (`d82714c`), and `ci` 38196690823 on `13f3edd` was red on this
  one case with every other suite green. The case names npm now, and the settings' own spec
  proves the wiring both ways.
- **The core's tarball is at 77,646 bytes of 78,000** after this entry. Not moved here; the
  next bite that adds to the core moves it with its measure.
- **Left, and rows:** the cached placement's one envelope id (workflow server.8) is the
  composer's row, composer.3, and is done with the composer's.

## 2026-10-11: markup is read as the browser reads it, in the time its length takes

The audit's five rows on the readers of markup (composer.2, composer.4, trust.4, trust.5,
trust.7), each reproduced against the built package first, and two more the seat found while
standing in the scanner. What the browser does is read from the parser's specification
(html.spec.whatwg.org, the parsing page, fetched and read 2026-10-11), never recalled.

- **A name ended at a hyphen.** `inertSpans` opened a raw-text stretch at
  `<(script|style|textarea|title)\b`, and a word boundary stands between `title` and `-`.
  Measured: after `<title-bar>`, `<style-guide>`, `<script-runner>` or `<textarea-autosize>`,
  `findPlacements` answered no placement at all, in silence, because no `</title>` ever closed
  what the custom element was taken to open. A tag's name ends at a tab, a line feed, a form
  feed, a carriage return, a space, a slash or `>`, which is where the tokenizer ends it; an
  end tag is read the same way and may hold anything after its name. `liveClosingTags` had a
  second copy of the pattern with the same fault and no textarea or title; it asks
  `inertSpans` now, so there is one reader.
- **Reading was quadratic, and ran on every render.** Measured before: a megabyte of sixteen
  thousand scripts took `findPlacements` 1.1 s with no directive in it, and twice the size
  took four times as long: a slice and a new pattern for each raw-text element, a search of
  every stretch for every tag, and `inertSpans` run three times over. After: the patterns are
  compiled once and read in place, a stretch is found by halving (`withinSpans`), the three
  readers share one reading, and none of them runs until a directive is met. After, measured
  on the rebuilt package: that megabyte with no directive in 0.1 ms, sixteen thousand
  placements among as many scripts in 28 ms where they took 2 s, and time doubling with size
  up to four megabytes. `localAssets` over sixteen thousand envelopes: 8 ms, from 604.
- **A remote's answer could hold one thread.** `scanFragment` copied the names of the open
  elements at every start tag and searched them up to four times. Measured before: an envelope
  holding forty thousand nested `<div>` took 10.4 s, with the limit on an answer's bytes
  letting through five times that depth, and nothing else answered while it ran: no deadline
  ends a loop that never yields. `OpenElements` keeps what a start tag asks as elements open
  and close: the parent, a count by name, and whether a paragraph is open in button scope,
  so each question costs the same at any depth. After: sixty-four thousand deep in 32 ms.
- **Where SVG and MathML hand content back to HTML was read by name alone.** The
  specification names them by kind: "A MathML annotation-xml element whose start tag token had
  an attribute with the name encoding whose value was an ASCII case-insensitive match for
  text/html" or for application/xhtml+xml, "An SVG foreignObject element", "An SVG desc
  element", "An SVG title element", and MathML's mi, mo, mn, ms and mtext for text. The
  scanner had the eight names in one set, for either kind, and no annotation-xml. So
  `<math><annotation-xml encoding="text/html"><style><!--</style>` was a comment to the
  scanner and raw text ended by that `</style>` to the browser: what followed, written as an
  end tag for the envelope and a new envelope, was live on the page, unseen and unstamped
  (measured: accepted, its tags `assembly-root, math`). And `<svg><mtext><style>` or
  `<math><title><style>` was raw text to the scanner and elements to the browser. Each open
  element now carries its kind; the hand-back is asked of the kind; and `annotation-xml` in
  MathML is refused, because whether it hands back turns on an attribute's decoded value and
  nothing here decodes one. The same name in SVG or HTML is an element like any other.
- **A heading inside SVG or MathML was let through (found by the seat).** The parser's list of
  start tags that end such content holds `h1` to `h6`; the scanner's check of that list sat
  behind a test for letters only, so the six with a digit passed. `<svg><h1><style><!--</style>`
  hid markup exactly as above (measured: accepted, tags `assembly-root, svg`). The test is
  gone; the list is asked.
- **An element named `constructor` threw (found by the seat).** The table of containers was an
  object asked by the tag's name. It is a map.
- **The search for an open paragraph stops by kind too.** The button scope's elements are
  named for one kind each in the specification, `select` now among HTML's; the scanner had
  them by name alone. `OpenElements` holds them by kind.
- **Left, and a row:** a script is ended at its first end tag. The tokenizer does not end one
  there when a `<script` stands inside a `<!--` inside it. Read short, a directive the browser
  takes for that script's text is read as live and dispatched into it; nothing is dropped in
  silence, and a remote's answer holding a comment in a script is already refused.
- **The core's tarball budget moves from 78000 to 82000.** Measured at 78,829 bytes after this
  entry: the span lookup, the record of open elements, the kinds. It stood at 77,646 before.
- **Proof.** Each case watched red first: the unit cases against the source, and the two steps
  added to the remote fixture's hostile page (an answer that hides markup, and one tens of
  thousands of elements deep) against that page served by a build of the core from before
  the fix. The samples whose refusal changed were each run against that build too.

## 2026-10-11: a script ends where the tokenizer ends it

The row the entry above left open, closed in the next commit: it was left as one that drops no
placement, which is true and is not the risk. The reviewer of that bite named the risk the
other way round, and a spec showed it: in
`<script><!-- <script> </script><assembly name="cart"></assembly> --></script>` the placement
was found and dispatched, and its markup would have been put inside the script, the case the
inert reading exists to prevent.

- **What the tokenizer does**, read from its states (html.spec.whatwg.org, parsing, "Script
  data state" to "Script data double escape end state", read 2026-10-11). A script's text is
  read one of three ways. As written: its own end tag ends it, and `<!--` begins the second.
  Escaped: two or more dashes and a `>` return to the first, the opening dashes of `<!--`
  among them, so `<!-->` escapes nothing; its own end tag still ends the script; and
  `<script` followed by what ends a tag's name begins the third. Escaped twice: its own end
  tag only returns to the second, and the dashes return to the first.
- **`scriptEnd`** reads that, a pattern for each of the three read in place, and `inertSpans`
  asks it for a script where it asks for the first end tag of a style, a textarea or a title.
  Twenty cases written from the states before the code, one of which the code corrected:
  `</script -->` inside a script escaped twice ends the second escape and then the first.
- **Where a tag's name ends is written once.** `TAG_NAME_END`, a character class as a
  pattern's source, read by `inertSpans`, `scriptEnd`, the fragment scanner and its start tag
  reader, which each had their own spelling of it.
- A remote's answer with a comment in a script is still refused whole; nothing there changes.

## 2026-10-11: a kept answer is its placement's own, and what a remote names is bounded

Four of the audit's rows (composer.3, client.2 and server.8, which are one defect, and
trust.6), each reproduced against the built package first.

- **A kept answer carried the ids of its first composition.** The cache holds an answer as it
  was composed, envelope ids and all, and a hit handed it back as kept. Measured on a page
  placing one kept assembly twice, its view placing a child: the second request's four
  envelopes carried two ids. The browser runtime mounts an id once (`client/start.ts`: an id
  it has mounted is passed over), so the second placement stayed the markup the server sent,
  and the account of the placement named an id no envelope had. `reissueIds` makes a kept
  answer the asking placement's own: the outermost envelope takes the id that placement was
  given, each envelope inside it a new one, and each old id is replaced wherever it is
  written, on the envelope, on its island, in the island's own account and anywhere its view
  wrote it. `placementCache`'s `read` takes the id, so the fresh hit and the last good answer
  on the ladder are both the placement's own.
- **Only an id shaped as a composer mints them is given again.** A uuid can be told from the
  text around it and replaced everywhere; another server's id of another shape cannot, and is
  left. A remote that is not this framework and mints short ids keeps them, repeated, where
  its kept answer is placed twice; that is its runtime's to mount.
- **How many assemblies an answer holds was the remote's to say, without a bound.** Each
  nested envelope of a name of its own is a manifest the composing server reads. Measured,
  one answer of three thousand: 512 reads open on the remote at once, which is as many as its
  listener took, the rest waiting; after five such answers 4,620 reads, 10,381 log lines for
  the ones that timed out, and the process 100 MiB larger, every one of those names kept.
  Three bounds now. An answer naming more assemblies inside it than a page of this server
  may place (`limits.placements`, 256 unless set) is refused whole, as invalid, before any
  manifest is asked for: `markRemote` takes the bound. The manifests kept (4,096) and the
  children remembered for one url (1,024) let the oldest go, read again if seen again. And no
  more than 256 reads are in flight; one past that is left for the next time its assembly is
  seen, as one that could not be read already is, with one log line when the bound is reached
  and none for each read left waiting.
- **The row's third claim is settled already.** A manifest is read from the origin the
  content was just fetched from, by a second lookup of the same name. That a name may answer
  differently between two lookups is the rebinding window this log already records, bounded
  by the exact allowlist and refused redirects (2026-10-03, "remote assemblies", the
  private-range rule); nothing new.
- **Proof.** Eleven cases watched red, then green; the probes re-run. The remote fixture
  gains a page that places one kept assembly twice and a hostile answer naming three hundred
  assemblies, each step watched red against a build of the core from before the fix.
- **A step that told a kept answer by its id tells it another way.** The trust fixture's step
  for a kept answer holding a guarded assembly said the member's second answer was the kept
  one because its envelope had the first's id, which is the defect this entry removes; the
  wide proof went red on it before the push. The shelf counts how often it is composed, and
  the step holds the member's second answer to the first's count and to an id of its own.
- **The core's tarball is at 80,815 bytes of its 82,000** after this entry and the one above.

## 2026-10-11: the mark that says an assembly is live is written when it is

Four of the audit's rows on the browser runtime (client.1, client.5, client.6, client.7),
each read at the source and its case watched red against the client entry as last built.

- **`data-mounted` was written when the handle came back.** DESIGN 9 gives the mark one job:
  to tell "a hydrated assembly from one still waiting for its module". Every built project
  mounts through `lazyRenderer`, which returns its handle at once and mounts when the module
  arrives, so the mark was on every assembly before its module had loaded, and stayed on one
  whose module failed to load or whose mount threw. The browser proofs' wait for the mark,
  written this week to end a race, waited for nothing. A handle may now say when its half is
  live: `mounted`, a promise that settles when it has mounted and rejects where it never
  will. `lazyRenderer` says it, passing on what the module's own handle says; the runtime
  marks at once for a handle that says nothing, as before, and for one that does, when it
  does, and only while the runtime still holds that assembly. No renderer of ours needed a
  change: each one's own mount is done when it returns.
- **A mount that threw part-way kept its subscriptions.** The events an assembly is handed
  were released only when the page's assemblies were unmounted together, so what a component
  subscribed before it threw stayed on the bus, called for every message. `mountIsland` holds
  the mount and its events together and releases on a throw.
- **An island of JSON that is not an object ended the page's mounting.** `null` parses, and
  the runtime read its name outside the guard around the mount: a `TypeError`, and no
  assembly after it on the page was considered. `readIsland` answers nothing for it, as for
  one that does not parse.
- **The bus.** A handler removed by another during a send was still called for that send,
  from the copy the send walks; each is looked for again before it is called. An assembly that
  subscribed after its release, as a late callback does, added a subscription nobody would
  release; it adds nothing now. And a handler that threw stopped the send for every listener
  after it and reached the sender: it is reported against its assembly and the rest are
  called, the same rule the runtime has for a mount (found by the seat, standing in the file).
- **Read and left for the owner: client.4.** DESIGN 9 says last-value replay is opt-in per
  topic, and in a built project nothing opts a topic in but the page's stream: the generated
  client entry passes no `replay`, and an assembly's events have no `keep`. So `last` answers
  nothing for a topic one assembly sends another, which is the race the rule is for. The seat's
  advice is `events.keep(topic)` on what an assembly is handed, the sender saying its topic is
  a state; a key in the project's config is the other way. Either is a public surface, so it
  is his.
- **The core's tarball is at 81,734 bytes of its 82,000** after this entry.

## 2026-10-11: an attribute's value is text

The audit's row on Solid (renderers.2), reproduced, and found to be the composer's defect and
not the renderer's.

- **What was claimed.** Solid leaves `<` unescaped in an attribute's value, so a visitor's
  value containing `<assembly` or `<!--` breaks the assembly or empties it. True of Solid:
  its server render escapes the quote and the ampersand there, which is all HTML asks.
- **What was found.** The readers of a view's markup had no notion of a tag: a pattern looked
  for a comment's opening, a raw-text element's, a directive's, wherever it stood. Measured
  with markup any view could hold, whoever rendered it: `title="<!--"` or `title="<script>"`
  and every placement after it was passed over in silence; `title="<assembly name=&quot;x&quot;>"`
  and the view failed, "neither self-closing nor immediately closed"; and a whole directive in
  a single-quoted value was placed, an assembly dispatched and its markup spliced into the
  attribute. A view that writes a visitor's value raw places what the value names, which
  DESIGN 7 says and guards; a view that wrote it escaped as its framework escapes it did the
  same.
- **The fix is where the reading is.** `inertSpans` visits every tag and marks what it holds
  between its name and its end inert, as it marks a comment and a raw-text element, so every
  reader that asks it (the directive finder, the open paragraph, the shadow root, the closing
  tags of head and body, the envelopes a page links for) passes over a value. `tagEnd` finds
  the end as the tokenizer does (html.spec.whatwg.org, parsing, "Before attribute name state"
  to "Self-closing start tag state", read 2026-10-11): a `>` inside a quoted value is the
  value's, and a quote opens a value only after an `=`. No renderer changes; Solid's output
  is valid and is read as it is.
- **`<template-card>` was a `<template>`** to the shadow root reader, the same word boundary
  the raw-text elements had. It ends a name where every reader now does.
- **The core's tarball budget moves from 82000 to 86000.** Measured at 82,328 bytes after this
  entry. It stood at 76,842 when the audit began; what was added since is the audit's fixes:
  the readers of markup read as the tokenizer does, the bounds on what a remote names, the
  kept answer's ids, the mounted mark.
- **Proof.** Nine cases watched red, then green, the Solid renderer's own among them: a
  visitor's value in an attribute, rendered by Solid with its angle brackets, places nothing
  and fails nothing.

## 2026-10-11: the ids a component makes are its island's own

The audit's row on the renderers' ids (renderers.1), reproduced in each renderer's own suite.
`MarkupInput` has said since it was written that "a renderer whose hydration keys must not
collide with another island's prefixes them with" the placement's id; Solid and Lit did, and
four did not.

- **Measured.** Two renders of one component that asks its framework for an id: React made
  `_R_0_` both times, Vue `v-0`, Svelte `s1`, Preact `P0-0`. Every island is a render of its
  own, so two on a page share every id they make, and a label in one names the input in the
  other, as does every `aria-labelledby` and `aria-describedby`.
- **Each framework has a prefix for this, read in its own documentation 2026-10-11.** React:
  `identifierPrefix`, an option of `renderToString` that "must match the prefix passed to
  `hydrateRoot`" (react.dev, `renderToString` and `useId`). Vue: `app.config.idPrefix`, "if
  you have more than one Vue application instance of the same page" (vuejs.org, `useId`).
  Svelte: `idPrefix`, an option of `render` (svelte.dev, `svelte/server`); in the browser a
  hydrating component reads its id from the comment the server wrote beside it (read in the
  pinned 5.57.0, `props_id`), so only the server is told. Each renderer hands the placement's
  id to that option, the server's render from `input.id` and the browser's from the mount's.
- **Preact has none.** Its hook builds `'P' + mask[0] + '-' + mask[1]++` from the root of the
  render (read in the pinned 11.0.0, `hooks/src/index.js`), and nothing a caller passes
  reaches it. So the renderer's client entry exports a `useId` of its own: Preact's, with the
  placement's id before it, from an `IdContext` both renders provide. A Preact view imports
  `useId` from `@assemblejs/renderer-preact/client` where it imported it from `preact/hooks`.
  The guide's page for Preact is the site seat's and wants a sentence; a rule of `check` that
  names the other import in a Preact view is possible and is not written.
- **A kept answer keeps its ids its own.** The prefix is the placement's uuid, written into
  every id a component made; read from the cache for another placement, each is replaced with
  that placement's, the island's own account of its id with it, so the browser hydrates with
  the id the markup has.
- **Proof.** Each renderer's case watched red on the id above, then green, the browser half
  hydrated over the server's markup in the DOM the suite has (Svelte's hydration is drawn in
  `ci`, as that suite's own note says). The `browser proof` job is the one that draws them.

## 2026-10-12: check says what it passed over, and add writes only into a project

Five of the audit's rows on the command line (cli-verbs.1, .3, .4, .5, .8), each reproduced
with the built command line in a project it had just made.

- **A file that is nearly a declaration was left out in silence.** A service is read as
  `<name>.service.ts`, a page's declaration as `<name>.page.ts`, an api as `<name>.api.ts` in
  `src/api`. Measured: with `hello.services.ts`, `service.ts`, `hello.clients.ts`,
  `home.pages.ts`, `page.ts` and `src/apis/orders.apis.ts` in a new project, `check` said "no
  problems". Each is a finding now, under the rule its directory already had, with the name
  that would be read. What is named is narrow on purpose: the kind with no name before it, its
  plural, and another's name on it where the directory has none of its own. A module of the
  author's beside the one that is read (`audit.service.ts` beside `cart.service.ts`, `db.ts`
  in `src/api`) is theirs and is left alone, since `check`'s findings stop a build.
- **A README beside a view made its assembly no assembly.** Markdown is a renderer, and a file
  with a word before `.tsx` reads as that word's framework, so `README.md`, `notes.md`,
  `cart.test.tsx` and `cart.stories.tsx` were each a view; two views is "more than one view
  file", and the page that placed the assembly was then told there was no such assembly and to
  add it. `isView` says what a view is: named for its renderer, not the browser half, not a
  test, a spec or a story, and for Markdown only the file named for the assembly.
- **That advice was a circle.** A placement naming an assembly whose directory is there and
  broken was told to `add` it, and `add` refuses a name that is taken (the agent surface's row
  mcp.5 is the same circle). It is told to mend the directory, whose own finding says how.
- **A link that leads nowhere ended every verb in the system's own error.** Measured: a
  dangling link to a stylesheet in an assembly's directory, and `check`, `build` and so `dev`
  and `deploy` each threw `ENOENT` with a stack. The root guard refuses such a link now, and a
  path beneath one (`DeadLinkError`, one of its refusals, so every reader that passes over a
  path leading out passes over this); `outsideProblems` says which of the two a path is, under
  the one rule, whose words now cover both; and the walk that hashes a build's sources passes
  over it. The agent surface's `add_assembly` answered "already exists" for a name a dead link
  holds, through a guard that let the link by; it catches the refusal and answers the same.
- **`add assembly` wrote wherever its path led.** Its writes went through no guard: with
  `src/assemblies` a link out of the project it wrote the assembly outside and said it had,
  with one that led nowhere it threw, and with a `--cwd` that named no directory it made the
  directory and reported success. It asks the root guard first, as `add_assembly` does, and
  writes only where a `package.json` is. It moved to a file of its own to be tested there.
  `add agents` made the directory of a mistyped `--cwd` the same way, and refuses the same
  way, in the same words (`noProject`).
- **The browser half named for its assembly is the one read** where there are two; the first
  by name was, whichever that was.
- **Proof.** Thirty cases watched red, then green; the five reproductions run again with the
  rebuilt command line, each answered in a line. The command line's tarball is at 92,628 bytes
  of its 94,000.

## 2026-10-12: check reads what it misread, and names a file it cannot read

Five of the audit's rows on the rules `check` names (check-rules.2 to check-rules.6), each
reproduced with the built command line in a new project.

- **A spread beside a computed attribute was not seen.** An element was known to carry a
  spread by inference: computed, with no attribute of its own computed. An image written
  `<img {...rest} src={src} />` has both, so it was read as one with no alt, and an input
  beside it as a control with no name; the same in Vue (`v-bind="rest" :src`) and Svelte.
  Each reader now says a spread outright, an attribute named by the marker, and the inference
  stays for a reader that cannot tell (props handed on whole).
- **A class component's `render` was a Lit element's.** Any class with a `render` holding a
  slot was reported as placing inside its own shadow root. A React or Preact class component
  has none. The rule holds where the slot is the Lit renderer's, which is the one renderer
  whose view is an element.
- **A comment placed an assembly.** A Vue template and Svelte markup were searched for slots
  as text, comments included, so a `Slot` an author had commented out was a placement, and a
  page was told of an assembly it does not hold. Comments are taken out first. A slot written
  in an attribute's value is still read; nothing reads a Vue template as its compiler does.
- **A file that does not compile was passed over.** An api whose source threw was skipped
  with a note that its own rules would report it, and no rule did; a view written as a module
  was "unread", its placements the render's to know. Measured: an api, a React view and a Vue
  view that do not parse, and `check` said nothing of any. A new rule, `a-source-file-compiles`,
  names an api and a module view (and each component it imports) with what the compiler said
  first and its line. A Vue or a Svelte view is not compiled by `check`, which has neither
  compiler, and stays the build's to refuse: a row says so.
- **An origin from the environment made its remote undeclared.** The remote fixture's own
  config reads its producer's origin from the environment, as a real one would. `check` read
  the literal origins and refused a placement from any other as "not a declared remote".
  `declaredOrigins` now also says whether it read them all; where it did not, a placement's
  origin is not judged, and boot holds it as before.
- **The command line's tarball budget moves from 94000 to 98000.** Measured at 94,039 bytes
  after this entry and the one above: the dead-link guard, the near-miss findings, the new
  rule and what reports it.
- **Proof.** Seventeen cases watched red, then green; one case that held the old answer for a
  module that does not compile, "none known", now holds the new one.

## 2026-10-12: the agent surface asks only this machine's dev server, and only for so long

The audit's five rows on the agent surface (mcp.1 to mcp.5), each read at the source and its
case watched red.

- **The dev record was believed whatever it named.** `dev` writes its address to
  `.assemblejs/dev.json`, and the agent surface asked whatever address the file held for its
  health and then for renders. The file is under the project, and a project is a thing a
  person clones. Watched: a record naming `192.0.2.1` was asked, for the whole of its one
  second. An address is believed only where it is plain http on a loopback name, by the
  core's own `loopbackHost`, and is otherwise not asked at all.
- **Any 200 was the project's health** (disputed by one of the workflow's refuters; watched
  true). A program that took the port a dev server left, and answers every path, was taken
  for the dev server, and its page shown to the agent as the assembly. The health is believed
  where it is the framework's own, `{"status":"ok"}`.
- **A render waited without end.** `render_assembly` handed the dev server a signal nothing
  ever aborts; a server that took the request and did not answer held the tool, and the agent
  that called it. Watched: the case ran to the suite's own five seconds. It waits ten seconds,
  more than a page waits for a placement since a dev server may be rebuilding, and then says
  the server did not answer and where to look.
- **A circle was written and called done.** `place_assembly` refused an assembly placed in
  itself and nothing deeper: with a shell that holds a nav that holds a menu, the shell was
  written into the menu and the answer was `ok`. Every render then refuses both. `leadsTo`
  asks what each view is known to place whether the child already leads to the parent, and a
  child that does is refused before anything is written, with the way it leads there.
- **The circle between `check` and `add`** (mcp.5; disputed, and true): closed for `check` in
  the entry before last, and here for `place_assembly`, which told an agent to `add_assembly`
  a name whose directory is there and broken, a name `add_assembly` refuses as taken.
- **Proof.** Eight cases watched red, then green. The agent surface's tarball is at 26,492
  bytes of its 27,000.

## 2026-10-12: two gates of the identity law read any case

Two of the audit's rows on the gates (tests.2, tests.5), each watched letting its case by.
Both hold a hard law, so a hole in either is a hole in the law.

- **The identity gate matched its names as written.** Each of the four passed in any other
  case of its letters: with all four written in the other case of every letter as a fixture,
  the gate refused none of them. It reads any case now, its self-test holds it to that
  fixture, and the one line of the tree it then refused was the audit's own row, which
  spelled them; the row says it another way.
- **The trailer gate matched two spellings of one key, and a line no agent writes.** A
  trailer's key in lower case or in capitals passed, and so did the line a coding agent
  appends by default, which is a sentence with a mark before it and no colon after. And the
  form that reads one message, which is the commit hook, held it to the sign-off alone, so an
  attribution reached a push before anything refused it. The pattern is read in any case and
  names that line by what it says, one message is held to both rules, and the self-test
  holds four attributions red and a body that merely uses the words green.

## 2026-10-12: a dev server on every interface is still the project's own

A follow-up to the entry before last, found by reading it again before the next bite. That
entry made the agent surface believe a recorded address only where it is a loopback name.
Two ways of running `dev` that worked before it then did not, each watched red.

- **Expected:** the record holds an address the agent surface can ask.
- **Found:** with `ASSEMBLEJS_HOST=::` (or `0.0.0.0`), `dev` recorded `http://[::]:PORT`, the
  address it listens on and one nobody can be asked at; and with the host set to one of the
  machine's own addresses, a dev server on the local network, the record was refused as
  another machine's (`expected undefined to be 'http://10.0.0.82:44077'`). In both the tools
  fell back to rendering without the server and said nothing of why.
- **Now:** `askedAt` turns the two every-interface addresses into this machine's loopback of
  the same family as `dev` writes the record, and `ownAddress` believes a host that is a
  loopback name or an address of one of this machine's interfaces. A host that is neither is
  still another machine's and is not asked, which is the rule the first entry was for.
- **Not done:** a name that resolves to this machine (a hosts-file name) is not looked up. It
  would be a lookup on every tool call for a setup nobody has reported; the record's own
  author can write the address.
- **Proof.** Both cases red before, green after; every cheap gate of `pnpm check` and both
  packages' suites green here. The agent surface's tarball is at 26,709 bytes of its 27,000.

## 2026-10-12: a page shows how it was put together

The owner's order, typed at the seat on 2026-10-11 as he asked for the showcase projects: "with
a mode on each to enable the boxes around them that tell you when and where things are so you
can see how it works". Asked where the mode lives, he chose the framework: off by default, and
any project switches it on, in development or in production. This is that mode, the outline
(DESIGN 9, 5.3, 8).

- **The switch is two, and neither is the address.** A project turns it on with `outline: true`
  in its config, a decision about the project like its budgets; a visitor then turns it on for
  themselves with a control on the page, kept in their browser's own storage. The query was
  not used: it is part of what a kept answer is kept under, and it is sent to services and, where
  declared, to other servers, so a word in it that only draws boxes would have changed what is
  fetched and kept.
- **Drawn over the page, never on it.** Expected: an `outline` on each envelope. Found: nothing
  sets an envelope's `display`, so a browser lays it out as a run of text, and around a block it
  has no box worth the name; making it a block would move things. So the outline is one element
  after the body with a root of its own, and each box is measured from the envelope's own boxes
  and the element at the top of what it holds (MDN, `Element.getClientRects` and
  `Range.getClientRects`, read 2026-10-12). No envelope gains an attribute, so DESIGN 2.4's set
  stands, a kept answer is untouched by construction, and no sheet is linked inside an
  assembly's shadow root.
- **The account is named field by field.** The server writes one data block after composing a
  page: for each placement its id, name, view, which rung answered, the milliseconds, whether
  it mounts, and how many a request refused. The composer's own account also holds what a
  failure threw, the id it was logged against and why it fell back; none of the three is
  copied, since the page goes to whoever asked for it and DESIGN 3.3 tells a visitor an id and
  never a cause. A block inside an envelope is an assembly's word and is passed over.
- **Served by the framework, only where it is on.** The script, the module and the stylesheet
  are under `/_assemblejs/outline`, outside the devtools, which production never mounts, and
  public as the built browser files are, since a public page of a guarded server must load
  them. A server with it off mounts none of the three. Under the default policy a stylesheet
  from the server's own origin is allowed and so is setting a style property; a `style`
  attribute is not, and none is written (MDN, `Content-Security-Policy: style-src`, read
  2026-10-12).
- **A published entry point, `@assemblejs/core/outline`.** The alternative was the script as one
  string in the server, as the reload script is; that is two lines, and this is fifteen
  modules. As an entry point it is typed, linted, tested one file to one test as every source
  is, and listed in the reference; the server serves the package's own build of it, found by
  the package's name so it is one file from the build and from beside the source.
- **Proof.** A page's bytes were captured from the build before the change, ids aside; with
  the option absent and with it `false` the new build sends the same bytes, and a spec holds
  the two to each other. The account's two probes were each watched red on an account that
  carried what a failure threw and the id it was logged against. In the owner's Chrome, on two
  scratch servers on this machine under the default policy: ten assemblies boxed, this server's,
  another's with what it composed inside, a kept answer, a fallback, a deferred one filled 448
  ms after the page began and one in a shadow root; each of five frames measured equal to its
  assembly's own box to the pixel; and all forty elements of the page stood where they stood
  with the outline off. `browser/outline.browser.ts` holds the same in the browser proof, which
  has not run yet and runs in CI; its claim that nothing moves was watched going red in Chrome
  on an envelope given a box and a pixel of padding.
- **The core's tarball budget moves from 86000 to 98000.** Measured at 94,991 bytes after this
  change, from 82,328. The module that draws the outline and its declarations are some 8,500 of
  that as packed, and the stylesheet, the account and the routes the rest. The module is served
  as it is built, so it reads in a browser's own tools as it reads here, and each of the three
  files is tagged by its content: a browser asks every time and is told when what it holds is
  still the file.
- **Not done, and why.** A box for an assembly inside an open modal dialog is drawn beneath the
  dialog, which the browser keeps above everything. Another server's account of what it
  composed is in its own log, so those boxes say what holds them. How long the server took to
  fill a deferred placement is not on the page; the box says when it arrived.

## 2026-10-12: an outline's box is the assembly's, not the line it stands in

The outline's first run in the browser proof was red on one of its four cases (`ci`
38207626887, `browser proof`; the other four jobs green): no frame stood around a section with
a margin. The seat's own red, found by the proof written for it, and fixed forward.

- **Expected:** a box is the smallest that holds the envelope's own boxes and the top of what it
  holds, which on the two scratch servers was each assembly's own box to the pixel.
- **Found:** around a block, Chromium answers an envelope's own box as the whole line the block
  stands in (`getClientRects` on the envelope: three boxes, the middle one the page's width).
  Nothing on the scratch pages had a margin at its sides, so the two were the same there. On
  the proof's page a section with sixteen pixels of margin was boxed from one edge of the page
  to the other: read in the owner's Chrome on a copy of the proof's page, `0,40,960,132` drawn
  where the section stands at `16,40,928,132`.
- **Now:** a box is measured from what the envelope holds, its elements and the words written
  straight into it, and from the envelope itself only where it holds nothing that takes room.
  On the same page the three frames the proof asks for stand within a pixel of their
  assemblies, and a unit case holds the rule with an envelope whose own box is its line.
- **The change's own note** is the one pending for the outline; nothing of the first measure was
  published. The core's tarball is at 95,047 bytes of its 98,000.

## 2026-10-12: what an envelope holds is measured as the envelope is, and the proof keeps its files

Two things, one push. The fix before this one went red in the browser proof too (`ci`
38208234440, `browser proof`, 44 of 45 that ran), on a different case and for a reason of the
proof's own; and a reader of that fix found the defect it fixed still standing one level down.

- **The proof removed its own files.** `browser/outline.browser.ts` made its built files once,
  when the file was loaded, and removed them when its hooks finished. A worker handed a second
  case of the file later ran the hooks again and found the directory gone
  (`ENOENT: scandir '/tmp/outline-…'`). The first run had not shown it because its failure
  restarted the worker. The files are now made by the hook that needs them, each time it runs.
- **Expected, of the fix:** a box measured from what the envelope holds is the assembly's own.
- **Found:** only where what it holds is a block. An element inside it that the browser also
  lays out as a run of text answers for the whole line just as the envelope did, and the first
  such element is another envelope: an assembly whose view holds assemblies at its top, with
  nothing around them, was still boxed as wide as the page. Watched in the owner's Chrome on the
  pushed build, by standing one envelope inside another: `0,40,960,132` drawn around a section
  at `16,40,928,132`.
- **Now:** an envelope inside the envelope, or anything else there laid out as a run of text or
  with no box of its own that holds elements, is measured by what it holds in its turn, its
  shadow root included. On a page with an assembly that holds two others and nothing else, its
  frame is the two of them together, `16,520,928,128`, read in Chrome; the proof holds that
  case, and two unit cases hold the rule.
- **One check in the proof meant nothing.** It asked that the chip of an assembly named `kept`
  say "kept", which its name alone satisfied. The assembly is `prices` now.
- **The change's own note** is still the one pending for the outline.

## 2026-10-12: a Lit element waits for its view

Found by the showcase, on its second page. The catalogue team's product page holds a Lit
element that shows a scale, its steps handed to it as a property; in the owner's Chrome it was
drawn twice, with `Error: Unhandled shorter than expected iterable` in the console, on the
shop's page and on the catalogue server's own.

- **Expected:** a Lit view's elements hydrate the markup the server rendered for them.
- **Found:** they hydrated before the view had given them anything. A view's module defines
  its elements, so they are upgraded the moment it loads, and Lit hydrates an element as soon
  as it is defined; the view's own hydration, which is what sets an element's properties, comes
  after. An element whose template is made from a property rendered from what its constructor
  set, an empty list against the three items the server sent, and Lit threw and rendered the
  list again beside the first. Every Lit element the suites had was made from attributes or its
  own state, which the constructor and the markup agree on.
- **Now:** the server marks each element a view holds `defer-hydration`, which is Lit's own
  mark for it (`deferHydration` of `@lit-labs/ssr`'s render, "to signal that the elements should
  not automatically hydrate", lit.dev, SSR server usage, read 2026-10-12). Lit's hydration of
  the view sets the element's properties and removes the mark, and the element hydrates then.
  A view that never mounts leaves its elements as the server sent them, which is what never
  mounting means.
- **Proof.** The server case red before (the markup had no mark) and green after; the browser
  half's case hydrates that markup with the element defined first, adopts the server's two
  items and renders a third when the property changes, and was watched red on the markup the
  server used to send. Every cheap gate, every suite and the rendering fixture green; its
  tarball is at 8,369 bytes of 9,200. And in the owner's Chrome, from fresh tarballs: the scale
  is drawn once, three steps and the right one lit, on the catalogue's page and on the shop's
  page that holds Lit assemblies from three servers, with nothing in the console.
- **Seen beside it, and not fixed here.** Lit's support for hydration is one hook on the page,
  `globalThis.litElementHydrateSupport`, and each server's bundle sets it. On a page that holds
  Lit assemblies from two servers the last bundle to load owns the hook, so the other's
  elements are updated by a copy of Lit that is not theirs: the stack of the error above ran
  from the reviews server's chunk into the catalogue's element. With one version of Lit on
  both it works. A row holds it.

## 2026-10-12: a Lit element the view binds nothing to is let go by the view

The fix before this one was red in the browser proof (`ci` 38210828288, `browser proof`, 45 of
46): the Lit shell of the frameworks example, an element with nothing bound to it, no longer
counted. The seat's own red, its sixth, and the second of this kind: a renderer changed, its
own suite green, the examples not walked before the push.

- **Expected:** marked to wait, every element a view holds is let go by Lit's hydration of the
  view.
- **Found:** Lit lets go of an element as it sets what the view binds to it, and of no other.
  Its server render writes the marker its hydration stops at only for an element with a binding
  or one inside another element (`@lit-labs/ssr` `render-value.js`, `possible-node-marker`), so
  an element at the top of a view with nothing bound to it was marked `defer-hydration` and
  never let go: the server's markup, with no handler on it, for ever. Every Lit view of the
  showcase binds something, which is why the seat's check in Chrome did not see it.
- **Now:** once the view has hydrated, the browser half removes the mark from each of the
  view's own elements that still carries it: those in the view's tree that are not inside an
  assembly it places, which is that assembly's view's to let go, nor inside another element's
  shadow root, which Lit lets go as that element hydrates.
- **Proof.** The fixture view holds both kinds, and the browser half's case for the unbound one
  was red before (`defer-hydration` still on it) and is green; a third case holds that an
  element inside another's root is left alone. And walked in the owner's Chrome on the built
  frameworks example, the page that went red: the Lit shell counts to 2, the React assembly it
  holds is the element the server sent and counts, the Lit counter a Solid assembly holds
  counts and wears its own colour, no element is left marked, and the console is empty.
- **The rule the seat takes from it:** a renderer's change is walked on the built examples in a
  real browser before it is pushed, since the browser proof cannot run here.

## 2026-10-12: an empty Lit view can be placed from another server

Found by the showcase. The catalogue's roast scale renders nothing for a product that is not
beans; on the shop's page, placed from the catalogue's server, it was a fallback.

- **Expected:** what a renderer writes is well inside what the reader of a remote's answer
  reads (`scan-fragment.ts` said so).
- **Found:** Lit's server render writes `<?>` where a template is empty
  (`<!--lit-part …--><?><!--/lit-part-->`), and the reader refused `<?` as "markup the browser
  ignores". The shop logged `did not answer one envelope` and showed the fallback. On the
  catalogue's own page, where nothing reads it as a remote's, the same view was fine.
- **Now:** `<?` is read as the browser reads it, a comment that ends at the next `>`
  (html.spec.whatwg.org, tokenization, "bogus comment state", read 2026-10-12), where nothing
  in it could be a tag: one that holds a `<` is still refused, since the other readers of this
  markup do not know it for a comment and would read a tag written inside it as one; and one
  that never ends is still refused, since it takes the envelope's end with it. The case that
  held `<?x?>` refused said the browser ends it somewhere else, which it does not.
- **Proof.** Unit cases red before and green after; the scanner's browser proof generates
  such comments now, so Chromium is asked of each one the reader accepts. Asked ahead of it in
  the owner's Chrome, with the proof's own generator and its own check: of 400 accepted answers
  that hold one, in each of the proof's twelve contexts, a template and a shadow root, none
  left its envelope, and the browser made 3,144 comments of them.

## 2026-10-12: the market, a showcase of four servers

The owner's order of 2026-10-11, in his words: "ideally you use the cli like a user, then the
mcp like an ai, etc. to make production grade projects. THose will be our showcase projects and
examples/", "complex proejcts real world scenarious", "nad they need to be extremely complex.
not very simple", "with a mode on each to enable the boxes around them". `examples/market` is
that: a shop, Pour & Grind, as four servers, each one team's own project, and every page a
visitor sees composed on the shop's server from all of them.

- **What it is.** `shop` (the pages, header, search, basket, checkout, stock, a staff board;
  fourteen assemblies in twelve kinds of view, six apis, one a stream, nine pages), `catalog`
  (shelves, products, facts; six assemblies), `reviews` (two) and `fulfilment` (two). A product
  page is twelve assemblies from three servers. Remote placements with deadlines, fallbacks, a
  required one, kept answers and a deferred one; a remote trusted with the query; the product's
  own access check over a page, an assembly and an api; a stream onto the page's bus; budgets;
  and the outline on in every project.
- **How it was made.** In the scratchpad from packed tarballs, as a stranger: the shop and the
  catalogue begun with `assemblejs new` and `add assembly`, the reviews and fulfilment servers
  begun through the agent surface (`create_project`, `add_assembly`, then `check`, and for
  reviews `place_assembly`, `render_assembly` and `compose_page`). Every view, service, api and
  page template was then written by hand, those two servers' included: `place_assembly` put its
  tags where the layout did not want them, and the agent surface takes no route parameter, so
  it could not show a product's reviews (both rows already open). Walked in the owner's Chrome on this machine: a shelf
  narrowed, a grind chosen, a basket, a checkout, an order followed across three servers, the
  staff door, and each page with a server down. Screenshots are with the audit's evidence.
- **What it found, and what was done.** A Lit element drawn twice (fixed, "a Lit element waits
  for its view" and the entry after it); an empty Lit view refused from another server (fixed,
  "an empty Lit view can be placed from another server"); and three things the framework does
  not do that a shop wants, which are the owner's calls and which the showcase is built inside
  and says on its own About page: two servers' assemblies on one page share no bus, a remote
  assembly cannot call its own server from the browser, and nothing of who is asking reaches a
  service or an api. So where two teams must agree the address carries it (the grind), the
  basket is the browser's and the server prices it, and an order is found by its address.
- **What bringing it into the workspace cost.** Each `new` makes one server, so the showcase
  is four packages under one directory, and the workspace names `examples/market/*`. The
  packages' own versions, `workspace:*`, the frameworks at the workspace's versions, the unused
  gate told of each, and the header on every `.ts`. Three decisions:
  1. **The files `new` writes for an agent are not carried** (`AGENTS.md`, `CLAUDE.md`, the five
     MCP registrations), as no example carries them: an instruction file under `examples/`
     would be read by any session working there as its own, and the registrations name a
     server the example does not install.
  2. **Three scaffold files are set aside from the duplication gate**, in each of the four:
     `src/tokens.css`, `src/components.css` and `src/server.ts`, which `new` writes the same in
     every project it makes. Four teams' repositories hold four copies; here they stand side by
     side and took the gate from under four in a hundred to over. Everything else of the
     showcase is counted, and a bare control the shop styled in three assemblies is one class
     in its stylesheet now. The gate is at 3.35.
  3. **Its proof is one browser spec that runs in order**, `browser/market.browser.ts`: eight
     cases against the four built servers, an order placed by one being the stock the next
     reads. It has not run yet and runs in CI; each of its checks was made by hand on the
     running showcase in the owner's Chrome first.
- **No key is written down.** The staff door wants a key. `start.mjs` takes `STAFF_KEY` from the
  environment and, where there is none, makes one for the run and prints it; the browser spec
  makes its own. A default written into the example would have been the default credential the
  framework's own rule refuses.
- **Its budgets, and what `perf` made of them.** The five pages `perf` can ask weigh at most
  2.3 kB of document, 3.2 kB of styles and 3.3 kB of scripts, gzipped, against budgets of 14,
  12 and 90. It weighs none of the three whose route has a parameter, the product page among
  them, and it exits 1 on the staff's page, which answers a stranger 401: three rows, the last
  the next bite.
- **One showcase, and not a second.** He asked for complexity before number, and this is four
  projects. A second of another kind is not started; the rows still open come first.
- **The lockfile.** `pnpm install` for the four also rewrote one line it had left stale: the
  command line's test runner is now resolved against the esbuild the command line itself
  depends on (0.28.2) and not the one tsup brings (0.27.7). Its suite is green on it.

## 2026-10-12: perf does not fail a project for guarding a page

Found by the showcase, whose shop guards its stock board: `perf` exited 1 on it.

- **Expected:** `perf` weighs what each page sends a visitor and fails a page that does not
  answer.
- **Found:** it asks as a visitor who has not signed in, the board answers that visitor 401,
  and a 401 was a page that did not answer (`measure-page.ts`: anything but a 200 threw). So
  no project that guards a page could pass, whatever its pages weigh.
- **Now:** a page that answers 401 or 403 has no weight for a stranger and is said so, as a
  page whose route has a parameter is said:
  `not weighed, as it is not shown to a visitor who has not signed in`. The command goes on
  and its exit is the other pages'. A file an open page links that answers 401 is still a
  failure: that is a page that does not work.
- **Beside it:** `check` and the agent surface said "a ejs assembly" of a project missing its
  templates package. A renderer's name is said with its article now, `aRenderer`: "an ejs",
  "an html", "a react".
- **Proof.** Both cases red before and green after; every cheap gate and both packages' suites
  green; and on the showcase's shop, with the catalogue up, `perf` exits 0: five pages
  weighed, three not for a parameter, one not for its guard. The command line's tarball is at
  94,742 bytes of 98,000.
- **Not done.** A page whose route has a parameter is still not weighed, which in the showcase
  is the product page. Where a value would come from is a design, and has its row.

## 2026-10-12: where a placement may stand, by the parser's own rules

Three of the audit's minor rows on the composer and its tests (composer.7, composer.8,
tests.3), each read at the source and reproduced before it was believed.

- **A paragraph is closed at more than the reader knew** (composer.7, true). The reader of an
  open paragraph held the start tags that close one, and had not the list item, the
  description's term and part, the form or the table: a placement after `<p>text<li>` was
  refused as inside a paragraph the parser had closed. Each is in now, on the conditions the
  parser puts on two of them (html.spec.whatwg.org, parsing, "in body", read 2026-10-12): a
  form begun inside another is ignored and closes nothing, and a table closes a paragraph only
  in a document that is not in quirks mode, which is known of a template that opens with the
  HTML doctype and of no other, so a fragment's table is still taken as closing nothing.
- **A placement in a table outside its cells arrives empty** (composer.8, true, and wider than
  the row). In the owner's Chrome: an envelope written directly in a `table`, a `thead`, a
  `tbody`, a `tr` or a `colgroup` is moved out before the table, and its rows and its island
  stay in the table; in a cell or a caption it stays whole. The directive's one reader refuses
  it now, naming the part and saying where to place it. A `select` kept the envelope in this
  Chrome and is refused all the same: the row's claim was true of the parser every browser had
  until this year, and a page is not to depend on which one reads it.
- **A kept answer's lifetime was held to nothing** (tests.3, true). `cache.ttl` is milliseconds
  and said so nowhere; a deadline is refused at boot when it is not a positive, finite number,
  and a ttl was not, so `"60s"` kept an answer for ever. It is said on the declaration and held
  beside the deadline.
- **Proof.** Each case red on the committed reader and green after; a new reader,
  `strictParents`, with its own cases, one of them ten thousand rows in under a second. Every
  cheap gate, every suite and all five conformance fixtures green, and `check` says no
  problems of every example the command line builds and of the showcase's four projects; of
  `examples/html`, which is not one, it says there is no `src/server.ts` (the next entry). The
  core's tarball is at 96,873 bytes of its 98,000.

## 2026-10-12: what is written into a file is written as the file is laid out

Four rows of the audit and the showcase, on the command line and the agent surface (mcp.8,
docs.6, and the seat's two of 2026-10-11: `place_assembly` damages a template's layout and
places twice in silence; `add assembly` does not say a renderer is not installed). Each read at
the source and watched red on the committed code before it was changed.

- **A placement is laid out as the file is** (the seat's row, true). The writer put a line feed
  and the tag wherever it was asked: at column 0 beneath a neighbour indented eight, and
  between a closing body tag and its own indentation. It is one rule now, in a writer of its
  own (`writeTag`): where nothing but whitespace follows the place on its line the tag is a new
  line beneath, where nothing but whitespace comes before it a new line above, and anywhere
  else it is written inline with nothing added, because whitespace between two things on a
  line may show. The line is indented as what it stands beside is, and ends as the file ends
  its lines. A body that holds nothing has nothing to stand beside, so its first child goes one
  step in, the step being the least any line of the file is indented by: that is what the
  starter's own page does, and the proof is the starter's page itself. Placing into
  `pageDocument` gives, byte for byte, the `pageDocument` that places the assembly, at the
  start, at the end, before and after, into an empty body, and again with every line ended by a
  carriage return and a line feed.
- **The body is read as the parser reads it** (mcp.8, true, and wider than the row). The row
  said `<body-card>` was taken for the body: it was, a word boundary standing where the end of
  a tag's name belongs. Reading it found more. The writer kept a reader of its own for what is
  not markup, which knew a comment, a script and a style and not an attribute, so
  `<div title="<body>">` was the body too; it reads the core's `inertSpans` now, and its tags
  by the core's `TAG_NAME_END`, and its own reader is gone. And a template with no body tag
  took a placement at its start at offset 0, before the doctype, which puts a browser in quirks
  mode: it goes after the head's closing tag, or the html tag, or the doctype, whichever the
  template writes last of those, and at its end before a closing html tag where there is no
  closing body.
- **A second placing is said, not refused.** A page may place one assembly twice, each with its
  own attributes, and nothing in DESIGN or the core says otherwise, so the writer does not
  refuse it. It answers how many times the template places the assembly now, and the agent
  surface's two tools say so first of what to do next when that is more than once. To count,
  the template is read before anything is written, wherever the placement was asked for: one
  that cannot be read is refused at the start and the end as it already was beside a
  neighbour.
- **What `add agents` adds takes the file's own line ending** (mcp.8, true). Its part of an
  `AGENTS.md`, the import above a `CLAUDE.md` and a registration were written with line feeds
  into files that ended their lines otherwise. Each is ended as the file it goes into ends its
  first line.
- **A byte order mark is not a comment** (docs.6, true). A registration that opened with one was
  refused as "not JSON, which a comment in it is enough to cause", and the whole run with it.
  The one reader of a registration passes over the mark, so `add agents` and `check` both read
  the file, and what is written back keeps the mark first; so does a `CLAUDE.md` the import is
  put above. The row's second half, that `check` says nothing of a registration it cannot
  read, stands as it was written: `check` judges only what this command line wrote, and a
  registration it cannot read is the project's own file in a form a client may well accept. A
  problem there would fail every `check` of a project for a file `add agents` cannot mend, and
  `check` has no way to say a thing without failing for it (`runCheck` prints its problems and
  exits 1, or prints "no problems"). The one who needs to know is told where it matters:
  `add agents` names the file and its mend when it refuses the run for it.
- **Adding a view says what it needs** (the seat's row, true). `check` and the dev log named a
  renderer that was not installed, and the command that had just written the view did not. The
  reading is one function now, `rendererProblems`, asked by the build of every assembly and by
  `add assembly` and the agent surface's `add_assembly` of the one just written; the table of
  renderers names the framework a build compiles with the project's own compiler (Svelte, Vue),
  where the build's problems had held that list a second time.
- **Seen, and not a defect.** `check` says of `examples/html` that there is no `src/server.ts`
  to build. That example is the smallest server the contract allows, one `server.mjs` started
  by plain node with no build (its own first comment, and unchanged since 2026-10-03): it is
  not a project the command line builds, and `check` says so truly.
- **Not in this bite.** `new .` and the name it suggests (packaging.5) go with `create_project`
  (mcp.6), as both ask what a directory may already hold when a project is made in it. The
  stack a refused boot prints is a bite of its own: its mend is in the starter's server file,
  ten examples and a README, or in the core.
- **Proof.** Sixteen cases red on the committed code and green after: twelve of the placement
  writer's thirteen, two of the agent files', the reader of a registration, and `add assembly`. Every cheap gate green, the command line's 782 cases and the agent surface's 189,
  every other package's suite, and the agents fixture. Then at the artifact: a project made by
  the built `new`, and the built agent surface driven over stdio as a client drives it, six
  calls. Two assemblies added, the Svelte one answered with what to install first; four
  placements, each on a line of its own at the body's indentation; the second placing of one
  said first of what to do next; a child written into a view beneath its last line. And the
  built `add agents` over an `AGENTS.md`, a `CLAUDE.md` and a registration that ended their
  lines with a carriage return and a line feed, the registration behind a byte order mark:
  every line of each ends the one way after it (100 of 100, 3 of 3, 11 of 11) and the mark is
  first. The command line's tarball is at 96,752 bytes of its 98,000, and the agent surface's
  at 26,902 of its 27,000.

## 2026-10-12: a project is made where nothing is written over

Three rows of the audit (packaging.5, mcp.6, mcp.7), each reproduced with the built tools before
it was believed: `new .` answered `"." cannot name a package; lower case with hyphens: try
assembly`; `create_project`, over stdio, in a root holding a README and a `.gitignore`, answered
"this root already holds a project" and sent the agent to `add_assembly`; and a `dev.json` that
was a link out of the root made `render_assembly` and `compose_page` answer one line of an
error's text.

- **One decision of what a directory may hold** (packaging.5 and mcp.6, true, and one question).
  `new` refused any directory that was there, and `create_project` any root holding a file the
  starter writes, the README and the `.gitignore` among them, which is every repository a
  minute after it is made on a forge. Both ask `projectInto` now. What the starter does not
  write is left alone. A README is the author's and is kept as it is. A `.gitignore` keeps
  every line and gains the starter's entries it lacks, in its own line ending, since a first
  commit made without them carries the build's output; an entry is compared without its
  leading and trailing slash, so `dist` is not added beside `/dist`. The files a project
  carries for its agents are brought up to date as `add agents` does it. Any other file the
  starter writes, anything under `src`, and anything that is no file to read where a kept one
  goes, stands in the way: it is named and nothing is written. `create_project` says to add an
  assembly only where what stands there is a `package.json`; anything else it says to move
  aside.
- **`new` into a directory that is there is allowed, which it was not.** It said "already
  exists" of an empty directory. It is refused now only for what it holds, as the agent
  surface's is, and `.` and `./` are the directory the command works in: the project is named
  for the directory as it resolves, and the lines that say what to do next leave out a `cd`
  to where the command already is. Nothing is written through a link that leads out of the
  directory, asked of the root guard before the first write as `add agents` asks it. What the
  old refusal also covered is kept by a line of its own: a name that a file holds, or a link
  to nothing, is no directory to make a project in, and is refused in a sentence. Without it
  the first write failed in the system's words and a stack, which the first cut of this bite
  did, caught before it was pushed.
- **Whether anything is at a path is one reader's to say.** The command line asked
  `existsSync`, to which a link that points at nothing is a free place, and a write through
  one lands wherever it points. The agent surface had the reader that counts such a link
  (`isOccupied`); it is the command line's now, and the agent surface reads the command
  line's.
- **A suggested name is the caller's kind of thing** (packaging.5's other half). A name with
  nothing usable in it was answered "assembly" whatever was being named: a project, a page, an
  api file. Each caller gives its own example, so a project is told `my-app`.
- **A refusal is an answer** (mcp.7, true, and one dead guard beneath it). `devServerUrl` held
  `if (!withinRoot(...))`, and the guard never answers false: it throws. So a record that was a
  link out of the project ended every tool that asks for a dev server. The record is read
  inside the reading that already takes anything unreadable as no record. Above it, every tool
  is registered through one wrapper, `answering`: a path the guard refuses is answered in the
  words `check` uses of one, with its rule and its fix; what the system refuses of a read or a
  write is answered in a sentence that carries the system's own; and anything else is a fault
  of this server's, not a refusal, and is thrown on for the protocol to report as an error.
  The two helpers that carried an answer as JSON, one in each file that registered tools, are
  that wrapper's one.
- **Two budgets move, each at its measure.** The command line's tarball packs to 98,472 bytes
  and its budget goes from 98,000 to 102,000: it takes the decision above, `new` as a command
  of its own, and the reader the agent surface gave it. The agent surface's packs to 27,063
  and its budget goes from 27,000 to 28,500; it stood 98 bytes under before this bite.
- **Proof.** Seven cases of the agent surface red on the committed code and green after: three
  of `create_project`, the dev record, and three over the protocol, where the answer had been a
  line that was not JSON; and one of `new`, a file where the directory was named, red on this
  bite's own first cut. Every cheap gate green; the command line's 800 cases, the agent
  surface's 199 and the create package's 3; every other suite, and the agents fixture. Then at
  the artifact, with the built tools. `new .` in an empty directory, named for it, with no
  `cd` in what it says next. `new .` beside a README, a `.gitignore` and a licence, the first
  two ending their lines with a carriage return and a line feed: fourteen files written, the
  README as it was, the `.gitignore` three entries longer in its own ending. `new .` and
  `new taken` where a `package.json` stood, each refused in a line. The create package's own
  command with a dot. `create_project` over stdio in a repository holding a README and a
  `.gitignore`. And `render_assembly` answering ok with the dev record still a link out of the
  root.

## 2026-10-12: the gates are held to what they say

Four of the audit's rows on the gates, the tests and the READMEs (tests.4, tests.6, tests.7,
docs.8), a file that was left behind, and one row read and left to the owner. Each premise was
watched before it was believed, and each mend was watched refusing a wrong version of what it
guards.

- **The mirror gate passed over any file whose name ended as an entry's does** (tests.4, true).
  It exempted a source whose path ended in `index` or `bin`, so `account-index.ts`, a file of
  the core's outline with a function in it, needed no test. It has one; the gate never asked.
  An entry is known by its whole name now, as the organization gate knows one. The fixture
  holds an index at two depths and a bin, which are passed over, beside `account-index` and
  `trash-bin`, which are not, and the self-test is held to exactly the fixture's four findings
  where it had asked for any one of each kind. Watched red on the gate as it stood.
- **The organization gate's self-test asked only that each rule fired once** (tests.6, true).
  Three of four wrong versions of the gate passed it: the kebab-case check inverted, the name
  check inverted, the check on a module importing its own package removed. The fixture holds a
  file for every way a rule is broken now, thirteen findings written beside it in
  `findings.txt`, and a second tree is well made and held to none, so a check that stops
  refusing and one that starts refusing what is right are both seen. Fourteen wrong versions,
  made in a copy and thrown away, each went red. The well-made tree found a refusal of its
  own: a source that ends in `.tsx` was named with its extension and refused as not
  kebab-case. No package has one today; the name is read by whichever extension the file has.
- **Two tests asserted that a value was defined** (tests.7, true). The events context of the
  React and the Preact renderer was said to have no default, and to be each assembly's own,
  by a test that held only that the context existed. Each renders a probe now: outside an
  assembly it finds nothing, and beneath two assemblies each finds its own events and not the
  other's. With a default written into the context, both cases of both suites fail.
- **Two READMEs had fallen behind the code** (docs.8, true). The command line's named three of
  the five registrations a project is written with, and the repository's left `perf` out of
  the command's verbs. Each is held by a case now, watched red first: the command line's suite
  reads its README for every registration, and the repository's README for every verb the
  usage lists. `CLAUDE.md` leaves `perf` out of the same list; that file is the owner's, and
  the row that already holds its Tooling paragraph says so.
- **`packages/.gitkeep` is gone.** It kept a directory that holds twelve packages.
- **Read, true, and the owner's: the renderer contract nobody calls** (renderers.6). DESIGN 7
  says a renderer's server half is a `Renderer` whose `render` is handed a `RenderInput`, and
  each renderer package exports one. Nothing calls any of them: the build wires a view to its
  package's `renderToMarkup`, and the `helpers` and `url` a `RenderInput` names are supplied
  by nothing. To take the objects and their entry point out is to rewrite DESIGN 7 and the
  published surface of seven packages; to have the build call them is to change how every
  view is wired. Neither is a mend. The seat's advice is to take them out before the first
  release, as the design's own rule is that nothing ships that is not used.
- **Proof.** Each case above red before its mend, as said. Every cheap gate green, and the
  suites of the three packages whose tests changed.

## 2026-10-12: a view its compiler refuses is reported at the view

One row the seat found in the dev log on 2026-10-11: a Svelte view that does not parse was
reported at the module the build generates, `.assemblejs/client/broken.ts:10 Unexpected token`,
for a mistake in `src/assemblies/broken/broken.svelte`.

- **True, and of Vue as well.** Watched with each project compiler through the real bundler.
  Svelte's refusal of `<p>{</p>` on a view's second line came back as `entry.js:1`, the module
  that imported the view. Vue's refusal of an interpolation never closed came back at a line
  of this command line's own code, with the component's absolute path in its text. Anything
  else a compiler threw was reported where it was thrown.
- **The cause is the bundler's and is documented.** A plugin that throws is reported by where
  the file was imported or where the throw happened. A plugin answers its errors, each with
  the place it is an error of (esbuild.github.io/plugins, `OnLoadResult` and its own Svelte
  example, read 2026-10-12). Both plugins answer them now through one converter,
  `viewRefusal`: the view's own file, named from where the build works as the bundler names
  every other file, and the line the compiler names with that line's text.
- **Where each compiler says the line.** Svelte's error carries `start`, its line counted from
  one (svelte 5.57.0, `src/compiler/utils/compile_diagnostic.js`, read 2026-10-12). Vue's
  carries `loc.start`, and the suite holds the real compiler to it: the error `compileVue`
  throws for a component that does not parse gives Vue's own as its cause, and that cause
  names line 2 of a component whose mistake is on its second line. The column is not carried.
  Svelte counts it from nought and the base of Vue's was not read, and what a build prints
  names the file and the line.
- **An error with no line is the file's alone.** What Vue says of a template it parsed and
  could not compile is placed within the template's own text, not the file's, so it is
  reported at the component with no line. The line that reports a failed bundle printed
  `file:0` for such an error; it prints the file.
- **Not done, and why.** `check` still passes over a Svelte or a Vue view that does not parse
  (the row from check-rules.5). `check` could now ask the project's compilers as it asks its
  template engines, and to say what it found it needs a rule. The one for a view that does
  not compile, `a-template-view-compiles`, is worded for the template languages, and a rule's
  sentence is part of what DESIGN lists. Widening it is the owner's; the seat's advice is to
  widen it to every view a compiler reads.
- **Proof.** Three cases red on the committed plugins and green after; the converter's own
  cases; every cheap gate green and the command line's 810 cases. Then the built command line
  over the frameworks example with two views added and taken out again:
  `src/assemblies/zz-broken-s/zz-broken-s.svelte:2 Unexpected token` and
  `src/assemblies/zz-broken-v/zz-broken-v.vue:2 Interpolation end sign was not found.`, exit 1.
  The command line's tarball is at 99,110 bytes of its 102,000.

## 2026-10-12: the modules the build generates type-check

The starter's last open row: a new project has no `tsconfig.json`, and with one it does not
type-check. Measured before anything was changed, on the frameworks example under a strict
configuration: 39 errors, of three causes. Two are the build's own and are mended here. The
third is a decision and is the owner's.

- **The registry read what a view does not export** (16 errors, the build's). It wrote
  `mount: view.mount, shadow: view.shadow` for every framework view, and most export neither:
  undefined when the module runs, and an error to the compiler under any configuration. They
  are read through one typed reader the registry writes for itself, whose parameter gives both
  as optional: a view that leaves one out type-checks, and one that exports `mount` as
  something an assembly's definition does not allow is still refused. What the module does
  when it runs is unchanged; the reader answers what it is given.
- **The generated modules import files the compiler cannot read** (10 errors, the build's): a
  page's template, a plain or a template view, a Svelte or a Vue component. Each such import
  follows a comment that has the compiler pass over it. A declaration was the other way, and
  was measured and left: Svelte ships its own for `*.svelte` (svelte 5.57.0,
  `types/index.d.ts:3319`), a Vue project keeps one for `*.vue`, and with TypeScript 6.0.3 two
  declarations of one pattern are `TS2300` where libraries are checked and, where they are
  not, the first one found wins in silence. A declaration written into `.assemblejs/` would
  also be a global of the whole project, for every `.html` it ever imports. The comment is
  the one that passes over a line whether or not it is an error, since the stricter one is
  itself an error in a project that does declare the pattern. A common linter rule refuses
  that comment, so the line above each has a linter pass over it, naming no rule: one that
  named it is an error where the rule's plugin is not installed, and one directive for a
  whole module is reported as unused in every module with nothing to hide. Measured in a
  fresh project with eslint 10.12.0 and the quickstart configuration of typescript-eslint
  8.71.1: after a build by yesterday's command line, 4 errors, all of `dist/server.js`; after
  the first cut of this bite, 6, two of them the comments; after this one, none outside
  `dist`, which a project that lints passes over already. The repository's own configuration
  passes over `.assemblejs` as it does `dist`: it had linted an example's generated modules
  on any machine that had built one, and on no other.
- **Measured after.** The frameworks example: 13 errors, none of the 26 above. A fresh project
  from the packed tarballs with `typescript` and `@types/node` installed: one error before its
  first build, that `src/server.ts` cannot find the generated project, and none after it,
  with TypeScript 7.0.2 and with 6.0.3.
  The same project's modules generated by the command line as it was packed yesterday: two
  errors, its two imports of `.html`.
- **THE OWNER'S, with what was measured: whose JSX a file is** (the 13 that remain). The build
  knows it by where a file is: a `.tsx` in a Preact assembly is Preact's, its helpers
  included, and the build writes `@jsxImportSource` on the first line of what it hands the
  bundler. TypeScript knows it one of two ways, and neither is by directory: one setting for a
  whole configuration, or that same line in the file (TypeScript's tsconfig reference,
  `jsxImportSource`, read 2026-10-12). So a project that mixes frameworks type-checks only if (a) every `.tsx` of a
  Preact or Solid assembly carries the line, which `add assembly` can write into a view and
  cannot write into a helper its author adds later; or (b) each such assembly carries a
  configuration of its own, which an editor honours and a whole-project check does not unless
  the root names each one, and naming is what a directory being an assembly exists to avoid;
  or (c) the command line type-checks the project itself, giving each file its line as the
  build does, which an editor never sees. The seat's advice is (a), with `check` naming a
  `.tsx` in a Preact or Solid assembly that lacks its line, since `check` knows whose it is.
  React's own JSX needs `@types/react` and `@types/react-dom` whichever is chosen.
- **THE OWNER'S: what a new project installs to type-check.** The starter writes no
  `tsconfig.json` and depends on neither `typescript` nor `@types/node`; with those two and a
  configuration it type-checks, as measured. They add 4 packages and 6.3 MB to an install
  that is 87 MB after them, and what a new project installs is already a row of his. One fact
  decides what a script that type-checks must run first: `.assemblejs/` is generated and not
  committed, so on a fresh clone and in a CI run the project type-checks only after a build.
- **Seen, and his.** Every module the build generates into a project is headed "Copyright
  Ayers Electronics Inc. All rights reserved." beside the line that says it is generated. The
  file is made of the project's own directories; whether it says so is an identity string and
  not the seat's to change.
- **Proof.** Every cheap gate green; the command line's 815 cases; every other suite and all
  five conformance fixtures, each a project built by this generator and served. Every example
  built by the built command line, and the shadow example served and read: six envelopes, six
  shadow roots, six shadow stylesheets linked, none failed, which is `shadow` read true of a
  React, a Preact, a Solid, a Lit, a Svelte and a Vue view through the new reader.

## 2026-10-12: check compiles the views a build would

The row left from check-rules.5: a Vue or a Svelte view that does not parse is passed over by
`check`, and the build refuses it. Watched: with the new reading taken out of `check`, a
project whose one Svelte view holds `<p>{</p>` is answered with no problem at all.

- **Taken back from the owner.** The seat left this to him earlier today for want of a rule to
  say it under, calling a rule's sentence DESIGN's. It is not: no page of DESIGN or of the
  site carries a rule's sentence, and what the rule holds is already DESIGN's and the
  build's, that `check` never answers clean for a project `build` would refuse. The rule for
  a view that does not compile, `a-template-view-compiles`, keeps its id and is worded for
  every view a compiler reads, a template language's or a Svelte or Vue component's.
- **What `check` does.** Each Svelte and Vue view is compiled once, for the server, with the
  compiler the build would compile it with, and one that throws is a problem at the view, with
  what the compiler said on one line and the line it said it of, read as the bundler's report
  reads it. Without the compiler there is nothing to compile with, which is already a problem
  of its own; a view that leads out of the project is not opened.
- **The build does not ask this.** It meets the same refusal in the bundler, at the view since
  earlier today, and asking first would compile every Svelte and Vue view twice in each build.
- **A project made before this is told so.** A rule's sentence is one of those a project's
  `AGENTS.md` carries, so `check` in such a project says its instructions are not the ones
  this version writes, and `add agents` rewrites that part. That is what the check is for.
- **Proof.** The case red with the reading taken out of `check`, an empty answer for a broken
  view, and green with it. Every cheap gate green; the command line's 820 cases. The built
  `check` over the frameworks example with two views added and taken out again names
  `zz-broken-s.svelte` and `zz-broken-v.vue`, each at line 2, and exits 1; over every example
  and the showcase's four projects as they are, it says no problems. The command line's
  tarball is at 100,170 bytes of its 102,000.

## 2026-10-12: the agent surface shows a page as a visitor is shown it

A row the showcase added: `compose_page` and `render_assembly` take nothing of a route's
parameters or a query, so the product page of a shop, `/p/:sku`, was always composed with no
sku, and an agent never saw the page a visitor does.

- **True by reading, and the wiring was already there.** The composer takes a page's
  parameters and query, the transport carries them in the composition headers and the
  address, and the two tools sent neither. Both take `params` and `query` now and hand them
  on. Nothing in the core changed.
- **A page's values are held to its route.** `compose_page` reads the route the page's own
  file declares, as `perf` and `check` read it, and a value for a parameter that route has not
  is the call's mistake: refused before anything is composed, naming the ones it has. A
  parameter the call left out is composed without, as it always was, and said among the
  problems, since a visitor always arrives with one; the answer is then not `ok`, which is the
  point of the row. A route the file computes is known to nothing that does not run the
  project, and its page is held to no parameters. An assembly has no route of its own, so
  `render_assembly` hands on whatever it is given.
- **One reading of a route's parameters.** Three places told them by themselves: the server's
  route table kept the segments that begin with a colon, `perf` looked for `/:` in a route's
  text, and this bite's first cut wrote a third. It is `routeParameters` in the core, beside
  the reader of what a flat route is, and all three read it.
- **The tools that show a project are registered in a file of their own**
  (`registerSeeingTools`), as the tools that change one are, and the prompts and the
  resources. The file that wires the surface to the protocol is that wiring and nothing else.
- **Proof.** A real server of the framework stands in for the project's dev server in the
  suite, with an assembly whose service answers what it was asked with: the parameters and
  the query arrive in its island through both tools, called as functions and over the
  protocol. With the two tools handing nothing on and no route read, as they were, four cases
  fail: the three of `compose_page` and the one of `render_assembly`; the case of a computed
  route stays green, as it holds nothing new. The agents fixture asks the built surface over
  stdio, against the server of a project the starter wrote.
- **The agent surface's budget moves at its measure.** Its tarball packs to 28,356 bytes, 144
  under the 28,500 it was given this morning: the two tools' descriptions say what they take,
  and the tools that show a project have a file of their own. The budget is 30,000. The
  core's is at 97,075 of its 98,000 with the reader of a route's parameters in it.
