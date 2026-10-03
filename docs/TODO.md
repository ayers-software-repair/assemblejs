# Todo

The ledger. Every task lives here; a task is checked off in the same commit that does it, never
in a batch afterwards. An unchecked box is work not done. Order is the order of work.

## RESUME HERE - the handoff. A fresh lane reads this block first and needs nothing else.

**STATE 2026-10-03.** Branch `next`. B-12 is done (apis mounted and checked at boot; data
schemas deep-merged with a collision refused at boot). Full gate `pnpm check` green on the B-12
fix commit. A cloud session resumed the ladder on the owner's word ("complete all you can"); the
owner does every release himself, from his own sessions, so nothing here publishes.

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

**THE EXACT NEXT STEP:** B-13, remote assemblies, then onward in ledger order.

**ORDER AND DEPENDENCIES of the open rows:** B-13 (remote; carries recorded
debt: `Limits.maxBytes` has no reader, and pages refuse a `url` placement at boot until it lands)
-> B-14 auth -> B-15 styles -> B-16 four renderers -> B-17 templates -> B-18 SSE -> B-19 devtools
-> B-20 verbs -> B-21..B-24 conformance (need B-16..B-20) -> B-25 budgets -> B-26 release dry run
-> B-27a/B-27b (the owner's). The five house-style rows and the six release-notes rows can land
any time. Site guides wait for renderers so they show real code. Owner-blocked: `RELEASES_PAT`,
the OIDC role, the Actions org allowlist (Actions runs NOTHING here yet), branch rulesets, the
bird mark, the palette, the old npm package deprecation, the first publish. Raised with the
owner, unanswered: whether changesets start before or after the first publish (DECISIONS,
2026-10-03, "open"; `CLAUDE.md` still says every `packages/*/src` change).

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
using `pgrep -f` matches its own command line - use a captured PID. `identity()` joins with a
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

- [ ] **Package metadata against `CLAUDE.md`'s identity law.** Found 2026-10-03 by a verifying
      agent, present since B-02 and passed by every gate: each `packages/*/package.json` carries
      `"author"` (the law says author credit is the root `package.json` only) and its
      `repository` and `bugs` urls name the GitHub organization (the law says the organization
      name appears in no package.json). Not changed here: the repository url is what npm
      provenance checks against, so which way to resolve it is the owner's call.

- [ ] **Actions runs nothing on this repository.** Measured: the three workflows are registered
      and `state=active`, repository Actions permissions read `enabled: true, allowed_actions:
all`, both branches carry the workflow files, and `actions/runs` reports `total_count=0`.
      The org-level Actions policy cannot be read without `admin:org`, so the remaining
      explanation is that the organization allows Actions only for selected repositories and this
      one is not among them. Until it runs, every gate is proven locally only.
      Fix: organization settings, Actions, General, add `assemblejs` to the allowed repositories.
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
- [ ] B-13 remote assemblies: allowlist, caps, handshake, cache
      Owed here: `Limits.maxBytes` is declared and has no reader until the remote
      transport exists. A verification pass found a 10 MiB fragment composing clean
      through `maxBytes: 8`, which is correct today and must not be once B-13 lands.
- [ ] Page route parameters reach the assemblies a page places: the placement request, the
      cache key and the remote transport each carry them. Refused at boot until then (DECISIONS,
      2026-10-03, "page parameters held back").
- [ ] B-14 auth and the default policy
- [ ] B-15 styles: scoping, Shadow DOM opt-in, the documented holes
      Until then the build includes no stylesheet: a `.css` beside a view, and a Svelte
      component's `<style>`, are left out, and `build` says which assemblies have one.
- [ ] B-16 the remaining four framework renderers
- [ ] B-17 the template engines
- [ ] B-18 real-time over server-sent events
- [ ] `dev` refreshes the browser after a rebuild, over the server-sent events B-18 builds,
      development only and under the framework's prefix (DECISIONS, 2026-10-03, "dev is the
      production build").
- [ ] B-19 devtools, read-only, with the boot assertion
- [ ] B-20 the check, perf and deploy verbs
- [ ] B-21 the conformance harness and its first specs
- [ ] B-22 conformance breadth, batch one
- [ ] B-23 conformance breadth, batch two
- [ ] B-24 conformance breadth, batch three, and the acceptance table
- [ ] B-25 size budgets, pack check, Scorecard
- [ ] B-26 the release dry run with provenance
- [ ] B-27a estate integration and the first prerelease
- [ ] B-27b the stable publish, after the cold quickstart

## House style / hooks stack (CTO ruled 2026-09-03..09; owner routed it here) — assemblejs's part

Ruling lives in ayers.repair/docs/CODESTYLE-HOOKS-RULING.md. These are the rows that touch THIS
repo only. Not begun; the work hold still stands and platform/codestyle is uncommitted upstream.

- [ ] Release-notes DRIFT GATE: a test asserting every `CHANGELOG.md` version heading has a matching
      `<section id="v...">` in `site/release-notes.html`, structure only never prose, watched red on
      an injected version first. Correct whether notes are typed or generated. Ties into the
      release-notes-pattern block below (this repo needs all four surfaces).
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

## Release notes: the uniform pattern (owner order, 2026-09-03) — NOT STARTED, awaiting his word

Relayed by the AVP as a notification, explicitly not a dispatch, while this seat was on hold.
Nothing here is begun until the owner lifts the hold. Recorded now because a fact that lives only
in a session's memory is a fact that is lost.

His order: "howland and magpie should do release notes the same way, same for assemblejs, uniform
pattern". The shape is written up at `ayers.repair/docs/RELEASE-NOTES-PATTERN.md`, derived from
what magpie and howland already converged on independently rather than invented.

VERIFIED HERE TODAY: this repository has NONE of the four surfaces. `RELEASE_NOTES.md`,
`CHANGELOG.md` and `site/release-notes.html` are all absent, the page is not declared in
`site/pages.json`, and `release.yml` has no body generation. So assemblejs adopts all four, where
howland is said to need three and magpie already has them.

- [ ] `RELEASE_NOTES.md` at the root: user-facing, hand-kept, and the source the release body is
      generated FROM.
- [ ] `CHANGELOG.md` at the root: the developer register, hand-kept. A different register from
      the notes on purpose.
- [ ] `site/release-notes.html`: one `<section id="v...">` per version, declared in `pages.json`
      so `check-site.mjs` refuses it going missing.
- [ ] The GitHub release BODY generated at release time from `RELEASE_NOTES.md` plus the
      production guide links, gated on DNS resolving rather than on a flag. Never a tracked file:
      a tracked body is one the next person cutting a release can silently ship without the links.
- [ ] THE DRIFT GATE, which is the part that actually holds it together: a test asserting every
      version heading in `CHANGELOG.md` has a matching `<section id="v...">` in the site page.
      STRUCTURE ONLY, never prose — the two deliberately say the same thing in different
      registers and flattening that difference is the failure, not the fix. Watch it red on an
      injected version before trusting it, the way every other gate here was.
- [ ] Standing bar, same ruling: no old releases left around. One release per version, no orphaned
      drafts or prereleases, superseded ones deleted rather than left visible. `gh release list`
      before any cut.

## Phase 4: the site, on the pattern howland and magpie already use

Measured from `magpie/site/`, `howland/site/`, both `deploy-site.yml`, and `platform/sitekit/`.
The pattern, verbatim: `site/` is the whole site, static, no build, fonts and images vendored;
`site/pages.json` is the single source of truth for which pages exist and how they cross-link;
`site/kit/` is gitignored and staged at deploy time from `platform/sitekit` checked out at the
product's one pin; inner pages link `kit/kit.css` plus the product's own `skin.css`; the landing
page is the product's own and does not use the kit; a push to the branch touching `site/**`
publishes, and the paths filter is an include, never an ignore list.

Two differences this product has, both already ruled: the pin is `ayersPlatform` in the root
`package.json` rather than a go.mod line, and there are two prefixes, `/assemblejs/` from `main`
and `/assemblejs/next/` from `next`.

- [x] `site/pages.json`: the page list and cross-links, in magpie's schema
- [x] `site/index.html` + `index.css`: the landing page, the product's own skin, framework names
      typeset in our colours and no third-party logos
- [x] `site/install.html` and `site/start.html` from `platform/sitekit/templates/`, instantiated
      by hand as committed pages
- [x] `site/docs/index.html`: the model, the contract, and where to start
- [ ] The guides: one per camp (for React devs, for Vue devs, for Svelte devs) and the
      linear tutorial. Owed once the renderers exist, so a guide can show real code.
- [x] `site/404.html` from the kit template
- [x] `site/skin.css`: the role bindings, no structural CSS
- [x] `site/.gitignore` carrying `/kit`, and the local `kit` symlink for preview
- [x] `site/DEPLOY.md` and `site/LANDING.md`: what the folder is and what the page claims
- [ ] `scripts/site-links.py`: cross-links generated from `pages.json`, never hand-written
- [x] A test binding `pages.json` to the deploy, so a required page cannot go missing
- [x] `.github/workflows/deploy-site.yml`: the pin read from `ayersPlatform`, OIDC to
      `gh-deploy-assemblejs-site`, sync to the shop bucket under the prefix, invalidate that
      prefix only, no `--delete`
- [x] The `next` branch variant publishing to `/assemblejs/next/`, with every link carrying the
      trailing slash (the prefix router does not redirect a bare second segment)
- [ ] The API reference generated into `site/docs/api/` at deploy time, never committed
- [ ] **BLOCKING, the owner's hand:** `RELEASES_PAT` added to this repository's secrets, so
      deploy-site can check the private platform repo out at the pin. Nothing about the site
      publishes until it exists. Also his: the OIDC role and the bucket policy for this prefix.
