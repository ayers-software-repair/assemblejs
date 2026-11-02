# Retained Academy research and owner decisions

Observed 1 November 2026; parent issue16 remains open. This records retention, not runtime
acceptance or completed cleanup. Manager resume brief section5 explicitly keeps branches
backing PRs/receipts and negative-result drafts22/27/33. Archives do not lift those holds.

| PR  | Retained branch                        | Exact head                                 | Disposition                                                                          |
| --- | -------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------ |
| 22  | `codex/academy-sdk-proof`              | `e27e11a2919d5cdff892f3d867c7d7d12025afa0` | Failed editor SDK experiment; draft/source retained, no adoption or unchanged retry. |
| 27  | `codex/academy-open-preview-proof`     | `15172907d02293e21dbfdaaaacf164f98a881d18` | Failed preview experiment; draft/source and unique dirty diagnostic test retained.   |
| 33  | `codex/academy-current-source-preview` | `212681036cce4838c657e96e442d7a71a2b97b79` | Svelte SSR failure; draft/source retained, remaining mounts and Stop unaccepted.     |
| 12  | `codex/verification-guardrails`        | `04ba80232e41bce6581ebc03ad4a95ef9c47effd` | Closed, superseded by merged PR46; receipt-backed ref retained.                      |
| 55  | `codex/original-branding`              | `55874621454418316d75026e7cda74e6a827e4fb` | Closed, superseded by PR56; failed-source ref and working draft retained.            |

PR27's dirty file remains unchanged at
`/home/sparrow6/source/.worktrees/assemblejs/assemblejs-academy-open-preview/browser/academy-open-runtime-research/framework-diagnostics.test.mjs`.
It adds preview-only environment coverage absent from canonical next. Its archived binary patch
is 2,081 bytes, SHA-256 `6508a8e90bcecc3d33e4f69d732935bc2d592e8ca35dd788cabff9012dad8b73`.

Private archive:
`/home/sparrow6/source/AUDIT/evidence/2026-11-01-assemblejs-branding-reconciliation/`.
`working-draft-archive.json` records both dirty patches and the untracked authored comparator.
`pre-cleanup-refs.bundle`: 5,570,275 bytes, SHA-256
`c5be97bfcf7e014982330505254ce9345df4285f8ff2c1227e5e67eb02cd90e5`.
All124refs and complete history were independently verified. A fresh bare object repository
restored matching commit/tree identities for PR22/27/33/55 and kit notes head `fb401bce`.
The archive predates later PR56 commits. AUDIT commits `e428983f5`, `080fe4c98` and `6a93b93ee`
retain small receipts; AUDIT has no remote. Raw evidence remains privately available locally.

Keep all eighteen merged Academy receipt-backed branches. Their exact squash-tree comparisons
are in `assemblejs-tree-reconciliation.tsv`; verified redundant worktree removal does not
permit protected branch deletion. Keep active dependency sources until no caller needs them.
Protected draft/receipt refs need an explicit disposition before removal. The full Academy,
production runtime selection, curriculum and external-agent transport remain open in issue16.

## Separate npm work

Read-only registry inspection on 1 November: all fourteen packages have `latest` at
`1.0.0-next.0`, `next` at `1.0.0-next.2`, and a public `0.0.0-stage` version without a
reported deprecation. The `create-assemblejs` request returned404; this does not reserve it.

On 2 November the owner completed the approved tag corrections. Fresh independent all14 reads
verify latest=next=next.2 and target publication; the default scoped starter resolves next.2.
AUDIT925c9c200 retains values, actual starter files/resolution and changed-state CI. This
supersedes the earlier tag snapshot only; placeholder and unscoped-name decisions are unchanged.

| Issue | Remaining work                                                                                                                                         |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 36    | Owner-completed correction is verified for all 14 tags and the default scoped starter; tracking closure follows receipt review.                        |
| 37    | Source17c4d17 is independently clear; all eight current CI checks pass after the owner registry change. Final record-head and merge/post-merge remain. |
| 38    | Owner choice on staged-placeholder retention/deprecation remains open; none performed.                                                                 |
| 40    | Unscoped wrapper and new-name first publication remain open; no reservation or publication performed.                                                  |

No release, publisher setting, credential, spending, infrastructure or runtime adoption is
inferred. These remaining issues are not marked complete by retaining their records.

## Verified worktree cleanup

Sixteen redundant merged worktrees were removed on 1 November after independent review and
fresh exact-head/squash-tree/clean-status checks. `academy-removed-worktrees.json` records each
path, retained branch and immutable identities. Ordinary `git worktree remove` was used without
force. The landing tree's only untracked item was a dependency symlink; only that link itself
was unlinked first, preserving its target. Every receipt-backed branch still resolves to its
recorded head. This is partial cleanup: protected drafts, dirty PR27, the active calculator
verification dependency tree, original runtime checkout and current delivery/notes trees remain.
