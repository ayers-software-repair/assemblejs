---
"@assemblejs/core": patch
---

The assembly contract's three endpoints are mounted by `registerAssemblies`, as pages, apis and assets already were by their own functions; `logFallbacks` and `refuseBeforeDispatch` are exported beside them. Nothing a server answers changes.
