# @assemblejs/cli

## 1.0.0-next.1

### Patch Changes

- Updated dependencies [387dae6]
  - @assemblejs/core@1.0.0-next.1

## 1.0.0-next.0

### Major Changes

- The first prerelease on the next channel: the server, the command line and create, the agent surface, the devtools, the renderers for React, Preact, Vue, Svelte, Solid and Lit, and the template renderer for EJS, Handlebars, Markdown, Nunjucks and Pug.

### Minor Changes

- `check` and the agent surface read nothing outside a project's root. Every file a reader opens is held to the root after each link is followed to where it really leads: a link under the root that leads out of it, a directory that is one, and a view's import that climbs out are not opened, not listed and not followed. Each is a finding by a new rule, `a-project-stays-inside-its-root`, and what it would have said reads `(unread)` in `assemblejs://project`. Before this, a finding could quote what such a file held. `add agents` writes nothing through a link that leads out, and a stylesheet's `url()` written outside its assembly is refused without being looked for. Discovery takes the project's root (`discoverAssemblies(root)`, `discoverPages(root)`, `discoverApis(root)`), the readers that open a file take it too, and `insideRoot`, `readInside`, `leadsOut`, `followLinks` and `OutsideRootError` are the command line's, which the agent surface takes them from.
- `check` and a build read what a Pug view places, from the tree the project's own Pug makes of the template, so a Pug view is held to what every other view is. A name with no assembly, a view the assembly lacks and a view that places itself are findings, and refused at boot. A page that defers a Pug parent links ahead what its children need, and a child with a browser half beneath one counts when a page defers or opens a stream.
  
  A directive a template writes that does not read as it is written, with nothing computed in it, is a finding where it was passed over, in EJS, Handlebars, Nunjucks and Pug. A build refuses a view whose placement cannot be read, as it refuses a template that does not compile. One that does not read only for what the template computes in it is left to its render, as before.
  
  A framework view's slots are read under a namespace as well: `import * as client from "@assemblejs/renderer-react/client"` and `<client.Slot name="cart" />`, and the same in Lit, Svelte and Vue. A Vue slot written in kebab case, `<place-here>` for a `Slot` imported as `PlaceHere`, is read too.
  
  New exports: `loadPug`, `pugTree`, `pugMarkup`, `unreadPlacements` and the type `PugCompiler`. `templatePlacements` and `readViewPlacements` take the project's Pug as their last argument.
- A new project is written for the agents that will work in it. `new` writes an `AGENTS.md` that says what a page, an assembly, a placement, a service and an api are, how to ask the project and change it, and every rule its code must satisfy; a `CLAUDE.md` that brings it to Claude Code; and the project's own MCP server, `@assemblejs/mcp` as a development dependency, registered in `.mcp.json`, `.cursor/mcp.json` and `.vscode/mcp.json`.
  
  `check` holds them current under a new rule, `agent-instructions-are-current`: the command line's part of `AGENTS.md`, its server in each registration, a `CLAUDE.md` that does not import `AGENTS.md`, and a registered server the project does not depend on. Where the installed `@assemblejs/mcp` is built on another version of the command line than the one installed beside it, `check` reports that alone, since nothing is current to both. `assemblejs add agents` writes all of it into a project that has none and rewrites only its own part of each file in one that has.
  
  The rules, `RULES`, `findRule` and `Rule`, are exported from here, where `new` and `check` read them; `agentInstructions`, `agentFiles`, `agentProblems`, `addAgents`, `MCP_REGISTRATIONS` and `AGENT_SERVER` are exported beside them.
- `assemblejs://project` answers a project's whole shape: every page with its route, what it places and the policy it declares; every assembly with its files, what its view places and where it is placed; every api's route; and what the config declares. `assemblejs://assembly/<name>` answers one assembly with every placement of it, and each assembly is listed as a resource of its own. All of it is read from the sources and nothing is run: a value a source computes reads `(computed)`, and what a file that cannot be read would have said reads `(unread)`. The command line exports the reader, `readShape`. An assembly in the project's answer has `client` and `browserHalf` where it had `hasClient`.
- What a view places is known before it renders. `AssemblyView.placements` holds what a view's source is known to place, each a name and, where the source writes one, a view. The build reads it from every view and writes it into the registry: the directives of a plain html, EJS, Handlebars or Nunjucks view, and the slots of a React, Preact, Vue, Solid, Svelte or Lit one. A Pug view is read only when it renders.
  
  Boot holds those placements as it holds a page's: a name with no assembly, a view the assembly lacks and a view that leads back to itself are refused before anything listens. A page carries the runtime when an assembly it places, or one beneath it, has a browser half, so a deferral or a stream on a page whose only placement is a plain html parent is no longer refused. A deferred placement is served with the browser files of everything its view is known to place, linked ahead of the answer that brings them.
  
  `check` reports the same, in the file that places it, and three things only it can know: a placement whose name is computed (`a-placement-is-named-where-it-is-written`), an assembly placed inside itself (`an-assembly-is-never-its-own-ancestor`), and a Lit assembly in a Lit view's own tree with no shadow root between them (`lit-holds-lit-behind-a-shadow-root`).
  
  The agent surface renders and composes through the server's own transport: `render_assembly` and `compose_page` show every assembly a view places composed inside it, with the account of each beneath its parent, and say why one fell back. `place_assembly` takes `in`, an assembly whose view receives the placement, in place of a page; a view its author writes as source is not edited, and the answer is the line to write.

### Patch Changes

- Updated dependencies
  - @assemblejs/core@1.0.0-next.0
- What a project's author is told now holds in a project. An assembly made from a directory has one view, `default`, so the rule `a-placement-is-named-where-it-is-written` and the fix `check` gives no longer say a view may be computed, which in a project names a view the child does not have. The directive is written closed, `<assembly name="..."></assembly>`, wherever a rule, a finding or a tool's description shows it: an opening tag alone is refused where it is read. What `check` accepts and refuses of a placement is unchanged. The instructions a project is written with carry the two rules' new words, so `check` asks a project written before this to run `assemblejs add agents`.
- The instructions a project is written with say that a view writes its data escaped, and why it matters here: a value written with a raw form is markup, and an `<assembly>` directive in it is placed like one the view wrote. What `check` accepts and refuses of a project's code is unchanged. The instructions' words changed, so `check` asks a project written before this to run `assemblejs add agents`.
- Each published entry point names its own specifier in a `@module` comment, which is the name the API reference lists it under. Nothing any of them exports changes.
- The command and the library of each package are built to share one copy of the code where each carried its own. Nothing either does changes; the command line's tarball is about two thirds the size it was.
- A page, an assembly and an api file are tested against the vocabulary's own shape of a name, core's `SEGMENT`, where each carried a copy of it. A project's name has one definition, `PROJECT_NAME`, exported from the command line and asked by `new` and by `create_project`. Nothing that was accepted or refused changes.
- The agent surface lists four prompts, which a client shows its user as commands: `add_assembly`, `place_assembly`, `make_page` and `fix_findings`. Each answers a brief, one message in the person's voice, that gives the agent the order to work in, where to stop and ask, and what each tool's answer means. A prompt takes a name of the framework's own shape, or one of its renderers, and refuses anything else as invalid.
  
  `pageDocument(title, placed)` is exported from the command line: the whole document a new project's page is written with, which the prompt for a page hands over. The instructions a new project is written with say which views `render_assembly` and `compose_page` show at once and where the rest are seen.
- A framework view is read for what it places together with the components it is split into: every module it imports by a relative path, directly or through one it imports. A slot written in a component beside the view was read as nothing, so a deferred parent's child placed there arrived without its stylesheet linked ahead.
- The envelope's attributes, the attribute on its data island, the one on a deferred envelope's fallback and the two headers a content answer carries each have one definition, which the server writes from and the browser, a composing server and the command line read by: `ENVELOPE_ATTRIBUTE`, `ISLAND_ATTRIBUTE`, `FALLBACK_ATTRIBUTE` and `RESPONSE_HEADER`, exported from `@assemblejs/core`, the first from `@assemblejs/core/client` too. Nothing a server sends or a browser reads changes.
- A project sets how deep composition goes and how many placements one request composes in its config file: `limits: { depth, placements }` in `assemblejs.config.ts`, each a whole number, each optional, one left out keeping the default of 8 and 256. The server reads them at boot and refuses a value outside its bounds. `createServer` takes `limits` in place of `maxDepth`. `check` and the agent surface show them as they show every setting.

