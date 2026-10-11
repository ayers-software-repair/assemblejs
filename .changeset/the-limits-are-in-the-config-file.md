---
"@assemblejs/core": minor
"@assemblejs/cli": patch
"@assemblejs/mcp": patch
---

A project sets how deep composition goes and how many placements one request composes in its config file: `limits: { depth, placements }` in `assemblejs.config.ts`, each a whole number, each optional, one left out keeping the default of 8 and 256. The server reads them at boot and refuses a value outside its bounds. `createServer` takes `limits` in place of `maxDepth`. `check` and the agent surface show them as they show every setting.
