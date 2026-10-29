# @asmjs/cli

Create, develop, check, build, and package AssembleJS applications.
The executable is `assemblejs`; `asm` is an alias.

## Start a project

```sh
npm create @asmjs my-app
cd my-app
npm install
npm run dev
```

New projects include the CLI. To add it to an existing project:

```sh
npm install --save-dev @asmjs/cli
```

Node.js 22 or newer.

## Commands

Run these inside the project:

| Command | Result |
| --- | --- |
| `npx assemblejs add assembly cart --renderer react` | Create a React assembly and report any missing renderer dependencies |
| `npx assemblejs add agents` | Write or refresh the project's agent instructions and MCP registrations |
| `npx assemblejs dev` | Build, serve, and rebuild when files change |
| `npx assemblejs build` | Write the server and browser output to `dist/` |
| `npx assemblejs check` | Report project findings with their rules and fixes |
| `npx assemblejs perf` | Build and compare page payloads with the configured budgets |
| `npx assemblejs deploy` | Write a deployment directory containing the build and dependencies |

Assemblies live under `src/assemblies/`. Add an assembly's printed tag to a page to place it there.
The build generates the server's module registrations.

## Documentation

[AssembleJS documentation](https://assemblejs.com/docs/) · [Source](https://github.com/ayers-software-repair/assemblejs)

Apache-2.0. Copyright Ayers Electronics Inc. See the distributed LICENSE and NOTICE files.
