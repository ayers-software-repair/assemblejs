# Verification safeguard reconciliation

Read-only checkpoint, 2026-10-31. Execution issue 11 is accepted and remains open. PR12 remains
open at `04ba80232e41bce6581ebc03ad4a95ef9c47effd`; its merge base with current next is
`750209f7af84479c6894f482e380976a06c4ea41`. Current next is verified PR45 merge
`76eaaafb0b01b3e79eb917ec1238dbc13a452030`, tree `90644f0`.

## Finding

Do not close issue 11 as delivered or merge the stale PR12 branch. The new safeguards are absent
from current next. Existing ordinary CI and four commit-tool copies are present, but they are
not the proposed proof-reuse/verification adoption. A fresh, narrowly scoped adoption against
the already authorized v0.90.0 target is needed. The manager clarified that the stale object
is the old branch/tree, not the target from accepted issue 11. Current v0.70.0 to v0.90.0 is
the approved forward transition, not a downgrade or a new version choice.

| Scope                                               | Current next source                                                                                 | Disposition                                                                                  |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Node 22/24, browser, conformance, examples, commits | Six ordinary CI jobs remain in `.github/workflows/ci.yml`; exact-tree PR45 CI `41180432623` passed. | Already present; preserve them.                                                              |
| Public CI independent of private Platform checkout  | CI has no Platform checkout or private credential input.                                            | Already present; preserve it.                                                                |
| House commit tools and manifest                     | Four files in `scripts/house`; package pin and HOUSE tag remain v0.70.0.                            | Existing baseline, not the new 14-helper closure.                                            |
| Trusted unchanged-source push-to-PR reuse           | No reuse-ci/ci-ready jobs, `scripts/ci-reuse.mjs` or its tests.                                     | Not delivered.                                                                               |
| Generated/hash-held shared CI helper closure        | No 14 shared CI helpers or sync command in current next.                                            | Not delivered.                                                                               |
| Optional guarded verification plan                  | No `verification.json`.                                                                             | Not delivered.                                                                               |
| No local full-suite prerequisite                    | CONTRIBUTING's Making a change item 2 still says pnpm check must be green locally.                  | Documentation correction remains; current owner prohibition on local product suites governs. |
| Main-merge proof reuse                              | Not enabled by current source or PR12's implementation.                                             | Separate scope; do not add it implicitly.                                                    |

PR12 appends a no-local-prerequisite Verification section to README.md, while leaving
CONTRIBUTING.md unchanged with its conflicting Making a change item 2. A refreshed adoption
should fix that cross-document contradiction instead of copying both instructions forward. It must also preserve the later Academy workflows and
current product source, not replace next with the old branch tree.

## Existing proof verified without rerunning a matrix

GitHub run `40903311527` is completed/successful at exact old head `04ba802`; its eight jobs are
reuse-ci, both Node versions, browser proof, conformance, examples, commits and ci-ready. The
actual downloaded log records six passing proof-contract tests, including predicate mutation,
missing-job refusal, final revalidation, edited-copy refusal and complete loadable sync closure.
The actual checkout was synthetic merge `0ee01832c9d7160cdc93bba8fa48be04141f4d93`,
whose tree `6bfe7ecc` equals the old head tree, with parents `750209f7` and `04ba802`.
This is valid exact-tree evidence for that old source, not acceptance of a future candidate.

The fourteen old helper blobs were independently hashed against the released Platform v0.90.0
source, commit `858fee6f6aae7cad8fac9679272d192866e7bd83`. GitHub's current tag object matches
the local tag object. Every old helper hash equals both the released blob and PR12's recorded
manifest hash. This confirms old generated-copy integrity; it does not make the stale branch
ready to merge. Accepted issue 11 still authorizes v0.90.0 for a freshly integrated candidate. The four pre-existing commit tools are a separate existing closure.

Verified SHA-256 for each old copy, released blob and manifest entry (all three match):

| Shared CI helper                     | SHA-256                                                            |
| ------------------------------------ | ------------------------------------------------------------------ |
| `ci-reuse.mjs`                       | `8a33bd2b75f7cc11e860b203427f6c6cc1a4837971fa995994cfb226903d9ac7` |
| `workflow-jobs.mjs`                  | `dee9e0101764797d8f37eb006e444a4fa21f4ef24829d9329f1f4fa110cab153` |
| `ci-merge-proof.mjs`                 | `cb8f66f8ce362f77aa1daec0f48a7a06c32f94e294701699e7843aa68645fb64` |
| `ci-merge-inputs.mjs`                | `54026c82333de8b982bb0693e9fe654d7c6d3addc0022f8454499f0454ac1525` |
| `ci-pr-proof.mjs`                    | `07d8023a1b16151eae1bdb447d102614adc5512570ed356316f569764a23510d` |
| `ci-execution-inputs.mjs`            | `916ac26a5b1a02dbb422be92c65453ce453315594bbd1e67f2efd17e77780fc8` |
| `ci-execution-inputs-schema.mjs`     | `6ebdf63630c634bd548126ae4fc0e8ca85c35b17e89d2ba62b508e88b7960d5d` |
| `ci-execution-inputs-filesystem.mjs` | `355cdc11a4afb5e6e887e78db0b17aa23ff08897a14c6e19b1bb054b5a6775e1` |
| `ci-execution-inputs-checkout.mjs`   | `af1c3ad550a3670ba68c350e06d4e3e12f8c0ed5c5996c2102e57926535706d6` |
| `ci-execution-inputs-resolver.mjs`   | `d752992565f0a59b9dfd780ab8698b8a465e0d69635c773507caa30d612050f6` |
| `ci-job-bootstrap.mjs`               | `2548fd818cb6b86b6cd96bc3eae22fbb41ebc4dd32163586e6a98cfda72560e8` |
| `ci-main-topology.mjs`               | `f33b4f40fd8e893b617d859e42cf70eecda14877ca027ded3898eab505a65589` |
| `ci-witness-slots.mjs`               | `fd6b92ffcc3e271f746d02eab7bd4b827edd37b1d688cc304c1af68b20d9ef78` |
| `ci-exact-candidate-proof.mjs`       | `a6764241a880e90a01e5cc73c4cdbb61a0243e220f7134fba04643e6c28fd173` |

GitHub PR12 comments/reviews are empty. The retained AUDIT file named
`rc-source-verification-hosted-batch53/assemblejs-pr12-approval.md` records an owner merge
approval conditional on GitHub review and an empty review list. That is not an independent
source-review receipt. PR12's body claims an independent post-CI review, but the body alone is
not proof of that claim. No separate such receipt was established by this reconciliation.

Local retained reads:

- `/tmp/assemblejs-pr12-existing-ci.json` and `/tmp/assemblejs-pr12-existing-ci.log`.
- `/tmp/assemblejs-pr12-platform-tag.json` and `/tmp/assemblejs-pr12-copy-hashes.json`.
- Current committed files plus old Git blobs at the exact heads above.
- AUDIT `rc-source-verification-hosted-batch53/assemblejs-pr12-approval.md`,
  `rc-source-verification-hosted-batch62/magpie-assemble12-status-b63.json` and
  `rc-source-verification-hosted-batch90/magpie-assemblejs12-status-b81.json`, all beneath
  `evidence/2026-10-28-magpie-completion/`.

## Smallest remaining path

Keep issue 11 open. Treat PR12 as an old candidate/reference, not a completed delivery or a
ready-to-merge current tree. The manager reaffirmed the issue's already approved v0.90.0 target;
prepare only the still-missing generated helpers/manifest, scoped CI reuse
adapter/final gate, optional verification plan and consistent contributor text on current next.
Preserve full-matrix fallback on absent/invalid proof and all current ordinary/applicable
Academy checks. The old optimization only qualifies a same-repository PR from next; it is not
a general feature-branch reuse promise.

Use a fresh independent source review and the normal exact-source acceptance for that changed
candidate. A pin change also requires the existing site's usual deployment verification; it
is not an npm publication. No old matrix was rerun, no pin/source/runtime was adopted, no
stale branch was merged and no deployment/publication was triggered by this read-only pass.

## Delivered follow-up, 2026-10-31

The historical read-only checkpoint above is superseded for delivery status by PR46 and PR47.
PR46 merged the independently reviewed safeguards at `fe036a7`; its normal CI, landing and
modes passed, but deployment `41187302218` correctly failed the new shared-frame check.
PR47 regenerated only the sixteen frame links and corrected released-asset staging, merged
as `c8c3705` after personal review `5722144704` and all nine exact-head checks. Actual squash
identities and signatures were verified for both merges.

Post-merge CI `41188471147`, landing `41188471159` and normal deployment `41188471177` passed.
All 66 checked files (product/kit files and the API index) match expected deployed bytes; other
generated API pages were not crawled. The manager retains the unchanged raw receipts and
checksums in AUDIT `evidence/2026-10-31-manager/assemblejs-safeguards-c8c3705/`.
See `docs/handoffs/academy-current.md` and `docs/DECISIONS.md` for exact identities and limits.
The optional verification plan and live eligible-next reuse path remain unexercised; main-merge
reuse is disabled. No npm publication, runtime adoption or new public activation followed.
