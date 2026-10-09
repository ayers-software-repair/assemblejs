---
"@assemblejs/core": patch
---

The directive finder ignores a placement written inside a `script`, `style`, `textarea` or `title` element, as it ignores one inside a comment, so a child's island can never end an enclosing script early. One segment shape, `SEGMENT`, is read everywhere a name or a view is checked: the finder, boot, and the content url parser.
