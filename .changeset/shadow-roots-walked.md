---
"@assemblejs/core": patch
---

The browser runtime finds an assembly placed inside a shadow root: `findEnvelopes` enters each shadow root where it stands, in document order, so a child a shadow assembly's view placed is mounted after its parent. The deferred fill asks for its placement one level deep, as the page's own composer would have, so the children it places are composed from the depth they would have had.
