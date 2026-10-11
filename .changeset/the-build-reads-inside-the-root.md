---
"@assemblejs/cli": patch
---

The build's own reads, the source hash and the stylesheets and files it carries into `dist/`, go through the same root guard as every other read, so a link out of the project is refused unopened wherever the build meets it.
