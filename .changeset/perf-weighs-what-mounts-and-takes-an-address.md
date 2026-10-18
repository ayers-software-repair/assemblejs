---
"@assemblejs/core": patch
"@assemblejs/check": patch
"@assemblejs/build": patch
---

`perf` weighs what an assembly fetches as it mounts, and a page with a parameter in its route. It reported only what a page loads before anything mounts: 20.7 kB of script on a page whose React assembly then fetched 218 kB. It now shows two parts, the document, styles and scripts before anything mounts, and, for each assembly the browser mounts on the page that is this server's, its module with what that imports before it runs, each file once across the page, then a total. The module is found in the map the page's entry script holds. `budgets` takes `mount` and `total` beside `document`, `styles` and `scripts`. `addresses` in `assemblejs.config.ts` lists one example address for each page whose route has a parameter, keyed by the route as the page declares it, and `perf` weighs the page there and shows both; `check` asks for it with the rule `a-page-with-a-parameter-names-an-address`, and names an address its route does not answer and one for a route no page has. A page with a parameter and no address is still not weighed, and the line names the key to add. A project with such a page now needs the address, and one whose `total` or `mount` is budgeted is held to the truer figure.
