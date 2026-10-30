# Academy lesson copy

Original candidate learner/tutor text for the 20-stage proposal. No lesson below is wired
into a delivered Academy. Supplied project snapshots, check implementations and workspace
controls remain work to build. Paths refer to existing `examples/market` as source anchors;
the calculator is a proposed addition, not an existing Market feature.

## Teaching loop

Show one task, its actual result and the next useful action. Keep the first instruction
visible; put the hint behind Help. Label the built-in conversation Guided tutor. It uses
authored workflows and observed checks, without model inference or unrestricted language
understanding. Never show an invented check result or thinking animation.

## 1. Explore the finished shop

Task: Open a product and turn on Outline. Find product-detail and buy-box. Which server owns each?

Hint: They share a page. The catalog server supplies the product; the shop supplies the buy box.

Success: You identified a local assembly and one supplied by another server in actual composition data.

## 2. Change what you see

Task: Change the buy-box button's text to Add to bag. Save and find your words in the preview.

Hint: Open `shop/src/assemblies/buy-box/buy-box.react.tsx`. This assembly is local to the shop.

Success: The saved source and the rebuilt button both show your edit.

## 3. Add an assembly

Task: Add an interactive assembly to the shop using the authoring operation.

Hint: An assembly owns a piece of UI. The operation creates its ordinary project files.

Success: The files exist, the real check passes and the assembly renders and mounts.

## 4. Put it on the page

Task: Place your assembly beside the buy box on the product page.

Hint: The page template controls placement. Open `shop/src/pages/product/product.html`.

Success: Composition includes that placement and the running page shows it there.

## 5. Let the server supply data

Task: Read product data in the assembly's service. Try a valid product and an unknown one.

Hint: The buy-box service reads route parameters and query values. A service supplies data before rendering.

Success: Both addresses produce their intended results; an unavailable catalog is not reported as an unknown product.

## 6. Plan the calculator

Task: Select Plan and ask: Add a price calculator. Read the proposed files and placement.

Tutor: I'll reuse the shop's React setup and existing quote API. The server remains responsible for prices.

Success: You received a concrete plan. No files changed and no calculator was applied.

## 7. Reject a proposal

Task: Select Approval. Inspect the calculator diff, then reject it.

Tutor: Review the new assembly and its page placement. Reject leaves this proposal unapplied.

Success: The proposed files and placement are absent; your existing work remains.

## 8. Revise and approve

Task: Ask for the title Order estimate. Review the revised diff and approve it.

Hint: Approval applies the version you reviewed. A changed project requires a new review.

Success: Applied files match that diff. The calculator displays its new title and obtains a real quote.

## 9. Try Auto

Task: Select Auto and request three quantity presets. Try each preset in the preview.

Tutor: I'll apply this supported change and run its checks. The result will show whether it worked.

Success: Actual source changed, checks ran and the presets change the quoted quantity.

## 10. Keep a concurrent edit

Task: Leave a proposal pending. Make a manual or CLI edit, then try to approve the old proposal.

Tutor: Your project changed. Review the refreshed diff before applying this proposal.

Success: The stale proposal is refused and your outside edit survives. Changing mode does not approve it.

## 11. Connect two frameworks

Task: Use the catalog's Vue facets to update its React product grid through events.

Hint: Both assemblies use the catalog bus. Cross-server event sharing must be declared by the page server.

Success: Changing a facet updates the intended grid without replacing the whole page.

## 12. Compose across servers

Task: Place a required catalog assembly by its remote address. Open the resulting shop page.

Hint: The shop composes the response on its server; the browser then mounts the interactive assembly.

Success: Remote content, assets and hydration work through the actual composition path.

## 13. Keep optional content optional

Task: Stop the reviews server and reload a product. Restore it, then test an unavailable catalog.

Hint: Reviews have a fallback. The product is required, so these failures have different outcomes.

Success: Missing reviews leave the product usable; the required-product failure is reported correctly.

## 14. Cache the right content

Task: Apply the supplied cache policy. Repeat a request, then change the relevant input.

Hint: Product facts and the shared footer already demonstrate cache policies in the product page definition.

Success: Evidence shows reuse and the intended refresh; a changed input does not reuse unrelated content.

## 15. Call a remote api

Task: Add the supplied remote-api interaction through the page server's declared relay.

Hint: Use the assembly's api helper and the declared origin. The realtime example supplies the working pattern.

Success: The real request reaches the intended remote api and updates the assembly.

## 16. Handle invalid input

Task: Try the supplied invalid shop action, then correct it and submit again.

Hint: Display the actual validation result and keep useful input. Price and stock belong to the server.

Success: Invalid input does not mutate state; the corrected synthetic action succeeds.

## 17. Follow live stock

Task: Connect the supplied stock stream and trigger a synthetic stock change.

Hint: The buy box listens for stock:changed. Its subscription must be released when it unmounts.

Success: The correct product updates, and reconnect/stop behavior follows the real runtime contract.

## 18. Fix a real failure

Task: Run Check on a deliberately broken placement. Find the named rule and repair that placement.

Hint: Read the current diagnostic. A successful earlier check does not validate a later edit.

Success: That same problem clears after the fix; the result belongs to your current code.

## 19. Build the application

Task: Build the connected shop. Inspect its composition and exercise the supplied end-to-end journey.

Hint: A successful build is one result. Running behavior still needs checking.

Success: Real build/check evidence, framework mounts and the required connected-app behaviors pass.

## 20. Finish with your own workflow

Task: Add and customize one supported feature using your preferred workflow. Run the final checks.

Tutor: Your required checks are current. You can download your Academy completion certificate.

Success: All required core/capstone checks are current and the earlier failure/recovery exercises are recorded.

## Prepared calculator scope

The proposed feature reuses `shop/src/api/quote.api.ts` and `shop/src/shop/quote.ts`.
It requests a quote for a product/quantity; it does not create orders, alter stock or trust
a client-supplied price. Its input validates whole quantities 1–99 before requesting a quote.
The existing quote parser filters malformed lines; do not invent a validation error that
the actual endpoint does not return. Show actual stock/catalog problems from the quote.

The initial supported requests are Add a price calculator, title Order estimate and three
quantity presets. These are authored intents. Broader wording needs a clarifying choice or
the learner's real agent; it is not arbitrary natural-language customization. Add additional
presets only with corresponding real files, diffs, validation and behavior checks.

## Tutor result text

- Pending check: Saved. Checking this change.
- Success: This check passed for your current code.
- Failed check: This check failed. Open its output, then try the lesson hint.
- Older result: Your code changed. Run this check again.
- Unsupported request: Choose a supported change, or use your own agent for this request.
- Unknown diagnostic: This error is outside the lesson hints. Open the diagnostic to investigate.
- Failed save: Your edit is still here, but it was not saved. Retry saving before leaving.
- Preview behind: The preview shows the last successful build. Your latest build needs attention.

Each message requires its actual condition. A saved file, applied proposal, successful check
and updated preview are separate results. Plan does not edit/rebuild; ordinary live data may
continue changing. Unknown diagnostics need the public-safe diagnostic boundary identified
in the workspace source inventory.

## Existing-agent connection copy

Connect your agent opens client-specific setup with the current lesson, files and check
context. Built-in guidance remains usable immediately. Setup copied, project exported,
agent configured and verified connection are distinct states. Show Connected only after
an observed handshake/tool result; browser-to-agent transport is still unimplemented.

## Framework extensions

Use the actual Market parts as optional deeper exercises: React buy-box, Preact product-detail,
Vue facets/review-list, Svelte basket, Solid search-box/shipment-progress and Lit roast-meter.
Template extensions use the existing EJS facts, Handlebars categories and Nunjucks depot board.
These are working source anchors; their eventual lesson snapshots and checks remain unbuilt.
