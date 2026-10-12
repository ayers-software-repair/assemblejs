---
"@assemblejs/core": minor
---

A placement directive inside a paragraph the parser has not closed is refused where the directive is read, by `check`, at boot, by the composer and at a view's render alike: the browser would close the paragraph at the first block the assembly holds and tear the rest of the assembly out of its envelope.
