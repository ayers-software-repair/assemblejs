---
"@assemblejs/mcp": patch
---

The agent surface asks only this machine's dev server, and waits for it only so long. The address in `.assemblejs/dev.json` was asked for whatever it was, and any server that answered its health path with a 200 was taken for the project's; it is believed only where it is plain http on a loopback name and answers the framework's own health. `render_assembly` waited on the dev server without end; it waits ten seconds and says the server did not answer. `place_assembly` wrote an assembly into one it already led to and answered done, where only an assembly placed in itself was refused; a child that leads to the parent at any depth is refused before anything is written, with the way it leads there (`leadsTo`). And a placement naming an assembly whose directory is there and broken is told to mend the directory, where it was told to add what `add_assembly` then refused as taken.
