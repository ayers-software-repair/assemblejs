---
"@assemblejs/cli": patch
"@assemblejs/mcp": patch
---

`perf` no longer fails a project that guards a page. It asks every page as a visitor who has not signed in, and a page that answers such a visitor 401 or 403 was counted as one that did not answer, so no project with a guarded page could pass. It is now reported as not weighed, as a page whose route has a parameter is, and the command goes on. A file an open page links that answers 401 is still a failure. And `check` and the agent surface say "an ejs assembly" and "an html assembly", where they said "a".
