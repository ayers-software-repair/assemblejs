---
"@asmjs/build": patch
"@asmjs/check": patch
"@asmjs/cli": patch
"@asmjs/core": patch
"@asmjs/create": patch
"@asmjs/devtools": patch
"@asmjs/mcp": patch
"@asmjs/renderer-lit": patch
"@asmjs/renderer-preact": patch
"@asmjs/renderer-react": patch
"@asmjs/renderer-solid": patch
"@asmjs/renderer-svelte": patch
"@asmjs/renderer-templates": patch
"@asmjs/renderer-vue": patch
---

The packages are published under the `@asmjs` scope: `@asmjs/core`, `@asmjs/cli` and the rest,
and `npm create @asmjs` starts a project. The `assemblejs`, `asm`, `create-assemblejs` and
`assemblejs-mcp` commands, `assemblejs.config.ts` and the `.assemblejs/` directory keep their
names.

When a project registers the agent server without depending on it, `check` and `add agents`
print an install command that names the running version.
