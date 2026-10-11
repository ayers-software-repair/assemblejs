---
"@assemblejs/cli": minor
"@assemblejs/mcp": minor
---

`dev` records the url its server listens on under the project's root, `.assemblejs/dev.json`, for as long as that server runs. The agent surface's `render_assembly` and `compose_page` find it, ask its health, and then ask that server's content endpoint for every assembly and placement, so a framework or template view is shown as the project serves it, services and all, and nothing of the project's code runs in the tool. Without a dev server running, a plain html view is rendered as before and any other is refused with the word to start it. The command line's `Io` gains `remove`.
