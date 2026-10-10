# @assemblejs/mcp

The AssembleJS agent surface. An MCP server, so an AI agent builds with the framework the way a
developer does, with the framework's own knowledge behind it rather than a guess at it.

It carries no model and no credential, and calls no inference API. The intelligence is whichever
agent you already use; what ships here is the expertise.

What makes it more than a wrapper around the command line: an agent that has just written an
assembly can render it and compose the page it sits on, immediately, and see what it actually
produced, including which placement fell back. It closes its own loop instead of asking you to
look.

A project made with `npm create @assemblejs` has it already: installed as a development
dependency and registered for Claude Code, Cursor and VS Code, beside an `AGENTS.md` that tells
an agent to use it. In an older project, `npx assemblejs add agents` writes the same files.
Any other client starts it over stdio with

    node node_modules/@assemblejs/mcp/dist/bin.js

from the project's root, or with the root as its one argument from anywhere else.

See <https://ayers.repair/assemblejs/>.

Apache-2.0. Copyright Ayers Electronics Inc.
