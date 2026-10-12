---
"@assemblejs/core": patch
---

A Lit view that renders nothing can be placed from another server. Lit's server render writes `<?>` where a template is empty, which a browser reads as a comment; the reader of a remote's answer refused it as "markup the browser ignores", so the placement fell back. `<?` is now read as the comment the browser makes of it, up to the next `>`, where nothing in it could be a tag; one that holds a `<`, or never ends, is refused as before.
