---
"@assemblejs/cli": minor
---

`check` refuses a `style` attribute on any element of any kind of view, written or computed, as the rule `a-view-has-no-inline-style`: a style attribute does nothing under the default content security policy and sets a value where it is used, where the stylesheet and the tokens are the one place a look is set. `viewElements` and `elementProblems` are exported; `readViewElements` reads one file of a view by its kind.
