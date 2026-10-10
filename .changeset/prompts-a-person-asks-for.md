---
"@assemblejs/mcp": minor
"@assemblejs/cli": patch
---

The agent surface lists four prompts, which a client shows its user as commands: `add_assembly`, `place_assembly`, `make_page` and `fix_findings`. Each answers a brief, one message in the person's voice, that gives the agent the order to work in, where to stop and ask, and what each tool's answer means. A prompt takes a name of the framework's own shape, or one of its renderers, and refuses anything else as invalid.

`pageDocument(title, placed)` is exported from the command line: the whole document a new project's page is written with, which the prompt for a page hands over. The instructions a new project is written with say which views `render_assembly` and `compose_page` show at once and where the rest are seen.
