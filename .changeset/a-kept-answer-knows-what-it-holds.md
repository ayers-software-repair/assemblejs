---
"@assemblejs/core": patch
---

A cached placement is no longer shown to a visitor who may not be shown what it holds. An open assembly whose view places a guarded one, kept by a page with `cache: { ttl }`, was served from the cache to every visitor after a member, the guarded markup inside it. An answer is now kept with the assemblies it holds (`CachedContent.holds`) and is read for a visitor only when each of them would be shown to that visitor; otherwise the placement is composed again for them.
