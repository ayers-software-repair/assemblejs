---
"@assemblejs/core": patch
---

A script ends where the tokenizer ends it. Inside a `<!--`, a `<script` makes the tokenizer read on past the next `</script`, and a script was read as ending at its first end tag whatever it held: a placement written in what the browser still took for the script's text was found and dispatched, and the assembly's markup put inside the script. `scriptEnd` reads a script's text by the tokenizer's three ways of reading it, and `inertSpans` asks it. Where a tag's name ends is written once, `TAG_NAME_END`, for every reader of tags.
