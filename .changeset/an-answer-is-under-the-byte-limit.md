---
"@assemblejs/core": patch
---

An assembly's content endpoint answers `500` with its fallback envelope when its answer, every child composed inside it, is larger than the server's limit on bytes. A page that placed the assembly already refused such an answer; asked for at its own address, it was sent whole, whatever its size.
