---
"@assemblejs/cli": patch
"@assemblejs/create": patch
"@assemblejs/mcp": patch
---

A project can be made in a directory that is already there. `assemblejs new .`, and `npm create @assemblejs .`, make it in the directory the command works in, named for that directory, where each had refused the dot as a name and suggested "assembly". `new` and the agent surface's `create_project` ask one decision of what the directory may hold: what the starter does not write is left alone, a README is kept as its author wrote it, a `.gitignore` keeps every line and gains the starter's entries it lacks in its own line ending, and the files a project carries for its agents are brought up to date. Anything else the starter would write, or anything under `src`, is named and nothing is written. `create_project` sends an agent to `add_assembly` only where the root holds a `package.json`.

A name with nothing usable in it is answered with an example of the thing being named, so a project, a page or an api is no longer told to call itself "assembly".

Two exports change with it. `suggestName` takes that example as a second argument, which it requires. `isOccupied` is exported by `@assemblejs/cli`, the one reader of whether anything is at a path, and no longer by `@assemblejs/mcp`.

The agent surface answers a refusal as an answer. A tool that met a path leading out of the project, a link to nothing, or a read or a write the system refused had its error carried by the protocol as a line of text; each is now `ok: false` with its problems, the path's with its rule and its fix. A dev server's record that is a link out of the project is read as no record, where it had ended `render_assembly` and `compose_page`.
