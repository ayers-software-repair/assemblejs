---
"@assemblejs/cli": minor
"@assemblejs/mcp": patch
---

`check` and the agent surface read nothing outside a project's root. Every file a reader opens is held to the root after each link is followed to where it really leads: a link under the root that leads out of it, a directory that is one, and a view's import that climbs out are not opened, not listed and not followed. Each is a finding by a new rule, `a-project-stays-inside-its-root`, and what it would have said reads `(unread)` in `assemblejs://project`. Before this, a finding could quote what such a file held. `add agents` writes nothing through a link that leads out, and a stylesheet's `url()` written outside its assembly is refused without being looked for. Discovery takes the project's root (`discoverAssemblies(root)`, `discoverPages(root)`, `discoverApis(root)`), the readers that open a file take it too, and `insideRoot`, `readInside`, `leadsOut`, `followLinks` and `OutsideRootError` are the command line's, which the agent surface takes them from.
