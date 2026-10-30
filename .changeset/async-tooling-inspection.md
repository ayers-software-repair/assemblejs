---
"@asmjs/build": major
"@asmjs/check": major
"@asmjs/mcp": major
---

Static source inspection now uses asynchronous esbuild transforms. The inspection helpers
identified in the async inspection migration guide return Promises; callers must await them.
CLI commands and MCP wire results retain their behavior, compiler diagnostics and ordering.
No runtime dependency or alternate parser is added.
