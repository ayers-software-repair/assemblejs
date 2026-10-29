# @asmjs/devtools

Read-only inspection for an AssembleJS development server: assemblies, pages, APIs, remotes, and recent failures.

## Install

```sh
npm install --save-dev @asmjs/devtools
```

Requires `@asmjs/core` and Node.js 22 or newer.

## Enable

Add devtools to the project object passed to the runtime:

```ts
import { serve } from "@asmjs/core";
import { devtools } from "@asmjs/devtools";

await serve({ ...project, devtools: devtools() });
```

Here `project` is your application's existing server definition.
Open `/_assemblejs/devtools/` on the development server. A JSON representation is available at `/_assemblejs/devtools/project.json`.

The runtime mounts these routes only in development. Production mounts no devtools routes.
The devtools prefix accepts only GET and HEAD; a conflicting write route prevents the server from starting.

## Documentation

[AssembleJS documentation](https://assemblejs.com/docs/) · [Source](https://github.com/ayers-software-repair/assemblejs)

Apache-2.0. Copyright Ayers Electronics Inc. See the distributed LICENSE and NOTICE files.
