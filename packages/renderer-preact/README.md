# @asmjs/renderer-preact

Server rendering and browser hydration for Preact assemblies in AssembleJS.

## Add a Preact assembly

Inside an AssembleJS project:

```sh
npm install @asmjs/renderer-preact preact
npx assemblejs add assembly cart --renderer preact
```

The view is written to `src/assemblies/cart/cart.preact.tsx`. Place the assembly in a page with:

```html
<assembly name="cart"></assembly>
```

Preact views receive assembly data and hydrate with Preact. The `.preact.tsx` infix distinguishes them from React and Solid views.

## Requirements

Node.js 22 or newer, `@asmjs/core`, and the Preact peer dependencies declared by this package.
The framework remains a peer dependency so your application controls its version.
Assemblies using different frameworks can share a page and communicate through AssembleJS events.

## Documentation

[AssembleJS documentation](https://assemblejs.com/docs/) · [Source](https://github.com/ayers-software-repair/assemblejs)

Apache-2.0. Copyright Ayers Electronics Inc. See the distributed LICENSE and NOTICE files.
