---
"@assemblejs/renderer-react": patch
"@assemblejs/renderer-preact": patch
"@assemblejs/renderer-solid": patch
"@assemblejs/renderer-lit": patch
---

A view that says what its data holds is taken by its renderer. `AssemblyProps` takes the shape of a view's data as a type argument, and a view written `({ data }: AssemblyProps<Offer>)` was refused by `renderToMarkup` and by `hydrate`, which took only a view of any JSON object: a project that type-checked was failed in the modules the build generates, for every view that typed its data. Both functions take a view of any shape of data now, in the React, Preact, Solid and Lit renderers, and Lit's `LitView` takes the shape too. Nothing changes when the code runs.
