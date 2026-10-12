---
"@assemblejs/cli": patch
---

`check` reads a Pug view's elements with the attributes they were written with. Only a placement's attributes were kept, so an `img` with an alt and an `input` with an `aria-label` were each reported as having none, and an inline `style` in a Pug view was never reported. A written value is escaped as a render escapes it.
