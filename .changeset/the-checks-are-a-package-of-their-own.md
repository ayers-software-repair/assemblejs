---
"@assemblejs/check": minor
"@assemblejs/cli": minor
"@assemblejs/mcp": patch
---

The checks are a package of their own. `@assemblejs/check` is new: the rules a project is held to, every problem found in one without building it, a project's shape, what its pages weigh, and the text of the files written for a project's agents, which were part of `@assemblejs/cli`. The command line depends on it and keeps its verbs, so `assemblejs check` and `assemblejs perf` are unchanged. A program that imported those names from `@assemblejs/cli` imports them from `@assemblejs/check`; the command line exports its verbs and what `new` writes, and no more.
