---
"@assemblejs/cli": minor
---

A new project starts with `src/components.css` beside its tokens: the elements HTML already has, the button, the field with its label, the link, the list, the table, the notice and the dialog, each a class and the tokens, with its focus ring and its states and no colour of its own. The build carries it whole and unscoped after the tokens, and every page links both, in that order; the starter's one assembly is a notice with a link styled as the button. `writeProjectStyles` replaces `writeTokens`, answering both urls in order.
