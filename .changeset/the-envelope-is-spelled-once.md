---
"@assemblejs/core": minor
"@assemblejs/cli": patch
"@assemblejs/renderer-lit": patch
---

The envelope's attributes, the attribute on its data island, the one on a deferred envelope's fallback and the two headers a content answer carries each have one definition, which the server writes from and the browser, a composing server and the command line read by: `ENVELOPE_ATTRIBUTE`, `ISLAND_ATTRIBUTE`, `FALLBACK_ATTRIBUTE` and `RESPONSE_HEADER`, exported from `@assemblejs/core`, the first from `@assemblejs/core/client` too. Nothing a server sends or a browser reads changes.
