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
