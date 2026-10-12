---
"@assemblejs/core": patch
---

Three things about where a placement may stand and how long an answer is kept. A placement after a list item, a description's term or part, or a form begun inside a paragraph is no longer refused as standing in an open paragraph: the parser closes the paragraph at each, as it does at a table in a document that opens with the HTML doctype. A placement in a table outside its cells, or in a `select`, is now refused where the directive is read: the parser moves the envelope out before the table and leaves what the assembly holds behind in it. And a placement's `cache.ttl`, which is milliseconds, is held at boot as its deadline is: one that is not a positive, finite number is a boot problem.
