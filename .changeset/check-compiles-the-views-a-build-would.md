---
"@assemblejs/cli": patch
---

`check` compiles a project's Svelte and Vue views with the project's own compilers, as it compiles its template views with their engines, and names a view its compiler refuses, with what the compiler said and the line. It had answered "no problems" for a view `build` then refused. The rule it is said under, `a-template-view-compiles`, is worded for every view a compiler reads; a project made before this is told by `check` that its `AGENTS.md` carries the earlier wording, and `add agents` brings it up to date.
