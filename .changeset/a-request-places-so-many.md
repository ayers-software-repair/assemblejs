---
"@assemblejs/core": minor
---

One request composes no more than `limits.placements` placements, 256 by default, at every depth together: a page's own and those of every view composed for it in this process. A placement answered from the cache is one, whatever that answer holds, and at an assembly's own address the assembly asked for is not counted. A placement numbered past the limit is refused before anything is dispatched for it, as one too deep or its own ancestor is: its fallback, and a diagnostic whose reason is the new `too-many`. A deferred placement counts and is not refused. A request the browser fills a deferred placement with, and a request to another server, each have a count of their own.

`Limits` gains the required field `placements`, and `DEFAULT_LIMITS` gives it. `ComposeOptions` and `AssemblyRequest` take an optional `count`, the function that numbers a request's placements, which the local transport hands on to what it renders; `LocalRenderInput` takes the same. `SettleInput` carries a placement's `ordinal` and that `count`.
