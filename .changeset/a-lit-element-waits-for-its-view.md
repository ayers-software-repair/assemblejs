---
"@assemblejs/renderer-lit": patch
---

A Lit element in a view hydrates when the view does, not as soon as it is defined. A view's module defines its elements before the view hydrates, so an element whose template is made from a property the view sets, a list most of all, hydrated from what its constructor set: against the list the server rendered, Lit threw "shorter than expected iterable" and the list was drawn twice. The server now marks each element a view holds `defer-hydration`, Lit's own mark, and Lit's hydration of the view sets the element's properties and lets it go.
