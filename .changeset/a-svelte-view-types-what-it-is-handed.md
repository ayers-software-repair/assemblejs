---
"@assemblejs/renderer-svelte": patch
"@assemblejs/cli": patch
---

A Svelte view types what it is handed. The Svelte renderer gives a view its data and its events as props, and its published `AssemblyProps` declared the data alone: a view that typed its props by it could not read `events`, and one that left them untyped, as `add assembly` wrote it, read both as `any`. `AssemblyProps` declares `events` now, and a new Svelte view is written `let { data }: AssemblyProps = $props();` with the type imported, as the scaffold already wrote every other framework's view. Nothing changes when the code runs.
