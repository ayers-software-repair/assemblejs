# @asmjs/renderer-solid

Server rendering and browser hydration for Solid assemblies in AssembleJS.

## Add a Solid assembly

Inside an AssembleJS project:

```sh
npm install @asmjs/renderer-solid solid-js
npx assemblejs add assembly cart --renderer solid
```

The view is written to `src/assemblies/cart/cart.solid.tsx`. Place the assembly in a page with:

```html
<assembly name="cart"></assembly>
```

Solid JSX is compiled for server rendering and browser hydration by this package’s compiler. Use `.solid.tsx` to distinguish it from React and Preact.

## Requirements

Node.js 22 or newer, `@asmjs/core`, and the Solid peer dependencies declared by this package.
The framework remains a peer dependency so your application controls its version.
Assemblies using different frameworks can share a page and communicate through AssembleJS events.

## Documentation

[AssembleJS documentation](https://assemblejs.com/docs/) · [Source](https://github.com/ayers-software-repair/assemblejs)

Apache-2.0. Copyright Ayers Electronics Inc. See the distributed LICENSE and NOTICE files.
