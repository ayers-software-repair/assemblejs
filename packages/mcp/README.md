# @assemblejs/mcp

The AssembleJS agent surface. An MCP server, so an AI agent builds with the framework the way a
developer does, with the framework's own knowledge behind it rather than a guess at it.

It carries no model and no credential, and calls no inference API. The intelligence is whichever
agent you already use; what ships here is the expertise.

What makes it more than a wrapper around the command line: an agent that has just written an
assembly can render it and compose the page it sits on, immediately, and see what it actually
produced, including which placement fell back. It closes its own loop instead of asking you to
look.

See <https://ayers.repair/assemblejs/>.

Apache-2.0. Copyright Ayers Electronics Inc.
