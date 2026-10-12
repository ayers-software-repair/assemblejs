---
"@assemblejs/cli": minor
---

`check` refuses a slot written inside a Lit element's `render`, as the rule `a-placement-stands-outside-an-element`: the child would stand in the element's own shadow root, where the page's stylesheets do not reach, and the composer refuses it at render; `check` says so first.
