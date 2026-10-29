# @asmjs/core

Compose frontend assemblies into one application. Render React, Vue, Svelte, Preact,
Solid, Lit, Web Components, and templates on the server; hydrate them in the browser.

## Install

```sh
npm install @asmjs/core
```

Node.js 22 or newer. ESM only. For a complete project, run `npm create @asmjs my-app`.

## Entry points

| Import                | Purpose                                                             |
| --------------------- | ------------------------------------------------------------------- |
| `@asmjs/core`         | Server composition, project declarations, services, APIs, and types |
| `@asmjs/core/client`  | Browser runtime and cross-assembly events                           |
| `@asmjs/core/outline` | Page outline with assembly boundaries                               |

`serve()` starts a project. `createServer()` returns an application you can start and close.
Install a renderer package for each framework you use.

[Documentation](https://assemblejs.com/docs/) · [Source](https://github.com/ayers-software-repair/assemblejs)

Apache-2.0. Copyright Ayers Electronics Inc. See LICENSE and NOTICE.
