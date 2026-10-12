---
"@assemblejs/renderer-react": patch
"@assemblejs/renderer-preact": patch
"@assemblejs/renderer-vue": patch
"@assemblejs/renderer-svelte": patch
---

The ids a component makes are its island's own. React's `useId`, Vue's `useId` and Svelte's `$props.id()` each number their ids from the root of a render, and every island is a render of its own, so two islands on a page made the same ids: a label in one named the input in another. Each renderer now gives its framework the placement's id as the prefix it takes for this (`identifierPrefix`, `app.config.idPrefix`, `idPrefix`), on the server and, where the framework asks for it again, in the browser. Preact's hook takes no prefix, so `@assemblejs/renderer-preact/client` exports a `useId` to import in its place: Preact's own with the placement's id before it, the same on the server and in the browser.
