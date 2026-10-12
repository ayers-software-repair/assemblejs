---
"@assemblejs/cli": patch
---

A Svelte or a Vue view its compiler refuses is reported at the view, on the line the compiler names. The bundler had reported it where the view was imported, a line of the module the build generates, or where the error was thrown, a line of this command line's own code: `.assemblejs/client/broken.ts:10 Unexpected token` for a mistake on line 2 of `src/assemblies/broken/broken.svelte`. A Vue error no longer carries the component's absolute path in its text, since the place it is reported at names the file; and an error of no line is reported with its file alone, where it had read `file:0`.
