# Academy work queue and handoff

Checkpoint: 2026-10-31, after PR50 saved-page continuity merged and post-merge proof passed.
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

1. PR34 source editor merged as `bd61eaed086af1d19d1b53da68ea31e74a1a4d76`.
   Accepted tree `29f918dff5ff4ef61785a4a658538d1502fa4618`; exact-head review/checks,
   actual squash parent/message/signature and post-merge CI/editor/landing all passed.
2. PR35 assembly scaffold modes merged as `9cecaf0f7b4ef0149d874fa5df27fadcd8e178ad`.
   Accepted head `05c77c0`, tree `ef401ad120ba64130208090ea75a6ef3f39e1633`, personal
   `5721105681`, all ten exact-head jobs. Post-merge CI `41167466395`, editor, modes,
   landing and the existing deployment workflow all passed. This is scaffold authoring.
3. PR41 guarded source tools merged as `a9902ceee65f8f8f16dec8cdcf540945ea2f8fef`.
   Accepted head `6e2ea54`, tree `9cff06abe63b819295afd05353d9247c5f873308`; 39 focused
   source/protocol cases, independent source review and personal `5721195526` passed.
   All seven exact-head checks passed (`41167623186`, `41167623200`). Actual parent/tree,
   DCO message and GitHub signature were verified. Post-merge CI `41168122294` and
   modes `41168122328` passed. No filesystem transaction or hostile-race guarantee.
4. PR42 editor-to-MCP provider merged as `4218dca7d6479755de2a4822645a7e089f4df9f3`.
   Accepted head `71888f6`, tree `e340d9b5df4ca9e191145285a9e221a4a484f29a`; four adapter
   cases, observed-red acknowledgement control, real MCP/browser saved-byte/stale/draft
   proof and personal source/visual review `5721235945` passed. All eight exact-head jobs
   passed (`41168165624`, `41168165677`, `41168165706`). Actual squash parent/tree/message/
   signature and post-merge CI `41168543145`, modes `41168543163`, editor `41168543180`
   passed. This adapts an already connected client, not a production transport.
5. PR33 remains draft at `2126810` (negative outcome recorded). Do not merge, adopt the
   runtime, retry unchanged, weaken assertions or patch vendor internals to conceal the
   Svelte failure. Its retained runtime outcome is below.
6. Authored calculator workflow is in `/tmp/assemblejs-academy-calculator-workflow`.
   Source prepares the actual four Market files and product-page placement, supports bounded
   title/preset requests, teaches reject/revise/approve and Auto, and adds clean editor Reload.
   Twenty-one feature cases plus seven buffer/eleven editor cases pass. Independent review
   found three comment-marker errors; observed-red regressions and authored-shape restriction
   correct them. Initial PR43 head `09b80fe` exposed a Reload/reselection overwrite and a fixture
   MCP-metadata inconsistency; two selection regressions were red, then all eleven editor cases
   passed after correction. Hosted run `41170315559` applied the five files but correctly refused
   stale registration metadata. The fixture retains generated declarations and real dependency
   links; corrected native/hosted/personal acceptance still gates delivery.
   See `examples/academy/workspace/CALCULATOR_WORKFLOW.md` for the strict source/page baseline.
7. Full supplied-project workspace, actual runtime/build/preview wiring and lesson exercises
   remain open. Earlier exercises need a reviewed authored page baseline before calculator
   integration. Finish revision-bound progress/resume and certificate gating against actual
   current-source lesson evidence; do not advertise the Academy as available.

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

## Owned worktrees and outside audit

- `/tmp/assemblejs-academy-workspace-editor`: PR34 branch `codex/academy-workspace-editor`.
  Merged source editor; preserve its retained source and evidence.
- `/tmp/assemblejs-academy-agent-controls`: merged PR35 branch `codex/academy-agent-controls`.
  Preserve its accepted component and retained MCP/browser evidence.
- `/tmp/assemblejs-academy-current-source-preview`: PR33 draft branch, clean at `2126810`.
- `/tmp/assemblejs-academy-source-changes`: merged PR41 branch `codex/academy-source-changes`.
  Preserve its source/gate logs `/tmp/academy-source-changes-*.log` and personal receipt
  `/home/sparrow6/source/AUDIT/evidence/2026-10-31-pr-reviewer/assemble41-6e2ea54/`.
- `/tmp/assemblejs-academy-source-provider`: merged PR42 branch `codex/academy-source-provider`.
  Preserve `/tmp/academy-source-provider-*.log`, `71888f6` artifacts and personal receipt
  `/home/sparrow6/source/AUDIT/evidence/2026-10-31-pr-reviewer/assemble42-71888f6/`.
- `/tmp/assemblejs-academy-calculator-workflow`: branch `codex/academy-calculator-workflow`.
  Contains the next owned source increment; its normal integration retains the exact accepted
  PR42 tree. Source proof is `/tmp/academy-calculator-*.log`; required hosted gates are pending.
- Preserve all older `/tmp/assemblejs-*` worktrees and the original Academy checkout. No reset,
  stash, clean, add-all, history rewrite or broad process kill. Unrelated main checkout edits
  are not this task's changes.

Claude is the outside auditor only, not an implementation worker. Read pushed source,
completed runs/artifacts and installed builds. Do not edit code, create checkouts/branches,
run builds/CI, change household servers or settings, or perform release actions. File issues
labelled `audit` for source-proved defects or `owner` for verified owner-reported findings,
with where, the recorded ruling, evidence and done-when. If a finding is unclear, the
maintainer asks for correction on that issue rather than reinterpreting it.

Maintainers own these isolated worktrees and the delivery gates. Audit follows delivery and
may reopen unsupported closures; do not wait for outside audit as a new pre-delivery gate.
Every issue closure needs a closing comment linking the exact commit/run/artifact proving its
done-when. Keep PR33 held and the full Academy open. Next deliver the reviewed calculator
source workflow, then complete actual workspace/runtime/lesson integration, revision-bound
progress and certificate wiring. Do not advertise the Academy as available yet.

## Current continuation: real workspace preview source

PR43 is merged as `5325ca127d9ed5ba2686decbb2b1b389f6a7394d`, accepted tree
`8aa41b931ac90ba650f496e98fa2e6716659bb6c`, parent `4218dca`. Actual squash tree,
parent, DCO/Conventional message and GitHub signature were verified. All eight exact-head jobs
and personal final review `5721423768` passed. Post-merge CI `41172060171`, modes `41172060144`
and editor `41172060126` passed. Earlier references above to its pending delivery are superseded.

Next owned worktree: `/tmp/assemblejs-academy-workspace-preview`, branch
`codex/academy-workspace-preview`, based on that exact merge. Combined guided controls, code
and genuine saved-project preview source is implemented. Source/DOM/editor/file-list checks
pass; failed-check and entry-limit controls were observed red. Hosted proof and final personal
acceptance are pending. The Node runtime adapter is hosted QA only, not final browser runtime
or a publicly deployed backend. No local app build/server/browser was used. See
`examples/academy/workspace/WORKSPACE_PREVIEW.md` for ownership and isolation limits.

## Verified PR44 delivery and next mode practice

PR44 merged as `d11c4b39ed0d6076b1eb4f668bf96be4b3bc8f21`, exact accepted tree
`123f20705d8d1ef72e5b35c83a2fcefd30444faa`, parent `5325ca1`. Personal final review
`5721755265` accepted all eight exact-head jobs (`41178867199`, `41178867226`, `41178867193`)
and actual source/runtime/artifact/visual evidence. The actual squash tree/parent/message/
DCO/GitHub signature were verified. All post-merge runs passed: CI `41179567297`, modes
`41179567305`, editor `41179567296`. Workspace work described above as pending is delivered
as a private source increment, not a publicly available Academy or final runtime choice.

Retain `/tmp/assemblejs-academy-workspace-preview`, all `/tmp/academy-workspace-*.log` and
source/artifact directories. Corrected source `86af04a` artifact `13033004609`, SHA-256
`401bd26e544a9e83cd88d48609fc26f5fb9f7fe1c4fd54c46a47b7ebde06c855`, proves six builds,
31 tool calls, actual quotes, width=scrollWidth=324, no outliers, Stop and HTTP-build cancel
with no active processes. Only the three expected stock EventSource aborts occur on frame
removal. Root and personal reviewer inspected desktop/narrow/full-layout images. Earlier
blank offscreen screenshot, child-scroll timeout and actual search-form overflow failures
remain in DECISIONS and retained artifacts; none was suppressed or rerun unchanged.

Next owned source worktree is `/tmp/assemblejs-academy-mode-walkthrough`, branch
`codex/academy-mode-walkthrough`, based on exact PR44 merge. Short authored tasks observe
actual Plan/reject/revised-Approval/Auto receipts through the existing controls. Focused source
proof is `/tmp/academy-mode-walkthrough-*.log`; hosted/native/personal acceptance is still
required. See `examples/academy/workspace/MODE_WALKTHROUGH.md`. This is not durable curriculum
progress or certificate evidence; keep full lessons, recovery/resume and transport work open.

## Verified mode-practice delivery and recovered safeguard refresh

PR45 merged as `76eaaafb0b01b3e79eb917ec1238dbc13a452030`, exact accepted tree
`90644f0f00805c3b167db88468ee74921dacb5cd`, parent `d11c4b3`. All eight exact-head jobs
and personal final review `5721816042` passed. Actual squash tree/parent/message/DCO/GitHub
signature were verified. Post-merge CI `41180973269`, modes `41180973382` and editor
`41180973339` passed. Artifact `13035090434`, SHA-256
`d74e091678f3c59478435ecd64346712f0986bd469eb5b76cafbc3a77398f780`, proves real guide
transitions, six builds/31 tool calls, quotes, 324/324 layout and empty process cleanup. Root
and personal reviewer inspected changed desktop/narrow images. Preserve
`/tmp/assemblejs-academy-mode-walkthrough` and `/tmp/academy-mode-walkthrough-*.log`.

The manager recovered accepted issue 11 / old PR12 after this checkpoint. Its new safeguard
source was absent from current next. Read-only reconciliation was independently checked,
including old exact-tree CI and all fourteen released-source/old-copy/manifest hashes. The
manager reaffirmed the existing v0.90.0 target, a forward change from current v0.70.0; do not
merge the stale PR12 branch. The fresh source is owned in
`/tmp/assemblejs-verification-guardrails-reconciliation`, branch
`codex/verification-guardrails-reconciliation`, based on exact PR45 merge. Seven contracts and
scoped guards pass; new-head hosted/source/personal/site acceptance remains required. See
`docs/studies/verification-guardrails-reconciliation.md` and DECISIONS for the exact scope.
This source refresh does not replace Academy lesson/connection/runtime/progress work or the
PR33 hold. No local product build/server/browser or old-matrix rerun was used.

## Safeguard delivery checkpoint

PR46 merged as `fe036a78e35afa60bc8d3ee58a222b5d92b58ad9`, exact reviewed tree
`abbb716bce88cef8336cc979a71a58940f744bb7`, parent `76eaaaf`, after personal review
`5722099073` and all twelve exact-head checks. Actual squash identities, complete DCO message
and valid GitHub signature were verified. Post-merge CI `41187302225`, landing `41187302254`
and modes `41187302161` passed. Its deployment `41187302218` failed the new pinned frame
check before cloud upload; that failure is preserved, not treated as delivered acceptance.

PR47 corrected only the missing generated frame links and released-asset staging. It merged
as `c8c370569536c68d868e4bbdd0c245215225ec74`, reviewed tree
`d3da9958c350b98d8d5028b10ac8984a8c6f6d65`, parent `fe036a7`, after all nine exact-head
checks and personal review `5722144704`. Actual squash tree/parent/full message/signature
were verified. Normal deployment `41188471177` and landing `41188471159` passed.
All eight post-merge CI jobs in `41188471147` passed. Source, post-merge and live-byte
acceptance now support issue 11 delivery closure and retiring stale PR12 as superseded;
do not merge its old branch.

Requests to `https://ayers.repair/assemblejs/next/` redirected to the corresponding
`https://assemblejs.com/next/` URLs. All 66 final HTTP-200 responses match byte for byte:
all staged product/kit files except Markdown/JSON, plus the current hosted API index. Other
generated API pages were not crawled. Expected bytes use the exact released metadata builder,
normal noindex/error-prefix transforms and this deployment's actual API artifact. Raw receipt:
`/tmp/assemblejs-site-delivery-live-c8c3705.json`, SHA-256
`a85438e5b840a317059fce525345079d1f15ef15a58249117f6d0530b3b70e73`.
The manager retained this JSON and raw deployment log unchanged in AUDIT
`evidence/2026-10-31-manager/assemblejs-safeguards-c8c3705/` with checksums and independently
confirmed the 66 HTTP-200/hash matches and the exact deployment outcome.

Preserve `/tmp/assemblejs-verification-guardrails-reconciliation`,
`/tmp/assemblejs-verification-site-delivery` and their retained logs/artifacts. Personal review
evidence is under AUDIT `evidence/2026-10-31-pr-reviewer/assemble46-1f1530e/` and
`assemble47-4c1148c/`; actual merge receipts are beside them. The manager owns authoritative
AUDIT board/evidence updates. This supersedes earlier pending safeguard-source notes above.

The live eligible-next reuse branch and optional local verification plan were not exercised.
Main-merge reuse remains disabled. No npm publication, release, runtime adoption or new public
activation occurred. Full Academy lessons, revision-bound progress/resume, certificate and
verified external-agent connection remain open. PR33's browser-runtime hold remains unchanged.

## Active source-identity increment

Delivery ledger PR48 merged as `782b65f` after personal review `5722213951`, all eight
exact-head and all eight post-merge CI jobs (`41189911618`). Actual merge identities and
signature were verified. Issue 11 / PR12 administrative closure remains pending the single
direct-user approval request after automatic review rejected those tracking mutations.
No closure retry or indirect action is authorized without that reply; delivered source stands.

PR49 merged as `805ce56`, tree `95e569018b3b54083f94281ca6842f6a4bcd29c9`, personal review
`5722323760`, all ten exact-head jobs. Post-merge CI `41192530493`, modes `41192530590` and
editor `41192530499` passed; actual squash identities/DCO/signature were verified.

PR50 merged as `82c0272`, tree `126e7d97329d66b14c624141ee9ffecbe1ed08c4`, parent `805ce56`,
personal review `5722513812`, all ten exact-head jobs. Post-merge CI `41196768670`, modes
`41196768709` and editor `41196768655` passed; actual squash message/DCO/signature and
source/artifacts were independently verified. Saved page text survives all modes exactly.
The initial 46,054-byte pack failure remains recorded; corrected size is 45,963 / 46,000.
These receipts supersede older pending PR50 paragraphs, not the broader Academy holds.

Active source: `/tmp/assemblejs-academy-draft-recovery`, branch `codex/academy-draft-recovery`,
on that merge. Next bounded item: tab-local unsaved-draft recovery on reload. Owner: this
Academy chat. TODO records done-when before source edits: exact bases, no automatic project
write, preserved conflict text, honest storage errors, hosted reload/keyboard/narrow/provider
proof and independent review. Durable project/lesson progress, snapshots, resume/certificate,
verified external-agent connection and runtime adoption remain open.
