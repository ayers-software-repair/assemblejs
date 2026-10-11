---
"@assemblejs/cli": patch
---

`check`, the shape and `perf` treat a page declaration they could not read as a literal, one computed whole, one with a spread among its entries, or one with no default export, as a route only a run could tell, where they said the directory's route before.
