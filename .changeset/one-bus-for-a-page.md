---
"@assemblejs/core": patch
---

A page now has one event bus, which a remote server's assemblies join when the project declares that remote `events: true`, as it declares `forward` and `trusted`. A remote not declared stays on a bus of its own, as before.
