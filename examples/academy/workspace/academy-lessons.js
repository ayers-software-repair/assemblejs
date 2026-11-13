// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Shared Academy lesson content and required evidence for both hosts. */
export const academyLessons = [
  {
    id: "explore-shop",
    revision: 1,
    title: "Explore the finished shop",
    task: "Open a product and turn on Outline. Find product-detail and buy-box. Which server owns each?",
    hint: "They share a page. The catalog server supplies the product; the shop supplies the buy box.",
    evidence:
      "You identified a local assembly and one supplied by another server in actual composition data.",
  },
  {
    id: "edit-content",
    revision: 1,
    title: "Change what you see",
    task: "Change the buy-box button's text to Add to bag. Save and find your words in the preview.",
    hint: "Open `shop/src/assemblies/buy-box/buy-box.react.tsx`. This assembly is local to the shop.",
    evidence: "The saved source and the rebuilt button both show your edit.",
  },
  {
    id: "add-assembly",
    revision: 1,
    title: "Add an assembly",
    task: "Add an interactive assembly to the shop using the authoring operation.",
    hint: "An assembly owns a piece of UI. The operation creates its ordinary project files.",
    evidence: "The files exist, the real check passes and the assembly renders and mounts.",
  },
  {
    id: "place-assembly",
    revision: 1,
    title: "Put it on the page",
    task: "Place your assembly beside the buy box on the product page.",
    hint: "The page template controls placement. Open `shop/src/pages/product/product.html`.",
    evidence: "Composition includes that placement and the running page shows it there.",
  },
  {
    id: "load-data",
    revision: 1,
    title: "Let the server supply data",
    task: "Read product data in the assembly's service. Try a valid product and an unknown one.",
    hint: "The buy-box service reads route parameters and query values. A service supplies data before rendering.",
    evidence:
      "Both addresses produce their intended results; an unavailable catalog is not reported as an unknown product.",
  },
  {
    id: "plan-calculator",
    revision: 1,
    title: "Plan the calculator",
    task: "Select Plan and ask: Add a price calculator. Read the proposed files and placement.",
    hint: "I'll reuse the shop's React setup and existing quote API. The server remains responsible for prices.",
    evidence: "You received a concrete plan. No files changed and no calculator was applied.",
  },
  {
    id: "reject-proposal",
    revision: 1,
    title: "Reject a proposal",
    task: "Select Approval. Inspect the calculator diff, then reject it.",
    hint: "Review the new assembly and its page placement. Reject leaves this proposal unapplied.",
    evidence: "The proposed files and placement are absent; your existing work remains.",
  },
  {
    id: "approve-revision",
    revision: 1,
    title: "Revise and approve",
    task: 'Request Add a calculator called "Coffee total". Review the revised diff and approve it.',
    hint: "Approval applies the version you reviewed. A changed project requires a new review.",
    evidence:
      "Applied files match that diff. The calculator displays its new title and obtains a real quote.",
  },
  {
    id: "auto-presets",
    revision: 1,
    title: "Try Auto",
    task: "Select Auto and enter Use presets 2, 4, 8. Try each preset in the preview.",
    hint: "I'll apply this supported change and run its checks. The result will show whether it worked.",
    evidence: "Actual source changed, checks ran and the presets change the quoted quantity.",
  },
  {
    id: "preserve-edit",
    revision: 1,
    title: "Keep a concurrent edit",
    task: "Leave a proposal pending. Make a manual or CLI edit, then try to approve the old proposal.",
    hint: "Your project changed. Review the refreshed diff before applying this proposal.",
    evidence:
      "The stale proposal is refused and your outside edit survives. Changing mode does not approve it.",
  },
  {
    id: "connect-frameworks",
    revision: 1,
    title: "Connect two frameworks",
    task: "Use the catalog's Vue facets to update its React product grid through events.",
    hint: "Both assemblies use the catalog bus. Cross-server event sharing must be declared by the page server.",
    evidence: "Changing a facet updates the intended grid without replacing the whole page.",
  },
  {
    id: "compose-remote",
    revision: 1,
    title: "Compose across servers",
    task: "Place a required catalog assembly by its remote address. Open the resulting shop page.",
    hint: "The shop composes the response on its server; the browser then mounts the interactive assembly.",
    evidence: "Remote content, assets and hydration work through the actual composition path.",
  },
  {
    id: "optional-content",
    revision: 1,
    title: "Keep optional content optional",
    task: "Stop the reviews server and reload a product. Restore it, then test an unavailable catalog.",
    hint: "Reviews have a fallback. The product is required, so these failures have different outcomes.",
    evidence:
      "Missing reviews leave the product usable; the required-product failure is reported correctly.",
  },
  {
    id: "cache-content",
    revision: 1,
    title: "Cache the right content",
    task: "Apply the supplied cache policy. Repeat a request, then change the relevant input.",
    hint: "Product facts and the shared footer already demonstrate cache policies in the product page definition.",
    evidence:
      "Evidence shows reuse and the intended refresh; a changed input does not reuse unrelated content.",
  },
  {
    id: "call-remote-api",
    revision: 1,
    title: "Call a remote api",
    task: "Add the supplied remote-api interaction through the page server's declared relay.",
    hint: "Use the assembly's api helper and the declared origin. The realtime example supplies the working pattern.",
    evidence: "The real request reaches the intended remote api and updates the assembly.",
  },
  {
    id: "validate-input",
    revision: 1,
    title: "Handle invalid input",
    task: "Try the supplied invalid shop action, then correct it and submit again.",
    hint: "Display the actual validation result and keep useful input. Price and stock belong to the server.",
    evidence: "Invalid input does not mutate state; the corrected synthetic action succeeds.",
  },
  {
    id: "stream-stock",
    revision: 1,
    title: "Follow live stock",
    task: "Connect the supplied stock stream and trigger a synthetic stock change.",
    hint: "The buy box listens for stock:changed. Its subscription must be released when it unmounts.",
    evidence:
      "The correct product updates, and reconnect/stop behavior follows the real runtime contract.",
  },
  {
    id: "fix-placement",
    revision: 1,
    title: "Fix a real failure",
    task: "Run Check on a deliberately broken placement. Find the named rule and repair that placement.",
    hint: "Read the current diagnostic. A successful earlier check does not validate a later edit.",
    evidence: "That same problem clears after the fix; the result belongs to your current code.",
  },
  {
    id: "build-shop",
    revision: 1,
    title: "Build the application",
    task: "Build the connected shop. Inspect its composition and exercise the supplied end-to-end journey.",
    hint: "A successful build is one result. Running behavior still needs checking.",
    evidence:
      "Real build/check evidence, framework mounts and the required connected-app behaviors pass.",
  },
  {
    id: "capstone",
    revision: 1,
    title: "Finish with your own workflow",
    task: "Add and customize one supported feature using your preferred workflow. Run the final checks.",
    hint: "Run the required checks on your current project. The certificate unlocks after all required evidence is current.",
    evidence:
      "All required core/capstone checks are current and the earlier failure/recovery exercises are recorded.",
  },
];
