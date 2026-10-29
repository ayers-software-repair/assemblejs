# @asmjs/create

Create an AssembleJS application with one page and one assembly.

## Usage

```sh
npm create @asmjs my-app
cd my-app
npm install
npm run dev
```

Node.js 22 or newer. The directory is required; the command does not prompt for one.
It refuses to overwrite files that would collide with the starter.

## What it creates

- An application with the AssembleJS runtime, CLI, and MCP development server.
- One page placing one plain HTML assembly.
- Agent instructions and registrations for Claude Code, Cursor, VS Code, Gemini CLI, and opencode.

To add a React assembly, install its renderer and framework, then generate the files:

```sh
npm install @asmjs/renderer-react react react-dom
npx assemblejs add assembly cart --renderer react
```

Place the tag printed by the command in a page. Other renderers can be used in the same application.

## Documentation

[AssembleJS documentation](https://assemblejs.com/docs/) · [Source](https://github.com/ayers-software-repair/assemblejs)

Apache-2.0. Copyright Ayers Electronics Inc. See the distributed LICENSE and NOTICE files.
