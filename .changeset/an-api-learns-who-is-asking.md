---
"@assemblejs/core": patch
---

An api is handed the request's headers and cookies, and may answer with `reply(...)`: a status, headers, cookies, a body or a redirect. A service and a page stay a function of the address and are given none of it.
