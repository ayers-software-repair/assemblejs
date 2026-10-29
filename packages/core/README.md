# @asmjs/core

The AssembleJS runtime for composing a page from independent frontend assemblies.
An assembly can use React, Vue, Svelte, Preact, Solid, Lit, Web Components, or a template.
The server composes local and explicitly configured remote assemblies; their browser code hydrates the result.

## Get started

Create an application with the CLI, which configures the runtime and build tools:

```sh
npm create @asmjs my-app
cd my-app
npm install
npm run dev
```

For a program that embeds the runtime directly:

```sh
npm install @asmjs/core
```

Node.js 22 or newer. ESM only.

## Package entry points

| Import | Purpose |
| --- | --- |
| `@asmjs/core` | Server composition, project declarations, services, APIs, and configuration types |
| `@asmjs/core/client` | Browser runtime and cross-assembly events |
| `@asmjs/core/outline` | Optional page outline showing assembly boundaries |

`serve()` starts a configured project. `createServer()` returns an application you can start and close yourself.
Renderers are separate packages; install the ones your assemblies use.

## Documentation

[AssembleJS documentation](https://assemblejs.com/docs/) · [Source](https://github.com/ayers-software-repair/assemblejs)

Apache-2.0. Copyright Ayers Electronics Inc. See the distributed LICENSE and NOTICE files.
