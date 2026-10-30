# @asmjs/renderer-vue

## 1.0.0-next.2

### Patch Changes

- Keep internal package and peer dependencies aligned when publishing the coordinated release.

## 1.0.0-next.1

### Patch Changes

- Expand the package README with installation commands, a working example and links to the relevant guide.

## 1.0.0-next.0

### Major Changes

- The first prerelease on the next channel: the server, the command line and create, the agent surface, the devtools, the renderers for React, Preact, Vue, Svelte, Solid and Lit, and the template renderer for EJS, Handlebars, Markdown, Nunjucks and Pug.

### Minor Changes

- A view places a child by writing the directive, and is never handed one. `children` is gone from `MarkupInput`, `RenderInput`, every renderer's `AssemblyProps` and the template engines' locals: a view renders once, and the server puts each child where its directive stood.
  
  A framework view writes the directive with its renderer's slot, by name and an optional view: `<Slot name="cart" />` in React, Preact, Vue and Solid, `{@html slot("cart")}` in Svelte, `${slot("cart")}` in Lit, each imported from the renderer's `/client` entry. A slot writes the same markup on the server and in the browser, so a parent hydrates around the child the server placed and leaves it alone when it renders again. A template view writes `<assembly name="cart"></assembly>` in its own markup, as a page does; Pug writes it as `assembly(name="cart")`. `placementDirective(name, view?)` in `@asmjs/core/client` is the one definition of that markup, and refuses a name or a view that is not a segment.
  
  A Lit view holds a Lit assembly only behind a shadow root, which `export const shadow = true` in that assembly's view gives it. Lit hydrates a view by reading every marker in its tree, so a Lit assembly left in the same tree is refused by name when the view mounts.
  
  The agent rule `children-arrive-as-strings` is replaced by `a-view-places-a-child-with-the-directive`.

### Patch Changes

- Updated dependencies
  - @asmjs/core@1.0.0-next.0
- Each published entry point names its own specifier in a `@module` comment, which is the name the API reference lists it under. Nothing any of them exports changes.
- The ids a component makes are its island's own. React's `useId`, Vue's `useId` and Svelte's `$props.id()` each number their ids from the root of a render, and every island is a render of its own, so two islands on a page made the same ids: a label in one named the input in another. Each renderer now gives its framework the placement's id as the prefix it takes for this (`identifierPrefix`, `app.config.idPrefix`, `idPrefix`), on the server and, where the framework asks for it again, in the browser. Preact's hook takes no prefix, so `@asmjs/renderer-preact/client` exports a `useId` to import in its place: Preact's own with the placement's id before it, the same on the server and in the browser.
- The `Renderer` and `RenderInput` types and the core's `/renderer` entry point, which nothing called, are removed. A renderer package exports its render function and its browser mount.

