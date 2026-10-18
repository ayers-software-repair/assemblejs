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
- A Lit element in a view hydrates when the view does, not as soon as it is defined. A view's module defines its elements before the view hydrates, so an element whose template is made from a property the view sets, a list most of all, hydrated from what its constructor set: against the list the server rendered, Lit threw "shorter than expected iterable" and the list was drawn twice. The server now marks each element a view holds `defer-hydration`, Lit's own mark. Lit's hydration of the view sets what the view binds to an element and lets it go, and the browser half lets go of the view's elements that have nothing bound to them.
- A view that says what its data holds is taken by its renderer. `AssemblyProps` takes the shape of a view's data as a type argument, and a view written `({ data }: AssemblyProps<Offer>)` was refused by `renderToMarkup` and by `hydrate`, which took only a view of any JSON object: a project that type-checked was failed in the modules the build generates, for every view that typed its data. Both functions take a view of any shape of data now, in the React, Preact, Solid and Lit renderers, and Lit's `LitView` takes the shape too. Nothing changes when the code runs.
- On a page with Lit assemblies from more than one server, each server's elements now hydrate with that server's own copy of Lit. Lit's hydration support is one hook on the page, which Lit's element base reads once as it loads, so every server's elements were adapted by the copy of Lit whose support loaded last: that held only while every server carried the same version of Lit. The build now has each server's copy of Lit's element base set that server's hook just before it reads it, in the same module, so the value it reads is its own however the browser bundle is split and whatever another server's script did before it. The hook is published as `@assemblejs/renderer-lit/hydration-hook`. A version of Lit whose element base no longer reads the hook that way fails the build, naming the file. A page's script grows by 32 bytes, 14 gzipped, on the frameworks example, and Lit's runtime still arrives with the first Lit assembly.
- The `Renderer` and `RenderInput` types and the core's `/renderer` entry point, which nothing called, are removed. A renderer package exports its render function and its browser mount.

