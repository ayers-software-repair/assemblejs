# @asmjs/mcp

An MCP server for developing AssembleJS applications with your AI coding agent.
It inspects projects, adds and places assemblies, checks findings, and renders or composes the result.
It contains no language model or inference credentials.

## Add to a project

New AssembleJS projects include the server and client registrations. To refresh them in an existing project:

```sh
npx assemblejs add agents
```

For manual installation:

```sh
npm install --save-dev @asmjs/mcp
```

Node.js 22 or newer. The project's agent supplies the model and its credentials.

## Connect another MCP client

Start this stdio command with the project directory as the working directory:

```sh
node node_modules/@asmjs/mcp/dist/bin.js
```

Alternatively, pass the absolute project directory as its argument. Keep stdout reserved for the MCP protocol.
The generated registrations cover Claude Code, Cursor, VS Code, Gemini CLI, and opencode.

## Rendering and prompts

With the project's development server running, the tools request rendered assemblies and composed pages from it, including service data and correlated failures.
Without that server, the tools can render plain HTML views and explain why other views cannot be rendered.
The MCP server does not execute project code itself.

The server supplies four workflow prompts: `add_assembly`, `place_assembly`, `make_page`, and `fix_findings`.
Bundled protocol dependencies and their licenses are listed in THIRD_PARTY_NOTICES.md.

## Documentation

[AssembleJS documentation](https://assemblejs.com/docs/) · [Source](https://github.com/ayers-software-repair/assemblejs)

Apache-2.0. Copyright Ayers Electronics Inc. See the distributed LICENSE and NOTICE files.
