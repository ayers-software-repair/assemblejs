---
"@assemblejs/build": minor
"@assemblejs/cli": minor
"@assemblejs/mcp": patch
"@assemblejs/create": patch
---

The build is a package of its own. `@assemblejs/build` is new: what is known of a project by its directories, the modules generated for it, the bundles a project becomes and the dev loop, which were part of `@assemblejs/cli`. The command line depends on it and keeps its verbs, so a project installs and runs what it did: `assemblejs build` and `assemblejs dev` are unchanged. A program that imported those names from `@assemblejs/cli` imports them from `@assemblejs/build`; the command line no longer exports them.
