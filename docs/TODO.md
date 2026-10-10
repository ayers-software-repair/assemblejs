# Todo

The ledger. Every task lives here; a task is checked off in the same commit that does it, never
in a batch afterwards. An unchecked box is work not done. Order is the order of work.

## RESUME HERE - the handoff. A fresh lane reads this block first and needs nothing else.

**RESUME HERE (rewritten at every landing; this one 2026-10-10 05:41 EDT, after the second reading's first two).**

STATE. Branch `next`. `origin/next` is `6a27a0c`, the release notes, pushed 2026-10-10
04:05 EDT; its `ci` run is 38036708423, its `release` run 38036708409 and its `deploy-site` run
38036708372, all read to their end, green: the deploy ran the release-notes gate before it
published, staging serves `/assemblejs/next/release-notes.html` as the branch has it, and the
page was drawn in the sealed browser at a desk's width and a phone's. Beneath it: the API
reference, `f1d217b`; A-04's memo, `8edfac6`; A-02, `af6d423`; two small rows, `20547ae`; A-03,
`9ed39ef`; one copy of the code in three packages, `0c43610`; and A-01, `a7d3edc`. Above it,
signed and pushed at 05:13 EDT: `8fe15a6`, the project's whole shape and each assembly as
resources; its `ci` run is 38039133712 and its `release` run 38039133595, both read to their
end, green. Above that, pushed at 06:52 EDT: `03a90fa`, nothing outside a project's root is
read; its `ci` run is 38041855065 and its `release` run 38041854943, both read to their end,
green. Above that, signed, pushed with this block: the second reading's first two findings,
which change `site/**`.
Every package reads `1.0.0-next.0`; twenty-one changesets are pending. The owner's overnight
order (estate D1216): work the bites to code completion and get the landing page onto
staging; no questions until morning. The landing page is on staging: `/assemblejs/next/` on
the staging domain answers 200 (DECISIONS 2026-10-09, staging), and a `site/**` push on `next`
deploys there. `/assemblejs/` deploys from `main`, which has no `site/` yet: the owner's
morning list. His rulings in this seat stand: no subagents, the seat does the work itself;
every bite since is self-verified by mutation (DECISIONS 2026-10-09, S-02).

THE ORDER OF WORK, set by the lead on 2026-10-10 a little after 05:20 EDT:

1. DONE, `03a90fa`: every file a reader opens is held to the root, after links are followed,
   in the agent surface and in `check`, by one definition both use.
2. THE SECOND READING OF THE DESIGN, nine findings, at
   `~/source/AUDIT/evidence/2026-10-10-assemblejs-second-reading/findings.txt`; the rows are
   in Phase 2 below, each fixed or open. Its 1 and 2 are done, pushed with this block: a
   project's assembly has one view and no surface tells its author to choose one from data;
   the directive is written closed wherever it is shown. NEXT is its 4, with a spec: an
   `<assembly>` a view writes unescaped from data is a placement, said nowhere in the design.
   Then 3, 5, 6, 7 and 8, by this seat's ranking: 3 first, since two of its consequences are
   held by no spec.
3. THE ENVELOPE'S WORDS, parked on the local branch `wip/envelope-vocabulary` (`09ff5c5`, not
   pushed): its message says what is done and what is left. Bring it onto `next` after 2.
4. `assemblejs://contract` from those constants, with a spec that holds it to what a real
   server sends; then `compose_page` by a page's name (two rows in Phase 3 below).

Then registrations for the clients beyond the three, and the rows under "AFTER IT" below.
Five rows wait on the owner and are on the estate's morning list: A-04, whose memo is
`docs/studies/built-in-components.md`; showing an agent a framework view, which means running
the project's code; whether the twelve packages share one version, which a new project's
manifest and the release-notes gate are both written as if they did; folding the changesets
waiting into the first entry before the first publish; and whether an assembly in a project
may have more than one view (DECISIONS 2026-10-10). A-01,
A-03 and A-02 are done, the API reference and the release notes are done, and the
subassembly rung, S-01 to S-09.

HOW A BITE IS PROVED. Pushes: only `next`, one per landed bite, each run read to its end; a
push that touches `site/**` also fires `deploy-site`, and its run and the staging page are
read too. Each mutation is run alone, by a harness that puts the file back from its own bytes
and compares the hash of every changed file before and after; a run with no failed spec is
invalid, not red. The browser proof runs here: give the suite the estate's sealed launcher as
`ASSEMBLEJS_CHROMIUM`, one worker, in the background, `TMPDIR` left alone (DECISIONS
2026-10-09, S-06). It rebuilds every package's `dist`, so never beside the unit suite.

AFTER IT, in any order: the house-style rows (the section of that name below; the estate's
record has them ready, pristine-keeping work having been allowed through the hold); the
eleventh dossier and the acceptance table (B-27a's first half); and the open rows of Phase 3,
each of which says what found it. Done and no longer waiting here: the API reference
(2026-10-10), the three truth fixes and CI's breadth (2026-10-05), the two inherited guide
claims (`67bd8bc`, `e920464`).

DEBTS AND CORRECTIONS. The guides for Preact, Solid, Lit and the template languages
(`2a884a6`) came from an agent worktree; a separate reader then verified all 39 code blocks
verbatim and every claim, and `e983859` applied its two wording fixes. That commit's body lists
three more fixes (the Markdown scaffold, "eight kinds", the templates page's missing section)
that were already right in the committed tree; the reader had reviewed an earlier draft. The
record here is the correction. Two claims the reader found inherited by all six guides are
the two rows under the site section. The first changeset is written and consumed (2026-10-09,
owner's ruling, DECISIONS "the first changeset"): every package reads `1.0.0-next.0`, and a
change under `packages/*/src` from here on carries a changeset.

OWNER-ONLY: the trusted publisher per package on npmjs.com, the `release` environment's
reviewer, branch rulesets, the setting that lets Actions open the version pull request, the
first publish of each package by his hand; B-27a carries the second halves of B-24, B-25 and
B-26. Done by his hand: the Actions allowlist (every workflow has run since 2026-10-05),
`RELEASES_PAT` (2026-09-11), the OIDC role `gh-deploy-assemblejs-site` (2026-10-07).

HOW THIS LANE WORKED, so the next one is not slower: implement; tests; watch each claim red by
a mutation and restore by the inverse edit; conformance or browser proof where one applies;
the structural gates; `pnpm check` in the background (`pgrep -f "bin/pnpm check$"` then
`tail --pid`); a verification agent with no stake, its findings fixed; DECISIONS and the TODO
box in the same commit; `git commit -s -F <draft>`; `git push -u origin next`. Agent
worktrees under `.claude/worktrees/` are ignored by lint since 2026-10-09; a dead lane's
worktree is still removed when found. Every suite builds a stale package before it reads it
(`scripts/build-when-stale.mjs`), so a test never runs against yesterday's dist.

**1. THE REWRITE.** A from-scratch rewrite of a private production v1 (server-composed
micro-frontends: pages composed from assemblies, each in its own framework, hydrated as islands),
published as `@assemblejs/*`. `docs/DESIGN.md` is the contract, `docs/PLAN.md` the frozen rung
ladder, `docs/DECISIONS.md` every ruling with its reason. B-01 through B-12 are DONE, B-09 and
B-09c included. The browser suite
(`pnpm test:browser`) is outside `pnpm check`; on a machine whose Chromium is not the one this
Playwright expects, `ASSEMBLEJS_CHROMIUM` names the binary.

**B-09 IS DONE (2026-10-03).** Its record, kept for the next lane: Found on resuming, and logged in `docs/DECISIONS.md`: the server
served the assembly endpoints but no PAGES - nothing turned a template into a composed document
or linked a browser runtime - and B-09's proof (create, build, `node dist/server.js`) needs both.
So B-09 lands in four commits: pages in core (done), then `build` (done: esbuild owned by the
CLI, the server bundle keeps packages external so it runs with no bundler), then `dev` (done), then
`@assemblejs/create` and the tarball proof (done, `pnpm proof:create`).

**THE EXACT NEXT STEP:** the subassembly rung (the `NEXT:` row below; owner's ruling in
DECISIONS 2026-10-05 "rulings"). Every row through B-26 that needs no owner is done; the second
halves of B-24, B-25 and B-26 are folded into B-27a, the owner's. The owner answered every open
question on 2026-10-05; the rulings entry in DECISIONS lists them and what each lands with.

**ORDER AND DEPENDENCIES of the open rows:** B-22..B-24a conformance (done) -> B-25a budgets
(done) -> B-26a release dry run (done) -> the subassembly rung -> B-27a/B-27b (the owner's). The
five house-style rows and the release-notes rows can land any time. The site's guides are
written.
Owner-blocked: branch rulesets, the bird mark (he has it), the palette, the old npm package
deprecation, the first publish by his hand. Done by his hand: `RELEASES_PAT`, the OIDC role,
the Actions allowlist (`ci`, the browser proof, conformance and the Scorecard all run).
Answered 2026-10-09: one changeset now; the packages read `1.0.0-next.0` (DECISIONS "the
first changeset").

**THE CLIENT DOSSIER ROW (Phase 1) cannot be resolved from here.** The dossiers and the reference
clones live outside this tree by design and a cloud session has neither; its outcome was never
recorded. It stays open for the owner.

**2. THE HOUSE-STYLE KIT (private `platform` repo, `codestyle/`).** v0.23.0 is tagged and pushed;
nothing unpushed there. PENDING: the ruling document's section 16 (in the business-site repo,
`docs/CODESTYLE-HOOKS-RULING.md`) still describes v0.22.0 - sync it to v0.23.0 (`_platform` is a
worktree at the pin with a hook guard; browser/test eslint globals; dependabot skip). Consumer
migration: `platform-pin.sh --sync`, re-copy `lefthook.yml` and `codestyle.yml` byte-identical, add
`identity_scan_exclude=` and `gates_since=` to `.codestyle`, `platform_ref=` ONLY where there is no
go.mod. THIS REPO IS PUBLIC: it never fetches private platform in CI - it VENDORS the scripts (a
fork PR has no secrets); target v0.23.0+, add both keys, and the byte-equality drift test runs only
on trusted events (push to next/main), never on fork PRs.

**3. THE REFERENCES.** Two read-only clones live OUTSIDE this repo (`chmod a-w`, `origin` removed):
the production v1 and its later rewrite. Never written, never copied from; every read is recorded in
the gitignored `docs/dossiers/`, which never enters this tree. The legacy names are banned by the
identity gate and are deliberately not spelled out anywhere in prose.

**4. TRAPS.** pnpm 11 `allowBuilds` replaced `onlyBuiltDependencies` (old key silently inert; a
clean clone could not install). Path mapping lives in `tsconfig.base.json` so no gate ever resolves
through a stale `dist/`. Revert a red-test probe by inverse edit, never `git checkout` (one probe
reached HEAD once). Three tests were once green for a reason they did not claim - mutate to prove
red, always. Svelte 5 hydration cannot run in a DOM shim (reads `Node.prototype` getters): Chromium
only, the test file says why. syncpack is deliberately `--dependency-types prod,dev`. The
`client-stays-browser-only` cruiser rule is ANSWERED by moving the file, never loosened. A waiter
using `pgrep -f` matches its own command line - use a captured PID, or anchor the pattern with `$`.
A pid file read the moment it exists can be empty, and a pid of 0 probes the whole process group:
wait for a pid that parses. The cli suite reaches the project's template engines through
`examples/templates`, which resolves to `packages/renderer-templates/dist`: build that package
before running the cli suite alone (`pnpm check` builds before it tests). `identity()` joins with a
separator that cannot collide (`a/b`+`c` vs `a`+`b/c`). The `<assembly>` directive matches
case-insensitively. The commit-msg hook runs commitlint + DCO; CI greps attribution trailers because
fork PRs run default settings. The house emoji gate refuses a document that QUOTES an emoji -
describe it in words. Run every test in a background shell; they block for minutes.

## Phase 0: the record

- [x] Repository skeleton and gates, every gate watched failing first (B-01, `c565074`)
- [x] Working rules written into `CLAUDE.md`
- [x] This ledger created
- [x] `docs/DECISIONS.md` created and seeded with every ruling so far
- [x] `docs/PLAN.md` created as the in-repo plan of record
- [x] `docs/PLAN.md` gains the design once the reference read is aggregated

## Phase 1: read the references whole

Both references are read-only clones outside this repository, with no remote: the production v1
(a private repository) and its later, poorer rewrite. Neither is being ported. The dossiers are
the record of what was read, and they stay in the private estate document store, never here.

- [x] Contract types, composition loop, content and manifest controllers, server boot, view
      builder, config, constants, public index (read directly, not delegated)
- [x] `context` dossier
- [x] `client` dossier
- [x] `events` dossier
- [x] `rendering` dossier
- [x] `lifecycle` dossier
- [x] `bundler` dossier
- [x] `generator` dossier
- [x] `utils` dossier
- [x] `examples` dossier
- [x] `legacy-additions` dossier
- [x] `legacy-tests` dossier
- [x] Ten of the eleven dossiers' load-bearing claims refuted at the source by a second reader
- [ ] The eleventh (`client`) verified: its first verifier died mid-run and the second one's
      outcome was never recorded. Open for the owner: the dossiers are outside this tree.
- [x] `docs/dossiers/00-BRIEF.md`: the dossiers aggregated into one design brief
- [x] `docs/dossiers/00-AUDIT.md`: the adversarial defect hunt over the v1, eight lenses, every
      finding refuted by a second reader; 74 raised, 61 survived, fifteen design constraints

## Blocked, needs the owner (one admin click each)

- [x] **Package metadata against `CLAUDE.md`'s identity law.** Ruled 2026-10-05: the twelve
      `author` lines are gone from `packages/*/package.json`; `repository` and `bugs` keep the
      organization's url, which provenance verifies against, and the law now says so
      (DECISIONS 2026-10-05)

- [x] **`CLAUDE.md`'s two claims now hold** (ruled 2026-10-05): `scripts/check-claude-gates.mjs`
      checks the gate paragraph against the `check` chain as `check:claude`, self-tested and
      watched red; the Packages list names `@assemblejs/mcp` (DECISIONS 2026-10-05)

- [x] **Actions runs on this repository** since 2026-10-05: `ci` (verify on node 22 and 24, the
      browser proof, conformance) green on `d5c1638`, `scorecard` green on `main` at `539bbd9`
      (2026-10-09). The earlier measurement, `total_count=0`, predates the organization's
      allowlist. The `release` workflow runs too and fails on the registry's 404 until the
      trusted publisher exists (DECISIONS 2026-10-09, "the first changeset").
- [ ] Repository settings that cannot be set from a token without admin scope: the branch ruleset
      on `main` and `next`, required status checks, signed commits, fork pull-request approval,
      private vulnerability reporting, CodeQL default setup, secret scanning with push protection,
      and the `release` environment with a required reviewer.

## Phase 2: the design

- [x] Write the design: the assembly contract as a spec before any code (`docs/DESIGN.md`)
- [x] Reconcile the design against everything already ratified before asking anything
- [x] Put the remaining open question to the owner, against the written design, in one pass
- [x] Record his answers in `docs/DECISIONS.md`
- [x] Freeze the ladder in `docs/PLAN.md`, one rung per gate, each with its proof command

### The second reading of the design (the cto seat for the lead, 2026-10-10)

Nine findings, read whole at
`~/source/AUDIT/evidence/2026-10-10-assemblejs-second-reading/findings.txt`. Each ends fixed,
rowed or the owner's; the numbers are the report's.

- [x] 1. In a project a child has one view, and every guide, the rule and the fix `check`
      gives told its author to choose one from data, with a sample that fails. Brought down
      to what a project holds on every surface: the seven guides, the sample, the rule's
      sentence, the fix, DESIGN 7 and 8. Core's own sentence, that a child with several views
      is placed with the one its parent's data names, is true of an assembly declared by
      hand and is held by a spec now (`core/test/server/render-local.test.ts`). Whether a
      project's assembly may have more than one view is the owner's: the estate's morning
      list (DECISIONS 2026-10-10, "the second reading")
- [x] 2. The design wrote the directive as an opening tag alone, which the finder refuses.
      Written closed in DESIGN 2.4, 7 and 14, in the rule, in what a finding shows, in two
      tools' descriptions and in core's own word for it; DESIGN 2.4 says an opening tag alone
      is refused and what fails
- [ ] 3. "Read from its source before any request" is true of fewer views than DESIGN 7 and
      14 say, and what follows for the rest is said nowhere: a module that does not compile, a
      slot reached through a namespace import, a view file that is not js, ts, svelte or vue,
      a template that does not read once its engine's parts are masked, and Pug. For such a
      view a deferred parent's children lose their stylesheets linked ahead, a page whose only
      browser half stands beneath one is refused a deferral or a stream, and a missing name, a
      missing view or a loop is not refused at boot. Say it in the design, and hold the first
      two with specs, which nothing does
- [ ] 4. NEXT, with the security work. "Which child it is may not come from data" is held by
      `check` alone: the composer reads the markup a view rendered, so a name a view writes
      from data is placed like any other, and any `<assembly>` a view writes unescaped from
      data is a placement. The one spec of it covers the escaped case. Say in the design what
      an unescaped value can place, and hold it with a spec
- [ ] 5. A loop is refused at boot only where every hop writes its view; a placement whose
      view is computed is held for its name alone and not followed, so such a loop is refused
      at render. DESIGN 3.4 and 7 say "at boot" of every loop
- [ ] 6. Four renderers' slots put an element of their own around the child,
      `<div data-assembly-slot="name">` in React, Preact, Vue and Solid, where Svelte, Lit,
      html and the templates write the directive bare. Neither the design nor a guide names
      the element, and DESIGN 2.4 says each envelope stands where the view placed it. Say it,
      or make the six the same
- [ ] 7. The listings in DESIGN 3.1 and 3.2 lack what nesting added and what came before it:
      `nested` on an answer, `children` on a diagnostic, the plan as a record by name with a
      page, a depth, a path, a query and params, the reasons `depth` and `cycle`, and `params`
      on a request
- [ ] 8. What the code does about a held assembly that the design does not say, each read by
      the reader and none judged: a parent whose markup holds a directive the finder cannot
      read fails whole; a parent's deadline ends its child too; the content endpoint hands
      its render no signal, so the children of a parent asked over HTTP are not stopped when
      the asker gives up; the byte cap is measured on a parent with its children inside it; a
      deferred fill sends no page id; a page waits up to a second for a remote's manifests on
      first sight of a version; a slot whose name or view changes in the browser writes a
      directive nothing composes; a placement whose settling throws renders as nothing, where
      DESIGN 3.3 says an empty envelope, and no spec reaches that branch. One of them is
      fixed: the comment in `core/src/client/find-envelopes.ts` said the opposite of DESIGN
      2.4, and now says what the code does
- [x] 9. Three citations in the record of S-09 held less than their sentence, or pointed
      beside what holds it. Corrected where they are read, DECISIONS 2026-10-10, "the second
      reading": the conformance case is retitled to what it holds, the cache's refusal is in
      `placement-cache.test.ts`, and a Svelte parent hydrating around its child is in the
      browser proof. Also from the report, not numbered: the remote spec asks a producer at
      depth 1 and at 8 and never at 7, the last depth at which a child is still placed

## Phase 3: the ladder

From the frozen ladder in `docs/PLAN.md`, which holds each rung's proof command. Each rung is one
pull request onto `next`; its proof command is run and its output pasted before the next rung
starts. Until the owner enables Actions, every proof is local only.

- [x] B-01 repository skeleton, gates, working rules (`c565074`)
- [x] B-02 core package shell: exports map and build only
- [x] B-02b the conformance toolchain: every organization rule and every packaging rule enforced
      by a tool that has been watched refusing a known-bad tree, plus the Claude tooling
- [x] B-03 the pure composer: deadlines, isolation, the fallback ladder, depth and cycles
- [x] B-04 the vocabulary module, the envelope and the three encoders
- [x] B-05 configuration from the process environment, validated at boot
- [x] B-06 the server: the three endpoints, header validation, the error contract
- [x] B-07 the browser runtime and the four mount modes
- [x] B-08 events: typed, addressable, replay opt-in, teardown exact
- [x] B-09 the CLI and create: discovery, templates, non-interactive; new, add, the
      non-interactive bin (the earlier `generate` verb is retired, build writes every module); pages served by core; `build` (esbuild owned by the CLI,
      `dist/server.js` under plain node); `dev`; `@assemblejs/create`. Proof: `pnpm proof:create`
      (packed tarballs, the starter run from its tarball, built, dev dependencies pruned, served)
- [x] B-09b the agent surface: @assemblejs/mcp, resources and tools, no model and no key
      Landed: the project-root guard, the queryable rules, render_assembly, compose_page,
      explain, the project and rules resources, and the stdio server, all driven end to end
      through the real protocol in the tests.
- [x] B-09c the remaining agent tools: create_project, add_assembly, place_assembly and check,
      the command line's own logic (planAssembly, placeAssembly, checkProject) reached through
      the same seam, every refusal a structure with its file, rule and fix. Proof: an agent
      creates, adds, places, composes and checks through the protocol alone
- [x] B-10 the first framework renderer: @assemblejs/renderer-react
- [x] B-11 the second framework renderer and the day-one proof: Svelte, and two frameworks sharing an event on one page in a real browser
- [x] B-12 services and apis: the service model (return not mutate, `after` not priority,
      ordering settled at boot with duplicates/unknowns/cycles refused), resolveData as the one
      function both endpoints call, data schemas deep-merged with a field claimed twice refused
      at boot, and the product's apis mounted by createServer on a flat route grammar with
      collisions and reserved prefixes refused at boot
- [x] B-13 remote assemblies: exact-origin allowlist (`remotes`, from `assemblejs.config.ts`),
      redirects refused, a declared host resolving into a private range refused, nothing
      forwarded but declared keys, the 2 MiB text/html one-envelope cap (`Limits.maxBytes` now
      read, for every transport), the manifest once per version with its assets hoisted, the
      per-placement cache keyed by url and answering a fresh entry before dispatch. Proof: two
      servers in one test, and a page hydrating another server's assemblies in Chromium
- [x] The second B-13 review's remote and root findings, each with a test watched failing: a
      cached answer now varies on the forwarded headers; a remote answer is read by a scanner
      that follows the browser's tokenizer and tree rules and refuses what it cannot read
      exactly (proved against Chromium over 100,000 seeded fragments, in every context that holds
      flow content, template content and a shadow root included), every envelope in it is
      stamped with its origin, and the runtime takes an envelope's owner from its nearest
      marked ancestor; the root guard follows dangling links; the manifest is read beside the
      content under the cap, JSON only, its files on the remote's own origin
- [x] The rest of the second B-13 review: `check` reads a placement a page declares from
      another server against the remotes `assemblejs.config.ts` declares; `dev` stops a server
      that ignores SIGTERM after a grace, a second Ctrl-C ends it at once and takes the server
      with it, a server dev stopped itself is not reported as stopping, and the config is
      watched; the private-range check is a block list of the reserved and address-carrying
      ranges it names, reading every spelling of an IPv6 address
- [x] The B-15 review's findings: a nested rule is scoped through its parent; `:scope` inside
      `:not()` or `:is()` stays inside the assembly; `:root`, `html`, `body` and `:host` name
      the envelope; `@scope`'s own `:scope` is left to it; every Svelte component in an
      assembly's directory brings its `<style>`, shared ones go with every Svelte assembly; a
      file a stylesheet names is built with it, and a relative `@import`, a missing file or CSS
      the build cannot parse is a structured problem `check` reports too; the default policy's
      refusal of inline styles is documented (DESIGN 5.2); an html-only project with styles is
      proved to serve them
- [x] The third review's findings: a stylesheet reference leading out of its assembly's
      directory (by `../` or a link) is a problem, never a published file; `check` reads page
      declarations and the config as literals through esbuild rather than by regex; `dev` ends
      on SIGHUP; the scanner's Chromium proof marks what it parses, requires every envelope
      stamped, and runs in more contexts, with a test only each guard fails; `html.dark` stays a
      condition on the document and `:host()` names the envelope with its selector
- [x] The fourth review's findings (Preact, Vue and the third round): a Vue render error rejects
      in Vue's production build as in its development one; a listening server ends its process,
      logged, on a failure nothing handled (DESIGN 12, missing since B-06); a shadow root's
      stylesheet follows the markup, proved hydrating for every framework (`examples/shadow`);
      MathML's mglyph and malignmark stay MathML in a text integration point; a remote placement
      inside a page's form is refused at boot; a shared JSX file takes its importers' framework,
      two of them an error; unsupported Vue SFC parts are build errors and `v-bind()` reaches the
      server render; `check` reads a declaration's default export with a parser; a selector
      reaching a sibling of the envelope is a style problem
- [x] The Solid and Lit review's findings: Lit hydration lost when another module loads `lit`
      first; Solid islands sharing one hydration registry and key space (render ids); the
      browser proof capturing elements after hydration rather than before; the Lit style
      removal's brittle pattern; Solid's resource scripts and async limits; TypeScript decorators
      in Solid files; Solid and Lit scaffolds built in the unit suite; peer ranges and pins
- [x] The verification of the Solid and Lit round: Vue's production build really under test,
      Solid's registry carried over safely and its script matched exactly, the inert `lit-early`
      fixture removed, the Lit guards and peer ranges tightened
- [x] Page route parameters reach the assemblies a page places: the placement request, the
      cache key and the remote transport each carry them, the last as `assembly-params`; a
      deferred placeholder carries them for the browser (DECISIONS 2026-10-05)
- [x] B-14 auth and the default policy: one decision (`decideAccess`) in the first hook every
      request meets; basic credentials from the environment or an `authenticate` check, never
      both; public routes, health always; a check that throws refuses; the default content
      security policy with the declared remotes on every html answer; same-origin by default.
      Proof: 401 without and 200 with on every kind of route, and a test that one place decides
- [x] B-15 styles: scoping, Shadow DOM opt-in, the documented holes. Each assembly's `.css` is
      scoped to its envelope at build time and linked only on pages that place it, its Svelte
      component's `<style>` with it; a framework view's `shadow` export renders it in a
      declarative shadow root with its own unscoped sheet. Proof, in Chromium from the built
      `examples/styles`: two assemblies' `.title` keep their own colours, one's `@keyframes`
      runs in the other, and the shadow assembly keeps a page rule out and still hydrates
- [x] B-16 the remaining four framework renderers, proved on one page (`examples/frameworks`)
  - [x] `renderer-preact`: `.preact.tsx`, server render, hydration (shadow roots included), the
        events hook; each JSX file compiles through its own framework's runtime
  - [x] `renderer-vue`: `.vue` single-file components compiled with the project's own Vue
        (`<script setup>` with its template inlined, or a separate render function; `<style
scoped>` under one id on both sides), an app per assembly, `useEvents()` by injection
  - [x] `renderer-solid`: `.solid.tsx` compiled by Solid's own Babel preset, which the renderer
        carries, for the server and hydratable for the browser; each mount adopts its markup by
        its own hydration keys, and the events by context
  - [x] `renderer-lit`: `.lit.ts` views as template functions, server-rendered with
        `@lit-labs/ssr` (elements into declarative shadow roots) and hydrated with its client;
        an element's own styles are adopted when it hydrates
  - [x] the page carrying all six, in Chromium: html, React, Svelte, Preact, Vue, Solid and Lit
        assemblies, each keeping the element the server sent and heard by every other
- [x] B-17 the template engines: EJS, Handlebars, Markdown, Nunjucks and Pug through
      `@assemblejs/renderer-templates`, each engine imported on first use and each template
      compiled once; `data` escaped, `children` raw; one project per language scaffolded, built
      and served, five of five
- [x] The verification of B-17: Nunjucks reads no `views/` directory, the browser filter and
      the templates example held by the unit suite, errors name the template's file
- [x] `build` and `check` compile each template view, so a template that cannot compile refuses
      the build rather than falling back at its first render (DECISIONS, 2026-10-03, "verifying
      B-17"; done 2026-10-05, Handlebars parsing when it compiles)
- [x] B-18 real-time over server-sent events: a streaming api, a page naming its one stream,
      the runtime delivering each message onto the bus; in Chromium, one push reaches a React and
      a Svelte assembly over one connection
- [x] The verification of B-18: early messages kept per topic, back-pressure, `defineApi`
      strict again, a stream with nothing to open it refused at boot, HEAD refused
- [x] `dev` refreshes the browser after a rebuild, over the server-sent events B-18 builds,
      development only and under the framework's prefix (DECISIONS, 2026-10-03, "dev is the
      production build").
- [x] The verification of dev reload and the B-18 fixes: `last` honours addressing, back-pressure
      drops only a stalled client, the reload routes under the devtools prefix, the page carries
      its boot
- [x] B-19 devtools, read-only, with the boot assertion: handed to the server as data, mounted
      in development only; boot refuses any route under the prefix that writes, proved with a
      POST; `@assemblejs/devtools` serves an overview and `project.json`
- [x] The verification of B-19: the assertion read after the router is ready, the setup builds
      devtools, devtools answer only loopback, a write refused in production too
- [x] B-20 the check, perf and deploy verbs: `check` prints what the project check finds and
      fails on any; `perf` weighs what each page of the production build sends; `deploy` writes
      `deploy/`, a build that runs; a generated project passes `check` and its deploy runs
- [x] B-21 the conformance harness and its first specs: a real project from the packed tarballs,
      DESIGN 2 held from the outside over HTTP (`pnpm conformance`, 14 of 14); the content
      endpoint's fallback for a throwing service, found by the first run, fixed
- [x] The verification of B-20: `perf` at the declared route, failing a fallback, stopping its
      server on a signal, reading tags as a browser does; `deploy` holds its dependencies to the
      server's imports and keeps a `deploy/` it did not write; devtools check the peer address
- [x] The verification of B-21: `assembly-path` is ancestors' identities in DESIGN as on the
      wire; the specs refuse a fallback under 200, data in a failure body, a bare envelope
      attribute; `check` refuses every route boot refuses; the harness leaves no server or
      directory; `perf` reads tags as a browser does; tests clean their temporary directories
- [x] B-22 conformance breadth, batch one: the matrix defined from DESIGN (DECISIONS); every
      renderer from its tarball through the contract, a static view shipping no script, and a
      page of all of them containing its one failure (`pnpm conformance`, 15 and 53 of 53)
- [x] The verification of B-22: the cache read only by a placement that declared a lifetime, the
      ladder in DESIGN's order; `assembly-path` the ancestors alone, a cycle refused on arrival;
      `check` refuses a page on an api's route; failure ids found in the server's log; a static
      page held to no script; the matrix says what it leaves out; `perf` reads tags as a browser
- [x] B-23 conformance breadth, batch two: two servers and a hostile third from the tarballs,
      remote placement, script, stylesheet, failures, cache, forwarding, apis, the stream
      (`pnpm conformance`: contract 16, remote 18, rendering 69)
- [x] The deferred placement, found missing by B-23: the placeholder the owner ruled the page
      ships, filled by the runtime after load, proved over HTTP and in a real browser
- [x] The verification of B-23: a deferred shadow assembly filled into its shadow root; a failed
      fill shows its fallback and its logged id; the page's query carried; boot refuses only a
      deferral nothing could fill; remote failure ids held, a 4xx, cancellation and expiry held;
      the harness stops a starting server on a signal; `check` holds apis to core's rules
- [x] `check` reads placement policy as boot does: a view the assembly lacks, policy for an
      unplaced name, the deferral rules, and the stream a page names, by the same functions
      boot calls (DESIGN 11: every problem found without building; DECISIONS 2026-10-05)
- [x] A deferred placement from another server stays refused at boot: deferral is local, a
      remote is fetched by the server with its deadline (owner, DECISIONS 2026-10-05 rulings)
- [x] A subassembly is placed by a directive in the view's markup, `<assembly name>` in a
      template view and a `Slot` by the same name in a framework view (owner, DECISIONS
      2026-10-05 rulings); then nested composition, services shaping a child's request, and a
      parent's depth and cycle refusal held across two servers in conformance. Designed
      2026-10-09 (PLAN 4.2, DECISIONS "the subassembly rung, decided"); landed in the nine bites
      below, 2026-10-09 and 10
  - [x] S-01 the one segment shape in `vocab/` (`SEGMENT_PATTERN`, `SEGMENT`), read by the
        finder, boot and the content url parser where three copies were; the finder skips
        `<script>`, `<style>`, `<textarea>` and `<title>` as it skips comments. Watched red with
        the anchors dropped (eight refusals passed) and the skip removed (2026-10-09)
  - [x] S-02 a view's children are composed: `renderLocal(assembly, view, input)` composes the
        view's markup at the arrived depth with its own identity added to the path, and answers
        `{ html, diagnostics }`; `localFetch` takes the server's limits and hands itself in;
        the content endpoint (`registerAssemblies`) composes from the headers it arrived with
        and logs nested fallbacks; one cap for arrival, the page's composer and every view's;
        `Diagnostic.children`; a failed subtree is never cached; a `signal` through compose.
        Self-verified (the owner's no-subagents ruling; DECISIONS 2026-10-09, S-02): each claim
        watched red under a mutation aimed at it, restored by the inverse edit
  - [x] S-03 a page links what every local envelope in the markup it serves needs
        (`localAssets`, through `pageAssets`), read from the markup so a cached parent's children
        keep their styles; a shadow parent links its children's sheets inside its root; the
        finder's comments and raw-text elements read in one pass (`inertSpans`). Self-verified:
        seven mutations, each run alone and watched red (2026-10-09)
  - [x] S-04 `findEnvelopes` enters every shadow root where it stands, document order kept, so
        `start` and a filled placement consider a child placed inside one; the deferred fill sends
        `assembly-depth: 1`. Self-verified: four mutations, each run alone and watched red
        (2026-10-10)
  - [x] S-05 a page links what another server composed inside its answer: `markRemote` names
        each nested assembly by its content endpoint (a fallback and a non-segment name left out),
        `learnedManifests` reads each one's manifest once per version and keeps it for the url
        that was asked; a failed subtree was already kept out of the cache at S-02. Self-verified:
        six mutations, each run alone and watched red (2026-10-10)
  - [x] S-06 `children` leaves the interface; `placementDirective` is the one definition of
        what a slot writes; `Slot({ name, view? })` in React, Preact, Vue and Solid and `slot()`
        in Svelte and Lit write it on both sides; a Lit assembly in a Lit view's own tree is
        refused by name when the view mounts (`litAssemblyInTree`), because Lit itself refuses
        only a child that binds an attribute; the `nested` page, three deep, and its browser
        proof, seventeen green here through the sealed launcher. Self-verified: seventeen
        mutations in the unit suites and two in the browser, each run alone and watched red
        (DECISIONS 2026-10-09, S-06)
  - [x] S-07 what a view places is known before it renders: the build reads each view's
        directives or slots and writes them into the registry (`AssemblyView.placements`); boot
        refuses a name with no assembly, a view it lacks and a view that leads back to itself;
        a page carries the runtime for a browser half beneath what it places, and a deferred
        placement is served with its children's files linked ahead; `check` says the same in
        the file, with three rules of its own (a computed name, an assembly inside itself, a
        Lit assembly in a Lit view's own tree); the agent surface renders and composes through
        core's transport and places a child in a view. Self-verified: thirty-one mutations in
        the unit suites and one in the browser, each run alone and watched red (DECISIONS
        2026-10-10, S-07)
  - [x] S-08 conformance, from the packed tarballs: a parent in every kind of view holds its
        child; a service shapes the child's view; a shadow parent links its child's sheet in its
        root; a chain to the cap and one past it; a Pug view that places itself; the headers a
        composer sends; a deferred parent; a view whose source places itself refused by `check`
        and at boot; and across two servers, a parent that brings its child, the child's sheet
        linked, the producer's refusals in its own log. In the `rendering` and `remote`
        fixtures. Self-verified: six mutations, each around a run of its fixture, each watched
        red (DECISIONS 2026-10-10, S-08)
  - [x] S-09 DESIGN 2.4, 3.4, 3.5, 7, 8, 10, 13 and 14 say the mechanism as it was built; the
        seven guides under `site/docs` show a child and no longer name `children`; the two
        reader memos and their synthesis are deleted, what they found in passing rowed below
        (DECISIONS 2026-10-10, S-09)
- [ ] A page's query reaches the services of this server's assemblies and not another server's,
      while the browser's fill of a deferred placement sends it. Decide which is meant, and say
      it in DESIGN 5.1 (found by the reader of core, 2026-10-09)
- [ ] A project has no way to set the depth cap: `createServer` takes `maxDepth`, the project's
      config does not, so every server the command line builds refuses at eight. Its place in
      the config is a ruling's to give (found by the reader of core, 2026-10-09)
- [ ] The content endpoint's render ends when its request closes: `registerAssemblies` gives
      `renderLocal` no signal today, so a server keeps composing children after the server that
      asked has given up (DECISIONS 2026-10-09, S-02 named the signal; the endpoint is the one
      caller without one)
- [x] `pnpm check:trailers` ran its gate with no range and stopped on an unbound variable: the
      script took a range from CI only. With no range it now checks the commits the branch has
      and its upstream lacks, and its self-test holds the range form too, in a repository made
      for the run. An unsigned commit, an attribution trailer beside a sign-off and a missing
      upstream were each watched red on a mutated copy of the gate (2026-10-09)
- [x] A framework view is read with the components it is split into: `viewModules` follows
      its imports by relative path, so a slot written in a component beside the view is the
      view's. Three mutations, each alone, watched red (2026-10-10)
- [ ] Slots `check` still does not read, and writes into the registry as nothing: one reached
      through a namespace import (`import * as renderer`), a Vue slot written in kebab case,
      and one in a module reached by a package's name. Read them, or say in the guide that a
      slot is written under the name it is imported by (DECISIONS 2026-10-10, S-07)
- [ ] A child placed inside a custom element's own shadow root (a `slot()` written in a Lit
      element's `render`) is found and mounted, and its stylesheet is linked in the page's
      head, where it does not reach: `localAssets` tracks an assembly's shadow root, not an
      element's (`server/local-assets.ts:45-50`, read 2026-10-09; not reproduced). Refuse it
      in `check`, or link the sheet inside
- [ ] Placement context: a child whose block content sits inside an open `<p>` (or any element
      the parser closes on its own) is moved out of its envelope, and its parent's island with
      it; silent today for a page's placements and for a view's. One check for both, where the
      directive is read: static sources in `check` and at boot, rendered markup at render
      (DECISIONS 2026-10-09, S-02; found while reading the fragment scanner, which is the
      remote reader and is not the tool for it)
- [x] A-01 agent instructions in every new project: `new` writes `AGENTS.md`, a `CLAUDE.md`
      that brings it to Claude Code, and the project's own MCP server installed and registered
      for Claude Code, Cursor and VS Code; `check` holds them current
      (`agent-instructions-are-current`) and `add agents` rewrites only what is its own in
      each. Proved from the tarballs, `pnpm conformance agents`, 10 of 10: each registration
      starts the installed server on the project, and an agent adds, places and composes an
      assembly through it. Self-verified: 66 mutations in the unit suites and 9 around a run
      of the fixture, each alone, each watched red (owner, 2026-10-09, PLAN 4.1; DECISIONS
      2026-10-10, A-01)
- [x] `assemblejs://project` is the project's whole shape, and each assembly is a resource of
      its own (DESIGN 13.3). The command line reads the shape, `readShape`, from the readers
      `check` has and never runs the project: every page with its route, what it places and
      the policy it declares; every assembly with its files, what its view places and where it
      is placed; every api's route; the config, field by named field. What a source computes
      reads `(computed)` and what a file that cannot be read would have said reads `(unread)`,
      never left out. `assemblejs://assembly/{name}` answers one assembly with every placement
      of it, is listed for each assembly, completes a name, and answers one the project has
      not with the protocol's code. A tool that writes an assembly tells the client to list
      again. The instructions `new` writes name both (found 2026-10-10 writing A-01; DECISIONS
      2026-10-10, "what an agent reads")
- [ ] `assemblejs://contract`, the third resource DESIGN 13.3 names: the three endpoints, their
      headers and the envelope as a structure, built from core's own constants and never as a
      copy of DESIGN 2, with a spec that holds the names in it to what a real server sends
- [ ] `compose_page` takes a template, so it cannot know the policy a page declares: give it a
      page by name. A url a declaration computes is a mark in what `check` reads and no url;
      a page that places another server's assembly composes with no network (13.2)
- [ ] Two things DESIGN 13.3 named are not built, because no source gives them: the shape of
      an assembly's data, and what is wrong on a running server with the id that finds it in
      a log. The second waits with the row above on how an agent is shown a running project;
      the first wants a run of the service or a reading of the project's types, and neither
      is decided (DECISIONS 2026-10-10, "what an agent reads")
- [x] NOTHING OUTSIDE A PROJECT'S ROOT IS READ, by `check` or by the agent surface (the lead's
      order, 2026-10-10; DESIGN 13.6). Found on the code as it stood: a finding quoted what a
      linked file held, `api "..." does not start with "/"` from an api file outside the root
      and `places "..."` from a template in a directory outside it. Now every file a reader
      opens goes through one read, `readInside`, held to the root after each link is followed;
      discovery takes the project's root, lists no directory that leads out of it and keeps a
      file that does by its name alone; a view's import that climbs out is not followed. Each
      is a finding by a new rule, `a-project-stays-inside-its-root`, and reads `(unread)` in
      the shape. The guard is the one the agent surface's tools had, moved down to the command
      line, which the surface now takes it from. A link that stays inside is read, and a link
      to a link is followed to where it leads (DECISIONS 2026-10-10, "nothing outside the root
      is read")
- [ ] The build's own reads open files directly: the hash of the sources, the stylesheets it
      carries into `dist/`. A link out refuses the build at discovery before either runs, and
      that is all that holds them. Give them the same read when the build is next opened
      (found 2026-10-10)
- [ ] `pageRoute` takes a declaration whose default export is not written as an object for one
      that declares no route, so `check` and the shape say the route its directory implies
      where only a run could tell. A value `check` cannot read should be unknown to it
      (found 2026-10-10)
- [ ] VS Code is handed this server twice: its Agent Host reads `.mcp.json` and is forwarded
      `.vscode/mcp.json`, one name with two sets of arguments, and its documentation does not
      say which it keeps. Open a new project in VS Code and read what it lists; keep one file
      for it if they collide (DECISIONS 2026-10-10, A-01)
- [ ] Registrations for the clients beyond the three: one entry in `MCP_REGISTRATIONS` each,
      after that client's documentation is read: opencode, Codex, Gemini CLI, Zed, JetBrains
      (DECISIONS 2026-10-10, A-01)
- [x] The command line and the agent surface shipped their code twice: `bin.js` and `index.js`
      were each the whole bundle. They, and the starter, are built split now, each entry point
      importing what both hold: the command line packs to 62 KB where it packed to 97, and its
      budget is lowered from 100000 bytes to 66000, which the unsplit build was watched
      crossing (found 2026-10-10 when A-01 crossed the old budget; DECISIONS 2026-10-10, "one
      copy of the code")
- [ ] A new project installs 90 packages, 15 MB, for the agent surface alone, through the
      protocol SDK's dependencies on express and hono. All are development dependencies and
      none reaches a deploy. Bundling the SDK into `@assemblejs/mcp`, with its notices, would
      make it one package: the owner's to say (morning list; DECISIONS 2026-10-10, A-01)
- [x] A-03 MCP prompts for the common tasks, listed by the protocol: `add_assembly`,
      `place_assembly`, `make_page` and `fix_findings`, each a brief that gives the order,
      where to stop and ask, and what an answer means. Proved from the tarballs in the
      `agents` fixture, on a project of its own: the protocol lists them, and an agent follows
      the one for a page to a page that composes and that the build serves, and the one for
      findings from a finding to none. Self-verified: 19 mutations in the unit suites and 4
      around a run of the fixture, each alone, each watched red (owner, 2026-10-09, PLAN 4.1;
      DECISIONS 2026-10-10, A-03)
- [ ] `render_assembly` and `compose_page` show a plain html view and refuse every other with
      the reason, a view in a framework or a template language being source its renderer
      compiles (B-09b, by design). So the loop the agent surface exists for closes only for
      the one kind of assembly a project has fewest of. WAITS ON THE OWNER: showing any other
      view means running the project's code, which the agent surface runs none of today, and
      a tool that runs what an agent just wrote is a way round the permission a person gave
      or withheld for a shell. Three ways are set out in DECISIONS 2026-10-10, "what it would
      take to show an agent a framework view"; the advice is to show it from the project's
      own running `dev` server and never run the code here. When it lands, the sentences
      brought down to what holds go back up: the landing page's "Your agent knows the
      framework" and its row in `site/LANDING.md`, the root README, the agent surface's own,
      DESIGN 13.4 and the last paragraph of 13.3, and the descriptions of the two tools (found 2026-10-10 writing A-03's briefs, which have to tell an agent it will be
      refused; DECISIONS 2026-10-10, A-03)
- [x] The command line's suite could fail by a race: two of its spec files built
      `examples/two-frameworks` in place, at once, and a build begins by removing the
      example's `dist` and `.assemblejs` (`build/build-project.ts:58-59`), so one file's
      bundling found the other's generated modules gone ("Could not resolve
      ./client/counter.js" in `test/build/bundle-client.test.ts`, seen once in about twenty
      runs, 2026-10-10 02:40 EDT). Each builds a copy of the example's source in a directory
      of its own, nested in the example as the other building specs already were; the two
      files run together twelve times without a failure, and no spec builds an example in
      place (2026-10-10)
- [x] The shape of a name was written six times beside the vocabulary's one. The discovery of
      pages, of assemblies and of api files, and `planAssembly`, test a name with core's
      `SEGMENT`; a project's own name is `PROJECT_NAME` in the command line, which `new` and
      the agent surface's `create_project` both ask. Seven mutations, one at each place a
      name is tested, each watched red (found 2026-10-10 writing A-03; fixed the same night)
- [x] A-02 `llms.txt` and `llms-full.txt` on the site, generated from `pages.json` and the
      pages by `scripts/site-llms.mjs` and declared in the manifest; `check:site` refuses
      either when it is not what the pages say, which is one check for a page added, a
      sentence changed and a hand edit. Every link relative, since the folder is published at
      two addresses. Self-verified: 16 mutations of the generator against its own self-test,
      and the gate watched red on three known-bad sites (owner, 2026-10-09, PLAN 4.1;
      DECISIONS 2026-10-10, A-02)
- [ ] The instructions `new` writes do not name the documentation a model can read. Add the
      address of `llms.txt` to them once it is settled which the project's version should be
      sent to, the channel's `/assemblejs/next/` or the product's `/assemblejs/`, and that
      address answers (found 2026-10-10 writing A-02; the product's address deploys from
      `main`, which has no site yet)
- [ ] A-04 built-in components and best practices: the design memo and the owner's answer
      first, then the starter design system, the accessible components and the `check` rules,
      each rule watched red (owner, 2026-10-09, PLAN 4.1). The memo is written,
      `docs/studies/built-in-components.md`, 2026-10-10: one tokens file every page links, with
      the estate's roles and their contrast held by `check`; components as styled native HTML;
      five rules; about nine bites. Its one question, what a built-in component is, is on the
      owner's morning list. Nothing is built until he answers
- [ ] The joint session: the owner on the command line, the agent on the MCP server, the same
      application from packed tarballs; every snag a row here (owner, 2026-10-09, PLAN 4.1;
      the stranger test of B-27b)
- [x] B-24a conformance breadth, batch three: trust and the command line, from the tarballs over
      HTTP (`pnpm conformance`: trust 43 of 43, every fixture green); each claim watched red on a
      mutation aimed at it (DECISIONS 2026-10-05)
- [x] B-25a size budgets and the pack check: every package's tarball under a budget the pack
      check holds and self-tests; a project's pages under the `budgets` its config declares, held
      by `perf` (DECISIONS 2026-10-05)
- [x] B-26a the release dry run, the local half: changeset status and version, every package
      packed and every tarball read, the registry asked; the release workflow's inputs corrected
      to the pinned action's, the pre-mode gap recorded (DECISIONS 2026-10-05)
- [x] `next` in changesets pre mode: `.changeset/pre.json` written by `changeset pre enter next`
      and committed (owner, DECISIONS 2026-10-05 rulings)
- [x] The first changeset, written and consumed on `next` (owner, 2026-10-09): every package
      reads `1.0.0-next.0` with its `CHANGELOG.md` beside it, the changeset filed under
      `.changeset/pre/`; the first publish, by his hand, ships this version under the `next`
      tag (DECISIONS 2026-10-09, "the first changeset")
- [x] The version is read from the package, never written by hand: the `^1.0.0` the command
      line writes into a new project's manifest resolved no prerelease, and the agent surface
      announced `1.0.0`; one function in the command line, `ownVersion(import.meta.url)`, reads
      the caller's own package.json, in `src` and in the flat `dist`, and the agent surface
      imports it; watched red on the literals and on a fixed path (DECISIONS 2026-10-09, "the
      version is read from the package")
- [x] Every suite builds a stale package before it reads it: `scripts/build-when-stale.mjs` in
      every package's vitest config, watched red on a build older than its source; the Vue
      config's duplicate `test` key merged; lint ignores agent worktrees; the release workflow
      skips publication while the registry has no `@assemblejs/core` (DECISIONS 2026-10-09,
      "tests build what they read")
- [ ] A duplicate-key lint for the config files (`vitest.config.ts`, `tsup.config.ts`), watched
      red on the Vue shape that hid a setup for a month (DECISIONS 2026-10-09)
- [ ] B-27a estate integration and the first prerelease, which now carries the second halves
      of B-24, B-25 and B-26 (owner, DECISIONS 2026-10-05 rulings): the acceptance table from
      the `legacy-tests` dossier, the Scorecard run, and the publish dry run with provenance
      from the `release` environment; all three are Actions or outside this tree
- [ ] B-27b the stable publish, after the cold quickstart

## House style / hooks stack (CTO ruled 2026-09-03..09; owner routed it here) — assemblejs's part

Ruling lives in ayers.repair/docs/CODESTYLE-HOOKS-RULING.md. These are the rows that touch THIS
repo only. Not begun; the work hold still stands and platform/codestyle is uncommitted upstream.

- [x] Release-notes DRIFT GATE: `scripts/check-release-notes.mjs`, in `check:site`, holds one
      `<section id="v...">` in `site/release-notes.html` to each version heading in the
      packages' `CHANGELOG.md` files, structure only, never prose; watched red on an injected
      version (2026-10-10; the release-notes block below has the rest)
- [ ] Keep changesets permanently (owner ruling: only a per-package bump computes which of five
      packages move when core moves). Do NOT swap to a commit-derived generator here.
- [ ] Keep husky + commitlint (already live). When the shared house check set lands, add a
      CROSS-TEST feeding the same fixture messages to commitlint and the shared script, asserting
      the same verdict, so one rule does not drift into two implementations.
- [ ] Adopt the canonical `.editorconfig` from platform/codestyle (49-line per-language version;
      mine is the 8-line minimal) plus a byte-equality drift test. Measured: prettier does not act
      on `trim_trailing_whitespace`, so this is uniformity, not a bug fix.
- [ ] Reconcile the eslint pin: platform/codestyle pins 10.10.0, this repo carries 10.9.1. One
      version or a stated reason. Prettier already agrees at 3.9.6.

## Release notes: the uniform pattern (owner order, 2026-09-03; ruled 2026-10-05; built 2026-10-10)

His order: "howland and magpie should do release notes the same way, same for assemblejs, uniform
pattern". The shape is written up at `ayers.repair/docs/RELEASE-NOTES-PATTERN.md`, derived from
what magpie and howland already converged on independently rather than invented. It was relayed
while this seat was on hold and recorded then; the hold is lifted (the estate's record has the
row ready), and the ruling of 2026-10-05 settled its one open point: the GitHub release body is
each package's `CHANGELOG.md`, written by changesets, the action's default.

- [x] `RELEASE_NOTES.md` at the root: user-facing, hand-kept, the register the site page is
      written from. Not the release body. Headed by the newest version, which the drift gate
      holds (2026-10-10)
- [x] `CHANGELOG.md`: per package, written by changesets from the first changeset (2026-10-09);
      never hand-kept at the root (DECISIONS 2026-10-05 rulings, 2026-10-09)
- [x] `site/release-notes.html`: one `<section id="v...">` per version, newest first, declared
      in `pages.json` and in the nav, as the reference product has it; written in the kit's one
      content shape, a heading and a table of rows (2026-10-10)
- [x] The GitHub release BODY: each package's `CHANGELOG.md` entry, created by the changesets
      action at publish time (`create-github-releases`, its default); never a tracked file
      (DECISIONS 2026-10-05 rulings)
- [x] THE DRIFT GATE: `scripts/check-release-notes.mjs`, in the shape of the reference
      product's, run in `check:site`, in the deploy before the site is published, and in the
      release job before it versions or publishes. One section for each version any package's
      changelog heads, exactly once, newest first, none for a version no changelog has, and
      `RELEASE_NOTES.md` headed by the newest. STRUCTURE ONLY, never prose: the two say the
      same thing in different registers on purpose. Eight mutations against its self-test, and
      three known-bad inputs on the real tree, an injected version among them, each watched
      red (DECISIONS 2026-10-10, "release notes")
- [ ] The release job's run of that gate has not been seen in Actions: the job is skipped
      until the registry has `@assemblejs/core`. Read the step at the job's first run, after
      the first publish (found 2026-10-10)
- [x] Standing bar, same ruling: no old releases left around. `gh release list` on 2026-10-10
      lists none, drafts and prereleases included. Checked again before any cut.
- [ ] The page says its one version is not yet published, which is true today. At the first
      publish, by the owner's hand, that sentence becomes the date, in the same change that
      publishes (found 2026-10-10)
- [ ] ONE VERSION OR TWELVE: waits on the owner (the estate's morning list). Measured in a
      clone: the packages' versions part ways at the first cut that does not name them all.
      Two things are right only while they share one. A new project's manifest asks for the
      server at the command line's own version, which after a cut of the command line alone is
      a version the server never had, and `npm install` fails. And the drift gate reads
      versions and no package's name, so a package reaching a version another already had
      passes with nothing written. Either one fixed group in the changesets config, which
      moved all twelve to one number when one renderer changed, and a gate that holds it; or
      the versions stay apart, the manifest asks for the versions the packages were built
      beside, and the notes say which package a version is of. Nothing is published, so no
      cut can meet it first (DECISIONS 2026-10-10, "release notes")
- [ ] BEFORE THE FIRST PUBLISH, by the owner's word (the estate's morning list): fold the
      changesets waiting into the first entry. The first publish ships the tree as it stands
      that day as `1.0.0-next.0`, and the version pull request after it would cut
      `1.0.0-next.1` for changes `1.0.0-next.0` already holds. Measured in a clone: manifests
      to `0.0.0`, the changelogs removed, the first changeset back from `.changeset/pre/`,
      `pnpm changeset version`; every package reads `1.0.0-next.0` again with one entry
      holding every change, and none waits (DECISIONS 2026-10-10, "release notes")
- [ ] The reference product writes a note's subsections as smaller headings and lists, and
      styles them in a stylesheet of its own (`magpie/site/site.css:11-14`); the kit has no rule
      for either. A fold for the kit, the platform's to make. When this site's pin has it, the
      page takes the reference's shape (found 2026-10-10; for the lead)

## Phase 4: the site, on the pattern howland and magpie already use

Measured from `magpie/site/`, `howland/site/`, both `deploy-site.yml`, and `platform/sitekit/`.
The pattern, verbatim: `site/` is the whole site, static, no build, fonts and images vendored;
`site/pages.json` is the single source of truth for which pages exist and how they cross-link;
`site/kit/` is gitignored and staged at deploy time from `platform/sitekit` checked out at the
product's one pin; inner pages link `kit/kit.css` plus the product's own `skin.css`; the landing
page is the product's own and does not use the kit; a push to the branch touching `site/**`
publishes, and the paths filter is an include, never an ignore list.

Three differences this product has, all ruled: the pin is `ayersPlatform` in the root
`package.json` rather than a go.mod line; there are two prefixes, `/assemblejs/` from `main` and
`/assemblejs/next/` from `next`; and one directory, `docs/api/`, is not static: the deploy
generates it with typedoc and the tree never carries it (DECISIONS 2026-10-05, 2026-10-10).

- [x] `site/pages.json`: the page list and cross-links, in magpie's schema
- [x] `site/index.html` + `index.css`: the landing page, the product's own skin, framework names
      typeset in our colours and no third-party logos
- [x] `site/install.html` and `site/start.html` from `platform/sitekit/templates/`, instantiated
      by hand as committed pages
- [x] `site/docs/index.html`: the model, the contract, and where to start
- [x] The guides: one per camp (for React devs, for Vue devs, for Svelte devs) and the
      linear tutorial, every file shown read from the repository's examples, DESIGN or its
      tests (DECISIONS 2026-10-05)
- [x] The guides for the other camps: for Preact, Solid and Lit developers and for template
      authors (EJS, Handlebars, Nunjucks, Pug, Markdown), in the same shape, every file shown
      read from the repository's examples, what `add` writes, the conformance fixtures, DESIGN
      or the tests; declared in `pages.json`, linked from the docs index, footers generated
      (DECISIONS 2026-10-05, "guides for the other camps")
- [x] `site/404.html` from the kit template
- [x] `site/skin.css`: the role bindings, no structural CSS
- [x] `site/.gitignore` carrying `/kit`, and the local `kit` symlink for preview
- [x] `site/DEPLOY.md` and `site/LANDING.md`: what the folder is and what the page claims
- [x] `readBudgets` reported `budgets: b` (a literal object behind a name) and `budgets: Infinity`
      as "computed"; the message is now "not written as an object of parts and bytes", true of
      both, held by the reader's and perf's tests (2026-10-05)
- [x] `deploy-site.yml` used `aws-actions/configure-aws-credentials@v6` unpinned; pinned to the
      sha of v6.3.0 read with `git ls-remote --tags` (2026-10-05)
- [x] CI breadth: a conformance job in ci.yml, proved by a local run of every fixture; node 24
      was already in the matrix. Its first green in Actions is the owner's (DECISIONS 2026-10-05)
- [x] Three claims brought back to the code: the events unsubscribe comment, readBudgets'
      "computed" wording, the mcp tools named in CLAUDE.md (DECISIONS 2026-10-05)
- [x] Six guides and DESIGN 9 said an assembly declared `mount = "none"` "ships no JavaScript
      at all"; true of a static view only. Fixed 2026-10-05: the runtime leaves such a view as
      the server sent it and the page keeps the runtime (DECISIONS 2026-10-05)
- [x] The local `definePage` policy block the six guides show was in no example, test or DESIGN
      section; DESIGN 8 now carries it, so the ledes are literal (2026-10-05)
- [x] `scripts/site-links.mjs`: cross-links generated from `pages.json`, never hand-written;
      `--check` in `check:site`, self-tested, watched red. Named `.mjs`, not `.py`: every gate
      in the chain is Node or bash, none Python (DECISIONS 2026-10-05; raised with the owner)
- [x] A test binding `pages.json` to the deploy, so a required page cannot go missing
- [x] `.github/workflows/deploy-site.yml`: the pin read from `ayersPlatform`, OIDC to
      `gh-deploy-assemblejs-site`, sync to the shop bucket under the prefix, invalidate that
      prefix only, no `--delete`
- [x] The `next` branch variant publishing to `/assemblejs/next/`, with every link carrying the
      trailing slash (the prefix router does not redirect a bare second segment)
- [x] The API reference generated into `site/docs/api/` at deploy time, never committed
      (ruled 2026-10-05): typedoc 0.28.20 at the root over every entry point the twelve
      packages publish, each naming its specifier with a `@module` comment, `pnpm site:api`;
      `check:reference`, a gate of its own, holds those entry points to the packages' `exports`
      and generates the whole reference with warnings as errors;
      `pages.json` marks the page `generated`, `check-site.mjs` exempts it from existing and
      does not walk its tree, and the index for a model lists it by its note. The deploy
      generates it in a job that holds no token for the cloud and hands it to the job that
      does. Thirteen mutations of the three scripts, each against its self-test, and five
      known-bad inputs on the real tree, each watched red (DECISIONS 2026-10-10, "the API
      reference")
- [ ] The reference cannot tell a type that a public signature names and no entry point
      exports: typedoc's own check for it passes any type whose package is not the project's,
      and one project over twelve packages makes that all of them. Run typedoc once per package
      (its `packages` strategy, each with its own entry points), or hold it some other way, so
      that a type a user cannot import is refused (found 2026-10-10, watched: an unexported
      interface returned by an exported function passed in silence)
- [ ] Nothing is ever deleted from the bucket, so the page of a symbol the reference no longer
      has stays reachable by its address. A sync of `docs/api/` alone could delete what it no
      longer holds; whether the deploy's role may delete is not known here (found 2026-10-10)
- [x] `RELEASES_PAT` is in this repository's secrets (2026-09-11) and the deploy's platform
      checkout passed in every run since; the OIDC role `gh-deploy-assemblejs-site` exists by
      the owner's hand (2026-10-07) after every run through 2026-10-05 failed at the AWS
      credentials step. Nothing has pushed `site/**` since the role, so the page has not
      deployed; the first deploy of `/assemblejs/next/` waits on his yes to the push.
