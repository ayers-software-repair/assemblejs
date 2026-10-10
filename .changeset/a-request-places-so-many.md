---
"@assemblejs/core": minor
---

One request composes no more than `limits.placements` placements, 256 by default, at every depth together: a page's own and those of every view composed for it in this process. A placement answered from the cache is one, whatever that answer holds, and at an assembly's own address the assembly asked for is not counted. A placement numbered past the limit is refused before anything is dispatched for it, as one too deep or its own ancestor is: its fallback, with the new reason `too-many`. A deferred placement counts and is not refused. A request the browser fills a deferred placement with, and a request to another server, each have a count of their own.

Every placement a request refuses so carries one correlation id, and the request has one diagnostic for them all, which says how many in its new field `refused`, and one line in the log.

`Limits` gains the required field `placements`, and `DEFAULT_LIMITS` gives it. The count of a request is a `PlacementCount`, made by `countPlacements`: `ComposeOptions`, `AssemblyRequest` and `LocalRenderInput` take one as `count`, and the local transport hands it on to what it renders. `SettleInput` carries it, and a placement's `ordinal`.
