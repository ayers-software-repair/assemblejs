---
"@assemblejs/cli": patch
---

The root guard follows a link's target a step at a time, as the system that opens it does. A link whose target climbed out through another link and stepped back, `out/../note.txt` with `out` a link to a directory elsewhere, was read as text, found inside the project, and the file outside was then opened by `check` and the agent surface's readers.
