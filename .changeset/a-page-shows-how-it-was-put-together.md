---
"@assemblejs/core": minor
"@assemblejs/cli": minor
---

A project can show how its pages are put together. With `outline: true` in `assemblejs.config.ts`, or passed to `createServer`, every page carries a switch at the corner of the window, and a visitor who turns it on sees a box around each assembly that says what it is, where it came from and when: this server, another server, an answer that was kept, a fallback or a deferred placement, how long the server waited for it, and when the browser brought it alive. It is drawn over the page and moves nothing on it, holds under the default content security policy, and is off unless the project turns it on; a server with it off sends the pages it always sent. The module that draws it is published as `@assemblejs/core/outline`, and `check` shows the setting with the rest.
