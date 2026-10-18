---
"@assemblejs/core": patch
---

An assembly can say which topic keeps its last message: `events.keep(topic)`. An assembly that mounts later reads it with `events.last(topic)`, for messages sent after the call.
