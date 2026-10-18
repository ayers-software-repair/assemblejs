---
"@assemblejs/mcp": patch
---

The agent surface installs as two packages, and no longer brings the protocol SDK's dependency tree with it. The protocol SDK is bundled into `@assemblejs/mcp`, `THIRD_PARTY_NOTICES.md` in the package carries its notices, and zod is a dependency.
