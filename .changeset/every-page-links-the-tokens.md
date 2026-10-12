---
"@assemblejs/core": minor
"@assemblejs/cli": minor
---

A project's tokens are one file, `src/tokens.css`, the colour roles, distances, type sizes and corners every assembly's stylesheet reads as custom properties at `:root`. The build carries it whole and unscoped, named by its content, and every page links it before any assembly's sheet: `createServer` takes `styles`, the urls every page links first, and the built project declares the tokens there. A new project starts with the estate's roles, three scales and a dark scheme, each value a placeholder.
