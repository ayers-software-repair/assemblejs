---
"@assemblejs/core": patch
"@assemblejs/cli": patch
"@assemblejs/mcp": patch
---

`compose_page` and `render_assembly` take what a visitor arrives with: `params`, a value for each parameter of the page's route, and `query`. Every placement's request is given them as a page's composer gives them, so a page at `/product/:sku` is shown as one product's. Until now both rendered for nobody, with no value for any parameter, and an agent was shown a page no visitor is. `compose_page` holds the values to the route the page declares: one for a parameter the route has not is refused with the ones it has, and a parameter left out is composed without and said among the problems. The three tools that show a project and change nothing are registered by `registerSeeingTools`, exported beside `registerAuthoringTools`.

`@assemblejs/core` exports `routeParameters`, the one reading of the names of a route's parameters. The server's route table, `perf`, which does not weigh a page whose route has one, and the agent surface each read it, where each had told a parameter by itself.
