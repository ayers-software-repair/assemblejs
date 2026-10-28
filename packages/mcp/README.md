# @asmjs/mcp

The AssembleJS agent surface. An MCP server, so an AI agent builds with the framework the way a
developer does, with the framework's own knowledge behind it rather than a guess at it.

It carries no model and no credential, and calls no inference API. The intelligence is whichever
agent you already use; what ships here is the expertise.

What makes it more than a wrapper around the command line: an agent that has just written an
assembly can render it and compose the page it sits on, and see what it actually produced,
including which placement fell back. It closes its own loop instead of asking you to look.
While the project's dev server runs, the tools ask it, so a view in any framework or template
language is shown as the project serves it, with the data its services returned, and what
failed there is named by the id its log holds. This server still runs none of the project's
code. With no dev server running, a plain html view is rendered on the spot and any other is
answered with the reason.

It lists four prompts, which Claude Code and VS Code show their user as commands and Cursor
supports as well: `add_assembly`, `place_assembly`, `make_page` and `fix_findings`. Each answers a brief that has the agent look
before it adds, ask where it was not told, see what it made and run `check` last.

A project made with `npm create @asmjs` has it already: installed as a development
dependency and registered for Claude Code, Cursor, VS Code, Gemini CLI and opencode, beside an
`AGENTS.md` that tells
an agent to use it. In an older project, `npx assemblejs add agents` writes the same files.
Any other client starts it over stdio with

    node node_modules/@asmjs/mcp/dist/bin.js

from the project's root, or with the root as its one argument from anywhere else.

The protocol SDK is bundled into this package, so the agent surface installs as one package
beside zod; the bundled code and its licences are named in `THIRD_PARTY_NOTICES.md`.

See <https://assemblejs.com/>.

Apache-2.0. Copyright Ayers Electronics Inc.
