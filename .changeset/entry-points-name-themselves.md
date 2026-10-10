---
"@assemblejs/cli": patch
"@assemblejs/core": patch
"@assemblejs/create": patch
"@assemblejs/devtools": patch
"@assemblejs/mcp": patch
"@assemblejs/renderer-lit": patch
"@assemblejs/renderer-preact": patch
"@assemblejs/renderer-react": patch
"@assemblejs/renderer-solid": patch
"@assemblejs/renderer-svelte": patch
"@assemblejs/renderer-templates": patch
"@assemblejs/renderer-vue": patch
---

Each published entry point names its own specifier in a `@module` comment, which is the name the API reference lists it under. Nothing any of them exports changes.
