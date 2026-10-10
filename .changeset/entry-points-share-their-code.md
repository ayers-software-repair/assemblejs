---
"@assemblejs/cli": patch
"@assemblejs/mcp": patch
"@assemblejs/create": patch
---

The command and the library of each package are built to share one copy of the code where each carried its own. Nothing either does changes; the command line's tarball is about two thirds the size it was.
