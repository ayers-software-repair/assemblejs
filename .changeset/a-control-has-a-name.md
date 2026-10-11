---
"@assemblejs/cli": minor
---

`check` refuses an `input`, a `select` or a `textarea` with no name, in any kind of view, as the rule `a-control-has-a-name` (WCAG 2.2, 3.3.2 and 4.1.2, level A): a `label` for its id or one that may wrap it, an `aria-label`, an `aria-labelledby`, a `title`, a placeholder on a text field or a value on a button input each name it; a spread, a computed type, a hidden, submit, reset or image input and a `button` are left to the render.
