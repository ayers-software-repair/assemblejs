---
"@assemblejs/core": minor
---

The browser runtime marks an envelope `data-mounted` once its renderer has mounted the assembly, and removes the mark when it unmounts it, so a page, a test or a person can tell a hydrated assembly from one still waiting for its module. The server never writes it.
