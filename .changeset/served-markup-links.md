---
"@assemblejs/core": minor
---

A page links the stylesheets and modules of every assembly of this server in the markup it serves, at any depth: a child a view placed is styled and mounted as its parent is, and one inside an answer that came from the cache keeps its sheet. A shadow assembly links, inside its own root, the stylesheets of the children placed there. `localAssets(html, assemblies)` is that reader, and `LocalRenderInput` carries the server's assemblies.

The directive finder reads comments and raw-text elements in one pass, so a `<script` written inside a comment no longer hides the directives after it.
