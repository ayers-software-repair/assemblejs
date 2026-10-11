# @assemblejs/mcp

## 1.0.0-next.1

### Patch Changes

- Updated dependencies [387dae6]
  - @assemblejs/core@1.0.0-next.1
  - @assemblejs/cli@1.0.0-next.1

## 1.0.0-next.0

### Major Changes

- The first prerelease on the next channel: the server, the command line and create, the agent surface, the devtools, the renderers for React, Preact, Vue, Svelte, Solid and Lit, and the template renderer for EJS, Handlebars, Markdown, Nunjucks and Pug.

### Minor Changes

- The server finds its project's root from how it was started: the directory given as its one argument, else the one Claude Code names in `CLAUDE_PROJECT_DIR`, else where it was started. A root that is no directory is refused at start, on standard error, with exit code 2.
  
  `create_project` writes the agent instructions and registrations a new project carries, and scaffolds into a root that already holds some of them, the registration that started the server for one: its own part of each file is brought up to date and everything else in it is kept.
  
  `RULES`, `findRule` and `Rule` are no longer exported from here; they are `@assemblejs/cli`'s, which this package depends on and explains.
- The agent surface lists four prompts, which a client shows its user as commands: `add_assembly`, `place_assembly`, `make_page` and `fix_findings`. Each answers a brief, one message in the person's voice, that gives the agent the order to work in, where to stop and ask, and what each tool's answer means. A prompt takes a name of the framework's own shape, or one of its renderers, and refuses anything else as invalid.
  
  `pageDocument(title, placed)` is exported from the command line: the whole document a new project's page is written with, which the prompt for a page hands over. The instructions a new project is written with say which views `render_assembly` and `compose_page` show at once and where the rest are seen.
- A view places a child by writing the directive, and is never handed one. `children` is gone from `MarkupInput`, `RenderInput`, every renderer's `AssemblyProps` and the template engines' locals: a view renders once, and the server puts each child where its directive stood.
  
  A framework view writes the directive with its renderer's slot, by name and an optional view: `<Slot name="cart" />` in React, Preact, Vue and Solid, `{@html slot("cart")}` in Svelte, `${slot("cart")}` in Lit, each imported from the renderer's `/client` entry. A slot writes the same markup on the server and in the browser, so a parent hydrates around the child the server placed and leaves it alone when it renders again. A template view writes `<assembly name="cart"></assembly>` in its own markup, as a page does; Pug writes it as `assembly(name="cart")`. `placementDirective(name, view?)` in `@assemblejs/core/client` is the one definition of that markup, and refuses a name or a view that is not a segment.
  
  A Lit view holds a Lit assembly only behind a shadow root, which `export const shadow = true` in that assembly's view gives it. Lit hydrates a view by reading every marker in its tree, so a Lit assembly left in the same tree is refused by name when the view mounts.
  
  The agent rule `children-arrive-as-strings` is replaced by `a-view-places-a-child-with-the-directive`.
- `assemblejs://project` answers a project's whole shape: every page with its route, what it places and the policy it declares; every assembly with its files, what its view places and where it is placed; every api's route; and what the config declares. `assemblejs://assembly/<name>` answers one assembly with every placement of it, and each assembly is listed as a resource of its own. All of it is read from the sources and nothing is run: a value a source computes reads `(computed)`, and what a file that cannot be read would have said reads `(unread)`. The command line exports the reader, `readShape`. An assembly in the project's answer has `client` and `browserHalf` where it had `hasClient`.
- What a view places is known before it renders. `AssemblyView.placements` holds what a view's source is known to place, each a name and, where the source writes one, a view. The build reads it from every view and writes it into the registry: the directives of a plain html, EJS, Handlebars or Nunjucks view, and the slots of a React, Preact, Vue, Solid, Svelte or Lit one. A Pug view is read only when it renders.
  
  Boot holds those placements as it holds a page's: a name with no assembly, a view the assembly lacks and a view that leads back to itself are refused before anything listens. A page carries the runtime when an assembly it places, or one beneath it, has a browser half, so a deferral or a stream on a page whose only placement is a plain html parent is no longer refused. A deferred placement is served with the browser files of everything its view is known to place, linked ahead of the answer that brings them.
  
  `check` reports the same, in the file that places it, and three things only it can know: a placement whose name is computed (`a-placement-is-named-where-it-is-written`), an assembly placed inside itself (`an-assembly-is-never-its-own-ancestor`), and a Lit assembly in a Lit view's own tree with no shadow root between them (`lit-holds-lit-behind-a-shadow-root`).
  
  The agent surface renders and composes through the server's own transport: `render_assembly` and `compose_page` show every assembly a view places composed inside it, with the account of each beneath its parent, and say why one fell back. `place_assembly` takes `in`, an assembly whose view receives the placement, in place of a page; a view its author writes as source is not edited, and the answer is the line to write.

### Patch Changes

- Updated dependencies
  - @assemblejs/core@1.0.0-next.0
  - @assemblejs/cli@1.0.0-next.0
- What a project's author is told now holds in a project. An assembly made from a directory has one view, `default`, so the rule `a-placement-is-named-where-it-is-written` and the fix `check` gives no longer say a view may be computed, which in a project names a view the child does not have. The directive is written closed, `<assembly name="..."></assembly>`, wherever a rule, a finding or a tool's description shows it: an opening tag alone is refused where it is read. What `check` accepts and refuses of a placement is unchanged. The instructions a project is written with carry the two rules' new words, so `check` asks a project written before this to run `assemblejs add agents`.
- `check` and the agent surface read nothing outside a project's root. Every file a reader opens is held to the root after each link is followed to where it really leads: a link under the root that leads out of it, a directory that is one, and a view's import that climbs out are not opened, not listed and not followed. Each is a finding by a new rule, `a-project-stays-inside-its-root`, and what it would have said reads `(unread)` in `assemblejs://project`. Before this, a finding could quote what such a file held. `add agents` writes nothing through a link that leads out, and a stylesheet's `url()` written outside its assembly is refused without being looked for. Discovery takes the project's root (`discoverAssemblies(root)`, `discoverPages(root)`, `discoverApis(root)`), the readers that open a file take it too, and `insideRoot`, `readInside`, `leadsOut`, `followLinks` and `OutsideRootError` are the command line's, which the agent surface takes them from.
- Each published entry point names its own specifier in a `@module` comment, which is the name the API reference lists it under. Nothing any of them exports changes.
- The command and the library of each package are built to share one copy of the code where each carried its own. Nothing either does changes; the command line's tarball is about two thirds the size it was.
- A page, an assembly and an api file are tested against the vocabulary's own shape of a name, core's `SEGMENT`, where each carried a copy of it. A project's name has one definition, `PROJECT_NAME`, exported from the command line and asked by `new` and by `create_project`. Nothing that was accepted or refused changes.
- A project sets how deep composition goes and how many placements one request composes in its config file: `limits: { depth, placements }` in `assemblejs.config.ts`, each a whole number, each optional, one left out keeping the default of 8 and 256. The server reads them at boot and refuses a value outside its bounds. `createServer` takes `limits` in place of `maxDepth`. `check` and the agent surface show them as they show every setting.
- The descriptions of `render_assembly` and `compose_page` say what they show: a plain html view, with no service run and so no data, and any other view answered with the reason it was not rendered. Nothing either tool does changes.

