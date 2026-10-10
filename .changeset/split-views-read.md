---
"@assemblejs/cli": patch
---

A framework view is read for what it places together with the components it is split into: every module it imports by a relative path, directly or through one it imports. A slot written in a component beside the view was read as nothing, so a deferred parent's child placed there arrived without its stylesheet linked ahead.
