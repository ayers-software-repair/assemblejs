---
"@assemblejs/mcp": minor
---

The server finds its project's root from how it was started: the directory given as its one argument, else the one Claude Code names in `CLAUDE_PROJECT_DIR`, else where it was started. A root that is no directory is refused at start, on standard error, with exit code 2.

`create_project` writes the agent instructions and registrations a new project carries, and scaffolds into a root that already holds some of them, the registration that started the server for one: its own part of each file is brought up to date and everything else in it is kept.

`RULES`, `findRule` and `Rule` are no longer exported from here; they are `@assemblejs/cli`'s, which this package depends on and explains.
