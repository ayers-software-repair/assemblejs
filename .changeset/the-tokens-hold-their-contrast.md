---
"@assemblejs/cli": minor
---

`check` holds a project's tokens to their contrast in both colour schemes, as the rule `tokens-hold-their-contrast`: each ink against each ground it is set on at 4.5:1 or more, each accent against the surfaces at 3:1 or more, by WCAG 2.2's own definitions of relative luminance and contrast ratio (1.4.3 and 1.4.11, level AA). A role bound to anything but a hex colour is left alone. `readTokens`, `relativeLuminance`, `contrastRatio`, `TOKEN_INVARIANTS` and `tokenProblems` are exported.
