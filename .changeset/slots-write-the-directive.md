---
"@assemblejs/core": minor
"@assemblejs/renderer-react": minor
"@assemblejs/renderer-preact": minor
"@assemblejs/renderer-vue": minor
"@assemblejs/renderer-solid": minor
"@assemblejs/renderer-svelte": minor
"@assemblejs/renderer-lit": minor
"@assemblejs/renderer-templates": minor
"@assemblejs/mcp": minor
---

A view places a child by writing the directive, and is never handed one. `children` is gone from `MarkupInput`, `RenderInput`, every renderer's `AssemblyProps` and the template engines' locals: a view renders once, and the server puts each child where its directive stood.

A framework view writes the directive with its renderer's slot, by name and an optional view: `<Slot name="cart" />` in React, Preact, Vue and Solid, `{@html slot("cart")}` in Svelte, `${slot("cart")}` in Lit, each imported from the renderer's `/client` entry. A slot writes the same markup on the server and in the browser, so a parent hydrates around the child the server placed and leaves it alone when it renders again. A template view writes `<assembly name="cart"></assembly>` in its own markup, as a page does; Pug writes it as `assembly(name="cart")`. `placementDirective(name, view?)` in `@assemblejs/core/client` is the one definition of that markup, and refuses a name or a view that is not a segment.

A Lit view holds a Lit assembly only behind a shadow root, which `export const shadow = true` in that assembly's view gives it. Lit hydrates a view by reading every marker in its tree, so a Lit assembly left in the same tree is refused by name when the view mounts.

The agent rule `children-arrive-as-strings` is replaced by `a-view-places-a-child-with-the-directive`.
