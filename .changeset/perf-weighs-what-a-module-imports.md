---
"@assemblejs/cli": patch
---

`perf` weighs what a page's module scripts import before they run. It weighed the scripts a document links and nothing they import, and a build that splits its code puts most of a page's script in the chunks its one linked module imports: the frameworks example was reported at 7.9 kB of script and loads 22.5 kB before anything mounts. Each module a page links or preloads is read for what it imports and exports from, those for theirs, each file once; an import from another origin is named and not fetched, and what a module asks for later with `import()` is loaded when an assembly mounts and is not weighed. A project's `scripts` budget is held to the truer figure, so one set against the old may need raising.
