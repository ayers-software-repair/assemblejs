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
- [ ] B-02 core package shell: exports map and build only
- [ ] B-03 the pure composer: deadlines, isolation, the fallback ladder, depth and cycles
- [ ] B-04 the vocabulary module, the envelope and the three encoders
- [ ] B-05 configuration from the process environment, validated at boot
- [ ] B-06 the server: the three endpoints, header validation, the error contract
- [ ] B-07 the browser runtime and the four mount modes
- [ ] B-08 events: typed, addressable, replay opt-in, teardown exact
- [ ] B-09 the CLI and create: discovery, templates, non-interactive
- [ ] B-10 the first framework renderer
- [ ] B-11 the second framework renderer and the day-one proof
- [ ] B-12 services and apis
- [ ] B-13 remote assemblies: allowlist, caps, handshake, cache
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
