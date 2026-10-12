---
"@assemblejs/cli": minor
---

`check` refuses a literal colour in an assembly's stylesheet, as the rule `a-colour-is-a-token`: a hex colour, a colour function or a named colour in any declaration, a custom property's included, in a project that has `src/tokens.css`; a token, `transparent`, `currentcolor`, a string and a url pass.
