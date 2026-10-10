---
"@assemblejs/core": minor
"@assemblejs/cli": minor
"@assemblejs/mcp": minor
---

What a view places is known before it renders. `AssemblyView.placements` holds what a view's source is known to place, each a name and, where the source writes one, a view. The build reads it from every view and writes it into the registry: the directives of a plain html, EJS, Handlebars or Nunjucks view, and the slots of a React, Preact, Vue, Solid, Svelte or Lit one. A Pug view is read only when it renders.

Boot holds those placements as it holds a page's: a name with no assembly, a view the assembly lacks and a view that leads back to itself are refused before anything listens. A page carries the runtime when an assembly it places, or one beneath it, has a browser half, so a deferral or a stream on a page whose only placement is a plain html parent is no longer refused. A deferred placement is served with the browser files of everything its view is known to place, linked ahead of the answer that brings them.

`check` reports the same, in the file that places it, and three things only it can know: a placement whose name is computed (`a-placement-is-named-where-it-is-written`), an assembly placed inside itself (`an-assembly-is-never-its-own-ancestor`), and a Lit assembly in a Lit view's own tree with no shadow root between them (`lit-holds-lit-behind-a-shadow-root`).

The agent surface renders and composes through the server's own transport: `render_assembly` and `compose_page` show every assembly a view places composed inside it, with the account of each beneath its parent, and say why one fell back. `place_assembly` takes `in`, an assembly whose view receives the placement, in place of a page; a view its author writes as source is not edited, and the answer is the line to write.
