# @asmjs/renderer-vue

Server rendering and browser hydration for Vue assemblies in AssembleJS.

## Add a Vue assembly

Inside an AssembleJS project:

```sh
npm install @asmjs/renderer-vue vue
npx assemblejs add assembly cart --renderer vue
```

The view is written to `src/assemblies/cart/cart.vue`. Place the assembly in a page with:

```html
<assembly name="cart"></assembly>
```

Single-file components are compiled for the server and browser using the project’s Vue installation. Scoped styles use Vue’s scoping behavior.

## Requirements

Node.js 22 or newer, `@asmjs/core`, and the Vue peer dependencies declared by this package.
The framework remains a peer dependency so your application controls its version.
Assemblies using different frameworks can share a page and communicate through AssembleJS events.

## Documentation

[AssembleJS documentation](https://assemblejs.com/docs/) · [Source](https://github.com/ayers-software-repair/assemblejs)

Apache-2.0. Copyright Ayers Electronics Inc. See the distributed LICENSE and NOTICE files.
