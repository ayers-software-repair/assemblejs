# Original AssembleJS identity restoration

Owner: AssembleJS implementation chat. Assigned by the owner through the manager on
2026-10-31; governed by docs/PLAN.md. Base: PR54 merge
`4a5ad61969bfb11005d3d658951b2a936e8a7c3c`. No runtime or publication selection.

## Reference comparison before implementation

Read-only original: `/home/sparrow6/source/refs/assemblejs-legacy/`, commit
`5f7fdf4d1a7e95c7b0a69bfb269e378e4873ec58`, website
`websites/www.assemblejs.com/`. Read Logo.js/Logo.css, Header.js/Header.css,
index.css and the original rendered `src/assets/images/portal-image.png`.
The original application was not built or run. The image proves the hero composition,
not navigation, responsive behavior or the animated header in a running application.

Compared that actual original image with accepted hosted PR47 landing run `41188471159`,
artifact `13037463582` (3,623,564 bytes), SHA-256
`38a27da2fea3a96c2f2ff8ae3388add46903e33f0bf6257842226d7c5df11c8c`.
Verified the ZIP and viewed its 1440px viewport. Current site source remains the same
across intervening Academy-only merges. Current Academy desktop/narrow and editor states
were personally viewed in final PR54 artifact `13049162893`; those are private hosted
fixtures, not a public Academy deployment.

The original uses six coloured hexagons, an orange-to-blue wordmark/headline, navy/slate
surfaces and faint coloured geometric accents around a solid code pane. The current
landing instead uses a green four-square mark, yellow headline and large woven canvas.
Restore the original composition rather than recolouring that replacement. Keep current
framework composition examples and supported commands. Replace the example caption with
“See how assemblies make a page” and its outline link with “Inspect a composed page”.

## Complete page inventory

The maintained site has 17 HTML pages: home; install; start; downloads; support;
release-notes; 404; docs/index; docs/tutorial; docs/outline; docs/react; docs/vue;
docs/svelte; docs/preact; docs/solid; docs/lit; docs/templates. Their generation owner is
`site-source/pages.json` plus the exact pinned Platform generator for 16 pages. The 404
is the existing manually maintained product-frame page, with absolute product-prefix
assets/navigation, noindex and no canonical; it is not in the source generator. Inspect all 17 at desktop and narrow widths, not only their families.

The retained generated reference under `/tmp/assemblejs-landing-live-expected/docs/api/`
has 701 HTML pages: root 2, modules 32, classes 9, interfaces 121, functions 419,
types 33, variables 85. This is an observed baseline inventory, not a promise of the next
TypeDoc count. `scripts/site-api-theme.mjs` owns the common header/footer, font/style
links and body class for every generated page; `site/api-theme.css` preserves TypeDoc
navigation/search/signatures. Generate and enumerate the exact candidate in hosted CI,
assert branding/assets across every page, and capture each reference layout family.

Private Academy surfaces: source-editor fixture; modes fixture; calculator-authoring
fixture; complete workspace with guided tutor, Plan/reject/Approval/Auto steps, source
changes, diagnostics, verified calculator and stopped preview. Source-editor uses its own
hosted harness; the other three use `browser/academy-modes/serve-modes.mjs`. Shared
workspace CSS must use the same product colour/type bindings and retain working controls,
focus and narrow layouts. The supplied Market preview retains its own example-shop brand;
it is learner application content, not AssembleJS chrome. Do not overwrite its identity.

## Integration and finish line

Platform confirms current pin v0.90.0 (`858fee6f6aae7cad8fac9679272d192866e7bd83`)
already supports product-owned mark/name, head font links, skin roles and landing-brand.css.
Use those released hooks and existing generator. Do not edit shared vendored kit files,
introduce a consumer component fork, upgrade the pin or add a background engine.

Original Poppins/Fira Code are remote imports; no local font files exist in the reference
or pinned kit. Restore locally served licensed originals with provenance and hashes;
no runtime remote font dependency. Keep readable system fallbacks and existing forced-
colours behavior. Quiet static decoration must respect reduced motion and keep reading/
editing surfaces solid. Mark/favicons use six actual hexagonal forms and one accessible
home link, with no decorative keyboard stops.

Before completion: exact-source static identity/header/organization/contrast checks;
known-bad controls for new meaningful gates; hosted full CI, all-page asset/navigation/
containment and reference-family proof; existing Academy/editor behavioral scenarios;
personal independent review and applicable artifact QA; guarded merge and exact post-merge
checks plus existing public deployment/live evidence. Record failures without unchanged
retries. No broad Academy completion, live external-agent connection or runtime adoption
claim follows from this visual correction.

## Current source checkpoint

PR54 actual merge and all ten attempt-1 post-merge checks are independently clear:
CI `41220420134`, modes `41220420100`, editor `41220420102`. Personal receipt lives at
`/home/sparrow6/source/AUDIT/evidence/2026-10-31-pr-reviewer/assemble54-4a5ad61/REVIEW.md`.
This branding candidate remains unaccepted and unmerged.

Original/current rendered comparison precedes the candidate changes. Local asset inputs
now retain the six original hexagon colours/geometry and static arrangement; social PNG is
rasterized from that SVG with installed rsvg-convert, not generated artwork. Fonts are
unmodified official google/fonts bytes at `6c1dbe27dcf7d817d4b62cec033ba77fa8e2a5ec`, with
full OFL files and exact hashes in `site/fonts/sources.json`. The source gate has been watched
rejecting a wrong mark colour and a changed font byte, then green after restoration.
Eleven site source cases and 119 Academy source/DOM cases pass. These do not prove font loading,
small-icon legibility, actual layout/paint or the hosted asset routes.

Platform independently confirms v0.90.0 has no static/off hook: every page emits a canvas
and starts its module; CSS hiding leaves a worker running, and unknown modes fall back to
ocean. Manager has the concrete request for a narrow supported shared static mode. No
consumer template fork, hidden-worker claim, unchanged GPU retry or pin upgrade is made.
The original-brand static background and its hosted pixel/negative-control proof remain
pending that coordinated hook. Existing generator/asset closure must remain exact.

Hosted coverage preparation now enumerates every generated reference HTML for shared-frame/
asset invariants, captures all 17 maintained pages plus each generated family and both root
layouts at 1440/390, and records actual loaded fonts, overflow and forced-colours keyboard
focus. Existing editor/workspace scenarios additionally require naturally loaded Poppins and
Fira Code with matching computed source typography. FontFace descriptors are CSSOM-serialized
strings ([CSS Font Loading](https://drafts.csswg.org/css-font-loading/#font-face-interface));
assertions accept the corresponding quoted family serialization. These probes are prepared,
not executed or accepted. Their normal hosted workflow generates the reference first.
The static geometric asset follows the original ParallaxBackground shapes/positions/colours;
its no-motion paint remains pending the supported shared hook and hosted proof.

Independent source review found and corrected probe-only gaps before any hosted run:
font assertions now wait for actual nonempty source; every generated page has parsed,
resolved product asset/shared-navigation targets and local existence checked rather than
substring matching; and setup/assertion/evidence-write failures still close the fixture.
The same asset validator is observed refusing wrong relative stylesheet URLs and missing
mark files in focused source cases. These are source checks, not captured browser evidence.

Source checkpoint gates also pass: targeted no-emit TypeScript probe checking, lint,
organization/self-test, headers, mirror/self-test, dependency graph, duplication and unused
code. Exact released static generation (16 source-generated pages plus existing 404), page
links and text exports match. Identity/emoji self-tests and gates cover staged new assets.
These do not substitute for full hosted CI or visual acceptance. Existing dependency links
are local tooling setup only and are excluded from the commit.

The two upstream OFL files retain their exact licensed bytes, including an upstream trailing
space on line 21. The only `git diff --check` notices are those two retained licence lines;
source-code whitespace is clean. Font/provenance hash checks cover the exact licence bytes.

First changed-source hosted result: draft PR55 head
`9f17a72cc14be180ff52a42a3ff9f31cd98498c8` editor run `41222747553`, attempt 1, passes
34 focused cases and its real browser case, including naturally loaded local Poppins/Fira
Code, source scrolling/selection, keyboard/narrow editing and deliberate save conflict.
Artifact `13050024538`, 355,264 bytes, SHA-256
`086743c15e071eb2237619b0a99d3d7a8f0e40594eebe251bd38e7bc86177462`, is size/hash verified;
root viewed all four PNGs. This supports the captured editor state only, not all-page branding
or static runtime acceptance. Other first-head jobs and supported static hook are separate.

Prepared static-proof follow-on replaces obsolete weave/GPU assertions with the actual new
contract: no DOM canvas, background module or worker; five widths; real compositor PNG
comparison against temporarily removed decoration, an identical-image zero control and exact
restoration; reduced motion and real outline navigation. Both bitmaps, temporary styles and
fixture are cleaned up on failure. Fresh independent source review is clear and no-emit probe
types/lint/unused pass; no static browser execution or stability acceptance is claimed yet.

First all-page landing run `41222747628` fails at head `9f17a72`: the real 390px
`docs/api/classes/_asmjs_build.DeadLinkError.html` has document-level horizontal overflow.
Poppins is actually loaded. Existing homepage proof passes; all 17 maintained pages pass at
both widths and all eight reference representatives pass desktop. Later narrow API captures
and forced-colours focus are unexecuted, not accepted. The exact current generation has
710 API pages, distinct from the explicitly retained 701-page baseline inventory.
Artifact `13050793009`, 25,521,855 bytes, SHA-256
`e2f9f3d9afab2108dc69b566bdbaf231b47ba89744cdb94f192c73d6eccb2db2`, is verified and retained
with log, trace, actual failing HTML and trace JPEG under `/tmp/assemblejs-original-branding-9f17a72-*`.
The first probe retained only a fit boolean, so the overflowing element is not yet established;
no CSS clipping, tolerance relaxation, unchanged retry or speculative layout fix is made.
The next changed-source checkpoint records viewport/document dimensions, bounded element
bounds/styles and a full-height failure image while preserving the containment assertion.

Modes run `41222747555` passes at the same head/attempt 1. Artifact `13049934886`,
2,672,584 bytes, SHA-256 `116860a9074ed4d25c301f3bd51ee9aef530511117357b913ad48c532ee5a573`,
is verified; root viewed all 26 PNGs, including private mode/tutor/draft/error/workspace states.
Calculator evidence remains 47 calls, seven successful builds, five inspections and empty
error/HTTP/active-process arrays. The example shop keeps its independent identity.
This is retained captured-state scope, not final all-page/static/hydration acceptance.
