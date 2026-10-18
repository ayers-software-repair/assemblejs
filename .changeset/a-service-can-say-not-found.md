---
"@assemblejs/core": patch
"@assemblejs/build": patch
"@assemblejs/check": patch
---

A service can say the thing its page is for does not exist: `throw new NotFound()`, from `@assemblejs/core`. The page then answers 404 with the project's not-found page, the page directory `src/pages/not-found`, which has no route of its own and is also what every address no route claims answers. A project without one answers those with the failure body, under a 404, as before; an address under `/assembly` or `/_assemblejs` always does. `check` names a not-found page that declares a route. An address with a trailing slash now answers as the one without it, `/products/` as `/products`, and access is decided of it the same way, so `/admin/` is guarded as `/admin` is.
