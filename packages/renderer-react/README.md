# @asmjs/renderer-react

Server rendering and browser hydration for React assemblies in AssembleJS.

## Add a React assembly

Inside an AssembleJS project:

```sh
npm install @asmjs/renderer-react react react-dom
npx assemblejs add assembly cart --renderer react
```

The view is written to `src/assemblies/cart/cart.react.tsx`. Place the assembly in a page with:

```html
<assembly name="cart"></assembly>
```

React views receive typed assembly data. React, Preact, and Solid use distinct filename infixes so the build can select the correct renderer.

## Requirements

Node.js 22 or newer, `@asmjs/core`, and the React peer dependencies declared by this package.
The framework remains a peer dependency so your application controls its version.
Assemblies using different frameworks can share a page and communicate through AssembleJS events.

## Documentation

[AssembleJS documentation](https://assemblejs.com/docs/) · [Source](https://github.com/ayers-software-repair/assemblejs)

Apache-2.0. Copyright Ayers Electronics Inc. See the distributed LICENSE and NOTICE files.
