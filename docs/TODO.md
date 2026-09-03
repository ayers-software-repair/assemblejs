# Todo

The ledger. Every task lives here; a task is checked off in the same commit that does it, never
in a batch afterwards. An unchecked box is work not done. Order is the order of work.

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
- [ ] The eleventh (`client`) verified: its first verifier died mid-run, a second is reading now
- [x] `docs/dossiers/00-BRIEF.md`: the dossiers aggregated into one design brief
- [x] `docs/dossiers/00-AUDIT.md`: the adversarial defect hunt over the v1, eight lenses, every
      finding refuted by a second reader; 74 raised, 61 survived, fifteen design constraints

## Blocked, needs the owner (one admin click each)

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
- [ ] B-03 the pure composer: deadlines, isolation, the fallback ladder, depth and cycles
- [x] B-04 the vocabulary module, the envelope and the three encoders
- [x] B-05 configuration from the process environment, validated at boot
- [x] B-06 the server: the three endpoints, header validation, the error contract
- [x] B-07 the browser runtime and the four mount modes
- [ ] B-08 events: typed, addressable, replay opt-in, teardown exact
- [ ] B-09 the CLI and create: discovery, templates, non-interactive
- [ ] B-10 the first framework renderer
- [ ] B-11 the second framework renderer and the day-one proof
- [ ] B-12 services and apis
- [ ] B-13 remote assemblies: allowlist, caps, handshake, cache
      Owed here: `Limits.maxBytes` is declared and has no reader until the remote
      transport exists. A verification pass found a 10 MiB fragment composing clean
      through `maxBytes: 8`, which is correct today and must not be once B-13 lands.
- [ ] B-14 auth and the default policy
- [ ] B-15 styles: scoping, Shadow DOM opt-in, the documented holes
- [ ] B-16 the remaining four framework renderers
- [ ] B-17 the template engines
- [ ] B-18 real-time over server-sent events
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

- [ ] `site/pages.json`: the page list and cross-links, in magpie's schema
- [ ] `site/index.html` + `index.css`: the landing page, the product's own skin, framework names
      typeset in our colours and no third-party logos
- [ ] `site/install.html` and `site/start.html` from `platform/sitekit/templates/`, instantiated
      by hand as committed pages
- [ ] `site/docs/index.html` and the guides: one per camp, plus the linear tutorial
- [ ] `site/404.html` from the kit template
- [ ] `site/skin.css`: the role bindings, no structural CSS
- [ ] `site/.gitignore` carrying `/kit`, and the local `kit` symlink for preview
- [ ] `site/DEPLOY.md` and `site/LANDING.md`: what the folder is and what the page claims
- [ ] `scripts/site-links.py`: cross-links generated from `pages.json`, never hand-written
- [ ] A test binding `pages.json` to the deploy, so a required page cannot go missing
- [ ] `.github/workflows/deploy-site.yml`: the pin read from `ayersPlatform`, OIDC to
      `gh-deploy-assemblejs-site`, sync to the shop bucket under the prefix, invalidate that
      prefix only, no `--delete`
- [ ] The `next` branch variant publishing to `/assemblejs/next/`, with every link carrying the
      trailing slash (the prefix router does not redirect a bare second segment)
- [ ] The API reference generated into `site/docs/api/` at deploy time, never committed
- [ ] **BLOCKING, the owner's hand:** `RELEASES_PAT` added to this repository's secrets, so
      deploy-site can check the private platform repo out at the pin. Nothing about the site
      publishes until it exists. Also his: the OIDC role and the bucket policy for this prefix.
