---
"@assemblejs/cli": minor
---

`check` refuses an `img` with no `alt` at all, in any kind of view, as the rule `an-image-has-an-alternative` (WCAG 2.2, 1.1.1, level A); an empty `alt` passes as decoration, a computed one as present, and an `img` under a spread is left to the render.
