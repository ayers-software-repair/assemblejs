---
"@assemblejs/cli": patch
---

`VueBlock`, the type every block of a single-file component is described by, is exported beside `VueDescriptor`, which names it; the API reference, generated once per package now, refused the signature that named a type nobody could import.
