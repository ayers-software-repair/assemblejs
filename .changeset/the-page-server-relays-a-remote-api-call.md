---
"@assemblejs/core": patch
---

The page's server now passes on the api calls of an assembly placed from another server, so a remote's browser half no longer needs the other server to allow the page's origin. An assembly's browser half calls its own server's apis as `fetch(api("/api/..."))`, with `api` from `@assemblejs/core/client`.
