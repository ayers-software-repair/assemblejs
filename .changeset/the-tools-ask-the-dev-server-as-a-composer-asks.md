---
"@assemblejs/mcp": patch
---

`render_assembly` and `compose_page` send the dev server the ids a composer sends, a uuid for the page and for each placement. They sent ids of their own making, which the content endpoint refuses with a 400, so with a dev server running every assembly was refused and every placement fell back. A request the server refuses is now said with what the server said was wrong with it.
