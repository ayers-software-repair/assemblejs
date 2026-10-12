---
"@assemblejs/core": patch
---

The mark that says an assembly is live is written when it is. A built project mounts through the renderer that loads each assembly's module when the assembly is due, and `data-mounted` was written when that renderer handed back its handle: on every assembly before its module had arrived, and for good on one whose module never did. A `MountHandle` may now say when its half is live (`mounted`, a promise that rejects where it never will be), `lazyRenderer` says it, and the runtime marks then (`markMounted`). A mount that throws releases what it had subscribed (`mountIsland`); an island holding JSON that is not an object is no payload, where the runtime threw on it and mounted nothing after it; on the bus a handler another handler removed during a send is not called, an assembly that subscribes after it was released adds nothing, and a handler that throws is reported against its assembly while every other listener is still called.
