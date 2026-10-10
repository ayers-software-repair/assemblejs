---
"@assemblejs/core": minor
---

A view places a child as a page does: an `<assembly name="x">` directive in a view's rendered markup is composed where it stands, the child in its own envelope inside its parent's. A child is dispatched one level deeper than its parent arrived, with the parent among its ancestors, so a child that is its own ancestor and a chain past the cap are refused before anything is dispatched, on the content endpoint as on a page.

`renderLocal(assembly, view, input)` takes the composition state and answers `{ html, diagnostics }`; `localFetch` and `registerPages` take the server's limits, and `maxDepth` is the one cap for arrival and for every composer. A `Diagnostic` carries its `children`, and a fallback at any depth is logged against its id. An answer holding a failed envelope is never cached. A composition takes a `signal`: once it aborts, no further placement is dispatched.
