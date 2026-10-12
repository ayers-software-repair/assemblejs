---
"@assemblejs/mcp": minor
---

While the project's dev server runs, `render_assembly` and `compose_page` say what failed on it: an assembly that failed there is answered with the id the dev server logged its failure against, and each placement that fell back inside an answer that stands is named with its own id, where before the first carried an id in nobody's log and the second said nothing.
