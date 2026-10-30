# Landing claims and source

The landing illustrates the current composition model. Its code window is a labelled static
excerpt, not a running preview. It links to the real Market example's instructions.

| Claim                                                                          | Source                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| One application can use multiple frameworks                                    | Six renderer packages; `browser/market.browser.ts` checks the composed application's framework mounts and interactions.                                                                                                                          |
| Assemblies can run locally or on another team's server                         | `examples/market/shop/src/pages/product/product.page.ts` declares the remote catalog and reviews placements; `browser/market.browser.ts` checks their origins and hydration.                                                                     |
| The illustrated three assemblies use Preact, React and Vue                     | Market's `catalog/src/assemblies/product-detail/product-detail.preact.tsx`, `shop/src/assemblies/buy-box/buy-box.react.tsx` and `reviews/src/assemblies/review-list/review-list.vue`. Their servers use ports 4701, 4700 and 4702 by default.    |
| A directory holds an assembly's view and optional server-side service          | Discovery in `packages/build/src/discovery/`; the generated project and Market follow that structure.                                                                                                                                            |
| Page events connect frameworks; remote placements have deadlines and fallbacks | Core's composer and client events; the Market browser proof exercises cross-framework behavior and remote failure handling. Required placements may fail the page.                                                                               |
| A coding agent works on the same project files                                 | `new` writes agent instructions and MCP registrations. The MCP tools share authoring/check operations with the CLI and render framework views through the running development server. `conformance/fixtures/agents/` checks the installed tools. |

"Frameworks Assemble" is the owner's requested headline. The product retains its own mark;
frameworks appear as names, with no third-party logos or borrowed artwork. The landing adds
no model inference, account, hosted editor or repository-upload flow.

Academy and the optional workspace remain under development. They are not advertised as
available by this landing change. Production browser execution, commercial licensing and
live external-agent transport retain their separate acceptance requirements.
