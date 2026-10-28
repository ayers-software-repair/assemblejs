## AssembleJS 1.0.0-next.0

One page from every framework: each piece written in the framework its author knows, composed on the server. Free and open source.

**The server** (`@asmjs/core`) composes a page from assemblies, in your project or on another server, each with a deadline and a fallback, and hydrates them in the browser.

**The renderers** are one package for each framework, React, Preact, Vue, Svelte, Solid and Lit, and one for the template languages EJS, Handlebars, Markdown, Nunjucks and Pug.

**The command line** (`@asmjs/cli`, and `npm create @asmjs`) makes a project, adds an assembly to it, runs, builds, checks and weighs it, and writes the directory that runs it anywhere Node does.

**The agent surface** (`@asmjs/mcp`) is an MCP server that every new project installs and registers, with an `AGENTS.md` beside it, so an AI agent knows the framework before it writes.

**Since these notes were first written**, before the first publish: a view places a child by
writing the directive, so an assembly holds assemblies at any depth, locally or from another
server; a guarded assembly is guarded wherever it is placed; one request composes no more than
256 placements and no deeper than 8, both set in the project's config file; a request nobody
waits for composes nothing further; the agent surface answers a project's whole shape, finds its
root from how it was started, and lists the prompts a person asks for; every static view is read
for what it places; the twelve packages share one version.

Report an issue: https://github.com/ayers-software-repair/assemblejs/issues/new/choose
