---
"@assemblejs/renderer-lit": patch
"@assemblejs/build": patch
---

On a page with Lit assemblies from more than one server, each server's elements now hydrate with that server's own copy of Lit. Lit's hydration support is one hook on the page, which Lit's element base reads once as it loads, so every server's elements were adapted by the copy of Lit whose support loaded last: that held only while every server carried the same version of Lit. The build now has each server's copy of Lit's element base set that server's hook just before it reads it, in the same module, so the value it reads is its own however the browser bundle is split and whatever another server's script did before it. The hook is published as `@assemblejs/renderer-lit/hydration-hook`. A version of Lit whose element base no longer reads the hook that way fails the build, naming the file. A page's script grows by 32 bytes, 14 gzipped, on the frameworks example, and Lit's runtime still arrives with the first Lit assembly.
