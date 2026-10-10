# @assemblejs/cli

The AssembleJS command line.

    assemblejs new my-app
    assemblejs add assembly cart
    assemblejs add agents     the agent instructions and MCP registrations, written or brought up to date
    assemblejs dev       build, run, and rebuild on every change
    assemblejs build     dist/server.js and its browser files
    assemblejs check     every problem found without building, each with its fix
    assemblejs perf      build, then weigh what each page sends a visitor, against its budgets
    assemblejs deploy    build, then write deploy/: dist and its dependencies

A directory under `src/assemblies/` is an assembly. There is nothing to register: the command
generates the typed module the built server imports, and you never open it.

A new project is written for the agents that will work in it: an `AGENTS.md` that says what the
project is and the rules its code must satisfy, a `CLAUDE.md` that brings it to Claude Code, and
`@assemblejs/mcp` installed and registered in `.mcp.json`, `.cursor/mcp.json` and
`.vscode/mcp.json`. `check` holds them to what the installed version writes, and `add agents`
rewrites only what is its own in each.

See <https://ayers.repair/assemblejs/>.

Apache-2.0. Copyright Ayers Electronics Inc.
