# @assemblejs/renderer-lit

## 1.0.0-next.0

### Major Changes

- The first prerelease on the next channel: the server, the command line and create, the agent surface, the devtools, the renderers for React, Preact, Vue, Svelte, Solid and Lit, and the template renderer for EJS, Handlebars, Markdown, Nunjucks and Pug.

### Minor Changes

- A view places a child by writing the directive, and is never handed one. `children` is gone from `MarkupInput`, `RenderInput`, every renderer's `AssemblyProps` and the template engines' locals: a view renders once, and the server puts each child where its directive stood.
  
  A framework view writes the directive with its renderer's slot, by name and an optional view: `<Slot name="cart" />` in React, Preact, Vue and Solid, `{@html slot("cart")}` in Svelte, `${slot("cart")}` in Lit, each imported from the renderer's `/client` entry. A slot writes the same markup on the server and in the browser, so a parent hydrates around the child the server placed and leaves it alone when it renders again. A template view writes `<assembly name="cart"></assembly>` in its own markup, as a page does; Pug writes it as `assembly(name="cart")`. `placementDirective(name, view?)` in `@assemblejs/core/client` is the one definition of that markup, and refuses a name or a view that is not a segment.
  
  A Lit view holds a Lit assembly only behind a shadow root, which `export const shadow = true` in that assembly's view gives it. Lit hydrates a view by reading every marker in its tree, so a Lit assembly left in the same tree is refused by name when the view mounts.
  
  The agent rule `children-arrive-as-strings` is replaced by `a-view-places-a-child-with-the-directive`.

### Patch Changes

- Updated dependencies
  - @assemblejs/core@1.0.0-next.0
- Each published entry point names its own specifier in a `@module` comment, which is the name the API reference lists it under. Nothing any of them exports changes.
- The envelope's attributes, the attribute on its data island, the one on a deferred envelope's fallback and the two headers a content answer carries each have one definition, which the server writes from and the browser, a composing server and the command line read by: `ENVELOPE_ATTRIBUTE`, `ISLAND_ATTRIBUTE`, `FALLBACK_ATTRIBUTE` and `RESPONSE_HEADER`, exported from `@assemblejs/core`, the first from `@assemblejs/core/client` too. Nothing a server sends or a browser reads changes.

