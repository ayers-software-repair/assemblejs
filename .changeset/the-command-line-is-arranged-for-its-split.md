---
"@assemblejs/cli": patch
---

The command line's source is arranged for its split into three packages. What a view places, read from its source, is an area of its own beneath the build and no longer part of `check`, which made the build depend on the checks. Every name the package exports is exported as before, and nothing it does changes.
