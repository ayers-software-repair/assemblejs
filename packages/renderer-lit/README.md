# @asmjs/renderer-lit

Server rendering and browser hydration for Lit assemblies in AssembleJS.

## Add a Lit assembly

Inside an AssembleJS project:

```sh
npm install @asmjs/renderer-lit lit
npx assemblejs add assembly cart --renderer lit
```

The view is written to `src/assemblies/cart/cart.lit.ts`. Place the assembly in a page with:

```html
<assembly name="cart"></assembly>
```

Lit views default-export a function from assembly props to a template. The server renders declarative shadow roots; the browser hydrates them.

## Requirements

Node.js 22 or newer, `@asmjs/core`, and the Lit peer dependencies declared by this package.
The framework remains a peer dependency so your application controls its version.
Assemblies using different frameworks can share a page and communicate through AssembleJS events.

## Documentation

[AssembleJS documentation](https://assemblejs.com/docs/) · [Source](https://github.com/ayers-software-repair/assemblejs)

Apache-2.0. Copyright Ayers Electronics Inc. See the distributed LICENSE and NOTICE files.
