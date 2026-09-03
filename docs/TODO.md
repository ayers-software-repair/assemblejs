# Todo

The ledger. Every task lives here; a task is checked off in the same commit that does it, never
in a batch afterwards. An unchecked box is work not done. Order is the order of work.

## Phase 0: the record

- [x] Repository skeleton and gates, every gate watched failing first (B-01, `c565074`)
- [x] Working rules written into `CLAUDE.md`
- [x] This ledger created
- [x] `docs/DECISIONS.md` created and seeded with every ruling so far
- [x] `docs/PLAN.md` created as the in-repo plan of record
- [ ] `docs/PLAN.md` gains the design once the reference read is aggregated

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
- [ ] Every dossier's load-bearing claims refuted at the source by a second reader
- [ ] `docs/dossiers/00-BRIEF.md`: the twelve dossiers aggregated into one design brief
- [ ] `docs/dossiers/00-AUDIT.md`: the adversarial defect hunt over the v1, ranked, with the
      design rules that follow from it

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

- [ ] Write the design: the assembly contract as a spec before any code
- [ ] Put the remaining open questions to the owner, against the written design, in one pass
- [ ] Record his answers in `docs/DECISIONS.md`
- [ ] Freeze the ladder in `docs/PLAN.md`, one rung per gate, each with its proof command

## Phase 3: the ladder

Filled in from the frozen ladder. Each rung is one pull request onto `next`, its proof command run
and its output pasted, before the next rung starts.
