---
"@assemblejs/cli": patch
"@assemblejs/mcp": patch
---

A dev server told to listen on every interface, or on one of this machine's own addresses, is still found by the agent surface. `dev` records the address it can be asked at from this machine, the loopback of the same family where it listens on every interface, and `render_assembly` and `compose_page` believe a recorded address that is a loopback name or an address of one of this machine's interfaces. Any other host in the record is another machine's and is not asked.
