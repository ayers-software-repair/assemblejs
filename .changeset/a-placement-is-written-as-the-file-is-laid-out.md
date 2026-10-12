---
"@assemblejs/cli": patch
"@assemblejs/mcp": patch
---

What the command line and the agent surface write into a file a project already has is written as that file is laid out. A placement goes on a line of its own at the indentation of what it stands beside, in the file's own line ending, and inline only where what it stands beside shares its line; into an empty body it goes one step in, as the starter writes one. Where a template writes no body, a placement at its start goes after the doctype and the head, never before them. A tag is read by its whole name and not inside another tag's attribute, so `<body-card>` and `title="<body>"` are not the body. `place_assembly` says when the template now places that assembly more than once, and refuses a template it cannot read wherever it was asked to put the placement.

`add agents` writes what it adds to an `AGENTS.md`, a `CLAUDE.md` or a registration in that file's own line ending, and reads a registration through a byte order mark and writes it back behind one, where it had refused the file as not JSON.

`add assembly`, and the agent surface's `add_assembly`, say what the view's renderer needs that the project has not installed, as `check` does.
