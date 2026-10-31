---
"@asmjs/mcp": minor
"@asmjs/check": patch
---

Expose the existing build source fingerprint through the read-only read_source_version tool,
with agent guidance on its scope and limits. Academy preview requests refuse observed source
changes during checks or builds; the fingerprint alone does not prove successful behavior.
