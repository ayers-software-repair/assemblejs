---
"@assemblejs/core": patch
---

An api's `handle` and a service's `run` may answer an object whose members are sometimes absent, so a handler that answers one of two shapes is accepted as written, and a member left out is not sent and not given to the view. What cannot cross as JSON, a `Date`, a function or a `bigint`, is still refused.
