---
"@assemblejs/cli": minor
---

A new project is written for the agents that will work in it. `new` writes an `AGENTS.md` that says what a page, an assembly, a placement, a service and an api are, how to ask the project and change it, and every rule its code must satisfy; a `CLAUDE.md` that brings it to Claude Code; and the project's own MCP server, `@assemblejs/mcp` as a development dependency, registered in `.mcp.json`, `.cursor/mcp.json` and `.vscode/mcp.json`.

`check` holds them current under a new rule, `agent-instructions-are-current`: the command line's part of `AGENTS.md`, its server in each registration, a `CLAUDE.md` that does not import `AGENTS.md`, and a registered server the project does not depend on. Where the installed `@assemblejs/mcp` is built on another version of the command line than the one installed beside it, `check` reports that alone, since nothing is current to both. `assemblejs add agents` writes all of it into a project that has none and rewrites only its own part of each file in one that has.

The rules, `RULES`, `findRule` and `Rule`, are exported from here, where `new` and `check` read them; `agentInstructions`, `agentFiles`, `agentProblems`, `addAgents`, `MCP_REGISTRATIONS` and `AGENT_SERVER` are exported beside them.
