---
"@assemblejs/core": patch
"@assemblejs/renderer-lit": patch
"@assemblejs/renderer-preact": patch
"@assemblejs/renderer-react": patch
"@assemblejs/renderer-solid": patch
"@assemblejs/renderer-svelte": patch
"@assemblejs/renderer-templates": patch
"@assemblejs/renderer-vue": patch
---

The `Renderer` and `RenderInput` types and the core's `/renderer` entry point, which nothing called, are removed. A renderer package exports its render function and its browser mount.
