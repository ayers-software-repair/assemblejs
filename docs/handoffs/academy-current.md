# Academy work queue and handoff

Checkpoint: 2026-10-30, after the editor's final source/visual/hosted acceptance.
This file is a checkpoint, not a live claim about later GitHub state. Read current PR heads
and jobs before merging. Accepted execution issue: #16, still open and labelled accepted.
`docs/PLAN.md` section 4.3 and the unchecked `docs/TODO.md` rows govern remaining work.

## Product and authority

Build the full browser Academy over the supplied connected Market project. No learner upload
or repository import. Keep tasks short; the guided tutor uses authored supported workflows
and actual diagnostics, with honest fallback. A real learner agent is optional and must have
a verified connection, not merely copied settings. Code, diffs and final application belong
together. Teach Plan, reject/revise/approve and Auto through actual changes/checks. Existing
read-only devtools stay read-only. Full lesson checks, resume and certificate remain open.

The standing source-merge exception is in `docs/DECISIONS.md`. All routine chat coordination
is authorized. Use the existing personal reviewer; no extra reviewer chat or account is needed.
No paid hosting/runtime, vendor contact/account, final runtime adoption, tag, publication,
stable promotion or new production deployment is granted by these source increments.
No local framework/product build, server or browser: use hosted CI. Focused source/DOM tests,
source type/lint gates and filesystem boundary probes are permitted. Preserve concurrent edits;
use isolated worktrees, explicit staging, DCO-only Conventional commits and squash merges.

## Delivery queue

1. PR34, source editor: `https://github.com/ayers-software-repair/assemblejs/pull/34`.
   Accepted source head `2e7669a95c1cde647dca18246b7592bf89e670f7`, tree
   `d66f8b5aca295aa503f056d711436f0bc3285fa1`, base `f52e830` at the checkpoint.
   All six normal jobs in `41163039843`, editor `41163039875`, normal runtime mechanics
   `41163039904` and landing `41163039906` passed. Final personal review `5720847023` accepts
   source and visuals. This final ledger/handoff commit leaves editor behavior unchanged;
   allow its automatically required checks to finish before delivery. Merge with exact-head
   and base guards, verify actual squash tree/message/signature, then post-merge CI.
2. PR35, assembly mode controls: `https://github.com/ayers-software-repair/assemblejs/pull/35`.
   Current head `54133150181ab545e1d640a432fcac55b87f239e`, base `f52e830` at checkpoint.
   Final personal review `5720863010` accepts source, MCP behavior, visuals and all six
   normal CI jobs in `41163301977`, including Node24. Hosted real MCP/browser run
   `41163301978`, mechanics and landing also passed. Final receipt:
   `/home/sparrow6/source/AUDIT/evidence/2026-10-30-pr-reviewer/assemble35-5413315-review.json`.
   Reconcile the small TODO/DECISIONS/knip/package/lock overlaps with merged PR34 in an owned
   merge commit; do not force-push or erase either increment. Reuse unchanged proof and run
   the actual required checks. The controls create assembly scaffolds, not the full calculator.
3. PR33 stays draft: `https://github.com/ayers-software-repair/assemblejs/pull/33`, head
   `2126810` (negative outcome recorded). Do not merge, adopt the runtime, retry unchanged,
   weaken assertions or patch vendor internals to conceal its Svelte failure.
4. Complete the guarded source-edit operation, then connect the real editor provider and
   authored calculator/customization workflow to those shared operations. Continue the actual
   supplied-project workspace, real build/preview/check wiring and lesson exercises. Finish
   persistence/resume and certificate gating only against current-source lesson evidence.

## Verified editor details

Seventeen source/DOM/request cases passed. Actual temporary Market source is edited by the
hosted component; no simulated framework preview is claimed. The provider must refuse a
changed base. Draft buffers survive navigation/failure, and edits made while saving stay dirty.
A successful save does not claim check/build/preview success. Highlight.js uses a direct
pinned modular import; its generated lock change is exactly nine added lines.

Initial run `41161507063` caught an aborted successful 204 save response. The test transport
now consumes and validates an explicit `200 saved` body; strict request checks remain intact.
The transport control was red before the correction and passes all three cases afterward.
EOF/selection review added a painting-only newline and explicit selected-text colors.
Targeted run `41162669536` then caught the narrow first line clipping: caret zero but both
layers retained scrollTop 19. The Home correction passed the unchanged first-line assertion
in `41163039875`: both tops zero, both heights 2506, painted first-line top 374.265625 below
viewport top 359.875. EOF tops/heights also agree exactly and selection is readable.

Local evidence: `/tmp/academy-editor-*.log` and
`/tmp/academy-editor-2e7669a-artifacts`. Final personal receipt:
`/home/sparrow6/source/AUDIT/evidence/2026-10-30-pr-reviewer/assemble34-2e7669a-review.json`.

## Verified mode-control details

Sixteen protocol/controller/DOM cases and one actual MCP/browser scenario passed. The hosted
fixture builds the real MCP server, connects a real client over in-memory protocol transports
and creates a real canonical project. Its ten-call trace verifies Plan, reject/revise/approve,
Auto/check and preservation of an outside edit. It is not a production HTTP bridge or verified
external-agent connection. Mode switches never apply an old proposal; ambiguous writes consume
permission and require a new review. Exact successful tool acknowledgements are validated.

The existing `@modelcontextprotocol/sdk` 1.30.0 pin is declared directly at root; its generated lock change is exactly three
importer lines. An unused import left during that cleanup made initial full lint red; the
corrected head removes it. An earlier local batched command failed to stop on that lint error;
that preliminary green claim is superseded by the corrected fail-fast lint and hosted result.
Local evidence: `/tmp/academy-modes-*.log`. Hosted corrected job: `124425378080`.

## Runtime hold

At PR33 source `f027523`, run `41160120114` verified actual current-source tarballs, installed
metadata/all JavaScript modules, static syntax rejection, check failure/recovery, actual
build/typecheck and a framed 200 response. Preact/React/Vue assertions passed before Svelte
returned fallback: `Cannot read properties of null (reading 'p')` at context.js:73 through
Renderer.component:327. Remaining mounts/templates/input/Stop acceptance was not reached.
Browser errors/network failures were empty; service-worker registrations cleaned from one
to zero. Artifact `13027075449`, SHA-256
`29b0e3b671c094fd1341e2d71bf3d117bd9fff1e9ce05c52fc0099ad039c5ec2`.

Exact SDK source snapshots named imports; exact Svelte 5.57.0 imports mutable server context.
That strongly explains this path, but the generated guest wrapper was not captured, so it
is a source-supported inference, not an isolated runtime reproduction. No documented toggle
was found. Full retained outcome is in the draft branch's
`browser/academy-open-preview-research/README.md`. Distribution notices, production isolation,
external-agent transport and final runtime selection remain unresolved. Prior WebContainer
proof worked but production licensing is not approved; do not silently switch to it.

## Owned worktrees and parallel ownership

- `/tmp/assemblejs-academy-workspace-editor`: PR34 branch `codex/academy-workspace-editor`.
  Own the final ledger/handoff and delivery here; do not edit it concurrently without notice.
- `/tmp/assemblejs-academy-agent-controls`: PR35 branch `codex/academy-agent-controls`, clean
  after `5413315` at checkpoint. Preserve its independent changes when reconciling PR34.
- `/tmp/assemblejs-academy-current-source-preview`: PR33 draft branch, clean at `2126810`.
- `/tmp/assemblejs-academy-source-changes`: branch `codex/academy-source-changes`, base
  `f52e830`, with five untracked TypeScript prototypes under `packages/mcp/src/author/`:
  source-change, source-file-path, read-source, write-source-change, apply-source-changes.
  These are unfinished, untested and not integrated/exported; no PR exists. Temporary cleanup
  after a partial write, raw-byte comparisons and ancestor-path conflicts still need correction
  before testing. Do not treat them as a working API or overwrite them during parallel work.
- Preserve all older `/tmp/assemblejs-*` worktrees and the original Academy checkout. No reset,
  stash, clean, add-all, history rewrite or broad process kill. Unrelated main checkout edits
  are not this task's changes.

For Claude: read AGENTS/CLAUDE, PLAN, TODO, DECISIONS and this file; verify current PR34/35 heads
and gates. Coordinate which isolated worktree you own before edits. Deliver the reviewed
increments under the standing source-merge exception only when every applicable gate passes.
Keep PR33 held. Next implementation is shared guarded source changes and the complete authored
calculator workflow, then real workspace/lesson/progress/certificate wiring. Report actual
source/runtime limits; do not advertise the Academy as available yet.
