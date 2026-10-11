# @assemblejs/create

## 1.0.0-next.1

### Patch Changes

- @assemblejs/cli@1.0.0-next.1

## 1.0.0-next.0

### Major Changes

- The first prerelease on the next channel: the server, the command line and create, the agent surface, the devtools, the renderers for React, Preact, Vue, Svelte, Solid and Lit, and the template renderer for EJS, Handlebars, Markdown, Nunjucks and Pug.

### Patch Changes

- Updated dependencies
  - @assemblejs/cli@1.0.0-next.0
- Each published entry point names its own specifier in a `@module` comment, which is the name the API reference lists it under. Nothing any of them exports changes.
- The command and the library of each package are built to share one copy of the code where each carried its own. Nothing either does changes; the command line's tarball is about two thirds the size it was.

