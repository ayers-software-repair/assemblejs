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

## Review before writing

`plan_assembly` returns the exact new-file contents and a session-local id without writing.
Review those additions, then call `apply_assembly_plan` with the id, or reject with
`discard_assembly_plan`. A new valid plan replaces the previous pending plan. An id belongs
to this server session, is used once, and is lost when the server restarts.

Applying uses the retained contents and refuses an assembly target created since planning.
It creates new files exclusively; it does not overwrite existing work. Run `check`, place the
assembly and inspect the result afterward. A write failure reports completed writes and attempted paths that may contain partial files;
this is not a multi-file transaction or protection against hostile filesystem replacement.

The client must obtain the person's approval in approval mode. Possession of an id is not
proof of human consent, and direct `add_assembly` still writes immediately. These tools are
an authoring foundation; they do not implement the Academy UI or enforce a global agent mode.
No model, account or inference connection is required by these operations.

## Rendering and prompts

With the project's development server running, the tools request rendered assemblies and composed pages from it, including service data and correlated failures.
Without that server, the tools can render plain HTML views and explain why other views cannot be rendered.
The MCP server does not execute project code itself.

The server supplies four workflow prompts: `add_assembly`, `place_assembly`, `make_page`, and `fix_findings`.
Bundled protocol dependencies and their licenses are listed in THIRD_PARTY_NOTICES.md.

## Documentation

[AssembleJS documentation](https://assemblejs.com/docs/) · [Source](https://github.com/ayers-software-repair/assemblejs)

Apache-2.0. Copyright Ayers Electronics Inc. See the distributed LICENSE and NOTICE files.
